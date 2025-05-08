import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import path from 'path';
import helmet from 'helmet';
import mongoose from 'mongoose';
import logger from './logging';
import { config } from './config';
import { setupAuth } from './auth';
import { setupDatabase, loadStateFromDB, saveStateToDB } from './db';
import { GameState, Matchup } from './types';

const app = express();
const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, {
    cors: {
        origin: config.cors.allowedOrigins,
        methods: ['GET', 'POST']
    }
});

// Initialize game state
let currentMatchup: Matchup | null = null;
let scores: Record<string, number> = {};
let contestants: string[] = [];
let matchHistory: Matchup[] = [];

// Middleware
app.use(cors({
    origin: config.cors.origin,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}));
app.use(helmet());
app.use(express.json());

// Socket.IO event handlers
io.on('connection', (socket) => {
    logger.info('Client connected');
    
    // Send current state to new client
    socket.emit('state_update', {
        currentMatchup,
        scores,
        contestants,
        matchHistory
    });

    // Handle client events
    socket.on('update_matchup', (data: Matchup) => {
        currentMatchup = data;
        io.emit('matchup_updated', currentMatchup);
        saveStateToDB();
    });

    socket.on('update_score', (data: Record<string, number>) => {
        scores = { ...scores, ...data };
        io.emit('scores_updated', scores);
        saveStateToDB();
    });

    socket.on('update_contestants', (data: string[]) => {
        contestants = data;
        io.emit('contestants_updated', contestants);
        saveStateToDB();
    });

    socket.on('add_to_history', (data: Matchup) => {
        matchHistory.push(data);
        io.emit('history_updated', matchHistory);
        saveStateToDB();
    });

    socket.on('disconnect', () => {
        logger.info('Client disconnected');
    });
});

// Start server
const start = async () => {
    try {
        await setupDatabase();
        await setupAuth(app);
        
        const state = await loadStateFromDB();
        if (state) {
            currentMatchup = state.currentMatchup;
            scores = state.scores;
            contestants = state.contestants;
            matchHistory = state.matchHistory;
        }

        // The 'host' for httpServer.listen is implicitly 0.0.0.0
        // when no host argument is provided and the underlying express app is configured to listen on all interfaces
        // by default.
        httpServer.listen(Number(config.port), () => {
            logger.info(`🚀 Server listening at http://${config.host}:${config.port}`);
            logger.info('   WebSocket connections enabled.');
            logger.info('   CORS enabled for development origins.');
        });
    } catch (error) {
        logger.error('Failed to start server:', error);
        process.exit(1);
    }
};

start();

// Handle process termination
process.on('SIGTERM', () => {
    logger.info('SIGTERM received. Shutting down gracefully...');
    httpServer.close(() => {
        logger.info('Server closed');
        mongoose.connection.close(false, () => {
            logger.info('MongoDB connection closed');
            process.exit(0);
        });
    });
});
