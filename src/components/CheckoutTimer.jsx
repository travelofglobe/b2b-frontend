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
            className={`flex items-center justify-between px-3.5 py-2 rounded-xl border shadow-2xs transition-all duration-300 w-full font-roboto ${
                isLowTime
                    ? 'bg-red-50/90 dark:bg-red-950/30 border-red-200 dark:border-red-800/50 text-red-600 dark:text-red-400'
                    : 'bg-[#fef9ee] dark:bg-amber-950/20 border-amber-200/70 dark:border-amber-700/40 text-amber-800 dark:text-amber-300'
            }`}
            lang={currentLang}
        >
            <div className="flex items-center gap-2 min-w-0">
                <span className={`material-symbols-outlined text-[17px] shrink-0 ${isLowTime ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'}`} style={{ fontVariationSettings: "'FILL' 1" }}>
                    {isLowTime ? 'timer_off' : 'schedule'}
                </span>
                <span className="text-xs font-medium truncate opacity-90">
                    {localizedTitle}
                </span>
            </div>

            <div className="flex items-center gap-2 shrink-0 pl-2">
                <span className={`text-xs font-bold tabular-nums tracking-wider font-mono px-2 py-0.5 rounded-md ${
                    isLowTime 
                        ? 'bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-300 animate-pulse' 
                        : 'bg-amber-100/70 dark:bg-amber-900/40 text-amber-900 dark:text-amber-200'
                }`}>
                    {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
                </span>
            </div>
        </div>
    );
};

export default CheckoutTimer;
