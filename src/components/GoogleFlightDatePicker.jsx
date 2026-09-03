import React, { useState, useEffect, useRef, useMemo } from 'react';

// Turkish day names according to Google Flights: P, S, Ç, P, C, C, P (starts on Monday)
const DAY_HEADERS = ['P', 'S', 'Ç', 'P', 'C', 'C', 'P'];

const MONTH_NAMES_TR = [
    'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
];

const SHORT_MONTHS_TR = [
    'Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz',
    'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'
];

const SHORT_DAYS_TR = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];

export const formatGoogleFlightDate = (date) => {
    if (!date || isNaN(new Date(date).getTime())) return '';
    const d = new Date(date);
    const day = d.getDate();
    const month = SHORT_MONTHS_TR[d.getMonth()];
    const weekday = SHORT_DAYS_TR[d.getDay()];
    return `${day} ${month} ${weekday}`;
};

const isSameDay = (d1, d2) => {
    if (!d1 || !d2) return false;
    return (
        d1.getFullYear() === d2.getFullYear() &&
        d1.getMonth() === d2.getMonth() &&
        d1.getDate() === d2.getDate()
    );
};

const isBeforeDay = (d1, d2) => {
    if (!d1 || !d2) return false;
    const t1 = new Date(d1.getFullYear(), d1.getMonth(), d1.getDate()).getTime();
    const t2 = new Date(d2.getFullYear(), d2.getMonth(), d2.getDate()).getTime();
    return t1 < t2;
};

const isAfterDay = (d1, d2) => {
    if (!d1 || !d2) return false;
    const t1 = new Date(d1.getFullYear(), d1.getMonth(), d1.getDate()).getTime();
    const t2 = new Date(d2.getFullYear(), d2.getMonth(), d2.getDate()).getTime();
    return t1 > t2;
};

const GoogleFlightDatePicker = ({
    checkInDate,
    checkOutDate,
    onCheckInChange,
    onCheckOutChange,
    isOpen,
    onClose,
    activeField = 'checkIn', // 'checkIn' | 'checkOut'
    setActiveField,
    holidays = []
}) => {
    const popoverRef = useRef(null);

    // Visible base month (left month)
    const [viewDate, setViewDate] = useState(() => {
        const init = checkInDate ? new Date(checkInDate) : new Date();
        return new Date(init.getFullYear(), init.getMonth(), 1);
    });

    const [hoverDate, setHoverDate] = useState(null);

    // Sync viewDate when checkInDate changes and popover opens
    useEffect(() => {
        if (isOpen && checkInDate) {
            setViewDate(new Date(checkInDate.getFullYear(), checkInDate.getMonth(), 1));
        }
    }, [isOpen]);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (popoverRef.current && !popoverRef.current.contains(e.target)) {
                // If target is inside datepicker trigger container, don't close here
                if (e.target.closest('.google-flight-date-trigger')) return;
                onClose?.();
            }
        };
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen, onClose]);

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

        // Day of week: 0 = Sun, 1 = Mon ... We want Monday as index 0
        const startDayIndex = (firstDayOfMonth.getDay() + 6) % 7;
        const totalDays = lastDayOfMonth.getDate();

        const cells = [];
        // Empty slots before 1st of month
        for (let i = 0; i < startDayIndex; i++) {
            cells.push(null);
        }
        // Actual month days
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
            if (!checkOutDate || !isAfterDay(checkOutDate, date)) {
                const next = new Date(date);
                next.setDate(next.getDate() + 1);
                onCheckOutChange(next);
            }
            setActiveField('checkOut');
        } else {
            // activeField === 'checkOut'
            if (checkInDate && isBeforeDay(date, checkInDate)) {
                // If user clicks a date before checkin, make it the new checkin
                onCheckInChange(date);
                const next = new Date(date);
                next.setDate(next.getDate() + 1);
                onCheckOutChange(next);
            } else if (checkInDate && isSameDay(date, checkInDate)) {
                // Same day not allowed for checkout, make next day
                const next = new Date(date);
                next.setDate(next.getDate() + 1);
                onCheckOutChange(next);
            } else {
                onCheckOutChange(date);
            }
        }
    };

    // Quick day increment / decrement for checkIn
    const stepCheckIn = (days) => {
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

    // Quick day increment / decrement for checkOut
    const stepCheckOut = (days) => {
        const current = checkOutDate || new Date(today.getTime() + 86400000);
        const target = new Date(current);
        target.setDate(target.getDate() + days);
        if (checkInDate && !isAfterDay(target, checkInDate)) return;

        onCheckOutChange(target);
    };

    const handleReset = () => {
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        onCheckInChange(today);
        onCheckOutChange(tomorrow);
        setActiveField('checkIn');
    };

    if (!isOpen) return null;

    // Render single calendar month
    const renderCalendarMonth = (monthDate, days) => {
        const monthTitle = MONTH_NAMES_TR[monthDate.getMonth()];

        return (
            <div className="w-[280px] sm:w-[300px]">
                {/* Month title */}
                <h3 className="text-[15px] font-medium text-[#202124] dark:text-white text-center mb-4">
                    {monthTitle}
                </h3>

                {/* Day headers (P, S, Ç, P, C, C, P) */}
                <div className="grid grid-cols-7 mb-2">
                    {DAY_HEADERS.map((h, i) => (
                        <div key={i} className="text-center text-[11px] font-medium text-[#70757a] dark:text-slate-400">
                            {h}
                        </div>
                    ))}
                </div>

                {/* Days Grid */}
                <div className="grid grid-cols-7 gap-y-1">
                    {days.map((date, index) => {
                        if (!date) {
                            return <div key={`empty-${index}`} className="h-9" />;
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
                        const isHoliday = holidays?.some(h => (h.date === formattedIso || h.holidayDate === formattedIso));

                        let rangeClasses = '';
                        if (isInRange) {
                            rangeClasses = 'bg-[#e8f0fe] dark:bg-blue-900/30 text-[#1a73e8] dark:text-blue-300';
                        } else if (isStart && effectiveEnd) {
                            rangeClasses = 'rounded-l-full bg-gradient-to-r from-transparent to-[#e8f0fe] dark:to-blue-900/30';
                        } else if (isEnd && checkInDate) {
                            rangeClasses = 'rounded-r-full bg-gradient-to-l from-transparent to-[#e8f0fe] dark:to-blue-900/30';
                        }

                        return (
                            <div
                                key={date.toISOString()}
                                className={`h-9 flex items-center justify-center relative ${rangeClasses}`}
                                onMouseEnter={() => !isPast && setHoverDate(date)}
                            >
                                <button
                                    type="button"
                                    disabled={isPast}
                                    onClick={() => handleDayClick(date)}
                                    className={`size-9 flex items-center justify-center text-[13px] font-medium transition-all relative z-10 ${
                                        isStart || isEnd
                                            ? 'bg-[#1a73e8] text-white rounded-full shadow-sm font-semibold'
                                            : isPast
                                            ? 'text-slate-300 dark:text-slate-600 cursor-not-allowed'
                                            : 'text-[#3c4043] dark:text-slate-200 hover:bg-[#f1f3f4] dark:hover:bg-slate-700 rounded-full'
                                    }`}
                                >
                                    {date.getDate()}
                                    {isHoliday && !isStart && !isEnd && (
                                        <span className="absolute bottom-1 size-1 rounded-full bg-emerald-500" />
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
        <div
            ref={popoverRef}
            className="absolute top-[calc(100%+8px)] right-0 bg-white dark:bg-[#202124] rounded-2xl shadow-[0_4px_16px_rgba(0,0,0,0.18)] border border-[#dadce0] dark:border-slate-700 z-[300] p-6 animate-in fade-in zoom-in-95 duration-150"
            style={{ minWidth: '640px', maxWidth: '720px' }}
        >
            {/* --- Top Bar (Sıfırla on left, Twin Date boxes on right) --- */}
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#dadce0] dark:border-slate-700">
                {/* Reset button */}
                <button
                    type="button"
                    onClick={handleReset}
                    className="text-[14px] text-[#1a73e8] hover:text-[#1557b0] font-medium px-2 py-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                >
                    Sıfırla
                </button>

                {/* Twin Date Inputs in Popover Header (matching Google Flights) */}
                <div className="flex items-center border border-[#dadce0] dark:border-slate-600 rounded-md bg-white dark:bg-[#303134] overflow-hidden">
                    {/* Check-In Cell */}
                    <div
                        onClick={() => setActiveField('checkIn')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 cursor-pointer transition-colors ${
                            activeField === 'checkIn'
                                ? 'ring-2 ring-[#1a73e8] bg-blue-50/40 dark:bg-blue-950/20 rounded-l-md z-10'
                                : 'hover:bg-[#f1f3f4] dark:hover:bg-slate-700'
                        }`}
                    >
                        <span className="material-symbols-outlined text-[18px] text-[#5f6368] dark:text-slate-400">
                            calendar_today
                        </span>
                        <span className="text-[13px] font-medium text-[#202124] dark:text-white whitespace-nowrap min-w-[70px]">
                            {formatGoogleFlightDate(checkInDate) || 'Tarih seçin'}
                        </span>
                        {/* Quick increment/decrement arrows */}
                        <div className="flex items-center text-[#5f6368] dark:text-slate-400 ml-1">
                            <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); stepCheckIn(-1); }}
                                className="hover:bg-slate-200 dark:hover:bg-slate-600 p-0.5 rounded"
                                title="1 gün geri"
                            >
                                <span className="material-symbols-outlined text-[14px]">chevron_left</span>
                            </button>
                            <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); stepCheckIn(1); }}
                                className="hover:bg-slate-200 dark:hover:bg-slate-600 p-0.5 rounded"
                                title="1 gün ileri"
                            >
                                <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                            </button>
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="w-[1px] h-6 bg-[#dadce0] dark:bg-slate-600" />

                    {/* Check-Out Cell */}
                    <div
                        onClick={() => setActiveField('checkOut')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 cursor-pointer transition-colors ${
                            activeField === 'checkOut'
                                ? 'ring-2 ring-[#1a73e8] bg-blue-50/40 dark:bg-blue-950/20 rounded-r-md z-10'
                                : 'hover:bg-[#f1f3f4] dark:hover:bg-slate-700'
                        }`}
                    >
                        <span className="text-[13px] font-medium text-[#202124] dark:text-white whitespace-nowrap min-w-[70px]">
                            {formatGoogleFlightDate(checkOutDate) || 'Tarih seçin'}
                        </span>
                        {/* Quick increment/decrement arrows */}
                        <div className="flex items-center text-[#5f6368] dark:text-slate-400 ml-1">
                            <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); stepCheckOut(-1); }}
                                className="hover:bg-slate-200 dark:hover:bg-slate-600 p-0.5 rounded"
                                title="1 gün geri"
                            >
                                <span className="material-symbols-outlined text-[14px]">chevron_left</span>
                            </button>
                            <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); stepCheckOut(1); }}
                                className="hover:bg-slate-200 dark:hover:bg-slate-600 p-0.5 rounded"
                                title="1 gün ileri"
                            >
                                <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- 2 Months Grid (Left & Right) with Floating Arrow --- */}
            <div className="relative flex items-start justify-center gap-10">
                {/* Prev Month Floating Button */}
                <button
                    type="button"
                    onClick={handlePrevMonth}
                    disabled={isBeforeDay(new Date(viewDate.getFullYear(), viewDate.getMonth(), 1), new Date(today.getFullYear(), today.getMonth(), 1))}
                    className="absolute -left-3 top-0 size-9 rounded-full bg-white dark:bg-[#303134] border border-[#dadce0] dark:border-slate-600 shadow-md flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed z-20 transition-all text-[#5f6368] dark:text-slate-300"
                    title="Önceki ay"
                >
                    <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                </button>

                {/* Left Month */}
                {renderCalendarMonth(leftMonth, leftDays)}

                {/* Right Month */}
                {renderCalendarMonth(rightMonth, rightDays)}

                {/* Next Month Floating Button */}
                <button
                    type="button"
                    onClick={handleNextMonth}
                    className="absolute -right-3 top-0 size-9 rounded-full bg-white dark:bg-[#303134] border border-[#dadce0] dark:border-slate-600 shadow-md flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-700 z-20 transition-all text-[#5f6368] dark:text-slate-300"
                    title="Sonraki ay"
                >
                    <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                </button>
            </div>

            {/* --- Footer (Bitti button on right) --- */}
            <div className="flex items-center justify-end pt-5 mt-4 border-t border-[#dadce0] dark:border-slate-700">
                <button
                    type="button"
                    onClick={onClose}
                    className="bg-[#1a73e8] hover:bg-[#1557b0] text-white rounded-full font-medium text-[14px] px-7 py-2 transition-all shadow-sm active:scale-95"
                >
                    Bitti
                </button>
            </div>
        </div>
    );
};

export default GoogleFlightDatePicker;
