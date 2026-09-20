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

const timerSubtitles = {
    en: "Holding price & availability",
    tr: "Fiyat ve kontenjan koruma süresi",
    ar: "ضمان السعر وتوفر الغرف",
    es: "Garantía de precio y disponibilidad",
    ru: "Фиксация цены и наличия мест",
    zh: "价格与房态锁定中",
    ja: "価格と空室を確保中",
    fa: "تضمین قیمت و ظرفیت اتاق",
    fr: "Prix et disponibilité garantis",
    it: "Prezzo e disponibilità bloccati",
    el: "Διασφάλιση τιμής & διαθεσιμότητας",
    pt: "Garantia de preço e disponibilidade"
};

const timerWarningSubtitles = {
    en: "Expiring soon! Please complete",
    tr: "Süre dolmak üzere! Tamamlayınız",
    ar: "الوقت يوشك على النفاد! يرجى الإكمال",
    es: "¡Expira pronto! Por favor completa",
    ru: "Время истекает! Завершите заказ",
    zh: "即将超时！请尽快完成",
    ja: "まもなく期限切れです！完了してください",
    fa: "زمان رو به اتمام است! تکمیل کنید",
    fr: "Expire bientôt ! Finalisez votre saisie",
    it: "In scadenza! Completa il passaggio",
    el: "Λήγει σύντομα! Ολοκληρώστε",
    pt: "Expirando em breve! Por favor conclua"
};

const CheckoutTimer = ({ expireAt }) => {
    const navigate = useNavigate();
    const [timeLeft, setTimeLeft] = useState(null);
    const { i18n } = useTranslation();
    const currentLang = i18n.language || localStorage.getItem('language') || 'tr';
    const localizedTitle = timerLocales[currentLang] || timerLocales['tr'];
    const localizedSub = timerSubtitles[currentLang] || timerSubtitles['tr'];
    const localizedWarning = timerWarningSubtitles[currentLang] || timerWarningSubtitles['tr'];

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
    const progress = Math.min(100, Math.max(0, (totalSeconds / maxSeconds) * 100));

    return (
        <div 
            className={`flex items-center justify-between px-4 py-2.5 h-[58px] min-h-[58px] rounded-xl border shadow-xs transition-all duration-500 w-full font-roboto ${
                isLowTime
                    ? 'bg-red-50/90 dark:bg-red-950/30 border-red-200 dark:border-red-800/50 text-red-700 dark:text-red-300'
                    : 'bg-[#fef9ee] dark:bg-amber-950/30 border-amber-200/80 dark:border-amber-700/50 text-amber-800 dark:text-amber-300'
            }`}
            lang={currentLang}
        >
            <div className="flex items-center gap-3 min-w-0">
                <div className={`size-8 rounded-lg flex items-center justify-center shrink-0 ${
                    isLowTime
                        ? 'bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400'
                        : 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300'
                } ${isLowTime ? 'animate-pulse' : ''}`}>
                    <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                        {isLowTime ? 'timer_off' : 'timer'}
                    </span>
                </div>
                <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-wider leading-tight opacity-75">
                        {localizedTitle}
                    </p>
                    <p className="text-[11px] font-normal opacity-90 truncate">
                        {isLowTime ? localizedWarning : localizedSub}
                    </p>
                </div>
            </div>

            <div className="flex flex-col items-end shrink-0 pl-3">
                <span className={`text-base font-bold tabular-nums tracking-wide font-mono leading-none ${
                    isLowTime ? 'animate-pulse text-red-600 dark:text-red-400' : 'text-amber-800 dark:text-amber-200'
                }`}>
                    {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
                </span>
                <div className="mt-1.5 h-1 w-16 sm:w-20 rounded-full bg-current opacity-20 overflow-hidden">
                    <div
                        className="h-full rounded-full bg-current transition-all duration-1000 ease-linear opacity-90"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>
        </div>
    );
};

export default CheckoutTimer;
