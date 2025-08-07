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

type IoServer = Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;
type IoSocket = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

// Broadcast state to all connected clients
const broadcastState = (io: IoServer) => {
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

// Initialize socket connection and set up event handlers
export const initializeSocketHandlers = (io: IoServer) => {
    io.on('connection', (socket: IoSocket) => {
        console.log(`Client connected: ${socket.id}`);

        // Send initial state to newly connected client
        socket.emit('updateState', getState());

        // Handle team updates
        socket.on('updateTeam', (payload) => {
            console.log(`Received updateTeam from ${socket.id}:`, payload);
            if (payload.updates && Object.keys(payload.updates).length > 0) {
                updateTeam(payload.teamId, payload.updates);
                broadcastState(io);
            } else {
                console.warn(`Received updateTeam from ${socket.id} without valid updates`);
            }
        });

        // Handle score updates
        socket.on('updateScore', (payload) => {
            console.log(`Received updateScore from ${socket.id}:`, payload);
            const action = payload.action > 0 ? 'increment' : 'decrement';
            updateScore(payload.teamId, action);
            broadcastState(io);
        });

        // Handle penalty updates
        socket.on('updatePenalty', (payload) => {
            console.log(`Received updatePenalty from ${socket.id}:`, payload);
            updatePenalty(payload.teamId, payload.type);
            broadcastState(io);
        });

        // Handle penalty resets
        socket.on('resetPenalties', (payload) => {
            console.log(`Received resetPenalties from ${socket.id}:`, payload);
            resetPenalties(payload.teamId);
            broadcastState(io);
        });

        // Handle full reset
        socket.on('resetAll', () => {
            console.log(`Received resetAll from ${socket.id}`);
            resetAllState();
            broadcastState(io);
        });

        // Handle logo updates
        socket.on('updateLogo', (newLogoUrl) => {
            console.log(`Received updateLogo from ${socket.id}. URL Length: ${newLogoUrl ? newLogoUrl.length : 'null'}`);
            updateLogoUrl(newLogoUrl);
            broadcastState(io);
        });

        // Handle text updates
        socket.on('updateText', (payload) => {
            console.log(`Received updateText from ${socket.id}. Field: ${payload.field}`);
            updateText(payload);
            broadcastState(io);
        });

        // Handle text style updates
        socket.on('updateTextStyle', (payload) => {
            console.log(`Received updateTextStyle from ${socket.id}:`, payload);
            updateTextStyle(payload);
            broadcastState(io);
        });

        // Handle logo size updates
        socket.on('updateLogoSize', (payload) => {
            console.log(`Received updateLogoSize from ${socket.id}:`, payload);
            updateLogoSize(payload.size);
            broadcastState(io);
        });

        // Handle visibility updates
        socket.on('updateVisibility', (payload) => {
            console.log(`Received updateVisibility from ${socket.id}:`, payload);
            updateVisibility(payload);
            broadcastState(io);
        });

        // Handle team emoji switching
        socket.on('switchTeamEmojis', () => {
            console.log(`Received switchTeamEmojis from ${socket.id}`);
            switchTeamEmojis();
            broadcastState(io);
        });

        // Fucking round system handlers
        
        // Handle starting a new round
        socket.on('startRound', (payload) => {
            console.log(`Received startRound from ${socket.id}, round #${payload.config.number}`);
            try {
                const result = startRound(payload);
                if (result) {
                    console.log(`Successfully started round ${payload.config.number} of type ${payload.config.type}`);
                    broadcastState(io);
                } else {
                    console.error(`Failed to start round: invalid configuration`);
                    socket.emit('updateState', getState()); // Send current state back to client
                }
            } catch (error) {
                console.error(`Shit! Error handling startRound:`, error);
                socket.emit('updateState', getState()); // Ensure client has correct state
            }
        });

        // Handle ending a round and saving results
        socket.on('endRound', (payload) => {
            console.log(`Received endRound from ${socket.id} with points:`, payload.points);
            try {
                const result = saveRoundResults(payload);
                if (result) {
                    console.log(`Round results saved with ${result.length} total rounds in history`);
                    broadcastState(io);
                } else {
                    console.error(`Failed to save round results: no active round`);
                    socket.emit('updateState', getState()); // Send current state back to client
                }
            } catch (error) {
                console.error(`Fuck! Error handling endRound:`, error);
                socket.emit('updateState', getState()); // Ensure client has correct state
            }
        });

        // Handle updating round settings
        socket.on('updateRoundSetting', (payload) => {
            console.log(`Received updateRoundSetting from ${socket.id}: ${payload.target} = ${payload.visible}`);
            try {
                updateRoundSetting(payload.target, payload.visible);
                broadcastState(io);
            } catch (error) {
                console.error(`Damn it! Error handling updateRoundSetting:`, error);
                socket.emit('updateState', getState()); // Ensure client has correct state
            }
        });

        // Handle resetting the round system
        socket.on('resetRounds', () => {
            console.log(`Received resetRounds from ${socket.id}`);
            try {
                const result = resetRounds();
                if (result) {
                    console.log(`Round system reset successfully`);
                    broadcastState(io);
                } else {
                    console.error(`Failed to reset rounds`);
                    socket.emit('updateState', getState()); // Send current state back to client
                }
            } catch (error) {
                console.error(`Fucking hell! Error handling resetRounds:`, error);
                socket.emit('updateState', getState()); // Ensure client has correct state
            }
        });

        // Handle creating the next round
        socket.on('createNextRound', (type) => {
            console.log(`Received createNextRound from ${socket.id} with type: ${type}`);
            try {
                const config = createNextRound(type);
                console.log(`Created new round configuration #${config.number}`);
                
                // Note: This doesn't advance to the round yet, just creates the config
                // The client should call startRound with this config to actually start it
                socket.emit('updateState', getState());
            } catch (error) {
                console.error(`Holy shit! Error handling createNextRound:`, error);
                socket.emit('updateState', getState()); // Ensure client has correct state
            }
        });

        // Template Management Handlers
        
        socket.on('saveTemplate', (payload) => {
            console.log(`Received saveTemplate from ${socket.id}:`, payload.name);
            try {
                const result = saveTemplate(payload);
                if (result) {
                    console.log(`Template "${payload.name}" saved successfully`);
                    broadcastState(io);
                } else {
                    console.error(`Failed to save template: invalid configuration`);
                    socket.emit('updateState', getState());
                }
            } catch (error) {
                console.error(`Error handling saveTemplate:`, error);
                socket.emit('updateState', getState());
            }
        });

        socket.on('updateTemplate', (payload) => {
            console.log(`Received updateTemplate from ${socket.id} for template: ${payload.id}`);
            try {
                const result = updateTemplate(payload.id, payload.updates);
                if (result) {
                    console.log(`Template ${payload.id} updated successfully`);
                    broadcastState(io);
                } else {
                    console.error(`Failed to update template: not found`);
                    socket.emit('updateState', getState());
                }
            } catch (error) {
                console.error(`Error handling updateTemplate:`, error);
                socket.emit('updateState', getState());
            }
        });

        socket.on('deleteTemplate', (templateId) => {
            console.log(`Received deleteTemplate from ${socket.id} for template: ${templateId}`);
            try {
                const result = deleteTemplate(templateId);
                if (result) {
                    console.log(`Template ${templateId} deleted successfully`);
                    broadcastState(io);
                } else {
                    console.error(`Failed to delete template: not found`);
                    socket.emit('updateState', getState());
                }
            } catch (error) {
                console.error(`Error handling deleteTemplate:`, error);
                socket.emit('updateState', getState());
            }
        });

        // Playlist Management Handlers

        socket.on('createPlaylist', (payload) => {
            console.log(`Received createPlaylist from ${socket.id}:`, payload.name);
            try {
                const result = createPlaylist(payload);
                if (result) {
                    console.log(`Playlist "${payload.name}" created successfully`);
                    broadcastState(io);
                } else {
                    console.error(`Failed to create playlist: invalid configuration`);
                    socket.emit('updateState', getState());
                }
            } catch (error) {
                console.error(`Error handling createPlaylist:`, error);
                socket.emit('updateState', getState());
            }
        });

        socket.on('updatePlaylist', (payload) => {
            console.log(`Received updatePlaylist from ${socket.id} for playlist: ${payload.id}`);
            try {
                const result = updatePlaylist(payload.id, payload.updates);
                if (result) {
                    console.log(`Playlist ${payload.id} updated successfully`);
                    broadcastState(io);
                } else {
                    console.error(`Failed to update playlist: not found`);
                    socket.emit('updateState', getState());
                }
            } catch (error) {
                console.error(`Error handling updatePlaylist:`, error);
                socket.emit('updateState', getState());
            }
        });

        socket.on('deletePlaylist', (playlistId) => {
            console.log(`Received deletePlaylist from ${socket.id} for playlist: ${playlistId}`);
            try {
                const result = deletePlaylist(playlistId);
                if (result) {
                    console.log(`Playlist ${playlistId} deleted successfully`);
                    broadcastState(io);
                } else {
                    console.error(`Failed to delete playlist: not found`);
                    socket.emit('updateState', getState());
                }
            } catch (error) {
                console.error(`Error handling deletePlaylist:`, error);
                socket.emit('updateState', getState());
            }
        });

        // Playlist Playback Control Handlers

        socket.on('startPlaylist', (playlistId) => {
            console.log(`Received startPlaylist from ${socket.id} for playlist: ${playlistId}`);
            try {
                const result = startPlaylist(playlistId);
                if (result) {
                    console.log(`Playlist ${playlistId} started successfully`);
                    broadcastState(io);
                } else {
                    console.error(`Failed to start playlist: not found or invalid`);
                    socket.emit('updateState', getState());
                }
            } catch (error) {
                console.error(`Error handling startPlaylist:`, error);
                socket.emit('updateState', getState());
            }
        });

        socket.on('stopPlaylist', () => {
            console.log(`Received stopPlaylist from ${socket.id}`);
            try {
                stopPlaylist();
                console.log('Playlist stopped successfully');
                broadcastState(io);
            } catch (error) {
                console.error(`Error handling stopPlaylist:`, error);
                socket.emit('updateState', getState());
            }
        });

        socket.on('nextInPlaylist', () => {
            console.log(`Received nextInPlaylist from ${socket.id}`);
            try {
                const result = nextInPlaylist();
                if (result) {
                    console.log('Advanced to next round in playlist');
                    broadcastState(io);
                } else {
                    console.error('Failed to advance playlist: no active playlist or at end');
                    socket.emit('updateState', getState());
                }
            } catch (error) {
                console.error(`Error handling nextInPlaylist:`, error);
                socket.emit('updateState', getState());
            }
        });

        socket.on('previousInPlaylist', () => {
            console.log(`Received previousInPlaylist from ${socket.id}`);
            try {
                const result = previousInPlaylist();
                if (result) {
                    console.log('Moved to previous round in playlist');
                    broadcastState(io);
                } else {
                    console.error('Failed to move back: no active playlist or at start');
                    socket.emit('updateState', getState());
                }
            } catch (error) {
                console.error(`Error handling previousInPlaylist:`, error);
                socket.emit('updateState', getState());
            }
        });

        // Handle disconnection
        socket.on('disconnect', (reason) => {
            console.log(`Client disconnected: ${socket.id}, Reason: ${reason}`);
        });
    });

    return io;
};

