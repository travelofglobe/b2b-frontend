import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './LanguageSwitcher';

const PublicHeader = () => {
    const { t } = useTranslation();
    const location = useLocation();
    const navigate = useNavigate();

    const isLoginPage = location.pathname === '/login';
    const isApplicationPage = location.pathname === '/agency-application';

    return (
        <header className="fixed top-0 left-0 right-0 z-40 h-16 bg-slate-900/30 dark:bg-slate-900/40 backdrop-blur-2xl border-b border-white/20 px-4 md:px-8 flex items-center justify-between shadow-md transition-all duration-300">
            {/* Brand Logo & Title */}
            <div 
                className="flex items-center gap-3 select-none cursor-pointer group" 
                onClick={() => navigate('/')}
            >
                <div className="size-9 bg-gradient-to-br from-primary to-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/25 transition-transform duration-500 group-hover:scale-105 group-hover:rotate-6">
                    <span className="material-symbols-outlined text-xl fill-1">travel</span>
                </div>
                <div className="flex flex-col">
                    <h2 className="text-white text-[14px] font-black leading-none tracking-tight uppercase whitespace-nowrap drop-shadow-sm">
                        Travel <span className="text-primary">of</span> Globe
                    </h2>
                    <div className="flex items-center gap-1.5 mt-1">
                        <div className="h-[1px] w-3 bg-primary/70"></div>
                        <p className="text-[7px] font-bold text-white/70 uppercase tracking-[0.25em] whitespace-nowrap leading-none">Global B2B Solutions</p>
                    </div>
                </div>
            </div>

            {/* Navigation & Language Actions */}
            <div className="flex items-center gap-3 md:gap-4">
                {/* Partner Application Link / Navigation */}
                {!isApplicationPage && (
                    <Link
                        to="/agency-application"
                        className="px-3.5 py-1.5 md:px-4 md:py-2 rounded-xl text-[12px] font-bold uppercase tracking-wider text-white bg-white/10 hover:bg-white/20 border border-white/15 hover:border-primary/50 backdrop-blur-md shadow-xs hover:shadow-primary/20 transition-all duration-300 flex items-center gap-2 group cursor-pointer"
                    >
                        <span className="material-symbols-outlined text-[17px] text-primary group-hover:scale-110 transition-transform">
                            handshake
                        </span>
                        <span className="hidden sm:inline">{t('login.partnerApply', 'Become a Partner')}</span>
                        <span className="sm:hidden">{t('login.apply', 'Partner')}</span>
                    </Link>
                )}

                {/* Sign In Navigation (when on application or reset pages) */}
                {!isLoginPage && (
                    <Link
                        to="/login"
                        className="px-3.5 py-1.5 md:px-4 md:py-2 rounded-xl text-[12px] font-bold uppercase tracking-wider text-white bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-700 shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 transition-all duration-300 flex items-center gap-1.5 cursor-pointer"
                    >
                        <span className="material-symbols-outlined text-[17px]">
                            login
                        </span>
                        <span>{t('common.signIn', 'Sign In')}</span>
                    </Link>
                )}

                {/* Separator Line */}
                <div className="h-5 w-[1px] bg-white/15 dark:bg-slate-700 mx-0.5"></div>

                {/* Language Switcher Dropdown */}
                <div className="z-50">
                    <LanguageSwitcher />
                </div>
            </div>
        </header>
    );
};

export default PublicHeader;
