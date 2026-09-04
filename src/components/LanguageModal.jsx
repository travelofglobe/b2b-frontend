import React from 'react';
import { useTranslation } from 'react-i18next';
import { SUPPORTED_LANGUAGES } from '../i18n';

const LanguageModal = ({ isOpen, onClose }) => {
    const { i18n, t } = useTranslation();

    if (!isOpen) return null;

    const handleSelectLanguage = (langCode) => {
        i18n.changeLanguage(langCode);
        document.documentElement.setAttribute('lang', langCode);
        localStorage.setItem('language', langCode);
        localStorage.setItem('i18nextLng', langCode);
        localStorage.setItem('user_manual_lang_override', 'true');
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div 
                className="fixed inset-0 bg-black/50 backdrop-blur-[2px] transition-opacity animate-in fade-in duration-200"
                onClick={onClose}
            />

            {/* Modal Box */}
            <div className="relative w-full max-w-lg bg-white dark:bg-[#202124] rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-[#dadce0] dark:border-slate-700 overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-[#e8eaed] dark:border-slate-700">
                    <div className="flex items-center gap-2.5">
                        <span className="material-symbols-outlined text-[22px] text-[#1a73e8]">language</span>
                        <h3 className="text-base font-semibold text-[#202124] dark:text-white">
                            {t('common.selectLanguage', 'Dil Seçin')}
                        </h3>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-8 h-8 rounded-full flex items-center justify-center text-[#5f6368] dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                        <span className="material-symbols-outlined text-[20px]">close</span>
                    </button>
                </div>

                {/* Body - Languages Grid */}
                <div className="p-4 max-h-[65vh] overflow-y-auto scrollbar-thin">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {SUPPORTED_LANGUAGES.map((lang) => {
                            const isSelected = i18n.language === lang.code;
                            return (
                                <button
                                    key={lang.code}
                                    type="button"
                                    onClick={() => handleSelectLanguage(lang.code)}
                                    className={`flex items-center justify-between px-4 py-3 rounded-xl border text-left transition-all ${
                                        isSelected
                                            ? 'border-[#1a73e8] bg-[#e8f0fe] dark:bg-blue-900/30 text-[#1a73e8] dark:text-blue-300 font-medium'
                                            : 'border-[#dadce0] dark:border-slate-700/80 hover:bg-[#f1f3f4] dark:hover:bg-slate-800 text-[#3c4043] dark:text-slate-200'
                                    }`}
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <span className="text-2xl leading-none flex-shrink-0">{lang.flag}</span>
                                        <span className="text-sm truncate">{lang.name}</span>
                                    </div>
                                    {isSelected ? (
                                        <span className="material-symbols-outlined text-[#1a73e8] text-[20px] shrink-0 ml-2">check_circle</span>
                                    ) : (
                                        <span className="w-4 h-4 rounded-full border border-slate-300 dark:border-slate-600 shrink-0 ml-2" />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end px-6 py-3 border-t border-[#e8eaed] dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-5 py-2 text-sm font-medium text-[#1a73e8] hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded-full transition-colors"
                    >
                        {t('common.cancel', 'Kapat')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LanguageModal;
