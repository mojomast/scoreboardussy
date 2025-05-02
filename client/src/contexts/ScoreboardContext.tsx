import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { socket } from '@/socket'; // Use path alias for socket
import {
    ScoreboardState,
    UpdateTeamPayload,
    UpdateScorePayload,
    UpdatePenaltyPayload,
    ResetPenaltiesPayload,
    Team,
    UpdateTextPayload,
    UpdateTextStylePayload // Import UpdateTextStylePayload
} from '@server-types/index'; // Use path alias for server types

// Define the shape of the context value
interface ScoreboardContextType {
    isConnected: boolean;
    state: ScoreboardState | null;
    updateTeam: (payload: UpdateTeamPayload) => void;
    updateScore: (teamId: 'team1' | 'team2', action: number) => void;
    updatePenalty: (payload: UpdatePenaltyPayload) => void;
    resetPenalties: (payload: ResetPenaltiesPayload) => void;
    resetAll: () => void;
    getTeam: (teamId: 'team1' | 'team2') => Team | undefined;
    logoUrl: string | null;
    updateLogo: (newLogoUrl: string | null) => void;
    updateText: (payload: UpdateTextPayload) => void;
    updateTextStyle: (payload: UpdateTextStylePayload) => void; // Add text style update function
}

// Create the context with a default value (usually null or a placeholder)
const ScoreboardContext = createContext<ScoreboardContextType | undefined>(undefined);

// Define the props for the provider component
interface ScoreboardProviderProps {
    children: ReactNode;
}

// Default initial state (can be shown while loading)
const defaultState: ScoreboardState = {
    team1: {
        id: 'team1',
        name: 'Team 1',
        color: '#cccccc',
        score: 0,
        penalties: { major: 0, minor: 0 },
    },
    team2: {
        id: 'team2',
        name: 'Team 2',
        color: '#cccccc',
        score: 0,
        penalties: { major: 0, minor: 0 },
    },
    logoUrl: null,
    titleText: null,
    footerText: null,
};

// Create the provider component
export const ScoreboardProvider: React.FC<ScoreboardProviderProps> = ({ children }) => {
    const [isConnected, setIsConnected] = useState<boolean>(socket.connected);
    const [state, setState] = useState<ScoreboardState | null>(null);
    const [logoUrl, setLogoUrl] = useState<string | null>(null);

    // --- WebSocket Connection and State Handling ---
    useEffect(() => {
        // Listener for connection status
        const onConnect = () => setIsConnected(true);
        const onDisconnect = () => setIsConnected(false);

        // Listener for receiving the full state (initial or requested)
        const onInitialState = (initialState: ScoreboardState) => {
            console.log('Received initial state:', initialState);
            setState(initialState);
            setLogoUrl(initialState.logoUrl);
        };

        // Listener for receiving state updates
        const onUpdateState = (updatedState: ScoreboardState) => {
            console.log('Received state update:', updatedState);
            setState(updatedState);
            setLogoUrl(updatedState.logoUrl);
        };

        // Register listeners
        socket.on('connect', onConnect);
        socket.on('disconnect', onDisconnect);
        socket.on('initialState', onInitialState);
        socket.on('updateState', onUpdateState);

        // Attempt to connect if not already connected
        if (!socket.connected) {
            console.log('Attempting to connect socket...');
            socket.connect();
        }

        // Cleanup function: remove listeners and disconnect on unmount
        return () => {
            console.log('Cleaning up socket listeners and disconnecting...');
            socket.off('connect', onConnect);
            socket.off('disconnect', onDisconnect);
            socket.off('initialState', onInitialState);
            socket.off('updateState', onUpdateState);
            // Optional: disconnect if this provider is unmounted globally
            // socket.disconnect(); 
        };
    }, []); // Empty dependency array ensures this runs only once on mount/unmount

    // --- Action Emitters (Memoized with useCallback) ---
    const updateTeam = useCallback((payload: UpdateTeamPayload) => {
        console.log('Emitting updateTeam:', payload);
        socket.emit('updateTeam', payload);
    }, []);

    const updateScore = useCallback((teamId: 'team1' | 'team2', action: number) => {
        if (action > 0) {
            action = 1;
        } else if (action < 0) {
            action = -1;
        } else {
            return; // Do nothing if action is 0
        }

        const payload: UpdateScorePayload = { teamId, action };
        console.log('Emitting updateScore:', payload);
        socket.emit('updateScore', payload);
    }, []);

    const updatePenalty = useCallback((payload: UpdatePenaltyPayload) => {
        console.log('Emitting updatePenalty:', payload);
        socket.emit('updatePenalty', payload);
    }, []);

    const resetPenalties = useCallback((payload: ResetPenaltiesPayload) => {
        console.log('Emitting resetPenalties:', payload);
        socket.emit('resetPenalties', payload);
    }, []);

    const resetAll = useCallback(() => {
        if (socket && isConnected) {
            console.log('Emitting resetAll');
            socket.emit('resetAll');
            setLogoUrl(null); // Reset local logo state
        } else {
             console.warn('Socket not connected, cannot reset.');
        }
    }, [socket, isConnected]);

    const getTeam = useCallback((teamId: 'team1' | 'team2'): Team | undefined => {
        return state ? state[teamId] : undefined;
    }, [state]);

    const updateLogo = useCallback((newLogoUrl: string | null) => {
        console.log('Emitting updateLogo:', newLogoUrl ? newLogoUrl.substring(0, 50) + '...' : 'null');
        socket.emit('updateLogo', newLogoUrl);
    }, []);

    const updateText = useCallback((payload: UpdateTextPayload) => {
        if (socket && payload.field && (payload.text === null || typeof payload.text === 'string')) {
            console.log(`Emitting updateText:`, payload);
            socket.emit('updateText', payload);
        } else {
            console.error('Invalid payload for updateText or socket not available:', payload);
        }
    }, [socket]);

    const updateTextStyle = useCallback((payload: UpdateTextStylePayload) => {
        console.log('Emitting updateTextStyle:', payload);
        socket.emit('updateTextStyle', payload);
    }, []); // Add text style update function

    // Memoize context value
    const contextValue = useMemo(() => ({
        isConnected,
        state: state ?? defaultState, // Provide default state if null
        updateTeam,
        updateScore,
        updatePenalty,
        resetPenalties,
        resetAll,
        getTeam,
        logoUrl,
        updateLogo,
        updateText,
        updateTextStyle // Add updateTextStyle
    }), [state, isConnected, updateTeam, updateScore, updatePenalty, resetPenalties, resetAll, updateLogo, logoUrl, updateText, updateTextStyle]);

    return (
        <ScoreboardContext.Provider value={contextValue}>
            {children}
        </ScoreboardContext.Provider>
    );
};

// Custom hook for easy consumption of the context
export const useScoreboard = (): ScoreboardContextType => {
    const context = useContext(ScoreboardContext);
    if (context === undefined) {
        throw new Error('useScoreboard must be used within a ScoreboardProvider');
    }
    return context;
};
