import React, { useState, useEffect } from 'react';
import { useScoreboard } from '../contexts/ScoreboardContext';
import TeamDisplayPanel from './TeamDisplayPanel';
import FullscreenButton from './FullscreenButton'; // Re-enable import
import { useTranslation } from 'react-i18next';

/**
 * The main display component for the scoreboard.
 * Shows two team panels side-by-side and handles full-screen mode.
 */
const ScoreboardDisplay: React.FC = () => {
    const { t } = useTranslation(); // Initialize hook
    const { state, isConnected } = useScoreboard(); // Destructure state
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
        team2Emoji // Destructure here
    } = state || {}; // Safely destructure, provide default empty object if state is null
    const [isFullScreen, setIsFullScreen] = useState<boolean>(!!document.fullscreenElement);

    // Effect to listen for fullscreen changes (e.g., user pressing ESC)
    useEffect(() => {
        const handleFullScreenChange = () => {
            setIsFullScreen(!!document.fullscreenElement);
        };

        document.addEventListener('fullscreenchange', handleFullScreenChange);
        // Also handle vendor prefixes for broader compatibility
        document.addEventListener('webkitfullscreenchange', handleFullScreenChange);
        document.addEventListener('mozfullscreenchange', handleFullScreenChange);
        document.addEventListener('MSFullscreenChange', handleFullScreenChange);

        return () => {
            document.removeEventListener('fullscreenchange', handleFullScreenChange);
            document.removeEventListener('webkitfullscreenchange', handleFullScreenChange);
            document.removeEventListener('mozfullscreenchange', handleFullScreenChange);
            document.removeEventListener('MSFullscreenChange', handleFullScreenChange);
        };
    }, []);

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
        <div id="scoreboard-display-container" className={`flex flex-col h-screen w-screen overflow-hidden bg-black ${isFullScreen ? 'cursor-none' : ''} relative`}>
             {/* Connection Status Indicator */}
             {!isConnected && (
                <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded z-50">
                    {t('scoreboardControl.disconnected')} {/* Use key from scoreboardControl ns */}
                </div>
             )}

             {/* Fullscreen Button (only visible when not fullscreen) */}
             {!isFullScreen && (
                <div className="absolute top-2 right-2 z-50">
                    <FullscreenButton targetId="scoreboard-display-container" />
                </div>
             )}

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

            {/* Team Panels Container (Should fill remaining space) */} 
            {/* Ensure this container and its children fill the height */} 
            <div className="relative flex-1 flex flex-row w-full"> 
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

export default ScoreboardDisplay;
