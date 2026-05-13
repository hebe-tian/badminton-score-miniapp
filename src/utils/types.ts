export type GameMode = 'singles' | 'doubles' | 'wylb';

export interface MatchConfig {
  mode: GameMode;
  targetScore: number;
  deuce: boolean;
  teamA: string[]; // Length 1, 2, or 5
  teamB: string[]; // Length 1, 2, or 5
  serverTeam: 'A' | 'B';
  serverIndex: number;
  receiverIndex: number; // For doubles and WYLB
}

export interface MatchHistoryEntry {
  scoreA: number;
  scoreB: number;
  scorer: 'A' | 'B';
  scorers?: string[]; // 得分时的场上球员名单
  teamAPlayers?: string[]; // 得分时A队场上选手
  teamBPlayers?: string[]; // 得分时B队场上选手
  note?: string;
}

export function getDefaultNames(mode: GameMode, team: 'A' | 'B'): string[] {
  if (mode === 'singles') {
    return [team];
  } else if (mode === 'doubles') {
    return [`${team}1`, `${team}2`];
  } else {
    return [`${team}1`, `${team}2`, `${team}3`, `${team}4`, `${team}5`];
  }
}
