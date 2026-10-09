import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, getCurrencySymbol } from '../context/AuthContext';
import ThemeToggle from './ThemeToggle';
import { agencyService } from '../services/agencyService';
import { useTranslation } from 'react-i18next';
import ConfirmModal from './ConfirmModal';

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

const HeaderActions = () => {
    const { t, i18n } = useTranslation();
    const currentLang = (i18n.language || 'en').split('-')[0].toLowerCase();
    const L = LABELS[currentLang] || LABELS.en;
    const { user, logout, myLimit, agencyCurrency, currencySymbolMap } = useAuth();
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
            <ThemeToggle />

            {/* ── Credit Limit Widget (Transparent & Dividers) ── */}
            {myLimit && (
                <>
                    <div className="h-5 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block mx-0.5" />
                    
                    <div className="hidden sm:flex items-center gap-2.5 px-1 py-0.5 select-none">
                        {/* Wallet Icon */}
                        <div className="size-6 rounded-md bg-blue-50 dark:bg-blue-950/40 text-[#1a73e8] dark:text-[#8ab4f8] flex items-center justify-center shrink-0">
                            <span className="material-symbols-outlined text-[15px]">account_balance_wallet</span>
                        </div>

                        {/* Credit */}
                        <div className="flex flex-col items-end">
                            <span className="text-[8.5px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 leading-none mb-0.5">
                                {t('finance.credit', 'Kredi')}
                            </span>
                            <span className="text-[11.5px] font-bold text-slate-800 dark:text-slate-100 tabular-nums leading-none">
                                {getCurrencySymbol(myLimit.agency?.currency || agencyCurrency, currencySymbolMap)}{' '}
                                {Number(myLimit.creditLimit ?? 0).toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                            </span>
                        </div>

                        {/* Divider */}
                        <div className="h-4.5 w-px bg-slate-200 dark:bg-slate-700" />

                        {/* Used */}
                        <div className="flex flex-col items-end">
                            <span className="text-[8.5px] font-bold uppercase tracking-wider text-rose-500 dark:text-rose-400 leading-none mb-0.5">
                                {t('finance.used', 'Kullanılan')}
                            </span>
                            <span className="text-[11.5px] font-bold text-rose-600 dark:text-rose-400 tabular-nums leading-none">
                                {getCurrencySymbol(myLimit.agency?.currency || agencyCurrency, currencySymbolMap)}{' '}
                                {Number(myLimit.usedLimit ?? 0).toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                            </span>
                        </div>

                        {/* Divider */}
                        <div className="h-4.5 w-px bg-slate-200 dark:bg-slate-700" />

                        {/* Available */}
                        <div className="flex flex-col items-end">
                            <span className="text-[8.5px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 leading-none mb-0.5">
                                {t('finance.available', 'Kullanılabilir')}
                            </span>
                            <span className="text-[11.5px] font-bold text-emerald-600 dark:text-emerald-400 tabular-nums leading-none">
                                {getCurrencySymbol(myLimit.agency?.currency || agencyCurrency, currencySymbolMap)}{' '}
                                {Number(myLimit.availableLimit ?? 0).toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                            </span>
                        </div>
                    </div>

                    <div className="h-5 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block mx-0.5" />
                </>
            )}

            <div className="relative" ref={menuRef}>
                <button
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="flex items-center justify-center w-8 h-8 rounded-full bg-[#1a73e8] hover:bg-[#1765cc] text-white text-sm font-medium hover:ring-[3px] hover:ring-[#d2e3fc] dark:hover:ring-[#1a73e8]/40 transition-all focus:outline-none select-none cursor-pointer shadow-xs"
                    title={`${userDisplayName}${agencyInfo ? ` (${agencyInfo.agencyType || ''}: ${agencyInfo.name || ''})` : ''}`}
                >
                    {user?.name?.[0]?.toUpperCase() || 'A'}
                </button>

                {isMenuOpen && (
                    <div className="absolute right-0 ltr:right-0 rtl:left-0 top-full mt-2.5 w-[340px] bg-white dark:bg-[#202124] rounded-lg border border-[#dadce0] dark:border-[#3c4043] shadow-[0_2px_6px_2px_rgba(60,64,67,0.15),0_1px_2px_0_rgba(60,64,67,0.3)] overflow-hidden z-[9999] animate-in fade-in slide-in-from-top-1 duration-150">
                        {/* Top Bar: User Email + Close */}
                        {/* Top Bar: User Email + Close */}
                        <div className="px-4 py-2.5 border-b border-[#dadce0] dark:border-[#3c4043] flex items-center justify-between font-roboto">
                            <span className="text-[12px] font-normal text-[#70757a] dark:text-slate-400 truncate pr-2" title={user?.email}>
                                {user?.email}
                            </span>
                            <button
                                onClick={() => setIsMenuOpen(false)}
                                className="size-6 rounded-full text-[#70757a] dark:text-slate-400 hover:bg-[#f1f3f4] dark:hover:bg-[#303134] flex items-center justify-center transition-colors cursor-pointer"
                            >
                                <span className="material-symbols-outlined text-[16px]">close</span>
                            </button>
                        </div>

                        {/* Central Profile Card */}
                        <div className="p-4 flex flex-col items-center text-center font-roboto">
                            <div className="relative mb-2">
                                <div className="size-16 rounded-full bg-[#1a73e8] text-white text-2xl font-normal flex items-center justify-center shadow-xs select-none">
                                    {user?.name?.[0]?.toUpperCase() || 'U'}
                                </div>
                            </div>
                            <h3 className="text-[16px] font-normal text-[#202124] dark:text-white leading-tight">
                                {userDisplayName}
                            </h3>
                            <p className="text-[13px] font-normal text-[#70757a] dark:text-slate-400 mt-0.5">
                                {user?.email}
                            </p>

                            {/* Google-style Action Link */}
                            <button
                                onClick={() => {
                                    setIsMenuOpen(false);
                                    navigate('/my-office');
                                }}
                                className="mt-3 px-4 py-1.5 rounded-lg border border-[#dadce0] dark:border-[#5f6368] text-[#1a73e8] dark:text-[#8ab4f8] hover:bg-[#f8fafd] dark:hover:bg-[#303134] text-[13px] font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
                            >
                                <span className="material-symbols-outlined text-[16px]">domain</span>
                                <span>{agencyInfo?.name || L.myOffice}</span>
                            </button>
                        </div>

                        {/* Information Details Card: Agency & Currency */}
                        <div className="mx-4 mb-4 border border-[#dadce0] dark:border-[#3c4043] rounded-lg overflow-hidden divide-y divide-[#dadce0] dark:divide-[#3c4043] font-roboto">
                            <div className="flex items-center justify-between px-3.5 py-2.5 bg-[#f8f9fa] dark:bg-[#303134]/30 text-[13px]">
                                <div className="flex items-center gap-2 text-[#70757a] dark:text-slate-400">
                                    <span className="material-symbols-outlined text-[18px]">business</span>
                                    <span className="font-normal">{L.agency}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <span className="px-1.5 py-0.5 rounded text-[10px] font-medium uppercase bg-[#e8f0fe] text-[#1a73e8] dark:bg-[#1a73e8]/20 dark:text-[#8ab4f8] leading-none">
                                        {agencyInfo?.agencyType || 'GSA'}
                                    </span>
                                    <span className="font-normal text-[#202124] dark:text-slate-200 truncate max-w-[130px]" title={agencyInfo?.name || user?.agencyName || 'England GSA'}>
                                        {agencyInfo?.name || user?.agencyName || 'England GSA'}
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-center justify-between px-3.5 py-2.5 bg-[#f8f9fa] dark:bg-[#303134]/30 text-[13px]">
                                <div className="flex items-center gap-2 text-[#70757a] dark:text-slate-400">
                                    <span className="material-symbols-outlined text-[18px]">payments</span>
                                    <span className="font-normal">{L.currency}</span>
                                </div>
                                <span className="font-normal text-[#202124] dark:text-white">
                                    {agencyInfo?.currency || 'GBP'}
                                </span>
                            </div>
                        </div>

                        {/* Sign Out Action */}
                        <div className="p-3 bg-[#f8f9fa] dark:bg-[#303134]/50 border-t border-[#dadce0] dark:border-[#3c4043] flex items-center justify-center font-roboto">
                            <button
                                onClick={() => {
                                    setIsMenuOpen(false);
                                    setIsConfirmSignOutOpen(true);
                                }}
                                className="flex items-center justify-center gap-2 w-full py-2 px-4 rounded-lg bg-white dark:bg-[#202124] border border-[#dadce0] dark:border-[#5f6368] text-[#3c4043] dark:text-slate-200 hover:bg-[#f1f3f4] dark:hover:bg-[#303134] text-[13px] font-medium transition-all shadow-xs active:scale-98 cursor-pointer"
                            >
                                <span className="material-symbols-outlined text-[18px] text-[#70757a] dark:text-slate-400">logout</span>
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
                agencyInfo={agencyInfo}
            />
        </div>
    );
};

export default HeaderActions;
