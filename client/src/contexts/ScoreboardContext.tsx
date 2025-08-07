import { createContext, useState, useEffect, useCallback, useContext, ReactNode, useMemo } from 'react';
import { socketManager, ConnectionState } from '../utils/socketManager';
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
import {
    RoundType,
    RoundConfig,
    EndRoundPayload,
    SaveTemplatePayload,
    RoundTemplate,
    CreatePlaylistPayload,
    RoundPlaylist
} from '@server-types/rounds.types';

// Define the shape of the context value
interface ScoreboardContextType {
    state: ScoreboardState | null;
    connectionState: ConnectionState;
    connectionError: Error | null;
    queueLength: number;
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
    updateRoundSetting: (target: keyof ScoreboardState['rounds']['settings'], visible: boolean) => void;
    resetAll: () => void;
    switchTeamEmojis: () => void;
    startRound: (config: RoundConfig) => void;
    endRound: (results: EndRoundPayload) => void;
    // Template management methods
    saveTemplate: (template: SaveTemplatePayload) => void;
    updateTemplate: (id: string, updates: Partial<RoundTemplate>) => void;
    deleteTemplate: (id: string) => void;
    // Playlist management methods
    createPlaylist: (playlist: CreatePlaylistPayload) => void;
    updatePlaylist: (id: string, updates: Partial<Pick<RoundPlaylist, 'name' | 'description' | 'rounds'>>) => void;
    deletePlaylist: (id: string) => void;
    startPlaylist: (id: string) => void;
    nextInPlaylist: () => void;
    previousInPlaylist: () => void;
    stopPlaylist: () => void;
    // Export
    exportMatch: () => void;
    // Connection management
    reconnect: () => void;
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
    showPenalties: true,
    showEmojis: true,
    team1Emoji: null,
    team2Emoji: null,
    rounds: {
        current: {
            number: 1,
            isMixed: false,
            theme: '',
            type: RoundType.SHORTFORM,
            minPlayers: 2,
            maxPlayers: 8,
            timeLimit: null
        },
        history: [],
        isBetweenRounds: false,
        templates: [],
        playlists: [],
        settings: {
            showRoundNumber: true,
            showTheme: true,
            showType: true,
            showMixedStatus: true,
            showPlayerLimits: true,
            showTimeLimit: true,
            showRoundHistory: true
        }
    }
};

// Create a provider component
export const ScoreboardProvider = ({ children }: { children: ReactNode }) => {
    const [state, setState] = useState<ScoreboardState | null>(initialClientState);
    const [connectionState, setConnectionState] = useState<ConnectionState>(ConnectionState.DISCONNECTED);
    const [connectionError, setConnectionError] = useState<Error | null>(null);
    const [queueLength, setQueueLength] = useState<number>(0);

    // Helper: normalize server shape to client shape
    const normalizeServerState = (s: any): ScoreboardState => {
        const base: ScoreboardState = JSON.parse(JSON.stringify(initialClientState));

        // Teams
        if (s.team1) base.team1 = { ...base.team1, ...s.team1 };
        if (s.team2) base.team2 = { ...base.team2, ...s.team2 };

        // Top-level visuals
        if ('logoUrl' in s) base.logoUrl = s.logoUrl;
        if ('logoSize' in s) base.logoSize = s.logoSize ?? base.logoSize;
        if ('titleText' in s) base.titleText = s.titleText ?? base.titleText;
        if ('footerText' in s) base.footerText = s.footerText ?? base.footerText;
        if ('titleTextColor' in s) base.titleTextColor = s.titleTextColor ?? base.titleTextColor;
        if ('titleTextSize' in s) base.titleTextSize = s.titleTextSize ?? base.titleTextSize;
        if ('footerTextColor' in s) base.footerTextColor = s.footerTextColor ?? base.footerTextColor;
        if ('footerTextSize' in s) base.footerTextSize = s.footerTextSize ?? base.footerTextSize;
        if ('showScore' in s) base.showScore = s.showScore;
        if ('showPenalties' in s) base.showPenalties = s.showPenalties;
        if ('showEmojis' in s) base.showEmojis = s.showEmojis;
        if ('team1Emoji' in s) base.team1Emoji = s.team1Emoji;
        if ('team2Emoji' in s) base.team2Emoji = s.team2Emoji;

        // Rounds: server uses currentRound/roundHistory/roundSettings
        const currentRound = s.currentRound;
        const roundHistory = Array.isArray(s.roundHistory) ? s.roundHistory : [];
        const roundSettings = s.roundSettings || {};

        // Map current round if present
        if (currentRound) {
            base.rounds.current = {
                number: currentRound.number ?? base.rounds.current.number,
                type: currentRound.type as RoundType ?? base.rounds.current.type,
                isMixed: !!currentRound.isMixed,
                theme: currentRound.theme ?? '',
                minPlayers: currentRound.minPlayers ?? base.rounds.current.minPlayers,
                maxPlayers: currentRound.maxPlayers ?? base.rounds.current.maxPlayers,
                timeLimit: currentRound.timeLimit ?? base.rounds.current.timeLimit,
            };
            base.rounds.isBetweenRounds = false;
        } else {
            // If no current round from server, we are between rounds
            base.rounds.isBetweenRounds = true;
        }

        // Map history entries (provide safe defaults for points/penalties)
        base.rounds.history = roundHistory.map((r: any) => ({
            number: r.number ?? 0,
            type: (r.type as RoundType) ?? base.rounds.current.type,
            isMixed: !!r.isMixed,
            theme: r.theme ?? '',
            minPlayers: r.minPlayers ?? base.rounds.current.minPlayers,
            maxPlayers: r.maxPlayers ?? base.rounds.current.maxPlayers,
            timeLimit: r.timeLimit ?? null,
            points: r.points ?? { team1: 0, team2: 0 },
            penalties: r.penalties ?? { team1: { major: 0, minor: 0 }, team2: { major: 0, minor: 0 } },
            notes: r.notes ?? undefined,
        }));

        // Derive team totals from history if server did not include them
        const derivedTotals = base.rounds.history.reduce(
            (acc, r) => {
                acc.team1 += r.points?.team1 ?? 0;
                acc.team2 += r.points?.team2 ?? 0;
                return acc;
            },
            { team1: 0, team2: 0 }
        );
        // Always derive totals from history; server team scores are not authoritative
        base.team1.score = derivedTotals.team1;
        base.team2.score = derivedTotals.team2;

        // Map settings (server may use different keys; e.g., showTimer)
        base.rounds.settings = {
            showRoundNumber: roundSettings.showRoundNumber ?? base.rounds.settings.showRoundNumber,
            showTheme: roundSettings.showTheme ?? base.rounds.settings.showTheme,
            showType: roundSettings.showType ?? base.rounds.settings.showType,
            showMixedStatus: roundSettings.showMixedStatus ?? base.rounds.settings.showMixedStatus,
            showPlayerLimits: roundSettings.showPlayerLimits ?? base.rounds.settings.showPlayerLimits,
            showTimeLimit: (roundSettings.showTimeLimit ?? roundSettings.showTimer) ?? base.rounds.settings.showTimeLimit,
            showRoundHistory: roundSettings.showRoundHistory ?? base.rounds.settings.showRoundHistory,
        };

        return base;
    };

    // Initialize socket connection
    useEffect(() => {
        // Set up connection state listener
        socketManager.onConnectionStateChange((state) => {
            setConnectionState(state);
            if (state === ConnectionState.ERROR) {
                setConnectionError(socketManager.getLastError());
            } else {
                setConnectionError(null);
            }
            setQueueLength(socketManager.getQueueLength());
        });

        // Set up state update listeners
        socketManager.on('updateState', (updatedState) => {
            console.log('Received state update:', updatedState);
            try {
                const normalized = normalizeServerState(updatedState);
                setState(normalized);
            } catch (e) {
                console.error('Error normalizing server state', e);
            }
        });

        // Connect to the server
        socketManager.connect();

        return () => {
            // Clean up
            socketManager.offConnectionStateChange(setConnectionState);
            socketManager.off('updateState');
        };
    }, []);

    // Reconnect function
    const reconnect = useCallback(() => {
        socketManager.connect();
    }, []);

    // Socket event emitters
    const updateTeam = useCallback((payload: { teamId: 'team1' | 'team2', updates: Partial<Pick<Team, 'name' | 'color'>> }) => {
        socketManager.emit('updateTeam', payload);
    }, []);

    const updateScore = useCallback((payload: UpdateScorePayload) => {
        socketManager.emit('updateScore', payload);
    }, []);

    const updatePenalty = useCallback((payload: UpdatePenaltyPayload) => {
        socketManager.emit('updatePenalty', payload);
    }, []);

    const resetPenalties = useCallback((payload: ResetPenaltiesPayload) => {
        socketManager.emit('resetPenalties', payload);
    }, []);

    const resetAll = useCallback(() => {
        socketManager.emit('resetAll');
    }, []);

    const getTeam = useCallback((teamId: 'team1' | 'team2'): Team | undefined => {
        return state ? state[teamId] : undefined;
    }, [state]);

    const updateLogo = useCallback((newLogoUrl: string | null) => {
        socketManager.emit('updateLogo', newLogoUrl);
    }, []);

    const updateLogoSize = useCallback((payload: UpdateLogoSizePayload) => {
        socketManager.emit('updateLogoSize', payload);
    }, []);

    const updateText = useCallback((payload: UpdateTextPayload) => {
        socketManager.emit('updateText', payload);
    }, []);

    const updateTextStyle = useCallback((payload: UpdateTextStylePayload) => {
        socketManager.emit('updateTextStyle', payload);
    }, []);

    const updateVisibility = useCallback((payload: UpdateVisibilityPayload) => {
        socketManager.emit('updateVisibility', payload);
    }, []);

    const updateRoundSetting = useCallback((target: keyof ScoreboardState['rounds']['settings'], visible: boolean) => {
        // Optimistically update local state for instant UI feedback
        setState((prev) => {
            if (!prev) return prev;
            const newSettings = { ...(prev.rounds?.settings ?? {} as any), [target]: visible } as ScoreboardState['rounds']['settings'];
            const newRounds = { ...(prev.rounds ?? {} as any), settings: newSettings } as ScoreboardState['rounds'];
            return { ...prev, rounds: newRounds } as ScoreboardState;
        });
        // Notify server
        socketManager.emit('updateRoundSetting', { target, visible });
    }, []);

    const switchTeamEmojis = useCallback(() => {
        socketManager.emit('switchTeamEmojis');
    }, []);

    const startRound = useCallback((config: RoundConfig) => {
        // Optimistically update local state so UI reflects the new current round immediately
        setState((prev) => {
            if (!prev) return prev;
            const defaultSettings = initialClientState.rounds.settings;
            const prevRounds = prev.rounds ?? {} as any;
            const newRounds = {
                history: prevRounds.history ?? [],
                templates: prevRounds.templates ?? [],
                playlists: prevRounds.playlists ?? [],
                settings: prevRounds.settings ?? defaultSettings,
                current: config,
                isBetweenRounds: false,
            } as ScoreboardState['rounds'];
            return { ...prev, rounds: newRounds } as ScoreboardState;
        });
        // Notify server (server expects { config })
        socketManager.emit('startRound', { config });
        console.log('Starting round:', config);
    }, []);

    const endRound = useCallback((results: EndRoundPayload) => {
        // Optimistically update team totals and mark between rounds so UI shows the new round form
        setState((prev) => {
            if (!prev) return prev;
            const p1 = results.points?.team1 ?? 0;
            const p2 = results.points?.team2 ?? 0;
            const prevRounds = prev.rounds ?? ({} as any);
            const newRounds = {
                ...prevRounds,
                isBetweenRounds: true,
            } as ScoreboardState['rounds'];
            return {
                ...prev,
                team1: { ...prev.team1, score: (prev.team1.score ?? 0) + p1 },
                team2: { ...prev.team2, score: (prev.team2.score ?? 0) + p2 },
                rounds: newRounds,
            } as ScoreboardState;
        });
        socketManager.emit('endRound', results);
        console.log('Ending round with results:', results);
    }, []);

    // Template management methods
    const saveTemplate = useCallback((template: SaveTemplatePayload) => {
        socketManager.emit('saveTemplate', template);
        console.log('Saving template:', template);
    }, []);

    const updateTemplate = useCallback((id: string, updates: Partial<RoundTemplate>) => {
        socketManager.emit('updateTemplate', { id, updates });
        console.log('Updating template:', id, updates);
    }, []);

    const deleteTemplate = useCallback((id: string) => {
        socketManager.emit('deleteTemplate', id);
        console.log('Deleting template:', id);
    }, []);

    // Playlist management methods
    const createPlaylist = useCallback((playlist: CreatePlaylistPayload) => {
        socketManager.emit('createPlaylist', playlist);
        console.log('Creating playlist:', playlist);
    }, []);

    const updatePlaylist = useCallback((id: string, updates: Partial<Pick<RoundPlaylist, 'name' | 'description' | 'rounds'>>) => {
        socketManager.emit('updatePlaylist', { id, updates });
        console.log('Updating playlist:', id, updates);
    }, []);

    const deletePlaylist = useCallback((id: string) => {
        socketManager.emit('deletePlaylist', id);
        console.log('Deleting playlist:', id);
    }, []);

    const startPlaylist = useCallback((id: string) => {
        socketManager.emit('startPlaylist', id);
        console.log('Starting playlist:', id);
    }, []);

    const nextInPlaylist = useCallback(() => {
        socketManager.emit('nextInPlaylist');
        console.log('Moving to next round in playlist');
    }, []);

    const previousInPlaylist = useCallback(() => {
        socketManager.emit('previousInPlaylist');
        console.log('Moving to previous round in playlist');
    }, []);

    const stopPlaylist = useCallback(() => {
        socketManager.emit('stopPlaylist');
        console.log('Stopping active playlist');
    }, []);

    const exportMatch = useCallback(() => {
        if (!state || !state.rounds?.history?.length) return;

        const html = `
        <html>
        <head>
            <title>Match Results</title>
            <style>
                body { font-family: Arial, sans-serif; max-width: 800px; margin: 20px auto; padding: 20px; }
                table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                th, td { padding: 10px; border: 1px solid #ddd; text-align: left; }
                th { background-color: #f5f5f5; }
                .team-name { color: #fff; padding: 5px 10px; border-radius: 4px; }
                .team1 { background-color: ${state.team1.color}; }
                .team2 { background-color: ${state.team2.color}; }
                .header { text-align: center; margin-bottom: 30px; }
                .final-score { font-size: 24px; text-align: center; margin: 20px 0; }
                .penalties { font-size: 0.9em; color: #666; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>${state.titleText || 'Match Results'}</h1>
                <div class="final-score">
                    <span class="team-name team1">${state.team1.name}: ${state.team1.score}</span>
                    vs
                    <span class="team-name team2">${state.team2.name}: ${state.team2.score}</span>
                </div>
            </div>
            <table>
                <thead>
                    <tr>
                        <th>Round</th>
                        <th>Type</th>
                        <th>Theme</th>
                        <th>Teams</th>
                        <th>Players</th>
                        <th>Time</th>
                        <th>Points</th>
                        <th>Penalties</th>
                        <th>Notes</th>
                    </tr>
                </thead>
                <tbody>
                    ${state.rounds.history.map(round => `
                        <tr>
                            <td>${round.number}</td>
                            <td>${round.type.charAt(0).toUpperCase() + round.type.slice(1)}</td>
                            <td>${round.theme || '-'}</td>
                            <td>${round.isMixed ? 'Mixed' : 'Compared'}</td>
                            <td>${round.minPlayers}-${round.maxPlayers}</td>
                            <td>${round.timeLimit ? round.timeLimit + 's' : '-'}</td>
                            <td>${round.points.team1} - ${round.points.team2}</td>
                            <td class="penalties">
                                ${state.team1.name}:<br>
                                Major: ${round.penalties.team1.major}, Minor: ${round.penalties.team1.minor}<br>
                                ${state.team2.name}:<br>
                                Major: ${round.penalties.team2.major}, Minor: ${round.penalties.team2.minor}
                            </td>
                            <td>${round.notes || '-'}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </body>
        </html>
        `;

        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `match-results-${new Date().toISOString().split('T')[0]}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, [state]);
    const contextValue = useMemo(() => ({
        state,
        connectionState,
        connectionError,
        queueLength,
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
        updateRoundSetting,
        resetAll,
        switchTeamEmojis,
        startRound,
        endRound,
        // Template management
        saveTemplate,
        updateTemplate,
        deleteTemplate,
        // Playlist management
        createPlaylist,
        updatePlaylist,
        deletePlaylist,
        startPlaylist,
        nextInPlaylist,
        previousInPlaylist,
        stopPlaylist,
        exportMatch,
        reconnect,
    }), [
        state,
        connectionState,
        connectionError,
        queueLength,
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
        updateRoundSetting,
        resetAll,
        switchTeamEmojis,
        startRound,
        endRound,
        saveTemplate,
        updateTemplate,
        deleteTemplate,
        createPlaylist,
        updatePlaylist,
        deletePlaylist,
        startPlaylist,
        nextInPlaylist,
        previousInPlaylist,
        stopPlaylist,
        exportMatch,
        reconnect,
]);

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
