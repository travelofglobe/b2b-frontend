import React from 'react';
import { useNavigate } from 'react-router-dom';

const UnderConstruction = ({ title, icon }) => {
    const navigate = useNavigate();

    return (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-[#f8f9fa] dark:bg-[#202124]">
            <div className="relative mb-6">
                {/* Icon Container - Google Clean Style */}
                <div className="size-20 rounded-full bg-[#e8f0fe] dark:bg-[#1a73e8]/20 border border-[#dadce0] dark:border-[#1a73e8]/30 flex items-center justify-center text-[#1a73e8] dark:text-[#8ab4f8] shadow-xs">
                    <span className="material-symbols-outlined text-4xl">{icon || 'construction'}</span>
                </div>

                {/* Badge */}
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-[#1a73e8] text-white text-[10px] font-semibold uppercase px-2.5 py-0.5 rounded-full shadow-xs tracking-wider whitespace-nowrap">
                    Yakında
                </div>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-[#202124] dark:text-white mb-2 tracking-tight">
                {title}
            </h1>
            <p className="text-sm text-[#5f6368] dark:text-slate-400 max-w-md mx-auto leading-relaxed mb-8">
                Bu modül geliştirme aşamasındadır. En kısa sürede yeni Google seyahat arayüzü standartlarıyla kullanıma sunulacaktır.
            </p>

            <div className="flex items-center gap-3">
                <button 
                    onClick={() => navigate('/travel/hotels')}
                    className="px-6 py-2.5 bg-[#1a73e8] hover:bg-[#1765cc] text-white rounded-full font-medium text-sm shadow-xs hover:shadow-sm transition-all active:scale-95 cursor-pointer flex items-center gap-2"
                >
                    <span className="material-symbols-outlined text-[18px]">travel_explore</span>
                    <span>Ana Sayfaya Dön</span>
                </button>
            </div>
        </div>
    );
};

export default UnderConstruction;
