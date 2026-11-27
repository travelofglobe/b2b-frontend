import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './LanguageSwitcher';
import logoSvg from '../assets/logo.svg';

const PublicHeader = () => {
    const { t } = useTranslation();
    const location = useLocation();
    const navigate = useNavigate();

    const isLoginPage = location.pathname === '/login';
    const isApplicationPage = location.pathname === '/agency-application';

    return (
        <header className="fixed top-0 left-0 right-0 z-40 h-16 bg-white/75 dark:bg-slate-900/75 backdrop-blur-xl border-b border-slate-200/70 dark:border-white/10 px-4 md:px-8 flex items-center justify-between shadow-[0_4px_20px_rgba(0,0,0,0.08)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.4)] transition-all duration-300">
            {/* Brand Logo & Portal Indicator */}
            {isLoginPage ? (
                <div 
                    className="flex items-center gap-2.5 sm:gap-3 select-none cursor-pointer group py-1" 
                    onClick={() => navigate('/')}
                >
                    <div className="w-[22px] h-[22px] rounded-lg bg-gradient-to-tr from-[#137fec] to-blue-500 text-white flex items-center justify-center shadow-sm border border-white/20 transition-transform duration-300 group-hover:scale-105">
                        <span className="material-symbols-outlined text-[19px]" style={{ fontSize: '19px' }}>travel_explore</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-black uppercase tracking-[0.16em] text-slate-800 dark:text-white">
                            TRAVEL OF GLOBE
                        </span>
                        <span className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/10 border border-slate-200/60 dark:border-white/10 text-[10px] font-bold text-[#137fec] dark:text-blue-400 uppercase tracking-wider">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            B2B PORTAL
                        </span>
                    </div>
                </div>
            ) : (
                <div 
                    className="flex flex-col cursor-pointer select-none group mr-1 py-0.5 justify-center" 
                    onClick={() => navigate('/')}
                >
                    <img 
                        src={logoSvg} 
                        alt="Travel of Globe" 
                        className="h-6 sm:h-6.5 w-auto max-w-[155px] sm:max-w-[170px] object-contain transition-transform duration-300 group-hover:scale-105 drop-shadow-sm" 
                    />
                    <div className="flex items-center gap-1.5 mt-1.5">
                        <div className="h-[1px] w-2.5 bg-[#137fec]/60"></div>
                        <p className="text-[7.5px] sm:text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] whitespace-nowrap leading-none">
                            B2B Agency Workspace
                        </p>
                    </div>
                </div>
            )}

            {/* Navigation & Language Actions */}
            <div className="flex items-center gap-3 md:gap-4">
                {/* Partner Application Link / Navigation */}
                {!isApplicationPage && (
                    <Link
                        to="/agency-application"
                        className="px-3.5 py-1.5 md:px-4 md:py-2 rounded-xl text-[12px] font-bold uppercase tracking-wider text-slate-700 dark:text-white bg-white/80 dark:bg-white/10 hover:bg-white dark:hover:bg-white/20 border border-slate-200/80 dark:border-white/15 backdrop-blur-md shadow-xs transition-all duration-300 flex items-center gap-2 group cursor-pointer"
                    >
                        <span className="material-symbols-outlined text-[17px] text-[#137fec] group-hover:scale-110 transition-transform">
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
                        className="px-3.5 py-1.5 md:px-4 md:py-2 rounded-xl text-[12px] font-bold uppercase tracking-wider text-white bg-[#137fec] hover:bg-blue-600 shadow-md shadow-[#137fec]/20 hover:shadow-lg hover:shadow-[#137fec]/30 transition-all duration-300 flex items-center gap-1.5 cursor-pointer"
                    >
                        <span className="material-symbols-outlined text-[17px]">
                            login
                        </span>
                        <span>{t('common.signIn', 'Sign In')}</span>
                    </Link>
                )}

                {/* Separator Line */}
                <div className="h-5 w-[1px] bg-slate-200 dark:bg-white/10 mx-0.5"></div>

                {/* Language Switcher Dropdown */}
                <div className="z-50">
                    <LanguageSwitcher />
                </div>
            </div>
        </header>
    );
};

export default PublicHeader;
