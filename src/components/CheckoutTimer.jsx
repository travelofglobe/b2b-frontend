import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const timerLocales = {
    en: "Time Remaining",
    tr: "Kalan Süre",
    ar: "الوقت المتبقي",
    es: "Tiempo Restante",
    ru: "Оставшееся время",
    zh: "剩余时间",
    ja: "残り時間",
    fa: "زمان باقیمانده",
    fr: "Temps Restant",
    it: "Tempo Rimanente",
    el: "Χρόνος Απομένει",
    pt: "Tempo Restante"
};

const CheckoutTimer = ({ expireAt }) => {
    const navigate = useNavigate();
    const [timeLeft, setTimeLeft] = useState(null);
    const { i18n } = useTranslation();
    const currentLang = i18n.language || localStorage.getItem('language') || 'tr';
    const localizedText = timerLocales[currentLang] || timerLocales['tr'];

    useEffect(() => {
        if (!expireAt) return;

        const calculateTimeLeft = () => {
            const difference = expireAt - Date.now();
            if (difference <= 0) {
                return 0;
            }
            return difference;
        };

        setTimeLeft(calculateTimeLeft());

        const timer = setInterval(() => {
            const remaining = calculateTimeLeft();
            setTimeLeft(remaining);

            if (remaining <= 0) {
                clearInterval(timer);
                // Force redirect to home on expiration
                window.location.href = '/';
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [expireAt, navigate]);

    if (timeLeft === null) return null;

    const minutes = Math.floor((timeLeft / 1000 / 60) % 60);
    const seconds = Math.floor((timeLeft / 1000) % 60);

    const isLowTime = timeLeft < 5 * 60 * 1000; // Less than 5 minutes
    const totalSeconds = timeLeft / 1000;
    const maxSeconds = 15 * 60; // 15 min
    const progress = Math.min(100, (totalSeconds / maxSeconds) * 100);

    return (
        <div className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border transition-all duration-500 shrink-0 ${
            isLowTime
                ? 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800/50 text-red-600 dark:text-red-400'
                : 'bg-[#fef9ee] dark:bg-amber-950/20 border-amber-200/70 dark:border-amber-700/40 text-amber-700 dark:text-amber-300'
        }`}>
            {/* Icon */}
            <div className={`size-8 rounded-lg flex items-center justify-center shrink-0 ${
                isLowTime
                    ? 'bg-red-100 dark:bg-red-900/40'
                    : 'bg-amber-100/70 dark:bg-amber-900/30'
            } ${isLowTime ? 'animate-pulse' : ''}`}>
                <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    {isLowTime ? 'timer_off' : 'timer'}
                </span>
            </div>

            {/* Text */}
            <div className="flex flex-col min-w-0">
                <span className="text-[9px] font-bold uppercase tracking-widest leading-none mb-0.5 opacity-70">
                    {localizedText}
                </span>
                <span className={`text-sm font-bold tabular-nums leading-none tracking-wide ${isLowTime ? 'animate-pulse' : ''}`}>
                    {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
                </span>

                {/* Mini progress bar */}
                <div className="mt-1 h-0.5 w-full rounded-full bg-current opacity-20">
                    <div
                        className="h-full rounded-full bg-current transition-all duration-1000 ease-linear opacity-80"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>
        </div>
    );
};

export default CheckoutTimer;
