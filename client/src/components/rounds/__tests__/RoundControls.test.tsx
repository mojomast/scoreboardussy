import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { RoundControls } from '../';
import { useScoreboard } from '@/contexts/ScoreboardContext';
import { RoundType } from '@server-types/rounds.types';

// Mock the useScoreboard hook
jest.mock('@/contexts/ScoreboardContext');

describe('RoundControls', () => {
  // Setup mock implementation for useScoreboard
  const mockStartRound = jest.fn();
  const mockEndRound = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock implementation with no current round
    (useScoreboard as jest.Mock).mockReturnValue({
      state: {
        rounds: {
          current: null,
          history: []
        }
      },
      startRound: mockStartRound,
      endRound: mockEndRound
    });
  });
  
  test('renders start round button when no current round', () => {
    render(<RoundControls />);
    
    const startButton = screen.getByText('Start New Round');
    expect(startButton).toBeInTheDocument();
    
    // End round button should not be present
    expect(screen.queryByText('End Round')).not.toBeInTheDocument();
  });
  
  test('calls startRound when start button is clicked', () => {
    render(<RoundControls />);
    
    const startButton = screen.getByText('Start New Round');
    fireEvent.click(startButton);
    
    expect(mockStartRound).toHaveBeenCalled();
    // Check that it was called with a round config object
    expect(mockStartRound.mock.calls[0][0]).toHaveProperty('number');
    expect(mockStartRound.mock.calls[0][0]).toHaveProperty('type', RoundType.SHORTFORM);
  });
  
  test('renders end round button when there is a current round', () => {
    // Mock a current round
    (useScoreboard as jest.Mock).mockReturnValue({
      state: {
        rounds: {
          current: {
            number: 1,
            type: RoundType.SHORTFORM,
            theme: 'Test Theme',
            isMixed: false,
            minPlayers: 2,
            maxPlayers: 4,
            timeLimit: null
          },
          history: []
        }
      },
      startRound: mockStartRound,
      endRound: mockEndRound
    });
    
    render(<RoundControls />);
    
    // Start button should not be present
    expect(screen.queryByText('Start New Round')).not.toBeInTheDocument();
    
    // End round button should be present
    const endButton = screen.getByText('End Round');
    expect(endButton).toBeInTheDocument();
    
    // Current round info should be displayed
    const roundInfoElement = screen.getByText(/Current Round:/);
    expect(roundInfoElement).toBeInTheDocument();
    
    // Check that the round info contains the theme and type
    expect(screen.getByText(/Test Theme/)).toBeInTheDocument();
    expect(screen.getByText(/SHORTFORM/i)).toBeInTheDocument();
  });
  
  test('calls endRound when end button is clicked', () => {
    // Mock a current round
    (useScoreboard as jest.Mock).mockReturnValue({
      state: {
        rounds: {
          current: {
            number: 1,
            type: RoundType.SHORTFORM,
            theme: 'Test Theme',
            isMixed: false,
            minPlayers: 2,
            maxPlayers: 4,
            timeLimit: null
          },
          history: []
        }
      },
      startRound: mockStartRound,
      endRound: mockEndRound
    });
    
    render(<RoundControls />);
    
    const endButton = screen.getByText('End Round');
    fireEvent.click(endButton);
    
    expect(mockEndRound).toHaveBeenCalled();
    // Check that it was called with the expected payload structure
    expect(mockEndRound.mock.calls[0][0]).toHaveProperty('points');
    expect(mockEndRound.mock.calls[0][0]).toHaveProperty('penalties');
  });
});