import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from './ThemeToggle';
import { agencyService } from '../services/agencyService';
import { useTranslation } from 'react-i18next';
import ConfirmModal from './ConfirmModal';
import IosBatteryCredit from './IosBatteryCredit';

const LABELS = {
    en: { myOffice: "My Office", agency: "Agency", currency: "Currency" },
    tr: { myOffice: "Acente Ofisim", agency: "Acente", currency: "Para Birimi" },
    ar: { myOffice: "مكتبي", agency: "الوكالة", currency: "العملة" },
    es: { myOffice: "Mi Oficina", agency: "Agencia", currency: "Moneda" },
    ru: { myOffice: "Мой Офис", agency: "Агентство", currency: "Валюта" },
    fr: { myOffice: "Mon Bureau", agency: "Agence", currency: "Devise" },
    zh: { myOffice: "我的办公室", agency: "代理商", currency: "货币" },
    ja: { myOffice: "マイオフィス", agency: "代理店", currency: "通貨" },
    fa: { myOffice: "دفتر من", agency: "آژانس", currency: "واحد پول" },
    it: { myOffice: "Il Mio Ufficio", agency: "Agenzia", currency: "Valuta" },
    el: { myOffice: "Το Γραφείο μου", agency: "Πρακτορείο", currency: "Νόμισμα" },
    pt: { myOffice: "Meu Escritório", agency: "Agência", currency: "Moeda" }
};

const HeaderActions = ({ activeDrawer: externalActiveDrawer, setActiveDrawer: externalSetActiveDrawer }) => {
    const { t, i18n } = useTranslation();
    const currentLang = (i18n.language || 'en').split('-')[0].toLowerCase();
    const L = LABELS[currentLang] || LABELS.en;
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [internalActiveDrawer, setInternalActiveDrawer] = useState(null);
    const activeDrawer = externalActiveDrawer !== undefined ? externalActiveDrawer : internalActiveDrawer;
    const setActiveDrawer = externalSetActiveDrawer || setInternalActiveDrawer;
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

    // Handle Escape key to close any active drawer
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                setActiveDrawer(null);
            }
        };

        if (activeDrawer) {
            document.addEventListener('keydown', handleKeyDown);
        }
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [activeDrawer]);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="flex items-center gap-2">
            <ThemeToggle />

            {/* ── Credit Limit iPhone Battery Widget ── */}
            <div className="h-5 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block mx-0.5" />
            <IosBatteryCredit
                agencyInfo={agencyInfo}
                isOpen={activeDrawer === 'credit'}
                onToggle={() => setActiveDrawer(prev => prev === 'credit' ? null : 'credit')}
                onClose={() => setActiveDrawer(null)}
            />
            <div className="h-5 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block mx-0.5" />

            <div className="relative">
                {/* User Avatar Button (Toggles User Profile Drawer) */}
                <button
                    onClick={() => setActiveDrawer(prev => prev === 'profile' ? null : 'profile')}
                    className={`flex items-center justify-center w-8 h-8 rounded-full bg-[#1a73e8] hover:bg-[#1765cc] text-white text-sm font-medium hover:ring-[3px] hover:ring-[#d2e3fc] dark:hover:ring-[#1a73e8]/40 transition-all focus:outline-none select-none cursor-pointer shadow-xs ${
                        activeDrawer === 'profile' ? 'ring-[3px] ring-[#1a73e8] ring-offset-2 dark:ring-offset-slate-900' : ''
                    }`}
                    title={`${userDisplayName}${agencyInfo ? ` (${agencyInfo.agencyType || ''}: ${agencyInfo.name || ''})` : ''}`}
                >
                    {user?.name?.[0]?.toUpperCase() || 'A'}
                </button>

                {/* ── User Profile Right Slide-over Sidebar Drawer ── */}
                {createPortal(
                    <div className="font-sans">
                        {/* Backdrop Overlay (Starts under header at top-16 like left sidebar) */}
                        <div
                            className={`fixed inset-0 top-16 z-[900] transition-opacity duration-300 ease-in-out ${
                                activeDrawer === 'profile' ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
                            }`}
                        >
                            <div
                                className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-xs"
                                onClick={() => setActiveDrawer(null)}
                            />
                        </div>

                        {/* Right Sidebar Drawer (Mirrors the left sidebar, top-16 to bottom-0) */}
                        <aside
                            ref={menuRef}
                            className={`fixed top-16 bottom-0 right-0 w-[340px] sm:w-[380px] bg-white dark:bg-[#202124] border-l border-[#dadce0] dark:border-slate-800 shadow-2xl z-[950] flex flex-col transition-transform duration-300 ease-in-out font-roboto overflow-hidden select-text ${
                                activeDrawer === 'profile' ? 'translate-x-0 pointer-events-auto' : 'translate-x-full pointer-events-none'
                            }`}
                        >
                            {/* Top Bar: Title + Email + Close */}
                            <div className="px-5 py-4 border-b border-[#dadce0] dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-[#25272a] shrink-0">
                                <div className="flex flex-col min-w-0">
                                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                                        Kullanıcı Profili
                                    </span>
                                    <span className="text-[13px] font-medium text-[#70757a] dark:text-slate-300 truncate max-w-[240px]" title={user?.email}>
                                        {user?.email}
                                    </span>
                                </div>
                                <button
                                    onClick={() => setActiveDrawer(null)}
                                    className="size-8 rounded-full hover:bg-slate-200/70 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
                                    title="Kapat"
                                >
                                    <span className="material-symbols-outlined text-[20px]">close</span>
                                </button>
                            </div>

                            {/* Central Scrollable Body */}
                            <div className="flex-1 overflow-y-auto p-5 space-y-5">
                                {/* Central Profile Card */}
                                <div className="flex flex-col items-center text-center">
                                    <div className="relative mb-3">
                                        <div className="size-20 rounded-full bg-[#1a73e8] text-white text-3xl font-medium flex items-center justify-center shadow-md select-none ring-4 ring-blue-50 dark:ring-blue-950/40">
                                            {user?.name?.[0]?.toUpperCase() || 'U'}
                                        </div>
                                    </div>
                                    <h3 className="text-[18px] font-semibold text-[#202124] dark:text-white leading-tight">
                                        {userDisplayName}
                                    </h3>
                                    <p className="text-[13px] text-[#70757a] dark:text-slate-400 mt-1">
                                        {user?.email}
                                    </p>

                                    {/* Action Link */}
                                    <button
                                        onClick={() => {
                                            setActiveDrawer(null);
                                            navigate('/my-office');
                                        }}
                                        className="mt-4 px-4 py-2 rounded-xl border border-[#dadce0] dark:border-[#5f6368] text-[#1a73e8] dark:text-[#8ab4f8] hover:bg-[#f8fafd] dark:hover:bg-[#303134] text-[13px] font-medium transition-colors flex items-center gap-2 cursor-pointer shadow-2xs"
                                    >
                                        <span className="material-symbols-outlined text-[18px]">domain</span>
                                        <span>{agencyInfo?.name || L.myOffice}</span>
                                    </button>
                                </div>

                                {/* Information Details Card: Agency & Currency */}
                                <div className="border border-[#dadce0] dark:border-[#3c4043] rounded-2xl overflow-hidden divide-y divide-[#dadce0] dark:divide-[#3c4043] bg-slate-50/50 dark:bg-[#303134]/20 shadow-2xs">
                                    <div className="flex items-center justify-between px-4 py-3 text-[13px]">
                                        <div className="flex items-center gap-2.5 text-[#70757a] dark:text-slate-400">
                                            <span className="material-symbols-outlined text-[19px]">business</span>
                                            <span className="font-medium">{L.agency}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-[#e8f0fe] text-[#1a73e8] dark:bg-[#1a73e8]/20 dark:text-[#8ab4f8] leading-none">
                                                {agencyInfo?.agencyType || 'GSA'}
                                            </span>
                                            <span className="font-semibold text-[#202124] dark:text-slate-200 truncate max-w-[140px]" title={agencyInfo?.name || user?.agencyName || 'England GSA'}>
                                                {agencyInfo?.name || user?.agencyName || 'England GSA'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between px-4 py-3 text-[13px]">
                                        <div className="flex items-center gap-2.5 text-[#70757a] dark:text-slate-400">
                                            <span className="material-symbols-outlined text-[19px]">payments</span>
                                            <span className="font-medium">{L.currency}</span>
                                        </div>
                                        <span className="font-bold text-[#202124] dark:text-white px-2 py-0.5 rounded bg-slate-200/50 dark:bg-slate-700/50">
                                            {agencyInfo?.currency || 'GBP'}
                                        </span>
                                    </div>
                                </div>

                                {/* Quick Shortcuts List */}
                                <div className="space-y-1">
                                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-1">
                                        Hesap Menüsü
                                    </span>
                                    <div className="rounded-2xl border border-[#dadce0] dark:border-[#3c4043] divide-y divide-[#dadce0] dark:divide-[#3c4043] overflow-hidden bg-white dark:bg-[#202124]">
                                        <button
                                            onClick={() => {
                                                setActiveDrawer(null);
                                                navigate('/my-office');
                                            }}
                                            className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors text-left group cursor-pointer"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="size-8 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-[#1a73e8] flex items-center justify-center shrink-0">
                                                    <span className="material-symbols-outlined text-[18px]">manage_accounts</span>
                                                </div>
                                                <span className="text-[13px] font-medium text-slate-800 dark:text-slate-200 group-hover:text-[#1a73e8] transition-colors">
                                                    Acente ve Profil Ayarları
                                                </span>
                                            </div>
                                            <span className="material-symbols-outlined text-[18px] text-slate-400 group-hover:text-[#1a73e8] transition-colors">
                                                chevron_right
                                            </span>
                                        </button>

                                        <button
                                            onClick={() => {
                                                setActiveDrawer(null);
                                                navigate('/finance');
                                            }}
                                            className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors text-left group cursor-pointer"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="size-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center shrink-0">
                                                    <span className="material-symbols-outlined text-[18px]">account_balance</span>
                                                </div>
                                                <span className="text-[13px] font-medium text-slate-800 dark:text-slate-200 group-hover:text-emerald-600 transition-colors">
                                                    Finans ve Bakiye Özeti
                                                </span>
                                            </div>
                                            <span className="material-symbols-outlined text-[18px] text-slate-400 group-hover:text-emerald-600 transition-colors">
                                                chevron_right
                                            </span>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Sign Out Action in Footer */}
                            <div className="p-4 bg-slate-50/70 dark:bg-[#25272a] border-t border-[#dadce0] dark:border-slate-800 flex items-center justify-center shrink-0">
                                <button
                                    onClick={() => {
                                        setActiveDrawer(null);
                                        setIsConfirmSignOutOpen(true);
                                    }}
                                    className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-white dark:bg-[#202124] border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-[13px] font-semibold transition-all shadow-xs active:scale-98 cursor-pointer"
                                >
                                    <span className="material-symbols-outlined text-[18px]">logout</span>
                                    <span>{t('common.signOut')}</span>
                                </button>
                            </div>
                        </aside>
                    </div>,
                    document.body
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
                agencyInfo={agencyInfo}
            />
        </div>
    );
};

export default HeaderActions;
