import React, { useState, useEffect, useLayoutEffect, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import HolidaySidePanel from './HolidaySidePanel';

export const formatGoogleFlightDate = (date, lang = 'en') => {
    if (!date || isNaN(new Date(date).getTime())) return '';
    const d = new Date(date);
    try {
        return new Intl.DateTimeFormat(lang || 'en', { day: 'numeric', month: 'short', weekday: 'short' }).format(d);
    } catch {
        return d.toLocaleDateString();
    }
};

export const isSameDay = (d1, d2) => {
    if (!d1 || !d2) return false;
    return (
        d1.getFullYear() === d2.getFullYear() &&
        d1.getMonth() === d2.getMonth() &&
        d1.getDate() === d2.getDate()
    );
};

export const isBeforeDay = (d1, d2) => {
    if (!d1 || !d2) return false;
    const t1 = new Date(d1.getFullYear(), d1.getMonth(), d1.getDate()).getTime();
    const t2 = new Date(d2.getFullYear(), d2.getMonth(), d2.getDate()).getTime();
    return t1 < t2;
};

export const isAfterDay = (d1, d2) => {
    if (!d1 || !d2) return false;
    const t1 = new Date(d1.getFullYear(), d1.getMonth(), d1.getDate()).getTime();
    const t2 = new Date(d2.getFullYear(), d2.getMonth(), d2.getDate()).getTime();
    return t1 > t2;
};

// Standalone Calendar & Holiday body for embedding directly into transforming triggers
export const GoogleFlightDatePickerBody = ({
    checkInDate,
    checkOutDate,
    onCheckInChange,
    onCheckOutChange,
    activeField = 'checkIn',
    setActiveField,
    holidays = [],
    countryCode = 'TR',
    onApply
}) => {
    const { t, i18n } = useTranslation();

    // Visible base month (left month)
    const [viewDate, setViewDate] = useState(() => {
        const init = checkInDate ? new Date(checkInDate) : new Date();
        return new Date(init.getFullYear(), init.getMonth(), 1);
    });

    const [hoverDate, setHoverDate] = useState(null);

    // Sync viewDate when checkInDate changes
    useEffect(() => {
        if (checkInDate) {
            setViewDate(new Date(checkInDate.getFullYear(), checkInDate.getMonth(), 1));
        }
    }, [checkInDate]);

    // Next / Prev month
    const handlePrevMonth = () => {
        setViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    };

    // Calculate left & right months
    const leftMonth = viewDate;
    const rightMonth = useMemo(() => {
        return new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1);
    }, [viewDate]);

    // Day grid builder (Monday-first)
    const buildMonthDays = (baseMonth) => {
        const year = baseMonth.getFullYear();
        const month = baseMonth.getMonth();
        const firstDayOfMonth = new Date(year, month, 1);
        const lastDayOfMonth = new Date(year, month + 1, 0);

        const startDayIndex = (firstDayOfMonth.getDay() + 6) % 7;
        const totalDays = lastDayOfMonth.getDate();

        const cells = [];
        for (let i = 0; i < startDayIndex; i++) {
            cells.push(null);
        }
        for (let d = 1; d <= totalDays; d++) {
            cells.push(new Date(year, month, d));
        }
        return cells;
    };

    const leftDays = useMemo(() => buildMonthDays(leftMonth), [leftMonth]);
    const rightDays = useMemo(() => buildMonthDays(rightMonth), [rightMonth]);

    const today = useMemo(() => {
        const now = new Date();
        return new Date(now.getFullYear(), now.getMonth(), now.getDate());
    }, []);

    // Handle day click
    const handleDayClick = (date) => {
        if (isBeforeDay(date, today)) return;

        if (activeField === 'checkIn') {
            onCheckInChange(date);
            let nextOut = checkOutDate;
            if (!checkOutDate || !isAfterDay(checkOutDate, date)) {
                nextOut = new Date(date);
                nextOut.setDate(nextOut.getDate() + 1);
                onCheckOutChange(nextOut);
            }
            setActiveField?.('checkOut');
            setHoverDate(null);
        } else {
            // activeField === 'checkOut' or null
            if (checkInDate && isBeforeDay(date, checkInDate)) {
                onCheckInChange(date);
                const next = new Date(date);
                next.setDate(next.getDate() + 1);
                onCheckOutChange(next);
                setActiveField?.('checkOut');
                setHoverDate(null);
            } else {
                let finalCheckOut = date;
                if (checkInDate && isSameDay(date, checkInDate)) {
                    finalCheckOut = new Date(date);
                    finalCheckOut.setDate(finalCheckOut.getDate() + 1);
                }
                onCheckOutChange(finalCheckOut);
                setActiveField?.(null);
                setHoverDate(null);

                if (onApply) {
                    setTimeout(() => {
                        onApply(checkInDate, finalCheckOut);
                    }, 200);
                }
            }
        }
    };

    const dayHeaders = useMemo(() => {
        const headers = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date(2023, 0, 2 + i);
            try {
                headers.push(new Intl.DateTimeFormat(i18n.language || 'en', { weekday: 'narrow' }).format(d));
            } catch {
                headers.push(['M', 'T', 'W', 'T', 'F', 'S', 'S'][i]);
            }
        }
        return headers;
    }, [i18n.language]);

    // Render single calendar month
    const renderCalendarMonth = (monthDate, days) => {
        let monthTitle = '';
        try {
            monthTitle = new Intl.DateTimeFormat(i18n.language || 'en', { month: 'long', year: 'numeric' }).format(monthDate);
        } catch {
            monthTitle = monthDate.toLocaleDateString();
        }

        return (
            <div className="w-[230px] sm:w-[245px]">
                {/* Month title */}
                <h3 className="text-[14px] font-medium text-[#202124] dark:text-white text-center mb-2.5 capitalize">
                    {monthTitle}
                </h3>

                {/* Day headers */}
                <div className="grid grid-cols-7 mb-1.5">
                    {dayHeaders.map((h, i) => (
                        <div key={i} className="text-center text-[11px] font-medium text-[#70757a] dark:text-slate-400">
                            {h}
                        </div>
                    ))}
                </div>

                {/* Days Grid */}
                <div className="grid grid-cols-7 gap-y-0.5">
                    {days.map((date, index) => {
                        if (!date) {
                            return <div key={`empty-${index}`} className="h-8" />;
                        }

                        const isPast = isBeforeDay(date, today);
                        const isStart = isSameDay(date, checkInDate);
                        const isEnd = isSameDay(date, checkOutDate);

                        // Range calculation
                        const effectiveEnd = (activeField === 'checkOut' && hoverDate && isAfterDay(hoverDate, checkInDate))
                            ? hoverDate
                            : checkOutDate;

                        const isInRange = checkInDate && effectiveEnd &&
                            isAfterDay(date, checkInDate) &&
                            isBeforeDay(date, effectiveEnd);

                        // Holiday check
                        const formattedIso = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
                        const holiday = holidays?.find(h => (h.date === formattedIso || h.holidayDate === formattedIso));

                        let isReligious = false;
                        let displayTooltipName = '';
                        if (holiday) {
                            const lowerName = (holiday.holidayName || holiday.name || '').toLowerCase();
                            isReligious = lowerName.includes('eid') || lowerName.includes('ramazan') || lowerName.includes('kurban');

                            const langPrefix = (i18n.language || 'en').substring(0, 2).toLowerCase();
                            const hCountry = (holiday.countryCode || countryCode || '').toLowerCase();
                            const isLocalLang = langPrefix === hCountry;
                            displayTooltipName = (isLocalLang && holiday.localName) ? holiday.localName : (holiday.holidayName || holiday.name);
                        }

                        const isToday = isSameDay(date, today);
                        const isHoverEnd = activeField === 'checkOut' && hoverDate && isSameDay(date, hoverDate) && !isStart && isAfterDay(date, checkInDate);

                        let rangeClasses = '';
                        if (isInRange) {
                            rangeClasses = 'bg-[#e8f0fe] dark:bg-blue-900/30 text-[#1a73e8] dark:text-blue-300';
                        } else if (isStart && effectiveEnd) {
                            rangeClasses = "before:content-[''] before:absolute before:right-0 before:top-0 before:bottom-0 before:w-1/2 before:bg-[#e8f0fe] dark:before:bg-blue-900/30";
                        } else if ((isEnd || isHoverEnd) && checkInDate) {
                            rangeClasses = "before:content-[''] before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1/2 before:bg-[#e8f0fe] dark:before:bg-blue-900/30";
                        }

                        return (
                            <div
                                key={date.toISOString()}
                                className={`h-8 flex items-center justify-center relative ${rangeClasses}`}
                                onMouseEnter={() => !isPast && activeField === 'checkOut' && setHoverDate(date)}
                            >
                                <button
                                    type="button"
                                    disabled={isPast}
                                    onClick={() => handleDayClick(date)}
                                    className={`size-8 flex items-center justify-center text-[12.5px] font-medium transition-all relative z-10 group/day ${
                                        isStart || isEnd
                                            ? 'bg-[#1a73e8] text-white rounded-full shadow-sm font-semibold'
                                            : isHoverEnd
                                            ? 'border-2 border-[#3c4043] dark:border-white rounded-full bg-white dark:bg-[#303134] text-[#3c4043] dark:text-white font-semibold'
                                            : isToday
                                            ? 'border border-[#1a73e8] text-[#1a73e8] rounded-full font-medium'
                                            : isPast
                                            ? 'text-slate-300 dark:text-slate-600 cursor-not-allowed'
                                            : 'text-[#3c4043] dark:text-slate-200 hover:bg-[#f1f3f4] dark:hover:bg-slate-700 rounded-full'
                                    }`}
                                >
                                    <span>{date.getDate()}</span>
                                    {holiday && (
                                        <span
                                            className={`absolute bottom-0.5 w-3 h-[2.5px] rounded-full transition-colors ${
                                                isStart || isEnd
                                                    ? 'bg-white shadow-xs'
                                                    : isReligious
                                                    ? 'bg-emerald-500 ring-2 ring-emerald-500/20'
                                                    : 'bg-amber-500 ring-2 ring-amber-500/20'
                                            }`}
                                        />
                                    )}

                                    {/* Holiday Tooltip on Hover */}
                                    {holiday && !isPast && (
                                        <div className="hidden group-hover/day:flex flex-col items-center absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-slate-900/95 dark:bg-slate-800 text-white text-center px-3 py-2 rounded-xl shadow-xl pointer-events-none z-[400] whitespace-nowrap border border-slate-700/50 backdrop-blur-sm">
                                            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                                {holiday.countryCode || countryCode || 'TR'}
                                            </div>
                                            <div className="text-[12.5px] font-semibold text-white max-w-[210px] truncate leading-tight mt-0.5">
                                                {displayTooltipName}
                                            </div>
                                            <div className={`text-[10px] font-medium mt-1 px-1.5 py-0.5 rounded-full ${isReligious ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'}`}>
                                                {isReligious ? 'Dini Tatil' : 'Resmi Tatil'}
                                            </div>
                                            <div className="w-2 h-2 bg-slate-900/95 dark:bg-slate-800 rotate-45 absolute -bottom-1 left-1/2 -translate-x-1/2 border-r border-b border-slate-700/50"></div>
                                        </div>
                                    )}
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    return (
        <div className="p-4 sm:p-5 select-none font-roboto">
            <div className="flex flex-col md:flex-row gap-4 sm:gap-5">
                {/* Calendars Container */}
                <div className="flex-1">
                    {/* --- 2-Month Calendar Row --- */}
                    <div className="relative">
                        {/* Prev Month Button */}
                        <button
                            type="button"
                            onClick={handlePrevMonth}
                            className="absolute left-1 sm:left-1.5 top-1/2 -translate-y-1/2 size-8 rounded-full bg-white dark:bg-[#303134] border border-[#dadce0] dark:border-slate-600 shadow-sm hover:shadow flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-700 z-20 transition-all text-[#5f6368] dark:text-slate-300 active:scale-95 cursor-pointer"
                            aria-label="Previous Month"
                        >
                            <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                        </button>

                        {/* Two Month Grids */}
                        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center px-10 sm:px-11">
                            {renderCalendarMonth(leftMonth, leftDays)}
                            <div className="hidden sm:block">
                                {renderCalendarMonth(rightMonth, rightDays)}
                            </div>
                        </div>

                        {/* Next Month Button */}
                        <button
                            type="button"
                            onClick={handleNextMonth}
                            className="absolute right-1 sm:right-1.5 top-1/2 -translate-y-1/2 size-8 rounded-full bg-white dark:bg-[#303134] border border-[#dadce0] dark:border-slate-600 shadow-sm hover:shadow flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-700 z-20 transition-all text-[#5f6368] dark:text-slate-300 active:scale-95 cursor-pointer"
                            aria-label="Next Month"
                        >
                            <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                        </button>
                    </div>
                </div>

                {/* --- Right Holiday Side Panel (Desktop only) --- */}
                <div className="hidden md:flex border-l border-[#dadce0] dark:border-slate-700 pl-4 overflow-visible">
                    <HolidaySidePanel
                        holidays={holidays}
                        visibleMonth={leftMonth}
                        className="bg-transparent dark:bg-transparent border-none p-0 overflow-visible"
                    />
                </div>
            </div>

            {/* --- Footer (Legend on left, Bitti button on right) --- */}
            <div className="flex items-center justify-between pt-2.5 mt-2.5 border-t border-[#dadce0] dark:border-slate-700 font-roboto">
                {/* Legend indicator */}
                <div className="flex items-center gap-4 sm:gap-5 text-[12px] font-normal text-[#5f6368] dark:text-slate-300">
                    <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-[3px] rounded-full bg-amber-400"></span>
                        <span className="text-[12px] font-normal">{t('dashboard.holidays.publicHolidays', 'Resmi Tatiller')}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-[3px] rounded-full bg-emerald-500"></span>
                        <span className="text-[12px] font-normal">{t('dashboard.holidays.religiousHolidays', 'Dini Tatiller')}</span>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={() => onApply?.(checkInDate, checkOutDate)}
                    className="bg-[#1a73e8] hover:bg-[#1557b0] text-white rounded-lg font-semibold text-xs sm:text-[13px] h-9 px-5 transition-all shadow-xs hover:shadow active:scale-95 cursor-pointer flex items-center justify-center"
                >
                    {t('common.done', 'Bitti')}
                </button>
            </div>
        </div>
    );
};

// Popover component for standalone/legacy usage
const GoogleFlightDatePicker = ({
    checkInDate,
    checkOutDate,
    onCheckInChange,
    onCheckOutChange,
    isOpen,
    onClose,
    onApply,
    activeField = 'checkIn',
    setActiveField,
    holidays = [],
    countryCode = 'TR',
    align = 'left',
    compact = false
}) => {
    const { t, i18n } = useTranslation();
    const currentLang = (i18n?.language || 'en').split('-')[0].toLowerCase();
    const popoverRef = useRef(null);

    const [isMounted, setIsMounted] = useState(false);
    const [isClosing, setIsClosing] = useState(false);
    const [offsetX, setOffsetX] = useState(0);

    useLayoutEffect(() => {
        if (!isOpen) {
            setOffsetX(0);
            return;
        }
        const updateOffset = () => {
            if (!popoverRef.current) return;
            const rect = popoverRef.current.getBoundingClientRect();
            const viewportWidth = window.innerWidth;
            const naturalRight = rect.right - offsetX;
            const naturalLeft = rect.left - offsetX;

            if (naturalRight > viewportWidth - 20) {
                const diff = naturalRight - (viewportWidth - 20);
                setOffsetX(-Math.max(0, diff));
            } else if (naturalLeft < 16) {
                const diff = 16 - naturalLeft;
                setOffsetX(Math.max(0, diff));
            } else {
                setOffsetX(0);
            }
        };

        updateOffset();
        const timer = setTimeout(updateOffset, 40);
        window.addEventListener('resize', updateOffset);
        return () => {
            clearTimeout(timer);
            window.removeEventListener('resize', updateOffset);
        };
    }, [isOpen, isMounted]);

    useEffect(() => {
        if (isOpen) {
            requestAnimationFrame(() => {
                setIsMounted(true);
            });
            setIsClosing(false);
        } else {
            setIsMounted(false);
            setIsClosing(false);
        }
    }, [isOpen]);

    const handleCloseWithAnimation = (overrideIn, overrideOut, isApply = false) => {
        setIsClosing(true);
        setTimeout(() => {
            setIsClosing(false);
            setIsMounted(false);
            const inDate = overrideIn || checkInDate;
            const outDate = overrideOut || checkOutDate;
            if (isApply && onApply) {
                onApply(inDate, outDate);
            } else {
                onClose?.(inDate, outDate);
            }
        }, 200);
    };

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && isOpen && !isClosing) {
                handleCloseWithAnimation(checkInDate, checkOutDate, false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, isClosing, checkInDate, checkOutDate]);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (popoverRef.current && !popoverRef.current.contains(e.target)) {
                if (e.target.closest('.google-flight-date-trigger')) return;
                handleCloseWithAnimation(checkInDate, checkOutDate, false);
            }
        };
        if (isOpen && !isClosing) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen, isClosing, checkInDate, checkOutDate]);

    const stepCheckIn = (days) => {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const current = checkInDate || today;
        const target = new Date(current);
        target.setDate(target.getDate() + days);
        if (isBeforeDay(target, today)) return;

        onCheckInChange(target);
        if (checkOutDate && !isAfterDay(checkOutDate, target)) {
            const nextOut = new Date(target);
            nextOut.setDate(nextOut.getDate() + 1);
            onCheckOutChange(nextOut);
        }
    };

    const stepCheckOut = (days) => {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const current = checkOutDate || new Date(today.getTime() + 86400000);
        const target = new Date(current);
        target.setDate(target.getDate() + days);
        if (checkInDate && !isAfterDay(target, checkInDate)) return;

        onCheckOutChange(target);
    };

    const handleReset = () => {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const defaultCheckIn = new Date(today);
        defaultCheckIn.setDate(defaultCheckIn.getDate() + 2);
        const defaultCheckOut = new Date(defaultCheckIn);
        defaultCheckOut.setDate(defaultCheckOut.getDate() + 1);
        onCheckInChange(defaultCheckIn);
        onCheckOutChange(defaultCheckOut);
        setActiveField?.('checkIn');
    };

    if (!isOpen && !isClosing) return null;

    return (
        <div
            ref={popoverRef}
            className={`absolute top-0 ${align === 'right' ? 'right-0' : 'left-0'} z-[1000] bg-white dark:bg-[#202124] rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.18),0_2px_8px_rgba(0,0,0,0.08)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.5),0_4px_12px_rgba(0,0,0,0.3)] border border-[#dadce0] dark:border-slate-700 max-w-[calc(100vw-24px)] max-h-[calc(100vh-80px)] overflow-hidden font-roboto transition-all duration-200 ease-out pointer-events-auto`}
            style={{
                width: 'max-content',
                transform: `translateX(${offsetX}px) ${isMounted && !isClosing ? 'translateY(0)' : 'translateY(-6px)'}`,
                opacity: isMounted && !isClosing ? 1 : 0
            }}
        >
            {/* Top Bar */}
            <div className="flex items-center justify-between h-12 border-b border-[#dadce0] dark:border-slate-700 bg-white dark:bg-[#202124]">
                <div className="w-[335px] sm:w-[345px] h-full flex items-center flex-shrink-0">
                    <div
                        onClick={() => setActiveField?.('checkIn')}
                        className={`relative flex-1 h-full flex items-center justify-between px-3 cursor-pointer transition-colors ${
                            activeField === 'checkIn'
                                ? 'bg-blue-50/80 dark:bg-blue-950/50 text-[#1a73e8] dark:text-blue-400 font-medium'
                                : 'hover:bg-slate-50 dark:hover:bg-slate-700/40 text-[#3c4043] dark:text-white'
                        }`}
                    >
                        <div className="flex items-center gap-1.5 min-w-0 flex-1">
                            <span className="material-symbols-outlined text-[18px] text-[#1a73e8] dark:text-blue-400 font-medium flex-shrink-0" style={{ fontVariationSettings: "'wght' 500, 'opsz' 18" }}>
                                calendar_today
                            </span>
                            <span className="text-[13.5px] font-medium truncate">
                                {formatGoogleFlightDate(checkInDate, currentLang) || t('dashboard.checkIn', 'Giriş')}
                            </span>
                        </div>

                        <div className="flex items-center text-[#5f6368] dark:text-slate-400 shrink-0 ml-0.5">
                            <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); stepCheckIn(-1); }}
                                className="hover:bg-slate-200 dark:hover:bg-slate-600 p-0.5 rounded transition-colors"
                                title="1 gün geri"
                            >
                                <span className="material-symbols-outlined text-[13px]">chevron_left</span>
                            </button>
                            <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); stepCheckIn(1); }}
                                className="hover:bg-slate-200 dark:hover:bg-slate-600 p-0.5 rounded transition-colors"
                                title="1 gün ileri"
                            >
                                <span className="material-symbols-outlined text-[13px]">chevron_right</span>
                            </button>
                        </div>
                    </div>

                    <div className="w-[1px] h-6 bg-[#dadce0] dark:bg-slate-600 flex-shrink-0" />

                    <div
                        onClick={() => setActiveField?.('checkOut')}
                        className={`relative flex-1 h-full flex items-center justify-between px-3 cursor-pointer transition-colors ${
                            activeField === 'checkOut'
                                ? 'bg-blue-50/80 dark:bg-blue-950/50 text-[#1a73e8] dark:text-blue-400 font-medium'
                                : 'hover:bg-slate-50 dark:hover:bg-slate-700/40 text-[#3c4043] dark:text-white'
                        }`}
                    >
                        <div className="flex items-center min-w-0 flex-1">
                            <span className="text-[13.5px] font-medium truncate">
                                {formatGoogleFlightDate(checkOutDate, currentLang) || t('dashboard.checkOut', 'Çıkış')}
                            </span>
                        </div>

                        <div className="flex items-center text-[#5f6368] dark:text-slate-300 shrink-0 ml-0.5">
                            <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); stepCheckOut(-1); }}
                                className="hover:bg-slate-200 dark:hover:bg-slate-600 p-0.5 rounded transition-colors"
                                title="1 gün geri"
                            >
                                <span className="material-symbols-outlined text-[13px]">chevron_left</span>
                            </button>
                            <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); stepCheckOut(1); }}
                                className="hover:bg-slate-200 dark:hover:bg-slate-600 p-0.5 rounded transition-colors"
                                title="1 gün ileri"
                            >
                                <span className="material-symbols-outlined text-[13px]">chevron_right</span>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2 sm:gap-3 pr-3 sm:pr-4 pl-2">
                    {checkInDate && checkOutDate && (
                        <span className="text-[12.5px] font-medium text-[#5f6368] dark:text-slate-400 hidden sm:inline">
                            {Math.max(1, Math.round((new Date(checkOutDate) - new Date(checkInDate)) / (1000 * 60 * 60 * 24)))} {t('common.night', 'gece')}
                        </span>
                    )}
                    <button
                        type="button"
                        onClick={handleReset}
                        className="text-[13px] text-[#1a73e8] hover:text-[#1557b0] font-medium px-2.5 py-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors cursor-pointer"
                    >
                        {t('common.reset', 'Sıfırla')}
                    </button>
                </div>
            </div>

            {/* Calendars & Footer Body */}
            <GoogleFlightDatePickerBody
                checkInDate={checkInDate}
                checkOutDate={checkOutDate}
                onCheckInChange={onCheckInChange}
                onCheckOutChange={onCheckOutChange}
                activeField={activeField}
                setActiveField={setActiveField}
                holidays={holidays}
                countryCode={countryCode}
                onApply={(inD, outD) => handleCloseWithAnimation(inD, outD, true)}
            />
        </div>
    );
};

export default GoogleFlightDatePicker;
