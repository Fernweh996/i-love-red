export default defineAppConfig({
  pages: [
    'pages/portfolio/index',
    'pages/watchlist/index',
    'pages/fund-detail/index',
    'pages/position-edit/index',
    'pages/fund-history/index',
    'pages/group-manager/index',
    'pages/settings/index',
    'pages/search/index',
    'pages/import/index',
    'pages/privacy/index',
    'pages/about/index',
  ],
  tabBar: {
    color: '#B8BBC4',
    selectedColor: '#6B84B0',
    backgroundColor: '#FFFFFF',
    borderStyle: 'white',
    list: [
      {
        pagePath: 'pages/portfolio/index',
        text: '持有',
      },
      {
        pagePath: 'pages/watchlist/index',
        text: '自选',
      },
    ],
  },
  permission: {
    'scope.camera': {
      desc: '用于截图导入功能拍照识别基金信息',
    },
  },
  permission: {
    'scope.camera': {
      desc: '用于截图导入功能拍照识别基金信息',
    },
  },
  window: {
    navigationBarTitleText: '基金管家',
    navigationBarBackgroundColor: '#FFFFFF',
    navigationBarTextStyle: 'black',
    backgroundColor: '#F0F1F4',
    backgroundTextStyle: 'dark',
  },
})
