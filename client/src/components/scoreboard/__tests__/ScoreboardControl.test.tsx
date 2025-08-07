import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ScoreboardControl } from '../';
import { useScoreboard } from '@/contexts/ScoreboardContext';
import { useTranslation } from 'react-i18next';
import { MantineProvider } from '@mantine/core';

// Mock the useScoreboard hook
jest.mock('@/contexts/ScoreboardContext');

// Mock the useTranslation hook
jest.mock('react-i18next', () => ({
  useTranslation: jest.fn()
}));

describe('ScoreboardControl', () => {
  // Setup default mock implementations
  beforeEach(() => {
    // Mock useScoreboard implementation
    (useScoreboard as jest.Mock).mockReturnValue({
      state: {
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
        titleText: 'Test Title',
        footerText: 'Test Footer',
        titleTextColor: '#FFFFFF',
        titleTextSize: 2,
        footerTextColor: '#CCCCCC',
        footerTextSize: 1.25,
        showScore: true,
        showPenalties: true,
        showEmojis: true,
        team1Emoji: null,
        team2Emoji: null,
        rounds: {
          current: null,
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
      },
      connectionState: 'connected',
      isConnected: true,
      connectionError: null,
      queueLength: 0,
      updateTeam: jest.fn(),
      updateScore: jest.fn(),
      updatePenalty: jest.fn(),
      resetPenalties: jest.fn(),
      getTeam: jest.fn(),
      updateLogo: jest.fn(),
      updateText: jest.fn(),
      updateTextStyle: jest.fn(),
      updateLogoSize: jest.fn(),
      updateVisibility: jest.fn(),
      resetAll: jest.fn(),
      switchTeamEmojis: jest.fn(),
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
      stopPlaylist: jest.fn(),
      exportMatch: jest.fn(),
      reconnect: jest.fn()
    });

    // Mock useTranslation implementation
    (useTranslation as jest.Mock).mockReturnValue({
      t: (key: string) => key,
      i18n: {
        changeLanguage: jest.fn(),
        language: 'en'
      }
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
    renderWithMantine(<ScoreboardControl />);
    // Check that the component renders without crashing
    expect(screen.getByText('scoreboardControl.title')).toBeInTheDocument();
  });

  test('renders preview section', () => {
    renderWithMantine(<ScoreboardControl />);
    // Check that the preview section is rendered
    expect(screen.getByText('preview.title')).toBeInTheDocument();
  });

  test('renders tabs', () => {
    renderWithMantine(<ScoreboardControl />);
    // Check that the tabs are rendered
    expect(screen.getByText('scoreboardControl.tabTeams')).toBeInTheDocument();
    expect(screen.getByText('scoreboardControl.tabRounds')).toBeInTheDocument();
    expect(screen.getByText('scoreboardControl.tabSettings')).toBeInTheDocument();
  });

  test('displays loading message when state is null', () => {
    // Mock state as null
    (useScoreboard as jest.Mock).mockReturnValue({
      state: null,
      isConnected: true,
      connectionState: 'connected'
    });

    renderWithMantine(<ScoreboardControl />);
    // Check that the loading message is displayed
    expect(screen.getByText('scoreboardControl.loadingState')).toBeInTheDocument();
  });

  test('displays disconnected message when not connected', () => {
    // Mock isConnected as false
    (useScoreboard as jest.Mock).mockReturnValue({
      state: null,
      isConnected: false,
      connectionState: 'disconnected'
    });

    renderWithMantine(<ScoreboardControl />);
    // Check that the disconnected message is displayed
    expect(screen.getByText('scoreboardControl.disconnected')).toBeInTheDocument();
  });

  test('calls updateText when updating title', () => {
    const mockUpdateText = jest.fn();
    (useScoreboard as jest.Mock).mockReturnValue({
      state: {
        team1: { id: 'team1', name: 'Team 1', color: '#0000FF', score: 0, penalties: { major: 0, minor: 0 } },
        team2: { id: 'team2', name: 'Team 2', color: '#FF0000', score: 0, penalties: { major: 0, minor: 0 } },
        titleText: 'Test Title',
        footerText: 'Test Footer',
        rounds: { current: null, history: [] }
      },
      isConnected: true,
      connectionState: 'connected',
      updateText: mockUpdateText
    });

    renderWithMantine(<ScoreboardControl />);

    // Find the title input and update button
    const titleInput = screen.getByLabelText('scoreboardControl.titleTextLabel');
    const updateButton = screen.getByText('scoreboardControl.updateTitleBtn');

    // Change the input value
    fireEvent.change(titleInput, { target: { value: 'New Title' } });

    // Click the update button
    fireEvent.click(updateButton);

    // Check that updateText was called with the correct arguments
    expect(mockUpdateText).toHaveBeenCalledWith({ field: 'titleText', text: 'New Title' });
  });

  test('calls resetAll when reset button is clicked', () => {
    const mockResetAll = jest.fn();
    (useScoreboard as jest.Mock).mockReturnValue({
      state: {
        team1: { id: 'team1', name: 'Team 1', color: '#0000FF', score: 0, penalties: { major: 0, minor: 0 } },
        team2: { id: 'team2', name: 'Team 2', color: '#FF0000', score: 0, penalties: { major: 0, minor: 0 } },
        rounds: { current: null, history: [] }
      },
      isConnected: true,
      connectionState: 'connected',
      resetAll: mockResetAll
    });

    renderWithMantine(<ScoreboardControl />);

    // Find the reset button
    const resetButton = screen.getByText('scoreboardControl.resetAllBtn');

    // Click the reset button
    fireEvent.click(resetButton);

    // Check that resetAll was called
    expect(mockResetAll).toHaveBeenCalled();
  });

  test('calls updateVisibility when visibility checkbox is toggled', () => {
    const mockUpdateVisibility = jest.fn();
    (useScoreboard as jest.Mock).mockReturnValue({
      state: {
        team1: { id: 'team1', name: 'Team 1', color: '#0000FF', score: 0, penalties: { major: 0, minor: 0 } },
        team2: { id: 'team2', name: 'Team 2', color: '#FF0000', score: 0, penalties: { major: 0, minor: 0 } },
        showScore: true,
        showPenalties: true,
        rounds: { current: null, history: [] }
      },
      isConnected: true,
      connectionState: 'connected',
      updateVisibility: mockUpdateVisibility
    });

    renderWithMantine(<ScoreboardControl />);

    // Find the show score checkbox
    const showScoreCheckbox = screen.getByLabelText('scoreboardControl.showScoreLabel');

    // Toggle the checkbox
    fireEvent.click(showScoreCheckbox);

    // Check that updateVisibility was called with the correct arguments
    expect(mockUpdateVisibility).toHaveBeenCalledWith({ target: 'score', visible: false });
  });

  test('calls switchTeamEmojis when switch emojis button is clicked', () => {
    const mockSwitchTeamEmojis = jest.fn();
    (useScoreboard as jest.Mock).mockReturnValue({
      state: {
        team1: { id: 'team1', name: 'Team 1', color: '#0000FF', score: 0, penalties: { major: 0, minor: 0 } },
        team2: { id: 'team2', name: 'Team 2', color: '#FF0000', score: 0, penalties: { major: 0, minor: 0 } },
        showEmojis: true,
        team1Emoji: 'hand',
        team2Emoji: 'fist',
        rounds: { current: null, history: [] }
      },
      isConnected: true,
      connectionState: 'connected',
      switchTeamEmojis: mockSwitchTeamEmojis
    });

    renderWithMantine(<ScoreboardControl />);

    // Find the switch emojis button
    const switchEmojisButton = screen.getByText('scoreboardControl.switchEmojisButton');

    // Click the button
    fireEvent.click(switchEmojisButton);

    // Check that switchTeamEmojis was called
    expect(mockSwitchTeamEmojis).toHaveBeenCalled();
  });
});