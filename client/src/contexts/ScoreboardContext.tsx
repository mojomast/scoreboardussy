import { createContext, useState, useEffect, useCallback, useContext, ReactNode, useMemo } from 'react';
import { io, Socket } from 'socket.io-client';
import {
    ScoreboardState,
    UpdateScorePayload,
    UpdatePenaltyPayload,
    ResetPenaltiesPayload,
    Team,
    UpdateTextPayload,
    UpdateTextStylePayload,
    UpdateLogoSizePayload,
    UpdateVisibilityPayload
} from '@server-types/index'; 

// Define the shape of the context value
interface ScoreboardContextType {
    state: ScoreboardState | null; 
    isConnected: boolean;
    updateTeam: (payload: { teamId: 'team1' | 'team2', updates: Partial<Pick<Team, 'name' | 'color'>> }) => void;
    updateScore: (payload: UpdateScorePayload) => void;
    updatePenalty: (payload: UpdatePenaltyPayload) => void;
    resetPenalties: (payload: ResetPenaltiesPayload) => void;
    getTeam: (teamId: 'team1' | 'team2') => Team | undefined;
    updateLogo: (newLogoUrl: string | null) => void;
    updateText: (payload: UpdateTextPayload) => void;
    updateTextStyle: (payload: UpdateTextStylePayload) => void;
    updateLogoSize: (payload: UpdateLogoSizePayload) => void; 
    updateVisibility: (payload: UpdateVisibilityPayload) => void; 
    resetAll: () => void;
    switchTeamEmojis: () => void; // ADDED
}

// Create the context with a default value (usually null or a placeholder)
const ScoreboardContext = createContext<ScoreboardContextType | undefined>(undefined);

// Define the initial state for the client-side representation
const initialClientState: ScoreboardState = {
    team1: {
        id: 'team1',
        name: 'Team 1',
        color: '#0000FF', 
        score: 0,
        penalties: { major: 0, minor: 0 },
    },
    team2: {
        id: 'team2',
        name: 'Team 2',
        color: '#FF0000', 
        score: 0,
        penalties: { major: 0, minor: 0 },
    },
    logoUrl: null,
    logoSize: 50, 
    titleText: 'Scoreboard', 
    footerText: '', 
    titleTextColor: '#FFFFFF', 
    titleTextSize: 2, 
    footerTextColor: '#FFFFFF', 
    footerTextSize: 1.25, 
    titleStyle: { color: '#000000', sizeRem: 2 }, 
    footerStyle: { color: '#000000', sizeRem: 1 }, 
    showScore: true, 
    showPenalties: true 
};

// Create a provider component
export const ScoreboardProvider = ({ children }: { children: ReactNode }) => {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [state, setState] = useState<ScoreboardState | null>(initialClientState); 
    const [isConnected, setIsConnected] = useState<boolean>(false);

    useEffect(() => {
        const serverUrl = import.meta.env.MODE === 'production'
            ? window.location.origin 
            : 'http://localhost:3001'; 

        const newSocket = io(serverUrl, {
            transports: ['websocket'], 
        });
        setSocket(newSocket);

        newSocket.on('connect', () => {
            console.log('Connected to WebSocket server');
            setIsConnected(true);
        });

        newSocket.on('disconnect', (reason) => {
            console.log('Disconnected from WebSocket server:', reason);
            setIsConnected(false);
        });

        newSocket.on('connect_error', (error) => {
            console.error('Connection Error:', error);
            setIsConnected(false);
        });

        const handleInitialState = (initialState: ScoreboardState) => {
            console.log('Received initial state:', initialState);
            setState(initialState);
        };

        const handleStateUpdate = (updatedState: ScoreboardState) => {
            console.log('Received state update:', updatedState);
            setState(updatedState);
        };

        newSocket.on('initialState', handleInitialState);
        newSocket.on('updateState', handleStateUpdate); 

        return () => {
            console.log('Cleaning up WebSocket connection');
            newSocket.off('connect');
            newSocket.off('disconnect');
            newSocket.off('connect_error');
            newSocket.off('initialState', handleInitialState);
            newSocket.off('updateState', handleStateUpdate); 
            newSocket.close();
        };
    }, []);

    const updateTeam = useCallback((payload: { teamId: 'team1' | 'team2', updates: Partial<Pick<Team, 'name' | 'color'>> }) => {
        socket?.emit('updateTeam', payload);
    }, [socket]);

    const updateScore = useCallback((payload: UpdateScorePayload) => {
        socket?.emit('updateScore', payload);
    }, [socket]);

    const updatePenalty = useCallback((payload: UpdatePenaltyPayload) => {
        socket?.emit('updatePenalty', payload);
    }, [socket]);

    const resetPenalties = useCallback((payload: ResetPenaltiesPayload) => {
        socket?.emit('resetPenalties', payload);
    }, [socket]);

    const resetAll = useCallback(() => {
        socket?.emit('resetAll');
    }, [socket]);

    const getTeam = useCallback((teamId: 'team1' | 'team2'): Team | undefined => {
        return state ? state[teamId] : undefined;
    }, [state]);

    const updateLogo = useCallback((newLogoUrl: string | null) => {
        socket?.emit('updateLogo', newLogoUrl);
    }, [socket]); 

    const updateLogoSize = useCallback((payload: UpdateLogoSizePayload) => {
        socket?.emit('updateLogoSize', payload);
    }, [socket]); 

    const updateText = useCallback((payload: UpdateTextPayload) => {
        socket?.emit('updateText', payload);
    }, [socket]); 

    const updateTextStyle = useCallback((payload: UpdateTextStylePayload) => {
        socket?.emit('updateTextStyle', payload);
    }, [socket]); 

    const updateVisibility = useCallback((payload: UpdateVisibilityPayload) => {
        socket?.emit('updateVisibility', payload);
    }, [socket]);

    const switchTeamEmojis = useCallback(() => {
        socket?.emit('switchTeamEmojis');
    }, [socket]);

    const contextValue = useMemo(() => ({
        state,
        isConnected,
        updateTeam,
        updateScore,
        updatePenalty,
        resetPenalties,
        getTeam,
        updateLogo,
        updateText,
        updateTextStyle,
        updateLogoSize, 
        updateVisibility, 
        resetAll,
        switchTeamEmojis
    }), [state, isConnected, updateTeam, updateScore, updatePenalty, resetPenalties, getTeam, updateLogo, updateText, updateTextStyle, updateLogoSize, updateVisibility, resetAll, switchTeamEmojis]); 

    return (
        <ScoreboardContext.Provider value={contextValue}>
            {children}
        </ScoreboardContext.Provider>
    );
};

export const useScoreboard = () => {
    const context = useContext(ScoreboardContext);
    if (context === undefined) {
        throw new Error('useScoreboard must be used within a ScoreboardProvider');
    }
    return context;
};
