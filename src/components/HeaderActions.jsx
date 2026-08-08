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
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-all focus:outline-none group cursor-pointer"
                    title={`${userDisplayName}${agencyInfo ? ` (${agencyInfo.agencyType || ''}: ${agencyInfo.name || ''})` : ''}`}
                >
                    <div className="flex flex-col text-left justify-center leading-none max-w-[120px] lg:max-w-[150px]">
                        <span className="font-bold text-xs lg:text-sm text-slate-900 dark:text-white truncate leading-tight">
                            {userDisplayName}
                        </span>
                        <span className="text-[10.5px] font-semibold text-slate-400 dark:text-slate-500 truncate leading-none mt-0.5" title={agencyInfo?.name || 'England GSA'}>
                            {agencyInfo?.name || user?.agencyName || 'England GSA'}
                        </span>
                    </div>
                    <span className="material-symbols-outlined text-slate-500 dark:text-slate-400 text-[16px]">expand_more</span>
                </button>

                {isMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-[340px] bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden z-[9999] animate-in fade-in slide-in-from-top-2">
                        <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">MY ACCOUNT</p>
                            <p className="text-sm font-bold text-slate-900 dark:text-white truncate" title={userDisplayName}>{userDisplayName}</p>
                            <p className="text-xs text-slate-500 break-words font-medium mt-0.5">{user?.email}</p>

                            <div className="mt-3 pt-3 border-t border-slate-200/60 dark:border-slate-700/60 space-y-2.5">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">AGENCY</span>
                                    <div className="flex items-center gap-1.5">
                                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/50 leading-none">
                                            {agencyInfo?.agencyType || 'GSA'}
                                        </span>
                                        <span className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[160px]">
                                            {agencyInfo?.name || user?.agencyName || 'England GSA'}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">CURRENCY</span>
                                    <span className="px-2 py-0.5 rounded-md text-xs font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 leading-none">
                                        {agencyInfo?.currency || 'GBP'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Language Selection inside Menu */}
                        <LanguageSwitcher mode="menu" />

                        <div className="p-2 space-y-1">
                            <button
                                onClick={() => {
                                    setIsMenuOpen(false);
                                    setIsConfirmSignOutOpen(true);
                                }}
                                className="w-full text-left px-3 py-2.5 text-sm font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg flex items-center gap-3 transition-colors cursor-pointer"
                            >
                                <div className="w-8 h-8 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center text-red-500">
                                    <span className="material-symbols-outlined text-[18px]">logout</span>
                                </div>
                                {t('common.signOut')}
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
