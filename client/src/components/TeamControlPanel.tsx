import React, { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Team } from '@server-types/index';
import { useScoreboard } from '@/contexts/ScoreboardContext';
import RoundControls from './RoundControls';

interface TeamControlPanelProps {
    team: Team;
    teamId: "team1" | "team2";
}

/**
 * Provides controls for updating a single team's name, color, score, and penalties.
 */
const TeamControlPanel: React.FC<TeamControlPanelProps> = ({ team, teamId }) => {
    const { t } = useTranslation();
    const { updateTeam, updateScore, updatePenalty, resetPenalties } = useScoreboard();
    const [localName, setLocalName] = useState<string>(team.name || '');
    const [colorInput, setColorInput] = useState<string>(team.color);

    // Effect to update localName when the team name prop changes from the parent
    useEffect(() => {
        setLocalName(team.name || '');
    }, [team.name]);

    // Update local state only when typing
    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setLocalName(e.target.value);
    };

    // Handler for the update button
    const handleUpdateNameClick = () => {
        if (localName.trim() !== '' && localName !== team.name) {
            updateTeam({ teamId: teamId, updates: { name: localName.trim() } });
        }
        // Optionally add feedback, like disabling button briefly or showing success
    };

    const handleColorChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const newColor = e.target.value;
        setColorInput(newColor);
        // Update immediately on color change
        if (newColor !== team.color) {
             updateTeam({ teamId: teamId, updates: { color: newColor } });
        }
    }, [teamId, team.color, updateTeam]);

    // Update local state when context state changes (e.g., after resetAll)
    useEffect(() => {
        setColorInput(team.color);
    }, [team]);

    // Handlers for score updates
    const handleScoreChange = (actionValue: number) => {
        // Ensure action is only +1 or -1
        const action = Math.sign(actionValue) as 1 | -1; 
        updateScore({ teamId: teamId, action }); // action is now a number
    };

    const handleIncrementScore = () => handleScoreChange(1); 
    const handleDecrementScore = () => handleScoreChange(-1); 

    // Handlers for penalty updates
    const handleAddMajorPenalty = () => updatePenalty({ teamId: teamId, type: 'major', action: 1 }); // action is 1
    const handleAddMinorPenalty = () => updatePenalty({ teamId: teamId, type: 'minor', action: 1 }); // action is 1

    // Handler for resetting penalties
    const handleResetPenalties = () => resetPenalties({ teamId: teamId });

    return (
        <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6 w-full mb-6">
            <RoundControls />
            {/* Team Title */}
             <h3 className="text-lg font-semibold mb-4 border-b pb-2 dark:text-white dark:border-gray-600">
                {t('teamControl.title')} - {team.name || teamId}
            </h3>
            {/* Team Name Input & Button */}
            <div className="mb-4">
                <label htmlFor={`${team.id}-name`} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('teamControl.teamNameLabel')}
                </label>
                <div className="flex flex-col space-y-2">
                    <input 
                        type="text"
                        id={`${team.id}-name`}
                        value={localName}
                        onChange={handleNameChange}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                        placeholder={t('teamControl.teamNamePlaceholder')}
                    />
                    <button 
                        onClick={handleUpdateNameClick}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                        disabled={localName === team.name || localName.trim() === ''} 
                    >
                        {t('teamControl.updateNameBtn')}
                    </button>
                </div>
            </div>

            {/* Team Color Input */}
            <div className="mb-6">
                <label htmlFor={`${team.id}-color`} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('teamControl.teamColorLabel')}
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
                    {t('teamControl.scoreLabel', { score: team.score })}
                </label>
                <div className="flex space-x-3">
                    <button onClick={handleIncrementScore} className="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded transition duration-150 ease-in-out">
                        {t('teamControl.addPointBtn')}
                    </button>
                    <button onClick={handleDecrementScore} disabled={team.score <= 0} className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded transition duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed">
                        {t('teamControl.subtractPointBtn')}
                    </button>
                </div>
            </div>

            {/* Penalty Controls */}
            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('teamControl.penaltiesLabel')}
                </label>
                <div className="grid grid-cols-2 gap-3 mb-3">
                    <button onClick={handleAddMajorPenalty} className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded transition duration-150 ease-in-out">
                        {t('teamControl.addMajorPenaltyBtn', { count: team.penalties.major })}
                    </button>
                    <button onClick={handleAddMinorPenalty} className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded transition duration-150 ease-in-out">
                        {t('teamControl.addMinorPenaltyBtn', { count: team.penalties.minor })}
                    </button>
                </div>
                <button onClick={handleResetPenalties} className="w-full bg-gray-400 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded transition duration-150 ease-in-out">
                    {t('teamControl.clearPenaltiesBtn')}
                </button>
            </div>
        </div>
    );
};

export default TeamControlPanel;
