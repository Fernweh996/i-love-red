# 基金管理 V2 迭代优化设计

## 日期
2026-03-25

## 概述
对基金管理应用进行全面优化迭代，包括布局重构、新增自选功能、导入流程优化、体验提升。

---

## 一、整体布局重构

### 顶部区域（AppShell 层级，所有 Tab 共享）
- 常驻搜索栏入口（点击弹出全屏搜索浮层）
- 大盘指数条：上证指数(sh000001)、深证成指(sz399001)、创业板指(sz399006)
- 指数数据复用已有 Tencent `qt.gtimg.cn` 股票实时接口
- 搜索栏和指数条在持有、自选两个 Tab 页面都可见

### 底部 TabBar
- 两个 Tab：`📊 持有`(`/portfolio`) / `⭐ 自选`(`/watchlist`)
- 去掉原有的"搜索"和"导入" Tab
- `/fund/:code` 和 `/import` 路由下隐藏 TabBar

### 搜索流程
1. 点击顶部搜索栏 → 弹出全屏搜索浮层（覆盖当前页面）
2. 输入关键词 → 实时下拉结果（复用现有 useFundSearch hook）
3. 点击基金 → 关闭搜索浮层，导航到 `/fund/:code`
4. 详情页底部操作：`[加自选]` `[加持仓]` `[返回]`
5. "返回"回到上一页（不会重新打开搜索浮层）

---

## 二、自选功能（新增）

### 数据模型
```ts
interface WatchItem {
  fundCode: string;
  fundName: string;
  fundType?: string;
  addTime: number;    // 添加时间戳
}
```

### Store: `stores/watchlist.ts`
- persist key: `'fund-manager-watchlist'`
- `items: WatchItem[]` — 自选列表
- `addItem(fundCode, fundName, fundType?)` — 加自选
- `removeItem(fundCode)` — 移除自选
- `isWatching(fundCode)` — 是否已自选
- 使用 zustand persist 持久化

### 自选页面
- 简洁看板风格：基金名称 / 当日涨跌% / 最新净值
- 左滑可移除（复用 PositionCard 已有的 touch 手势实现：touchStart/touchMove/touchEnd + translateX）
- 点击进入基金详情页
- 空状态引导："去搜索添加你关注的基金"

### 估值数据架构
- `useFundEstimate` 提升到 `AppShell` 层级调用，避免持有/自选两个页面各自轮询
- hook 内合并 portfolio positions + watchlist items 的 fundCode，去重后批量请求
- 两个页面都从 `fund-cache` store 读取 estimates 数据

---

## 三、导入入口调整

- 去掉底部 TabBar 的"导入" Tab
- Dashboard 持仓列表底部区域改为两个按钮：
  - `[+ 添加持仓]` — 打开搜索浮层
  - `[📷 截图导入]` — 跳转导入页，URL 携带当前分组：`/import?group={activeGroupId}`
  - "全部" tab 下导入按钮使用 `default` 分组

### 导入页改造
- 用 `useSearchParams` 读取 `group` 参数
- 页面顶部显示目标分组标签（只读），如 "导入到：💰 理财通"
- 导入确认时使用 URL 中的 groupId 传给 `addPosition`
- 识别结果支持：逐条删除、手动编辑字段（已有功能确认保留）
- 隐藏底部 TabBar（AppShell 中 `/import` 路由不显示 TabBar）

---

## 四、基金详情页改造

### 底部操作栏
```
[⭐ 加自选/已自选]  [✏️ 加持仓/修改持仓]  [🏠 返回持仓]
```
- 已自选状态：显示"已自选"（高亮黄色），点击可取消自选
- 加持仓弹窗中包含分组选择器（提取为共享组件 `GroupSelector.tsx`，Search 页和 FundDetail 页复用）
- 如果已持仓，显示"修改持仓"
- 如果有持仓，保留现有的"删除持仓"按钮

---

## 五、体验优化

### 1. Toast 提示
- 全局 Toast 组件，底部上滑显示，2秒自动消失
- 新 Toast 替换当前 Toast（不排队）
- 触发场景：添加/删除持仓、加自选/移除自选、截图导入成功

Store 接口：
```ts
interface ToastState {
  message: string | null;
  show: (message: string) => void;
  hide: () => void;
}
```

组件挂载在 AppShell 中，全局可用。

### 2. 分组切换动画
- 切换 activeGroupId 时，列表区域淡入淡出
- CSS transition：opacity 0→1 + translateY 8px→0（150ms ease-out）
- 用 key={activeGroupId} 触发 React 重新挂载 + CSS animation

### 3. 下拉刷新
- Dashboard 和自选页支持下拉刷新手势
- 触发 AppShell 层的 `useFundEstimate` refresh
- 实现参数：下拉阈值 60px，松手后显示旋转加载图标，刷新完成后回弹
- 纯 CSS + touch 事件实现，不引入第三方库
- 注意：与左滑删除不冲突（下拉是纵向手势，左滑是横向手势）

### 4. 大盘指数条

#### `useMarketIndex` hook
- 调用现有 `/api/stock/realtime?codes=sh000001,sz399001,sz399006`
- 交易时间内 30 秒轮询，非交易时间 5 分钟轮询
- 返回 `{ indices: StockQuote[], loading: boolean, error: string | null }`

#### `MarketIndexBar` 组件
- 一行三列显示：指数名称 + 点位 + 涨跌幅%
- loading 时显示 `--` 占位
- 请求失败时静默隐藏（不阻塞页面）

---

## 六、Bug 修复

- `ProfitSummary`：分组过滤时标题显示分组名（如"💰 理财通资产"）而非固定的"账户资产"
- "全部" 时仍显示"账户资产"

---

## 修改文件清单

| # | 文件 | 改动 |
|---|------|------|
| 1 | `types/index.ts` | 新增 WatchItem 类型 |
| 2 | `stores/watchlist.ts` | **新建** 自选 store（persist key: `fund-manager-watchlist`） |
| 3 | `stores/toast.ts` | **新建** Toast store |
| 4 | `hooks/useFundEstimate.ts` | 合并自选+持仓 fundCode 去重请求；提升到 AppShell 调用 |
| 5 | `hooks/useMarketIndex.ts` | **新建** 大盘指数 hook（30s/5min 轮询） |
| 6 | `components/shared/Toast.tsx` | **新建** 全局 Toast 组件 |
| 7 | `components/shared/SearchOverlay.tsx` | **新建** 全屏搜索浮层 |
| 8 | `components/shared/MarketIndexBar.tsx` | **新建** 大盘指数条 |
| 9 | `components/shared/PullToRefresh.tsx` | **新建** 下拉刷新容器（阈值 60px） |
| 10 | `components/shared/GroupSelector.tsx` | **新建** 分组选择器（Search + FundDetail 共用） |
| 11 | `components/layout/AppShell.tsx` | 添加搜索栏 + MarketIndexBar + Toast + useFundEstimate 提升；隐藏 /import 的 TabBar |
| 12 | `components/layout/Header.tsx` | 删除（死代码），搜索栏入口直接放 AppShell |
| 13 | `components/layout/TabBar.tsx` | 改为两个 Tab（持有/自选） |
| 14 | `components/portfolio/Dashboard.tsx` | 分组切换动画、下拉刷新、底部按钮改为"添加持仓"+"截图导入" |
| 15 | `components/portfolio/ProfitSummary.tsx` | 标题适配分组名 |
| 16 | `pages/Watchlist.tsx` | **新建** 自选页面（简洁看板 + 左滑删除） |
| 17 | `pages/FundDetail.tsx` | 底部栏加"加自选"按钮 + 加持仓弹窗加分组选择器 |
| 18 | `pages/Search.tsx` | 移除（搜索逻辑迁移到 SearchOverlay） |
| 19 | `pages/Import.tsx` | 读取 URL groupId 参数 + 显示目标分组标签 |
| 20 | `App.tsx` | 路由调整：加 /watchlist，去掉 /search |
