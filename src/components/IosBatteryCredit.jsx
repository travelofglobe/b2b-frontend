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

                    {/* Right Sidebar Drawer (Mirrors the left sidebar, top-16 to bottom-0) */}
                    <aside
                        ref={popupRef}
                        className={`fixed top-16 bottom-0 right-0 w-[350px] sm:w-[410px] bg-white dark:bg-[#202124] border-l border-[#dadce0] dark:border-slate-800 shadow-2xl z-[950] flex flex-col transition-transform duration-300 ease-in-out font-roboto overflow-hidden select-text ${
                            isOpen ? 'translate-x-0 pointer-events-auto' : 'translate-x-full pointer-events-none'
                        }`}
                    >
                        {/* ── Drawer Header (Google Account / Workspace Style) ── */}
                        <div className="px-5 py-4 border-b border-[#dadce0] dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-[#25272a] shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="size-10 rounded-full bg-[#e8f0fe] dark:bg-[#1a73e8]/20 text-[#1a73e8] dark:text-[#8ab4f8] flex items-center justify-center shrink-0">
                                    <span className="material-symbols-outlined text-[22px]">account_balance_wallet</span>
                                </div>
                                <div className="flex flex-col min-w-0">
                                    <div className="flex items-center gap-1.5">
                                        <h3 className="text-[15px] font-semibold text-[#202124] dark:text-white leading-tight truncate" title={agencyInfo?.name || myLimit?.agency?.name || 'Acente Kredi Asistanı'}>
                                            {agencyInfo?.name || myLimit?.agency?.name || 'Acente Kredisi'}
                                        </h3>
                                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-[#e8f0fe] text-[#1a73e8] dark:bg-[#1a73e8]/20 dark:text-[#8ab4f8] shrink-0">
                                            {agencyInfo?.agencyType || 'GSA'}
                                        </span>
                                    </div>
                                    <span className="text-[12px] text-[#70757a] dark:text-slate-400 font-normal mt-0.5">
                                        Finans & Limit Asistanı
                                    </span>
                                </div>
                            </div>

                            {/* Actions: Refresh & Close */}
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={handleRefresh}
                                    disabled={isRefreshing || isLoading}
                                    title="Bilgileri Yenile"
                                    className="size-8 rounded-full hover:bg-slate-200/70 dark:hover:bg-slate-700 text-[#5f6368] dark:text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
                                >
                                    <span className={`material-symbols-outlined text-[19px] ${(isRefreshing || isLoading) ? 'animate-spin text-[#1a73e8]' : ''}`}>
                                        refresh
                                    </span>
                                </button>
                                <button
                                    onClick={closeDrawer}
                                    title="Kapat"
                                    className="size-8 rounded-full hover:bg-slate-200/70 dark:hover:bg-slate-700 text-[#5f6368] dark:text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
                                >
                                    <span className="material-symbols-outlined text-[20px]">close</span>
                                </button>
                            </div>
                        </div>

                        {/* ── Drawer Scrollable Content ── */}
                        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
                            {/* Google Material 3 Financial Card */}
                            <div className="w-full bg-white dark:bg-[#303134]/40 rounded-2xl p-5 border border-[#dadce0] dark:border-[#3c4043] shadow-xs relative overflow-hidden">
                                {/* Card Top: Health Badge & Percentage */}
                                <div className="flex items-center justify-between gap-2 mb-3">
                                    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11.5px] font-medium ${
                                        batteryState === 'critical'
                                            ? 'bg-[#fce8e6] text-[#c5221f] dark:bg-[#d93025]/20 dark:text-[#f28b82]'
                                            : batteryState === 'low-power'
                                                ? 'bg-[#fef7e0] text-[#b06000] dark:bg-[#f9ab00]/20 dark:text-[#fdd663]'
                                                : 'bg-[#e6f4ea] text-[#137333] dark:bg-[#137333]/20 dark:text-[#81c995]'
                                    }`}>
                                        <span className={`size-2 rounded-full ${isLoading ? 'bg-slate-400 animate-pulse' : creditHealthBadge.dotColor} ${batteryState === 'charging' ? 'animate-pulse' : ''}`} />
                                        <span>{isLoading ? 'Limit Hesaplanıyor...' : creditHealthBadge.title}</span>
                                    </div>

                                    <span className="text-[12.5px] font-semibold text-[#202124] dark:text-slate-200 tabular-nums px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60">
                                        {isLoading ? '...' : `%${percentage}`}
                                    </span>
                                </div>

                                {/* Available Credit Big Stat */}
                                <div className="my-3">
                                    <span className="text-[11px] font-medium uppercase tracking-wider text-[#70757a] dark:text-slate-400 block mb-1">
                                        Kullanılabilir Bakiye
                                    </span>
                                    <div className="text-[32px] font-medium tracking-tight text-[#202124] dark:text-white leading-none">
                                        {isLoading ? (
                                            <span className="inline-block h-8 w-36 bg-slate-200 dark:bg-slate-700 rounded-md animate-pulse" />
                                        ) : (
                                            `${currencySymbol} ${formatNumber(availableLimit)}`
                                        )}
                                    </div>
                                </div>

                                {/* Google Style Linear Progress Bar */}
                                <div className="w-full bg-[#e8eaed] dark:bg-[#3c4043] rounded-full h-2.5 overflow-hidden my-4">
                                    <div
                                        className={`h-full rounded-full transition-all duration-500 ${isLoading ? 'w-1/3 bg-slate-300 dark:bg-slate-600 animate-pulse' :
                                            batteryState === 'charging' ? 'bg-[#1a73e8]' :
                                                batteryState === 'low-power' ? 'bg-[#f9ab00]' :
                                                    batteryState === 'critical' ? 'bg-[#d93025]' :
                                                        'bg-[#1a73e8]'
                                            }`}
                                        style={isLoading ? {} : { width: `${percentage}%` }}
                                    />
                                </div>

                                {/* Breakdown 2-Column Cards */}
                                <div className="grid grid-cols-2 gap-2.5 mb-3.5">
                                    <div className="bg-slate-50 dark:bg-[#202124] rounded-xl p-3 border border-[#dadce0]/70 dark:border-[#3c4043] flex flex-col">
                                        <span className="text-[10.5px] font-medium uppercase tracking-wider text-[#70757a] dark:text-slate-400 mb-0.5">
                                            Toplam Limit
                                        </span>
                                        <span className="text-[14.5px] font-semibold text-[#202124] dark:text-white tabular-nums">
                                            {isLoading ? (
                                                <span className="inline-block h-4 w-16 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                                            ) : (
                                                `${currencySymbol} ${formatNumber(creditLimit)}`
                                            )}
                                        </span>
                                    </div>

                                    <div className="bg-slate-50 dark:bg-[#202124] rounded-xl p-3 border border-[#dadce0]/70 dark:border-[#3c4043] flex flex-col">
                                        <span className="text-[10.5px] font-medium uppercase tracking-wider text-[#d93025] dark:text-[#f28b82] mb-0.5">
                                            Kullanılan
                                        </span>
                                        <span className="text-[14.5px] font-semibold text-[#d93025] dark:text-[#f28b82] tabular-nums">
                                            {isLoading ? (
                                                <span className="inline-block h-4 w-14 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                                            ) : (
                                                `${currencySymbol} ${formatNumber(usedLimit)}`
                                            )}
                                        </span>
                                    </div>
                                </div>

                                {/* Last Updated & Sync Indicator */}
                                <div className="pt-3 border-t border-[#dadce0] dark:border-[#3c4043] flex items-center justify-between text-[11.5px] text-[#70757a] dark:text-slate-400">
                                    <span className="truncate pr-2" title={myLimit?.updateDateTime ? `Sunucu Güncelleme Tarihi: ${lastUpdatedStr}` : ''}>
                                        {isLoading ? 'Veriler güncelleniyor...' : `Son Güncelleme: ${lastUpdatedStr}`}
                                    </span>
                                    <span className="text-[#137333] dark:text-[#81c995] font-medium flex items-center gap-1.5 shrink-0">
                                        <span className="material-symbols-outlined text-[15px]">{isLoading ? 'sync' : 'check_circle'}</span>
                                        <span>{isLoading ? 'Senkronize' : 'Güncel'}</span>
                                    </span>
                                </div>
                            </div>

                            {/* ── Status Insight Banner (Google Callout Style) ── */}
                            <div className={`p-3.5 rounded-2xl border flex items-start gap-2.5 ${
                                percentage > 35
                                    ? 'bg-[#e8f0fe] dark:bg-[#1a73e8]/10 border-[#d2e3fc] dark:border-[#1a73e8]/30'
                                    : percentage > 20
                                        ? 'bg-[#fef7e0] dark:bg-[#f9ab00]/10 border-[#feefc3] dark:border-[#f9ab00]/30'
                                        : 'bg-[#fce8e6] dark:bg-[#d93025]/10 border-[#fad2cf] dark:border-[#d93025]/30'
                            }`}>
                                <span className={`material-symbols-outlined text-[18px] shrink-0 mt-0.5 ${
                                    percentage > 35
                                        ? 'text-[#1a73e8] dark:text-[#8ab4f8]'
                                        : percentage > 20
                                            ? 'text-[#b06000] dark:text-[#fdd663]'
                                            : 'text-[#d93025] dark:text-[#f28b82]'
                                }`}>
                                    {percentage > 35 ? 'info' : percentage > 20 ? 'warning' : 'error'}
                                </span>
                                <div className="text-[12px] text-[#3c4043] dark:text-slate-300 leading-relaxed font-normal">
                                    {percentage > 35 ? (
                                        <span>Kredi limitiniz yeterli seviyededir. Otel ve uçak rezervasyonlarınızı kesintisiz tamamlayabilirsiniz.</span>
                                    ) : percentage > 20 ? (
                                        <span className="text-[#b06000] dark:text-[#fdd663] font-medium">Kredi limitiniz %35 seviyesine indi. Yeni rezervasyonlar için limit artışı talep edebilirsiniz.</span>
                                    ) : (
                                        <span className="text-[#c5221f] dark:text-[#f28b82] font-medium">Kredi limitiniz kritik düzeydedir. Lütfen finans veya limit yönetimi üzerinden limit artışı sağlayın.</span>
                                    )}
                                </div>
                            </div>

                            {/* ── Navigation Menu Section (Google Workspace Inset List) ── */}
                            <div className="space-y-1">
                                <span className="text-[11px] font-medium uppercase tracking-wider text-[#70757a] dark:text-slate-400 px-1">
                                    Hızlı İşlemler
                                </span>

                                <div className="rounded-2xl border border-[#dadce0] dark:border-[#3c4043] divide-y divide-[#dadce0] dark:divide-[#3c4043] overflow-hidden bg-white dark:bg-[#202124] shadow-2xs">
                                    {/* Link 1: Limit Yönetimi */}
                                    <button
                                        onClick={() => {
                                            closeDrawer();
                                            navigate('/finance/limits');
                                        }}
                                        className="w-full px-4 py-3 flex items-center justify-between hover:bg-[#f8f9fa] dark:hover:bg-[#303134] transition-colors text-left group cursor-pointer"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="size-8 rounded-lg bg-[#e8f0fe] dark:bg-[#1a73e8]/20 text-[#1a73e8] dark:text-[#8ab4f8] flex items-center justify-center shrink-0">
                                                <span className="material-symbols-outlined text-[18px]">tune</span>
                                            </div>
                                            <div>
                                                <h4 className="text-[13px] font-medium text-[#202124] dark:text-slate-200 leading-tight group-hover:text-[#1a73e8] dark:group-hover:text-[#8ab4f8] transition-colors">
                                                    Limit Yönetimi
                                                </h4>
                                                <p className="text-[11px] text-[#70757a] dark:text-slate-400 mt-0.5">
                                                    Limit ayarları ve artış talepleri
                                                </p>
                                            </div>
                                        </div>
                                        <span className="material-symbols-outlined text-[18px] text-[#70757a] group-hover:text-[#1a73e8] dark:group-hover:text-[#8ab4f8] transition-colors">
                                            chevron_right
                                        </span>
                                    </button>

                                    {/* Link 2: Finans Detayları */}
                                    <button
                                        onClick={() => {
                                            closeDrawer();
                                            navigate('/finance');
                                        }}
                                        className="w-full px-4 py-3 flex items-center justify-between hover:bg-[#f8f9fa] dark:hover:bg-[#303134] transition-colors text-left group cursor-pointer"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="size-8 rounded-lg bg-[#e6f4ea] dark:bg-[#137333]/20 text-[#137333] dark:text-[#81c995] flex items-center justify-center shrink-0">
                                                <span className="material-symbols-outlined text-[18px]">query_stats</span>
                                            </div>
                                            <div>
                                                <h4 className="text-[13px] font-medium text-[#202124] dark:text-slate-200 leading-tight group-hover:text-[#137333] dark:group-hover:text-[#81c995] transition-colors">
                                                    Finans Özeti & Cari
                                                </h4>
                                                <p className="text-[11px] text-[#70757a] dark:text-slate-400 mt-0.5">
                                                    Cari hareketler ve mutabakat
                                                </p>
                                            </div>
                                        </div>
                                        <span className="material-symbols-outlined text-[18px] text-[#70757a] group-hover:text-[#137333] dark:group-hover:text-[#81c995] transition-colors">
                                            chevron_right
                                        </span>
                                    </button>

                                    {/* Link 3: Hesap Hareketleri */}
                                    <button
                                        onClick={() => {
                                            closeDrawer();
                                            navigate('/finance/transactions/detail');
                                        }}
                                        className="w-full px-4 py-3 flex items-center justify-between hover:bg-[#f8f9fa] dark:hover:bg-[#303134] transition-colors text-left group cursor-pointer"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="size-8 rounded-lg bg-[#f3e8fd] dark:bg-[#9334e6]/20 text-[#9334e6] dark:text-[#c58af9] flex items-center justify-center shrink-0">
                                                <span className="material-symbols-outlined text-[18px]">receipt_long</span>
                                            </div>
                                            <div>
                                                <h4 className="text-[13px] font-medium text-[#202124] dark:text-slate-200 leading-tight group-hover:text-[#9334e6] dark:group-hover:text-[#c58af9] transition-colors">
                                                    İşlem & Fatura Detayı
                                                </h4>
                                                <p className="text-[11px] text-[#70757a] dark:text-slate-400 mt-0.5">
                                                    Geçmiş rezervasyon ödemeleri
                                                </p>
                                            </div>
                                        </div>
                                        <span className="material-symbols-outlined text-[18px] text-[#70757a] group-hover:text-[#9334e6] dark:group-hover:text-[#c58af9] transition-colors">
                                            chevron_right
                                        </span>
                                    </button>

                                    {/* Link 4: Acente Ofisim */}
                                    <button
                                        onClick={() => {
                                            closeDrawer();
                                            navigate('/my-office');
                                        }}
                                        className="w-full px-4 py-3 flex items-center justify-between hover:bg-[#f8f9fa] dark:hover:bg-[#303134] transition-colors text-left group cursor-pointer"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="size-8 rounded-lg bg-[#fef7e0] dark:bg-[#f9ab00]/20 text-[#b06000] dark:text-[#fdd663] flex items-center justify-center shrink-0">
                                                <span className="material-symbols-outlined text-[18px]">domain</span>
                                            </div>
                                            <div>
                                                <h4 className="text-[13px] font-medium text-[#202124] dark:text-slate-200 leading-tight group-hover:text-[#b06000] dark:group-hover:text-[#fdd663] transition-colors">
                                                    Acente Profilim
                                                </h4>
                                                <p className="text-[11px] text-[#70757a] dark:text-slate-400 mt-0.5">
                                                    Acente ayarları ve yetkiler
                                                </p>
                                            </div>
                                        </div>
                                        <span className="material-symbols-outlined text-[18px] text-[#70757a] group-hover:text-[#b06000] dark:group-hover:text-[#fdd663] transition-colors">
                                            chevron_right
                                        </span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* ── Drawer Sticky Footer Actions (Google Material 3 Pill Buttons) ── */}
                        <div className="p-4 border-t border-[#dadce0] dark:border-[#3c4043] bg-white/95 dark:bg-[#202124]/95 backdrop-blur-md grid grid-cols-2 gap-2.5 shrink-0">
                            <button
                                onClick={() => {
                                    closeDrawer();
                                    navigate('/finance/limits');
                                }}
                                className="w-full py-2.5 px-3 rounded-full bg-[#1a73e8] hover:bg-[#1765cc] active:bg-[#1557b0] text-white text-[13px] font-medium transition-all flex items-center justify-center gap-1.5 shadow-xs hover:shadow-md cursor-pointer select-none"
                            >
                                <span className="material-symbols-outlined text-[18px]">tune</span>
                                <span className="truncate">Limit Yönetimi</span>
                            </button>

                            <button
                                onClick={() => {
                                    closeDrawer();
                                    navigate('/finance');
                                }}
                                className="w-full py-2.5 px-3 rounded-full bg-white dark:bg-[#303134] hover:bg-[#f8f9fa] dark:hover:bg-[#3c4043] active:scale-[0.98] border border-[#dadce0] dark:border-[#5f6368] text-[#1a73e8] dark:text-[#8ab4f8] text-[13px] font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs select-none"
                            >
                                <span className="material-symbols-outlined text-[18px]">query_stats</span>
                                <span className="truncate">Finans Özeti</span>
                            </button>
                        </div>
                    </aside>
                </div>,
                document.body
            )}
        </div>
    );
};

export default IosBatteryCredit;
