import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Home, ArrowLeft } from 'lucide-react';
import leftTravelersImg from '../assets/404/left-travelers.png';
import rightTravelersImg from '../assets/404/right-travelers.png';
import { NOT_FOUND_LOCALES } from '../utils/notFoundLocales';
import './NotFoundPage.css';

const NotFoundPage = () => {
    const navigate = useNavigate();
    const { i18n } = useTranslation();
    const currentLang = (i18n.language || 'en').toLowerCase().split('-')[0];
    const isRtl = currentLang === 'ar' || currentLang === 'fa';
    const loc = NOT_FOUND_LOCALES[currentLang] || NOT_FOUND_LOCALES.en;

    const compassRef = useRef(null);
    const spinBaseRef = useRef(0);
    const [needleRotation, setNeedleRotation] = useState(0);

    const handleSpinCompass = useCallback(() => {
        spinBaseRef.current += 360 + Math.floor(Math.random() * 180 - 90);
        setNeedleRotation(spinBaseRef.current);
    }, []);

    useEffect(() => {
        const handleMouseMove = (e) => {
            const compassEl = compassRef.current;
            if (!compassEl) return;
            const rect = compassEl.getBoundingClientRect();
            const cx = rect.left + rect.width / 2;
            const cy = rect.top + rect.height / 2;
            const dx = e.clientX - cx;
            const dy = e.clientY - cy;
            if (Math.hypot(dx, dy) < 320) {
                const angle = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
                setNeedleRotation(spinBaseRef.current + angle * 0.25);
            }
        };

        window.addEventListener('mousemove', handleMouseMove, { passive: true });
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    const handleGoBack = () => {
        if (window.history.length > 1) {
            navigate(-1);
        } else {
            navigate('/travel/hotels');
        }
    };

    return (
        <div
            className="notfound-root flex-1 min-h-full bg-white dark:bg-[#202124] text-[#202124] dark:text-[#e8eaed] flex flex-col items-center justify-center px-4 sm:px-6 py-8 sm:py-12 transition-colors duration-200 font-sans overflow-x-hidden"
            dir={isRtl ? 'rtl' : 'ltr'}
        >
            <div className="w-full max-w-[1120px] mx-auto flex flex-col items-center text-center">
                {/* Google Lineless Flat Vector Travelers + Animated Center 404 Compass */}
                <div className="nf-hero-stage mb-6" dir="ltr">
                    {/* Dotted Flight Arc, Subtle Clouds & Gliding Paper Airplane */}
                    <svg
                        className="nf-flight-arc"
                        viewBox="0 0 1120 310"
                        preserveAspectRatio="xMidYMax meet"
                        fill="none"
                        aria-hidden="true"
                    >
                        <g
                            stroke="var(--nf-line-art)"
                            strokeWidth="1.6"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            opacity="0.85"
                        >
                            <path d="M 278 28 C 278 18 295 17 301 24 C 308 20 320 23 320 31 C 328 31 328 39 322 42 H 280 C 272 42 271 31 278 28 Z" />
                            <path d="M 795 26 C 795 16 812 15 818 22 C 825 18 837 21 837 29 C 845 29 845 37 839 40 H 797 C 789 40 788 29 795 26 Z" />
                        </g>

                        <path
                            d="M 260 118 Q 555 -28 840 108"
                            stroke="var(--nf-line-art)"
                            strokeWidth="1.8"
                            strokeDasharray="6 6"
                            fill="none"
                        />

                        <g className="nf-gliding-plane">
                            <polygon points="-12,-6 12,0 -12,7 -7,0" fill="#4285F4" />
                            <polygon points="-7,0 12,0 -12,7" fill="#1A73E8" />
                            <polygon points="-12,-6 12,0 -7,0" fill="#8AB4F8" />
                        </g>
                    </svg>

                    {/* Left Lineless Google Travelers */}
                    <div className="nf-traveler-side nf-traveler-left">
                        <img
                            src={leftTravelersImg}
                            alt=""
                            aria-hidden="true"
                            draggable={false}
                        />
                    </div>

                    {/* Center Animated 4 [Compass] 4 + Directional Signpost */}
                    <div className="nf-center-stage">
                        <svg
                            className="nf-center-svg"
                            viewBox="0 0 380 315"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <defs>
                                <filter id="nfCompassGlow" x="-20%" y="-20%" width="140%" height="140%">
                                    <feDropShadow
                                        dx="0"
                                        dy="6"
                                        stdDeviation="8"
                                        floodColor="#1A73E8"
                                        floodOpacity="0.16"
                                    />
                                </filter>
                                <linearGradient id="nfCompassFace" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="var(--nf-compass-bg)" />
                                    <stop offset="100%" stopColor="var(--nf-four-blue-fill)" />
                                </linearGradient>
                            </defs>

                            {/* Left "4" */}
                            <text
                                x="58"
                                y="150"
                                textAnchor="middle"
                                fontFamily="'Google Sans', 'Plus Jakarta Sans', Roboto, sans-serif"
                                fontSize="122"
                                fontWeight="800"
                                fill="var(--nf-four-blue-fill)"
                                stroke="#1A73E8"
                                strokeWidth="4"
                                strokeLinejoin="round"
                            >
                                4
                            </text>

                            {/* Right "4" */}
                            <text
                                x="322"
                                y="150"
                                textAnchor="middle"
                                fontFamily="'Google Sans', 'Plus Jakarta Sans', Roboto, sans-serif"
                                fontSize="122"
                                fontWeight="800"
                                fill="var(--nf-four-red-fill)"
                                stroke="#EA4335"
                                strokeWidth="4"
                                strokeLinejoin="round"
                            >
                                4
                            </text>

                            {/* Center Animated Interactive Compass ("0") */}
                            <g
                                ref={compassRef}
                                className="nf-compass-float"
                                onClick={handleSpinCompass}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        handleSpinCompass();
                                    }
                                }}
                                role="button"
                                tabIndex={0}
                                aria-label={loc.compassHint}
                            >
                                <title>{loc.compassHint}</title>

                                {/* Subtle Radar Pulse Ring */}
                                <circle
                                    cx="190"
                                    cy="104"
                                    r="60"
                                    stroke="#4285F4"
                                    strokeWidth="2"
                                    className="nf-compass-pulse"
                                />

                                {/* Compass Top Ring */}
                                <circle cx="190" cy="36" r="10" stroke="#FBBC04" strokeWidth="5" fill="none" />
                                <rect x="184" y="42" width="12" height="8" rx="2" fill="#F29900" />

                                {/* Compass Face */}
                                <g className="nf-compass-outer-ring" filter="url(#nfCompassGlow)">
                                    <circle
                                        cx="190"
                                        cy="104"
                                        r="56"
                                        fill="url(#nfCompassFace)"
                                        stroke="#1A73E8"
                                        strokeWidth="5"
                                    />
                                    <circle
                                        cx="190"
                                        cy="104"
                                        r="47"
                                        fill="var(--nf-compass-bg)"
                                        stroke="var(--nf-compass-ring-inner)"
                                        strokeWidth="1.5"
                                        strokeDasharray="4 3"
                                    />
                                </g>

                                {/* Subtle Compass Rose */}
                                <g opacity="0.16" fill="#4285F4">
                                    <polygon points="190,68 196,98 226,104 196,110 190,140 184,110 154,104 184,98" />
                                </g>

                                {/* Cardinal Directions */}
                                <text
                                    x="190"
                                    y="70"
                                    textAnchor="middle"
                                    fontFamily="'Google Sans', Roboto, sans-serif"
                                    fontSize="13"
                                    fontWeight="800"
                                    fill="#EA4335"
                                >
                                    N
                                </text>
                                <text
                                    x="190"
                                    y="147"
                                    textAnchor="middle"
                                    fontFamily="'Google Sans', Roboto, sans-serif"
                                    fontSize="12.5"
                                    fontWeight="700"
                                    fill="var(--nf-cardinal-muted)"
                                >
                                    S
                                </text>
                                <text
                                    x="230"
                                    y="108"
                                    textAnchor="middle"
                                    fontFamily="'Google Sans', Roboto, sans-serif"
                                    fontSize="12.5"
                                    fontWeight="700"
                                    fill="var(--nf-cardinal-muted)"
                                >
                                    E
                                </text>
                                <text
                                    x="150"
                                    y="108"
                                    textAnchor="middle"
                                    fontFamily="'Google Sans', Roboto, sans-serif"
                                    fontSize="12.5"
                                    fontWeight="700"
                                    fill="var(--nf-cardinal-muted)"
                                >
                                    W
                                </text>

                                {/* Animated Compass Needle */}
                                <g
                                    className="nf-needle-user"
                                    style={{ transform: `rotate(${needleRotation}deg)` }}
                                >
                                    <g className="nf-needle-auto">
                                        <polygon points="190,104 182,101 190,66 198,101" fill="#EA4335" />
                                        <polygon points="190,104 190,66 198,101" fill="#D93025" />
                                        <polygon points="190,104 182,107 190,142 198,107" fill="#4285F4" />
                                        <polygon points="190,104 190,142 198,107" fill="#1A73E8" />
                                        <circle cx="190" cy="104" r="6.5" fill="#FBBC04" />
                                        <circle cx="190" cy="104" r="2.8" fill="#FFFFFF" />
                                    </g>
                                </g>

                                {/* Floating "?" Speech Bubble */}
                                <g className="nf-question-bubble">
                                    <rect x="0" y="0" width="28" height="26" rx="13" fill="#FBBC04" />
                                    <polygon points="6,23 13,24 5,31" fill="#FBBC04" />
                                    <text
                                        x="14"
                                        y="18.5"
                                        textAnchor="middle"
                                        fontFamily="'Google Sans', Roboto, sans-serif"
                                        fontSize="16"
                                        fontWeight="800"
                                        fill="#FFFFFF"
                                    >
                                        ?
                                    </text>
                                </g>
                            </g>

                            {/* Lineless Google-Style Directional Signpost */}
                            <g>
                                <rect x="185" y="176" width="10" height="134" rx="4" fill="var(--nf-pole-fill)" />
                                <rect
                                    x="190"
                                    y="176"
                                    width="5"
                                    height="134"
                                    rx="2.5"
                                    fill="var(--nf-pole-shade)"
                                    opacity="0.6"
                                />

                                {/* Arrow 1: Green */}
                                <g transform="translate(115, 184)">
                                    <path
                                        d="M 14 0 H 82 C 84.2 0 86 1.8 86 4 V 22 C 86 24.2 84.2 26 82 26 H 14 L 1 13 Z"
                                        fill="#34A853"
                                    />
                                    <text
                                        x="48"
                                        y="17"
                                        textAnchor="middle"
                                        fontFamily="'Google Sans', Roboto, sans-serif"
                                        fontSize="10.5"
                                        fontWeight="700"
                                        fill="#FFFFFF"
                                        letterSpacing="0.4"
                                    >
                                        {loc.signHere}
                                    </text>
                                </g>

                                {/* Arrow 2: Yellow */}
                                <g transform="translate(178, 218)">
                                    <path
                                        d="M 4 0 H 72 L 85 13 L 72 26 H 4 C 1.8 26 0 24.2 0 22 V 4 C 0 1.8 1.8 0 4 0 Z"
                                        fill="#FBBC04"
                                    />
                                    <text
                                        x="39"
                                        y="17"
                                        textAnchor="middle"
                                        fontFamily="'Google Sans', Roboto, sans-serif"
                                        fontSize="10.5"
                                        fontWeight="700"
                                        fill="#202124"
                                        letterSpacing="0.4"
                                    >
                                        {loc.signThere}
                                    </text>
                                </g>

                                {/* Arrow 3: Red */}
                                <g transform="translate(122, 254) rotate(-5 42 13)">
                                    <path
                                        d="M 14 0 H 82 C 84.2 0 86 1.8 86 4 V 22 C 86 24.2 84.2 26 82 26 H 14 L 1 13 Z"
                                        fill="#EA4335"
                                    />
                                    <text
                                        x="48"
                                        y="17"
                                        textAnchor="middle"
                                        fontFamily="'Google Sans', Roboto, sans-serif"
                                        fontSize="10"
                                        fontWeight="700"
                                        fill="#FFFFFF"
                                        letterSpacing="0.4"
                                    >
                                        {loc.signLost}
                                    </text>
                                </g>

                                {/* Pale-Blue Monoline Bushes Matching Side Illustrations */}
                                <g
                                    stroke="var(--nf-line-art)"
                                    strokeWidth="1.8"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    fill="none"
                                >
                                    <path d="M 152 310 C 152 299 164 298 168 306 C 171 296 184 297 185 310" />
                                    <path d="M 195 310 C 197 298 209 297 212 306 C 216 299 227 300 227 310" />
                                    <path d="M 164 306 L 164 310 M 206 305 L 206 310" />
                                </g>
                            </g>
                        </svg>
                    </div>

                    {/* Right Lineless Google Travelers */}
                    <div className="nf-traveler-side nf-traveler-right">
                        <img
                            src={rightTravelersImg}
                            alt=""
                            aria-hidden="true"
                            draggable={false}
                        />
                    </div>
                </div>

                {/* Error Code Pill */}
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#e8f0fe] dark:bg-[#4285f4]/15 text-[#1a73e8] dark:text-[#8ab4f8] text-[12px] font-bold tracking-wide mb-3">
                    <span className="size-2 rounded-full bg-[#1a73e8] dark:bg-[#8ab4f8]" />
                    <span>{loc.badge}</span>
                </div>

                {/* Title & Description */}
                <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-[#202124] dark:text-[#e8eaed] mb-2.5">
                    {loc.title}
                </h1>

                <p className="text-sm sm:text-base text-[#5f6368] dark:text-[#9aa0a6] max-w-[560px] leading-relaxed mb-8">
                    {loc.subtitle}
                </p>

                {/* Primary & Secondary Action Buttons */}
                <div className="flex flex-wrap items-center justify-center gap-3">
                    <button
                        type="button"
                        onClick={() => navigate('/travel/hotels')}
                        className="inline-flex items-center justify-center gap-2 px-7 py-3 rounded-full bg-[#1a73e8] hover:bg-[#1557b0] text-white text-[14.5px] font-medium shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 cursor-pointer"
                    >
                        <Home className="size-[18px]" strokeWidth={2} />
                        <span>{loc.homeBtn}</span>
                    </button>

                    <button
                        type="button"
                        onClick={handleGoBack}
                        className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-white dark:bg-[#2a2b2f] hover:bg-[#f1f3f4] dark:hover:bg-[#35373c] text-[#3c4043] dark:text-[#e8eaed] border border-[#dadce0] dark:border-[#3c4043] text-[14.5px] font-medium transition-all duration-200 cursor-pointer"
                    >
                        <ArrowLeft className={`size-[18px] ${isRtl ? 'rotate-180' : ''}`} strokeWidth={2} />
                        <span>{loc.backBtn}</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default NotFoundPage;
