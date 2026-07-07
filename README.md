# 造物邻里后端

这是一个可部署的后端基础：SQLite 数据库、带令牌的账户 API、打印机资料审核状态、订单与支付状态、以及受限文件上传。

## 本地运行

```bash
APP_SECRET="请替换成随机长密钥" python3 backend/app.py
```

打开 `http://127.0.0.1:8080`。数据默认写入 `data/`，该目录不可提交到公开仓库。

## 已提供的 API

- `POST /api/auth/register`、`POST /api/auth/login`
- `GET /api/me`、`PUT /api/me`
- `GET /api/printers`、`POST /api/printers`
- `POST /api/files`：需要 Bearer Token 与 `X-Filename`，仅允许 STL、3MF、STP、STEP、OBJ，最大 50 MB
- `GET /api/orders`、`POST /api/orders`
- `POST /api/orders/{id}/pay`：仅限本地开发模拟；不能用于真实收费

## 上线前必须替换/补齐

1. 将 SQLite 换成托管 MySQL/PostgreSQL，文件换成对象存储。
2. 由服务端对接微信支付、支付宝，并只根据**验签后的异步回调**更新支付状态。
3. 接入短信验证码与合规实名核验服务，身份证信息只交给服务商核验，不落库保存原件。
4. 部署 HTTPS、域名备案、监控、备份、访问日志、限流与病毒扫描。
5. 完成隐私政策、用户协议、模型版权与禁印规则、退款/售后政策，并由专业人士审核。

`Dockerfile` 可用于容器部署。上线时把 `backend/.env.example` 的变量改为平台秘密配置，绝不要提交商户密钥。
