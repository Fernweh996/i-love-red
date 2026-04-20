import { View, Text } from '@tarojs/components'

export default function Privacy() {
  return (
    <View style={{ padding: '24px 20px', backgroundColor: '#FFFFFF', minHeight: '100vh' }}>
      <Text style={{ fontSize: '20px', fontWeight: '600', color: '#2C2F36', marginBottom: '16px', display: 'block' }}>隐私政策</Text>

      <View style={{ marginBottom: '16px' }}>
        <Text style={{ fontSize: '15px', fontWeight: '500', color: '#2C2F36', display: 'block', marginBottom: '8px' }}>数据存储</Text>
        <Text style={{ fontSize: '14px', color: '#9498A3', lineHeight: '22px' }}>
          基金管家的所有数据（持仓、自选、设置）均存储在您的微信小程序本地存储中，不会上传到任何服务器。您可以随时在设置页面导出或清除数据。
        </Text>
      </View>

      <View style={{ marginBottom: '16px' }}>
        <Text style={{ fontSize: '15px', fontWeight: '500', color: '#2C2F36', display: 'block', marginBottom: '8px' }}>网络请求</Text>
        <Text style={{ fontSize: '14px', color: '#9498A3', lineHeight: '22px' }}>
          本应用通过网络获取基金实时估值、历史净值、持仓股票等公开市场数据，数据来源为东方财富等公开金融数据接口。这些请求不包含任何个人信息。
        </Text>
      </View>

      <View style={{ marginBottom: '16px' }}>
        <Text style={{ fontSize: '15px', fontWeight: '500', color: '#2C2F36', display: 'block', marginBottom: '8px' }}>截图识别</Text>
        <Text style={{ fontSize: '14px', color: '#9498A3', lineHeight: '22px' }}>
          截图导入功能使用 OCR 技术识别图片中的基金信息。图片仅用于识别处理，不会被存储或分享。
        </Text>
      </View>

      <View style={{ marginBottom: '16px' }}>
        <Text style={{ fontSize: '15px', fontWeight: '500', color: '#2C2F36', display: 'block', marginBottom: '8px' }}>权限说明</Text>
        <Text style={{ fontSize: '14px', color: '#9498A3', lineHeight: '22px' }}>
          • 相机/相册权限：仅用于截图导入功能{'\n'}
          • 剪贴板权限：仅用于数据导入导出功能{'\n'}
          • 网络权限：用于获取公开市场数据
        </Text>
      </View>

      <View>
        <Text style={{ fontSize: '15px', fontWeight: '500', color: '#2C2F36', display: 'block', marginBottom: '8px' }}>联系方式</Text>
        <Text style={{ fontSize: '14px', color: '#9498A3', lineHeight: '22px' }}>
          如有任何隐私相关问题，请通过小程序内的反馈功能联系我们。
        </Text>
      </View>
    </View>
  )
}
