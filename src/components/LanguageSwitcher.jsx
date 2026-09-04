import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { SUPPORTED_LANGUAGES } from '../i18n';

const LanguageSwitcher = ({ mode }) => {
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
        localStorage.setItem('user_manual_lang_override', 'true');
        setIsOpen(false);
    };

    if (mode === 'menu') {
        return (
            <div className="w-full border-b border-slate-100 dark:border-slate-800" ref={dropdownRef}>
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className="w-full px-4 py-2.5 text-[13px] font-normal text-slate-700 dark:text-slate-200 hover:bg-[#f1f3f4] dark:hover:bg-slate-800/50 flex items-center justify-between transition-colors cursor-pointer"
                >
                    <span className="flex items-center gap-2 text-[#70757a] dark:text-slate-400">
                        <span className="material-symbols-outlined text-[18px]">language</span>
                        <span>Dil</span>
                    </span>
                    <div className="flex items-center gap-1.5">
                        <span className="text-sm leading-none">{currentLanguage.flag}</span>
                        <span className="text-[13px] font-normal text-[#3c4043] dark:text-slate-200">{currentLanguage.name}</span>
                        <span className={`material-symbols-outlined text-[18px] text-[#70757a] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
                            arrow_drop_down
                        </span>
                    </div>
                </button>

                {isOpen && (
                    <div className="px-2 pb-2 space-y-0.5 bg-[#f8f9fa] dark:bg-slate-900/60 max-h-52 overflow-y-auto custom-scrollbar border-t border-[#dadce0] dark:border-slate-800/60 pt-1.5 font-roboto">
                        {SUPPORTED_LANGUAGES.map((lang) => {
                            const isSelected = lang.code === i18n.language;
                            return (
                                <button
                                    key={lang.code}
                                    type="button"
                                    onClick={() => handleLanguageChange(lang.code)}
                                    className={`w-full text-left px-3 py-2 rounded-md text-[13px] font-normal flex items-center justify-between transition-colors cursor-pointer ${
                                        isSelected
                                            ? 'bg-[#e8f0fe] text-[#1a73e8] dark:bg-[#1a73e8]/20 dark:text-[#8ab4f8]'
                                            : 'text-[#3c4043] dark:text-slate-300 hover:bg-[#f1f3f4] dark:hover:bg-slate-800'
                                    }`}
                                >
                                    <span className="flex items-center gap-2">
                                        <span className="text-base leading-none">{lang.flag}</span>
                                        <span>{lang.name}</span>
                                    </span>
                                    {isSelected && (
                                        <span className="material-symbols-outlined text-[18px] text-[#1a73e8] dark:text-[#8ab4f8]">
                                            check
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-[#303134] hover:bg-[#f1f3f4] dark:hover:bg-[#3c4043] border border-[#dadce0] dark:border-[#5f6368] text-[#3c4043] dark:text-slate-200 transition-all text-[13px] font-normal cursor-pointer shadow-xs"
                aria-expanded={isOpen}
                aria-haspopup="true"
            >
                <span className="text-base leading-none">{currentLanguage.flag}</span>
                <span className="hidden sm:inline">{currentLanguage.name}</span>
                <span className={`material-symbols-outlined text-[18px] text-[#70757a] dark:text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
                    arrow_drop_down
                </span>
            </button>

            {isOpen && (
                <div className="absolute right-0 ltr:right-0 rtl:left-0 mt-1.5 w-48 bg-white dark:bg-[#202124] border border-[#dadce0] dark:border-[#3c4043] rounded-lg shadow-[0_2px_6px_2px_rgba(60,64,67,0.15),0_1px_2px_0_rgba(60,64,67,0.3)] overflow-hidden z-[9999] animate-in fade-in slide-in-from-top-1 duration-150 font-roboto">
                    <div className="py-1 max-h-80 overflow-y-auto custom-scrollbar">
                        {SUPPORTED_LANGUAGES.map((lang) => {
                            const isSelected = lang.code === i18n.language;
                            return (
                                <button
                                    key={lang.code}
                                    onClick={() => handleLanguageChange(lang.code)}
                                    className={`w-full text-left ltr:text-left rtl:text-right px-3.5 py-2 text-[13px] font-normal flex items-center gap-2.5 transition-colors cursor-pointer ${
                                        isSelected
                                            ? 'bg-[#e8f0fe] text-[#202124] dark:bg-[#1a73e8]/20 dark:text-white'
                                            : 'text-[#3c4043] dark:text-slate-300 hover:bg-[#f1f3f4] dark:hover:bg-[#303134]'
                                    }`}
                                >
                                    <div className="w-5 flex items-center justify-start shrink-0">
                                        {isSelected && (
                                            <span className="material-symbols-outlined text-[18px] text-[#3c4043] dark:text-slate-200">
                                                check
                                            </span>
                                        )}
                                    </div>
                                    <span className="text-base leading-none">{lang.flag}</span>
                                    <span className="flex-1 truncate">{lang.name}</span>
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
