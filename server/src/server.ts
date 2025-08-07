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
app.use('/api', apiRoutes);

// Configure static file serving and environment
const isProd = isProduction();
configureStaticServing(app, isProd);
configureLogging(isProd);

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
