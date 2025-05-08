import { ScoreboardState, Team } from './types';
import {
  getScoreboard,
  updateScoreboard,
  updateTeam as updateTeamInDb,
  getDefaultState
} from './db/repository';
import { connectToDatabase } from './db/connection';

// Initialize in-memory state with default values
let state: ScoreboardState = getDefaultState();

// Flag to track if we're connected to the database
let isDbConnected = false;

// Connect to the database
connectToDatabase()
  .then(() => {
    console.log('Database connection established, loading state from database');
    isDbConnected = true;
    
    // Load initial state from database
    getScoreboard()
      .then(dbState => {
        state = dbState;
        console.log('State loaded from database');
      })
      .catch(error => {
        console.error('Error loading state from database, using default state:', error);
      });
  })
  .catch(error => {
    console.error('Failed to connect to database, using in-memory state:', error);
  });

export const getState = (): ScoreboardState => {
  // Return a deep copy to prevent accidental mutation
  try {
    const stateCopy = JSON.parse(JSON.stringify(state));
    return stateCopy;
  } catch (error) {
    console.error('Error during JSON stringify/parse in getState:', error);
    // Return the original state on error
    return state;
  }
};

export const updateState = (newState: Partial<ScoreboardState>): ScoreboardState => {
  // Update in-memory state
  if (newState.team1) {
    state.team1 = { ...state.team1, ...newState.team1 };
  }
  if (newState.team2) {
    state.team2 = { ...state.team2, ...newState.team2 };
  }
  if (newState.logoUrl !== undefined) {
    state.logoUrl = newState.logoUrl;
  }
  if (newState.logoSize !== undefined) {
    state.logoSize = newState.logoSize;
  }
  if (newState.titleText !== undefined) {
    state.titleText = newState.titleText;
  }
  if (newState.footerText !== undefined) {
    state.footerText = newState.footerText;
  }
  if (newState.titleTextColor !== undefined) {
    state.titleTextColor = newState.titleTextColor;
  }
  if (newState.titleTextSize !== undefined) {
    state.titleTextSize = newState.titleTextSize;
  }
  if (newState.footerTextColor !== undefined) {
    state.footerTextColor = newState.footerTextColor;
  }
  if (newState.footerTextSize !== undefined) {
    state.footerTextSize = newState.footerTextSize;
  }
  if (newState.showScore !== undefined) {
    state.showScore = newState.showScore;
  }
  if (newState.showPenalties !== undefined) {
    state.showPenalties = newState.showPenalties;
  }
  if (newState.showEmojis !== undefined) {
    state.showEmojis = newState.showEmojis;
  }
  if (newState.team1Emoji !== undefined) {
    state.team1Emoji = newState.team1Emoji;
  }
  if (newState.team2Emoji !== undefined) {
    state.team2Emoji = newState.team2Emoji;
  }
  
  // Persist to database if connected
  if (isDbConnected) {
    updateScoreboard(state)
      .then(updatedState => {
        // Update in-memory state with any changes from the database
        state = updatedState;
      })
      .catch(error => {
        console.error('Error updating state in database:', error);
      });
  }
  
  return getState(); // Return the updated state (copy)
};

export const updateTeam = (teamId: 'team1' | 'team2', updates: Partial<Pick<Team, 'name' | 'color'>>): ScoreboardState => {
  // Update in-memory state
  state[teamId] = { ...state[teamId], ...updates };
  
  // Persist to database if connected
  if (isDbConnected) {
    updateTeamInDb(teamId, state[teamId])
      .catch(error => {
        console.error(`Error updating team ${teamId} in database:`, error);
      });
  }
  
  return getState();
};

export const updateScore = (teamId: 'team1' | 'team2', action: 'increment' | 'decrement'): ScoreboardState => {
  // Update in-memory state
  if (action === 'increment') {
    state[teamId].score += 1;
  } else if (action === 'decrement' && state[teamId].score > 0) {
    state[teamId].score -= 1;
  }
  
  // Persist to database if connected
  if (isDbConnected) {
    updateTeamInDb(teamId, state[teamId])
      .catch(error => {
        console.error(`Error updating team ${teamId} score in database:`, error);
      });
  }
  
  return getState();
};

export const updatePenalty = (teamId: 'team1' | 'team2', type: 'major' | 'minor'): ScoreboardState => {
  // Update in-memory state
  if (state[teamId] && state[teamId].penalties) {
    state[teamId].penalties[type] += 1;
  }
  
  // Persist to database if connected
  if (isDbConnected) {
    updateTeamInDb(teamId, state[teamId])
      .catch(error => {
        console.error(`Error updating team ${teamId} penalties in database:`, error);
      });
  }
  
  return getState();
};

export const resetPenalties = (teamId: 'team1' | 'team2'): ScoreboardState => {
  // Update in-memory state
  if (state[teamId] && state[teamId].penalties) {
    state[teamId].penalties = { major: 0, minor: 0 };
  }
  
  // Persist to database if connected
  if (isDbConnected) {
    updateTeamInDb(teamId, state[teamId])
      .catch(error => {
        console.error(`Error resetting team ${teamId} penalties in database:`, error);
      });
  }
  
  return getState();
};

export const resetAll = (): ScoreboardState => {
  // Keep team names and colors
  const team1Name = state.team1.name;
  const team1Color = state.team1.color;
  const team2Name = state.team2.name;
  const team2Color = state.team2.color;
  
  // Reset to default state but keep team names and colors
  state = {
    team1: {
      id: 'team1',
      name: team1Name,
      color: team1Color,
      score: 0,
      penalties: { major: 0, minor: 0 },
    },
    team2: {
      id: 'team2',
      name: team2Name,
      color: team2Color,
      score: 0,
      penalties: { major: 0, minor: 0 },
    },
    logoUrl: null,
    logoSize: 50,
    titleText: '',
    footerText: null,
    titleTextColor: '#FFFFFF',
    titleTextSize: 2,
    footerTextColor: '#FFFFFF',
    footerTextSize: 1.25,
    showScore: true,
    showPenalties: true,
    showEmojis: true,
    team1Emoji: null,
    team2Emoji: null
  };
  
  // Persist to database if connected
  if (isDbConnected) {
    updateScoreboard(state)
      .then(updatedState => {
        // Update in-memory state with any changes from the database
        state = updatedState;
      })
      .catch(error => {
        console.error('Error resetting state in database:', error);
      });
  }
  
  return getState();
};
