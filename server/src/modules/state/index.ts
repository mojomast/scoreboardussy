import { ScoreboardState } from '../../types/scoreboard.types';
import { Team } from '../../types/team.types';
import { RoundConfig, RoundHistory, RoundSettings, RoundTemplate, RoundPlaylist } from '../../types/rounds.types';
import { getInitialTeamState } from './team';
import { getInitialUiState } from './ui';
import { getInitialRoundState } from './rounds/state';

// Global state instance
// Fucking global state - single source of truth
let state: ScoreboardState = {
    ...getInitialTeamState(),
    ...getInitialUiState(),
    rounds: getInitialRoundState()
};

// Core state management functions
export const getState = (): ScoreboardState => {
    try {
        // Return a deep copy to prevent accidental mutation
        return JSON.parse(JSON.stringify(state));
    } catch (error) {
        console.error('Error during JSON stringify/parse in getState:', error);
        // Return original state on error for debugging purposes
        return state;
    }
};

export const updateState = (updates: Partial<ScoreboardState>): void => {
    // Validate updates before applying
    if (!updates || typeof updates !== 'object') {
        console.error('Invalid updates provided to updateState:', updates);
        return;
    }

    try {
        // Create new state by merging updates with current state
        const newState = {
            ...state,
            ...updates
        };

        // Special handling for nested team updates
        if (updates.team1) {
            newState.team1 = { ...state.team1, ...updates.team1 };
        }
        if (updates.team2) {
            newState.team2 = { ...state.team2, ...updates.team2 };
        }

        // Special handling for nested round updates (migrated to unified rounds)
        if (updates.rounds && updates.rounds.current) {
            newState.rounds.current = { ...state.rounds.current, ...updates.rounds.current };
        }
        if (updates.rounds && updates.rounds.history) {
            newState.rounds.history = [...updates.rounds.history];
        }
        if (updates.rounds && typeof updates.rounds.isBetweenRounds === 'boolean') {
            newState.rounds.isBetweenRounds = updates.rounds.isBetweenRounds;
        }

        // Handle template updates
        if (updates.rounds && updates.rounds.templates) {
            newState.rounds.templates = [...updates.rounds.templates];
        }
        
        // Handle playlist updates
        if (updates.rounds && updates.rounds.playlists) {
            newState.rounds.playlists = [...updates.rounds.playlists];
        }
        
        // Handle active playlist updates
        if (updates.rounds && updates.rounds.activePlaylist) {
            newState.rounds.activePlaylist = updates.rounds.activePlaylist;
        }

        // Update the state
        state = newState;

        // Log state change
        console.log('State updated successfully');
        
        // Persist state to file
        persistState().catch(err => {
            console.error('Failed to persist state after update:', err);
        });
        
        // Log the transaction
        const actionType = Object.keys(updates).join(',');
        logStateTransaction(actionType, { keys: Object.keys(updates) }).catch(err => {
            console.error('Failed to log state transaction:', err);
        });
    } catch (error) {
        console.error('Error updating state:', error);
        console.error('Updates that caused error:', updates);
    }
};

// State persistence implementation
import fs from 'fs';
import path from 'path';

// File paths for server-side persistence
// Use process.cwd() so paths are stable in both ts-node and compiled builds.
const DATA_DIR = path.resolve(process.cwd(), 'data');
const STATE_FILE = path.join(DATA_DIR, 'scoreboard.json');
const STATE_BACKUP_FILE = path.join(DATA_DIR, 'scoreboard.backup.json');
const TRANSACTION_LOG_FILE = path.join(DATA_DIR, 'state_transactions.log');

/**
 * Persist the entire state to storage
 * @returns True if persistence succeeded
 */
export const persistState = async (): Promise<boolean> => {
    try {
        // Create data directory if it doesn't exist
        if (!fs.existsSync(DATA_DIR)) {
            fs.mkdirSync(DATA_DIR, { recursive: true });
        }

        // Create a backup of the current file if it exists
        if (fs.existsSync(STATE_FILE)) {
            fs.copyFileSync(STATE_FILE, STATE_BACKUP_FILE);
        }

        // Write the state to file
        await fs.promises.writeFile(
            STATE_FILE,
            JSON.stringify(state, null, 2)
        );
        
        console.log('State persisted successfully');
        return true;
    } catch (error) {
        console.error('Error persisting state:', error);
        return false;
    }
};

/**
 * Load persisted state from storage
 * @returns True if loading succeeded and state was updated
 */
export const loadPersistedState = async (): Promise<boolean> => {
    try {
        if (fs.existsSync(STATE_FILE)) {
            const data = await fs.promises.readFile(STATE_FILE, 'utf-8');
            const loadedState = JSON.parse(data);
            
            // Validate the loaded state
            if (!loadedState || typeof loadedState !== 'object') {
                throw new Error('Invalid state format');
            }
            
            // Update the state
            state = loadedState;
            console.log('State loaded successfully from file');
            return true;
        } else {
            console.log('No persisted state found, using defaults');
            return false;
        }
    } catch (error) {
        console.error('Error loading persisted state:', error);
        
        // Try to recover from backup if available
        if (fs.existsSync(STATE_BACKUP_FILE)) {
            try {
                const backupData = await fs.promises.readFile(STATE_BACKUP_FILE, 'utf-8');
                state = JSON.parse(backupData);
                console.log('Recovered state from backup file');
                return true;
            } catch (backupError) {
                console.error('Failed to recover from backup:', backupError);
            }
        }
        
        return false;
    }
};

/**
 * Log a state transaction to the transaction log
 * @param action The action that caused the state change
 * @param details Optional details about the state change
 */
export const logStateTransaction = async (action: string, details?: any): Promise<void> => {
    try {
        if (!fs.existsSync(DATA_DIR)) {
            fs.mkdirSync(DATA_DIR, { recursive: true });
        }
        
        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            action,
            details: details || {}
        };
        
        const logLine = JSON.stringify(logEntry) + '\n';
        await fs.promises.appendFile(TRANSACTION_LOG_FILE, logLine);
    } catch (error) {
        console.error('Error logging state transaction:', error);
    }
};

/**
 * Create a backup of the current state
 * @param backupName Optional custom name for the backup
 * @returns The path to the created backup file or null if failed
 */
export const createStateBackup = async (backupName?: string): Promise<string | null> => {
    try {
        if (!fs.existsSync(DATA_DIR)) {
            fs.mkdirSync(DATA_DIR, { recursive: true });
        }
        
        // Generate backup filename with timestamp
        const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\./g, '-');
        const fileName = backupName
            ? `scoreboard_${backupName}_${timestamp}.json`
            : `scoreboard_backup_${timestamp}.json`;
        const backupPath = path.join(DATA_DIR, 'backups', fileName);
        
        // Create backups directory if it doesn't exist
        if (!fs.existsSync(path.join(DATA_DIR, 'backups'))) {
            fs.mkdirSync(path.join(DATA_DIR, 'backups'), { recursive: true });
        }
        
        // Write current state to backup file
        await fs.promises.writeFile(
            backupPath,
            JSON.stringify(state, null, 2)
        );
        
        console.log(`State backup created at ${backupPath}`);
        return backupPath;
    } catch (error) {
        console.error('Error creating state backup:', error);
        return null;
    }
};

/**
 * Restore state from a backup file
 * @param backupPath Path to the backup file
 * @returns True if restore was successful
 */
export const restoreStateFromBackup = async (backupPath: string): Promise<boolean> => {
    try {
        if (!fs.existsSync(backupPath)) {
            console.error(`Backup file not found: ${backupPath}`);
            return false;
        }
        
        // Read backup file
        const data = await fs.promises.readFile(backupPath, 'utf-8');
        const backupState = JSON.parse(data);
        
        // Validate backup state
        if (!backupState || typeof backupState !== 'object') {
            console.error('Invalid backup state format');
            return false;
        }
        
        // Create backup of current state before restoring
        await createStateBackup('pre_restore');
        
        // Update state with backup
        state = backupState;
        
        // Persist the restored state
        await persistState();
        
        console.log(`State restored from backup: ${backupPath}`);
        return true;
    } catch (error) {
        console.error('Error restoring state from backup:', error);
        return false;
    }
};

/**
 * List all available state backups
 * @returns Array of backup file information
 */
export const listStateBackups = async (): Promise<Array<{path: string, date: Date, size: number}>> => {
    try {
        const backupsDir = path.join(DATA_DIR, 'backups');
        
        if (!fs.existsSync(backupsDir)) {
            return [];
        }
        
        const files = await fs.promises.readdir(backupsDir);
        const backups = await Promise.all(
            files
                .filter(file => file.endsWith('.json'))
                .map(async (file) => {
                    const filePath = path.join(backupsDir, file);
                    const stats = await fs.promises.stat(filePath);
                    return {
                        path: filePath,
                        date: stats.mtime,
                        size: stats.size
                    };
                })
        );
        
        // Sort by date, newest first
        return backups.sort((a, b) => b.date.getTime() - a.date.getTime());
    } catch (error) {
        console.error('Error listing state backups:', error);
        return [];
    }
};

// Full state reset function
export const resetAllState = (keepTeamNames: boolean = true): void => {
    const newState = {
        ...getInitialTeamState(),
        ...getInitialUiState(),
        rounds: getInitialRoundState()
    };

    if (keepTeamNames) {
        newState.team1.name = state.team1.name;
        newState.team1.color = state.team1.color;
        newState.team2.name = state.team2.name;
        newState.team2.color = state.team2.color;
    }

    state = newState;
};

// Re-export all state management functions
export * from './team';
export * from './ui';

// Export all round state management functions
export * from './rounds/state';
export * from './rounds/actions';
export * from './rounds/persistence';
export * from './rounds/templates';
