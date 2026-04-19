import React from 'react';

const PlaneLoading = () => {
    return (
        <div className="fixed top-0 left-0 right-0 z-[9999] h-1.5 animate-in fade-in duration-500 overflow-visible">
            {/* Background Bar (Glassmorphic Track) */}
            <div className="absolute inset-x-0 top-0 h-full bg-white/5 backdrop-blur-sm border-b border-white/10" />

            {/* Progress Container */}
            <div className="relative w-full h-full">
                {/* Glowing Progress Fill */}
                <div className="absolute top-0 left-0 h-full bg-gradient-to-r from-transparent via-primary to-blue-400 shadow-[0_0_15px_rgba(19,127,236,0.6)] animate-progress-fill" />

                {/* The Plane */}
                <div className="absolute top-1/2 -ml-3 -translate-y-1/2 flex items-center justify-center animate-plane-travel">
                    <div className="relative">
                        <span className="material-symbols-outlined text-[18px] text-white rotate-90 fill-1 [text-shadow:0_0_10px_rgba(255,255,255,0.8)]">
                            flight
                        </span>
                        {/* Jet Engine Glow Effect */}
                        <div className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-3 h-1 bg-white/60 blur-[2px] rounded-full animate-pulse" />
                    </div>
                </div>
            </div>

            {/* Subtle "Authenticating" text underneath */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 w-full text-center pointer-events-none">
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/80 animate-pulse whitespace-nowrap">
                    Securing your gateway...
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
