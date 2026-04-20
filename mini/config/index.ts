import path from 'path'
import { defineConfig, type UserConfigExport } from '@tarojs/cli'

export default defineConfig<'webpack5'>(async (merge) => {
  const baseConfig: UserConfigExport<'webpack5'> = {
    projectName: 'fund-manager-mini',
    date: '2026-4-20',
    designWidth: 750,
    deviceRatio: {
      640: 2.34 / 2,
      750: 1,
      375: 2,
      828: 1.81 / 2,
    },
    sourceRoot: 'src',
    outputRoot: 'dist',
    plugins: ['@tarojs/plugin-framework-react', '@tarojs/plugin-platform-weapp'],
    defineConstants: {},
    alias: {
      '@': path.resolve(__dirname, '..', 'src'),
      '@fund-manager/shared': path.resolve(__dirname, '..', '..', 'shared'),
    },
    framework: 'react',
    compiler: 'webpack5',
    mini: {
      postcss: {
        pxtransform: {
          enable: true,
          config: {},
        },
      },
      webpackChain(chain) {
        // Include shared package in babel-loader so .ts files are transpiled
        chain.module
          .rule('script')
          .include.add(path.resolve(__dirname, '..', '..', 'shared'))
      },
    },
  }
  return baseConfig
})
