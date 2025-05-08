import express, { Request, Response } from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import helmet from 'helmet';
import { AppDataSource } from './db/connection';
import morgan from 'morgan';
import config from './config';
import { authRoutes, authenticate, authorize, setupInitialAdmin } from './auth';
import logger, { stream } from './logging';
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
// Get port from config
const port = config.server.port;

// Get allowed origins from config
const allowedOrigins = config.cors.allowedOrigins;

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

// Add HTTP request logging
app.use(morgan('combined', { stream }));

// Add security headers with helmet
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "blob:"],
        connectSrc: ["'self'", "ws:", "wss:"], // Allow WebSocket connections
      },
    },
    xssFilter: true,
    noSniff: true,
    referrerPolicy: { policy: 'same-origin' },
  })
);

// Add HSTS header in production
if (config.server.isProduction) {
  app.use(
    helmet.hsts({
      maxAge: 31536000, // 1 year in seconds
      includeSubDomains: true,
      preload: true,
    })
  );
}

// --- Socket.IO Setup ---
const io = new Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>(
  server, {
  cors: corsOptions // Use the same CORS options for Socket.IO
});

const broadcastState = () => {
  const currentState = getState();
  logger.info('Broadcasting state update');
  try {
    io.emit('updateState', currentState);
    logger.info('State broadcast successful.');
  } catch (error) {
    logger.error('Error during io.emit in broadcastState:', error);
    logger.error('State object being broadcast:', currentState);
  }
};

io.on('connection', (socket) => {
  logger.info(`Client connected: ${socket.id}`);

  // Send the current state to the newly connected client
  socket.emit('updateState', getState());

  // Handle events from the client
  socket.on('updateTeam', (payload: UpdateTeamPayload) => {
    logger.info(`Received updateTeam from ${socket.id}:`, payload);
    // Check if payload.updates exists and has keys before proceeding
    if (payload.updates && Object.keys(payload.updates).length > 0) {
      // Pass the nested updates object directly to the state function
      updateTeamInState(payload.teamId, payload.updates);
      broadcastState(); // Broadcast the change
    } else {
      logger.warn(`Received updateTeam from ${socket.id} without valid updates in payload.updates`);
    }
  });

  socket.on('updateScore', (payload: UpdateScorePayload) => {
    logger.info(`Received updateScore from ${socket.id}:`, payload);
    const actionString = payload.action > 0 ? 'increment' : 'decrement';
    updateScoreInState(payload.teamId, actionString);
    broadcastState();
  });

  socket.on('updatePenalty', (payload: UpdatePenaltyPayload) => {
    logger.info(`Received updatePenalty from ${socket.id}:`, payload);
    updatePenaltyInState(payload.teamId, payload.type);
    broadcastState();
  });

  socket.on('resetPenalties', (payload: ResetPenaltiesPayload) => {
    logger.info(`Received resetPenalties from ${socket.id}:`, payload);
    resetPenaltiesInState(payload.teamId);
    broadcastState();
  });

  socket.on('resetAll', () => {
    logger.info(`Received resetAll from ${socket.id}`);
    resetAllInState();
    broadcastState();
  });

  socket.on('updateLogo', (newLogoUrl: string | null) => {
    logger.info(`Received updateLogo from ${socket.id}. URL Length: ${newLogoUrl ? newLogoUrl.length : 'null'}`);
    updateState({ logoUrl: newLogoUrl });
    broadcastState();
  });

  socket.on('updateText', (payload: UpdateTextPayload) => {
    const { field, text } = payload;
    if (field === 'titleText' || field === 'footerText') {
      logger.info(`Received updateText from ${socket.id}. Field: ${field}, Text: ${text}`);
      updateState({ [field]: text ? text.trim() : null });
      broadcastState();
    } else {
      logger.warn(`Invalid field "${field}" received for updateText from ${socket.id}`);
    }
  });

  // Handler for updating text styles (color, size)
  socket.on('updateTextStyle', (payload: UpdateTextStylePayload) => {
    logger.info(`Received updateTextStyle from ${socket.id}:`, payload);
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
    logger.info(`Received updateLogoSize from ${socket.id}:`, payload);
    updateState({ logoSize: payload.size });
    broadcastState();
  });

  socket.on('updateVisibility', (payload: UpdateVisibilityPayload) => {
    logger.info(`Received updateVisibility from ${socket.id}:`, payload);
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
      logger.warn(`Invalid target received for updateVisibility from ${socket.id}: ${payload.target}`);
    }
  });

  // Handler for switching team emojis
  socket.on('switchTeamEmojis', () => {
    logger.info(`Received switchTeamEmojis from ${socket.id}`);
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
    logger.info(`Client disconnected: ${socket.id}, Reason: ${reason}`);
  });
});

// --- REST API Endpoints ---
// Authentication routes
app.use('/api/auth', authRoutes);

// Public state endpoint (read-only)
app.get('/api/state', (req: Request, res: Response) => {
  res.json(getState());
});

// Protected control panel routes
app.post('/api/control/score/:teamId/:action', authenticate, (req: Request, res: Response) => {
  const { teamId, action } = req.params;
  if ((teamId === 'team1' || teamId === 'team2') && (action === 'increment' || action === 'decrement')) {
    updateScoreInState(teamId as 'team1' | 'team2', action as 'increment' | 'decrement');
    broadcastState(); // Also broadcast changes made via REST
    res.json(getState());
  } else {
    res.status(400).json({ message: 'Invalid team ID or action' });
  }
});

app.post('/api/control/team/:teamId', authenticate, (req: Request, res: Response) => {
  const { teamId } = req.params;
  const updates = req.body;
  
  if (teamId === 'team1' || teamId === 'team2') {
    updateTeamInState(teamId as 'team1' | 'team2', updates);
    broadcastState();
    res.json(getState());
  } else {
    res.status(400).json({ message: 'Invalid team ID' });
  }
});

app.post('/api/control/reset', authenticate, (req: Request, res: Response) => {
  resetAllInState();
  broadcastState();
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
// Get client build path from config
const clientBuildPath = config.paths.clientBuildPath;

if (config.server.isProduction) {
  logger.info(`Serving static files from: ${clientBuildPath}`);
  // Serve static files from the React app build directory
  app.use(express.static(clientBuildPath));

  // The "catchall" handler: for any request that doesn't
  // match one above, send back React's index.html file.
  app.get('*', (req, res) => {
    const indexPath = path.resolve(clientBuildPath, 'index.html');
    logger.info(`Attempting to serve index.html from: ${indexPath}`);
    res.sendFile(indexPath, (err) => {
      if (err) {
        logger.error("Error sending index.html:", err);
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
const isProduction = config.server.isProduction;

const listenOptions: ListenOptions = {
  port: port,
};

if (isProduction) {
  listenOptions.host = '0.0.0.0'; // Listen on all interfaces in prod
}

const startCallback = async () => {
  const address = listenOptions.host || 'localhost'; // Log appropriately
  logger.info(`🚀 Server listening at http://${address}:${port}`);
  logger.info(`   WebSocket connections enabled.`);
  if (isProduction) {
    logger.info(`   Serving frontend from: ${clientBuildPath}`);
    logger.info(`   Accepting connections from network.`);
  } else {
    logger.info(`   CORS enabled for development origins.`);
    logger.info(`   Run 'npm run dev:client' in another terminal for frontend.`);
  }
  
  // Log database status
  if (AppDataSource.isInitialized) {
    logger.info(`   Connected to SQLite database at ${config.db.sqliteDbPath}`);
    
    // Setup initial admin user
    try {
      await setupInitialAdmin();
    } catch (error) {
      logger.error('Error setting up initial admin user:', error);
    }
  } else {
    logger.info(`   Running with in-memory state (no database connection)`);
  }
};

// Use the signature: listen(options: ListenOptions, listeningListener?: () => void)
server.listen(listenOptions, startCallback);
