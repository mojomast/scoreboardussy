// Define the core Team type and its related interfaces
export interface Team {
    id: 'team1' | 'team2';
    name: string;
    color: string;
    score: number;
    penalties: {
        major: number;
        minor: number;
    };
}

// Team-specific update payload
export interface UpdateTeamPayload {
    teamId: 'team1' | 'team2';
    updates: Partial<Pick<Team, 'name' | 'color'>>;
}

// Team score update payload
// Note: In the server.ts implementation, this numeric value is converted to
// 'increment' or 'decrement' string based on whether it's positive or negative
export interface UpdateScorePayload {
    teamId: 'team1' | 'team2';
    action: number; 
}

// Team penalty update payload
// Note: In the current implementation, the action field isn't actually used
// The function simply increments the penalty count for the specified team and type
export interface UpdatePenaltyPayload {
    teamId: 'team1' | 'team2';
    type: 'major' | 'minor';
    action: number;
}

// Team penalty reset payload
export interface ResetPenaltiesPayload {
    teamId: 'team1' | 'team2';
}

