Project: Complete Round System Implementation
Objective: Add full rounds lifecycle management with export capabilities while maintaining real-time sync and existing penalty/voting systems.

Core Requirements
1. Round System Must Include:

Configurable number of rounds

Per-round attributes:

ts
{
  number: number,
  mode: 'mixed'|'compared',
  theme: string,
  type: string,
  minPlayers: number,
  maxPlayers: number,
  timeLimit: number
}
End-of-round button that:

Freezes current scores/penalties

Captures round results

Advances to next round or ends match

Persistent round history with:

ts
{
  ...RoundConfig,
  points: Record<TeamId, number>,
  penalties: Record<TeamId, number>,
  timestamp: Date
}
2. UI Requirements

Header Layout (Below main scoreboard):

[Round #X]               // Centered
[Theme: Comedy] | [Type: Scene]  // Same line
[Compared] | [Min: 4] [Max: 8]   // Next line
[Time Limit: 3:00]       // Separate line
History Table (Collapsible below scoreboard):

Round | Mode | Points | Penalties | Duration | [Theme] | [Type]  // Toggleable columns
Control Panel Additions:

Round configuration modal

End Round button with confirmation

Match export button

3. Settings Toggles

ts
// In UISettings interface (ui.types.ts)
{
  showRoundHeader: boolean,
  showRoundTheme: boolean,
  showPlayerLimits: boolean,
  showTimeLimit: boolean,
  historyColumns: { // Per-column visibility
    theme: boolean,
    type: boolean,
    mode: boolean,
    duration: boolean
  }
}
4. Export System

Generate HTML report containing:

All round data (respecting visibility toggles)

Final scores and penalties

Match duration timeline

Team performance charts (if time allows)

Use existing Tailwind/Shadcn styles for consistency

Technical Implementation Plan
1. Type System Updates (types/)

typescript
// scoreboard.types.ts
interface RoundState {
  current: RoundConfig;
  history: RoundHistory[];
  isBetweenRounds: boolean; // Freeze state during transitions
}

// events.types.ts
interface ClientToServerEvents {
  'round:end': (results: Omit<RoundHistory, 'timestamp'>) => void;
  'round:config': (config: RoundConfig) => void;
  'export:match': () => void;
}

interface ServerToClientEvents {
  'round:transition': (nextRound: number) => void;
}
2. State Management (state/rounds.ts)

typescript
export const initializeRounds = (): RoundState => ({
  current: DEFAULT_ROUND,
  history: [],
  isBetweenRounds: false
});

export const endCurrentRound = (results: RoundHistory) => {
  const state = getState();
  updateState({
    rounds: {
      ...state.rounds,
      history: [...state.rounds.history, {...results, timestamp: new Date()}],
      isBetweenRounds: true
    }
  });
  // Auto-advance or end match logic
};
3. Socket.IO Integration (socket/handlers.ts)

typescript
// Round configuration handler
socket.on('round:config', (config) => {
  validateRoundConfig(config); // New validation util
  updateState({ rounds: { ...getState().rounds, current: config }});
  broadcastState(io);
});

// End round handler
socket.on('round:end', (results) => {
  endCurrentRound(results);
  io.emit('round:transition', getState().rounds.current.number + 1);
});
4. UI Components (Client-side)

RoundHeader.tsx: Composite component using existing score display patterns

RoundHistoryTable.tsx: Shadcn DataTable with column visibility controls

RoundConfigModal.tsx: Form using existing team configuration patterns

5. Export Module (modules/export/)

typescript
// generateReport.ts
export const generateHTMLReport = (state: ScoreboardState) => `
<!DOCTYPE html>
<html class="${state.ui.theme}">
  <head>...</head>
  <body>
    ${state.ui.showRoundHeader ? renderRoundSummary() : ''}
    ${renderCharts()}
    ${state.rounds.history.map(renderRoundRow)}
  </body>
</html>
`;
6. Testing Requirements

Add to test_websocket.ps1:

json
{ "round:config": { "number": 1, "theme": "Test", ... } }
{ "round:end": { "points": {"team1": 3}, ... } }
Verify settings persistence across reloads

Test HTML export with all toggle combinations

Critical Integration Points
State Freezing: Modify updateScore/updatePenalty to check isBetweenRounds flag

Timer Integration: Link round time limit to existing timer system

i18n Support: Add translations for new UI elements in both languages

Mobile Layout: Ensure round header collapses gracefully on small screens

References Required:

Timer implementation (state/timer.ts)

Settings persistence pattern (state/ui.ts)

Team configuration modal (existing React component)

WebSocket event patterns (handlers.ts)

---

## Progress Checklist

- [x] 1. Round System Must Include (types, state, handlers)
- [x] 2. UI Requirements (header, history table, modals) — PARTIAL (backend only, UI pending)
- [x] 3. Settings Toggles (ui.types.ts, client integration)
- [x] 4. Export System (generateReport, HTML)
- [ ] 5. Testing Requirements (test_websocket.ps1, persistence, toggles)
- [ ] 6. Critical Integration Points (state freeze, timer, i18n, mobile)

---