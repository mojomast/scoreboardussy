import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { RoundControl } from '../';
import { useScoreboard } from '@/contexts/ScoreboardContext';
import { RoundType } from '@server-types/rounds.types';
import { MantineProvider } from '@mantine/core';

// Mock the useScoreboard hook
jest.mock('@/contexts/ScoreboardContext');

// Mock the useTranslation hook
jest.mock('react-i18next', () => ({
  useTranslation: jest.fn(() => ({
    t: (key: string) => key,
    i18n: {
      language: 'en'
    }
  }))
}));

describe('RoundControl', () => {
  // Setup default mock implementations
  beforeEach(() => {
    // Mock useScoreboard implementation
    (useScoreboard as jest.Mock).mockReturnValue({
      state: {
        rounds: {
          current: null,
          history: [
            {
              id: 'round1',
              number: 1,
              type: RoundType.SHORTFORM,
              isMixed: false,
              theme: 'Test Theme',
              minPlayers: 2,
              maxPlayers: 4,
              timeLimit: 60,
              points: { team1: 3, team2: 2 },
              penalties: {
                team1: { major: 0, minor: 0 },
                team2: { major: 0, minor: 0 }
              },
              notes: 'Test notes'
            }
          ],
          isBetweenRounds: true,
          templates: [
            {
              id: 'template1',
              name: 'Test Template',
              type: RoundType.SHORTFORM,
              isMixed: false,
              theme: 'Template Theme',
              minPlayers: 2,
              maxPlayers: 4,
              timeLimit: 60
            }
          ],
          playlists: [
            {
              id: 'playlist1',
              name: 'Test Playlist',
              description: 'Test Description',
              rounds: ['template1']
            }
          ],
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
      },
      connectionState: 'connected',
      isConnected: true,
      startRound: jest.fn(),
      endRound: jest.fn(),
      saveTemplate: jest.fn(),
      updateTemplate: jest.fn(),
      deleteTemplate: jest.fn(),
      createPlaylist: jest.fn(),
      updatePlaylist: jest.fn(),
      deletePlaylist: jest.fn(),
      startPlaylist: jest.fn(),
      nextInPlaylist: jest.fn(),
      previousInPlaylist: jest.fn(),
      stopPlaylist: jest.fn()
    });
  });

  // Helper function to render with MantineProvider
  const renderWithMantine = (ui: React.ReactElement) => {
    return render(
      <MantineProvider>
        {ui}
      </MantineProvider>
    );
  };

  test('renders without crashing', () => {
    renderWithMantine(<RoundControl />);
    // Check that the component renders without crashing
    expect(screen.getByText('rounds.title')).toBeInTheDocument();
  });

  test('renders current round section when no active round', () => {
    renderWithMantine(<RoundControl />);
    // Check that the current round section is rendered
    expect(screen.getByText('rounds.currentRound')).toBeInTheDocument();
    expect(screen.getByText('rounds.noActiveRound')).toBeInTheDocument();
  });

  test('renders current round details when there is an active round', () => {
    // Mock an active round
    (useScoreboard as jest.Mock).mockReturnValue({
      state: {
        rounds: {
          current: {
            id: 'current1',
            number: 2,
            type: RoundType.LONGFORM,
            isMixed: true,
            theme: 'Active Theme',
            minPlayers: 3,
            maxPlayers: 5,
            timeLimit: 120
          },
          history: [],
          isBetweenRounds: false,
          templates: [],
          playlists: []
        }
      },
      connectionState: 'connected',
      isConnected: true,
      startRound: jest.fn(),
      endRound: jest.fn()
    });

    renderWithMantine(<RoundControl />);
    
    // Check that the current round details are rendered
    expect(screen.getByText('rounds.currentRound')).toBeInTheDocument();
    expect(screen.getByText(/Active Theme/)).toBeInTheDocument();
    expect(screen.getByText(/LONGFORM/i)).toBeInTheDocument();
    expect(screen.getByText(/rounds.mixedTeams/)).toBeInTheDocument();
  });

  test('renders round history section', () => {
    renderWithMantine(<RoundControl />);
    // Check that the round history section is rendered
    expect(screen.getByText('rounds.history')).toBeInTheDocument();
    // Check that the history item is rendered
    expect(screen.getByText(/Test Theme/)).toBeInTheDocument();
  });

  test('renders templates section', () => {
    renderWithMantine(<RoundControl />);
    // Check that the templates section is rendered
    expect(screen.getByText('rounds.templates')).toBeInTheDocument();
    // Check that the template item is rendered
    expect(screen.getByText(/Test Template/)).toBeInTheDocument();
  });

  test('renders playlists section', () => {
    renderWithMantine(<RoundControl />);
    // Check that the playlists section is rendered
    expect(screen.getByText('rounds.playlists')).toBeInTheDocument();
    // Check that the playlist item is rendered
    expect(screen.getByText(/Test Playlist/)).toBeInTheDocument();
  });

  test('calls startRound when creating a new round', () => {
    const mockStartRound = jest.fn();
    (useScoreboard as jest.Mock).mockReturnValue({
      state: {
        rounds: {
          current: null,
          history: [],
          isBetweenRounds: true,
          templates: [],
          playlists: []
        }
      },
      connectionState: 'connected',
      isConnected: true,
      startRound: mockStartRound
    });

    renderWithMantine(<RoundControl />);

    // Find the new round button
    const newRoundButton = screen.getByText('rounds.newRound');
    fireEvent.click(newRoundButton);

    // Find the form inputs
    const themeInput = screen.getByLabelText('rounds.themeLabel');
    const typeSelect = screen.getByLabelText('rounds.typeLabel');
    const createButton = screen.getByText('rounds.createRound');

    // Fill the form
    fireEvent.change(themeInput, { target: { value: 'New Theme' } });
    fireEvent.change(typeSelect, { target: { value: RoundType.SHORTFORM } });

    // Submit the form
    fireEvent.click(createButton);

    // Check that startRound was called with the correct arguments
    expect(mockStartRound).toHaveBeenCalledWith(expect.objectContaining({
      theme: 'New Theme',
      type: RoundType.SHORTFORM
    }));
  });

  test('calls saveTemplate when creating a new template', () => {
    const mockSaveTemplate = jest.fn();
    (useScoreboard as jest.Mock).mockReturnValue({
      state: {
        rounds: {
          current: null,
          history: [],
          isBetweenRounds: true,
          templates: [],
          playlists: []
        }
      },
      connectionState: 'connected',
      isConnected: true,
      saveTemplate: mockSaveTemplate
    });

    renderWithMantine(<RoundControl />);

    // Find the new template button
    const newTemplateButton = screen.getByText('rounds.newTemplate');
    fireEvent.click(newTemplateButton);

    // Find the form inputs
    const nameInput = screen.getByLabelText('rounds.templateNameLabel');
    const themeInput = screen.getByLabelText('rounds.themeLabel');
    const typeSelect = screen.getByLabelText('rounds.typeLabel');
    const saveButton = screen.getByText('rounds.saveTemplate');

    // Fill the form
    fireEvent.change(nameInput, { target: { value: 'New Template' } });
    fireEvent.change(themeInput, { target: { value: 'Template Theme' } });
    fireEvent.change(typeSelect, { target: { value: RoundType.LONGFORM } });

    // Submit the form
    fireEvent.click(saveButton);

    // Check that saveTemplate was called with the correct arguments
    expect(mockSaveTemplate).toHaveBeenCalledWith(expect.objectContaining({
      name: 'New Template',
      theme: 'Template Theme',
      type: RoundType.LONGFORM
    }));
  });

  test('calls createPlaylist when creating a new playlist', () => {
    const mockCreatePlaylist = jest.fn();
    (useScoreboard as jest.Mock).mockReturnValue({
      state: {
        rounds: {
          current: null,
          history: [],
          isBetweenRounds: true,
          templates: [
            {
              id: 'template1',
              name: 'Test Template',
              type: RoundType.SHORTFORM,
              theme: 'Template Theme'
            }
          ],
          playlists: []
        }
      },
      connectionState: 'connected',
      isConnected: true,
      createPlaylist: mockCreatePlaylist
    });

    renderWithMantine(<RoundControl />);

    // Find the new playlist button
    const newPlaylistButton = screen.getByText('rounds.newPlaylist');
    fireEvent.click(newPlaylistButton);

    // Find the form inputs
    const nameInput = screen.getByLabelText('rounds.playlistNameLabel');
    const descriptionInput = screen.getByLabelText('rounds.playlistDescriptionLabel');
    const createButton = screen.getByText('rounds.createPlaylist');

    // Fill the form
    fireEvent.change(nameInput, { target: { value: 'New Playlist' } });
    fireEvent.change(descriptionInput, { target: { value: 'Playlist Description' } });

    // Submit the form
    fireEvent.click(createButton);

    // Check that createPlaylist was called with the correct arguments
    expect(mockCreatePlaylist).toHaveBeenCalledWith(expect.objectContaining({
      name: 'New Playlist',
      description: 'Playlist Description'
    }));
  });
});