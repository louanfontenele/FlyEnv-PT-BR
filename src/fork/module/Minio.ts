import { basename, dirname, join } from 'path'
import { createWriteStream, existsSync, unlinkSync } from 'fs'
import { Base } from './Base'
import { ForkPromise } from '@shared/ForkPromise'
import type { SoftInstalled } from '@shared/app'
import {
  AppLog,
  brewInfoJson,
  serviceStartExec,
  spawnPromise,
  versionBinVersion,
  versionFilterSame,
  versionLocalFetch,
  versionSort
} from '../Fn'
import { chmod, copyFile, mkdirp, readFile, remove, writeFile } from 'fs-extra'
import TaskQueue from '../TaskQueue'
import { I18nT } from '@lang/index'
import axios from 'axios'
import Helper from '../Helper'
import { EOL } from 'os'

class Minio extends Base {
  constructor() {
    super()
    this.type = 'minio'
  }

  init() {
    this.pidPath = join(global.Server.BaseDir!, 'minio/minio.pid')
  }

  initConfig(): ForkPromise<string> {
    return new ForkPromise(async (resolve) => {
      const baseDir = join(global.Server.BaseDir!, 'minio')
      if (!existsSync(baseDir)) {
        await mkdirp(baseDir)
      }
      const iniFile = join(baseDir, 'minio.conf')
      if (!existsSync(iniFile)) {
        await writeFile(iniFile, '')
      }
      resolve(iniFile)
    })
  }

  fetchAllOnLineVersion() {
    return new ForkPromise(async (resolve) => {
      const bin = join(global.Server.AppDir!, `minio`, 'minio')
      const zip = join(global.Server.Cache!, 'minio')
      const arch = global.Server.isAppleSilicon ? 'arm64' : 'amd64'
      const dict: any = {}
      const all: any[] = [
        {
          url: `https://dl.min.io/server/minio/release/darwin-${arch}/minio`,
          appDir: join(global.Server.AppDir!, `minio`),
          bin,
          zip,
          downloaded: existsSync(zip),
          installed: existsSync(bin),
          version: 'lasted'
        }
      ]
      all.forEach((a: any) => {
        dict[`${a.version}`] = a
      })
      resolve(dict)
    })
  }

  _startServer(version: SoftInstalled, DATA_DIR?: string) {
    return new ForkPromise(async (resolve, reject, on) => {
      on({
        'APP-On-Log': AppLog(
          'info',
          I18nT('appLog.startServiceBegin', { service: `${this.type}-${version.version}` })
        )
      })

      const iniFile = await this.initConfig().on(on)

      let address = ''
      let console_address = ''
      let certs_dir = ''

      const getConfEnv = async () => {
        const content = await readFile(iniFile, 'utf-8')
        const arr = content
          .split('\n')
          .filter((s) => {
            const str = s.trim()
            return !!str && str.startsWith('MINIO_')
          })
          .map((s) => s.trim())
        const dict: Record<string, string> = {}
        arr.forEach((a) => {
          const item = a.split('=')
          const k = item.shift()
          const v = item.join('=')
          if (k) {
            dict[k] = v
          }
        })
        return dict
      }

      const opt = await getConfEnv()

      const envs: string[] = []
      for (const k in opt) {
        const v = opt[k]
        if (k === 'MINIO_ADDRESS') {
          address = v
        } else if (k === 'MINIO_CONSOLE_ADDRESS') {
          console_address = v
        } else if (k === 'MINIO_CERTS_DIR') {
          certs_dir = v
        }
        envs.push(`export ${k}="${v}"`)
      }
      envs.push('')

      const bin = version.bin
      const baseDir = join(global.Server.BaseDir!, 'minio')
      const dataDir = DATA_DIR ?? join(baseDir, 'data')
      await mkdirp(dataDir)
      const execEnv = envs.join(EOL)
      let execArgs = `server "${dataDir}"`
      if (address) {
        execArgs += ` --address "${address}"`
      }
      if (console_address) {
        execArgs += ` --console-address "${console_address}"`
      }
      if (certs_dir) {
        execArgs += ` --certs-dir "${certs_dir}"`
      }

      try {
        const res = await serviceStartExec(
          version,
          this.pidPath,
          baseDir,
          bin,
          execArgs,
          execEnv,
          on,
          20,
          500,
          false
        )
        resolve(res)
      } catch (e: any) {
        console.log('-k start err: ', e)
        reject(e)
        return
      }
    })
  }

  allInstalledVersions(setup: any) {
    return new ForkPromise((resolve) => {
      let versions: SoftInstalled[] = []
      Promise.all([versionLocalFetch(setup?.minio?.dirs ?? [], 'minio', 'minio')])
        .then(async (list) => {
          versions = list.flat()
          versions = versionFilterSame(versions)
          const all = versions.map((item) =>
            TaskQueue.run(versionBinVersion, `${item.bin} --version`, /(version )(.*?)( )/g)
          )
          return Promise.all(all)
        })
        .then((list) => {
          list.forEach((v, i) => {
            const { error, version } = v
            Object.assign(versions[i], {
              version: version,
              num: 0,
              enable: version !== null,
              error
            })
          })
          resolve(versionSort(versions))
        })
        .catch(() => {
          resolve([])
        })
    })
  }

  brewinfo() {
    return new ForkPromise(async (resolve, reject) => {
      try {
        const all = ['minio']
        const info = await brewInfoJson(all)
        resolve(info)
      } catch (e) {
        reject(e)
        return
      }
    })
  }

  installSoft(row: any) {
    return new ForkPromise(async (resolve, reject, on) => {
      const refresh = () => {
        row.downloaded = existsSync(row.zip)
        row.installed = existsSync(row.bin)
      }

      const doHandleZip = async () => {
        await mkdirp(dirname(row.bin))
        await copyFile(row.zip, row.bin)
        await chmod(row.bin, '0777')
        try {
          await Helper.send('mailpit', 'binFixed', row.bin)
        } catch (e) {}
      }

      if (existsSync(row.zip)) {
        let zipCheck = false
        try {
          spawnPromise(basename(row.zip), ['--version'], {
            shell: false,
            cwd: dirname(row.zip)
          })
          zipCheck = true
        } catch (e) {
          zipCheck = false
        }

        if (zipCheck) {
          row.progress = 100
          on(row)
          let success = false
          try {
            await doHandleZip()
            success = true
            refresh()
          } catch (e) {
            refresh()
            console.log('ERROR: ', e)
          }
          if (success) {
            row.downState = 'success'
            row.progress = 100
            on(row)
            resolve(true)
            return
          }
        }
        await remove(row.zip)
      }

      axios({
        method: 'get',
        url: row.url,
        proxy: this.getAxiosProxy(),
        responseType: 'stream',
        onDownloadProgress: (progress) => {
          console.log('onDownloadProgress: ', progress)
          if (progress.total) {
            const percent = Math.round((progress.loaded * 100.0) / progress.total)
            row.progress = percent
            on(row)
          }
        }
      })
        .then(function (response) {
          const stream = createWriteStream(row.zip)
          response.data.pipe(stream)
          stream.on('error', (err: any) => {
            console.log('stream error: ', err)
            row.downState = 'exception'
            try {
              if (existsSync(row.zip)) {
                unlinkSync(row.zip)
              }
            } catch (e) {}
            refresh()
            on(row)
            setTimeout(() => {
              resolve(false)
            }, 1500)
          })
          stream.on('finish', async () => {
            row.downState = 'success'
            try {
              if (existsSync(row.zip)) {
                await doHandleZip()
              }
              refresh()
            } catch (e) {
              refresh()
            }
            on(row)
            resolve(true)
          })
        })
        .catch((err) => {
          console.log('down error: ', err)
          row.downState = 'exception'
          try {
            if (existsSync(row.zip)) {
              unlinkSync(row.zip)
            }
          } catch (e) {}
          refresh()
          on(row)
          setTimeout(() => {
            resolve(false)
          }, 1500)
        })
    })
  }
}
export default new Minio()
