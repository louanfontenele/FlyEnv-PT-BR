# FlyEnv新版本4.15.1更新日志

本次更新内容：
1. 添加 Flutter 模块.
   https://github.com/xpf0000/FlyEnv/pull/649
   感谢 @xxx 提出的此PR.
2. 添加 Git 模块.
   https://github.com/xpf0000/FlyEnv/pull/664
   感谢 @xxx 提出的此PR.
3. feat(diff-compare): Added a text difference comparison tool
   https://github.com/xpf0000/FlyEnv/pull/651
   https://github.com/xpf0000/FlyEnv/pull/670
      感谢 @xxx 和 @xxx 提出的此PR.
4. Feature tools websocket sse
   https://github.com/xpf0000/FlyEnv/pull/657
   感谢 @xxx 提出的此PR.
5. 优化Windows版，各个服务启动的稳定性。

参照：
```
# **FlyEnv v4.15.0 Update Release Notes**

## **🚀 New Features**

### **1. Added CliProxyAPI Module**

FlyEnv now integrates **[CliProxyAPI](https://github.com/router-for-me/CLIProxyAPI)** — a lightweight CLI proxy API solution — directly into your development environment. You can now install, configure, and manage CliProxyAPI with just a few clicks from the FlyEnv UI.

Thanks to [@diinggos](https://github.com/diinggos) for the feature request! [Issue #640](https://github.com/xpf0000/FlyEnv/issues/640)

<img width="2532" height="1692" alt="image" src="https://github.com/user-attachments/assets/54b5c488-09ac-459b-a0ec-02c4f49bfa3f" />
<img width="2532" height="1692" alt="image" src="https://github.com/user-attachments/assets/2a8e3c72-d6bb-4ac7-8098-90e031bf7f8e" />

---

### **2. Added Numa Module**

Introducing **[Numa](https://numa.rs/)** support to FlyEnv! Numa is a powerful framework that you can now easily install and manage directly from the FlyEnv interface.

Thanks to [@batcom](https://github.com/batcom) for the feature request! [Issue #616](https://github.com/xpf0000/FlyEnv/issues/616)

<img width="2532" height="1692" alt="image" src="https://github.com/user-attachments/assets/ba3e0ccb-7e91-4d52-8129-53409604ea5a" />
<img width="2532" height="1692" alt="image" src="https://github.com/user-attachments/assets/1e0ab288-c807-46b0-90f1-81ab457c2c43" />

---

### **3. Added Rnacos Module**

FlyEnv now supports **[r-nacos](https://r-nacos.github.io/docs/intro/)** — a Rust implementation of the Nacos service discovery and configuration management platform. You can now install and manage Rnacos directly from the FlyEnv UI.

Thanks to [@achunchunya](https://github.com/achunchunya) for the feature request! [Issue #641](https://github.com/xpf0000/FlyEnv/issues/641)

<img width="2532" height="1692" alt="image" src="https://github.com/user-attachments/assets/4732d46a-cbd7-476b-8e5e-d96edbcf36c3" />
<img width="2532" height="1692" alt="image" src="https://github.com/user-attachments/assets/cbea74bc-35cf-46ed-a212-593daa6db3df" />

---

### **4. Added FrankenPHP Module**

We are excited to bring **[FrankenPHP](https://frankenphp.dev/)** to FlyEnv! FrankenPHP is a modern PHP application server written in Go. You can now easily install, configure, and run FrankenPHP directly from the FlyEnv interface.

Thanks to [@eqwt](https://github.com/eqwt) for the feature request! [Issue #642](https://github.com/xpf0000/FlyEnv/issues/642)

<img width="2532" height="1692" alt="image" src="https://github.com/user-attachments/assets/012ba38b-a810-40a5-ad84-9310607f6355" />
<img width="2532" height="1692" alt="image" src="https://github.com/user-attachments/assets/2eed8c57-9bd4-4c7c-8002-c0c3c7c08c1f" />
<img width="2532" height="1692" alt="image" src="https://github.com/user-attachments/assets/77a13a42-384c-4b5f-8418-0817ef76b315" />
<img width="2532" height="1692" alt="image" src="https://github.com/user-attachments/assets/8c10dcf6-c52a-42e0-8daf-b41635db49eb" />

---

### **5. Ollama Online Model Availability Detection**

Enhanced the Ollama module with hardware-based availability detection for online models. Models are now displayed with a color-coded indicator (red/yellow/green) based on your local hardware capabilities, helping you quickly identify which models are suitable for your machine.

Thanks to [@ibraimfarag](https://github.com/ibraimfarag) for the PR! [PR #635](https://github.com/xpf0000/FlyEnv/pull/635)

<img width="2532" height="1692" alt="image" src="https://github.com/user-attachments/assets/78c7cf69-bce9-4f01-83d8-f378e3a7456b" />

---

### **6. Added JWT Encoding & Decoding Tool to Toolbox**

The Toolbox now includes a convenient **JWT encoding and decoding tool**. You can easily encode and decode JSON Web Tokens directly within FlyEnv, making it simpler to debug and work with JWT-based authentication during development.

Thanks to [@Heyiki](https://github.com/Heyiki) for the PR! [PR #643](https://github.com/xpf0000/FlyEnv/pull/643)

<img width="2532" height="1692" alt="image" src="https://github.com/user-attachments/assets/8fecc788-3136-4677-9d72-7d6339cd4b62" />

---

### **7. Added Cron Expression Parsing & Runtime Calculation to Toolbox**

The Toolbox now also features a **Cron expression parser and runtime calculator**. Enter any cron expression to see a human-readable description and calculate the next scheduled run times, streamlining your workflow when working with scheduled tasks.

Thanks to [@Heyiki](https://github.com/Heyiki) for the PR! [PR #645](https://github.com/xpf0000/FlyEnv/pull/645)

<img width="2532" height="1692" alt="image" src="https://github.com/user-attachments/assets/9d2939df-ad35-47aa-91af-735e5f05bd98" />

---

## **🛠️ Improvements & Bug Fixes**

### **8. Fixed Auto HTTPS Certificate Generation Issue**

Resolved an issue where Auto HTTPS certificate generation would fail when the current username contained a dot (`.`) character. Certificates will now be generated correctly regardless of special characters in the system username.

Thanks to [@dkoychev](https://github.com/dkoychev) for reporting this issue! [Issue #639](https://github.com/xpf0000/FlyEnv/issues/639)

---

## **📦 Build & Transparency**

All FlyEnv installation packages are built using **[GitHub Actions](https://github.com/xpf0000/FlyEnv/actions)**. You can verify the build process and download the artifacts directly from the following links:

- **Global Build History:** [GitHub Actions](https://github.com/xpf0000/FlyEnv/actions)

---

We welcome your continued feedback and bug reports via [GitHub Issues](https://github.com/xpf0000/FlyEnv/issues)

**Enjoy the update!**
```

出一个FlyEnv最新版本的更新日志。 添加到 RELEASE_NOTES.md 里
如果需要了解各个模块的功能，可以从代码里查看。
@xxx需要你打开具体的url去获取。
