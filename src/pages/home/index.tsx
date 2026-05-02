import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import './index.css'

export default function Home() {
  const navigateToConfig = (mode: string) => {
    Taro.navigateTo({ url: `/pages/config/index?mode=${mode}` })
  }

  return (
    <View className='home-container'>
      <View className='home-content'>
        <Text className='home-title'>羽毛球计分器</Text>
        <Text className='home-subtitle'>选择比赛模式开始</Text>

        <View className='mode-buttons'>
          <ModeButton
            title='单打模式'
            desc='1对1单挑，15分或21分制'
            onClick={() => navigateToConfig('singles')}
          />
          <ModeButton
            title='双打模式'
            desc='2对2对抗，讲究默契与配合'
            onClick={() => navigateToConfig('doubles')}
          />
          <ModeButton
            title='五羽伦比'
            desc='5人接力赛，每10分轮换，50或100分制'
            onClick={() => navigateToConfig('wylb')}
          />
        </View>
      </View>
    </View>
  )
}

interface ModeButtonProps {
  title: string
  desc: string
  onClick: () => void
}

function ModeButton({ title, desc, onClick }: ModeButtonProps) {
  return (
    <View className='mode-button' onClick={onClick}>
      <View className='mode-button-content'>
        <Text className='mode-button-title'>{title}</Text>
        <Text className='mode-button-desc'>{desc}</Text>
      </View>
      <View className='mode-button-arrow'>›</View>
    </View>
  )
}
