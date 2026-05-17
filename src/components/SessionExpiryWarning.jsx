import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';

const sessionLocales = {
    en: {
        expiry: "Session Expiry",
        desc: "Your session will expire in",
        descSuffix: ".",
        renewing: "Renewing...",
        extend: "Extend Session"
    },
    tr: {
        expiry: "Oturum Süresi",
        desc: "Oturumunuz",
        descSuffix: " içinde dolacak.",
        renewing: "Yenileniyor...",
        extend: "Oturumu Uzat"
    },
    ar: {
        expiry: "انتهاء الجلسة",
        desc: "ستنتهي جلستك في غضون",
        descSuffix: ".",
        renewing: "جاري التجديد...",
        extend: "تمديد الجلسة"
    },
    es: {
        expiry: "Expiración de Sesión",
        desc: "Tu sesión expirará en",
        descSuffix: ".",
        renewing: "Renovando...",
        extend: "Extender Sesión"
    },
    ru: {
        expiry: "Истечение сессии",
        desc: "Ваш сеанс истекает через",
        descSuffix: ".",
        renewing: "Продление...",
        extend: "Продлить сессию"
    },
    zh: {
        expiry: "登录过期",
        desc: "您的登录会话将在",
        descSuffix: " 内过期。",
        renewing: "续期中...",
        extend: "延长会话"
    },
    ja: {
        expiry: "セッションの有効期限",
        desc: "セッションの有効期限はあと",
        descSuffix: " です。",
        renewing: "更新中...",
        extend: "セッションを延長"
    },
    fa: {
        expiry: "انقضای نشست",
        desc: "نشست شما در",
        descSuffix: " به پایان می‌رسد.",
        renewing: "در حال تمدید...",
        extend: "تمدید نشست"
    },
    fr: {
        expiry: "Expiration de Session",
        desc: "Votre session expire dans",
        descSuffix: ".",
        renewing: "Renouvellement...",
        extend: "Prolonger la session"
    },
    it: {
        expiry: "Scadenza Sessione",
        desc: "La tua sessione scadrà tra",
        descSuffix: ".",
        renewing: "Rinnovo...",
        extend: "Estendi Sessione"
    },
    el: {
        expiry: "Λήξη Συνεδρίας",
        desc: "Η συνεδρία σας θα λήξει σε",
        descSuffix: ".",
        renewing: "Ανανέωση...",
        extend: "Παράταση Συνεδρίας"
    },
    pt: {
        expiry: "Expiração da Sessão",
        desc: "Sua sessão expirará em",
        descSuffix: ".",
        renewing: "Renovando...",
        extend: "Estender Sessão"
    }
};

const SessionExpiryWarning = () => {
    const { remainingSeconds, renewSession } = useAuth();
    const [isRenewing, setIsRenewing] = useState(false);
    const { i18n } = useTranslation();
    const currentLang = i18n.language || localStorage.getItem('language') || 'tr';
    const ls = sessionLocales[currentLang] || sessionLocales['tr'];

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
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-none mb-1">{ls.expiry}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                        {ls.desc} <span className="font-mono font-bold text-amber-600 dark:text-amber-400 text-sm">{formatTime(remainingSeconds)}</span>{ls.descSuffix}
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
                            <span>{ls.renewing}</span>
                        </div>
                    ) : (
                        ls.extend
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
