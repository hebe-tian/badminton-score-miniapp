import { useState, useMemo, useEffect } from 'react'
import { View, Text, Input, Picker, Button } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { MatchConfig, getDefaultNames, GameMode } from '../../utils/types'
import './index.css'

export default function Config() {
  const params = Taro.getCurrentInstance().router?.params
  const mode = (params?.mode as GameMode) || 'singles'

  const [scoreOption, setScoreOption] = useState<number>(mode === 'wylb' ? 50 : 21)
  const [customScore, setCustomScore] = useState<string>('')
  const [deuce, setDeuce] = useState<boolean>(true)

  const numPlayers = mode === 'singles' ? 1 : mode === 'doubles' ? 2 : 5
  const [teamA, setTeamA] = useState<string[]>(Array(numPlayers).fill(''))
  const [teamB, setTeamB] = useState<string[]>(Array(numPlayers).fill(''))

  const [serverStr, setServerStr] = useState<string>('')
  const [receiverStr, setReceiverStr] = useState<string>('')

  useEffect(() => {
    setScoreOption(mode === 'wylb' ? 50 : 21)
    setTeamA(Array(numPlayers).fill(''))
    setTeamB(Array(numPlayers).fill(''))
    setServerStr('')
    setReceiverStr('')
  }, [mode, numPlayers])

  const targetScore = useMemo(() => {
    if (scoreOption === -1) {
      return parseInt(customScore) || 0
    }
    return scoreOption
  }, [scoreOption, customScore])

  const resolvedTeamA = useMemo(() => {
    const defaults = getDefaultNames(mode, 'A')
    return teamA.map((name, i) => name.trim() || defaults[i])
  }, [teamA, mode])

  const resolvedTeamB = useMemo(() => {
    const defaults = getDefaultNames(mode, 'B')
    return teamB.map((name, i) => name.trim() || defaults[i])
  }, [teamB, mode])

  const serverTeam = serverStr ? serverStr.split('-')[0] as 'A' | 'B' : null
  const serverIndex = serverStr ? parseInt(serverStr.split('-')[1]) : null

  const isFormValid = useMemo(() => {
    if (targetScore <= 0) return false
    if (!serverStr) return false
    if (mode !== 'singles' && !receiverStr) return false
    return true
  }, [targetScore, serverStr, receiverStr, mode])

  const handleStart = () => {
    if (!isFormValid) return

    const config: MatchConfig = {
      mode,
      targetScore,
      deuce,
      teamA: resolvedTeamA,
      teamB: resolvedTeamB,
      serverTeam: serverTeam!,
      serverIndex: serverIndex!,
      receiverIndex: receiverStr ? parseInt(receiverStr.split('-')[1]) : 0,
    }

    Taro.navigateTo({
      url: `/pages/match/index?config=${encodeURIComponent(JSON.stringify(config))}`,
    })
  }

  const scoreOptions = mode === 'wylb' ? [50, 100] : [15, 21, -1]

  const getPlayerOptions = (team: 'A' | 'B', names: string[], limitTo?: number) => {
    return names.slice(0, limitTo).map((name, i) => ({
      value: `${team}-${i}`,
      label: name,
    }))
  }

  const serverOptions =
    mode === 'wylb'
      ? [...getPlayerOptions('A', resolvedTeamA, 2), ...getPlayerOptions('B', resolvedTeamB, 2)]
      : [...getPlayerOptions('A', resolvedTeamA), ...getPlayerOptions('B', resolvedTeamB)]

  const receiverOptions =
    serverTeam === 'A'
      ? getPlayerOptions('B', resolvedTeamB, mode === 'wylb' ? 2 : undefined)
      : serverTeam === 'B'
        ? getPlayerOptions('A', resolvedTeamA, mode === 'wylb' ? 2 : undefined)
        : []

  const getModeTitle = () => {
    if (mode === 'singles') return '单打配置'
    if (mode === 'doubles') return '双打配置'
    return '五羽伦比配置'
  }

  return (
    <View className='config-container'>
      {/* Header */}
      <View className='config-header'>
        <Text className='config-title'>{getModeTitle()}</Text>
      </View>

      <View className='config-content'>
        {/* Score config */}
        <View className='config-section'>
          <Text className='section-title'>比赛分数</Text>
          <View className='score-options'>
            {scoreOptions.map((opt) => (
              <View
                key={opt}
                className={`score-option ${scoreOption === opt ? 'active' : ''}`}
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
              className='custom-score-input'
            />
          )}
        </View>

        {/* Deuce config */}
        <View className='config-section'>
          <Text className='section-title'>赛制选项</Text>
          <View className='deuce-options'>
            <View
              className={`deuce-option ${deuce ? 'active' : ''}`}
              onClick={() => setDeuce(true)}
            >
              <Text>加分</Text>
            </View>
            <View
              className={`deuce-option ${!deuce ? 'active' : ''}`}
              onClick={() => setDeuce(false)}
            >
              <Text>不加分</Text>
            </View>
          </View>
        </View>

        {/* Team A Players */}
        <View className='config-section'>
          <View className='section-title-row'>
            <View className='team-indicator blue' />
            <Text className='section-title'>A队球员</Text>
          </View>
          {teamA.map((name, idx) => {
            const defaultName = getDefaultNames(mode, 'A')[idx]
            return (
              <Input
                key={`A${idx}`}
                value={name}
                onInput={(e) => {
                  const newA = [...teamA]
                  newA[idx] = e.detail.value
                  setTeamA(newA)
                }}
                placeholder={`不输入信息默认为${defaultName}`}
                className='player-input'
              />
            )
          })}
        </View>

        {/* Team B Players */}
        <View className='config-section'>
          <View className='section-title-row'>
            <View className='team-indicator rose' />
            <Text className='section-title'>B队球员</Text>
          </View>
          {teamB.map((name, idx) => {
            const defaultName = getDefaultNames(mode, 'B')[idx]
            return (
              <Input
                key={`B${idx}`}
                value={name}
                onInput={(e) => {
                  const newB = [...teamB]
                  newB[idx] = e.detail.value
                  setTeamB(newB)
                }}
                placeholder={`不输入信息默认为${defaultName}`}
                className='player-input'
              />
            )
          })}
        </View>

        {/* Server & Receiver Selection */}
        <View className='config-section'>
          <Text className='section-title'>发球设置</Text>
          <View className='picker-section'>
            <Text className='picker-label'>发球球员</Text>
            <Picker
              mode='selector'
              range={serverOptions}
              rangeKey='label'
              value={serverStr ? serverOptions.findIndex((opt) => opt.value === serverStr) : -1}
              onChange={(e) => {
                const selected = serverOptions[e.detail.value]
                setServerStr(selected.value)
                setReceiverStr('')
              }}
            >
              <View className='picker-value'>
                <Text>{serverStr ? serverOptions.find((opt) => opt.value === serverStr)?.label : '请选择发球球员'}</Text>
              </View>
            </Picker>
          </View>

          {mode !== 'singles' && (
            <View className='picker-section'>
              <Text className='picker-label'>接发球员</Text>
              <Picker
                mode='selector'
                range={receiverOptions}
                rangeKey='label'
                value={receiverStr ? receiverOptions.findIndex((opt) => opt.value === receiverStr) : -1}
                onChange={(e) => {
                  const selected = receiverOptions[e.detail.value]
                  setReceiverStr(selected.value)
                }}
                disabled={!serverStr}
              >
                <View className='picker-value'>
                  <Text>
                    {!serverStr
                      ? '请先选择发球球员'
                      : receiverStr
                        ? receiverOptions.find((opt) => opt.value === receiverStr)?.label
                        : '请选择接发球员'}
                  </Text>
                </View>
              </Picker>
            </View>
          )}
        </View>
      </View>

      {/* Footer Button */}
      <View className='config-footer'>
        <Button
          className={`start-button ${isFormValid ? 'valid' : 'invalid'}`}
          onClick={handleStart}
          disabled={!isFormValid}
        >
          开始比赛
        </Button>
      </View>
    </View>
  )
}
