// 多人转类型定义

export type PartnerMode = 'random' | 'mixed';

export interface MultiTurnPlayer {
  id: number;
  name: string;
  gender?: 'male' | 'female'; // 仅混双模式必填
}

export interface MultiTurnMatch {
  round: number;
  teamA: [number, number]; // 选手 id
  teamB: [number, number]; // 选手 id
  scoreA: number | null;   // null = 未打
  scoreB: number | null;
  completed: boolean;
}

export interface MultiTurnEvent {
  players: MultiTurnPlayer[];
  partnerMode: PartnerMode;
  targetScore: number;
  deuce: boolean;
  matches: MultiTurnMatch[];
  totalRounds: number;
}

export interface PlayerStats {
  playerId: number;
  name: string;
  totalScore: number;
  appearances: number;
  wins: number;
}
