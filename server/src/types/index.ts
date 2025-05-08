export interface Team {
    id: string;
    name: string;
    score: number;
}

export interface Matchup {
    id: string;
    players: string[];
    scores: Record<string, number>;
    timestamp: number;
}

export interface ScoreboardState {
    teams: Team[];
    currentMatchup: Matchup | null;
    matchHistory: Matchup[];
}

export interface GameState {
    currentMatchup: Matchup | null;
    scores: Record<string, number>;
    contestants: string[];
    matchHistory: Matchup[];
}
