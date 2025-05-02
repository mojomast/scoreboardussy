import React from 'react';
import { useTranslation } from 'react-i18next'; 
import { Team } from '@server-types/index';

interface TeamDisplayPanelProps {
    team: Team;
}

/**
 * Displays the name, score, and penalties for a single team.
 * Uses the team's color for the background.
 */
const TeamDisplayPanel: React.FC<TeamDisplayPanelProps> = ({ team }) => {
    const { t } = useTranslation(); 
    // Basic validation for color format (optional but good practice)
    const isValidColor = /^#[0-9A-F]{6}$/i.test(team.color);
    const backgroundColor = isValidColor ? team.color : '#cccccc'; // Default gray if invalid

    // Determine text color based on background brightness (simple approach)
    // Convert hex to RGB
    const hexToRgb = (hex: string) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result
          ? {
              r: parseInt(result[1], 16),
              g: parseInt(result[2], 16),
              b: parseInt(result[3], 16),
            }
          : null;
      };
    
    const rgb = hexToRgb(backgroundColor);
    const brightness = rgb ? (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000 : 128; // Default to mid-brightness
    const textColor = brightness > 128 ? 'text-black' : 'text-white'; // Use black text on light backgrounds, white on dark
    const penaltyTextColor = brightness > 128 ? 'text-gray-700' : 'text-gray-200';

    return (
        <div 
            className={`flex-1 flex flex-col items-center justify-center p-6 md:p-12 h-full`}
            style={{ backgroundColor: backgroundColor }}
        >
            {/* Team Name */}
            <h2 className={`text-4xl md:text-6xl lg:text-8xl font-bold mb-4 md:mb-8 truncate px-4 ${textColor}`}>
                {team.name}
            </h2>

            {/* Score */}
            <div className={`text-8xl md:text-9xl lg:text-[180px] font-bold mb-6 md:mb-12 ${textColor}`}>
                {team.score}
            </div>

            {/* Penalties */}
            <div className={`flex space-x-6 md:space-x-12 text-2xl md:text-4xl lg:text-5xl ${penaltyTextColor}`}>
                <div className="flex flex-col items-center">
                    <span className="text-sm md:text-lg font-semibold uppercase tracking-wider mb-1 md:mb-2">
                        {t('scoreboardDisplay.majorPenaltyLabel')} 
                    </span>
                    <span className={textColor}>{team.penalties.major}</span>
                </div>
                <div className="flex flex-col items-center">
                    <span className="text-sm md:text-lg font-semibold uppercase tracking-wider mb-1 md:mb-2">
                        {t('scoreboardDisplay.minorPenaltyLabel')} 
                    </span>
                    <span className={textColor}>{team.penalties.minor}</span>
                </div>
            </div>
        </div>
    );
};

export default TeamDisplayPanel;
