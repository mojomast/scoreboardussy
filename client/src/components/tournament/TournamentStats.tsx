import React from 'react';
import { Tournament } from '../../types/tournament.types';

interface TournamentStatsProps {
  tournament: Tournament;
}

const TournamentStats: React.FC<TournamentStatsProps> = ({ tournament }) => {
  return (
    <div>
      <h3>Tournament Statistics</h3>
      <p>Tournament: {tournament.name}</p>
      <p>Statistics dashboard coming soon...</p>
    </div>
  );
};

export default TournamentStats;