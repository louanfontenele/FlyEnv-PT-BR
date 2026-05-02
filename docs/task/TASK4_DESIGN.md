# r-nacos 集成方案（阶段一交付物）

> 本方案基于对 r-nacos 官方文档、GitHub 仓库以及 FlyEnv 现有模块（CliProxyAPI / Hermes / DNS）的源码级分析得出。

---

## 一、模块定位与选型依据

### 1.1 为什么不选 Hermes / DNS 模式？

| 维度 | r-nacos 特征 | 匹配模式 |
|------|-------------|---------|
| 程序形态 | 单二进制可执行文件，GitHub Release 分发版本 | **标准服务** |
| 生命周期 | 长期驻留后台的服务进程 | **标准服务** |
| 版本管理 | 有明确语义化版本（v0.6.x / v0.8.x 等） | **标准服务** |
| 配置需求 | 通过 `.env` 文件 + 环境变量配置 | **标准服务** |
| 日志输出 | stdout/stderr 日志文件 | **标准服务** |
| 交互式命令 | 无（不像 Hermes 需要 `skills install` 等交互） | **标准服务** |
| 内部功能 | 不是 FlyEnv 系统级基础设施（不像 DNS） | **标准服务** |

**结论**：r-nacos 应走 **CliProxyAPI 标准服务模块模式**，复用 `BrewStore` + `VersionManager` + `ServiceManager` 的成熟生命周期，开发量最小、用户体验最一致。

### 1.2 r-nacos 核心工作方式（调研摘要）

- **启动命令**：`./rnacos` 或 `./rnacos -e .env`
- **默认端口**：
  - HTTP API / SDK 端口：`8848`
  - gRPC 端口：`9848`（默认 HTTP + 1000）
  - 独立控制台端口：`10848`（默认 HTTP + 2000）
- **配置方式**：环境变量 或 `.env` 文件（KEY=VALUE 格式）
- **数据持久化**：`RNACOS_DATA_DIR` 指定本地目录（raft + 文件存储，**不依赖 MySQL**）
- **平台包**：
  - macOS: `rnacos-x86_64-apple-darwin.tar.gz` / `rnacos-aarch64-apple-darwin.tar.gz`
  - Linux: `rnacos-x86_64-unknown-linux-musl.tar.gz` / `rnacos-aarch64-unknown-linux-musl.tar.gz`
  - Windows: `rnacos-x86_64-pc-windows-msvc.zip`

---

## 二、前端界面 (UI/UX)

### 2.1 模块入口

- **侧边栏**：归类到 `middleware`（中间件）分组，与 `consul`、`etcd`、`rabbitmq` 等并列
- **路由**：自动生成 `/rnacos`
- **图标**：需新增 `rnacos.svg`（可先用文字占位符或简化 Nacos 风格图标）

### 2.2 主页面 Tab 结构（与 CliProxyAPI 保持一致）

```
┌─────────────────────────────────────────────┐
│  [Service] [Versions] [Config] [Env] [Logs] │
├─────────────────────────────────────────────┤
│ Tab 0: Service（服务启停）                    │
│   - 当前版本号                               │
│   - 运行状态 / PID                           │
│   - 启动 / 停止 / 重启按钮                   │
│   - 端口信息：HTTP(8848) / gRPC(9848) /      │
│            Console(10848)                    │
│   - 快速链接：打开 r-nacos 控制台            │
│                                              │
│ Tab 1: Versions（版本管理）                  │
│   - 已安装版本列表（Static）                 │
│   - 在线版本下载（GitHub Release）           │
│   - 版本切换                                 │
│                                              │
│ Tab 2: Config（配置文件）                    │
│   - 编辑 rnacos.env（Monaco Editor）         │
│                                              │
│ Tab 3: Env（环境变量）← 可选合并到 Config    │
│   - 展示已启用的环境变量                     │
│                                              │
│ Tab 4: Logs（日志查看）                      │
│   - out / error 日志切换                     │
│   - 日志文件列表                             │
└─────────────────────────────────────────────┘
```

### 2.3 与 CliProxyAPI 的差异点

| 差异项 | CliProxyAPI | r-nacos |
|--------|-------------|---------|
| 配置文件 | `config.yaml` | `.env`（无 YAML 结构） |
| 配置模板 | 需要 `tmpl/cliproxyapi.yaml` | 不需要复杂模板，`.env` 即可 |
| 端口数 | 1 个 | 3 个（HTTP/gRPC/Console）|
| 控制台 | 无独立 Web 控制台 | 有 `http://127.0.0.1:10848/rnacos/` |

**UI 适配**：
- `Config.vue` 直接使用 Monaco Editor 编辑 `.env` 文件（纯 KEY=VALUE 文本，无需 YAML 高亮也行）
- `Service.vue` 额外展示三个端口，并提供一个「打开控制台」按钮（外链到 `http://127.0.0.1:10848/rnacos/`）

---

## 三、后端逻辑 (Backend IPC/Services)

### 3.1 Fork 进程模块：`src/fork/module/Rnacos/index.ts`

继承 `Base`，实现以下方法：

```typescript
class Rnacos extends Base {
  constructor() {
    super()
    this.type = 'rnacos'
  }

  init() {
    this.pidPath = join(global.Server.BaseDir!, 'rnacos/rnacos.pid')
  }

  // 初始化 .env 配置文件
  initConfig(): ForkPromise<string>

  // 启动服务
  _startServer(version: SoftInstalled): ForkPromise<any>

  // 停止服务（继承 Base._stopServer，需注册进程名映射）
  // 进程名映射：rnacos → 'rnacos'

  // 获取在线版本（GitHub Release）
  fetchAllOnlineVersion(): ForkPromise<OnlineVersionItem[]>

  // 扫描本地已安装版本
  allInstalledVersions(setup: any): ForkPromise<SoftInstalled[]>

  // 获取日志文件列表
  getLogFiles(): ForkPromise<{ name: string; path: string }[]>
}
```

#### `_startServer` 启动逻辑

```typescript
_startServer(version: SoftInstalled) {
  return new ForkPromise(async (resolve, reject, on) => {
    const baseDir = join(global.Server.BaseDir!, 'rnacos')
    await mkdirp(baseDir)

    // 1. 初始化/确认 .env 文件存在
    const envFile = join(baseDir, 'rnacos.env')
    if (!existsSync(envFile)) {
      await writeFile(envFile, 默认 env 模板)
    }

    // 2. 读取用户自定义 env
    const execEnv: Record<string, string> = {}
    // ... 解析 envFile 中的 KEY=VALUE ...

    // 3. 强制注入关键路径变量（ FlyEnv 托管 ）
    execEnv['RNACOS_DATA_DIR'] = join(baseDir, 'data')

    // 4. 启动命令
    const bin = version.bin
    const execArgs = ['-e', envFile]

    const res = await serviceStartSpawn({
      version,
      pidPath: this.pidPath,
      baseDir,
      bin,
      execArgs,
      execEnv,
      waitTime: 1500, // r-nacos 秒启动，可适当缩短等待
      on
    })
    resolve(res)
  })
}
```

**关键设计**：
- 启动时通过 `-e rnacos.env` 传入配置，避免用户手动 export 环境变量
- `RNACOS_DATA_DIR` 强制指向 FlyEnv 的 `BaseDir/rnacos/data`，所有持久化数据（配置、服务注册信息）都收归 FlyEnv 管理，卸载即清理

#### `fetchAllOnlineVersion` 版本来源

**问题**：现有模块统一调用 `api.one-env.com/api/version/fetch` 获取在线版本。如果该 API 暂未收录 r-nacos，需要直接查询 GitHub Release API。

**方案选项**（待您确认）：

| 选项 | 实现方式 | 优点 | 缺点 |
|------|---------|------|------|
| A | 直接调用 GitHub API (`api.github.com/repos/r-nacos/r-nacos/releases`) | 不依赖 one-env 后端，即时可用 | 可能受 GitHub API 速率限制 |
| B | 由 one-env.com 后端新增 r-nacos 支持 | 与现有模块完全一致，统一包管理 | 需要后端配合，有外部依赖 |

**推荐选项 A**：在 `fetchAllOnlineVersion` 中覆写 Base 类行为，直接解析 GitHub Release Assets，按平台/架构过滤下载链接。

### 3.2 进程终止映射

`Base._stopServer` 中通过 `dis` 字典匹配进程名。需在 `dis` 中新增：

```typescript
const dis: { [k: string]: string } = {
  // ... 原有映射 ...
  rnacos: 'rnacos'
}
```

### 3.3 注册与命令分发

在 `src/fork/BaseManager.ts` 中新增懒加载分支：

```typescript
} else if (module === 'rnacos') {
  if (!this.Rnacos) {
    const res = await import('./module/Rnacos')
    this.Rnacos = res.default
  }
  doRun(this.Rnacos)
}
```

### 3.4 Renderer 模块定义

```typescript
// src/render/components/Rnacos/Module.ts
const module: AppModuleItem = {
  moduleType: 'middleware',
  typeFlag: 'rnacos',
  label: 'R-Nacos',
  icon: import('@/svg/rnacos.svg?raw'),
  index: defineAsyncComponent(() => import('./Index.vue')),
  aside: defineAsyncComponent(() => import('./aside.vue')),
  asideIndex: 6, // 与 consul/etcd 等中间件排序协调
  isService: true,
  isTray: true
}
```

---

## 四、用户执行逻辑（完整交互链路）

```
1. 用户打开 FlyEnv → 侧边栏「中间件」分组 → 点击 R-Nacos
   ↓
2. Versions Tab → 点击「下载」某版本
   → Fork 进程调用 GitHub API 获取 Asset 列表
   → 下载对应平台 tar.gz / zip
   → 解压到 ~/FlyEnv/app/rnacos/{version}/rnacos
   → 返回安装成功
   ↓
3. Service Tab → 首次启动前提示「初始化配置」
   → Fork 进程在 ~/FlyEnv/rnacos/ 下创建 rnacos.env
   → 默认内容包含注释说明，用户可按需修改端口、管理员密码等
   ↓
4. 点击「启动」
   → Fork 进程读取 rnacos.env
   → 强制追加 RNACOS_DATA_DIR=~/FlyEnv/rnacos/data
   → 执行 ./rnacos -e rnacos.env
   → 2 秒内未退出则判定启动成功
   → 返回 PID，写入 pid 文件
   ↓
5. 服务运行中
   → 用户可在 Service Tab 看到运行状态、三个端口信息
   → 点击「打开控制台」跳转浏览器到 10848 端口
   → Logs Tab 实时查看 out / error 日志
   → Config Tab 修改 .env 后重启生效
   ↓
6. 点击「停止」
   → Fork 进程读取 pid 文件，发送 -INT 信号
   → 匹配进程名 rnacos 兜底杀进程
   → 标记服务已停止
```

---

## 五、文件变更清单（预估）

### 新增文件

```
src/fork/module/Rnacos/index.ts          # Fork 侧核心模块
src/render/components/Rnacos/Module.ts   # 模块注册
src/render/components/Rnacos/Index.vue   # 主页面（5 Tabs）
src/render/components/Rnacos/aside.vue   # 侧边栏
src/render/components/Rnacos/Config.vue  # .env 配置编辑
src/render/components/Rnacos/Logs.vue    # 日志查看
src/render/components/Rnacos/Env.vue     # 环境变量展示（可选）
src/svg/rnacos.svg                       # 模块图标
src/lang/*/rnacos.json                   # 各语言翻译（25+ 种）
```

### 修改文件

```
src/render/core/type.ts                  # AppModuleEnum 新增 rnacos
src/fork/BaseManager.ts                  # 懒加载注册 rnacos 分支
src/fork/module/Base/index.ts            # dis 进程名映射新增 rnacos
src/lang/*/index.ts                      # 导入并注册 rnacos 翻译
src/render/components/Aside/Index.vue    # moduleType 分组（如新增 middleware）
```

---

## 六、待确认事项

在编码前，请您确认以下决策：

### 6.1 版本来源（必答）

**问题**：在线版本走 GitHub API 直接解析，还是等待 `api.one-env.com` 后端支持？
- [ ] **选项 A**：直接调用 GitHub API（推荐，可立即开发）
- [ ] **选项 B**：等待 one-env 后端新增 r-nacos

### 6.2 模块分组（必答）

**问题**：r-nacos 在侧边栏的分组归类？
- [ ] **选项 A**：`middleware`（与 consul、etcd、rabbitmq 同组）
- [ ] **选项 B**：新建独立分组如 `registry`（注册中心）
- [ ] **选项 C**：其他分组

### 6.3 端口冲突处理（可选）

**问题**：r-nacos 默认占用 8848/9848/10848，如果用户已有 Java Nacos 或其他服务占用这些端口，是否需要：
- [ ] **选项 A**：不做特殊处理，由用户自行在 .env 中修改端口（最简单，推荐）
- [ ] **选项 B**：启动前检测端口占用，自动提示并建议修改 .env

### 6.4 Config / Env Tab 合并（可选）

**问题**：r-nacos 只有 `.env` 一种配置，是否需要单独的 Env Tab？
- [ ] **选项 A**：合并到 Config Tab 一个页面，减少 Tab 数量（推荐）
- [ ] **选项 B**：保留 Config + Env 两个 Tab，与 CliProxyAPI 严格一致

---

## 七、风险与简化项

| 风险点 | 处理策略 |
|--------|---------|
| r-nacos 控制台有独立鉴权（admin/admin） | 不在 FlyEnv 中管理控制台账号，用户通过 r-nacos 原生控制台自行管理 |
| r-nacos 支持集群部署 | **本次集成仅支持单机模式**，集群模式不在范围内 |
| r-nacos 支持 MCP 服务 | **本次集成不暴露 MCP 配置**，仅作为标准 Nacos 服务运行 |
| 数据备份/恢复 | 用户直接操作 `~/FlyEnv/rnacos/data` 目录，FlyEnv 不提供额外 UI |

---

**请您审阅以上方案，对「待确认事项」做出选择（或直接回复「确认」采用推荐选项）。收到确认后，我将立即进入阶段二的编码实现。**
