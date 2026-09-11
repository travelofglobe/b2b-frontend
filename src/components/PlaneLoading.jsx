import React from 'react';

const loadingLocales = {
    en: "Securing your gateway...",
    tr: "Ağ geçidiniz güvence altına alınıyor...",
    ar: "تأمين بوابة الدخول الخاصة بك...",
    es: "Asegurando su pasarela...",
    ru: "Обеспечение безопасности шлюза...",
    zh: "正在保护您的网关...",
    ja: "ゲートウェイのセキュリティ保護中...",
    fa: "ایمن‌سازی دروازه شما...",
    fr: "Sécurisation de votre passerelle...",
    it: "Messa in sicurezza del gateway...",
    el: "Διασφάλιση της πύλης σας...",
    pt: "Protegendo seu portal..."
};

const PlaneLoading = ({ topClass = "top-16" }) => {
    const currentLang = localStorage.getItem('language') || 'tr';
    const localizedText = loadingLocales[currentLang] || loadingLocales['tr'];

    return (
        <div className={`fixed left-0 right-0 z-[1050] h-12 animate-in fade-in duration-500 pointer-events-none ${topClass}`}>
            {/* Background Bar (Track) - Placed exactly at the top border */}
            <div className="absolute inset-x-0 top-0 h-1 bg-white/10 backdrop-blur-sm border-b border-white/20" />

            {/* Progress Container */}
            <div className="relative w-full h-full">
                {/* Glowing Progress Fill */}
                <div className="absolute top-0 left-0 h-1 bg-gradient-to-r from-transparent via-primary to-blue-400 shadow-[0_0_20px_rgba(19,127,236,0.8)] animate-progress-fill" />

                {/* The Plane - Centers on the line, overlays header border */}
                <div className="absolute top-0 -ml-4 -translate-y-1/2 flex items-center justify-center animate-plane-travel z-20">
                    <div className="relative flex items-center">
                        <span className="material-symbols-outlined text-[24px] text-white rotate-90 fill-1 [text-shadow:0_0_15px_rgba(255,255,255,0.9)]">
                            flight
                        </span>
                        {/* Jet Engine Glow Effect */}
                        <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-1.5 bg-primary/80 blur-[3px] rounded-full animate-pulse" />
                    </div>
                </div>
            </div>

            {/* Subtle "Authenticating" text underneath */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 w-full text-center">
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/90 drop-shadow animate-pulse whitespace-nowrap">
                    {localizedText}
                </p>
            </div>

            <style>{`
                @keyframes progress-fill {
                    0% { width: 0%; opacity: 0; }
                    10% { opacity: 1; }
                    90% { opacity: 1; }
                    100% { width: 100%; opacity: 0; }
                }
                @keyframes plane-travel {
                    0% { left: 0%; transform: translateY(-50%) rotate(0deg); }
                    100% { left: 100%; transform: translateY(-50%) rotate(0deg); }
                }
                .animate-progress-fill {
                    animation: progress-fill 2s infinite ease-in-out;
                }
                .animate-plane-travel {
                    animation: plane-travel 2s infinite ease-in-out;
                }
            `}</style>
        </div>
    );
};

export default PlaneLoading;

