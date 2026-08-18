# Git 分支规范

## 保护分支

- `main`：生产稳定分支，只接受经过验收的合并。
- `develop`：集成开发分支，用于 Sprint 内功能集成。

## 工作分支命名

按任务类型创建分支：

- `feature/<task-id>-<short-name>`：新功能或新模块
- `fix/<task-id>-<short-name>`：缺陷修复
- `chore/<task-id>-<short-name>`：工程配置、依赖、脚手架
- `docs/<task-id>-<short-name>`：文档变更
- `test/<task-id>-<short-name>`：测试相关

示例：

```text
chore/SYS-002-git-standards
feature/MINI-001-miniapp-shell
docs/DOC-001-sprint0-readme
```

## 合并规则

1. 分支合并前必须明确任务编号。
2. 涉及数据库 Migration 的变更必须单独说明。
3. 涉及 API 契约的变更必须同步接口文档。
4. 未经确认，不允许将实验代码合并到 `develop` 或 `main`。

