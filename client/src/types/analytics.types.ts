export interface MatchAnalytics {
  matchId: string;
  tournamentId?: string;
  duration: number; // in seconds
  totalPoints: number;
  averagePoints: number;
  highestScoringTeam: string;
  penaltiesGiven: number;
  roundsCompleted: number;
  audienceVotes: {
    team1Votes: number;
    team2Votes: number;
    totalVotes: number;
    winner: string | null;
  };
  timestamp: string;
}

export interface PlayerAnalytics {
  playerId: string;
  playerName: string;
  teamId: string;
  matchesPlayed: number;
  totalPoints: number;
  averagePoints: number;
  wins: number;
  losses: number;
  penaltiesReceived: number;
  performanceTrend: number[]; // points per match
  consistencyScore: number; // 0-100, lower variance = higher consistency
}

export interface TeamAnalytics {
  teamId: string;
  teamName: string;
  teamColor: string;
  matchesPlayed: number;
  wins: number;
  losses: number;
  draws: number;
  winRate: number;
  totalPoints: number;
  averagePoints: number;
  penaltiesReceived: number;
  strongestRound: string; // round type with best performance
  performanceByRound: Record<string, number>;
  playerPerformance: PlayerAnalytics[];
}

export interface TournamentAnalytics {
  tournamentId: string;
  tournamentName: string;
  totalMatches: number;
  totalTeams: number;
  totalDuration: number; // in minutes
  averageMatchDuration: number;
  totalPoints: number;
  averagePointsPerMatch: number;
  highestScoringMatch: MatchAnalytics;
  mostPenalizedTeam: TeamAnalytics;
  tournamentWinner?: TeamAnalytics;
  roundAnalytics: RoundAnalytics[];
  attendanceTrend: number[]; // audience votes over time
}

export interface RoundAnalytics {
  roundId: string;
  roundName: string;
  matchesCompleted: number;
  averageDuration: number;
  totalPoints: number;
  averagePoints: number;
  mostSuccessfulTeam: string;
  difficultyScore: number; // 0-100 based on penalties and scores
}

export interface SessionAnalytics {
  sessionId: string;
  startTime: string;
  endTime?: string;
  duration?: number;
  matchesCompleted: number;
  teamsUsed: string[];
  totalPoints: number;
  audienceEngagement: number; // based on votes
  connectionIssues: number;
  peakConcurrentUsers: number;
}

export interface UsageAnalytics {
  totalSessions: number;
  totalMatches: number;
  totalTournaments: number;
  totalUsers: number;
  averageSessionDuration: number;
  peakUsageHours: number[];
  popularFeatures: Record<string, number>;
  deviceBreakdown: {
    desktop: number;
    tablet: number;
    mobile: number;
  };
  themePreference: {
    light: number;
    dark: number;
    system: number;
  };
}

export interface PerformanceMetrics {
  averageLoadTime: number;
  averageWebSocketLatency: number;
  errorRate: number;
  connectionDropRate: number;
  cacheHitRate: number;
  bundleSize: number;
  lighthouseScore: number;
}

export interface ReportConfig {
  reportType: 'match' | 'tournament' | 'player' | 'team' | 'session' | 'usage';
  timeRange: {
    start: string;
    end: string;
  };
  filters: {
    tournamentId?: string;
    teamId?: string;
    playerId?: string;
    matchId?: string;
  };
  format: 'json' | 'csv' | 'html' | 'pdf';
  includeCharts: boolean;
  includeDetails: boolean;
}

export interface AnalyticsDashboard {
  overview: {
    totalMatches: number;
    totalPoints: number;
    activeTournaments: number;
    averageMatchDuration: number;
  };
  trends: {
    matchesPerDay: number[];
    pointsPerDay: number[];
    audienceEngagement: number[];
  };
  topPerformers: {
    teams: TeamAnalytics[];
    players: PlayerAnalytics[];
  };
  recentActivity: MatchAnalytics[];
}

// API Types
export interface GenerateReportRequest {
  config: ReportConfig;
}

export interface GenerateReportResponse {
  reportId: string;
  downloadUrl: string;
  expiresAt: string;
  fileSize: number;
}

// UI Types
export interface AnalyticsFilters {
  timeRange: 'today' | 'week' | 'month' | 'year' | 'custom';
  customRange?: {
    start: string;
    end: string;
  };
  tournamentId?: string;
  teamId?: string;
  metricType: 'matches' | 'points' | 'penalties' | 'audience' | 'performance';
}

export interface AnalyticsView {
  type: 'overview' | 'matches' | 'teams' | 'players' | 'tournaments' | 'trends';
  filters: AnalyticsFilters;
}