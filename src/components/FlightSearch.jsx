import React, { useState, useRef, useEffect } from 'react';
import GoogleFlightDatePicker from './GoogleFlightDatePicker';

const TRIP_TYPES = [
    { id: 'round_trip', label: 'Gidiş dönüş', icon: 'sync_alt' },
    { id: 'one_way', label: 'Tek yön', icon: 'arrow_right_alt' },
    { id: 'multi_city', label: 'Birden fazla şehir', icon: 'alt_route' }
];

const CABIN_CLASSES = [
    { id: 'economy', label: 'Ekonomi' },
    { id: 'premium_economy', label: 'Premium ekonomi' },
    { id: 'business', label: 'Business' },
    { id: 'first', label: 'First' }
];

const FlightSearch = ({ onSearch }) => {
    // Top dropdown states
    const [tripType, setTripType] = useState(TRIP_TYPES[0]);
    const [showTripTypeDropdown, setShowTripTypeDropdown] = useState(false);

    const [cabinClass, setCabinClass] = useState(CABIN_CLASSES[0]);
    const [showCabinDropdown, setShowCabinDropdown] = useState(false);

    // Passenger count state (with draft state for cancel/done)
    const [passengers, setPassengers] = useState({ adults: 1, children: 0, infantsInSeat: 0, infantsOnLap: 0 });
    const [draftPassengers, setDraftPassengers] = useState({ adults: 1, children: 0, infantsInSeat: 0, infantsOnLap: 0 });
    const [showPassengerDropdown, setShowPassengerDropdown] = useState(false);

    // Location inputs & focus state
    const [origin, setOrigin] = useState('');
    const [destination, setDestination] = useState('İstanbul');
    const [focusedInput, setFocusedInput] = useState(null);

    // Date state
    const today = new Date();
    const defaultCheckIn = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    const defaultCheckOut = new Date(today.getTime() + 8 * 24 * 60 * 60 * 1000);
    const [departureDate, setDepartureDate] = useState(defaultCheckIn);
    const [returnDate, setReturnDate] = useState(defaultCheckOut);
    const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
    const [activeDateField, setActiveDateField] = useState('checkIn');

    // Search state
    const [hasSearched, setHasSearched] = useState(false);

    // Refs for outside click
    const tripTypeRef = useRef(null);
    const passengerRef = useRef(null);
    const cabinRef = useRef(null);

    const totalPassengers = passengers.adults + passengers.children + passengers.infantsInSeat + passengers.infantsOnLap;

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (tripTypeRef.current && !tripTypeRef.current.contains(e.target)) setShowTripTypeDropdown(false);
            if (passengerRef.current && !passengerRef.current.contains(e.target)) setShowPassengerDropdown(false);
            if (cabinRef.current && !cabinRef.current.contains(e.target)) setShowCabinDropdown(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const formatGoogleFlightDate = (date) => {
        if (!date) return '';
        const day = date.getDate();
        const months = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
        const days = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
        return `${day} ${months[date.getMonth()]} ${days[date.getDay()]}`;
    };

    const stepDeparture = (days) => {
        setDepartureDate(prev => {
            const d = new Date(prev || today);
            d.setDate(d.getDate() + days);
            return d;
        });
    };

    const stepReturn = (days) => {
        setReturnDate(prev => {
            const d = new Date(prev || today);
            d.setDate(d.getDate() + days);
            return d;
        });
    };

    // Swap Origin and Destination
    const handleSwap = () => {
        const temp = origin;
        setOrigin(destination);
        setDestination(temp);
    };

    const handleSearchClick = () => {
        setHasSearched(true);
        if (onSearch) onSearch();
    };

    return (
        <section className="relative group/search w-full flex flex-col items-center">
            <div className="relative w-full max-w-[1024px] bg-white dark:bg-[#202124] rounded-lg shadow-[0_1px_3px_0_rgba(60,64,67,0.3),0_4px_8px_3px_rgba(60,64,67,0.15)] px-4 pt-2 pb-10 border-none transition-all duration-300">
                
                {/* Top Options Bar (Trip Type, Passengers, Cabin Class) */}
                <div className="flex flex-wrap items-center gap-1 sm:gap-2 mb-3 relative z-[60]">
                    
                    {/* 1. Trip Type Dropdown (Google Flights Style) */}
                    <div className="relative" ref={tripTypeRef}>
                        <button
                            type="button"
                            onClick={() => {
                                setShowTripTypeDropdown(!showTripTypeDropdown);
                                setShowPassengerDropdown(false);
                                setShowCabinDropdown(false);
                            }}
                            className={`flex items-center gap-1.5 px-3 py-1.5 font-normal text-[13px] transition-colors cursor-pointer select-none ${
                                showTripTypeDropdown
                                    ? 'bg-[#e8f0fe] text-[#1a73e8] dark:bg-[#1a73e8]/20 dark:text-[#8ab4f8] rounded-t border-b-2 border-[#1a73e8]'
                                    : 'text-[#70757a] dark:text-slate-300 hover:text-[#202124] hover:bg-[#f1f3f4] dark:hover:bg-[#303134] rounded border-b-2 border-transparent'
                            }`}
                        >
                            <span className={`material-symbols-outlined text-[18px] ${showTripTypeDropdown ? 'text-[#1a73e8] dark:text-[#8ab4f8]' : 'text-[#70757a] dark:text-slate-400'}`}>{tripType.icon}</span>
                            <span>{tripType.label}</span>
                            <span className={`material-symbols-outlined text-[18px] ${showTripTypeDropdown ? 'text-[#1a73e8] dark:text-[#8ab4f8]' : 'text-[#70757a] dark:text-slate-400'}`}>
                                {showTripTypeDropdown ? 'arrow_drop_up' : 'arrow_drop_down'}
                            </span>
                        </button>

                        {showTripTypeDropdown && (
                            <div className="absolute top-full left-0 mt-0 w-52 bg-white dark:bg-[#202124] rounded-b-lg rounded-tr-lg border border-[#dadce0] dark:border-[#3c4043] shadow-[0_2px_6px_2px_rgba(60,64,67,0.15),0_1px_2px_0_rgba(60,64,67,0.3)] py-1.5 z-[200] animate-in fade-in duration-150">
                                {TRIP_TYPES.map(t => {
                                    const isSelected = tripType.id === t.id;
                                    return (
                                        <button
                                            key={t.id}
                                            type="button"
                                            onClick={() => {
                                                setTripType(t);
                                                setShowTripTypeDropdown(false);
                                            }}
                                            className={`w-full py-2.5 pr-4 flex items-center text-left text-[13px] font-normal cursor-pointer transition-colors ${
                                                isSelected
                                                    ? 'bg-[#e8f0fe] dark:bg-[#1a73e8]/20 text-[#202124] dark:text-white'
                                                    : 'text-[#3c4043] dark:text-slate-200 hover:bg-[#f1f3f4] dark:hover:bg-[#303134]'
                                            }`}
                                        >
                                            <div className="w-9 flex items-center justify-center flex-shrink-0">
                                                {isSelected && (
                                                    <span className="material-symbols-outlined text-[18px] text-[#3c4043] dark:text-slate-200">
                                                        check
                                                    </span>
                                                )}
                                            </div>
                                            <span className="truncate">{t.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* 2. Passenger Dropdown (Google Flights Style) */}
                    <div className="relative" ref={passengerRef}>
                        <button
                            type="button"
                            onClick={() => {
                                if (!showPassengerDropdown) {
                                    setDraftPassengers({ ...passengers });
                                    setShowPassengerDropdown(true);
                                    setShowTripTypeDropdown(false);
                                    setShowCabinDropdown(false);
                                } else {
                                    setShowPassengerDropdown(false);
                                }
                            }}
                            className={`flex items-center gap-1.5 px-3 py-1.5 font-normal text-[13px] transition-colors cursor-pointer select-none ${
                                showPassengerDropdown
                                    ? 'bg-[#e8f0fe] text-[#1a73e8] dark:bg-[#1a73e8]/20 dark:text-[#8ab4f8] rounded-t border-b-2 border-[#1a73e8]'
                                    : 'text-[#70757a] dark:text-slate-300 hover:text-[#202124] hover:bg-[#f1f3f4] dark:hover:bg-[#303134] rounded border-b-2 border-transparent'
                            }`}
                        >
                            <span className={`material-symbols-outlined text-[18px] ${showPassengerDropdown ? 'text-[#1a73e8] dark:text-[#8ab4f8]' : 'text-[#70757a] dark:text-slate-400'}`}>person</span>
                            <span>{totalPassengers}</span>
                            <span className={`material-symbols-outlined text-[18px] ${showPassengerDropdown ? 'text-[#1a73e8] dark:text-[#8ab4f8]' : 'text-[#70757a] dark:text-slate-400'}`}>
                                {showPassengerDropdown ? 'arrow_drop_up' : 'arrow_drop_down'}
                            </span>
                        </button>

                        {showPassengerDropdown && (
                            <div className="absolute top-full left-0 mt-0 w-80 sm:w-[340px] bg-white dark:bg-[#202124] rounded-b-lg rounded-tr-lg border border-[#dadce0] dark:border-[#3c4043] shadow-[0_2px_6px_2px_rgba(60,64,67,0.15),0_1px_2px_0_rgba(60,64,67,0.3)] p-4 sm:p-5 z-[200] animate-in fade-in duration-150 space-y-4">
                                {/* 1. Yetişkin */}
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="text-[13px] font-normal text-[#202124] dark:text-white">Yetişkin</div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            disabled={draftPassengers.adults <= 1}
                                            onClick={() => setDraftPassengers(p => ({
                                                ...p,
                                                adults: Math.max(1, p.adults - 1),
                                                infantsOnLap: Math.min(p.infantsOnLap, Math.max(1, p.adults - 1))
                                            }))}
                                            className="size-8 rounded-[4px] flex items-center justify-center transition-colors select-none disabled:bg-[#f1f3f4] disabled:text-[#bdc1c6] dark:disabled:bg-slate-800 dark:disabled:text-slate-600 disabled:cursor-not-allowed bg-[#e8f0fe] text-[#1a73e8] hover:bg-[#d2e3fc] dark:bg-[#1a73e8]/20 dark:text-[#8ab4f8] cursor-pointer"
                                        >
                                            <span className="material-symbols-outlined text-[18px]">remove</span>
                                        </button>
                                        <span className="w-8 text-center text-[13px] font-normal text-[#202124] dark:text-white">{draftPassengers.adults}</span>
                                        <button
                                            type="button"
                                            disabled={draftPassengers.adults >= 9}
                                            onClick={() => setDraftPassengers(p => ({ ...p, adults: p.adults + 1 }))}
                                            className="size-8 rounded-[4px] flex items-center justify-center transition-colors select-none disabled:bg-[#f1f3f4] disabled:text-[#bdc1c6] dark:disabled:bg-slate-800 dark:disabled:text-slate-600 disabled:cursor-not-allowed bg-[#e8f0fe] text-[#1a73e8] hover:bg-[#d2e3fc] dark:bg-[#1a73e8]/20 dark:text-[#8ab4f8] cursor-pointer"
                                        >
                                            <span className="material-symbols-outlined text-[18px]">add</span>
                                        </button>
                                    </div>
                                </div>

                                {/* 2. Çocuk Sayısı (2-11 Yaş Arası) */}
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="text-[11px] text-[#70757a] dark:text-slate-400 leading-tight">2-11 Yaş Arası</div>
                                        <div className="text-[13px] font-normal text-[#202124] dark:text-white">Çocuk Sayısı</div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            disabled={draftPassengers.children <= 0}
                                            onClick={() => setDraftPassengers(p => ({ ...p, children: Math.max(0, p.children - 1) }))}
                                            className="size-8 rounded-[4px] flex items-center justify-center transition-colors select-none disabled:bg-[#f1f3f4] disabled:text-[#bdc1c6] dark:disabled:bg-slate-800 dark:disabled:text-slate-600 disabled:cursor-not-allowed bg-[#e8f0fe] text-[#1a73e8] hover:bg-[#d2e3fc] dark:bg-[#1a73e8]/20 dark:text-[#8ab4f8] cursor-pointer"
                                        >
                                            <span className="material-symbols-outlined text-[18px]">remove</span>
                                        </button>
                                        <span className="w-8 text-center text-[13px] font-normal text-[#202124] dark:text-white">{draftPassengers.children}</span>
                                        <button
                                            type="button"
                                            disabled={draftPassengers.children >= 9}
                                            onClick={() => setDraftPassengers(p => ({ ...p, children: p.children + 1 }))}
                                            className="size-8 rounded-[4px] flex items-center justify-center transition-colors select-none disabled:bg-[#f1f3f4] disabled:text-[#bdc1c6] dark:disabled:bg-slate-800 dark:disabled:text-slate-600 disabled:cursor-not-allowed bg-[#e8f0fe] text-[#1a73e8] hover:bg-[#d2e3fc] dark:bg-[#1a73e8]/20 dark:text-[#8ab4f8] cursor-pointer"
                                        >
                                            <span className="material-symbols-outlined text-[18px]">add</span>
                                        </button>
                                    </div>
                                </div>

                                {/* 3. Koltukta Yolculuk Edecek Bebek Sayısı */}
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="text-[11px] text-[#70757a] dark:text-slate-400 leading-tight">Koltukta</div>
                                        <div className="text-[13px] font-normal text-[#202124] dark:text-white">Yolculuk Edecek Bebek Sayısı</div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            disabled={draftPassengers.infantsInSeat <= 0}
                                            onClick={() => setDraftPassengers(p => ({ ...p, infantsInSeat: Math.max(0, p.infantsInSeat - 1) }))}
                                            className="size-8 rounded-[4px] flex items-center justify-center transition-colors select-none disabled:bg-[#f1f3f4] disabled:text-[#bdc1c6] dark:disabled:bg-slate-800 dark:disabled:text-slate-600 disabled:cursor-not-allowed bg-[#e8f0fe] text-[#1a73e8] hover:bg-[#d2e3fc] dark:bg-[#1a73e8]/20 dark:text-[#8ab4f8] cursor-pointer"
                                        >
                                            <span className="material-symbols-outlined text-[18px]">remove</span>
                                        </button>
                                        <span className="w-8 text-center text-[13px] font-normal text-[#202124] dark:text-white">{draftPassengers.infantsInSeat}</span>
                                        <button
                                            type="button"
                                            disabled={draftPassengers.infantsInSeat >= 9}
                                            onClick={() => setDraftPassengers(p => ({ ...p, infantsInSeat: p.infantsInSeat + 1 }))}
                                            className="size-8 rounded-[4px] flex items-center justify-center transition-colors select-none disabled:bg-[#f1f3f4] disabled:text-[#bdc1c6] dark:disabled:bg-slate-800 dark:disabled:text-slate-600 disabled:cursor-not-allowed bg-[#e8f0fe] text-[#1a73e8] hover:bg-[#d2e3fc] dark:bg-[#1a73e8]/20 dark:text-[#8ab4f8] cursor-pointer"
                                        >
                                            <span className="material-symbols-outlined text-[18px]">add</span>
                                        </button>
                                    </div>
                                </div>

                                {/* 4. Kucakta yolculuk yapacak bebek sayısı */}
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="text-[11px] text-[#70757a] dark:text-slate-400 leading-tight">Kucakta</div>
                                        <div className="text-[13px] font-normal text-[#202124] dark:text-white">yolculuk yapacak bebek sayısı</div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            disabled={draftPassengers.infantsOnLap <= 0}
                                            onClick={() => setDraftPassengers(p => ({ ...p, infantsOnLap: Math.max(0, p.infantsOnLap - 1) }))}
                                            className="size-8 rounded-[4px] flex items-center justify-center transition-colors select-none disabled:bg-[#f1f3f4] disabled:text-[#bdc1c6] dark:disabled:bg-slate-800 dark:disabled:text-slate-600 disabled:cursor-not-allowed bg-[#e8f0fe] text-[#1a73e8] hover:bg-[#d2e3fc] dark:bg-[#1a73e8]/20 dark:text-[#8ab4f8] cursor-pointer"
                                        >
                                            <span className="material-symbols-outlined text-[18px]">remove</span>
                                        </button>
                                        <span className="w-8 text-center text-[13px] font-normal text-[#202124] dark:text-white">{draftPassengers.infantsOnLap}</span>
                                        <button
                                            type="button"
                                            disabled={draftPassengers.infantsOnLap >= draftPassengers.adults}
                                            onClick={() => setDraftPassengers(p => ({ ...p, infantsOnLap: p.infantsOnLap + 1 }))}
                                            className="size-8 rounded-[4px] flex items-center justify-center transition-colors select-none disabled:bg-[#f1f3f4] disabled:text-[#bdc1c6] dark:disabled:bg-slate-800 dark:disabled:text-slate-600 disabled:cursor-not-allowed bg-[#e8f0fe] text-[#1a73e8] hover:bg-[#d2e3fc] dark:bg-[#1a73e8]/20 dark:text-[#8ab4f8] cursor-pointer"
                                        >
                                            <span className="material-symbols-outlined text-[18px]">add</span>
                                        </button>
                                    </div>
                                </div>

                                {/* Footer: İptal / Bitti */}
                                <div className="flex items-center justify-end gap-2 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowPassengerDropdown(false)}
                                        className="px-4 py-1.5 text-[13px] font-medium text-[#1a73e8] dark:text-[#8ab4f8] hover:bg-[#f8fafd] dark:hover:bg-[#303134] rounded cursor-pointer transition-colors"
                                    >
                                        İptal
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setPassengers({ ...draftPassengers });
                                            setShowPassengerDropdown(false);
                                        }}
                                        className="px-4 py-1.5 text-[13px] font-medium text-[#1a73e8] dark:text-[#8ab4f8] hover:bg-[#f8fafd] dark:hover:bg-[#303134] rounded cursor-pointer transition-colors"
                                    >
                                        Bitti
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* 3. Cabin Class Dropdown (Google Flights Style) */}
                    <div className="relative" ref={cabinRef}>
                        <button
                            type="button"
                            onClick={() => {
                                setShowCabinDropdown(!showCabinDropdown);
                                setShowTripTypeDropdown(false);
                                setShowPassengerDropdown(false);
                            }}
                            className={`flex items-center gap-1 px-3 py-1.5 font-normal text-[13px] transition-colors cursor-pointer select-none ${
                                showCabinDropdown
                                    ? 'bg-[#e8f0fe] text-[#1a73e8] dark:bg-[#1a73e8]/20 dark:text-[#8ab4f8] rounded-t border-b-2 border-[#1a73e8]'
                                    : 'text-[#70757a] dark:text-slate-300 hover:text-[#202124] hover:bg-[#f1f3f4] dark:hover:bg-[#303134] rounded border-b-2 border-transparent'
                            }`}
                        >
                            <span>{cabinClass.label}</span>
                            <span className={`material-symbols-outlined text-[18px] ${showCabinDropdown ? 'text-[#1a73e8] dark:text-[#8ab4f8]' : 'text-[#70757a] dark:text-slate-400'}`}>
                                {showCabinDropdown ? 'arrow_drop_up' : 'arrow_drop_down'}
                            </span>
                        </button>

                        {showCabinDropdown && (
                            <div className="absolute top-full left-0 mt-0 w-52 bg-white dark:bg-[#202124] rounded-b-lg rounded-tr-lg border border-[#dadce0] dark:border-[#3c4043] shadow-[0_2px_6px_2px_rgba(60,64,67,0.15),0_1px_2px_0_rgba(60,64,67,0.3)] py-1.5 z-[200] animate-in fade-in duration-150">
                                {CABIN_CLASSES.map(c => {
                                    const isSelected = cabinClass.id === c.id;
                                    return (
                                        <button
                                            key={c.id}
                                            type="button"
                                            onClick={() => {
                                                setCabinClass(c);
                                                setShowCabinDropdown(false);
                                            }}
                                            className={`w-full py-2.5 pr-4 flex items-center text-left text-[13px] font-normal cursor-pointer transition-colors ${
                                                isSelected
                                                    ? 'bg-[#e8f0fe] dark:bg-[#1a73e8]/20 text-[#202124] dark:text-white'
                                                    : 'text-[#3c4043] dark:text-slate-200 hover:bg-[#f1f3f4] dark:hover:bg-[#303134]'
                                            }`}
                                        >
                                            <div className="w-9 flex items-center justify-center flex-shrink-0">
                                                {isSelected && (
                                                    <span className="material-symbols-outlined text-[18px] text-[#3c4043] dark:text-slate-200">
                                                        check
                                                    </span>
                                                )}
                                            </div>
                                            <span className="truncate">{c.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Main Search Row (From/To Connected Dual Box + Datepicker Dual Box) */}
                <div className="w-full flex flex-col lg:flex-row items-stretch gap-2.5 sm:gap-3 relative z-50">
                    
                    {/* Dual Box: Origin & Destination with Swap Button */}
                    <div className="flex-1 min-w-0 relative flex items-center">
                        
                        {/* Origin Box */}
                        <div
                            className={`flex-1 h-14 flex items-center bg-white dark:bg-[#303134] transition-all px-3.5 sm:px-4 pr-11 sm:pr-12 font-roboto ${
                                focusedInput === 'origin'
                                    ? 'border-2 border-[#1a73e8] rounded-[4px] z-10'
                                    : 'border border-[#dadce0] dark:border-slate-600 rounded-l-[4px] hover:border-[#bdc1c6]'
                            }`}
                        >
                            <span className="material-symbols-outlined text-[18px] text-[#70757a] dark:text-slate-400 mr-3 flex-shrink-0">radio_button_unchecked</span>
                            <input
                                type="text"
                                placeholder="Nereden?"
                                value={origin}
                                onFocus={() => setFocusedInput('origin')}
                                onBlur={() => setFocusedInput(null)}
                                onChange={(e) => setOrigin(e.target.value)}
                                className="w-full bg-transparent border-none outline-none focus:outline-none focus:ring-0 p-0 text-[14px] font-normal text-[#202124] dark:text-white placeholder-[#70757a] dark:placeholder-slate-400 truncate tracking-normal leading-normal"
                            />
                        </div>

                        {/* Circular Swap Button */}
                        <div className="absolute left-1/2 -translate-x-1/2 z-20">
                            <button
                                type="button"
                                onClick={handleSwap}
                                className="w-9 h-9 rounded-full bg-white dark:bg-[#303134] border border-[#dadce0] dark:border-slate-600 hover:bg-[#f8fafd] dark:hover:bg-slate-700 shadow-[0_1px_2px_0_rgba(60,64,67,0.3)] flex items-center justify-center text-[#70757a] dark:text-slate-300 transition-transform active:rotate-180 duration-300 cursor-pointer"
                                title="Kalkış ve varış yerini değiştir"
                            >
                                <span className="material-symbols-outlined text-[18px]">sync_alt</span>
                            </button>
                        </div>

                        {/* Destination Box - with generous pl-11 to pl-12 for Google Flights icon/text spacing */}
                        <div
                            className={`flex-1 h-14 flex items-center bg-white dark:bg-[#303134] transition-all px-3.5 sm:px-4 pl-11 sm:pl-12 font-roboto ${
                                focusedInput === 'destination'
                                    ? 'border-2 border-[#1a73e8] rounded-[4px] z-10'
                                    : 'border border-l-0 border-[#dadce0] dark:border-slate-600 rounded-r-[4px] hover:border-[#bdc1c6]'
                            }`}
                        >
                            <span className="material-symbols-outlined text-[18px] text-[#70757a] dark:text-slate-400 mr-3 flex-shrink-0">location_on</span>
                            <input
                                type="text"
                                placeholder="Nereye?"
                                value={destination}
                                onFocus={() => setFocusedInput('destination')}
                                onBlur={() => setFocusedInput(null)}
                                onChange={(e) => setDestination(e.target.value)}
                                className="w-full bg-transparent border-none outline-none focus:outline-none focus:ring-0 p-0 text-[14px] font-normal text-[#202124] dark:text-white placeholder-[#70757a] dark:placeholder-slate-400 truncate tracking-normal leading-normal"
                            />
                        </div>
                    </div>

                    {/* Twin Datepicker Container (Google Flights style) */}
                    <div className={`w-full lg:w-[360px] flex-shrink-0 relative h-14 bg-white dark:bg-[#303134] flex items-center google-flight-date-trigger font-roboto ${
                        isDatePickerOpen && (activeDateField === 'checkIn' || activeDateField === 'checkOut')
                            ? ''
                            : 'border border-[#dadce0] dark:border-slate-600 rounded-[4px] hover:border-[#bdc1c6] transition-all'
                    }`}>
                        
                        {/* Departure Date Half */}
                        <div
                            onClick={() => {
                                setActiveDateField('checkIn');
                                setIsDatePickerOpen(true);
                            }}
                            className={`relative flex-1 h-full flex items-center justify-between px-3 sm:px-3.5 cursor-pointer transition-colors min-w-0 ${
                                isDatePickerOpen && activeDateField === 'checkIn'
                                    ? 'border-2 border-[#1a73e8] rounded-[4px] z-10 bg-white dark:bg-[#303134]'
                                    : isDatePickerOpen && activeDateField === 'checkOut'
                                    ? 'border border-[#dadce0] dark:border-slate-600 border-r-0 rounded-l-[4px] hover:bg-slate-50 dark:hover:bg-slate-700/40'
                                    : 'rounded-l-[4px] hover:bg-slate-50 dark:hover:bg-slate-700/40'
                            }`}
                        >
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                                <span className="material-symbols-outlined text-[18px] text-[#70757a] dark:text-slate-400 flex-shrink-0">
                                    calendar_today
                                </span>
                                <span className="text-[13px] font-normal text-[#3c4043] dark:text-white truncate">
                                    {formatGoogleFlightDate(departureDate) || 'Gidiş'}
                                </span>
                            </div>

                            <div className="flex items-center text-[#70757a] dark:text-slate-400 shrink-0 ml-1">
                                <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); stepDeparture(-1); }}
                                    className="hover:bg-slate-200 dark:hover:bg-slate-600 p-0.5 rounded transition-colors"
                                >
                                    <span className="material-symbols-outlined text-[15px]">chevron_left</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); stepDeparture(1); }}
                                    className="hover:bg-slate-200 dark:hover:bg-slate-600 p-0.5 rounded transition-colors"
                                >
                                    <span className="material-symbols-outlined text-[15px]">chevron_right</span>
                                </button>
                            </div>
                        </div>

                        {/* Divider (only visible when neither half is actively focused) */}
                        {!(isDatePickerOpen && (activeDateField === 'checkIn' || activeDateField === 'checkOut')) && (
                            <div className="w-[1px] h-6 bg-[#dadce0] dark:bg-slate-600 flex-shrink-0" />
                        )}

                        {/* Return Date Half (Disabled if one_way) */}
                        {tripType.id !== 'one_way' ? (
                            <div
                                onClick={() => {
                                    setActiveDateField('checkOut');
                                    setIsDatePickerOpen(true);
                                }}
                                className={`relative flex-1 h-full flex items-center justify-between px-3 sm:px-3.5 cursor-pointer transition-colors min-w-0 ${
                                    isDatePickerOpen && activeDateField === 'checkOut'
                                        ? 'border-2 border-[#1a73e8] rounded-[4px] z-10 bg-white dark:bg-[#303134]'
                                        : isDatePickerOpen && activeDateField === 'checkIn'
                                        ? 'border border-[#dadce0] dark:border-slate-600 border-l-0 rounded-r-[4px] hover:bg-slate-50 dark:hover:bg-slate-700/40'
                                        : 'rounded-r-[4px] hover:bg-slate-50 dark:hover:bg-slate-700/40'
                                }`}
                            >
                                <div className="flex items-center min-w-0 flex-1">
                                    <span className="text-[13px] font-normal text-[#3c4043] dark:text-white truncate">
                                        {formatGoogleFlightDate(returnDate) || 'Dönüş'}
                                    </span>
                                </div>

                                <div className="flex items-center text-[#70757a] dark:text-slate-400 shrink-0 ml-1">
                                    <button
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); stepReturn(-1); }}
                                        className="hover:bg-slate-200 dark:hover:bg-slate-600 p-0.5 rounded transition-colors"
                                    >
                                        <span className="material-symbols-outlined text-[15px]">chevron_left</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); stepReturn(1); }}
                                        className="hover:bg-slate-200 dark:hover:bg-slate-600 p-0.5 rounded transition-colors"
                                    >
                                        <span className="material-symbols-outlined text-[15px]">chevron_right</span>
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex-1 h-full flex items-center px-3 text-slate-400 text-xs italic">
                                Tek yön
                            </div>
                        )}

                        {/* Google Flights 2-Month Datepicker Popover */}
                        <GoogleFlightDatePicker
                            isOpen={isDatePickerOpen}
                            onClose={() => setIsDatePickerOpen(false)}
                            checkInDate={departureDate}
                            checkOutDate={returnDate}
                            onCheckInChange={setDepartureDate}
                            onCheckOutChange={setReturnDate}
                            activeField={activeDateField}
                            setActiveField={setActiveDateField}
                        />
                    </div>
                </div>

                {/* Overlapping Blue Search Button */}
                <div className="absolute left-1/2 bottom-0 -translate-x-1/2 translate-y-1/2 z-[30]">
                    <button
                        type="button"
                        onClick={handleSearchClick}
                        className="bg-[#1a73e8] hover:bg-[#1557b0] text-white rounded-full font-medium text-[14px] px-7 py-2.5 flex items-center justify-center gap-2 shadow-[0_1px_3px_0_rgba(60,64,67,0.3),0_4px_8px_3px_rgba(60,64,67,0.15)] hover:shadow-lg transition-all active:scale-95 cursor-pointer"
                    >
                        <span className="material-symbols-outlined text-[18px]">search</span>
                        <span>Ara</span>
                    </button>
                </div>
            </div>

            {/* Results Area (Service not ready - Empty State) */}
            {hasSearched && (
                <div className="w-full max-w-[1024px] mt-12 px-4 animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="bg-white dark:bg-[#202124] rounded-2xl border border-slate-200 dark:border-slate-800 p-10 text-center shadow-sm">
                        <div className="w-16 h-16 rounded-full bg-blue-50 dark:bg-blue-950/40 text-[#1a73e8] mx-auto flex items-center justify-center mb-4 shadow-inner">
                            <span className="material-symbols-outlined text-[32px]">flight_takeoff</span>
                        </div>
                        <h3 className="text-xl font-medium text-[#202124] dark:text-white mb-2">
                            Uçuş Servisleri Hazırlanıyor
                        </h3>
                        <p className="text-sm text-[#5f6368] dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                            {origin || 'Seçilen kalkış'} &rarr; {destination || 'Seçilen varış'} için uçuş arama ve biletleme entegrasyonumuz çok yakında aktif olacaktır.
                        </p>
                    </div>
                </div>
            )}
        </section>
    );
};

export default FlightSearch;
