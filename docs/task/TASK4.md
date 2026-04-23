# 系统 hosts文件, 内容可能被清空 的问题分析.

## 问题描述
使用FlyEnv时, 有极小的概率会造成hosts文件内容被清空. 请帮我深入分析 系统hosts文件操作的相关代码. 找出可能导致此问题的原因.
本次任务不需要修改代码. 只需要找出可能的问题原因.

## 参考文件
  - src/fork/module/Host/index.ts
  - src/shared/PlatFormConst.ts
  - src/main/core/ServerManager.ts
  - src/render/components/Host/Hosts.vue
