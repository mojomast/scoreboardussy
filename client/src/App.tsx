import { useEffect, useState } from 'react';
import { useTranslation, Trans } from 'react-i18next';
import { MantineProvider } from '@mantine/core';
import { ScoreboardProvider } from './contexts/ScoreboardContext';
import ScoreboardDisplay from './components/scoreboard/ScoreboardDisplay';
import ScoreboardControl from './components/scoreboard/ScoreboardControl';
import Home from './components/Home';

// Import Mantine core styles
import '@mantine/core/styles.css';

function App() {
  const { t } = useTranslation();
  const getHashView = () => {
    const raw = window.location.hash || '#/home';
    // Strip any query string from the hash so "#/control?room=..." matches "#/control"
    const path = raw.split('?')[0] || '#/home';
    return path;
  };
  const [view, setView] = useState<string>(getHashView());

  useEffect(() => {
    const handleHashChange = () => setView(getHashView());
    window.addEventListener('hashchange', handleHashChange);
    handleHashChange();
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  return (
    <MantineProvider>
      <ScoreboardProvider>
        {view === '#/home' ? (
          <Home />
        ) : view === '#/display' ? (
          <ScoreboardDisplay />
        ) : view === '#/control' ? (
          <ScoreboardControl />
        ) : (
          <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col items-center justify-center">
            <h1 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">
              {t('app.unknownView')}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              <Trans
                i18nKey="app.unknownViewMsg"
                components={[
                  <a href="#/display" className="text-blue-500 hover:underline">{t('app.displayLinkText')}</a>,
                  <a href="#/control" className="text-blue-500 hover:underline">{t('app.controlLinkText')}</a>
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
