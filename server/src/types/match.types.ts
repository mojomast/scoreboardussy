// Types for real-time match integration

export type MatchStatus = 'setup' | 'active' | 'paused' | 'completed';
export type TimerStatus = 'stopped' | 'running' | 'paused' | 'expired';
export type TimerType = 'round' | 'huddle' | 'break' | 'custom';

export interface TeamInfo {
  id: 'team1' | 'team2' | string;
  name: string;
  color?: string;
}

export interface MatchRules {
  // Placeholder for future rule definitions
  allowMixed?: boolean;
}

export interface MatchSettings {
  // Placeholder for UI/settings flags
  showTimer?: boolean;
}

export interface CreateMatchPayload {
  name: string;
  teams: [TeamInfo, TeamInfo];
  rules?: MatchRules;
  settings?: MatchSettings;
}

export interface MatchScorePayload {
  matchId: string;
  team: 'team1' | 'team2';
  points: number; // positive or negative
}

export interface MatchPenaltyPayload {
  matchId: string;
  team: 'team1' | 'team2';
  kind: string; // e.g., 'minor' | 'major' | custom
}

export interface TimerStartPayload {
  matchId: string;
  type: TimerType;
  duration: number; // seconds
  autoStart?: boolean;
  hapticFeedback?: boolean;
}

export interface TimerSetPayload {
  matchId: string;
  timerId: string;
  duration: number; // seconds
}

export interface TimerState {
  matchId: string;
  timerId: string;
  type: TimerType;
  duration: number; // seconds
  remaining: number; // seconds
  status: TimerStatus;
  startedAt?: number; // epoch ms
  updatedAt: number; // epoch ms
}

export interface RoundInfo {
  number: number;
  type: string;
  theme?: string;
  isMixed?: boolean;
}

export interface MatchState {
  matchId: string;
  name: string;
  teams: [TeamInfo, TeamInfo];
  status: MatchStatus;
  currentRound?: RoundInfo | null;
  score: { team1: number; team2: number };
  penalties: { team1: Array<{ kind: string; at: number }>; team2: Array<{ kind: string; at: number }>; };
  timer?: TimerState | null;
  metadata: { createdAt: number; updatedAt: number };
}

export interface MatchResults {
  points?: { team1: number; team2: number };
}
