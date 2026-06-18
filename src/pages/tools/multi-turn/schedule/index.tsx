import { useState, useMemo, useEffect } from 'react'
import { View, Text, Input } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { MultiTurnEvent, MultiTurnMatch } from '../../../../utils/multi-turn-types'
import { calculatePlayerStats, generateSchedule } from '../../../../utils/multi-turn-algorithm'
import { MatchConfig } from '../../../../utils/types'
import './index.css'

export default function MultiTurnSchedule() {
  const params = Taro.getCurrentInstance().router?.params
  const eventStr = params?.event
  const initialEvent: MultiTurnEvent | null = eventStr
    ? JSON.parse(decodeURIComponent(eventStr))
    : null

  const [event, setEvent] = useState<MultiTurnEvent | null>(initialEvent)
  const [showScoreModal, setShowScoreModal] = useState(false)
  const [editingRound, setEditingRound] = useState<number>(-1)
  const [inputScoreA, setInputScoreA] = useState<string>('')
  const [inputScoreB, setInputScoreB] = useState<string>('')

  // 发球方设置弹窗状态
  const [showServerModal, setShowServerModal] = useState(false)
  const [serverMatch, setServerMatch] = useState<MultiTurnMatch | null>(null)
  const [serverTeam, setServerTeam] = useState<'A' | 'B'>('A')
  const [serverIndex, setServerIndex] = useState<number>(0)
  const [receiverIndex, setReceiverIndex] = useState<number>(0)

  // 监听记分器回传
  useEffect(() => {
    const handleScoreBack = (data: { round: number; scoreA: number; scoreB: number }) => {
      if (!event) return
      const newMatches = event.matches.map(m => {
        if (m.round === data.round) {
          return { ...m, scoreA: data.scoreA, scoreB: data.scoreB, completed: true }
        }
        return m
      })
      setEvent({ ...event, matches: newMatches })
    }

    Taro.eventCenter.on('multiTurnScoreBack', handleScoreBack)
    return () => {
      Taro.eventCenter.off('multiTurnScoreBack', handleScoreBack)
    }
  }, [event])

  // 页面显示时检查是否有回传数据
  useEffect(() => {
    const checkScoreBack = () => {
      try {
        const stored = Taro.getStorageSync('multiTurnScoreBack')
        if (stored && event) {
          const data = JSON.parse(stored)
          const newMatches = event.matches.map(m => {
            if (m.round === data.round) {
              return { ...m, scoreA: data.scoreA, scoreB: data.scoreB, completed: true }
            }
            return m
          })
          setEvent({ ...event, matches: newMatches })
          Taro.removeStorageSync('multiTurnScoreBack')
        }
      } catch (_) {
        // ignore
      }
    }
    checkScoreBack()
  })

  if (!event) {
    Taro.navigateBack()
    return null
  }

  const playerMap = new Map(event.players.map(p => [p.id, p]))
  const completedCount = event.matches.filter(m => m.completed).length
  const allCompleted = completedCount === event.matches.length
  const hasStarted = completedCount > 0

  const playerStats = useMemo(() => {
    if (!event) return []
    const statsMap = calculatePlayerStats(event.players, event.matches)
    return Array.from(statsMap.values()).sort((a, b) => b.totalScore - a.totalScore)
  }, [event])

  const getByName = (id: number) => playerMap.get(id)?.name || `选手${id}`

  const getByePlayers = (match: MultiTurnMatch) => {
    const onCourt = new Set([...match.teamA, ...match.teamB])
    return event.players.filter(p => !onCourt.has(p.id)).map(p => p.name)
  }

  const getCardClass = (match: MultiTurnMatch) => {
    if (match.completed) return 'completed'
    // 第一个未完成的轮次为 pending
    const firstPending = event.matches.find(m => !m.completed)
    if (firstPending && firstPending.round === match.round) return 'pending'
    return 'future'
  }

  const handleDirectInput = (round: number) => {
    const match = event.matches.find(m => m.round === round)
    if (!match) return
    setEditingRound(round)
    setInputScoreA(match.scoreA?.toString() || '')
    setInputScoreB(match.scoreB?.toString() || '')
    setShowScoreModal(true)
  }

  const handleConfirmScore = () => {
    const scoreA = parseInt(inputScoreA)
    const scoreB = parseInt(inputScoreB)
    if (isNaN(scoreA) || isNaN(scoreB)) return

    const newMatches = event.matches.map(m => {
      if (m.round === editingRound) {
        return { ...m, scoreA, scoreB, completed: true }
      }
      return m
    })
    setEvent({ ...event, matches: newMatches })
    setShowScoreModal(false)
  }

  const handleStartMatch = (match: MultiTurnMatch) => {
    setServerMatch(match)
    setServerTeam('A')
    setServerIndex(0)
    setReceiverIndex(0)
    setShowServerModal(true)
  }

  const handleConfirmServer = () => {
    if (!serverMatch) return
    const match = serverMatch
    const config: MatchConfig = {
      mode: 'doubles',
      targetScore: event.targetScore,
      deuce: event.deuce,
      teamA: [getByName(match.teamA[0]), getByName(match.teamA[1])],
      teamB: [getByName(match.teamB[0]), getByName(match.teamB[1])],
      serverTeam,
      serverIndex,
      receiverIndex,
    }

    Taro.setStorageSync('multiTurnCurrentRound', match.round)
    Taro.setStorageSync('multiTurnEvent', JSON.stringify(event))

    setShowServerModal(false)
    Taro.navigateTo({
      url: `/pages/match/index?config=${encodeURIComponent(JSON.stringify(config))}&multiTurn=true&round=${match.round}`,
    })
  }

  const handleViewRanking = () => {
    Taro.navigateTo({
      url: `/pages/tools/multi-turn/ranking/index?event=${encodeURIComponent(JSON.stringify(event))}`,
    })
  }

  const handleRegenerate = () => {
    if (hasStarted) return
    const newMatches = generateSchedule(event.players, event.partnerMode, event.totalRounds)
    setEvent({ ...event, matches: newMatches })
    Taro.showToast({ title: '已重新生成', icon: 'success', duration: 1500 })
  }

  const progressPercent = (completedCount / event.matches.length) * 100

  return (
    <View className='mt-schedule-container'>
      {/* 顶部信息 */}
      <View className='mt-schedule-header'>
        <View>
          <Text className='mt-schedule-title'>多人转对阵表</Text>
          <Text className='mt-schedule-info'>
            {event.players.length}人 · {event.partnerMode === 'random' ? '完全随机' : '严格混双'} · {event.targetScore}分制 · {event.deuce ? '加分' : '不加分'}
          </Text>
        </View>
        <View className='mt-schedule-header-right'>
          {!hasStarted && (
            <View className='mt-regenerate-btn' onClick={handleRegenerate}>
              <Text className='mt-regenerate-btn-text'>重新生成</Text>
            </View>
          )}
          <View className='mt-schedule-progress-text'>
            <Text className='mt-progress-count'>{completedCount}/{event.matches.length}</Text>
            <Text className='mt-progress-label'>已完成</Text>
          </View>
        </View>
      </View>

      {/* 进度条 */}
      <View className='mt-progress-bar'>
        <View className='mt-progress-fill' style={{ width: `${progressPercent}%` }} />
      </View>

      {/* 轮次列表 */}
      {event.matches.map(match => {
        const cardClass = getCardClass(match)
        const isPending = cardClass === 'pending'

        return (
          <View key={match.round} className={`mt-round-card ${cardClass}`}>
            <View className='mt-round-header'>
              <Text className='mt-round-title'>第 {match.round} 轮</Text>
              <View className='mt-round-status'>
                <Text>
                  {match.completed ? '已完成' : isPending ? '待记分' : '未开始'}
                </Text>
              </View>
            </View>

            <View className='mt-match-row'>
              <View className='mt-team-names mt-team-a'>
                <Text>{getByName(match.teamA[0])} / {getByName(match.teamA[1])}</Text>
              </View>
              <View className={`mt-score-display ${!match.completed && isPending ? 'placeholder' : ''} ${cardClass === 'future' ? 'future-score' : ''}`}>
                <Text className='score'>
                  {match.completed ? `${match.scoreA} : ${match.scoreB}` : isPending ? '? : ?' : '- : -'}
                </Text>
              </View>
              <View className='mt-team-names mt-team-b'>
                <Text>{getByName(match.teamB[0])} / {getByName(match.teamB[1])}</Text>
              </View>
            </View>

            <View className='mt-bye-info'>
              <Text>轮空：{getByePlayers(match).join('、')}</Text>
            </View>

            {/* 操作按钮（仅待记分轮次显示） */}
            {isPending && (
              <View className='mt-match-actions'>
                <View className='mt-action-btn input-score' onClick={() => handleDirectInput(match.round)}>
                  <Text className='mt-action-btn-text'>直接输入分数</Text>
                </View>
                <View className='mt-action-btn start-match' onClick={() => handleStartMatch(match)}>
                  <Text className='mt-action-btn-text'>开始记分</Text>
                </View>
              </View>
            )}
          </View>
        )
      })}

      {/* 排名预览 / 查看排名 */}
      {completedCount > 0 && (
        <View className='mt-ranking-preview'>
          <Text className='mt-ranking-preview-title'>{allCompleted ? '最终排名' : '当前排名'}</Text>
          {playerStats.slice(0, 3).map((stat, idx) => (
            <View key={stat.playerId} className='mt-ranking-item'>
              <View className='mt-ranking-left'>
                <Text className={`mt-ranking-pos ${idx === 0 ? 'gold' : 'normal'}`}>{idx + 1}</Text>
                <Text className='mt-ranking-name'>{stat.name}</Text>
              </View>
              <Text className='mt-ranking-score'>{stat.totalScore}分</Text>
            </View>
          ))}
          {!allCompleted && (
            <Text className='mt-ranking-hint'>完成所有轮次后查看完整排名</Text>
          )}
        </View>
      )}

      {allCompleted && (
        <View className='mt-view-ranking-btn' onClick={handleViewRanking}>
          <Text className='mt-view-ranking-btn-text'>查看完整排名</Text>
        </View>
      )}

      {/* 分数输入弹窗 */}
      {showScoreModal && (
        <View className='mt-score-modal-overlay'>
          <View className='mt-score-modal'>
            <Text className='mt-score-modal-title'>输入第 {editingRound} 轮分数</Text>
            <View className='mt-score-input-row'>
              <View className='mt-score-input-group'>
                <Text className='mt-score-input-label'>A队</Text>
                <Input
                  type='number'
                  value={inputScoreA}
                  onInput={(e) => setInputScoreA(e.detail.value)}
                  className='mt-score-input'
                  placeholder='0'
                />
              </View>
              <Text className='mt-score-input-separator'>:</Text>
              <View className='mt-score-input-group'>
                <Text className='mt-score-input-label'>B队</Text>
                <Input
                  type='number'
                  value={inputScoreB}
                  onInput={(e) => setInputScoreB(e.detail.value)}
                  className='mt-score-input'
                  placeholder='0'
                />
              </View>
            </View>
            <View className='mt-score-modal-actions'>
              <View className='mt-score-modal-btn cancel' onClick={() => setShowScoreModal(false)}>
                <Text className='mt-score-modal-btn-text'>取消</Text>
              </View>
              <View className='mt-score-modal-btn confirm' onClick={handleConfirmScore}>
                <Text className='mt-score-modal-btn-text'>确认</Text>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* 发球方设置弹窗 */}
      {showServerModal && serverMatch && (
        <View className='mt-score-modal-overlay'>
          <View className='mt-score-modal'>
            <Text className='mt-score-modal-title'>设置发球方</Text>

            {/* 发球方选择 */}
            <View className='mt-server-section'>
              <Text className='mt-server-label'>发球方</Text>
              <View className='mt-server-team-options'>
                <View
                  className={`mt-server-team-btn ${serverTeam === 'A' ? 'active team-a' : ''}`}
                  onClick={() => { setServerTeam('A'); setServerIndex(0); setReceiverIndex(0) }}
                >
                  <Text className='mt-server-team-btn-text'>A队</Text>
                </View>
                <View
                  className={`mt-server-team-btn ${serverTeam === 'B' ? 'active team-b' : ''}`}
                  onClick={() => { setServerTeam('B'); setServerIndex(0); setReceiverIndex(0) }}
                >
                  <Text className='mt-server-team-btn-text'>B队</Text>
                </View>
              </View>
            </View>

            {/* 发球选手 */}
            <View className='mt-server-section'>
              <Text className='mt-server-label'>发球选手</Text>
              <View className='mt-server-player-options'>
                {(serverTeam === 'A' ? serverMatch.teamA : serverMatch.teamB).map((pid, idx) => (
                  <View
                    key={pid}
                    className={`mt-server-player-btn ${serverIndex === idx ? 'active' : ''}`}
                    onClick={() => setServerIndex(idx)}
                  >
                    <Text className='mt-server-player-btn-text'>{getByName(pid)}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* 接发球选手 */}
            <View className='mt-server-section'>
              <Text className='mt-server-label'>接发球选手</Text>
              <View className='mt-server-player-options'>
                {(serverTeam === 'A' ? serverMatch.teamB : serverMatch.teamA).map((pid, idx) => (
                  <View
                    key={pid}
                    className={`mt-server-player-btn ${receiverIndex === idx ? 'active' : ''}`}
                    onClick={() => setReceiverIndex(idx)}
                  >
                    <Text className='mt-server-player-btn-text'>{getByName(pid)}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View className='mt-score-modal-actions'>
              <View className='mt-score-modal-btn cancel' onClick={() => setShowServerModal(false)}>
                <Text className='mt-score-modal-btn-text'>取消</Text>
              </View>
              <View className='mt-score-modal-btn confirm' onClick={handleConfirmServer}>
                <Text className='mt-score-modal-btn-text'>开始记分</Text>
              </View>
            </View>
          </View>
        </View>
      )}
    </View>
  )
}
