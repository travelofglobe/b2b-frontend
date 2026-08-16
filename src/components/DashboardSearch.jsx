import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { autocompleteService } from '../services/autocompleteService';
import DatePicker from "react-datepicker";
import { format } from "date-fns";
import { tr, enUS, enGB, de, ru, ar, es, fr, it, pt, nl, pl, uk, bg, zhCN, ja, faIR, el } from 'date-fns/locale';
import HolidaySidePanel from "./HolidaySidePanel";
import 'react-datepicker/dist/react-datepicker.css';
import "../datepicker-custom.css";
import { useHolidays } from '../utils/useHolidays';
import { parseGuestsParam, serializeGuestsParam, convertOldParamsToRooms, validateAndSanitizeDates } from '../utils/searchParamsUtils';
import { useTranslation } from 'react-i18next';

import { getUserCountryCode } from '../utils/geoUtils';
import NationalitySelect from './NationalitySelect';

// Rest of imports...

// Register dynamic locales
import { registerLocale } from 'react-datepicker';
registerLocale('en', enUS);
registerLocale('tr', tr);
registerLocale('es', es);
registerLocale('ru', ru);
registerLocale('zhCN', zhCN);
registerLocale('ja', ja);
registerLocale('faIR', faIR);
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
    const [searchParams] = useSearchParams();

    // Initialize state from URL params or defaults
    const [query, setQuery] = useState(() => {
        return searchParams.get('q') || localStorage.getItem('dashboard_last_search') || '';
    });

    // Nationality State
    const [nationality, setNationality] = useState(() => {
        return searchParams.get('nationality') || localStorage.getItem('dashboard_last_nationality') || localStorage.getItem('agency_country_code') || getUserCountryCode();
    });

    const [destinationCountryCode, setDestinationCountryCode] = useState(() => localStorage.getItem('dashboard_last_countryCode') || null);
    const [visibleMonth, setVisibleMonth] = useState(new Date());

    const { holidays } = useHolidays(destinationCountryCode);

    const renderDayContents = (day, date) => {
        const dateStr = format(date, "yyyy-MM-dd");
        const holiday = holidays.find((h) => h.date === dateStr);
        const dayClass = holiday ? "holiday-day" : "";
        return <div className={dayClass}>{day}</div>;
    };

    const [results, setResults] = useState({ hotels: [], regions: [] });
    const [loading, setLoading] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);
    const [searchHistory, setSearchHistory] = useState([]);

    const fetchSearchHistory = async () => {
        try {
            const res = await autocompleteService.getSearchHistory();
            const items = res?.data?.content || res?.content || (Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []));
            if (Array.isArray(items)) {
                setSearchHistory(items);
                
                if (items.length > 0) {
                    setQuery(prev => {
                        if (!prev) {
                            const mostRecent = items[0];
                            const queryToSet = mostRecent.query || mostRecent.name || '';
                            
                            const itemType = mostRecent.type || mostRecent.searchType || 'SEARCH';
                            localStorage.setItem('dashboard_last_search', queryToSet);
                            localStorage.setItem('dashboard_last_type', itemType);
                            
                            if (mostRecent.targetId) {
                                if (itemType === 'LOCATION') {
                                    localStorage.setItem('dashboard_last_locationId', mostRecent.targetId);
                                } else if (itemType === 'HOTEL') {
                                    localStorage.setItem('dashboard_last_hotelId', mostRecent.targetId);
                                }
                            }
                            return queryToSet;
                        }
                        return prev;
                    });
                }
            }
        } catch (err) {
            console.error("Error fetching search history:", err);
        }
    };

    useEffect(() => {
        fetchSearchHistory();
    }, []);

    const handleClearHistory = async (e) => {
        if (e) e.stopPropagation();
        try {
            await autocompleteService.clearSearchHistory();
            setSearchHistory([]);
        } catch (err) {
            console.error("Error clearing search history:", err);
        }
    };

    const saveSearchHistoryItem = async (q, type, targetId, subtitle) => {
        if (!q || !q.trim()) return;
        try {
            await autocompleteService.saveSearchHistory({
                query: q.trim(),
                searchType: type || 'SEARCH',
                targetId: targetId ? String(targetId) : null,
                subtitle: subtitle || null
            });
            fetchSearchHistory();
        } catch (err) {
            console.error("Error saving search history:", err);
        }
    };

    const handleSelectHistoryItem = (item) => {
        const itemType = item.type || item.searchType || 'SEARCH';
        setQuery(item.query);
        setResults({ hotels: [], regions: [] });
        isUserInteraction.current = false;
        setShowDropdown(false);
        saveSearchHistoryItem(item.query, itemType, item.targetId, item.subtitle);

        localStorage.setItem('dashboard_last_search', item.query);
        localStorage.setItem('dashboard_last_type', itemType);
        if (item.targetId) {
            if (itemType === 'LOCATION') {
                localStorage.setItem('dashboard_last_locationId', item.targetId);
            } else if (itemType === 'HOTEL') {
                localStorage.setItem('dashboard_last_hotelId', item.targetId);
            }
        }
    };

    const handleDeleteHistoryItem = async (e, id) => {
        if (e) e.stopPropagation();
        if (!id) return;
        try {
            await autocompleteService.deleteSearchHistoryItem(id);
            setSearchHistory(prev => prev.filter(item => item.id !== id));
        } catch (err) {
            console.error("Error deleting search history item:", err);
        }
    };

    // Reset active index when results change
    useEffect(() => {
        setActiveIndex(-1);
    }, [results]);

    // Initialize & sanitize search dates (guarantees checkIn is not in the past and checkOut > checkIn)
    const [checkInDate, setCheckInDate] = useState(() => {
        const checkinParam = searchParams.get('checkin') || localStorage.getItem('dashboard_last_checkin');
        const checkoutParam = searchParams.get('checkout') || localStorage.getItem('dashboard_last_checkout');
        return validateAndSanitizeDates(checkinParam, checkoutParam).checkInDate;
    });

    const [checkOutDate, setCheckOutDate] = useState(() => {
        const checkinParam = searchParams.get('checkin') || localStorage.getItem('dashboard_last_checkin');
        const checkoutParam = searchParams.get('checkout') || localStorage.getItem('dashboard_last_checkout');
        return validateAndSanitizeDates(checkinParam, checkoutParam).checkOutDate;
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
            const resultsData = data?.data || data;
            
            if (resultsData) {
                const items = resultsData.content || [];
                const hotels = items.filter(item => item.type === 'HOTEL');
                const regions = items.filter(item => item.type === 'LOCATION');
                setResults({ hotels, regions });
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

            if (query !== savedLastSearch) {
                saveSearchHistoryItem(query, 'SEARCH', null, null);
                localStorage.setItem('dashboard_last_search', query);
                localStorage.setItem('dashboard_last_type', 'SEARCH');
                localStorage.removeItem('dashboard_last_hotelId');
                localStorage.removeItem('dashboard_last_locationId');
            }

            if (savedLastType === 'HOTEL' && query === savedLastSearch && savedLastHotelId) {
                const searchParamsString = getUrlParams();
                navigate(`/hotel/${savedLastHotelId}?${searchParamsString}`);
                return;
            }
            
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

        saveSearchHistoryItem(fullName, 'LOCATION', location.locationId, getRegionName(location));

        localStorage.setItem('dashboard_last_search', fullName);
        localStorage.setItem('dashboard_last_type', 'LOCATION');
        // Save locationId for later use with Search button
        if (location.locationId) {
            localStorage.setItem('dashboard_last_locationId', location.locationId);
        }

        const countryCode = location.countryCode || (location.locationBreadcrumbs?.find(b => b.locationType === 'COUNTRY')?.countryCode);
        if (countryCode) {
            setDestinationCountryCode(countryCode);
            localStorage.setItem('dashboard_last_countryCode', countryCode);
        }

        // Generate hierarchical slug
        const slug = buildLocationSlug(location);

        isUserInteraction.current = false;
        setResults({ hotels: [], regions: [] });
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
        let locationContext = '';
        if (hotel.locationBreadcrumbs && hotel.locationBreadcrumbs.length > 0) {
            const parts = hotel.locationBreadcrumbs.map(b => b.name.translations.en || b.name.defaultName);
            locationContext = parts.reverse().join(', ');
            fullName = `${name}, ${locationContext}`;
        } else if (hotel.countryCode) {
            locationContext = hotel.countryCode;
            fullName = `${name}, ${hotel.countryCode}`;
        }

        const hId = hotel.hotelId || hotel.id?.replace('hotel_', '');
        saveSearchHistoryItem(fullName, 'HOTEL', hId, locationContext);

        localStorage.setItem('dashboard_last_search', fullName);
        localStorage.setItem('dashboard_last_type', 'HOTEL');
        localStorage.setItem('dashboard_last_hotelId', hId);

        const countryCode = hotel.countryCode || (hotel.locationBreadcrumbs?.find(b => b.locationType === 'COUNTRY')?.countryCode);
        if (countryCode) {
            setDestinationCountryCode(countryCode);
            localStorage.setItem('dashboard_last_countryCode', countryCode);
        }

        // Reset user interaction flag and close dropdown to prevent reopening
        isUserInteraction.current = false;
        setResults({ hotels: [], regions: [] });
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

    const matchingHistory = query.trim()
        ? searchHistory.filter(item => item.query.toLowerCase().includes(query.toLowerCase().trim()))
        : searchHistory;

    const hasAnyResults = matchingHistory.length > 0 || results.regions.length > 0 || results.hotels.length > 0 || loading;

    return (
        <section className="relative group/search">
            {/* Soft ambient glow */}
            <div className="absolute -inset-4 bg-primary/5 rounded-3xl blur-[100px] opacity-0 group-hover/search:opacity-100 transition-opacity duration-700"></div>

            <div className="relative bg-white/40 dark:bg-slate-900/40 backdrop-blur-3xl rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.04)] p-3.5 border border-white/60 dark:border-white/10 transition-all duration-300 hover:shadow-[0_20px_50px_rgba(0,0,0,0.06)]">
                
                {/* Modern Service Tabs */}
                <div className="flex flex-wrap items-center gap-1.5 mb-4 p-0.5 relative z-10">
                    <button className="bg-primary/10 text-primary px-4 py-2 rounded-xl font-semibold text-xs flex items-center gap-2 transition-all transform active:scale-95 group/btn">
                        <span className="material-symbols-outlined text-sm fill-1">hotel</span>
                        <span className="tracking-tight">{ls.hotels}</span>
                    </button>
                    {['flight', 'airport_shuttle', 'explore', 'directions_car'].map((icon, i) => (
                        <button key={i} className="px-3.5 py-2 rounded-xl font-medium text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 transition-all hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white group/soon" disabled>
                            <span className="material-symbols-outlined text-base leading-none opacity-70 group-hover/soon:opacity-100">{icon}</span>
                            <span className="tracking-tight">{icon === 'airport_shuttle' ? ls.transfer : icon === 'explore' ? ls.tours : icon === 'directions_car' ? ls.carRental : icon.charAt(0).toUpperCase() + icon.slice(1)}</span>
                            <span className="bg-slate-200/50 dark:bg-slate-800/80 text-[9px] font-semibold px-1.5 py-0.5 rounded-md opacity-50 group-hover/soon:opacity-100 transition-opacity">{ls.soon}</span>
                        </button>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-2 p-0.5 relative z-10">
                    {/* Destination Input */}
                    <div className="lg:col-span-3 relative group/field" ref={searchWrapperRef}>
                        <div className={`flex flex-col justify-center gap-0.5 px-3.5 py-2 h-[58px] bg-white/60 dark:bg-slate-800/60 rounded-xl border transition-all duration-200 ${error ? 'border-red-500 bg-red-50/50 dark:bg-red-900/10' : 'border-slate-200/60 dark:border-slate-700/60 group-hover/field:border-primary/40 group-hover/field:bg-white dark:group-hover/field:bg-slate-800 shadow-sm'}`}>
                            <label className={`text-[9.5px] font-semibold uppercase tracking-wider flex items-center gap-1.5 h-4 leading-none ${error ? 'text-red-500' : 'text-slate-400 dark:text-slate-500'}`}>
                                <span className={`material-symbols-outlined text-[13px] ${error ? 'text-red-500' : 'text-primary'}`}>
                                    {error ? 'error' : 'location_on'}
                                </span>
                                {error ? ls.destinationRequired : ls.location}
                            </label>
                            <div className="flex-1 flex items-center min-w-0 mt-0.5">
                                <input
                                    className="bg-transparent border-none outline-none focus:ring-0 w-full p-0 text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400/60 tracking-tight"
                                    placeholder={ls.placeholder}
                                    type="text"
                                    value={query}
                                    onChange={(e) => {
                                        isUserInteraction.current = true;
                                        setQuery(e.target.value);
                                        if (error) setError(false);
                                    }}
                                    onClick={(e) => {
                                        e.target.select();
                                        fetchSearchHistory();
                                        setShowDropdown(true);
                                    }}
                                    onFocus={() => {
                                        fetchSearchHistory();
                                        setShowDropdown(true);
                                    }}
                                    onKeyDown={handleKeyDown}
                                />
                            </div>
                            {loading && <div className="absolute right-3.5 top-1/2 -translate-y-1/2 size-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>}
                        </div>

                        {/* Redesigned Multi-Category Autocomplete & Past Searches Dropdown */}
                        {showDropdown && hasAnyResults && (
                            <div className="absolute top-full left-0 w-full md:w-[460px] mt-2 bg-white dark:bg-[#0f172a] rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xl max-h-[420px] overflow-y-auto z-[300] p-3 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200 divide-y divide-slate-100 dark:divide-slate-800/60">
                                
                                {/* 1. Past Searches Section */}
                                {matchingHistory.length > 0 && (
                                    <div className="pt-1">
                                        <div className="flex items-center justify-between px-3 py-1 mb-1.5 bg-purple-50/50 dark:bg-purple-900/10 rounded-xl">
                                            <span className="text-[11px] font-bold text-purple-700 dark:text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                                                <span className="material-symbols-outlined text-sm">history</span>
                                                Son Aramalar
                                                <span className="text-[9px] bg-purple-500/15 text-purple-700 dark:text-purple-300 px-1.5 py-0.2 rounded-full font-semibold">
                                                    {matchingHistory.length}
                                                </span>
                                            </span>
                                            {!query.trim() && (
                                                <button
                                                    onClick={handleClearHistory}
                                                    className="text-[11px] font-medium text-slate-400 hover:text-red-500 flex items-center gap-1 transition-colors px-1.5 py-0.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                                                    title="Geçmişi Temizle"
                                                >
                                                    <span className="material-symbols-outlined text-sm">delete</span>
                                                    Temizle
                                                </button>
                                            )}
                                        </div>
                                        <div className="space-y-1">
                                            {matchingHistory.map((item, index) => {
                                                const itemType = item.type || item.searchType || 'SEARCH';
                                                const isLocation = itemType === 'LOCATION';
                                                const isHotel = itemType === 'HOTEL';

                                                return (
                                                    <div
                                                        key={item.id || index}
                                                        onClick={() => handleSelectHistoryItem(item)}
                                                        className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800/80 rounded-xl flex items-center justify-between transition-all group cursor-pointer"
                                                    >
                                                        <div className="flex items-center gap-3 min-w-0 flex-1">
                                                            <div className={`size-8 rounded-xl flex items-center justify-center transition-colors shrink-0 shadow-sm ring-1 ${
                                                                isLocation
                                                                    ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 ring-amber-500/20'
                                                                    : isHotel
                                                                    ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 ring-blue-500/20'
                                                                    : 'bg-purple-500/10 text-purple-600 dark:text-purple-400 ring-purple-500/20'
                                                            }`}>
                                                                <span className="material-symbols-outlined text-base">
                                                                    {isLocation ? 'location_city' : isHotel ? 'hotel' : 'history'}
                                                                </span>
                                                            </div>
                                                            <div className="min-w-0 flex-1">
                                                                <div className="text-xs font-semibold text-slate-900 dark:text-white tracking-tight truncate">{item.query}</div>
                                                                {item.subtitle && (
                                                                    <div className="text-[10.5px] text-slate-400 truncate">{item.subtitle}</div>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={(e) => handleDeleteHistoryItem(e, item.id)}
                                                            className="opacity-0 group-hover:opacity-100 p-1 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all shrink-0 ml-2"
                                                            title="Bu aramayı sil"
                                                        >
                                                            <span className="material-symbols-outlined text-sm leading-none block">close</span>
                                                        </button>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* 2. Locations & Regions Section */}
                                {results.regions.length > 0 && (
                                    <div className="pt-2">
                                        <div className="flex items-center justify-between px-3 py-1 mb-1.5 bg-amber-50/50 dark:bg-amber-900/10 rounded-xl">
                                            <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                                                <span className="material-symbols-outlined text-sm">location_on</span>
                                                {ls.popularDestinations}
                                                <span className="text-[9px] bg-amber-500/15 text-amber-700 dark:text-amber-300 px-1.5 py-0.2 rounded-full font-semibold">
                                                    {results.regions.length}
                                                </span>
                                            </span>
                                        </div>
                                        <div className="space-y-1">
                                            {results.regions.map((region, index) => (
                                                <button
                                                    key={region.locationId}
                                                    onClick={() => handleSelectLocation(region)}
                                                    className={`w-full text-left px-3 py-2 hover:bg-amber-50/40 dark:hover:bg-amber-900/20 rounded-xl flex items-center gap-3 transition-all group ${activeIndex === index ? 'bg-amber-50 dark:bg-amber-900/30 ring-1 ring-amber-500/20' : ''}`}
                                                >
                                                    <div className="size-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center transition-colors shadow-sm ring-1 ring-amber-500/20 shrink-0">
                                                        <span className="material-symbols-outlined text-lg">location_city</span>
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <div className="text-xs font-semibold text-slate-900 dark:text-white tracking-tight truncate">{region.name.translations.en || region.name.defaultName}</div>
                                                        <div className="text-[11px] font-normal text-slate-500 truncate">{getRegionName(region)}</div>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* 3. Hotels Section */}
                                {results.hotels.length > 0 && (
                                    <div className="pt-2">
                                        <div className="flex items-center justify-between px-3 py-1 mb-1.5 bg-blue-50/50 dark:bg-blue-900/10 rounded-xl">
                                            <span className="text-[11px] font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                                                <span className="material-symbols-outlined text-sm">hotel</span>
                                                {ls.featuredHotels}
                                                <span className="text-[9px] bg-blue-500/15 text-blue-700 dark:text-blue-300 px-1.5 py-0.2 rounded-full font-semibold">
                                                    {results.hotels.length}
                                                </span>
                                            </span>
                                        </div>
                                        <div className="space-y-1">
                                            {results.hotels.map((hotel, index) => (
                                                <button
                                                    key={hotel.hotelId}
                                                    onClick={() => handleSelectHotel(hotel)}
                                                    className={`w-full text-left px-3 py-2 hover:bg-blue-50/40 dark:hover:bg-blue-900/20 rounded-xl flex items-center gap-3 transition-all group ${activeIndex === (results.regions.length + index) ? 'bg-blue-50 dark:bg-blue-900/30 ring-1 ring-blue-500/20' : ''}`}
                                                >
                                                    <div className="size-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center transition-colors shadow-sm ring-1 ring-blue-500/20 shrink-0">
                                                        <span className="material-symbols-outlined text-lg">hotel</span>
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <div className="text-xs font-semibold text-slate-900 dark:text-white tracking-tight truncate">{getHotelName(hotel)}</div>
                                                        <div className="text-[11px] font-normal text-slate-500 truncate">
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

                                {/* Loading Indicator */}
                                {loading && (
                                    <div className="flex items-center justify-center py-4 text-slate-400 gap-2">
                                        <div className="size-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                                        <span className="text-xs font-medium">Aranıyor...</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Date Picker Group */}
                    <div className="lg:col-span-3 relative group/field">
                        <div 
                            className="flex flex-col justify-center gap-0.5 px-3.5 py-2 h-[58px] bg-white/60 dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-slate-700/60 transition-all duration-200 group-hover/field:border-primary/40 group-hover/field:bg-white dark:group-hover/field:bg-slate-800 shadow-sm cursor-pointer"
                            onClick={() => datePickerRef.current?.setOpen(true)}
                        >
                            <label className="text-[9.5px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center justify-between w-full h-4 leading-none">
                                <div className="flex items-center gap-1.5 leading-none">
                                    <span className="material-symbols-outlined text-[13px] text-primary">calendar_today</span>
                                    {ls.checkInOut}
                                </div>
                                {checkInDate && checkOutDate && (
                                    <div className="flex items-center gap-1 px-1.5 py-0.5 -my-1 rounded-md bg-primary/10 text-primary border border-primary/20 animate-in fade-in">
                                        <span className="material-symbols-outlined text-[11px] leading-none">bedtime</span>
                                        <span className="text-[9px] font-medium uppercase tracking-tight leading-none">
                                            {Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24))} {Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24)) === 1 ? ls.nightSingle : ls.nights}
                                        </span>
                                    </div>
                                )}
                            </label>
                            <div className="flex-1 flex items-center min-w-0 mt-0.5 datepicker-dashboard">
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
                                    onCalendarOpen={() => setVisibleMonth(checkInDate || new Date())}
                                    onMonthChange={(date) => setVisibleMonth(date)}
                                    locale={currentLang}
                                    className="bg-transparent border-none outline-none focus:outline-none focus:ring-0 w-full p-0 text-xs font-medium text-slate-900 dark:text-white cursor-pointer tracking-tight whitespace-nowrap leading-tight"
                                    wrapperClassName="w-full flex items-center"
                                    dateFormat="dd MMM yyyy"
                                    placeholderText={ls.placeholder}
                                    calendarClassName="shadow-2xl border-none font-sans"
                                    popperPlacement="bottom-start"
                                    renderDayContents={(day, date) => {
                                        const formattedDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
                                        const holiday = holidays?.find(h => h.date === formattedDate || h.holidayDate === formattedDate);
                                        
                                        if (holiday) {
                                            const lowerName = (holiday.holidayName || holiday.name || '').toLowerCase();
                                            const isReligious = lowerName.includes('eid') || lowerName.includes('ramazan') || lowerName.includes('kurban');
                                            const typeClass = isReligious ? 'type-religious' : 'type-public';
                                            
                                            // Handle language matching for tooltip
                                            const langPrefix = (i18n.language || 'en').substring(0, 2).toLowerCase();
                                            const hCountry = (holiday.countryCode || destinationCountryCode || '').toLowerCase();
                                            const isLocalLang = langPrefix === hCountry;
                                            const displayTooltipName = (isLocalLang && holiday.localName) ? holiday.localName : (holiday.holidayName || holiday.name);

                                            return (
                                                <div className={`holiday-day-container ${typeClass}`}>
                                                    {day}
                                                    <div className="holiday-tooltip">
                                                        <div className="holiday-tooltip-country">
                                                            {holiday.countryCode || destinationCountryCode}
                                                        </div>
                                                        <div className="holiday-tooltip-name">{displayTooltipName}</div>
                                                        <div className="holiday-tooltip-type">{isReligious ? 'Dini Tatil' : 'Resmi Tatil'}</div>
                                                    </div>
                                                </div>
                                            );
                                        }
                                        return day;
                                    }}
                                >
                                    <HolidaySidePanel holidays={holidays} visibleMonth={visibleMonth} />
                                </DatePicker>
                            </div>
                        </div>
                    </div>

                    {/* Nationality Section */}
                    <div className="lg:col-span-2 relative group/field">
                        <div className="flex flex-col justify-center gap-0.5 px-3.5 py-2 h-[58px] bg-white/60 dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-slate-700/60 transition-all duration-200 group-hover/field:border-primary/40 group-hover/field:bg-white dark:group-hover/field:bg-slate-800 shadow-sm">
                            <label className="text-[9.5px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5 h-4 leading-none">
                                <span className="material-symbols-outlined text-[13px] text-primary">public</span>
                                {ls.nationality}
                            </label>
                            <div className="flex-1 flex items-center min-w-0 mt-0.5">
                                <NationalitySelect value={nationality} onChange={setNationality} compact={false} />
                            </div>
                        </div>
                    </div>

                    {/* Elegant Guest Selector */}
                    <div className="lg:col-span-2 relative group/field" ref={guestWrapperRef}>
                        <button
                            onClick={() => setShowGuestDropdown(!showGuestDropdown)}
                            className="w-full h-[58px] flex flex-col justify-center items-start gap-0.5 px-3.5 py-2 bg-white/60 dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-slate-700/60 shadow-sm transition-all duration-200 group-hover/field:border-primary/40 group-hover/field:bg-white dark:group-hover/field:bg-slate-800 text-left"
                        >
                            <label className="text-[9.5px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5 h-4 leading-none">
                                <span className="material-symbols-outlined text-[13px] text-primary">group</span>
                                {ls.occupants}
                            </label>
                            <div className="flex-1 flex items-center justify-between w-full mt-0.5">
                                <span className="text-xs font-medium text-slate-900 dark:text-white tracking-tight truncate w-full">
                                    {totalAdults} {ls.adults.substring(0, 3)}, {totalChildren} {ls.children.substring(0, 3)}
                                </span>
                                <span className="material-symbols-outlined text-slate-400 text-base transition-transform group-hover/field:translate-y-0.5">expand_more</span>
                            </div>
                        </button>

                        {/* Guest Dropdown - Modernized */}
                        {showGuestDropdown && (
                            <div className="absolute top-full right-0 w-[360px] mt-2 bg-white dark:bg-[#0f172a] rounded-2xl border border-slate-100 dark:border-slate-800 shadow-2xl p-5 z-[200] space-y-4 animate-in fade-in slide-in-from-top-2 duration-200 max-h-[70vh] overflow-y-auto no-scrollbar">
                                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                                    <h4 className="font-semibold text-sm text-slate-900 dark:text-white">{ls.roomsAndGuests}</h4>
                                    <span className="text-[10px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-md uppercase tracking-wider">{totalRooms} {ls.roomsTotal}</span>
                                </div>
                                
                                {roomState.map((room, index) => (
                                    <div key={index} className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl relative">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">{ls.roomSingle} {index + 1}</div>
                                            {roomState.length > 1 && (
                                                <button onClick={() => removeRoom(index)} className="size-7 rounded-full bg-red-50 dark:bg-red-900/20 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all">
                                                    <span className="material-symbols-outlined text-xs">delete</span>
                                                </button>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            {[{ label: ls.adults, field: 'adults', max: 6, min: 1, sub: ls.adultsAge }, { label: ls.children, field: 'children', max: 4, min: 0, sub: ls.childrenAge }].map((item) => (
                                                <div key={item.field} className="flex flex-col gap-1.5">
                                                    <div>
                                                        <div className="text-xs font-semibold text-slate-900 dark:text-white">{item.label}</div>
                                                        <div className="text-[9px] font-medium text-slate-400">{item.sub}</div>
                                                    </div>
                                                    <div className="flex items-center gap-2.5">
                                                        <button onClick={() => updateRoom(index, item.field, Math.max(item.min, room[item.field] - 1))} className="size-7 rounded-lg bg-white dark:bg-slate-800 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-700 transition-all border border-slate-200 dark:border-slate-700"><span className="material-symbols-outlined text-xs">remove</span></button>
                                                        <span className="w-4 text-center text-xs font-semibold">{room[item.field]}</span>
                                                        <button onClick={() => updateRoom(index, item.field, Math.min(item.max, room[item.field] + 1))} className="size-7 rounded-lg bg-white dark:bg-slate-800 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-700 transition-all border border-slate-200 dark:border-slate-700"><span className="material-symbols-outlined text-xs">add</span></button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {room.children > 0 && (
                                            <div className="grid grid-cols-2 gap-2.5 mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                                                {room.childAges.map((age, ageIdx) => (
                                                    <div key={ageIdx} className="space-y-1">
                                                        <label className="text-[10px] font-medium text-slate-500">{ls.children} {ageIdx + 1} {ls.years}</label>
                                                        <select
                                                            value={age}
                                                            onChange={(e) => updateChildAge(index, ageIdx, e.target.value)}
                                                            className="w-full h-9 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-xs px-2 font-medium focus:border-primary focus:ring-0"
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
                                        className="w-full py-3 bg-primary/5 text-primary rounded-xl text-xs font-semibold uppercase tracking-wider hover:bg-primary hover:text-white transition-all border border-dashed border-primary/30 flex items-center justify-center gap-1.5"
                                    >
                                        <span className="material-symbols-outlined text-sm">add</span>
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
                            className="w-full h-[58px] bg-primary text-white rounded-xl font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all group/sbtn relative overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/sbtn:translate-x-full transition-transform duration-1000"></div>
                            <span className="material-symbols-outlined text-xl group-hover/sbtn:rotate-12 transition-transform">search</span>
                            <span className="tracking-tight">{ls.searchBtn}</span>
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default DashboardSearch;
