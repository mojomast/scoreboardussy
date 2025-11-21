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

  const parseRoute = () => {
    const hash = window.location.hash || '#/home';
    // Remove leading #
    const path = hash.substring(1);

    // Match patterns: /room/:code or /room/:code/control
    const roomMatch = path.match(/^\/room\/([A-Z0-9]{6})(\/control)?$/);
    if (roomMatch) {
      const code = roomMatch[1];
      const isControl = !!roomMatch[2];
      return { view: 'room', code, isControl };
    }

    // Simple hash routes
    return { view: path.replace(/\?.*$/, ''), code: null, isControl: false };
  };

  const [route, setRoute] = useState(parseRoute());

  useEffect(() => {
    const handleHashChange = () => setRoute(parseRoute());
    window.addEventListener('hashchange', handleHashChange);
    handleHashChange();
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  let viewComponent;

  if (route.view === 'room' && route.code) {
    // Room code-based routing
    viewComponent = route.isControl ? <ScoreboardControl /> : <ScoreboardDisplay />;
  } else if (route.view === '/home' || route.view === '/' || route.view === '') {
    viewComponent = <Home />;
  } else if (route.view === '/display') {
    viewComponent = <ScoreboardDisplay />;
  } else if (route.view === '/control') {
    viewComponent = <ScoreboardControl />;
  } else {
    // Unknown view
    viewComponent = (
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
    );
  }

  return (
    <MantineProvider>
      <ScoreboardProvider>
        {viewComponent}
      </ScoreboardProvider>
    </MantineProvider>
  );
}

export default App;

