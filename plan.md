Project: Improv Scoreboard Round System & Features
Objective: Implement rounds system with statistics tracking and export functionality using established modular patterns from ADD_FEATURE_GUIDE.md.

Key Architectural Considerations (From Project Files):
Modular Structure:

Server uses separated modules: state/, socket/, api/, types/

Client needs similar organization (contexts/components/hooks)

Follow type patterns from scoreboard.types.ts

State Management:

Extend ScoreboardState interface in scoreboard.types.ts

Create new rounds.ts in state/ module

Maintain WebSocket synchronization (see handlers.ts patterns)

Existing Patterns:

Timer implementation (state/timer.ts) provides good reference

Settings toggles exist in state/ui.ts

Use Socket.IO events for real-time updates

Updated Implementation Plan
1. Type System Updates (types/ directory)

typescript
// In scoreboard.types.ts
interface RoundConfig {
  number: number;
  isMixed: boolean;
  theme: string;
  type: string;
  minPlayers: number;
  maxPlayers: number;
  timeLimit: number;
}

interface RoundHistory extends RoundConfig {
  points: Record<TeamId, number>;
  penalties: Record<TeamId, number>;
}

// Update ScoreboardState
interface ScoreboardState {
  // ... existing properties ...
  currentRound: RoundConfig;
  roundHistory: RoundHistory[];
  roundSettings: {
    showTheme: boolean;
    showPlayerLimits: boolean;
    // ... other toggles
  }
}
2. State Management (state/rounds.ts)

Implement round progression logic following state/timer.ts patterns

Create handlers for:

advanceRound()

saveRoundResults()

resetRounds()

Integrate with existing state persistence

3. WebSocket Integration (socket/handlers.ts)

typescript
// Add to ClientToServerEvents
interface ClientToServerEvents {
  // ... existing events ...
  startRound: (config: RoundConfig) => void;
  endRound: (results: RoundResults) => void;
  exportMatchReport: () => void;
}

// Add handlers for new events
socket.on('endRound', (results) => {
  saveRoundResults(results);
  broadcastState(io);
});
4. UI Components (Client-side)

Create RoundHeader component using existing Tailwind patterns

Add round controls to control panel

Extend settings modal with new toggles

Implement history table using Shadcn/UI components

5. Export Functionality

Add export.ts module under api/

Create HTML template following project's branding

Add endpoint in routes.ts:

typescript
router.get('/export/match-report', generateMatchReport);
6. Testing Requirements

Add round-related tests to test_websocket.ps1

Create API tests for export endpoint

Verify settings persistence in UI tests

Integration Checklist:

Follow ADD_FEATURE_GUIDE.md workflow strictly

Keep all round logic in dedicated modules

Maintain type safety through interfaces

Update DEV_NOTES.md with round system architecture

Verify with test_all.ps1 after implementation

Critical References:

Use timer implementation (state/timer.ts) as reference

Follow WebSocket patterns from existing event handlers

Adhere to Tailwind CSS class conventions from control panel

Maintain French/English i18n support

