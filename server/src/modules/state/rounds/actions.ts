import { 
    EndRoundPayload, 
    RoundConfig, 
    RoundHistory, 
    RoundType,
    StartRoundPayload
} from '../../../types/rounds.types';
import { 
    getCurrentRound, 
    getRoundHistory, 
    getNewRoundConfig, 
    setCurrentRound, 
    updateRoundHistory 
} from './state';
import { getState, updateState } from '../index';  // Add this import

// TODO: Timer integration
// import { startTimer, stopTimer, resetTimer } from '../timer';

/**
 * Advance to the next round with the provided configuration
 * @param config Round configuration to apply
 * @returns The new current round or null if invalid
 */
export const advanceRound = (config: RoundConfig): RoundConfig | null => {
    try {
        // Fucking validation first
        if (!validateRoundConfig(config)) {
            console.error('Invalid round config provided:', config);
            return null;
        }

        // Set the new current round
        setCurrentRound(config);

        // TODO: Integrate with timer
        // if (config.timeLimit) {
        //    startTimer(config.timeLimit);
        // }

        console.log(`Advanced to round ${config.number}: ${config.type}`);
        return config;
    } catch (error) {
        console.error('Holy shit! Error advancing round:', error);
        return null;
    }
};

/**
 * Start a new round based on the configuration
 * @param payload The round start payload
 * @returns The new current round or null if invalid
 */
export const startRound = (payload: StartRoundPayload): RoundConfig | null => {
    try {
        return advanceRound(payload.config);
    } catch (error) {
        console.error('Fuck! Error starting round:', error);
        return null;
    }
};

/**
 * Save the results of the current round and add to history
 * @param payload The end round payload with results
 * @returns The updated round history or null on error
 */
export const saveRoundResults = (payload: EndRoundPayload): RoundHistory[] | null => {
    try {
        const state = getState();
        const currentRound = getCurrentRound();
        if (!currentRound) {
            console.error('No active round to save results for');
            return null;
        }

        // Create history entry from current round + results
        const historyEntry: RoundHistory = {
            ...currentRound,
            points: {
                team1: payload.points.team1,  // Store the points earned in this round
                team2: payload.points.team2   // Store the points earned in this round
            },
            penalties: payload.penalties || {
                team1: { major: 0, minor: 0 },
                team2: { major: 0, minor: 0 }
            },
            notes: payload.notes
        };

        // Calculate new total scores
        const newTeam1Score = (state.team1.score || 0) + payload.points.team1;
        const newTeam2Score = (state.team2.score || 0) + payload.points.team2;

        // Update history with new entry
        const history = [...getRoundHistory(), historyEntry];
        updateRoundHistory(history);

        // Update team scores with the accumulated totals
        updateState({
            team1: {
                ...state.team1,
                score: newTeam1Score
            },
            team2: {
                ...state.team2,
                score: newTeam2Score
            }
        });

        // Clear current round
        setCurrentRound(null);

        // TODO: Reset timer if it was started
        // resetTimer();

        console.log(`Saved results for round ${currentRound.number}`);
        console.log('Round points:', payload.points);
        console.log('New total scores:', { team1: newTeam1Score, team2: newTeam2Score });
        return history;
    } catch (error) {
        console.error('Damn it! Error saving round results:', error);
        return null;
    }
};

/**
 * Reset the entire round system (current round and history)
 * @returns True if reset was successful
 */
export const resetRounds = (): boolean => {
    try {
        // Clear current round
        setCurrentRound(null);
        
        // Clear history
        updateRoundHistory([]);

        // TODO: Reset timer if it was active
        // resetTimer();

        console.log('Reset all rounds');
        return true;
    } catch (error) {
        console.error('Fucking hell! Error resetting rounds:', error);
        return false;
    }
};

/**
 * Create a new round of the specified type with auto-incremented number
 * @param type The type of round to create
 * @returns The new round configuration
 */
export const createNextRound = (type: RoundType): RoundConfig => {
    const history = getRoundHistory();
    const nextRoundNumber = history.length + 1;
    return getNewRoundConfig(type, nextRoundNumber);
};

/**
 * Validate a round configuration for required fields
 * @param config The round configuration to validate
 * @returns True if the configuration is valid
 */
const validateRoundConfig = (config: RoundConfig): boolean => {
    // Check required fields
    if (!config.type || config.number <= 0) {
        return false;
    }

    // Check player limits make sense
    if (config.minPlayers < 1 || config.maxPlayers < config.minPlayers) {
        return false;
    }

    // Timeouts should be positive if specified
    if (config.timeLimit !== null && config.timeLimit <= 0) {
        return false;
    }

    return true;
};

