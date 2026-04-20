import { useState } from 'react'
import Taro from '@tarojs/taro'
import { View, Text, Input } from '@tarojs/components'
import { usePortfolioStore } from '@/stores/portfolio'
import { useWatchlistStore } from '@/stores/watchlist'
import { showToast } from '@/stores/toast'

const EMOJI_OPTIONS = ['📊', '💳', '🏦', '💵', '🎯', '📱', '🏠', '✈️', '💰', '🔵', '📂', '⭐']

export default function GroupManagerPage() {
  const groups = usePortfolioStore((s) => s.groups)
  const positions = usePortfolioStore((s) => s.positions)
  const addGroup = usePortfolioStore((s) => s.addGroup)
  const updateGroup = usePortfolioStore((s) => s.updateGroup)
  const removeGroup = usePortfolioStore((s) => s.removeGroup)
  const clearGroup = usePortfolioStore((s) => s.clearGroup)
  const watchItems = useWatchlistStore((s) => s.items)
  const clearWatchGroup = useWatchlistStore((s) => s.clearGroup)

  const [mode, setMode] = useState<'list' | 'edit' | 'create'>('list')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [icon, setIcon] = useState('📊')

  const sortedGroups = [...groups].sort((a, b) => a.order - b.order)

  const getPositionCount = (groupId: string) =>
    positions.filter((p) => p.groupId === groupId).length

  const getWatchCount = (groupId: string) =>
    watchItems.filter((i) => i.groupId === groupId).length

  const handleCreate = () => {
    if (!name.trim()) return
    addGroup(name.trim(), icon)
    showToast('分组已创建')
    setMode('list')
    setName('')
    setIcon('📊')
  }

  const handleUpdate = () => {
    if (!editingId || !name.trim()) return
    updateGroup(editingId, name.trim(), icon)
    showToast('分组已更新')
    setMode('list')
    setEditingId(null)
    setName('')
    setIcon('📊')
  }

  const handleDelete = (id: string, groupName: string) => {
    const pCount = getPositionCount(id)
    const msg = pCount > 0
      ? `删除分组"${groupName}"后，其中 ${pCount} 只持仓基金将移入"默认"分组，确定删除？`
      : `确定删除分组"${groupName}"？`
    Taro.showModal({
      title: '确认删除',
      content: msg,
      success: (res) => {
        if (res.confirm) {
          removeGroup(id)
          clearWatchGroup(id)
          showToast('分组已删除')
        }
      },
    })
  }

  const handleClear = (id: string, groupName: string) => {
    const pCount = getPositionCount(id)
    const wCount = getWatchCount(id)
    const total = pCount + wCount
    if (total === 0) return
    const parts: string[] = []
    if (pCount > 0) parts.push(`${pCount} 只持仓`)
    if (wCount > 0) parts.push(`${wCount} 只自选`)
    Taro.showModal({
      title: '确认清空',
      content: `确定清空"${groupName}"中的 ${parts.join(' 和 ')}？此操作不可撤销。`,
      success: (res) => {
        if (res.confirm) {
          if (pCount > 0) clearGroup(id)
          if (wCount > 0) clearWatchGroup(id)
          showToast(`已清空 ${total} 只基金`)
        }
      },
    })
  }

  const startEdit = (id: string) => {
    const group = groups.find((g) => g.id === id)
    if (!group) return
    setEditingId(id)
    setName(group.name)
    setIcon(group.icon)
    setMode('edit')
  }

  const startCreate = () => {
    setEditingId(null)
    setName('')
    setIcon('📊')
    setMode('create')
  }

  if (mode !== 'list') {
    return (
      <View style={{ minHeight: '100vh', backgroundColor: '#F0F1F4' }}>
        {/* Header */}
        <View style={{ display: 'flex', alignItems: 'center', backgroundColor: '#FFFFFF', borderBottom: '1px solid #F0F1F4', padding: '12px 16px' }}>
          <View onClick={() => setMode('list')} style={{ marginRight: '12px' }}>
            <Text style={{ fontSize: '16px', color: '#9498A3' }}>‹</Text>
          </View>
          <Text style={{ fontSize: '16px', fontWeight: '600', color: '#2C2F36' }}>
            {mode === 'create' ? '新建分组' : '编辑分组'}
          </Text>
        </View>

        <View style={{ padding: '16px' }}>
          <View style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', padding: '16px' }}>
            {/* Name input */}
            <View style={{ marginBottom: '16px' }}>
              <Text style={{ fontSize: '12px', color: '#9498A3', marginBottom: '8px', display: 'block' }}>分组名称</Text>
              <Input
                value={name}
                onInput={(e) => setName(e.detail.value)}
                placeholder="例: 我的基金"
                maxlength={10}
                focus
                style={{ width: '100%', border: '1px solid #DCDFE5', borderRadius: '12px', padding: '12px 16px', fontSize: '14px', color: '#2C2F36' }}
              />
            </View>

            {/* Icon picker */}
            <View style={{ marginBottom: '16px' }}>
              <Text style={{ fontSize: '12px', color: '#9498A3', marginBottom: '8px', display: 'block' }}>选择图标</Text>
              <View style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {EMOJI_OPTIONS.map((emoji) => (
                  <View
                    key={emoji}
                    onClick={() => setIcon(emoji)}
                    style={{
                      width: '40px', height: '40px', borderRadius: '12px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '18px',
                      backgroundColor: icon === emoji ? 'rgba(107,132,176,0.1)' : '#F0F1F4',
                      border: icon === emoji ? '2px solid #6B84B0' : '2px solid transparent',
                    }}
                  >
                    <Text>{emoji}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Submit button */}
            <View
              onClick={mode === 'create' ? handleCreate : handleUpdate}
              style={{
                width: '100%', padding: '12px 0', borderRadius: '12px', textAlign: 'center',
                backgroundColor: name.trim() ? '#6B84B0' : 'rgba(107,132,176,0.5)',
                color: '#FFFFFF',
              }}
            >
              <Text style={{ fontSize: '14px', fontWeight: '500', color: '#FFFFFF' }}>
                {mode === 'create' ? '确认创建' : '保存修改'}
              </Text>
            </View>
          </View>
        </View>
      </View>
    )
  }

  return (
    <View style={{ minHeight: '100vh', backgroundColor: '#F0F1F4' }}>
      <View style={{ padding: '16px' }}>
        {/* Group list */}
        <View style={{ marginBottom: '16px' }}>
          {sortedGroups.map((group) => {
            const pCount = getPositionCount(group.id)
            const wCount = getWatchCount(group.id)
            const total = pCount + wCount
            return (
              <View
                key={group.id}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '12px 16px', backgroundColor: '#FFFFFF', borderRadius: '12px', marginBottom: '8px',
                }}
              >
                <View style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Text style={{ fontSize: '20px' }}>{group.icon}</Text>
                  <View>
                    <View style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Text style={{ fontSize: '14px', color: '#2C2F36', fontWeight: '500' }}>{group.name}</Text>
                      {group.isPreset && (
                        <Text style={{ fontSize: '10px', color: '#B8BBC4', backgroundColor: '#F0F1F4', padding: '2px 6px', borderRadius: '4px' }}>预设</Text>
                      )}
                    </View>
                    <Text style={{ fontSize: '11px', color: '#B8BBC4', marginTop: '2px' }}>
                      {pCount > 0 ? `${pCount} 只持仓` : ''}{pCount > 0 && wCount > 0 ? ' · ' : ''}{wCount > 0 ? `${wCount} 只自选` : ''}{total === 0 ? '暂无基金' : ''}
                    </Text>
                  </View>
                </View>
                <View style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {total > 0 && (
                    <View onClick={() => handleClear(group.id, group.name)} style={{ padding: '6px 10px' }}>
                      <Text style={{ fontSize: '12px', color: '#A67B20' }}>清空</Text>
                    </View>
                  )}
                  <View onClick={() => startEdit(group.id)} style={{ padding: '6px 10px' }}>
                    <Text style={{ fontSize: '12px', color: '#6B84B0' }}>编辑</Text>
                  </View>
                  {!group.isPreset && (
                    <View onClick={() => handleDelete(group.id, group.name)} style={{ padding: '6px 10px' }}>
                      <Text style={{ fontSize: '12px', color: '#D94030' }}>删除</Text>
                    </View>
                  )}
                </View>
              </View>
            )
          })}
        </View>

        {/* Create button */}
        <View
          onClick={startCreate}
          style={{
            width: '100%', padding: '12px 0', borderRadius: '12px', textAlign: 'center',
            backgroundColor: '#6B84B0',
          }}
        >
          <Text style={{ fontSize: '14px', fontWeight: '500', color: '#FFFFFF' }}>+ 新建分组</Text>
        </View>

        {/* Settings link */}
        <View
          onClick={() => Taro.navigateTo({ url: '/pages/settings/index' })}
          style={{ textAlign: 'center', marginTop: '24px', padding: '8px' }}
        >
          <Text style={{ fontSize: '13px', color: '#B8BBC4' }}>⚙ 应用设置</Text>
        </View>
      </View>
    </View>
  )
}
