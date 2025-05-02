import React, { useState, useEffect, ChangeEvent, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useScoreboard } from '@/contexts/ScoreboardContext'; 
import TeamControlPanel from './TeamControlPanel';

/**
 * The main control panel component.
 * Allows users to modify team names, colors, scores, and penalties.
 */
const ScoreboardControl: React.FC = () => {
    const { t, i18n } = useTranslation('translation');
    const { state, isConnected, resetAll, updateLogo, logoUrl, updateText, updateTextStyle } = useScoreboard();
    const { team1, team2 } = state || {}; // Destructure only used properties safely

    const [localTitleText, setLocalTitleText] = useState<string>('');
    const [localFooterText, setLocalFooterText] = useState<string>('');
    const [localTitleColor, setLocalTitleColor] = useState<string>('#000000');
    const [localTitleSize, setLocalTitleSize] = useState<number>(2);
    const [localFooterColor, setLocalFooterColor] = useState<string>('#000000');
    const [localFooterSize, setLocalFooterSize] = useState<number>(1.25);

    useEffect(() => {
        if (state) {
            setLocalTitleText(state.titleText ?? '');
            setLocalFooterText(state.footerText ?? '');
            setLocalTitleColor(state.titleTextColor ?? '#000000');
            setLocalTitleSize(state.titleTextSize ?? 2);
            setLocalFooterColor(state.footerTextColor ?? '#000000');
            setLocalFooterSize(state.footerTextSize ?? 1.25);
        }
    }, [state]); // Depend on the whole state object

    const handleLanguageChange = (event: ChangeEvent<HTMLSelectElement>) => {
        i18n.changeLanguage(event.target.value);
    };

    const openDisplayView = () => {
        window.open('#/display', '_blank'); // Opens display view in a new tab
    };

    const fileInputRef = useRef<HTMLInputElement>(null); // Ref for hidden file input

    // --- Logo Upload Handler ---
    const handleLogoUpload = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) {
            console.error("No file selected.");
            return;
        }

        // Check if the file type is an image (basic check)
        if (!file.type.startsWith('image/')) {
            alert('Please select an image file.'); // Simple user feedback
            // Reset the input value so the same file can be re-selected if needed
            if (fileInputRef.current) fileInputRef.current.value = ''; 
            return;
        }

        const reader = new FileReader();
        reader.onload = (loadEvent) => {
            const logoDataUrl = loadEvent.target?.result as string; // Get base64 data URL
            if (logoDataUrl) {
                updateLogo(logoDataUrl);
            } else {
                console.error("Failed to read file as data URL.");
                alert('Error reading image file.');
            }
        };
        reader.onerror = (errorEvent) => {
            console.error("Error reading file:", errorEvent);
            alert('Error reading image file.');
        };
        reader.readAsDataURL(file); // Read the file
        
        // Reset the input value so the same file can be re-selected immediately after
        if (fileInputRef.current) fileInputRef.current.value = ''; 
    };

    // Function to trigger the hidden file input
    const triggerFileInput = () => {
        fileInputRef.current?.click();
    };

    const handleSubmitText = () => {
        updateText({ field: 'titleText', text: localTitleText });
        updateText({ field: 'footerText', text: localFooterText });
        // Also send style updates
        updateTextStyle({ target: 'title', color: localTitleColor, size: localTitleSize });
        updateTextStyle({ target: 'footer', color: localFooterColor, size: localFooterSize });
    };

    if (!state) {
        // Display a loading or disconnected message
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-300 text-xl">
                {isConnected ? t('scoreboardControl.loadingControls') : t('scoreboardControl.connectingToServer')}
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4 md:p-8">
            <h1 className="text-3xl font-bold text-center mb-6 text-gray-800">Scoreboardussy Control Panel</h1>
             {/* Header and Language Selector */}
             <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-200">{t('scoreboardControl.title')}</h1>
                {/* Language Selector */}            
                <div className="flex items-center space-x-2">
                    <label htmlFor="language-select" className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('scoreboardControl.languageSelectLabel')}:</label>
                    <select 
                        id="language-select"
                        value={i18n.language} // Set current language
                        onChange={handleLanguageChange} // Handle change
                        className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    >
                        <option value="en">{t('scoreboardControl.languageEnglish')}</option>
                        <option value="fr">{t('scoreboardControl.languageFrench')}</option>
                    </select>
                </div>
                {/* Logo Upload Section */}
                <div className="mb-4">
                    <input 
                        type="file"
                        ref={fileInputRef}
                        onChange={handleLogoUpload}
                        accept="image/*" // Accept only image files
                        style={{ display: 'none' }} // Hide the default input
                        aria-hidden="true" // Accessibility improvement
                    />
                    <button 
                        onClick={triggerFileInput} 
                        className="w-full bg-purple-500 hover:bg-purple-600 text-white font-bold py-2 px-4 rounded transition duration-150 ease-in-out"
                    >
                        {t('scoreboardControl.uploadLogoLabel')}
                    </button>
                </div>

                {/* Logo Preview Section */}
                {logoUrl && (
                    <div className="mb-4 flex justify-center">
                        <img 
                            src={logoUrl} 
                            alt={t('scoreboardControl.logoAltText', 'Current Logo Preview')} 
                            className="max-h-24 max-w-full object-contain border border-gray-300 rounded"
                        />
                    </div>
                )}
            </div> {/* <-- Re-add the missing closing tag for the Logo Upload Section */}
 
                {/* Title and Footer Text Inputs */}
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow mb-6">
                    <h3 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-300">{t('scoreboardControl.displayTextSectionTitle')}</h3>
 
                    {/* --- Title Section --- */}
                    <div className="mb-4">
                        <label htmlFor="title-text-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('scoreboardControl.titleTextLabel')}</label>
                        <input
                            id="title-text-input"
                            type="text"
                            value={localTitleText} // Use local state
                            onChange={(e) => setLocalTitleText(e.target.value)} // Update local state
                            placeholder={t('scoreboardControl.titleTextPlaceholder') ?? 'Enter title text...'} // Placeholder
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        {/* Title Color */}
                        <div>
                            <label htmlFor="title-color-picker" className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">{t('scoreboardControl.titleColorLabel')}</label>
                            <input 
                                type="color"
                                id="title-color-picker"
                                value={localTitleColor}
                                onChange={(e) => setLocalTitleColor(e.target.value)}
                                className="w-full h-10 px-1 py-1 border border-gray-300 dark:border-gray-600 rounded-md cursor-pointer"
                            />
                        </div>
                        {/* Title Size */}
                        <div>
                            <label htmlFor="title-size-input" className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">{t('scoreboardControl.titleSizeLabel')} (rem)</label>
                            <input
                                id="title-size-input"
                                type="number"
                                step="0.1"
                                min="0.5"
                                value={localTitleSize}
                                onChange={(e) => setLocalTitleSize(parseFloat(e.target.value) || 1)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                            />
                        </div>
                    </div>

                    {/* --- Footer Section --- */}
                    <div className="mb-4">
                        <label htmlFor="footer-text-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('scoreboardControl.footerTextLabel')}</label>
                        <input
                            id="footer-text-input"
                            type="text"
                            value={localFooterText} // Use local state
                            onChange={(e) => setLocalFooterText(e.target.value)} // Update local state
                            placeholder={t('scoreboardControl.footerTextPlaceholder') ?? 'Enter footer text...'} // Placeholder
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        {/* Footer Color */}
                        <div>
                            <label htmlFor="footer-color-picker" className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">{t('scoreboardControl.footerColorLabel')}</label>
                            <input 
                                type="color"
                                id="footer-color-picker"
                                value={localFooterColor}
                                onChange={(e) => setLocalFooterColor(e.target.value)}
                                className="w-full h-10 px-1 py-1 border border-gray-300 dark:border-gray-600 rounded-md cursor-pointer"
                            />
                        </div>
                        {/* Footer Size */}
                        <div>
                            <label htmlFor="footer-size-input" className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">{t('scoreboardControl.footerSizeLabel')} (rem)</label>
                            <input
                                id="footer-size-input"
                                type="number"
                                step="0.1"
                                min="0.5"
                                value={localFooterSize}
                                onChange={(e) => setLocalFooterSize(parseFloat(e.target.value) || 1)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                            />
                        </div>
                    </div>
                    <hr className="my-4 border-gray-300 dark:border-gray-600" />
                    <button
                        onClick={handleSubmitText}
                        className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                        disabled={!isConnected}
                    >
                        {t('scoreboardControl.updateTextBtn')} 
                    </button>
                </div>

             {/* Team Control Panels */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Add checks to ensure team objects exist before rendering */}
                {team1 && <TeamControlPanel team={team1} />} 
                {team2 && <TeamControlPanel team={team2} />} 
            </div>

            {/* Global Actions */}
            <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-6">
                <button
                    onClick={resetAll} 
                    className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg transition duration-150 ease-in-out shadow-md"
                >
                    {t('scoreboardControl.resetAllBtn')} 
                </button>
                <button
                    onClick={openDisplayView}
                    className="w-full sm:w-auto text-center bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg transition duration-150 ease-in-out shadow-md"
                >
                    {t('scoreboardControl.openDisplayBtn')} 
                </button>
            </div>
            {/* Connection Status Indicator */}
            {!isConnected && (
                <div className="fixed top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded z-50">
                     {t('scoreboardControl.disconnected')} 
                </div>
            )}
        </div>
    );
};

export default ScoreboardControl;
