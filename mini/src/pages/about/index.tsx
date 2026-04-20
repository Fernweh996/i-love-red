import { View, Text } from '@tarojs/components'

export default function About() {
  return (
    <View style={{ padding: '60px 20px', textAlign: 'center', backgroundColor: '#FFFFFF', minHeight: '100vh' }}>
      <Text style={{ fontSize: '48px', display: 'block', marginBottom: '16px' }}>📊</Text>
      <Text style={{ fontSize: '22px', fontWeight: '600', color: '#2C2F36', display: 'block' }}>基金管家</Text>
      <Text style={{ fontSize: '14px', color: '#9498A3', display: 'block', marginTop: '8px' }}>v1.0.0</Text>
      <Text style={{ fontSize: '13px', color: '#B8BBC4', display: 'block', marginTop: '24px', lineHeight: '20px' }}>
        轻松管理基金持仓{'\n'}实时估值 · 历史走势 · 截图导入
      </Text>
    </View>
  )
}
