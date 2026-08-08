import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from './ThemeToggle';
import LanguageSwitcher from './LanguageSwitcher';
import { agencyService } from '../services/agencyService';
import { useTranslation } from 'react-i18next';
import ConfirmModal from './ConfirmModal';

const HeaderActions = () => {
    const { t } = useTranslation();
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isConfirmSignOutOpen, setIsConfirmSignOutOpen] = useState(false);
    const [agencyInfo, setAgencyInfo] = useState(null);
    const menuRef = useRef(null);

    useEffect(() => {
        if (!user) return;
        const controller = new AbortController();
        agencyService.getMe(controller.signal)
            .then(res => {
                if (res) setAgencyInfo(res);
            })
            .catch(err => {
                if (err?.name !== 'AbortError') {
                    console.error('Failed to fetch agency info:', err);
                }
            });
        return () => controller.abort();
    }, [user]);

    // Compute display name
    const userDisplayName = user?.name && user?.surname 
        ? `${user.name} ${user.surname}` 
        : user?.email || 'Travel Agent';

    // Handle clicking outside the profile menu to close it
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsMenuOpen(false);
            }
        };

        if (isMenuOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isMenuOpen]);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="flex items-center gap-2">
            <button className="p-2 relative text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                <span className="material-icons-round">notifications</span>
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <ThemeToggle />
            <div className="relative" ref={menuRef}>
                <button
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-all focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 outline-none select-none active:outline-none group cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-slate-800"
                    title={`${userDisplayName}${agencyInfo ? ` (${agencyInfo.agencyType || ''}: ${agencyInfo.name || ''})` : ''}`}
                >
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
                                    <p className="text-[11px] text-slate-500 font-normal truncate mt-0.5">{user?.email}</p>
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

            <ConfirmModal
                isOpen={isConfirmSignOutOpen}
                onClose={() => setIsConfirmSignOutOpen(false)}
                onConfirm={() => {
                    setIsConfirmSignOutOpen(false);
                    handleLogout();
                }}
                title={t('common.confirmSignOutTitle')}
                message={t('common.confirmSignOutMessage')}
                confirmText={t('common.signOut')}
                cancelText={t('common.cancel')}
                type="danger"
                icon="logout"
            />
        </div>
    );
};

export default HeaderActions;
