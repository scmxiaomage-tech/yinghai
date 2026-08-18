# External dependencies

## POSTGRES_RUNTIME

- status: pending
- reason: 本机当前无 PostgreSQL、Docker、psql，且 `localhost:5432` 无服务监听。
- affects: 真实 Migration 运行测试、真实事务测试、服务重启持久化测试、并发库存压测。

## WECHAT_PAY_CREDENTIALS

- status: pending
- reason: 当前未配置商户号、API v3 Key、私钥、证书序列号和公网回调地址。
- affects: 真实微信下单、真实通知验签/解密、真实微信退款与生产资金验收。
