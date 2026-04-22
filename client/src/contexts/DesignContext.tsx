import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export type ElementType = 'scoreboard' | 'controlPanel' | 'voting';
export type DesignVariant = 'cyberpunk' | 'minimalist' | 'retro';

export type DesignSelection = Record<ElementType, DesignVariant>;

const STORAGE_KEY = 'improv_design_selection';

const defaultDesigns: DesignSelection = {
  scoreboard: 'cyberpunk',
  controlPanel: 'minimalist',
  voting: 'retro',
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
        ['cyberpunk', 'minimalist', 'retro'].includes(parsed.controlPanel) &&
        ['cyberpunk', 'minimalist', 'retro'].includes(parsed.voting)
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
  setDesign: (element: ElementType, variant: DesignVariant) => void;
  resetDesigns: () => void;
}

const DesignContext = createContext<DesignContextValue | null>(null);

export function DesignProvider({ children }: { children: React.ReactNode }) {
  const [designs, setDesigns] = useState<DesignSelection>(loadDesigns);

  useEffect(() => {
    saveDesigns(designs);
  }, [designs]);

  const setDesign = useCallback((element: ElementType, variant: DesignVariant) => {
    setDesigns((prev) => ({ ...prev, [element]: variant }));
  }, []);

  const resetDesigns = useCallback(() => {
    setDesigns(defaultDesigns);
  }, []);

  return (
    <DesignContext.Provider value={{ designs, setDesign, resetDesigns }}>
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

const elementLabels: Record<ElementType, string> = {
  scoreboard: 'Scoreboard',
  controlPanel: 'Control Panel',
  voting: 'Voting',
};

const variants: DesignVariant[] = ['cyberpunk', 'minimalist', 'retro'];

export function DesignPicker() {
  const { designs, setDesign, resetDesigns } = useDesign();

  return (
    <div className="design-picker">
      <h3>Design Theme</h3>
      {(Object.keys(elementLabels) as ElementType[]).map((element) => (
        <div key={element} className="design-picker-row">
          <span className="design-picker-label">{elementLabels[element]}</span>
          <div className="design-picker-options">
            {variants.map((variant) => (
              <button
                key={variant}
                className={
                  'design-picker-option' +
                  (designs[element] === variant ? ' design-picker-option--active' : '')
                }
                onClick={() => setDesign(element, variant)}
                aria-pressed={designs[element] === variant}
              >
                {variant.charAt(0).toUpperCase() + variant.slice(1)}
              </button>
            ))}
          </div>
        </div>
      ))}
      <button className="design-picker-reset" onClick={resetDesigns}>
        Reset to Defaults
      </button>
    </div>
  );
}
