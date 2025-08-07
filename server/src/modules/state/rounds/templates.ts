import { v4 as uuidv4 } from 'uuid';
import { 
    RoundTemplate, 
    RoundPlaylist, 
    SaveTemplatePayload, 
    CreatePlaylistPayload,
    RoundConfig,
    RoundType
} from '../../../types/rounds.types';
import { getState, updateState } from '../index';

// Default templates to initialize the system with
export const defaultTemplates: RoundTemplate[] = [
    {
        id: 'shortform-basic',
        name: 'Basic Shortform',
        description: 'Standard shortform round with 2-4 players',
        config: {
            type: RoundType.SHORTFORM,
            isMixed: false,
            theme: '',
            minPlayers: 2,
            maxPlayers: 4,
            timeLimit: 180 // 3 minutes
        },
        tags: ['basic', 'shortform']
    },
    {
        id: 'musical-duet',
        name: 'Musical Duet',
        description: 'Two-person musical performance',
        config: {
            type: RoundType.MUSICAL,
            isMixed: false,
            theme: '',
            minPlayers: 2,
            maxPlayers: 2,
            timeLimit: 240 // 4 minutes
        },
        tags: ['musical', 'duet']
    },
    {
        id: 'character-switches',
        name: 'Character Switch Scene',
        description: 'Scene where players swap characters periodically',
        config: {
            type: RoundType.CHARACTER,
            isMixed: true,
            theme: 'Character Switches',
            minPlayers: 3,
            maxPlayers: 4,
            timeLimit: 300 // 5 minutes
        },
        tags: ['character', 'advanced']
    },
    {
        id: 'story-chain',
        name: 'Narrative Chain',
        description: 'Connected scenes telling a complete story',
        config: {
            type: RoundType.NARRATIVE,
            isMixed: false,
            theme: '',
            minPlayers: 4,
            maxPlayers: 6,
            timeLimit: 420 // 7 minutes
        },
        tags: ['narrative', 'longform']
    },
    {
        id: 'challenge-emotional',
        name: 'Emotional Rollercoaster',
        description: 'Scene with rapid emotional changes',
        config: {
            type: RoundType.CHALLENGE,
            isMixed: false,
            theme: 'Emotional Switches',
            minPlayers: 2,
            maxPlayers: 3,
            timeLimit: 240 // 4 minutes
        },
        tags: ['challenge', 'emotions']
    },
    {
        id: 'mixed-genre',
        name: 'Genre Blender',
        description: 'Scene that switches between different movie/TV genres',
        config: {
            type: RoundType.CHALLENGE,
            isMixed: false,
            theme: 'Genre Switches',
            minPlayers: 3,
            maxPlayers: 5,
            timeLimit: 360 // 6 minutes
        },
        tags: ['challenge', 'genres', 'advanced']
    },
    {
        id: 'longform-start',
        name: 'Longform Opening',
        description: 'Initial scene to establish a longform narrative',
        config: {
            type: RoundType.LONGFORM,
            isMixed: false,
            theme: '',
            minPlayers: 4,
            maxPlayers: 8,
            timeLimit: 600 // 10 minutes
        },
        tags: ['longform', 'opening']
    },
    {
        id: 'musical-group',
        name: 'Group Musical Number',
        description: 'Full-cast musical performance',
        config: {
            type: RoundType.MUSICAL,
            isMixed: true,
            theme: '',
            minPlayers: 4,
            maxPlayers: 8,
            timeLimit: 300 // 5 minutes
        },
        tags: ['musical', 'group', 'finale']
    }
];

// Add this function to initialize templates
export const initializeDefaultTemplates = (): void => {
    const state = getState();
    // Only initialize if no templates exist
    if (!state.rounds.templates || state.rounds.templates.length === 0) {
        updateState({
            rounds: {
                ...state.rounds,
                templates: defaultTemplates
            }
        });
        console.log('Default templates initialized');
    }
};

// Template Management
export const saveTemplate = (payload: SaveTemplatePayload): boolean => {
    try {
        const state = getState();
        const newTemplate: RoundTemplate = {
            id: uuidv4(),
            name: payload.name,
            description: payload.description,
            config: payload.config,
            tags: payload.tags || []
        };

        const templates = [...(state.rounds.templates || []), newTemplate];
        updateState({
            rounds: {
                ...state.rounds,
                templates
            }
        });

        return true;
    } catch (error) {
        console.error('Error saving template:', error);
        return false;
    }
};

export const updateTemplate = (id: string, updates: Partial<RoundTemplate>): boolean => {
    try {
        const state = getState();
        const templates = state.rounds.templates || [];
        const index = templates.findIndex(t => t.id === id);
        
        if (index === -1) return false;

        const updatedTemplates = [...templates];
        updatedTemplates[index] = {
            ...updatedTemplates[index],
            ...updates
        };

        updateState({
            rounds: {
                ...state.rounds,
                templates: updatedTemplates
            }
        });

        return true;
    } catch (error) {
        console.error('Error updating template:', error);
        return false;
    }
};

export const deleteTemplate = (id: string): boolean => {
    try {
        const state = getState();
        const templates = state.rounds.templates || [];
        const updatedTemplates = templates.filter(t => t.id !== id);

        updateState({
            rounds: {
                ...state.rounds,
                templates: updatedTemplates
            }
        });

        return true;
    } catch (error) {
        console.error('Error deleting template:', error);
        return false;
    }
};

// Playlist Management
export const createPlaylist = (payload: CreatePlaylistPayload): boolean => {
    try {
        const state = getState();
        const templates = state.rounds.templates || [];
        
        // Get full template objects from IDs
        const playlistTemplates = payload.rounds
            .map(id => templates.find(t => t.id === id))
            .filter((t): t is RoundTemplate => t !== undefined);

        const newPlaylist: RoundPlaylist = {
            id: uuidv4(),
            name: payload.name,
            description: payload.description,
            rounds: playlistTemplates,
            created: new Date(),
            lastModified: new Date()
        };

        const playlists = [...(state.rounds.playlists || []), newPlaylist];
        updateState({
            rounds: {
                ...state.rounds,
                playlists
            }
        });

        return true;
    } catch (error) {
        console.error('Error creating playlist:', error);
        return false;
    }
};

export const updatePlaylist = (id: string, updates: Partial<RoundPlaylist>): boolean => {
    try {
        const state = getState();
        const playlists = state.rounds.playlists || [];
        const index = playlists.findIndex(p => p.id === id);
        
        if (index === -1) return false;

        const updatedPlaylists = [...playlists];
        updatedPlaylists[index] = {
            ...updatedPlaylists[index],
            ...updates,
            lastModified: new Date()
        };

        updateState({
            rounds: {
                ...state.rounds,
                playlists: updatedPlaylists
            }
        });

        return true;
    } catch (error) {
        console.error('Error updating playlist:', error);
        return false;
    }
};

export const deletePlaylist = (id: string): boolean => {
    try {
        const state = getState();
        const playlists = state.rounds.playlists || [];
        const updatedPlaylists = playlists.filter(p => p.id !== id);

        // If this is the active playlist, stop it
        if (state.rounds.activePlaylist?.id === id) {
            stopPlaylist();
        }

        updateState({
            rounds: {
                ...state.rounds,
                playlists: updatedPlaylists
            }
        });

        return true;
    } catch (error) {
        console.error('Error deleting playlist:', error);
        return false;
    }
};

// Playlist Playback Control
export const startPlaylist = (id: string): boolean => {
    try {
        const state = getState();
        const playlist = state.rounds.playlists?.find(p => p.id === id);
        if (!playlist || playlist.rounds.length === 0) return false;

        // Start with first round in playlist
        const firstRound = playlist.rounds[0];
        const roundConfig: RoundConfig = {
            ...firstRound.config,
            number: (state.rounds.history?.length || 0) + 1
        };

        updateState({
            rounds: {
                ...state.rounds,
                current: roundConfig,
                activePlaylist: {
                    id: playlist.id,
                    currentIndex: 0
                }
            }
        });

        return true;
    } catch (error) {
        console.error('Error starting playlist:', error);
        return false;
    }
};

export const stopPlaylist = (): void => {
    const state = getState();
    updateState({
        rounds: {
            ...state.rounds,
            activePlaylist: undefined
        }
    });
};

export const nextInPlaylist = (): boolean => {
    try {
        const state = getState();
        const { activePlaylist } = state.rounds;
        if (!activePlaylist) return false;

        const playlist = state.rounds.playlists?.find(p => p.id === activePlaylist.id);
        if (!playlist) return false;

        const nextIndex = activePlaylist.currentIndex + 1;
        if (nextIndex >= playlist.rounds.length) return false;

        const nextRound = playlist.rounds[nextIndex];
        const roundConfig: RoundConfig = {
            ...nextRound.config,
            number: (state.rounds.history?.length || 0) + 1
        };

        updateState({
            rounds: {
                ...state.rounds,
                current: roundConfig,
                activePlaylist: {
                    ...activePlaylist,
                    currentIndex: nextIndex
                }
            }
        });

        return true;
    } catch (error) {
        console.error('Error advancing playlist:', error);
        return false;
    }
};

export const previousInPlaylist = (): boolean => {
    try {
        const state = getState();
        const { activePlaylist } = state.rounds;
        if (!activePlaylist) return false;

        const playlist = state.rounds.playlists?.find(p => p.id === activePlaylist.id);
        if (!playlist) return false;

        const prevIndex = activePlaylist.currentIndex - 1;
        if (prevIndex < 0) return false;

        const prevRound = playlist.rounds[prevIndex];
        const roundConfig: RoundConfig = {
            ...prevRound.config,
            number: (state.rounds.history?.length || 0) + 1
        };

        updateState({
            rounds: {
                ...state.rounds,
                current: roundConfig,
                activePlaylist: {
                    ...activePlaylist,
                    currentIndex: prevIndex
                }
            }
        });

        return true;
    } catch (error) {
        console.error('Error moving to previous round:', error);
        return false;
    }
};

