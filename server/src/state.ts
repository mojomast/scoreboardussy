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
  logoSize: 50, // Default logo size
  titleText: '', // Changed to empty string
  footerText: null, // Initialize footer
  titleTextColor: '#FFFFFF', // Default white
  titleTextSize: 2, // Default size (e.g., in rem)
  footerTextColor: '#FFFFFF', // Default white
  footerTextSize: 1.25, // Default size (e.g., in rem)
  titleStyle: { color: '#000000', sizeRem: 2 }, // Default title style
  footerStyle: { color: '#000000', sizeRem: 1 }, // Default footer style
  showScore: true,
  showPenalties: true,
  showEmojis: true, // Show emojis by default
  team1Emoji: null, // No emoji initially
  team2Emoji: null // No emoji initially
};

// TODO: Implement simple JSON file persistence later
// const dataFilePath = path.join(__dirname, '..', 'data', 'scoreboard.json');
// const loadState = () => { ... };
// const saveState = () => { ... };

export const getState = (): ScoreboardState => {
  // Return a deep copy to prevent accidental mutation
  try {
    // Log the state right before attempting to stringify
    console.log('State before stringify:', JSON.stringify(state, null, 2)); // Log formatted state
    const stateCopy = JSON.parse(JSON.stringify(state));
    console.log('State successfully stringified and parsed.');
    return stateCopy;
  } catch (error) {
    console.error('!!! Error during JSON stringify/parse in getState:', error);
    console.error('!!! State object causing error:', state); // Log the raw state object
    // Decide how to handle the error. Re-throwing might crash, returning original state might be risky.
    // For now, let's return the potentially mutated state to see if the error is purely serialization.
    // Returning a default/empty state might be safer in production.
    return state; // Returning original state on error for debugging purposes
  }
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
  if (newState.logoSize !== undefined) { // Handle logoSize updates
    state.logoSize = newState.logoSize;
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
  if (newState.titleStyle !== undefined) { // Handle titleStyle updates
    state.titleStyle = newState.titleStyle;
  }
  if (newState.footerStyle !== undefined) { // Handle footerStyle updates
    state.footerStyle = newState.footerStyle;
  }
  if (newState.showScore !== undefined) { // Handle showScore updates
    state.showScore = newState.showScore;
  }
  if (newState.showPenalties !== undefined) { // Handle showPenalties updates
    state.showPenalties = newState.showPenalties;
  }
  if (newState.showEmojis !== undefined) { // Handle showEmojis updates
    state.showEmojis = newState.showEmojis;
  }
  if (newState.team1Emoji !== undefined) { // Handle team1Emoji updates
    state.team1Emoji = newState.team1Emoji;
  }
  if (newState.team2Emoji !== undefined) { // Handle team2Emoji updates
    state.team2Emoji = newState.team2Emoji;
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
    logoSize: 50, // Reset logo size
    titleText: '', // Changed to empty string
    footerText: null, // Add footer to reset state
    titleTextColor: '#FFFFFF', // Default white
    titleTextSize: 2, // Default size (e.g., in rem)
    footerTextColor: '#FFFFFF', // Default white
    footerTextSize: 1.25, // Default size (e.g., in rem)
    titleStyle: { color: '#000000', sizeRem: 2 }, // Default title style
    footerStyle: { color: '#000000', sizeRem: 1 }, // Default footer style
    showScore: true,
    showPenalties: true,
    showEmojis: true, // Reset showEmojis
    team1Emoji: null, // Reset team1Emoji
    team2Emoji: null // Reset team2Emoji
  };
  // saveState();
  return getState();
};

// Initialize state (e.g., load from file on startup)
// state = loadState();
