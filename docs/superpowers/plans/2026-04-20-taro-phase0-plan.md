# Phase 0: Taro 小程序脚手架 + 共享层提取

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 创建 Taro 小程序项目骨架和共享代码层，使 `mini/` 能编译并在微信开发者工具中运行空白页，且能从 `shared/` 导入类型和工具函数。

**Architecture:** 在现有 monorepo 中新增 `shared/`（平台无关的类型和纯函数）和 `mini/`（Taro 小程序），通过 npm workspaces 连接。`client/` 和 `server/` 保持不动。

**Tech Stack:** Taro 4.x (React), TypeScript, SCSS, npm workspaces

---

### Task 1: 创建 shared 包 — 类型定义

**Files:**
- Create: `shared/package.json`
- Create: `shared/tsconfig.json`
- Create: `shared/types/index.ts`
- Modify: `package.json` (根 monorepo)

- [ ] **Step 1: 创建 `shared/package.json`**

```json
{
  "name": "@fund-manager/shared",
  "version": "1.0.0",
  "private": true,
  "main": "index.ts",
  "types": "index.ts"
}
```

- [ ] **Step 2: 创建 `shared/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "declaration": true,
    "outDir": "dist",
    "rootDir": ".",
    "skipLibCheck": true
  },
  "include": ["types", "utils"]
}
```

- [ ] **Step 3: 创建 `shared/types/index.ts`**

从 `client/src/types/index.ts` 原样复制全部接口。内容完全一致：

```typescript
// 基金基本信息
export interface FundInfo {
  code: string;
  name: string;
  type: string;
  pinyin: string;
}

// 基金实时估值
export interface FundEstimate {
  code: string;
  name: string;
  estimateNav: number;
  estimateChange: number;
  estimateTime: string;
  lastNav: number;
  lastNavDate: string;
  navSource: 'estimate' | 'confirmed';
  confirmedNav?: number;
  confirmedChange?: number;
  confirmedDate?: string;
}

// 历史净值记录
export interface NavRecord {
  date: string;
  nav: number;
  accNav: number;
  changeRate: number;
}

// 持仓股票
export interface HoldingStock {
  code: string;
  name: string;
  proportion: number;
  shares: number;
  marketValue: number;
}

// 实时股价
export interface StockQuote {
  code: string;
  name: string;
  price: number;
  change: number;
  changeRate: number;
  open: number;
  prevClose: number;
  high: number;
  low: number;
  volume: number;
  amount: number;
}

// 持仓分组
export interface Group {
  id: string;
  name: string;
  icon: string;
  order: number;
  isPreset: boolean;
}

// 用户持仓
export interface Position {
  fundCode: string;
  fundName: string;
  fundType?: string;
  shares: number;
  costNav: number;
  totalCost: number;
  createTime: number;
  updateTime: number;
  groupId: string;
}

// 持仓盈亏计算结果
export interface PositionPnL {
  position: Position;
  currentNav: number;
  marketValue: number;
  profit: number;
  profitRate: number;
  todayChange: number;
  todayChangeRate: number;
  estimate?: FundEstimate;
  weekProfit?: number;
}

// 截图识别的基金信息
export interface ParsedFund {
  fundCode: string;
  fundName: string;
  shares?: number;
  costNav?: number;
  marketValue?: number;
  confirmed: boolean;
}

// 自选基金
export interface WatchItem {
  fundCode: string;
  fundName: string;
  fundType?: string;
  addTime: number;
  groupId: string;
}
```

- [ ] **Step 4: 更新根 `package.json` 添加 shared workspace**

在 `workspaces` 数组中添加 `"shared"`：

```json
{
  "workspaces": [
    "server",
    "client",
    "shared"
  ]
}
```

- [ ] **Step 5: Commit**

```bash
cd /Users/freya/Desktop/yyn-ais/fund-manager
git add shared/ package.json
git commit -m "feat: create shared package with type definitions"
```

---

### Task 2: 创建 shared 包 — 工具函数

**Files:**
- Create: `shared/utils/format.ts`
- Create: `shared/utils/market.ts`
- Create: `shared/utils/nav.ts`
- Create: `shared/utils/calc.ts`
- Create: `shared/utils/index.ts`
- Create: `shared/index.ts`

- [ ] **Step 1: 创建 `shared/utils/format.ts`**

```typescript
/**
 * 格式化数字为金额
 */
export function formatCurrency(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 10000) {
    return `${(value / 10000).toFixed(2)}万`;
  }
  return value.toFixed(2);
}

/**
 * 格式化百分比
 */
export function formatPercent(value: number): string {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

/**
 * 格式化净值
 */
export function formatNav(value: number): string {
  return value.toFixed(4);
}

/**
 * 涨跌方向判断（平台无关，返回 'rise' | 'fall' | 'flat'）
 */
export function priceDirection(change: number): 'rise' | 'fall' | 'flat' {
  if (change > 0) return 'rise';
  if (change < 0) return 'fall';
  return 'flat';
}
```

- [ ] **Step 2: 创建 `shared/utils/market.ts`**

```typescript
/**
 * 判断当前是否为交易时间 (中国股市)
 */
export function isTradingTime(): boolean {
  const now = new Date();
  const hour = now.getHours();
  const minute = now.getMinutes();
  const day = now.getDay();

  if (day === 0 || day === 6) return false;

  const time = hour * 100 + minute;
  return (time >= 930 && time <= 1130) || (time >= 1300 && time <= 1500);
}

/**
 * 获取轮询间隔
 */
export function getPollingInterval(hasConfirmedNav?: boolean): number {
  if (isTradingTime()) return 30000;
  if (hasConfirmedNav === false) return 120000;
  return 300000;
}
```

- [ ] **Step 3: 创建 `shared/utils/nav.ts`**

```typescript
import type { FundEstimate } from '../types';

/**
 * 获取当前最优净值（确认优先，不含盘中估算）
 */
export function getCurrentNav(
  estimate: FundEstimate | undefined,
  fallback: number
): number {
  if (!estimate) return fallback;
  if (estimate.confirmedNav) return estimate.confirmedNav;
  if (estimate.lastNav) return estimate.lastNav;
  return fallback;
}

/**
 * 获取实时净值（含盘中估算）
 */
export function getRealtimeNav(
  estimate: FundEstimate | undefined,
  fallback: number
): number {
  if (!estimate) return fallback;
  if (estimate.confirmedNav) return estimate.confirmedNav;
  if (estimate.estimateNav) return estimate.estimateNav;
  if (estimate.lastNav) return estimate.lastNav;
  return fallback;
}

/**
 * 获取当前最优涨跌幅
 */
export function getCurrentChangeRate(
  estimate: FundEstimate | undefined
): number {
  if (!estimate) return 0;
  if (estimate.navSource === 'confirmed' && estimate.confirmedChange !== undefined) {
    return estimate.confirmedChange;
  }
  return estimate.estimateChange || 0;
}
```

- [ ] **Step 4: 创建 `shared/utils/calc.ts`**

```typescript
/**
 * 计算加权平均成本
 */
export function calcWeightedCost(
  existingShares: number,
  existingCost: number,
  newShares: number,
  newCostNav: number
): { shares: number; costNav: number; totalCost: number } {
  const totalShares = existingShares + newShares;
  const totalCost = existingShares * existingCost + newShares * newCostNav;
  return {
    shares: totalShares,
    costNav: totalShares > 0 ? totalCost / totalShares : 0,
    totalCost,
  };
}
```

- [ ] **Step 5: 创建 `shared/utils/index.ts` 统一导出**

```typescript
export { formatCurrency, formatPercent, formatNav, priceDirection } from './format';
export { isTradingTime, getPollingInterval } from './market';
export { getCurrentNav, getRealtimeNav, getCurrentChangeRate } from './nav';
export { calcWeightedCost } from './calc';
```

- [ ] **Step 6: 创建 `shared/index.ts` 包入口**

```typescript
export * from './types';
export * from './utils';
```

- [ ] **Step 7: 验证 shared 包 TypeScript 编译**

Run: `cd /Users/freya/Desktop/yyn-ais/fund-manager/shared && npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 8: Commit**

```bash
cd /Users/freya/Desktop/yyn-ais/fund-manager
git add shared/
git commit -m "feat: add shared utility functions (format, market, nav, calc)"
```

---

### Task 3: 初始化 Taro 项目

**Files:**
- Create: `mini/` 目录（通过 Taro CLI）
- Modify: `package.json` (根 monorepo)

- [ ] **Step 1: 安装 Taro CLI 并初始化项目**

```bash
cd /Users/freya/Desktop/yyn-ais/fund-manager
npx @tarojs/cli@latest init mini --template=default --framework=react --typescript --css=sass
```

如果交互式提示选择：
- 请输入项目名称: `mini`
- 请选择框架: `React`
- 请选择 CSS 预处理器: `Sass`
- 请选择模板: `默认模板`
- 请选择包管理工具: `npm`

- [ ] **Step 2: 更新根 `package.json` 添加 mini workspace**

```json
{
  "workspaces": [
    "server",
    "client",
    "shared",
    "mini"
  ]
}
```

添加 dev 和 build 脚本：

```json
{
  "scripts": {
    "start": "node server/dist/index.js",
    "dev": "concurrently \"npm run dev:server\" \"npm run dev:client\"",
    "dev:server": "npm run dev -w server",
    "dev:client": "npm run dev -w client",
    "dev:mini": "npm run dev:weapp -w mini",
    "build": "npm run build -w client && npm run build -w server",
    "build:mini": "npm run build:weapp -w mini"
  }
}
```

- [ ] **Step 3: 在 mini/package.json 中添加 shared 依赖**

在 `mini/package.json` 的 `dependencies` 中添加：

```json
{
  "dependencies": {
    "@fund-manager/shared": "*"
  }
}
```

然后运行：
```bash
cd /Users/freya/Desktop/yyn-ais/fund-manager
npm install
```

- [ ] **Step 4: Commit**

```bash
cd /Users/freya/Desktop/yyn-ais/fund-manager
git add mini/ package.json
git commit -m "feat: scaffold Taro mini program project"
```

---

### Task 4: 配置 Taro 项目 — 路径别名 + 编译选项

**Files:**
- Modify: `mini/config/index.ts` (or `mini/config/index.js`)
- Modify: `mini/tsconfig.json`
- Modify: `mini/project.config.json`

- [ ] **Step 1: 配置路径别名**

在 `mini/config/index.ts` 的 `config` 对象中添加 `alias`：

```typescript
alias: {
  '@': path.resolve(__dirname, '..', 'src'),
  '@shared': path.resolve(__dirname, '..', '..', 'shared'),
},
```

需要在文件顶部确保 `import path from 'path'` 存在。

- [ ] **Step 2: 配置 tsconfig 路径映射**

在 `mini/tsconfig.json` 的 `compilerOptions` 中添加：

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"],
      "@shared/*": ["../shared/*"],
      "@fund-manager/shared": ["../shared"]
    }
  }
}
```

- [ ] **Step 3: 配置 project.config.json**

在 `mini/project.config.json` 中设置：

```json
{
  "miniprogramRoot": "./dist",
  "projectname": "fund-manager-mini",
  "description": "基金持仓管理工具",
  "appid": "touristappid",
  "setting": {
    "urlCheck": false,
    "es6": true,
    "enhance": true,
    "postcss": true,
    "minified": true
  }
}
```

注意：`appid` 先用 `"touristappid"` 作为游客模式开发，正式发布时替换为真实 AppID。

- [ ] **Step 4: Commit**

```bash
cd /Users/freya/Desktop/yyn-ais/fund-manager
git add mini/
git commit -m "feat: configure Taro aliases, tsconfig paths, and project config"
```

---

### Task 5: 配置 app.config.ts 路由和 tabBar

**Files:**
- Modify: `mini/src/app.config.ts`

- [ ] **Step 1: 替换 `mini/src/app.config.ts` 内容**

```typescript
export default defineAppConfig({
  pages: [
    'pages/portfolio/index',
    'pages/watchlist/index',
    'pages/fund-detail/index',
    'pages/position-edit/index',
    'pages/fund-history/index',
    'pages/group-manager/index',
    'pages/settings/index',
    'pages/search/index',
    'pages/import/index',
  ],
  tabBar: {
    color: '#B8BBC4',
    selectedColor: '#6B84B0',
    backgroundColor: '#FFFFFF',
    borderStyle: 'white',
    list: [
      {
        pagePath: 'pages/portfolio/index',
        text: '持有',
      },
      {
        pagePath: 'pages/watchlist/index',
        text: '自选',
      },
    ],
  },
  window: {
    navigationBarTitleText: '基金管家',
    navigationBarBackgroundColor: '#FFFFFF',
    navigationBarTextStyle: 'black',
    backgroundColor: '#F0F1F4',
    backgroundTextStyle: 'dark',
  },
})
```

注意：tabBar 图标后续在 Phase 2 添加，先不配 `iconPath`/`selectedIconPath`（Taro 允许不配图标先跑起来）。

- [ ] **Step 2: Commit**

```bash
cd /Users/freya/Desktop/yyn-ais/fund-manager
git add mini/src/app.config.ts
git commit -m "feat: configure mini program routing and tabBar"
```

---

### Task 6: 创建空白页面骨架

**Files:**
- Create: `mini/src/pages/portfolio/index.tsx`
- Create: `mini/src/pages/portfolio/index.config.ts`
- Create: `mini/src/pages/watchlist/index.tsx`
- Create: `mini/src/pages/watchlist/index.config.ts`
- Create: `mini/src/pages/fund-detail/index.tsx`
- Create: `mini/src/pages/fund-detail/index.config.ts`
- Create: `mini/src/pages/position-edit/index.tsx`
- Create: `mini/src/pages/position-edit/index.config.ts`
- Create: `mini/src/pages/fund-history/index.tsx`
- Create: `mini/src/pages/fund-history/index.config.ts`
- Create: `mini/src/pages/group-manager/index.tsx`
- Create: `mini/src/pages/group-manager/index.config.ts`
- Create: `mini/src/pages/settings/index.tsx`
- Create: `mini/src/pages/settings/index.config.ts`
- Create: `mini/src/pages/search/index.tsx`
- Create: `mini/src/pages/search/index.config.ts`
- Create: `mini/src/pages/import/index.tsx`
- Create: `mini/src/pages/import/index.config.ts`
- Remove: `mini/src/pages/index/` (Taro 默认生成的首页)

- [ ] **Step 1: 删除 Taro 默认生成的首页**

```bash
rm -rf /Users/freya/Desktop/yyn-ais/fund-manager/mini/src/pages/index
```

- [ ] **Step 2: 创建 portfolio 页面**

`mini/src/pages/portfolio/index.config.ts`:
```typescript
export default definePageConfig({
  navigationBarTitleText: '持有',
  enablePullDownRefresh: true,
})
```

`mini/src/pages/portfolio/index.tsx`:
```tsx
import { View, Text } from '@tarojs/components'
import { formatCurrency } from '@fund-manager/shared'

export default function Portfolio() {
  // 验证 shared 包导入正常
  const testValue = formatCurrency(12345.67)

  return (
    <View style={{ padding: '40px 20px', textAlign: 'center' }}>
      <Text style={{ fontSize: '18px', color: '#2C2F36' }}>持有页面</Text>
      <View style={{ marginTop: '12px' }}>
        <Text style={{ fontSize: '14px', color: '#9498A3' }}>shared 包测试: {testValue}</Text>
      </View>
    </View>
  )
}
```

- [ ] **Step 3: 创建 watchlist 页面**

`mini/src/pages/watchlist/index.config.ts`:
```typescript
export default definePageConfig({
  navigationBarTitleText: '自选',
  enablePullDownRefresh: true,
})
```

`mini/src/pages/watchlist/index.tsx`:
```tsx
import { View, Text } from '@tarojs/components'

export default function Watchlist() {
  return (
    <View style={{ padding: '40px 20px', textAlign: 'center' }}>
      <Text style={{ fontSize: '18px', color: '#2C2F36' }}>自选页面</Text>
    </View>
  )
}
```

- [ ] **Step 4: 创建 fund-detail 页面**

`mini/src/pages/fund-detail/index.config.ts`:
```typescript
export default definePageConfig({
  navigationBarTitleText: '基金详情',
})
```

`mini/src/pages/fund-detail/index.tsx`:
```tsx
import { View, Text } from '@tarojs/components'
import { getCurrentInstance } from '@tarojs/taro'

export default function FundDetail() {
  const { code, group } = getCurrentInstance().router?.params || {}

  return (
    <View style={{ padding: '40px 20px', textAlign: 'center' }}>
      <Text style={{ fontSize: '18px', color: '#2C2F36' }}>基金详情</Text>
      <View style={{ marginTop: '12px' }}>
        <Text style={{ fontSize: '14px', color: '#9498A3' }}>code: {code || '—'} / group: {group || '—'}</Text>
      </View>
    </View>
  )
}
```

- [ ] **Step 5: 创建剩余 6 个空白页面**

每个页面遵循相同模式。创建以下文件对：

`mini/src/pages/position-edit/index.config.ts`:
```typescript
export default definePageConfig({ navigationBarTitleText: '编辑持仓' })
```
`mini/src/pages/position-edit/index.tsx`:
```tsx
import { View, Text } from '@tarojs/components'
export default function PositionEdit() {
  return <View style={{ padding: '40px 20px', textAlign: 'center' }}><Text>编辑持仓</Text></View>
}
```

`mini/src/pages/fund-history/index.config.ts`:
```typescript
export default definePageConfig({ navigationBarTitleText: '历史净值' })
```
`mini/src/pages/fund-history/index.tsx`:
```tsx
import { View, Text } from '@tarojs/components'
export default function FundHistory() {
  return <View style={{ padding: '40px 20px', textAlign: 'center' }}><Text>历史净值</Text></View>
}
```

`mini/src/pages/group-manager/index.config.ts`:
```typescript
export default definePageConfig({ navigationBarTitleText: '分组管理' })
```
`mini/src/pages/group-manager/index.tsx`:
```tsx
import { View, Text } from '@tarojs/components'
export default function GroupManager() {
  return <View style={{ padding: '40px 20px', textAlign: 'center' }}><Text>分组管理</Text></View>
}
```

`mini/src/pages/settings/index.config.ts`:
```typescript
export default definePageConfig({ navigationBarTitleText: '设置' })
```
`mini/src/pages/settings/index.tsx`:
```tsx
import { View, Text } from '@tarojs/components'
export default function Settings() {
  return <View style={{ padding: '40px 20px', textAlign: 'center' }}><Text>设置</Text></View>
}
```

`mini/src/pages/search/index.config.ts`:
```typescript
export default definePageConfig({ navigationBarTitleText: '搜索基金' })
```
`mini/src/pages/search/index.tsx`:
```tsx
import { View, Text } from '@tarojs/components'
export default function Search() {
  return <View style={{ padding: '40px 20px', textAlign: 'center' }}><Text>搜索基金</Text></View>
}
```

`mini/src/pages/import/index.config.ts`:
```typescript
export default definePageConfig({ navigationBarTitleText: '截图导入' })
```
`mini/src/pages/import/index.tsx`:
```tsx
import { View, Text } from '@tarojs/components'
export default function Import() {
  return <View style={{ padding: '40px 20px', textAlign: 'center' }}><Text>截图导入</Text></View>
}
```

- [ ] **Step 6: Commit**

```bash
cd /Users/freya/Desktop/yyn-ais/fund-manager
git add mini/src/pages/
git commit -m "feat: create all mini program page skeletons (9 pages)"
```

---

### Task 7: 创建样式基础 — 色彩 token + 全局样式

**Files:**
- Create: `mini/src/styles/variables.scss`
- Modify: `mini/src/app.scss` (or `mini/src/app.css`)

- [ ] **Step 1: 创建 `mini/src/styles/variables.scss`**

```scss
// Color tokens — matches client's muted & postal palette
$rise: #D94030;
$fall: #2E8B57;
$flat: #9498A3;

$ink: #2C2F36;
$ink-secondary: #9498A3;
$ink-faint: #B8BBC4;

$surface: #FFFFFF;
$surface-bg: #F0F1F4;

$accent: #6B84B0;

$border: #DCDFE5;
$border-light: #F0F1F4;

$search-bg: #E4E6EB;

// Badge colors
$badge-confirmed-text: #2E8B57;
$badge-confirmed-bg: #EBF5EF;
$badge-estimate-text: #A67B20;
$badge-estimate-bg: #FAF5E6;
```

- [ ] **Step 2: 更新 `mini/src/app.scss`**

替换默认内容为：

```scss
@import './styles/variables.scss';

page {
  background-color: $surface-bg;
  font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
  color: $ink;
  font-size: 28px; // 28rpx = 14px at 750 design width
  line-height: 1.5;
}
```

- [ ] **Step 3: Commit**

```bash
cd /Users/freya/Desktop/yyn-ais/fund-manager
git add mini/src/styles/ mini/src/app.scss
git commit -m "feat: add color token variables and global styles"
```

---

### Task 8: 编译验证 + .gitignore

**Files:**
- Create: `mini/.gitignore`

- [ ] **Step 1: 创建 `mini/.gitignore`**

```
node_modules/
dist/
.swc/
```

- [ ] **Step 2: 安装依赖并编译**

```bash
cd /Users/freya/Desktop/yyn-ais/fund-manager
npm install
cd mini
npm run build:weapp
```

Expected: 编译成功，`mini/dist/` 目录生成小程序产物。

如果报错 `Cannot find module '@fund-manager/shared'`，需要检查 `mini/config/index.ts` 中的 alias 配置和 `tsconfig.json` 中的 paths 配置。

- [ ] **Step 3: 验证 shared 包导入**

编译成功后，在 `mini/dist/pages/portfolio/index.js` 中搜索 `formatCurrency` 相关代码，确认 shared 包的函数被正确打包进来。

Run: `grep -l "formatCurrency\|12345" mini/dist/pages/portfolio/index.js`
Expected: 找到匹配（函数被内联或引用）。

- [ ] **Step 4: Commit**

```bash
cd /Users/freya/Desktop/yyn-ais/fund-manager
git add mini/.gitignore
git commit -m "feat: verify mini program builds successfully, add gitignore"
```

---

### Task 9: 更新 CLAUDE.md 和最终验证

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: 更新 CLAUDE.md 添加 mini 项目信息**

在 CLAUDE.md 末尾追加：

```markdown

## Mini Program (WeChat)

- **Mini**: Taro 4.x + React + TypeScript + SCSS, 路径别名 `@/`
- **Shared**: 共享类型和工具函数，`@fund-manager/shared`

### Commands

- `npm run dev:mini` — 启动 Taro 微信小程序开发模式
- `npm run build:mini` — 构建微信小程序产物到 `mini/dist/`

### 项目结构

- `shared/types/` — 平台无关的 TypeScript 接口
- `shared/utils/` — 平台无关的纯函数工具
- `mini/src/pages/` — 小程序页面（9 个）
- `mini/src/styles/variables.scss` — 色彩 token（muted & postal 风格）
```

- [ ] **Step 2: 最终全量验证**

```bash
cd /Users/freya/Desktop/yyn-ais/fund-manager

# 验证 client 没被破坏
cd client && npx tsc --noEmit && cd ..

# 验证 server 没被破坏
cd server && npx tsc --noEmit && cd ..

# 验证 shared 编译
cd shared && npx tsc --noEmit && cd ..

# 验证 mini 编译
cd mini && npm run build:weapp && cd ..
```

Expected: 全部通过，无报错。

- [ ] **Step 3: Commit**

```bash
cd /Users/freya/Desktop/yyn-ais/fund-manager
git add CLAUDE.md
git commit -m "docs: update CLAUDE.md with mini program project info"
```
