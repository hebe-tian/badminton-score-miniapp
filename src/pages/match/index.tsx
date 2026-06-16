import { useState, useEffect } from 'react'
import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { MatchConfig, MatchHistoryEntry } from '../../utils/types'
import './index.css'

interface SubInfo {
  teamA: { out: string; in: string }
  teamB: { out: string; in: string }
}

export default function Match() {
  const params = Taro.getCurrentInstance().router?.params
  const configStr = params?.config
  const config: MatchConfig | null = configStr ? JSON.parse(decodeURIComponent(configStr)) : null

  // 将所有 Hooks 放在最前面，在条件返回之前
  const [scoreA, setScoreA] = useState(0)
  const [scoreB, setScoreB] = useState(0)

  const [currentA, setCurrentA] = useState<number[]>(
    config?.mode === 'singles' ? [0] : [0, 1]
  )
  const [currentB, setCurrentB] = useState<number[]>(
    config?.mode === 'singles' ? [0] : [0, 1]
  )

  const [serverTeam, setServerTeam] = useState<'A' | 'B'>(config?.serverTeam || 'A')
  const [serverIndex, setServerIndex] = useState(config?.serverIndex || 0)
  const [receiverIndex, setReceiverIndex] = useState(config?.receiverIndex || 0)

  const [history, setHistory] = useState<MatchHistoryEntry[]>([])
  const [winner, setWinner] = useState<'A' | 'B' | null>(null)

  const [subInfo, setSubInfo] = useState<SubInfo | null>(null)

  // 站位状态：记录每个球员当前在哪个区域（单数区/双数区）
  const [positions, setPositions] = useState<{
    A: Record<number, 'even' | 'odd'>
    B: Record<number, 'even' | 'odd'>
  }>({
    A: {},
    B: {}
  })

  // useEffect 必须在顶层调用，在内部检查 config
  useEffect(() => {
    if (!config) return
    
    if (config.mode === 'singles') {
      setCurrentA([0])
      setCurrentB([0])
      // 单打不需要单双数区概念
    } else {
      // 双打和五羽伦比都需要初始化站位
      setCurrentA([0, 1])
      setCurrentB([0, 1])
      
      const initialPositions = {
        A: {} as Record<number, 'even' | 'odd'>,
        B: {} as Record<number, 'even' | 'odd'>
      }
      
      // 发球方和接发球方的初始球员在双数区
      if (config.serverTeam === 'A') {
        initialPositions.A[config.serverIndex] = 'even'  // 发球员在双数区
        initialPositions.B[config.receiverIndex] = 'even'  // 接发球员在双数区
        
        // A队另一个球员在单数区
        ;[0, 1].forEach(idx => {
          if (idx !== config.serverIndex) {
            initialPositions.A[idx] = 'odd'
          }
        })
        
        // B队另一个球员在单数区
        ;[0, 1].forEach(idx => {
          if (idx !== config.receiverIndex) {
            initialPositions.B[idx] = 'odd'
          }
        })
      } else {
        // B队发球的情况，逻辑对称
        initialPositions.B[config.serverIndex] = 'even'
        initialPositions.A[config.receiverIndex] = 'even'
        
        ;[0, 1].forEach(idx => {
          if (idx !== config.serverIndex) {
            initialPositions.B[idx] = 'odd'
          }
        })
        
        ;[0, 1].forEach(idx => {
          if (idx !== config.receiverIndex) {
            initialPositions.A[idx] = 'odd'
          }
        })
      }
      
      setPositions(initialPositions)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 在所有 Hooks 之后再进行条件判断
  if (!config) {
    Taro.navigateBack()
    return null
  }

  const addPoint = (scoringTeam: 'A' | 'B') => {
    if (winner) return

    const newScoreA = scoreA + (scoringTeam === 'A' ? 1 : 0)
    const newScoreB = scoreB + (scoringTeam === 'B' ? 1 : 0)

    setScoreA(newScoreA)
    setScoreB(newScoreB)

    // 记录得分时的场上球员
    let scorers: string[] = []
    if (config.mode === 'singles') {
      // 单打：只记录当前球员
      scorers = [scoringTeam === 'A' ? config.teamA[0] : config.teamB[0]]
    } else {
      // 双打和五羽伦比：记录当前场上的两个球员
      const currentTeam = scoringTeam === 'A' ? currentA : currentB
      const teamNames = scoringTeam === 'A' ? config.teamA : config.teamB
      scorers = currentTeam.map(idx => teamNames[idx])
    }

    setHistory((prev) => [...prev, { 
      scoreA: newScoreA, 
      scoreB: newScoreB, 
      scorer: scoringTeam,
      scorers: scorers,
      teamAPlayers: config.mode === 'singles' 
        ? [config.teamA[0]] 
        : currentA.map(idx => config.teamA[idx]),
      teamBPlayers: config.mode === 'singles'
        ? [config.teamB[0]]
        : currentB.map(idx => config.teamB[idx])
    }])

    let nextServerTeam = serverTeam
    let nextServerIndex = serverIndex
    let nextReceiverIndex = receiverIndex

    if (config.mode === 'singles') {
      nextServerTeam = scoringTeam
      nextServerIndex = 0
      nextReceiverIndex = 0
    } else {
      // 双打和五羽伦比的逻辑
      const newPositions = { 
        A: { ...positions.A },
        B: { ...positions.B }
      }
      
      if (scoringTeam === serverTeam) {
        // 情况1：发球方得分
        // 1. 发球方交换位置（单双数区互换）
        const servingTeamPositions = newPositions[serverTeam]
        Object.keys(servingTeamPositions).forEach(key => {
          const idx = parseInt(key)
          servingTeamPositions[idx] = servingTeamPositions[idx] === 'even' ? 'odd' : 'even'
        })
        
        // 2. 确定新的发球员（仍然是原来的发球员，但位置变了）
        // 发球员索引不变，但位置已交换
        
        // 3. 确定接发球员：根据发球方当前位置找对方对应位置的球员
        const serverPosition = newPositions[serverTeam][serverIndex]
        const receivingTeamArray = serverTeam === 'A' ? currentB : currentA
        nextReceiverIndex = receivingTeamArray.find(
          idx => newPositions[serverTeam === 'A' ? 'B' : 'A'][idx] === serverPosition
        ) ?? receivingTeamArray[0]
        
      } else {
        // 情况2：接发球方得分
        // 1. 双方都不交换位置（保持 positions 不变）
        
        // 2. 发球权转移给得分方
        nextServerTeam = scoringTeam
        
        // 3. 根据新分数决定发球员
        const newScore = scoringTeam === 'A' ? newScoreA : newScoreB
        const isOdd = newScore % 2 === 1
        
        // 找到得分方在当前对应区域的球员
        const scoringTeamPositions = newPositions[scoringTeam]
        const scoringTeamArray = scoringTeam === 'A' ? currentA : currentB
        
        if (isOdd) {
          // 分数为单数，由单数区球员发球
          nextServerIndex = scoringTeamArray.find(
            idx => scoringTeamPositions[idx] === 'odd'
          ) ?? scoringTeamArray[0]
        } else {
          // 分数为双数，由双数区球员发球
          nextServerIndex = scoringTeamArray.find(
            idx => scoringTeamPositions[idx] === 'even'
          ) ?? scoringTeamArray[0]
        }
        
        // 4. 确定接发球员：根据发球方当前位置找对方对应位置的球员
        const serverPosition = newPositions[nextServerTeam][nextServerIndex]
        const receivingTeamArray = nextServerTeam === 'A' ? currentB : currentA
        nextReceiverIndex = receivingTeamArray.find(
          idx => newPositions[nextServerTeam === 'A' ? 'B' : 'A'][idx] === serverPosition
        ) ?? receivingTeamArray[0]
      }
      
      setPositions(newPositions)
    }

    setServerTeam(nextServerTeam)
    setServerIndex(nextServerIndex)
    setReceiverIndex(nextReceiverIndex)

    let gameIsOver = false
    let newWinner: 'A' | 'B' | null = null

    if (config.deuce) {
      if (newScoreA >= config.targetScore && newScoreA - newScoreB >= 2) {
        gameIsOver = true
        newWinner = 'A'
      }
      if (newScoreB >= config.targetScore && newScoreB - newScoreA >= 2) {
        gameIsOver = true
        newWinner = 'B'
      }
    } else {
      if (newScoreA >= config.targetScore) {
        gameIsOver = true
        newWinner = 'A'
      }
      if (newScoreB >= config.targetScore) {
        gameIsOver = true
        newWinner = 'B'
      }
    }

    if (gameIsOver) {
      setWinner(newWinner)
      // 多人转模式：回传分数
      if (params?.multiTurn === 'true' && params?.round) {
        const round = parseInt(params.round)
        Taro.setStorageSync('multiTurnScoreBack', JSON.stringify({
          round,
          scoreA: newScoreA,
          scoreB: newScoreB,
        }))
      }
      return
    }

    if (config.mode === 'wylb') {
      const oldLeadingScore = Math.max(scoreA, scoreB)
      const leadingScore = Math.max(newScoreA, newScoreB)
      if (leadingScore > 0 && leadingScore % 10 === 0 && leadingScore > oldLeadingScore) {
        const period = leadingScore / 10
        const outIdx = (period - 1) % 5
        const inIdx = (period + 1) % 5

        setSubInfo({
          teamA: { out: config.teamA[outIdx], in: config.teamA[inIdx] },
          teamB: { out: config.teamB[outIdx], in: config.teamB[inIdx] },
        })

        const newCurrentA = [period % 5, (period + 1) % 5]
        const newCurrentB = [period % 5, (period + 1) % 5]
        setCurrentA(newCurrentA)
        setCurrentB(newCurrentB)

        // 关键：换人时的站位规则
        // 领先队伍的新上场选手到双数区发球
        // 落后队伍的新上场选手到双数区接发球
        const newPositions = {
          A: {} as Record<number, 'even' | 'odd'>,
          B: {} as Record<number, 'even' | 'odd'>
        }
        
        // 确定哪队领先
        const leadingTeam = newScoreA > newScoreB ? 'A' : 'B'
        const trailingTeam = leadingTeam === 'A' ? 'B' : 'A'
        
        // 领先队伍的新上场球员放在双数区
        newPositions[leadingTeam][inIdx] = 'even'
        
        // 落后队伍的新上场球员放在双数区
        newPositions[trailingTeam][inIdx] = 'even'
        
        // 其他球员放在单数区
        newCurrentA.forEach(idx => {
          if (idx !== (leadingTeam === 'A' ? inIdx : trailingTeam === 'A' ? inIdx : -1)) {
            newPositions.A[idx] = 'odd'
          }
        })
        
        newCurrentB.forEach(idx => {
          if (idx !== (leadingTeam === 'B' ? inIdx : trailingTeam === 'B' ? inIdx : -1)) {
            newPositions.B[idx] = 'odd'
          }
        })
        
        setPositions(newPositions)

        // 关键：换人时的发球/接发规则
        // 领先队伍的新上场选手到双数区进行发球
        // 落后队伍的新上场选手到双数区进行接发球
        
        if (leadingTeam === 'A') {
          // A队领先：A队新上场选手(inIdx)发球，B队新上场选手(inIdx)接发球
          setServerTeam('A')
          setServerIndex(inIdx)
          setReceiverIndex(inIdx)
        } else {
          // B队领先：B队新上场选手(inIdx)发球，A队新上场选手(inIdx)接发球
          setServerTeam('B')
          setServerIndex(inIdx)
          setReceiverIndex(inIdx)
        }
      }
    }
  }

  const handleRestart = () => {
    setScoreA(0)
    setScoreB(0)
    setHistory([])
    setWinner(null)
    setServerTeam(config.serverTeam)
    setServerIndex(config.serverIndex)
    setReceiverIndex(config.receiverIndex)
    if (config.mode === 'singles') {
      setCurrentA([0])
      setCurrentB([0])
    } else if (config.mode === 'doubles') {
      setCurrentA([0, 1])
      setCurrentB([0, 1])
    } else if (config.mode === 'wylb') {
      setCurrentA([0, 1])
      setCurrentB([0, 1])
    }
  }

  const getModeTitle = () => {
    if (config.mode === 'singles') return '单打'
    if (config.mode === 'doubles') return '双打'
    return '五羽伦比'
  }

  return (
    <View className='match-container'>
      {/* Header */}
      <View className='match-header'>
        <Text className='header-title'>
          {getModeTitle()} · {config.targetScore}分制 · {config.deuce ? '加分' : '不加分'}
        </Text>
      </View>

      {/* Court Area */}
      <View className='court-area'>
        <View className='court-card'>
          {/* Team A Half */}
          <View className='team-half team-a'>
            <Text className='team-label-a'>A队</Text>
            <View className='players-row'>
              {/* A队：左边是双数区，右边是单数区，需要按区域排序 */}
              {currentA
                .slice()
                .sort((a, b) => {
                  // 双数区('even')排在前面(左边)，单数区('odd')排在后面(右边)
                  const zoneA = positions.A[a] || 'even'
                  const zoneB = positions.A[b] || 'even'
                  if (zoneA === 'even' && zoneB === 'odd') return -1
                  if (zoneA === 'odd' && zoneB === 'even') return 1
                  return 0
                })
                .map((idx, index) => {
                  const name = config.teamA[idx]
                  const isServer = serverTeam === 'A' && serverIndex === idx
                  const isReceiver = serverTeam === 'B' && receiverIndex === idx
                  const zone = positions.A[idx]  // 获取该球员的站位区域
                  return (
                    <View key={`A-${idx}`} style={{ display: 'flex', alignItems: 'center' }}>
                      <PlayerAvatar
                        key={`A-${idx}`}
                        name={name}
                        isServer={isServer}
                        isReceiver={isReceiver}
                        color='blue'
                        zone={zone}
                        mode={config.mode}
                      />
                      {/* 在两个球员之间添加垂直分隔线 */}
                      {index === 0 && currentA.length > 1 && (
                        <View className='zone-divider'></View>
                      )}
                    </View>
                  )
                })}
            </View>
          </View>

          {/* Net Divider */}
          <View className='net-divider'>
            <Text className='vs-text'>VS</Text>
          </View>

          {/* Team B Half */}
          <View className='team-half team-b'>
            <Text className='team-label-b'>B队</Text>
            <View className='players-row'>
              {/* B队：左边是单数区，右边是双数区，需要按区域排序 */}
              {currentB
                .slice()
                .sort((a, b) => {
                  // 单数区('odd')排在前面(左边)，双数区('even')排在后面(右边)
                  const zoneA = positions.B[a] || 'odd'
                  const zoneB = positions.B[b] || 'odd'
                  if (zoneA === 'odd' && zoneB === 'even') return -1
                  if (zoneA === 'even' && zoneB === 'odd') return 1
                  return 0
                })
                .map((idx, index) => {
                  const name = config.teamB[idx]
                  const isServer = serverTeam === 'B' && serverIndex === idx
                  const isReceiver = serverTeam === 'A' && receiverIndex === idx
                  const zone = positions.B[idx]  // 获取该球员的站位区域
                  return (
                    <View key={`B-${idx}`} style={{ display: 'flex', alignItems: 'center' }}>
                      <PlayerAvatar
                        key={`B-${idx}`}
                        name={name}
                        isServer={isServer}
                        isReceiver={isReceiver}
                        color='rose'
                        zone={zone}
                        mode={config.mode}
                      />
                      {/* 在两个球员之间添加垂直分隔线 */}
                      {index === 0 && currentB.length > 1 && (
                        <View className='zone-divider'></View>
                      )}
                    </View>
                  )
                })}
            </View>
          </View>
        </View>

        {/* Score Area */}
        <View className='score-card'>
          <View className='score-team'>
            <Text className='score-number'>{scoreA}</Text>
            <Text className='score-team-name blue'>A队</Text>
          </View>
          <Text className='score-separator'>:</Text>
          <View className='score-team'>
            <Text className='score-number'>{scoreB}</Text>
            <Text className='score-team-name rose'>B队</Text>
          </View>
        </View>

        {/* Controls */}
        <View className='controls'>
          <View className='control-button blue' onClick={() => addPoint('A')}>
            <Text className='control-button-text'>A队 +1分</Text>
          </View>
          <View className='control-button rose' onClick={() => addPoint('B')}>
            <Text className='control-button-text'>B队 +1分</Text>
          </View>
        </View>
      </View>

      {/* WYLB Substitution Modal */}
      {subInfo && (
        <View className='modal-overlay'>
          <View className='modal-content'>
            <View className='modal-icon'>🔄</View>
            <Text className='modal-title'>换人提示</Text>
            <Text className='modal-desc'>分数到达10分倍数，请替换场上球员</Text>

            <View className='sub-info'>
              <View className='sub-team sub-team-a'>
                <Text className='sub-team-title'>A队换人</Text>
                <View className='sub-detail'>
                  <Text className='sub-out'>
                    下场：<Text className='out-name'>{subInfo.teamA.out}</Text>
                  </Text>
                  <Text className='sub-in'>
                    上场：<Text className='in-name'>{subInfo.teamA.in}</Text>
                  </Text>
                </View>
              </View>
              <View className='sub-team sub-team-b'>
                <Text className='sub-team-title'>B队换人</Text>
                <View className='sub-detail'>
                  <Text className='sub-out'>
                    下场：<Text className='out-name'>{subInfo.teamB.out}</Text>
                  </Text>
                  <Text className='sub-in'>
                    上场：<Text className='in-name'>{subInfo.teamB.in}</Text>
                  </Text>
                </View>
              </View>
            </View>

            <View className='modal-button' onClick={() => setSubInfo(null)}>
              <Text className='modal-button-text'>继续比赛</Text>
            </View>
          </View>
        </View>
      )}

      {/* Game Over Modal */}
      {winner && (
        <View className='modal-overlay'>
          <View className='game-over-modal'>
            <View className='game-over-header'>
              <Text className='game-over-title'>比赛结束</Text>
              <Text className='winner-text'>
                获胜方：<Text className='winner-name'>{winner === 'A' ? 'A队' : 'B队'}</Text>
              </Text>
              <Text className='winner-players'>
                {winner === 'A' ? config.teamA.join('、') : config.teamB.join('、')}
              </Text>
              <Text className='final-score'>
                {scoreA} : {scoreB}
              </Text>
            </View>

            <View className='game-over-content'>
              <Text className='content-section-title'>参赛选手</Text>
              <View className='players-list'>
                <View className='player-row'>
                  <Text className='player-team blue'>A队</Text>
                  <Text className='player-names'>{config.teamA.join(', ')}</Text>
                </View>
                <View className='player-row'>
                  <Text className='player-team rose'>B队</Text>
                  <Text className='player-names'>{config.teamB.join(', ')}</Text>
                </View>
              </View>

              <Text className='content-section-title'>得分明细</Text>
              <View className='history-list'>
                {history.map((entry, idx) => (
                  <View key={idx} className='history-item'>
                    <Text className='history-index'>#{idx + 1}</Text>
                    {/* 显示两队场上选手 */}
                    <View className='history-players-row'>
                      <View className={`player-info ${entry.scorer === 'A' ? 'scoring-team' : ''}`}>
                        <View className='player-names-container'>
                          {entry.teamAPlayers?.map((player, pIdx) => (
                            <Text key={pIdx} className='player-name-item blue'>{player}</Text>
                          ))}
                        </View>
                      </View>
                      <Text className='history-score-center'>
                        {entry.scoreA} - {entry.scoreB}
                      </Text>
                      <View className={`player-info ${entry.scorer === 'B' ? 'scoring-team' : ''}`}>
                        <View className='player-names-container'>
                          {entry.teamBPlayers?.map((player, pIdx) => (
                            <Text key={pIdx} className='player-name-item rose'>{player}</Text>
                          ))}
                        </View>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            </View>

            <View className='game-over-footer'>
              {params?.multiTurn === 'true' ? (
                <View
                  className='footer-button home'
                  onClick={() => Taro.navigateBack()}
                >
                  <Text className='footer-button-text'>返回对阵表</Text>
                </View>
              ) : (
                <>
                  <View className='footer-button restart' onClick={handleRestart}>
                    <Text className='footer-button-text'>重新开始</Text>
                  </View>
                  <View
                    className='footer-button home'
                    onClick={() => Taro.navigateTo({ url: '/pages/home/index' })}
                  >
                    <Text className='footer-button-text'>回到主页</Text>
                  </View>
                </>
              )}
            </View>
          </View>
        </View>
      )}
    </View>
  )
}

function PlayerAvatar({
  name,
  isServer,
  isReceiver,
  color,
  zone,
  mode,
}: {
  name: string
  isServer: boolean
  isReceiver: boolean
  color: 'blue' | 'rose'
  zone?: 'even' | 'odd'
  mode?: string
}) {
  const displayName = name || ''

  return (
    <View className='player-avatar'>
      <View className={`avatar-circle ${color}`}>
        <Text>{displayName.substring(0, 2)}</Text>
      </View>
      <Text className='avatar-name'>{displayName}</Text>
      
      {/* 显示单双数区标识 */}
      {zone && mode !== 'singles' && (
        <Text className='zone-label'>{zone === 'even' ? '双' : '单'}</Text>
      )}

      {isServer && <View className={`avatar-badge server ${color}`}>发</View>}
      {isReceiver && <View className='avatar-badge receiver'>接</View>}
    </View>
  )
}
