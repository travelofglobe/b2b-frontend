import React, { useState, useEffect } from 'react';

const soonLocales = {
    en: "Soon",
    tr: "Yakında",
    ar: "قريباً",
    es: "Pronto",
    ru: "Скоро",
    zh: "即将推出",
    ja: "まもなく",
    fa: "به‌زودی",
    fr: "Bientôt",
    it: "Presto",
    el: "Σύντομα",
    pt: "Em breve"
};

const FilterSection = ({ title, icon, defaultOpen = true, disabled = false, isFlat = false, children }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    const currentLang = localStorage.getItem('language') || 'tr';
    const localizedSoon = soonLocales[currentLang] || soonLocales['tr'];

    // Keep it synced if the requirement changes externally
    useEffect(() => {
        if (!isFlat) {
            setIsOpen(defaultOpen);
        }
    }, [defaultOpen, isFlat]);

    if (isFlat) {
        return (
            <div className={`py-5 px-5 border-b border-[#e8eaed] dark:border-slate-700/50 last:border-0 ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
                <h3 className="text-[15px] font-medium text-[#202124] dark:text-slate-200 mb-4 flex items-center gap-2">
                    {icon && <span className="material-symbols-outlined text-slate-400 text-lg">{icon}</span>}
                    {title}
                    {disabled && (
                        <span className="text-[9px] font-bold uppercase tracking-wider bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded ml-1">{localizedSoon}</span>
                    )}
                </h3>
                <div>
                    {children}
                </div>
            </div>
        );
    }

    return (
        <div className={`border-b border-[#e8eaed] dark:border-slate-800/50 py-5 px-5 last:border-0 ${disabled ? 'opacity-50' : ''}`}>
            <button
                onClick={() => !disabled && setIsOpen(!isOpen)}
                className={`w-full flex items-center justify-between group ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
            >
                <h3 className="text-[15px] font-medium text-[#202124] dark:text-slate-200 flex items-center gap-2 group-hover:text-primary transition-colors">
                    {icon && <span className="material-symbols-outlined text-slate-400 group-hover:text-primary transition-colors text-[20px]">{icon}</span>}
                    {title}
                    {disabled && (
                        <span className="text-[9px] font-bold uppercase tracking-wider bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded ml-1">{localizedSoon}</span>
                    )}
                </h3>
                {!disabled && (
                    <span className="material-symbols-outlined text-slate-400 group-hover:text-primary text-[20px] transition-transform duration-300" style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0)' }}>
                        expand_more
                    </span>
                )}
            </button>
            {/* The wrapper handles height animation gracefully */}
            <div
                className={`transition-all duration-300 ease-in-out overflow-hidden ${disabled ? 'pointer-events-none' : ''}`}
                style={{ maxHeight: isOpen && !disabled ? '5000px' : '0px', opacity: isOpen && !disabled ? 1 : 0, marginTop: isOpen && !disabled ? '10px' : '0px' }}
            >
                {children}
            </div>
        </div>
    );
};

export default FilterSection;
