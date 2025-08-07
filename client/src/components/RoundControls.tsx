import React from 'react';
import { useScoreboard } from '@/contexts/ScoreboardContext';
import { RoundType } from '@server-types/rounds.types';

const RoundControls: React.FC = () => {
  const { state, startRound, endRound } = useScoreboard();
  const currentRound = state?.rounds?.current;

  return (
    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-4 border border-gray-200 dark:border-gray-600">
      <h4 className="text-md font-semibold mb-2 text-gray-800 dark:text-white">Round Controls</h4>
      {currentRound ? (
        <>
          <div className="mb-2">
            <span className="font-medium">Current Round:</span> {currentRound.theme || 'N/A'} (Type: {currentRound.type})
          </div>
          <button
            className="bg-red-500 hover:bg-red-600 text-white font-bold py-1 px-3 rounded mr-2"
            onClick={() => endRound({ points: { team1: 0, team2: 0 } })}
          >
            End Round
          </button>
        </>
      ) : (
        <button
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-1 px-3 rounded"
          onClick={() => startRound({
            number: (state?.rounds?.history?.length || 0) + 1,
            type: RoundType.SHORTFORM,
            isMixed: false,
            theme: '',
            minPlayers: 2,
            maxPlayers: 8,
            timeLimit: null
          })}
        >
          Start New Round
        </button>
      )}
    </div>
  );
};

export default RoundControls;
