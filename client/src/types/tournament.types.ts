export interface Team {
  id: string;
  name: string;
  color: string;
  members: string[];
  wins: number;
  losses: number;
  points: number;
  penalties: number;
}

export interface Match {
  id: string;
  roundId: string;
  team1Id: string;
  team2Id: string;
  team1Score: number;
  team2Score: number;
  winnerId?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  startTime?: string;
  endTime?: string;
  notes?: string;
}

export interface Round {
  id: string;
  name: string;
  type: 'elimination' | 'round_robin' | 'swiss' | 'single_elimination' | 'double_elimination';
  status: 'pending' | 'in_progress' | 'completed';
  matches: Match[];
  settings: {
    pointsForWin: number;
    pointsForDraw: number;
    pointsForLoss: number;
    maxPenalties: number;
  };
}

export interface Tournament {
  id: string;
  name: string;
  description?: string;
  format: 'single_elimination' | 'double_elimination' | 'round_robin' | 'swiss';
  status: 'draft' | 'in_progress' | 'completed' | 'cancelled';
  teams: Team[];
  rounds: Round[];
  currentRound: number;
  maxRounds: number;
  startDate?: string;
  endDate?: string;
  settings: {
    pointsForWin: number;
    pointsForDraw: number;
    pointsForLoss: number;
    maxTeamSize: number;
    allowSubstitutions: boolean;
    timeLimits: {
      roundTime: number; // in seconds
      breakTime: number; // in seconds
    };
    rules: {
      maxPenalties: number;
      suddenDeath: boolean;
      allowDraws: boolean;
    };
  };
  metadata: {
    createdAt: string;
    createdBy: string;
    updatedAt: string;
    version: number;
  };
}

export interface BracketNode {
  id: string;
  teamId?: string;
  matchId?: string;
  winnerId?: string;
  round: number;
  position: number;
  children?: BracketNode[];
  parent?: string;
}

export interface TournamentStats {
  totalTeams: number;
  totalMatches: number;
  completedMatches: number;
  totalPoints: number;
  averageScore: number;
  highestScoringTeam: Team | null;
  mostPenalizedTeam: Team | null;
  tournamentDuration: number; // in minutes
}

// API Types
export interface CreateTournamentRequest {
  name: string;
  description?: string;
  format: Tournament['format'];
  teams: Omit<Team, 'id' | 'wins' | 'losses' | 'points' | 'penalties'>[];
  settings: Tournament['settings'];
}

export interface UpdateTournamentRequest {
  name?: string;
  description?: string;
  status?: Tournament['status'];
  settings?: Partial<Tournament['settings']>;
}

export interface CreateMatchRequest {
  roundId: string;
  team1Id: string;
  team2Id: string;
  startTime?: string;
}

export interface UpdateMatchRequest {
  team1Score?: number;
  team2Score?: number;
  winnerId?: string;
  status?: Match['status'];
  endTime?: string;
  notes?: string;
}

// UI Types
export interface TournamentFilters {
  status?: Tournament['status'];
  format?: Tournament['format'];
  dateRange?: {
    start: string;
    end: string;
  };
}

export interface TournamentSortOptions {
  field: keyof Tournament;
  direction: 'asc' | 'desc';
}

export type TournamentView = 'overview' | 'bracket' | 'teams' | 'matches' | 'stats';