import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useAuth, getCurrencySymbol } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';

const CREDIT_LABELS = {
    en: "Credit",
    tr: "Kredi",
    ar: "الائتمان",
    es: "Crédito",
    ru: "Кредит",
    fr: "Crédit",
    zh: "授信",
    ja: "クレジット",
    fa: "اعتبار",
    it: "Credito",
    el: "Πίστωση",
    pt: "Crédito"
};

/**
 * IosBatteryCredit Component
 * Displays credit balance formatted as an authentic iOS battery indicator (iOS 16+ style).
 * Features:
 * - Clear identification as agency credit indicator with wallet icon and localized label.
 * - Color states: Green/Charging with ⚡ when full & unused, Yellow when Low Power (<=35%), Red when critical (<=20%), Black/White when normal.
 * - Dynamic fill level matching available credit percentage.
 * - Persistent rendering on page refresh (no pop-in delay) with smooth loading shimmer.
 * - High-transparency Apple Liquid Glass popover with ultra-sheer inner cards and real updateDateTime binding.
 */
const IosBatteryCredit = ({
    agencyInfo,
    isOpen: controlledIsOpen,
    onToggle: controlledOnToggle,
    onClose: controlledOnClose
}) => {
    const { t, i18n } = useTranslation();
    const currentLang = (i18n?.language || 'en').split('-')[0].toLowerCase();
    const creditLabel = CREDIT_LABELS[currentLang] || CREDIT_LABELS.en;
    const { myLimit, agencyCurrency, currencySymbolMap, refreshMyLimit } = useAuth();
    const navigate = useNavigate();
    const [internalIsOpen, setInternalIsOpen] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const popupRef = useRef(null);
    const buttonRef = useRef(null);

    const isControlled = controlledIsOpen !== undefined;
    const isOpen = isControlled ? controlledIsOpen : internalIsOpen;
    const toggleOpen = isControlled ? controlledOnToggle : () => setInternalIsOpen(prev => !prev);
    const closeDrawer = isControlled ? controlledOnClose : () => setInternalIsOpen(false);

    // Loading state while myLimit is being fetched on page load / refresh
    const isLoading = !myLimit;

    // Close on escape key
    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === 'Escape') {
                closeDrawer?.();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
        }
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen]);

    const creditLimit = Number(myLimit?.creditLimit ?? 0);
    const usedLimit = Number(myLimit?.usedLimit ?? 0);
    const availableLimit = Number(myLimit?.availableLimit ?? 0);
    const currency = myLimit?.agency?.currency || agencyCurrency || 'GBP';
    const currencySymbol = getCurrencySymbol(currency, currencySymbolMap);

    // Calculate percentage of available credit
    let percentage = 100;
    if (creditLimit > 0) {
        percentage = Math.max(0, Math.min(100, Math.round((availableLimit / creditLimit) * 100)));
    }

    // Is it fully charged and never used?
    const isFullyCharged = !isLoading && creditLimit > 0 && usedLimit <= 0.01 && availableLimit >= creditLimit;

    // Battery Color Rules:
    let batteryState = 'normal';
    if (isFullyCharged) {
        batteryState = 'charging';
    } else if (percentage <= 20) {
        batteryState = 'critical';
    } else if (percentage <= 35) {
        batteryState = 'low-power';
    }

    const formatNumber = (num) => {
        return Number(num || 0).toLocaleString('tr-TR', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        });
    };

    // Format updateDateTime from API (supports array [y,m,d,h,m,s] or ISO string)
    const formatDateTime = (dateVal) => {
        if (!dateVal) return null;
        try {
            let dateObj;
            if (Array.isArray(dateVal)) {
                const [y, m, d, hh = 0, mm = 0, ss = 0] = dateVal;
                dateObj = new Date(y, m - 1, d, hh, mm, ss);
            } else {
                dateObj = new Date(dateVal);
            }
            if (isNaN(dateObj.getTime())) return null;
            return dateObj.toLocaleString('tr-TR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch {
            return null;
        }
    };

    const lastUpdatedStr = formatDateTime(myLimit?.updateDateTime || myLimit?.createDateTime)
        || new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });

    const handleRefresh = async (e) => {
        e?.stopPropagation?.();
        if (isRefreshing || !refreshMyLimit) return;
        setIsRefreshing(true);
        try {
            await refreshMyLimit();
        } finally {
            setTimeout(() => setIsRefreshing(false), 600);
        }
    };

    // Color definitions
    const fillColors = {
        charging: '#34C759',    // Apple Green
        normal: '#34C759',      // Apple Green (iOS Healthy Level)
        'low-power': '#FFCC00', // Apple Yellow (Low Power Mode)
        critical: '#FF3B30'     // Apple Red (Low Battery)
    };

    const textColors = {
        charging: 'text-emerald-600 dark:text-emerald-400',
        normal: 'text-slate-800 dark:text-slate-100',
        'low-power': 'text-amber-600 dark:text-amber-400',
        critical: 'text-rose-600 dark:text-rose-400'
    };

    // Concept text based on credit health
    const creditHealthBadge = {
        charging: {
            title: 'Kredi Kapasitesi: %100',
            subtitle: 'Tam Dolu • Kullanıma Hazır',
            dotColor: 'bg-[#34C759]',
            icon: 'bolt'
        },
        normal: {
            title: `Kredi Sağlığı: %${percentage}`,
            subtitle: 'Güvenli ve Sağlıklı Seviye',
            dotColor: 'bg-[#34C759]',
            icon: 'verified_user'
        },
        'low-power': {
            title: `Kredi Uyarısı: %${percentage}`,
            subtitle: 'Limit Azalıyor (Düşük Güç)',
            dotColor: 'bg-[#FFCC00]',
            icon: 'warning'
        },
        critical: {
            title: `Kritik Limit: %${percentage}`,
            subtitle: 'Kredi Tükenmek Üzere',
            dotColor: 'bg-[#FF3B30]',
            icon: 'error'
        }
    }[batteryState];

    return (
        <div className="relative select-none">
            {/* ── Trigger Button: Ultra-Compact iOS Battery with Credit Micro-Badge & Stacked Label ── */}
            <button
                ref={buttonRef}
                onClick={toggleOpen}
                className={`flex items-center gap-2 px-2 py-1 rounded-xl transition-colors duration-150 cursor-pointer outline-none focus:outline-none select-none border-0 ${isOpen
                    ? 'bg-slate-200/80 dark:bg-slate-800 text-slate-900 dark:text-white'
                    : 'hover:bg-slate-100 dark:hover:bg-slate-800/60'
                    }`}
                title={isLoading ? 'Kredi bilgileri yükleniyor...' : `Kredi Limiti: %${percentage} (${currencySymbol} ${formatNumber(availableLimit)} kullanılabilir) - Detaylar için tıklayın`}
                aria-label="Kredi Durumu"
            >
                {/* iPhone Battery Icon with Micro Wallet Badge */}
                <div className="relative flex items-center text-slate-900 dark:text-white shrink-0">
                    <svg
                        className="w-[28px] h-[14px] shrink-0"
                        viewBox="0 0 28 14"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        {/* Battery Outer Frame */}
                        <rect
                            x="0.75"
                            y="0.75"
                            width="23.5"
                            height="12.5"
                            rx="4"
                            stroke="currentColor"
                            strokeWidth="1.5"
                        />
                        {/* Battery Positive Terminal (Nub on right) */}
                        <path
                            d="M25.5 4.75C26.19 4.75 26.75 5.31 26.75 6V8C26.75 8.69 26.19 9.25 25.5 9.25V4.75Z"
                            fill="currentColor"
                        />
                        {/* Battery Inner Fill Level (with subtle shimmer when loading) */}
                        {isLoading ? (
                            <rect
                                x="2.5"
                                y="2.5"
                                width="12"
                                height="9"
                                rx="2"
                                fill="currentColor"
                                className="opacity-30 animate-pulse"
                            />
                        ) : percentage > 0 ? (
                            <rect
                                x="2.5"
                                y="2.5"
                                width={Math.max(1.5, ((percentage / 100) * 20))}
                                height="9"
                                rx="2"
                                fill={fillColors[batteryState]}
                                className="transition-all duration-300 ease-out"
                            />
                        ) : null}

                        {/* Charging Lightning Bolt Icon inside Battery when fully charged & unused */}
                        {isFullyCharged && (
                            <path
                                d="M13 2.5L8.5 7.5H12L11 11.5L16 6.5H12.5L13 2.5Z"
                                fill="white"
                                className="drop-shadow-xs"
                            />
                        )}
                    </svg>
                </div>

                {/* Compact Stacked Percentage & Credit Label (Zero horizontal bloating) */}
                <div className="flex flex-col items-start leading-none shrink-0">
                    {isLoading ? (
                        <span className="text-[11px] font-bold tracking-tight tabular-nums text-slate-400 dark:text-slate-500 animate-pulse">
                            ...
                        </span>
                    ) : (
                        <span className={`text-[11px] font-bold tracking-tight tabular-nums ${textColors[batteryState]}`}>
                            %{percentage}
                        </span>
                    )}
                    <span className="text-[7.5px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-400 mt-0.5">
                        {creditLabel}
                    </span>
                </div>
            </button>

            {/* ── Right Slide-over Sidebar Drawer (Slides in underneath header like left sidebar) ── */}
            {createPortal(
                <div className="font-sans">
                    {/* Backdrop Overlay (Starts under header at top-16 like left sidebar) */}
                    <div
                        className={`fixed inset-0 top-16 z-[900] transition-opacity duration-300 ease-in-out ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
                            }`}
                    >
                        <div
                            className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-xs"
                            onClick={closeDrawer}
                        />
                    </div>

                    {/* Right Sidebar Drawer - Clean, Minimalist & Focused */}
                    <aside
                        ref={popupRef}
                        className={`fixed top-16 bottom-0 right-0 w-[340px] sm:w-[380px] bg-white dark:bg-[#1e2023] border-l border-slate-200/80 dark:border-slate-800 shadow-xl z-[950] flex flex-col transition-transform duration-300 ease-in-out font-roboto overflow-hidden select-text ${
                            isOpen ? 'translate-x-0 pointer-events-auto' : 'translate-x-full pointer-events-none'
                        }`}
                    >
                        {/* ── Minimalist Header ── */}
                        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
                            <div>
                                <h3 className="text-[15px] font-semibold text-slate-900 dark:text-white leading-tight">
                                    Kredi & Limit
                                </h3>
                                <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5 truncate max-w-[220px]">
                                    {agencyInfo?.name || myLimit?.agency?.name || 'Acente Hesabı'}
                                </p>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                                <button
                                    onClick={handleRefresh}
                                    disabled={isRefreshing || isLoading}
                                    title="Yenile"
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                                >
                                    <span className={`material-symbols-outlined text-[19px] ${(isRefreshing || isLoading) ? 'animate-spin text-blue-600' : ''}`}>
                                        refresh
                                    </span>
                                </button>
                                <button
                                    onClick={closeDrawer}
                                    title="Kapat"
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                                >
                                    <span className="material-symbols-outlined text-[20px]">close</span>
                                </button>
                            </div>
                        </div>

                        {/* ── Content (Clean & Breathable) ── */}
                        <div className="flex-1 px-6 py-6 flex flex-col justify-between overflow-y-auto space-y-6">
                            <div className="space-y-6">
                                {/* 1. Main Balance Highlight */}
                                <div>
                                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-1">
                                        Kullanılabilir Limit
                                    </span>
                                    <div className="text-[34px] font-bold tracking-tight text-slate-900 dark:text-white tabular-nums leading-none">
                                        {isLoading ? (
                                            <span className="inline-block h-8 w-40 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
                                        ) : (
                                            `${currencySymbol} ${formatNumber(availableLimit)}`
                                        )}
                                    </div>

                                    {/* Minimalist Progress Line */}
                                    <div className="mt-3.5 space-y-1.5">
                                        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all duration-300 ${
                                                    isLoading ? 'w-1/3 bg-slate-300 dark:bg-slate-700 animate-pulse' :
                                                    batteryState === 'critical' ? 'bg-rose-500' :
                                                    batteryState === 'low-power' ? 'bg-amber-500' :
                                                    'bg-blue-600'
                                                }`}
                                                style={isLoading ? {} : { width: `${percentage}%` }}
                                            />
                                        </div>
                                        <div className="flex justify-between items-center text-[11px] text-slate-400 font-medium">
                                            <span>%{percentage} kullanılabilir</span>
                                            <span>Güncelleme: {lastUpdatedStr}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* 2. Financial Summary (Key-Value rows, zero nested clutter) */}
                                <div className="border-t border-slate-100 dark:border-slate-800 pt-5 space-y-3">
                                    <div className="flex items-center justify-between text-[13px]">
                                        <span className="text-slate-500 dark:text-slate-400">Toplam Limit</span>
                                        <span className="font-semibold text-slate-800 dark:text-slate-200 tabular-nums">
                                            {isLoading ? '...' : `${currencySymbol} ${formatNumber(creditLimit)}`}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between text-[13px]">
                                        <span className="text-slate-500 dark:text-slate-400">Kullanılan Tutar</span>
                                        <span className={`font-semibold tabular-nums ${usedLimit > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-800 dark:text-slate-200'}`}>
                                            {isLoading ? '...' : `${currencySymbol} ${formatNumber(usedLimit)}`}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between text-[13px]">
                                        <span className="text-slate-500 dark:text-slate-400">Para Birimi</span>
                                        <span className="font-medium text-slate-700 dark:text-slate-300">
                                            {currency}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between text-[13px]">
                                        <span className="text-slate-500 dark:text-slate-400">Hesap Türü</span>
                                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                            {agencyInfo?.agencyType || 'GSA'}
                                        </span>
                                    </div>
                                </div>

                                {/* 3. Quick Navigation Links */}
                                <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-1">
                                    <button
                                        onClick={() => {
                                            closeDrawer();
                                            navigate('/finance/limits');
                                        }}
                                        className="w-full py-2.5 px-3 rounded-xl flex items-center justify-between text-[13px] text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors cursor-pointer group"
                                    >
                                        <div className="flex items-center gap-2.5">
                                            <span className="material-symbols-outlined text-[18px] text-slate-400 group-hover:text-blue-600 transition-colors">
                                                tune
                                            </span>
                                            <span>Limit Yönetimi</span>
                                        </div>
                                        <span className="material-symbols-outlined text-[16px] text-slate-400 group-hover:translate-x-0.5 transition-transform">
                                            chevron_right
                                        </span>
                                    </button>

                                    <button
                                        onClick={() => {
                                            closeDrawer();
                                            navigate('/finance');
                                        }}
                                        className="w-full py-2.5 px-3 rounded-xl flex items-center justify-between text-[13px] text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors cursor-pointer group"
                                    >
                                        <div className="flex items-center gap-2.5">
                                            <span className="material-symbols-outlined text-[18px] text-slate-400 group-hover:text-blue-600 transition-colors">
                                                query_stats
                                            </span>
                                            <span>Finans & Cari Hareketler</span>
                                        </div>
                                        <span className="material-symbols-outlined text-[16px] text-slate-400 group-hover:translate-x-0.5 transition-transform">
                                            chevron_right
                                        </span>
                                    </button>

                                    <button
                                        onClick={() => {
                                            closeDrawer();
                                            navigate('/finance/transactions/detail');
                                        }}
                                        className="w-full py-2.5 px-3 rounded-xl flex items-center justify-between text-[13px] text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors cursor-pointer group"
                                    >
                                        <div className="flex items-center gap-2.5">
                                            <span className="material-symbols-outlined text-[18px] text-slate-400 group-hover:text-blue-600 transition-colors">
                                                receipt_long
                                            </span>
                                            <span>Fatura ve İşlem Detayları</span>
                                        </div>
                                        <span className="material-symbols-outlined text-[16px] text-slate-400 group-hover:translate-x-0.5 transition-transform">
                                            chevron_right
                                        </span>
                                    </button>
                                </div>
                            </div>

                            {/* 4. Bottom Agency Office Shortcut & Status Footer */}
                            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
                                <button
                                    onClick={() => {
                                        closeDrawer();
                                        navigate('/my-office');
                                    }}
                                    className="w-full p-3 rounded-xl bg-slate-50 hover:bg-slate-100/80 dark:bg-slate-800/40 dark:hover:bg-slate-800/80 border border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-left transition-colors cursor-pointer group"
                                >
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <div className="size-8 rounded-lg bg-white dark:bg-slate-700/60 shadow-2xs border border-slate-200/60 dark:border-slate-700/40 flex items-center justify-center shrink-0 text-slate-500 dark:text-slate-300 group-hover:text-blue-600 transition-colors">
                                            <span className="material-symbols-outlined text-[17px]">domain</span>
                                        </div>
                                        <div className="min-w-0">
                                            <div className="text-[12px] font-medium text-slate-800 dark:text-slate-200 truncate group-hover:text-blue-600 transition-colors">
                                                Acente Ofisim
                                            </div>
                                            <div className="text-[11px] text-slate-400 dark:text-slate-500 truncate">
                                                Firma bilgileri ve yetkiler
                                            </div>
                                        </div>
                                    </div>
                                    <span className="material-symbols-outlined text-[16px] text-slate-400 group-hover:translate-x-0.5 group-hover:text-blue-600 transition-all">
                                        arrow_forward
                                    </span>
                                </button>

                                <div className="flex items-center justify-between px-1 text-[11px] text-slate-400 dark:text-slate-500">
                                    <span className="flex items-center gap-1.5">
                                        <span className="size-1.5 rounded-full bg-emerald-500 shrink-0" />
                                        <span>Güvenli B2B Kredi Hattı</span>
                                    </span>
                                    <span>Anlık Senkron</span>
                                </div>
                            </div>
                        </div>
                    </aside>
                </div>,
                document.body
            )}
        </div>
    );
};

export default IosBatteryCredit;
