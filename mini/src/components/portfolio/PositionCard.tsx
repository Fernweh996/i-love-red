import { useRef, useState } from 'react'
import Taro from '@tarojs/taro'
import { View, Text, ScrollView } from '@tarojs/components'
import type { PositionPnL } from '@fund-manager/shared'
import { formatCurrency, formatPercent, priceDirection } from '@fund-manager/shared'
import { usePortfolioStore } from '@/stores/portfolio'
import NavSourceBadge from '@/components/shared/NavSourceBadge'

const COLORS = { rise: '#D94030', fall: '#2E8B57', flat: '#9498A3' }

function priceColor(change: number): string {
  return COLORS[priceDirection(change)]
}

interface Props {
  pnl: PositionPnL
  totalMarketValue: number
  isLast?: boolean
}

const DELETE_THRESHOLD = 72

export default function PositionCard({ pnl, totalMarketValue, isLast }: Props) {
  const removePosition = usePortfolioStore((s) => s.removePosition)
  const { position, currentNav, marketValue, profit, profitRate, todayChange, todayChangeRate, weekProfit } = pnl
  const weight = totalMarketValue > 0 ? (marketValue / totalMarketValue) * 100 : 0

  const [offsetX, setOffsetX] = useState(0)
  const [swiping, setSwiping] = useState(false)
  const startXRef = useRef(0)
  const startOffsetRef = useRef(0)

  const onTouchStart = (e) => {
    startXRef.current = e.touches[0].clientX
    startOffsetRef.current = offsetX
    setSwiping(true)
  }

  const onTouchMove = (e) => {
    if (!swiping) return
    const dx = e.touches[0].clientX - startXRef.current
    setOffsetX(Math.max(-DELETE_THRESHOLD, Math.min(0, startOffsetRef.current + dx)))
  }

  const onTouchEnd = () => {
    setSwiping(false)
    setOffsetX(offsetX < -DELETE_THRESHOLD / 2 ? -DELETE_THRESHOLD : 0)
  }

  const handleDelete = async () => {
    const res = await Taro.showModal({
      title: '确认',
      content: `确定删除 ${position.fundName}？`,
    })
    if (res.confirm) {
      removePosition(position.fundCode, position.groupId)
    } else {
      setOffsetX(0)
    }
  }

  const handleTap = () => {
    if (offsetX < -10) {
      setOffsetX(0)
      return
    }
    Taro.navigateTo({
      url: `/pages/fund-detail/index?code=${position.fundCode}&group=${position.groupId}`,
    })
  }

  const typeLabel = position.fundType ? position.fundType.replace(/型.*$/, '').slice(0, 4) : ''

  return (
    <View style={{ position: 'relative', overflow: 'hidden', backgroundColor: '#FFFFFF' }}>
      {/* Delete button behind */}
      <View
        style={{
          position: 'absolute',
          right: 0,
          top: 0,
          bottom: 0,
          width: '72px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#D94030',
        }}
        onClick={handleDelete}
      >
        <Text style={{ color: '#FFFFFF', fontSize: '15px', fontWeight: '500' }}>删除</Text>
      </View>

      {/* Sliding card */}
      <View
        style={{
          position: 'relative',
          backgroundColor: '#FFFFFF',
          display: 'flex',
          alignItems: 'center',
          minHeight: '64px',
          paddingLeft: '24px',
          paddingRight: '24px',
          transform: `translateX(${offsetX}px)`,
          transition: swiping ? 'none' : 'transform 0.2s ease-out',
          borderBottom: isLast ? 'none' : '1px solid #F0F1F4',
        }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onClick={handleTap}
      >
        {/* Fund name + market value */}
        <View style={{ width: '140px', flexShrink: 0, paddingRight: '16px', paddingTop: '12px', paddingBottom: '12px' }}>
          <View style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Text
              style={{
                fontSize: '15px',
                color: '#2C2F36',
                lineHeight: '20px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: typeLabel ? '100px' : '140px',
              }}
            >
              {position.fundName}
            </Text>
            {typeLabel && (
              <Text
                style={{
                  flexShrink: 0,
                  fontSize: '9px',
                  color: '#9498A3',
                  border: '1px solid #B8BBC4',
                  paddingLeft: '4px',
                  paddingRight: '4px',
                  paddingTop: '1px',
                  paddingBottom: '1px',
                  borderRadius: '2px',
                  lineHeight: '14px',
                }}
              >
                {typeLabel}
              </Text>
            )}
          </View>
          <Text style={{ fontSize: '14px', color: '#B8BBC4', marginTop: '4px', fontVariantNumeric: 'tabular-nums' }}>
            ¥{marketValue.toFixed(2)}
          </Text>
        </View>

        {/* Horizontal scrollable data columns */}
        <ScrollView
          scrollX
          style={{ flex: 1, overflow: 'hidden' }}
          enhanced
          showScrollbar={false}
        >
          <View style={{ display: 'flex', alignItems: 'center', whiteSpace: 'nowrap' }}>
            {/* 今日涨跌 */}
            <View style={{ width: '96px', flexShrink: 0, textAlign: 'center', paddingTop: '12px', paddingBottom: '12px' }}>
              <Text style={{ fontSize: '15px', fontWeight: '500', color: priceColor(todayChangeRate), fontVariantNumeric: 'tabular-nums' }}>
                {formatPercent(todayChangeRate)}
              </Text>
              <Text style={{ fontSize: '14px', marginTop: '2px', color: priceColor(todayChange), fontVariantNumeric: 'tabular-nums', display: 'block' }}>
                {todayChange >= 0 ? '+' : ''}{formatCurrency(todayChange)}
              </Text>
            </View>

            {/* 持有收益 */}
            <View style={{ width: '96px', flexShrink: 0, textAlign: 'center', paddingTop: '12px', paddingBottom: '12px' }}>
              <Text style={{ fontSize: '15px', fontWeight: '500', color: priceColor(profit), fontVariantNumeric: 'tabular-nums' }}>
                {profit >= 0 ? '+' : ''}{formatCurrency(profit)}
              </Text>
              <Text style={{ fontSize: '14px', marginTop: '2px', color: priceColor(profitRate), fontVariantNumeric: 'tabular-nums', display: 'block' }}>
                {formatPercent(profitRate)}
              </Text>
            </View>

            {/* 本周收益 */}
            <View style={{ width: '96px', flexShrink: 0, textAlign: 'center', paddingTop: '12px', paddingBottom: '12px' }}>
              {weekProfit !== undefined ? (
                <Text style={{ fontSize: '15px', fontWeight: '500', color: priceColor(weekProfit), fontVariantNumeric: 'tabular-nums' }}>
                  {weekProfit >= 0 ? '+' : ''}{formatCurrency(weekProfit)}
                </Text>
              ) : (
                <Text style={{ fontSize: '14px', color: '#B8BBC4' }}>--</Text>
              )}
            </View>

            {/* 持仓占比 */}
            <View style={{ width: '72px', flexShrink: 0, textAlign: 'center', paddingTop: '12px', paddingBottom: '12px' }}>
              <Text style={{ fontSize: '15px', color: '#2C2F36', fontVariantNumeric: 'tabular-nums' }}>
                {weight.toFixed(1)}%
              </Text>
            </View>

            {/* 净值 */}
            <View style={{ width: '80px', flexShrink: 0, textAlign: 'center', paddingTop: '12px', paddingBottom: '12px' }}>
              <Text style={{ fontSize: '15px', color: '#2C2F36', fontVariantNumeric: 'tabular-nums' }}>
                {currentNav.toFixed(4)}
              </Text>
              <View style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2px', marginTop: '2px' }}>
                <NavSourceBadge source={pnl.estimate?.navSource} />
                <Text style={{ fontSize: '14px', color: '#B8BBC4' }}>净值</Text>
              </View>
            </View>

            {/* 份额 */}
            <View style={{ width: '88px', flexShrink: 0, textAlign: 'center', paddingTop: '12px', paddingBottom: '12px' }}>
              <Text style={{ fontSize: '15px', color: '#2C2F36', fontVariantNumeric: 'tabular-nums' }}>
                {position.shares.toFixed(2)}
              </Text>
              <Text style={{ fontSize: '14px', color: '#B8BBC4', marginTop: '2px', display: 'block' }}>份额</Text>
            </View>

            {/* 成本 */}
            <View style={{ width: '80px', flexShrink: 0, textAlign: 'center', paddingTop: '12px', paddingBottom: '12px' }}>
              <Text style={{ fontSize: '15px', color: '#2C2F36', fontVariantNumeric: 'tabular-nums' }}>
                {position.costNav.toFixed(4)}
              </Text>
              <Text style={{ fontSize: '14px', color: '#B8BBC4', marginTop: '2px', display: 'block' }}>成本</Text>
            </View>
          </View>
        </ScrollView>
      </View>
    </View>
  )
}
