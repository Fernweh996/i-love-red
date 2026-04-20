import { View, Text } from '@tarojs/components'

export default function EmptyState({
  icon = '📭',
  title,
  description,
}: {
  icon?: string
  title: string
  description?: string
}) {
  return (
    <View style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 20px', textAlign: 'center' }}>
      <Text style={{ fontSize: '40px', marginBottom: '16px' }}>{icon}</Text>
      <Text style={{ fontSize: '18px', fontWeight: '500', color: '#2C2F36', marginBottom: '4px' }}>{title}</Text>
      {description && <Text style={{ fontSize: '14px', color: '#9498A3' }}>{description}</Text>}
    </View>
  )
}
