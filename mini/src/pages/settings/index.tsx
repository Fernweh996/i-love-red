import { useState } from 'react'
import Taro from '@tarojs/taro'
import { View, Text, Input } from '@tarojs/components'
import { useLockStore } from '@/stores/lock'
import { usePortfolioStore } from '@/stores/portfolio'
import { useWatchlistStore } from '@/stores/watchlist'
import { showToast } from '@/stores/toast'

type LockMode = 'always' | 'daily' | 'never'

const LOCK_MODE_LABELS: Record<LockMode, string> = {
  always: '每次打开',
  daily: '每日首次',
  never: '从不',
}

function PinSetupInline({ onComplete, onCancel }: { onComplete: (pin: string) => void; onCancel: () => void }) {
  const [step, setStep] = useState<'enter' | 'confirm'>('enter')
  const [firstPin, setFirstPin] = useState('')
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')

  const handleInput = (value: string) => {
    setError('')
    setPin(value)
    if (value.length === 4) {
      if (step === 'enter') {
        setFirstPin(value)
        setPin('')
        setStep('confirm')
      } else {
        if (value === firstPin) {
          onComplete(value)
        } else {
          setError('两次输入不一致，请重新输入')
          setPin('')
          setStep('enter')
          setFirstPin('')
        }
      }
    }
  }

  return (
    <View style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', padding: '24px 16px', textAlign: 'center' }}>
      <Text style={{ fontSize: '16px', fontWeight: '600', color: '#2C2F36', display: 'block', marginBottom: '8px' }}>
        {step === 'enter' ? '设置 4 位 PIN 码' : '再次输入确认'}
      </Text>
      <Text style={{ fontSize: '12px', color: '#9498A3', display: 'block', marginBottom: '16px' }}>
        {step === 'enter' ? '请输入 4 位数字' : '请再次输入相同的 PIN 码'}
      </Text>
      <Input
        type="number"
        password
        maxlength={4}
        value={pin}
        onInput={(e) => handleInput(e.detail.value)}
        focus
        placeholder="····"
        placeholderStyle="color:#B8BBC4;font-size:24px;letter-spacing:8px"
        style={{
          width: '160px', margin: '0 auto', textAlign: 'center',
          fontSize: '24px', letterSpacing: '8px',
          border: '1px solid #DCDFE5', borderRadius: '12px', padding: '12px',
        }}
      />
      {error && (
        <Text style={{ fontSize: '12px', color: '#D94030', display: 'block', marginTop: '8px' }}>{error}</Text>
      )}
      <View onClick={onCancel} style={{ marginTop: '16px', padding: '8px' }}>
        <Text style={{ fontSize: '13px', color: '#9498A3' }}>取消</Text>
      </View>
    </View>
  )
}

export default function SettingsPage() {
  const pinHash = useLockStore((s) => s.pinHash)
  const lockMode = useLockStore((s) => s.lockMode)
  const setPin = useLockStore((s) => s.setPin)
  const removePin = useLockStore((s) => s.removePin)
  const setLockMode = useLockStore((s) => s.setLockMode)

  const [showPinSetup, setShowPinSetup] = useState(false)
  const hasPin = !!pinHash

  const handleSetPin = (pin: string) => {
    setPin(pin)
    setShowPinSetup(false)
    showToast('PIN 码已设置')
  }

  const handleRemovePin = () => {
    Taro.showModal({
      title: '确认',
      content: '确定关闭 PIN 码锁？',
      success: (res) => {
        if (res.confirm) {
          removePin()
          showToast('PIN 码已关闭')
        }
      },
    })
  }

  const handleExport = () => {
    const portfolioState = usePortfolioStore.getState()
    const watchlistState = useWatchlistStore.getState()

    const data = {
      version: 1,
      exportTime: new Date().toISOString(),
      portfolio: {
        positions: portfolioState.positions,
        groups: portfolioState.groups,
      },
      watchlist: {
        items: watchlistState.items,
      },
    }

    Taro.setClipboardData({
      data: JSON.stringify(data),
      success: () => showToast('数据已复制到剪贴板'),
    })
  }

  const handleImport = () => {
    Taro.getClipboardData({
      success: (res) => {
        try {
          const data = JSON.parse(res.data)
          if (!data.portfolio && !data.watchlist) {
            showToast('剪贴板中无有效备份数据')
            return
          }
          Taro.showModal({
            title: '确认导入',
            content: '导入将覆盖当前所有数据，确定继续？',
            success: (modalRes) => {
              if (modalRes.confirm) {
                if (data.portfolio) {
                  usePortfolioStore.setState({
                    groups: data.portfolio.groups || [],
                    positions: data.portfolio.positions || [],
                  })
                }
                if (data.watchlist) {
                  useWatchlistStore.setState({
                    items: data.watchlist.items || [],
                  })
                }
                showToast('数据已恢复')
              }
            },
          })
        } catch {
          showToast('剪贴板数据格式错误')
        }
      },
    })
  }

  if (showPinSetup) {
    return (
      <View style={{ minHeight: '100vh', backgroundColor: '#F0F1F4', padding: '60px 16px' }}>
        <PinSetupInline onComplete={handleSetPin} onCancel={() => setShowPinSetup(false)} />
      </View>
    )
  }

  return (
    <View style={{ minHeight: '100vh', backgroundColor: '#F0F1F4' }}>
      <View style={{ padding: '16px' }}>
        {/* Security section */}
        <View style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', padding: '16px', marginBottom: '16px' }}>
          <Text style={{ fontSize: '13px', color: '#B8BBC4', fontWeight: '500', display: 'block', marginBottom: '12px' }}>🔐 安全设置</Text>

          {/* PIN status */}
          <View style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0' }}>
            <View>
              <Text style={{ fontSize: '14px', color: '#2C2F36', display: 'block' }}>PIN 码锁</Text>
              <Text style={{ fontSize: '11px', color: '#B8BBC4', marginTop: '2px' }}>{hasPin ? '已设置' : '未设置'}</Text>
            </View>
            <View style={{ display: 'flex', gap: '8px' }}>
              {hasPin ? (
                <>
                  <View onClick={() => setShowPinSetup(true)} style={{ padding: '6px 10px' }}>
                    <Text style={{ fontSize: '12px', color: '#6B84B0' }}>修改</Text>
                  </View>
                  <View onClick={handleRemovePin} style={{ padding: '6px 10px' }}>
                    <Text style={{ fontSize: '12px', color: '#D94030' }}>关闭</Text>
                  </View>
                </>
              ) : (
                <View onClick={() => setShowPinSetup(true)} style={{ padding: '6px 10px' }}>
                  <Text style={{ fontSize: '12px', color: '#6B84B0' }}>设置 PIN</Text>
                </View>
              )}
            </View>
          </View>

          {/* Lock frequency */}
          {hasPin && (
            <View style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #F0F1F4' }}>
              <Text style={{ fontSize: '13px', color: '#9498A3', display: 'block', marginBottom: '8px' }}>解锁频率</Text>
              <View style={{ display: 'flex', gap: '8px' }}>
                {(Object.keys(LOCK_MODE_LABELS) as LockMode[]).map((m) => (
                  <View
                    key={m}
                    onClick={() => setLockMode(m)}
                    style={{
                      flex: 1, padding: '8px 0', borderRadius: '8px', textAlign: 'center',
                      backgroundColor: lockMode === m ? 'rgba(107,132,176,0.1)' : '#F0F1F4',
                      border: lockMode === m ? '1px solid rgba(107,132,176,0.3)' : '1px solid transparent',
                    }}
                  >
                    <Text style={{ fontSize: '12px', color: lockMode === m ? '#6B84B0' : '#9498A3' }}>
                      {LOCK_MODE_LABELS[m]}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>

        {/* Data management section */}
        <View style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', padding: '16px' }}>
          <Text style={{ fontSize: '13px', color: '#B8BBC4', fontWeight: '500', display: 'block', marginBottom: '12px' }}>💾 数据管理</Text>

          <View onClick={handleExport} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #F0F1F4' }}>
            <View>
              <Text style={{ fontSize: '14px', color: '#2C2F36', display: 'block' }}>导出数据</Text>
              <Text style={{ fontSize: '11px', color: '#B8BBC4', marginTop: '2px' }}>复制备份数据到剪贴板</Text>
            </View>
            <Text style={{ fontSize: '16px', color: '#B8BBC4' }}>›</Text>
          </View>

          <View onClick={handleImport} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0' }}>
            <View>
              <Text style={{ fontSize: '14px', color: '#2C2F36', display: 'block' }}>导入数据</Text>
              <Text style={{ fontSize: '11px', color: '#B8BBC4', marginTop: '2px' }}>从剪贴板粘贴恢复数据</Text>
            </View>
            <Text style={{ fontSize: '16px', color: '#B8BBC4' }}>›</Text>
          </View>
        </View>

        {/* About section */}
        <View style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', padding: '16px', marginTop: '16px' }}>
          <Text style={{ fontSize: '13px', color: '#B8BBC4', fontWeight: '500', display: 'block', marginBottom: '12px' }}>ℹ️ 关于</Text>

          <View onClick={() => Taro.navigateTo({ url: '/pages/privacy/index' })} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #F0F1F4' }}>
            <Text style={{ fontSize: '14px', color: '#2C2F36' }}>隐私政策</Text>
            <Text style={{ fontSize: '16px', color: '#B8BBC4' }}>›</Text>
          </View>

          <View onClick={() => Taro.navigateTo({ url: '/pages/about/index' })} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0' }}>
            <Text style={{ fontSize: '14px', color: '#2C2F36' }}>关于基金管家</Text>
            <Text style={{ fontSize: '16px', color: '#B8BBC4' }}>›</Text>
          </View>
        </View>
      </View>
    </View>
  )
}
