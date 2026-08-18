# miniapp

微信小程序用户端骨架目录。

Sprint 0 阶段只初始化 UniApp/Vue3/TypeScript 基础工程、Pinia、TabBar、页面目录、公共组件目录、API 请求封装占位和环境配置占位。

## TabBar

- 首页
- 购物车
- 消息
- 积分商城
- 我的

## 启动

安装依赖后执行：

```bash
pnpm --filter @yinghai/miniapp dev:mp-weixin
```

构建微信小程序：

```bash
pnpm --filter @yinghai/miniapp build:mp-weixin
```

## 限制

MINI-001 不实现登录、商品、订单、支付、积分、分销等业务功能。
