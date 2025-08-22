import React from 'react';
import { Tournament } from '../../types/tournament.types';

interface TournamentBracketProps {
  tournament: Tournament;
}

const TournamentBracket: React.FC<TournamentBracketProps> = ({ tournament }) => {
  return (
    <div>
      <h3>Tournament Bracket</h3>
      <p>Tournament: {tournament.name}</p>
      <p>Bracket visualization coming soon...</p>
    </div>
  );
};

export default TournamentBracket;