<template>
  <div class="soft-index-panel main-right-panel">
    <el-radio-group v-model="tab" class="mt-3">
      <template v-for="(item, _index) in tabs" :key="_index">
        <el-radio-button :label="item" :value="_index"></el-radio-button>
      </template>
    </el-radio-group>
    <div class="main-block">
      <Service v-if="tab === 0" title="Numa" type-flag="numa">
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
        type-flag="numa"
        title="Numa"
        url="https://github.com/razvandimescu/numa/releases"
        :has-static="true"
        :show-port-lib="false"
        :show-brew-lib="true"
      ></Manager>
      <Config v-else-if="tab === 2"></Config>
      <Logs v-else-if="tab === 3"></Logs>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import Service from '@/components/ServiceManager/index.vue'
  import Manager from '../VersionManager/index.vue'
  import Config from './Config.vue'
  import Logs from './Logs.vue'
  import { AppModuleSetup } from '@/core/Module'
  import { I18nT } from '@lang/index'
  import { shell, fs } from '@/util/NodeFn'
  import { BrewStore } from '@/store/brew'
  import { computed } from 'vue'
  import { join } from '@/util/path-browserify'

  const { tab, checkVersion } = AppModuleSetup('numa')
  const tabs = [
    I18nT('base.service'),
    I18nT('base.versionManager'),
    I18nT('base.configFile'),
    I18nT('base.log')
  ]
  checkVersion()
  const brewStore = BrewStore()

  const isRunning = computed(() => {
    return brewStore.module('numa').installed.some((m) => m.run)
  })

  const openURL = async () => {
    let port = 5380
    const iniFile = join(window.Server.BaseDir!, 'numa/numa.toml')
    if (await fs.existsSync(iniFile)) {
      const content = await fs.readFile(iniFile)
      const match = content.match(/api_port\s*=\s*(\d+)/)
      if (match) {
        port = parseInt(match[1], 10)
      }
    }
    const url = `http://127.0.0.1:${port}`
    shell.openExternal(url).then().catch()
  }
</script>
