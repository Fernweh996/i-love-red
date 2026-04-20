import { View, Text } from '@tarojs/components'
import Taro, { getCurrentInstance, useShareAppMessage } from '@tarojs/taro'
import { useState, useEffect, useMemo } from 'react'
import { getFundEstimate, getFundHistory } from '@/api'
import { usePortfolioStore, DEFAULT_GROUP_ID } from '@/stores/portfolio'
import { useWatchlistStore } from '@/stores/watchlist'
import { showToast } from '@/stores/toast'
import {
  formatCurrency,
  formatNav,
  formatPercent,
  priceDirection,
  getCurrentNav,
  getRealtimeNav,
  getCurrentChangeRate,
} from '@fund-manager/shared'
import type { FundEstimate } from '@fund-manager/shared'
import NavSourceBadge from '@/components/shared/NavSourceBadge'
import HoldingsTable from '@/components/fund/HoldingsTable'
import NAVChart from '@/components/chart/NAVChart'

type Tab = 'chart' | 'holdings'

const COLORS = {
  rise: '#D94030',
  fall: '#2E8B57',
  flat: '#9498A3',
}

function getColor(value: number) {
  return COLORS[priceDirection(value)]
}

export default function FundDetail() {
  const { code, group } = getCurrentInstance().router?.params || {}
  const groupId = group || DEFAULT_GROUP_ID

  const positions = usePortfolioStore((s) => s.positions)
  const removePosition = usePortfolioStore((s) => s.removePosition)
  const isWatching = useWatchlistStore((s) => s.isWatching(code || ''))
  const addWatch = useWatchlistStore((s) => s.addItem)
  const removeWatch = useWatchlistStore((s) => s.removeItem)

  const [estimate, setEstimate] = useState<FundEstimate | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<Tab>('holdings')
  const [prevNav, setPrevNav] = useState<number | null>(null)

  const position = positions.find((p) => p.fundCode === code && p.groupId === groupId)

  const fundName = estimate?.name || position?.fundName

  useShareAppMessage(() => ({
    title: `${fundName || '基金详情'} — 基金管家`,
    path: `/pages/fund-detail/index?code=${code}`,
  }))

  useEffect(() => {
    if (!code) return
    setLoading(true)
    Taro.showLoading({ title: '加载中...' })
    getFundEstimate(code)
      .then(setEstimate)
      .catch(console.error)
      .finally(() => {
        setLoading(false)
        Taro.hideLoading()
      })
    getFundHistory(code, 1, 3).then(({ records }) => {
      if (records.length >= 2) {
        setPrevNav(records[1].nav)
      }
    }).catch(() => {})
  }, [code])

  // Dynamic nav bar title
  useEffect(() => {
    const name = fundName
    if (name) {
      Taro.setNavigationBarTitle({ title: name })
    }
  }, [estimate?.name, position?.fundName])

  const stats = useMemo(() => {
    if (!position || !estimate) return null
    const currentNav = getCurrentNav(estimate, estimate.lastNav)
    const realtimeNav = getRealtimeNav(estimate, estimate.lastNav)
    const lastNav = estimate.lastNav
    const marketValue = position.shares * currentNav
    const profit = marketValue - position.totalCost
    const profitRate = position.totalCost > 0 ? (profit / position.totalCost) * 100 : 0
    const todayChange = position.shares * (realtimeNav - lastNav)
    const isEstimate = estimate.navSource === 'estimate'
    const yesterdayChange = prevNav !== null ? position.shares * (lastNav - prevNav) : undefined
    const holdDays = Math.max(1, Math.floor((Date.now() - position.createTime) / 86400000))
    return { currentNav, marketValue, profit, profitRate, todayChange, isEstimate, yesterdayChange, holdDays }
  }, [position, estimate, prevNav])

  if (!code) return <View />

  const tabs: { key: Tab; label: string }[] = [
    { key: 'chart', label: '业绩走势' },
    { key: 'holdings', label: '重仓股' },
  ]

  return (
    <View style={{ minHeight: '100vh', backgroundColor: '#F0F1F4', paddingBottom: '120px' }}>
      {/* Header */}
      <View style={{ backgroundColor: '#FFFFFF', borderBottom: '1px solid #DCDFE5', padding: '12px 16px 20px' }}>
        {estimate && (
          <View style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <View>
              <Text style={{ fontSize: '11px', color: '#9498A3' }}>当日涨幅 </Text>
              <NavSourceBadge source={estimate.navSource} />
              <Text style={{ fontSize: '24px', fontWeight: 'bold', display: 'block', marginTop: '4px', color: getColor(getCurrentChangeRate(estimate)) }}>
                {formatPercent(getCurrentChangeRate(estimate))}
              </Text>
            </View>
            <View style={{ textAlign: 'right' }}>
              <Text style={{ fontSize: '11px', color: '#9498A3' }}>最新净值 </Text>
              <NavSourceBadge source={estimate.navSource} />
              <Text style={{ fontSize: '18px', fontWeight: '600', display: 'block', marginTop: '4px', color: '#2C2F36' }}>
                {formatNav(getCurrentNav(estimate, estimate.lastNav))}
              </Text>
            </View>
          </View>
        )}
        {loading && <Text style={{ fontSize: '13px', color: '#9498A3' }}>加载中...</Text>}
      </View>

      {!loading && (
        <View>
          {/* Stats grid */}
          {position && stats && (
            <View style={{ backgroundColor: '#FFFFFF', margin: '12px 12px 0', borderRadius: '12px', overflow: 'hidden' }}>
              {/* Row 1 */}
              <View style={{ display: 'flex' }}>
                <StatCell label="持有金额" value={formatCurrency(stats.marketValue)} />
                <StatCell label="持有份额" value={position.shares.toFixed(2)} />
                <StatCell label="持仓成本" value={formatNav(position.costNav)} />
              </View>
              {/* Row 2 */}
              <View style={{ display: 'flex', borderTop: '1px solid #F0F1F4' }}>
                <StatCell label="持有收益" value={`${stats.profit >= 0 ? '+' : ''}${formatCurrency(stats.profit)}`} color={getColor(stats.profit)} />
                <StatCell label="持有收益率" value={formatPercent(stats.profitRate)} color={getColor(stats.profitRate)} />
                <StatCell label="总投入" value={formatCurrency(position.totalCost)} />
              </View>
              {/* Row 3 */}
              <View style={{ display: 'flex', borderTop: '1px solid #F0F1F4' }}>
                <View style={{ flex: 1, padding: '12px' }}>
                  <View style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
                    <Text style={{ fontSize: '11px', color: '#B8BBC4' }}>当日收益 </Text>
                    {stats.isEstimate ? (
                      <Text style={{ fontSize: '9px', backgroundColor: '#FAF5E6', color: '#A67B20', padding: '1px 4px', borderRadius: '2px' }}>估</Text>
                    ) : (
                      <Text style={{ fontSize: '9px', backgroundColor: '#EBF5EF', color: '#2E8B57', padding: '1px 4px', borderRadius: '2px' }}>已更新</Text>
                    )}
                  </View>
                  <Text style={{ fontSize: '15px', fontWeight: '600', color: getColor(stats.todayChange) }}>
                    {stats.todayChange >= 0 ? '+' : ''}{formatCurrency(stats.todayChange)}
                  </Text>
                </View>
                <StatCell
                  label="昨日收益"
                  value={stats.yesterdayChange !== undefined ? `${stats.yesterdayChange >= 0 ? '+' : ''}${formatCurrency(stats.yesterdayChange)}` : '--'}
                  color={stats.yesterdayChange !== undefined ? getColor(stats.yesterdayChange) : '#B8BBC4'}
                />
                <StatCell label="持有天数" value={`${stats.holdDays}`} />
              </View>
            </View>
          )}

          {/* Tabs */}
          <View style={{ display: 'flex', backgroundColor: '#FFFFFF', margin: '12px 12px 0', borderRadius: '12px 12px 0 0', borderBottom: '1px solid #F0F1F4' }}>
            {tabs.map((tab) => (
              <View
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{ flex: 1, textAlign: 'center', padding: '12px 0', position: 'relative' }}
              >
                <Text style={{ fontSize: '13px', color: activeTab === tab.key ? '#2C2F36' : '#B8BBC4', fontWeight: activeTab === tab.key ? '500' : 'normal' }}>
                  {tab.label}
                </Text>
                {activeTab === tab.key && (
                  <View style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '20px', height: '2px', backgroundColor: '#6B84B0', borderRadius: '1px' }} />
                )}
              </View>
            ))}
          </View>

          {/* Tab content */}
          <View style={{ margin: '0 12px 12px', backgroundColor: '#FFFFFF', borderRadius: '0 0 12px 12px', overflow: 'hidden' }}>
            {activeTab === 'chart' && (
              <NAVChart code={code} groupId={groupId} />
            )}
            {activeTab === 'holdings' && <HoldingsTable code={code} />}
          </View>
        </View>
      )}

      {/* Bottom Action Bar */}
      <View style={{ position: 'fixed', bottom: 0, left: 0, right: 0, backgroundColor: '#FFFFFF', borderTop: '1px solid #F0F1F4', paddingBottom: 'env(safe-area-inset-bottom)', zIndex: 50 }}>
        <View style={{ display: 'flex', alignItems: 'center' }}>
          {position ? (
            <>
              <View
                onClick={() => Taro.navigateTo({ url: `/pages/position-edit/index?code=${code}&group=${groupId}` })}
                style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '10px 0', color: '#9498A3' }}
              >
                <Text style={{ fontSize: '16px', marginBottom: '2px' }}>✎</Text>
                <Text style={{ fontSize: '10px' }}>修改持仓</Text>
              </View>
              <View
                onClick={() => showToast('功能开发中')}
                style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '10px 0', color: '#9498A3' }}
              >
                <Text style={{ fontSize: '16px', marginBottom: '2px' }}>⏱</Text>
                <Text style={{ fontSize: '10px' }}>交易记录</Text>
              </View>
            </>
          ) : (
            <View
              onClick={() => Taro.navigateTo({ url: `/pages/position-edit/index?code=${code}&group=${groupId}` })}
              style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '10px 0', color: '#6B84B0' }}
            >
              <Text style={{ fontSize: '16px', marginBottom: '2px' }}>+</Text>
              <Text style={{ fontSize: '10px' }}>添加持仓</Text>
            </View>
          )}
          {/* Watchlist toggle */}
          <View
            onClick={() => {
              if (!code) return
              if (isWatching) {
                removeWatch(code, groupId)
                showToast('已移除自选')
              } else {
                addWatch(code, estimate?.name || position?.fundName || '', position?.fundType, groupId)
                showToast('已加入自选')
              }
            }}
            style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '10px 0', color: isWatching ? '#A67B20' : '#9498A3' }}
          >
            <Text style={{ fontSize: '16px', marginBottom: '2px' }}>{isWatching ? '★' : '☆'}</Text>
            <Text style={{ fontSize: '10px' }}>{isWatching ? '删自选' : '加自选'}</Text>
          </View>
          {/* Delete */}
          {position && (
            <View
              onClick={() => {
                Taro.showModal({
                  title: '确认删除',
                  content: `确定删除 ${position.fundName} 的持仓？`,
                  success: (res) => {
                    if (res.confirm) {
                      removePosition(code, groupId)
                      showToast('已删除持仓')
                      Taro.navigateBack()
                    }
                  },
                })
              }}
              style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '10px 0', color: '#9498A3' }}
            >
              <Text style={{ fontSize: '16px', marginBottom: '2px' }}>🗑</Text>
              <Text style={{ fontSize: '10px' }}>删除持有</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  )
}

function StatCell({ label, value, color = '#2C2F36' }: { label: string; value: string; color?: string }) {
  return (
    <View style={{ flex: 1, padding: '12px' }}>
      <Text style={{ fontSize: '11px', color: '#B8BBC4', display: 'block', marginBottom: '4px' }}>{label}</Text>
      <Text style={{ fontSize: '15px', fontWeight: '600', color }}>{value}</Text>
    </View>
  )
}
