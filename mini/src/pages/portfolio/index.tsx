import { View, Text } from '@tarojs/components'
import { formatCurrency } from '@fund-manager/shared'

export default function Portfolio() {
  const testValue = formatCurrency(12345.67)
  return (
    <View style={{ padding: '40px 20px', textAlign: 'center' }}>
      <Text style={{ fontSize: '18px', color: '#2C2F36' }}>持有页面</Text>
      <View style={{ marginTop: '12px' }}>
        <Text style={{ fontSize: '14px', color: '#9498A3' }}>shared 包测试: {testValue}</Text>
      </View>
    </View>
  )
}
