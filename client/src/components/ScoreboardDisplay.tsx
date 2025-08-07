import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Badge, Text, Group } from '@mantine/core';
import { useScoreboard } from '../contexts/ScoreboardContext';
import TeamDisplayPanel from './TeamDisplayPanel';
import FullscreenButton from './FullscreenButton';
import { RoundType } from '@server-types/rounds.types';

const formatRoundType = (type: RoundType): string =>
  type.charAt(0).toUpperCase() + type.slice(1);

const ScoreboardDisplay: React.FC = () => {
  const { t } = useTranslation();
  const { state, connectionState } = useScoreboard();
  const isConnected = connectionState === 'connected';

  const {
    team1,
    team2,
    titleText,
    footerText,
    titleTextColor,
    titleTextSize,
    footerTextColor,
    footerTextSize,
    logoSize,
    showScore,
    showPenalties,
    showEmojis,
    team1Emoji,
    team2Emoji,
    rounds,
  } = state || {};

  const roundSettings = rounds?.settings || {
    showRoundNumber: true,
    showTheme: true,
    showType: true,
    showMixedStatus: true,
    showPlayerLimits: true,
    showTimeLimit: true,
    showRoundHistory: true,
  };

  const [isFullScreen, setIsFullScreen] = useState<boolean>(!!document.fullscreenElement);
  useEffect(() => {
    const handleFullScreenChange = () => setIsFullScreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFullScreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullScreenChange);
  }, []);

  if (!state) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-800 text-white text-2xl">
        {isConnected ? t('scoreboardDisplay.loadingDisplay') : t('scoreboardDisplay.connectingToServer')}
      </div>
    );
  }

  const currentTitle = titleText ?? '';
  const currentFooter = footerText ?? '';

  return (
    <div id="scoreboard-display-container" className={`flex flex-col h-screen w-screen overflow-hidden bg-black ${isFullScreen ? 'cursor-none' : ''} relative`}>
      {!isConnected && (
        <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded z-50">
          {t('scoreboardControl.disconnected')}
        </div>
      )}

      {!isFullScreen && (
        <div className="absolute top-2 right-2 z-50">
          <FullscreenButton targetId="scoreboard-display-container" />
        </div>
      )}

      <div className="w-full flex flex-col items-center">
        {currentTitle && (
          <h1
            className="font-bold text-center mt-4 mb-2 text-gray-200 text-4xl"
            style={{ color: titleTextColor || '#FFFFFF', fontSize: `${titleTextSize || 2}rem` }}
          >
            {currentTitle}
          </h1>
        )}
      </div>

      {rounds?.current && (
        <div className="w-full flex justify-center my-4">
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-4">
              {roundSettings.showRoundNumber && (
                <Badge size="xl" className="text-lg">
                  {t('rounds.numberLabel', 'Round {{number}}', { number: rounds.current.number })}
                </Badge>
              )}
              {roundSettings.showType && (
                <Text size="xl" fw={500} className="text-gray-200">
                  {formatRoundType(rounds.current.type as RoundType)}
                </Text>
              )}
              {roundSettings.showTimeLimit && rounds.current.timeLimit && (
                <Badge color="yellow" size="lg">
                  {t('rounds.timeLimit', 'Time Limit')}: {rounds.current.timeLimit}s
                </Badge>
              )}
            </div>
            {roundSettings.showTheme && rounds.current.theme && (
              <Text size="lg" c="dimmed" mt={2}>
                {t('rounds.theme', 'Theme')}: {rounds.current.theme}
              </Text>
            )}
            {roundSettings.showMixedStatus && rounds.current.isMixed && (
              <Badge color="grape" size="lg" mt={2}>
                {t('rounds.mixedTeams', 'Mixed Teams')}
              </Badge>
            )}
            {roundSettings.showPlayerLimits && (
              <Group mt={2} gap="xs">
                <Text size="sm" c="dimmed">
                  {t('rounds.players', 'Players')}: {rounds.current.minPlayers}-{rounds.current.maxPlayers}
                </Text>
              </Group>
            )}
          </div>
        </div>
      )}

      {roundSettings.showRoundHistory && ((rounds?.history?.length || 0) > 0) && (
        <div className="w-full flex justify-center mb-4">
          <div className="bg-black bg-opacity-50 p-4 rounded">
            <Text size="sm" c="dimmed" ta="center" mb={2}>
              {t('rounds.history', 'Round History')}
            </Text>
            <div className="flex flex-wrap gap-2 justify-center">
              {(rounds?.history || []).map((round, index) => (
                <Badge key={index} variant="dot" size="sm">
                  {round.number}: {round.points.team1}-{round.points.team2}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="relative flex-1 flex flex-row w-full">
        <div className="flex-1 h-full">
          {team1 && (
            <TeamDisplayPanel
              team={team1}
              showScore={showScore}
              showPenalties={showPenalties}
              showEmojis={showEmojis}
              emoji={team1Emoji}
            />
          )}
        </div>
        <div className="flex-1 h-full">
          {team2 && (
            <TeamDisplayPanel
              team={team2}
              showScore={showScore}
              showPenalties={showPenalties}
              showEmojis={showEmojis}
              emoji={team2Emoji}
            />
          )}
        </div>
        {state.logoUrl && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex justify-center z-0">
            <img
              src={state.logoUrl}
              alt={t('scoreboardDisplay.logoAltText') ?? 'Scoreboard Logo'}
              className="max-h-72 max-w-full object-contain"
              style={{ width: `${logoSize ?? 50}%` }}
            />
          </div>
        )}
      </div>
      <div className="w-full flex flex-col items-center pb-4">
        {currentFooter && (
          <p
            className="font-medium text-center text-gray-400 text-xl"
            style={{ color: footerTextColor || '#CCCCCC', fontSize: `${footerTextSize || 1.25}rem` }}
          >
            {currentFooter}
          </p>
        )}
      </div>

      <a
        href="#/control"
        className="fixed bottom-4 right-4 z-50 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded shadow-lg focus:outline-none focus:ring"
      >
        {t('scoreboardDisplay.openControls', 'Open Control Panel')}
      </a>
    </div>
  );
};

export default ScoreboardDisplay;