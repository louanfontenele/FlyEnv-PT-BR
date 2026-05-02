<template>
  <Conf
    ref="conf"
    :type-flag="'rnacos'"
    :default-conf="defaultConf"
    :file="file"
    :file-ext="'env'"
    :config-language="'ini'"
    :show-commond="false"
    url="https://r-nacos.github.io/docs/env_config/"
  >
  </Conf>
</template>

<script lang="ts" setup>
  import { ref } from 'vue'
  import Conf from '@/components/Conf/index.vue'
  import { join } from '@/util/path-browserify'
  import { fs } from '@/util/NodeFn'
  import IPC from '@/util/IPC'

  const defaultConf = ref('')
  const conf = ref()
  const file = join(window.Server.BaseDir!, 'rnacos/rnacos.env')

  const isZh = window.Server.Lang === 'zh'
  const tmpl = join(window.Server.Static!, isZh ? 'tmpl/rnacos.zh.env' : 'tmpl/rnacos.env')
  fs.readFile(tmpl)
    .then((content: string) => {
      defaultConf.value = content
    })
    .catch(() => {
      defaultConf.value = isZh
        ? `# R-Nacos 环境变量配置\n# 参考文档: https://r-nacos.github.io/docs/env_config/\n\n# === 端口配置 ===\n# RNACOS_HTTP_PORT=8848\n# RNACOS_GRPC_PORT=9848\n# RNACOS_HTTP_CONSOLE_PORT=10848\n\n# === 数据目录 ===\n# RNACOS_DATA_DIR=\n\n# === 控制台账号 ===\n# RNACOS_INIT_ADMIN_USERNAME=admin\n# RNACOS_INIT_ADMIN_PASSWORD=admin\n\n# === 日志等级 ===\n# RUST_LOG=info\n`
        : `# R-Nacos Environment Variables\n# Reference: https://r-nacos.github.io/docs/env_config/\n\n# === Port Configuration ===\n# RNACOS_HTTP_PORT=8848\n# RNACOS_GRPC_PORT=9848\n# RNACOS_HTTP_CONSOLE_PORT=10848\n\n# === Data Directory ===\n# RNACOS_DATA_DIR=\n\n# === Console Account ===\n# RNACOS_INIT_ADMIN_USERNAME=admin\n# RNACOS_INIT_ADMIN_PASSWORD=admin\n\n# === Log Level ===\n# RUST_LOG=info\n`
    })

  fs.existsSync(file).then((e) => {
    if (!e) {
      IPC.send('app-fork:rnacos', 'initConfig').then((key: string) => {
        IPC.off(key)
        conf?.value?.update()
      })
    }
  })
</script>
