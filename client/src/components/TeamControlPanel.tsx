import React, { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Team } from '@server-types/index';
import { useScoreboard } from '@/contexts/ScoreboardContext';

interface TeamControlPanelProps {
    team: Team;
}

/**
 * Provides controls for updating a single team's name, color, score, and penalties.
 */
const TeamControlPanel: React.FC<TeamControlPanelProps> = ({ team }) => {
    const { t } = useTranslation(); 
    const { updateTeam, updateScore, updatePenalty, resetPenalties } = useScoreboard();
    const [nameInput, setNameInput] = useState<string>(team.name);
    const [colorInput, setColorInput] = useState<string>(team.color);

    // Debounce handler for name/color changes to avoid excessive updates
    const handleNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const newName = e.target.value;
        setNameInput(newName);
        // Simple debounce: Update only if typing stops for a bit (e.g., 500ms)
        // A more robust solution might use lodash.debounce
        const timerId = setTimeout(() => {
            if (newName.trim() && newName !== team.name) {
                updateTeam({ teamId: team.id, name: newName });
            }
        }, 500);
        return () => clearTimeout(timerId); // Cleanup timeout on re-render or unmount
    }, [team.id, team.name, updateTeam]);

    const handleColorChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const newColor = e.target.value;
        setColorInput(newColor);
        // Update immediately on color change
        if (newColor !== team.color) {
             updateTeam({ teamId: team.id, color: newColor });
        }
    }, [team.id, team.color, updateTeam]);

    // Update local state when context state changes (e.g., after resetAll)
    useEffect(() => {
        setNameInput(team.name);
        setColorInput(team.color);
    }, [team]);

    // Handlers for score updates
    const handleIncrementScore = () => updateScore(team.id, 1); // Call with teamId, action
    const handleDecrementScore = () => updateScore(team.id, -1); // Call with teamId, action

    // Handlers for penalty updates
    const handleAddMajorPenalty = () => updatePenalty({ teamId: team.id, type: 'major', action: 1 });
    const handleAddMinorPenalty = () => updatePenalty({ teamId: team.id, type: 'minor', action: 1 });

    // Handler for resetting penalties
    const handleResetPenalties = () => resetPenalties({ teamId: team.id });

    return (
        <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6 w-full mb-6">
            {/* Team Name Input */}
            <div className="mb-4">
                <label htmlFor={`${team.id}-name`} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('scoreboardControl.teamNameLabel')}
                </label>
                <input
                    type="text"
                    id={`${team.id}-name`}
                    value={nameInput}
                    onChange={handleNameChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                    placeholder={t('scoreboardControl.teamNamePlaceholder')} 
                />
            </div>

            {/* Team Color Input */}
            <div className="mb-6">
                <label htmlFor={`${team.id}-color`} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('scoreboardControl.teamColorLabel')}
                </label>
                <input
                    type="color"
                    id={`${team.id}-color`}
                    value={colorInput}
                    onChange={handleColorChange}
                    className="w-full h-10 border border-gray-300 dark:border-gray-600 rounded-md cursor-pointer"
                />
            </div>

            {/* Score Controls */}
            <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('scoreboardControl.scoreLabel', { score: team.score })} 
                </label>
                <div className="flex space-x-3">
                    <button onClick={handleIncrementScore} className="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded transition duration-150 ease-in-out">
                        {t('scoreboardControl.incrementScoreBtn')} 
                    </button>
                    <button onClick={handleDecrementScore} disabled={team.score <= 0} className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded transition duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed">
                        {t('scoreboardControl.decrementScoreBtn')} 
                    </button>
                </div>
            </div>

            {/* Penalty Controls */}
            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('scoreboardControl.penaltiesLabel')} 
                </label>
                <div className="grid grid-cols-2 gap-3 mb-3">
                    <button onClick={handleAddMajorPenalty} className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded transition duration-150 ease-in-out">
                        {t('scoreboardControl.addMajorPenaltyBtn', { count: team.penalties.major })} 
                    </button>
                    <button onClick={handleAddMinorPenalty} className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded transition duration-150 ease-in-out">
                        {t('scoreboardControl.addMinorPenaltyBtn', { count: team.penalties.minor })} 
                    </button>
                </div>
                <button onClick={handleResetPenalties} className="w-full bg-gray-400 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded transition duration-150 ease-in-out">
                    {t('scoreboardControl.resetPenaltiesBtn')} 
                </button>
            </div>
        </div>
    );
};

export default TeamControlPanel;
