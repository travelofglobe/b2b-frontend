import React from 'react';
import { useNavigate } from 'react-router-dom';

const UnderConstruction = ({ title, icon }) => {
    const navigate = useNavigate();

    return (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <div className="relative mb-8">
                {/* Background Glow */}
                <div className="absolute inset-0 bg-primary/20 blur-[100px] rounded-full scale-150"></div>
                
                {/* Icon Container */}
                <div className="relative size-24 bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl shadow-primary/20 flex items-center justify-center border border-slate-100 dark:border-slate-800 animate-bounce-slow">
                    <span className="material-icons-round text-5xl text-primary">{icon || 'construction'}</span>
                </div>

                {/* Badge */}
                <div className="absolute -top-2 -right-2 bg-amber-500 text-white text-[10px] font-black uppercase px-3 py-1 rounded-full shadow-lg shadow-amber-500/30 tracking-wider">
                    Coming Soon
                </div>
            </div>

            <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-3 tracking-tight">
                {title} <span className="text-primary">Development</span>
            </h1>
            <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed text-sm">
                We're currently building the {title} module to provide you with the best experience. 
                Our engineers are working hard to bring these features to life.
            </p>

            <div className="mt-10 flex items-center gap-4">
                <button 
                    onClick={() => navigate('/dashboard')}
                    className="px-6 py-2.5 bg-primary text-white rounded-xl font-bold text-xs shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all active:scale-95"
                >
                    Back to Dashboard
                </button>
                <div className="h-10 w-[1px] bg-slate-200 dark:bg-slate-800"></div>
                <div className="flex -space-x-2">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className={`size-8 rounded-full border-2 border-white dark:border-[#0B1120] bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden`}>
                            <img src={`https://i.pravatar.cc/150?u=${i + 10}`} alt="Team" className="w-full h-full object-cover grayscale opacity-60" />
                        </div>
                    ))}
                    <div className="size-8 rounded-full border-2 border-white dark:border-[#0B1120] bg-primary/10 flex items-center justify-center">
                        <span className="text-[10px] font-bold text-primary">+5</span>
                    </div>
                </div>
            </div>

            {/* Progress Bar Mockup */}
            <div className="mt-16 w-full max-w-xs">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Progress</span>
                    <span className="text-[10px] font-black text-primary uppercase">65%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full w-[65%] relative overflow-hidden">
                        <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.3)_50%,transparent_100%)] animate-shimmer"></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UnderConstruction;
