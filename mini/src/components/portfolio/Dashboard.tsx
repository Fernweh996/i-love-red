import { useMemo, useState, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react'
import Taro from '@tarojs/taro'
import { View, Text, ScrollView } from '@tarojs/components'
import { usePortfolioStore } from '@/stores/portfolio'
import { useFundCacheStore } from '@/stores/fund-cache'
import {
  isTradingTime,
  getCurrentNav,
  getRealtimeNav,
  getCurrentChangeRate,
} from '@fund-manager/shared'
import type { PositionPnL } from '@fund-manager/shared'
import { batchFundEstimate, getFundHistory } from '@/api'
import ProfitSummary from './ProfitSummary'
import PositionCard from './PositionCard'
import GroupTabs from './GroupTabs'
import AccountOverview from './AccountOverview'
import EmptyState from '@/components/shared/EmptyState'

type SortKey = 'todayChangeRate' | 'profit' | 'marketValue'

const COLORS = {
  ink: '#2C2F36',
  inkFaint: '#B8BBC4',
  accent: '#6B84B0',
  surface: '#FFFFFF',
  fall: '#2E8B57',
}

function TradingStatus({ hasConfirmedNav }: { hasConfirmedNav: boolean }) {
  const trading = isTradingTime()
  let dotColor: string
  let label: string

  if (trading) {
    dotColor = COLORS.fall
    label = '交易中'
  } else if (hasConfirmedNav) {
    dotColor = COLORS.inkFaint
    label = '已收盘 · 净值已更新'
  } else {
    dotColor = COLORS.inkFaint
    label = '已收盘 · 等待净值'
  }

  return (
    <View style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', paddingTop: '8px', paddingBottom: '8px' }}>
      <View
        style={{
          width: '4px',
          height: '4px',
          borderRadius: '50%',
          backgroundColor: dotColor,
        }}
      />
      <Text style={{ fontSize: '14px', color: COLORS.inkFaint }}>{label}</Text>
    </View>
  )
}

function SortIcon({ active, asc }: { active: boolean; asc: boolean }) {
  return (
    <View style={{ display: 'inline-flex', flexDirection: 'column', marginLeft: '2px', lineHeight: 1 }}>
      <Text style={{ fontSize: '7px', lineHeight: '1', color: active && !asc ? COLORS.ink : COLORS.inkFaint }}>▲</Text>
      <Text style={{ fontSize: '7px', lineHeight: '1', color: active && asc ? COLORS.ink : COLORS.inkFaint }}>▼</Text>
    </View>
  )
}

export interface DashboardHandle {
  refresh: () => Promise<void>
}

const Dashboard = forwardRef<DashboardHandle>(function Dashboard(_props, ref) {
  const positions = usePortfolioStore((s) => s.positions)
  const activeGroupId = usePortfolioStore((s) => s.activeGroupId)
  const setActiveGroupId = usePortfolioStore((s) => s.setActiveGroupId)
  const groups = usePortfolioStore((s) => s.groups)
  const estimates = useFundCacheStore((s) => s.estimates)
  const weekNavs = useFundCacheStore((s) => s.weekNavs)

  const [sortKey, setSortKey] = useState<SortKey>('todayChangeRate')
  const [sortAsc, setSortAsc] = useState(false)

  const groupLabel = useMemo(() => {
    if (activeGroupId === 'all') return undefined
    const g = groups.find((g) => g.id === activeGroupId)
    return g ? g.name : undefined
  }, [activeGroupId, groups])

  const filteredPositions = useMemo(() => {
    if (activeGroupId === 'all') return positions
    return positions.filter((p) => p.groupId === activeGroupId)
  }, [positions, activeGroupId])

  const pnlList: PositionPnL[] = useMemo(() => {
    const list = filteredPositions.map((pos) => {
      const est = estimates[pos.fundCode]
      const nav = getCurrentNav(est, pos.costNav)
      const realtimeNav = getRealtimeNav(est, pos.costNav)
      const last = est?.lastNav || pos.costNav
      const mv = pos.shares * nav
      const profit = mv - pos.totalCost
      const profitRate = pos.totalCost > 0 ? (profit / pos.totalCost) * 100 : 0
      const todayChange = pos.shares * (realtimeNav - last)
      const todayChangeRate = getCurrentChangeRate(est)
      const weekNav = weekNavs[pos.fundCode]
      const weekProfit = weekNav ? pos.shares * (nav - weekNav) : undefined
      return { position: pos, currentNav: nav, marketValue: mv, profit, profitRate, todayChange, todayChangeRate, estimate: est, weekProfit }
    })
    list.sort((a, b) => sortAsc ? a[sortKey] - b[sortKey] : b[sortKey] - a[sortKey])
    return list
  }, [filteredPositions, estimates, weekNavs, sortKey, sortAsc])

  const totalMarketValue = useMemo(() => pnlList.reduce((sum, p) => sum + p.marketValue, 0), [pnlList])

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc)
    else { setSortKey(key); setSortAsc(false) }
  }

  const handleRefresh = useCallback(async () => {
    const codes = [...new Set(positions.map((p) => p.fundCode))]
    if (codes.length === 0) return

    const estimatesData = batchFundEstimate(codes)

    const weekNavPromises = codes.map(async (code) => {
      try {
        const { records } = await getFundHistory(code, 1, 7)
        const now = new Date()
        const dayOfWeek = now.getDay()
        const daysBack = dayOfWeek === 0 ? 2 : dayOfWeek === 6 ? 1 : dayOfWeek + 2
        const weekStart = new Date(now)
        weekStart.setDate(weekStart.getDate() - daysBack)
        const weekStartStr = weekStart.toISOString().slice(0, 10)
        const sorted = records.sort((a, b) => b.date.localeCompare(a.date))
        const weekRec = sorted.find((r) => r.date <= weekStartStr)
        return { code, nav: weekRec?.nav }
      } catch {
        return { code, nav: undefined }
      }
    })

    const [estResult, ...weekResults] = await Promise.all([estimatesData, ...weekNavPromises])
    useFundCacheStore.getState().setEstimates(estResult)

    const newWeekNavs: Record<string, number> = {}
    for (const r of weekResults) {
      if (r.nav) newWeekNavs[r.code] = r.nav
    }
    useFundCacheStore.getState().setWeekNavs(newWeekNavs)
  }, [positions])

  useImperativeHandle(ref, () => ({ refresh: handleRefresh }), [handleRefresh])

  // Fetch week navs on initial mount (if not already loaded)
  useEffect(() => {
    const codes = [...new Set(positions.map((p) => p.fundCode))]
    if (codes.length === 0) return
    const currentWeekNavs = useFundCacheStore.getState().weekNavs
    const missing = codes.filter((c) => !(c in currentWeekNavs))
    if (missing.length === 0) return

    const fetchWeekNavs = async () => {
      const results = await Promise.all(
        missing.map(async (code) => {
          try {
            const { records } = await getFundHistory(code, 1, 7)
            const now = new Date()
            const dayOfWeek = now.getDay()
            const daysBack = dayOfWeek === 0 ? 2 : dayOfWeek === 6 ? 1 : dayOfWeek + 2
            const weekStart = new Date(now)
            weekStart.setDate(weekStart.getDate() - daysBack)
            const weekStartStr = weekStart.toISOString().slice(0, 10)
            const sorted = records.sort((a, b) => b.date.localeCompare(a.date))
            const weekRec = sorted.find((r) => r.date <= weekStartStr)
            return { code, nav: weekRec?.nav }
          } catch {
            return { code, nav: undefined }
          }
        })
      )
      const navs: Record<string, number> = {}
      for (const r of results) {
        if (r.nav) navs[r.code] = r.nav
      }
      useFundCacheStore.getState().setWeekNavs(navs)
    }
    fetchWeekNavs()
  }, [positions])

  const importGroupId = activeGroupId === 'all' ? (groups[0]?.id || 'licaitong') : activeGroupId

  // "All" group: show account overview
  if (activeGroupId === 'all') {
    return (
      <View>
        <GroupTabs activeGroupId={activeGroupId} onGroupChange={setActiveGroupId} />
        <AccountOverview onGroupSelect={setActiveGroupId} />
      </View>
    )
  }

  // Individual group: show position list
  return (
    <View>
      <GroupTabs activeGroupId={activeGroupId} onGroupChange={setActiveGroupId} />
      <ProfitSummary pnlList={pnlList} groupLabel={groupLabel} />
      <TradingStatus hasConfirmedNav={pnlList.some((p) => p.estimate?.navSource === 'confirmed')} />

      {/* Column header */}
      <View style={{ display: 'flex', alignItems: 'center', paddingLeft: '24px', paddingRight: '24px', backgroundColor: COLORS.surface, minHeight: '32px' }}>
        <View style={{ width: '140px', flexShrink: 0, paddingRight: '16px' }}>
          <Text style={{ fontSize: '14px', color: COLORS.inkFaint }}>名称</Text>
        </View>
        <ScrollView scrollX style={{ flex: 1, overflow: 'hidden' }} enhanced showScrollbar={false}>
          <View style={{ display: 'flex', alignItems: 'center', whiteSpace: 'nowrap' }}>
            <View
              onClick={() => handleSort('todayChangeRate')}
              style={{ width: '96px', flexShrink: 0, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <Text style={{ fontSize: '14px', color: COLORS.inkFaint }}>今日涨跌</Text>
              <SortIcon active={sortKey === 'todayChangeRate'} asc={sortAsc} />
            </View>
            <View
              onClick={() => handleSort('profit')}
              style={{ width: '96px', flexShrink: 0, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <Text style={{ fontSize: '14px', color: COLORS.inkFaint }}>持有收益</Text>
              <SortIcon active={sortKey === 'profit'} asc={sortAsc} />
            </View>
            <View style={{ width: '96px', flexShrink: 0, textAlign: 'center' }}>
              <Text style={{ fontSize: '14px', color: COLORS.inkFaint }}>本周收益</Text>
            </View>
            <View style={{ width: '72px', flexShrink: 0, textAlign: 'center' }}>
              <Text style={{ fontSize: '14px', color: COLORS.inkFaint }}>持仓占比</Text>
            </View>
            <View style={{ width: '80px', flexShrink: 0, textAlign: 'center' }}>
              <Text style={{ fontSize: '14px', color: COLORS.inkFaint }}>净值</Text>
            </View>
            <View style={{ width: '88px', flexShrink: 0, textAlign: 'center' }}>
              <Text style={{ fontSize: '14px', color: COLORS.inkFaint }}>份额</Text>
            </View>
            <View style={{ width: '80px', flexShrink: 0, textAlign: 'center' }}>
              <Text style={{ fontSize: '14px', color: COLORS.inkFaint }}>成本</Text>
            </View>
          </View>
        </ScrollView>
      </View>

      {filteredPositions.length === 0 ? (
        <EmptyState icon="📭" title="暂无持仓" description="添加持仓或截图导入" />
      ) : (
        <View key={activeGroupId}>
          {pnlList.map((pnl, i) => (
            <PositionCard
              key={`${pnl.position.fundCode}-${pnl.position.groupId}`}
              pnl={pnl}
              totalMarketValue={totalMarketValue}
              isLast={i === pnlList.length - 1}
            />
          ))}
        </View>
      )}

      {/* Actions */}
      <View style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingLeft: '24px', paddingRight: '24px', paddingTop: '24px', paddingBottom: '24px' }}>
        <View style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <View onClick={() => Taro.navigateTo({ url: '/pages/search/index' })}>
            <Text style={{ fontSize: '15px', color: COLORS.accent }}>+ 添加</Text>
          </View>
          <View onClick={() => Taro.navigateTo({ url: `/pages/import/index?group=${importGroupId}` })}>
            <Text style={{ fontSize: '15px', color: COLORS.accent }}>截图导入</Text>
          </View>
        </View>
        <Text style={{ fontSize: '14px', color: COLORS.inkFaint }}>← 滑动删除</Text>
      </View>
    </View>
  )
})

export default Dashboard
