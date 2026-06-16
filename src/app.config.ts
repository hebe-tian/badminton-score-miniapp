export default defineAppConfig({
  pages: [
    'pages/home/index',
    'pages/tools/index',
    'pages/tools/coin/index',
    'pages/tools/court/index',
    'pages/tools/net-court/index',
    'pages/tools/multi-turn/config/index',
    'pages/tools/multi-turn/schedule/index',
    'pages/tools/multi-turn/ranking/index',
    'pages/config/index',
    'pages/match/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#fff',
    navigationBarTitleText: '羽毛球计分器',
    navigationBarTextStyle: 'black'
  },
  tabBar: {
    color: '#94a3b8',
    selectedColor: '#10b981',
    backgroundColor: '#0f172a',
    borderStyle: 'white',
    list: [
      {
        pagePath: 'pages/home/index',
        text: '比赛'
      },
      {
        pagePath: 'pages/tools/index',
        text: '工具'
      }
    ]
  }
})
