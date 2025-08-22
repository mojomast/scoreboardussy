import React from 'react';
import { Tournament } from '../../types/tournament.types';

interface TournamentFormProps {
  tournament?: Tournament | null;
  onClose: () => void;
}

const TournamentForm: React.FC<TournamentFormProps> = ({ tournament, onClose }) => {
  return (
    <div>
      <p>Tournament Form Component</p>
      <p>Tournament: {tournament?.name || 'New Tournament'}</p>
      <button onClick={onClose}>Close</button>
    </div>
  );
};

export default TournamentForm;