# Migration Framework

R0 只初始化 Migration 框架，不创建业务表。

正式工具建议使用 `golang-migrate/migrate`：

```bash
migrate -path ./migrations -database "mysql://yinghai:yinghai_dev_password@tcp(127.0.0.1:3306)/yinghai_v2_dev" up
```

约束：

- Migration 文件必须由数据库 V2 设计文档驱动。
- 禁止在 R0 阶段创建 users、products、orders、payments、distribution 等业务表。
- MySQL 引擎统一使用 InnoDB。
- 字符集统一使用 utf8mb4。
