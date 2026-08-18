# Sprint3.1 PostgreSQL 持久化运行说明

本次仅替换购物车与订单的数据访问层；API 路径和前端页面不变。

## 前置条件

- PostgreSQL 16+ 已启动，并监听 `DATABASE_URL` 指定地址。
- 本地开发库使用 `yinghai_dev`；测试库应设置独立的 `yinghai_test`。
- 不要把 `.env` 提交到版本库。

## 首次运行

```powershell
Copy-Item .env.example .env
# 按实际 PostgreSQL 账号修改 .env 中 DATABASE_URL
pnpm db:migrate:up
pnpm db:seed:products
pnpm db:seed:sprint3
pnpm --filter @yinghai/api-server dev
```

迁移只由 `pnpm db:migrate:up` 执行；API 服务启动时不会修改数据库结构。

## 验收命令

```powershell
pnpm typecheck
pnpm build
pnpm test:sprint1
pnpm test:sprint2
pnpm test:sprint3
pnpm test:sprint3-persistence
```

重启验收：创建购物车和订单后停止 API，再重新启动 API；使用原 Bearer Token 分别请求 `GET /api/v1/app/cart`、`GET /api/v1/app/orders`、`GET /api/v1/admin/orders`。结果应保持一致。

## Sprint3.1 边界

- 创建订单事务包含 `orders`、`order_items` 和已结算购物车软删除。
- 下单只校验可用库存，**不扣减也不锁定库存**。
- 后台订单接口只读；支付、退款、优惠券核销、分销佣金均不在本阶段实现。
