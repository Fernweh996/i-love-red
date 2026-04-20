import { View, Text } from '@tarojs/components'
import { getCurrentInstance } from '@tarojs/taro'
export default function FundDetail() {
  const { code, group } = getCurrentInstance().router?.params || {}
  return (
    <View style={{ padding: '40px 20px', textAlign: 'center' }}>
      <Text style={{ fontSize: '18px', color: '#2C2F36' }}>基金详情</Text>
      <View style={{ marginTop: '12px' }}>
        <Text style={{ fontSize: '14px', color: '#9498A3' }}>code: {code || '—'} / group: {group || '—'}</Text>
      </View>
    </View>
  )
}
