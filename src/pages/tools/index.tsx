import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import './index.css'

export default function Tools() {
  const tools = [
    {
      id: 'coin',
      name: '电子硬币',
      desc: '随机正反，用于选边选球权',
      icon: '🪙',
      path: '/pages/tools/coin/index'
    },
    {
      id: 'court',
      name: '球场模拟器',
      desc: '绘制战术路线和站位',
      icon: '🏸',
      path: '/pages/tools/court/index'
    }
    // 未来可以添加更多工具
  ]

  const handleToolClick = (toolPath: string) => {
    console.log('点击工具卡片，跳转到:', toolPath)
    Taro.navigateTo({ 
      url: toolPath,
      success: () => {
        console.log('跳转成功')
      },
      fail: (err) => {
        console.error('跳转失败:', err)
      }
    })
  }

  return (
    <View className='tools-container'>
      <View className='tools-header'>
        <Text className='tools-title'>比赛工具</Text>
        <Text className='tools-subtitle'>实用小工具合集</Text>
      </View>

      <View className='tools-grid'>
        {tools.map((tool) => (
          <View 
            key={tool.id}
            className='tool-card'
            onClick={() => handleToolClick(tool.path)}
          >
            <View className='tool-icon'>{tool.icon}</View>
            <Text className='tool-name'>{tool.name}</Text>
            <Text className='tool-desc'>{tool.desc}</Text>
          </View>
        ))}
      </View>
    </View>
  )
}
