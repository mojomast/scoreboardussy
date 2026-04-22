import { useEffect, useState } from 'react';
import { useTranslation, Trans } from 'react-i18next';
import { MantineProvider } from '@mantine/core';
import { ScoreboardProvider } from './contexts/ScoreboardContext';
import Home from './components/Home';
import ScoreboardDisplayRouter from './components/scoreboard/ScoreboardDisplayRouter';
import ControlPanelRouter from './components/control/ControlPanelRouter';
import VotingInterfaceRouter from './components/voting/VotingInterfaceRouter';
import DesignPicker from './components/ui/DesignPicker';

import '@mantine/core/styles.css';

function App() {
  const { t } = useTranslation();

  const parseRoute = () => {
    const hash = window.location.hash || '#/home';
    const path = hash.substring(1);

    const roomMatch = path.match(/^\/room\/([A-Z0-9]{6})(\/control)?$/);
    if (roomMatch) {
      const code = roomMatch[1];
      const isControl = !!roomMatch[2];
      return { view: 'room', code, isControl };
    }

    return { view: path.replace(/\?.*$/, ''), code: null, isControl: false };
  };

  const [route, setRoute] = useState(parseRoute());

  useEffect(() => {
    const handleHashChange = () => setRoute(parseRoute());
    window.addEventListener('hashchange', handleHashChange);
    handleHashChange();
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const demoTeam1 = { name: 'Red Team', score: 42, color: '#EF4444', penalties: 3 };
  const demoTeam2 = { name: 'Blue Team', score: 38, color: '#3B82F6', penalties: 1 };

  let viewComponent;

  if (route.view === 'room' && route.code) {
    viewComponent = route.isControl 
      ? <ControlPanelRouter /> 
      : <ScoreboardDisplayRouter team1={demoTeam1} team2={demoTeam2} currentRound={3} timer={120} isLive={true} />;
  } else if (route.view === '/home' || route.view === '/' || route.view === '') {
    viewComponent = <Home />;
  } else if (route.view === '/display') {
    viewComponent = <ScoreboardDisplayRouter team1={demoTeam1} team2={demoTeam2} currentRound={3} timer={120} isLive={true} />;
  } else if (route.view === '/control') {
    viewComponent = <ControlPanelRouter />;
  } else if (route.view === '/vote') {
    viewComponent = (
      <VotingInterfaceRouter 
        team1={demoTeam1} 
        team2={demoTeam2} 
        votes={{ team1: 156, team2: 142 }} 
        isActive={true} 
        onVote={(team: string) => console.log('Voted for:', team)} 
      />
    );
  } else {
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
        <DesignPicker />
      </ScoreboardProvider>
    </MantineProvider>
  );
}

export default App;
