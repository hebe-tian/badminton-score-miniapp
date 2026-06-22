import { MultiTurnPlayer, MultiTurnMatch, PartnerMode, PlayerStats } from './multi-turn-types';

function makePairKey(a: number, b: number): string {
  return a < b ? `${a}-${b}` : `${b}-${a}`;
}

function makeMatchKey(teamA: [number, number], teamB: [number, number]): string {
  const keyA = makePairKey(teamA[0], teamA[1]);
  const keyB = makePairKey(teamB[0], teamB[1]);
  return keyA < keyB ? `${keyA}|${keyB}` : `${keyB}|${keyA}`;
}

function shuffleArray<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

interface ScheduleState {
  partnerCount: Map<string, number>;   // 搭档次数
  opponentCount: Map<string, number>;  // 对决组合次数
  appearanceCount: Map<number, number>; // 上场次数
  consecutiveOnCourt: Map<number, number>; // 连续上场次数
  lastOnCourt: Set<number>; // 上一轮上场选手
  opponentPairCount: Map<string, number>;  // 每对选手对战次数（如 "1-3": 2）
  lastOpponents: Map<number, Set<number>>;  // 每人上轮的对手集合
  restRounds: Map<number, number[]>;       // 每人休息的轮次索引
}

interface PossibleMatch {
  teamA: [number, number];
  teamB: [number, number];
  players: number[];
}

/**
 * 计算最少轮次
 * 保证每人上场次数相等：
 * - 完全随机：4 * R 能被 N 整除
 * - 严格混双：2 * R 能被 M 和 F 整除
 */
export function calculateMinRounds(
  playerCount: number,
  partnerMode: PartnerMode = 'random',
  maleCount: number = 0,
  femaleCount: number = 0
): number {
  if (playerCount <= 4) return 1;

  let baseRounds: number;
  if (partnerMode === 'mixed' && maleCount > 0 && femaleCount > 0) {
    baseRounds = Math.ceil((maleCount * femaleCount) / 2);
  } else {
    baseRounds = Math.ceil((playerCount * (playerCount - 1)) / 4);
  }

  // 递增轮次直到满足每人上场次数相等的整除条件
  let rounds = baseRounds;
  while (true) {
    if (partnerMode === 'mixed' && maleCount > 0 && femaleCount > 0) {
      if ((2 * rounds) % maleCount === 0 && (2 * rounds) % femaleCount === 0) break;
    } else {
      if ((4 * rounds) % playerCount === 0) break;
    }
    rounds++;
  }

  return rounds;
}

/**
 * 生成对阵表
 * 多次生成取最优：生成 5 次，保留质量最优的对阵表
 */
export function generateSchedule(
  players: MultiTurnPlayer[],
  partnerMode: PartnerMode,
  totalRounds: number
): MultiTurnMatch[] {
  const GENERATION_COUNT = 5;
  let bestSchedule: MultiTurnMatch[] | null = null;
  let bestScore = Infinity;

  for (let i = 0; i < GENERATION_COUNT; i++) {
    const schedule = generateSingleSchedule(players, partnerMode, totalRounds);
    const qualityScore = evaluateScheduleQuality(schedule, players);

    if (qualityScore < bestScore) {
      bestScore = qualityScore;
      bestSchedule = schedule;
    }
  }

  return bestSchedule!;
}

/**
 * 单次生成对阵表
 * 使用全局贪心：每轮从所有合法对局中选代价最小者
 */
function generateSingleSchedule(
  players: MultiTurnPlayer[],
  partnerMode: PartnerMode,
  totalRounds: number
): MultiTurnMatch[] {
  const matches: MultiTurnMatch[] = [];
  const playerIds = players.map(p => p.id);
  const playerMap = new Map(players.map(p => [p.id, p]));

  const state: ScheduleState = {
    partnerCount: new Map(),
    opponentCount: new Map(),
    appearanceCount: new Map(),
    consecutiveOnCourt: new Map(),
    lastOnCourt: new Set(),
    opponentPairCount: new Map(),
    lastOpponents: new Map(),
    restRounds: new Map(),
  };

  for (const id of playerIds) {
    state.appearanceCount.set(id, 0);
    state.consecutiveOnCourt.set(id, 0);
    state.lastOpponents.set(id, new Set());
    state.restRounds.set(id, []);
  }

  let possibleMatches = generatePossibleMatches(players, partnerMode, playerMap);
  possibleMatches = shuffleArray(possibleMatches);

  for (let round = 1; round <= totalRounds; round++) {
    const matchResult = selectBestMatch(possibleMatches, state, playerIds, partnerMode);
    if (matchResult) {
      matches.push({
        round,
        teamA: matchResult.teamA,
        teamB: matchResult.teamB,
        scoreA: null,
        scoreB: null,
        completed: false,
      });

      const onCourt = new Set(matchResult.players);
      for (const id of playerIds) {
        if (onCourt.has(id)) {
          state.appearanceCount.set(id, (state.appearanceCount.get(id) || 0) + 1);
          state.consecutiveOnCourt.set(id, (state.consecutiveOnCourt.get(id) || 0) + 1);
        } else {
          state.consecutiveOnCourt.set(id, 0);
          // 记录休息的轮次
          state.restRounds.get(id)!.push(round);
        }
      }

      const keyA = makePairKey(matchResult.teamA[0], matchResult.teamA[1]);
      const keyB = makePairKey(matchResult.teamB[0], matchResult.teamB[1]);
      state.partnerCount.set(keyA, (state.partnerCount.get(keyA) || 0) + 1);
      state.partnerCount.set(keyB, (state.partnerCount.get(keyB) || 0) + 1);

      const matchKey = makeMatchKey(matchResult.teamA, matchResult.teamB);
      state.opponentCount.set(matchKey, (state.opponentCount.get(matchKey) || 0) + 1);

      // 更新每对选手的对战次数
      const [a1, a2] = matchResult.teamA;
      const [b1, b2] = matchResult.teamB;
      const oppPairs = [
        makePairKey(a1, b1), makePairKey(a1, b2),
        makePairKey(a2, b1), makePairKey(a2, b2),
      ];
      for (const pairKey of oppPairs) {
        state.opponentPairCount.set(pairKey, (state.opponentPairCount.get(pairKey) || 0) + 1);
      }

      // 更新每人上轮的对手集合
      const newLastOpponents = new Map<number, Set<number>>();
      newLastOpponents.set(a1, new Set([b1, b2]));
      newLastOpponents.set(a2, new Set([b1, b2]));
      newLastOpponents.set(b1, new Set([a1, a2]));
      newLastOpponents.set(b2, new Set([a1, a2]));
      for (const id of playerIds) {
        if (!newLastOpponents.has(id)) {
          newLastOpponents.set(id, new Set());
        }
      }
      state.lastOpponents = newLastOpponents;

      state.lastOnCourt = onCourt;
    }
  }

  return matches;
}

/**
 * 预生成所有合法对局
 */
function generatePossibleMatches(
  players: MultiTurnPlayer[],
  partnerMode: PartnerMode,
  playerMap: Map<number, MultiTurnPlayer>
): PossibleMatch[] {
  const playerIds = players.map(p => p.id);
  const matches: PossibleMatch[] = [];

  if (partnerMode === 'mixed') {
    const males = playerIds.filter(id => playerMap.get(id)?.gender === 'male');
    const females = playerIds.filter(id => playerMap.get(id)?.gender === 'female');

    for (let i = 0; i < males.length; i++) {
      for (let j = i + 1; j < males.length; j++) {
        for (let x = 0; x < females.length; x++) {
          for (let y = x + 1; y < females.length; y++) {
            const m1 = males[i], m2 = males[j];
            const f1 = females[x], f2 = females[y];
            // 两种混双分队方式
            matches.push({ teamA: [m1, f1], teamB: [m2, f2], players: [m1, f1, m2, f2] });
            matches.push({ teamA: [m1, f2], teamB: [m2, f1], players: [m1, f2, m2, f1] });
          }
        }
      }
    }
  } else {
    // 完全随机：枚举所有 4 人子集和分队方式
    for (let a = 0; a < playerIds.length; a++) {
      for (let b = a + 1; b < playerIds.length; b++) {
        for (let c = b + 1; c < playerIds.length; c++) {
          for (let d = c + 1; d < playerIds.length; d++) {
            const p1 = playerIds[a], p2 = playerIds[b];
            const p3 = playerIds[c], p4 = playerIds[d];
            // 3 种分队方式
            matches.push({ teamA: [p1, p2], teamB: [p3, p4], players: [p1, p2, p3, p4] });
            matches.push({ teamA: [p1, p3], teamB: [p2, p4], players: [p1, p3, p2, p4] });
            matches.push({ teamA: [p1, p4], teamB: [p2, p3], players: [p1, p4, p2, p3] });
          }
        }
      }
    }
  }

  return matches;
}

/**
 * 选择当前最优对局
 * maxConsecutive: 连续上场限制
 * maxAppearanceGap: 允许的上场次数差距（0 = 严格相等）
 */
function selectBestMatch(
  possibleMatches: PossibleMatch[],
  state: ScheduleState,
  playerIds: number[],
  partnerMode: PartnerMode,
  maxConsecutive: number = 2,
  maxAppearanceGap: number = 0
): PossibleMatch | null {
  let bestScore = Infinity;
  const candidates: PossibleMatch[] = [];

  // 当前最小上场次数
  const minAppearance = Math.min(...playerIds.map(id => state.appearanceCount.get(id) || 0));

  for (const match of possibleMatches) {
    // 过滤连续上场超限
    const exceedsConsecutive = match.players.some(id => (state.consecutiveOnCourt.get(id) || 0) >= maxConsecutive);
    if (exceedsConsecutive) continue;

    // 过滤上场次数超限：所有选手的上场次数不能超过最小值 + maxAppearanceGap
    const exceedsAppearance = match.players.some(id => (state.appearanceCount.get(id) || 0) > minAppearance + maxAppearanceGap);
    if (exceedsAppearance) continue;

    const score = evaluateMatch(match, state, playerIds);

    if (score < bestScore) {
      bestScore = score;
      candidates.length = 0;
      candidates.push(match);
    } else if (score === bestScore) {
      candidates.push(match);
    }
  }

  if (candidates.length > 0) {
    return candidates[Math.floor(Math.random() * candidates.length)];
  }

  // 降级1：放宽连续上场限制（保持上场次数均衡）
  if (maxConsecutive < 3) {
    return selectBestMatch(possibleMatches, state, playerIds, partnerMode, maxConsecutive + 1, maxAppearanceGap);
  }

  // 降级2：放宽上场次数限制
  if (maxAppearanceGap < playerIds.length) {
    return selectBestMatch(possibleMatches, state, playerIds, partnerMode, maxConsecutive, maxAppearanceGap + 1);
  }

  // 仍无解，随机返回一个候选
  return possibleMatches[Math.floor(Math.random() * possibleMatches.length)] || null;
}

/**
 * 评估对局代价
 */
function evaluateMatch(
  match: PossibleMatch,
  state: ScheduleState,
  playerIds: number[]
): number {
  const keyA = makePairKey(match.teamA[0], match.teamA[1]);
  const keyB = makePairKey(match.teamB[0], match.teamB[1]);
  const matchKey = makeMatchKey(match.teamA, match.teamB);

  const partnerRepeat = (state.partnerCount.get(keyA) || 0) + (state.partnerCount.get(keyB) || 0);
  const opponentRepeat = state.opponentCount.get(matchKey) || 0;

  // 模拟更新后的上场次数差距
  const tempAppearances = new Map(state.appearanceCount);
  for (const id of match.players) {
    tempAppearances.set(id, (tempAppearances.get(id) || 0) + 1);
  }
  const values = Array.from(tempAppearances.values());
  const maxApp = Math.max(...values);
  const minApp = Math.min(...values);
  const gap = maxApp - minApp;

  // 上轮刚下场本轮又上场的人数
  let backToCourt = 0;
  for (const id of match.players) {
    if (!state.lastOnCourt.has(id)) continue;
    if ((state.consecutiveOnCourt.get(id) || 0) === 0) {
      backToCourt++;
    }
  }

  // #7: 对手次数方差 - 模拟更新后的对手次数方差
  const tempOpponentPairCount = new Map(state.opponentPairCount);
  const [a1, a2] = match.teamA;
  const [b1, b2] = match.teamB;
  const oppPairs = [
    makePairKey(a1, b1), makePairKey(a1, b2),
    makePairKey(a2, b1), makePairKey(a2, b2),
  ];
  for (const pairKey of oppPairs) {
    tempOpponentPairCount.set(pairKey, (tempOpponentPairCount.get(pairKey) || 0) + 1);
  }
  const opponentValues = Array.from(tempOpponentPairCount.values());
  const oppMean = opponentValues.reduce((s, v) => s + v, 0) / opponentValues.length;
  const oppVariance = opponentValues.reduce((s, v) => s + (v - oppMean) ** 2, 0) / opponentValues.length;

  // #8: 连续相同对手数 - 检查当前对局中有多少对选手在上轮也是对手
  let consecutiveOpponent = 0;
  for (const id of match.players) {
    const lastOpp = state.lastOpponents.get(id);
    if (!lastOpp || lastOpp.size === 0) continue;
    const opponentsInThisMatch = match.players.filter(p => p !== id);
    for (const opp of opponentsInThisMatch) {
      if (lastOpp.has(opp)) consecutiveOpponent++;
    }
  }
  // 每对对手被计算了两次（A 视角和 B 视角），除以 2
  consecutiveOpponent = Math.floor(consecutiveOpponent / 2);

  // #9: 休息间隔方差 - 模拟更新后的休息间隔方差
  const tempRestRounds = new Map<number, number[]>();
  for (const [id, rounds] of state.restRounds) {
    tempRestRounds.set(id, [...rounds]);
  }
  // 本轮休息的选手记录本轮
  for (const id of playerIds) {
    if (!match.players.includes(id)) {
      tempRestRounds.get(id)!.push(999); // 用 999 表示当前轮（尚未确定轮次）
    }
  }
  let restVariance = 0;
  let restVarianceCount = 0;
  for (const [, rounds] of tempRestRounds) {
    if (rounds.length < 2) continue;
    const intervals: number[] = [];
    for (let i = 1; i < rounds.length; i++) {
      intervals.push(rounds[i] - rounds[i - 1]);
    }
    const mean = intervals.reduce((s, v) => s + v, 0) / intervals.length;
    const variance = intervals.reduce((s, v) => s + (v - mean) ** 2, 0) / intervals.length;
    restVariance += variance;
    restVarianceCount++;
  }
  restVariance = restVarianceCount > 0 ? restVariance / restVarianceCount : 0;

  return partnerRepeat * 100
    + opponentRepeat * 50
    + oppVariance * 30
    + consecutiveOpponent * 40
    + gap * 10
    + restVariance * 15
    + backToCourt * 5;
}

/**
 * 全局质量评估函数
 * 对整个对阵表计算综合质量分（越低越好）
 */
function evaluateScheduleQuality(
  matches: MultiTurnMatch[],
  players: MultiTurnPlayer[]
): number {
  const playerIds = players.map(p => p.id);

  // 统计搭档覆盖
  const partnerSet = new Set<string>();
  // 统计对手覆盖
  const opponentPairSet = new Set<string>();
  // 统计上场次数
  const appearanceCount = new Map<number, number>();
  for (const id of playerIds) appearanceCount.set(id, 0);
  // 统计对手次数（用于方差计算）
  const opponentPairCount = new Map<string, number>();

  for (const match of matches) {
    const [a1, a2] = match.teamA;
    const [b1, b2] = match.teamB;

    // 搭档
    const keyA = makePairKey(a1, a2);
    const keyB = makePairKey(b1, b2);
    partnerSet.add(keyA);
    partnerSet.add(keyB);

    // 对手
    const oppPairs = [
      makePairKey(a1, b1), makePairKey(a1, b2),
      makePairKey(a2, b1), makePairKey(a2, b2),
    ];
    for (const pairKey of oppPairs) {
      opponentPairSet.add(pairKey);
      opponentPairCount.set(pairKey, (opponentPairCount.get(pairKey) || 0) + 1);
    }

    // 上场次数
    for (const id of [a1, a2, b1, b2]) {
      appearanceCount.set(id, (appearanceCount.get(id) || 0) + 1);
    }
  }

  // 计算覆盖率缺口
  const possiblePartnerPairs = new Set<string>();
  const possibleOpponentPairs = new Set<string>();
  for (let i = 0; i < playerIds.length; i++) {
    for (let j = i + 1; j < playerIds.length; j++) {
      const pairKey = makePairKey(playerIds[i], playerIds[j]);
      possiblePartnerPairs.add(pairKey);
      possibleOpponentPairs.add(pairKey);
    }
  }
  const partnerCoverageGap = possiblePartnerPairs.size - partnerSet.size;
  const opponentCoverageGap = possibleOpponentPairs.size - opponentPairSet.size;

  // 最大上场差距
  const appearances = Array.from(appearanceCount.values());
  const maxAppearanceGap = Math.max(...appearances) - Math.min(...appearances);

  // 对手次数方差
  const oppValues = Array.from(opponentPairCount.values());
  const oppMean = oppValues.reduce((s, v) => s + v, 0) / oppValues.length;
  const oppVariance = oppValues.reduce((s, v) => s + (v - oppMean) ** 2, 0) / oppValues.length;

  return partnerCoverageGap * 200
    + opponentCoverageGap * 150
    + maxAppearanceGap * 1000
    + oppVariance * 30;
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
