# Real-time Match Integration Design

## Overview
This document outlines the integration of mon-pacing's real-time match pacing features into scoreboardussy's existing Socket.IO architecture. The goal is to provide referee control capabilities, match timers, and real-time state synchronization while maintaining compatibility with existing scoreboard functions.

## Current Architecture Analysis

### Mon-pacing Features to Integrate
- **Timer Management**: Real-time countdown timers with start/stop/pause controls
- **Match State Tracking**: Current round, improvisation details, match progress
- **Referee Controls**: Timer controls, scoring, penalty management
- **Real-time Sync**: Live updates between referee device and display screens

### Scoreboardussy Socket.IO Infrastructure
- **Connection Management**: Robust reconnection with exponential backoff
- **Room-based Broadcasting**: Per-room state isolation (perfect for per-match)
- **State Management**: Centralized state with real-time broadcasting
- **Event System**: Comprehensive bidirectional event handling

## Integration Design

### 1. WebSocket Event Schema

#### New Client-to-Server Events
```typescript
interface MatchControlEvents {
  // Match Lifecycle
  createMatch: (payload: CreateMatchPayload) => void;
  startMatch: (payload: { matchId: string }) => void;
  endMatch: (payload: { matchId: string, results?: MatchResults }) => void;
  
  // Timer Controls
  startTimer: (payload: TimerStartPayload) => void;
  pauseTimer: (payload: { matchId: string, timerId: string }) => void;
  resumeTimer: (payload: { matchId: string, timerId: string }) => void;
  stopTimer: (payload: { matchId: string, timerId: string }) => void;
  setTimerDuration: (payload: TimerSetPayload) => void;
  
  // Round Management
  startRound: (payload: RoundStartPayload) => void;
  endRound: (payload: RoundEndPayload) => void;
  setCurrentRound: (payload: SetCurrentRoundPayload) => void;
  
  // Match Scoring (extends existing)
  updateMatchScore: (payload: MatchScorePayload) => void;
  addPenalty: (payload: MatchPenaltyPayload) => void;
  
  // Match Settings
  updateMatchSettings: (payload: MatchSettingsPayload) => void;
}

interface MatchBroadcastEvents {
  // Timer Updates
  timerUpdate: (state: TimerState) => void;
  timerExpired: (payload: { matchId: string, timerId: string }) => void;
  
  // Match State Updates
  matchStateUpdate: (state: MatchState) => void;
  roundUpdate: (state: RoundState) => void;
  
  // Control Events
  refereeControl: (action: RefereeControlAction) => void;
}
```

#### Payload Schemas
```typescript
interface CreateMatchPayload {
  name: string;
  teams: [TeamInfo, TeamInfo];
  rules: MatchRules;
  settings: MatchSettings;
}

interface TimerStartPayload {
  matchId: string;
  type: 'round' | 'huddle' | 'break' | 'custom';
  duration: number; // seconds
  autoStart?: boolean;
  hapticFeedback?: boolean;
}

interface TimerState {
  matchId: string;
  timerId: string;
  type: string;
  duration: number;
  remaining: number;
  status: 'stopped' | 'running' | 'paused' | 'expired';
  startTime?: number;
  endTime?: number;
}

interface MatchState {
  matchId: string;
  status: 'setup' | 'active' | 'paused' | 'completed';
  currentRound?: RoundInfo;
  score: { team1: number; team2: number };
  penalties: { team1: PenaltyInfo[]; team2: PenaltyInfo[] };
  timer?: TimerState;
  metadata: {
    createdAt: number;
    updatedAt: number;
    refereeId?: string;
  };
}
```

### 2. Backend State Management

#### Match State Store
```typescript
interface MatchStateStore {
  matches: Map<string, MatchState>;
  timers: Map<string, TimerInstance>;
  rooms: Map<string, Set<string>>; // matchId -> socketIds
}

class MatchStateManager {
  // Match CRUD
  createMatch(config: CreateMatchPayload): string;
  getMatch(matchId: string): MatchState | null;
  updateMatch(matchId: string, updates: Partial<MatchState>): void;
  deleteMatch(matchId: string): void;
  
  // Timer Management
  startTimer(matchId: string, config: TimerStartPayload): string;
  pauseTimer(matchId: string, timerId: string): void;
  resumeTimer(matchId: string, timerId: string): void;
  stopTimer(matchId: string, timerId: string): void;
  
  // Room Management
  joinMatchRoom(socketId: string, matchId: string): void;
  leaveMatchRoom(socketId: string, matchId: string): void;
  broadcastToMatch(matchId: string, event: string, data: any): void;
}
```

#### Timer Implementation
```typescript
class MatchTimer {
  private intervals: Map<string, NodeJS.Timeout> = new Map();
  
  start(timerId: string, duration: number, callbacks: TimerCallbacks): void {
    const startTime = Date.now();
    const endTime = startTime + (duration * 1000);
    
    const interval = setInterval(() => {
      const now = Date.now();
      const remaining = Math.max(0, endTime - now);
      
      callbacks.onTick({
        timerId,
        remaining: Math.ceil(remaining / 1000),
        elapsed: Math.ceil((now - startTime) / 1000)
      });
      
      if (remaining <= 0) {
        this.stop(timerId);
        callbacks.onExpired(timerId);
      }
    }, 100); // 100ms precision
    
    this.intervals.set(timerId, interval);
  }
  
  pause(timerId: string): number {
    // Return remaining time for resume
  }
  
  resume(timerId: string, remainingTime: number): void {
    // Restart with remaining time
  }
  
  stop(timerId: string): void {
    const interval = this.intervals.get(timerId);
    if (interval) {
      clearInterval(interval);
      this.intervals.delete(timerId);
    }
  }
}
```

### 3. Room Strategy

#### Per-Match Rooms
- **Room Naming**: `match:{matchId}` 
- **Automatic Joining**: Clients specify `matchId` in connection auth
- **Role-based Access**: 
  - `referee`: Full control permissions
  - `display`: Read-only, receives all updates
  - `spectator`: Limited updates (scores, timer, basic state)

#### Connection Flow
```typescript
// Socket auth middleware enhancement
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  const matchId = socket.handshake.auth?.matchId;
  
  if (token) {
    const payload = verifyRoomToken(token);
    if (payload) {
      socket.data = { 
        roomId: payload.roomId, 
        role: payload.role,
        matchId: matchId // New: match-specific room
      };
      
      // Join both scoreboard room and match room
      socket.join(`room:${payload.roomId}`);
      if (matchId) {
        socket.join(`match:${matchId}`);
        matchStateManager.joinMatchRoom(socket.id, matchId);
      }
      
      return next();
    }
  }
  
  // Allow connections without tokens for backwards compatibility
  return next();
});
```

### 4. Feature Toggle Implementation

#### Configuration
```typescript
interface FeatureFlags {
  enableRealTimeMatches: boolean;
  enableMatchTimers: boolean;
  enableRefereeControls: boolean;
  maxConcurrentMatches: number;
}

// Environment-based or config file
const MATCH_FEATURES: FeatureFlags = {
  enableRealTimeMatches: process.env.ENABLE_REALTIME_MATCHES === 'true',
  enableMatchTimers: process.env.ENABLE_MATCH_TIMERS === 'true',
  enableRefereeControls: process.env.ENABLE_REFEREE_CONTROLS === 'true',
  maxConcurrentMatches: parseInt(process.env.MAX_CONCURRENT_MATCHES || '10')
};
```

#### Conditional Event Handling
```typescript
// In socket handlers
socket.on('startTimer', (payload) => {
  if (!MATCH_FEATURES.enableMatchTimers) {
    socket.emit('error', { code: 'FEATURE_DISABLED', message: 'Match timers are disabled' });
    return;
  }
  
  // Handle timer start
  handleStartTimer(socket, payload);
});
```

### 5. React UI Components

#### Referee Control Panel
```tsx
interface RefereeControlsProps {
  matchId: string;
  matchState: MatchState;
  onTimerControl: (action: TimerAction) => void;
  onScoreUpdate: (team: string, points: number) => void;
  onPenaltyAdd: (team: string, penalty: PenaltyInfo) => void;
}

const RefereeControls: React.FC<RefereeControlsProps> = ({
  matchId,
  matchState,
  onTimerControl,
  onScoreUpdate,
  onPenaltyAdd
}) => {
  return (
    <div className="referee-controls">
      <TimerControls 
        timer={matchState.timer}
        onStart={() => onTimerControl({ type: 'start', matchId })}
        onPause={() => onTimerControl({ type: 'pause', matchId })}
        onStop={() => onTimerControl({ type: 'stop', matchId })}
      />
      
      <ScoreControls
        score={matchState.score}
        onUpdate={onScoreUpdate}
      />
      
      <PenaltyControls
        penalties={matchState.penalties}
        onAdd={onPenaltyAdd}
      />
      
      <RoundControls
        currentRound={matchState.currentRound}
        onRoundStart={handleRoundStart}
        onRoundEnd={handleRoundEnd}
      />
    </div>
  );
};
```

#### Timer Display Component
```tsx
interface TimerDisplayProps {
  timer: TimerState | null;
  size?: 'small' | 'medium' | 'large';
  showControls?: boolean;
}

const TimerDisplay: React.FC<TimerDisplayProps> = ({ timer, size = 'medium', showControls = false }) => {
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!timer) return <div className="timer-display timer-inactive">No Active Timer</div>;

  return (
    <div className={`timer-display timer-${size} timer-${timer.status}`}>
      <div className="timer-time">{formatTime(timer.remaining)}</div>
      <div className="timer-type">{timer.type.toUpperCase()}</div>
      {timer.status === 'running' && <div className="timer-pulse"></div>}
      
      {showControls && (
        <div className="timer-controls">
          {timer.status === 'running' && (
            <button onClick={() => onTimerPause()}>Pause</button>
          )}
          {timer.status === 'paused' && (
            <button onClick={() => onTimerResume()}>Resume</button>
          )}
          <button onClick={() => onTimerStop()}>Stop</button>
        </div>
      )}
    </div>
  );
};
```

#### Match State Display
```tsx
const MatchStateDisplay: React.FC<{ matchState: MatchState }> = ({ matchState }) => {
  return (
    <div className="match-state-display">
      <div className="match-header">
        <h2>{matchState.name}</h2>
        <div className={`match-status match-${matchState.status}`}>
          {matchState.status.toUpperCase()}
        </div>
      </div>
      
      <TimerDisplay timer={matchState.timer} size="large" />
      
      <div className="match-score">
        <div className="team-score">
          <span className="team-name">{matchState.teams[0].name}</span>
          <span className="score">{matchState.score.team1}</span>
        </div>
        <div className="vs">VS</div>
        <div className="team-score">
          <span className="team-name">{matchState.teams[1].name}</span>
          <span className="score">{matchState.score.team2}</span>
        </div>
      </div>
      
      {matchState.currentRound && (
        <div className="current-round">
          <h3>Round {matchState.currentRound.number}</h3>
          <p>{matchState.currentRound.theme}</p>
          <div className="round-type">{matchState.currentRound.type}</div>
        </div>
      )}
    </div>
  );
};
```

### 6. Reconnection & Sync Strategy

#### Client-side Reconnection
```typescript
class MatchSocketManager extends SocketManager {
  private matchId: string | null = null;
  private lastKnownState: MatchState | null = null;
  
  connectToMatch(matchId: string): void {
    this.matchId = matchId;
    
    // Enhanced connection with match info
    this.socket = io(this.serverUrl, {
      auth: {
        token: this.roomToken,
        matchId: matchId
      }
    });
    
    this.setupMatchEventListeners();
  }
  
  private setupMatchEventListeners(): void {
    this.socket.on('matchStateUpdate', (state: MatchState) => {
      this.lastKnownState = state;
      this.emit('stateSync', state);
    });
    
    this.socket.on('connect', () => {
      // Request full state sync on reconnection
      if (this.matchId) {
        this.socket.emit('getMatchState', { matchId: this.matchId });
      }
    });
    
    this.socket.on('timerUpdate', (timerState: TimerState) => {
      // High-frequency timer updates
      this.emit('timerSync', timerState);
    });
  }
  
  // Graceful degradation
  private handleDisconnection(): void {
    if (this.lastKnownState?.timer?.status === 'running') {
      // Continue timer locally with visual indicator of disconnection
      this.startLocalTimer(this.lastKnownState.timer);
    }
  }
}
```

#### Server-side State Recovery
```typescript
socket.on('getMatchState', ({ matchId }) => {
  const matchState = matchStateManager.getMatch(matchId);
  if (matchState) {
    socket.emit('matchStateUpdate', matchState);
    
    // If timer is active, send current timer state
    if (matchState.timer?.status === 'running') {
      const currentTimerState = timerManager.getCurrentState(matchState.timer.timerId);
      socket.emit('timerUpdate', currentTimerState);
    }
  } else {
    socket.emit('error', { code: 'MATCH_NOT_FOUND', matchId });
  }
});
```

### 7. Integration with Existing Functions

#### Scoreboard Compatibility
- Match timers integrate with existing round timer display
- Match scores can sync with scoreboard team scores
- Penalty tracking extends existing penalty system
- Logo/branding settings apply to match displays

#### Event Mapping
```typescript
// Map match events to existing scoreboard events
const mapMatchToScoreboardEvents = {
  'updateMatchScore': 'updateScore',
  'addPenalty': 'updatePenalty',
  'updateMatchSettings': 'updateVisibility',
  // etc.
};

// Bidirectional sync
socket.on('updateMatchScore', (payload) => {
  // Update match state
  matchStateManager.updateScore(payload.matchId, payload.team, payload.points);
  
  // Sync to scoreboard if in same room
  if (socket.data.roomId) {
    socket.to(`room:${socket.data.roomId}`).emit('updateScore', {
      teamId: payload.team,
      action: payload.points > 0 ? 'increment' : 'decrement'
    });
  }
});
```

### 8. QR + Mon-Pacing Interop Endpoints

- Base path: /api/interop/mon-pacing
- Token: Bearer JWT with payload { matchId, scope: 'monpacing' }

Endpoints
- POST /qr
  - Body: { matchId?: string, baseUrl?: string }
  - Response: { url: string, id: string, token: string }
  - Notes: id is the matchId used by mon-pacing; token is bound to that id.
- POST /plan
  - Headers: Authorization: Bearer <token>
  - Body: {
      version: 1,
      matchId: string,
      teams: [{ id: 'A'|'B', name: string, color?: string }, ...],
      rounds: Array<{ id: string, order: number, category?: string, theme?: string, minutes?: number, seconds?: number, type?: string, mixed?: boolean }>
    }
  - Behavior: creates or loads match and maps team names/colors. Rounds can be mapped to planning subsystem later.
- POST /event
  - Headers: Authorization: Bearer <token>
  - Body: {
      version: 1, matchId: string,
      type: 'timer'|'points'|'penalty'|string,
      payload?: any
    }
  - Timer payloads: { action: 'start'|'pause'|'resume'|'stop'|'set', durationSec?: number }
  - Points payloads: { team: 'A'|'B', points: number }
  - Penalty payloads: { team: 'A'|'B', kind: string }
  - Behavior: routes to server-side match/timer handlers and broadcasts to match:{matchId}

Security
- Tokens are short-lived JWTs signed with server secret, scoped to the matchId and interop scope.
- All interop endpoints require Authorization except /qr.

---

## Implementation Plan

### Phase 1: Core Infrastructure (Week 1-2)
1. **Backend State Management**
   - Implement MatchStateManager class
   - Add match-specific room handling
   - Create timer management system

2. **WebSocket Event Framework**
   - Define event schemas
   - Implement basic event handlers
   - Add feature toggle infrastructure

### Phase 2: Timer System (Week 2-3)
1. **Timer Implementation**
   - High-precision timer with 100ms updates
   - Pause/resume functionality
   - Multiple concurrent timers per match

2. **Real-time Synchronization**
   - Timer state broadcasting
   - Reconnection handling
   - Local timer fallback

### Phase 3: UI Components (Week 3-4)
1. **Referee Controls**
   - Timer control panel
   - Score and penalty management
   - Round progression controls

2. **Display Components**
   - Timer display for audience screens
   - Match state indicators
   - Integration with existing scoreboard UI

### Phase 4: Testing & Refinement (Week 4-5)
1. **Multi-device Testing**
   - Referee device + multiple displays
   - Network disconnection scenarios
   - Concurrent match handling

2. **Performance Optimization**
   - Timer precision under load
   - Memory management for long matches
   - State persistence optimization

### Phase 5: Documentation & Deployment (Week 5-6)
1. **User Documentation**
   - Referee control guide
   - Setup instructions
   - Troubleshooting guide

2. **Deployment Strategy**
   - Feature flag rollout
   - Monitoring and alerting
   - Rollback procedures

## Testing Strategy

### Multi-device Test Scenarios
1. **Basic Flow**
   - Referee starts match on mobile device
   - Timer displays on multiple screens
   - Score updates sync across all devices

2. **Network Resilience**
   - Disconnect referee device mid-timer
   - Verify displays continue showing time
   - Reconnect and verify state sync

3. **Concurrent Matches**
   - Multiple matches running simultaneously
   - Verify room isolation
   - Check performance under load

4. **Edge Cases**
   - Timer expiration during network outage
   - Referee device battery death
   - Server restart during active match

### Load Testing
- 50 concurrent matches with timers
- 200 connected display clients
- Network latency simulation
- Memory usage monitoring

## Risk Mitigation

### Technical Risks
1. **Timer Precision**: Use server-side authoritative timers with client-side prediction
2. **State Sync Issues**: Implement conflict resolution and state recovery mechanisms
3. **Performance Impact**: Monitor WebSocket connection load and implement rate limiting

### Operational Risks
1. **Feature Complexity**: Gradual rollout with feature toggles
2. **Backwards Compatibility**: Maintain existing scoreboard functionality unchanged
3. **User Training**: Comprehensive documentation and intuitive UI design

## Success Metrics

### Technical Metrics
- Timer accuracy within 100ms over 10-minute periods
- 99.9% uptime for match state synchronization
- <500ms latency for control actions
- Support for 50+ concurrent matches

### User Experience Metrics
- <2 second setup time for new matches
- Zero-learning-curve for basic timer controls
- Seamless failover during network issues
- Positive feedback from referee beta users

---

This design provides a comprehensive foundation for integrating real-time match pacing into your existing Socket.IO infrastructure while maintaining compatibility and providing robust, professional-grade functionality for competitive improvisation matches.
