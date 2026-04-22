import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export type ScoreboardVariant = 'cyberpunk' | 'minimalist' | 'retro';
export type ControlPanelVariant = 'dark' | 'touch' | 'gamepad';
export type VotingVariant = 'social' | 'casino' | 'minimal';

export interface DesignSelection {
  scoreboard: ScoreboardVariant;
  controlPanel: ControlPanelVariant;
  voting: VotingVariant;
}

const STORAGE_KEY = 'improv_design_selection_v2';

const defaultDesigns: DesignSelection = {
  scoreboard: 'cyberpunk',
  controlPanel: 'dark',
  voting: 'social',
};

function loadDesigns(): DesignSelection {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (
        typeof parsed === 'object' &&
        parsed !== null &&
        ['cyberpunk', 'minimalist', 'retro'].includes(parsed.scoreboard) &&
        ['dark', 'touch', 'gamepad'].includes(parsed.controlPanel) &&
        ['social', 'casino', 'minimal'].includes(parsed.voting)
      ) {
        return parsed as DesignSelection;
      }
    }
  } catch {
    // ignore parse errors
  }
  return defaultDesigns;
}

function saveDesigns(designs: DesignSelection) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(designs));
  } catch {
    // ignore storage errors
  }
}

export interface DesignContextValue {
  designs: DesignSelection;
  setScoreboardDesign: (variant: ScoreboardVariant) => void;
  setControlPanelDesign: (variant: ControlPanelVariant) => void;
  setVotingDesign: (variant: VotingVariant) => void;
  resetDesigns: () => void;
}

const DesignContext = createContext<DesignContextValue | null>(null);

export function DesignProvider({ children }: { children: React.ReactNode }) {
  const [designs, setDesigns] = useState<DesignSelection>(loadDesigns);

  useEffect(() => {
    saveDesigns(designs);
  }, [designs]);

  const setScoreboardDesign = useCallback((variant: ScoreboardVariant) => {
    setDesigns((prev) => ({ ...prev, scoreboard: variant }));
  }, []);

  const setControlPanelDesign = useCallback((variant: ControlPanelVariant) => {
    setDesigns((prev) => ({ ...prev, controlPanel: variant }));
  }, []);

  const setVotingDesign = useCallback((variant: VotingVariant) => {
    setDesigns((prev) => ({ ...prev, voting: variant }));
  }, []);

  const resetDesigns = useCallback(() => {
    setDesigns(defaultDesigns);
  }, []);

  return (
    <DesignContext.Provider value={{ designs, setScoreboardDesign, setControlPanelDesign, setVotingDesign, resetDesigns }}>
      {children}
    </DesignContext.Provider>
  );
}

export function useDesign(): DesignContextValue {
  const ctx = useContext(DesignContext);
  if (!ctx) {
    throw new Error('useDesign must be used within a DesignProvider');
  }
  return ctx;
}
