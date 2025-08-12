import { Team } from './team.types';
import { RoundState } from './rounds.types';
import { TextStyle } from './ui.types';

export type ScoringMode = 'round' | 'manual';

/**
 * Core scoreboard state interface 
 * Contains all state properties needed for the scoreboard application
 */
export interface ScoreboardState {
    // Team data
    team1: Team;
    team2: Team;

    // Scoring behavior
    scoringMode?: ScoringMode; // 'round' -> points added via endRound; 'manual' -> points adjusted via manual controls
    
    // Display elements
    logoUrl: string | null;
    logoSize?: number;
    titleText: string | null;
    footerText: string | null;
    
    // Style properties
    titleTextColor: string;
    titleTextSize: number;
    footerTextColor: string;
    footerTextSize: number;
    titleStyle?: TextStyle;
    footerStyle?: TextStyle;
    
    // Visibility flags
    showScore?: boolean;
    showPenalties?: boolean;
    showEmojis: boolean;
    
    // Emoji states
    team1Emoji: 'hand' | 'fist' | null;
    team2Emoji: 'hand' | 'fist' | null;
    
    // Audience voting (experimental, optional flags)
    votingEnabled?: boolean;
    votingActive?: boolean;

    // Unified round state
    rounds: RoundState;
}
