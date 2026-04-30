import { join } from 'path'
import { existsSync } from 'fs'
import { Base } from '../Base'
import type { OnlineVersionItem, SoftInstalled } from '@shared/app'
import {
  AppLog,
  brewInfoJson,
  versionBinVersion,
  versionFilterSame,
  versionFixed,
  versionLocalFetch,
  versionSort,
  readFile,
  writeFile,
  mkdirp,
  serviceStartExec,
  serviceStartExecWin
} from '../../Fn'
import { ForkPromise } from '@shared/ForkPromise'
import { I18nT } from '@lang/index'
import TaskQueue from '../../TaskQueue'
import { isWindows } from '@shared/utils'

class CliProxyAPI extends Base {
  constructor() {
    super()
    this.type = 'cliproxyapi'
  }

  init() {
    this.pidPath = join(global.Server.BaseDir!, 'cliproxyapi/cliproxyapi.pid')
  }

  initConfig(): ForkPromise<string> {
    return new ForkPromise(async (resolve, _reject, on) => {
      const baseDir = join(global.Server.BaseDir!, 'cliproxyapi')
      await mkdirp(baseDir)
      const configFile = join(baseDir, 'config.yaml')
      if (!existsSync(configFile)) {
        on({
          'APP-On-Log': AppLog('info', I18nT('appLog.confInit'))
        })
        const isZh = global.Server.Lang === 'zh'
        const tmplFile = join(
          global.Server.Static!,
          isZh ? 'tmpl/cliproxyapi.zh.yaml' : 'tmpl/cliproxyapi.yaml'
        )
        const content = await readFile(tmplFile, 'utf-8')
        await writeFile(configFile, content)
        const defaultConfigFile = join(baseDir, 'config.default.yaml')
        await writeFile(defaultConfigFile, content)
        on({
          'APP-On-Log': AppLog('info', I18nT('appLog.confInitSuccess', { file: configFile }))
        })
      }
      resolve(configFile)
    })
  }

  _startServer(version: SoftInstalled) {
    return new ForkPromise(async (resolve, reject, on) => {
      on({
        'APP-On-Log': AppLog(
          'info',
          I18nT('appLog.startServiceBegin', { service: `cliproxyapi-${version.version}` })
        )
      })
      const configFile = await this.initConfig().on(on)
      const bin = version.bin
      const baseDir = join(global.Server.BaseDir!, 'cliproxyapi')
      await mkdirp(baseDir)

      if (isWindows()) {
        const execArgs = `-config "${configFile}"`
        const execEnv = ``
        try {
          const res = await serviceStartExecWin({
            version,
            pidPath: this.pidPath,
            baseDir,
            bin,
            execArgs,
            execEnv,
            on,
            checkPidFile: false
          })
          resolve(res)
        } catch (e: any) {
          console.log('cliproxyapi start err: ', e)
          reject(e)
          return
        }
      } else {
        const execArgs = `-config "${configFile}"`
        try {
          const res = await serviceStartExec({
            version,
            pidPath: this.pidPath,
            baseDir,
            bin,
            execArgs,
            on,
            timeToWait: 1000,
            checkPidFile: false
          })
          resolve(res)
        } catch (e: any) {
          console.log('cliproxyapi start err: ', e)
          reject(e)
          return
        }
      }
    })
  }

  fetchAllOnlineVersion() {
    return new ForkPromise(async (resolve) => {
      try {
        const all: OnlineVersionItem[] = await this._fetchOnlineVersion('cliproxyapi')
        all.forEach((a: any) => {
          let dir = ''
          let zip = ''
          if (isWindows()) {
            dir = join(global.Server.AppDir!, 'cliproxyapi', a.version, 'cli-proxy-api.exe')
            zip = join(global.Server.Cache!, `cliproxyapi-${a.version}.zip`)
            a.appDir = join(global.Server.AppDir!, 'cliproxyapi', a.version)
          } else {
            dir = join(global.Server.AppDir!, 'cliproxyapi', a.version, 'cli-proxy-api')
            zip = join(global.Server.Cache!, `cliproxyapi-${a.version}.tgz`)
            a.appDir = join(global.Server.AppDir!, 'cliproxyapi', a.version)
          }

          a.zip = zip
          a.bin = dir
          a.downloaded = existsSync(zip)
          a.installed = existsSync(dir)
          a.name = `CLIProxyAPI-${a.version}`
        })
        resolve(all)
      } catch {
        resolve({})
      }
    })
  }

  allInstalledVersions(setup: any) {
    return new ForkPromise((resolve) => {
      let versions: SoftInstalled[] = []
      let all: Promise<SoftInstalled[]>[] = []
      if (isWindows()) {
        all = [versionLocalFetch(setup?.cliproxyapi?.dirs ?? [], 'cli-proxy-api.exe')]
      } else {
        all = [versionLocalFetch(setup?.cliproxyapi?.dirs ?? [], 'cli-proxy-api', 'cli-proxy-api')]
      }
      Promise.all(all)
        .then(async (list) => {
          versions = list.flat()
          versions = versionFilterSame(versions)
          const all = versions.map((item) => {
            const command = `"${item.bin}" --version`
            const reg = /(Version: )(\d+(\.\d+){1,4})(.*?)/g
            return TaskQueue.run(versionBinVersion, item.bin, command, reg)
          })
          return Promise.all(all)
        })
        .then((list) => {
          list.forEach((v, i) => {
            const { error, version } = v
            const num = version
              ? Number(versionFixed(version).split('.').slice(0, 2).join(''))
              : null
            Object.assign(versions[i], {
              version: version,
              num,
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
        const all = ['cliproxyapi']
        const info = await brewInfoJson(all)
        resolve(info)
      } catch (e) {
        reject(e)
        return
      }
    })
  }
}

export default new CliProxyAPI()
