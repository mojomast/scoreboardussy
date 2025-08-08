import React from 'react';
import { useScoreboard } from '@/contexts/ScoreboardContext';
import { RoundType } from '@server-types/rounds.types';

const RoundControls: React.FC = () => {
  const { state, startRound, endRound } = useScoreboard();
  const currentRound = state?.rounds.current;
  const isBetween = state?.rounds?.isBetweenRounds === true;
  const gameStatus = (state as any)?.rounds?.gameStatus ?? 'notStarted';

  // Handler for ending the current round
  const handleEndRound = () => {
    if (currentRound && !isBetween) {
      endRound({
        points: { team1: 0, team2: 0 }, // Default points
        penalties: {
          team1: { major: 0, minor: 0 },
          team2: { major: 0, minor: 0 }
        },
        notes: ''
      });
    }
  };

  // Handler for starting a new round
  const handleStartRound = () => {
    const newRoundConfig = {
      number: (state?.rounds?.history?.length || 0) + 1,
      isMixed: false,
      theme: '',
      type: RoundType.SHORTFORM,
      minPlayers: 2,
      maxPlayers: 8,
      timeLimit: null
    };
    
    startRound(newRoundConfig);
  };

  const showCurrent = gameStatus === 'live' && !!currentRound && !isBetween;
  const roundType = currentRound?.type ?? 'shortform';
  const roundTheme = currentRound?.theme ?? '';

  return (
    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-4 border border-gray-200 dark:border-gray-600">
      <h4 className="text-md font-semibold mb-2 text-gray-800 dark:text-white">Round Controls</h4>
      {showCurrent ? (
        <>
          <div className="mb-2">
            <span className="font-medium">Current Round:</span> {roundTheme || 'N/A'} (Type: {roundType})
          </div>
          <button
            className="bg-red-500 hover:bg-red-600 text-white font-bold py-1 px-3 rounded mr-2"
            onClick={handleEndRound}
          >
            End Round
          </button>
        </>
      ) : (
        gameStatus === 'live' ? (
          <button
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-1 px-3 rounded"
            onClick={handleStartRound}
          >
            Start New Round
          </button>
        ) : (
          <span className="text-sm text-gray-600 dark:text-gray-300">No active round</span>
        )
      )}
    </div>
  );
};

export default RoundControls;