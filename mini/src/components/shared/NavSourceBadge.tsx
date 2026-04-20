import { Text } from '@tarojs/components'

/**
 * 估/净 标签 — 区分估算值和官方确认净值
 * - 净：绿色小标签 (confirmed)
 * - 估：琥珀色小标签 (estimate)
 */
export default function NavSourceBadge({ source }: { source: 'estimate' | 'confirmed' | undefined }) {
  if (source === 'confirmed') {
    return (
      <Text style={{ fontSize: '9px', color: '#2E8B57', backgroundColor: '#EBF5EF', padding: '1px 4px', borderRadius: '2px', lineHeight: '14px' }}>
        净
      </Text>
    )
  }

  return (
    <Text style={{ fontSize: '9px', color: '#A67B20', backgroundColor: '#FAF5E6', padding: '1px 4px', borderRadius: '2px', lineHeight: '14px' }}>
      估
    </Text>
  )
}
