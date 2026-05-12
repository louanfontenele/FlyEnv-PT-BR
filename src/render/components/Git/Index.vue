<template>
  <div class="soft-index-panel main-right-panel">
    <el-radio-group v-model="tab" class="mt-3">
      <template v-for="(item, index) in tabs" :key="index">
        <el-radio-button :label="item" :value="index"></el-radio-button>
      </template>
    </el-radio-group>
    <div class="main-block">
      <General v-if="tab === 0" />
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { AppModuleSetup } from '@/core/Module'
  import General from './General.vue'

  const { tab } = AppModuleSetup('git')

  const tabs = ['Git']
</script>
