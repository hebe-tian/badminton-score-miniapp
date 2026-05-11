import { useState } from 'react'
import { View, Text } from '@tarojs/components'
import './index.css'

export default function CoinTool() {
  const [isFlipping, setIsFlipping] = useState(false)
  const [result, setResult] = useState<'front' | 'back' | null>(null)
  
  const flipCoin = () => {
    if (isFlipping) return
    setIsFlipping(true)
    setResult(null)
    
    setTimeout(() => {
      const randomResult = Math.random() < 0.5 ? 'front' : 'back'
      setResult(randomResult)
      setIsFlipping(false)
    }, 1500)
  }
  
  return (
    <View className='coin-container'>
      <View className='coin-area'>
        <View 
          className={`coin ${isFlipping ? 'flipping' : ''} ${result || ''}`}
          onClick={flipCoin}
        >
          <View className='coin-face coin-front'>正面</View>
          <View className='coin-face coin-back'>反面</View>
        </View>
      </View>
      
      {result && !isFlipping && (
        <Text className='result-text'>
          结果：{result === 'front' ? '正面' : '反面'}
        </Text>
      )}
      
      <View className='flip-button' onClick={flipCoin}>
        <Text className='flip-button-text'>
          {isFlipping ? '翻转中...' : '点击翻转'}
        </Text>
      </View>
      
      <Text className='instruction'>
        用于比赛双方选择球权和选边
      </Text>
    </View>
  )
}
