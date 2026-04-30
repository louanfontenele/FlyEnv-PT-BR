# 添加 CLIProxyAPI 模块

## 需求描述
用户需求描述：
```markdown
## 🚀 Feature Request
Add CLIProxyAPI (https://github.com/router-for-me/CLIProxyAPI) as a module in FlyEnv.

## 💡 Why
CLIProxyAPI provides an OpenAI-compatible API for multiple AI providers (OpenAI, Claude, Gemini, etc.) using OAuth instead of API keys.

Integrating it into FlyEnv would:
- Enable local AI proxy for development
- Simplify multi-provider AI usage
- Fit well with FlyEnv’s modular system

## 🧩 Proposal
- Add CLIProxyAPI as a managed service (start/stop, config)
- Optional: integrate via Go SDK for deeper embedding

## 🔍 Use Cases
- Use AI tools (Cursor, VSCode extensions) via local proxy
- Manage multiple AI providers in one place
```
相关文档：
  - https://help.router-for.me/cn/introduction/what-is-cliproxyapi.html
  - https://help.router-for.me/cn/introduction/quick-start.html
  - https://help.router-for.me/cn/configuration/basic.html
  - https://help.router-for.me/cn/configuration/options.html
  - https://help.router-for.me/cn/configuration/storage/git.html
  - https://help.router-for.me/cn/configuration/storage/pgsql.html
  - https://help.router-for.me/cn/configuration/storage/s3.html

先完整读取以上信息。深入了解CLIProxyAPI的作用，功能，特性。
然后考虑CLIProxyAPI模块跟目前系统已有的哪个模块比较像。功能可以参照哪个模块进行开发。都包含哪些功能
最后完成CLIProxyAPI模块的开发

## 备注
1. 版本管理返回内容格式。需要你自行请求接口获取。
2. 版本解压内容你可以自行下载解压查看
3. 系统代理：$env:http_proxy="http://127.0.0.1:17891"; $env:https_proxy="http://127.0.0.1:17891"; $env:all_proxy="http://127.0.0.1:17891"

## 任务执行原则

**请认真读取并深刻理解下面的原则。并严格按照下面的原则执行任务**

### 编码前先思考。
1. 不确定时必须停下来问，不能猜。
2. 存在多种理解时列出选项让用户选，而不是替用户做决定。
3. 发现有更简单的方案时，主动说出来，该推回来就推回来。

### 简约至上。
1. 没被要求的功能不写。
2. 只用一次的代码不建抽象层。
3. 没人要求的「灵活性」和「可配置」不加。
4. 不可能发生的异常场景不做错误处理。

### 精确编辑。
1. 只动你被要求动的部分。
2. 匹配项目已有的代码风格，哪怕你觉得自己写得更好。
3. 看到不相关的问题，提一嘴就行，别动手。
4. 如果你的改动导致某些代码不再被使用，清理掉，那是你的责任。但之前就存在的问题，没人让你改就不要碰。


