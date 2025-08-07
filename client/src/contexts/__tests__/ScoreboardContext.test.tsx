import React from 'react';
import { render, screen, act, renderHook } from '@testing-library/react';
import { ScoreboardProvider, useScoreboard } from '../ScoreboardContext';
import { socketManager, ConnectionState } from '../../utils/socketManager';

// Mock the socketManager
jest.mock('../../utils/socketManager', () => {
  // Create a mock implementation of socketManager
  const mockSocketManager = {
    connect: jest.fn(),
    disconnect: jest.fn(),
    emit: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
    onConnectionStateChange: jest.fn(),
    offConnectionStateChange: jest.fn(),
    getConnectionState: jest.fn(),
    getLastError: jest.fn(),
    getQueueLength: jest.fn(),
  };

  // Mock the ConnectionState enum
  const ConnectionState = {
    DISCONNECTED: 'disconnected',
    CONNECTING: 'connecting',
    CONNECTED: 'connected',
    RECONNECTING: 'reconnecting',
    ERROR: 'error'
  };

  return {
    socketManager: mockSocketManager,
    ConnectionState,
    SocketManager: jest.fn().mockImplementation(() => mockSocketManager)
  };
});

describe('ScoreboardContext', () => {
  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mock implementations
    (socketManager.getConnectionState as jest.Mock).mockReturnValue(ConnectionState.CONNECTED);
    (socketManager.getLastError as jest.Mock).mockReturnValue(null);
    (socketManager.getQueueLength as jest.Mock).mockReturnValue(0);
  });

  describe('ScoreboardProvider', () => {
    test('renders children and initializes socket connection', () => {
      render(
        <ScoreboardProvider>
          <div data-testid="test-child">Test Child</div>
        </ScoreboardProvider>
      );

      // Check that children are rendered
      expect(screen.getByTestId('test-child')).toBeInTheDocument();
      
      // Check that socket connection is initialized
      expect(socketManager.connect).toHaveBeenCalledTimes(1);
      expect(socketManager.onConnectionStateChange).toHaveBeenCalledTimes(1);
      expect(socketManager.on).toHaveBeenCalledWith('updateState', expect.any(Function));
    });
  });

  describe('useScoreboard', () => {
    // Helper function to wrap the hook in a provider
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ScoreboardProvider>{children}</ScoreboardProvider>
    );

    test('throws error when used outside of ScoreboardProvider', () => {
      // Suppress console.error for this test
      const originalError = console.error;
      console.error = jest.fn();

      // Expect the hook to throw an error when used outside of provider
      expect(() => {
        const { result } = renderHook(() => useScoreboard());
      }).toThrow('useScoreboard must be used within a ScoreboardProvider');

      // Restore console.error
      console.error = originalError;
    });

    test('returns context value when used within ScoreboardProvider', () => {
      const { result } = renderHook(() => useScoreboard(), { wrapper });

      // Check that the hook returns the expected context value
      expect(result.current).toHaveProperty('state');
      expect(result.current).toHaveProperty('connectionState');
      expect(result.current).toHaveProperty('updateTeam');
      expect(result.current).toHaveProperty('updateScore');
      expect(result.current).toHaveProperty('resetAll');
      // ... and other properties
    });
  });

  describe('Context functions', () => {
    // Helper function to wrap the hook in a provider
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ScoreboardProvider>{children}</ScoreboardProvider>
    );

    test('updateTeam emits updateTeam event', () => {
      const { result } = renderHook(() => useScoreboard(), { wrapper });

      // Call updateTeam
      act(() => {
        result.current.updateTeam({
          teamId: 'team1',
          updates: { name: 'New Team Name' }
        });
      });

      // Check that socketManager.emit was called with the correct arguments
      expect(socketManager.emit).toHaveBeenCalledWith('updateTeam', {
        teamId: 'team1',
        updates: { name: 'New Team Name' }
      });
    });

    test('updateScore emits updateScore event', () => {
      const { result } = renderHook(() => useScoreboard(), { wrapper });

      // Call updateScore
      act(() => {
        result.current.updateScore({
          teamId: 'team2',
          action: 1
        });
      });

      // Check that socketManager.emit was called with the correct arguments
      expect(socketManager.emit).toHaveBeenCalledWith('updateScore', {
        teamId: 'team2',
        action: 1
      });
    });

    test('resetAll emits resetAll event', () => {
      const { result } = renderHook(() => useScoreboard(), { wrapper });

      // Call resetAll
      act(() => {
        result.current.resetAll();
      });

      // Check that socketManager.emit was called with the correct arguments
      expect(socketManager.emit).toHaveBeenCalledWith('resetAll');
    });

    test('getTeam returns the correct team', () => {
      const { result } = renderHook(() => useScoreboard(), { wrapper });

      // Initial state should have team1 and team2
      const team1 = result.current.getTeam('team1');
      expect(team1).toBeDefined();
      expect(team1?.id).toBe('team1');
      expect(team1?.name).toBe('Team 1');

      const team2 = result.current.getTeam('team2');
      expect(team2).toBeDefined();
      expect(team2?.id).toBe('team2');
      expect(team2?.name).toBe('Team 2');
    });

    test('reconnect calls socketManager.connect', () => {
      const { result } = renderHook(() => useScoreboard(), { wrapper });

      // Reset the mock to clear the initial connect call
      (socketManager.connect as jest.Mock).mockClear();

      // Call reconnect
      act(() => {
        result.current.reconnect();
      });

      // Check that socketManager.connect was called
      expect(socketManager.connect).toHaveBeenCalledTimes(1);
    });
  });

  describe('Connection state handling', () => {
    test('updates connection state when socketManager reports changes', () => {
      // Capture the connection state change handler
      let connectionStateHandler: ((state: ConnectionState) => void) | null = null;
      (socketManager.onConnectionStateChange as jest.Mock).mockImplementation((handler) => {
        connectionStateHandler = handler;
        // Call with initial state
        handler(ConnectionState.DISCONNECTED);
      });

      const { result } = renderHook(() => useScoreboard(), {
        wrapper: ({ children }) => <ScoreboardProvider>{children}</ScoreboardProvider>
      });

      // Initial state should be DISCONNECTED
      expect(result.current.connectionState).toBe(ConnectionState.DISCONNECTED);

      // Simulate connection state change to CONNECTED
      act(() => {
        if (connectionStateHandler) {
          connectionStateHandler(ConnectionState.CONNECTED);
        }
      });

      // Connection state should be updated
      expect(result.current.connectionState).toBe(ConnectionState.CONNECTED);

      // Simulate connection state change to ERROR
      (socketManager.getLastError as jest.Mock).mockReturnValue(new Error('Test error'));
      act(() => {
        if (connectionStateHandler) {
          connectionStateHandler(ConnectionState.ERROR);
        }
      });

      // Connection state should be updated and error should be available
      expect(result.current.connectionState).toBe(ConnectionState.ERROR);
      expect(result.current.connectionError).toEqual(new Error('Test error'));
    });
  });
});