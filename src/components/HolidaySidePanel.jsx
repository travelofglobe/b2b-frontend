import React from 'react';
import { useTranslation } from 'react-i18next';

const HolidaySidePanel = ({ holidays, visibleMonth }) => {
    const { t, i18n } = useTranslation();

    // visibleMonth is the start date of the first visible month.
    // We show 2 months. So m1 and m1 + 1.
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

    const renderHolidayList = (list, colorClass) => {
        if (list.length === 0) return null;
        
        const langPrefix = (i18n.language || 'en').substring(0, 2).toLowerCase();
        
        // Extract unique names
        const uniqueNames = Array.from(new Set(list.map(h => {
            const hCountry = (h.countryCode || '').toLowerCase();
            const isLocalLang = langPrefix === hCountry;
            return (isLocalLang && h.localName) ? h.localName : (h.holidayName || h.name);
        })));

        return (
            <ul className="text-[11px] text-slate-500 dark:text-slate-400 pl-6 flex flex-col gap-1.5 list-none">
                {uniqueNames.map((name, i) => (
                    <li key={i} className="relative leading-tight break-words pr-2" title={name}>
                        <span className={`absolute -left-3 top-[5px] w-1 h-1 rounded-full ${colorClass}`}></span>
                        {name}
                    </li>
                ))}
            </ul>
        );
    };

    return (
        <div className="holiday-side-panel p-4 min-w-[200px] w-[220px] border-l border-slate-100 dark:border-slate-700 flex flex-col gap-5 bg-white dark:bg-slate-800 rounded-r-xl overflow-y-auto max-h-[320px]">
            <h4 className="text-[14px] font-semibold text-slate-800 dark:text-slate-200 tracking-tight">{t('dashboard.holidays.title')}</h4>
            
            <div className="flex flex-col gap-2 mt-1">
                <div className="flex items-center gap-2">
                    <div className="w-4 h-[3px] bg-yellow-400 rounded-full"></div>
                    <span className="text-[13px] font-medium text-slate-700 dark:text-slate-300">{t('dashboard.holidays.publicHolidays')}</span>
                </div>
                {publicHolidays.length > 0 && renderHolidayList(publicHolidays, 'bg-yellow-400')}
            </div>

            <div className="flex flex-col gap-2 mt-2">
                <div className="flex items-center gap-2">
                    <div className="w-4 h-[3px] bg-green-500 rounded-full"></div>
                    <span className="text-[13px] font-medium text-slate-700 dark:text-slate-300">{t('dashboard.holidays.religiousHolidays')}</span>
                </div>
                {religiousHolidays.length > 0 && renderHolidayList(religiousHolidays, 'bg-green-500')}
            </div>
        </div>
    );
};

export default HolidaySidePanel;
