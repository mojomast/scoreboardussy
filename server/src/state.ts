import { ScoreboardState, Team } from './types';

// Initial state - can be loaded from a file later if persistence is added
let state: ScoreboardState = {
  team1: {
    id: 'team1',
    name: 'Blue Team',
    color: '#3b82f6', // blue-500
    score: 0,
    penalties: { major: 0, minor: 0 },
  },
  team2: {
    id: 'team2',
    name: 'Red Team',
    color: '#ef4444', // red-500
    score: 0,
    penalties: { major: 0, minor: 0 },
  },
  logoUrl: null,
  titleText: null, // Initialize title
  footerText: null, // Initialize footer
  titleTextColor: '#000000', // Default black
  titleTextSize: 2, // Default size (e.g., in rem)
  footerTextColor: '#000000', // Default black
  footerTextSize: 1.25, // Default size (e.g., in rem)
};

// TODO: Implement simple JSON file persistence later
// const dataFilePath = path.join(__dirname, '..', 'data', 'scoreboard.json');
// const loadState = () => { ... };
// const saveState = () => { ... };

export const getState = (): ScoreboardState => {
  // Return a deep copy to prevent accidental mutation
  return JSON.parse(JSON.stringify(state));
};

export const updateState = (newState: Partial<ScoreboardState>): ScoreboardState => {
  // Simple merge, could be more sophisticated
  if (newState.team1) {
    state.team1 = { ...state.team1, ...newState.team1 };
  }
  if (newState.team2) {
    state.team2 = { ...state.team2, ...newState.team2 };
  }
  if (newState.logoUrl !== undefined) { // Handle logoUrl updates
    state.logoUrl = newState.logoUrl;
  }
  if (newState.titleText !== undefined) { // Handle titleText updates
    state.titleText = newState.titleText;
  }
  if (newState.footerText !== undefined) { // Handle footerText updates
    state.footerText = newState.footerText;
  }
  if (newState.titleTextColor !== undefined) { // Handle titleTextColor updates
    state.titleTextColor = newState.titleTextColor;
  }
  if (newState.titleTextSize !== undefined) { // Handle titleTextSize updates
    state.titleTextSize = newState.titleTextSize;
  }
  if (newState.footerTextColor !== undefined) { // Handle footerTextColor updates
    state.footerTextColor = newState.footerTextColor;
  }
  if (newState.footerTextSize !== undefined) { // Handle footerTextSize updates
    state.footerTextSize = newState.footerTextSize;
  }
  // saveState(); // Persist changes
  return getState(); // Return the updated state (copy)
};

export const updateTeam = (teamId: 'team1' | 'team2', updates: Partial<Pick<Team, 'name' | 'color'>>): ScoreboardState => {
  state[teamId] = { ...state[teamId], ...updates };
  // saveState();
  return getState();
};

export const updateScore = (teamId: 'team1' | 'team2', action: 'increment' | 'decrement'): ScoreboardState => {
  if (action === 'increment') {
    state[teamId].score += 1;
  } else if (action === 'decrement' && state[teamId].score > 0) {
    state[teamId].score -= 1;
  }
  // saveState();
  return getState();
};

export const updatePenalty = (teamId: 'team1' | 'team2', type: 'major' | 'minor'): ScoreboardState => {
  if (state[teamId] && state[teamId].penalties) {
    state[teamId].penalties[type] += 1;
  }
  // saveState();
  return getState();
};

export const resetPenalties = (teamId: 'team1' | 'team2'): ScoreboardState => {
  if (state[teamId] && state[teamId].penalties) {
    state[teamId].penalties = { major: 0, minor: 0 };
  }
  // saveState();
  return getState();
};

export const resetAll = (): ScoreboardState => {
  const team1Name = state.team1.name;
  const team1Color = state.team1.color;
  const team2Name = state.team2.name;
  const team2Color = state.team2.color;
  state = {
    team1: {
      id: 'team1',
      name: team1Name, // Keep names and colors
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
    titleText: null, // Add title to reset state
    footerText: null, // Add footer to reset state
    titleTextColor: '#000000', // Default black
    titleTextSize: 2, // Default size (e.g., in rem)
    footerTextColor: '#000000', // Default black
    footerTextSize: 1.25, // Default size (e.g., in rem)
  };
  // saveState();
  return getState();
};

// Initialize state (e.g., load from file on startup)
// state = loadState();
