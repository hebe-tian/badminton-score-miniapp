import { useState, useMemo, useEffect } from 'react'
import { View, Text, Input } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { PartnerMode, MultiTurnPlayer } from '../../../../utils/multi-turn-types'
import { calculateMinRounds, generateSchedule } from '../../../../utils/multi-turn-algorithm'
import './index.css'

interface PlayerInput {
  name: string
  gender: 'male' | 'female'
}

export default function MultiTurnConfig() {
  const [partnerMode, setPartnerMode] = useState<PartnerMode | null>(null)
  const [scoreOption, setScoreOption] = useState<number>(21)
  const [customScore, setCustomScore] = useState<string>('')
  const [deuce, setDeuce] = useState<boolean>(true)
  const [playerCount, setPlayerCount] = useState<number>(6)
  const [players, setPlayers] = useState<PlayerInput[]>(
    Array.from({ length: 6 }, () => ({ name: '', gender: 'male' }))
  )
  const [totalRounds, setTotalRounds] = useState<number>(0)

  const targetScore = useMemo(() => {
    if (scoreOption === -1) return parseInt(customScore) || 0
    return scoreOption
  }, [scoreOption, customScore])

  const maleCount = players.filter(p => p.gender === 'male').length
  const femaleCount = players.filter(p => p.gender === 'female').length

  const minRounds = useMemo(() => {
    return calculateMinRounds(playerCount, partnerMode || 'random', maleCount, femaleCount)
  }, [playerCount, partnerMode, maleCount, femaleCount])

  // 推荐轮次变化时同步更新
  useEffect(() => {
    setTotalRounds(minRounds)
  }, [minRounds])

  const isFormValid = useMemo(() => {
    if (!partnerMode) return false
    if (targetScore <= 0) return false
    if (players.some(p => !p.name.trim())) return false
    if (partnerMode === 'mixed' && (maleCount < 2 || femaleCount < 2)) return false
    if (totalRounds < 1) return false
    return true
  }, [partnerMode, targetScore, players, maleCount, femaleCount, totalRounds, minRounds])

  const handlePlayerCountChange = (count: number) => {
    setPlayerCount(count)
    const newPlayers = Array.from({ length: count }, (_, i) =>
      players[i] || { name: '', gender: 'male' }
    )
    setPlayers(newPlayers)
    const mc = newPlayers.filter(p => p.gender === 'male').length
    const fc = newPlayers.filter(p => p.gender === 'female').length
    setTotalRounds(calculateMinRounds(count, partnerMode || 'random', mc, fc))
  }

  const handlePlayerNameChange = (index: number, name: string) => {
    const newPlayers = [...players]
    newPlayers[index] = { ...newPlayers[index], name }
    setPlayers(newPlayers)
  }

  const handlePlayerGenderChange = (index: number) => {
    const newPlayers = [...players]
    newPlayers[index] = {
      ...newPlayers[index],
      gender: newPlayers[index].gender === 'male' ? 'female' : 'male'
    }
    setPlayers(newPlayers)
  }

  const handleGenerate = () => {
    if (!isFormValid || !partnerMode) return

    const multiTurnPlayers: MultiTurnPlayer[] = players.map((p, i) => ({
      id: i,
      name: p.name.trim(),
      ...(partnerMode === 'mixed' ? { gender: p.gender } : {}),
    }))

    const matches = generateSchedule(multiTurnPlayers, partnerMode, totalRounds)

    const event = {
      players: multiTurnPlayers,
      partnerMode,
      targetScore,
      deuce,
      matches,
      totalRounds,
    }

    Taro.navigateTo({
      url: `/pages/tools/multi-turn/schedule/index?event=${encodeURIComponent(JSON.stringify(event))}`,
    })
  }

  // Step 1: 选择搭档模式
  if (!partnerMode) {
    return (
      <View className='mt-config-container'>
        <View className='mt-config-header'>
          <Text className='mt-config-title'>多人转</Text>
          <Text className='mt-config-subtitle'>N位选手独立参赛，自动编排搭档双打</Text>
        </View>

        <View className='mt-tip-bar'>
          <Text className='mt-tip-text'>建议 6-8 人参与，获得最佳体验</Text>
        </View>

        <Text className='mt-section-title'>选择搭档模式</Text>
        <View className='mt-mode-cards'>
          <View
            className='mt-mode-card'
            onClick={() => setPartnerMode('random')}
          >
            <Text className='mt-mode-name'>完全随机</Text>
            <Text className='mt-mode-desc'>搭档随机组合{'\n'}不限制性别</Text>
          </View>
          <View
            className='mt-mode-card'
            onClick={() => setPartnerMode('mixed')}
          >
            <Text className='mt-mode-name'>严格混双</Text>
            <Text className='mt-mode-desc'>每对搭档一男一女{'\n'}场上双方均为混双</Text>
          </View>
        </View>
      </View>
    )
  }

  // Step 2: 录入信息
  return (
    <View className='mt-config-container'>
      <View className='mt-config-header'>
        <Text className='mt-config-title'>多人转</Text>
        <Text className='mt-config-subtitle'>N位选手独立参赛，自动编排搭档双打</Text>
      </View>

      {/* 模式标签 */}
      <View className={`mt-mode-tag ${partnerMode}`}>
        <Text className='mt-mode-tag-text'>
          {partnerMode === 'random' ? '完全随机' : '严格混双'}
        </Text>
      </View>

      {/* 比赛分数 */}
      <View className='mt-config-section'>
        <Text className='mt-section-title'>比赛分数</Text>
        <View className='mt-score-options'>
          {[15, 21, -1].map(opt => (
            <View
              key={opt}
              className={`mt-score-option ${scoreOption === opt ? 'active' : ''}`}
              onClick={() => setScoreOption(opt)}
            >
              <Text>{opt === -1 ? '自定义' : `${opt}分`}</Text>
            </View>
          ))}
        </View>
        {scoreOption === -1 && (
          <Input
            type='number'
            value={customScore}
            onInput={(e) => setCustomScore(e.detail.value)}
            placeholder='输入目标分数'
            className='mt-custom-score-input'
          />
        )}
      </View>

      {/* 加分 */}
      <View className='mt-config-section'>
        <Text className='mt-section-title'>赛制选项</Text>
        <View className='mt-deuce-options'>
          <View
            className={`mt-deuce-option ${deuce ? 'active' : ''}`}
            onClick={() => setDeuce(true)}
          >
            <Text>加分</Text>
          </View>
          <View
            className={`mt-deuce-option ${!deuce ? 'active' : ''}`}
            onClick={() => setDeuce(false)}
          >
            <Text>不加分</Text>
          </View>
        </View>
      </View>

      {/* 选手录入 */}
      <View className='mt-config-section'>
        <Text className='mt-section-title'>选手名称{partnerMode === 'mixed' ? '与性别' : ''}</Text>

        {/* 人数选择 */}
        <View style={{ display: 'flex', gap: '12rpx', marginBottom: '20rpx' }}>
          {[6, 7, 8].map(count => (
            <View
              key={count}
              className={`mt-score-option ${playerCount === count ? 'active' : ''}`}
              onClick={() => handlePlayerCountChange(count)}
            >
              <Text>{count}人</Text>
            </View>
          ))}
        </View>

        <View className='mt-player-list'>
          {players.map((player, idx) => (
            <View key={idx} className='mt-player-row'>
              <View className={`mt-player-index ${partnerMode === 'mixed' && player.gender === 'female' ? 'female' : ''}`}>
                <Text style={{ color: '#fff', fontSize: '24rpx', fontWeight: 'bold' }}>{idx + 1}</Text>
              </View>
              <Input
                value={player.name}
                onInput={(e) => handlePlayerNameChange(idx, e.detail.value)}
                placeholder={`选手${idx + 1}姓名`}
                className='mt-player-input'
              />
              {partnerMode === 'mixed' && (
                <View
                  className={`mt-gender-picker ${player.gender}`}
                  onClick={() => handlePlayerGenderChange(idx)}
                >
                  <Text>{player.gender === 'male' ? '男' : '女'}</Text>
                </View>
              )}
            </View>
          ))}
        </View>

        {partnerMode === 'mixed' && (
          <View className='mt-gender-stats'>
            <Text className='mt-gender-stat-male'>男 {maleCount}人</Text>
            <Text className='mt-gender-stat-female'>女 {femaleCount}人</Text>
          </View>
        )}
      </View>

      {/* 比赛轮次 */}
      <View className='mt-config-section'>
        <Text className='mt-section-title'>比赛轮次</Text>
        <View className='mt-rounds-display'>
          <Text className='mt-rounds-label'>系统推荐轮次</Text>
          <Text className='mt-rounds-value'>{minRounds} 轮</Text>
        </View>
        {totalRounds < minRounds && (
          <Text className='mt-rounds-warning'>轮次较少，搭档组合可能重复</Text>
        )}
        <Text className='mt-rounds-hint'>可减少或追加轮次</Text>
        <View className='mt-rounds-adjust'>
          <View
            className='mt-rounds-btn'
            onClick={() => setTotalRounds(Math.max(1, totalRounds - 1))}
          >
            <Text>-</Text>
          </View>
          <Text className='mt-rounds-current'>{totalRounds}</Text>
          <View
            className='mt-rounds-btn'
            onClick={() => setTotalRounds(totalRounds + 1)}
          >
            <Text>+</Text>
          </View>
        </View>
      </View>

      {/* 底部按钮 */}
      <View className='mt-config-footer'>
        <View
          className={`mt-generate-btn ${isFormValid ? '' : 'disabled'}`}
          onClick={handleGenerate}
        >
          <Text className='mt-generate-btn-text'>生成对阵表</Text>
        </View>
      </View>
    </View>
  )
}
