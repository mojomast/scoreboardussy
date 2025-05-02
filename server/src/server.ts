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
  UpdateTextStylePayload // Import the new payload type
} from './types';

const app = express();
const server = http.createServer(app);
const port = process.env.PORT || 3001;

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
  io.emit('updateState', currentState);
};

io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

  // Send the current state to the newly connected client
  socket.emit('updateState', getState());

  // Handle events from the client
  socket.on('updateTeam', (payload: UpdateTeamPayload) => {
    console.log(`Received updateTeam from ${socket.id}:`, payload);
    const updates: Partial<Pick<Team, 'name' | 'color'>> = {};
    if (payload.name !== undefined) updates.name = payload.name;
    if (payload.color !== undefined) updates.color = payload.color;
    if (Object.keys(updates).length > 0) {
      updateTeamInState(payload.teamId, updates);
    }
    broadcastState();
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
server.listen(port, () => {
  console.log(`🚀 Server listening at http://localhost:${port}`);
  console.log(`   WebSocket connections enabled.`);
  if (process.env.NODE_ENV === 'production') {
    console.log(`   Serving frontend from: ${clientBuildPath}`);
  } else {
    console.log(`   CORS enabled for development origins.`);
    console.log(`   Run 'npm run dev:client' in another terminal for frontend.`);
  }
});
