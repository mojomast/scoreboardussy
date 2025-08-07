// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Mock ResizeObserver which is not available in the Jest environment
class ResizeObserverMock {
  observe = jest.fn();
  unobserve = jest.fn();
  disconnect = jest.fn();
}

// Assign the mock to the global object
window.ResizeObserver = ResizeObserverMock as any;

// Mock matchMedia which is not available in the Jest environment
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock the socket.io-client
jest.mock('socket.io-client', () => {
  const socket = {
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
    connect: jest.fn(),
    disconnect: jest.fn(),
  };
  return {
    io: jest.fn(() => socket),
    socket,
  };
});

// Mock the ScoreboardContext
jest.mock('@/contexts/ScoreboardContext', () => ({
  useScoreboard: jest.fn(() => ({
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
  })),
}));

// Mock i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: any) => {
      // Simple mock implementation that returns the key if no options
      if (!options) return key;
      
      // Handle interpolation for simple cases
      let result = key;
      if (typeof options === 'object') {
        Object.keys(options).forEach(optionKey => {
          if (typeof options[optionKey] === 'string' || typeof options[optionKey] === 'number') {
            result += ` ${options[optionKey]}`;
          }
        });
      }
      return result;
    },
    i18n: {
      changeLanguage: jest.fn(),
      language: 'en'
    }
  }),
Trans: ({ i18nKey, components: _components }: { i18nKey: string, components?: any[] }) => i18nKey
}));