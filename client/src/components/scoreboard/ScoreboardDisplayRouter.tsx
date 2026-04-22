import React from 'react';
import { useDesign } from '../../contexts/DesignContext';
import CyberpunkScoreboard from './variants/CyberpunkScoreboard';
import MinimalistScoreboard from './variants/MinimalistScoreboard';
import RetroScoreboard from './variants/RetroScoreboard';

type Team = {
  name: string;
  score: number;
  color: string;
  penalties?: number;
};

interface ScoreboardDisplayRouterProps {
  team1: Team;
  team2: Team;
  currentRound: number;
  timer: number;
  isLive: boolean;
}

const ScoreboardDisplayRouter: React.FC<ScoreboardDisplayRouterProps> = (props) => {
  const { designs } = useDesign();

  switch (designs.scoreboard) {
    case 'cyberpunk':
      return <CyberpunkScoreboard {...props} />;
    case 'minimalist':
      return <MinimalistScoreboard {...props as any} />;
    case 'retro':
      return <RetroScoreboard {...props} />;
    default:
      return <CyberpunkScoreboard {...props} />;
  }
};

export default ScoreboardDisplayRouter;
