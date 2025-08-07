import { ScoreboardState } from '../../types/scoreboard.types';
import {
    UpdateTextPayload,
    UpdateTextStylePayload,
    UpdateLogoSizePayload,
    UpdateVisibilityPayload
} from '../../types/ui.types';
import { getState, updateState } from './index';

// Initial UI state
const initialUiState = {
    logoUrl: null as string | null,
    logoSize: 50,
    titleText: '',
    footerText: null,
    titleTextColor: '#FFFFFF',
    titleTextSize: 2,
    footerTextColor: '#FFFFFF',
    footerTextSize: 1.25,
    titleStyle: { color: '#000000', sizeRem: 2 },
    footerStyle: { color: '#000000', sizeRem: 1 },
    showScore: true,
    showPenalties: true,
    showEmojis: true,
    team1Emoji: null as 'hand' | 'fist' | null,
    team2Emoji: null as 'hand' | 'fist' | null
};

// UI state management functions
export const updateLogoUrl = (newLogoUrl: string | null): void => {
    updateState({ logoUrl: newLogoUrl });
};

export const updateLogoSize = (size: number): void => {
    updateState({ logoSize: size });
};

export const updateText = (payload: UpdateTextPayload): void => {
    if (payload.field === 'titleText' || payload.field === 'footerText') {
        updateState({ [payload.field]: payload.text ? payload.text.trim() : null });
    }
};

export const updateTextStyle = (payload: UpdateTextStylePayload): void => {
    const updates: Partial<ScoreboardState> = {};
    
    if (payload.target === 'title') {
        if (payload.color !== undefined) updates.titleTextColor = payload.color;
        if (payload.size !== undefined) updates.titleTextSize = payload.size;
    }
    if (payload.target === 'footer') {
        if (payload.color !== undefined) updates.footerTextColor = payload.color;
        if (payload.size !== undefined) updates.footerTextSize = payload.size;
    }

    if (Object.keys(updates).length > 0) {
        updateState(updates);
    }
};

export const updateVisibility = (payload: UpdateVisibilityPayload): void => {
    const updates: Partial<ScoreboardState> = {};
    
    switch (payload.target) {
        case 'score':
            updates.showScore = payload.visible;
            break;
        case 'penalties':
            updates.showPenalties = payload.visible;
            break;
        case 'emojis':
            updates.showEmojis = payload.visible;
            break;
    }

    updateState(updates);
};

export const switchTeamEmojis = (): void => {
    const currentState = getState();
    const currentEmoji1 = currentState.team1Emoji;
    
    // Simple swap logic:
    // If team 1 has hand, it gets fist, team 2 gets hand
    // If team 1 has null/fist, it gets hand, team 2 gets fist
    const nextEmoji1 = currentEmoji1 === 'hand' ? 'fist' : 'hand';
    const nextEmoji2 = nextEmoji1 === 'hand' ? 'fist' : 'hand';

    updateState({
        team1Emoji: nextEmoji1,
        team2Emoji: nextEmoji2,
    });
};

export const getInitialUiState = () => {
    return JSON.parse(JSON.stringify(initialUiState)); // Deep copy
};

export const resetUiState = (): void => {
    updateState(getInitialUiState());
};

