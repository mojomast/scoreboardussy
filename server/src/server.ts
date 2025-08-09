import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import {
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
} from './types/events.types';
import {
    corsOptions,
    configureStaticServing,
    configureMiddleware,
    configureLogging,
    getListenOptions,
    isProduction
} from './modules/config';
import { initializeSocketHandlers } from './modules/socket/handlers';
import apiRoutes from './modules/api/routes';
import roomRoutes from './modules/rooms/routes';
import { verifyRoomToken } from './modules/auth/tokens';
import { createAdapter } from '@socket.io/redis-adapter';
import { loadPersistedState } from './modules/state';

// Create Express app and HTTP server
const app = express();
const server = http.createServer(app);

// Initialize Socket.IO with type definitions
const io = new Server<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
>(server, {
    cors: corsOptions
});

// Configure Express middleware and settings
configureMiddleware(app);

// Mount API routes
app.use('/api/rooms', roomRoutes);
app.use('/api', apiRoutes);

// Configure static file serving and environment
const isProd = isProduction();
configureStaticServing(app, isProd);
configureLogging(isProd);

// Optional Socket.IO Redis adapter (M2 scaffolding)
(async () => {
    try {
        const redisUrl = process.env.REDIS_URL;
        if (redisUrl) {
            const { default: Redis } = await import('ioredis');
            const pubClient = new Redis(redisUrl);
            const subClient = pubClient.duplicate();
            io.adapter(createAdapter(pubClient as any, subClient as any));
            console.log('Socket.IO Redis adapter enabled');
        }
    } catch (e) {
        console.warn('Socket.IO Redis adapter not enabled:', e);
    }
})();

// Socket auth middleware (M1): accept optional token and join room channel
io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers['x-room-token'];
    if (typeof token === 'string') {
        const payload = verifyRoomToken(token);
        if (payload) {
            socket.data = { ...(socket.data || {}), roomId: payload.roomId, role: payload.role } as any;
            // Join a Socket.IO room for later room-scoped broadcasts
            socket.join(`room:${payload.roomId}`);
            return next();
        } else {
            console.warn(`Socket auth token invalid for ${socket.id}, continuing as guest`);
        }
    }
    // Backward-compatible: allow connection without token
    return next();
});

// Import template initialization function
import { initializeDefaultTemplates } from './modules/state/rounds/templates';

// Load persisted state if available
(async () => {
    try {
        const stateLoaded = await loadPersistedState();
        console.log(stateLoaded
            ? '✅ Persisted state loaded successfully'
            : '⚠️ No persisted state found, using default state');
    } catch (error) {
        console.error('❌ Error loading persisted state:', error);
        console.log('⚠️ Continuing with default state');
    }
    
    // Initialize socket handlers after state is loaded
    initializeSocketHandlers(io);
    
    // Initialize default templates (only if not already in loaded state)
    initializeDefaultTemplates();
})();

// Start the server
const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;
const listenOptions = getListenOptions(port, isProd);

server.listen(listenOptions, () => {
    const address = listenOptions.host || 'localhost';
    console.log(`🚀 Server listening at http://${address}:${port}`);
    console.log(`   WebSocket connections enabled.`);
    
    if (isProd) {
        console.log(`   Serving frontend from client/dist`);
        console.log(`   Accepting connections from network.`);
    } else {
        console.log(`   CORS enabled for development origins.`);
        console.log(`   Run 'npm run dev:client' in another terminal for frontend.`);
    }
});

// Handle server shutdown gracefully
const shutdown = () => {
    console.log('\nShutting down server...');
    server.close(() => {
        console.log('Server shutdown complete.');
        process.exit(0);
    });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
