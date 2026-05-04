# 任务：FrankenPHP 模块 与 现有 Host站点功能集成

## 1. 背景与目标
FlyEnv中已经添加了FrankenPHP 模块. 但是目前FrankenPHP 模块只是一个单独的模块,并没有和Host站点功能集成.
本次任务就是让FrankenPHP 模块 与 现有 Host站点功能集成

## 2. 任务步骤
1. 参照 src/fork/module/Caddy/index.ts 里的 #fixVHost 方法. 实现站点的FrankenPHP vhost文件的创建. vhost保存目录为: join(global.Server.BaseDir!, 'vhost/frankenphp')
注意FrankenPHP的vhost文件不能设置php版本. 使用FrankenPHP运行时自带的PHP
2. 参照 static/tmpl/macOS/Caddyfile. 里的 import ##VHOST-DIR##/*. 修改 static/tmpl/frankenphp.Caddyfile 和 static/tmpl/frankenphp.zh.Caddyfile
3. 参照 src/fork/module/Host/Caddy.ts. 创建 FrankenPHP版本的
4. src/fork/module/Host/index.ts 里. 添加 FrankenPHP版本的相关方法.
5. 站点日志 src/render/components/Host/Logs.vue 里. 添加 FrankenPHP 的日志.

## 3. 任务执行原则（核心红线）

**请严格遵守以下开发纪律。这决定了你的代码是否会被采纳：**

### 3.1 编码前先思考
- **禁止猜测：** 遇到不确定的需求、API 或边缘场景，必须停下来问我。
- **提供选择：** 存在多种技术实现路径时，列出各选项的优缺点让我选，绝不要替我做架构决策。
- **主动推翻：** 如果你发现有比我预期更简单、更原生的方案，请主动提出来，该推翻就推翻。

### 3.2 简约至上 (KISS 原则)
- **拒绝镀金：** 没被明确要求的功能，坚决不写。
- **拒绝过度抽象：** 只在一个地方用到的代码，不要建抽象层。
- **拒绝伪需求：** 没人要求的「灵活性」和「可配置项」坚决不加。
- **拒绝防御性编程泛滥：** 不可能发生、或极其罕见的异常场景，不做复杂的错误处理。

### 3.3 精确编辑 (Surgical Edits)
- **最小作用域：** 只修改为了完成当前任务必须动的部分。
- **风格一致：** 严格匹配 FlyEnv 已有的代码和命名风格，哪怕你觉得自己有一套“更优雅”的写法。
- **管好手：** 看到项目中不相关的代码问题（如拼写错误、历史遗留格式），提一嘴即可，绝对不要在本次任务中顺手修改。**严禁使用git回滚代码**.
- **负责到底：** 如果你的改动导致某些旧代码变成了 Dead Code，你必须负责清理掉。但原来就存在且没人让你改的问题，不要碰。**严禁使用git回滚代码**.
