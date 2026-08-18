# api-server

NestJS API Server 骨架目录。

Sprint 0 阶段只初始化后端工程基础、健康检查、Swagger、环境变量、数据库与 Redis 基础连接配置。

## API 前缀规划

全局前缀：

```text
/api/v1
```

预留三端接口命名空间：

```text
/api/v1/app
/api/v1/admin
/api/v1/mobile-admin
```

当前只提供健康检查接口，不开发业务模块。

## 启动

```bash
pnpm --filter @yinghai/api-server dev
```

## Swagger

默认地址：

```text
http://localhost:3001/api-docs
```

