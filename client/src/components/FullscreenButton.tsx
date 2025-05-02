import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next'; // Import hook

interface FullscreenButtonProps {
    targetId: string; // The ID of the element to make fullscreen
}

/**
 * A button to toggle fullscreen mode for a specific element.
 */
const FullscreenButton: React.FC<FullscreenButtonProps> = ({ targetId }) => {
    const { t } = useTranslation(); // Initialize hook
    const [isAvailable, setIsAvailable] = useState<boolean>(false);
    const [isFullScreen, setIsFullScreen] = useState<boolean>(false);

    useEffect(() => {
        // Check if Fullscreen API is available
        setIsAvailable(!!(document.fullscreenEnabled || 
                        (document as any).webkitFullscreenEnabled || 
                        (document as any).mozFullScreenEnabled || 
                        (document as any).msFullscreenEnabled));

        // Listener to update state if fullscreen is exited externally (e.g., ESC key)
        const handleFullScreenChange = () => {
            setIsFullScreen(!!(document.fullscreenElement || 
                              (document as any).webkitFullscreenElement || 
                              (document as any).mozFullScreenElement || 
                              (document as any).msFullscreenElement));
        };

        document.addEventListener('fullscreenchange', handleFullScreenChange);
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

    const toggleFullScreen = useCallback(() => {
        const element = document.getElementById(targetId) as HTMLElement & {
            mozRequestFullScreen?: () => Promise<void>;
            webkitRequestFullscreen?: () => Promise<void>;
            msRequestFullscreen?: () => Promise<void>;
         };

        if (!element) {
            console.error(`Fullscreen target element with ID '${targetId}' not found.`);
            return;
        }

        if (!isFullScreen) {
            // Request fullscreen
            if (element.requestFullscreen) {
                element.requestFullscreen().catch(err => console.error("Error attempting to enable full-screen mode:", err));
            } else if (element.mozRequestFullScreen) { /* Firefox */
                element.mozRequestFullScreen().catch(err => console.error("Error attempting to enable full-screen mode (Firefox):", err));
            } else if (element.webkitRequestFullscreen) { /* Chrome, Safari & Opera */
                element.webkitRequestFullscreen().catch(err => console.error("Error attempting to enable full-screen mode (WebKit):", err));
            } else if (element.msRequestFullscreen) { /* IE/Edge */
                element.msRequestFullscreen().catch(err => console.error("Error attempting to enable full-screen mode (MS):", err));
            }
        } else {
            // Exit fullscreen
            if (document.exitFullscreen) {
                document.exitFullscreen().catch(err => console.error("Error attempting to disable full-screen mode:", err));
            } else if ((document as any).mozCancelFullScreen) { /* Firefox */
                (document as any).mozCancelFullScreen().catch((err:any) => console.error("Error attempting to disable full-screen mode (Firefox):", err));
            } else if ((document as any).webkitExitFullscreen) { /* Chrome, Safari and Opera */
                (document as any).webkitExitFullscreen().catch((err:any) => console.error("Error attempting to disable full-screen mode (WebKit):", err));
            } else if ((document as any).msExitFullscreen) { /* IE/Edge */
                (document as any).msExitFullscreen().catch((err:any) => console.error("Error attempting to disable full-screen mode (MS):", err));
            }
        }
    }, [targetId, isFullScreen]);

    if (!isAvailable) {
        return null; // Don't render the button if the API is not supported
    }

    return (
        <button
            onClick={toggleFullScreen}
            title={t('scoreboardDisplay.fullscreenBtn')} // Translate title
            aria-label={t('scoreboardDisplay.fullscreenBtn')} // Translate aria-label
            className="p-2 bg-gray-700 hover:bg-gray-600 text-white rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white transition duration-150 ease-in-out"
        >
            {isFullScreen ? (
                // Exit Fullscreen Icon (example using SVG)
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M14.707 14.707a1 1 0 01-1.414 0L10 11.414l-3.293 3.293a1 1 0 01-1.414-1.414L8.586 10 5.293 6.707a1 1 0 011.414-1.414L10 8.586l3.293-3.293a1 1 0 011.414 1.414L11.414 10l3.293 3.293a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
            ) : (
                // Enter Fullscreen Icon (example using SVG)
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4 4a1 1 0 011-1h4a1 1 0 110 2H6v3a1 1 0 11-2 0V4zm12 0a1 1 0 00-1-1h-4a1 1 0 100 2h3v3a1 1 0 102 0V4zM4 16a1 1 0 001 1h4a1 1 0 100-2H6v-3a1 1 0 10-2 0v4zm12 0a1 1 0 01-1 1h-4a1 1 0 110-2h3v-3a1 1 0 112 0v4z" clipRule="evenodd" />
                </svg>
            )}
        </button>
    );
};

export default FullscreenButton;
