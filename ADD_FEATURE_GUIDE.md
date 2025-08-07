# Adding New Features to Improvscoreboard

This guide demonstrates how to add new features using the modular architecture, using a "game timer" feature as an example.

## Example Feature: Game Timer

### 1. Add Types (in /types/)
```typescript
// In scoreboard.types.ts
interface TimerState {
    isRunning: boolean;
    duration: number;  // in seconds
    currentTime: number;
    isPaused: boolean;
}

// Update ScoreboardState
interface ScoreboardState {
    // ... existing properties ...
    timer: TimerState;
}
```

### 2. Add State Management (in /modules/state/)
```typescript
// In state/timer.ts
import { TimerState } from '../../types/scoreboard.types';
import { getState, updateState } from './index';

const initialTimerState: TimerState = {
    isRunning: false,
    duration: 180, // 3 minutes default
    currentTime: 180,
    isPaused: false
};

export const startTimer = (): void => {
    updateState({
        timer: {
            ...getState().timer,
            isRunning: true,
            isPaused: false
        }
    });
};

export const pauseTimer = (): void => {
    updateState({
        timer: {
            ...getState().timer,
            isPaused: true
        }
    });
};

export const resetTimer = (duration?: number): void => {
    updateState({
        timer: {
            ...initialTimerState,
            duration: duration ?? initialTimerState.duration,
            currentTime: duration ?? initialTimerState.duration
        }
    });
};

export const updateTimerTick = (): void => {
    const state = getState();
    if (state.timer.isRunning && !state.timer.isPaused && state.timer.currentTime > 0) {
        updateState({
            timer: {
                ...state.timer,
                currentTime: state.timer.currentTime - 1
            }
        });
    }
};
```

### 3. Add WebSocket Events (in /types/events.types.ts)
```typescript
// Add to ClientToServerEvents
interface ClientToServerEvents {
    // ... existing events ...
    startTimer: () => void;
    pauseTimer: () => void;
    resetTimer: (duration?: number) => void;
}

// Add to ServerToClientEvents if needed
interface ServerToClientEvents {
    // ... existing events ...
    timerTick: (currentTime: number) => void;
}
```

### 4. Update Socket Handlers (in /modules/socket/handlers.ts)
```typescript
// Add new handlers
socket.on('startTimer', () => {
    console.log(`Received startTimer from ${socket.id}`);
    startTimer();
    broadcastState(io);
});

socket.on('pauseTimer', () => {
    console.log(`Received pauseTimer from ${socket.id}`);
    pauseTimer();
    broadcastState(io);
});

socket.on('resetTimer', (duration) => {
    console.log(`Received resetTimer from ${socket.id} with duration:`, duration);
    resetTimer(duration);
    broadcastState(io);
});
```

### 5. Add Timer Logic to Server (in server.ts)
```typescript
// Add timer interval
const timerInterval = setInterval(() => {
    const state = getState();
    if (state.timer.isRunning && !state.timer.isPaused) {
        updateTimerTick();
        broadcastState(io);
    }
}, 1000);

// Clean up in shutdown
const shutdown = () => {
    clearInterval(timerInterval);
    // ... existing shutdown logic ...
};
```

### 6. Update API Routes (optional, in /modules/api/routes.ts)
```typescript
// Add REST endpoints if needed
router.post('/timer/start', (req: Request, res: Response) => {
    startTimer();
    res.json(getState());
});

router.post('/timer/pause', (req: Request, res: Response) => {
    pauseTimer();
    res.json(getState());
});
```

### 7. Add to Tests
```powershell
# In test_websocket.ps1
# Add timer test messages
{
    "startTimer": {}
}

{
    "pauseTimer": {}
}

{
    "resetTimer": { "duration": 300 }
}
```

## Benefits of Modular Structure

1. **Clear Separation of Concerns**
   - Types in their own files
   - State management isolated
   - WebSocket handlers organized
   - API routes separate

2. **Easy to Add Features**
   - Follow the pattern above
   - Minimal changes to existing code
   - Clear locations for new code

3. **Maintainable Testing**
   - Add tests following existing patterns
   - Clear test organization
   - Easy to verify new functionality

## Adding Your Own Features

1. Start with types
2. Add state management
3. Create WebSocket events
4. Update handlers
5. Add API routes if needed
6. Add tests
7. Document in DEV_NOTES.md

