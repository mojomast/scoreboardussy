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
    CreatePlaylistPayload
} from './rounds.types';

// Server -> Client Events
export interface ServerToClientEvents {
    updateState: (state: ScoreboardState) => void;
    initialState: (state: ScoreboardState) => void;
}

// Client -> Server Events
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
    
    // Round-related events
    startRound: (payload: StartRoundPayload) => void;
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
}

// Inter-Server Events (not used in this simple setup)
export interface InterServerEvents {}

// Socket Data (can be used for per-socket session data if needed)
export interface SocketData {}

