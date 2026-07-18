import React, { useEffect, useState } from 'react';

const Toast = ({ message, type = 'info', onClose }) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Trigger enter animation
        requestAnimationFrame(() => setIsVisible(true));
    }, []);

    const handleClose = () => {
        setIsVisible(false);
        // Wait for exit animation to finish before removing from DOM
        setTimeout(onClose, 300);
    };

    const styles = {
        success: 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200',
        error: 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200',
        warning: 'bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200',
        info: 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200',
    };

    const icons = {
        success: 'check_circle',
        error: 'error',
        warning: 'warning',
        info: 'info',
    };

    return (
        <div
            className={`
                pointer-events-auto
                flex items-start gap-3 px-4 py-3 rounded-2xl border shadow-xl backdrop-blur-md
                transition-all duration-300 ease-in-out transform
                w-[calc(100vw-2rem)] md:w-[400px]
                ${styles[type]}
                ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
            `}
            role="alert"
        >
            <span className="material-symbols-outlined text-xl shrink-0 mt-0.5">
                {icons[type]}
            </span>
            <div className="flex-1 min-w-0">
                <p className="text-xs font-bold leading-relaxed break-words">{message}</p>
            </div>
            <button
                onClick={handleClose}
                className="opacity-60 hover:opacity-100 transition-opacity shrink-0 mt-0.5"
            >
                <span className="material-symbols-outlined text-lg">close</span>
            </button>
        </div>
    );
};

export default Toast;
