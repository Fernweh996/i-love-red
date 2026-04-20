# Fund Manager — Muted & Postal UI Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate the fund-manager UI from its current black/white/flat style to a "muted & postal" aesthetic with cool gray surfaces, a blue accent, and classic red/green financials.

**Architecture:** Pure visual token swap — update Tailwind config color tokens (propagates to most components automatically), then update individual components that need new classes (accent color, border tokens). No layout, logic, or API changes.

**Tech Stack:** Tailwind CSS 3.4, React 18, TypeScript

---

### Task 1: Update Tailwind color tokens and global CSS

**Files:**
- Modify: `client/tailwind.config.js`
- Modify: `client/src/index.css`

This is the foundation — most components reference Tailwind tokens (`text-ink`, `bg-surface`, `text-rise`, `text-fall`), so changing the config propagates automatically.

- [ ] **Step 1: Update `client/tailwind.config.js` with new color palette and tokens**

Replace the entire `colors` object in `theme.extend`:

```js
colors: {
  rise: '#D94030',
  fall: '#2E8B57',
  flat: '#9498A3',
  ink: {
    DEFAULT: '#2C2F36',
    secondary: '#9498A3',
    faint: '#B8BBC4',
  },
  surface: {
    DEFAULT: '#FFFFFF',
    bg: '#F0F1F4',
  },
  accent: '#6B84B0',
  border: {
    DEFAULT: '#DCDFE5',
    light: '#F0F1F4',
  },
  'search-bg': '#E4E6EB',
},
```

- [ ] **Step 2: Update `client/src/index.css` body background**

Change `background-color: #FAFAFA;` to `background-color: #F0F1F4;` in the `body` rule.

- [ ] **Step 3: Run type check**

Run: `cd /Users/freya/Desktop/yyn-ais/fund-manager/client && npx tsc --noEmit`
Expected: No errors (config-only change).

- [ ] **Step 4: Commit**

```bash
cd /Users/freya/Desktop/yyn-ais/fund-manager
git add client/tailwind.config.js client/src/index.css
git commit -m "style: update color tokens to muted & postal palette"
```

---

### Task 2: Update TabBar with accent color

**Files:**
- Modify: `client/src/components/layout/TabBar.tsx`

- [ ] **Step 1: Update active tab color from `text-ink` to `text-accent`**

In `TabBar.tsx`, find:
```tsx
isActive ? 'text-ink' : 'text-ink-faint'
```
Replace with:
```tsx
isActive ? 'text-accent' : 'text-ink-faint'
```

- [ ] **Step 2: Add top border to the nav container**

Find:
```tsx
<nav className="fixed bottom-0 left-0 right-0 bg-surface/90 backdrop-blur-lg z-50 safe-bottom">
```
Replace with:
```tsx
<nav className="fixed bottom-0 left-0 right-0 bg-surface/95 backdrop-blur-lg z-50 safe-bottom border-t border-border">
```

- [ ] **Step 3: Commit**

```bash
git add client/src/components/layout/TabBar.tsx
git commit -m "style: update TabBar to use accent color and border"
```

---

### Task 3: Update AppShell search bar

**Files:**
- Modify: `client/src/components/layout/AppShell.tsx`

- [ ] **Step 1: Update search bar background**

In `AppShell.tsx`, find:
```tsx
<div className="flex items-center bg-surface-bg rounded-lg px-4 py-2.5 cursor-pointer">
```
Replace with:
```tsx
<div className="flex items-center bg-search-bg rounded-lg px-4 py-2.5 cursor-pointer">
```

- [ ] **Step 2: Commit**

```bash
git add client/src/components/layout/AppShell.tsx
git commit -m "style: update search bar to use search-bg token"
```

---

### Task 4: Update GroupTabs with accent underline

**Files:**
- Modify: `client/src/components/portfolio/GroupTabs.tsx`

- [ ] **Step 1: Replace active tab border color from `border-ink` to `border-accent`**

In `GroupTabs.tsx`, find all instances of `border-b-2 border-ink` (there are 2 — one for "全部" button, one inside the `sortedGroups.map`):

Find (first instance, "全部" button):
```tsx
? 'text-ink font-medium border-b-2 border-ink'
```
Replace with:
```tsx
? 'text-ink font-medium border-b-2 border-accent'
```

Find (second instance, group buttons):
```tsx
? 'text-ink font-medium border-b-2 border-ink'
```
Replace with:
```tsx
? 'text-ink font-medium border-b-2 border-accent'
```

- [ ] **Step 2: Commit**

```bash
git add client/src/components/portfolio/GroupTabs.tsx
git commit -m "style: update GroupTabs to use accent underline"
```

---

### Task 5: Update ProfitSummary with accent left border

**Files:**
- Modify: `client/src/components/portfolio/ProfitSummary.tsx`

- [ ] **Step 1: Add accent left border to the container**

In `ProfitSummary.tsx`, find:
```tsx
<div className="px-6 pt-8 pb-6 bg-surface">
```
Replace with:
```tsx
<div className="px-6 pt-8 pb-6 bg-surface border-l-[3px] border-accent">
```

- [ ] **Step 2: Commit**

```bash
git add client/src/components/portfolio/ProfitSummary.tsx
git commit -m "style: add accent left border to ProfitSummary"
```

---

### Task 6: Update Dashboard action buttons and column headers

**Files:**
- Modify: `client/src/components/portfolio/Dashboard.tsx`

- [ ] **Step 1: Update action buttons from `text-ink-faint` to `text-accent`**

Find the "+ 添加" button:
```tsx
className="text-[15px] text-ink-faint tracking-label uppercase active:text-ink transition-colors"
```
Replace with:
```tsx
className="text-[15px] text-accent tracking-label uppercase active:text-ink transition-colors"
```

Find the "截图导入" button:
```tsx
className="text-[15px] text-ink-faint tracking-label uppercase active:text-ink transition-colors"
```
Replace with:
```tsx
className="text-[15px] text-accent tracking-label uppercase active:text-ink transition-colors"
```

- [ ] **Step 2: Update SortIcon active color from `text-ink` to `text-ink`**

The SortIcon already uses `text-ink` for active state and `text-ink-faint` for inactive — these will auto-update via the token change. No code change needed.

- [ ] **Step 3: Commit**

```bash
git add client/src/components/portfolio/Dashboard.tsx
git commit -m "style: update Dashboard action buttons to accent color"
```

---

### Task 7: Update MarketIndexBar background

**Files:**
- Modify: `client/src/components/shared/MarketIndexBar.tsx`

- [ ] **Step 1: Change background from `bg-surface` to `bg-surface-bg`**

Find both instances of `bg-surface` in MarketIndexBar (loading state and main render):

Find (loading state):
```tsx
<div className="flex items-center justify-between px-6 py-2 bg-surface">
```
Replace with:
```tsx
<div className="flex items-center justify-between px-6 py-2 bg-surface-bg">
```

Find (main render):
```tsx
<div className="flex items-center justify-between px-6 py-2 bg-surface">
```
Replace with:
```tsx
<div className="flex items-center justify-between px-6 py-2 bg-surface-bg">
```

- [ ] **Step 2: Commit**

```bash
git add client/src/components/shared/MarketIndexBar.tsx
git commit -m "style: update MarketIndexBar to use surface-bg background"
```

---

### Task 8: Update NavSourceBadge colors

**Files:**
- Modify: `client/src/components/shared/NavSourceBadge.tsx`

- [ ] **Step 1: Update badge colors to match new palette**

Find the confirmed badge classes:
```tsx
text-amber-600 bg-amber-50
```
Replace with:
```tsx
text-[#2E8B57] bg-[#EBF5EF]
```

Find the estimate badge classes:
```tsx
text-blue-500 bg-blue-50
```
Replace with:
```tsx
text-[#A67B20] bg-[#FAF5E6]
```

- [ ] **Step 2: Commit**

```bash
git add client/src/components/shared/NavSourceBadge.tsx
git commit -m "style: update NavSourceBadge to muted palette"
```

---

### Task 9: Update secondary pages — FundDetail page

**Files:**
- Modify: `client/src/pages/FundDetail.tsx`

- [ ] **Step 1: Replace blue gradient header with muted style**

Find:
```tsx
bg-gradient-to-b from-blue-600 to-blue-500 text-white
```
Replace with:
```tsx
bg-surface border-b border-border
```

Update all text within the header that was `text-white` to use ink tokens:
- Fund name: `text-ink` (was `text-white`)
- Fund code subtitle: `text-ink-secondary` (was `text-blue-200`)
- Stats values: `text-ink` (was `text-white`)
- Stats labels: `text-ink-secondary` (was `text-blue-200`)

- [ ] **Step 2: Replace blue action colors with accent**

Find all instances of `text-blue-600` and `text-blue-500` in this file and replace with `text-accent`.

Find all instances of `bg-blue-500` (tab underline) and replace with `bg-accent`.

- [ ] **Step 3: Replace badge colors**

Find estimate badge:
```tsx
bg-orange-100 text-orange-500
```
Replace with:
```tsx
bg-[#FAF5E6] text-[#A67B20]
```

Find confirmed badge:
```tsx
bg-green-100 text-green-600
```
Replace with:
```tsx
bg-[#EBF5EF] text-[#2E8B57]
```

- [ ] **Step 4: Replace remaining hardcoded grays**

Replace `text-gray-900` with `text-ink`.
Replace `text-gray-600` with `text-ink-secondary`.
Replace `text-gray-400` with `text-ink-faint`.
Replace `bg-white` with `bg-surface`.
Replace `bg-gray-50` with `bg-surface-bg`.

- [ ] **Step 5: Commit**

```bash
git add client/src/pages/FundDetail.tsx
git commit -m "style: update FundDetail page to muted palette"
```

---

### Task 10: Update FundHistory page

**Files:**
- Modify: `client/src/pages/FundHistory.tsx`

- [ ] **Step 1: Replace hardcoded colors**

Replace `text-gray-900` with `text-ink`.
Replace `text-gray-400` with `text-ink-faint`.
Replace `text-blue-500` (load more button) with `text-accent`.
Replace `bg-white` with `bg-surface`.

- [ ] **Step 2: Commit**

```bash
git add client/src/pages/FundHistory.tsx
git commit -m "style: update FundHistory page to muted palette"
```

---

### Task 11: Update NAVChart and PeriodSelector

**Files:**
- Modify: `client/src/components/chart/NAVChart.tsx`
- Modify: `client/src/components/chart/PeriodSelector.tsx`

- [ ] **Step 1: Update NAVChart colors**

Replace the chart line color `#ef4444` (or any red/blue line color) with `#6B84B0` (accent).
Replace grid line colors with `#E8EAEF`.
Replace axis text colors `#9ca3af` with `#9498A3`.
Replace axis line colors `#e5e7eb` with `#E8EAEF`.
Replace `text-blue-500` with `text-accent`.

For the up/down change display:
- Replace `#ef4444` with `#D94030` (rise)
- Replace `#22c55e` with `#2E8B57` (fall)

- [ ] **Step 2: Update PeriodSelector colors**

Find:
```tsx
bg-blue-500 text-white
```
Replace with:
```tsx
bg-accent text-white
```

Find:
```tsx
text-gray-400 hover:text-gray-600
```
Replace with:
```tsx
text-ink-faint hover:text-ink-secondary
```

- [ ] **Step 3: Commit**

```bash
git add client/src/components/chart/NAVChart.tsx client/src/components/chart/PeriodSelector.tsx
git commit -m "style: update chart components to muted palette"
```

---

### Task 12: Update Settings page

**Files:**
- Modify: `client/src/pages/Settings.tsx`

- [ ] **Step 1: Replace all hardcoded colors**

Replace `text-gray-800` with `text-ink`.
Replace `text-gray-600` with `text-ink-secondary`.
Replace `text-gray-400` with `text-ink-faint`.
Replace `text-blue-500` with `text-accent`.
Replace `text-red-500` with `text-rise`.
Replace `text-orange-500` with `text-[#A67B20]`.
Replace `bg-blue-50 text-blue-600 ring-1 ring-blue-200` (selected state) with `bg-accent/10 text-accent ring-1 ring-accent/30`.
Replace `bg-white` with `bg-surface`.
Replace `bg-gray-50` with `bg-surface-bg`.

- [ ] **Step 2: Commit**

```bash
git add client/src/pages/Settings.tsx
git commit -m "style: update Settings page to muted palette"
```

---

### Task 13: Update Watchlist page

**Files:**
- Modify: `client/src/pages/Watchlist.tsx`

- [ ] **Step 1: Replace hardcoded colors**

Replace `bg-white` with `bg-surface`.
Replace `bg-gray-50` with `bg-surface-bg`.
Replace `bg-red-500` (delete overlay) with `bg-rise`.
Replace `text-blue-500 bg-blue-50` (type badge) with `text-ink-secondary border border-border`.
Replace any remaining `text-gray-*` with appropriate ink tokens.

- [ ] **Step 2: Commit**

```bash
git add client/src/pages/Watchlist.tsx
git commit -m "style: update Watchlist page to muted palette"
```

---

### Task 14: Update GroupManager page

**Files:**
- Modify: `client/src/pages/GroupManager.tsx`

- [ ] **Step 1: Replace hardcoded colors**

Replace `text-gray-800` with `text-ink`.
Replace `text-gray-400` with `text-ink-faint`.
Replace `text-blue-500` with `text-accent`.
Replace `text-red-500` with `text-rise`.
Replace `text-orange-500` with `text-[#A67B20]`.
Replace `bg-blue-500 text-white` (create button) with `bg-accent text-white`.
Replace `bg-blue-50 ring-2 ring-blue-500` (selected icon) with `bg-accent/10 ring-2 ring-accent`.
Replace `bg-gray-50` with `bg-surface-bg`.
Replace `bg-gray-100 text-gray-400` (preset badge) with `bg-surface-bg text-ink-faint`.
Replace `bg-white` with `bg-surface`.

- [ ] **Step 2: Commit**

```bash
git add client/src/pages/GroupManager.tsx
git commit -m "style: update GroupManager page to muted palette"
```

---

### Task 15: Update Import page and import components

**Files:**
- Modify: `client/src/pages/Import.tsx`
- Modify: `client/src/components/import/ImageUploader.tsx`
- Modify: `client/src/components/import/RecognitionResult.tsx`

- [ ] **Step 1: Update Import.tsx**

Replace `text-gray-800` with `text-ink`.
Replace `text-gray-400` with `text-ink-faint`.
Replace `bg-blue-50` (info box) with `bg-accent/10`.
Replace `bg-red-50 border border-red-200 text-red-600` (error) with `bg-rise/10 border border-rise/20 text-rise`.
Replace `bg-blue-100 text-blue-600` (step circles) with `bg-accent/20 text-accent`.
Replace `bg-blue-500 hover:bg-blue-600` (button) with `bg-accent hover:bg-accent/90`.
Replace `bg-green-100 text-green-600` (success state) with `bg-fall/10 text-fall`.

- [ ] **Step 2: Update ImageUploader.tsx**

Replace `border-gray-300 hover:border-blue-400 hover:bg-blue-50/50` with `border-border hover:border-accent hover:bg-accent/5`.
Replace `border-blue-400 bg-blue-50` (drag active) with `border-accent bg-accent/10`.
Replace `border-gray-200 bg-gray-50 cursor-not-allowed` (disabled) with `border-border-light bg-surface-bg cursor-not-allowed`.
Replace `bg-blue-50` (icon bg) with `bg-accent/10`.
Replace `text-blue-500` with `text-accent`.
Replace `text-gray-700` with `text-ink`.
Replace `text-gray-400` / `text-gray-300` with `text-ink-faint`.

- [ ] **Step 3: Update RecognitionResult.tsx**

Replace `border-green-200 bg-green-50/30` (confirmed card) with `border-fall/30 bg-fall/5`.
Replace `border-gray-200` with `border-border`.
Replace `border-gray-200` / `focus:border-blue-400` (inputs) with `border-border` / `focus:border-accent`.
Replace `text-gray-300 hover:text-red-400` (delete) with `text-ink-faint hover:text-rise`.
Replace `text-green-500` (confirmed badge) with `text-fall`.
Replace `bg-blue-500 hover:bg-blue-600` (import button) with `bg-accent hover:bg-accent/90`.
Replace `bg-gray-300` (disabled button) with `bg-border`.

- [ ] **Step 4: Commit**

```bash
git add client/src/pages/Import.tsx client/src/components/import/ImageUploader.tsx client/src/components/import/RecognitionResult.tsx
git commit -m "style: update Import flow to muted palette"
```

---

### Task 16: Update PositionEdit page

**Files:**
- Modify: `client/src/pages/PositionEdit.tsx`

- [ ] **Step 1: Replace hardcoded colors**

Replace `text-gray-900` with `text-ink`.
Replace `text-gray-400` with `text-ink-faint`.
Replace `text-blue-600 font-medium` (active tab) with `text-accent font-medium`.
Replace `bg-blue-500` (tab underline) with `bg-accent`.
Replace `bg-blue-50` (current position highlight) with `bg-accent/10`.
Replace `bg-green-50` / `text-green-700` (DIP preview) with `bg-fall/10` / `text-fall`.
Replace `bg-purple-50` (convert preview) with `bg-accent/10`.
Replace `focus:border-blue-500` (input focus) with `focus:border-accent`.
Replace `bg-blue-500` (submit button) with `bg-accent`.
Replace `bg-orange-500` (reduce button) with `bg-[#A67B20]`.
Replace `bg-green-600` (DIP button) with `bg-fall`.
Replace `bg-purple-500` (convert button) with `bg-accent`.
Replace `hover:bg-gray-50` with `hover:bg-surface-bg`.
Replace `bg-white` with `bg-surface`.

- [ ] **Step 2: Commit**

```bash
git add client/src/pages/PositionEdit.tsx
git commit -m "style: update PositionEdit page to muted palette"
```

---

### Task 17: Update shared components (SearchOverlay, EmptyState, Toast, PullToRefresh, PinLock, PinSetup, GroupSelector, HoldingsTable)

**Files:**
- Modify: `client/src/components/shared/SearchOverlay.tsx`
- Modify: `client/src/components/shared/EmptyState.tsx`
- Modify: `client/src/components/shared/Toast.tsx`
- Modify: `client/src/components/shared/PullToRefresh.tsx`
- Modify: `client/src/components/shared/GroupSelector.tsx`
- Modify: `client/src/components/fund/HoldingsTable.tsx`
- Modify: `client/src/components/lock/PinLock.tsx`
- Modify: `client/src/components/lock/PinSetup.tsx`

- [ ] **Step 1: Update SearchOverlay.tsx**

Replace `bg-gray-50` with `bg-surface-bg`.
Replace `text-gray-400` with `text-ink-faint`.
Replace `border-gray-100` with `border-border-light`.
Replace `text-blue-500` with `text-accent`.
Replace fund type badge colors:
- `bg-purple-50 text-purple-500` → `bg-accent/10 text-accent`
- `bg-blue-50 text-blue-500` → `bg-accent/10 text-accent`
- `bg-red-50 text-red-500` → `bg-rise/10 text-rise`
- `bg-green-50 text-green-600` → `bg-fall/10 text-fall`
- `bg-gray-100 text-gray-500` → `bg-surface-bg text-ink-secondary`
- `bg-orange-50 text-orange-500` → `bg-[#FAF5E6] text-[#A67B20]`

- [ ] **Step 2: Update EmptyState.tsx**

Replace `text-gray-700` with `text-ink`.
Replace `text-gray-500` with `text-ink-secondary`.

- [ ] **Step 3: Update Toast.tsx**

Replace `bg-gray-800` with `bg-ink`.

- [ ] **Step 4: Update PullToRefresh.tsx**

Replace `text-gray-400` with `text-ink-faint`.
Replace `border-blue-500` (spinner) with `border-accent`.

- [ ] **Step 5: Update GroupSelector.tsx**

Replace `bg-blue-50 text-blue-600 ring-1 ring-blue-200` (active) with `bg-accent/10 text-accent ring-1 ring-accent/30`.
Replace `bg-gray-50 text-gray-500` (inactive) with `bg-surface-bg text-ink-secondary`.
Replace `text-gray-500` (label) with `text-ink-secondary`.

- [ ] **Step 6: Update HoldingsTable.tsx**

Replace `text-gray-400` with `text-ink-faint`.
Replace `text-gray-800` with `text-ink`.
Replace `text-gray-600` with `text-ink-secondary`.

- [ ] **Step 7: Update PinLock.tsx**

Replace `bg-white` with `bg-surface`.
Replace `text-gray-700` with `text-ink`.
Replace `text-red-500` with `text-rise`.
Replace `border-gray-300` with `border-border`.
Replace `bg-gray-800 border-gray-800` (filled dot) with `bg-ink border-ink`.
Replace `bg-red-500 border-red-500` (error dot) with `bg-rise border-rise`.
Replace `bg-gray-50 text-gray-800` (keys) with `bg-surface-bg text-ink`.
Replace `bg-gray-200` (active key) with `bg-border`.
Replace `text-gray-500` (delete button) with `text-ink-secondary`.
Replace `bg-gray-100` (active delete) with `bg-surface-bg`.

- [ ] **Step 8: Update PinSetup.tsx**

Apply the same replacements as PinLock (same visual pattern):
Replace `text-gray-700` with `text-ink`.
Replace `text-red-500` with `text-rise`.
Replace `border-gray-300` with `border-border`.
Replace `bg-gray-800 border-gray-800` with `bg-ink border-ink`.
Replace `bg-red-500 border-red-500` with `bg-rise border-rise`.
Replace `bg-gray-50 text-gray-800` with `bg-surface-bg text-ink`.
Replace `bg-gray-200` with `bg-border`.
Replace `text-gray-400` / `text-gray-600` with `text-ink-faint` / `text-ink-secondary`.

- [ ] **Step 9: Commit**

```bash
git add client/src/components/shared/SearchOverlay.tsx client/src/components/shared/EmptyState.tsx client/src/components/shared/Toast.tsx client/src/components/shared/PullToRefresh.tsx client/src/components/shared/GroupSelector.tsx client/src/components/fund/HoldingsTable.tsx client/src/components/lock/PinLock.tsx client/src/components/lock/PinSetup.tsx
git commit -m "style: update shared components to muted palette"
```

---

### Task 18: Update AccountOverview

**Files:**
- Modify: `client/src/components/portfolio/AccountOverview.tsx`

- [ ] **Step 1: Review and update AccountOverview**

This component already uses design tokens (`text-ink`, `bg-surface`, etc.) so the Tailwind config change in Task 1 covers most of it. Check for any remaining hardcoded colors and replace:
- Any `border-ink` underlines should become `border-accent`
- Any hardcoded gray values should use tokens

- [ ] **Step 2: Commit (if changes needed)**

```bash
git add client/src/components/portfolio/AccountOverview.tsx
git commit -m "style: update AccountOverview to muted palette"
```

---

### Task 19: Final type check and visual verification

- [ ] **Step 1: Run TypeScript compilation check on client**

Run: `cd /Users/freya/Desktop/yyn-ais/fund-manager/client && npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 2: Run TypeScript compilation check on server (sanity)**

Run: `cd /Users/freya/Desktop/yyn-ais/fund-manager/server && npx tsc --noEmit`
Expected: No errors (server unchanged, but verify nothing broke).

- [ ] **Step 3: Build check**

Run: `cd /Users/freya/Desktop/yyn-ais/fund-manager && npm run build`
Expected: Successful build.

- [ ] **Step 4: Commit any remaining fixes**

```bash
git add -A
git commit -m "style: fix any remaining type/build issues from UI redesign"
```
