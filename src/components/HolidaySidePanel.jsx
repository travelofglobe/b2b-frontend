import React from 'react';
import { useTranslation } from 'react-i18next';

const HolidaySidePanel = ({ holidays, visibleMonth, className = '' }) => {
    const { t, i18n } = useTranslation();

    const m1 = visibleMonth ? visibleMonth.getMonth() : new Date().getMonth();
    const y1 = visibleMonth ? visibleMonth.getFullYear() : new Date().getFullYear();
    const nextMonth = new Date(y1, m1 + 1, 1);
    const m2 = nextMonth.getMonth();
    const y2 = nextMonth.getFullYear();

    const isVisible = (h) => {
        const d = new Date(h.date || h.holidayDate);
        return (d.getMonth() === m1 && d.getFullYear() === y1) || 
               (d.getMonth() === m2 && d.getFullYear() === y2);
    };

    const visibleHolidays = holidays?.filter(isVisible) || [];

    const isReligious = (name) => {
        const lower = (name || '').toLowerCase();
        return lower.includes('eid') || lower.includes('ramazan') || lower.includes('kurban');
    };

    const publicHolidays = visibleHolidays.filter(h => !isReligious(h.name || h.holidayName));
    const religiousHolidays = visibleHolidays.filter(h => isReligious(h.name || h.holidayName));

    const formatShortDate = (dateStr) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return '';
        const months = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
        return `${d.getDate()} ${months[d.getMonth()]}`;
    };

    const formatLongDate = (dateStr) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return '';
        const months = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
        return `${d.getDate()} ${months[d.getMonth()]}`;
    };

    const parseHoliday = (rawName) => {
        if (!rawName) return { title: '', detail: '', fullText: '', hasExtra: false };

        let title = rawName.trim();
        let detail = '';
        let hasParenthesis = false;

        // Check for trailing or enclosed parentheses: e.g. "Ramazan Bayramı 1. Gün (Ramazan Bayramı)"
        const match = title.match(/^(.*?)\s*\((.*?)\)$/);
        if (match) {
            title = match[1].trim();
            detail = match[2].trim();
            hasParenthesis = true;
        } else {
            const anyMatch = title.match(/\((.*?)\)/);
            if (anyMatch) {
                detail = anyMatch[1].trim();
                title = title.replace(/\s*\(.*?\)/, '').trim();
                hasParenthesis = true;
            }
        }

        // If title or full text is long (> 17 chars) or had parentheses
        const isLong = title.length > 17 || rawName.length > 18;
        const hasExtra = hasParenthesis || isLong;

        return {
            title,
            detail,
            fullText: rawName.trim(),
            hasExtra,
        };
    };

    const renderHolidayList = (list, isFirstSection = false) => {
        if (list.length === 0) return null;
        
        const langPrefix = (i18n.language || 'en').substring(0, 2).toLowerCase();
        
        const uniqueItems = Array.from(new Set(list.map(h => {
            const hCountry = (h.countryCode || '').toLowerCase();
            const isLocalLang = langPrefix === hCountry;
            const name = (isLocalLang && h.localName) ? h.localName : (h.holidayName || h.name);
            return JSON.stringify({ name, date: h.date || h.holidayDate });
        }))).map(s => JSON.parse(s));

        return (
            <div className="flex flex-col gap-1.5">
                {uniqueItems.map((item, i) => {
                    const parsed = parseHoliday(item.name);
                    const openDownwards = isFirstSection && i === 0;

                    return (
                        <div
                            key={i}
                            className="relative flex items-center justify-between gap-1.5 py-1.5 px-2.5 rounded-[4px] bg-[#f8f9fa] dark:bg-[#303134]/60 border border-[#dadce0]/70 dark:border-slate-700/70"
                        >
                            <div className="min-w-0 flex-1 overflow-hidden">
                                <span
                                    className="block text-[12.5px] font-normal text-[#202124] dark:text-slate-100 whitespace-nowrap overflow-hidden"
                                    style={{ textOverflow: 'clip' }}
                                    title={parsed.fullText}
                                >
                                    {parsed.title}
                                </span>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                                {parsed.hasExtra && (
                                    <div className="group/info inline-flex items-center justify-center">
                                        <div
                                            className="w-4 h-4 rounded-full flex items-center justify-center text-[#70757a] group-hover/info:text-[#1a73e8] group-hover/info:bg-[#e8f0fe] dark:text-slate-400 dark:group-hover/info:text-blue-400 dark:group-hover/info:bg-slate-700/60 transition-colors cursor-pointer shrink-0"
                                            aria-label="Tatil detayı"
                                        >
                                            <span className="material-symbols-outlined text-[14px] select-none pointer-events-none leading-none">
                                                info
                                            </span>
                                        </div>

                                        {/* Glitch-free Tooltip: Spans full card width (left-0 right-0), never clipped, arrow precisely over (i) */}
                                        <div
                                            className={`pointer-events-none absolute ${
                                                openDownwards ? 'top-full mt-1.5 flex-col-reverse' : 'bottom-full mb-1.5 flex-col'
                                            } left-0 right-0 z-[1000] opacity-0 invisible group-hover/info:opacity-100 group-hover/info:visible transition-all duration-150 flex`}
                                        >
                                            <div className="bg-[#202124] dark:bg-slate-800 text-white px-3 py-2 rounded-[6px] shadow-2xl border border-slate-700/70 text-center text-[11.5px] leading-snug break-words w-full">
                                                <div className="font-medium text-white text-[12px]">{parsed.fullText}</div>
                                                {parsed.detail && parsed.detail.toLowerCase() !== parsed.title.toLowerCase() && (
                                                    <div className="text-[10.5px] text-slate-300 dark:text-slate-400 mt-1 pt-1 border-t border-slate-700 leading-tight">
                                                        {parsed.detail}
                                                    </div>
                                                )}
                                                {item.date && (
                                                    <div className="text-[10px] text-slate-400 mt-1 flex items-center justify-center gap-1 font-medium">
                                                        <span className="material-symbols-outlined text-[11px]">calendar_today</span>
                                                        <span>{formatLongDate(item.date)}</span>
                                                    </div>
                                                )}
                                            </div>
                                            {/* Arrow positioned right over the (i) icon */}
                                            <div className="flex justify-end w-full pr-[66px]">
                                                <div
                                                    className={`w-2.5 h-2.5 bg-[#202124] dark:bg-slate-800 rotate-45 ${
                                                        openDownwards ? '-mb-1.5 border-l border-t' : '-mt-1.5 border-r border-b'
                                                    } border-slate-700/70 shrink-0`}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}
                                {item.date && (
                                    <span className="text-[11px] font-medium text-[#5f6368] dark:text-slate-300 bg-white dark:bg-[#202124] px-1.5 py-0.5 rounded-[3px] border border-[#dadce0]/50 dark:border-slate-600/50 tabular-nums">
                                        {formatShortDate(item.date)}
                                    </span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    const baseWrapperClass = className 
        ? className 
        : "border-l border-[#dadce0] dark:border-slate-700 bg-white dark:bg-[#202124] p-4";

    return (
        <div className={`holiday-side-panel min-w-[210px] w-[240px] flex flex-col gap-3.5 overflow-visible font-roboto ${baseWrapperClass}`}>
            {/* Header */}
            <div className="flex items-center gap-2 pb-2.5 border-b border-[#dadce0] dark:border-slate-700">
                <span className="material-symbols-outlined text-[18px] text-[#1a73e8]">event</span>
                <h4 className="text-[13.5px] font-medium text-[#202124] dark:text-white tracking-normal leading-none">
                    {t('dashboard.holidays.title', 'Tatil Bilgisi')}
                </h4>
            </div>
            
            {/* Resmi Tatiller Section */}
            <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between px-0.5">
                    <div className="flex items-center gap-2">
                        <span className="w-1.5 h-3.5 rounded-full bg-amber-400 shrink-0"></span>
                        <span className="text-[13px] font-medium text-[#202124] dark:text-slate-200">
                            {t('dashboard.holidays.publicHolidays', 'Resmi Tatiller')}
                        </span>
                    </div>
                    {publicHolidays.length > 0 && (
                        <span className="text-[11px] font-medium text-[#70757a] dark:text-slate-400 bg-[#f1f3f4] dark:bg-slate-700 px-1.5 py-0.2 rounded-[4px]">
                            {publicHolidays.length}
                        </span>
                    )}
                </div>
                {publicHolidays.length > 0 ? (
                    renderHolidayList(publicHolidays, true)
                ) : (
                    <div className="py-1.5 px-2.5 rounded-[4px] bg-[#f8f9fa] dark:bg-[#303134]/30 border border-dashed border-[#dadce0] dark:border-slate-700 text-[#70757a] dark:text-slate-400 text-[11.5px] font-normal">
                        {t('dashboard.holidays.none', 'Bu dönemde yok')}
                    </div>
                )}
            </div>

            {/* Dini Tatiller Section */}
            <div className="flex flex-col gap-1.5 mt-1">
                <div className="flex items-center justify-between px-0.5">
                    <div className="flex items-center gap-2">
                        <span className="w-1.5 h-3.5 rounded-full bg-emerald-500 shrink-0"></span>
                        <span className="text-[13px] font-medium text-[#202124] dark:text-slate-200">
                            {t('dashboard.holidays.religiousHolidays', 'Dini Tatiller')}
                        </span>
                    </div>
                    {religiousHolidays.length > 0 && (
                        <span className="text-[11px] font-medium text-[#70757a] dark:text-slate-400 bg-[#f1f3f4] dark:bg-slate-700 px-1.5 py-0.2 rounded-[4px]">
                            {religiousHolidays.length}
                        </span>
                    )}
                </div>
                {religiousHolidays.length > 0 ? (
                    renderHolidayList(religiousHolidays, false)
                ) : (
                    <div className="py-1.5 px-2.5 rounded-[4px] bg-[#f8f9fa] dark:bg-[#303134]/30 border border-dashed border-[#dadce0] dark:border-slate-700 text-[#70757a] dark:text-slate-400 text-[11.5px] font-normal">
                        {t('dashboard.holidays.none', 'Bu dönemde yok')}
                    </div>
                )}
            </div>
        </div>
    );
};

export default HolidaySidePanel;
