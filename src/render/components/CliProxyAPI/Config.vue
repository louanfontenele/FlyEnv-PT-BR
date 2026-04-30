<template>
  <Conf
    ref="conf"
    :type-flag="'cliproxyapi'"
    :default-conf="defaultConf"
    :file="file"
    :file-ext="'yaml'"
    :config-language="'yaml'"
    :show-commond="false"
  >
  </Conf>
</template>

<script lang="ts" setup>
  import { ref } from 'vue'
  import Conf from '@/components/Conf/index.vue'
  import { join } from '@/util/path-browserify'
  import { fs } from '@/util/NodeFn'

  const defaultConf = ref('')
  const conf = ref()
  const file = join(window.Server.BaseDir!, 'cliproxyapi/config.yaml')

  const isZh = window.Server.Lang === 'zh'
  const tmpl = join(
    window.Server.Static!,
    isZh ? 'tmpl/cliproxyapi.zh.yaml' : 'tmpl/cliproxyapi.yaml'
  )
  fs.readFile(tmpl).then((content: string) => {
    defaultConf.value = content
  })
</script>
