import { useRef } from 'react'
import { View } from '@tarojs/components'
import { usePullDownRefresh, stopPullDownRefresh, useShareAppMessage, useShareTimeline } from '@tarojs/taro'
import Dashboard from '@/components/portfolio/Dashboard'
import type { DashboardHandle } from '@/components/portfolio/Dashboard'
import MarketIndexBar from '@/components/shared/MarketIndexBar'

export default function Portfolio() {
  const dashboardRef = useRef<DashboardHandle>(null)

  useShareAppMessage(() => ({
    title: '基金管家 — 我的持仓一览',
    path: '/pages/portfolio/index',
  }))

  useShareTimeline(() => ({
    title: '基金管家 — 轻松管理基金持仓',
  }))

  usePullDownRefresh(async () => {
    try {
      await dashboardRef.current?.refresh()
    } finally {
      stopPullDownRefresh()
    }
  })

  return (
    <View style={{ minHeight: '100vh', backgroundColor: '#F0F1F4' }}>
      <MarketIndexBar />
      <Dashboard ref={dashboardRef} />
    </View>
  )
}
