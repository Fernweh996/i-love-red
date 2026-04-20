import { useState, useEffect, useMemo, useRef } from 'react'
import { View, Text, Canvas } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useFundHistory, type Period } from '@/hooks/useFundHistory'
import PeriodSelector from './PeriodSelector'

const RISE = '#D94030'
const FALL = '#2E8B57'
const MAX_LIST_ROWS = 30

interface Props {
  code: string
  groupId?: string
}

function drawChart(
  ctx: any,
  width: number,
  height: number,
  data: { date: string; nav: number }[],
  lineColor: string
) {
  if (data.length < 2) return

  const padding = { top: 10, right: 10, bottom: 30, left: 50 }
  const chartW = width - padding.left - padding.right
  const chartH = height - padding.top - padding.bottom

  const navs = data.map((d) => d.nav)
  const minNav = Math.min(...navs)
  const maxNav = Math.max(...navs)
  const range = maxNav - minNav || 0.01
  const paddedMin = minNav - range * 0.1
  const paddedMax = maxNav + range * 0.1
  const paddedRange = paddedMax - paddedMin

  // Clear
  ctx.clearRect(0, 0, width, height)

  // Grid lines (4 horizontal)
  ctx.strokeStyle = '#F0F1F4'
  ctx.lineWidth = 0.5
  for (let i = 0; i <= 3; i++) {
    const y = padding.top + (chartH / 3) * i
    ctx.beginPath()
    ctx.moveTo(padding.left, y)
    ctx.lineTo(width - padding.right, y)
    ctx.stroke()

    // Y-axis labels
    const val = paddedMax - (paddedRange / 3) * i
    ctx.font = '10px sans-serif'
    ctx.fillStyle = '#9498A3'
    ctx.textAlign = 'right'
    ctx.fillText(val.toFixed(3), padding.left - 5, y + 3)
  }

  // Reference line (start NAV)
  const startNav = data[0].nav
  const refY = padding.top + ((paddedMax - startNav) / paddedRange) * chartH
  ctx.strokeStyle = '#DCDFE5'
  ctx.lineWidth = 0.5
  ctx.setLineDash([4, 4])
  ctx.beginPath()
  ctx.moveTo(padding.left, refY)
  ctx.lineTo(width - padding.right, refY)
  ctx.stroke()
  ctx.setLineDash([])

  // NAV line
  ctx.strokeStyle = lineColor
  ctx.lineWidth = 1.5
  ctx.beginPath()
  data.forEach((d, i) => {
    const x = padding.left + (i / (data.length - 1)) * chartW
    const y = padding.top + ((paddedMax - d.nav) / paddedRange) * chartH
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  })
  ctx.stroke()

  // X-axis labels (first, middle, last)
  ctx.fillStyle = '#9498A3'
  ctx.font = '10px sans-serif'
  ctx.textAlign = 'center'
  const labelIndices = [0, Math.floor(data.length / 2), data.length - 1]
  for (const idx of labelIndices) {
    const x = padding.left + (idx / (data.length - 1)) * chartW
    ctx.fillText(data[idx].date.slice(5), x, height - 5)
  }
}

export default function NAVChart({ code, groupId }: Props) {
  const [period, setPeriod] = useState<Period>('3m')
  const { records, loading, error } = useFundHistory(code, period)
  const canvasReady = useRef(false)

  const chartData = useMemo(() => {
    return records.map((r) => ({ date: r.date, nav: r.nav }))
  }, [records])

  const overallChange = useMemo(() => {
    if (records.length < 2) return 0
    const first = records[0].nav
    const last = records[records.length - 1].nav
    return ((last - first) / first) * 100
  }, [records])

  const lineColor = overallChange >= 0 ? RISE : FALL

  // Records newest-first for the list
  const listRecords = useMemo(() => [...records].reverse(), [records])
  const displayRecords = listRecords.slice(0, MAX_LIST_ROWS)
  const showViewAll = listRecords.length > MAX_LIST_ROWS

  useEffect(() => {
    if (chartData.length < 2) return

    const query = Taro.createSelectorQuery()
    query
      .select('#nav-chart')
      .fields({ node: true, size: true })
      .exec((res) => {
        if (!res || !res[0]) return
        const canvas = res[0].node
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        const dpr = Taro.getSystemInfoSync().pixelRatio
        const width = res[0].width
        const height = res[0].height
        canvas.width = width * dpr
        canvas.height = height * dpr
        ctx.scale(dpr, dpr)
        drawChart(ctx, width, height, chartData, lineColor)
      })
  }, [chartData, lineColor])

  return (
    <View style={{ padding: '0 12px 16px' }}>
      {/* Period selector + change summary */}
      <View style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0 8px' }}>
        <PeriodSelector value={period} onChange={setPeriod} />
        {records.length > 0 && (
          <Text
            style={{
              fontSize: '12px',
              fontWeight: '500',
              color: overallChange >= 0 ? RISE : FALL,
            }}
          >
            {overallChange >= 0 ? '+' : ''}
            {overallChange.toFixed(2)}%
          </Text>
        )}
      </View>

      {/* Chart area */}
      {loading ? (
        <View style={{ padding: '40px 0', textAlign: 'center' }}>
          <Text style={{ fontSize: '12px', color: '#B8BBC4' }}>加载历史数据...</Text>
        </View>
      ) : error ? (
        <View style={{ padding: '40px 0', textAlign: 'center' }}>
          <Text style={{ fontSize: '12px', color: '#B8BBC4' }}>{error}</Text>
        </View>
      ) : (
        <Canvas
          type="2d"
          id="nav-chart"
          style={{ width: '100%', height: '220px' }}
        />
      )}

      {/* NAV History List */}
      {!loading && !error && records.length > 0 && (
        <View style={{ borderTop: '1px solid #F0F1F4', marginTop: '8px' }}>
          <View style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0' }}>
            <Text style={{ fontSize: '13px', fontWeight: '500', color: '#2C2F36' }}>过往净值</Text>
            <Text style={{ fontSize: '11px', color: '#B8BBC4' }}>共{listRecords.length}个交易日</Text>
          </View>

          {/* Table header */}
          <View style={{ display: 'flex', paddingBottom: '6px', borderBottom: '1px solid #F0F1F4' }}>
            <Text style={{ flex: 1, fontSize: '11px', color: '#B8BBC4' }}>日期</Text>
            <Text style={{ width: '80px', textAlign: 'right', fontSize: '11px', color: '#B8BBC4' }}>单位净值</Text>
            <Text style={{ width: '80px', textAlign: 'right', fontSize: '11px', color: '#B8BBC4' }}>日涨幅</Text>
          </View>

          {/* Table rows */}
          {displayRecords.map((r) => (
            <View
              key={r.date}
              style={{ display: 'flex', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #F0F1F4' }}
            >
              <Text style={{ flex: 1, fontSize: '12px', color: '#6B6E76' }}>{r.date}</Text>
              <Text style={{ width: '80px', textAlign: 'right', fontSize: '12px', color: '#2C2F36' }}>
                {r.nav.toFixed(4)}
              </Text>
              <Text
                style={{
                  width: '80px',
                  textAlign: 'right',
                  fontSize: '12px',
                  fontWeight: '500',
                  color: r.changeRate > 0 ? RISE : r.changeRate < 0 ? FALL : '#B8BBC4',
                }}
              >
                {r.changeRate > 0 ? '+' : ''}
                {r.changeRate.toFixed(2)}%
              </Text>
            </View>
          ))}

          {/* View all button */}
          {showViewAll && (
            <View style={{ padding: '12px 0', textAlign: 'center', borderTop: '1px solid #F0F1F4' }}>
              <Text style={{ fontSize: '13px', color: '#6B84B0' }}>查看全部历史净值 &gt;</Text>
            </View>
          )}
        </View>
      )}
    </View>
  )
}
