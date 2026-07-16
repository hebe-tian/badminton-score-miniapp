import { MultiTurnPlayer, MultiTurnMatch, PartnerMode, PlayerStats, GenerateScheduleResult } from './multi-turn-types';

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

class TimeoutError extends Error {
  constructor() { super('Search timeout'); }
}

const MAX_ROUNDS = 14;
const SEARCH_TIMEOUT_MS = 2000;

interface ScheduleState {
  partnerCount: Map<string, number>;
  opponentCount: Map<string, number>;
  appearanceCount: Map<number, number>;
  consecutiveOnCourt: Map<number, number>;
  lastOnCourt: Set<number>;
  opponentPairCount: Map<string, number>;
  lastOpponents: Map<number, Set<number>>;
}

interface PossibleMatch {
  teamA: [number, number];
  teamB: [number, number];
  players: number[];
}

interface SearchState extends ScheduleState {
  targetAppearance: number;
  matches: MultiTurnMatch[];
}

function createInitialState(playerIds: number[], targetAppearance: number): SearchState {
  const state: SearchState = {
    partnerCount: new Map(),
    opponentCount: new Map(),
    appearanceCount: new Map(),
    consecutiveOnCourt: new Map(),
    lastOnCourt: new Set(),
    opponentPairCount: new Map(),
    lastOpponents: new Map(),
    targetAppearance,
    matches: [],
  };
  for (const id of playerIds) {
    state.appearanceCount.set(id, 0);
    state.consecutiveOnCourt.set(id, 0);
    state.lastOpponents.set(id, new Set());
  }
  return state;
}

function applyMatch(state: SearchState, match: PossibleMatch, round: number, playerIds: number[]): void {
  state.matches.push({
    round,
    teamA: match.teamA,
    teamB: match.teamB,
    scoreA: null,
    scoreB: null,
    completed: false,
  });

  const onCourt = new Set(match.players);
  for (const id of playerIds) {
    if (onCourt.has(id)) {
      state.appearanceCount.set(id, (state.appearanceCount.get(id) || 0) + 1);
      state.consecutiveOnCourt.set(id, (state.consecutiveOnCourt.get(id) || 0) + 1);
    } else {
      state.consecutiveOnCourt.set(id, 0);
    }
  }

  const keyA = makePairKey(match.teamA[0], match.teamA[1]);
  const keyB = makePairKey(match.teamB[0], match.teamB[1]);
  state.partnerCount.set(keyA, (state.partnerCount.get(keyA) || 0) + 1);
  state.partnerCount.set(keyB, (state.partnerCount.get(keyB) || 0) + 1);

  const matchKey = makeMatchKey(match.teamA, match.teamB);
  state.opponentCount.set(matchKey, (state.opponentCount.get(matchKey) || 0) + 1);

  const [a1, a2] = match.teamA;
  const [b1, b2] = match.teamB;
  const oppPairs = [
    makePairKey(a1, b1), makePairKey(a1, b2),
    makePairKey(a2, b1), makePairKey(a2, b2),
  ];
  for (const pairKey of oppPairs) {
    state.opponentPairCount.set(pairKey, (state.opponentPairCount.get(pairKey) || 0) + 1);
  }

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

function undoMatch(state: SearchState, match: PossibleMatch, _round: number, playerIds: number[]): void {
  state.matches.pop();

  const onCourt = new Set(match.players);
  for (const id of playerIds) {
    if (onCourt.has(id)) {
      state.appearanceCount.set(id, (state.appearanceCount.get(id) || 0) - 1);
      const prev = state.consecutiveOnCourt.get(id) || 0;
      state.consecutiveOnCourt.set(id, Math.max(0, prev - 1));
    } else {
      state.consecutiveOnCourt.set(id, 0);
    }
  }

  const keyA = makePairKey(match.teamA[0], match.teamA[1]);
  const keyB = makePairKey(match.teamB[0], match.teamB[1]);
  state.partnerCount.set(keyA, Math.max(0, (state.partnerCount.get(keyA) || 0) - 1));
  state.partnerCount.set(keyB, Math.max(0, (state.partnerCount.get(keyB) || 0) - 1));
  if (state.partnerCount.get(keyA) === 0) state.partnerCount.delete(keyA);
  if (state.partnerCount.get(keyB) === 0) state.partnerCount.delete(keyB);

  const matchKey = makeMatchKey(match.teamA, match.teamB);
  state.opponentCount.set(matchKey, Math.max(0, (state.opponentCount.get(matchKey) || 0) - 1));
  if (state.opponentCount.get(matchKey) === 0) state.opponentCount.delete(matchKey);

  const [a1, a2] = match.teamA;
  const [b1, b2] = match.teamB;
  const oppPairs = [
    makePairKey(a1, b1), makePairKey(a1, b2),
    makePairKey(a2, b1), makePairKey(a2, b2),
  ];
  for (const pairKey of oppPairs) {
    state.opponentPairCount.set(pairKey, Math.max(0, (state.opponentPairCount.get(pairKey) || 0) - 1));
    if (state.opponentPairCount.get(pairKey) === 0) state.opponentPairCount.delete(pairKey);
  }

  if (state.matches.length > 0) {
    const prevMatch = state.matches[state.matches.length - 1];
    const prevOnCourt = new Set([...prevMatch.teamA, ...prevMatch.teamB]);
    state.lastOnCourt = prevOnCourt;
    const pa1 = prevMatch.teamA[0], pa2 = prevMatch.teamA[1];
    const pb1 = prevMatch.teamB[0], pb2 = prevMatch.teamB[1];
    const restored = new Map<number, Set<number>>();
    restored.set(pa1, new Set([pb1, pb2]));
    restored.set(pa2, new Set([pb1, pb2]));
    restored.set(pb1, new Set([pa1, pa2]));
    restored.set(pb2, new Set([pa1, pa2]));
    for (const id of playerIds) {
      if (!restored.has(id)) restored.set(id, new Set());
    }
    state.lastOpponents = restored;
  } else {
    state.lastOnCourt = new Set();
    for (const id of playerIds) {
      state.lastOpponents.set(id, new Set());
    }
  }
}

/**
 * 计算调整后轮次
 * 保证每人上场次数严格相等，向上取整到可整除值
 */
export function calculateAdjustedRounds(
  playerCount: number,
  partnerMode: PartnerMode = 'random',
  maleCount: number = 0,
  femaleCount: number = 0
): { adjustedRounds: number; isAdjusted: boolean } {
  if (playerCount < 4) return { adjustedRounds: 1, isAdjusted: false };

  let baseRounds: number;
  if (partnerMode === 'mixed' && maleCount > 0 && femaleCount > 0) {
    baseRounds = Math.ceil((maleCount * femaleCount) / 2);
  } else {
    baseRounds = Math.ceil((playerCount * (playerCount - 1)) / 4);
  }

  let adjusted = baseRounds;
  while (true) {
    if (partnerMode === 'mixed' && maleCount > 0 && femaleCount > 0) {
      if ((2 * adjusted) % maleCount === 0 && (2 * adjusted) % femaleCount === 0) break;
    } else {
      if ((4 * adjusted) % playerCount === 0) break;
    }
    adjusted++;
    if (adjusted > MAX_ROUNDS) break;
  }

  const finalRounds = Math.min(adjusted, MAX_ROUNDS);
  return {
    adjustedRounds: finalRounds,
    isAdjusted: finalRounds !== baseRounds || baseRounds > MAX_ROUNDS,
  };
}

/**
 * 兼容旧接口：计算最少轮次
 */
export function calculateMinRounds(
  playerCount: number,
  partnerMode: PartnerMode = 'random',
  maleCount: number = 0,
  femaleCount: number = 0
): number {
  return calculateAdjustedRounds(playerCount, partnerMode, maleCount, femaleCount).adjustedRounds;
}

/**
 * 生成对阵表
 * 主入口：回溯搜索 + 超时降级贪心
 */
export function generateSchedule(
  players: MultiTurnPlayer[],
  partnerMode: PartnerMode,
  totalRounds: number
): GenerateScheduleResult {
  const playerIds = players.map(p => p.id);
  const playerMap = new Map(players.map(p => [p.id, p]));
  const playerCount = playerIds.length;

  const { adjustedRounds, isAdjusted } = calculateAdjustedRounds(
    playerCount, partnerMode,
    playerIds.filter(id => playerMap.get(id)?.gender === 'male').length,
    playerIds.filter(id => playerMap.get(id)?.gender === 'female').length
  );

  const effectiveRounds = isAdjusted ? adjustedRounds : totalRounds;
  const clampedRounds = Math.min(effectiveRounds, MAX_ROUNDS);
  const targetAppearance = (4 * clampedRounds) / playerCount;

  const possibleMatches = generatePossibleMatches(players, partnerMode, playerMap);
  const deadline = Date.now() + SEARCH_TIMEOUT_MS;

  const searchResult = dfsSearch(
    possibleMatches, playerIds, playerCount,
    clampedRounds, targetAppearance, deadline
  );

  const wasAdjusted = isAdjusted || clampedRounds !== totalRounds;

  if (searchResult) {
    return {
      matches: searchResult,
      adjustedRounds: clampedRounds,
      isAdjusted: wasAdjusted,
      isOptimal: true,
    };
  }

  const fallbackSchedule = generateGreedySchedule(
    players, partnerMode, clampedRounds, playerIds, playerMap
  );

  return {
    matches: fallbackSchedule,
    adjustedRounds: clampedRounds,
    isAdjusted: wasAdjusted,
    isOptimal: false,
  };
}

/**
 * 回溯搜索
 * DFS + 三层剪枝，找到第一个满足硬约束的完整解
 */
function dfsSearch(
  possibleMatches: PossibleMatch[],
  playerIds: number[],
  playerCount: number,
  totalRounds: number,
  targetAppearance: number,
  deadline: number
): MultiTurnMatch[] | null {
  const state = createInitialState(playerIds, targetAppearance);
  const maxConsecutive = playerCount > 5 ? 2 : Infinity;

  const sortedMatches = [...possibleMatches].sort((a, b) =>
    evaluateMatchCost(a, state, playerIds) - evaluateMatchCost(b, state, playerIds)
  );

  try {
    return dfs(1, state, sortedMatches, playerIds, playerCount,
      totalRounds, targetAppearance, maxConsecutive, deadline);
  } catch (e) {
    if (e instanceof TimeoutError) return null;
    throw e;
  }
}

function dfs(
  round: number,
  state: SearchState,
  allMatches: PossibleMatch[],
  playerIds: number[],
  playerCount: number,
  totalRounds: number,
  targetAppearance: number,
  maxConsecutive: number,
  deadline: number
): MultiTurnMatch[] | null {
  if (Date.now() > deadline) throw new TimeoutError();

  if (round > totalRounds) return state.matches;

  // 可行性剪枝：剩余轮次能否补齐待上场人次
  const remainingSlots = (totalRounds - round + 1) * 4;
  const neededSlots = playerIds.reduce(
    (sum, id) => sum + Math.max(0, targetAppearance - (state.appearanceCount.get(id) || 0)), 0
  );
  if (remainingSlots < neededSlots) return null;

  // 只允许当前上场次数最少的选手上场（保证严格相等）
  const minApp = Math.min(...playerIds.map(id => state.appearanceCount.get(id) || 0));

  for (const match of allMatches) {
    // 硬约束过滤：连续上场超限
    if (match.players.some(id => (state.consecutiveOnCourt.get(id) || 0) >= maxConsecutive)) continue;
    // 硬约束过滤：上场次数已达目标
    if (match.players.some(id => (state.appearanceCount.get(id) || 0) >= targetAppearance)) continue;
    // 硬约束过滤：上场次数超过当前最小值
    if (match.players.some(id => (state.appearanceCount.get(id) || 0) > minApp)) continue;
    // 硬约束过滤：对局组合已出现过（AB vs CD 不重复）
    const matchKey = makeMatchKey(match.teamA, match.teamB);
    if ((state.opponentCount.get(matchKey) || 0) > 0) continue;

    applyMatch(state, match, round, playerIds);
    const result = dfs(round + 1, state, allMatches, playerIds, playerCount,
      totalRounds, targetAppearance, maxConsecutive, deadline);
    if (result) return result;
    undoMatch(state, match, round, playerIds);
  }

  return null;
}

/**
 * 贪心降级算法
 * 超时或回溯无解时使用
 */
function generateGreedySchedule(
  players: MultiTurnPlayer[],
  partnerMode: PartnerMode,
  totalRounds: number,
  playerIds: number[],
  playerMap: Map<number, MultiTurnPlayer>
): MultiTurnMatch[] {
  const matches: MultiTurnMatch[] = [];
  const state = createInitialState(playerIds, (4 * totalRounds) / playerIds.length);
  const maxConsecutive = playerIds.length > 5 ? 2 : Infinity;

  let possibleMatches = generatePossibleMatches(players, partnerMode, playerMap);
  possibleMatches = shuffleArray(possibleMatches);

  for (let round = 1; round <= totalRounds; round++) {
    const matchResult = selectBestMatch(
      possibleMatches, state, playerIds, partnerMode, maxConsecutive, 0
    );
    if (matchResult) {
      matches.push({
        round,
        teamA: matchResult.teamA,
        teamB: matchResult.teamB,
        scoreA: null,
        scoreB: null,
        completed: false,
      });
      applyMatchSimple(state, matchResult, round, playerIds);
    }
  }

  return matches;
}

function applyMatchSimple(
  state: SearchState,
  match: PossibleMatch,
  _round: number,
  playerIds: number[]
): void {
  const onCourt = new Set(match.players);
  for (const id of playerIds) {
    if (onCourt.has(id)) {
      state.appearanceCount.set(id, (state.appearanceCount.get(id) || 0) + 1);
      state.consecutiveOnCourt.set(id, (state.consecutiveOnCourt.get(id) || 0) + 1);
    } else {
      state.consecutiveOnCourt.set(id, 0);
    }
  }

  const keyA = makePairKey(match.teamA[0], match.teamA[1]);
  const keyB = makePairKey(match.teamB[0], match.teamB[1]);
  state.partnerCount.set(keyA, (state.partnerCount.get(keyA) || 0) + 1);
  state.partnerCount.set(keyB, (state.partnerCount.get(keyB) || 0) + 1);

  const matchKey = makeMatchKey(match.teamA, match.teamB);
  state.opponentCount.set(matchKey, (state.opponentCount.get(matchKey) || 0) + 1);

  const [a1, a2] = match.teamA;
  const [b1, b2] = match.teamB;
  const oppPairs = [
    makePairKey(a1, b1), makePairKey(a1, b2),
    makePairKey(a2, b1), makePairKey(a2, b2),
  ];
  for (const pairKey of oppPairs) {
    state.opponentPairCount.set(pairKey, (state.opponentPairCount.get(pairKey) || 0) + 1);
  }

  const newLastOpponents = new Map<number, Set<number>>();
  newLastOpponents.set(a1, new Set([b1, b2]));
  newLastOpponents.set(a2, new Set([b1, b2]));
  newLastOpponents.set(b1, new Set([a1, a2]));
  newLastOpponents.set(b2, new Set([a1, a2]));
  for (const id of playerIds) {
    if (!newLastOpponents.has(id)) newLastOpponents.set(id, new Set());
  }
  state.lastOpponents = newLastOpponents;
  state.lastOnCourt = onCourt;
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
            matches.push({ teamA: [m1, f1], teamB: [m2, f2], players: [m1, f1, m2, f2] });
            matches.push({ teamA: [m1, f2], teamB: [m2, f1], players: [m1, f2, m2, f1] });
          }
        }
      }
    }
  } else {
    for (let a = 0; a < playerIds.length; a++) {
      for (let b = a + 1; b < playerIds.length; b++) {
        for (let c = b + 1; c < playerIds.length; c++) {
          for (let d = c + 1; d < playerIds.length; d++) {
            const p1 = playerIds[a], p2 = playerIds[b];
            const p3 = playerIds[c], p4 = playerIds[d];
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

function selectBestMatch(
  possibleMatches: PossibleMatch[],
  state: SearchState,
  playerIds: number[],
  partnerMode: PartnerMode,
  maxConsecutive: number = 2,
  maxAppearanceGap: number = 0
): PossibleMatch | null {
  let bestScore = Infinity;
  const candidates: PossibleMatch[] = [];
  const minAppearance = Math.min(...playerIds.map(id => state.appearanceCount.get(id) || 0));

  for (const match of possibleMatches) {
    const exceedsConsecutive = match.players.some(id => (state.consecutiveOnCourt.get(id) || 0) >= maxConsecutive);
    if (exceedsConsecutive) continue;
    const exceedsAppearance = match.players.some(id => (state.appearanceCount.get(id) || 0) > minAppearance + maxAppearanceGap);
    if (exceedsAppearance) continue;
    // 硬约束：对局组合不重复
    const matchKey = makeMatchKey(match.teamA, match.teamB);
    if ((state.opponentCount.get(matchKey) || 0) > 0) continue;

    const score = evaluateMatchCost(match, state, playerIds);
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
  if (maxConsecutive < 3) {
    return selectBestMatch(possibleMatches, state, playerIds, partnerMode, maxConsecutive + 1, maxAppearanceGap);
  }
  if (maxAppearanceGap < playerIds.length) {
    return selectBestMatch(possibleMatches, state, playerIds, partnerMode, maxConsecutive, maxAppearanceGap + 1);
  }
  return possibleMatches[Math.floor(Math.random() * possibleMatches.length)] || null;
}

function evaluateMatchCost(
  match: PossibleMatch,
  state: ScheduleState,
  _playerIds: number[]
): number {
  const keyA = makePairKey(match.teamA[0], match.teamA[1]);
  const keyB = makePairKey(match.teamB[0], match.teamB[1]);
  const matchKey = makeMatchKey(match.teamA, match.teamB);

  const partnerRepeat = (state.partnerCount.get(keyA) || 0) + (state.partnerCount.get(keyB) || 0);
  const opponentRepeat = state.opponentCount.get(matchKey) || 0;

  const tempAppearances = new Map(state.appearanceCount);
  for (const id of match.players) {
    tempAppearances.set(id, (tempAppearances.get(id) || 0) + 1);
  }
  const values = Array.from(tempAppearances.values());
  const maxApp = Math.max(...values);
  const minApp = Math.min(...values);
  const gap = maxApp - minApp;

  const [a1, a2] = match.teamA;
  const [b1, b2] = match.teamB;
  const oppPairs = [
    makePairKey(a1, b1), makePairKey(a1, b2),
    makePairKey(a2, b1), makePairKey(a2, b2),
  ];
  const tempOpponentPairCount = new Map(state.opponentPairCount);
  for (const pairKey of oppPairs) {
    tempOpponentPairCount.set(pairKey, (tempOpponentPairCount.get(pairKey) || 0) + 1);
  }
  const opponentValues = Array.from(tempOpponentPairCount.values());
  const oppMean = opponentValues.reduce((s, v) => s + v, 0) / opponentValues.length;
  const oppVariance = opponentValues.reduce((s, v) => s + (v - oppMean) ** 2, 0) / opponentValues.length;

  let consecutiveOpponent = 0;
  for (const id of match.players) {
    const lastOpp = state.lastOpponents.get(id);
    if (!lastOpp || lastOpp.size === 0) continue;
    const opponentsInThisMatch = match.players.filter(p => p !== id);
    for (const opp of opponentsInThisMatch) {
      if (lastOpp.has(opp)) consecutiveOpponent++;
    }
  }
  consecutiveOpponent = Math.floor(consecutiveOpponent / 2);

  return partnerRepeat * 100
    + opponentRepeat * 50
    + oppVariance * 30
    + consecutiveOpponent * 40
    + gap * 10;
}

export function evaluateScheduleQuality(
  matches: MultiTurnMatch[],
  players: MultiTurnPlayer[]
): number {
  const playerIds = players.map(p => p.id);
  const partnerSet = new Set<string>();
  const opponentPairSet = new Set<string>();
  const appearanceCount = new Map<number, number>();
  for (const id of playerIds) appearanceCount.set(id, 0);
  const opponentPairCount = new Map<string, number>();

  for (const match of matches) {
    const [a1, a2] = match.teamA;
    const [b1, b2] = match.teamB;
    const keyA = makePairKey(a1, a2);
    const keyB = makePairKey(b1, b2);
    partnerSet.add(keyA);
    partnerSet.add(keyB);
    const oppPairs = [
      makePairKey(a1, b1), makePairKey(a1, b2),
      makePairKey(a2, b1), makePairKey(a2, b2),
    ];
    for (const pairKey of oppPairs) {
      opponentPairSet.add(pairKey);
      opponentPairCount.set(pairKey, (opponentPairCount.get(pairKey) || 0) + 1);
    }
    for (const id of [a1, a2, b1, b2]) {
      appearanceCount.set(id, (appearanceCount.get(id) || 0) + 1);
    }
  }

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
  const appearances = Array.from(appearanceCount.values());
  const maxAppearanceGap = Math.max(...appearances) - Math.min(...appearances);
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
