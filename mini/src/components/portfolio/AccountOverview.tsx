import { useMemo } from 'react'
import { View, Text } from '@tarojs/components'
import { usePortfolioStore } from '@/stores/portfolio'
import { useFundCacheStore } from '@/stores/fund-cache'
import {
  formatCurrency,
  formatPercent,
  priceDirection,
  getCurrentNav,
  getCurrentChangeRate,
} from '@fund-manager/shared'
import type { Group } from '@fund-manager/shared'

const DIRECTION_COLORS = {
  rise: '#D94030',
  fall: '#2E8B57',
  flat: '#9498A3',
} as const

interface GroupStats {
  group: Group
  totalMarketValue: number
  totalCost: number
  profit: number
  profitRate: number
  todayChange: number
  riseCount: number
  fallCount: number
  flatCount: number
  totalCount: number
}

interface Props {
  onGroupSelect: (groupId: string) => void
}

export default function AccountOverview({ onGroupSelect }: Props) {
  const positions = usePortfolioStore((s) => s.positions)
  const groups = usePortfolioStore((s) => s.groups)
  const estimates = useFundCacheStore((s) => s.estimates)
  const sortedGroups = [...groups].sort((a, b) => a.order - b.order)

  const groupStats: GroupStats[] = useMemo(() => {
    return sortedGroups.map((group) => {
      const gp = positions.filter((p) => p.groupId === group.id)
      let totalMarketValue = 0, totalCost = 0, todayChange = 0
      let riseCount = 0, fallCount = 0, flatCount = 0
      for (const pos of gp) {
        const est = estimates[pos.fundCode]
        const nav = getCurrentNav(est, pos.costNav)
        const last = est?.lastNav || pos.costNav
        totalMarketValue += pos.shares * nav
        totalCost += pos.totalCost
        todayChange += pos.shares * (nav - last)
        const cr = getCurrentChangeRate(est)
        if (cr > 0) riseCount++; else if (cr < 0) fallCount++; else flatCount++
      }
      const profit = totalMarketValue - totalCost
      const profitRate = totalCost > 0 ? (profit / totalCost) * 100 : 0
      return { group, totalMarketValue, totalCost, profit, profitRate, todayChange, riseCount, fallCount, flatCount, totalCount: gp.length }
    })
  }, [sortedGroups, positions, estimates])

  const overall = useMemo(() => {
    let mv = 0, cost = 0, today = 0
    for (const s of groupStats) { mv += s.totalMarketValue; cost += s.totalCost; today += s.todayChange }
    const profit = mv - cost
    const rate = cost > 0 ? (profit / cost) * 100 : 0
    return { totalMarketValue: mv, profit, profitRate: rate, todayChange: today }
  }, [groupStats])

  const profitColor = DIRECTION_COLORS[priceDirection(overall.profit)]
  const todayColor = DIRECTION_COLORS[priceDirection(overall.todayChange)]

  return (
    <View>
      {/* Hero: total assets */}
      <View style={{ padding: '32px 24px 24px', backgroundColor: '#FFFFFF', borderLeft: '3px solid #6B84B0' }}>
        <Text style={{ fontSize: '14px', color: '#9498A3', marginBottom: '8px', display: 'block' }}>总资产</Text>
        <Text style={{ fontSize: '32px', fontWeight: '500', color: '#2C2F36', lineHeight: '1' }}>
          {formatCurrency(overall.totalMarketValue)}
        </Text>
        <View style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '12px' }}>
          <View style={{ display: 'flex', alignItems: 'center' }}>
            <Text style={{ fontSize: '14px', color: '#9498A3' }}>收益</Text>
            <Text style={{ fontSize: '15px', fontWeight: '500', marginLeft: '8px', color: profitColor }}>
              {overall.profit >= 0 ? '+' : ''}{formatCurrency(overall.profit)}
            </Text>
          </View>
          <View style={{ display: 'flex', alignItems: 'center' }}>
            <Text style={{ fontSize: '14px', color: '#9498A3' }}>今日</Text>
            <Text style={{ fontSize: '15px', fontWeight: '500', marginLeft: '8px', color: todayColor }}>
              {overall.todayChange >= 0 ? '+' : ''}{formatCurrency(overall.todayChange)}
            </Text>
          </View>
        </View>
      </View>

      {/* Group list */}
      <View style={{ marginTop: '8px' }}>
        {groupStats.map(({ group, totalMarketValue, profit, todayChange, totalCount }, index) => {
          const todayDirColor = DIRECTION_COLORS[priceDirection(todayChange)]
          const profitDirColor = DIRECTION_COLORS[priceDirection(profit)]
          return (
            <View
              key={group.id}
              onClick={() => onGroupSelect(group.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '16px 24px',
                backgroundColor: '#FFFFFF',
                marginTop: index > 0 ? '1px' : '0',
              }}
            >
              <Text style={{ fontSize: '24px', marginRight: '16px', flexShrink: 0 }}>{group.icon}</Text>

              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={{ fontSize: '15px', color: '#2C2F36' }}>{group.name}</Text>
                <Text style={{ fontSize: '14px', color: '#B8BBC4', marginTop: '2px', display: 'block' }}>
                  {totalCount} 只 · ¥{formatCurrency(totalMarketValue)}
                </Text>
              </View>

              <View style={{ textAlign: 'right', flexShrink: 0 }}>
                <Text style={{ fontSize: '15px', fontWeight: '500', color: todayDirColor }}>
                  {todayChange >= 0 ? '+' : ''}{formatCurrency(todayChange)}
                </Text>
                <Text style={{ fontSize: '14px', marginTop: '2px', color: profitDirColor, display: 'block' }}>
                  {profit >= 0 ? '+' : ''}{formatCurrency(profit)}
                </Text>
              </View>

              <Text style={{ fontSize: '18px', color: '#B8BBC4', marginLeft: '12px', flexShrink: 0 }}>›</Text>
            </View>
          )
        })}
      </View>
    </View>
  )
}
