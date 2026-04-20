import { useRef } from 'react'
import { View } from '@tarojs/components'
import { usePullDownRefresh, stopPullDownRefresh } from '@tarojs/taro'
import Dashboard from '@/components/portfolio/Dashboard'
import type { DashboardHandle } from '@/components/portfolio/Dashboard'
import MarketIndexBar from '@/components/shared/MarketIndexBar'

export default function Portfolio() {
  const dashboardRef = useRef<DashboardHandle>(null)

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
