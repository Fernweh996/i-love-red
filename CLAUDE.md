# CLAUDE.md

## Project

fund-manager — 基金持仓管理工具，monorepo（client + server）。

- **Client**: React + TypeScript + Vite + Tailwind CSS，路径别名 `@/`
- **Server**: Express + TypeScript，数据源 eastmoney API

## Commands

- `npm run dev` — 启动 client + server（concurrently）
- `npx tsc --noEmit` — 分别在 client/ 或 server/ 下做类型检查
- `npm run build` — 构建 client + server

## Verification Strategy

分级验证，避免过度消耗 token：

| 改动类型 | 验证方式 |
|---------|---------|
| 文案/样式 | `tsc --noEmit` 编译通过即可 |
| 新组件/新页面 | `tsc --noEmit` 编译通过即可 |
| 数据流/API/逻辑改动 | 编译 + 实际调用 API 验证返回数据 |
| 一个完整功能交付时 | 全链路验证一次（编译 + 调 API + 确认关键路径） |

原则：**编译检查每次都做，运行验证留给关键节点。**

## Mini Program (WeChat)

- **Mini**: Taro 4.x + React + TypeScript + SCSS，路径别名 `@/`
- **Shared**: 共享类型和工具函数，`@fund-manager/shared`

### Commands

- `npm run dev:mini` — 启动 Taro 微信小程序开发模式
- `npm run build:mini` — 构建微信小程序产物到 `mini/dist/`

### 项目结构

- `shared/types/` — 平台无关的 TypeScript 接口
- `shared/utils/` — 平台无关的纯函数工具
- `mini/src/pages/` — 小程序页面（9 个）
- `mini/src/styles/variables.scss` — 色彩 token（muted & postal 风格）
