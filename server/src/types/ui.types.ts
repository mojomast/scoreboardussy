// UI-related type definitions

// Style configuration for text elements
export interface TextStyle {
    color: string;
    sizeRem: number;
}

// UI-related payload types
export interface UpdateTextPayload {
    field: 'titleText' | 'footerText';
    text: string | null;
}

export interface UpdateTextStylePayload {
    target: 'title' | 'footer';
    color?: string;
    size?: number;
}

export interface UpdateLogoSizePayload {
    size: number;
}

export interface UpdateVisibilityPayload {
    target: 'score' | 'penalties' | 'emojis' | 'timer';
    visible: boolean;
}

// --- Round UI Settings for toggles and column visibility ---
export interface RoundUISettings {
    showRoundHeader: boolean;
    showRoundTheme: boolean;
    showPlayerLimits: boolean;
    showTimeLimit: boolean;
    historyColumns: {
        theme: boolean;
        type: boolean;
        mode: boolean;
        duration: boolean;
    };
}
