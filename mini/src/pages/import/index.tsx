import { useState } from 'react'
import { View, Text, Image, Input, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import type { ParsedFund } from '@fund-manager/shared'
import { usePortfolioStore } from '@/stores/portfolio'
import { chooseImage, recognizeImage, parseOCRText } from '@/lib/ocr'
import { showToast } from '@/stores/toast'

const colors = {
  ink: '#2C2F36',
  inkSecondary: '#9498A3',
  inkFaint: '#B8BBC4',
  surface: '#FFFFFF',
  surfaceBg: '#F0F1F4',
  accent: '#6B84B0',
  border: '#DCDFE5',
  rise: '#D94030',
  fall: '#2E8B57',
}

export default function Import() {
  const [imagePath, setImagePath] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [funds, setFunds] = useState<ParsedFund[]>([])
  const [error, setError] = useState<string | null>(null)
  const addPosition = usePortfolioStore((s) => s.addPosition)

  const groupId = Taro.getCurrentInstance().router?.params?.group || 'licaitong'

  const handleChooseImage = async () => {
    try {
      const path = await chooseImage()
      setImagePath(path)
      setError(null)
      setFunds([])

      setLoading(true)
      try {
        const lines = await recognizeImage(path)
        const parsed = parseOCRText(lines)
        if (parsed.length === 0) {
          setError('未识别到基金信息，请确保截图包含基金代码')
        } else {
          setFunds(parsed)
        }
      } catch {
        setError('OCR识别失败，请检查网络或稍后重试')
      } finally {
        setLoading(false)
      }
    } catch {
      // User cancelled
    }
  }

  const handleUpdateFund = (index: number, field: keyof ParsedFund, value: string) => {
    setFunds(prev => prev.map((f, i) => {
      if (i !== index) return f
      if (field === 'shares' || field === 'costNav') {
        return { ...f, [field]: value ? parseFloat(value) : undefined }
      }
      return { ...f, [field]: value }
    }))
  }

  const handleRemoveFund = (index: number) => {
    setFunds(prev => prev.filter((_, i) => i !== index))
  }

  const handleConfirmFund = (index: number) => {
    setFunds(prev => prev.map((f, i) => i === index ? { ...f, confirmed: !f.confirmed } : f))
  }

  const handleImport = () => {
    const confirmed = funds.filter(f => f.confirmed)
    if (confirmed.length === 0) {
      showToast('请先确认要导入的基金')
      return
    }

    for (const fund of confirmed) {
      addPosition(
        fund.fundCode,
        fund.fundName || fund.fundCode,
        fund.shares || 0,
        fund.costNav || 1,
        undefined,
        groupId
      )
    }

    showToast(`成功导入 ${confirmed.length} 只基金`)
    Taro.navigateBack()
  }

  const confirmedCount = funds.filter(f => f.confirmed).length

  return (
    <View style={{ minHeight: '100vh', backgroundColor: colors.surfaceBg }}>
      {/* Header */}
      <View style={{ backgroundColor: colors.surface, padding: '16px', borderBottom: `1px solid ${colors.border}` }}>
        <Text style={{ fontSize: '18px', fontWeight: '600', color: colors.ink }}>截图导入</Text>
        <View style={{ marginTop: '4px' }}>
          <Text style={{ fontSize: '12px', color: colors.inkFaint }}>
            拍照或选择持仓截图，OCR识别后导入基金信息
          </Text>
        </View>
      </View>

      <ScrollView scrollY style={{ height: 'calc(100vh - 140px)' }}>
        <View style={{ padding: '16px' }}>
          {/* Image picker area */}
          <View
            onClick={handleChooseImage}
            style={{
              backgroundColor: colors.surface,
              borderRadius: '12px',
              border: `2px dashed ${imagePath ? colors.accent : colors.border}`,
              padding: imagePath ? '8px' : '32px 16px',
              textAlign: 'center',
              marginBottom: '16px',
            }}
          >
            {imagePath ? (
              <View>
                <Image
                  src={imagePath}
                  mode="widthFix"
                  style={{ width: '100%', borderRadius: '8px' }}
                />
                <Text style={{ fontSize: '12px', color: colors.inkSecondary, marginTop: '8px', display: 'block' }}>
                  点击重新选择图片
                </Text>
              </View>
            ) : (
              <View>
                <Text style={{ fontSize: '40px', display: 'block', marginBottom: '8px' }}>📷</Text>
                <Text style={{ fontSize: '16px', fontWeight: '500', color: colors.ink, display: 'block' }}>
                  上传持仓截图
                </Text>
                <Text style={{ fontSize: '13px', color: colors.inkFaint, marginTop: '4px', display: 'block' }}>
                  支持拍照或从相册选择
                </Text>
                <Text style={{ fontSize: '12px', color: colors.inkFaint, marginTop: '4px', display: 'block' }}>
                  支付宝 / 理财通 持仓截图
                </Text>
              </View>
            )}
          </View>

          {/* Loading state */}
          {loading && (
            <View style={{ textAlign: 'center', padding: '24px 0' }}>
              <Text style={{ fontSize: '14px', color: colors.inkSecondary }}>正在识别中...</Text>
            </View>
          )}

          {/* Error message */}
          {error && (
            <View style={{
              backgroundColor: '#FEF2F2',
              border: `1px solid ${colors.rise}33`,
              borderRadius: '12px',
              padding: '12px',
              marginBottom: '16px',
            }}>
              <Text style={{ fontSize: '13px', color: colors.rise }}>{error}</Text>
            </View>
          )}

          {/* Results header */}
          {funds.length > 0 && (
            <View style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '12px',
            }}>
              <Text style={{ fontSize: '14px', fontWeight: '500', color: colors.ink }}>
                识别到 {funds.length} 只基金
              </Text>
              <Text style={{ fontSize: '12px', color: colors.inkFaint }}>
                已确认 {confirmedCount}/{funds.length}
              </Text>
            </View>
          )}

          {/* Fund cards */}
          {funds.map((fund, index) => (
            <View
              key={fund.fundCode + index}
              style={{
                backgroundColor: colors.surface,
                borderRadius: '12px',
                border: `1px solid ${fund.confirmed ? colors.fall + '4D' : colors.border}`,
                padding: '14px',
                marginBottom: '12px',
              }}
            >
              {/* Row 1: Code + Name */}
              <View style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                <Input
                  type="text"
                  value={fund.fundCode}
                  onInput={(e) => handleUpdateFund(index, 'fundCode', e.detail.value)}
                  placeholder="代码"
                  maxlength={6}
                  style={{
                    width: '72px',
                    fontSize: '14px',
                    fontFamily: 'monospace',
                    border: `1px solid ${colors.border}`,
                    borderRadius: '8px',
                    padding: '6px 8px',
                    marginRight: '8px',
                  }}
                />
                <Input
                  type="text"
                  value={fund.fundName}
                  onInput={(e) => handleUpdateFund(index, 'fundName', e.detail.value)}
                  placeholder="基金名称"
                  style={{
                    flex: '1',
                    fontSize: '13px',
                    color: colors.inkSecondary,
                    border: `1px solid ${colors.border}`,
                    borderRadius: '8px',
                    padding: '6px 8px',
                  }}
                />
                {/* Delete button */}
                <View
                  onClick={() => handleRemoveFund(index)}
                  style={{
                    marginLeft: '8px',
                    padding: '4px',
                  }}
                >
                  <Text style={{ fontSize: '16px', color: colors.inkFaint }}>✕</Text>
                </View>
              </View>

              {/* Row 2: Shares + Cost Nav */}
              <View style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                <View style={{ flex: '1' }}>
                  <Text style={{ fontSize: '11px', color: colors.inkFaint, marginBottom: '4px', display: 'block' }}>
                    持有份额
                  </Text>
                  <Input
                    type="digit"
                    value={fund.shares !== undefined ? String(fund.shares) : ''}
                    onInput={(e) => handleUpdateFund(index, 'shares', e.detail.value)}
                    placeholder="0.00"
                    style={{
                      fontSize: '13px',
                      border: `1px solid ${colors.border}`,
                      borderRadius: '8px',
                      padding: '6px 8px',
                    }}
                  />
                </View>
                <View style={{ flex: '1' }}>
                  <Text style={{ fontSize: '11px', color: colors.inkFaint, marginBottom: '4px', display: 'block' }}>
                    成本净值
                  </Text>
                  <Input
                    type="digit"
                    value={fund.costNav !== undefined ? String(fund.costNav) : ''}
                    onInput={(e) => handleUpdateFund(index, 'costNav', e.detail.value)}
                    placeholder="0.0000"
                    style={{
                      fontSize: '13px',
                      border: `1px solid ${colors.border}`,
                      borderRadius: '8px',
                      padding: '6px 8px',
                    }}
                  />
                </View>
              </View>

              {/* Confirm toggle */}
              <View
                onClick={() => handleConfirmFund(index)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <View style={{
                  width: '18px',
                  height: '18px',
                  borderRadius: '4px',
                  border: `1.5px solid ${fund.confirmed ? colors.fall : colors.border}`,
                  backgroundColor: fund.confirmed ? colors.fall : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  {fund.confirmed && (
                    <Text style={{ fontSize: '11px', color: '#FFFFFF' }}>✓</Text>
                  )}
                </View>
                <Text style={{ fontSize: '12px', color: fund.confirmed ? colors.fall : colors.inkFaint }}>
                  {fund.confirmed ? '已确认' : '确认此条'}
                </Text>
              </View>
            </View>
          ))}

          {/* Usage tips when no results */}
          {!loading && funds.length === 0 && !error && (
            <View style={{
              backgroundColor: colors.surface,
              borderRadius: '12px',
              border: `1px solid ${colors.border}`,
              padding: '16px',
              marginTop: '4px',
            }}>
              <Text style={{ fontSize: '13px', fontWeight: '500', color: colors.ink, marginBottom: '12px', display: 'block' }}>
                使用说明
              </Text>
              <View style={{ marginBottom: '8px', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                <Text style={{ fontSize: '12px', color: colors.accent, fontWeight: '500' }}>1</Text>
                <Text style={{ fontSize: '12px', color: colors.inkFaint }}>点击上方区域拍照或选择持仓截图</Text>
              </View>
              <View style={{ marginBottom: '8px', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                <Text style={{ fontSize: '12px', color: colors.accent, fontWeight: '500' }}>2</Text>
                <Text style={{ fontSize: '12px', color: colors.inkFaint }}>系统自动识别截图中的基金信息</Text>
              </View>
              <View style={{ marginBottom: '8px', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                <Text style={{ fontSize: '12px', color: colors.accent, fontWeight: '500' }}>3</Text>
                <Text style={{ fontSize: '12px', color: colors.inkFaint }}>确认并编辑识别结果后一键导入</Text>
              </View>
            </View>
          )}

          {/* Bottom spacer for fixed button */}
          {funds.length > 0 && <View style={{ height: '80px' }} />}
        </View>
      </ScrollView>

      {/* Fixed import button at bottom */}
      {funds.length > 0 && (
        <View style={{
          position: 'fixed',
          bottom: '0',
          left: '0',
          right: '0',
          padding: '12px 16px',
          paddingBottom: 'calc(12px + env(safe-area-inset-bottom))',
          backgroundColor: colors.surface,
          borderTop: `1px solid ${colors.border}`,
        }}>
          <View
            onClick={handleImport}
            style={{
              backgroundColor: confirmedCount > 0 ? colors.accent : colors.border,
              borderRadius: '12px',
              padding: '14px',
              textAlign: 'center',
            }}
          >
            <Text style={{ fontSize: '15px', fontWeight: '500', color: '#FFFFFF' }}>
              {confirmedCount > 0 ? `导入 ${confirmedCount} 只基金` : '请先确认要导入的基金'}
            </Text>
          </View>
        </View>
      )}
    </View>
  )
}
