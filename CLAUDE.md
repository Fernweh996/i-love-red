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
