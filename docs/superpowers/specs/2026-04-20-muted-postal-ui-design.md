# Fund Manager UI Redesign — Muted & Postal Style

## Overview

Redesign the fund-manager client UI from the current minimal black/white/flat style to a "muted and postal" aesthetic: cool gray tones with a blue accent, bright white content surfaces, and classic red/green financial colors for rise/fall indicators.

The redesign is purely visual — no changes to data flow, API, state management, or functionality. All existing features (horizontal scroll, swipe-to-delete, pull-to-refresh, group tabs, search overlay, PIN lock) remain intact.

## Design Tokens

### Color Palette

| Token | Current | New | Usage |
|-------|---------|-----|-------|
| `surface` | `#FFFFFF` | `#FFFFFF` | Cards, content areas (unchanged) |
| `surface-bg` | `#FAFAFA` | `#F0F1F4` | Page background, gaps between sections |
| `ink` | `#1A1A1A` | `#2C2F36` | Primary text, headings |
| `ink-secondary` | `#888888` | `#9498A3` | Labels, secondary text, placeholders |
| `ink-faint` | `#BBBBBB` | `#B8BBC4` | Disabled states, inactive icons, hints |
| `rise` | `#E8453C` | `#D94030` | Price increase, positive P&L |
| `fall` | `#34A853` | `#2E8B57` | Price decrease, negative P&L |
| `flat` | `#999999` | `#9498A3` | Unchanged values (0%) |
| `accent` | (none) | `#6B84B0` | NEW — active tab underline, active TabBar icon/label, action text ("+ 添加", "截图导入"), profit summary left border |
| `border` | (none) | `#DCDFE5` | Card borders, group tab bottom border |
| `border-light` | (none) | `#F0F1F4` | Row separators within cards, internal dividers |
| `search-bg` | (none) | `#E4E6EB` | Search input background |

### Badge Colors (unchanged logic, adjusted values)

| Badge | Text | Background |
|-------|------|------------|
| NAV confirmed (净) | `#2E8B57` | `#EBF5EF` |
| NAV estimate (估) | `#A67B20` | `#FAF5E6` |
| Fund type (混合/指数/...) | `#9498A3` | transparent, 1px border `#DCDFE5` |

### Typography

No font family changes. Size and weight adjustments:

- Profit summary headline: keep 28-32px, weight 600
- Body text: 14-15px, weight 400/500 (no change)
- Labels: 10-11px, `letter-spacing: 0.05-0.08em`, `text-transform: uppercase`
- All numeric values: `font-variant-numeric: tabular-nums`

### Borders & Corners

- Card border: `1px solid #DCDFE5`, `border-radius: 8px` (where cards are used — fund detail, settings, etc.)
- Row separators in position list: `1px solid #F0F1F4` (lighter than card border)
- Search input: `border-radius: 8px`, no border, background `#E4E6EB`
- Badges: `border-radius: 2px`

### Shadows

- No box-shadows on cards (line-border style, not shadow style)
- TabBar: keep existing `backdrop-blur-lg` with `rgba(255,255,255,0.95)` background

### Accent Color Usage

The accent `#6B84B0` appears in exactly these places:
1. Active group tab underline (`border-bottom: 2px solid`)
2. Active TabBar icon stroke and label color
3. Action text links ("+ 添加", "截图导入")
4. Profit summary left border bar (`border-left: 3px solid`)

It does NOT appear in: headings, body text, card borders, backgrounds, or anywhere else. Restraint is key.

## Component Changes

### tailwind.config.js

Update the `extend.colors` section to replace current tokens with new values. Add `accent` and `border`/`border-light` tokens.

### index.css

No structural changes. Background color of `body` or root element should use `surface-bg`.

### AppShell.tsx

- Background: `bg-surface-bg` (was `bg-surface-bg`, value changes via config)
- Search bar background: new `search-bg` token or inline `bg-[#E4E6EB]`

### TabBar.tsx

- Active tab: icon stroke and label color → `text-accent` (was `text-ink`)
- Inactive tab: `text-ink-faint` (unchanged logic)
- Background: `bg-surface/95 backdrop-blur-lg` (keep glass effect, pure white base)
- Top border: `border-t border-border`

### GroupTabs.tsx

- Active tab underline: `border-b-2 border-accent` (was `border-ink`)
- Active tab text: `text-ink font-medium` (keep dark, not accent — underline is enough)
- Inactive tab text: `text-ink-secondary`
- Settings icon: `text-ink-faint`
- Bottom border of container: `border-b border-border`

### ProfitSummary.tsx

- Add `border-l-[3px] border-accent` to the container
- "资产总值" label: `text-ink-secondary`
- Total value: `text-ink` (large, bold)
- Profit/today values: colored by `rise`/`fall`/`flat`

### MarketIndexBar.tsx

- Background: `bg-surface-bg`
- Index names: `text-ink-secondary`
- Change values: `text-rise` / `text-fall` / `text-flat`

### Dashboard.tsx

- Column headers: `text-ink-secondary`, `letter-spacing: 0.05em`
- Column header bottom border: `border-b border-border`
- Action text ("+ 添加", "截图导入"): `text-accent` (was `text-ink-faint`)
- Swipe hint: `text-ink-faint`

### PositionCard.tsx

- Row background: `bg-surface`
- Row separator: `border-b border-border-light`
- Left section (fund name) right divider: `border-r border-border-light`
- Fund name: `text-ink font-medium`
- Fund code: `text-ink-secondary`
- Fund type badge: `text-ink-secondary border border-border rounded-sm`
- Numeric columns: colored by `rise`/`fall`/`flat`
- Neutral values (持仓 amount, 份额, 成本): `text-ink`
- NAV source badge (净/估): keep current amber/green badge logic with updated colors from badge table above
- Delete overlay: keep current red background

### SearchOverlay.tsx

- Input background: `bg-[#E4E6EB]` or `bg-search-bg`
- Placeholder text: `text-ink-secondary`
- Search results: standard `text-ink` / `text-ink-secondary`

### TradingStatus indicator

- Trading dot: `bg-fall` (green, market is open)
- Closed dot: `bg-ink-faint` (gray)
- Label: `text-ink-secondary`

### Other pages (FundDetail, FundHistory, PositionEdit, Import, Settings, Watchlist, GroupManager)

Apply the same token replacements consistently:
- Page backgrounds: `bg-surface-bg`
- Content sections/cards: `bg-surface` with `border border-border rounded-lg`
- All text: use `ink` / `ink-secondary` / `ink-faint` hierarchy
- All rise/fall values: use updated `rise` / `fall` tokens
- Buttons and interactive text: `text-accent` for primary actions
- Input fields: use `search-bg` background pattern

### Charts (NAVChart via Recharts)

- Line color: `#6B84B0` (accent) for NAV line
- Grid lines: `#E8EAEF`
- Axis labels: `#9498A3`
- Tooltip background: `#FFFFFF` with `border: 1px solid #DCDFE5`

## Scope

### In scope
- All color token updates in tailwind.config.js
- All component files that reference color classes (text-ink, bg-surface, text-rise, text-fall, etc.)
- Adding accent color and border tokens
- Profit summary left border accent
- Active tab/TabBar accent styling
- Action text accent styling

### Out of scope
- Layout changes (spacing, sizing, positioning)
- Functionality changes
- Animation changes
- Font family changes
- Icon changes
- New components
- Server-side changes

## Migration Strategy

1. Update `tailwind.config.js` color tokens — this propagates to most components automatically since they reference tokens like `text-ink`, `bg-surface`, `text-rise`, `text-fall`
2. Add new tokens: `accent`, `border`, `border-light`, `search-bg`
3. Update components that need new classes: TabBar (accent), GroupTabs (accent underline), ProfitSummary (accent border), Dashboard (accent action text)
4. Verify all pages render correctly with new colors
