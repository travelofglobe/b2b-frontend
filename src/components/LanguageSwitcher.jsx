import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { SUPPORTED_LANGUAGES } from '../i18n';

const LanguageSwitcher = () => {
    const { i18n } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    const currentLanguage = SUPPORTED_LANGUAGES.find(lang => lang.code === i18n.language) || SUPPORTED_LANGUAGES[0];

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    useEffect(() => {
        const lang = i18n.language || 'en';
        document.documentElement.setAttribute('lang', lang);
        localStorage.setItem('language', lang);
    }, [i18n.language]);

    const handleLanguageChange = (langCode) => {
        i18n.changeLanguage(langCode);
        localStorage.setItem('language', langCode);
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50/50 hover:bg-slate-100 dark:bg-slate-800/40 dark:hover:bg-slate-800/80 border border-slate-200/50 dark:border-slate-800/50 text-slate-700 dark:text-slate-200 transition-all duration-200 select-none active:scale-95 text-xs font-bold shadow-sm"
                aria-expanded={isOpen}
                aria-haspopup="true"
            >
                <span className="text-base leading-none">{currentLanguage.flag}</span>
                <span className="hidden sm:inline">{currentLanguage.name}</span>
                <span className={`material-symbols-outlined text-[16px] text-slate-400 dark:text-slate-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
                    expand_more
                </span>
            </button>

            {isOpen && (
                <div className="absolute right-0 ltr:right-0 rtl:left-0 mt-2 w-48 bg-white/90 dark:bg-slate-950/90 backdrop-blur-xl border border-slate-200/60 dark:border-slate-800/60 rounded-2xl shadow-2xl overflow-hidden z-[9999] animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="py-1.5 max-h-80 overflow-y-auto scrollbar-thin">
                        {SUPPORTED_LANGUAGES.map((lang) => {
                            const isSelected = lang.code === i18n.language;
                            return (
                                <button
                                    key={lang.code}
                                    onClick={() => handleLanguageChange(lang.code)}
                                    className={`w-full text-left ltr:text-left rtl:text-right px-4 py-2 text-xs font-semibold flex items-center gap-3 transition-colors ${
                                        isSelected
                                            ? 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-white'
                                            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900/60'
                                    }`}
                                >
                                    <span className="text-base leading-none">{lang.flag}</span>
                                    <span className="flex-1 truncate">{lang.name}</span>
                                    {isSelected && (
                                        <span className="material-symbols-outlined text-[16px] text-primary dark:text-white leading-none font-bold">
                                            check
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

export default LanguageSwitcher;
