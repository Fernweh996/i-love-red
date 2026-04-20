import { View, Text } from '@tarojs/components'
import { useMarketIndex } from '@/hooks/useMarketIndex'
import { priceDirection } from '@fund-manager/shared'

const INDEX_NAMES: Record<string, string> = {
  sh000001: '上证',
  sz399001: '深证',
  sz399006: '创业板',
}

const DIRECTION_COLORS = {
  rise: '#D94030',
  fall: '#2E8B57',
  flat: '#9498A3',
} as const

export default function MarketIndexBar() {
  const { indices, loading } = useMarketIndex()

  if (loading && indices.length === 0) {
    return (
      <View style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 24px', backgroundColor: '#F0F1F4' }}>
        {['上证', '深证', '创业板'].map((name) => (
          <View key={name} style={{ textAlign: 'center' }}>
            <Text style={{ fontSize: '14px', color: '#9498A3' }}>{name}</Text>
            <Text style={{ fontSize: '15px', color: '#9498A3', marginLeft: '6px' }}>—</Text>
          </View>
        ))}
      </View>
    )
  }

  if (indices.length === 0) return null

  return (
    <View style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 24px', backgroundColor: '#F0F1F4' }}>
      {indices.map((idx) => {
        const dir = priceDirection(idx.changeRate)
        const color = DIRECTION_COLORS[dir]
        return (
          <View key={idx.code} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Text style={{ fontSize: '14px', color: '#9498A3' }}>
              {INDEX_NAMES[idx.code] || idx.name}
            </Text>
            <Text style={{ fontSize: '15px', fontWeight: '500', color }}>
              {idx.changeRate > 0 ? '+' : ''}{idx.changeRate.toFixed(2)}%
            </Text>
          </View>
        )
      })}
    </View>
  )
}
