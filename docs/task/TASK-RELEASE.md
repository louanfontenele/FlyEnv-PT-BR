# FlyEnv新版本4.14.2更新日志

本次更新内容：
1. 添加 Hermes Agent 模块.
2. 修复Windows版本托盘退出无效的问题

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

如果你不清楚 Hermes Agent 是什么. 可以先浏览 https://hermes-agent.nousresearch.com/docs/
项目里 Hermes 模块在 src/fork/module/Hermes 和 src/render/components/Hermes. 可以先浏览下看看都有哪些功能.
