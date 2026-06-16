import { MultiTurnPlayer, MultiTurnMatch, PartnerMode, PlayerStats } from './multi-turn-types';

function makePairKey(a: number, b: number): string {
  return a < b ? `${a}-${b}` : `${b}-${a}`;
}

interface ScheduleState {
  partnerCount: Map<string, number>;   // 搭档次数
  appearanceCount: Map<number, number>; // 上场次数
  consecutiveOnCourt: Map<number, number>; // 连续上场次数
  lastOnCourt: Set<number>; // 上一轮上场选手
}

/**
 * 计算最少轮次
 * N 人中每人需与 N-1 人搭档，每轮搭档 1 人
 * 每轮 4 人上场，N-4 人轮空
 * 考虑轮空和约束，最少轮次约 N-1 + ceil((N-4)/(4)) 的调整
 */
export function calculateMinRounds(playerCount: number): number {
  // 每人需搭档 N-1 人，每轮搭档 1 人，但轮空时不搭档
  // 每轮上场 4 人，轮空 N-4 人
  // 简化计算：保证每人至少与其他人搭档一次
  if (playerCount <= 4) return 1;
  return Math.ceil((playerCount * (playerCount - 1)) / 4);
}

/**
 * 生成对阵表
 */
export function generateSchedule(
  players: MultiTurnPlayer[],
  partnerMode: PartnerMode,
  totalRounds: number
): MultiTurnMatch[] {
  const matches: MultiTurnMatch[] = [];
  const playerIds = players.map(p => p.id);

  const state: ScheduleState = {
    partnerCount: new Map(),
    appearanceCount: new Map(),
    consecutiveOnCourt: new Map(),
    lastOnCourt: new Set(),
  };

  // 初始化
  for (const id of playerIds) {
    state.appearanceCount.set(id, 0);
    state.consecutiveOnCourt.set(id, 0);
  }

  for (let round = 1; round <= totalRounds; round++) {
    const matchResult = generateRound(players, partnerMode, state, round);
    if (matchResult) {
      matches.push(matchResult);
      // 更新状态
      const onCourt = new Set([...matchResult.teamA, ...matchResult.teamB]);
      for (const id of playerIds) {
        if (onCourt.has(id)) {
          state.appearanceCount.set(id, (state.appearanceCount.get(id) || 0) + 1);
          state.consecutiveOnCourt.set(id, (state.consecutiveOnCourt.get(id) || 0) + 1);
        } else {
          state.consecutiveOnCourt.set(id, 0);
        }
      }
      // 记录搭档
      const keyA = makePairKey(matchResult.teamA[0], matchResult.teamA[1]);
      const keyB = makePairKey(matchResult.teamB[0], matchResult.teamB[1]);
      state.partnerCount.set(keyA, (state.partnerCount.get(keyA) || 0) + 1);
      state.partnerCount.set(keyB, (state.partnerCount.get(keyB) || 0) + 1);
      state.lastOnCourt = onCourt;
    }
  }

  return matches;
}

function generateRound(
  players: MultiTurnPlayer[],
  partnerMode: PartnerMode,
  state: ScheduleState,
  round: number
): MultiTurnMatch | null {
  const playerIds = players.map(p => p.id);
  const playerMap = new Map(players.map(p => [p.id, p]));

  // 选择 4 名上场选手
  const onCourtPlayers = selectOnCourtPlayers(playerIds, state, playerMap, partnerMode);
  if (onCourtPlayers.length < 4) return null;

  // 编排搭档
  const { teamA, teamB } = arrangePartners(onCourtPlayers, partnerMode, state, playerMap);

  return {
    round,
    teamA,
    teamB,
    scoreA: null,
    scoreB: null,
    completed: false,
  };
}

/**
 * 选择上场选手
 * 优先选择：连续上场次数 < 2 且上场次数最少 且 上一轮轮空的选手
 */
function selectOnCourtPlayers(
  playerIds: number[],
  state: ScheduleState,
  playerMap: Map<number, MultiTurnPlayer>,
  partnerMode: PartnerMode
): number[] {
  const candidates = playerIds.filter(id => {
    const consecutive = state.consecutiveOnCourt.get(id) || 0;
    return consecutive < 2; // 连续上场不超过 2 局
  });

  if (candidates.length < 4) {
    // 放宽限制：如果候选不足 4 人，允许连续上场 2 局的选手继续
    return playerIds.slice(0, 4);
  }

  // 按优先级排序
  const scored = candidates.map(id => {
    const appearances = state.appearanceCount.get(id) || 0;
    const consecutive = state.consecutiveOnCourt.get(id) || 0;
    const wasOnCourtLast = state.lastOnCourt.has(id);

    // 优先级：上场次数少 > 上一轮轮空 > 连续上场少
    let score = 0;
    score -= appearances * 100;  // 上场次数越少越优先
    if (!wasOnCourtLast) score += 50; // 上一轮轮空的优先
    score -= consecutive * 10;   // 连续上场少的优先

    return { id, score };
  });

  scored.sort((a, b) => b.score - a.score);

  // 混双模式下，需要确保选出的 4 人中男女各 2 人
  if (partnerMode === 'mixed') {
    return selectMixedCandidates(scored, playerMap);
  }

  return scored.slice(0, 4).map(s => s.id);
}

/**
 * 混双模式下选择上场选手：2 男 2 女
 */
function selectMixedCandidates(
  scored: { id: number; score: number }[],
  playerMap: Map<number, MultiTurnPlayer>
): number[] {
  const males = scored.filter(s => playerMap.get(s.id)?.gender === 'male');
  const females = scored.filter(s => playerMap.get(s.id)?.gender === 'female');

  const selected: number[] = [];
  // 取优先级最高的 2 男 2 女
  selected.push(...males.slice(0, 2).map(s => s.id));
  selected.push(...females.slice(0, 2).map(s => s.id));

  if (selected.length < 4) {
    // 男女数量不足时，用另一方补齐
    const remaining = scored.filter(s => !selected.includes(s.id));
    while (selected.length < 4 && remaining.length > 0) {
      selected.push(remaining.shift()!.id);
    }
  }

  return selected.slice(0, 4);
}

/**
 * 编排搭档
 * 优先选择从未搭档过的组合
 */
function arrangePartners(
  onCourt: number[],
  partnerMode: PartnerMode,
  state: ScheduleState,
  playerMap: Map<number, MultiTurnPlayer>
): { teamA: [number, number]; teamB: [number, number] } {
  // 生成所有可能的搭档组合
  const pairs: [number, number][] = [];
  for (let i = 0; i < onCourt.length; i++) {
    for (let j = i + 1; j < onCourt.length; j++) {
      pairs.push([onCourt[i], onCourt[j]]);
    }
  }

  // 混双模式过滤：搭档必须一男一女
  const validPairs = partnerMode === 'mixed'
    ? pairs.filter(([a, b]) => {
        const ga = playerMap.get(a)?.gender;
        const gb = playerMap.get(b)?.gender;
        return ga !== gb; // 一男一女
      })
    : pairs;

  // 按搭档次数排序（少的优先）
  validPairs.sort((a, b) => {
    const countA = state.partnerCount.get(makePairKey(a[0], a[1])) || 0;
    const countB = state.partnerCount.get(makePairKey(b[0], b[1])) || 0;
    return countA - countB;
  });

  // 贪心选择两对不重叠的搭档
  // 尝试找到最优组合：两对搭档的搭档次数之和最小
  let bestCombination: { teamA: [number, number]; teamB: [number, number] } | null = null;
  let bestScore = Infinity;

  for (let i = 0; i < validPairs.length; i++) {
    for (let j = i + 1; j < validPairs.length; j++) {
      const pair1 = validPairs[i];
      const pair2 = validPairs[j];
      // 检查不重叠
      const used = new Set([...pair1, ...pair2]);
      if (used.size !== 4) continue;

      // 混双模式：场上两对都必须是一男一女
      if (partnerMode === 'mixed') {
        // pair1 和 pair2 已经是有效搭档（一男一女）
        // 还需确保场上是混双 vs 混双
        // 即 pair1 是一男一女，pair2 也是一男一女（已保证）
      }

      const count1 = state.partnerCount.get(makePairKey(pair1[0], pair1[1])) || 0;
      const count2 = state.partnerCount.get(makePairKey(pair2[0], pair2[1])) || 0;
      const totalScore = count1 + count2;

      if (totalScore < bestScore) {
        bestScore = totalScore;
        bestCombination = { teamA: pair1, teamB: pair2 };
      }
    }
  }

  if (bestCombination) {
    return bestCombination;
  }

  // 降级：随机分配
  const shuffled = [...onCourt].sort(() => Math.random() - 0.5);
  return {
    teamA: [shuffled[0], shuffled[1]],
    teamB: [shuffled[2], shuffled[3]],
  };
}

/**
 * 计算选手统计
 */
export function calculatePlayerStats(
  players: MultiTurnPlayer[],
  matches: MultiTurnMatch[]
): Map<number, PlayerStats> {
  const stats = new Map<number, PlayerStats>();

  for (const player of players) {
    stats.set(player.id, {
      playerId: player.id,
      name: player.name,
      totalScore: 0,
      appearances: 0,
      wins: 0,
    });
  }

  for (const match of matches) {
    if (!match.completed) continue;

    const allPlayers = [...match.teamA, ...match.teamB];
    for (const pid of allPlayers) {
      const stat = stats.get(pid);
      if (stat) {
        stat.appearances++;
        if (match.teamA.includes(pid)) {
          stat.totalScore += match.scoreA || 0;
          if ((match.scoreA || 0) > (match.scoreB || 0)) stat.wins++;
        } else {
          stat.totalScore += match.scoreB || 0;
          if ((match.scoreB || 0) > (match.scoreA || 0)) stat.wins++;
        }
      }
    }
  }

  return stats;
}
