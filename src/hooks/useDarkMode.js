import { useState, useEffect } from 'react';

/**
 * Hook to detect and react in real-time to dark mode changes
 * (both class 'dark' on <html> and system preference)
 */
export function useDarkMode() {
    const [isDark, setIsDark] = useState(() => {
        if (typeof document !== 'undefined') {
            return document.documentElement.classList.contains('dark');
        }
        return false;
    });

    useEffect(() => {
        const updateTheme = () => {
            setIsDark(document.documentElement.classList.contains('dark'));
        };

        // Initial check
        updateTheme();

        // Observe class changes on <html> element
        const observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                if (mutation.attributeName === 'class') {
                    updateTheme();
                }
            }
        });

        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

        // Listen for system theme changes if not overridden
        const mediaQuery = window.matchMedia?.('(prefers-color-scheme: dark)');
        const handleMediaChange = () => {
            if (!localStorage.getItem('theme')) {
                updateTheme();
            }
        };

        if (mediaQuery?.addEventListener) {
            mediaQuery.addEventListener('change', handleMediaChange);
        }

        return () => {
            observer.disconnect();
            if (mediaQuery?.removeEventListener) {
                mediaQuery.removeEventListener('change', handleMediaChange);
            }
        };
    }, []);

    return isDark;
}

export default useDarkMode;
