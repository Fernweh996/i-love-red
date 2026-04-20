import { useState } from 'react'
import Taro from '@tarojs/taro'
import { View, Text, Input } from '@tarojs/components'
import { useFundSearch } from '@/hooks/useFundSearch'
import type { FundInfo } from '@fund-manager/shared'

function fundTypeBadgeStyle(type: string): { bg: string; color: string } {
  if (type.includes('指数') || type.includes('混合')) return { bg: 'rgba(107,132,176,0.1)', color: '#6B84B0' }
  if (type.includes('股票')) return { bg: 'rgba(217,64,48,0.1)', color: '#D94030' }
  if (type.includes('债券')) return { bg: 'rgba(46,139,87,0.1)', color: '#2E8B57' }
  if (type.includes('QDII')) return { bg: '#FAF5E6', color: '#A67B20' }
  return { bg: '#F0F1F4', color: '#9498A3' }
}

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const { results, loading } = useFundSearch(query)

  const handleSelect = (fund: FundInfo) => {
    Taro.navigateTo({ url: `/pages/fund-detail/index?code=${fund.code}` })
  }

  return (
    <View style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#FFFFFF' }}>
      {/* Search header */}
      <View style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', borderBottom: '1px solid #DCDFE5' }}>
        <View style={{ flex: 1, display: 'flex', alignItems: 'center', backgroundColor: '#F0F1F4', borderRadius: '12px', padding: '8px 12px' }}>
          <Text style={{ fontSize: '14px', color: '#B8BBC4', marginRight: '8px' }}>🔍</Text>
          <Input
            value={query}
            onInput={(e) => setQuery(e.detail.value)}
            placeholder="输入基金代码、名称或拼音"
            placeholderStyle="color:#B8BBC4;font-size:14px"
            style={{ flex: 1, fontSize: '14px', color: '#2C2F36' }}
            focus
          />
          {query ? (
            <View onClick={() => setQuery('')} style={{ marginLeft: '8px', padding: '2px' }}>
              <Text style={{ fontSize: '14px', color: '#B8BBC4' }}>✕</Text>
            </View>
          ) : null}
          {loading ? (
            <Text style={{ fontSize: '12px', color: '#6B84B0', marginLeft: '8px' }}>...</Text>
          ) : null}
        </View>
        <View onClick={() => Taro.navigateBack()} style={{ flexShrink: 0 }}>
          <Text style={{ fontSize: '14px', color: '#9498A3' }}>取消</Text>
        </View>
      </View>

      {/* Results */}
      <View style={{ flex: 1, overflow: 'hidden' }}>
        {!query.trim() && (
          <View style={{ textAlign: 'center', marginTop: '60px' }}>
            <Text style={{ fontSize: '12px', color: '#B8BBC4' }}>支持基金代码、名称、拼音搜索</Text>
          </View>
        )}
        {query.trim() && loading && (
          <View style={{ textAlign: 'center', marginTop: '40px' }}>
            <Text style={{ fontSize: '13px', color: '#6B84B0' }}>搜索中...</Text>
          </View>
        )}
        {query.trim() && !loading && results.length === 0 && (
          <View style={{ textAlign: 'center', marginTop: '60px' }}>
            <Text style={{ fontSize: '32px', display: 'block', marginBottom: '8px' }}>🔍</Text>
            <Text style={{ fontSize: '13px', color: '#B8BBC4' }}>未找到相关基金</Text>
          </View>
        )}
        {results.map((fund) => {
          const shortType = fund.type.replace(/型.*$/, '').slice(0, 4)
          const badge = fundTypeBadgeStyle(fund.type)
          return (
            <View
              key={fund.code}
              onClick={() => handleSelect(fund)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '12px 16px', borderBottom: '1px solid #F0F1F4',
              }}
            >
              <View style={{ flex: 1, minWidth: 0 }}>
                <View style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Text style={{ fontSize: '13px', fontWeight: '500', color: '#2C2F36', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{fund.name}</Text>
                  <Text style={{
                    flexShrink: 0, fontSize: '9px', padding: '1px 6px', borderRadius: '2px',
                    backgroundColor: badge.bg, color: badge.color,
                  }}>{shortType}</Text>
                </View>
                <Text style={{ fontSize: '11px', color: '#B8BBC4', marginTop: '2px' }}>{fund.code}</Text>
              </View>
              <Text style={{ fontSize: '16px', color: '#B8BBC4', flexShrink: 0 }}>›</Text>
            </View>
          )
        })}
      </View>
    </View>
  )
}
