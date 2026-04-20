import { useState } from 'react'
import { View, Text } from '@tarojs/components'
import { formatCurrency, formatPercent, priceDirection } from '@fund-manager/shared'
import type { PositionPnL } from '@fund-manager/shared'

const DIRECTION_COLORS = {
  rise: '#D94030',
  fall: '#2E8B57',
  flat: '#9498A3',
} as const

interface Props {
  pnlList: PositionPnL[]
  onRefresh?: () => void
  groupLabel?: string
}

export default function ProfitSummary({ pnlList, onRefresh, groupLabel }: Props) {
  const [refreshing, setRefreshing] = useState(false)

  const totalCost = pnlList.reduce((sum, p) => sum + p.position.totalCost, 0)
  const totalMarketValue = pnlList.reduce((sum, p) => sum + p.marketValue, 0)
  const totalProfit = totalMarketValue - totalCost
  const totalProfitRate = totalCost > 0 ? (totalProfit / totalCost) * 100 : 0
  const todayChange = pnlList.reduce((sum, p) => sum + p.todayChange, 0)

  const handleRefresh = async () => {
    if (!onRefresh || refreshing) return
    setRefreshing(true)
    await onRefresh()
    setTimeout(() => setRefreshing(false), 600)
  }

  const profitColor = DIRECTION_COLORS[priceDirection(totalProfit)]
  const rateColor = DIRECTION_COLORS[priceDirection(totalProfitRate)]
  const todayColor = DIRECTION_COLORS[priceDirection(todayChange)]

  return (
    <View style={{ padding: '32px 24px 24px', backgroundColor: '#FFFFFF', borderLeft: '3px solid #6B84B0' }}>
      <View style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
        <Text style={{ fontSize: '14px', color: '#9498A3' }}>
          {groupLabel || '资产'}
        </Text>
        {onRefresh && (
          <View onClick={handleRefresh}>
            <Text style={{ fontSize: '14px', color: '#B8BBC4' }}>↻</Text>
          </View>
        )}
      </View>

      <Text style={{ fontSize: '32px', fontWeight: '500', color: '#2C2F36', lineHeight: '1' }}>
        {formatCurrency(totalMarketValue)}
      </Text>

      <View style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '12px' }}>
        <View style={{ display: 'flex', alignItems: 'center' }}>
          <Text style={{ fontSize: '14px', color: '#9498A3' }}>收益</Text>
          <Text style={{ fontSize: '15px', fontWeight: '500', marginLeft: '8px', color: profitColor }}>
            {totalProfit >= 0 ? '+' : ''}{formatCurrency(totalProfit)}
          </Text>
          <Text style={{ fontSize: '14px', marginLeft: '4px', color: rateColor }}>
            {formatPercent(totalProfitRate)}
          </Text>
        </View>
        <View style={{ display: 'flex', alignItems: 'center' }}>
          <Text style={{ fontSize: '14px', color: '#9498A3' }}>今日</Text>
          <Text style={{ fontSize: '15px', fontWeight: '500', marginLeft: '8px', color: todayColor }}>
            {todayChange >= 0 ? '+' : ''}{formatCurrency(todayChange)}
          </Text>
        </View>
      </View>
    </View>
  )
}
