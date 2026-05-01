<template>
  <div class="module-config">
    <el-card class="app-base-el-card">
      <template #default>
        <LogVM ref="log" :log-file="filepath" class="h-full overflow-hidden" />
      </template>
      <template #footer>
        <ToolVM :log="log" />
      </template>
    </el-card>
  </div>
</template>

<script lang="ts" setup>
  import { computed, ref } from 'vue'
  import LogVM from '@/components/Log/index.vue'
  import ToolVM from '@/components/Log/tool.vue'
  import { join } from '@/util/path-browserify'
  import { BrewStore } from '@/store/brew'
  import { I18nT } from '@lang/index'

  const log = ref()
  const brewStore = BrewStore()
  const logType = ref<'out' | 'error'>('out')

  const currentVersion = computed(() => {
    return brewStore.currentVersion('numa')
  })

  const filepath = computed(() => {
    if (!currentVersion?.value?.version) {
      return ''
    }
    const versionStr = currentVersion.value.version.trim().split(' ').join('')
    return join(window.Server.BaseDir!, `numa/numa-${versionStr}-start-error.log`)
  })
</script>
