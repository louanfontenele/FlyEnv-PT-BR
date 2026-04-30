<template>
  <div class="soft-index-panel main-right-panel">
    <el-radio-group v-model="tab" class="mt-3">
      <template v-for="(item, _index) in tabs" :key="_index">
        <el-radio-button :label="item" :value="_index"></el-radio-button>
      </template>
    </el-radio-group>
    <div class="main-block">
      <Service
        v-if="tab === 0"
        title="CLIProxyAPI"
        type-flag="cliproxyapi"
        :fetch-data-when-create="true"
      ></Service>
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
    </div>
  </div>
</template>

<script lang="ts" setup>
  import Service from '@/components/ServiceManager/base.vue'
  import Manager from '../VersionManager/index.vue'
  import Config from './Config.vue'
  import { AppModuleSetup } from '@/core/Module'
  import { I18nT } from '@lang/index'

  const { tab } = AppModuleSetup('cliproxyapi')
  const tabs = [I18nT('base.service'), I18nT('base.versionManager'), I18nT('base.configFile')]
</script>
