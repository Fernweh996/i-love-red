import { View, Text } from '@tarojs/components'
import { useState, useEffect } from 'react'
import { getFundHoldings } from '@/api'
import type { HoldingStock } from '@fund-manager/shared'

interface Props {
  code: string
}

export default function HoldingsTable({ code }: Props) {
  const [holdings, setHoldings] = useState<HoldingStock[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    getFundHoldings(code)
      .then(setHoldings)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [code])

  if (loading) {
    return (
      <View style={{ padding: '40px 0', textAlign: 'center' }}>
        <Text style={{ fontSize: '12px', color: '#9498A3' }}>加载持仓...</Text>
      </View>
    )
  }

  if (holdings.length === 0) {
    return (
      <View style={{ padding: '40px 0', textAlign: 'center' }}>
        <Text style={{ fontSize: '12px', color: '#B8BBC4' }}>暂无重仓股数据</Text>
      </View>
    )
  }

  return (
    <View style={{ paddingTop: '8px', paddingBottom: '8px' }}>
      {/* Table header */}
      <View style={{ display: 'flex', alignItems: 'center', padding: '8px 16px', }}>
        <Text style={{ width: '24px', fontSize: '11px', color: '#B8BBC4' }}>#</Text>
        <Text style={{ flex: 1, fontSize: '11px', color: '#B8BBC4' }}>股票名称</Text>
        <Text style={{ width: '60px', textAlign: 'right', fontSize: '11px', color: '#B8BBC4' }}>占比</Text>
      </View>

      {holdings.slice(0, 10).map((stock, i) => (
        <View
          key={stock.code}
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '10px 16px',
            borderTop: i > 0 ? '1px solid #DCDFE5' : 'none',
          }}
        >
          <Text style={{ width: '24px', fontSize: '12px', color: '#B8BBC4', fontWeight: '500' }}>{i + 1}</Text>
          <View style={{ flex: 1, overflow: 'hidden' }}>
            <Text style={{ fontSize: '13px', color: '#2C2F36', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{stock.name}</Text>
            <Text style={{ fontSize: '11px', color: '#B8BBC4', display: 'block', marginTop: '2px' }}>{stock.code}</Text>
          </View>
          <Text style={{ width: '60px', textAlign: 'right', fontSize: '13px', color: '#9498A3', fontWeight: '500' }}>
            {stock.proportion > 0 ? `${stock.proportion.toFixed(2)}%` : '--'}
          </Text>
        </View>
      ))}
    </View>
  )
}
