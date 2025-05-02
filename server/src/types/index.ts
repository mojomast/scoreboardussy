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
  
  export interface ScoreboardState {
    team1: Team;
    team2: Team;
    logoUrl: string | null;
    titleText: string | null; // Added for scoreboard title
    footerText: string | null; // Added for scoreboard footer
    // Style properties for title and footer
    titleTextColor: string;
    titleTextSize: number; // e.g., font size in pixels or rem units
    footerTextColor: string;
    footerTextSize: number;
  }
  
  // --- WebSocket Event Payloads --- 
  
  export interface UpdateTeamPayload {
    teamId: 'team1' | 'team2';
    name?: string;
    color?: string;
  }
  
  export interface UpdateScorePayload {
    teamId: 'team1' | 'team2';
    action: number;
  }
  
  export interface UpdatePenaltyPayload {
    teamId: 'team1' | 'team2';
    type: 'major' | 'minor';
    action: number;
  }
  
  export interface ResetPenaltiesPayload {
    teamId: 'team1' | 'team2';
  }
  
  export interface UpdateTextPayload {
    field: 'titleText' | 'footerText';
    text: string | null;
  }
  
  // Payload for updating text styles
  export interface UpdateTextStylePayload {
    target: 'title' | 'footer';
    color?: string;
    size?: number;
  }
  
  // No payload for resetAll or getState
  
  // --- Server -> Client Events --- 
  export interface ServerToClientEvents {
    updateState: (state: ScoreboardState) => void;
    initialState: (state: ScoreboardState) => void;
  }
  
  // --- Client -> Server Events --- 
  export interface ClientToServerEvents {
    getState: () => void;
    updateTeam: (payload: UpdateTeamPayload) => void;
    updateScore: (payload: UpdateScorePayload) => void;
    updatePenalty: (payload: UpdatePenaltyPayload) => void;
    resetPenalties: (payload: ResetPenaltiesPayload) => void;
    resetAll: () => void;
    updateLogo: (newLogoUrl: string | null) => void;
    updateText: (payload: UpdateTextPayload) => void; // Added for title/footer
    updateTextStyle: (payload: UpdateTextStylePayload) => void; // Added for text styling
  }
  
  // --- Inter-Server Events --- (Not used in this simple setup)
  export interface InterServerEvents { }
  
  // --- Socket Data --- (Can be used for per-socket session data if needed)
  export interface SocketData { }
