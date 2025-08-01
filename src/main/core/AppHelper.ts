import { exec as Sudo } from '@shared/Sudo'
import { join, resolve as PathResolve, basename } from 'node:path'
import is from 'electron-is'
import { isLinux, isMacOS } from '@shared/utils'
import { AppHelperCheck } from '@shared/AppHelperCheck'
import { tmpdir } from 'node:os'
import { uuid } from '../utils'
import { copyFile, chmod, mkdirp } from '@shared/fs-extra'

type AppHelperCallback = (
  state: 'needInstall' | 'installing' | 'installed' | 'installFaild' | 'checkSuccess'
) => void

export class AppHelper {
  state: 'normal' | 'installing' | 'installed' = 'normal'
  version = 7

  private _onMessage?: AppHelperCallback

  onStatusMessage(fn: AppHelperCallback) {
    this._onMessage = fn
  }

  async command() {
    let command = ''
    let icns = ``

    const tmpDir = join(tmpdir(), uuid())
    await mkdirp(tmpDir)
    await chmod(tmpDir, '0755')
    if (is.production()) {
      if (isMacOS()) {
        const binDir = PathResolve(global.Server.Static!, '../../../../')
        const plist = join(binDir, 'plist/com.flyenv.helper.plist')
        const bin = join(binDir, 'helper/flyenv-helper')
        const shDir = join(binDir, 'helper')
        const shFile = join(shDir, 'flyenv-helper-init.sh')

        const tmpFile = join(tmpDir, `${uuid()}.sh`)
        await copyFile(shFile, tmpFile)
        await chmod(tmpFile, '0755')

        const tmpPlist = join(tmpDir, `${uuid()}.plist`)
        await copyFile(plist, tmpPlist)
        await chmod(tmpPlist, '0755')

        const tmpBin = join(tmpDir, `${uuid()}.helper`)
        await copyFile(bin, tmpBin)
        await chmod(tmpBin, '0755')

        command = `cd "${tmpDir}" && sudo /bin/zsh ./${basename(tmpFile)} "${tmpPlist}" "${tmpBin}" && sudo rm -rf "${tmpDir}"`
        icns = join(binDir, 'icon.icns')
      } else if (isLinux()) {
        const binDir = PathResolve(global.Server.Static!, '../../../../')
        const bin = join(binDir, 'helper/flyenv-helper')
        const shDir = join(binDir, 'helper')
        const shFile = join(shDir, 'flyenv-helper-init.sh')

        const tmpFile = join(tmpDir, `${uuid()}.sh`)
        await copyFile(shFile, tmpFile)
        await chmod(tmpFile, '0755')

        const tmpBin = join(tmpDir, `${uuid()}.helper`)
        await copyFile(bin, tmpBin)
        await chmod(tmpBin, '0755')

        command = `cd "${tmpDir}" && sudo /bin/bash ./${basename(tmpFile)} "${tmpBin}" && sudo rm -rf "${tmpDir}"`
        icns = join(binDir, 'Icon@256x256.icns')
      }
    } else {
      if (isMacOS()) {
        const helperFile = global.Server.isArmArch
          ? 'flyenv-helper-darwin-arm64'
          : 'flyenv-helper-darwin-amd64'
        const binDir = PathResolve(global.Server.Static!, '../../../build/')
        const plist = join(binDir, 'plist/com.flyenv.helper.plist')
        const bin = PathResolve(binDir, `../src/helper-go/dist/${helperFile}`)
        const shDir = join(global.Server.Static!, 'sh')
        const shFile = join(shDir, 'flyenv-helper-init.sh')

        const tmpFile = join(tmpDir, `${uuid()}.sh`)
        await copyFile(shFile, tmpFile)
        await chmod(tmpFile, '0755')

        const tmpPlist = join(tmpDir, 'com.flyenv.helper.plist')
        await copyFile(plist, tmpPlist)
        await chmod(tmpPlist, '0755')

        const tmpBin = join(tmpDir, helperFile)
        await copyFile(bin, tmpBin)
        await chmod(tmpBin, '0755')

        command = `cd "${tmpDir}" && sudo /bin/zsh ./${basename(tmpFile)} "${tmpPlist}" "${tmpBin}" && sudo rm -rf "${tmpDir}"`
        icns = join(binDir, 'icon.icns')
      } else if (isLinux()) {
        const helperFile = global.Server.isArmArch
          ? 'flyenv-helper-linux-arm64'
          : 'flyenv-helper-linux-amd64'
        const binDir = PathResolve(global.Server.Static!, '../../../build/')
        const bin = PathResolve(binDir, `../src/helper-go/dist/${helperFile}`)
        const shDir = join(global.Server.Static!, 'sh')
        const shFile = join(shDir, 'flyenv-helper-init.sh')

        const tmpFile = join(tmpDir, `${uuid()}.sh`)
        await copyFile(shFile, tmpFile)
        await chmod(tmpFile, '0755')

        const tmpBin = join(tmpDir, helperFile)
        await copyFile(bin, tmpBin)
        await chmod(tmpBin, '0755')

        command = `cd "${tmpDir}" && sudo /bin/bash ./${basename(tmpFile)} "${tmpBin}" && sudo rm -rf "${tmpDir}"`
        icns = join(binDir, 'Icon@256x256.icns')
      }
    }

    return {
      command,
      icns
    }
  }

  initHelper() {
    return new Promise(async (resolve, reject) => {
      if (this.state !== 'normal') {
        if (this.state === 'installing') {
          this?._onMessage?.('installing')
        } else if (this.state === 'installed') {
          this?._onMessage?.('installed')
        }
        reject(new Error('Please Wait'))
        return
      }
      try {
        await AppHelperCheck()
        this.state = 'normal'
        this?._onMessage?.('checkSuccess')
        resolve(true)
        return
      } catch {}

      this?._onMessage?.('needInstall')
      const doChech = (time = 0) => {
        if (time > 9) {
          this.state = 'normal'
          reject(new Error('Install helper failed'))
          this?._onMessage?.('installFaild')
          return
        }
        AppHelperCheck()
          .then(() => {
            this.state = 'normal'
            this?._onMessage?.('checkSuccess')
            resolve(true)
          })
          .catch(() => {
            setTimeout(() => {
              doChech(time + 1)
            }, 500)
          })
      }

      this.state = 'installing'

      const { command, icns } = await this.command()

      Sudo(command, {
        name: 'FlyEnv',
        icns: icns,
        dir: global.Server.Cache!
      })
        .then(({ stdout, stderr }) => {
          console.log('initHelper: ', stdout, stderr)
          this.state = 'installed'
          doChech()
        })
        .catch((e) => {
          console.log('initHelper err: ', e)
          this.state = 'normal'
          this?._onMessage?.('installFaild')
          reject(e)
        })
    })
  }
}
export default new AppHelper()
