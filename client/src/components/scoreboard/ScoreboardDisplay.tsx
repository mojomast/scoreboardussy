import React from 'react';
import { useScoreboard } from '@/contexts/ScoreboardContext';
import { TeamDisplayPanel } from '../teams';
import { useTranslation } from 'react-i18next';
import { Badge, Text } from '@mantine/core';
import { RoundType } from '@server-types/rounds.types';

/**
 * The main display component for the scoreboard.
 * Shows two team panels side-by-side with team information and scores.
 */
const formatRoundType = (type: RoundType): string => {
    return type.charAt(0).toUpperCase() + type.slice(1);
};

const ScoreboardDisplay: React.FC = () => {
    const { t } = useTranslation(); // Initialize hook
    const { state, connectionState } = useScoreboard(); // Destructure state
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
        showScore, // Destructure here
        showPenalties, // Destructure here
        showEmojis, // Destructure here
        team1Emoji, // Destructure here
        team2Emoji, // Destructure here
        rounds // Add rounds
    } = state || {}; // Safely destructure, provide default empty object if state is null

    // Extract round settings with defaults
    const roundSettings = rounds?.settings || {
        showRoundNumber: true,
        showTheme: true,
        showType: true,
        showMixedStatus: true,
        showPlayerLimits: true,
        showTimeLimit: true,
        showRoundHistory: true
    };

    // Check if connected
    const isConnected = connectionState === 'connected';

    if (!state) {
        // Display a loading or disconnected message
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-800 text-white text-2xl">
                {isConnected ? t('scoreboardDisplay.loadingDisplay') : t('scoreboardDisplay.connectingToServer')}
            </div>
        );
    }

    // Default values if state is somehow still null despite the check above (belt and suspenders)
    const currentTitle = titleText ?? '';
    const currentFooter = footerText ?? '';

    return (
        <div id="scoreboard-display-container" className="flex flex-col h-screen w-screen overflow-hidden bg-black relative">
             {/* Connection Status Indicator */}
             {!isConnected && (
                <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded z-50">
                    {t('scoreboardControl.disconnected')} {/* Use key from scoreboardControl ns */}
                </div>
             )}

             {/* Fullscreen Button removed */}

            {/* Top Section: Title */}
            <div className="w-full flex flex-col items-center">
                {/* Optional Title - Apply dynamic styles */}
                {currentTitle && (
                    <h1 
                        className="font-bold text-center mt-4 mb-2 text-gray-200 text-4xl" // Increased base size
                        style={{
                            color: titleTextColor || '#FFFFFF', // Default white if not set
                            fontSize: `${titleTextSize || 2}rem` // Use state size (rem)
                        }}
                    >
                        {currentTitle}
                    </h1>
                )}
            </div>

            {/* Round Information */}
            {rounds?.current && (
                <div className="w-full flex justify-center my-4">
                    <div className="flex flex-col items-center">
                        <div className="flex items-center gap-4">
                            {roundSettings?.showRoundNumber && (
                                <Badge size="xl" className="text-lg">
                                    {t('rounds.numberLabel', 'Round {{number}}', { number: rounds.current.number })}
                                </Badge>
                            )}
                            {roundSettings?.showType && (
                                <Text size="xl" fw={500} className="text-gray-200">
                                    {formatRoundType(rounds.current.type)}
                                </Text>
                            )}
                            {roundSettings?.showTimeLimit && rounds.current.timeLimit && (
                                <Badge color="yellow" size="lg">
                                    {t('rounds.timeLimit', 'Time Limit')}: {rounds.current.timeLimit}s
                                </Badge>
                            )}
                        </div>
                        {roundSettings?.showTheme && rounds.current.theme && (
                            <Text size="lg" c="dimmed" mt={2}>
                                {t('rounds.theme', 'Theme')}: {rounds.current.theme}
                            </Text>
                        )}
                        {roundSettings?.showMixedStatus && rounds.current.isMixed && (
                            <Badge color="grape" size="lg" mt={2}>
                                {t('rounds.mixedTeams', 'Mixed Teams')}
                            </Badge>
                        )}
                        {roundSettings?.showPlayerLimits && (
                            <div className="mt-2 flex items-center gap-2">
                                <Text size="sm" c="dimmed">
                                    {t('rounds.players', 'Players')}: {rounds?.current?.minPlayers}-{rounds?.current?.maxPlayers}
                                </Text>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Round History (if enabled) */}
            {roundSettings?.showRoundHistory && rounds?.history && rounds.history.length > 0 && (
                <div className="w-full flex justify-center mb-4">
                    <div className="bg-black bg-opacity-50 p-4 rounded">
                        <Text size="sm" c="dimmed" ta="center" mb={2}>
                            {t('rounds.history', 'Round History')}
                        </Text>
                        <div className="flex flex-wrap gap-2 justify-center">
                            {rounds?.history?.map((round, index) => (
                                <Badge key={index} variant="dot" size="sm">
                                    {round.number}: {round.points.team1}-{round.points.team2}
                                </Badge>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Team Panels Container (Should fill remaining space) */} 
            {/* Ensure this container and its children fill the height */} 
      <div className="relative flex-1 flex flex-row w-full">
        {/* Mon-Pacing QR Overlay (appears when enabled via Control setting) */}
        <MonPacingOverlay corner="bottom-left" />
                 {/* Wrap each panel in a div that grows and fills height */} 
                 <div className="flex-1 h-full"> 
                     {team1 && (
                        <TeamDisplayPanel 
                            team={team1} 
                            showScore={showScore} // PASS PROP
                            showPenalties={showPenalties} // PASS PROP
                            showEmojis={showEmojis} // PASS PROP
                            emoji={team1Emoji} // PASS PROP
                        />
                     )}
                 </div> 
                 <div className="flex-1 h-full"> 
                     {team2 && (
                        <TeamDisplayPanel 
                            team={team2} 
                            showScore={showScore} // PASS PROP
                            showPenalties={showPenalties} // PASS PROP
                            showEmojis={showEmojis} // PASS PROP
                            emoji={team2Emoji} // PASS PROP
                        />
                     )}
                 </div>
                 {/* Logo Display (Absolute Center) */}
                 {state.logoUrl && (
                     <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex justify-center z-0">
                         <img 
                             src={state.logoUrl}  
                             alt={t('scoreboardDisplay.logoAltText') ?? "Scoreboard Logo"}  
                             className="max-h-72 max-w-full object-contain" 
                             style={{ width: `${logoSize ?? 50}%` }} // Apply width based on state.logoSize
                         /> 
                     </div> 
                 )} 
             </div>

            {/* Bottom Section: Footer */}
            <div className="w-full flex flex-col items-center pb-4">
                {/* Optional Footer - Apply dynamic styles */}
                {currentFooter && (
                    <p 
                        className="font-medium text-center text-gray-400 text-xl" // Base styles
                        style={{
                            color: footerTextColor || '#CCCCCC', // Default gray if not set
                            fontSize: `${footerTextSize || 1.25}rem` // Use state size (rem), default 1.25rem (text-xl)
                        }}
                    >
                        {currentFooter}
                    </p>
                )}
            </div>

        </div>
    );
};

import MonPacingOverlay from '../integrations/MonPacingOverlay';

export default ScoreboardDisplay;
