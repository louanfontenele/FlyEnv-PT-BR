<template>
  <Conf
    ref="conf"
    :type-flag="'cliproxyapi'"
    :file="file"
    :file-ext="'env'"
    :config-language="'ini'"
    :show-commond="false"
    url="https://help.router-for.me/configuration/storage/git.html"
  >
  </Conf>
</template>

<script lang="ts" setup>
  import { ref } from 'vue'
  import Conf from '@/components/Conf/index.vue'
  import { join } from '@/util/path-browserify'
  import { fs } from '@/util/NodeFn'
  import IPC from '@/util/IPC'

  const conf = ref()
  const file = join(window.Server.BaseDir!, 'cliproxyapi/cliproxyapi.env')

  fs.existsSync(file).then((e) => {
    if (!e) {
      IPC.send('app-fork:cliproxyapi', 'initConfig').then((key: string) => {
        IPC.off(key)
        conf?.value?.update()
      })
    }
  })
</script>
