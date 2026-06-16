import { useMemo } from 'react'
import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { MultiTurnEvent } from '../../../../utils/multi-turn-types'
import { calculatePlayerStats } from '../../../../utils/multi-turn-algorithm'
import './index.css'

export default function MultiTurnRanking() {
  const params = Taro.getCurrentInstance().router?.params
  const eventStr = params?.event
  const event: MultiTurnEvent | null = eventStr
    ? JSON.parse(decodeURIComponent(eventStr))
    : null

  if (!event) {
    Taro.navigateBack()
    return null
  }

  const playerStats = useMemo(() => {
    const statsMap = calculatePlayerStats(event.players, event.matches)
    return Array.from(statsMap.values()).sort((a, b) => b.totalScore - a.totalScore)
  }, [event])

  const getRowClass = (index: number) => {
    if (index === 0) return 'gold'
    if (index === 1) return 'silver'
    if (index === 2) return 'bronze'
    return 'normal'
  }

  const handleBack = () => {
    Taro.navigateBack()
  }

  const handleNew = () => {
    Taro.navigateTo({
      url: '/pages/tools/multi-turn/config/index',
    })
  }

  // 领奖台数据
  const podium = playerStats.slice(0, 3)

  return (
    <View className='mt-ranking-container'>
      {/* 顶部 */}
      <View className='mt-ranking-header'>
        <Text className='mt-ranking-title'>比赛结束</Text>
        <Text className='mt-ranking-info'>
          {event.players.length}人 · {event.partnerMode === 'random' ? '完全随机' : '严格混双'} · {event.targetScore}分制 · {event.totalRounds}轮
        </Text>
      </View>

      {/* 领奖台 */}
      {podium.length >= 3 && (
        <View className='mt-podium'>
          {/* 第2名 */}
          <View className='mt-podium-item second'>
            <Text className='mt-podium-pos'>2</Text>
            <Text className='mt-podium-name'>{podium[1].name}</Text>
            <Text className='mt-podium-score'>{podium[1].totalScore}分</Text>
          </View>
          {/* 第1名 */}
          <View className='mt-podium-item first'>
            <Text className='mt-podium-pos'>1</Text>
            <Text className='mt-podium-name'>{podium[0].name}</Text>
            <Text className='mt-podium-score'>{podium[0].totalScore}分</Text>
          </View>
          {/* 第3名 */}
          <View className='mt-podium-item third'>
            <Text className='mt-podium-pos'>3</Text>
            <Text className='mt-podium-name'>{podium[2].name}</Text>
            <Text className='mt-podium-score'>{podium[2].totalScore}分</Text>
          </View>
        </View>
      )}

      {/* 完整排名列表 */}
      <View className='mt-ranking-list'>
        {playerStats.map((stat, idx) => (
          <View key={stat.playerId} className={`mt-ranking-row ${getRowClass(idx)}`}>
            <Text className='mt-ranking-pos'>{idx + 1}</Text>
            <View className='mt-ranking-detail'>
              <Text className='mt-ranking-name'>{stat.name}</Text>
              <Text className='mt-ranking-stats'>上场 {stat.appearances} 次 · 胜 {stat.wins} 局</Text>
            </View>
            <View className='mt-ranking-total'>
              <Text className='mt-ranking-total-score'>{stat.totalScore}</Text>
              <Text className='mt-ranking-total-label'>总分</Text>
            </View>
          </View>
        ))}
      </View>

      {/* 底部操作 */}
      <View className='mt-ranking-actions'>
        <View className='mt-ranking-action-btn back' onClick={handleBack}>
          <Text className='mt-ranking-action-btn-text'>返回对阵表</Text>
        </View>
        <View className='mt-ranking-action-btn new' onClick={handleNew}>
          <Text className='mt-ranking-action-btn-text'>新建比赛</Text>
        </View>
      </View>
    </View>
  )
}
