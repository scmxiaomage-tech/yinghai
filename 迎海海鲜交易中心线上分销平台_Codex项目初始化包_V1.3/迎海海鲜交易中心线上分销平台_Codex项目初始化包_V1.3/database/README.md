# Database

旧 PostgreSQL 数据库路线已正式废弃。

V2 正式数据库技术栈：

- MySQL 8.4
- InnoDB
- utf8mb4
- Redis

旧 PostgreSQL Migration 已移动到：

```text
archive/legacy-postgresql-migrations
```

新的 MySQL Migration 框架位于：

```text
apps/go-api-server/migrations
```

R0 阶段禁止创建业务表，等待数据库 V2 详细设计文档冻结。
