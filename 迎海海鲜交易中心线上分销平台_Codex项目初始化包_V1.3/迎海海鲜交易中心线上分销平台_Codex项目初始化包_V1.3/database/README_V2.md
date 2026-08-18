# Database V2 Notice

旧 PostgreSQL Migration 已废弃并移动到：

```text
archive/legacy-postgresql-migrations
```

V2 数据库正式技术栈：

- MySQL 8.4
- InnoDB
- Redis

R0 阶段不创建业务表。新的 MySQL Migration 位于：

```text
apps/go-api-server/migrations
```

后续必须等待数据库 V2 详细设计文档冻结后，才允许创建业务表。
