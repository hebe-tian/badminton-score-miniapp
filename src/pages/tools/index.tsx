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
      id: 'full-court',
      name: '全场模拟器',
      desc: '完整球场，绘制战术路线和站位',
      icon: '🏸',
      path: '/pages/tools/court/index'
    },
    {
      id: 'net-court',
      name: '网前模拟器',
      desc: '网前区域，练习网前技术和站位',
      icon: '🥅',
      path: '/pages/tools/net-court/index'
    },
    {
      id: 'multi-turn',
      name: '多人转',
      desc: 'N人轮转双打，自动编排搭档',
      icon: '🔄',
      path: '/pages/tools/multi-turn/config/index'
    }
  ]

  const handleToolClick = (toolPath: string) => {
    Taro.navigateTo({ 
      url: toolPath,
      success: () => {
        // 跳转成功
      },
      fail: () => {
        // 跳转失败处理
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
