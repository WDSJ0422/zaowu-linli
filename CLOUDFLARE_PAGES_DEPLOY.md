# 造物邻里：Cloudflare Pages 快速上线指南

这个方案适合当前“第一阶段信息撮合 / 询价预约版”：不接平台支付，不买服务器，先让所有人能通过公网网址访问。

当前项目已经升级为：

- 静态前端：`site/index.html`
- 真实接口：`functions/api/*`
- 云端数据库：Cloudflare D1
- 数据库建表：`migrations/0001_initial.sql`

## 你需要准备

1. 一个域名，例如 `zaowulinli.com`
2. 一个 GitHub 账号
3. 一个 Cloudflare 账号

## 本项目要上传的目录

网站静态文件已经整理到：

`site/`

前端静态文件里最重要的是：

- `site/index.html`：网站首页
- `site/_headers`：Cloudflare Pages 的基础安全响应头

同时还要上传这些后端相关目录：

- `functions/`：Cloudflare Pages Functions 接口
- `migrations/`：D1 数据库建表 SQL
- `wrangler.toml.example`：D1 绑定配置示例

## 推荐部署方式：GitHub + Cloudflare Pages

### 第一步：创建 GitHub 仓库

1. 登录 GitHub
2. 点击 New repository
3. 仓库名建议：`zaowu-linli`
4. 选择 Public 或 Private 都可以
5. 创建仓库

### 第二步：上传项目文件

最简单做法：

1. 打开刚创建的 GitHub 仓库
2. 点击 Add file
3. 上传整个项目，或者至少上传 `site/` 文件夹
4. 提交保存

### 第三步：创建 Cloudflare Pages 项目

1. 登录 Cloudflare
2. 进入 Workers & Pages
3. 点击 Create application
4. 选择 Pages
5. 选择 Connect to Git
6. 绑定刚才的 GitHub 仓库

### 第四步：填写构建设置

如果你上传的是完整项目，Cloudflare Pages 这样填：

- Framework preset：None
- Build command：留空
- Build output directory：`site`

如果你只上传了 `site/` 里面的文件到仓库根目录，则填：

- Framework preset：None
- Build command：留空
- Build output directory：`/`

然后点击 Deploy。

### 第五步：绑定自己的域名

Cloudflare Pages 部署成功后，会先给你一个临时地址，例如：

`https://zaowu-linli.pages.dev`

如果你买了自己的域名：

1. 进入 Pages 项目
2. 点击 Custom domains
3. 添加你的域名，例如 `www.zaowulinli.com`
4. 按 Cloudflare 提示配置 DNS
5. 等待 HTTPS 自动生效

## 当前版本的限制

## 开启真实注册和数据保存

如果只上传 `site/`，网站仍然只是静态演示。

如果你需要真实公网用户注册、打印机主入驻、询价单收集，需要同时部署：

- `site/`
- `functions/`
- `migrations/`

### 创建 D1 数据库

在 Cloudflare 控制台：

1. 进入 Workers & Pages
2. 找到 D1
3. 创建数据库
4. 数据库名建议：`zaowu-linli-db`

### 执行建表 SQL

打开 D1 数据库的 Console，把下面文件里的 SQL 复制进去执行：

`migrations/0001_initial.sql`

执行成功后，会创建：

- `users`：用户表
- `sessions`：登录会话表
- `printers`：打印机主资料表
- `inquiries`：询价单表

### 给 Pages 项目绑定 D1

进入 Cloudflare Pages 项目：

1. Settings
2. Functions
3. D1 database bindings
4. 添加绑定

绑定名称必须填：

`DB`

数据库选择：

`zaowu-linli-db`

保存后重新部署。

### 设置后台导出密钥

如果你想通过接口导出用户、打印机、询价单数据，需要设置环境变量：

`ADMIN_TOKEN`

建议设置为一串很长的随机字符串。

之后可以用这个接口导出数据：

`GET https://你的站点/api/admin/export`

请求头：

`Authorization: Bearer 你的_ADMIN_TOKEN`

## 当前版本的限制

当前上线的是第一阶段 MVP：

- 已支持真实手机号 + 密码注册
- 已支持打印机主资料保存到 D1
- 已支持询价单保存到 D1
- 已支持管理员接口导出数据
- 暂时没有可视化后台管理系统
- 没有平台支付
- 没有短信通知
- 没有实名认证

这很适合早期验证，但不适合直接承载真实大规模业务。

## 下一阶段升级建议

如果有人开始真实提交需求，建议下一步升级：

1. 接入真实后端数据库
2. 用户注册登录改成服务端账号
3. 文件上传保存到云存储
4. 打印机主信息进入真实审核流程
5. 增加平台客服/人工报价后台
6. 业务稳定后再考虑公司主体、备案、支付、短信、实名
