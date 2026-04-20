import Taro from '@tarojs/taro'
import type { StateStorage } from 'zustand/middleware'
import { createJSONStorage } from 'zustand/middleware'

const taroStateStorage: StateStorage = {
  getItem: (name: string) => {
    try {
      return Taro.getStorageSync(name) || null
    } catch {
      return null
    }
  },
  setItem: (name: string, value: string) => {
    try {
      Taro.setStorageSync(name, value)
    } catch (e) {
      console.error('Storage setItem failed:', e)
    }
  },
  removeItem: (name: string) => {
    try {
      Taro.removeStorageSync(name)
    } catch (e) {
      console.error('Storage removeItem failed:', e)
    }
  },
}

export const taroStorage = createJSONStorage(() => taroStateStorage)
