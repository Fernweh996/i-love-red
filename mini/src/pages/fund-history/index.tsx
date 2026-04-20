import { useState, useEffect, useCallback } from 'react'
import { View, Text } from '@tarojs/components'
import Taro, { getCurrentInstance } from '@tarojs/taro'
import { getFundHistory, getFundEstimate } from '@/api'
import type { NavRecord } from '@fund-manager/shared'

const PAGE_SIZE = 30

function getColor(change: number): string {
  if (change > 0) return '#D94030'
  if (change < 0) return '#2E8B57'
  return '#9498A3'
}

export default function FundHistory() {
  const { code } = getCurrentInstance().router?.params || {}

  const [fundName, setFundName] = useState('')
  const [records, setRecords] = useState<NavRecord[]>([])
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)

  useEffect(() => {
    if (!code) return
    getFundEstimate(code)
      .then((est) => setFundName(est.name))
      .catch(() => {})
  }, [code])

  const loadPage = useCallback(
    async (pageNum: number) => {
      if (!code) return
      setLoading(true)
      try {
        const data = await getFundHistory(code, pageNum, PAGE_SIZE)
        setTotalCount(data.totalCount)
        if (pageNum === 1) {
          setRecords(data.records)
        } else {
          setRecords((prev) => [...prev, ...data.records])
        }
        setPage(pageNum)
      } catch (err) {
        console.error('Failed to load history', err)
      } finally {
        setLoading(false)
        setInitialLoading(false)
      }
    },
    [code],
  )

  useEffect(() => {
    loadPage(1)
  }, [loadPage])

  const hasMore = records.length < totalCount

  if (!code) return <View />

  return (
    <View style={{ minHeight: '100vh', backgroundColor: '#F0F1F4', paddingBottom: '24px' }}>
      {/* Header */}
      <View style={{ backgroundColor: '#FFFFFF', borderBottom: '1px solid #F0F1F4', position: 'sticky', top: '0', zIndex: 10 }}>
        <View style={{ display: 'flex', alignItems: 'center', padding: '12px 16px' }}>
          <View onClick={() => Taro.navigateBack()} style={{ padding: '4px', marginRight: '12px' }}>
            <Text style={{ fontSize: '18px', color: '#2C2F36' }}>←</Text>
          </View>
          <View style={{ flex: 1, textAlign: 'center' }}>
            <Text style={{ fontSize: '15px', fontWeight: '500', color: '#2C2F36', display: 'block' }}>
              {fundName || '历史净值'}
            </Text>
            <Text style={{ fontSize: '11px', color: '#B8BBC4', marginTop: '2px', display: 'block' }}>{code}</Text>
          </View>
          <View style={{ width: '20px' }} />
        </View>
      </View>

      {initialLoading ? (
        <View style={{ padding: '40px 0', textAlign: 'center' }}>
          <Text style={{ fontSize: '13px', color: '#9498A3' }}>加载历史净值...</Text>
        </View>
      ) : (
        <View style={{ margin: '12px', backgroundColor: '#FFFFFF', borderRadius: '12px', overflow: 'hidden' }}>
          {/* Table header */}
          <View style={{ display: 'flex', padding: '10px 12px', borderBottom: '1px solid #F0F1F4' }}>
            <Text style={{ flex: 1, fontSize: '11px', color: '#B8BBC4' }}>日期</Text>
            <Text style={{ width: '80px', textAlign: 'right', fontSize: '11px', color: '#B8BBC4' }}>单位净值</Text>
            <Text style={{ width: '80px', textAlign: 'right', fontSize: '11px', color: '#B8BBC4' }}>日涨幅</Text>
          </View>

          {/* Records */}
          {records.map((r, i) => (
            <View
              key={r.date}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '8px 12px',
                borderBottom: i < records.length - 1 ? '1px solid #F8F8F8' : 'none',
              }}
            >
              <Text style={{ flex: 1, fontSize: '12px', color: '#9498A3' }}>{r.date}</Text>
              <Text style={{ width: '80px', textAlign: 'right', fontSize: '12px', color: '#2C2F36' }}>
                {r.nav.toFixed(4)}
              </Text>
              <Text style={{ width: '80px', textAlign: 'right', fontSize: '12px', fontWeight: '500', color: getColor(r.changeRate) }}>
                {r.changeRate > 0 ? '+' : ''}{r.changeRate.toFixed(2)}%
              </Text>
            </View>
          ))}

          {/* Load more */}
          {hasMore && (
            <View
              onClick={() => !loading && loadPage(page + 1)}
              style={{ padding: '12px 0', textAlign: 'center', borderTop: '1px solid #F0F1F4' }}
            >
              <Text style={{ fontSize: '13px', color: loading ? '#B8BBC4' : '#6B84B0' }}>
                {loading ? '加载中...' : '加载更多'}
              </Text>
            </View>
          )}

          {!hasMore && records.length > 0 && (
            <View style={{ padding: '12px 0', textAlign: 'center', borderTop: '1px solid #F8F8F8' }}>
              <Text style={{ fontSize: '11px', color: '#B8BBC4' }}>已显示全部 {totalCount} 条记录</Text>
            </View>
          )}
        </View>
      )}
    </View>
  )
}
