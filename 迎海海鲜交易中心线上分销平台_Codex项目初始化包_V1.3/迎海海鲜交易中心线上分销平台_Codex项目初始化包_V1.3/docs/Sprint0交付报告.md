# Sprint 0 交付报告

项目：迎海海鲜交易中心线上分销平台

阶段：Sprint 0 工程初始化

状态：已完成

## 1. Sprint 0 总结报告

Sprint 0 按确认顺序完成工程基础初始化：

1. SYS-001 Monorepo 初始化
2. SYS-002 Git 规范初始化
3. SYS-003 Docker 环境初始化
4. DB-001 数据库 Migration 框架初始化
5. API-001 NestJS 后端基础框架初始化
6. MINI-001 微信小程序用户端骨架初始化
7. ADMIN-001 PC/iPad H5 后台骨架初始化
8. MOBILE-ADMIN-001 手机 H5 工作台骨架初始化
9. CI-001 CI/CD 初始化
10. DOC-001 Sprint 0 文档交付

Sprint 0 严格遵守边界：

- 未开发商品、订单、支付、会员、积分、分销、供应链等业务功能。
- 未创建业务数据库表。
- 未修改 API 业务规则。
- 未配置生产环境自动部署。

## 2. 项目目录结构说明

当前项目采用 Monorepo 结构：

```text
.
├── apps/
│   ├── api-server/
│   ├── miniapp/
│   ├── admin-h5/
│   └── mobile-admin-h5/
├── packages/
│   ├── shared/
│   ├── types/
│   └── config/
├── database/
│   ├── migrations/
│   ├── seeds/
│   └── migration.config.cjs
├── docker/
│   ├── nginx/
│   └── README.md
├── docs/
├── .github/
│   └── workflows/
│       └── ci.yml
├── docker-compose.yml
├── package.json
├── pnpm-workspace.yaml
├── turbo.json
└── tsconfig.base.json
```

目录说明：

- `apps/api-server`：NestJS API Server
- `apps/miniapp`：微信小程序用户端
- `apps/admin-h5`：PC/iPad H5 后台
- `apps/mobile-admin-h5`：手机 H5 工作台
- `packages/shared`：公共工具与常量包占位
- `packages/types`：共享类型包占位
- `packages/config`：共享配置包占位
- `database/migrations`：数据库 Migration 文件目录
- `database/seeds`：本地开发种子数据目录
- `docker`：本地 Docker 开发环境配置
- `docs`：项目文档与规范

## 3. 本地开发环境启动说明

### 3.1 安装依赖

```bash
pnpm install
```

### 3.2 启动基础服务

```bash
cp .env.example .env
docker compose up -d
```

### 3.3 启动 API Server

```bash
pnpm --filter @yinghai/api-server dev
```

默认地址：

```text
http://localhost:3001
```

### 3.4 启动微信小程序用户端

```bash
pnpm --filter @yinghai/miniapp dev:mp-weixin
```

### 3.5 启动 PC/iPad H5 后台

```bash
pnpm --filter @yinghai/admin-h5 dev
```

默认地址：

```text
http://localhost:3100
```

### 3.6 启动手机 H5 工作台

```bash
pnpm --filter @yinghai/mobile-admin-h5 dev
```

默认地址：

```text
http://localhost:3200
```

## 4. 技术栈说明

已确认技术栈：

- Monorepo：pnpm workspace
- 任务编排：Turborepo
- 语言：TypeScript
- 小程序：UniApp + Vue3
- PC/iPad H5 后台：Vue3 + Vite
- 手机 H5 工作台：Vue3 + Vite
- 后端：NestJS
- 数据库：PostgreSQL
- 缓存：Redis
- 容器：Docker
- API 文档：Swagger
- CI：GitHub Actions

## 5. 三端工程说明

### 5.1 微信小程序用户端

目录：

```text
apps/miniapp
```

已完成：

- UniApp/Vue3 基础工程
- TypeScript 配置
- Pinia 初始化
- TabBar 配置
- 页面目录结构
- API 请求封装占位
- 环境配置占位

TabBar：

- 首页
- 购物车
- 消息
- 积分商城
- 我的

### 5.2 PC/iPad H5 后台

目录：

```text
apps/admin-h5
```

已完成：

- Vue3 + TypeScript 基础工程
- Vite 配置
- Router 初始化
- Pinia 初始化
- 左侧菜单 + 顶部 Header + 内容区域布局
- API 请求封装占位
- 菜单系统占位
- 权限控制占位

### 5.3 手机 H5 工作台

目录：

```text
apps/mobile-admin-h5
```

已完成：

- Vue3 + TypeScript 基础工程
- Vite 配置
- Router 初始化
- Pinia 初始化
- 顶部 Header + 内容卡片区域 + 底部导航布局
- API 请求封装占位
- 环境配置占位

## 6. 数据库环境说明

数据库：

```text
PostgreSQL
```

连接方式：

```text
DATABASE_URL=postgresql://yinghai:yinghai_dev_password@localhost:5432/yinghai_dev
```

Migration 工具：

```text
node-pg-migrate
```

Migration 命令：

```bash
pnpm db:migrate:create <migration-name>
pnpm db:migrate:up
pnpm db:migrate:down
pnpm db:migrate:status
```

限制：

- Sprint 0 未创建任何业务表。
- 后续创建业务表必须以数据库设计文档和 Sprint 任务为依据。

## 7. API 环境说明

API Server：

```text
apps/api-server
```

全局 API 前缀：

```text
/api/v1
```

三端 API 命名空间：

```text
/api/v1/app
/api/v1/admin
/api/v1/mobile-admin
```

健康检查：

```text
GET /api/v1/health
```

Swagger：

```text
http://localhost:3001/api-docs
```

限制：

- 当前只提供健康检查。
- 未创建用户、商品、订单、支付、分销等业务接口。

## 8. CI/CD 说明

CI 文件：

```text
.github/workflows/ci.yml
```

触发规则：

- Pull Request 到 `main` 或 `develop`
- Push 到 `main` 或 `develop`

CI 步骤：

1. Checkout
2. Setup pnpm
3. Setup Node.js
4. Install dependencies
5. TypeScript check
6. Lint check
7. Build check
8. Test placeholder

限制：

- 不包含生产环境自动部署。
- 不包含服务器配置修改。

## 9. 已完成任务清单

- SYS-001：Monorepo 初始化
- SYS-002：Git 规范初始化
- SYS-003：Docker 环境初始化
- DB-001：数据库 Migration 框架初始化
- API-001：NestJS 后端基础框架初始化
- MINI-001：微信小程序用户端骨架初始化
- ADMIN-001：PC/iPad H5 后台骨架初始化
- MOBILE-ADMIN-001：手机 H5 工作台骨架初始化
- CI-001：CI/CD 初始化
- DOC-001：Sprint 0 文档交付

## 10. Sprint 1 进入条件说明

进入 Sprint 1 前应确认：

1. Sprint 0 所有任务验收通过。
2. 本地依赖安装成功。
3. Docker 中 PostgreSQL 与 Redis 可启动。
4. API Server 可启动并访问 `/api/v1/health`。
5. Swagger 可访问。
6. 小程序、PC/iPad H5 后台、手机 H5 工作台骨架可启动。
7. Git 分支规范与 Commit 规范已被团队确认。
8. Sprint 1 的用户体系开发范围已确认。
9. 用户体系涉及的数据表、接口、页面流程已从设计文档或 Sprint 任务中明确。
10. 未经确认，不进入商品、订单、支付、会员、积分、分销、供应链等后续业务模块。

