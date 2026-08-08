import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';
import { useAuth } from '../context/AuthContext';
import HeaderSearch from './HeaderSearch';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './LanguageSwitcher';
import { agencyService } from '../services/agencyService';
import ConfirmModal from './ConfirmModal';

const Header = () => {
    const { t } = useTranslation();
    const { user, logout } = useAuth();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isConfirmSignOutOpen, setIsConfirmSignOutOpen] = useState(false);
    const [agencyInfo, setAgencyInfo] = useState(null);
    const menuRef = useRef(null);

    React.useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsMenuOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    React.useEffect(() => {
        if (user) {
            const controller = new AbortController();
            agencyService.getMe(controller.signal)
                .then(res => {
                    if (res) {
                        setAgencyInfo(res);
                    }
                })
                .catch(err => {
                    if (err?.name !== 'AbortError') {
                        console.error('Failed to fetch agency info for header:', err);
                    }
                });
            return () => controller.abort();
        } else {
            setAgencyInfo(null);
        }
    }, [user]);

    const userDisplayName = user?.name && user?.surname
        ? `${user.name} ${user.surname}`
        : user?.email || 'User';

    return (
        <header className="sticky top-0 z-[1100] w-full border-b border-solid border-white/20 dark:border-slate-800/50 bg-white/30 dark:bg-slate-900/40 backdrop-blur-xl px-4 py-2.5 shadow-sm shadow-slate-200/5 dark:shadow-none">
            <div className="max-w-[1440px] mx-auto flex items-center justify-between gap-4">
                <div className="flex items-center gap-6 flex-grow">
                    <Link to="/" className="w-[224px] flex-shrink-0 flex items-center gap-3 ltr:border-r rtl:border-l border-slate-200/50 dark:border-slate-800/50 ltr:pr-4 rtl:pl-4 group">
                        <div className="size-9 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/20 transition-all duration-500 group-hover:rotate-[15deg] group-hover:scale-105">
                            <span className="material-symbols-outlined text-xl fill-1">travel</span>
                        </div>
                        <div className="flex flex-col">
                            <h2 className="text-slate-900 dark:text-white text-[13px] font-bold leading-none tracking-tighter uppercase whitespace-nowrap">
                                Travel <span className="text-primary">of</span> Globe
                            </h2>
                            <div className="flex items-center gap-1.5 mt-1">
                                <div className="h-[1px] w-2 bg-primary/40"></div>
                                <p className="text-[7px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em] whitespace-nowrap leading-none">Global B2B Solutions</p>
                            </div>
                        </div>
                    </Link>
                    {/* Search Bar in Header */}
                    <HeaderSearch />
                </div>
                <div className="flex items-center gap-2 lg:gap-3 flex-shrink-0">
                    <div className="flex items-center gap-2 ltr:border-l rtl:border-r border-slate-200 dark:border-slate-700 ltr:pl-3 rtl:pr-3">
                        <ThemeToggle />
                        {!user ? (
                            <Link to="/login" className="text-slate-900 dark:text-white text-sm font-semibold px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">{t('common.signIn')}</Link>
                        ) : (
                            <div className="relative" ref={menuRef}>
                                <button
                                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                                    className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-all focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 outline-none select-none active:outline-none group cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-slate-800"
                                    title={`${userDisplayName}${agencyInfo ? ` (${agencyInfo.agencyType || ''}: ${agencyInfo.name || ''})` : ''}`}
                                >
                                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary dark:bg-primary/20 dark:text-blue-300 font-semibold text-xs flex items-center justify-center shrink-0 border border-primary/20">
                                        {user?.name?.[0]?.toUpperCase() || 'U'}
                                    </div>
                                    <div className="flex flex-col text-left justify-center leading-none max-w-[130px] lg:max-w-[160px]">
                                        <span className="font-semibold text-xs text-slate-800 dark:text-slate-100 truncate leading-tight">
                                            {userDisplayName}
                                        </span>
                                        <span className="text-[10px] font-normal text-slate-400 dark:text-slate-400 truncate leading-none mt-0.5" title={agencyInfo?.name || 'England GSA'}>
                                            {agencyInfo?.name || user?.agencyName || 'England GSA'}
                                        </span>
                                    </div>
                                    <span className={`material-symbols-outlined text-slate-400 text-sm transition-transform duration-200 ${isMenuOpen ? 'rotate-180 text-primary' : ''}`}>
                                        expand_more
                                    </span>
                                </button>

                                {isMenuOpen && (
                                    <div className="absolute right-0 ltr:right-0 rtl:left-0 top-full mt-2.5 w-[330px] bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-2xl overflow-hidden z-[9999] animate-in fade-in zoom-in-95 duration-150">
                                        {/* Header Info Card */}
                                        <div className="p-4 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/30">
                                            <div className="flex items-center gap-3 mb-3">
                                                <div className="w-10 h-10 rounded-full bg-primary text-white font-semibold text-sm flex items-center justify-center shrink-0 shadow-md shadow-primary/20">
                                                    {user?.name?.[0]?.toUpperCase() || 'U'}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">{t('common.myAccount')}</p>
                                                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate" title={userDisplayName}>{userDisplayName}</p>
                                                    <p className="text-[11px] text-slate-500 font-normal truncate mt-0.5">{user.email}</p>
                                                </div>
                                            </div>

                                            <div className="pt-3 border-t border-slate-200/50 dark:border-slate-700/50 space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[9.5px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">AGENCY</span>
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="px-1.5 py-0.5 rounded text-[9.5px] font-semibold uppercase tracking-wider bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200/50 dark:border-blue-800/40 leading-none">
                                                            {agencyInfo?.agencyType || 'GSA'}
                                                        </span>
                                                        <span className="text-xs font-medium text-slate-700 dark:text-slate-200 truncate max-w-[150px]">
                                                            {agencyInfo?.name || user?.agencyName || 'England GSA'}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-between">
                                                    <span className="text-[9.5px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">CURRENCY</span>
                                                    <span className="px-2 py-0.5 rounded-md text-[10.5px] font-semibold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200/70 dark:border-slate-700/70 leading-none">
                                                        {agencyInfo?.currency || 'GBP'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Language Selection inside Menu */}
                                        <LanguageSwitcher mode="menu" />

                                        {/* Sign Out Action */}
                                        <div className="p-2">
                                            <button
                                                onClick={() => {
                                                    setIsMenuOpen(false);
                                                    setIsConfirmSignOutOpen(true);
                                                }}
                                                className="w-full ltr:text-left rtl:text-right px-3 py-2 text-xs font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl flex items-center gap-2.5 transition-colors cursor-pointer"
                                            >
                                                <div className="w-7 h-7 rounded-lg bg-red-50 dark:bg-red-950/30 flex items-center justify-center text-red-500 shrink-0">
                                                    <span className="material-symbols-outlined text-[16px]">logout</span>
                                                </div>
                                                <span>{t('common.signOut')}</span>
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <ConfirmModal
                isOpen={isConfirmSignOutOpen}
                onClose={() => setIsConfirmSignOutOpen(false)}
                onConfirm={() => {
                    setIsConfirmSignOutOpen(false);
                    logout();
                }}
                title={t('common.confirmSignOutTitle')}
                message={t('common.confirmSignOutMessage')}
                confirmText={t('common.signOut')}
                cancelText={t('common.cancel')}
                type="danger"
                icon="logout"
            />
        </header>
    );
};

export default Header;
