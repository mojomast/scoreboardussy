import { logger } from '../../config/logger';
import { RoundState } from '../../../types/rounds.types';
import { getInitialRoundState, setRoundState } from './state';
import fs from 'fs';
import path from 'path';

// File paths for server-side persistence
// Use process.cwd() so paths are stable in both ts-node and compiled builds.
const DATA_DIR = path.resolve(process.cwd(), 'data');
const ROUND_DATA_FILE = path.join(DATA_DIR, 'round_state.json');

/**
 * Persist the unified rounds state to storage (server-side only)
 * @param rounds The full rounds state to persist
 * @returns True if persistence succeeded
 */
export const persistRoundState = (
    rounds: RoundState
): boolean => {
    try {
        if (!fs.existsSync(DATA_DIR)) {
            fs.mkdirSync(DATA_DIR, { recursive: true });
        }
        fs.writeFileSync(ROUND_DATA_FILE, JSON.stringify({ rounds }, null, 2));
        logger.info('Unified rounds state persisted to file system');
        return true;
    } catch (error) {
        logger.error('Error persisting unified rounds state:', error);
        return false;
    }
};

/**
 * Load persisted unified rounds state from storage (server-side only)
 * @returns True if loading succeeded and state was updated
 */
export const loadPersistedRoundState = (): boolean => {
    try {
        if (fs.existsSync(ROUND_DATA_FILE)) {
            const { rounds } = JSON.parse(fs.readFileSync(ROUND_DATA_FILE, 'utf-8'));
            setRoundState(rounds);
            logger.info('Unified rounds state loaded from file system');
            return true;
        } else {
            logger.info('No persisted unified rounds state found, using defaults');
            return false;
        }
    } catch (error) {
        logger.error('Error loading persisted unified rounds state:', error);
        resetToDefaults();
        return false;
    }
};

/**
 * Clear all persisted unified rounds state from storage
 * @returns True if clearing succeeded
 */
export const clearPersistedRoundState = (): boolean => {
    try {
        if (fs.existsSync(ROUND_DATA_FILE)) {
            fs.unlinkSync(ROUND_DATA_FILE);
            logger.info('Cleared persisted unified rounds state from file system');
        }
        return true;
    } catch (error) {
        logger.error('Error clearing persisted unified rounds state:', error);
        return false;
    }
};

/**
 * Reset to default state when there's an error loading
 */
const resetToDefaults = (): void => {
    const initialState = getInitialRoundState();
    setRoundState(initialState);
    logger.info('Reset to default unified rounds state due to loading error');
};

/**
 * Auto-save the unified rounds state
 * @param rounds The full rounds state
 */
export const autoSaveRoundState = (
    rounds: RoundState
): void => {
    persistRoundState(rounds);
};
