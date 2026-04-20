import { useMemo, useRef, useState } from 'react'
import Taro, { useShareAppMessage, usePullDownRefresh } from '@tarojs/taro'
import { View, Text } from '@tarojs/components'
import { formatPercent, getCurrentNav, getCurrentChangeRate, priceDirection } from '@fund-manager/shared'
import { useWatchlistStore } from '@/stores/watchlist'
import { useFundCacheStore } from '@/stores/fund-cache'
import { showToast } from '@/stores/toast'
import { useFundEstimate } from '@/hooks/useFundEstimate'
import GroupTabs from '@/components/portfolio/GroupTabs'
import EmptyState from '@/components/shared/EmptyState'

const COLORS = { rise: '#D94030', fall: '#2E8B57', flat: '#9498A3' }

interface WatchCardProps {
  fundCode: string
  fundName: string
  fundType?: string
  onRemove: () => void
  onClick: () => void
}

function WatchCard({ fundCode, fundName, fundType, onRemove, onClick }: WatchCardProps) {
  const estimate = useFundCacheStore((s) => s.estimates[fundCode])
  const currentNav = getCurrentNav(estimate, 0)
  const changeRate = getCurrentChangeRate(estimate)

  const [offsetX, setOffsetX] = useState(0)
  const [swiping, setSwiping] = useState(false)
  const startXRef = useRef(0)
  const startOffsetRef = useRef(0)
  const DELETE_THRESHOLD = 72

  const onTouchStart = (e) => {
    startXRef.current = e.touches[0].clientX
    startOffsetRef.current = offsetX
    setSwiping(true)
  }

  const onTouchMove = (e) => {
    if (!swiping) return
    const dx = e.touches[0].clientX - startXRef.current
    const next = Math.max(-DELETE_THRESHOLD, Math.min(0, startOffsetRef.current + dx))
    setOffsetX(next)
  }

  const onTouchEnd = () => {
    setSwiping(false)
    setOffsetX(offsetX < -DELETE_THRESHOLD / 2 ? -DELETE_THRESHOLD : 0)
  }

  const typeLabel = fundType ? fundType.replace(/型.*$/, '').slice(0, 4) : ''
  const color = COLORS[priceDirection(changeRate)]

  return (
    <View style={{ position: 'relative', overflow: 'hidden', backgroundColor: '#FFFFFF' }}>
      {/* Delete button behind */}
      <View style={{
        position: 'absolute', right: 0, top: 0, bottom: 0, width: '72px',
        display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#D94030',
      }}>
        <View onClick={onRemove} style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: '#FFFFFF', fontSize: '12px', fontWeight: '500' }}>移除</Text>
        </View>
      </View>

      {/* Main content */}
      <View
        style={{
          position: 'relative', backgroundColor: '#FFFFFF',
          display: 'flex', alignItems: 'center', minHeight: '56px', padding: '0 16px',
          transform: `translateX(${offsetX}px)`,
          transition: swiping ? 'none' : 'transform 0.2s ease-out',
        }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onClick={() => {
          if (offsetX < -10) { setOffsetX(0); return }
          onClick()
        }}
      >
        <View style={{ flex: 1, minWidth: 0 }}>
          <View style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Text style={{ fontSize: '14px', fontWeight: '500', color: '#2C2F36', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{fundName}</Text>
            {typeLabel ? (
              <Text style={{ flexShrink: 0, fontSize: '9px', color: '#9498A3', border: '1px solid #DCDFE5', padding: '1px 4px', borderRadius: '2px' }}>{typeLabel}</Text>
            ) : null}
          </View>
          <Text style={{ fontSize: '11px', color: '#B8BBC4', marginTop: '2px' }}>{fundCode}</Text>
        </View>
        <View style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Text style={{ fontSize: '15px', fontWeight: 'bold', color }}>{formatPercent(changeRate)}</Text>
          <Text style={{ fontSize: '13px', color: '#9498A3', width: '60px', textAlign: 'right' }}>
            {currentNav > 0 ? currentNav.toFixed(4) : '--'}
          </Text>
          <Text style={{ fontSize: '14px', color: '#B8BBC4', marginLeft: '-4px' }}>›</Text>
        </View>
      </View>
    </View>
  )
}

export default function WatchlistPage() {
  const items = useWatchlistStore((s) => s.items)
  const activeGroupId = useWatchlistStore((s) => s.activeGroupId)
  const setActiveGroupId = useWatchlistStore((s) => s.setActiveGroupId)
  const removeItem = useWatchlistStore((s) => s.removeItem)

  const { refresh } = useFundEstimate()

  usePullDownRefresh(async () => {
    try {
      await refresh()
    } finally {
      Taro.stopPullDownRefresh()
    }
  })

  useShareAppMessage(() => ({
    title: '基金管家 — 我的自选基金',
    path: '/pages/watchlist/index',
  }))

  const filteredItems = useMemo(() => {
    if (activeGroupId === 'all') return items
    return items.filter((i) => i.groupId === activeGroupId)
  }, [items, activeGroupId])

  const getCount = (groupId: string) =>
    items.filter((i) => i.groupId === groupId).length

  return (
    <View style={{ paddingBottom: '8px' }}>
      <GroupTabs
        activeGroupId={activeGroupId}
        onGroupChange={setActiveGroupId}
        getCount={getCount}
      />

      {filteredItems.length === 0 ? (
        <EmptyState
          icon="⭐"
          title={activeGroupId === 'all' ? '还没有自选基金' : '该分组暂无自选'}
          description="点击顶部搜索栏添加你关注的基金吧"
        />
      ) : (
        <View>
          {/* Column header */}
          <View style={{ display: 'flex', alignItems: 'center', padding: '0 16px', backgroundColor: '#FFFFFF', borderBottom: '1px solid #F0F1F4', minHeight: '32px' }}>
            <Text style={{ flex: 1, fontSize: '11px', color: '#B8BBC4' }}>基金名称</Text>
            <Text style={{ fontSize: '11px', color: '#B8BBC4', width: '80px', textAlign: 'center' }}>涨跌幅</Text>
            <Text style={{ fontSize: '11px', color: '#B8BBC4', width: '60px', textAlign: 'right' }}>净值</Text>
          </View>

          {filteredItems.map((item) => (
            <View key={`${item.fundCode}-${item.groupId}`} style={{ borderBottom: '1px solid #F0F1F4' }}>
              <WatchCard
                fundCode={item.fundCode}
                fundName={item.fundName}
                fundType={item.fundType}
                onRemove={() => {
                  removeItem(item.fundCode, item.groupId)
                  showToast('已移除自选')
                }}
                onClick={() => Taro.navigateTo({ url: `/pages/fund-detail/index?code=${item.fundCode}` })}
              />
            </View>
          ))}

          <View style={{ padding: '12px 16px', backgroundColor: '#FFFFFF', marginTop: '1px' }}>
            <Text style={{ fontSize: '10px', color: '#B8BBC4' }}>← 左滑可移除</Text>
          </View>
        </View>
      )}
    </View>
  )
}
