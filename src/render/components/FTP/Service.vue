<template>
  <el-card class="ftp-service-main">
    <template #header>
      <div class="table-header">
        <div class="left">
          <template v-if="ftpFetching">
            <el-button :loading="true" link></el-button>
          </template>
          <template v-else>
            <template v-if="ftpRunning">
              <div class="status running" :class="{ disabled: ftpFetching }">
                <yb-icon :svg="import('@/svg/stop2.svg?raw')" @click.stop="serviceDo('stop')" />
              </div>
              <div class="status refresh" :class="{ disabled: ftpFetching }">
                <yb-icon
                  :svg="import('@/svg/icon_refresh.svg?raw')"
                  @click.stop="serviceDo('restart')"
                />
              </div>
            </template>
            <div v-else class="status" :class="{ disabled: ftpDisabled }">
              <yb-icon :svg="import('@/svg/play.svg?raw')" @click.stop="serviceDo('start')" />
            </div>
          </template>
          <template v-if="ftpRunning">
            <div class="link">
              <span @click.stop="copyPass(linkLocal)">{{ linkLocal }}</span>
              <span @click.stop="copyPass(linkIp)">{{ linkIp }}</span>
            </div>
          </template>
          <el-select v-model="currentVersion" :disabled="ftpFetching" class="ml-7 w-52">
            <template v-for="(item, _index) in versions" :key="_index">
              <template v-if="!item?.version">
                <el-popover popper-class="version-error-tips" width="auto" placement="top">
                  <template #default>
                    <span>{{ item?.error ?? $t('base.versionErrorTips') }}</span>
                  </template>
                  <template #reference>
                    <el-option
                      :disabled="true"
                      :label="$t('base.versionError') + ' - ' + item.path"
                      :value="$t('base.versionError') + ' - ' + item.path"
                    >
                    </el-option>
                  </template>
                </el-popover>
              </template>
              <template v-else>
                <el-option
                  :label="item?.version + ' - ' + item.path"
                  :value="item?.version + ' - ' + item.path"
                >
                </el-option>
              </template>
            </template>
          </el-select>
        </div>
        <el-button :disabled="ftpDisabled" @click.stop="doAdd">{{ $t('base.add') }}</el-button>
      </div>
    </template>
    <el-auto-resizer>
      <template #default="{ height, width }">
        <el-table-v2
          v-loading="loading"
          :row-height="60"
          :header-height="60"
          :columns="columns"
          :data="allFtp"
          :width="width"
          :height="height"
          fixed
        >
        </el-table-v2>
      </template>
    </el-auto-resizer>
  </el-card>
</template>

<script lang="tsx" setup>
  import { computed, ref } from 'vue'
  import { type Column } from 'element-plus'
  import { FtpStore } from './ftp'
  import { AppStore } from '@/store/app'
  import { BrewStore } from '@/store/brew'
  import { I18nT } from '@lang/index'
  import { AsyncComponentShow } from '@/util/AsyncComponent'
  import { Edit, Delete } from '@element-plus/icons-vue'
  import Base from '@/core/Base'
  import IPC from '@/util/IPC'
  import { MessageError, MessageSuccess } from '@/util/Element'
  import { shell, clipboard } from '@/util/NodeFn'

  const loading = ref(false)
  const ftpStore = FtpStore()
  const appStore = AppStore()
  const brewStore = BrewStore()

  ftpStore.getIP()
  ftpStore.getPort()
  ftpStore.getAllFtp()

  const versions = computed(() => {
    return brewStore.module('pure-ftpd').installed
  })

  const linkLocal = computed(() => {
    return `ftp://127.0.0.1:${ftpStore.port}`
  })
  const linkIp = computed(() => {
    return `ftp://${ftpStore.ip}:${ftpStore.port}`
  })

  const ftpFetching = computed(() => {
    return versions.value?.some((i) => i.running)
  })

  const ftpVersion = computed(() => {
    const current = appStore.config.server?.['pure-ftpd']?.current
    if (!current) {
      return undefined
    }
    return versions.value.find((i) => i.path === current?.path && i.version === current?.version)
  })

  const currentVersion = computed({
    get() {
      const current = appStore.config.server?.['pure-ftpd']?.current
      if (!current) {
        return undefined
      }
      return `${current.version} - ${current.path}`
    },
    set(vstr: string) {
      const isRun = ftpVersion?.value?.run
      const find = versions?.value?.find((v) => {
        const txt = `${v.version} - ${v.path}`
        return txt === vstr
      })
      if (find) {
        appStore.UPDATE_SERVER_CURRENT({
          flag: 'pure-ftpd',
          data: JSON.parse(JSON.stringify(find))
        })
        appStore.saveConfig()
        if (isRun) {
          serviceDo('restart')
        }
      }
    }
  })

  const ftpRunning = computed(() => {
    return ftpVersion?.value?.run === true
  })

  const ftpDisabled = computed(() => {
    return (
      !ftpVersion?.value?.version ||
      versions.value.some((v) => v.running) ||
      !appStore.versionInitiated
    )
  })

  const serviceDo = (flag: 'start' | 'stop' | 'restart') => {
    if (ftpDisabled?.value) {
      return
    }
    const module = brewStore.module('pure-ftpd')
    let action: any
    switch (flag) {
      case 'stop':
        action = module.stop()
        break
      case 'start':
      case 'restart':
        action = module.start()
        break
    }
    action.then((res: any) => {
      if (typeof res === 'string') {
        MessageError(res)
      }
    })
  }

  const doAdd = (item?: any) => {
    import('./Add.vue').then((res) => {
      AsyncComponentShow(res.default, {
        item
      }).then()
    })
  }

  const copyPass = (str: string): void => {
    clipboard.writeText(str)
    MessageSuccess(I18nT('base.copySuccess'))
  }
  const openDir = (dir: string): void => {
    shell.openPath(dir)
  }
  const doEdit = (data: any): void => {
    console.log('doEdit: ', data)
    doAdd(data)
  }
  const doDel = (data: any): void => {
    console.log('doEdit: ', data)
    Base._Confirm(I18nT('base.areYouSure'), undefined, {
      customClass: 'confirm-del',
      type: 'warning'
    })
      .then(() => {
        loading.value = true
        IPC.send(
          'app-fork:pure-ftpd',
          'delFtp',
          JSON.parse(JSON.stringify(data)),
          JSON.parse(JSON.stringify(ftpVersion.value))
        ).then((key: string, res: any) => {
          IPC.off(key)
          if (res?.code === 0) {
            ftpStore.getAllFtp().then(() => {
              MessageSuccess(I18nT('base.success'))
              loading.value = false
            })
          } else if (res?.code === 1) {
            MessageError(res?.msg ?? I18nT('base.fail'))
            loading.value = false
          }
        })
      })
      .catch(() => {})
  }

  const allFtp = computed(() => {
    return ftpStore.allFtp
  })
  const columns: Column<any>[] = [
    {
      key: 'user',
      title: 'user',
      dataKey: 'user',
      width: 200,
      headerCellRenderer: () => {
        return (
          <span style="padding-left: 24px;" class="flex items-center">
            {I18nT('util.ftpTableHeadUser')}
          </span>
        )
      },
      cellRenderer: ({ cellData: user }) => (
        <span style="padding-left: 24px;" class="user" onClick={() => copyPass(user)}>
          {user}
        </span>
      )
    },
    {
      key: 'pass',
      title: 'pass',
      dataKey: 'pass',
      width: 200,
      headerCellRenderer: () => {
        return <span class="flex items-center">{I18nT('util.ftpTableHeadPass')}</span>
      },
      cellRenderer: ({ cellData: pass }) => (
        <span class="pass" onClick={() => copyPass(pass)}>
          {pass}
        </span>
      )
    },
    {
      key: 'dir',
      title: 'dir',
      dataKey: 'dir',
      class: 'host-column',
      headerClass: 'host-column',
      width: 200,
      headerCellRenderer: () => {
        return <span class="flex items-center">{I18nT('util.ftpTableHeadDir')}</span>
      },
      cellRenderer: ({ cellData: dir }) => (
        <span class="dir" onClick={() => openDir(dir)}>
          {dir}
        </span>
      )
    },
    {
      key: 'setup',
      title: 'setup',
      dataKey: 'setup',
      align: 'center',
      width: 100,
      headerCellRenderer: () => {
        return <span class="flex items-center">{I18nT('base.action')}</span>
      },
      cellRenderer: ({ rowData: data }): any => (
        <div class="setup">
          <Edit class="setup-icon" onClick={() => doEdit(data)}>
            Edit
          </Edit>
          <Delete class="setup-icon" onClick={() => doDel(data)}>
            Delete
          </Delete>
        </div>
      )
    }
  ]
</script>
