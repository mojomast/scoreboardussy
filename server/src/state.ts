import { ScoreboardState, Team, Matchup } from './types';

let state: ScoreboardState = {
    teams: [],
    currentMatchup: null,
    matchHistory: []
};

export const getState = (): ScoreboardState => state;
export const setState = (newState: ScoreboardState): void => {
    state = newState;
};

export const updateTeam = (team: Team): void => {
    const index = state.teams.findIndex(t => t.id === team.id);
    if (index >= 0) {
        state.teams[index] = team;
    } else {
        state.teams.push(team);
    }
};

export const updateMatchup = (matchup: Matchup): void => {
    state.currentMatchup = matchup;
};

export const addToHistory = (matchup: Matchup): void => {
    state.matchHistory.push(matchup);
};
