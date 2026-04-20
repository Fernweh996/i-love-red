import { View, Text } from '@tarojs/components'
import type { Period } from '@/hooks/useFundHistory'

const periods: { value: Period; label: string }[] = [
  { value: '1m', label: '1月' },
  { value: '3m', label: '3月' },
  { value: '6m', label: '6月' },
  { value: '1y', label: '1年' },
  { value: 'all', label: '全部' },
]

interface Props {
  value: Period
  onChange: (p: Period) => void
}

export default function PeriodSelector({ value, onChange }: Props) {
  return (
    <View style={{ display: 'flex', gap: '2px' }}>
      {periods.map((p) => (
        <View
          key={p.value}
          onClick={() => onChange(p.value)}
          style={{
            padding: '4px 10px',
            borderRadius: '20px',
            fontSize: '11px',
            backgroundColor: value === p.value ? '#6B84B0' : 'transparent',
            color: value === p.value ? '#FFFFFF' : '#B8BBC4',
          }}
        >
          <Text>{p.label}</Text>
        </View>
      ))}
    </View>
  )
}
