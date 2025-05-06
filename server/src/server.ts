import express, { Request, Response } from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import {
  getState,
  updateTeam as updateTeamInState,
  updateScore as updateScoreInState,
  updatePenalty as updatePenaltyInState,
  resetPenalties as resetPenaltiesInState,
  resetAll as resetAllInState,
  updateState
} from './state';
import {
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
  UpdateTeamPayload,
  UpdateScorePayload,
  UpdatePenaltyPayload,
  ResetPenaltiesPayload,
  Team,
  ScoreboardState,
  UpdateTextPayload,
  UpdateTextStylePayload,
  UpdateLogoSizePayload,
  UpdateVisibilityPayload // Import the new payload type
} from './types';
import { ListenOptions } from 'net'; // Import ListenOptions

const app = express();
const server = http.createServer(app);
// Ensure port is a number
const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;

// Explicitly define allowed origins
const allowedOrigins = [
  'http://localhost:5173', // Vite dev server
  'http://127.0.0.1:5173',
  // Add production frontend URL here later
  // e.g., 'https://your-scoreboard-app.com'
];

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = `The CORS policy for this site does not allow access from the specified Origin: ${origin}`;
      console.error(msg);
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true, // If you need to handle cookies or authorization headers
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Enable pre-flight requests for all routes
app.use(express.json()); // Middleware to parse JSON bodies

// --- Socket.IO Setup ---
const io = new Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>(
  server, {
  cors: corsOptions // Use the same CORS options for Socket.IO
});

const broadcastState = () => {
  const currentState = getState();
  console.log('Broadcasting state update');
  try {
    io.emit('updateState', currentState);
    console.log('State broadcast successful.');
  } catch (error) {
    console.error('!!! Error during io.emit in broadcastState:', error);
    console.error('!!! State object being broadcast:', currentState);
  }
};

io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

  // Send the current state to the newly connected client
  socket.emit('updateState', getState());

  // Handle events from the client
  socket.on('updateTeam', (payload: UpdateTeamPayload) => {
    console.log(`Received updateTeam from ${socket.id}:`, payload);
    // Check if payload.updates exists and has keys before proceeding
    if (payload.updates && Object.keys(payload.updates).length > 0) {
      // Pass the nested updates object directly to the state function
      updateTeamInState(payload.teamId, payload.updates);
      broadcastState(); // Broadcast the change
    } else {
      console.warn(`Received updateTeam from ${socket.id} without valid updates in payload.updates`);
    }
  });

  socket.on('updateScore', (payload: UpdateScorePayload) => {
    console.log(`Received updateScore from ${socket.id}:`, payload);
    const actionString = payload.action > 0 ? 'increment' : 'decrement';
    updateScoreInState(payload.teamId, actionString);
    broadcastState();
  });

  socket.on('updatePenalty', (payload: UpdatePenaltyPayload) => {
    console.log(`Received updatePenalty from ${socket.id}:`, payload);
    updatePenaltyInState(payload.teamId, payload.type);
    broadcastState();
  });

  socket.on('resetPenalties', (payload: ResetPenaltiesPayload) => {
    console.log(`Received resetPenalties from ${socket.id}:`, payload);
    resetPenaltiesInState(payload.teamId);
    broadcastState();
  });

  socket.on('resetAll', () => {
    console.log(`Received resetAll from ${socket.id}`);
    resetAllInState();
    broadcastState();
  });

  socket.on('updateLogo', (newLogoUrl: string | null) => {
    console.log(`Received updateLogo from ${socket.id}. URL Length: ${newLogoUrl ? newLogoUrl.length : 'null'}`);
    updateState({ logoUrl: newLogoUrl });
    broadcastState();
  });

  socket.on('updateText', (payload: UpdateTextPayload) => {
    const { field, text } = payload;
    if (field === 'titleText' || field === 'footerText') {
      console.log(`Received updateText from ${socket.id}. Field: ${field}, Text: ${text}`);
      updateState({ [field]: text ? text.trim() : null });
      broadcastState();
    } else {
      console.warn(`Invalid field "${field}" received for updateText from ${socket.id}`);
    }
  });

  // Handler for updating text styles (color, size)
  socket.on('updateTextStyle', (payload: UpdateTextStylePayload) => {
    console.log(`Received updateTextStyle from ${socket.id}:`, payload);
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
      updateState(updates); // Use the generic updateState
      broadcastState();
    }
  });

  socket.on('updateLogoSize', (payload: UpdateLogoSizePayload) => {
    console.log(`Received updateLogoSize from ${socket.id}:`, payload);
    updateState({ logoSize: payload.size });
    broadcastState();
  });

  socket.on('updateVisibility', (payload: UpdateVisibilityPayload) => {
    console.log(`Received updateVisibility from ${socket.id}:`, payload);
    const stateUpdate: Partial<ScoreboardState> = {};
    if (payload.target === 'score') {
      stateUpdate.showScore = payload.visible;
    } else if (payload.target === 'penalties') {
      stateUpdate.showPenalties = payload.visible;
    } else if (payload.target === 'emojis') {
      stateUpdate.showEmojis = payload.visible;
    }

    if (Object.keys(stateUpdate).length > 0) {
      updateState(stateUpdate);
      broadcastState();
    } else {
      console.warn(`Invalid target received for updateVisibility from ${socket.id}: ${payload.target}`);
    }
  });

  // Handler for switching team emojis
  socket.on('switchTeamEmojis', () => {
    console.log(`Received switchTeamEmojis from ${socket.id}`);
    const currentState = getState();
    const currentEmoji1 = currentState.team1Emoji;
    const currentEmoji2 = currentState.team2Emoji;

    // Simple swap logic for now:
    // If team 1 has null/fist, it gets hand, team 2 gets fist.
    // If team 1 has hand, it gets fist, team 2 gets hand.
    let nextEmoji1: 'hand' | 'fist' | null = null;
    let nextEmoji2: 'hand' | 'fist' | null = null;

    if (currentEmoji1 === 'hand') {
      nextEmoji1 = 'fist';
      nextEmoji2 = 'hand';
    } else { // Covers null and 'fist'
      nextEmoji1 = 'hand';
      nextEmoji2 = 'fist';
    }

    const stateUpdate: Partial<ScoreboardState> = {
      team1Emoji: nextEmoji1,
      team2Emoji: nextEmoji2,
    };

    updateState(stateUpdate);
    broadcastState();
  });

  socket.on('disconnect', (reason) => {
    console.log(`Client disconnected: ${socket.id}, Reason: ${reason}`);
  });
});

// --- REST API Endpoints (Optional Fallback/Alternative) ---
app.get('/api/state', (req: Request, res: Response) => {
  res.json(getState());
});

// Example POST endpoint (demonstrates how you might add more)
app.post('/api/score/:teamId/:action', (req: Request, res: Response) => {
  const { teamId, action } = req.params;
  if ((teamId === 'team1' || teamId === 'team2') && (action === 'increment' || action === 'decrement')) {
    updateScoreInState(teamId as 'team1' | 'team2', action as 'increment' | 'decrement');
    broadcastState(); // Also broadcast changes made via REST
    res.json(getState());
  } else {
    res.status(400).json({ message: 'Invalid team ID or action' });
  }
});

// --- Serve Frontend Statically (for Production) ---
// Resolve the path to the client's build directory relative to the server directory
const clientBuildPath = path.resolve(__dirname, '../../client/dist');

if (process.env.NODE_ENV === 'production') {
  console.log(`Serving static files from: ${clientBuildPath}`);
  // Serve static files from the React app build directory
  app.use(express.static(clientBuildPath));

  // The "catchall" handler: for any request that doesn't
  // match one above, send back React's index.html file.
  app.get('*', (req, res) => {
    const indexPath = path.resolve(clientBuildPath, 'index.html');
    console.log(`Attempting to serve index.html from: ${indexPath}`);
    res.sendFile(indexPath, (err) => {
      if (err) {
        console.error("Error sending index.html:", err);
        // If file not found, maybe log and send a generic 404?
        if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
          res.status(404).send('Resource not found');
        } else {
          res.status(500).send('Internal Server Error');
        }
      }
    });
  });
}

// --- Start Server ---
const isProduction = process.env.NODE_ENV === 'production';

const listenOptions: ListenOptions = {
  port: port,
};

if (isProduction) {
  listenOptions.host = '0.0.0.0'; // Listen on all interfaces in prod
}

const startCallback = () => {
  const address = listenOptions.host || 'localhost'; // Log appropriately
  console.log(`🚀 Server listening at http://${address}:${port}`);
  console.log(`   WebSocket connections enabled.`);
  if (isProduction) {
    console.log(`   Serving frontend from: ${clientBuildPath}`);
    console.log(`   Accepting connections from network.`);
  } else {
    console.log(`   CORS enabled for development origins.`);
    console.log(`   Run 'npm run dev:client' in another terminal for frontend.`);
  }
};

// Use the signature: listen(options: ListenOptions, listeningListener?: () => void)
server.listen(listenOptions, startCallback);
