<template>
  <div class="soft-index-panel main-right-panel">
    <el-radio-group v-model="tab" class="mt-3">
      <template v-for="(item, _index) in tabs" :key="_index">
        <el-radio-button :label="item" :value="_index"></el-radio-button>
      </template>
    </el-radio-group>
    <div class="main-block">
      <Service v-if="tab === 0" title="CLIProxyAPI" type-flag="cliproxyapi">
        <template #tool-left>
          <template v-if="isRunning">
            <el-button style="color: #01cc74" class="button ml-[10px]" link @click.stop="openURL">
              <yb-icon class="w-[20px] h-[20px]" :svg="import('@/svg/http.svg?raw')"></yb-icon>
            </el-button>
          </template>
        </template>
      </Service>
      <Manager
        v-else-if="tab === 1"
        type-flag="cliproxyapi"
        title="CLIProxyAPI"
        url="https://github.com/router-for-me/CLIProxyAPI/releases"
        :has-static="true"
        :show-port-lib="false"
        :show-brew-lib="true"
      ></Manager>
      <Config v-else-if="tab === 2"></Config>
      <Env v-else-if="tab === 3"></Env>
      <Logs v-else-if="tab === 4"></Logs>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import Service from '@/components/ServiceManager/index.vue'
  import Manager from '../VersionManager/index.vue'
  import Config from './Config.vue'
  import Env from './Env.vue'
  import Logs from './Logs.vue'
  import { AppModuleSetup } from '@/core/Module'
  import { I18nT } from '@lang/index'
  import { fs, shell } from '@/util/NodeFn'
  import { BrewStore } from '@/store/brew'
  import { computed } from 'vue'
  import { join } from '@/util/path-browserify'
  import YAML from 'yamljs'

  const { tab, checkVersion } = AppModuleSetup('cliproxyapi')
  const tabs = [
    I18nT('base.service'),
    I18nT('base.versionManager'),
    I18nT('base.configFile'),
    I18nT('service.env'),
    I18nT('base.log')
  ]
  checkVersion()
  const brewStore = BrewStore()

  const isRunning = computed(() => {
    return brewStore.module('cliproxyapi').installed.some((m) => m.run)
  })

  const openURL = async () => {
    const iniFile = join(window.Server.BaseDir!, 'cliproxyapi/config.yaml')
    const exists = await fs.existsSync(iniFile)
    let port = 8317
    if (exists) {
      const content = await fs.readFile(iniFile)
      const json = YAML.parse(content)
      port = json?.port ?? 8317
    }
    const url = `http://127.0.0.1:${port}/management.html`
    console.log('url: ', url)
    shell.openExternal(url).then().catch()
  }
</script>
