import React, { useState, useRef, useEffect } from 'react';
import GoogleFlightDatePicker from './GoogleFlightDatePicker';

const TRIP_TYPES = [
    { id: 'round_trip', label: 'Gidiş dönüş', icon: 'sync_alt' },
    { id: 'one_way', label: 'Tek yön', icon: 'arrow_right_alt' },
    { id: 'multi_city', label: 'Çoklu uçuş', icon: 'alt_route' }
];

const CABIN_CLASSES = [
    { id: 'economy', label: 'Ekonomi' },
    { id: 'premium_economy', label: 'Premium Ekonomi' },
    { id: 'business', label: 'Business' },
    { id: 'first', label: 'Birinci sınıf' }
];

const FlightSearch = ({ onSearch }) => {
    // Top dropdown states
    const [tripType, setTripType] = useState(TRIP_TYPES[0]);
    const [showTripTypeDropdown, setShowTripTypeDropdown] = useState(false);

    const [cabinClass, setCabinClass] = useState(CABIN_CLASSES[0]);
    const [showCabinDropdown, setShowCabinDropdown] = useState(false);

    // Passenger count state
    const [passengers, setPassengers] = useState({ adults: 1, children: 0, infantsOnLap: 0, infantsInSeat: 0 });
    const [showPassengerDropdown, setShowPassengerDropdown] = useState(false);

    // Location inputs
    const [origin, setOrigin] = useState('');
    const [destination, setDestination] = useState('İstanbul');

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

    const totalPassengers = passengers.adults + passengers.children + passengers.infantsOnLap + passengers.infantsInSeat;

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
                    
                    {/* 1. Trip Type Dropdown */}
                    <div className="relative" ref={tripTypeRef}>
                        <button
                            type="button"
                            onClick={() => setShowTripTypeDropdown(!showTripTypeDropdown)}
                            className="flex items-center gap-1.5 hover:bg-slate-100 dark:hover:bg-slate-700/50 px-2.5 py-1.5 rounded transition-colors text-[#3c4043] dark:text-slate-300 font-medium text-sm focus:outline-none"
                        >
                            <span className="material-symbols-outlined text-[18px]">{tripType.icon}</span>
                            <span>{tripType.label}</span>
                            <span className="material-symbols-outlined text-[18px] text-slate-500">arrow_drop_down</span>
                        </button>

                        {showTripTypeDropdown && (
                            <div className="absolute top-full left-0 mt-1 w-44 bg-white dark:bg-[#202124] rounded-lg border border-[#dadce0] dark:border-slate-700 shadow-lg py-1 z-[200] animate-in fade-in duration-150">
                                {TRIP_TYPES.map(t => (
                                    <button
                                        key={t.id}
                                        type="button"
                                        onClick={() => {
                                            setTripType(t);
                                            setShowTripTypeDropdown(false);
                                        }}
                                        className={`w-full px-3 py-2 text-left text-sm flex items-center justify-between hover:bg-[#f1f3f4] dark:hover:bg-slate-800 ${
                                            tripType.id === t.id ? 'text-[#1a73e8] font-medium bg-blue-50/50 dark:bg-blue-900/20' : 'text-[#3c4043] dark:text-slate-200'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <span className="material-symbols-outlined text-[18px]">{t.icon}</span>
                                            <span>{t.label}</span>
                                        </div>
                                        {tripType.id === t.id && <span className="material-symbols-outlined text-[18px] text-[#1a73e8]">check</span>}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* 2. Passenger Dropdown */}
                    <div className="relative" ref={passengerRef}>
                        <button
                            type="button"
                            onClick={() => setShowPassengerDropdown(!showPassengerDropdown)}
                            className="flex items-center gap-1.5 hover:bg-slate-100 dark:hover:bg-slate-700/50 px-2.5 py-1.5 rounded transition-colors text-[#3c4043] dark:text-slate-300 font-medium text-sm focus:outline-none"
                        >
                            <span className="material-symbols-outlined text-[18px]">person</span>
                            <span>{totalPassengers}</span>
                            <span className="material-symbols-outlined text-[18px] text-slate-500">arrow_drop_down</span>
                        </button>

                        {showPassengerDropdown && (
                            <div className="absolute top-full left-0 mt-1 w-72 bg-white dark:bg-[#202124] rounded-lg border border-[#dadce0] dark:border-slate-700 shadow-xl p-4 z-[200] animate-in fade-in duration-150 space-y-4">
                                {/* Adults */}
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="text-sm font-medium text-[#3c4043] dark:text-white">Yetişkinler</div>
                                        <div className="text-xs text-slate-500">12 yaş ve üzeri</div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            disabled={passengers.adults <= 1}
                                            onClick={() => setPassengers(p => ({ ...p, adults: Math.max(1, p.adults - 1) }))}
                                            className="w-8 h-8 rounded bg-[#e8f0fe] text-[#1a73e8] disabled:bg-slate-100 disabled:text-slate-400 dark:bg-blue-900/30 flex items-center justify-center"
                                        >
                                            <span className="material-symbols-outlined text-[18px]">remove</span>
                                        </button>
                                        <span className="w-6 text-center text-sm font-medium">{passengers.adults}</span>
                                        <button
                                            type="button"
                                            onClick={() => setPassengers(p => ({ ...p, adults: p.adults + 1 }))}
                                            className="w-8 h-8 rounded bg-[#e8f0fe] text-[#1a73e8] dark:bg-blue-900/30 flex items-center justify-center"
                                        >
                                            <span className="material-symbols-outlined text-[18px]">add</span>
                                        </button>
                                    </div>
                                </div>

                                {/* Children */}
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="text-sm font-medium text-[#3c4043] dark:text-white">Çocuklar</div>
                                        <div className="text-xs text-slate-500">2-11 yaş arası</div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            disabled={passengers.children <= 0}
                                            onClick={() => setPassengers(p => ({ ...p, children: Math.max(0, p.children - 1) }))}
                                            className="w-8 h-8 rounded bg-[#e8f0fe] text-[#1a73e8] disabled:bg-slate-100 disabled:text-slate-400 dark:bg-blue-900/30 flex items-center justify-center"
                                        >
                                            <span className="material-symbols-outlined text-[18px]">remove</span>
                                        </button>
                                        <span className="w-6 text-center text-sm font-medium">{passengers.children}</span>
                                        <button
                                            type="button"
                                            onClick={() => setPassengers(p => ({ ...p, children: p.children + 1 }))}
                                            className="w-8 h-8 rounded bg-[#e8f0fe] text-[#1a73e8] dark:bg-blue-900/30 flex items-center justify-center"
                                        >
                                            <span className="material-symbols-outlined text-[18px]">add</span>
                                        </button>
                                    </div>
                                </div>

                                <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                                    <button
                                        type="button"
                                        onClick={() => setShowPassengerDropdown(false)}
                                        className="text-sm font-medium text-[#1a73e8] hover:bg-blue-50 dark:hover:bg-blue-950/30 px-3 py-1.5 rounded transition-colors"
                                    >
                                        Bitti
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* 3. Cabin Class Dropdown */}
                    <div className="relative" ref={cabinRef}>
                        <button
                            type="button"
                            onClick={() => setShowCabinDropdown(!showCabinDropdown)}
                            className="flex items-center gap-1.5 hover:bg-slate-100 dark:hover:bg-slate-700/50 px-2.5 py-1.5 rounded transition-colors text-[#3c4043] dark:text-slate-300 font-medium text-sm focus:outline-none"
                        >
                            <span>{cabinClass.label}</span>
                            <span className="material-symbols-outlined text-[18px] text-slate-500">arrow_drop_down</span>
                        </button>

                        {showCabinDropdown && (
                            <div className="absolute top-full left-0 mt-1 w-48 bg-white dark:bg-[#202124] rounded-lg border border-[#dadce0] dark:border-slate-700 shadow-lg py-1 z-[200] animate-in fade-in duration-150">
                                {CABIN_CLASSES.map(c => (
                                    <button
                                        key={c.id}
                                        type="button"
                                        onClick={() => {
                                            setCabinClass(c);
                                            setShowCabinDropdown(false);
                                        }}
                                        className={`w-full px-3 py-2 text-left text-sm flex items-center justify-between hover:bg-[#f1f3f4] dark:hover:bg-slate-800 ${
                                            cabinClass.id === c.id ? 'text-[#1a73e8] font-medium bg-blue-50/50 dark:bg-blue-900/20' : 'text-[#3c4043] dark:text-slate-200'
                                        }`}
                                    >
                                        <span>{c.label}</span>
                                        {cabinClass.id === c.id && <span className="material-symbols-outlined text-[18px] text-[#1a73e8]">check</span>}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Main Search Row (From/To Connected Dual Box + Datepicker Dual Box) */}
                <div className="w-full flex flex-col lg:flex-row items-stretch gap-2.5 sm:gap-3 relative z-50">
                    
                    {/* Dual Box: Origin & Destination with Swap Button */}
                    <div className="flex-1 min-w-0 relative flex items-center">
                        
                        {/* Origin Box */}
                        <div className="flex-1 h-14 flex items-center border border-[#dadce0] dark:border-slate-600 rounded-l-[4px] bg-white dark:bg-[#303134] hover:border-[#bdc1c6] focus-within:border-[#1a73e8] focus-within:ring-1 focus-within:ring-[#1a73e8] transition-all px-3.5 sm:px-4 pr-6 font-roboto">
                            <span className="material-symbols-outlined text-[20px] text-[#5f6368] dark:text-slate-400 mr-3 flex-shrink-0">radio_button_unchecked</span>
                            <input
                                type="text"
                                placeholder="Nereden?"
                                value={origin}
                                onChange={(e) => setOrigin(e.target.value)}
                                className="w-full bg-transparent border-none outline-none focus:outline-none focus:ring-0 p-0 text-[15px] font-normal text-[#3c4043] dark:text-white placeholder-[#70757a] dark:placeholder-slate-400 truncate tracking-normal leading-normal"
                            />
                        </div>

                        {/* Circular Swap Button */}
                        <div className="absolute left-1/2 -translate-x-1/2 z-10">
                            <button
                                type="button"
                                onClick={handleSwap}
                                className="w-9 h-9 rounded-full bg-white dark:bg-[#202124] border border-[#dadce0] dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 shadow-sm flex items-center justify-center text-[#5f6368] dark:text-slate-300 transition-transform active:rotate-180 duration-300"
                                title="Kalkış ve varış yerini değiştir"
                            >
                                <span className="material-symbols-outlined text-[18px]">sync_alt</span>
                            </button>
                        </div>

                        {/* Destination Box */}
                        <div className="flex-1 h-14 flex items-center border border-l-0 border-[#dadce0] dark:border-slate-600 rounded-r-[4px] bg-white dark:bg-[#303134] hover:border-[#bdc1c6] focus-within:border-[#1a73e8] focus-within:ring-1 focus-within:ring-[#1a73e8] transition-all px-3.5 sm:px-4 pl-6 font-roboto">
                            <span className="material-symbols-outlined text-[20px] text-[#5f6368] dark:text-slate-400 mr-3 flex-shrink-0">location_on</span>
                            <input
                                type="text"
                                placeholder="Nereye?"
                                value={destination}
                                onChange={(e) => setDestination(e.target.value)}
                                className="w-full bg-transparent border-none outline-none focus:outline-none focus:ring-0 p-0 text-[15px] font-normal text-[#3c4043] dark:text-white placeholder-[#70757a] dark:placeholder-slate-400 truncate tracking-normal leading-normal"
                            />
                        </div>
                    </div>

                    {/* Twin Datepicker Container (Google Flights style) */}
                    <div className="w-full lg:w-[350px] flex-shrink-0 relative h-14 border border-[#dadce0] dark:border-slate-600 rounded-[4px] bg-white dark:bg-[#303134] hover:border-[#bdc1c6] transition-all flex items-center google-flight-date-trigger font-roboto">
                        
                        {/* Departure Date Half */}
                        <div
                            onClick={() => {
                                setActiveDateField('checkIn');
                                setIsDatePickerOpen(true);
                            }}
                            className={`flex-1 h-full flex items-center justify-between px-3 sm:px-3.5 cursor-pointer transition-colors min-w-0 ${
                                isDatePickerOpen && activeDateField === 'checkIn'
                                    ? 'border-2 border-[#1a73e8] rounded-l-[3px]'
                                    : 'hover:bg-slate-50 dark:hover:bg-slate-700/40'
                            }`}
                        >
                            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                <span className="material-symbols-outlined text-[20px] text-[#5f6368] dark:text-slate-400 flex-shrink-0">
                                    calendar_today
                                </span>
                                <span className="text-[15px] font-normal text-[#3c4043] dark:text-white truncate">
                                    {formatGoogleFlightDate(departureDate) || 'Gidiş'}
                                </span>
                            </div>

                            <div className="flex items-center text-[#5f6368] dark:text-slate-400 shrink-0 ml-1">
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

                        {/* Divider */}
                        <div className="w-[1px] h-7 bg-[#dadce0] dark:bg-slate-600 flex-shrink-0" />

                        {/* Return Date Half (Disabled if one_way) */}
                        {tripType.id !== 'one_way' ? (
                            <div
                                onClick={() => {
                                    setActiveDateField('checkOut');
                                    setIsDatePickerOpen(true);
                                }}
                                className={`flex-1 h-full flex items-center justify-between px-3 sm:px-3.5 cursor-pointer transition-colors min-w-0 ${
                                    isDatePickerOpen && activeDateField === 'checkOut'
                                        ? 'border-2 border-[#1a73e8] rounded-r-[3px]'
                                        : 'hover:bg-slate-50 dark:hover:bg-slate-700/40'
                                }`}
                            >
                                <div className="flex items-center min-w-0 flex-1">
                                    <span className="text-[15px] font-normal text-[#3c4043] dark:text-white truncate">
                                        {formatGoogleFlightDate(returnDate) || 'Dönüş'}
                                    </span>
                                </div>

                                <div className="flex items-center text-[#5f6368] dark:text-slate-400 shrink-0 ml-1">
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
                            <div className="flex-1 h-full flex items-center px-3 text-slate-400 text-sm italic">
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
                        className="bg-[#1a73e8] hover:bg-[#1557b0] text-white rounded-full font-medium text-[15px] px-8 py-2.5 flex items-center justify-center gap-2 shadow-[0_1px_3px_0_rgba(60,64,67,0.3),0_4px_8px_3px_rgba(60,64,67,0.15)] hover:shadow-lg transition-all active:scale-95"
                    >
                        <span className="material-symbols-outlined text-[20px]">search</span>
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
