// import React from 'react';
import { useTranslation, Trans } from 'react-i18next'; 
import { MantineProvider } from '@mantine/core';
import { ScoreboardProvider } from './contexts/ScoreboardContext';
import ScoreboardDisplay from './components/ScoreboardDisplay';
import ScoreboardControl from './components/ScoreboardControl'; 

// Import Mantine core styles
import '@mantine/core/styles.css';

/**
 * Root component for the Improv Scoreboard application.
 */
function App() {
  const { t } = useTranslation(); 
  // TODO: Implement simple routing based on URL hash (#/display, #/control)
  const view = window.location.hash || '#/display'; // Default to display

  return (
    <MantineProvider>
      <ScoreboardProvider>
        {/* Conditionally render based on view */} 
        {view === '#/display' ? (
          <ScoreboardDisplay />
        ) : view === '#/control' ? (
          <ScoreboardControl /> 
        ) : (
           // Fallback for unknown hash
           <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col items-center justify-center">
              <h1 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">
                  {t('app.unknownView')} 
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                  {/* Translate message with links using Trans component */}
                  <Trans 
                      i18nKey="app.unknownViewMsg" 
                      components={[
                          <a href="#/display" className='text-blue-500 hover:underline'>{t('app.displayLinkText')}</a>,
                          <a href="#/control" className='text-blue-500 hover:underline'>{t('app.controlLinkText')}</a>
                      ]}
                  />
              </p>
           </div>
        )}
      </ScoreboardProvider>
    </MantineProvider>
  );
}

export default App;
