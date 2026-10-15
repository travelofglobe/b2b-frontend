import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, getCurrencySymbol } from '../context/AuthContext';

/**
 * IosBatteryCredit Component
 * Displays credit balance formatted as an authentic iOS battery indicator (iOS 16+ style).
 * Features:
 * - Color states: Green/Charging with ⚡ when full & unused, Yellow when Low Power (<=35%), Red when critical (<=20%), Black/White when normal.
 * - Dynamic fill level matching available credit percentage.
 * - Persistent rendering on page refresh (no pop-in delay) with smooth loading shimmer.
 * - High-transparency Apple Liquid Glass popover with ultra-sheer inner cards and real updateDateTime binding.
 */
const IosBatteryCredit = ({ agencyInfo }) => {
    const { myLimit, agencyCurrency, currencySymbolMap, refreshMyLimit } = useAuth();
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const popupRef = useRef(null);
    const buttonRef = useRef(null);

    // Loading state while myLimit is being fetched on page load / refresh
    const isLoading = !myLimit;

    // Close on click outside or escape key
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                popupRef.current && 
                !popupRef.current.contains(event.target) &&
                buttonRef.current &&
                !buttonRef.current.contains(event.target)
            ) {
                setIsOpen(false);
            }
        };

        const handleKeyDown = (event) => {
            if (event.key === 'Escape') {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('keydown', handleKeyDown);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
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
        normal: 'currentColor', // Slate-900 / White
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
            {/* ── Trigger Button: iOS Battery & Percentage (Always rendered immediately on page refresh) ── */}
            <button
                ref={buttonRef}
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-1.5 px-2 py-1 rounded-full transition-colors duration-150 cursor-pointer outline-none focus:outline-none select-none border-0 ${
                    isOpen 
                        ? 'bg-slate-200/70 dark:bg-slate-800 text-slate-900 dark:text-white' 
                        : 'hover:bg-slate-100 dark:hover:bg-slate-800/60'
                }`}
                title={isLoading ? 'Kredi bilgileri yükleniyor...' : `Kredi Durumu: %${percentage} (${currencySymbol} ${formatNumber(availableLimit)} kullanılabilir) - Detaylar için tıklayın`}
                aria-label="Kredi Durumu"
            >
                {/* iPhone Battery Icon */}
                <div className="flex items-center text-slate-900 dark:text-white">
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

                {/* Percentage Text or Loading indicator */}
                {isLoading ? (
                    <span className="text-[12px] font-bold tracking-tight tabular-nums leading-none text-slate-400 dark:text-slate-500 animate-pulse">
                        ...
                    </span>
                ) : (
                    <span className={`text-[12px] font-bold tracking-tight tabular-nums leading-none ${textColors[batteryState]}`}>
                        {percentage}%
                    </span>
                )}

                {/* Charging Bolt indicator beside text if fully charged */}
                {isFullyCharged && (
                    <span className="material-symbols-outlined text-[13px] text-emerald-500 leading-none -ml-1 animate-pulse">
                        bolt
                    </span>
                )}
            </button>

            {/* ── Apple iOS Ultra-Translucent Frosted Glass Popover ── */}
            {isOpen && (
                <div 
                    ref={popupRef}
                    className="absolute right-0 top-full mt-2 w-[335px] sm:w-[365px] bg-white/15 dark:bg-black/30 backdrop-blur-xl saturate-180 rounded-[26px] border border-white/60 dark:border-white/15 shadow-[0_25px_60px_-10px_rgba(0,0,0,0.16),inset_0_1px_2px_rgba(255,255,255,0.8)] dark:shadow-[0_25px_60px_-10px_rgba(0,0,0,0.6),inset_0_1px_2px_rgba(255,255,255,0.15)] overflow-hidden z-[9999] animate-in fade-in zoom-in-95 duration-150 font-sans"
                >
                    {/* ── Header: Agency Info & Actions ── */}
                    <div className="px-4 py-3 border-b border-black/[0.04] dark:border-white/[0.08] flex items-center justify-between bg-white/10 dark:bg-white/[0.02] backdrop-blur-md">
                        <div className="flex items-center gap-2.5">
                            {/* Apple Wallet Icon Badge - Frosted Glass */}
                            <div className="size-9 rounded-xl bg-white/40 dark:bg-white/10 text-slate-800 dark:text-slate-100 border border-white/70 dark:border-white/15 backdrop-blur-md flex items-center justify-center shadow-2xs shrink-0">
                                <span className="material-symbols-outlined text-[19px]">account_balance_wallet</span>
                            </div>
                            <div className="flex flex-col">
                                <h4 className="text-[13.5px] font-semibold text-slate-900 dark:text-white leading-tight truncate max-w-[175px]" title={agencyInfo?.name || myLimit?.agency?.name || 'Acente Kredi Asistanı'}>
                                    {agencyInfo?.name || myLimit?.agency?.name || 'Acente Kredi Asistanı'}
                                </h4>
                                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                                    Finans & Limit Özeti
                                </span>
                            </div>
                        </div>

                        {/* Action Buttons: Refresh & Close (Frosted Glass Pills) */}
                        <div className="flex items-center gap-1.5">
                            <button
                                onClick={handleRefresh}
                                disabled={isRefreshing || isLoading}
                                title="Limit Bilgilerini Yenile"
                                className="size-7.5 rounded-full bg-white/35 hover:bg-white/60 dark:bg-white/10 dark:hover:bg-white/15 border border-white/60 dark:border-white/10 text-slate-700 dark:text-slate-300 backdrop-blur-md flex items-center justify-center transition-all active:scale-95 cursor-pointer shadow-2xs"
                            >
                                <span className={`material-symbols-outlined text-[15px] ${(isRefreshing || isLoading) ? 'animate-spin text-slate-900 dark:text-white' : ''}`}>
                                    refresh
                                </span>
                            </button>
                            <button
                                onClick={() => setIsOpen(false)}
                                title="Kapat"
                                className="size-7.5 rounded-full bg-white/35 hover:bg-white/60 dark:bg-white/10 dark:hover:bg-white/15 border border-white/60 dark:border-white/10 text-slate-700 dark:text-slate-300 backdrop-blur-md flex items-center justify-center transition-all active:scale-95 cursor-pointer shadow-2xs"
                            >
                                <span className="material-symbols-outlined text-[15px]">close</span>
                            </button>
                        </div>
                    </div>

                    {/* ── Content Body: Multi-layered Ultra-Sheer Glass ── */}
                    <div className="p-3.5 flex flex-col gap-3">
                        {/* Apple Ultra-Sheer Glass Card (Pure Glass) */}
                        <div className="w-full bg-white/15 dark:bg-white/[0.04] backdrop-blur-lg rounded-2xl p-4 border border-white/60 dark:border-white/[0.08] shadow-[0_8px_30px_rgba(0,0,0,0.02),inset_0_1px_1px_rgba(255,255,255,0.7)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.2),inset_0_1px_1px_rgba(255,255,255,0.1)] relative overflow-hidden">
                            
                            {/* Card Top: Health Badge & Percentage */}
                            <div className="flex items-center justify-between gap-2">
                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/30 dark:bg-white/10 backdrop-blur-md text-[11px] font-semibold text-slate-700 dark:text-slate-200 border border-white/50 dark:border-white/10 shadow-2xs">
                                    <span className={`size-2 rounded-full ${isLoading ? 'bg-slate-400 animate-pulse' : creditHealthBadge.dotColor} ${batteryState === 'charging' ? 'animate-pulse' : ''}`} />
                                    <span>{isLoading ? 'Limit Hesaplanıyor...' : creditHealthBadge.title}</span>
                                </div>

                                <span className="text-[12px] font-bold text-slate-800 dark:text-slate-200 tabular-nums">
                                    {isLoading ? '...' : `%${percentage}`}
                                </span>
                            </div>

                            {/* Available Credit Big Stat */}
                            <div className="mt-3.5 mb-1">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-0.5">
                                    Kullanılabilir Bakiye
                                </span>
                                <div className="text-[28px] font-bold tracking-tight text-slate-900 dark:text-white leading-none">
                                    {isLoading ? (
                                        <span className="inline-block h-7 w-32 bg-slate-200/50 dark:bg-white/10 rounded-md animate-pulse" />
                                    ) : (
                                        `${currencySymbol} ${formatNumber(availableLimit)}`
                                    )}
                                </div>
                            </div>

                            {/* Apple Battery Style Progress Bar */}
                            <div className="w-full bg-slate-200/40 dark:bg-white/10 backdrop-blur-sm rounded-full h-2.5 p-[1.5px] my-3.5 border border-white/30 dark:border-white/5">
                                <div 
                                    className={`h-full rounded-full transition-all duration-500 shadow-2xs ${
                                        isLoading ? 'w-1/3 bg-slate-300 dark:bg-slate-600 animate-pulse' :
                                        batteryState === 'charging' ? 'bg-[#34C759]' :
                                        batteryState === 'low-power' ? 'bg-[#FFCC00]' :
                                        batteryState === 'critical' ? 'bg-[#FF3B30]' :
                                        'bg-slate-900 dark:bg-white'
                                    }`}
                                    style={isLoading ? {} : { width: `${percentage}%` }}
                                />
                            </div>

                            {/* Breakdown Sub-Cards: Total & Used (Frosted Sub-Glass) */}
                            <div className="grid grid-cols-2 gap-2">
                                <div className="bg-white/20 dark:bg-black/20 backdrop-blur-md rounded-xl p-2.5 border border-white/50 dark:border-white/[0.05] flex flex-col shadow-2xs">
                                    <span className="text-[9.5px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-0.5">
                                        Toplam Limit
                                    </span>
                                    <span className="text-[13px] font-bold text-slate-900 dark:text-white tabular-nums">
                                        {isLoading ? (
                                            <span className="inline-block h-4 w-16 bg-slate-200/50 dark:bg-white/10 rounded animate-pulse" />
                                        ) : (
                                            `${currencySymbol} ${formatNumber(creditLimit)}`
                                        )}
                                    </span>
                                </div>

                                <div className="bg-white/20 dark:bg-black/20 backdrop-blur-md rounded-xl p-2.5 border border-white/50 dark:border-white/[0.05] flex flex-col shadow-2xs">
                                    <span className="text-[9.5px] font-bold uppercase tracking-wider text-rose-500/90 dark:text-rose-400/90 mb-0.5">
                                        Kullanılan
                                    </span>
                                    <span className="text-[13px] font-bold text-rose-600 dark:text-rose-400 tabular-nums">
                                        {isLoading ? (
                                            <span className="inline-block h-4 w-14 bg-slate-200/50 dark:bg-white/10 rounded animate-pulse" />
                                        ) : (
                                            `${currencySymbol} ${formatNumber(usedLimit)}`
                                        )}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Status Footer: Real updateDateTime Binding & Verification */}
                        <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 px-1 font-medium">
                            <span title={myLimit?.updateDateTime ? `Sunucu Güncelleme Tarihi: ${lastUpdatedStr}` : ''}>
                                {isLoading ? 'Veriler güncelleniyor...' : `Son Güncelleme: ${lastUpdatedStr}`}
                            </span>
                            <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                                <span className="material-symbols-outlined text-[13px]">{isLoading ? 'sync' : 'check_circle'}</span>
                                {isLoading ? 'Senkronize ediliyor' : 'Güncel'}
                            </span>
                        </div>
                    </div>

                    {/* ── Footer Navigation Actions (Apple iOS Frosted Glass Buttons) ── */}
                    <div className="p-3 bg-white/10 dark:bg-white/[0.02] backdrop-blur-md border-t border-black/[0.04] dark:border-white/[0.08] flex items-center gap-2">
                        <button
                            onClick={() => {
                                setIsOpen(false);
                                navigate('/finance');
                            }}
                            className="flex-1 py-2 px-3 rounded-xl bg-slate-900/85 hover:bg-slate-900 dark:bg-white/90 dark:hover:bg-white text-white dark:text-slate-900 text-[12px] font-semibold transition-all flex items-center justify-center gap-1.5 shadow-2xs active:scale-[0.98] backdrop-blur-xl cursor-pointer"
                        >
                            <span className="material-symbols-outlined text-[15px]">query_stats</span>
                            <span>Finans Detayları</span>
                        </button>
                        
                        <button
                            onClick={() => {
                                setIsOpen(false);
                                navigate('/my-office');
                            }}
                            className="flex-1 py-2 px-3 rounded-xl bg-white/30 hover:bg-white/50 dark:bg-white/10 dark:hover:bg-white/15 border border-white/50 dark:border-white/10 text-slate-800 dark:text-slate-200 text-[12px] font-semibold transition-all flex items-center justify-center gap-1.5 active:scale-[0.98] backdrop-blur-xl shadow-2xs cursor-pointer"
                        >
                            <span className="material-symbols-outlined text-[15px]">account_balance_wallet</span>
                            <span>Limit Yönetimi</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default IosBatteryCredit;
