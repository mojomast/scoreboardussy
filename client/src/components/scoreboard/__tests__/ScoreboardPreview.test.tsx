import React from 'react';
import { render, screen } from '@testing-library/react';
import { ScoreboardPreview } from '../';
import { ScoreboardState } from '@server-types/index';
import { RoundType } from '@server-types/rounds.types';

describe('ScoreboardPreview', () => {
  const mockState: ScoreboardState = {
    team1: {
      id: 'team1',
      name: 'Blue Team',
      color: '#3b82f6',
      score: 5,
      penalties: { major: 2, minor: 1 }
    },
    team2: {
      id: 'team2',
      name: 'Red Team',
      color: '#ef4444',
      score: 3,
      penalties: { major: 0, minor: 2 }
    },
    logoUrl: 'test-logo-url',
    logoSize: 50,
    titleText: 'Test Title',
    footerText: 'Test Footer',
    titleTextColor: '#FFFFFF',
    titleTextSize: 2,
    footerTextColor: '#CCCCCC',
    footerTextSize: 1.25,
    titleStyle: { color: '#FFFFFF', sizeRem: 2 },
    footerStyle: { color: '#CCCCCC', sizeRem: 1.25 },
    showScore: true,
    showPenalties: true,
    showEmojis: true,
    team1Emoji: null,
    team2Emoji: null,
    rounds: {
      current: {
        number: 0,
        type: RoundType.SHORTFORM,
        isMixed: false,
        theme: '',
        minPlayers: 2,
        maxPlayers: 4,
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

  test('renders loading message when state is null', () => {
    render(<ScoreboardPreview state={null} />);
    expect(screen.getByText('scoreboardControl.loadingState')).toBeInTheDocument();
  });

  test('renders team names', () => {
    render(<ScoreboardPreview state={mockState} />);
    expect(screen.getByText('Blue Team')).toBeInTheDocument();
    expect(screen.getByText('Red Team')).toBeInTheDocument();
  });

  test('renders team scores', () => {
    render(<ScoreboardPreview state={mockState} />);
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  test('renders title and footer text', () => {
    render(<ScoreboardPreview state={mockState} />);
    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Test Footer')).toBeInTheDocument();
  });

  test('renders logo when provided', () => {
    const { container } = render(<ScoreboardPreview state={mockState} />);
    const logoImg = container.querySelector('img[src="test-logo-url"]');
    expect(logoImg).toBeInTheDocument();
  });

  test('renders penalties indicators', () => {
    render(<ScoreboardPreview state={mockState} />);
    
    // Check that the penalties container exists
    const penaltyContainers = screen.getAllByRole('generic', { name: '' }).filter(
      element => element.className.includes('flex mt-1 h-2 items-center')
    );
    
    expect(penaltyContainers.length).toBe(2); // One for each team
    
    // Team 1 should have 2 major and 1 minor penalties
    const team1PenaltyContainer = penaltyContainers[0];
    const team1MajorPenalties = team1PenaltyContainer.querySelectorAll('.bg-red-500');
    const team1MinorPenalties = team1PenaltyContainer.querySelectorAll('.bg-yellow-400');
    expect(team1MajorPenalties.length).toBe(2);
    expect(team1MinorPenalties.length).toBe(1);
    
    // Team 2 should have 0 major and 2 minor penalties
    const team2PenaltyContainer = penaltyContainers[1];
    const team2MajorPenalties = team2PenaltyContainer.querySelectorAll('.bg-red-500');
    const team2MinorPenalties = team2PenaltyContainer.querySelectorAll('.bg-yellow-400');
    expect(team2MajorPenalties.length).toBe(0);
    expect(team2MinorPenalties.length).toBe(2);
  });
});