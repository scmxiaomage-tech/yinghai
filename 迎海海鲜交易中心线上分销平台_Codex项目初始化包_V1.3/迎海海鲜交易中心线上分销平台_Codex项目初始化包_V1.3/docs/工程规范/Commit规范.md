# Commit 规范

提交信息采用 Conventional Commits 风格，并必须包含任务编号。

## 格式

```text
<type>(<task-id>): <summary>
```

示例：

```text
chore(SYS-002): initialize git standards
docs(DOC-001): add sprint0 startup guide
```

## type 类型

- `feat`：新功能
- `fix`：修复
- `chore`：工程配置、依赖、脚手架
- `docs`：文档
- `style`：格式调整，不影响逻辑
- `refactor`：重构，不改变外部行为
- `test`：测试
- `ci`：CI/CD

## 约束

1. 一个提交只处理一个明确任务或一个小范围变更。
2. 不允许使用含糊提交信息，例如 `update`、`fix bug`、`修改一下`。
3. 涉及数据库、API、权限、安全的提交必须在提交正文中说明影响范围。
4. Sprint 0 阶段不得提交业务功能实现。

