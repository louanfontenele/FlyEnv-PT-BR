import { reactive, ref, markRaw, nextTick, computed, onMounted, onUnmounted } from 'vue'
import XTerm from '@/util/XTerm'
import IPC from '@/util/IPC'
import { MessageError } from '@/util/Element'
import { I18nT } from '@lang/index'

type GitCheckItem = {
  label: string
  ok: boolean
  value: string
  message: string
}

export const GitSetup = reactive<{
  installed: boolean
  version: string
  installEnd: boolean
  installing: boolean
  fetching: boolean
  checking: boolean
  xterm: XTerm | undefined
  installLib: 'shell' | 'brew' | 'port'
  reFetch: () => void
  checkInstalled: () => Promise<boolean>
  info: {
    platform: string
    arch: string
    items: GitCheckItem[]
  }
}>({
  installed: false,
  version: '',
  installEnd: false,
  installing: false,
  fetching: false,
  checking: true,
  xterm: undefined,
  installLib: 'shell',
  reFetch: () => 0,
  checkInstalled: async () => false,
  info: {
    platform: '',
    arch: '',
    items: []
  }
})

export const Setup = () => {
  const xtermDom = ref<HTMLElement>()

  const hasBrew = !!window.Server.BrewCellar
  const hasPort = !!window.Server.MacPorts

  const checkInstalled = (): Promise<boolean> => {
    return new Promise((resolve) => {
      IPC.send('app-fork:git', 'checkInstalled').then((key: string, res: any) => {
        IPC.off(key)
        GitSetup.checking = false
        if (res?.code === 0) {
          GitSetup.installed = res?.data?.installed ?? false
          GitSetup.version = res?.data?.version ?? ''
        }
        resolve(GitSetup.installed)
      })
    })
  }

  GitSetup.checkInstalled = checkInstalled

  const fetchInfo = () => {
    if (GitSetup.fetching) {
      return
    }
    GitSetup.fetching = true
    IPC.send('app-fork:git', 'check').then((key: string, res: any) => {
      IPC.off(key)
      GitSetup.fetching = false
      if (res?.code === 0) {
        Object.assign(GitSetup.info, res.data)
      } else {
        MessageError(res?.msg ?? I18nT('base.fail'))
      }
    })
  }

  GitSetup.reFetch = () => {
    GitSetup.fetching = false
    checkInstalled().then((installed) => {
      if (installed) {
        fetchInfo()
      }
    })
  }

  const installGit = async () => {
    if (GitSetup.installing) {
      return
    }
    GitSetup.installEnd = false
    GitSetup.installing = true
    await nextTick()

    const execXTerm = new XTerm()
    GitSetup.xterm = markRaw(execXTerm)
    await execXTerm.mount(xtermDom.value!)

    const commands: string[] = []

    if (window.Server.isWindows) {
      if (window.Server.Proxy) {
        for (const k in window.Server.Proxy) {
          const v = window.Server.Proxy[k]
          commands.push(`$env:${k}="${v}"`)
        }
      }
      commands.push('winget install Git.Git --accept-source-agreements --accept-package-agreements')
      await execXTerm.send(commands, false)
      GitSetup.installEnd = true
      checkInstalled().then(() => {
        if (GitSetup.installed) {
          fetchInfo()
        }
      })
      return
    }

    if (window.Server.Proxy) {
      for (const k in window.Server.Proxy) {
        const v = window.Server.Proxy[k]
        commands.push(`export ${k}="${v}"`)
      }
    }

    if (GitSetup.installLib === 'shell') {
      if (window.Server.isLinux) {
        commands.push(
          '((sudo apt-get update && sudo apt-get install -y git) || sudo yum install -y git || sudo dnf install -y git || sudo pacman -S --noconfirm git)'
        )
      } else {
        commands.push('(brew install git || xcode-select --install)')
      }
    } else if (GitSetup.installLib === 'brew') {
      commands.push('brew install git')
    } else {
      commands.push('sudo port install git')
    }

    await execXTerm.send(commands, false)
    GitSetup.installEnd = true
    checkInstalled().then(() => {
      if (GitSetup.installed) {
        fetchInfo()
      }
    })
  }

  const taskConfirm = () => {
    GitSetup.installing = false
    GitSetup.installEnd = false
    GitSetup.xterm?.destroy()
    delete GitSetup.xterm
    checkInstalled().then(() => {
      if (GitSetup.installed) {
        fetchInfo()
      }
    })
  }

  const taskCancel = () => {
    GitSetup.installing = false
    GitSetup.installEnd = false
    GitSetup.xterm?.stop()?.then(() => {
      GitSetup.xterm?.destroy()
      delete GitSetup.xterm
    })
  }

  const showInstall = computed(() => {
    return !GitSetup.checking && !GitSetup.installed && !GitSetup.installing
  })

  const showFooter = computed(() => {
    return GitSetup.installing
  })

  const taskEnd = computed(() => {
    return GitSetup.installEnd
  })

  const isWindows = computed(() => {
    return !!window.Server.isWindows
  })

  const isMacOS = computed(() => {
    return !!window.Server.isMacOS
  })

  onMounted(() => {
    if (GitSetup.installing && GitSetup.xterm && xtermDom.value) {
      nextTick().then(() => {
        const execXTerm: XTerm = GitSetup.xterm as any
        if (execXTerm && xtermDom.value) {
          execXTerm.mount(xtermDom.value).then().catch()
        }
      })
    }
    checkInstalled().then((installed) => {
      if (installed) {
        fetchInfo()
      }
    })
  })

  onUnmounted(() => {
    GitSetup?.xterm?.unmounted()
  })

  return {
    xtermDom,
    hasBrew,
    hasPort,
    installGit,
    showInstall,
    showFooter,
    taskEnd,
    taskConfirm,
    taskCancel,
    isWindows,
    isMacOS
  }
}
