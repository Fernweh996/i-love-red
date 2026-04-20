import { useState, useMemo } from 'react'
import { View, Text, Input } from '@tarojs/components'
import Taro, { getCurrentInstance } from '@tarojs/taro'
import { usePortfolioStore, DEFAULT_GROUP_ID } from '@/stores/portfolio'
import { showToast } from '@/stores/toast'
import { useFundSearch } from '@/hooks/useFundSearch'
import type { FundInfo } from '@fund-manager/shared'

type Tab = 'add' | 'reduce' | 'dip' | 'convert'

const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: 'add', label: '加仓', icon: '📈' },
  { key: 'reduce', label: '减仓', icon: '📉' },
  { key: 'dip', label: '定投', icon: '🔄' },
  { key: 'convert', label: '转换', icon: '🔀' },
]

export default function PositionEdit() {
  const { code, group } = getCurrentInstance().router?.params || {}
  const groupId = group || DEFAULT_GROUP_ID

  const positions = usePortfolioStore((s) => s.positions)
  const addToPosition = usePortfolioStore((s) => s.addToPosition)
  const addPosition = usePortfolioStore((s) => s.addPosition)
  const reducePosition = usePortfolioStore((s) => s.reducePosition)
  const convertPosition = usePortfolioStore((s) => s.convertPosition)

  const position = positions.find((p) => p.fundCode === code && p.groupId === groupId)

  const availableTabs = position
    ? TABS
    : TABS.filter((t) => t.key === 'add' || t.key === 'dip')

  const [activeTab, setActiveTab] = useState<Tab>('add')

  // Add tab state
  const [addShares, setAddShares] = useState('')
  const [addCostNav, setAddCostNav] = useState('')

  // Reduce tab state
  const [reduceShares, setReduceShares] = useState('')

  // DIP tab state
  const [dipAmount, setDipAmount] = useState('')
  const [dipNav, setDipNav] = useState('')
  const dipShares = useMemo(() => {
    const amt = parseFloat(dipAmount)
    const nav = parseFloat(dipNav)
    if (isNaN(amt) || isNaN(nav) || nav <= 0) return 0
    return amt / nav
  }, [dipAmount, dipNav])

  // Convert tab state
  const [convertShares, setConvertShares] = useState('')
  const [convertQuery, setConvertQuery] = useState('')
  const [selectedFund, setSelectedFund] = useState<FundInfo | null>(null)
  const [convertNav, setConvertNav] = useState('')
  const { results: searchResults, loading: searchLoading } = useFundSearch(convertQuery)

  if (!code) return <View />

  const handleAdd = () => {
    const s = parseFloat(addShares)
    const c = parseFloat(addCostNav)
    if (isNaN(s) || s <= 0 || isNaN(c) || c <= 0) {
      showToast('请输入有效的份额和净值')
      return
    }
    if (position) {
      addToPosition(code, groupId, s, c)
    } else {
      addPosition(code, '', s, c, undefined, groupId)
    }
    showToast('加仓成功')
    setAddShares('')
    setAddCostNav('')
  }

  const handleReduce = () => {
    const s = parseFloat(reduceShares)
    if (isNaN(s) || s <= 0) {
      showToast('请输入有效的份额')
      return
    }
    if (position && s > position.shares) {
      showToast('减仓份额不能超过持有份额')
      return
    }
    reducePosition(code, groupId, s)
    if (position && s >= position.shares) {
      showToast('已清仓')
      Taro.navigateBack()
      return
    }
    showToast('减仓成功')
    setReduceShares('')
  }

  const handleDip = () => {
    const amt = parseFloat(dipAmount)
    const nav = parseFloat(dipNav)
    if (isNaN(amt) || amt <= 0 || isNaN(nav) || nav <= 0) {
      showToast('请输入有效的金额和净值')
      return
    }
    const shares = amt / nav
    if (position) {
      addToPosition(code, groupId, shares, nav)
    } else {
      addPosition(code, '', shares, nav, undefined, groupId)
    }
    showToast(`定投成功，买入 ${shares.toFixed(2)} 份`)
    setDipAmount('')
    setDipNav('')
  }

  const handleConvert = () => {
    if (!selectedFund) {
      showToast('请选择目标基金')
      return
    }
    const s = parseFloat(convertShares)
    const nav = parseFloat(convertNav)
    if (isNaN(s) || s <= 0) {
      showToast('请输入转换份额')
      return
    }
    if (position && s > position.shares) {
      showToast('转换份额不能超过持有份额')
      return
    }
    if (isNaN(nav) || nav <= 0) {
      showToast('请输入目标基金净值')
      return
    }
    convertPosition(code, groupId, selectedFund.code, selectedFund.name, s, nav, selectedFund.type)
    showToast('转换成功')
    if (position && s >= position.shares) {
      Taro.navigateBack()
      return
    }
    setConvertShares('')
    setConvertNav('')
    setSelectedFund(null)
    setConvertQuery('')
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    border: '1px solid #DCDFE5',
    borderRadius: '12px',
    padding: '12px 16px',
    fontSize: '14px',
    boxSizing: 'border-box',
  }

  const labelStyle: React.CSSProperties = {
    fontSize: '12px',
    color: '#9498A3',
    marginBottom: '6px',
    display: 'block',
  }

  return (
    <View style={{ minHeight: '100vh', backgroundColor: '#F0F1F4' }}>
      {/* Header */}
      <View style={{ backgroundColor: '#FFFFFF', padding: '12px 16px 16px', borderBottom: '1px solid #DCDFE5' }}>
        <View style={{ display: 'flex', alignItems: 'center' }}>
          <View onClick={() => Taro.navigateBack()} style={{ padding: '4px', marginRight: '12px' }}>
            <Text style={{ fontSize: '18px', color: '#9498A3' }}>←</Text>
          </View>
          <View>
            <Text style={{ fontSize: '15px', fontWeight: 'bold', color: '#2C2F36', display: 'block' }}>
              {position ? '修改持仓' : '添加持仓'}
            </Text>
            <Text style={{ fontSize: '11px', color: '#B8BBC4', marginTop: '2px', display: 'block' }}>
              {position?.fundName || code} ({code})
            </Text>
          </View>
        </View>
      </View>

      {/* Tab Bar + Content */}
      <View style={{ backgroundColor: '#FFFFFF', margin: '12px', borderRadius: '12px', overflow: 'hidden' }}>
        {/* Tabs */}
        <View style={{ display: 'flex', borderBottom: '1px solid #DCDFE5' }}>
          {availableTabs.map((tab) => (
            <View
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                flex: 1,
                textAlign: 'center',
                padding: '12px 0',
                position: 'relative',
              }}
            >
              <Text style={{ fontSize: '13px', color: activeTab === tab.key ? '#6B84B0' : '#B8BBC4', fontWeight: activeTab === tab.key ? '500' : 'normal' }}>
                {tab.icon} {tab.label}
              </Text>
              {activeTab === tab.key && (
                <View style={{ position: 'absolute', bottom: '0', left: '50%', transform: 'translateX(-50%)', width: '32px', height: '2px', backgroundColor: '#6B84B0', borderRadius: '1px' }} />
              )}
            </View>
          ))}
        </View>

        {/* Content */}
        <View style={{ padding: '16px' }}>
          {/* Current position info */}
          {position && (
            <View style={{ backgroundColor: 'rgba(107,132,176,0.1)', borderRadius: '8px', padding: '10px 12px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: '12px', color: '#9498A3' }}>当前持有</Text>
              <Text style={{ fontSize: '12px', color: '#2C2F36', fontWeight: '500' }}>
                {position.shares.toFixed(2)} 份 · 成本 {position.costNav.toFixed(4)}
              </Text>
            </View>
          )}

          {/* Add Tab */}
          {activeTab === 'add' && (
            <View>
              <View style={{ marginBottom: '16px' }}>
                <Text style={labelStyle}>加仓份额</Text>
                <Input type="digit" value={addShares} onInput={(e) => setAddShares(e.detail.value)} placeholder="例: 1000" style={inputStyle} />
              </View>
              <View style={{ marginBottom: '16px' }}>
                <Text style={labelStyle}>成本净值</Text>
                <Input type="digit" value={addCostNav} onInput={(e) => setAddCostNav(e.detail.value)} placeholder="例: 1.2345" style={inputStyle} />
              </View>
              <View onClick={handleAdd} style={{ width: '100%', backgroundColor: '#6B84B0', color: '#FFFFFF', padding: '12px 0', borderRadius: '12px', textAlign: 'center' }}>
                <Text style={{ fontSize: '14px', fontWeight: '500', color: '#FFFFFF' }}>确认加仓</Text>
              </View>
            </View>
          )}

          {/* Reduce Tab */}
          {activeTab === 'reduce' && (
            <View>
              <View style={{ marginBottom: '16px' }}>
                <Text style={labelStyle}>减仓份额</Text>
                <Input type="digit" value={reduceShares} onInput={(e) => setReduceShares(e.detail.value)} placeholder={position ? `最多 ${position.shares.toFixed(2)}` : '请输入份额'} style={inputStyle} />
              </View>
              {position && reduceShares && (
                <View style={{ marginBottom: '16px' }}>
                  <Text style={{ fontSize: '12px', color: '#B8BBC4' }}>
                    减仓后剩余：{Math.max(0, position.shares - (parseFloat(reduceShares) || 0)).toFixed(2)} 份
                    {parseFloat(reduceShares) >= position.shares ? '（将清仓此基金）' : ''}
                  </Text>
                </View>
              )}
              <View onClick={handleReduce} style={{ width: '100%', backgroundColor: '#A67B20', color: '#FFFFFF', padding: '12px 0', borderRadius: '12px', textAlign: 'center' }}>
                <Text style={{ fontSize: '14px', fontWeight: '500', color: '#FFFFFF' }}>确认减仓</Text>
              </View>
            </View>
          )}

          {/* DIP Tab */}
          {activeTab === 'dip' && (
            <View>
              <View style={{ marginBottom: '16px' }}>
                <Text style={labelStyle}>定投金额（元）</Text>
                <Input type="digit" value={dipAmount} onInput={(e) => setDipAmount(e.detail.value)} placeholder="例: 500" style={inputStyle} />
              </View>
              <View style={{ marginBottom: '16px' }}>
                <Text style={labelStyle}>确认净值</Text>
                <Input type="digit" value={dipNav} onInput={(e) => setDipNav(e.detail.value)} placeholder="例: 1.2345" style={inputStyle} />
              </View>
              {dipShares > 0 && (
                <View style={{ backgroundColor: 'rgba(46,139,87,0.1)', borderRadius: '8px', padding: '10px 12px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: '12px', color: '#9498A3' }}>预计买入份额</Text>
                  <Text style={{ fontSize: '12px', color: '#2E8B57', fontWeight: '500' }}>{dipShares.toFixed(2)} 份</Text>
                </View>
              )}
              <View onClick={handleDip} style={{ width: '100%', backgroundColor: '#2E8B57', color: '#FFFFFF', padding: '12px 0', borderRadius: '12px', textAlign: 'center' }}>
                <Text style={{ fontSize: '14px', fontWeight: '500', color: '#FFFFFF' }}>确认定投</Text>
              </View>
            </View>
          )}

          {/* Convert Tab */}
          {activeTab === 'convert' && (
            <View>
              <View style={{ marginBottom: '16px' }}>
                <Text style={labelStyle}>转换份额</Text>
                <Input type="digit" value={convertShares} onInput={(e) => setConvertShares(e.detail.value)} placeholder={position ? `最多 ${position.shares.toFixed(2)}` : '请输入份额'} style={inputStyle} />
              </View>

              {/* Target fund search */}
              <View style={{ marginBottom: '16px' }}>
                <Text style={labelStyle}>目标基金</Text>
                {selectedFund ? (
                  <View style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid rgba(107,132,176,0.3)', backgroundColor: 'rgba(107,132,176,0.1)', borderRadius: '12px', padding: '12px 16px' }}>
                    <View>
                      <Text style={{ fontSize: '14px', color: '#2C2F36', fontWeight: '500' }}>{selectedFund.name}</Text>
                      <Text style={{ fontSize: '11px', color: '#B8BBC4', marginLeft: '8px' }}>{selectedFund.code}</Text>
                    </View>
                    <View onClick={() => { setSelectedFund(null); setConvertQuery('') }}>
                      <Text style={{ fontSize: '12px', color: '#B8BBC4' }}>更换</Text>
                    </View>
                  </View>
                ) : (
                  <View>
                    <Input
                      value={convertQuery}
                      onInput={(e) => setConvertQuery(e.detail.value)}
                      placeholder="搜索基金代码或名称"
                      style={inputStyle}
                    />
                    {(searchResults.length > 0 || searchLoading) && convertQuery && (
                      <View style={{ marginTop: '4px', backgroundColor: '#FFFFFF', border: '1px solid #DCDFE5', borderRadius: '12px', maxHeight: '200px', overflow: 'auto' }}>
                        {searchLoading && (
                          <View style={{ padding: '12px', textAlign: 'center' }}>
                            <Text style={{ fontSize: '12px', color: '#B8BBC4' }}>搜索中...</Text>
                          </View>
                        )}
                        {searchResults.map((fund) => (
                          <View
                            key={fund.code}
                            onClick={() => { setSelectedFund(fund); setConvertQuery('') }}
                            style={{ padding: '10px 16px', borderBottom: '1px solid #F0F1F4' }}
                          >
                            <Text style={{ fontSize: '14px', color: '#2C2F36' }}>{fund.name}</Text>
                            <Text style={{ fontSize: '11px', color: '#B8BBC4', marginLeft: '8px' }}>{fund.code}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                )}
              </View>

              <View style={{ marginBottom: '16px' }}>
                <Text style={labelStyle}>目标基金净值</Text>
                <Input type="digit" value={convertNav} onInput={(e) => setConvertNav(e.detail.value)} placeholder="例: 1.5678" style={inputStyle} />
              </View>

              {convertShares && convertNav && selectedFund && (
                <View style={{ backgroundColor: 'rgba(107,132,176,0.1)', borderRadius: '8px', padding: '10px 12px', marginBottom: '16px' }}>
                  <View style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <Text style={{ fontSize: '12px', color: '#9498A3' }}>转出金额</Text>
                    <Text style={{ fontSize: '12px', color: '#9498A3', fontWeight: '500' }}>
                      {position ? (parseFloat(convertShares) * position.costNav).toFixed(2) : '--'} 元
                    </Text>
                  </View>
                  <View style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: '12px', color: '#9498A3' }}>预计转入</Text>
                    <Text style={{ fontSize: '12px', color: '#6B84B0', fontWeight: '500' }}>
                      {position ? ((parseFloat(convertShares) * position.costNav) / parseFloat(convertNav)).toFixed(2) : '--'} 份 {selectedFund.name}
                    </Text>
                  </View>
                </View>
              )}

              <View onClick={handleConvert} style={{ width: '100%', backgroundColor: '#6B84B0', color: '#FFFFFF', padding: '12px 0', borderRadius: '12px', textAlign: 'center' }}>
                <Text style={{ fontSize: '14px', fontWeight: '500', color: '#FFFFFF' }}>确认转换</Text>
              </View>
            </View>
          )}
        </View>
      </View>
    </View>
  )
}
