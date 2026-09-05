import React from 'react';
import { useTranslation } from 'react-i18next';

const HolidaySidePanel = ({ holidays, visibleMonth, className = '' }) => {
    const { t, i18n } = useTranslation();

    // visibleMonth is the start date of the first visible month.
    // We show 2 months: m1 and m1 + 1.
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

    const renderHolidayList = (list, colorType) => {
        if (list.length === 0) return null;
        
        const langPrefix = (i18n.language || 'en').substring(0, 2).toLowerCase();
        
        // Extract unique names
        const uniqueItems = Array.from(new Set(list.map(h => {
            const hCountry = (h.countryCode || '').toLowerCase();
            const isLocalLang = langPrefix === hCountry;
            const name = (isLocalLang && h.localName) ? h.localName : (h.holidayName || h.name);
            return JSON.stringify({ name, date: h.date || h.holidayDate });
        }))).map(s => JSON.parse(s));

        const isAmber = colorType === 'amber';

        return (
            <ul className="text-[13px] font-roboto flex flex-col gap-1 list-none p-0 m-0">
                {uniqueItems.map((item, i) => (
                    <li
                        key={i}
                        className="group flex items-center justify-between gap-2.5 py-1 px-1.5 rounded-md hover:bg-slate-100/70 dark:hover:bg-slate-800/50 transition-colors"
                    >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                            <span
                                className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                    isAmber ? 'bg-amber-400' : 'bg-emerald-500'
                                }`}
                            />
                            <span
                                className="text-[13px] font-normal text-[#3c4043] dark:text-slate-200 truncate leading-snug"
                                title={item.name}
                            >
                                {item.name}
                            </span>
                        </div>
                        {item.date && (
                            <span className="text-[11.5px] font-medium text-[#70757a] dark:text-slate-400 shrink-0 tabular-nums">
                                {formatShortDate(item.date)}
                            </span>
                        )}
                    </li>
                ))}
            </ul>
        );
    };

    const baseWrapperClass = className 
        ? className 
        : "border-l border-[#dadce0] dark:border-slate-700 bg-white dark:bg-[#202124] rounded-r-[8px] p-4";

    return (
        <div className={`holiday-side-panel min-w-[210px] w-[235px] flex flex-col gap-3.5 overflow-y-auto max-h-[350px] font-roboto ${baseWrapperClass}`}>
            {/* Header */}
            <div className="flex items-center gap-2 pb-2.5 border-b border-[#dadce0] dark:border-slate-700">
                <span className="material-symbols-outlined text-[18px] text-[#1a73e8]">event</span>
                <h4 className="text-[14px] font-medium text-[#202124] dark:text-white tracking-normal leading-none">
                    {t('dashboard.holidays.title', 'Tatil Bilgisi')}
                </h4>
            </div>
            
            {/* Resmi Tatiller Section */}
            <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-2">
                        <span className="w-2.5 h-[2.5px] bg-amber-400 rounded-full"></span>
                        <span className="text-[12.5px] font-medium text-[#3c4043] dark:text-slate-200">
                            {t('dashboard.holidays.publicHolidays', 'Resmi Tatiller')}
                        </span>
                    </div>
                    {publicHolidays.length > 0 && (
                        <span className="text-[11px] font-normal text-[#70757a] dark:text-slate-400">
                            {publicHolidays.length}
                        </span>
                    )}
                </div>
                {publicHolidays.length > 0 ? (
                    renderHolidayList(publicHolidays, 'amber')
                ) : (
                    <p className="text-[11.5px] font-normal text-[#70757a] dark:text-slate-500 pl-4 italic">
                        {t('dashboard.holidays.none', 'Bu dönemde yok')}
                    </p>
                )}
            </div>

            {/* Dini Tatiller Section */}
            <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-2">
                        <span className="w-2.5 h-[2.5px] bg-emerald-500 rounded-full"></span>
                        <span className="text-[12.5px] font-medium text-[#3c4043] dark:text-slate-200">
                            {t('dashboard.holidays.religiousHolidays', 'Dini Tatiller')}
                        </span>
                    </div>
                    {religiousHolidays.length > 0 && (
                        <span className="text-[11px] font-normal text-[#70757a] dark:text-slate-400">
                            {religiousHolidays.length}
                        </span>
                    )}
                </div>
                {religiousHolidays.length > 0 ? (
                    renderHolidayList(religiousHolidays, 'emerald')
                ) : (
                    <p className="text-[11.5px] font-normal text-[#70757a] dark:text-slate-500 pl-4 italic">
                        {t('dashboard.holidays.none', 'Bu dönemde yok')}
                    </p>
                )}
            </div>
        </div>
    );
};

export default HolidaySidePanel;
