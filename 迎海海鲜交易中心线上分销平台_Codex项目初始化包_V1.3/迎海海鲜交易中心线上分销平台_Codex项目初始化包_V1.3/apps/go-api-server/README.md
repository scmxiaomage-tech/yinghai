# 迎海 V2 Backend Rebuild - Go API Server

R0 技术架构：

- Go
- Gin
- GORM
- MySQL 8.4 / InnoDB
- Redis
- JWT Middleware
- API Prefix：`/api/v2`

R0 范围：

- 工程骨架
- 配置加载
- Gin Router
- GORM MySQL 连接
- Redis 连接
- 统一响应
- 统一错误处理
- 请求日志
- JWT Middleware
- Swagger 占位
- Migration 框架
- Health API

R0 禁止：

- 迁移旧 NestJS 业务代码
- 创建业务数据库表
- 实现用户、商品、购物车、订单、支付、分销等业务 API

启动：

```bash
cp .env.example .env
go mod tidy
go run ./cmd/server
```

健康检查：

```http
GET /api/v2/health
```

Swagger 占位：

```http
GET /swagger/index.html
GET /swagger/doc.json
```
