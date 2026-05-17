import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import HotelCard from '../components/HotelCard';
import HotelCardSkeleton from '../components/HotelCardSkeleton';
import Footer from '../components/Footer';
import Breadcrumbs from '../components/Breadcrumbs';
import { parseGuestsParam } from '../utils/searchParamsUtils';
import { hotelService } from '../services/hotelService';
import { locationService } from '../services/locationService';
import placeholderHotel from '../assets/placeholder-hotel.svg';

const LISTING_LOCALES = {
    en: {
        room: "Room",
        rooms: "Rooms",
        guest: "Guest",
        guests: "Guests",
        searching: "Searching...",
        propertiesFound: "properties found",
        sortBy: "SORT BY:",
        mapView: "Map View",
        backToDashboard: "Back to Dashboard",
        noProperties: "No properties found",
        recommended: "Most Recommended",
        ratingDesc: "Guest Rating: High to Low",
        ratingAsc: "Guest Rating: Low to High",
        starDesc: "Star Rating: High to Low",
        starAsc: "Star Rating: Low to High",
        reachedEnd: "You've reached the end of the list",
        tryAdjusting: "Try adjusting your filters or location",
        allHotels: "All Hotels"
    },
    tr: {
        room: "Oda",
        rooms: "Oda",
        guest: "Misafir",
        guests: "Misafir",
        searching: "Aranıyor...",
        propertiesFound: "tesis bulundu",
        sortBy: "SIRALAMA:",
        mapView: "Harita Görünümü",
        backToDashboard: "Panele Dön",
        noProperties: "Tesis bulunamadı",
        recommended: "En Çok Önerilen",
        ratingDesc: "Puan: Yüksekten Düşüğe",
        ratingAsc: "Puan: Düşükten Yükseğe",
        starDesc: "Yıldız: Yüksekten Düşüğe",
        starAsc: "Yıldız: Düşükten Yükseğe",
        reachedEnd: "Listenin sonuna ulaştınız",
        tryAdjusting: "Filtrelerinizi veya arama kelimenizi değiştirmeyi deneyin",
        allHotels: "Tüm Oteller"
    },
    ar: {
        room: "غرفة",
        rooms: "غرف",
        guest: "نزيل",
        guests: "نزلاء",
        searching: "جاري البحث...",
        propertiesFound: "عقارات تم العثور عليها",
        sortBy: "ترتيب حسب:",
        mapView: "عرض الخريطة",
        backToDashboard: "العودة إلى لوحة القيادة",
        noProperties: "لم يتم العثور على عقارات",
        recommended: "الأكثر موصى به",
        ratingDesc: "تقييم النزلاء: من الأعلى إلى الأقل",
        ratingAsc: "تقييم النزلاء: من الأقل إلى الأعلى",
        starDesc: "تصنيف النجوم: من الأعلى إلى الأقل",
        starAsc: "تصنيف النجوم: من الأقل إلى الأعلى",
        reachedEnd: "لقد وصلت إلى نهاية القائمة",
        tryAdjusting: "حاول تعديل الفلاتر أو الموقع",
        allHotels: "جميع الفنادق"
    },
    es: {
        room: "Habitación",
        rooms: "Habitaciones",
        guest: "Huésped",
        guests: "Huéspedes",
        searching: "Buscando...",
        propertiesFound: "propiedades encontradas",
        sortBy: "ORDENAR POR:",
        mapView: "Vista de Mapa",
        backToDashboard: "Volver al Panel",
        noProperties: "No se encontraron propiedades",
        recommended: "Más Recomendado",
        ratingDesc: "Calificación: alta a baja",
        ratingAsc: "Calificación: baja a alta",
        starDesc: "Estrellas: alta a baja",
        starAsc: "Estrellas: baja a alta",
        reachedEnd: "Has llegado al final de la lista",
        tryAdjusting: "Intenta ajustar tus filtros o ubicación",
        allHotels: "Todos los Hoteles"
    },
    ru: {
        room: "Номер",
        rooms: "Номера",
        guest: "Гость",
        guests: "Гости",
        searching: "Поиск...",
        propertiesFound: "объектов найдено",
        sortBy: "СОРТИРОВКА:",
        mapView: "На карте",
        backToDashboard: "Панель управления",
        noProperties: "Объекты не найдены",
        recommended: "Рекомендуемые",
        ratingDesc: "Оценка гостей: от высокой к низкой",
        ratingAsc: "Оценка гостей: от низкой к высокой",
        starDesc: "Звездность: от высокой к низкой",
        starAsc: "Звездность: от низкой к высокой",
        reachedEnd: "Вы дошли до конца списка",
        tryAdjusting: "Попробуйте изменить фильтры или местоположение",
        allHotels: "Все отели"
    },
    zh: {
        room: "间客房",
        rooms: "间客房",
        guest: "位旅客",
        guests: "位旅客",
        searching: "正在搜索...",
        propertiesFound: "家酒店",
        sortBy: "排序方式:",
        mapView: "地图模式",
        backToDashboard: "返回仪表板",
        noProperties: "未找到符合条件的酒店",
        recommended: "推荐",
        ratingDesc: "评分：从高到低",
        ratingAsc: "评分：从低到高",
        starDesc: "星级：从高到低",
        starAsc: "星级：从低到高",
        reachedEnd: "您已浏览完所有酒店",
        tryAdjusting: "请尝试更改筛选条件或搜索位置",
        allHotels: "所有酒店"
    },
    ja: {
        room: "室",
        rooms: "室",
        guest: "名",
        guests: "名",
        searching: "検索中...",
        propertiesFound: "軒のホテルが見つかりました",
        sortBy: "並べ替え:",
        mapView: "地図で見る",
        backToDashboard: "ダッシュボードに戻る",
        noProperties: "ホテルが見つかりませんでした",
        recommended: "おすすめ順",
        ratingDesc: "クチコミ評価：高い順",
        ratingAsc: "クチコミ評価：低い順",
        starDesc: "星評価：高い順",
        starAsc: "星評価：低い順",
        reachedEnd: "リストの最後に達しました",
        tryAdjusting: "フィルターまたはエリアを調整してください",
        allHotels: "すべてのホテル"
    },
    fa: {
        room: "اتاق",
        rooms: "اتاق",
        guest: "مسافر",
        guests: "مسافر",
        searching: "در حال جستجو...",
        propertiesFound: "هتل پیدا شد",
        sortBy: "مرتب‌سازی بر اساس:",
        mapView: "نمایش روی نقشه",
        backToDashboard: "بازگشت به پنل کاربری",
        noProperties: "هیچ هتلی پیدا نشد",
        recommended: "بیشترین توصیه",
        ratingDesc: "امتیاز مسافران: زیاد به کم",
        ratingAsc: "امتیاز مسافران: کم به زیاد",
        starDesc: "تعداد ستاره: زیاد به کم",
        starAsc: "تعداد ستاره: کم به زیاد",
        reachedEnd: "به پایان لیست رسیده‌اید",
        tryAdjusting: "فیلترها یا موقعیت خود را تغییر دهید",
        allHotels: "همه هتل‌ها"
    },
    fr: {
        room: "Chambre",
        rooms: "Chambres",
        guest: "Voyageur",
        guests: "Voyageurs",
        searching: "Recherche...",
        propertiesFound: "établissements trouvés",
        sortBy: "TRIER PAR:",
        mapView: "Vue de Carte",
        backToDashboard: "Retour au Tableau",
        noProperties: "Aucun établissement trouvé",
        recommended: "Plus Recommandés",
        ratingDesc: "Note des clients : décroissante",
        ratingAsc: "Note des clients : croissante",
        starDesc: "Étoiles : décroissant",
        starAsc: "Étoiles : croissant",
        reachedEnd: "Vous avez atteint la fin de la liste",
        tryAdjusting: "Essayez d'ajuster vos filtres ou lieu",
        allHotels: "Tous les Hôtels"
    },
    it: {
        room: "Camera",
        rooms: "Camere",
        guest: "Ospite",
        guests: "Ospiti",
        searching: "Ricerca...",
        propertiesFound: "strutture trovate",
        sortBy: "ORDINA PER:",
        mapView: "Mappa",
        backToDashboard: "Torna alla Dashboard",
        noProperties: "Nessuna struttura trovata",
        recommended: "Più Consigliati",
        ratingDesc: "Valutazione ospiti: alta a bassa",
        ratingAsc: "Valutazione ospiti: bassa a alta",
        starDesc: "Stelle: alta a bassa",
        starAsc: "Stelle: bassa a alta",
        reachedEnd: "Hai raggiunto la fine della lista",
        tryAdjusting: "Prova a modificare i filtri o la località",
        allHotels: "Tutti gli Hotel"
    },
    el: {
        room: "Δωμάτιο",
        rooms: "Δωμάτια",
        guest: "Επισκέπτης",
        guests: "Επισκέπτες",
        searching: "Αναζήτηση...",
        propertiesFound: "καταλύματα βρέθηκαν",
        sortBy: "ΤΑΞΙΝΟΜΗΣΗ ΚΑΤΑ:",
        mapView: "Προβολή Χάρτη",
        backToDashboard: "Πίσω στον Πίνακα",
        noProperties: "Δεν βρέθηκαν καταλύματα",
        recommended: "Προτεινόμενα",
        ratingDesc: "Βαθμολογία επισκεπτών: υψηλή προς χαμηλή",
        ratingAsc: "Βαθμολογία επισκεπτών: χαμηλή προς υψηλή",
        starDesc: "Αστέρια: υψηλή προς χαμηλή",
        starAsc: "Αστέρια: χαμηλή προς υψηλή",
        reachedEnd: "Φτάσατε στο τέλος της λίστας",
        tryAdjusting: "Δοκιμάστε να αλλάξετε τα φίλτρα ή την τοποθεσία",
        allHotels: "Όλα τα Ξενοδοχεία"
    },
    pt: {
        room: "Quarto",
        rooms: "Quartos",
        guest: "Hóspede",
        guests: "Hóspedes",
        searching: "Buscando...",
        propertiesFound: "propriedades encontradas",
        sortBy: "ORDENAR POR:",
        mapView: "Ver no Mapa",
        backToDashboard: "Voltar ao Painel",
        noProperties: "Nenhuma propriedade encontrada",
        recommended: "Mais Recomendados",
        ratingDesc: "Avaliação: alta para baixa",
        ratingAsc: "Avaliação: baixa para alta",
        starDesc: "Estrelas: alta para baixa",
        starAsc: "Estrelas: baixa para alta",
        reachedEnd: "Você chegou ao final da lista",
        tryAdjusting: "Tente ajustar seus filtros ou localidade",
        allHotels: "Todos os Hotéis"
    }
};

const tListing = (key, lang = 'tr') => {
    return LISTING_LOCALES[lang]?.[key] || LISTING_LOCALES['en']?.[key] || key;
};

const HotelListing = () => {
    // Mapping of facility IDs to Material Icon names and English labels
    const FACILITY_ICON_MAP = {
        98445: { icon: 'wifi', label: 'Free Wifi' },
        48325: { icon: 'wifi', label: 'Wifi Access' },
        3664: { icon: 'wifi', label: 'High Speed Internet' },
        616: { icon: 'pool', label: 'Outdoor Pool' },
        649: { icon: 'pool', label: 'Indoor Pool' },
        1685: { icon: 'pool', label: 'Kids Pool' },
        1985: { icon: 'spa', label: 'Spa' },
        1978: { icon: 'fitness_center', label: 'Health Club' },
        98455: { icon: 'fitness_center', label: 'Fitness' },
        47935: { icon: 'fitness_center', label: 'Gym' },
        641: { icon: 'restaurant', label: 'Restaurant' },
        3134: { icon: 'local_bar', label: 'Bar' },
        606: { icon: 'pets', label: 'Pets Allowed' },
        719: { icon: 'ac_unit', label: 'Air Conditioning' },
        101165: { icon: 'inventory_2', label: 'Minibar' },
        618: { icon: 'sports_tennis', label: 'Tennis' },
        3164: { icon: 'casino', label: 'Casino' },
        3154: { icon: 'nightlife', label: 'Night Club' },
        3891: { icon: 'hot_tub', label: 'Jacuzzi' },
        650: { icon: 'spa', label: 'Sauna' },
        3064: { icon: 'atm', label: 'ATM' },
        18006: { icon: 'business_center', label: 'Business Centre' },
        18366: { icon: 'local_laundry_service', label: 'Laundry' },
        603: { icon: 'child_care', label: 'Babysitting' },
        638: { icon: 'explore', label: 'Tour Desk' },
        646: { icon: 'support_agent', label: 'Concierge' },
        666: { icon: 'car_rental', label: 'Car Rental' },
        1993: { icon: 'lock', label: 'Safety Box' },
        1995: { icon: 'wheelchair_pickup', label: 'Wheelchair Access' },
        2007: { icon: 'elevator', label: 'Elevator' },
        98485: { icon: 'security', label: 'Security' },
        100075: { icon: 'smoking_rooms', label: 'Smoking Area' },
        1687: { icon: 'water_sports', label: 'Water Sports' },
        1981: { icon: 'child_friendly', label: 'Kids Club' },
        3724: { icon: 'beach_access', label: 'Beach' },
        18126: { icon: 'directions_bike', label: 'Bicycle Rental' },
        98415: { icon: 'airport_shuttle', label: 'Airport Shuttle' }
    };

    const { i18n } = useTranslation();
    const currentLang = i18n.language || localStorage.getItem('language') || 'tr';

    const [viewMode, setViewMode] = React.useState('list'); // 'list', 'grid2', 'grid3'
    const params = useParams();
    const slug = params['*'] || params.slug;
    const { theme, campaign } = params;
    const [searchParams] = useSearchParams();

    const [hotels, setHotels] = React.useState([]);
    const [page, setPage] = React.useState(0);
    const [isLoading, setIsLoading] = React.useState(false);
    const [hasMore, setHasMore] = React.useState(true);
    const [totalProperties, setTotalProperties] = React.useState(0);
    const [dynamicFilters, setDynamicFilters] = React.useState(null);
    const [sortConfig, setSortConfig] = React.useState({ field: null, order: 'DESC' });
    const abortControllerRef = React.useRef(null);

    /**
     * Returns default check-in (tomorrow) and check-out (day after) as yyyy-MM-dd strings.
     */
    const getDefaultDates = () => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const dayAfter = new Date(tomorrow);
        dayAfter.setDate(dayAfter.getDate() + 1);
        const fmt = (d) => {
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `${y}-${m}-${day}`;
        };
        return { checkin: fmt(tomorrow), checkout: fmt(dayAfter) };
    };

    const getSearchParams = () => {
        const starsParam = searchParams.get('stars');
        const freeCancellationParam = searchParams.get('freeCancellation');
        const prePaymentParam = searchParams.get('prePayment');
        const locationsParam = searchParams.get('locations');
        const roomTwinParam = searchParams.get('roomTwin');
        const roomMaxAdultParam = searchParams.get('roomMaxAdult');
        const roomMaxChildrenParam = searchParams.get('roomMaxChildren');
        const roomMaxExtraBedParam = searchParams.get('roomMaxExtraBed');
        const facilitiesParam = searchParams.get('facilities');

        return {
            stars: starsParam ? starsParam.split(',').map(Number) : [],
            freeCancellation: freeCancellationParam === 'true' ? true : freeCancellationParam === 'false' ? false : null,
            prePayment: prePaymentParam === 'true' ? true : prePaymentParam === 'false' ? false : null,
            locations: locationsParam ? locationsParam.split(',').map(Number) : [],
            roomTwin: roomTwinParam === 'true' ? true : roomTwinParam === 'false' ? false : null,
            roomMaxAdult: roomMaxAdultParam ? roomMaxAdultParam.split(',').map(Number) : null,
            roomMaxChildren: roomMaxChildrenParam ? roomMaxChildrenParam.split(',').map(Number) : null,
            roomMaxExtraBed: roomMaxExtraBedParam ? roomMaxExtraBedParam.split(',').map(Number) : null,
            facilities: facilitiesParam ? facilitiesParam.split(',').map(Number) : []
        };
    };

    const [locationNames, setLocationNames] = React.useState({});
    const [facilityNames, setFacilityNames] = React.useState({});
    const loaderRef = React.useRef(null);

    const gridClasses = {
        'list': 'grid-cols-1',
        'grid2': 'grid-cols-1 lg:grid-cols-2',
        'grid3': 'grid-cols-1 lg:grid-cols-2 xl:grid-cols-3',
        'grid4': 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
    };

    // Parse params
    const roomState = useMemo(() => {
        const guestsParam = searchParams.get('guests');
        if (guestsParam) {
            return parseGuestsParam(guestsParam);
        }
        // Fallback for old links
        const adults = searchParams.get('adults');
        const children = searchParams.get('children');
        return [{ adults: parseInt(adults) || 2, children: parseInt(children) || 0, childAges: [] }];
    }, [searchParams]);

    // Computed totals
    const totalAdults = roomState.reduce((sum, r) => sum + r.adults, 0);
    const totalChildren = roomState.reduce((sum, r) => sum + r.children, 0);
    const totalRooms = roomState.length;
    const totalGuests = totalAdults + totalChildren;

    // Get location name from query parameter
    const queryLocation = searchParams.get('q');
    
    // For hierarchical slugs, take the last segment for the display name
    const getSlugDisplayName = (s) => {
        if (!s) return null;
        const decoded = decodeURIComponent(s);
        const parts = decoded.split('/');
        const lastPart = parts[parts.length - 1];
        return lastPart.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    };

    const locationName = queryLocation
        ? queryLocation.split(',')[0].trim()
        : slug
            ? getSlugDisplayName(slug)
            : '';

    const themeName = theme ? theme.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : null;
    const campaignName = campaign ? campaign.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : null;

    const getPageTitle = (lang) => {
        if (campaignName) {
            return lang === 'tr' ? `${campaignName} Otelleri` : `${campaignName} Hotels`;
        }
        if (themeName) {
            return lang === 'tr' ? `${themeName} Otelleri` : `${themeName} Hotels`;
        }
        if (!locationName) return tListing('allHotels', lang);
        switch (lang) {
            case 'tr': return `${locationName} Otelleri`;
            case 'zh': return `${locationName}酒店`;
            case 'ja': return `${locationName}のホテル`;
            case 'ar': return `فنادق في ${locationName}`;
            case 'fa': return `هتل‌ها در ${locationName}`;
            case 'ru': return `Отели в ${locationName}`;
            case 'fr': return `Hôtels à ${locationName}`;
            case 'it': return `Hotel a ${locationName}`;
            case 'el': return `Ξενοδοχεία σε ${locationName}`;
            case 'pt': return `Hotéis em ${locationName}`;
            case 'es': return `Hoteles en ${locationName}`;
            default: return `Hotels in ${locationName}`;
        }
    };
    const pageTitle = getPageTitle(currentLang);

    // Extract locationId from URL params
    const locationId = searchParams.get('locationId');

    const subtitle = `${totalRooms} ${totalRooms > 1 ? tListing('rooms', currentLang) : tListing('room', currentLang)}, ${totalGuests} ${totalGuests !== 1 ? tListing('guests', currentLang) : tListing('guest', currentLang)} • ${isLoading && totalProperties === 0 ? tListing('searching', currentLang) : `${totalProperties || 0} ${tListing('propertiesFound', currentLang)}`}`;

    // Map API hotel object to UI model
    const mapApiHotelToModel = React.useCallback((apiHotel) => {
        // Pick name and star based on language
        const hotelNames = apiHotel.names || apiHotel.name; // Support both for transition
        const name = hotelNames?.tr || hotelNames?.en || hotelNames?.defaultName || 'Unknown Hotel';
        
        // Dynamic Stars - new object structure
        const starCount = apiHotel.hotelStar?.star || 0;
        const starLabel = apiHotel.hotelStar?.names?.tr || apiHotel.hotelStar?.names?.en || '';

        // Convert score (e.g. 80000) to rating (e.g. 8.0)
        const rating = apiHotel.score ? (apiHotel.score / 10000).toFixed(1) : '0';

        // Rating labels
        let ratingLabel = 'Good';
        const ratingVal = parseFloat(rating);
        if (ratingVal >= 9) ratingLabel = 'Superb';
        else if (ratingVal >= 8) ratingLabel = 'Excellent';
        else if (ratingVal >= 7) ratingLabel = 'Very Good';

        // Dynamic Amenities - check multiple possible field names and formats
        let amenities = [];
        const rawFacs = apiHotel.hotelFacilityIds || apiHotel.facilities || apiHotel.facilityIds || apiHotel.hotelFacilities;
        
        if (rawFacs && Array.isArray(rawFacs)) {
            // Group by icon to avoid duplicates, but combine labels for the tooltip
            const iconGroups = {};
            
            rawFacs.forEach(f => {
                const id = typeof f === 'object' ? (f.facilityId || f.id || f.value) : f;
                const match = FACILITY_ICON_MAP[Number(id)];
                
                if (match) {
                    // Use localized name from facility object if available
                    const localizedLabel = typeof f === 'object' && f.names 
                        ? (f.names.tr || f.names.en || match.label) 
                        : match.label;

                    if (!iconGroups[match.icon]) {
                        iconGroups[match.icon] = { ...match, labels: [localizedLabel] };
                    } else if (!iconGroups[match.icon].labels.includes(localizedLabel)) {
                        iconGroups[match.icon].labels.push(localizedLabel);
                    }
                }
            });

            // Convert back to array with labels array for the Tooltip's list display
            amenities = Object.values(iconGroups).map(group => ({
                icon: group.icon,
                label: group.labels // Pass as array for structured list
            })).slice(0, 10);
        }

        // Fallback if no facilities matched our icon map
        if (amenities.length === 0) {
            amenities = [
                { icon: 'info', label: 'Details' }
            ];
        }

        // Handle images with thumbnail priority and local silhouette fallbacks
        let imagesToMap = [];
        
        if (apiHotel.images && apiHotel.images.length > 0) {
            // Sort by isThumbnail so thumbnail is always first
            const sorted = [...apiHotel.images].sort((a, b) => (b.isThumbnail ? 1 : 0) - (a.isThumbnail ? 1 : 0));
            
            // Filter: must be the thumbnail OR have 'hotel' category
            const filtered = sorted.filter(img => 
                img.isThumbnail || (img.category && img.category.toLowerCase() === 'hotel')
            );
            
            // Map to URLs and deduplicate while maintaining order (thumbnail first)
            imagesToMap = [...new Set(filtered.map(img => img.url))].filter(url => !!url);
        }

        if (imagesToMap.length === 0) {
            imagesToMap = [placeholderHotel];
        }

        const hotelBadges = [];
        if (apiHotel.isNewProperty) {
            hotelBadges.push({ type: 'popular', label: 'New Property', color: 'bg-teal-500/80' });
        }
        if (apiHotel.preferred) {
            hotelBadges.push({ type: 'featured', label: 'Preferred', color: 'bg-amber-500/80' });
        }
        if (apiHotel.exclusive) {
            hotelBadges.push({ type: 'exclusive', label: 'Exclusive', color: 'bg-purple-500/80' });
        }

        // Extract dynamic price and currency from the first room
        const firstRoom = apiHotel.rooms?.[0];
        const ratePrice = firstRoom?.hubRateModel?.price;
        const priceValue = ratePrice?.markupCalculatedPrice?.holder?.saleAmount || ratePrice?.totalPaymentAmount || ratePrice?.calculatedAmount || 0;
        const currencyCode = ratePrice?.currency || 'USD';
        const totalTaxAmount = ratePrice?.totalTaxAmount || 0;

        return {
            id: apiHotel.id,
            hotelId: apiHotel.hotelId,
            name: name,
            type: starLabel || 'Hotel',
            stars: starCount,
            location: apiHotel.locationPathNames?.replace(/,/g, ', ') || 'Unknown Location',
            image: imagesToMap[0],
            images: imagesToMap,
            rating: rating,
            ratingLabel: ratingLabel,
            ratingColor: 'bg-primary/10 text-primary',
            price: priceValue,
            currency: currencyCode,
            tax: totalTaxAmount,
            lat: apiHotel.coordinates?.lat,
            lng: apiHotel.coordinates?.lon,
            amenities: amenities,
            transportations: apiHotel.transportations || [],
            badges: hotelBadges
        };
    }, []);

    // Initial load: fetch location names if possible (mocked for now or from crumbs)
    React.useEffect(() => {
        console.log('HotelListing mounted with locationId:', locationId);
        if (slug) {
            localStorage.setItem('last_hotel_search_slug', slug);
        }
        const currentParams = searchParams.toString();
        if (currentParams) {
            localStorage.setItem('last_hotel_search_params', currentParams);
        }
    }, [slug, searchParams]);

    // Load hotels from API
    const loadMoreHotels = React.useCallback(async (isReset = false) => {
        // If we are resetting, we cancel any existing request
        if (isReset && abortControllerRef.current) {
            abortControllerRef.current.abort();
            setIsLoading(false);
        }

        // If not a reset and already loading, skip
        if (!isReset && (isLoading || !hasMore)) return;

        setIsLoading(true);
        
        // Create new AbortController for this request
        const controller = new AbortController();
        abortControllerRef.current = controller;

        try {
            const filters = getSearchParams();
            const currentPage = isReset ? 0 : page;

            if (isReset) {
                setHotels([]);
                setTotalProperties(0);
            }

            const response = await hotelService.searchHotels({
                locationId,
                page: currentPage,
                size: 20,
                filters: {
                    locationIds: filters.locations?.length > 0 ? filters.locations : (locationId ? [parseInt(locationId)] : null),
                    stars: filters.stars,
                    hasFreeCancellation: filters.freeCancellation,
                    hasPrePayment: filters.prePayment,
                    roomTwin: filters.roomTwin,
                    roomMaxAdult: filters.roomMaxAdult,
                    roomMaxChildren: filters.roomMaxChildren,
                    roomMaxExtraBed: filters.roomMaxExtraBed,
                    facilities: filters.facilities
                },
                searchCriteria: (() => {
                    const defaults = getDefaultDates();
                    return {
                        checkin: searchParams.get('checkin') || defaults.checkin,
                        checkout: searchParams.get('checkout') || defaults.checkout,
                        nationality: searchParams.get('nationality') || 'TR',
                        rooms: roomState
                    };
                })(),
                sort: sortConfig.field ? sortConfig : null,
                signal: controller.signal
            });

            if (response && response.data) {
                const pageData = response.data;
                const filtersData = response.filters || response.data.filters;
                const content = pageData.content || [];
                const mappedHotels = content.map(h => mapApiHotelToModel(h));

                setHotels(prev => currentPage === 0 ? mappedHotels : [...prev, ...mappedHotels]);
                setTotalProperties(pageData.totalElements || 0);

                if (currentPage === 0 && filtersData) {
                    setDynamicFilters(filtersData);
                }

                setHasMore(!pageData.last);
                setPage(currentPage + 1);

                // Extract location names from breadcrumbs continuously across all pages
                const newLocationNames = {};
                content.forEach(hotel => {
                    if (hotel.locationBreadcrumbs) {
                        hotel.locationBreadcrumbs.forEach(crumb => {
                            if (crumb.locationId && crumb.name) {
                                newLocationNames[crumb.locationId] = crumb.name.defaultName || crumb.name.translations?.en || crumb.name.translations?.tr;
                            }
                        });
                    }
                });

                if (Object.keys(newLocationNames).length > 0) {
                    setLocationNames(prev => ({ ...prev, ...newLocationNames }));
                }
            } else {
                setHasMore(false);
            }
        } catch (error) {
            if (error.name === 'AbortError') {
                console.log('Search request cancelled');
            } else {
                console.error('Error fetching hotels:', error);
                setHasMore(false);
            }
        } finally {
            if (abortControllerRef.current === controller) {
                setIsLoading(false);
            }
        }
    }, [page, isLoading, hasMore, locationId, mapApiHotelToModel, searchParams, sortConfig]);

    // Fetch names for any locations in the filters that we haven't seen in the hotel results yet
    React.useEffect(() => {
        if (!dynamicFilters || !dynamicFilters.locationId) return;

        const missingLocIds = dynamicFilters.locationId
            .map(f => f.value)
            .filter(id => !locationNames[id]);

        if (missingLocIds.length === 0) return;

        let isMounted = true;
        
        const fetchMissingNames = async () => {
            const newNames = {};
            // Fetch in parallel using Promise.allSettled to not break on a single failure
            await Promise.allSettled(missingLocIds.map(async (id) => {
                try {
                    const data = await locationService.fetchBreadcrumb(id);
                    if (data && data.data && Array.isArray(data.data)) {
                         // Some endpoints return the array in data.data
                         data.data.forEach(crumb => {
                             if (crumb.locationId && crumb.name) {
                                 newNames[crumb.locationId] = crumb.name.defaultName || crumb.name.translations?.en || crumb.name.translations?.tr;
                             }
                         });
                    } else if (data && data.breadcrumbs) {
                         data.breadcrumbs.forEach(crumb => {
                             if (crumb.locationId && crumb.name) {
                                 newNames[crumb.locationId] = crumb.name.defaultName || crumb.name.translations?.en || crumb.name.translations?.tr;
                             }
                         });
                    }
                } catch (error) {
                    console.error(`Failed to fetch breadcrumb for location ${id}`, error);
                }
            }));

            if (isMounted && Object.keys(newNames).length > 0) {
                setLocationNames(prev => ({ ...prev, ...newNames }));
            }
        };

        fetchMissingNames();

        return () => { isMounted = false; };
    }, [dynamicFilters, locationNames]);
    
    // Fetch names for any facilities in the filters that we haven't seen yet
    React.useEffect(() => {
        if (!dynamicFilters || !dynamicFilters.hotelFacilityIds) return;

        const missingFacIds = dynamicFilters.hotelFacilityIds
            .map(f => f.value)
            .filter(id => !facilityNames[id]);

        if (missingFacIds.length === 0) return;

        let isMounted = true;

        const fetchMissingNames = async () => {
            try {
                const data = await hotelService.fetchFacilityNames(missingFacIds);
                if (isMounted && data && Array.isArray(data)) {
                    const newNames = {};
                    data.forEach(fac => {
                        // Prioritize nameEn, fallback to others
                        newNames[fac.facilityId] = fac.nameEn || fac.nameTr || fac.nameDe || `Facility ${fac.facilityId}`;
                    });
                    if (Object.keys(newNames).length > 0) {
                        setFacilityNames(prev => ({ ...prev, ...newNames }));
                    }
                }
            } catch (error) {
                console.error(`Failed to fetch facility names`, error);
            }
        };

        fetchMissingNames();

        return () => { isMounted = false; };
    }, [dynamicFilters, facilityNames]);

    // Reset when locationId or other filters change
    React.useEffect(() => {
        // We don't reset to 0 immediately here to avoid the flicker, 
        // the reset will happen inside loadMoreHotels(true)
        
        setPage(0);
        setHasMore(true);
        
        // Scroll to top when filters change
        window.scrollTo({ top: 0, behavior: 'smooth' });

        // Explicitly trigger first fetch on reset
        loadMoreHotels(true);

        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, [
        locationId,
        sortConfig,
        searchParams.get('checkin'),
        searchParams.get('checkout'),
        searchParams.get('guests'),
        searchParams.get('nationality'),
        searchParams.get('q'),
        searchParams.get('stars'),
        searchParams.get('freeCancellation'),
        searchParams.get('prePayment'),
        searchParams.get('locations'),
        searchParams.get('roomTwin'),
        searchParams.get('roomMaxAdult'),
        searchParams.get('roomMaxChildren'),
        searchParams.get('roomMaxExtraBed'),
        searchParams.get('facilities')
    ]);

    const handleSortChange = (e) => {
        const val = e.target.value;
        let newSort = { field: null, order: 'DESC' };
        
        switch (val) {
            case 'star_desc': newSort = { field: 'hotelStarCategoryId', order: 'DESC' }; break;
            case 'star_asc': newSort = { field: 'hotelStarCategoryId', order: 'ASC' }; break;
            case 'rating_desc': newSort = { field: 'rating', order: 'DESC' }; break;
            case 'rating_asc': newSort = { field: 'rating', order: 'ASC' }; break;
            default: newSort = { field: null, order: 'DESC' };
        }
        
        setSortConfig(newSort);
    };

    React.useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting && hasMore && !isLoading && hotels.length > 0) {
                loadMoreHotels();
            }
        }, { threshold: 0, rootMargin: '2000px' });

        if (loaderRef.current) {
            observer.observe(loaderRef.current);
        }

        return () => observer.disconnect();
    }, [loadMoreHotels, hasMore, isLoading, hotels.length]);

    return (
        <div className="relative flex min-h-screen flex-col bg-background-light dark:bg-background-dark text-slate-900 dark:text-white transition-colors duration-200 font-sans">
            <Header />
            <main className="flex-1 max-w-[1440px] mx-auto w-full px-6 lg:px-20 py-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <Breadcrumbs locationId={locationId} />
                    <Link
                        to="/"
                        className="flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-400 hover:text-primary dark:hover:text-primary transition-all group"
                    >
                        <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors shadow-sm" >
                            <span className="material-symbols-outlined text-lg">arrow_back</span>
                        </div>
                        {tListing('backToDashboard', currentLang)}
                    </Link>
                </div>
                <div className="flex flex-col lg:flex-row gap-8">
                    <Sidebar filters={dynamicFilters} locationNames={locationNames} facilityNames={facilityNames} />
                    {/* Grid Content Area */}
                    <div className="flex-1">
                        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                            <div>
                                <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-2" lang={currentLang === 'tr' ? 'tr' : 'en'}>{pageTitle}</h1>
                                <p className="text-slate-500 text-sm font-medium">{subtitle}</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-sm font-bold text-slate-500 whitespace-nowrap">{tListing('sortBy', currentLang)}</span>
                                <select 
                                    className="bg-white dark:bg-[#111a22] border border-slate-200 dark:border-[#233648] rounded-lg text-sm font-bold py-2 pl-4 pr-10 focus:ring-primary focus:border-primary"
                                    onChange={handleSortChange}
                                    value={sortConfig.field ? `${sortConfig.field === 'hotelStarCategoryId' ? 'star' : 'rating'}_${sortConfig.order.toLowerCase()}` : 'recommended'}
                                >
                                    <option value="recommended">{tListing('recommended', currentLang)}</option>
                                    <option value="rating_desc">{tListing('ratingDesc', currentLang)}</option>
                                    <option value="rating_asc">{tListing('ratingAsc', currentLang)}</option>
                                    <option value="star_desc">{tListing('starDesc', currentLang)}</option>
                                    <option value="star_asc">{tListing('starAsc', currentLang)}</option>
                                </select>
                            </div>
                        </div>

                        {/* View Controls Toolbar */}
                        <div className="bg-white dark:bg-[#111a22] border border-slate-200 dark:border-[#233648] rounded-xl p-3 mb-8 flex items-center justify-between shadow-sm">
                            <Link
                                to={`/map?${searchParams.toString()}`}
                                className="flex items-center gap-2 text-sm font-bold px-5 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                            >
                                <span className="material-symbols-outlined text-primary">map</span>
                                {tListing('mapView', currentLang)}
                            </Link>

                            <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800/50 rounded-lg p-1 border border-slate-100 dark:border-slate-800">
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-white dark:bg-slate-700 text-primary shadow-sm border border-slate-200 dark:border-slate-600' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
                                >
                                    <span className="material-symbols-outlined text-xl">view_list</span>
                                </button>
                                <button
                                    onClick={() => setViewMode('grid2')}
                                    className={`p-1.5 rounded-md transition-all ${viewMode === 'grid2' ? 'bg-white dark:bg-slate-700 text-primary shadow-sm border border-slate-200 dark:border-slate-600' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
                                >
                                    <span className="material-symbols-outlined text-xl">grid_view</span>
                                </button>
                                <button
                                    onClick={() => setViewMode('grid3')}
                                    className={`p-1.5 rounded-md transition-all ${viewMode === 'grid3' ? 'bg-white dark:bg-slate-700 text-primary shadow-sm border border-slate-200 dark:border-slate-600' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
                                >
                                    <span className="material-symbols-outlined text-xl">grid_on</span>
                                </button>
                                <button
                                    onClick={() => setViewMode('grid4')}
                                    className={`p-1.5 rounded-md transition-all ${viewMode === 'grid4' ? 'bg-white dark:bg-slate-700 text-primary shadow-sm border border-slate-200 dark:border-slate-600' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
                                >
                                    <span className="material-symbols-outlined text-xl">apps</span>
                                </button>
                            </div>
                        </div>

                        {/* Hotel Grid */}
                        <div className={`grid gap-6 ${gridClasses[viewMode]}`}>
                            {hotels.length > 0 ? (
                                hotels.map(hotel => (
                                    <HotelCard key={hotel.id} hotel={hotel} viewMode={viewMode} />
                                ))
                            ) : isLoading ? (
                                [...Array(6)].map((_, i) => (
                                    <HotelCardSkeleton key={i} viewMode={viewMode} />
                                ))
                            ) : null}
                            
                            {/* Subsequent loading skeletons (Infinite Scroll) */}
                            {isLoading && hotels.length > 0 && (
                                [...Array(viewMode === 'list' ? 2 : 4)].map((_, i) => (
                                    <HotelCardSkeleton key={`more-${i}`} viewMode={viewMode} />
                                ))
                            )}
                        </div>

                        {/* Loading Sentinel */}
                        <div ref={loaderRef} className="mt-12 py-8 flex flex-col items-center justify-center gap-4">
                            {!hasMore && hotels.length > 0 && (
                                <p className="text-sm font-black text-slate-400 uppercase tracking-widest border-t border-slate-100 dark:border-slate-800 pt-8 w-full text-center">
                                    {tListing('reachedEnd', currentLang)}
                                </p>
                            )}
                            {hotels.length === 0 && !isLoading && (
                                <div className="flex flex-col items-center justify-center py-20 text-center">
                                    <span className="material-symbols-outlined text-6xl text-slate-200 mb-4">search_off</span>
                                    <h3 className="text-xl font-bold text-slate-400">{tListing('noProperties', currentLang)}</h3>
                                    <p className="text-slate-500">{tListing('tryAdjusting', currentLang)}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default HotelListing;
