import { Team, UpdateTeamPayload } from '../../types/team.types';
import { getState, updateState } from './index'; // Will create this later

// Initial team state
const initialTeamState: Record<'team1' | 'team2', Team> = {
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
};

// Team management functions
export const updateTeam = (teamId: 'team1' | 'team2', updates: Partial<Pick<Team, 'name' | 'color'>>): void => {
    const currentState = getState();
    const updatedTeam = { ...currentState[teamId], ...updates };
    updateState({ [teamId]: updatedTeam });
};

export const updateScore = (teamId: 'team1' | 'team2', action: 'increment' | 'decrement'): void =
    {
    const currentState = getState();

    // Only allow manual increments when in manual mode
    const mode = currentState.scoringMode || 'round';
    if (mode !== 'manual') {
        console.warn(`Ignoring manual score update in '${mode}' mode`);
        return;
    }

    const currentScore = currentState[teamId].score;
    const newScore = action === 'increment'
        ? currentScore + 1
        : Math.max(0, currentScore - 1); // Prevent negative scores
    
    updateState({
        [teamId]: {
            ...currentState[teamId],
            score: newScore
        }
    });
};

export const updatePenalty = (teamId: 'team1' | 'team2', type: 'major' | 'minor'): void => {
    const currentState = getState();
    const currentPenalties = currentState[teamId].penalties;
    
    updateState({
        [teamId]: {
            ...currentState[teamId],
            penalties: {
                ...currentPenalties,
                [type]: currentPenalties[type] + 1
            }
        }
    });
};

export const resetPenalties = (teamId: 'team1' | 'team2'): void => {
    const currentState = getState();
    
    updateState({
        [teamId]: {
            ...currentState[teamId],
            penalties: { major: 0, minor: 0 }
        }
    });
};

export const getInitialTeamState = (): Record<'team1' | 'team2', Team> => {
    return JSON.parse(JSON.stringify(initialTeamState)); // Deep copy
};

export const resetTeamState = (keepNames: boolean = true): void => {
    const currentState = getState();
    const resetState = getInitialTeamState();

    if (keepNames) {
        resetState.team1.name = currentState.team1.name;
        resetState.team1.color = currentState.team1.color;
        resetState.team2.name = currentState.team2.name;
        resetState.team2.color = currentState.team2.color;
    }

    updateState(resetState);
};

