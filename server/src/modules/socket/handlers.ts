import { logger } from '../config/logger';
import { Server, Socket } from 'socket.io';
import {
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
} from '../../types/events.types';
import {
    getState,
    updateTeam,
    updateScore,
    updatePenalty,
    resetPenalties,
    resetAllState,
    updateLogoUrl,
    updateText,
    updateTextStyle,
    updateLogoSize,
    updateVisibility,
    switchTeamEmojis,
    // Round-related imports
    startRound,
    saveRoundResults,
    resetRounds,
    createNextRound,
    updateRoundSetting,
    // Planning + lifecycle
    setNextRoundDraft,
    enqueueUpcoming,
    dequeueUpcoming,
    startGame,
    finishGame,
    // Template management
    saveTemplate,
    updateTemplate,
    deleteTemplate,
    // Playlist management
    createPlaylist,
    updatePlaylist,
    deletePlaylist,
    startPlaylist,
    stopPlaylist,
    nextInPlaylist,
    previousInPlaylist
} from '../state';
import { matchStateManager } from '../state/matches';

type IoServer = Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;
type IoSocket = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;
// Broadcast state to all connected clients (M1: global)
// TODO(M2): room-scoped broadcasting using socket rooms and per-room state
const broadcastState = (io: IoServer, roomId?: string) => {
    const currentState = getState();
    logger.info('Broadcasting state update');
    try {
        if (roomId) {
            io.to(`room:${roomId}`).emit('updateState', currentState);
        } else {
            io.emit('updateState', currentState);
        }
        logger.info('State broadcast successful.');
    } catch (error) {
        logger.error('!!! Error during io.emit in broadcastState:', error);
        logger.error('!!! State object being broadcast:', currentState);
    }
};

// Initialize socket connection and set up event handlers
export const initializeSocketHandlers = (io: IoServer) => {
io.on('connection', (socket: IoSocket) => { matchStateManager.attachIo(io as any);
        logger.info(`Client connected: ${socket.id}`);

// Send initial state to newly connected client
        socket.emit('updateState', getState());
        const roomId: string | undefined = (socket.data as any)?.roomId;

        // Feature flags (env-driven)
        const ENABLE_MATCHES = process.env.ENABLE_REALTIME_MATCHES === 'true';
        const ENABLE_TIMERS = process.env.ENABLE_MATCH_TIMERS !== 'false';

        // --- Real-time match integration ---
        socket.on('joinMatch', ({ matchId }) => {
            if (!ENABLE_MATCHES) return;
            try {
                socket.join(`match:${matchId}`);
                const state = matchStateManager.getMatch(matchId);
                if (state) {
                    socket.emit('matchStateUpdate', state);
                }
            } catch (error) {
                logger.error('joinMatch error:', error);
            }
        });

        socket.on('leaveMatch', ({ matchId }) => {
            if (!ENABLE_MATCHES) return;
            try {
                socket.leave(`match:${matchId}`);
            } catch (error) {
                logger.error('leaveMatch error:', error);
            }
        });

        socket.on('createMatch', (payload) => {
            if (!ENABLE_MATCHES) return;
            try {
                const id = matchStateManager.createMatch(payload);
                const state = matchStateManager.getMatch(id);
                if (state) {
                    io.to(`match:${id}`).emit('matchStateUpdate', state);
                }
            } catch (error) {
                logger.error('createMatch error:', error);
            }
        });

        socket.on('getMatchState', ({ matchId }) => {
            if (!ENABLE_MATCHES) return;
            const state = matchStateManager.getMatch(matchId);
            if (state) socket.emit('matchStateUpdate', state);
        });

        socket.on('startTimer', (payload) => {
            if (!ENABLE_MATCHES || !ENABLE_TIMERS) return;
            try {
                const timer = matchStateManager.startTimer(payload);
                if (timer) {
                    io.to(`match:${payload.matchId}`).emit('timerUpdate', timer);
                }
            } catch (error) {
                logger.error('startTimer error:', error);
            }
        });

        socket.on('pauseTimer', (payload) => {
            if (!ENABLE_MATCHES || !ENABLE_TIMERS) return;
            try {
                matchStateManager.pauseTimer(payload);
                const state = matchStateManager.getMatch(payload.matchId);
                if (state?.timer) io.to(`match:${payload.matchId}`).emit('timerUpdate', state.timer);
            } catch (error) {
                logger.error('pauseTimer error:', error);
            }
        });

        socket.on('resumeTimer', (payload) => {
            if (!ENABLE_MATCHES || !ENABLE_TIMERS) return;
            try {
                matchStateManager.resumeTimer(payload);
            } catch (error) {
                logger.error('resumeTimer error:', error);
            }
        });

        socket.on('stopTimer', (payload) => {
            if (!ENABLE_MATCHES || !ENABLE_TIMERS) return;
            try {
                matchStateManager.stopTimer(payload);
                const state = matchStateManager.getMatch(payload.matchId);
                if (state) io.to(`match:${payload.matchId}`).emit('matchStateUpdate', state);
            } catch (error) {
                logger.error('stopTimer error:', error);
            }
        });

        socket.on('setTimerDuration', (payload) => {
            if (!ENABLE_MATCHES || !ENABLE_TIMERS) return;
            try {
                matchStateManager.setTimerDuration(payload);
                const state = matchStateManager.getMatch(payload.matchId);
                if (state?.timer) io.to(`match:${payload.matchId}`).emit('timerUpdate', state.timer);
            } catch (error) {
                logger.error('setTimerDuration error:', error);
            }
        });

        socket.on('updateMatchScore', (payload) => {
            if (!ENABLE_MATCHES) return;
            try {
                matchStateManager.updateScore(payload);
            } catch (error) {
                logger.error('updateMatchScore error:', error);
            }
        });

        socket.on('addPenalty', (payload) => {
            if (!ENABLE_MATCHES) return;
            try {
                matchStateManager.addPenalty(payload);
            } catch (error) {
                logger.error('addPenalty error:', error);
            }
        });

        // Handle team updates
        socket.on('updateTeam', (payload) => {
            logger.info(`Received updateTeam from ${socket.id}:`, payload);
            if (payload.updates && Object.keys(payload.updates).length > 0) {
updateTeam(payload.teamId, payload.updates);
                broadcastState(io, roomId);
            } else {
                logger.warn(`Received updateTeam from ${socket.id} without valid updates`);
            }
        });

        // Handle score updates
        socket.on('updateScore', (payload) => {
            logger.info(`Received updateScore from ${socket.id}:`, payload);
            const action = payload.action > 0 ? 'increment' : 'decrement';
updateScore(payload.teamId, action);
            broadcastState(io, roomId);
        });

        // Handle scoring mode changes
        socket.on('setScoringMode', (payload) => {
            logger.info(`Received setScoringMode from ${socket.id}:`, payload.mode);
            try {
                const mode = payload.mode === 'manual' ? 'manual' : 'round';
                // updateState is imported via ../state through re-exports
require('../state').updateState({ scoringMode: mode });
                broadcastState(io, roomId);
            } catch (error) {
                logger.error('Error setting scoring mode:', error);
                socket.emit('updateState', getState());
            }
        });

        // Handle penalty updates
        socket.on('updatePenalty', (payload) => {
            logger.info(`Received updatePenalty from ${socket.id}:`, payload);
updatePenalty(payload.teamId, payload.type);
            broadcastState(io, roomId);
        });

        // Handle penalty resets
        socket.on('resetPenalties', (payload) => {
            logger.info(`Received resetPenalties from ${socket.id}:`, payload);
resetPenalties(payload.teamId);
            broadcastState(io, roomId);
        });

        // Handle full reset
        socket.on('resetAll', () => {
            logger.info(`Received resetAll from ${socket.id}`);
resetAllState();
            broadcastState(io, roomId);
        });

        // Handle logo updates
        socket.on('updateLogo', (newLogoUrl) => {
            logger.info(`Received updateLogo from ${socket.id}. URL Length: ${newLogoUrl ? newLogoUrl.length : 'null'}`);
updateLogoUrl(newLogoUrl);
            broadcastState(io, roomId);
        });

        // Handle text updates
        socket.on('updateText', (payload) => {
            logger.info(`Received updateText from ${socket.id}. Field: ${payload.field}`);
updateText(payload);
            broadcastState(io, roomId);
        });

        // Handle text style updates
        socket.on('updateTextStyle', (payload) => {
            logger.info(`Received updateTextStyle from ${socket.id}:`, payload);
updateTextStyle(payload);
            broadcastState(io, roomId);
        });

        // Handle logo size updates
        socket.on('updateLogoSize', (payload) => {
            logger.info(`Received updateLogoSize from ${socket.id}:`, payload);
updateLogoSize(payload.size);
            broadcastState(io, roomId);
        });

        // Handle visibility updates
        socket.on('updateVisibility', (payload) => {
            logger.info(`Received updateVisibility from ${socket.id}:`, payload);
updateVisibility(payload);
            broadcastState(io, roomId);
        });

        // Handle team emoji switching
        socket.on('switchTeamEmojis', () => {
            logger.info(`Received switchTeamEmojis from ${socket.id}`);
switchTeamEmojis();
            broadcastState(io, roomId);
        });

        // Fucking round system handlers

        // Planning helpers
        socket.on('setNextRoundDraft', (payload) => {
            logger.info(`Received setNextRoundDraft from ${socket.id}`);
            try {
setNextRoundDraft(payload?.config ?? null);
                broadcastState(io, roomId);
            } catch (error) {
                logger.error('Error handling setNextRoundDraft:', error);
                socket.emit('updateState', getState());
            }
        });

        socket.on('enqueueUpcoming', (payload) => {
            logger.info(`Received enqueueUpcoming from ${socket.id}`);
            try {
enqueueUpcoming(payload.config);
                broadcastState(io, roomId);
            } catch (error) {
                logger.error('Error handling enqueueUpcoming:', error);
                socket.emit('updateState', getState());
            }
        });

        socket.on('dequeueUpcoming', () => {
            logger.info(`Received dequeueUpcoming from ${socket.id}`);
            try {
                const removed = dequeueUpcoming();
logger.info('Dequeued upcoming:', removed);
                broadcastState(io, roomId);
            } catch (error) {
                logger.error('Error handling dequeueUpcoming:', error);
                socket.emit('updateState', getState());
            }
        });
        
        // Game lifecycle
        socket.on('startGame', () => {
            logger.info(`Received startGame from ${socket.id}`);
            try {
const ok = startGame();
                if (!ok) {
                    logger.warn('startGame rejected: no valid draft or upcoming');
                }
                broadcastState(io, roomId);
            } catch (error) {
                logger.error('Error handling startGame:', error);
                socket.emit('updateState', getState());
            }
        });

        socket.on('finishGame', () => {
            logger.info(`Received finishGame from ${socket.id}`);
            try {
const reportPath = finishGame();
                logger.info('Finish game report path:', reportPath);
                broadcastState(io, roomId);
            } catch (error) {
                logger.error('Error handling finishGame:', error);
                socket.emit('updateState', getState());
            }
        });
        
        // Handle starting a new round
        socket.on('startRound', (payload) => {
            try {
                if (!payload || !payload.config) {
                    logger.warn(`Received startRound without config from ${socket.id}`);
                    socket.emit('updateState', getState());
                    return;
                }
                logger.info(`Received startRound from ${socket.id}, round #${payload.config.number}`);
                const result = startRound({ config: payload.config });
if (result) {
                    logger.info(`Successfully started round ${payload.config.number} of type ${payload.config.type}`);
                    broadcastState(io, roomId);
                } else {
                    logger.error(`Failed to start round: invalid configuration`);
                    socket.emit('updateState', getState()); // Send current state back to client
                }
            } catch (error) {
                logger.error(`Shit! Error handling startRound:`, error);
                socket.emit('updateState', getState()); // Ensure client has correct state
            }
        });

        // Handle ending a round and saving results
        socket.on('endRound', (payload) => {
            logger.info(`Received endRound from ${socket.id} with points:`, payload.points);
            try {
                const result = saveRoundResults(payload);
if (result) {
                    logger.info(`Round results saved with ${result.length} total rounds in history`);
                    broadcastState(io, roomId);
                } else {
                    logger.error(`Failed to save round results: no active round`);
                    socket.emit('updateState', getState()); // Send current state back to client
                }
            } catch (error) {
                logger.error(`Fuck! Error handling endRound:`, error);
                socket.emit('updateState', getState()); // Ensure client has correct state
            }
        });

        // Handle updating round settings
        socket.on('updateRoundSetting', (payload) => {
            logger.info(`Received updateRoundSetting from ${socket.id}: ${payload.target} = ${payload.visible}`);
            try {
updateRoundSetting(payload.target, payload.visible);
                broadcastState(io, roomId);
            } catch (error) {
                logger.error(`Damn it! Error handling updateRoundSetting:`, error);
                socket.emit('updateState', getState()); // Ensure client has correct state
            }
        });

        // Handle resetting the round system
        socket.on('resetRounds', () => {
            logger.info(`Received resetRounds from ${socket.id}`);
            try {
                const result = resetRounds();
if (result) {
                    logger.info(`Round system reset successfully`);
                    broadcastState(io, roomId);
                } else {
                    logger.error(`Failed to reset rounds`);
                    socket.emit('updateState', getState()); // Send current state back to client
                }
            } catch (error) {
                logger.error(`Fucking hell! Error handling resetRounds:`, error);
                socket.emit('updateState', getState()); // Ensure client has correct state
            }
        });

        // Handle creating the next round
        socket.on('createNextRound', (type) => {
            logger.info(`Received createNextRound from ${socket.id} with type: ${type}`);
            try {
                const config = createNextRound(type);
                logger.info(`Created new round configuration #${config.number}`);
                
                // Note: This doesn't advance to the round yet, just creates the config
                // The client should call startRound with this config to actually start it
                socket.emit('updateState', getState());
            } catch (error) {
                logger.error(`Holy shit! Error handling createNextRound:`, error);
                socket.emit('updateState', getState()); // Ensure client has correct state
            }
        });

        // Template Management Handlers
        
        socket.on('saveTemplate', (payload) => {
            logger.info(`Received saveTemplate from ${socket.id}:`, payload.name);
            try {
                const result = saveTemplate(payload);
if (result) {
                    logger.info(`Template \"${payload.name}\" saved successfully`);
                    broadcastState(io, roomId);
                } else {
                    logger.error(`Failed to save template: invalid configuration`);
                    socket.emit('updateState', getState());
                }
            } catch (error) {
                logger.error(`Error handling saveTemplate:`, error);
                socket.emit('updateState', getState());
            }
        });

        socket.on('updateTemplate', (payload) => {
            logger.info(`Received updateTemplate from ${socket.id} for template: ${payload.id}`);
            try {
                const result = updateTemplate(payload.id, payload.updates);
if (result) {
                    logger.info(`Template ${payload.id} updated successfully`);
                    broadcastState(io, roomId);
                } else {
                    logger.error(`Failed to update template: not found`);
                    socket.emit('updateState', getState());
                }
            } catch (error) {
                logger.error(`Error handling updateTemplate:`, error);
                socket.emit('updateState', getState());
            }
        });

        socket.on('deleteTemplate', (templateId) => {
            logger.info(`Received deleteTemplate from ${socket.id} for template: ${templateId}`);
            try {
                const result = deleteTemplate(templateId);
if (result) {
                    logger.info(`Template ${templateId} deleted successfully`);
                    broadcastState(io, roomId);
                } else {
                    logger.error(`Failed to delete template: not found`);
                    socket.emit('updateState', getState());
                }
            } catch (error) {
                logger.error(`Error handling deleteTemplate:`, error);
                socket.emit('updateState', getState());
            }
        });

        // Playlist Management Handlers

        socket.on('createPlaylist', (payload) => {
            logger.info(`Received createPlaylist from ${socket.id}:`, payload.name);
            try {
                const result = createPlaylist(payload);
if (result) {
                    logger.info(`Playlist \"${payload.name}\" created successfully`);
                    broadcastState(io, roomId);
                } else {
                    logger.error(`Failed to create playlist: invalid configuration`);
                    socket.emit('updateState', getState());
                }
            } catch (error) {
                logger.error(`Error handling createPlaylist:`, error);
                socket.emit('updateState', getState());
            }
        });

        socket.on('updatePlaylist', (payload) => {
            logger.info(`Received updatePlaylist from ${socket.id} for playlist: ${payload.id}`);
            try {
                const result = updatePlaylist(payload.id, payload.updates);
if (result) {
                    logger.info(`Playlist ${payload.id} updated successfully`);
                    broadcastState(io, roomId);
                } else {
                    logger.error(`Failed to update playlist: not found`);
                    socket.emit('updateState', getState());
                }
            } catch (error) {
                logger.error(`Error handling updatePlaylist:`, error);
                socket.emit('updateState', getState());
            }
        });

        socket.on('deletePlaylist', (playlistId) => {
            logger.info(`Received deletePlaylist from ${socket.id} for playlist: ${playlistId}`);
            try {
                const result = deletePlaylist(playlistId);
if (result) {
                    logger.info(`Playlist ${playlistId} deleted successfully`);
                    broadcastState(io, roomId);
                } else {
                    logger.error(`Failed to delete playlist: not found`);
                    socket.emit('updateState', getState());
                }
            } catch (error) {
                logger.error(`Error handling deletePlaylist:`, error);
                socket.emit('updateState', getState());
            }
        });

        // Playlist Playback Control Handlers

        socket.on('startPlaylist', (playlistId) => {
            logger.info(`Received startPlaylist from ${socket.id} for playlist: ${playlistId}`);
            try {
                const result = startPlaylist(playlistId);
if (result) {
                    logger.info(`Playlist ${playlistId} started successfully`);
                    broadcastState(io, roomId);
                } else {
                    logger.error(`Failed to start playlist: not found or invalid`);
                    socket.emit('updateState', getState());
                }
            } catch (error) {
                logger.error(`Error handling startPlaylist:`, error);
                socket.emit('updateState', getState());
            }
        });

        socket.on('stopPlaylist', () => {
            logger.info(`Received stopPlaylist from ${socket.id}`);
            try {
                stopPlaylist();
logger.info('Playlist stopped successfully');
                broadcastState(io, roomId);
            } catch (error) {
                logger.error(`Error handling stopPlaylist:`, error);
                socket.emit('updateState', getState());
            }
        });

        socket.on('nextInPlaylist', () => {
            logger.info(`Received nextInPlaylist from ${socket.id}`);
            try {
                const result = nextInPlaylist();
if (result) {
                    logger.info('Advanced to next round in playlist');
                    broadcastState(io, roomId);
                } else {
                    logger.error('Failed to advance playlist: no active playlist or at end');
                    socket.emit('updateState', getState());
                }
            } catch (error) {
                logger.error(`Error handling nextInPlaylist:`, error);
                socket.emit('updateState', getState());
            }
        });

        socket.on('previousInPlaylist', () => {
            logger.info(`Received previousInPlaylist from ${socket.id}`);
            try {
                const result = previousInPlaylist();
if (result) {
                    logger.info('Moved to previous round in playlist');
                    broadcastState(io, roomId);
                } else {
                    logger.error('Failed to move back: no active playlist or at start');
                    socket.emit('updateState', getState());
                }
            } catch (error) {
                logger.error(`Error handling previousInPlaylist:`, error);
                socket.emit('updateState', getState());
            }
        });

        // Handle disconnection
        socket.on('disconnect', (reason) => {
            logger.info(`Client disconnected: ${socket.id}, Reason: ${reason}`);
        });
    });

    return io;
};

