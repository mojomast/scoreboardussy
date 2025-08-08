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
    updateRoundHistory,
    // planning + lifecycle helpers
    setNextRoundDraft,
    enqueueUpcoming,
    dequeueUpcoming,
    setGameStatus
} from './state';
import { getState, updateState } from '../index';  // Add this import
import fs from 'fs';
import path from 'path';
import { generateHTMLReport } from '../../export/generateReport';
import { RoundUISettings } from '../../../types/ui.types';

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
        // Ensure game is live in round mode so endRound can auto-advance
        const state = getState();
        const mode = state.scoringMode || 'round';
        if (mode === 'round' && state.rounds.gameStatus !== 'live') {
            setGameStatus('live');
        }
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
        const nextNumber = getRoundHistory().length + 1;
        const historyEntry: RoundHistory = {
            ...currentRound,
            number: nextNumber,
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

        // Update history with new entry
        const history = [...getRoundHistory(), historyEntry];
        updateRoundHistory(history);

        // Update team scores based on scoring mode
        const scoringMode = state.scoringMode || 'round';
        if (scoringMode === 'round') {
            const newTeam1Score = (state.team1.score || 0) + payload.points.team1;
            const newTeam2Score = (state.team2.score || 0) + payload.points.team2;
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
        } else {
            // In manual mode, do not change team totals here
            updateState({});
        }

        // Auto-advance to next round when in round mode
        const scoringMode2 = state.scoringMode || 'round';
        const shouldAutoAdvance = (scoringMode2 === 'round');
        if (shouldAutoAdvance && state.rounds.gameStatus !== 'live') {
            // Make it robust: mark live so the lifecycle remains consistent
            setGameStatus('live');
        }
        if (shouldAutoAdvance) {
            const freshState = getState();
            const queueLen = (freshState.rounds.upcoming || []).length;
            console.log(`[rounds] Auto-advance enabled. Upcoming length: ${queueLen}`);
            const nextQueued = (freshState.rounds.upcoming && freshState.rounds.upcoming[0]) || null;
            if (nextQueued && validateRoundConfig(nextQueued)) {
                console.log('[rounds] Advancing to next queued round:', nextQueued);
                const dequeued = dequeueUpcoming();
                if (dequeued) {
                    const nextRoundNumber = history.length + 1; // after push above
                    setCurrentRound({ ...dequeued, number: nextRoundNumber });
                    console.log(`[rounds] Set current to queued round #${nextRoundNumber}`);
                } else {
                    console.warn('[rounds] Dequeue returned null unexpectedly. Staying between rounds.');
                    setCurrentRound(null);
                }
            } else {
                // Fallback: if a valid Next Round Draft exists, use it
                const draft = freshState.rounds.nextRoundDraft;
                if (draft && validateRoundConfig(draft)) {
                    const nextRoundNumber = history.length + 1;
                    setCurrentRound({ ...draft, number: nextRoundNumber });
                    setNextRoundDraft(null);
                    console.log('[rounds] No queued round. Using saved draft for next round.');
                } else {
                    console.log('[rounds] No queued round or draft. Remaining between rounds.');
                    setCurrentRound(null);
                }
            }
        } else {
            // Default behavior: go to between-rounds state
            console.log('[rounds] Game not live; not auto-advancing.');
            setCurrentRound(null);
        }

        // TODO: Reset timer if it was started
        // resetTimer();

        console.log(`Saved results for round ${currentRound.number}`);
        console.log('Round points:', payload.points);
        return history;
    } catch (error) {
        console.error('Damn it! Error saving round results:', error);
        return null;
    }
};

/**
 * Start the game lifecycle. In round mode, requires a draft or upcoming item to begin.
 * - If nextRoundDraft exists and is valid, start that round and clear the draft.
 * - Else, if upcoming has at least one valid config, dequeue and start it.
 * - Sets gameStatus to 'live'. In manual mode, simply sets gameStatus to 'live' with no enforcement.
 * @returns True if the game was started (or set live in manual mode)
 */
export const startGame = (): boolean => {
    try {
        const state = getState();
        const mode = state.scoringMode || 'round';

        // Always mark live
        setGameStatus('live');

        if (mode === 'manual') {
            // No enforcement in manual mode
            return true;
        }

        // Round mode enforcement
        // Prefer the upcoming queue order if available; otherwise fall back to draft
        const firstQueued = (state.rounds.upcoming && state.rounds.upcoming[0]) || null;
        if (firstQueued && validateRoundConfig(firstQueued)) {
            const dequeued = dequeueUpcoming();
            if (dequeued) {
                setCurrentRound({ ...dequeued, number: (state.rounds.history?.length || 0) + 1 });
                return true;
            }
        }

        const draft = state.rounds.nextRoundDraft;
        if (draft && validateRoundConfig(draft)) {
            setCurrentRound({ ...draft, number: (state.rounds.history?.length || 0) + 1 });
            // Clear draft after applying
            setNextRoundDraft(null);
            return true;
        }

        // No valid config to start
        console.warn('startGame called but no valid nextRoundDraft or upcoming found');
        return false;
    } catch (error) {
        console.error('Error in startGame lifecycle:', error);
        return false;
    }
};

/**
 * Finish the game lifecycle.
 * - Generates an HTML report of the match to data/reports/
 * - Clears nextRoundDraft and upcoming queues
 * - Sets gameStatus to 'finished'
 * - Resets current round to between-rounds state
 * @returns The path to the generated report file, or null if generation failed
 */
export const finishGame = (): string | null => {
    try {
        const state = getState();

        // Generate report HTML
        const ui: RoundUISettings = {
            showRoundHeader: true,
            showRoundTheme: true,
            showPlayerLimits: true,
            showTimeLimit: true,
            historyColumns: { theme: true, type: true, mode: true, duration: true }
        };
        const html = generateHTMLReport(state, ui);

        // Ensure output dir exists
        const DATA_DIR = path.resolve(process.cwd(), 'data');
        const REPORTS_DIR = path.join(DATA_DIR, 'reports');
        if (!fs.existsSync(REPORTS_DIR)) {
            fs.mkdirSync(REPORTS_DIR, { recursive: true });
        }
        const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\./g, '-');
        const filePath = path.join(REPORTS_DIR, `match_report_${timestamp}.html`);
        fs.writeFileSync(filePath, html, 'utf-8');

        // Clear planning queues and mark finished
        updateState({
            rounds: {
                ...state.rounds,
                nextRoundDraft: null,
                upcoming: [],
                gameStatus: 'finished',
                // Return to between-rounds placeholder
                isBetweenRounds: true
            }
        });

        // Also clear current active round to placeholder between-rounds state
        setCurrentRound(null);

        console.log(`Match report generated at: ${filePath}`);
        return filePath;
    } catch (error) {
        console.error('Error in finishGame lifecycle:', error);
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

