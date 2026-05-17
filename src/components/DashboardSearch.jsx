import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { autocompleteService } from '../services/autocompleteService';
import { useToast } from '../context/ToastContext';
import DatePicker, { registerLocale } from 'react-datepicker';
import { enGB, tr, es, ru, zhCN, ja, faIR, fr, it, el, pt, ar } from 'date-fns/locale';
import "react-datepicker/dist/react-datepicker.css";
import "../datepicker-custom.css";
import { parseGuestsParam, serializeGuestsParam, convertOldParamsToRooms } from '../utils/searchParamsUtils';
import { useTranslation } from 'react-i18next';

import NationalitySelect from './NationalitySelect';

// Register dynamic locales
registerLocale('en', enGB);
registerLocale('tr', tr);
registerLocale('es', es);
registerLocale('ru', ru);
registerLocale('zh', zhCN);
registerLocale('ja', ja);
registerLocale('fa', faIR);
registerLocale('fr', fr);
registerLocale('it', it);
registerLocale('el', el);
registerLocale('pt', pt);
registerLocale('ar', ar);

const searchLocales = {
    en: {
        hotels: "Hotels",
        transfer: "Transfer",
        tours: "Tours",
        carRental: "Car Rental",
        soon: "SOON",
        location: "Location",
        destinationRequired: "Destination Required",
        placeholder: "Search by city, hotel or region",
        popularDestinations: "Popular Destinations",
        featuredHotels: "Featured Hotels",
        checkInOut: "Check-in / Out",
        nights: "nights",
        nightSingle: "night",
        nationality: "Nationality",
        occupants: "Occupants",
        roomsAndGuests: "Rooms and Guests",
        roomsTotal: "Rooms Total",
        roomSingle: "Room",
        adults: "Adults",
        adultsAge: "12+ yrs",
        children: "Children",
        childrenAge: "0-11 yrs",
        years: "years",
        addRoom: "Add Another Room",
        searchBtn: "Search"
    },
    tr: {
        hotels: "Oteller",
        transfer: "Transfer",
        tours: "Turlar",
        carRental: "Araç Kiralama",
        soon: "YAKINDA",
        location: "Konum",
        destinationRequired: "Konum Gerekli",
        placeholder: "Şehir, otel veya bölge ara",
        popularDestinations: "Popüler Destanlar",
        featuredHotels: "Öne Çıkan Oteller",
        checkInOut: "Giriş / Çıkış",
        nights: "gece",
        nightSingle: "gece",
        nationality: "Uyruk",
        occupants: "Kişi Sayısı",
        roomsAndGuests: "Oda ve Konuklar",
        roomsTotal: "Toplam Oda",
        roomSingle: "Oda",
        adults: "Yetişkin",
        adultsAge: "12+ yaş",
        children: "Çocuk",
        childrenAge: "0-11 yaş",
        years: "yaş",
        addRoom: "Başka Oda Ekle",
        searchBtn: "Ara"
    },
    ar: {
        hotels: "فنادق",
        transfer: "توصيل",
        tours: "جولات",
        carRental: "تأجير سيارات",
        soon: "قريباً",
        location: "الموقع",
        destinationRequired: "الوجهة مطلوبة",
        placeholder: "ابحث عن مدينة، فندق أو منطقة",
        popularDestinations: "الوجهات الشائعة",
        featuredHotels: "الفنادق المميزة",
        checkInOut: "تسجيل الوصول / المغادرة",
        nights: "ليالي",
        nightSingle: "ليلة",
        nationality: "الجنسية",
        occupants: "النزلاء",
        roomsAndGuests: "الغرف والنزلاء",
        roomsTotal: "إجمالي الغرف",
        roomSingle: "غرفة",
        adults: "بالغين",
        adultsAge: "12+ سنة",
        children: "أطفال",
        childrenAge: "0-11 سنة",
        years: "سنة",
        addRoom: "إضافة غرفة أخرى",
        searchBtn: "بحث"
    },
    es: {
        hotels: "Hoteles",
        transfer: "Traslado",
        tours: "Tours",
        carRental: "Alquiler de coches",
        soon: "PRONTO",
        location: "Ubicación",
        destinationRequired: "Destino Requerido",
        placeholder: "Buscar por ciudad, hotel o región",
        popularDestinations: "Destinos Populares",
        featuredHotels: "Hoteles Destacados",
        checkInOut: "Entrada / Salida",
        nights: "noches",
        nightSingle: "noche",
        nationality: "Nacionalidad",
        occupants: "Ocupantes",
        roomsAndGuests: "Habitaciones y Huéspedes",
        roomsTotal: "Habitaciones Totales",
        roomSingle: "Habitación",
        adults: "Adultos",
        adultsAge: "12+ años",
        children: "Niños",
        childrenAge: "0-11 años",
        years: "años",
        addRoom: "Añadir Otra Habitación",
        searchBtn: "Buscar"
    },
    ru: {
        hotels: "Отели",
        transfer: "Трансфер",
        tours: "Туры",
        carRental: "Аренда авто",
        soon: "СКОРО",
        location: "Местоположение",
        destinationRequired: "Укажите место назначения",
        placeholder: "Поиск по городу, отелю или региону",
        popularDestinations: "Популярные направления",
        featuredHotels: "Рекомендуемые отели",
        checkInOut: "Заезд / Выезд",
        nights: "ночей",
        nightSingle: "ночь",
        nationality: "Гражданство",
        occupants: "Гости",
        roomsAndGuests: "Номера и Гости",
        roomsTotal: "Всего номеров",
        roomSingle: "Номер",
        adults: "Взрослые",
        adultsAge: "12+ лет",
        children: "Дети",
        childrenAge: "0-11 лет",
        years: "лет",
        addRoom: "Добавить еще номер",
        searchBtn: "Найти"
    },
    zh: {
        hotels: "酒店",
        transfer: "接送",
        tours: "一日游",
        carRental: "租车",
        soon: "即将推出",
        location: "位置",
        destinationRequired: "请输入目的地",
        placeholder: "按城市、酒店或区域搜索",
        popularDestinations: "热门目的地",
        featuredHotels: "推荐酒店",
        checkInOut: "入住 / 退房",
        nights: "晚",
        nightSingle: "晚",
        nationality: "国籍",
        occupants: "入住人数",
        roomsAndGuests: "客房及人数",
        roomsTotal: "客房总数",
        roomSingle: "客房",
        adults: "成人",
        adultsAge: "12岁以上",
        children: "儿童",
        childrenAge: "0-11岁",
        years: "岁",
        addRoom: "添加另一个客房",
        searchBtn: "搜索"
    },
    ja: {
        hotels: "ホテル",
        transfer: "送迎",
        tours: "ツアー",
        carRental: "レンタカー",
        soon: "まもなく登場",
        location: "場所",
        destinationRequired: "目的地を入力してください",
        placeholder: "都市、ホテル、地域で検索",
        popularDestinations: "人気の目的地",
        featuredHotels: "おすすめホテル",
        checkInOut: "チェックイン / アウト",
        nights: "泊",
        nightSingle: "泊",
        nationality: "国籍",
        occupants: "宿泊人数",
        roomsAndGuests: "客房・人数",
        roomsTotal: "客室総数",
        roomSingle: "客室",
        adults: "大人",
        adultsAge: "12歳以上",
        children: "子供",
        childrenAge: "0-11歳",
        years: "歳",
        addRoom: "別の客室を追加",
        searchBtn: "検索"
    },
    fa: {
        hotels: "هتل‌ها",
        transfer: "ترانسفر",
        tours: "تورها",
        carRental: "اجاره خودرو",
        soon: "به‌زودی",
        location: "موقعیت",
        destinationRequired: "انتخاب مقصد الزامی است",
        placeholder: "جستجوی شهر، هتل یا منطقه",
        popularDestinations: "مقاصد محبوب",
        featuredHotels: "هتل‌های ویژه",
        checkInOut: "ورود / خروج",
        nights: "شب",
        nightSingle: "شب",
        nationality: "ملیت",
        occupants: "مقیمان",
        roomsAndGuests: "اتاق‌ها و مهمانان",
        roomsTotal: "مجموع اتاق‌ها",
        roomSingle: "اتاق",
        adults: "بزرگسال",
        adultsAge: "۱۲+ سال",
        children: "کودک",
        childrenAge: "۰-۱۱ سال",
        years: "سال",
        addRoom: "افزودن اتاق دیگر",
        searchBtn: "جستجو"
    },
    fr: {
        hotels: "Hôtels",
        transfer: "Transfert",
        tours: "Tours",
        carRental: "Location voiture",
        soon: "BIENTÔT",
        location: "Emplacement",
        destinationRequired: "Destination requise",
        placeholder: "Rechercher par ville, hôtel ou région",
        popularDestinations: "Destinations Populaires",
        featuredHotels: "Hôtels Vedettes",
        checkInOut: "Arrivée / Départ",
        nights: "nuits",
        nightSingle: "nuit",
        nationality: "Nationalité",
        occupants: "Occupants",
        roomsAndGuests: "Chambres & Voyageurs",
        roomsTotal: "Chambres Totales",
        roomSingle: "Chambre",
        adults: "Adultes",
        adultsAge: "12+ ans",
        children: "Enfants",
        childrenAge: "0-11 ans",
        years: "ans",
        addRoom: "Ajouter Une Autre Chambre",
        searchBtn: "Rechercher"
    },
    it: {
        hotels: "Hotel",
        transfer: "Trasferimento",
        tours: "Tour",
        carRental: "Noleggio auto",
        soon: "PRESTO",
        location: "Posizione",
        destinationRequired: "Destinazione Richiesta",
        placeholder: "Cerca per città, hotel o regione",
        popularDestinations: "Destinazioni Popolari",
        featuredHotels: "Hotel in Evidenza",
        checkInOut: "Check-in / Out",
        nights: "notti",
        nightSingle: "notte",
        nationality: "Nazionalità",
        occupants: "Occupanti",
        roomsAndGuests: "Camere e Ospiti",
        roomsTotal: "Camere Totali",
        roomSingle: "Camera",
        adults: "Adulti",
        adultsAge: "12+ anni",
        children: "Bambini",
        childrenAge: "0-11 anni",
        years: "anni",
        addRoom: "Aggiungi Un'Altra Camera",
        searchBtn: "Cerca"
    },
    el: {
        hotels: "Ξενοδοχεία",
        transfer: "Μεταφορά",
        tours: "Εκδρομές",
        carRental: "Ενοικίαση αυτοκινήτου",
        soon: "ΣΥΝΤΟΜΑ",
        location: "Τοποθεσία",
        destinationRequired: "Απαιτείται Προορισμός",
        placeholder: "Αναζήτηση με πόλη, ξενοδοχείο ή περιοχή",
        popularDestinations: "Δημοφιλείς Προορισμοί",
        featuredHotels: "Προτεινόμενα Ξενοδοχεία",
        checkInOut: "Check-in / Out",
        nights: "νύχτες",
        nightSingle: "νύχτα",
        nationality: "Εθνικότητα",
        occupants: "Επισκέπτες",
        roomsAndGuests: "Δωμάτια & Επισκέπτες",
        roomsTotal: "Σύνολο Δωματίων",
        roomSingle: "Δωμάτιο",
        adults: "Ενήλικες",
        adultsAge: "12+ ετών",
        children: "Παιδιά",
        childrenAge: "0-11 ετών",
        years: "ετών",
        addRoom: "Προσθήκη Δωματίου",
        searchBtn: "Αναζήτηση"
    },
    pt: {
        hotels: "Hotéis",
        transfer: "Transfer",
        tours: "Passeios",
        carRental: "Aluguel de carros",
        soon: "EM BREVE",
        location: "Localização",
        destinationRequired: "Destino Obrigatório",
        placeholder: "Buscar por cidade, hotel ou região",
        popularDestinations: "Destinos Populares",
        featuredHotels: "Hotéis em Destaque",
        checkInOut: "Entrada / Saída",
        nights: "noites",
        nightSingle: "noite",
        nationality: "Nacionalidade",
        occupants: "Ocupantes",
        roomsAndGuests: "Quartos e Hóspedes",
        roomsTotal: "Quartos Totais",
        roomSingle: "Quarto",
        adults: "Adultos",
        adultsAge: "12+ anos",
        children: "Crianças",
        childrenAge: "0-11 anos",
        years: "anos",
        addRoom: "Adicionar Outro Quarto",
        searchBtn: "Buscar"
    }
};

const DashboardSearch = () => {
    const { i18n } = useTranslation();
    const currentLang = i18n.language || 'en';
    const ls = searchLocales[currentLang] || searchLocales['en'];
    
    const navigate = useNavigate();
    const { error: toastError } = useToast(); // Renamed to avoid conflict with local 'error' state
    const [searchParams] = useSearchParams();

    // Initialize state from URL params or defaults
    const [query, setQuery] = useState(() => {
        return searchParams.get('q') || localStorage.getItem('dashboard_last_search') || '';
    });

    // Nationality State
    const [nationality, setNationality] = useState(() => {
        return searchParams.get('nationality') || localStorage.getItem('dashboard_last_nationality') || 'TR';
    });

    const [results, setResults] = useState({ hotels: [], regions: [] });
    const [loading, setLoading] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);

    // Reset active index when results change
    useEffect(() => {
        setActiveIndex(-1);
    }, [results]);

    // Default dates: Check-in today, Check-out tomorrow
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const parseDateParam = (param) => {
        if (!param) return null;
        // Support both yyyy-MM-dd (new, backend format) and dd-MM-yyyy (legacy)
        const isNewFormat = /^\d{4}-\d{2}-\d{2}$/.test(param.trim());
        const parts = param.split('-').map(Number);
        let year, month, day;
        if (isNewFormat) {
            [year, month, day] = parts;
        } else {
            [day, month, year] = parts;
        }
        if (day && month && year) {
            const date = new Date(year, month - 1, day);
            if (date instanceof Date && !isNaN(date.getTime())) {
                return date;
            }
        }
        return null;
    };

    const [checkInDate, setCheckInDate] = useState(() => {
        const checkinParam = searchParams.get('checkin') || localStorage.getItem('dashboard_last_checkin');
        return parseDateParam(checkinParam) || today;
    });
    const [checkOutDate, setCheckOutDate] = useState(() => {
        const checkoutParam = searchParams.get('checkout') || localStorage.getItem('dashboard_last_checkout');
        return parseDateParam(checkoutParam) || tomorrow;
    });

    // -- Guest State --
    const [roomState, setRoomState] = useState(() => {
        const guestsParam = searchParams.get('guests') || localStorage.getItem('dashboard_last_guests');
        if (guestsParam) {
            return parseGuestsParam(guestsParam);
        }
        // Fallback to old params
        const adults = searchParams.get('adult');
        const children = searchParams.get('children');
        const childAges = searchParams.get('child_ages');

        if (adults || children) {
            return convertOldParamsToRooms(adults, children, childAges);
        }

        // Default
        return [{ adults: 2, children: 0, childAges: [] }];
    });

    // Computed totals for display
    const totalAdults = roomState.reduce((sum, r) => sum + r.adults, 0);
    const totalChildren = roomState.reduce((sum, r) => sum + r.children, 0);
    const totalRooms = roomState.length;

    const [showGuestDropdown, setShowGuestDropdown] = useState(false);

    const searchWrapperRef = useRef(null);
    const guestWrapperRef = useRef(null);
    const datePickerRef = useRef(null);

    const [error, setError] = useState(false);

    const isUserInteraction = useRef(false);

    // Debounce search
    useEffect(() => {
        // Only trigger search if user has interacted with the input
        if (!isUserInteraction.current) {
            return;
        }

        const timeoutId = setTimeout(() => {
            if (query.length >= 3) {
                fetchResults();
            } else {
                setResults({ hotels: [], regions: [] });
            }
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [query]);

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchWrapperRef.current && !searchWrapperRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
            if (guestWrapperRef.current && !guestWrapperRef.current.contains(event.target)) {
                setShowGuestDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Save state to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem('dashboard_last_nationality', nationality);
    }, [nationality]);

    useEffect(() => {
        if (checkInDate) {
            localStorage.setItem('dashboard_last_checkin', `${checkInDate.getFullYear()}-${String(checkInDate.getMonth() + 1).padStart(2, '0')}-${String(checkInDate.getDate()).padStart(2, '0')}`);
        }
    }, [checkInDate]);

    useEffect(() => {
        if (checkOutDate) {
            localStorage.setItem('dashboard_last_checkout', `${checkOutDate.getFullYear()}-${String(checkOutDate.getMonth() + 1).padStart(2, '0')}-${String(checkOutDate.getDate()).padStart(2, '0')}`);
        }
    }, [checkOutDate]);

    useEffect(() => {
        localStorage.setItem('dashboard_last_guests', serializeGuestsParam(roomState));
    }, [roomState]);

    const fetchResults = async () => {
        setLoading(true);
        try {
            const data = await autocompleteService.search({ query, types: ['HOTEL', 'LOCATION'] });
            // Handle both wrapped { data: { ... } } and direct responses
            const resultsData = data?.data || data;
            
            if (resultsData) {
                const items = resultsData.content || [];
                
                // Separate results by type
                const hotels = items.filter(item => item.type === 'HOTEL');
                const regions = items.filter(item => item.type === 'LOCATION');
                
                if (items.length > 0) {
                    setResults({ hotels, regions });
                    setShowDropdown(true);
                } else {
                    setResults({ hotels: [], regions: [] });
                    setShowDropdown(false);
                }
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const formatDateForUrl = (date) => {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const getUrlParams = (queryOverride) => {
        const guestsParam = serializeGuestsParam(roomState);
        let params = `checkin=${formatDateForUrl(checkInDate)}&checkout=${formatDateForUrl(checkOutDate)}&guests=${encodeURIComponent(guestsParam)}&nationality=${encodeURIComponent(nationality)}`;

        const q = queryOverride !== undefined ? queryOverride : query;
        if (q) {
            params += `&q=${encodeURIComponent(q)}`;
        }
        return params;
    };

    const buildLocationSlug = (location) => {
        if (location.locationBreadcrumbs && location.locationBreadcrumbs.length > 0) {
            // parts: [Country, City, District] (hierarchical order from API)
            const breadcrumbs = location.locationBreadcrumbs.map(b => (b.name.translations.en || b.name.defaultName).toLowerCase());
            
            // If more than 1 part (e.g., City exists), skip Country (at index 0)
            if (breadcrumbs.length > 1) {
                return breadcrumbs.slice(1).join('/');
            }
            // Just one part
            return breadcrumbs[0];
        }
        return (location.name.translations.en || Object.values(location.name.translations)[0] || 'destination').toLowerCase();
    };

    const handleSearch = () => {
        if (!query.trim()) {
            setError(true);
            return;
        }

        if (query) {
            const savedLastSearch = localStorage.getItem('dashboard_last_search');
            const savedLastType = localStorage.getItem('dashboard_last_type');
            const savedLastHotelId = localStorage.getItem('dashboard_last_hotelId');

            if (savedLastType === 'HOTEL' && query === savedLastSearch && savedLastHotelId) {
                const searchParamsString = getUrlParams();
                navigate(`/hotel/${savedLastHotelId}?${searchParamsString}`);
                return;
            }

            localStorage.setItem('dashboard_last_search', query);
            
            // If query contains commas, try to build a hierarchical slug
            // e.g. "Üsküdar, İstanbul, Türkiye" -> ["Üsküdar", "İstanbul", "Türkiye"]
            const queryParts = query.split(',').map(p => p.trim().toLowerCase());
            let slug = query.toLowerCase();
            
            if (queryParts.length >= 2) {
                // If 3 parts: [District, City, Country] -> slug "istanbul/uskudar"
                // If 2 parts: [City, Country] -> slug "istanbul"
                const reversed = queryParts.reverse(); // [Country, City, District]
                slug = reversed.slice(1).join('/');
            }

            // Retrieve locationId from localStorage if it exists
            const savedLocationId = localStorage.getItem('dashboard_last_locationId');
            const locationParam = savedLocationId ? `&locationId=${savedLocationId}` : '';
            const searchParamsString = getUrlParams() + locationParam;

            localStorage.setItem('last_hotel_search_slug', slug);
            localStorage.setItem('last_hotel_search_params', searchParamsString);

            navigate(`/hotels/${slug}?${searchParamsString}`);
        }
    };

    const handleSelectLocation = (location) => {
        // Helper to get English name or fallback
        const name = location.name.translations.en || Object.values(location.name.translations)[0] || 'destination';

        // Construct full name from breadcrumbs for display
        let fullName = name;
        if (location.locationBreadcrumbs && location.locationBreadcrumbs.length > 0) {
            const parts = location.locationBreadcrumbs.map(b => b.name.translations.en || b.name.defaultName);
            fullName = parts.reverse().join(', ');
        }

        localStorage.setItem('dashboard_last_search', fullName);
        localStorage.setItem('dashboard_last_type', 'LOCATION');
        // Save locationId for later use with Search button
        if (location.locationId) {
            localStorage.setItem('dashboard_last_locationId', location.locationId);
        }

        // Generate hierarchical slug
        const slug = buildLocationSlug(location);

        // Reset user interaction flag and close dropdown to prevent reopening
        isUserInteraction.current = false;
        setShowDropdown(false);

        setQuery(fullName);
        
        const locationParam = `&locationId=${location.locationId}`;
        const searchParamsString = getUrlParams(fullName) + locationParam;

        localStorage.setItem('last_hotel_search_slug', slug);
        localStorage.setItem('last_hotel_search_params', searchParamsString);
    };

    const handleSelectHotel = (hotel) => {
        const name = getHotelName(hotel);

        // Construct full name with location context
        let fullName = name;
        if (hotel.locationBreadcrumbs && hotel.locationBreadcrumbs.length > 0) {
            const parts = hotel.locationBreadcrumbs.map(b => b.name.translations.en || b.name.defaultName);
            const context = parts.reverse().join(', ');
            fullName = `${name}, ${context}`;
        } else if (hotel.countryCode) {
            fullName = `${name}, ${hotel.countryCode}`;
        }

        const hId = hotel.hotelId || hotel.id?.replace('hotel_', '');

        localStorage.setItem('dashboard_last_search', fullName);
        localStorage.setItem('dashboard_last_type', 'HOTEL');
        localStorage.setItem('dashboard_last_hotelId', hId);

        // Reset user interaction flag and close dropdown to prevent reopening
        isUserInteraction.current = false;
        setShowDropdown(false);

        setQuery(fullName);

        const searchParamsString = getUrlParams(fullName);

        localStorage.setItem('last_hotel_search_slug', hotel.url || hId);
        localStorage.setItem('last_hotel_search_params', searchParamsString);
    };

    // Helper to get Hotel Name
    const getHotelName = (hotel) => {
        return hotel.name.translations.en || Object.values(hotel.name.translations)[0] || 'Hotel';
    };

    // Helper to get Region Name
    const getRegionName = (region) => {
        if (region.locationBreadcrumbs && region.locationBreadcrumbs.length > 0) {
            const parts = region.locationBreadcrumbs.map(b => b.name.translations.en || b.name.defaultName);
            return parts.reverse().join(', ');
        }
        return region.name.translations.en || Object.values(region.name.translations)[0] || 'Unknown Region';
    };

    const handleKeyDown = (e) => {
        // Allow Enter key to trigger search actions regardless of dropdown state
        if (e.key === 'Enter') {
            e.preventDefault();
            // If dropdown is open and we have an active item, select it
            if (showDropdown && activeIndex >= 0) {
                if (activeIndex < results.regions.length) {
                    handleSelectLocation(results.regions[activeIndex]);
                } else {
                    handleSelectHotel(results.hotels[activeIndex - results.regions.length]);
                }
            } else {
                // Otherwise, trigger the main search
                handleSearch();
            }
            return;
        }

        // For navigation keys, we need the dropdown to be open and have results
        if (!showDropdown || (results.regions.length === 0 && results.hotels.length === 0)) return;

        const totalItems = results.regions.length + results.hotels.length;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActiveIndex((prev) => (prev < totalItems - 1 ? prev + 1 : prev));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActiveIndex((prev) => (prev > 0 ? prev - 1 : -1));
        }
    };

    // -- Room Manipulators --
    const updateRoom = (index, field, value) => {
        const newRooms = [...roomState];
        newRooms[index] = { ...newRooms[index], [field]: value };

        // Handle child count change special case to resize ages array
        if (field === 'children') {
            const diff = value - newRooms[index].childAges.length;
            if (diff > 0) {
                // Add children with default age 0
                newRooms[index].childAges = [...newRooms[index].childAges, ...Array(diff).fill(0)];
            } else if (diff < 0) {
                // Remove children
                newRooms[index].childAges = newRooms[index].childAges.slice(0, value);
            }
        }

        setRoomState(newRooms);
    };

    const updateChildAge = (roomIndex, childIndex, age) => {
        const newRooms = [...roomState];
        const newAges = [...newRooms[roomIndex].childAges];
        newAges[childIndex] = parseInt(age);
        newRooms[roomIndex].childAges = newAges;
        setRoomState(newRooms);
    };

    const addRoom = () => {
        if (roomState.length < 5) {
            setRoomState([...roomState, { adults: 2, children: 0, childAges: [] }]);
        }
    };

    const removeRoom = (index) => {
        if (roomState.length > 1) {
            const newRooms = roomState.filter((_, i) => i !== index);
            setRoomState(newRooms);
        }
    };

    return (
        <section className="relative group/search">
            {/* Soft ambient glow */}
            <div className="absolute -inset-4 bg-primary/5 rounded-[60px] blur-[100px] opacity-0 group-hover/search:opacity-100 transition-opacity duration-1000"></div>

            <div className="relative bg-white/40 dark:bg-slate-900/40 backdrop-blur-3xl rounded-[40px] shadow-[0_20px_50px_rgba(0,0,0,0.05)] p-4 border border-white/60 dark:border-white/10 transition-all duration-500 hover:shadow-[0_32px_80px_rgba(0,0,0,0.08)]">
                
                {/* Modern Service Tabs */}
                <div className="flex flex-wrap items-center gap-2 mb-6 p-1 relative z-10">
                    <button className="bg-primary/10 text-primary px-6 py-2.5 rounded-2xl font-bold flex items-center gap-3 transition-all transform active:scale-95 group/btn">
                        <span className="material-symbols-outlined text-sm fill-1">hotel</span>
                        <span className="text-sm tracking-tight">{ls.hotels}</span>
                    </button>
                    {['flight', 'airport_shuttle', 'explore', 'directions_car'].map((icon, i) => (
                        <button key={i} className="px-5 py-2.5 rounded-2xl font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-3 transition-all hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white group/soon" disabled>
                            <span className="material-symbols-outlined text-lg leading-none opacity-70 group-hover/soon:opacity-100">{icon}</span>
                            <span className="text-sm tracking-tight">{icon === 'airport_shuttle' ? ls.transfer : icon === 'explore' ? ls.tours : icon === 'directions_car' ? ls.carRental : icon.charAt(0).toUpperCase() + icon.slice(1)}</span>
                            <span className="bg-slate-200/50 dark:bg-slate-800/80 text-[9px] font-bold px-2 py-0.5 rounded-lg opacity-40 group-hover/soon:opacity-100 transition-opacity">{ls.soon}</span>
                        </button>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-2 p-1 relative z-10">
                    {/* Destination Input */}
                    <div className="lg:col-span-3 relative group/field" ref={searchWrapperRef}>
                        <div className={`flex flex-col gap-1 px-4 py-3 h-[72px] bg-white/60 dark:bg-slate-800/60 rounded-3xl border transition-all duration-300 ${error ? 'border-red-500 bg-red-50/50 dark:bg-red-900/10' : 'border-slate-100 dark:border-slate-800 group-hover/field:border-primary/30 group-hover/field:bg-white dark:group-hover/field:bg-slate-800 shadow-sm'}`}>
                            <label className={`text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 mb-1 ${error ? 'text-red-500' : 'text-slate-400'}`}>
                                <span className={`material-symbols-outlined text-[14px] ${error ? 'text-red-500' : 'text-primary'}`}>
                                    {error ? 'error' : 'location_on'}
                                </span>
                                {error ? ls.destinationRequired : ls.location}
                            </label>
                            <input
                                className="bg-transparent border-none outline-none focus:ring-0 w-full p-0 text-sm font-bold text-slate-900 dark:text-white placeholder-slate-400/60 tracking-tight"
                                placeholder={ls.placeholder}
                                type="text"
                                value={query}
                                onChange={(e) => {
                                    isUserInteraction.current = true;
                                    setQuery(e.target.value);
                                    if (error) setError(false);
                                }}
                                onClick={(e) => e.target.select()}
                                onFocus={() => { if (results.hotels.length || results.regions.length) setShowDropdown(true); }}
                                onKeyDown={handleKeyDown}
                            />
                            {loading && <div className="absolute right-4 top-1/2 -translate-y-1/2 size-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>}
                        </div>

                        {/* Redesigned Autocomplete Dropdown */}
                        {showDropdown && (results.hotels.length > 0 || results.regions.length > 0) && (
                            <div className="absolute top-full left-0 w-full md:w-[450px] mt-4 bg-white dark:bg-[#0f172a] rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-2xl max-h-[400px] overflow-y-auto z-[200] p-4 space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
                                {results.regions.length > 0 && (
                                    <div>
                                        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest px-4 mb-2">{ls.popularDestinations}</div>
                                        <div className="space-y-1">
                                            {results.regions.map((region, index) => (
                                                <button
                                                    key={region.locationId}
                                                    onClick={() => handleSelectLocation(region)}
                                                    className={`w-full text-left px-4 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/80 rounded-2xl flex items-center gap-4 transition-all group ${activeIndex === index ? 'bg-slate-50 dark:bg-slate-800/80 ring-1 ring-primary/20' : ''}`}
                                                >
                                                    <div className="size-10 rounded-2xl bg-primary/5 flex items-center justify-center text-primary transition-colors shadow-sm ring-1 ring-primary/10">
                                                        <span className="material-symbols-outlined text-xl">location_city</span>
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="text-sm font-bold text-slate-900 dark:text-white tracking-tight truncate">{region.name.translations.en || region.name.defaultName}</div>
                                                        <div className="text-[11px] font-medium text-slate-500 truncate">{getRegionName(region)}</div>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {results.hotels.length > 0 && (
                                    <div>
                                        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest px-4 mb-2">{ls.featuredHotels}</div>
                                        <div className="space-y-1">
                                            {results.hotels.map((hotel, index) => (
                                                <button
                                                    key={hotel.hotelId}
                                                    onClick={() => handleSelectHotel(hotel)}
                                                    className={`w-full text-left px-4 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/80 rounded-2xl flex items-center gap-4 transition-all group ${activeIndex === (results.regions.length + index) ? 'bg-slate-50 dark:bg-slate-800/80 ring-1 ring-primary/20' : ''}`}
                                                >
                                                    <div className="size-10 rounded-2xl bg-indigo-50 dark:bg-indigo-900/10 flex items-center justify-center text-indigo-500 transition-colors shadow-sm ring-1 ring-indigo-500/10">
                                                        <span className="material-symbols-outlined text-xl">hotel</span>
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="text-sm font-bold text-slate-900 dark:text-white tracking-tight truncate">{getHotelName(hotel)}</div>
                                                        <div className="text-[11px] font-medium text-slate-500 truncate">
                                                            {hotel.locationBreadcrumbs ?
                                                                hotel.locationBreadcrumbs.map(b => b.name.translations.en || b.name.defaultName).reverse().join(', ')
                                                                : hotel.countryCode}
                                                        </div>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Date Picker Group */}
                    <div className="lg:col-span-3 relative group/field">
                        <div 
                            className="flex flex-col gap-1 px-4 py-3 h-[72px] bg-white/60 dark:bg-slate-800/60 rounded-3xl border border-slate-100 dark:border-slate-800 transition-all duration-300 group-hover/field:border-primary/30 group-hover/field:bg-white dark:group-hover/field:bg-slate-800 shadow-sm cursor-pointer"
                            onClick={() => datePickerRef.current?.setOpen(true)}
                        >
                            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 flex items-center justify-between w-full mb-1">
                                <div className="flex items-center gap-1.5">
                                    <span className="material-symbols-outlined text-[14px] text-primary">calendar_today</span>
                                    {ls.checkInOut}
                                </div>
                                {checkInDate && checkOutDate && (
                                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-primary/10 text-primary border border-primary/20 animate-in fade-in slide-in-from-right-2">
                                        <span className="material-symbols-outlined text-[12px] leading-none">bedtime</span>
                                        <span className="text-[9px] font-black uppercase tracking-tight">
                                            {Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24))} {Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24)) === 1 ? ls.nightSingle : ls.nights}
                                        </span>
                                    </div>
                                )}
                            </label>
                            <div className="flex-1 min-w-0">
                                <DatePicker
                                    ref={datePickerRef}
                                    selected={checkInDate}
                                    onChange={(dates) => {
                                        const [start, end] = dates;

                                        // Validation: checkout must be at least 1 day after checkin
                                        if (start && end) {
                                            const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate());
                                            const endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate());
                                            if (endDay <= startDay) {
                                                const nextDay = new Date(startDay);
                                                nextDay.setDate(nextDay.getDate() + 1);
                                                setCheckInDate(start);
                                                setCheckOutDate(nextDay);
                                                return;
                                            }
                                        }

                                        setCheckInDate(start);
                                        setCheckOutDate(end);
                                    }}
                                    startDate={checkInDate}
                                    endDate={checkOutDate}
                                    selectsRange
                                    minDate={new Date()}
                                    maxDate={checkInDate && !checkOutDate ? new Date(checkInDate.getTime() + 30 * 24 * 60 * 60 * 1000) : null}
                                    monthsShown={2}
                                    locale={currentLang}
                                    className="bg-transparent border-none outline-none focus:outline-none focus:ring-0 w-full p-0 text-[13px] font-bold text-slate-900 dark:text-white cursor-pointer tracking-tighter whitespace-nowrap"
                                    dateFormat="dd MMM yyyy"
                                    placeholderText={ls.placeholder}
                                    calendarClassName="shadow-2xl border-none font-sans mt-4"
                                    popperPlacement="bottom-start"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Nationality Section */}
                    <div className="lg:col-span-2 relative group/field">
                        <div className="flex flex-col gap-1 px-4 py-3 h-[72px] bg-white/60 dark:bg-slate-800/60 rounded-3xl border border-slate-100 dark:border-slate-800 transition-all duration-300 group-hover/field:border-primary/30 group-hover/field:bg-white dark:group-hover/field:bg-slate-800 shadow-sm">
                            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5 pl-1 mb-1">
                                <span className="material-symbols-outlined text-[14px] text-primary">public</span>
                                {ls.nationality}
                            </label>
                            <div className="flex-1 -mt-1 scale-[0.95] origin-left">
                                <NationalitySelect value={nationality} onChange={setNationality} compact={false} />
                            </div>
                        </div>
                    </div>

                    {/* Elegant Guest Selector */}
                    <div className="lg:col-span-2 relative group/field" ref={guestWrapperRef}>
                        <button
                            onClick={() => setShowGuestDropdown(!showGuestDropdown)}
                            className="w-full h-[72px] flex flex-col items-start gap-1 px-4 py-3 bg-white/60 dark:bg-slate-800/60 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm transition-all duration-300 group-hover/field:border-primary/30 group-hover/field:bg-white dark:group-hover/field:bg-slate-800 text-left"
                        >
                            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5 mb-1">
                                <span className="material-symbols-outlined text-[14px] text-primary">group</span>
                                {ls.occupants}
                            </label>
                            <div className="flex items-center justify-between w-full">
                                <span className="text-sm font-bold text-slate-900 dark:text-white tracking-tight truncate w-full">
                                    {totalAdults} {ls.adults.substring(0, 3)}, {totalChildren} {ls.children.substring(0, 3)}
                                </span>
                                <span className="material-symbols-outlined text-slate-400 text-lg transition-transform group-hover/field:translate-y-0.5">expand_more</span>
                            </div>
                        </button>

                        {/* Guest Dropdown - Modernized */}
                        {showGuestDropdown && (
                            <div className="absolute top-full right-0 w-[380px] mt-4 bg-white dark:bg-[#0f172a] rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-2xl p-6 z-[200] space-y-6 animate-in fade-in slide-in-from-top-4 duration-500 max-h-[70vh] overflow-y-auto no-scrollbar">
                                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                                    <h4 className="font-bold text-slate-900 dark:text-white">{ls.roomsAndGuests}</h4>
                                    <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-1 rounded-lg uppercase tracking-wider">{totalRooms} {ls.roomsTotal}</span>
                                </div>
                                
                                {roomState.map((room, index) => (
                                    <div key={index} className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl relative">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">{ls.roomSingle} {index + 1}</div>
                                            {roomState.length > 1 && (
                                                <button onClick={() => removeRoom(index)} className="size-8 rounded-full bg-red-50 dark:bg-red-900/20 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all">
                                                    <span className="material-symbols-outlined text-sm">delete</span>
                                                </button>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-2 gap-6">
                                            {[{ label: ls.adults, field: 'adults', max: 6, min: 1, sub: ls.adultsAge }, { label: ls.children, field: 'children', max: 4, min: 0, sub: ls.childrenAge }].map((item) => (
                                                <div key={item.field} className="flex flex-col gap-2">
                                                    <div>
                                                        <div className="text-xs font-bold text-slate-900 dark:text-white">{item.label}</div>
                                                        <div className="text-[9px] font-medium text-slate-400">{item.sub}</div>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <button onClick={() => updateRoom(index, item.field, Math.max(item.min, room[item.field] - 1))} className="size-8 rounded-lg bg-white dark:bg-slate-800 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-700 transition-all border border-slate-200 dark:border-slate-700"><span className="material-symbols-outlined text-sm">remove</span></button>
                                                        <span className="w-4 text-center text-sm font-bold">{room[item.field]}</span>
                                                        <button onClick={() => updateRoom(index, item.field, Math.min(item.max, room[item.field] + 1))} className="size-8 rounded-lg bg-white dark:bg-slate-800 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-700 transition-all border border-slate-200 dark:border-slate-700"><span className="material-symbols-outlined text-sm">add</span></button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {room.children > 0 && (
                                            <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                                                {room.childAges.map((age, ageIdx) => (
                                                    <div key={ageIdx} className="space-y-1">
                                                        <label className="text-[10px] font-bold text-slate-500">{ls.children} {ageIdx + 1} {ls.years}</label>
                                                        <select
                                                            value={age}
                                                            onChange={(e) => updateChildAge(index, ageIdx, e.target.value)}
                                                            className="w-full h-10 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs px-2 font-bold focus:border-primary focus:ring-0"
                                                        >
                                                            {[...Array(18)].map((_, i) => <option key={i} value={i}>{i} {ls.years}</option>)}
                                                        </select>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}

                                {roomState.length < 5 && (
                                    <button
                                        onClick={addRoom}
                                        className="w-full py-4 bg-primary/5 text-primary rounded-2xl text-[11px] font-bold uppercase tracking-widest hover:bg-primary hover:text-white transition-all border border-dashed border-primary/30 flex items-center justify-center gap-2"
                                    >
                                        <span className="material-symbols-outlined text-base">add</span>
                                        {ls.addRoom}
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Premium Search Button */}
                    <div className="lg:col-span-2">
                        <button
                            onClick={handleSearch}
                            className="w-full h-[72px] bg-primary text-white rounded-3xl font-bold flex items-center justify-center gap-3 shadow-xl shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all group/sbtn relative overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/sbtn:translate-x-full transition-transform duration-1000"></div>
                            <span className="material-symbols-outlined text-2xl group-hover/sbtn:rotate-12 transition-transform">search</span>
                            <span className="text-sm tracking-tight">{ls.searchBtn}</span>
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default DashboardSearch;
