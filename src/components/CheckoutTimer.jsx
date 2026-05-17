import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const timerLocales = {
    en: "Complete Booking In",
    tr: "Rezervasyonu Tamamla",
    ar: "أكمل الحجز خلال",
    es: "Completar Reserva En",
    ru: "Завершите бронирование за",
    zh: "在此时限内完成预订",
    ja: "予約完了まであと",
    fa: "تکمیل رزرو در",
    fr: "Finaliser la réservation sous",
    it: "Completa la Prenotazione Entro",
    el: "Ολοκλήρωση Κράτησης Σε",
    pt: "Conclua a Reserva Em"
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

    return (
        <div className={`flex items-center gap-2 px-4 py-2 rounded-2xl border transition-all duration-500 shadow-sm ${
            isLowTime 
                ? 'bg-red-50 border-red-100 text-red-600 animate-pulse' 
                : 'bg-amber-50 border-amber-100 text-amber-700'
        }`}>
            <span className="material-symbols-outlined text-[18px]">
                {isLowTime ? 'timer_off' : 'timer'}
            </span>
            <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-wider leading-none mb-0.5">
                    {localizedText}
                </span>
                <span className="text-sm font-black tabular-nums leading-none">
                    {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
                </span>
            </div>
        </div>
    );
};

export default CheckoutTimer;
