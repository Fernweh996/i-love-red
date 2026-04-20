import Taro from '@tarojs/taro'

export function showToast(message: string, duration = 2000) {
  Taro.showToast({
    title: message,
    icon: 'none',
    duration,
  })
}
