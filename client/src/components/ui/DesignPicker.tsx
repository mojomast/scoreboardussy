import React, { useState, useEffect, useRef } from 'react';
import { useDesign, ElementType, DesignVariant } from '../../contexts/DesignContext';

const elementLabels: Record<ElementType, string> = {
  scoreboard: 'Scoreboard',
  controlPanel: 'Control Panel',
  voting: 'Voting',
};

const variants: DesignVariant[] = ['cyberpunk', 'minimalist', 'retro'];

const variantLabels: Record<DesignVariant, string> = {
  cyberpunk: 'Cyberpunk',
  minimalist: 'Minimalist',
  retro: 'Retro',
};

const DesignPicker: React.FC = () => {
  const { designs, setDesign, resetDesigns } = useDesign();
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div ref={panelRef} style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999 }}>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen((p) => !p)}
        aria-label="Open design settings"
        style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          border: 'none',
          background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
          color: '#fff',
          cursor: 'pointer',
          boxShadow: '0 4px 20px rgba(99, 102, 241, 0.4), 0 0 0 1px rgba(255,255,255,0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.transform = isOpen ? 'rotate(90deg) scale(1.1)' : 'rotate(0deg) scale(1.1)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.transform = isOpen ? 'rotate(90deg)' : 'rotate(0deg)';
        }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      </button>

      {/* Modal Panel */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            bottom: '72px',
            right: '0',
            width: '320px',
            background: 'linear-gradient(180deg, #1e1e2e 0%, #181825 100%)',
            borderRadius: '16px',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05)',
            padding: '20px',
            animation: 'designPickerSlideIn 0.25s ease-out',
            backdropFilter: 'blur(20px)',
          }}
        >
          <style>{`
            @keyframes designPickerSlideIn {
              from { opacity: 0; transform: translateY(10px) scale(0.96); }
              to { opacity: 1; transform: translateY(0) scale(1); }
            }
          `}</style>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#fff', letterSpacing: '-0.01em' }}>
              Design Theme
            </h3>
            <button
              onClick={() => setIsOpen(false)}
              style={{
                background: 'none',
                border: 'none',
                color: '#888',
                cursor: 'pointer',
                padding: '4px',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#fff'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#888'; }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {(Object.keys(elementLabels) as ElementType[]).map((element) => (
              <div key={element}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>
                  {elementLabels[element]}
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {variants.map((variant) => {
                    const isActive = designs[element] === variant;
                    return (
                      <button
                        key={variant}
                        onClick={() => setDesign(element, variant)}
                        style={{
                          flex: 1,
                          padding: '8px 0',
                          borderRadius: '10px',
                          border: isActive ? '1px solid rgba(99, 102, 241, 0.5)' : '1px solid rgba(255,255,255,0.06)',
                          background: isActive ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255,255,255,0.03)',
                          color: isActive ? '#fff' : '#aaa',
                          fontSize: '13px',
                          fontWeight: isActive ? 600 : 500,
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                        onMouseEnter={(e) => {
                          if (!isActive) {
                            (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.06)';
                            (e.currentTarget as HTMLButtonElement).style.color = '#ddd';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isActive) {
                            (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.03)';
                            (e.currentTarget as HTMLButtonElement).style.color = '#aaa';
                          }
                        }}
                      >
                        {variantLabels[variant]}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <button
              onClick={resetDesigns}
              style={{
                width: '100%',
                padding: '10px 0',
                borderRadius: '10px',
                border: '1px solid rgba(255,255,255,0.08)',
                background: 'rgba(255,255,255,0.03)',
                color: '#888',
                fontSize: '13px',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.06)';
                (e.currentTarget as HTMLButtonElement).style.color = '#fff';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.03)';
                (e.currentTarget as HTMLButtonElement).style.color = '#888';
              }}
            >
              Reset to Defaults
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DesignPicker;
