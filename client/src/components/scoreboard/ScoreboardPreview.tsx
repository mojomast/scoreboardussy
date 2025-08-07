import React from 'react';
import { useTranslation } from 'react-i18next';
import { ScoreboardState } from '@server-types/index'; // Assuming types are accessible

interface ScoreboardPreviewProps {
    state: ScoreboardState | null;
}

const ScoreboardPreview: React.FC<ScoreboardPreviewProps> = ({ state }) => {
    const { t } = useTranslation();

    if (!state) {
        return <div className="p-2 text-center text-sm text-gray-500 dark:text-gray-400">{t('scoreboardControl.loadingState', 'Loading Preview...')}</div>; // Add a translation key if needed
    }

const { team1, team2, logoUrl, titleText, footerText, titleStyle, footerStyle } = state;

    // Helper to render penalties (smaller)
    const renderPenalties = (penalties: { major: number; minor: number }) => {
        const majors = Array(penalties.major).fill(null).map((_, i) => (
            <div key={`major-${i}`} className="w-2 h-2 bg-red-500 rounded-sm mr-0.5"></div> // Smaller size
        ));
        const minors = Array(penalties.minor).fill(null).map((_, i) => (
            <div key={`minor-${i}`} className="w-2 h-2 bg-yellow-400 rounded-sm mr-0.5"></div> // Smaller size
        ));
        return <div className="flex mt-1 h-2 items-center">{majors}{minors}</div>; // Added height and alignment
    };

    return (
        <div className="bg-gray-100 dark:bg-gray-900 p-2 rounded-lg border border-gray-300 dark:border-gray-700 shadow-md relative overflow-hidden h-40"> {/* Reduced padding, fixed height */} 
            {/* Title Text - Adjusted font size directly */}
            {titleText && (
                <div 
                    className="text-center font-bold absolute top-1 left-0 right-0 px-2 truncate text-xs" // Smaller font, padding, top offset
                    style={{ color: titleStyle?.color || '#000000' }} // Removed direct px size, using text-xs
                >
                    {titleText}
                </div>
            )}

            {/* Logo - Adjusted styles */}
            {logoUrl && (
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-0 flex justify-center items-center h-full w-full px-10"> {/* Centering container */} 
                    <img 
                        src={logoUrl} 
                        alt="Logo Preview" 
                        className="opacity-20 dark:opacity-15 object-contain max-h-[60%] max-w-[60%]" // Adjusted opacity and max size
                        // Removed style based on logoSize for simplicity in preview, consider adding back if needed
                    />
                </div>
            )}

            {/* Main Score Area - Adjusted padding and font sizes */}
            <div className="flex justify-between items-center h-full pt-5 pb-5 px-2 relative z-10"> {/* Reduced padding */} 
                {/* Team 1 */}
                <div className="text-center w-2/5"> {/* Adjusted width slightly */} 
                    <div className="text-sm font-semibold truncate dark:text-white">{team1.name || 'Team 1'}</div> {/* Smaller font */} 
                    <div className="text-4xl font-bold my-1 dark:text-white">{team1.score}</div> {/* Smaller font and margin */} 
                    <div className="flex justify-center">{renderPenalties(team1.penalties)}</div>
                </div>

                {/* Separator */}
                <div className="text-lg font-light text-gray-400 dark:text-gray-600">vs</div> {/* Smaller font */} 

                {/* Team 2 */}
                <div className="text-center w-2/5"> {/* Adjusted width slightly */} 
                    <div className="text-sm font-semibold truncate dark:text-white">{team2.name || 'Team 2'}</div> {/* Smaller font */} 
                    <div className="text-4xl font-bold my-1 dark:text-white">{team2.score}</div> {/* Smaller font and margin */} 
                    <div className="flex justify-center">{renderPenalties(team2.penalties)}</div>
                </div>
            </div>

            {/* Footer Text - Adjusted font size directly */}
            {footerText && (
                <div 
                    className="text-center absolute bottom-1 left-0 right-0 px-2 truncate text-[10px]" // Smaller font (text-xs didn't seem small enough), padding, bottom offset
                    style={{ color: footerStyle?.color || '#000000' }} // Removed direct px size 
                >
                    {footerText}
                </div>
            )}
        </div>
    );
};

export default ScoreboardPreview;