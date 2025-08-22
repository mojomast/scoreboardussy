import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

interface AccessibilityContextType {
  // Focus management
  focusTraps: Set<string>;
  addFocusTrap: (id: string) => void;
  removeFocusTrap: (id: string) => void;
  isFocusTrapped: (id: string) => boolean;

  // Screen reader announcements
  announceToScreenReader: (message: string, priority?: 'polite' | 'assertive') => void;

  // Keyboard navigation
  enableKeyboardNavigation: boolean;
  toggleKeyboardNavigation: () => void;

  // High contrast mode
  highContrastMode: boolean;
  toggleHighContrastMode: () => void;

  // Focus indicators
  showFocusIndicators: boolean;
  toggleFocusIndicators: () => void;

  // Reduced motion
  prefersReducedMotion: boolean;

  // Skip links
  skipToContent: (targetId: string) => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

interface AccessibilityProviderProps {
  children: ReactNode;
}

export const AccessibilityProvider: React.FC<AccessibilityProviderProps> = ({ children }) => {
  const [focusTraps, setFocusTraps] = useState<Set<string>>(new Set());
  const [enableKeyboardNavigation, setEnableKeyboardNavigation] = useState(true);
  const [highContrastMode, setHighContrastMode] = useState(false);
  const [showFocusIndicators, setShowFocusIndicators] = useState(true);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  // Screen reader live region for announcements
  const [announcement, setAnnouncement] = useState<{ message: string; priority: 'polite' | 'assertive' } | null>(null);

  // Check for reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Load accessibility preferences from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('improvscoreboard-accessibility');
      if (saved) {
        const prefs = JSON.parse(saved);
        setHighContrastMode(prefs.highContrastMode || false);
        setShowFocusIndicators(prefs.showFocusIndicators !== false); // Default to true
      }
    } catch (error) {
      console.warn('Failed to load accessibility preferences:', error);
    }
  }, []);

  // Save accessibility preferences
  useEffect(() => {
    try {
      const prefs = {
        highContrastMode,
        showFocusIndicators
      };
      localStorage.setItem('improvscoreboard-accessibility', JSON.stringify(prefs));
    } catch (error) {
      console.warn('Failed to save accessibility preferences:', error);
    }
  }, [highContrastMode, showFocusIndicators]);

  // Apply high contrast mode to document
  useEffect(() => {
    if (highContrastMode) {
      document.documentElement.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
    }
  }, [highContrastMode]);

  // Apply focus indicators preference
  useEffect(() => {
    if (!showFocusIndicators) {
      document.documentElement.classList.add('no-focus-indicators');
    } else {
      document.documentElement.classList.remove('no-focus-indicators');
    }
  }, [showFocusIndicators]);

  const addFocusTrap = useCallback((id: string) => {
    setFocusTraps(prev => new Set(prev).add(id));
  }, []);

  const removeFocusTrap = useCallback((id: string) => {
    setFocusTraps(prev => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });
  }, []);

  const isFocusTrapped = useCallback((id: string) => {
    return focusTraps.has(id);
  }, [focusTraps]);

  const announceToScreenReader = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    setAnnouncement({ message, priority });
    // Clear the announcement after it's been read
    setTimeout(() => setAnnouncement(null), 1000);
  }, []);

  const toggleKeyboardNavigation = useCallback(() => {
    setEnableKeyboardNavigation(prev => !prev);
  }, []);

  const toggleHighContrastMode = useCallback(() => {
    setHighContrastMode(prev => !prev);
    announceToScreenReader(
      highContrastMode ? 'High contrast mode disabled' : 'High contrast mode enabled',
      'assertive'
    );
  }, [highContrastMode, announceToScreenReader]);

  const toggleFocusIndicators = useCallback(() => {
    setShowFocusIndicators(prev => !prev);
    announceToScreenReader(
      showFocusIndicators ? 'Focus indicators disabled' : 'Focus indicators enabled',
      'assertive'
    );
  }, [showFocusIndicators, announceToScreenReader]);

  const skipToContent = useCallback((targetId: string) => {
    const target = document.getElementById(targetId);
    if (target) {
      target.focus();
      target.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth' });
    }
  }, [prefersReducedMotion]);

  const contextValue: AccessibilityContextType = {
    focusTraps,
    addFocusTrap,
    removeFocusTrap,
    isFocusTrapped,
    announceToScreenReader,
    enableKeyboardNavigation,
    toggleKeyboardNavigation,
    highContrastMode,
    toggleHighContrastMode,
    showFocusIndicators,
    toggleFocusIndicators,
    prefersReducedMotion,
    skipToContent
  };

  return (
    <AccessibilityContext.Provider value={contextValue}>
      {children}

      {/* Screen reader announcement live regions */}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        role="status"
      >
        {announcement?.priority === 'polite' ? announcement.message : ''}
      </div>
      <div
        aria-live="assertive"
        aria-atomic="true"
        className="sr-only"
        role="alert"
      >
        {announcement?.priority === 'assertive' ? announcement.message : ''}
      </div>

      {/* Skip to main content link */}
      <button
        onClick={() => skipToContent('main-content')}
        className="skip-link"
        aria-label="Skip to main content"
      >
        Skip to main content
      </button>
    </AccessibilityContext.Provider>
  );
};

export const useAccessibility = (): AccessibilityContextType => {
  const context = useContext(AccessibilityContext);
  if (context === undefined) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
};