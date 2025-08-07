import { 
    RoundState, 
    RoundConfig, 
    RoundHistory, 
    RoundSettings, 
    RoundType
} from '../../../types/rounds.types';
import { getState as getGlobalState, updateState as updateGlobalState } from '../index';

// --- Unified round state ---
export const getInitialRoundState = (): RoundState => ({
    current: {
        number: 1,
        isMixed: false,
        theme: '',
        type: RoundType.SHORTFORM,
        minPlayers: 2,
        maxPlayers: 8,
        timeLimit: null
    },
    history: [],
    isBetweenRounds: false,
    templates: [],      // Initialize empty templates array
    playlists: [],     // Initialize empty playlists array
    activePlaylist: undefined,  // No active playlist by default
    settings: {        // Add default settings
        showRoundNumber: true,
        showTheme: true,
        showType: true,
        showMixedStatus: true,
        showPlayerLimits: true,
        showTimeLimit: true,
        showRoundHistory: true
    }
});

export const getCurrentRound = (): RoundConfig => {
    return getGlobalState().rounds.current;
};

export const getNewRoundConfig = (type: RoundType, number: number): RoundConfig => ({
    number,
    type,
    isMixed: false,
    theme: '',
    minPlayers: 2,
    maxPlayers: 8,
    timeLimit: null
});

export const setCurrentRound = (round: RoundConfig | null): void => {
    if (round === null) {
        updateGlobalState({ rounds: { ...getGlobalState().rounds, current: getInitialRoundState().current } });
    } else {
        updateGlobalState({ rounds: { ...getGlobalState().rounds, current: round } });
    }
};

export const getRoundHistory = (): RoundHistory[] => {
    return getGlobalState().rounds.history;
};

export const updateRoundHistory = (history: RoundHistory[]): void => {
    updateGlobalState({ rounds: { ...getGlobalState().rounds, history } });
};

export const getRoundSettings = (): RoundSettings => {
    const state = getGlobalState();
    return state.rounds.settings || getInitialRoundState().settings;
};

export const updateRoundSetting = (
    setting: keyof RoundSettings,
    value: boolean
): void => {
    const state = getGlobalState();
    const currentSettings = state.rounds.settings || getInitialRoundState().settings;
    
    updateGlobalState({
        rounds: {
            ...state.rounds,
            settings: {
                ...currentSettings,
                [setting]: value
            }
        }
    });
};

export const setRoundState = (rounds: RoundState): void => {
    updateGlobalState({ rounds });
};

export const resetRoundState = (): void => {
    updateGlobalState({ rounds: getInitialRoundState() });
};
