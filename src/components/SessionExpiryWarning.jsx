import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const SessionExpiryWarning = () => {
    const { remainingSeconds, renewSession } = useAuth();
    const [isRenewing, setIsRenewing] = useState(false);

    // Only show if we have less than 20 minutes left
    if (remainingSeconds === null || remainingSeconds > 1200) return null;

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    };

    const handleRenew = async () => {
        setIsRenewing(true);
        const success = await renewSession();
        setIsRenewing(false);
    };

    // If remainingSeconds is 0, the session is already expired and 
    // the apiClient handleLogout should trigger soon.
    if (remainingSeconds === 0) return null;

    return (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] w-[calc(100%-2rem)] max-w-md pointer-events-auto">
            <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border border-amber-200 dark:border-amber-900/50 rounded-2xl shadow-2xl shadow-amber-500/10 p-4 flex items-center gap-4 animate-bounce-subtle">
                <div className="size-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0 relative">
                    <span className="material-icons-round text-amber-600 dark:text-amber-400">timer</span>
                    <div className="absolute inset-0 rounded-full border-2 border-amber-500 animate-ping opacity-25"></div>
                </div>
                <div className="flex-grow">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-none mb-1">Session Expiry</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                        Oturumunuz <span className="font-mono font-bold text-amber-600 dark:text-amber-400 text-sm">{formatTime(remainingSeconds)}</span> içinde dolacak.
                    </p>
                </div>
                <button
                    onClick={handleRenew}
                    disabled={isRenewing}
                    className="bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap shadow-lg shadow-amber-600/20 active:scale-95"
                >
                    {isRenewing ? (
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            <span>Yenileniyor...</span>
                        </div>
                    ) : (
                        'Oturumu Uzat'
                    )}
                </button>
            </div>
            
            <style dangerouslySetInnerHTML={{ __html: `
                @keyframes bounce-subtle {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-4px); }
                }
                .animate-bounce-subtle {
                    animation: bounce-subtle 3s ease-in-out infinite;
                }
            `}} />
        </div>
    );
};

export default SessionExpiryWarning;
