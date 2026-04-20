import Taro from '@tarojs/taro'
import { View, Text, ScrollView } from '@tarojs/components'
import { usePortfolioStore } from '@/stores/portfolio'

interface Props {
  activeGroupId: string
  onGroupChange: (id: string) => void
  getCount?: (groupId: string) => number
}

export default function GroupTabs({ activeGroupId, onGroupChange, getCount: getCountProp }: Props) {
  const groups = usePortfolioStore((s) => s.groups)
  const positions = usePortfolioStore((s) => s.positions)

  const sortedGroups = [...groups].sort((a, b) => a.order - b.order)
  const defaultGetCount = (groupId: string) => positions.filter((p) => p.groupId === groupId).length
  const getCount = getCountProp || defaultGetCount

  const activeStyle = {
    fontSize: '15px',
    color: '#2C2F36',
    fontWeight: '500' as const,
    paddingBottom: '2px',
    borderBottom: '2px solid #6B84B0',
  }

  const inactiveStyle = {
    fontSize: '15px',
    color: '#B8BBC4',
    paddingBottom: '2px',
  }

  return (
    <View style={{ display: 'flex', alignItems: 'center', backgroundColor: '#FFFFFF' }}>
      <ScrollView scrollX style={{ flex: 1 }} scrollWithAnimation>
        <View style={{ display: 'flex', alignItems: 'center', whiteSpace: 'nowrap', padding: '12px 24px', gap: '24px' }}>
          <View
            onClick={() => onGroupChange('all')}
            style={activeGroupId === 'all' ? activeStyle : inactiveStyle}
          >
            <Text>全部</Text>
          </View>

          {sortedGroups.map((group) => {
            const count = getCount(group.id)
            const isActive = activeGroupId === group.id
            return (
              <View
                key={group.id}
                onClick={() => onGroupChange(group.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  ...(isActive ? activeStyle : inactiveStyle),
                }}
              >
                <Text style={{ fontSize: '16px' }}>{group.icon}</Text>
                <Text>{group.name}</Text>
                <Text style={{ fontSize: '14px', color: '#B8BBC4' }}>{count}</Text>
              </View>
            )
          })}
        </View>
      </ScrollView>

      <View
        onClick={() => Taro.navigateTo({ url: '/pages/group-manager/index' })}
        style={{ flexShrink: 0, padding: '12px 16px', color: '#B8BBC4' }}
      >
        <Text style={{ fontSize: '20px', color: '#B8BBC4' }}>⚙</Text>
      </View>
    </View>
  )
}
