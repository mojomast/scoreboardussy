
// Defines the various types of improv rounds available
export enum RoundType {
    SHORTFORM = 'shortform',
    LONGFORM = 'longform',
    MUSICAL = 'musical',
    CHARACTER = 'character',
    NARRATIVE = 'narrative',
    CHALLENGE = 'challenge',
    CUSTOM = 'custom'
}

// Round configuration interface
export interface RoundConfig {
    number: number;
    title?: string; // Display title for the round (fallback to theme if empty)
    isMixed: boolean;
    theme: string;
    type: RoundType;
    minPlayers: number;
    maxPlayers: number;
    timeLimit: number | null;
}

// Round history with results
export interface RoundHistory extends RoundConfig {
    points: Record<'team1' | 'team2', number>;
    penalties: Record<'team1' | 'team2', {
        major: number;
        minor: number;
    }>;
    notes?: string;
}

// Round settings interface
export interface RoundSettings {
    showRoundNumber: boolean;
    showTheme: boolean;
    showType: boolean;
    showMixedStatus: boolean;
    showPlayerLimits: boolean;
    showTimeLimit: boolean;
    showRoundHistory: boolean;
}

// Round-related payload types
export interface StartRoundPayload {
    config: RoundConfig;
}

export interface EndRoundPayload {
    points: Record<'team1' | 'team2', number>;
    penalties?: Record<'team1' | 'team2', {
        major: number;
        minor: number;
    }>;
    notes?: string;
}

export interface UpdateRoundSettingsPayload {
    target: keyof RoundSettings;
    visible: boolean;
}

// --- Add unified RoundState ---
export interface RoundState {
    current: RoundConfig;
    history: RoundHistory[];
    isBetweenRounds: boolean;
    templates: RoundTemplate[];   // Available templates
    playlists: RoundPlaylist[];  // Available playlists
    settings: RoundSettings;      // Display settings for rounds
    activePlaylist?: {           // Currently active playlist
        id: string;
        currentIndex: number;    // Current position in playlist
    };

    // Game lifecycle + planning
    gameStatus?: 'notStarted' | 'live' | 'finished';
    nextRoundDraft?: RoundConfig | null;
    upcoming?: RoundConfig[];
}

// Template for reusable round configurations
export interface RoundTemplate {
    id: string;           // Unique identifier
    name: string;         // Template name
    description?: string; // Optional description
    config: Omit<RoundConfig, 'number'>; // Round config without number (assigned when used)
    tags?: string[];      // Optional tags for organization
}

// A planned match with a sequence of rounds
export interface RoundPlaylist {
    id: string;           // Unique identifier
    name: string;         // Playlist name
    description?: string; // Optional description
    rounds: RoundTemplate[]; // Sequence of rounds using templates
    created: Date;        // Creation timestamp
    lastModified: Date;   // Last modification timestamp
}

// State updates for templates and playlists
export interface TemplateState {
    templates: RoundTemplate[];
    playlists: RoundPlaylist[];
}

// Payload types for template and playlist operations
export interface SaveTemplatePayload {
    name: string;
    description?: string;
    config: Omit<RoundConfig, 'number'>;
    tags?: string[];
}

export interface CreatePlaylistPayload {
    name: string;
    description?: string;
    rounds: string[];  // Array of template IDs
}

export interface UpdatePlaylistPayload {
    id: string;
    updates: Partial<Pick<RoundPlaylist, 'name' | 'description' | 'rounds'>>;
}
