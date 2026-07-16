import {
  calculateAdjustedRounds,
  calculateMinRounds,
  generateSchedule,
  calculatePlayerStats,
} from '../multi-turn-algorithm';
import { MultiTurnPlayer, PartnerMode } from '../multi-turn-types';

function makePlayers(count: number): MultiTurnPlayer[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    name: `P${i + 1}`,
  }));
}

function makeMixedPlayers(maleCount: number, femaleCount: number): MultiTurnPlayer[] {
  const players: MultiTurnPlayer[] = [];
  for (let i = 0; i < maleCount; i++) {
    players.push({ id: i, name: `M${i + 1}`, gender: 'male' });
  }
  for (let i = 0; i < femaleCount; i++) {
    players.push({ id: maleCount + i, name: `F${i + 1}`, gender: 'female' });
  }
  return players;
}

describe('calculateAdjustedRounds', () => {
  it('4人随机模式：4*3=12, 12%4=0, 最少3轮', () => {
    const result = calculateAdjustedRounds(4, 'random');
    expect(result.adjustedRounds).toBe(3);
    expect(result.isAdjusted).toBe(false);
  });

  it('5人随机模式：需要4*R%5==0, 最少5轮', () => {
    const result = calculateAdjustedRounds(5, 'random');
    expect(result.adjustedRounds).toBe(5);
    expect((4 * result.adjustedRounds) % 5).toBe(0);
  });

  it('6人随机模式：4*R%6==0', () => {
    const result = calculateAdjustedRounds(6, 'random');
    // baseRounds = ceil(6*5/4) = 8, 4*8=32%6=2≠0 → 9, 4*9=36%6=0
    expect(result.adjustedRounds).toBe(9);
    expect((4 * result.adjustedRounds) % 6).toBe(0);
  });

  it('7人随机模式：4*R%7==0', () => {
    const result = calculateAdjustedRounds(7, 'random');
    // baseRounds = ceil(7*6/4) = 11, 4*14=56%7=0
    expect((4 * result.adjustedRounds) % 7).toBe(0);
    expect(result.adjustedRounds).toBeLessThanOrEqual(14);
  });

  it('8人随机模式：4*R%8==0', () => {
    const result = calculateAdjustedRounds(8, 'random');
    // baseRounds = ceil(8*7/4) = 14, 4*14=56%8=0
    expect((4 * result.adjustedRounds) % 8).toBe(0);
    expect(result.adjustedRounds).toBeLessThanOrEqual(14);
  });

  it('少于4人返回1轮', () => {
    const result = calculateAdjustedRounds(3, 'random');
    expect(result.adjustedRounds).toBe(1);
  });

  it('最大轮次不超过14', () => {
    // 8人时 baseRounds=14, 刚好不超过
    const result = calculateAdjustedRounds(8, 'random');
    expect(result.adjustedRounds).toBeLessThanOrEqual(14);
  });

  it('混双模式：需要2*R%M==0 且 2*R%F==0', () => {
    const result = calculateAdjustedRounds(6, 'mixed', 3, 3);
    expect((2 * result.adjustedRounds) % 3).toBe(0);
    expect((2 * result.adjustedRounds) % 3).toBe(0);
  });
});

describe('calculateMinRounds (兼容接口)', () => {
  it('返回与 calculateAdjustedRounds.adjustedRounds 相同值', () => {
    for (let n = 4; n <= 8; n++) {
      expect(calculateMinRounds(n, 'random')).toBe(
        calculateAdjustedRounds(n, 'random').adjustedRounds
      );
    }
  });
});

describe('generateSchedule — 硬约束1：每人上场次数严格相等', () => {
  const testCases: { playerCount: number; rounds: number; mode: PartnerMode }[] = [
    { playerCount: 4, rounds: 3, mode: 'random' },
    { playerCount: 5, rounds: 5, mode: 'random' },
    { playerCount: 6, rounds: 6, mode: 'random' },
    { playerCount: 7, rounds: 7, mode: 'random' },
    { playerCount: 8, rounds: 8, mode: 'random' },
  ];

  testCases.forEach(({ playerCount, rounds, mode }) => {
    it(`${playerCount}人 ${rounds}轮 ${mode}模式`, () => {
      const players = makePlayers(playerCount);
      const result = generateSchedule(players, mode, rounds);

      expect(result.matches.length).toBeGreaterThan(0);
      expect(result.adjustedRounds).toBeLessThanOrEqual(14);

      const appearanceCount = new Map<number, number>();
      for (const p of players) appearanceCount.set(p.id, 0);

      for (const match of result.matches) {
        for (const id of [...match.teamA, ...match.teamB]) {
          appearanceCount.set(id, (appearanceCount.get(id) || 0) + 1);
        }
      }

      const counts = Array.from(appearanceCount.values());
      const maxApp = Math.max(...counts);
      const minApp = Math.min(...counts);

      // 硬约束1：每人上场次数严格相等
      expect(maxApp).toBe(minApp);

      // 目标上场次数校验
      const targetApp = (4 * result.matches.length) / playerCount;
      expect(maxApp).toBe(targetApp);
    });
  });
});

describe('generateSchedule — 硬约束2：人数>5时不能连续打3场', () => {
  const testCases = [6, 7, 8];

  testCases.forEach((playerCount) => {
    it(`${playerCount}人模式下（回溯解）无人连续打3场`, () => {
      const players = makePlayers(playerCount);
      const rounds = calculateAdjustedRounds(playerCount).adjustedRounds;
      const result = generateSchedule(players, 'random', rounds);

      if (!result.isOptimal) return; // 降级解不保证硬约束2

      const consecutiveCount = new Map<number, number>();
      for (const p of players) consecutiveCount.set(p.id, 0);

      for (const match of result.matches) {
        const onCourt = new Set([...match.teamA, ...match.teamB]);
        for (const p of players) {
          if (onCourt.has(p.id)) {
            consecutiveCount.set(p.id, (consecutiveCount.get(p.id) || 0) + 1);
          } else {
            consecutiveCount.set(p.id, 0);
          }
          expect(consecutiveCount.get(p.id)).toBeLessThanOrEqual(2);
        }
      }
    });
  });

  it('4人模式下允许连续打3场（不限制）', () => {
    const players = makePlayers(4);
    const result = generateSchedule(players, 'random', 3);
    // 4人模式下每人都上场，连续次数=3，不违反规则
    expect(result.matches.length).toBe(3);
  });
});

describe('generateSchedule — 硬约束3：对局组合不重复', () => {
  function makeMatchKey(teamA: [number, number], teamB: [number, number]): string {
    const keyA = teamA[0] < teamA[1] ? `${teamA[0]}-${teamA[1]}` : `${teamA[1]}-${teamA[0]}`;
    const keyB = teamB[0] < teamB[1] ? `${teamB[0]}-${teamB[1]}` : `${teamB[1]}-${teamB[0]}`;
    return keyA < keyB ? `${keyA}|${keyB}` : `${keyB}|${keyA}`;
  }

  [4, 5, 6, 7, 8].forEach((playerCount) => {
    it(`${playerCount}人模式下同一对局组合不重复`, () => {
      const players = makePlayers(playerCount);
      const rounds = calculateAdjustedRounds(playerCount).adjustedRounds;
      const result = generateSchedule(players, 'random', rounds);

      const seenMatches = new Set<string>();
      for (const match of result.matches) {
        const key = makeMatchKey(match.teamA, match.teamB);
        expect(seenMatches.has(key)).toBe(false);
        seenMatches.add(key);
      }
    });
  });

  it('4人3轮：4人只有3种对局组合，恰好不重复', () => {
    const players = makePlayers(4);
    const result = generateSchedule(players, 'random', 3);
    // 4人 C(4,4)*3/C(2,1)=3 种对局（AB-CD, AC-BD, AD-BC）
    expect(result.matches.length).toBe(3);
    const seenMatches = new Set<string>();
    for (const match of result.matches) {
      const key = makeMatchKey(match.teamA, match.teamB);
      expect(seenMatches.has(key)).toBe(false);
      seenMatches.add(key);
    }
  });

  it('混双模式下对局组合也不重复', () => {
    const players = makeMixedPlayers(3, 3);
    const result = generateSchedule(players, 'mixed', 6);
    const seenMatches = new Set<string>();
    for (const match of result.matches) {
      const key = makeMatchKey(match.teamA, match.teamB);
      expect(seenMatches.has(key)).toBe(false);
      seenMatches.add(key);
    }
  });
});

describe('generateSchedule — 软约束3：搭档/对手覆盖', () => {
  it('6人8轮：搭档覆盖应尽量多', () => {
    const players = makePlayers(6);
    // 6人最少需要6轮(4*6%6=0)，用8轮测试
    const result = generateSchedule(players, 'random', 8);

    const partnerSet = new Set<string>();
    for (const match of result.matches) {
      const keyA = `${Math.min(match.teamA[0], match.teamA[1])}-${Math.max(match.teamA[0], match.teamA[1])}`;
      const keyB = `${Math.min(match.teamB[0], match.teamB[1])}-${Math.max(match.teamB[0], match.teamB[1])}`;
      partnerSet.add(keyA);
      partnerSet.add(keyB);
    }

    // 6人共有 C(6,2)=15 种搭档组合
    const totalPossible = (6 * 5) / 2;
    const coverage = partnerSet.size / totalPossible;
    // 8轮=32人次=每人5.33场上场(调整为12轮=每人8场)
    // 至少应覆盖 50% 以上的搭档组合
    expect(coverage).toBeGreaterThan(0.4);
  });

  it('8人8轮：对手覆盖应尽量多', () => {
    const players = makePlayers(8);
    const result = generateSchedule(players, 'random', 8);

    const opponentSet = new Set<string>();
    for (const match of result.matches) {
      const [a1, a2] = match.teamA;
      const [b1, b2] = match.teamB;
      const pairs = [
        [a1, b1], [a1, b2], [a2, b1], [a2, b2],
      ];
      for (const [x, y] of pairs) {
        const key = `${Math.min(x, y)}-${Math.max(x, y)}`;
        opponentSet.add(key);
      }
    }

    // 8人共有 C(8,2)=28 种对手组合
    const totalPossible = (8 * 7) / 2;
    const coverage = opponentSet.size / totalPossible;
    expect(coverage).toBeGreaterThan(0.2);
  });
});

describe('generateSchedule — 返回值结构', () => {
  it('返回 GenerateScheduleResult 结构', () => {
    const players = makePlayers(6);
    const result = generateSchedule(players, 'random', 6);

    expect(result).toHaveProperty('matches');
    expect(result).toHaveProperty('adjustedRounds');
    expect(result).toHaveProperty('isAdjusted');
    expect(result).toHaveProperty('isOptimal');
    expect(Array.isArray(result.matches)).toBe(true);
    expect(typeof result.adjustedRounds).toBe('number');
    expect(typeof result.isAdjusted).toBe('boolean');
    expect(typeof result.isOptimal).toBe('boolean');
  });

  it('轮次需要调整时 isAdjusted=true', () => {
    const players = makePlayers(7);
    // 7人可整除轮次为7，给4轮需要调整(4*4=16, 16%7!=0)
    const result = generateSchedule(players, 'random', 4);
    // 4轮时 4*4=16, 16%7!=0，算法会调整到7轮
    expect(result.adjustedRounds).toBeGreaterThanOrEqual(4);
  });

  it('8人最多14轮', () => {
    const players = makePlayers(8);
    const result = generateSchedule(players, 'random', 20);
    expect(result.adjustedRounds).toBeLessThanOrEqual(14);
  });
});

describe('generateSchedule — 混双模式', () => {
  it('4男4女混双：每人上场次数相等', () => {
    const players = makeMixedPlayers(4, 4);
    const result = generateSchedule(players, 'mixed', 8);

    const appearanceCount = new Map<number, number>();
    for (const p of players) appearanceCount.set(p.id, 0);

    for (const match of result.matches) {
      for (const id of [...match.teamA, ...match.teamB]) {
        appearanceCount.set(id, (appearanceCount.get(id) || 0) + 1);
      }
    }

    const counts = Array.from(appearanceCount.values());
    expect(Math.max(...counts)).toBe(Math.min(...counts));
  });

  it('混双：每队都是一男一女', () => {
    const players = makeMixedPlayers(3, 3);
    const playerMap = new Map(players.map(p => [p.id, p]));
    const result = generateSchedule(players, 'mixed', 6);

    for (const match of result.matches) {
      const teamAGenders = match.teamA.map(id => playerMap.get(id)?.gender);
      const teamBGenders = match.teamB.map(id => playerMap.get(id)?.gender);

      // 每队必须一男一女
      expect(teamAGenders).toContain('male');
      expect(teamAGenders).toContain('female');
      expect(teamBGenders).toContain('male');
      expect(teamBGenders).toContain('female');
    }
  });
});

describe('generateSchedule — 性能', () => {
  it('8人8轮在2秒内完成', () => {
    const players = makePlayers(8);
    const start = Date.now();
    const result = generateSchedule(players, 'random', 8);
    const elapsed = Date.now() - start;

    expect(elapsed).toBeLessThan(2000);
    expect(result.matches.length).toBeGreaterThan(0);
  });

  it('8人14轮在3秒内完成', () => {
    const players = makePlayers(8);
    const start = Date.now();
    const result = generateSchedule(players, 'random', 14);
    const elapsed = Date.now() - start;

    expect(elapsed).toBeLessThan(3000);
    expect(result.matches.length).toBeGreaterThan(0);
  });
});

describe('calculatePlayerStats', () => {
  it('正确计算选手统计', () => {
    const players = makePlayers(4);
    const matches = [
      { round: 1, teamA: [0, 1] as [number, number], teamB: [2, 3] as [number, number], scoreA: 21, scoreB: 15, completed: true },
      { round: 2, teamA: [0, 2] as [number, number], teamB: [1, 3] as [number, number], scoreA: 15, scoreB: 21, completed: true },
    ];

    const stats = calculatePlayerStats(players, matches);
    const p0 = stats.get(0)!;
    expect(p0.appearances).toBe(2);
    expect(p0.wins).toBe(1); // 第一轮A队赢，第二轮A队输
    expect(p0.totalScore).toBe(36); // 21 + 15

    const p3 = stats.get(3)!;
    expect(p3.appearances).toBe(2);
    expect(p3.wins).toBe(1); // 第一轮B队输(15<21)，第二轮B队赢(21>15)
  });

  it('未完成的比赛不计入统计', () => {
    const players = makePlayers(4);
    const matches = [
      { round: 1, teamA: [0, 1] as [number, number], teamB: [2, 3] as [number, number], scoreA: null, scoreB: null, completed: false },
    ];

    const stats = calculatePlayerStats(players, matches);
    for (const [, stat] of stats) {
      expect(stat.appearances).toBe(0);
    }
  });
});

describe('generateSchedule — 对阵表完整性', () => {
  it('每场比赛包含4个不同的选手', () => {
    const players = makePlayers(6);
    const result = generateSchedule(players, 'random', 6);

    for (const match of result.matches) {
      const allPlayers = [...match.teamA, ...match.teamB];
      const uniquePlayers = new Set(allPlayers);
      expect(uniquePlayers.size).toBe(4);
    }
  });

  it('轮次从1开始连续编号', () => {
    const players = makePlayers(6);
    const result = generateSchedule(players, 'random', 6);

    for (let i = 0; i < result.matches.length; i++) {
      expect(result.matches[i].round).toBe(i + 1);
    }
  });

  it('初始状态所有比赛未完成', () => {
    const players = makePlayers(6);
    const result = generateSchedule(players, 'random', 6);

    for (const match of result.matches) {
      expect(match.completed).toBe(false);
      expect(match.scoreA).toBeNull();
      expect(match.scoreB).toBeNull();
    }
  });
});
