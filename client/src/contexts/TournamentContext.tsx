import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import {
  Tournament,
  Team,
  Match,
  Round,
  CreateTournamentRequest,
  UpdateTournamentRequest,
  CreateMatchRequest,
  UpdateMatchRequest,
  TournamentFilters,
  TournamentSortOptions,
  TournamentStats
} from '../types/tournament.types';

interface TournamentState {
  tournaments: Tournament[];
  currentTournament: Tournament | null;
  loading: boolean;
  error: string | null;
  filters: TournamentFilters;
  sortOptions: TournamentSortOptions;
  stats: TournamentStats | null;
}

type TournamentAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_TOURNAMENTS'; payload: Tournament[] }
  | { type: 'ADD_TOURNAMENT'; payload: Tournament }
  | { type: 'UPDATE_TOURNAMENT'; payload: Tournament }
  | { type: 'DELETE_TOURNAMENT'; payload: string }
  | { type: 'SET_CURRENT_TOURNAMENT'; payload: Tournament | null }
  | { type: 'SET_FILTERS'; payload: TournamentFilters }
  | { type: 'SET_SORT_OPTIONS'; payload: TournamentSortOptions }
  | { type: 'SET_STATS'; payload: TournamentStats };

const initialState: TournamentState = {
  tournaments: [],
  currentTournament: null,
  loading: false,
  error: null,
  filters: {},
  sortOptions: { field: 'name', direction: 'asc' },
  stats: null
};

function tournamentReducer(state: TournamentState, action: TournamentAction): TournamentState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };

    case 'SET_ERROR':
      return { ...state, error: action.payload };

    case 'SET_TOURNAMENTS':
      return { ...state, tournaments: action.payload };

    case 'ADD_TOURNAMENT':
      return { ...state, tournaments: [...state.tournaments, action.payload] };

    case 'UPDATE_TOURNAMENT':
      return {
        ...state,
        tournaments: state.tournaments.map(t =>
          t.id === action.payload.id ? action.payload : t
        ),
        currentTournament: state.currentTournament?.id === action.payload.id
          ? action.payload
          : state.currentTournament
      };

    case 'DELETE_TOURNAMENT':
      return {
        ...state,
        tournaments: state.tournaments.filter(t => t.id !== action.payload),
        currentTournament: state.currentTournament?.id === action.payload
          ? null
          : state.currentTournament
      };

    case 'SET_CURRENT_TOURNAMENT':
      return { ...state, currentTournament: action.payload };

    case 'SET_FILTERS':
      return { ...state, filters: action.payload };

    case 'SET_SORT_OPTIONS':
      return { ...state, sortOptions: action.payload };

    case 'SET_STATS':
      return { ...state, stats: action.payload };

    default:
      return state;
  }
}

interface TournamentContextType extends TournamentState {
  // Tournament CRUD operations
  createTournament: (data: CreateTournamentRequest) => Promise<Tournament>;
  updateTournament: (id: string, data: UpdateTournamentRequest) => Promise<Tournament>;
  deleteTournament: (id: string) => Promise<void>;

  // Tournament management
  startTournament: (id: string) => Promise<void>;
  completeTournament: (id: string) => Promise<void>;
  cancelTournament: (id: string) => Promise<void>;

  // Match operations
  createMatch: (tournamentId: string, data: CreateMatchRequest) => Promise<Match>;
  updateMatch: (tournamentId: string, matchId: string, data: UpdateMatchRequest) => Promise<Match>;
  deleteMatch: (tournamentId: string, matchId: string) => Promise<void>;

  // Round operations
  advanceRound: (tournamentId: string) => Promise<void>;

  // Utility functions
  getFilteredTournaments: () => Tournament[];
  getSortedTournaments: () => Tournament[];
  calculateTournamentStats: (tournamentId: string) => TournamentStats;

  // Actions
  setCurrentTournament: (tournament: Tournament | null) => void;
  setFilters: (filters: TournamentFilters) => void;
  setSortOptions: (options: TournamentSortOptions) => void;
  clearError: () => void;
}

const TournamentContext = createContext<TournamentContextType | undefined>(undefined);

interface TournamentProviderProps {
  children: ReactNode;
}

export const TournamentProvider: React.FC<TournamentProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(tournamentReducer, initialState);

  // Tournament CRUD operations
  const createTournament = async (data: CreateTournamentRequest): Promise<Tournament> => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      const response = await fetch('/api/tournaments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error('Failed to create tournament');
      }

      const tournament: Tournament = await response.json();
      dispatch({ type: 'ADD_TOURNAMENT', payload: tournament });
      return tournament;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      dispatch({ type: 'SET_ERROR', payload: message });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const updateTournament = async (id: string, data: UpdateTournamentRequest): Promise<Tournament> => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      const response = await fetch(`/api/tournaments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error('Failed to update tournament');
      }

      const tournament: Tournament = await response.json();
      dispatch({ type: 'UPDATE_TOURNAMENT', payload: tournament });
      return tournament;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      dispatch({ type: 'SET_ERROR', payload: message });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const deleteTournament = async (id: string): Promise<void> => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      const response = await fetch(`/api/tournaments/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete tournament');
      }

      dispatch({ type: 'DELETE_TOURNAMENT', payload: id });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      dispatch({ type: 'SET_ERROR', payload: message });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Tournament management functions
  const startTournament = async (id: string): Promise<void> => {
    await updateTournament(id, { status: 'in_progress' });
  };

  const completeTournament = async (id: string): Promise<void> => {
    await updateTournament(id, { status: 'completed' });
  };

  const cancelTournament = async (id: string): Promise<void> => {
    await updateTournament(id, { status: 'cancelled' });
  };

  // Match operations
  const createMatch = async (tournamentId: string, data: CreateMatchRequest): Promise<Match> => {
    const response = await fetch(`/api/tournaments/${tournamentId}/matches`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error('Failed to create match');
    }

    return response.json();
  };

  const updateMatch = async (tournamentId: string, matchId: string, data: UpdateMatchRequest): Promise<Match> => {
    const response = await fetch(`/api/tournaments/${tournamentId}/matches/${matchId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error('Failed to update match');
    }

    return response.json();
  };

  const deleteMatch = async (tournamentId: string, matchId: string): Promise<void> => {
    const response = await fetch(`/api/tournaments/${tournamentId}/matches/${matchId}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      throw new Error('Failed to delete match');
    }
  };

  const advanceRound = async (tournamentId: string): Promise<void> => {
    const response = await fetch(`/api/tournaments/${tournamentId}/advance-round`, {
      method: 'POST'
    });

    if (!response.ok) {
      throw new Error('Failed to advance round');
    }
  };

  // Utility functions
  const getFilteredTournaments = (): Tournament[] => {
    let filtered = state.tournaments;

    if (state.filters.status) {
      filtered = filtered.filter(t => t.status === state.filters.status);
    }

    if (state.filters.format) {
      filtered = filtered.filter(t => t.format === state.filters.format);
    }

    if (state.filters.dateRange) {
      filtered = filtered.filter(t => {
        if (!t.startDate) return false;
        const startDate = new Date(t.startDate);
        const filterStart = new Date(state.filters.dateRange!.start);
        const filterEnd = new Date(state.filters.dateRange!.end);
        return startDate >= filterStart && startDate <= filterEnd;
      });
    }

    return filtered;
  };

  const getSortedTournaments = (): Tournament[] => {
    const filtered = getFilteredTournaments();

    return [...filtered].sort((a, b) => {
      const aValue = a[state.sortOptions.field as keyof Tournament];
      const bValue = b[state.sortOptions.field as keyof Tournament];

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return state.sortOptions.direction === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return state.sortOptions.direction === 'asc'
          ? aValue - bValue
          : bValue - aValue;
      }

      return 0;
    });
  };

  const calculateTournamentStats = (tournamentId: string): TournamentStats => {
    const tournament = state.tournaments.find(t => t.id === tournamentId);
    if (!tournament) {
      return {
        totalTeams: 0,
        totalMatches: 0,
        completedMatches: 0,
        totalPoints: 0,
        averageScore: 0,
        highestScoringTeam: null,
        mostPenalizedTeam: null,
        tournamentDuration: 0
      };
    }

    const allMatches = tournament.rounds.flatMap(round => round.matches);
    const completedMatches = allMatches.filter(match => match.status === 'completed');

    const totalPoints = tournament.teams.reduce((sum, team) => sum + team.points, 0);
    const totalScore = completedMatches.reduce((sum, match) => sum + match.team1Score + match.team2Score, 0);
    const averageScore = completedMatches.length > 0 ? totalScore / completedMatches.length : 0;

    const highestScoringTeam = tournament.teams.reduce((max, team) =>
      team.points > (max?.points || 0) ? team : max, null as Team | null);

    const mostPenalizedTeam = tournament.teams.reduce((max, team) =>
      team.penalties > (max?.penalties || 0) ? team : max, null as Team | null);

    return {
      totalTeams: tournament.teams.length,
      totalMatches: allMatches.length,
      completedMatches: completedMatches.length,
      totalPoints,
      averageScore,
      highestScoringTeam,
      mostPenalizedTeam,
      tournamentDuration: 0 // TODO: Calculate based on match times
    };
  };

  // Actions
  const setCurrentTournament = (tournament: Tournament | null) => {
    dispatch({ type: 'SET_CURRENT_TOURNAMENT', payload: tournament });
  };

  const setFilters = (filters: TournamentFilters) => {
    dispatch({ type: 'SET_FILTERS', payload: filters });
  };

  const setSortOptions = (options: TournamentSortOptions) => {
    dispatch({ type: 'SET_SORT_OPTIONS', payload: options });
  };

  const clearError = () => {
    dispatch({ type: 'SET_ERROR', payload: null });
  };

  const contextValue: TournamentContextType = {
    ...state,
    createTournament,
    updateTournament,
    deleteTournament,
    startTournament,
    completeTournament,
    cancelTournament,
    createMatch,
    updateMatch,
    deleteMatch,
    advanceRound,
    getFilteredTournaments,
    getSortedTournaments,
    calculateTournamentStats,
    setCurrentTournament,
    setFilters,
    setSortOptions,
    clearError
  };

  return (
    <TournamentContext.Provider value={contextValue}>
      {children}
    </TournamentContext.Provider>
  );
};

export const useTournament = (): TournamentContextType => {
  const context = useContext(TournamentContext);
  if (context === undefined) {
    throw new Error('useTournament must be used within a TournamentProvider');
  }
  return context;
};