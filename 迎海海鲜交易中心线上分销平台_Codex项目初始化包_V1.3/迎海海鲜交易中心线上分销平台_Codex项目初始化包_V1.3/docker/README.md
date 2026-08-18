# Docker Local Environment

V2 本地基础服务：

- MySQL 8.4：业务数据库，InnoDB，数据通过 Docker volume 持久化。
- Redis 7：缓存与会话相关基础服务。
- Nginx：本地反向代理占位。

启动：

```bash
docker compose up -d mysql redis nginx
```

注意：R0 不创建业务表。
