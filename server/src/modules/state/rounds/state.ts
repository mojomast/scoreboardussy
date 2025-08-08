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
        title: '',
        isMixed: false,
        theme: '',
        type: RoundType.SHORTFORM,
        minPlayers: 2,
        maxPlayers: 8,
        timeLimit: null
    },
    history: [],
    isBetweenRounds: true,
    templates: [],
    playlists: [],
    activePlaylist: undefined,
    settings: {
        showRoundNumber: true,
        showTheme: true,
        showType: true,
        showMixedStatus: true,
        showPlayerLimits: true,
        showTimeLimit: true,
        showRoundHistory: true
    },
    gameStatus: 'notStarted',
    nextRoundDraft: null,
    upcoming: []
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
    const state = getGlobalState();
    if (round === null) {
        // Between rounds: keep a default placeholder current config but mark betweenRounds = true
        updateGlobalState({ rounds: { ...state.rounds, current: getInitialRoundState().current, isBetweenRounds: true } });
    } else {
        // Active round: set current and mark betweenRounds = false
        updateGlobalState({ rounds: { ...state.rounds, current: round, isBetweenRounds: false } });
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

// --- Planning helpers ---
export const setNextRoundDraft = (draft: RoundConfig | null): void => {
    const state = getGlobalState();
    updateGlobalState({ rounds: { ...state.rounds, nextRoundDraft: draft } });
};

export const enqueueUpcoming = (config: RoundConfig): void => {
    const state = getGlobalState();
    const list = state.rounds.upcoming || [];
    updateGlobalState({ rounds: { ...state.rounds, upcoming: [...list, config] } });
};

export const dequeueUpcoming = (): RoundConfig | null => {
    const state = getGlobalState();
    const list = [...(state.rounds.upcoming || [])];
    if (list.length === 0) return null;
    const first = list.shift()!;
    updateGlobalState({ rounds: { ...state.rounds, upcoming: list } });
    return first;
};

export const setGameStatus = (status: 'notStarted' | 'live' | 'finished'): void => {
    const state = getGlobalState();
    updateGlobalState({ rounds: { ...state.rounds, gameStatus: status } });
};
