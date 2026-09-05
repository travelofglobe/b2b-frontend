import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import GoogleFlightDatePicker from '../components/GoogleFlightDatePicker';

// Notched Input Box Component for the Google Flights search bar
const NotchedInputBox = ({ side, isFocused, children, className }) => {
    const containerRef = useRef(null);
    const [width, setWidth] = useState(240);

    useEffect(() => {
        if (!containerRef.current) return;
        const updateWidth = () => {
            if (containerRef.current) {
                const w = containerRef.current.offsetWidth;
                if (w > 0) setWidth(w);
            }
        };
        updateWidth();
        const ro = new ResizeObserver(updateWidth);
        ro.observe(containerRef.current);
        return () => ro.disconnect();
    }, []);

    const w = width;
    const h = 56;
    const r = 4;
    const notchR = 18;
    const cy = h / 2; // 28
    const notchHalfH = 17.94;
    const notchTop = cy - notchHalfH; // ~10.06
    const notchBottom = cy + notchHalfH; // ~45.94

    let pathD = '';
    if (side === 'right') {
        pathD = `M ${r} 0.5 L ${w - r} 0.5 A ${r} ${r} 0 0 1 ${w - 0.5} ${r} L ${w - 0.5} ${notchTop} A ${notchR} ${notchR} 0 0 0 ${w - 0.5} ${notchBottom} L ${w - 0.5} ${h - r} A ${r} ${r} 0 0 1 ${w - r} ${h - 0.5} L ${r} ${h - 0.5} A ${r} ${r} 0 0 1 0.5 ${h - r} L 0.5 ${r} A ${r} ${r} 0 0 1 ${r} 0.5 Z`;
    } else {
        pathD = `M ${r} 0.5 L ${w - r} 0.5 A ${r} ${r} 0 0 1 ${w - 0.5} ${r} L ${w - 0.5} ${h - r} A ${r} ${r} 0 0 1 ${w - r} ${h - 0.5} L ${r} ${h - 0.5} A ${r} ${r} 0 0 1 0.5 ${h - r} L 0.5 ${notchBottom} A ${notchR} ${notchR} 0 0 0 0.5 ${notchTop} L 0.5 ${r} A ${r} ${r} 0 0 1 ${r} 0.5 Z`;
    }

    return (
        <div ref={containerRef} className={`group/input relative h-14 flex-1 min-w-0 ${className || ''}`}>
            <svg 
                className="absolute inset-0 w-full h-full pointer-events-none"
                width={w} 
                height={h}
                viewBox={`0 0 ${w} ${h}`}
            >
                <path 
                    d={pathD} 
                    className={`transition-colors duration-150 fill-white dark:fill-[#303134] ${
                        isFocused 
                            ? 'stroke-[#1a73e8] stroke-[2]' 
                            : 'stroke-[#dadce0] dark:stroke-slate-600 group-hover/input:stroke-[#bdc1c6] dark:group-hover/input:stroke-slate-500 stroke-[1]'
                    }`}
                />
            </svg>
            <div className="relative z-10 w-full h-full flex items-center">
                {children}
            </div>
        </div>
    );
};

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

// Mock flight data
const INITIAL_FLIGHTS = [
    {
        id: 'fl-1',
        airline: 'Pegasus',
        airlineCode: 'PC',
        airlineSubtext: 'Pegasus',
        logoBg: 'bg-[#fed100]',
        logoText: 'PEGASUS',
        logoUrl: 'https://www.gstatic.com/flights/airline_logos/70px/PC.png',
        depTime: '11:30',
        arrTime: '12:30',
        depAirport: 'SAW',
        arrAirport: 'ESB',
        depAirportName: 'Sabiha Gökçen Havalimanı',
        arrAirportName: 'Ankara Esenboğa Havalimanı',
        duration: '1 sa.',
        durationMin: 60,
        stops: 'Aktarmasız',
        stopCount: 0,
        emissions: '93 kg CO2e',
        emissionsBadge: '-%29 emisyon',
        emissionsBadgeType: 'good',
        price: 5636,
        priceFormatted: '₺5.636',
        flightNo: 'PC 2660',
        aircraft: 'Boeing 737-800',
        legroom: '76 cm',
        hasUsb: true,
        hasWifi: false,
        hasMeal: false,
        hasBaggageIncluded: true,
        baggageAllowance: '15 kg kayıtlı bagaj',
        isBest: true,
        isPopular: true
    },
    {
        id: 'fl-2',
        airline: 'AJet',
        airlineCode: 'VF',
        airlineSubtext: 'AJet · İşleten: Turkish Airlines',
        logoBg: 'bg-[#002f6c]',
        logoText: 'AJet',
        logoUrl: 'https://www.gstatic.com/flights/airline_logos/70px/VF.png',
        depTime: '08:00',
        arrTime: '09:05',
        depAirport: 'SAW',
        arrAirport: 'ESB',
        depAirportName: 'Sabiha Gökçen Havalimanı',
        arrAirportName: 'Ankara Esenboğa Havalimanı',
        duration: '1 sa. 5 dk.',
        durationMin: 65,
        stops: 'Aktarmasız',
        stopCount: 0,
        emissions: '86 kg CO2e',
        emissionsBadge: '-%34 emisyon',
        emissionsBadgeType: 'good',
        price: 5665,
        priceFormatted: '₺5.665',
        flightNo: 'VF 4022',
        aircraft: 'Airbus A321neo',
        legroom: '79 cm',
        hasUsb: true,
        hasWifi: true,
        hasMeal: false,
        hasBaggageIncluded: true,
        baggageAllowance: '15 kg kayıtlı bagaj',
        isBest: true,
        isPopular: true
    },
    {
        id: 'fl-3',
        airline: 'AJet',
        airlineCode: 'VF',
        airlineSubtext: 'AJet',
        logoBg: 'bg-[#002f6c]',
        logoText: 'AJet',
        logoUrl: 'https://www.gstatic.com/flights/airline_logos/70px/VF.png',
        depTime: '13:00',
        arrTime: '14:05',
        depAirport: 'SAW',
        arrAirport: 'ESB',
        depAirportName: 'Sabiha Gökçen Havalimanı',
        arrAirportName: 'Ankara Esenboğa Havalimanı',
        duration: '1 sa. 5 dk.',
        durationMin: 65,
        stops: 'Aktarmasız',
        stopCount: 0,
        emissions: '97 kg CO2e',
        emissionsBadge: '-%26 emisyon',
        emissionsBadgeType: 'good',
        price: 5665,
        priceFormatted: '₺5.665',
        flightNo: 'VF 4026',
        aircraft: 'Boeing 737-800',
        legroom: '76 cm',
        hasUsb: false,
        hasWifi: false,
        hasMeal: false,
        hasBaggageIncluded: true,
        baggageAllowance: '15 kg kayıtlı bagaj',
        isBest: true,
        isPopular: true
    },
    {
        id: 'fl-4',
        airline: 'Türk Hava Yolları',
        airlineCode: 'TK',
        airlineSubtext: 'Türk Hava Yolları',
        logoBg: 'bg-[#e30613]',
        logoText: 'THY',
        logoUrl: 'https://www.gstatic.com/flights/airline_logos/70px/TK.png',
        depTime: '07:00',
        arrTime: '08:15',
        depAirport: 'IST',
        arrAirport: 'ESB',
        depAirportName: 'İstanbul Havalimanı',
        arrAirportName: 'Ankara Esenboğa Havalimanı',
        duration: '1 sa. 15 dk.',
        durationMin: 75,
        stops: 'Aktarmasız',
        stopCount: 0,
        emissions: '110 kg CO2e',
        emissionsBadge: 'Ortalama emisyon',
        emissionsBadgeType: 'neutral',
        price: 6120,
        priceFormatted: '₺6.120',
        flightNo: 'TK 2108',
        aircraft: 'Boeing 777-300ER',
        legroom: '81 cm',
        hasUsb: true,
        hasWifi: true,
        hasMeal: true,
        hasBaggageIncluded: true,
        baggageAllowance: '20 kg kayıtlı bagaj',
        isBest: false,
        isPopular: true
    },
    {
        id: 'fl-5',
        airline: 'Pegasus',
        airlineCode: 'PC',
        airlineSubtext: 'Pegasus',
        logoBg: 'bg-[#fed100]',
        logoText: 'PEGASUS',
        logoUrl: 'https://www.gstatic.com/flights/airline_logos/70px/PC.png',
        depTime: '18:45',
        arrTime: '19:50',
        depAirport: 'SAW',
        arrAirport: 'ESB',
        depAirportName: 'Sabiha Gökçen Havalimanı',
        arrAirportName: 'Ankara Esenboğa Havalimanı',
        duration: '1 sa. 5 dk.',
        durationMin: 65,
        stops: 'Aktarmasız',
        stopCount: 0,
        emissions: '91 kg CO2e',
        emissionsBadge: '-%31 emisyon',
        emissionsBadgeType: 'good',
        price: 5840,
        priceFormatted: '₺5.840',
        flightNo: 'PC 2674',
        aircraft: 'Airbus A320neo',
        legroom: '76 cm',
        hasUsb: true,
        hasWifi: false,
        hasMeal: false,
        hasBaggageIncluded: true,
        baggageAllowance: '15 kg kayıtlı bagaj',
        isBest: false,
        isPopular: true
    },
    {
        id: 'fl-6',
        airline: 'Türk Hava Yolları',
        airlineCode: 'TK',
        airlineSubtext: 'Türk Hava Yolları',
        logoBg: 'bg-[#e30613]',
        logoText: 'THY',
        logoUrl: 'https://www.gstatic.com/flights/airline_logos/70px/TK.png',
        depTime: '16:30',
        arrTime: '17:40',
        depAirport: 'IST',
        arrAirport: 'ESB',
        depAirportName: 'İstanbul Havalimanı',
        arrAirportName: 'Ankara Esenboğa Havalimanı',
        duration: '1 sa. 10 dk.',
        durationMin: 70,
        stops: 'Aktarmasız',
        stopCount: 0,
        emissions: '108 kg CO2e',
        emissionsBadge: 'Ortalama emisyon',
        emissionsBadgeType: 'neutral',
        price: 6350,
        priceFormatted: '₺6.350',
        flightNo: 'TK 2154',
        aircraft: 'Airbus A330-300',
        legroom: '81 cm',
        hasUsb: true,
        hasWifi: true,
        hasMeal: true,
        hasBaggageIncluded: true,
        baggageAllowance: '20 kg kayıtlı bagaj',
        isBest: false,
        isPopular: false
    },
    {
        id: 'fl-7',
        airline: 'SunExpress',
        airlineCode: 'XQ',
        airlineSubtext: 'SunExpress',
        logoBg: 'bg-[#f47c20]',
        logoText: 'SunExpress',
        logoUrl: 'https://www.gstatic.com/flights/airline_logos/70px/XQ.png',
        depTime: '09:30',
        arrTime: '10:40',
        depAirport: 'SAW',
        arrAirport: 'ESB',
        depAirportName: 'Sabiha Gökçen Havalimanı',
        arrAirportName: 'Ankara Esenboğa Havalimanı',
        duration: '1 sa. 10 dk.',
        durationMin: 70,
        stops: 'Aktarmasız',
        stopCount: 0,
        emissions: '95 kg CO2e',
        emissionsBadge: '-%28 emisyon',
        emissionsBadgeType: 'good',
        price: 5720,
        priceFormatted: '₺5.720',
        flightNo: 'XQ 928',
        aircraft: 'Boeing 737 MAX 8',
        legroom: '76 cm',
        hasUsb: true,
        hasWifi: false,
        hasMeal: false,
        hasBaggageIncluded: true,
        baggageAllowance: '15 kg kayıtlı bagaj',
        isBest: false,
        isPopular: false
    }
];

const FlightListing = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();

    // Query params
    const qOrigin = searchParams.get('origin') || 'İstanbul';
    const qDestination = searchParams.get('destination') || 'Ankara';
    const qDep = searchParams.get('dep');
    const qRet = searchParams.get('ret');
    const qType = searchParams.get('type') || 'round_trip';
    const qCabin = searchParams.get('cabin') || 'economy';
    const qAdults = parseInt(searchParams.get('adults') || '2', 10);

    // Search bar state
    const [origin, setOrigin] = useState(qOrigin);
    const [destination, setDestination] = useState(qDestination);
    const [focusedInput, setFocusedInput] = useState(null);
    const [swapRotation, setSwapRotation] = useState(0);

    const today = new Date();
    const defaultCheckIn = qDep ? new Date(qDep) : new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000); // 5 Eki
    const defaultCheckOut = qRet ? new Date(qRet) : new Date(today.getTime() + 35 * 24 * 60 * 60 * 1000); // 10 Eki
    const [departureDate, setDepartureDate] = useState(defaultCheckIn);
    const [returnDate, setReturnDate] = useState(defaultCheckOut);
    const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
    const [activeDateField, setActiveDateField] = useState('checkIn');

    const [tripType, setTripType] = useState(TRIP_TYPES.find(t => t.id === qType) || TRIP_TYPES[0]);
    const [showTripTypeDropdown, setShowTripTypeDropdown] = useState(false);

    const [cabinClass, setCabinClass] = useState(CABIN_CLASSES.find(c => c.id === qCabin) || CABIN_CLASSES[0]);
    const [showCabinDropdown, setShowCabinDropdown] = useState(false);

    const [passengers, setPassengers] = useState({ adults: qAdults, children: 0, infantsInSeat: 0, infantsOnLap: 0 });
    const [draftPassengers, setDraftPassengers] = useState({ adults: qAdults, children: 0, infantsInSeat: 0, infantsOnLap: 0 });
    const [showPassengerDropdown, setShowPassengerDropdown] = useState(false);

    const tripTypeRef = useRef(null);
    const passengerRef = useRef(null);
    const cabinRef = useRef(null);

    // Filter states
    const [activeTab, setActiveTab] = useState('best'); // 'best' | 'cheapest'
    const [openFilterModal, setOpenFilterModal] = useState(null); // 'stops' | 'airlines' | 'baggage' | 'price' | 'times' | 'emissions' | 'all'
    const [selectedAirlines, setSelectedAirlines] = useState([]);
    const [selectedStops, setSelectedStops] = useState('all'); // 'all' | 'direct' | '1stop'
    const [maxPrice, setMaxPrice] = useState(10000);
    const [onlyGreenEmissions, setOnlyGreenEmissions] = useState(false);

    // Expanded cards state
    const [expandedCardId, setExpandedCardId] = useState(null);

    // Notification / booking modal state
    const [selectedFlightForBooking, setSelectedFlightForBooking] = useState(null);

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

    const handleSwap = (e) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        setSwapRotation(prev => prev + 180);
        setOrigin(prevOrigin => {
            const currentOrigin = prevOrigin;
            setDestination(currentOrigin);
            return destination;
        });
    };

    // Filter & Sort flights
    const filteredFlights = useMemo(() => {
        return INITIAL_FLIGHTS.filter(fl => {
            if (selectedStops === 'direct' && fl.stopCount !== 0) return false;
            if (selectedStops === '1stop' && fl.stopCount > 1) return false;
            if (selectedAirlines.length > 0 && !selectedAirlines.includes(fl.airline)) return false;
            if (fl.price > maxPrice) return false;
            if (onlyGreenEmissions && fl.emissionsBadgeType !== 'good') return false;
            return true;
        }).sort((a, b) => {
            if (activeTab === 'cheapest') {
                return a.price - b.price;
            }
            // 'best' - score based on price and duration
            const scoreA = a.price + a.durationMin * 20;
            const scoreB = b.price + b.durationMin * 20;
            return scoreA - scoreB;
        });
    }, [activeTab, selectedStops, selectedAirlines, maxPrice, onlyGreenEmissions]);

    const popularFlights = filteredFlights.filter(f => f.isPopular || activeTab === 'cheapest');
    const otherFlights = filteredFlights.filter(f => !f.isPopular && activeTab !== 'cheapest');

    const lowestPrice = useMemo(() => {
        if (INITIAL_FLIGHTS.length === 0) return '5.443';
        const min = Math.min(...INITIAL_FLIGHTS.map(f => f.price));
        return min.toLocaleString('tr-TR');
    }, []);

    const toggleExpand = (id) => {
        setExpandedCardId(prev => (prev === id ? null : id));
    };

    return (
        <div className="min-h-screen bg-white dark:bg-[#202124] text-[#202124] dark:text-slate-100 font-sans pb-24">
            
            {/* Top Search Controls Bar */}
            <div className="w-full bg-white dark:bg-[#202124] border-b border-[#dadce0] dark:border-slate-800 sticky top-0 z-40 px-4 sm:px-6 py-3 shadow-[0_1px_3px_rgba(60,64,67,0.08)]">
                <div className="max-w-[1024px] mx-auto space-y-2.5">
                    
                    {/* Top dropdowns row: Trip Type, Passengers, Cabin */}
                    <div className="flex flex-wrap items-center gap-1 sm:gap-2 relative z-50">
                        
                        {/* 1. Trip Type */}
                        <div className="relative" ref={tripTypeRef}>
                            <button
                                type="button"
                                onClick={() => {
                                    setShowTripTypeDropdown(!showTripTypeDropdown);
                                    setShowPassengerDropdown(false);
                                    setShowCabinDropdown(false);
                                }}
                                className={`flex items-center gap-1.5 px-3 py-1.5 font-medium text-[13.5px] transition-colors cursor-pointer select-none ${
                                    showTripTypeDropdown
                                        ? 'bg-[#e8f0fe] text-[#1a73e8] dark:bg-[#1a73e8]/20 dark:text-[#8ab4f8] rounded-t border-b-2 border-[#1a73e8]'
                                        : 'text-[#3c4043] dark:text-slate-200 hover:text-[#202124] hover:bg-[#f1f3f4] dark:hover:bg-[#303134] rounded border-b-2 border-transparent'
                                }`}
                            >
                                <span className={`material-symbols-outlined text-[19px] ${showTripTypeDropdown ? 'text-[#1a73e8] dark:text-[#8ab4f8]' : 'text-[#5f6368] dark:text-slate-300'}`}>{tripType.icon}</span>
                                <span>{tripType.label}</span>
                                <span className={`material-symbols-outlined text-[19px] ${showTripTypeDropdown ? 'text-[#1a73e8] dark:text-[#8ab4f8]' : 'text-[#5f6368] dark:text-slate-300'}`}>
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
                                                className={`w-full py-2.5 pr-4 flex items-center text-left text-[13.5px] font-normal cursor-pointer transition-colors ${
                                                    isSelected
                                                        ? 'bg-[#e8f0fe] dark:bg-[#1a73e8]/20 text-[#202124] dark:text-white font-medium'
                                                        : 'text-[#3c4043] dark:text-slate-200 hover:bg-[#f1f3f4] dark:hover:bg-[#303134]'
                                                }`}
                                            >
                                                <div className="w-9 flex items-center justify-center flex-shrink-0">
                                                    {isSelected && (
                                                        <span className="material-symbols-outlined text-[18px] text-[#3c4043] dark:text-slate-200">check</span>
                                                    )}
                                                </div>
                                                <span className="truncate">{t.label}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* 2. Passengers */}
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
                                className={`flex items-center gap-1.5 px-3 py-1.5 font-medium text-[13.5px] transition-colors cursor-pointer select-none ${
                                    showPassengerDropdown
                                        ? 'bg-[#e8f0fe] text-[#1a73e8] dark:bg-[#1a73e8]/20 dark:text-[#8ab4f8] rounded-t border-b-2 border-[#1a73e8]'
                                        : 'text-[#3c4043] dark:text-slate-200 hover:text-[#202124] hover:bg-[#f1f3f4] dark:hover:bg-[#303134] rounded border-b-2 border-transparent'
                                }`}
                            >
                                <span className={`material-symbols-outlined text-[19px] ${showPassengerDropdown ? 'text-[#1a73e8] dark:text-[#8ab4f8]' : 'text-[#5f6368] dark:text-slate-300'}`}>person</span>
                                <span>{totalPassengers}</span>
                                <span className={`material-symbols-outlined text-[19px] ${showPassengerDropdown ? 'text-[#1a73e8] dark:text-[#8ab4f8]' : 'text-[#5f6368] dark:text-slate-300'}`}>
                                    {showPassengerDropdown ? 'arrow_drop_up' : 'arrow_drop_down'}
                                </span>
                            </button>

                            {showPassengerDropdown && (
                                <div className="absolute top-full left-0 mt-0 w-80 sm:w-[340px] bg-white dark:bg-[#202124] rounded-b-lg rounded-tr-lg border border-[#dadce0] dark:border-[#3c4043] shadow-[0_2px_6px_2px_rgba(60,64,67,0.15),0_1px_2px_0_rgba(60,64,67,0.3)] p-4 sm:p-5 z-[200] animate-in fade-in duration-150 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="text-[13px] font-normal text-[#202124] dark:text-white">Yetişkin</div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                disabled={draftPassengers.adults <= 1}
                                                onClick={() => setDraftPassengers(p => ({ ...p, adults: Math.max(1, p.adults - 1) }))}
                                                className="size-8 rounded-[4px] flex items-center justify-center bg-[#e8f0fe] text-[#1a73e8] disabled:bg-[#f1f3f4] disabled:text-[#bdc1c6] dark:disabled:bg-slate-800 dark:disabled:text-slate-600 cursor-pointer"
                                            >
                                                <span className="material-symbols-outlined text-[18px]">remove</span>
                                            </button>
                                            <span className="w-8 text-center text-[13px] font-normal text-[#202124] dark:text-white">{draftPassengers.adults}</span>
                                            <button
                                                type="button"
                                                disabled={draftPassengers.adults >= 9}
                                                onClick={() => setDraftPassengers(p => ({ ...p, adults: p.adults + 1 }))}
                                                className="size-8 rounded-[4px] flex items-center justify-center bg-[#e8f0fe] text-[#1a73e8] cursor-pointer"
                                            >
                                                <span className="material-symbols-outlined text-[18px]">add</span>
                                            </button>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-end gap-2 pt-2">
                                        <button
                                            type="button"
                                            onClick={() => setShowPassengerDropdown(false)}
                                            className="px-4 py-1.5 text-[13px] font-medium text-[#1a73e8] dark:text-[#8ab4f8] hover:bg-[#f8fafd] rounded cursor-pointer"
                                        >
                                            İptal
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setPassengers({ ...draftPassengers });
                                                setShowPassengerDropdown(false);
                                            }}
                                            className="px-4 py-1.5 text-[13px] font-medium text-[#1a73e8] dark:text-[#8ab4f8] hover:bg-[#f8fafd] rounded cursor-pointer"
                                        >
                                            Bitti
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* 3. Cabin Class */}
                        <div className="relative" ref={cabinRef}>
                            <button
                                type="button"
                                onClick={() => {
                                    setShowCabinDropdown(!showCabinDropdown);
                                    setShowTripTypeDropdown(false);
                                    setShowPassengerDropdown(false);
                                }}
                                className={`flex items-center gap-1 px-3 py-1.5 font-medium text-[13.5px] transition-colors cursor-pointer select-none ${
                                    showCabinDropdown
                                        ? 'bg-[#e8f0fe] text-[#1a73e8] dark:bg-[#1a73e8]/20 dark:text-[#8ab4f8] rounded-t border-b-2 border-[#1a73e8]'
                                        : 'text-[#3c4043] dark:text-slate-200 hover:text-[#202124] hover:bg-[#f1f3f4] dark:hover:bg-[#303134] rounded border-b-2 border-transparent'
                                }`}
                            >
                                <span>{cabinClass.label}</span>
                                <span className={`material-symbols-outlined text-[19px] ${showCabinDropdown ? 'text-[#1a73e8] dark:text-[#8ab4f8]' : 'text-[#5f6368] dark:text-slate-300'}`}>
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
                                                className={`w-full py-2.5 pr-4 flex items-center text-left text-[13.5px] font-normal cursor-pointer transition-colors ${
                                                    isSelected
                                                        ? 'bg-[#e8f0fe] dark:bg-[#1a73e8]/20 text-[#202124] dark:text-white font-medium'
                                                        : 'text-[#3c4043] dark:text-slate-200 hover:bg-[#f1f3f4] dark:hover:bg-[#303134]'
                                                }`}
                                            >
                                                <div className="w-9 flex items-center justify-center flex-shrink-0">
                                                    {isSelected && (
                                                        <span className="material-symbols-outlined text-[18px] text-[#3c4043] dark:text-slate-200">check</span>
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

                    {/* Main Connected Search Input Row */}
                    <div className="w-full flex flex-col lg:flex-row items-stretch gap-2.5 sm:gap-3 relative z-30">
                        
                        {/* Dual Box: Origin & Destination with Seamless Cutout Swap Button */}
                        <div className="flex-1 min-w-0 relative flex items-center gap-[3px]">
                            
                            {/* Origin Box (Notch on right) */}
                            <NotchedInputBox side="right" isFocused={focusedInput === 'origin'}>
                                <div className="w-full h-full flex items-center px-3.5 sm:px-4 pr-7 sm:pr-8 font-roboto">
                                    <svg className="w-[18px] h-[18px] text-[#5f6368] dark:text-slate-400 mr-3 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                        <circle cx="12" cy="12" r="7.5" />
                                    </svg>
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
                            </NotchedInputBox>

                            {/* Floating Swap Button in Notch Socket */}
                            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
                                <button
                                    type="button"
                                    onClick={handleSwap}
                                    className="w-9 h-9 sm:w-10 sm:h-10 rounded-full hover:bg-slate-200/50 dark:hover:bg-slate-700/50 active:bg-slate-200/80 dark:active:bg-slate-700/80 flex items-center justify-center text-[#5f6368] dark:text-slate-300 active:scale-90 transition-all cursor-pointer select-none"
                                    title="Kalkış ve varış yerini değiştir"
                                >
                                    <svg 
                                        className="w-[18px] h-[18px] text-[#3c4043] dark:text-slate-200 transition-transform duration-300 ease-in-out" 
                                        style={{ transform: `rotate(${swapRotation}deg)` }}
                                        viewBox="0 0 24 24" 
                                        fill="none" 
                                        stroke="currentColor" 
                                        strokeWidth="2.2" 
                                        strokeLinecap="round" 
                                        strokeLinejoin="round"
                                    >
                                        <path d="M16 4l4 4-4 4" />
                                        <path d="M4 8h16" />
                                        <path d="M8 20l-4-4 4-4" />
                                        <path d="M20 16H4" />
                                    </svg>
                                </button>
                            </div>

                            {/* Destination Box (Notch on left) */}
                            <NotchedInputBox side="left" isFocused={focusedInput === 'destination'}>
                                <div className="w-full h-full flex items-center px-3.5 sm:px-4 pl-7 sm:pl-8 font-roboto">
                                    <svg className="w-[19px] h-[19px] text-[#5f6368] dark:text-slate-400 mr-3 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M12 21s-6-5.333-6-10a6 6 0 1 1 12 0c0 4.667-6 10-6 10z" />
                                        <circle cx="12" cy="11" r="2.5" />
                                    </svg>
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
                            </NotchedInputBox>
                        </div>

                        {/* Twin Datepicker Container */}
                        <div className={`w-full lg:w-[360px] flex-shrink-0 relative h-14 bg-white dark:bg-[#303134] flex items-center google-flight-date-trigger font-roboto ${
                            isDatePickerOpen && (activeDateField === 'checkIn' || activeDateField === 'checkOut')
                                ? ''
                                : 'border border-[#dadce0] dark:border-slate-600 rounded-[4px] hover:border-[#bdc1c6] transition-all overflow-hidden'
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
                                    <span className="material-symbols-outlined text-[18px] text-[#5f6368] dark:text-slate-300 flex-shrink-0">calendar_today</span>
                                    <span className="text-[13.5px] font-medium text-[#3c4043] dark:text-white truncate">
                                        {formatGoogleFlightDate(departureDate) || 'Gidiş'}
                                    </span>
                                </div>

                                <div className="flex items-center text-[#5f6368] dark:text-slate-300 shrink-0 ml-1">
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
                            {!(isDatePickerOpen && (activeDateField === 'checkIn' || activeDateField === 'checkOut')) && (
                                <div className="w-[1px] h-6 bg-[#dadce0] dark:bg-slate-600 flex-shrink-0" />
                            )}

                            {/* Return Date Half */}
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
                                        <span className="text-[13.5px] font-medium text-[#3c4043] dark:text-white truncate">
                                            {formatGoogleFlightDate(returnDate) || 'Dönüş'}
                                        </span>
                                    </div>

                                    <div className="flex items-center text-[#5f6368] dark:text-slate-300 shrink-0 ml-1">
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
                                <div className="flex-1 h-full flex items-center px-3 text-[#70757a] dark:text-slate-400 text-xs italic">
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

                    {/* Filter Chips Bar (Google Flights Horizontal Filters) */}
                    <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide py-1 pt-1.5">
                        
                        {/* Tüm filtreler */}
                        <button
                            type="button"
                            onClick={() => setOpenFilterModal(openFilterModal === 'all' ? null : 'all')}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#dadce0] dark:border-slate-600 hover:bg-[#f1f3f4] dark:hover:bg-[#303134] text-[13px] font-medium text-[#3c4043] dark:text-slate-200 shrink-0 transition-colors cursor-pointer"
                        >
                            <span className="material-symbols-outlined text-[16px] text-[#5f6368] dark:text-slate-300">tune</span>
                            <span>Tüm filtreler</span>
                        </button>

                        {/* Aktarmalar */}
                        <button
                            type="button"
                            onClick={() => setSelectedStops(prev => prev === 'all' ? 'direct' : 'all')}
                            className={`flex items-center gap-1 px-3 py-1.5 rounded-full border text-[13px] font-medium shrink-0 transition-colors cursor-pointer ${
                                selectedStops !== 'all'
                                    ? 'bg-[#e8f0fe] text-[#1a73e8] border-[#1a73e8] dark:bg-[#1a73e8]/20 dark:text-[#8ab4f8]'
                                    : 'border-[#dadce0] dark:border-slate-600 hover:bg-[#f1f3f4] dark:hover:bg-[#303134] text-[#3c4043] dark:text-slate-200'
                            }`}
                        >
                            <span>Aktarmalar</span>
                            <span className="material-symbols-outlined text-[16px] text-[#5f6368] dark:text-slate-300">arrow_drop_down</span>
                        </button>

                        {/* Hava yolu şirketleri */}
                        <button
                            type="button"
                            onClick={() => setOpenFilterModal(openFilterModal === 'airlines' ? null : 'airlines')}
                            className={`flex items-center gap-1 px-3 py-1.5 rounded-full border text-[13px] font-medium shrink-0 transition-colors cursor-pointer ${
                                selectedAirlines.length > 0
                                    ? 'bg-[#e8f0fe] text-[#1a73e8] border-[#1a73e8] dark:bg-[#1a73e8]/20 dark:text-[#8ab4f8]'
                                    : 'border-[#dadce0] dark:border-slate-600 hover:bg-[#f1f3f4] dark:hover:bg-[#303134] text-[#3c4043] dark:text-slate-200'
                            }`}
                        >
                            <span>Hava yolu şirketleri</span>
                            <span className="material-symbols-outlined text-[16px] text-[#5f6368] dark:text-slate-300">arrow_drop_down</span>
                        </button>

                        {/* Bagaj */}
                        <button
                            type="button"
                            className="flex items-center gap-1 px-3 py-1.5 rounded-full border border-[#dadce0] dark:border-slate-600 hover:bg-[#f1f3f4] dark:hover:bg-[#303134] text-[13px] font-medium text-[#3c4043] dark:text-slate-200 shrink-0 transition-colors cursor-pointer"
                        >
                            <span>Bagaj</span>
                            <span className="material-symbols-outlined text-[16px] text-[#5f6368] dark:text-slate-300">arrow_drop_down</span>
                        </button>

                        {/* Fiyat */}
                        <button
                            type="button"
                            onClick={() => setOpenFilterModal(openFilterModal === 'price' ? null : 'price')}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-full border border-[#dadce0] dark:border-slate-600 hover:bg-[#f1f3f4] dark:hover:bg-[#303134] text-[13px] font-medium text-[#3c4043] dark:text-slate-200 shrink-0 transition-colors cursor-pointer"
                        >
                            <span>Fiyat</span>
                            <span className="material-symbols-outlined text-[16px] text-[#5f6368] dark:text-slate-300">arrow_drop_down</span>
                        </button>

                        {/* Kalkış zamanı */}
                        <button
                            type="button"
                            className="flex items-center gap-1 px-3 py-1.5 rounded-full border border-[#dadce0] dark:border-slate-600 hover:bg-[#f1f3f4] dark:hover:bg-[#303134] text-[13px] font-medium text-[#3c4043] dark:text-slate-200 shrink-0 transition-colors cursor-pointer"
                        >
                            <span>Kalkış zamanı</span>
                            <span className="material-symbols-outlined text-[16px] text-[#5f6368] dark:text-slate-300">arrow_drop_down</span>
                        </button>

                        {/* Emisyon */}
                        <button
                            type="button"
                            onClick={() => setOnlyGreenEmissions(!onlyGreenEmissions)}
                            className={`flex items-center gap-1 px-3 py-1.5 rounded-full border text-[13px] font-medium shrink-0 transition-colors cursor-pointer ${
                                onlyGreenEmissions
                                    ? 'bg-[#e8f0fe] text-[#1a73e8] border-[#1a73e8] dark:bg-[#1a73e8]/20 dark:text-[#8ab4f8]'
                                    : 'border-[#dadce0] dark:border-slate-600 hover:bg-[#f1f3f4] dark:hover:bg-[#303134] text-[#3c4043] dark:text-slate-200'
                            }`}
                        >
                            <span>Emisyon</span>
                            <span className="material-symbols-outlined text-[16px] text-[#5f6368] dark:text-slate-300">arrow_drop_down</span>
                        </button>

                        {/* Aktarma yapılabilen havalimanları */}
                        <button
                            type="button"
                            className="flex items-center gap-1 px-3 py-1.5 rounded-full border border-[#dadce0] dark:border-slate-600 hover:bg-[#f1f3f4] dark:hover:bg-[#303134] text-[13px] font-medium text-[#3c4043] dark:text-slate-200 shrink-0 transition-colors cursor-pointer"
                        >
                            <span>Aktarma yapılabilen havalimanları</span>
                            <span className="material-symbols-outlined text-[16px] text-[#5f6368] dark:text-slate-300">arrow_drop_down</span>
                        </button>

                        {/* Süre */}
                        <button
                            type="button"
                            className="flex items-center gap-1 px-3 py-1.5 rounded-full border border-[#dadce0] dark:border-slate-600 hover:bg-[#f1f3f4] dark:hover:bg-[#303134] text-[13px] font-medium text-[#3c4043] dark:text-slate-200 shrink-0 transition-colors cursor-pointer"
                        >
                            <span>Süre</span>
                            <span className="material-symbols-outlined text-[16px] text-[#5f6368] dark:text-slate-300">arrow_drop_down</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="max-w-[1024px] mx-auto px-4 sm:px-6 pt-6">
                
                {/* 1. Sort / Comparison Tabs: En iyi vs En ucuz (Google Flights Style) */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                    
                    {/* Tab 1: En iyi */}
                    <button
                        type="button"
                        onClick={() => setActiveTab('best')}
                        className={`h-14 rounded-lg px-4 flex items-center justify-center gap-1.5 text-[14px] font-medium transition-all cursor-pointer select-none ${
                            activeTab === 'best'
                                ? 'bg-white dark:bg-[#303134] text-[#1a73e8] dark:text-[#8ab4f8] border-2 border-[#1a73e8] shadow-sm'
                                : 'bg-white dark:bg-[#202124] text-[#3c4043] dark:text-slate-300 border border-[#dadce0] dark:border-slate-700 hover:bg-[#f8f9fa]'
                        }`}
                    >
                        <span>En iyi</span>
                        <span className="material-symbols-outlined text-[16px] text-[#70757a] dark:text-slate-400">info</span>
                    </button>

                    {/* Tab 2: En ucuz */}
                    <button
                        type="button"
                        onClick={() => setActiveTab('cheapest')}
                        className={`h-14 rounded-lg px-4 flex items-center justify-center gap-1.5 text-[14px] font-medium transition-all cursor-pointer select-none ${
                            activeTab === 'cheapest'
                                ? 'bg-white dark:bg-[#303134] text-[#1a73e8] dark:text-[#8ab4f8] border-2 border-[#1a73e8] shadow-sm'
                                : 'bg-white dark:bg-[#202124] text-[#3c4043] dark:text-slate-300 border border-[#dadce0] dark:border-slate-700 hover:bg-[#f8f9fa]'
                        }`}
                    >
                        <span>En ucuz</span>
                        <span className="text-[12px] text-[#5f6368] dark:text-slate-400 font-normal">en düşük:</span>
                        <span className="text-[14px] font-bold text-[#137333] dark:text-emerald-400">₺{lowestPrice}</span>
                        <span className="material-symbols-outlined text-[16px] text-[#70757a] dark:text-slate-400">info</span>
                    </button>
                </div>

                {/* 2. Section Header: En popüler gidiş seçenekleri */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                    <div>
                        <h2 className="text-[17px] font-semibold text-[#202124] dark:text-white leading-tight">
                            En popüler gidiş seçenekleri
                        </h2>
                        <div className="text-[11.5px] text-[#70757a] dark:text-slate-400 leading-snug mt-0.5">
                            Fiyat-performans durumuna göre sıralanmıştır <span className="inline-block align-middle cursor-pointer hover:text-slate-700">ⓘ</span> Fiyatlara {totalPassengers} kişi için zorunlu vergiler ve ücretler dahildir. İsteğe bağlı ödemeler ve <span className="text-[#1a73e8] underline cursor-pointer">bagaj ücretleri</span> geçerli olabilir. <span className="text-[#1a73e8] underline cursor-pointer">Yolcu yardımı</span> ile ilgili bilgiler
                        </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-1 text-[13px] font-medium text-[#1a73e8] dark:text-[#8ab4f8] hover:bg-[#e8f0fe] dark:hover:bg-[#1a73e8]/20 px-2.5 py-1 rounded cursor-pointer transition-colors">
                        <span>En popüler uçuşlara göre sıralandı</span>
                        <span className="material-symbols-outlined text-[16px]">swap_vert</span>
                    </div>
                </div>

                {/* 3. Popular Flight Cards Container */}
                <div className="bg-white dark:bg-[#202124] rounded-lg border border-[#dadce0] dark:border-slate-700 overflow-hidden divide-y divide-[#dadce0] dark:divide-slate-700 shadow-sm mb-8">
                    {popularFlights.length === 0 ? (
                        <div className="p-8 text-center text-slate-500">
                            Filtrelere uygun uçuş bulunamadı. Lütfen filtrelerinizi sıfırlayın.
                        </div>
                    ) : (
                        popularFlights.map((flight) => {
                            const isExpanded = expandedCardId === flight.id;
                            return (
                                <div key={flight.id} className="transition-colors overflow-hidden">
                                    
                                    {/* Card Header (Dynamic based on expanded or collapsed with smooth cross-fade) */}
                                    <div 
                                        onClick={() => toggleExpand(flight.id)}
                                        className={`p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer select-none transition-colors duration-200 ${
                                            isExpanded 
                                                ? 'bg-white dark:bg-[#202124]' 
                                                : 'hover:bg-slate-50/70 dark:hover:bg-slate-800/40 bg-white dark:bg-[#202124]'
                                        }`}
                                    >
                                        {/* Left Side: Logo & Info */}
                                        <div className="flex items-center gap-3.5 sm:gap-4 flex-1 min-w-0">
                                            
                                            {/* Airline Logo */}
                                            <div className="w-9 h-9 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden shrink-0 shadow-xs">
                                                <img 
                                                    src={flight.logoUrl} 
                                                    alt={flight.airline} 
                                                    className="w-7 h-7 object-contain"
                                                    onError={(e) => {
                                                        e.target.style.display = 'none';
                                                        e.target.parentElement.innerHTML = `<span class="text-[10px] font-bold text-slate-700 dark:text-slate-200">${flight.airlineCode}</span>`;
                                                    }}
                                                />
                                            </div>

                                            {/* Times / Date Header */}
                                            {isExpanded ? (
                                                <div className="text-[15px] font-semibold text-[#202124] dark:text-white animate-in fade-in duration-200">
                                                    Gidiş · {formatGoogleFlightDate(departureDate) || '5 Eki Pzt'}
                                                </div>
                                            ) : (
                                                <>
                                                    <div className="min-w-[130px]">
                                                        <div className="text-[15px] font-semibold text-[#202124] dark:text-white leading-tight">
                                                            {flight.depTime} – {flight.arrTime}
                                                        </div>
                                                        <div className="text-[12px] text-[#70757a] dark:text-slate-400 truncate mt-0.5">
                                                            {flight.airlineSubtext}
                                                        </div>
                                                    </div>

                                                    <div className="min-w-[90px]">
                                                        <div className="text-[13.5px] font-medium text-[#202124] dark:text-slate-200 leading-tight">
                                                            {flight.duration}
                                                        </div>
                                                        <div className="text-[12px] text-[#70757a] dark:text-slate-400 mt-0.5">
                                                            {flight.depAirport}–{flight.arrAirport}
                                                        </div>
                                                    </div>

                                                    <div className="min-w-[80px] hidden md:block">
                                                        <div className="text-[13.5px] font-normal text-[#202124] dark:text-slate-300">
                                                            {flight.stops}
                                                        </div>
                                                    </div>

                                                    <div className="min-w-[120px] hidden lg:block">
                                                        <div className="text-[13.5px] font-normal text-[#202124] dark:text-slate-300 leading-tight">
                                                            {flight.emissions}
                                                        </div>
                                                        {flight.emissionsBadge && (
                                                            <div className="text-[11.5px] font-medium text-[#137333] dark:text-emerald-400 flex items-center gap-0.5 mt-0.5">
                                                                <span>{flight.emissionsBadge}</span>
                                                                <span className="material-symbols-outlined text-[13px]">info</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </>
                                            )}
                                        </div>

                                        {/* Right Side: Emissions badge + Uçuşu seç (if expanded) + Price & Expand Chevron */}
                                        <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100 dark:border-slate-800">
                                            
                                            {/* Expanded mode extra emissions */}
                                            {isExpanded && (
                                                <div className="text-right hidden sm:block animate-in fade-in duration-200">
                                                    <div className="text-[13.5px] font-normal text-[#202124] dark:text-slate-300 leading-tight">
                                                        {flight.emissions}
                                                    </div>
                                                    {flight.emissionsBadge && (
                                                        <span className="inline-flex items-center gap-0.5 text-[11.5px] font-medium text-[#137333] dark:text-emerald-400 bg-[#e6f4ea] dark:bg-emerald-950/40 px-1.5 py-0.5 rounded mt-0.5">
                                                            <span>{flight.emissionsBadge}</span>
                                                            <span className="material-symbols-outlined text-[12px]">info</span>
                                                        </span>
                                                    )}
                                                </div>
                                            )}

                                            {/* Expanded mode 'Uçuşu seç' Button */}
                                            {isExpanded && (
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedFlightForBooking(flight);
                                                    }}
                                                    className="px-4 py-1.5 border border-[#dadce0] dark:border-slate-600 hover:bg-[#f8fafd] dark:hover:bg-[#303134] text-[#1a73e8] dark:text-[#8ab4f8] rounded-full text-[13.5px] font-medium transition-all active:scale-95 cursor-pointer shadow-xs animate-in fade-in duration-200"
                                                >
                                                    Uçuşu seç
                                                </button>
                                            )}

                                            {/* Price */}
                                            <div className="text-left sm:text-right">
                                                <div className="flex items-center sm:justify-end gap-1.5">
                                                    {!isExpanded && flight.hasBaggageIncluded && (
                                                        <span className="material-symbols-outlined text-[16px] text-[#5f6368] dark:text-slate-400" title="Kayıtlı bagaj dahil">
                                                            luggage
                                                        </span>
                                                    )}
                                                    <span className="text-[15px] sm:text-[16px] font-semibold text-[#137333] dark:text-emerald-400 leading-tight">
                                                        {flight.priceFormatted}
                                                    </span>
                                                </div>
                                                <div className="text-[11px] text-[#70757a] dark:text-slate-400">
                                                    {tripType.id === 'round_trip' ? 'gidiş dönüş' : 'tek yön'}
                                                </div>
                                            </div>

                                            {/* Animated Chevron */}
                                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-[#5f6368] dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                                                <span className={`material-symbols-outlined text-[20px] transition-transform duration-300 ease-in-out ${isExpanded ? 'rotate-180' : 'rotate-0'}`}>
                                                    expand_more
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Smooth Accordion Body Container using CSS Grid (1fr / 0fr) */}
                                    <div 
                                        className={`grid transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
                                            isExpanded 
                                                ? 'grid-rows-[1fr] opacity-100 border-t border-[#dadce0] dark:border-slate-700' 
                                                : 'grid-rows-[0fr] opacity-0 border-t-0'
                                        }`}
                                    >
                                        <div className="overflow-hidden">
                                            <div className="p-4 sm:p-6 bg-white dark:bg-[#202124]">
                                                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
                                                    
                                                    {/* Left Column: Timeline & Meta */}
                                                    <div className="lg:col-span-7 space-y-4">
                                                        
                                                        {/* Timeline Container */}
                                                        <div className="relative pl-6 space-y-4">
                                                            
                                                            {/* Top Point: Departure */}
                                                            <div className="relative flex items-center">
                                                                <div className="absolute -left-6 top-1 w-3.5 h-3.5 rounded-full border-2 border-slate-400 dark:border-slate-500 bg-white dark:bg-[#202124]"></div>
                                                                <div className="text-[13.5px] text-[#202124] dark:text-white font-normal">
                                                                    <span className="font-semibold">{flight.depTime}</span> · {flight.depAirportName} ({flight.depAirport})
                                                                </div>
                                                            </div>

                                                            {/* Dotted Connecting Line with Duration */}
                                                            <div className="relative border-l-2 border-dotted border-slate-300 dark:border-slate-600 -ml-4 pl-4 py-2">
                                                                <div className="text-[12px] text-[#70757a] dark:text-slate-400">
                                                                    Seyahat süresi: {flight.duration}
                                                                </div>
                                                            </div>

                                                            {/* Bottom Point: Arrival */}
                                                            <div className="relative flex items-center">
                                                                <div className="absolute -left-6 top-1 w-3.5 h-3.5 rounded-full border-2 border-slate-400 dark:border-slate-500 bg-white dark:bg-[#202124]"></div>
                                                                <div className="text-[13.5px] text-[#202124] dark:text-white font-normal">
                                                                    <span className="font-semibold">{flight.arrTime}</span> · {flight.arrAirportName} ({flight.arrAirport})
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Flight Meta Info (Airline · Cabin · Aircraft · FlightNo) */}
                                                        <div className="text-[12px] text-[#70757a] dark:text-slate-400 pt-2">
                                                            {flight.airline} · {cabinClass.label} · {flight.aircraft} · {flight.flightNo}
                                                        </div>
                                                    </div>

                                                    {/* Right Column: Features & Amenities List */}
                                                    <div className="lg:col-span-5 space-y-3 pt-1 border-t lg:border-t-0 lg:border-l border-slate-100 dark:border-slate-700 lg:pl-6">
                                                        
                                                        {/* Feature 1: Legroom */}
                                                        <div className="flex items-start gap-2.5 text-[12.5px] text-[#3c4043] dark:text-slate-300">
                                                            <span className="material-symbols-outlined text-[18px] text-[#5f6368] dark:text-slate-400 shrink-0 mt-0.5">
                                                                airline_seat_recline_extra
                                                            </span>
                                                            <span>Ortalama bacak mesafesi ({flight.legroom})</span>
                                                        </div>

                                                        {/* Feature 2: Media / Stream */}
                                                        <div className="flex items-start gap-2.5 text-[12.5px] text-[#3c4043] dark:text-slate-300">
                                                            <span className="material-symbols-outlined text-[18px] text-[#5f6368] dark:text-slate-400 shrink-0 mt-0.5">
                                                                phone_android
                                                            </span>
                                                            <span>Cihazınıza medya içeriği akışı gerçekleştirin</span>
                                                        </div>

                                                        {/* Feature 3: Emissions */}
                                                        <div className="flex items-start gap-2.5 text-[12.5px] text-[#3c4043] dark:text-slate-300">
                                                            <span className="material-symbols-outlined text-[18px] text-[#5f6368] dark:text-slate-400 shrink-0 mt-0.5">
                                                                public
                                                            </span>
                                                            <span>Tahmini emisyon: {flight.emissions}</span>
                                                        </div>

                                                        {/* Feature 4: Contrail warming effect */}
                                                        <div className="flex items-start gap-2.5 text-[12.5px] text-[#3c4043] dark:text-slate-300">
                                                            <span className="material-symbols-outlined text-[18px] text-[#5f6368] dark:text-slate-400 shrink-0 mt-0.5">
                                                                flight_takeoff
                                                            </span>
                                                            <span>Yoğunlaşma izine bağlı ısınmaya potansiyel etkisi: Düşük <span className="inline-block cursor-pointer hover:text-slate-700">ⓘ</span></span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* 4. Other Flights Section: Diğer gidiş uçuşları */}
                {otherFlights.length > 0 && (
                    <div className="mt-8">
                        <div className="mb-3">
                            <h3 className="text-[16px] font-semibold text-[#202124] dark:text-white leading-tight">
                                Diğer gidiş uçuşları
                            </h3>
                            <div className="text-[11.5px] text-[#70757a] dark:text-slate-400 mt-0.5">
                                Fiyat veya süre açısından daha farklı alternatif uçuşlar
                            </div>
                        </div>

                        <div className="bg-white dark:bg-[#202124] rounded-lg border border-[#dadce0] dark:border-slate-700 overflow-hidden divide-y divide-[#dadce0] dark:divide-slate-700 shadow-sm">
                            {otherFlights.map(flight => (
                                <div key={flight.id} className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                                    <div className="flex items-center gap-3.5 sm:gap-4 flex-1 min-w-0">
                                        <div className="w-9 h-9 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden shrink-0 shadow-xs">
                                            <img src={flight.logoUrl} alt={flight.airline} className="w-7 h-7 object-contain" />
                                        </div>
                                        <div>
                                            <div className="text-[15px] font-semibold text-[#202124] dark:text-white leading-tight">
                                                {flight.depTime} – {flight.arrTime}
                                            </div>
                                            <div className="text-[12px] text-[#70757a] dark:text-slate-400 truncate mt-0.5">
                                                {flight.airlineSubtext}
                                            </div>
                                        </div>
                                        <div className="min-w-[90px]">
                                            <div className="text-[13.5px] font-medium text-[#202124] dark:text-slate-200 leading-tight">
                                                {flight.duration}
                                            </div>
                                            <div className="text-[12px] text-[#70757a] dark:text-slate-400 mt-0.5">
                                                {flight.depAirport}–{flight.arrAirport}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 shrink-0">
                                        <div className="text-right">
                                            <span className="text-[16px] font-semibold text-[#202124] dark:text-white">
                                                {flight.priceFormatted}
                                            </span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setSelectedFlightForBooking(flight)}
                                            className="px-4 py-1.5 border border-[#dadce0] hover:bg-[#f8fafd] text-[#1a73e8] font-medium text-xs rounded-full cursor-pointer transition-colors"
                                        >
                                            Seç
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Booking Modal Confirmation */}
            {selectedFlightForBooking && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in">
                    <div className="bg-white dark:bg-[#202124] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
                        <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-950/50 text-[#1a73e8] flex items-center justify-center mx-auto">
                            <span className="material-symbols-outlined text-2xl">flight_takeoff</span>
                        </div>
                        <div className="text-center">
                            <h3 className="text-lg font-semibold text-[#202124] dark:text-white">
                                {selectedFlightForBooking.airline} Uçuşu Seçildi
                            </h3>
                            <p className="text-sm text-[#5f6368] dark:text-slate-400 mt-1">
                                {origin} ({selectedFlightForBooking.depAirport}) &rarr; {destination} ({selectedFlightForBooking.arrAirport})
                            </p>
                            <div className="text-xl font-bold text-[#137333] dark:text-emerald-400 mt-3">
                                {selectedFlightForBooking.priceFormatted}
                            </div>
                        </div>
                        <div className="flex gap-2 pt-2">
                            <button
                                type="button"
                                onClick={() => setSelectedFlightForBooking(null)}
                                className="flex-1 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 text-sm font-medium hover:bg-slate-50 cursor-pointer"
                            >
                                Kapat
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    alert(`${selectedFlightForBooking.airline} (${selectedFlightForBooking.flightNo}) için rezervasyon adımı başlatılıyor.`);
                                    setSelectedFlightForBooking(null);
                                }}
                                className="flex-1 py-2.5 rounded-xl bg-[#1a73e8] hover:bg-[#1557b0] text-white text-sm font-medium cursor-pointer shadow-md"
                            >
                                Rezervasyona İlerle
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FlightListing;
