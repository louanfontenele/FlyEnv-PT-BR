# FlyEnv新版本4.15.0更新日志

本次更新内容：
1. 添加 CliProxyAPI 模块.
   https://github.com/xpf0000/FlyEnv/issues/640
   感谢 @xxx 提出的此特性需求.
2. 添加 Numa 模块.
   https://github.com/xpf0000/FlyEnv/issues/616
   感谢 @xxx 提出的此特性需求.
3. 添加 Rnacos 模块.
   https://github.com/xpf0000/FlyEnv/issues/641
   感谢 @xxx 提出的此特性需求.
4. 添加 FrankenPHP 模块
   https://github.com/xpf0000/FlyEnv/issues/642
   感谢 @xxx 提出的此特性需求.
5. Ollama线上模型,新增可用性检测. 根据本机硬件, 显示红黄绿三色, 提示用户可用性.
   https://github.com/xpf0000/FlyEnv/pull/635
   感谢 @xxx 提出的此PR.
6. 工具箱新增JWT encoding and decoding tool
   https://github.com/xpf0000/FlyEnv/pull/643
   感谢 @xxx 提出的此PR.
7. 工具箱新增Cron expression parsing and runtime calculation
   https://github.com/xpf0000/FlyEnv/pull/645
   感谢 @xxx 提出的此PR.
8. 修复自动HTTPS功能在当前用户名有 . 字符时, 无法生成证书的问题.
   https://github.com/xpf0000/FlyEnv/issues/639
   感谢 @xxx 提出的此issues.

参照：
```
# **FlyEnv v4.13.6 Update Release Notes**

  ## **🚀 New Features**

  ### **1. Added n8n Module**

  You can now easily integrate n8n into your local development environment. This update allows you to install and manage
  the n8n service with just a single click directly from the UI.

  Thanks to [@ibraimfarag](https://github.com/ibraimfarag) for the contribution! [PR #584](https://github.com/xpf0000/Fl
  yEnv/pull/584)

<img width="2586" height="1778" alt="flyenv-capturer-1774008386" src="https://github.com/user-attachments/assets/3fc39d4b-1182-4959-acc2-c0d5300687ff" />
<img width="2586" height="1778" alt="flyenv-capturer-1774008402" src="https://github.com/user-attachments/assets/70e8b94b-682d-41b8-8aad-e6ceb9c6ca0f" />
<img width="2586" height="1778" alt="flyenv-capturer-1774013135" src="https://github.com/user-attachments/assets/cbc39d7d-145f-45f7-8c18-2b03289f7745" />

  ---

  ### **2. Enhanced OpenClaw Module**

  #### **2.1 Configuration File Editor**
  Added a dedicated configuration file tab to the OpenClaw module. You can now view and edit configuration files directl
  y within the UI, making it easier to customize your OpenClaw setup.

  #### **2.2 Quick Command Shortcuts**
  Added quick access shortcuts for all OpenClaw commands, streamlining your workflow and improving productivity.

<img width="2586" height="1778" alt="flyenv-capturer-1774013359" src="https://github.com/user-attachments/assets/e93fd474-612f-492f-87d5-0da3628a1051" />
<img width="2586" height="1778" alt="flyenv-capturer-1774013332" src="https://github.com/user-attachments/assets/a8f340a3-3772-438f-8292-fdd2bba8a682" />

  ---

  ## **🛠️ Improvements & Bug Fixes**

  ### **3. Fixed fnm & nvm Issues**

  Resolved critical issues where fnm and nvm were not functioning properly. You can now use these Node version managers
  seamlessly within FlyEnv.

  ### **4. General Bug Fixes & Stability**

  * Addressed various minor bugs and issues reported by the community to improve the overall stability and performance o
  f the application.

  ---

  ## **📦 Build & Transparency**

  All FlyEnv installation packages are built using **[GitHub Actions](https://github.com/xpf0000/FlyEnv/actions)**. You
  can verify the build process and download the artifacts directly from the following links:

  * **Global Build History:** [GitHub Actions](https://github.com/xpf0000/FlyEnv/actions)

  ---

  We welcome your continued feedback and bug reports via [GitHub Issues](https://github.com/xpf0000/FlyEnv/issues)

  **Enjoy the update!**
```

出一个FlyEnv最新版本的更新日志。 添加到 RELEASE_NOTES.md 里

## 备注

CLIProxyAPI相关信息:
  - https://github.com/router-for-me/CLIProxyAPI
  - https://help.router-for.me/cn/introduction/what-is-cliproxyapi.html

Numa相关信息:
  - https://numa.rs/
  - https://raw.githubusercontent.com/razvandimescu/numa/refs/heads/main/README.md

Rnacos相关信息:
  - https://r-nacos.github.io/docs/intro/
  - https://raw.githubusercontent.com/nacos-group/r-nacos/refs/heads/master/README.md

FrankenPHP相关信息:
  - https://raw.githubusercontent.com/php/frankenphp/refs/heads/main/README.md
  - https://github.com/xpf0000/FlyEnv/issues/642
