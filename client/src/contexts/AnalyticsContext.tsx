import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import {
  MatchAnalytics,
  PlayerAnalytics,
  TeamAnalytics,
  TournamentAnalytics,
  SessionAnalytics,
  UsageAnalytics,
  PerformanceMetrics,
  AnalyticsDashboard,
  AnalyticsFilters,
  AnalyticsView,
  ReportConfig,
  GenerateReportRequest,
  GenerateReportResponse
} from '../types/analytics.types';

interface AnalyticsState {
  dashboard: AnalyticsDashboard | null;
  matchAnalytics: MatchAnalytics[];
  teamAnalytics: TeamAnalytics[];
  playerAnalytics: PlayerAnalytics[];
  tournamentAnalytics: TournamentAnalytics[];
  sessionAnalytics: SessionAnalytics[];
  usageAnalytics: UsageAnalytics | null;
  performanceMetrics: PerformanceMetrics | null;
  currentView: AnalyticsView;
  loading: boolean;
  error: string | null;
  lastUpdated: string | null;
}

type AnalyticsAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_DASHBOARD'; payload: AnalyticsDashboard }
  | { type: 'SET_MATCH_ANALYTICS'; payload: MatchAnalytics[] }
  | { type: 'SET_TEAM_ANALYTICS'; payload: TeamAnalytics[] }
  | { type: 'SET_PLAYER_ANALYTICS'; payload: PlayerAnalytics[] }
  | { type: 'SET_TOURNAMENT_ANALYTICS'; payload: TournamentAnalytics[] }
  | { type: 'SET_SESSION_ANALYTICS'; payload: SessionAnalytics[] }
  | { type: 'SET_USAGE_ANALYTICS'; payload: UsageAnalytics }
  | { type: 'SET_PERFORMANCE_METRICS'; payload: PerformanceMetrics }
  | { type: 'SET_CURRENT_VIEW'; payload: AnalyticsView }
  | { type: 'SET_LAST_UPDATED'; payload: string };

const initialState: AnalyticsState = {
  dashboard: null,
  matchAnalytics: [],
  teamAnalytics: [],
  playerAnalytics: [],
  tournamentAnalytics: [],
  sessionAnalytics: [],
  usageAnalytics: null,
  performanceMetrics: null,
  currentView: {
    type: 'overview',
    filters: {
      timeRange: 'month',
      metricType: 'matches'
    }
  },
  loading: false,
  error: null,
  lastUpdated: null
};

function analyticsReducer(state: AnalyticsState, action: AnalyticsAction): AnalyticsState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };

    case 'SET_ERROR':
      return { ...state, error: action.payload };

    case 'SET_DASHBOARD':
      return { ...state, dashboard: action.payload, lastUpdated: new Date().toISOString() };

    case 'SET_MATCH_ANALYTICS':
      return { ...state, matchAnalytics: action.payload };

    case 'SET_TEAM_ANALYTICS':
      return { ...state, teamAnalytics: action.payload };

    case 'SET_PLAYER_ANALYTICS':
      return { ...state, playerAnalytics: action.payload };

    case 'SET_TOURNAMENT_ANALYTICS':
      return { ...state, tournamentAnalytics: action.payload };

    case 'SET_SESSION_ANALYTICS':
      return { ...state, sessionAnalytics: action.payload };

    case 'SET_USAGE_ANALYTICS':
      return { ...state, usageAnalytics: action.payload };

    case 'SET_PERFORMANCE_METRICS':
      return { ...state, performanceMetrics: action.payload };

    case 'SET_CURRENT_VIEW':
      return { ...state, currentView: action.payload };

    case 'SET_LAST_UPDATED':
      return { ...state, lastUpdated: action.payload };

    default:
      return state;
  }
}

interface AnalyticsContextType extends AnalyticsState {
  // Data fetching functions
  fetchDashboard: () => Promise<void>;
  fetchMatchAnalytics: (filters?: AnalyticsFilters) => Promise<void>;
  fetchTeamAnalytics: (filters?: AnalyticsFilters) => Promise<void>;
  fetchPlayerAnalytics: (filters?: AnalyticsFilters) => Promise<void>;
  fetchTournamentAnalytics: (filters?: AnalyticsFilters) => Promise<void>;
  fetchSessionAnalytics: (filters?: AnalyticsFilters) => Promise<void>;
  fetchUsageAnalytics: () => Promise<void>;
  fetchPerformanceMetrics: () => Promise<void>;

  // Report generation
  generateReport: (config: ReportConfig) => Promise<GenerateReportResponse>;

  // Utility functions
  getTopTeams: (limit?: number) => TeamAnalytics[];
  getTopPlayers: (limit?: number) => PlayerAnalytics[];
  getMatchTrends: (days?: number) => { date: string; matches: number; points: number }[];
  getTournamentStats: (tournamentId: string) => TournamentAnalytics | null;

  // Actions
  setCurrentView: (view: AnalyticsView) => void;
  clearError: () => void;
  refreshData: () => Promise<void>;
}

const AnalyticsContext = createContext<AnalyticsContextType | undefined>(undefined);

interface AnalyticsProviderProps {
  children: ReactNode;
}

export const AnalyticsProvider: React.FC<AnalyticsProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(analyticsReducer, initialState);

  // Fetch dashboard data
  const fetchDashboard = async (): Promise<void> => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      const response = await fetch('/api/analytics/dashboard');
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }

      const dashboard: AnalyticsDashboard = await response.json();
      dispatch({ type: 'SET_DASHBOARD', payload: dashboard });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      dispatch({ type: 'SET_ERROR', payload: message });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Fetch match analytics
  const fetchMatchAnalytics = async (filters?: AnalyticsFilters): Promise<void> => {
    try {
      const queryParams = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            queryParams.append(key, String(value));
          }
        });
      }

      const response = await fetch(`/api/analytics/matches?${queryParams}`);
      if (!response.ok) {
        throw new Error('Failed to fetch match analytics');
      }

      const data: MatchAnalytics[] = await response.json();
      dispatch({ type: 'SET_MATCH_ANALYTICS', payload: data });
    } catch (error) {
      console.error('Error fetching match analytics:', error);
    }
  };

  // Fetch team analytics
  const fetchTeamAnalytics = async (filters?: AnalyticsFilters): Promise<void> => {
    try {
      const queryParams = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            queryParams.append(key, String(value));
          }
        });
      }

      const response = await fetch(`/api/analytics/teams?${queryParams}`);
      if (!response.ok) {
        throw new Error('Failed to fetch team analytics');
      }

      const data: TeamAnalytics[] = await response.json();
      dispatch({ type: 'SET_TEAM_ANALYTICS', payload: data });
    } catch (error) {
      console.error('Error fetching team analytics:', error);
    }
  };

  // Fetch player analytics
  const fetchPlayerAnalytics = async (filters?: AnalyticsFilters): Promise<void> => {
    try {
      const queryParams = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            queryParams.append(key, String(value));
          }
        });
      }

      const response = await fetch(`/api/analytics/players?${queryParams}`);
      if (!response.ok) {
        throw new Error('Failed to fetch player analytics');
      }

      const data: PlayerAnalytics[] = await response.json();
      dispatch({ type: 'SET_PLAYER_ANALYTICS', payload: data });
    } catch (error) {
      console.error('Error fetching player analytics:', error);
    }
  };

  // Fetch tournament analytics
  const fetchTournamentAnalytics = async (filters?: AnalyticsFilters): Promise<void> => {
    try {
      const queryParams = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            queryParams.append(key, String(value));
          }
        });
      }

      const response = await fetch(`/api/analytics/tournaments?${queryParams}`);
      if (!response.ok) {
        throw new Error('Failed to fetch tournament analytics');
      }

      const data: TournamentAnalytics[] = await response.json();
      dispatch({ type: 'SET_TOURNAMENT_ANALYTICS', payload: data });
    } catch (error) {
      console.error('Error fetching tournament analytics:', error);
    }
  };

  // Fetch session analytics
  const fetchSessionAnalytics = async (filters?: AnalyticsFilters): Promise<void> => {
    try {
      const queryParams = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            queryParams.append(key, String(value));
          }
        });
      }

      const response = await fetch(`/api/analytics/sessions?${queryParams}`);
      if (!response.ok) {
        throw new Error('Failed to fetch session analytics');
      }

      const data: SessionAnalytics[] = await response.json();
      dispatch({ type: 'SET_SESSION_ANALYTICS', payload: data });
    } catch (error) {
      console.error('Error fetching session analytics:', error);
    }
  };

  // Fetch usage analytics
  const fetchUsageAnalytics = async (): Promise<void> => {
    try {
      const response = await fetch('/api/analytics/usage');
      if (!response.ok) {
        throw new Error('Failed to fetch usage analytics');
      }

      const data: UsageAnalytics = await response.json();
      dispatch({ type: 'SET_USAGE_ANALYTICS', payload: data });
    } catch (error) {
      console.error('Error fetching usage analytics:', error);
    }
  };

  // Fetch performance metrics
  const fetchPerformanceMetrics = async (): Promise<void> => {
    try {
      const response = await fetch('/api/analytics/performance');
      if (!response.ok) {
        throw new Error('Failed to fetch performance metrics');
      }

      const data: PerformanceMetrics = await response.json();
      dispatch({ type: 'SET_PERFORMANCE_METRICS', payload: data });
    } catch (error) {
      console.error('Error fetching performance metrics:', error);
    }
  };

  // Generate reports
  const generateReport = async (config: ReportConfig): Promise<GenerateReportResponse> => {
    const response = await fetch('/api/analytics/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ config })
    });

    if (!response.ok) {
      throw new Error('Failed to generate report');
    }

    return response.json();
  };

  // Utility functions
  const getTopTeams = (limit: number = 10): TeamAnalytics[] => {
    return state.teamAnalytics
      .sort((a, b) => b.winRate - a.winRate)
      .slice(0, limit);
  };

  const getTopPlayers = (limit: number = 10): PlayerAnalytics[] => {
    return state.playerAnalytics
      .sort((a, b) => b.averagePoints - a.averagePoints)
      .slice(0, limit);
  };

  const getMatchTrends = (days: number = 30): { date: string; matches: number; points: number }[] => {
    const trends: { date: string; matches: number; points: number }[] = [];
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      const dayMatches = state.matchAnalytics.filter(match =>
        match.timestamp.startsWith(dateStr)
      );

      trends.push({
        date: dateStr,
        matches: dayMatches.length,
        points: dayMatches.reduce((sum, match) => sum + match.totalPoints, 0)
      });
    }

    return trends;
  };

  const getTournamentStats = (tournamentId: string): TournamentAnalytics | null => {
    return state.tournamentAnalytics.find(t => t.tournamentId === tournamentId) || null;
  };

  // Actions
  const setCurrentView = (view: AnalyticsView) => {
    dispatch({ type: 'SET_CURRENT_VIEW', payload: view });
  };

  const clearError = () => {
    dispatch({ type: 'SET_ERROR', payload: null });
  };

  const refreshData = async (): Promise<void> => {
    await Promise.all([
      fetchDashboard(),
      fetchMatchAnalytics(state.currentView.filters),
      fetchTeamAnalytics(state.currentView.filters),
      fetchPlayerAnalytics(state.currentView.filters),
      fetchTournamentAnalytics(state.currentView.filters),
      fetchUsageAnalytics(),
      fetchPerformanceMetrics()
    ]);
  };

  const contextValue: AnalyticsContextType = {
    ...state,
    fetchDashboard,
    fetchMatchAnalytics,
    fetchTeamAnalytics,
    fetchPlayerAnalytics,
    fetchTournamentAnalytics,
    fetchSessionAnalytics,
    fetchUsageAnalytics,
    fetchPerformanceMetrics,
    generateReport,
    getTopTeams,
    getTopPlayers,
    getMatchTrends,
    getTournamentStats,
    setCurrentView,
    clearError,
    refreshData
  };

  // Initialize data on mount
  useEffect(() => {
    refreshData();
  }, []);

  return (
    <AnalyticsContext.Provider value={contextValue}>
      {children}
    </AnalyticsContext.Provider>
  );
};

export const useAnalytics = (): AnalyticsContextType => {
  const context = useContext(AnalyticsContext);
  if (context === undefined) {
    throw new Error('useAnalytics must be used within an AnalyticsProvider');
  }
  return context;
};