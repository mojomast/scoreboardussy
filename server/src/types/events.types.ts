import { ScoreboardState } from './scoreboard.types';
import { 
    UpdateTeamPayload, 
    UpdateScorePayload, 
    UpdatePenaltyPayload, 
    ResetPenaltiesPayload 
} from './team.types';
import { 
    UpdateTextPayload, 
    UpdateTextStylePayload, 
    UpdateLogoSizePayload, 
    UpdateVisibilityPayload
} from './ui.types';
import {
    StartRoundPayload,
    EndRoundPayload,
    UpdateRoundSettingsPayload,
    RoundType,
    SaveTemplatePayload,
    RoundTemplate,
    RoundPlaylist,
    CreatePlaylistPayload,
    RoundConfig
} from './rounds.types';

// Server -> Client Events
import { MatchState, TimerState } from './match.types';

export interface ServerToClientEvents {
    updateState: (state: ScoreboardState) => void;
    initialState: (state: ScoreboardState) => void;

    // Real-time match integration broadcasts
    matchStateUpdate: (state: MatchState) => void;
    timerUpdate: (timer: TimerState) => void;
}

// Client -> Server Events
import {
    CreateMatchPayload,
    MatchPenaltyPayload,
    MatchScorePayload,
    TimerSetPayload,
    TimerStartPayload,
    MatchState,
    TimerState
} from './match.types';

export interface ClientToServerEvents {
    getState: () => void;
    updateTeam: (payload: UpdateTeamPayload) => void;
    updateScore: (payload: UpdateScorePayload) => void;
    setScoringMode: (payload: { mode: 'round' | 'manual' }) => void;
    updatePenalty: (payload: UpdatePenaltyPayload) => void;
    resetPenalties: (payload: ResetPenaltiesPayload) => void;
    resetAll: () => void;
    updateLogo: (newLogoUrl: string | null) => void;
    updateText: (payload: UpdateTextPayload) => void;
    updateTextStyle: (payload: UpdateTextStylePayload) => void;
    updateLogoSize: (payload: UpdateLogoSizePayload) => void;
    updateVisibility: (payload: UpdateVisibilityPayload) => void;
    switchTeamEmojis: () => void;
    
    // Game lifecycle + planning
    startGame: () => void;
    finishGame: () => void;
    setNextRoundDraft: (payload: { config: RoundConfig | null }) => void;
    enqueueUpcoming: (payload: { config: RoundConfig }) => void;
    dequeueUpcoming: () => void;
    
    // Round-related events
    startRound: (payload: Partial<StartRoundPayload> & { config?: RoundConfig }) => void;
    endRound: (payload: EndRoundPayload) => void;
    updateRoundSetting: (payload: UpdateRoundSettingsPayload) => void;
    resetRounds: () => void;
    createNextRound: (type: RoundType) => void;

    // Template events
    saveTemplate: (payload: SaveTemplatePayload) => void;
    updateTemplate: (payload: { id: string, updates: Partial<RoundTemplate> }) => void;
    deleteTemplate: (templateId: string) => void;

    // Playlist events
    createPlaylist: (payload: CreatePlaylistPayload) => void;
    updatePlaylist: (payload: { id: string, updates: Partial<RoundPlaylist> }) => void;
    deletePlaylist: (playlistId: string) => void;

    // Playlist control events
    startPlaylist: (playlistId: string) => void;
    stopPlaylist: () => void;
    nextInPlaylist: () => void;
    previousInPlaylist: () => void;

    // Real-time match integration
    joinMatch: (payload: { matchId: string }) => void;
    leaveMatch: (payload: { matchId: string }) => void;

    createMatch: (payload: CreateMatchPayload) => void;
    getMatchState: (payload: { matchId: string }) => void;

    startTimer: (payload: TimerStartPayload) => void;
    pauseTimer: (payload: { matchId: string, timerId: string }) => void;
    resumeTimer: (payload: { matchId: string, timerId: string }) => void;
    stopTimer: (payload: { matchId: string, timerId: string }) => void;
    setTimerDuration: (payload: TimerSetPayload) => void;

    updateMatchScore: (payload: MatchScorePayload) => void;
    addPenalty: (payload: MatchPenaltyPayload) => void;
}

// Inter-Server Events (not used in this simple setup)
export interface InterServerEvents {}

// Socket Data (can be used for per-socket session data if needed)
export interface SocketData {}

