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

    const renderHolidayList = (list) => {
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
                {uniqueItems.map((item, i) => (
                    <div
                        key={i}
                        className="flex items-center justify-between gap-2 py-1.5 px-2.5 rounded-[4px] bg-[#f8f9fa] dark:bg-[#303134]/60 border border-[#dadce0]/70 dark:border-slate-700/70"
                    >
                        <span
                            className="text-[12.5px] font-normal text-[#202124] dark:text-slate-100 truncate"
                            title={item.name}
                        >
                            {item.name}
                        </span>
                        {item.date && (
                            <span className="text-[11px] font-medium text-[#5f6368] dark:text-slate-300 bg-white dark:bg-[#202124] px-1.5 py-0.5 rounded-[3px] border border-[#dadce0]/50 dark:border-slate-600/50 shrink-0 tabular-nums">
                                {formatShortDate(item.date)}
                            </span>
                        )}
                    </div>
                ))}
            </div>
        );
    };

    const baseWrapperClass = className 
        ? className 
        : "border-l border-[#dadce0] dark:border-slate-700 bg-white dark:bg-[#202124] p-4";

    return (
        <div className={`holiday-side-panel min-w-[210px] w-[235px] flex flex-col gap-3.5 overflow-y-auto max-h-[350px] font-roboto ${baseWrapperClass}`}>
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
                    renderHolidayList(publicHolidays)
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
                    renderHolidayList(religiousHolidays)
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
