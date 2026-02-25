import React from 'react';

const PlaneLoading = () => {
    return (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-slate-900/60 backdrop-blur-xl rounded-[32px] overflow-hidden animate-in fade-in duration-500">
            {/* Background Atmosphere */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-0 w-32 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent animate-cloud-1"></div>
                <div className="absolute top-2/3 right-0 w-48 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent animate-cloud-2"></div>
                <div className="absolute top-1/2 left-1/4 w-24 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent animate-cloud-3"></div>
            </div>

            <div className="relative flex flex-col items-center">
                {/* Flight Path & Plane Container */}
                <div className="relative w-48 h-24 flex items-center justify-center">
                    {/* Dashed Flight Path */}
                    <svg className="absolute w-full h-full overflow-visible" viewBox="0 0 200 100">
                        <path
                            d="M 0 70 Q 100 0 200 70"
                            fill="none"
                            stroke="rgba(255,255,255,0.1)"
                            strokeWidth="2"
                            strokeDasharray="4 8"
                        />
                    </svg>

                    {/* Airplane Icon */}
                    <div className="relative animate-flight">
                        <div className="relative p-4 rounded-full bg-primary/20 backdrop-blur-md border border-primary/30 shadow-[0_0_30px_rgba(19,127,236,0.3)]">
                            <span className="material-symbols-outlined text-4xl text-primary leading-none block fill-1">
                                flight
                            </span>
                            {/* Engine Glow */}
                            <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-4 h-4 bg-primary/40 blur-md rounded-full animate-pulse"></div>
                        </div>
                    </div>
                </div>

                {/* Status Text */}
                <div className="mt-8 text-center space-y-2">
                    <h3 className="text-white font-black uppercase tracking-[0.3em] text-sm animate-pulse">
                        Authenticating
                    </h3>
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                        Preparing your journey...
                    </p>
                </div>
            </div>

            <style>{`
                @keyframes flight {
                    0% { transform: translate(-80px, 20px) rotate(-10deg); opacity: 0; }
                    20% { opacity: 1; }
                    50% { transform: translate(0, -10px) rotate(0deg); }
                    80% { opacity: 1; }
                    100% { transform: translate(80px, 20px) rotate(10deg); opacity: 0; }
                }
                .animate-flight {
                    animation: flight 2.5s infinite ease-in-out;
                }
                @keyframes cloud-slide {
                    from { transform: translateX(100%); }
                    to { transform: translateX(-100%); }
                }
                .animate-cloud-1 { animation: cloud-slide 8s infinite linear; }
                .animate-cloud-2 { animation: cloud-slide 12s infinite linear; }
                .animate-cloud-3 { animation: cloud-slide 10s infinite linear; }
            `}</style>
        </div>
    );
};

export default PlaneLoading;
