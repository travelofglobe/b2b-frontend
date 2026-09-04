import React, { useMemo } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Sidebar from '../components/Sidebar';
import { parseGuestsParam, validateAndSanitizeDates, formatDateForUrl } from '../utils/searchParamsUtils';
import { hotelService } from '../services/hotelService';
import { locationService } from '../services/locationService';
import ListingSearch from '../components/ListingSearch';
import placeholderHotel from '../assets/placeholder-hotel.svg';
import { useFavorites } from '../context/FavoritesContext';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default marker icon paths for Vite
const DefaultIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

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
        room: "Habitación", rooms: "Habitaciones", guest: "Huésped", guests: "Huéspedes",
        searching: "Buscando...", propertiesFound: "propiedades encontradas", sortBy: "ORDENAR POR:",
        mapView: "Vista de Mapa", backToDashboard: "Volver al Panel", noProperties: "No se encontraron propiedades",
        recommended: "Más Recomendado", ratingDesc: "Calificación: alta a baja", ratingAsc: "Calificación: baja a alta",
        starDesc: "Estrellas: alta a baja", starAsc: "Estrellas: baja a alta",
        reachedEnd: "Has llegado al final de la lista", tryAdjusting: "Intenta ajustar tus filtros o ubicación", allHotels: "Todos los Hoteles"
    },
    ru: {
        room: "Номер", rooms: "Номера", guest: "Гость", guests: "Гости",
        searching: "Поиск...", propertiesFound: "объектов найдено", sortBy: "СОРТИРОВКА:",
        mapView: "На карте", backToDashboard: "Панель управления", noProperties: "Объекты не найдены",
        recommended: "Рекомендуемые", ratingDesc: "Оценка гостей: от высокой к низкой", ratingAsc: "Оценка гостей: от низкой к высокой",
        starDesc: "Звездность: от высокой к низкой", starAsc: "Звездность: от низкой к высокой",
        reachedEnd: "Вы дошли до конца списка", tryAdjusting: "Попробуйте изменить фильтры или местоположение", allHotels: "Все отели"
    },
    zh: {
        room: "间客房", rooms: "间客房", guest: "位旅客", guests: "位旅客",
        searching: "正在搜索...", propertiesFound: "家酒店", sortBy: "排序方式:",
        mapView: "地图模式", backToDashboard: "返回仪表板", noProperties: "未找到符合条件的酒店",
        recommended: "推荐", ratingDesc: "评分：从高到低", ratingAsc: "评分：从低到高",
        starDesc: "星级：从高到低", starAsc: "星级：从低到高",
        reachedEnd: "您已浏览完所有酒店", tryAdjusting: "请尝试更改筛选条件或搜索位置", allHotels: "所有酒店"
    },
    ja: {
        room: "室", rooms: "室", guest: "名", guests: "名",
        searching: "検索中...", propertiesFound: "軒のホテルが見つかりました", sortBy: "並べ替え:",
        mapView: "地図で見る", backToDashboard: "ダッシュボードに戻る", noProperties: "ホテルが見つかりませんでした",
        recommended: "おすすめ順", ratingDesc: "クチコミ評価：高い順", ratingAsc: "クチコミ評価：低い順",
        starDesc: "星評価：高い順", starAsc: "星評価：低い順",
        reachedEnd: "リストの最後に達しました", tryAdjusting: "フィルターまたはエリアを調整してください", allHotels: "すべてのホテル"
    },
    fa: {
        room: "اتاق", rooms: "اتاق", guest: "مسافر", guests: "مسافر",
        searching: "در حال جستجو...", propertiesFound: "هتل پیدا شد", sortBy: "مرتب‌سازی بر اساس:",
        mapView: "نمایش روی نقشه", backToDashboard: "بازگشت به پنل کاربری", noProperties: "هیچ هتلی پیدا نشد",
        recommended: "بیشترین توصیه", ratingDesc: "امتیاز مسافران: زیاد به کم", ratingAsc: "امتیاز مسافران: کم به زیاد",
        starDesc: "تعداد ستاره: زیاد به کم", starAsc: "تعداد ستاره: کم به زیاد",
        reachedEnd: "به پایان لیست رسیده‌اید", tryAdjusting: "فیلترها یا موقعیت خود را تغییر دهید", allHotels: "همه هتل‌ها"
    },
    fr: {
        room: "Chambre", rooms: "Chambres", guest: "Voyageur", guests: "Voyageurs",
        searching: "Recherche...", propertiesFound: "établissements trouvés", sortBy: "TRIER PAR:",
        mapView: "Vue de Carte", backToDashboard: "Retour au Tableau", noProperties: "Aucun établissement trouvé",
        recommended: "Plus Recommandés", ratingDesc: "Note des clients : décroissante", ratingAsc: "Note des clients : croissante",
        starDesc: "Étoiles : décroissant", starAsc: "Étoiles : croissant",
        reachedEnd: "Vous avez atteint la fin de la liste", tryAdjusting: "Essayez d'ajuster vos filtres ou lieu", allHotels: "Tous les Hôtels"
    },
    it: {
        room: "Camera", rooms: "Camere", guest: "Ospite", guests: "Ospiti",
        searching: "Ricerca...", propertiesFound: "strutture trovate", sortBy: "ORDINA PER:",
        mapView: "Mappa", backToDashboard: "Torna alla Dashboard", noProperties: "Nessuna struttura trovata",
        recommended: "Più Consigliati", ratingDesc: "Valutazione ospiti: alta a bassa", ratingAsc: "Valutazione ospiti: bassa a alta",
        starDesc: "Stelle: alta a bassa", starAsc: "Stelle: bassa a alta",
        reachedEnd: "Hai raggiunto la fine della lista", tryAdjusting: "Prova a modificare i filtri o la località", allHotels: "Tutti gli Hotel"
    },
    el: {
        room: "Δωμάτιο", rooms: "Δωμάτια", guest: "Επισκέπτης", guests: "Επισκέπτες",
        searching: "Αναζήτηση...", propertiesFound: "καταλύματα βρέθηκαν", sortBy: "ΤΑΞΙΝΟΜΗΣΗ ΚΑΤΑ:",
        mapView: "Προβολή Χάρτη", backToDashboard: "Πίσω στον Πίνακα", noProperties: "Δεν βρέθηκαν καταλύματα",
        recommended: "Προτεινόμενα", ratingDesc: "Βαθμολογία: υψηλή προς χαμηλή", ratingAsc: "Βαθμολογία: χαμηλή προς υψηλή",
        starDesc: "Αστέρια: υψηλή προς χαμηλή", starAsc: "Αστέρια: χαμηλή προς υψηλή",
        reachedEnd: "Φτάσατε στο τέλος της λίστας", tryAdjusting: "Δοκιμάστε να αλλάξετε τα φίλτρα ή την τοποθεσία", allHotels: "Όλα τα Ξενοδοχεία"
    },
    pt: {
        room: "Quarto", rooms: "Quartos", guest: "Hóspede", guests: "Hóspedes",
        searching: "Buscando...", propertiesFound: "propriedades encontradas", sortBy: "ORDENAR POR:",
        mapView: "Ver no Mapa", backToDashboard: "Voltar ao Painel", noProperties: "Nenhuma propriedade encontrada",
        recommended: "Mais Recomendados", ratingDesc: "Avaliação: alta para baixa", ratingAsc: "Avaliação: baixa para alta",
        starDesc: "Estrelas: alta para baixa", starAsc: "Estrelas: baixa para alta",
        reachedEnd: "Você chegou ao final da lista", tryAdjusting: "Tente ajustar seus filtros ou localidade", allHotels: "Todos os Hotéis"
    }
};

const tListing = (key, lang = 'tr') => {
    return LISTING_LOCALES[lang]?.[key] || LISTING_LOCALES['en']?.[key] || key;
};

// ═══════════════════════════════════════════════
// Map Fit Control - auto-fits map to hotel bounds
// ═══════════════════════════════════════════════
const MapFitControl = ({ hotels, shouldRefit, onRefitDone }) => {
    const map = useMap();
    React.useEffect(() => {
        if (!shouldRefit || hotels.length === 0) return;
        const valid = hotels.filter(h => h.lat && h.lng && !isNaN(parseFloat(h.lat)) && !isNaN(parseFloat(h.lng)));
        if (valid.length === 0) return;
        try {
            const bounds = L.latLngBounds(valid.map(h => [parseFloat(h.lat), parseFloat(h.lng)]));
            if (bounds.isValid()) {
                map.fitBounds(bounds, { padding: [60, 60], maxZoom: 14 });
                onRefitDone();
            }
        } catch (e) { /* ignore */ }
    }, [shouldRefit, hotels, map, onRefitDone]);
    return null;
};

// ═══════════════════════════════════════════════
// Map Bounds Watcher - triggers search on map move
// ═══════════════════════════════════════════════
const MapBoundsWatcher = ({ searchOnMove, onBoundsChange, onMapMoved }) => {
    const map = useMap();
    React.useEffect(() => {
        if (!map) return;
        const handleMoveEnd = () => {
            const bounds = map.getBounds();
            const nw = bounds.getNorthWest();
            const se = bounds.getSouthEast();
            const boundsData = {
                bounds: {
                    topLeft: { lat: nw.lat, lon: nw.lng },
                    bottomRight: { lat: se.lat, lon: se.lng }
                },
                zoom: map.getZoom()
            };
            if (searchOnMove) {
                onBoundsChange(boundsData);
            } else {
                onMapMoved?.(boundsData);
            }
        };
        map.on('moveend', handleMoveEnd);
        return () => map.off('moveend', handleMoveEnd);
    }, [map, searchOnMove, onBoundsChange, onMapMoved]);
    return null;
};

// Capture map instance
const MapInstanceCapture = ({ setMap }) => {
    const map = useMap();
    React.useEffect(() => {
        if (map) { setMap(map); map.invalidateSize(); }
        return () => setMap(null);
    }, [map, setMap]);
    return null;
};

// ═══════════════════════════════════════════════
// Price Marker - Google Hotels-style price bubble
// ═══════════════════════════════════════════════
const PriceMarker = React.memo(({ hotel, isSelected, isHovered, onSelect, onHover, searchParams, currencySymbol }) => {
    const priceDisplay = hotel.price ? Math.round(hotel.price).toLocaleString('tr-TR') : '';
    const active = isSelected || isHovered;
    const icon = L.divIcon({
        className: '',
        html: `<div style="position:relative;display:flex;flex-direction:column;align-items:center;pointer-events:auto;cursor:pointer;">
            <div style="padding:4px 10px;border-radius:20px;font-size:12px;font-weight:700;font-family:Google Sans,Roboto,Arial,sans-serif;white-space:nowrap;border:1.5px solid ${active ? 'transparent' : 'rgba(60,64,67,0.2)'};background:${active ? '#1a73e8' : 'white'};color:${active ? 'white' : '#3c4043'};box-shadow:0 2px 6px rgba(0,0,0,${active ? '0.3' : '0.15'});transform:${active ? 'scale(1.08)' : 'scale(1)'};transition:all 0.15s ease;display:flex;align-items:center;gap:4px;">
                <span class="material-symbols-outlined" style="font-size:14px; margin-right:-2px">hotel</span>
                ${currencySymbol}${priceDisplay}
            </div>
            <div style="width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;border-top:6px solid ${active ? '#1a73e8' : 'white'};margin-top:-1px;filter:drop-shadow(0 1px 1px rgba(0,0,0,0.2));"></div>
        </div>`,
        iconSize: [0, 0],
        iconAnchor: [0, 0],
    });
    return (
        <Marker
            position={[parseFloat(hotel.lat), parseFloat(hotel.lng)]}
            icon={icon}
            zIndexOffset={active ? 1000 : 0}
            eventHandlers={{
                click: () => onSelect(hotel),
                mouseover: () => onHover(hotel),
                mouseout: () => onHover(null),
            }}
        >
            <Popup className="hotel-price-popup" minWidth={220} autoPan={false} closeButton={false}>
                <div style={{ fontFamily: 'Google Sans,Roboto,Arial,sans-serif', padding: '4px' }}>
                    <img src={hotel.image} alt={hotel.name} onError={e => { e.target.src = placeholderHotel; }} style={{ width: '100%', height: '110px', objectFit: 'cover', borderRadius: '8px', marginBottom: '8px' }} />
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#3c4043', lineHeight: '1.3', marginBottom: '6px' }}>{hotel.name}</div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '15px', fontWeight: 700, color: '#3c4043' }}>{currencySymbol}{priceDisplay}</span>
                        <Link to={`/hotel/${hotel.hotelId}?${searchParams.toString()}`} target="_blank" onClick={e => e.stopPropagation()} style={{ background: '#1a73e8', color: 'white', fontSize: '12px', fontWeight: 600, padding: '5px 12px', borderRadius: '20px', textDecoration: 'none' }}>
                            Göster
                        </Link>
                    </div>
                </div>
            </Popup>
        </Marker>
    );
});

// ═══════════════════════════════════════════════
// Google Hotels Style Card
// ═══════════════════════════════════════════════
const GoogleHotelCard = React.memo(({ hotel, searchParams, isSelected, isHovered, onHover, onSelect, currentLang, isFav, onToggleFav }) => {
    const [imgIdx, setImgIdx] = React.useState(0);
    const images = hotel.images?.length > 0 ? hotel.images : [placeholderHotel];

    const getCurrencySymbol = (code) => {
        const sym = { USD: '$', EUR: '€', GBP: '£', TRY: '₺', AED: 'د.إ', SAR: 'ر.س', JPY: '¥', CNY: '¥', RUB: '₽' };
        return sym[code] || code || '$';
    };
    const currencySymbol = getCurrencySymbol(hotel.currency);
    const formattedPrice = hotel.price ? Math.round(hotel.price).toLocaleString('tr-TR') : '';

    const starTypeLabelMap = {
        tr: 'Yıldızlı Otel', en: 'Star Hotel', ar: 'نجوم', de: 'Sterne Hotel',
        fr: 'Étoiles', ru: 'Звезд', zh: '星酒店', es: 'Estrellas', it: 'Stelle', ja: '星ホテル'
    };
    const typeLabel = hotel.stars > 0
        ? `${hotel.stars} ${starTypeLabelMap[currentLang] || starTypeLabelMap.en}`
        : (hotel.type || 'Hotel');

    const ratingNum = parseFloat(hotel.rating) || 0;

    const showPricesLabel = {
        tr: 'Fiyatları göster', en: 'Show prices', ar: 'عرض الأسعار', de: 'Preise anzeigen',
        fr: 'Voir les prix', ru: 'Показать цены', zh: '查看价格', es: 'Ver precios', it: 'Mostra prezzi', ja: '料金を見る', fa: 'نمایش قیمت'
    };
    const freeCancelLabel = {
        tr: 'Ücretsiz iptal', en: 'Free cancellation', ar: 'إلغاء مجاني', de: 'Kostenlose Stornierung',
        fr: 'Annulation gratuite', ru: 'Бесплатная отмена', zh: '免费取消', es: 'Cancelación gratuita', it: 'Cancellazione gratuita'
    };

    const nextImg = (e) => { e.preventDefault(); e.stopPropagation(); setImgIdx(p => (p + 1) % images.length); };
    const prevImg = (e) => { e.preventDefault(); e.stopPropagation(); setImgIdx(p => (p - 1 + images.length) % images.length); };
    const isActive = isSelected || isHovered;

    return (
        <div
            className={`flex p-4 border-b border-[#e8eaed] dark:border-slate-700 cursor-pointer transition-colors group ${isActive ? 'bg-[#f0f4ff] dark:bg-blue-900/10' : 'bg-white dark:bg-[#303134] hover:bg-[#f8f9fa] dark:hover:bg-slate-800/40'}`}
            onMouseEnter={() => onHover(hotel)}
            onMouseLeave={() => onHover(null)}
            onClick={() => onSelect(isActive ? null : hotel)}
        >
            {/* Image */}
            <div className="relative w-[300px] h-[200px] rounded-xl overflow-hidden shrink-0 mr-5 bg-[#f1f3f4]">
                <img
                    src={images[imgIdx]}
                    alt={hotel.name}
                    className="w-full h-full object-cover"
                    onError={e => { e.target.src = placeholderHotel; e.target.onerror = null; }}
                />
                {images.length > 1 && (
                    <>
                        <button onClick={prevImg} className="absolute left-1 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="material-symbols-outlined text-white" style={{ fontSize: '14px' }}>chevron_left</span>
                        </button>
                        <button onClick={nextImg} className="absolute right-1 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="material-symbols-outlined text-white" style={{ fontSize: '14px' }}>chevron_right</span>
                        </button>
                        <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex gap-0.5">
                            {images.slice(0, 5).map((_, i) => (
                                <div key={i} className={`rounded-full transition-all ${i === imgIdx ? 'w-3 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/60'}`} />
                            ))}
                        </div>
                    </>
                )}
                <button
                    className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/30 hover:bg-black/50 backdrop-blur-sm flex items-center justify-center transition-colors"
                    onClick={e => { e.preventDefault(); e.stopPropagation(); onToggleFav?.(); }}
                >
                    {isFav ? (
                        <span className="material-symbols-outlined text-[#8ab4f8] dark:text-[#8ab4f8]" style={{ fontSize: '16px', fontVariationSettings: "'FILL' 1" }}>bookmark</span>
                    ) : (
                        <span className="material-symbols-outlined text-white" style={{ fontSize: '16px' }}>bookmark_border</span>
                    )}
                </button>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0 flex flex-col gap-1 py-1">
                {/* Name + Price */}
                <div className="flex items-start justify-between gap-4">
                    <Link
                        to={`/hotel/${hotel.hotelId}?${searchParams.toString()}`}
                        target="_blank"
                        className="text-[20px] font-normal text-[#202124] dark:text-slate-100 hover:underline leading-[1.3] line-clamp-2 flex-1"
                        onClick={e => e.stopPropagation()}
                    >
                        {hotel.name}
                    </Link>
                    <div className="shrink-0 text-right mt-1">
                        {hotel.strikethroughPrice && (
                            <div className="text-[13px] text-[#70757a] dark:text-slate-400 line-through leading-none mb-1 font-roboto">
                                {currencySymbol}{Math.round(hotel.strikethroughPrice).toLocaleString('tr-TR')}
                            </div>
                        )}
                        <span className="text-[22px] font-bold text-[#202124] dark:text-slate-100 leading-none font-roboto">
                            {currencySymbol}{formattedPrice}
                        </span>
                    </div>
                </div>

                {/* Rating */}
                {ratingNum > 0 && (
                    <div className="flex items-center gap-1.5">
                        <span className="text-[13px] font-medium text-[#3c4043] dark:text-slate-200">{ratingNum.toFixed(1)}</span>
                        <div className="flex">
                            {[...Array(5)].map((_, i) => (
                                <span key={i} style={{ fontSize: '12px', color: i < Math.round(ratingNum) ? '#fabb05' : '#dadce0' }}>★</span>
                            ))}
                        </div>
                        <span className="text-[12px] text-[#70757a] dark:text-slate-400">({hotel.ratingLabel})</span>
                    </div>
                )}

                {/* Property type */}
                <p className="text-[13px] text-[#70757a] dark:text-slate-400 font-roboto">{typeLabel}</p>

                {/* Amenities grid */}
                {hotel.amenities && hotel.amenities.length > 0 && (
                    <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 mt-1">
                        {hotel.amenities.slice(0, 6).map((amenity, i) => (
                            <div key={i} className="flex items-center gap-1.5 text-[13px] text-[#5f6368] dark:text-slate-300 min-w-0 font-roboto">
                                <span className="material-symbols-outlined text-[#70757a] dark:text-slate-400 shrink-0" style={{ fontSize: '18px' }}>{amenity.icon}</span>
                                <span className="truncate">
                                    {Array.isArray(amenity.label) ? amenity.label[0] : amenity.label}
                                </span>
                            </div>
                        ))}
                    </div>
                )}

                {/* Bottom row: free cancel + CTA */}
                <div className="flex items-center justify-between mt-auto pt-4 gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                        {hotel.hasFreeCancellation && (
                            <span className="text-[12px] text-[#0d652d] dark:text-green-400 font-medium truncate font-roboto">
                                {freeCancelLabel[currentLang] || freeCancelLabel.en}
                            </span>
                        )}
                        {hotel.boardName && (
                            <span className="text-[12px] text-[#70757a] dark:text-slate-400 truncate font-roboto">· {hotel.boardName}</span>
                        )}
                    </div>
                    <Link
                        to={`/hotel/${hotel.hotelId}?${searchParams.toString()}`}
                        target="_blank"
                        onClick={e => e.stopPropagation()}
                        className="shrink-0 inline-flex items-center justify-center bg-[#1a73e8] hover:bg-[#1558d6] active:bg-[#1246b8] text-white text-[14px] font-medium px-5 py-2 rounded-full transition-colors whitespace-nowrap"
                    >
                        {showPricesLabel[currentLang] || showPricesLabel.en}
                    </Link>
                </div>
            </div>
        </div>
    );
});

// ═══════════════════════════════════════════════
// Skeleton loader card
// ═══════════════════════════════════════════════
const GoogleCardSkeleton = () => (
    <div className="flex p-4 border-b border-[#e8eaed] dark:border-slate-700 animate-pulse">
        <div className="w-[160px] h-[120px] rounded-lg bg-[#f1f3f4] dark:bg-slate-700 shrink-0 mr-4" />
        <div className="flex-1 space-y-2.5">
            <div className="h-4 bg-[#f1f3f4] dark:bg-slate-700 rounded-full w-3/4" />
            <div className="h-3 bg-[#f1f3f4] dark:bg-slate-700 rounded-full w-1/2" />
            <div className="h-3 bg-[#f1f3f4] dark:bg-slate-700 rounded-full w-2/3" />
            <div className="grid grid-cols-2 gap-2 mt-2">
                <div className="h-3 bg-[#f1f3f4] dark:bg-slate-700 rounded-full" />
                <div className="h-3 bg-[#f1f3f4] dark:bg-slate-700 rounded-full" />
                <div className="h-3 bg-[#f1f3f4] dark:bg-slate-700 rounded-full" />
                <div className="h-3 bg-[#f1f3f4] dark:bg-slate-700 rounded-full" />
            </div>
        </div>
    </div>
);

// ═══════════════════════════════════════════════
// Main HotelListing Component
// ═══════════════════════════════════════════════
const HotelListing = () => {
    // Facility icon map
    const FACILITY_ICON_MAP = {
        98445: { icon: 'wifi', label: 'Free Wifi' }, 48325: { icon: 'wifi', label: 'Wifi Access' },
        3664: { icon: 'wifi', label: 'High Speed Internet' }, 616: { icon: 'pool', label: 'Outdoor Pool' },
        649: { icon: 'pool', label: 'Indoor Pool' }, 1685: { icon: 'pool', label: 'Kids Pool' },
        1985: { icon: 'spa', label: 'Spa' }, 1978: { icon: 'fitness_center', label: 'Health Club' },
        98455: { icon: 'fitness_center', label: 'Fitness' }, 47935: { icon: 'fitness_center', label: 'Gym' },
        641: { icon: 'restaurant', label: 'Restaurant' }, 3134: { icon: 'local_bar', label: 'Bar' },
        606: { icon: 'pets', label: 'Pets Allowed' }, 719: { icon: 'ac_unit', label: 'Air Conditioning' },
        101165: { icon: 'inventory_2', label: 'Minibar' }, 618: { icon: 'sports_tennis', label: 'Tennis' },
        3164: { icon: 'casino', label: 'Casino' }, 3154: { icon: 'nightlife', label: 'Night Club' },
        3891: { icon: 'hot_tub', label: 'Jacuzzi' }, 650: { icon: 'spa', label: 'Sauna' },
        3064: { icon: 'atm', label: 'ATM' }, 18006: { icon: 'business_center', label: 'Business Centre' },
        18366: { icon: 'local_laundry_service', label: 'Laundry' }, 603: { icon: 'child_care', label: 'Babysitting' },
        638: { icon: 'explore', label: 'Tour Desk' }, 646: { icon: 'support_agent', label: 'Concierge' },
        666: { icon: 'car_rental', label: 'Car Rental' }, 1993: { icon: 'lock', label: 'Safety Box' },
        1995: { icon: 'wheelchair_pickup', label: 'Wheelchair Access' }, 2007: { icon: 'elevator', label: 'Elevator' },
        98485: { icon: 'security', label: 'Security' }, 100075: { icon: 'smoking_rooms', label: 'Smoking Area' },
        1687: { icon: 'water_sports', label: 'Water Sports' }, 1981: { icon: 'child_friendly', label: 'Kids Club' },
        3724: { icon: 'beach_access', label: 'Beach' }, 18126: { icon: 'directions_bike', label: 'Bicycle Rental' },
        98415: { icon: 'airport_shuttle', label: 'Airport Shuttle' }
    };

    const { i18n } = useTranslation();
    const currentLang = i18n.language || localStorage.getItem('language') || 'tr';
    const navigate = useNavigate();

    const params = useParams();
    const slug = params['*'] || params.slug;
    const { theme, campaign } = params;
    const [searchParams, setSearchParams] = useSearchParams();

    const { favorites, isFavorite, toggleFavorite } = useFavorites();
    const [isFavOpen, setIsFavOpen] = React.useState(false);

    const [hotels, setHotels] = React.useState([]);
    const [page, setPage] = React.useState(0);
    const [isLoading, setIsLoading] = React.useState(false);
    const [hasMore, setHasMore] = React.useState(true);
    const [totalProperties, setTotalProperties] = React.useState(0);
    const [dynamicFilters, setDynamicFilters] = React.useState(null);
    const [sortConfig, setSortConfig] = React.useState({ field: null, order: 'DESC' });
    const abortControllerRef = React.useRef(null);
    const isFetchingRef = React.useRef(false);
    const pageRef = React.useRef(0);
    const hasMoreRef = React.useRef(true);

    // UI state
    const [selectedHotel, setSelectedHotel] = React.useState(null);
    const [hoveredHotel, setHoveredHotel] = React.useState(null);
    const [shouldRefitMap, setShouldRefitMap] = React.useState(true);
    const [isSortOpen, setIsSortOpen] = React.useState(false);
    const [isFilterDrawerOpen, setIsFilterDrawerOpen] = React.useState(false);
    const [searchOnMapMove, setSearchOnMapMove] = React.useState(false);
    const [mapMoved, setMapMoved] = React.useState(false);
    const [mapInstance, setMapInstance] = React.useState(null);
    const mapBoundsRef = React.useRef(null); // stores last known bounds for manual search
    const listScrollRef = React.useRef(null);
    const loaderRef = React.useRef(null);
    const sortDropdownRef = React.useRef(null);

    const [locationNames, setLocationNames] = React.useState({});
    const [facilityNames, setFacilityNames] = React.useState({});

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

    // Parse params
    const roomState = useMemo(() => {
        const guestsParam = searchParams.get('guests');
        if (guestsParam) return parseGuestsParam(guestsParam);
        const adults = searchParams.get('adults');
        const children = searchParams.get('children');
        return [{ adults: parseInt(adults) || 2, children: parseInt(children) || 0, childAges: [] }];
    }, [searchParams]);

    const totalAdults = roomState.reduce((sum, r) => sum + r.adults, 0);
    const totalChildren = roomState.reduce((sum, r) => sum + r.children, 0);
    const totalRooms = roomState.length;
    const totalGuests = totalAdults + totalChildren;

    const queryLocation = searchParams.get('q');
    const getSlugDisplayName = (s) => {
        if (!s) return null;
        const decoded = decodeURIComponent(s);
        const parts = decoded.split('/');
        return parts[parts.length - 1].replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    };
    const locationName = queryLocation
        ? queryLocation.split(',')[0].trim()
        : slug ? getSlugDisplayName(slug) : '';

    const themeName = theme ? theme.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : null;
    const campaignName = campaign ? campaign.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : null;

    const locationId = searchParams.get('locationId');

    // Date formatting - Google Hotels style
    const formatDateShort = (dateStr) => {
        if (!dateStr) return '';
        const monthsTr = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
        const monthsEn = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const daysTr = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
        const daysEn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        try {
            const d = new Date(dateStr + 'T00:00:00');
            const months = currentLang === 'tr' ? monthsTr : monthsEn;
            const days = currentLang === 'tr' ? daysTr : daysEn;
            return `${d.getDate()} ${months[d.getMonth()]} ${days[d.getDay()]}`;
        } catch (e) { return dateStr; }
    };

    // Guest display
    const guestDisplay = useMemo(() => {
        const parts = [];
        if (totalGuests > 0) parts.push(`${totalGuests}`);
        if (totalRooms > 1) parts.push(`${totalRooms} ${currentLang === 'tr' ? 'oda' : 'rooms'}`);
        return parts.join(', ') || '2';
    }, [totalGuests, totalRooms, currentLang]);

    // Results count text
    const resultsText = useMemo(() => {
        if (isLoading && totalProperties === 0) return tListing('searching', currentLang);
        return `${locationName || ''} · ${totalProperties || 0} ${currentLang === 'tr' ? 'sonuç' : 'results'}`;
    }, [isLoading, totalProperties, locationName, currentLang]);

    // Active filter count for badge
    const activeFilterCount = React.useMemo(() => {
        return [
            searchParams.get('stars'), searchParams.get('locations'), searchParams.get('freeCancellation'),
            searchParams.get('prePayment'), searchParams.get('roomTwin'), searchParams.get('roomMaxAdult'),
            searchParams.get('roomMaxChildren'), searchParams.get('roomMaxExtraBed'), searchParams.get('facilities')
        ].filter(Boolean).length;
    }, [searchParams]);

    // Map hotel from API to UI model
    const mapApiHotelToModel = React.useCallback((apiHotel) => {
        const hotelNames = apiHotel.names || apiHotel.name;
        const name = hotelNames?.[currentLang] || hotelNames?.en || hotelNames?.defaultName || 'Unknown Hotel';
        const starCount = apiHotel.hotelStar?.star || 0;
        const starLabel = apiHotel.hotelStar?.names?.[currentLang] || apiHotel.hotelStar?.names?.en || '';
        let locationString = apiHotel.locationPathNames?.replace(/,/g, ', ');
        if (!locationString && Array.isArray(apiHotel.locationBreadcrumbs)) {
            const crumbs = apiHotel.locationBreadcrumbs
                .filter(crumb => crumb.locationType !== 'COUNTRY')
                .map(crumb => {
                    const n = crumb.name;
                    return n?.translations?.[currentLang] || n?.translations?.en || n?.defaultName;
                }).filter(Boolean);
            if (crumbs.length > 0) locationString = crumbs.join(', ');
        }
        const rating = apiHotel.score ? (apiHotel.score / 10000).toFixed(1) : '0';
        let ratingLabel = 'Good';
        const ratingVal = parseFloat(rating);
        if (ratingVal >= 9) ratingLabel = 'Superb';
        else if (ratingVal >= 8) ratingLabel = 'Excellent';
        else if (ratingVal >= 7) ratingLabel = 'Very Good';

        let amenities = [];
        const rawFacs = apiHotel.hotelFacilityIds || apiHotel.facilities || apiHotel.facilityIds || apiHotel.hotelFacilities;
        if (rawFacs && Array.isArray(rawFacs)) {
            const iconGroups = {};
            rawFacs.forEach(f => {
                const id = typeof f === 'object' ? (f.facilityId || f.id || f.value) : f;
                const match = FACILITY_ICON_MAP[Number(id)];
                if (match) {
                    const localizedLabel = typeof f === 'object' && f.names
                        ? (f.names[currentLang] || f.names.en || match.label) : match.label;
                    if (!iconGroups[match.icon]) {
                        iconGroups[match.icon] = { ...match, labels: [localizedLabel] };
                    } else if (!iconGroups[match.icon].labels.includes(localizedLabel)) {
                        iconGroups[match.icon].labels.push(localizedLabel);
                    }
                }
            });
            amenities = Object.values(iconGroups).map(g => ({ icon: g.icon, label: g.labels })).slice(0, 10);
        }
        if (amenities.length === 0) amenities = [{ icon: 'info', label: ['Details'] }];

        let imagesToMap = [];
        if (apiHotel.images && apiHotel.images.length > 0) {
            const sorted = [...apiHotel.images].sort((a, b) => (b.isThumbnail ? 1 : 0) - (a.isThumbnail ? 1 : 0));
            const filtered = sorted.filter(img => img.isThumbnail || (img.category && img.category.toLowerCase() === 'hotel'));
            imagesToMap = [...new Set(filtered.map(img => img.url))].filter(url => !!url);
        }
        if (imagesToMap.length === 0) imagesToMap = [placeholderHotel];

        let lowestRoom = null;
        let lowestPrice = Infinity;
        if (apiHotel.rooms && apiHotel.rooms.length > 0) {
            apiHotel.rooms.forEach(room => {
                const ratePrice = room?.hubRateModel?.price;
                const priceValue = ratePrice?.calculatedAmount || ratePrice?.totalPaymentAmount || ratePrice?.markupCalculatedPrice?.holder?.saleAmount || 0;
                if (priceValue > 0 && priceValue < lowestPrice) { lowestPrice = priceValue; lowestRoom = room; }
            });
        }
        const selectedRoom = lowestRoom || apiHotel.rooms?.[0];
        const hubRate = selectedRoom?.hubRateModel;
        const ratePrice = hubRate?.price;
        const priceValue = lowestPrice !== Infinity ? lowestPrice : (ratePrice?.calculatedAmount || ratePrice?.totalPaymentAmount || ratePrice?.markupCalculatedPrice?.holder?.saleAmount || 0);
        const currencyCode = ratePrice?.currency || 'USD';
        const boardName = selectedRoom?.boardName || hubRate?.boardName || selectedRoom?.boardCode || (selectedRoom?.boardType ? selectedRoom.boardType.replace(/_/g, ' ') : null);
        const isNonRefundable = hubRate?.nonRefundable === true || selectedRoom?.nonRefundable === true;
        const cancellationPolicies = hubRate?.cancellationPolicies || selectedRoom?.cancellationPolicies;
        const hasFreeCancellation = (cancellationPolicies && cancellationPolicies.length > 0 && cancellationPolicies.some(cp => cp.amount === 0 || cp.penaltyAmount === 0)) || (!isNonRefundable && cancellationPolicies?.length > 0);
        const strikethroughPrice = ratePrice?.strikethroughPrice || ratePrice?.originalPrice || (priceValue > 0 ? priceValue * 1.15 : 0);

        return {
            id: apiHotel.id, hotelId: apiHotel.hotelId, name, type: starLabel || 'Hotel',
            stars: starCount, location: locationString || 'Unknown Location',
            image: imagesToMap[0], images: imagesToMap, rating, ratingLabel,
            ratingColor: 'bg-primary/10 text-primary', price: priceValue, currency: currencyCode,
            lat: apiHotel.coordinates?.lat, lng: apiHotel.coordinates?.lon,
            amenities, transportations: apiHotel.transportations || [],
            badges: [], roomName: selectedRoom?.name || selectedRoom?.roomName,
            boardName, isNonRefundable, hasFreeCancellation,
            strikethroughPrice: strikethroughPrice > priceValue ? strikethroughPrice : null,
            availableRoomsCount: apiHotel.rooms?.length || 0,
            isRecommended: apiHotel.isRecommended === true || apiHotel.preferred === true,
        };
    }, []);

    // Save to localStorage
    React.useEffect(() => {
        if (slug) localStorage.setItem('last_hotel_search_slug', slug);
        const currentParams = searchParams.toString();
        if (currentParams) localStorage.setItem('last_hotel_search_params', currentParams);
    }, [slug, searchParams]);

    // Load hotels from API (optionally using geo bounds for map-area search)
    const loadMoreHotels = React.useCallback(async (isReset = false, geoBounds = null) => {
        if (isReset && abortControllerRef.current) {
            abortControllerRef.current.abort();
            setIsLoading(false);
            isFetchingRef.current = false;
        }
        if (!isReset) {
            if (isFetchingRef.current || !hasMoreRef.current) return;
        }
        isFetchingRef.current = true;
        if (isReset) {
            setIsLoading(true);
            setHotels([]);
            setTotalProperties(0);
            pageRef.current = 0;
            hasMoreRef.current = true;
            setPage(0);
            setHasMore(true);
        }
        const controller = new AbortController();
        abortControllerRef.current = controller;
        try {
            const filters = getSearchParams();
            const currentPage = isReset ? 0 : pageRef.current;
            const baseRequest = {
                // Use geo bounds if provided (map area search), otherwise use locationId
                locationId: geoBounds ? null : locationId,
                geo: geoBounds?.bounds || null,
                zoom: geoBounds?.zoom || null,
                size: 100,
                filters: {
                    locationIds: geoBounds
                        ? [] // when searching by map bounds, don't restrict by locationId
                        : (filters.locations?.length > 0 ? filters.locations : (locationId ? [parseInt(locationId)] : null)),
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
                    const sanitized = validateAndSanitizeDates(searchParams.get('checkin'), searchParams.get('checkout'));
                    return {
                        checkin: formatDateForUrl(sanitized.checkInDate),
                        checkout: formatDateForUrl(sanitized.checkOutDate),
                        nationality: searchParams.get('nationality') || 'TR',
                        rooms: roomState
                    };
                })(),
                sort: sortConfig.field ? sortConfig : null,
                signal: controller.signal
            };
            const req1 = hotelService.searchHotels({ ...baseRequest, page: currentPage });
            const req2 = geoBounds ? null : hotelService.searchHotels({ ...baseRequest, page: currentPage + 1 });
            const results = await Promise.allSettled(req2 ? [req1, req2] : [req1]);
            const res1 = results[0]?.status === 'fulfilled' ? results[0].value : null;
            const res2 = results[1]?.status === 'fulfilled' ? results[1].value : null;
            if (res1 && res1.data) {
                const pageData1 = res1.data;
                const pageData2 = (res2 && res2.data) ? res2.data : null;
                const filtersData = res1.filters || res1.data.filters;
                const content1 = pageData1.content || [];
                const content2 = pageData2?.content || [];
                const combinedContent = [...content1, ...content2];
                const mappedHotels = combinedContent.map(h => mapApiHotelToModel(h));
                setHotels(prev => {
                    if (currentPage === 0) return mappedHotels;
                    const existingIds = new Set(prev.map(h => h.id));
                    return [...prev, ...mappedHotels.filter(h => !existingIds.has(h.id))];
                });
                setTotalProperties(pageData1.totalElements || 0);
                if (currentPage === 0 && filtersData) setDynamicFilters(filtersData);
                // When geoBounds search, treat as last page (no pagination)
                const noMore = geoBounds ? true : (pageData1.last || pageData2?.last || combinedContent.length === 0);
                const nextHasMore = !noMore;
                setHasMore(nextHasMore);
                hasMoreRef.current = nextHasMore;
                const nextPage = currentPage + 2;
                setPage(nextPage);
                pageRef.current = nextPage;
                const newLocationNames = {};
                combinedContent.forEach(hotel => {
                    if (hotel.locationBreadcrumbs) {
                        hotel.locationBreadcrumbs.forEach(crumb => {
                            if (crumb.locationId && crumb.name) {
                                newLocationNames[crumb.locationId] = crumb.name.defaultName || crumb.name.translations?.en || crumb.name.translations?.tr;
                            }
                        });
                    }
                });
                if (Object.keys(newLocationNames).length > 0) setLocationNames(prev => ({ ...prev, ...newLocationNames }));
                // Only continue paginating if NOT a geo bounds search
                if (!geoBounds && currentPage === 0 && nextHasMore) {
                    isFetchingRef.current = false;
                    setTimeout(() => { loadMoreHotels(false); }, 50);
                    return;
                }
            } else {
                setHasMore(false);
                hasMoreRef.current = false;
            }
        } catch (error) {
            if (error.name === 'AbortError') {
                console.log('Search request cancelled');
            } else {
                console.error('Error fetching hotels:', error);
                setHasMore(false);
                hasMoreRef.current = false;
            }
        } finally {
            if (abortControllerRef.current === controller) {
                setIsLoading(false);
                isFetchingRef.current = false;
            }
        }
    }, [locationId, mapApiHotelToModel, roomState, searchParams, sortConfig]);

    const updateUrlForMapSearch = React.useCallback((boundsData) => {
        if (!boundsData) return;
        // Clear locationId so the autocomplete sync effect can set the correct new one
        setSearchParams(prev => {
            const newParams = new URLSearchParams(prev.toString());
            newParams.delete('locationId');
            return newParams;
        }, { replace: true });
    }, [setSearchParams]);

    const handleMapBoundsChange = React.useCallback((boundsData) => {
        updateUrlForMapSearch(boundsData);
        loadMoreHotels(true, boundsData);
        setMapMoved(false);
    }, [loadMoreHotels, updateUrlForMapSearch]);

    const handleMapMoved = React.useCallback((boundsData) => {
        mapBoundsRef.current = boundsData;
        setMapMoved(true);
    }, []);

    // Sync autocomplete (q + locationId) with map center after a geo-bounds search
    // Same logic as MapView.jsx syncBreadcrumbWithCenter
    React.useEffect(() => {
        if (!mapInstance || hotels.length === 0 || !mapBoundsRef.current) return;

        const syncAutocompleteWithCenter = () => {
            try {
                const center = mapInstance.getCenter();
                let closestHotel = null;
                let minDistance = Infinity;

                hotels.forEach(hotel => {
                    if (hotel.lat && hotel.lng) {
                        const dist = mapInstance.distance(center, [hotel.lat, hotel.lng]);
                        if (dist < minDistance) {
                            minDistance = dist;
                            closestHotel = hotel;
                        }
                    }
                });

                if (closestHotel?.locationBreadcrumbs?.length > 0) {
                    const breadcrumbs = closestHotel.locationBreadcrumbs;
                    // Pick the most specific non-country crumb
                    const crumb = [...breadcrumbs]
                        .reverse()
                        .find(c => c.locationType !== 'COUNTRY') || breadcrumbs[breadcrumbs.length - 1];

                    if (crumb?.locationId) {
                        const newParams = new URLSearchParams(searchParams);
                        newParams.set('locationId', crumb.locationId);
                        const locName =
                            crumb.name?.translations?.[currentLang] ||
                            crumb.name?.translations?.en ||
                            crumb.name?.defaultName;
                        if (locName) newParams.set('q', locName);
                        setSearchParams(newParams, { replace: true });
                    }
                }
            } catch (err) {
                console.warn('Autocomplete sync failed:', err);
            }
        };

        const timer = setTimeout(syncAutocompleteWithCenter, 400);
        return () => clearTimeout(timer);
    // Only re-run when hotels list changes after a geo search (mapBoundsRef tracks this)
    }, [hotels, mapInstance]); // eslint-disable-line react-hooks/exhaustive-deps

    // Fetch missing location names
    React.useEffect(() => {
        if (!dynamicFilters || !dynamicFilters.locationId) return;
        const missingLocIds = dynamicFilters.locationId.map(f => f.value).filter(id => !locationNames[id]);
        if (missingLocIds.length === 0) return;
        let isMounted = true;
        const fetchMissingNames = async () => {
            const newNames = {};
            await Promise.allSettled(missingLocIds.map(async (id) => {
                try {
                    const data = await locationService.fetchBreadcrumb(id);
                    if (data && data.data && Array.isArray(data.data)) {
                        data.data.forEach(crumb => {
                            if (crumb.locationId && crumb.name) newNames[crumb.locationId] = crumb.name.defaultName || crumb.name.translations?.en || crumb.name.translations?.tr;
                        });
                    } else if (data && data.breadcrumbs) {
                        data.breadcrumbs.forEach(crumb => {
                            if (crumb.locationId && crumb.name) newNames[crumb.locationId] = crumb.name.defaultName || crumb.name.translations?.en || crumb.name.translations?.tr;
                        });
                    }
                } catch (error) { console.error(`Failed to fetch breadcrumb for location ${id}`, error); }
            }));
            if (isMounted && Object.keys(newNames).length > 0) setLocationNames(prev => ({ ...prev, ...newNames }));
        };
        fetchMissingNames();
        return () => { isMounted = false; };
    }, [dynamicFilters, locationNames]);

    // Fetch missing facility names
    React.useEffect(() => {
        if (!dynamicFilters || !dynamicFilters.hotelFacilityIds) return;
        const missingFacIds = dynamicFilters.hotelFacilityIds.map(f => f.value).filter(id => !facilityNames[id]);
        if (missingFacIds.length === 0) return;
        let isMounted = true;
        const fetchMissingNames = async () => {
            try {
                const data = await hotelService.fetchFacilityNames(missingFacIds);
                if (isMounted && data && Array.isArray(data)) {
                    const newNames = {};
                    data.forEach(fac => { newNames[fac.facilityId] = fac.nameEn || fac.nameTr || fac.nameDe || `Facility ${fac.facilityId}`; });
                    if (Object.keys(newNames).length > 0) setFacilityNames(prev => ({ ...prev, ...newNames }));
                }
            } catch (error) { console.error(`Failed to fetch facility names`, error); }
        };
        fetchMissingNames();
        return () => { isMounted = false; };
    }, [dynamicFilters, facilityNames]);

    // Reset on filter/location change
    React.useEffect(() => {
        setPage(0);
        setHasMore(true);
        setSelectedHotel(null);
        setShouldRefitMap(true);
        if (listScrollRef.current) listScrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
        loadMoreHotels(true);
        return () => { if (abortControllerRef.current) abortControllerRef.current.abort(); };
    }, [
        locationId, sortConfig,
        searchParams.get('checkin'), searchParams.get('checkout'),
        searchParams.get('guests'), searchParams.get('nationality'), searchParams.get('q'),
        searchParams.get('stars'), searchParams.get('freeCancellation'), searchParams.get('prePayment'),
        searchParams.get('locations'), searchParams.get('roomTwin'), searchParams.get('roomMaxAdult'),
        searchParams.get('roomMaxChildren'), searchParams.get('roomMaxExtraBed'), searchParams.get('facilities')
    ]);

    // Close sort on outside click
    React.useEffect(() => {
        const handleClickOutside = (event) => {
            if (sortDropdownRef.current && !sortDropdownRef.current.contains(event.target)) setIsSortOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Sort
    const sortOptions = [
        { value: 'recommended', label: tListing('recommended', currentLang), icon: 'thumb_up' },
        { value: 'rating_desc', label: tListing('ratingDesc', currentLang), icon: 'star_rate' },
        { value: 'rating_asc', label: tListing('ratingAsc', currentLang), icon: 'star_half' },
        { value: 'star_desc', label: tListing('starDesc', currentLang), icon: 'star' },
        { value: 'star_asc', label: tListing('starAsc', currentLang), icon: 'grade' },
    ];
    const currentSortValue = sortConfig.field
        ? `${sortConfig.field === 'hotelStarCategoryId' ? 'star' : 'rating'}_${sortConfig.order.toLowerCase()}`
        : 'recommended';
    const currentSortOption = sortOptions.find(opt => opt.value === currentSortValue) || sortOptions[0];
    const handleSortSelect = (val) => {
        let newSort = { field: null, order: 'DESC' };
        switch (val) {
            case 'star_desc': newSort = { field: 'hotelStarCategoryId', order: 'DESC' }; break;
            case 'star_asc': newSort = { field: 'hotelStarCategoryId', order: 'ASC' }; break;
            case 'rating_desc': newSort = { field: 'rating', order: 'DESC' }; break;
            case 'rating_asc': newSort = { field: 'rating', order: 'ASC' }; break;
            default: newSort = { field: null, order: 'DESC' };
        }
        setSortConfig(newSort);
        setIsSortOpen(false);
    };

    // Filter chip handlers
    const handleStarChipToggle = (star) => {
        const urlStars = searchParams.get('stars') ? searchParams.get('stars').split(',').map(Number) : [];
        const newStars = urlStars.includes(star) ? urlStars.filter(s => s !== star) : [...urlStars, star];
        const newParams = new URLSearchParams(searchParams);
        if (newStars.length > 0) newParams.set('stars', newStars.join(','));
        else newParams.delete('stars');
        setSearchParams(newParams);
    };
    const handleFreeCancelChip = () => {
        const current = searchParams.get('freeCancellation');
        const newParams = new URLSearchParams(searchParams);
        if (current === 'true') newParams.delete('freeCancellation');
        else newParams.set('freeCancellation', 'true');
        setSearchParams(newParams);
    };

    // Scroll-based infinite loading
    const handleListScroll = React.useCallback((e) => {
        const { scrollTop, scrollHeight, clientHeight } = e.target;
        if (scrollHeight - scrollTop - clientHeight < 2500 && hasMoreRef.current && !isFetchingRef.current && hotels.length > 0) {
            loadMoreHotels(false);
        }
    }, [loadMoreHotels, hotels.length]);

    // Currency symbols
    const getCurrencySymbol = (code) => {
        const sym = { USD: '$', EUR: '€', GBP: '£', TRY: '₺', AED: 'د.إ', SAR: 'ر.س', JPY: '¥', CNY: '¥', RUB: '₽' };
        return sym[code] || code || '$';
    };

    const urlStars = searchParams.get('stars') ? searchParams.get('stars').split(',').map(Number) : [];

    // ════════════════════════════════════════════
    // RENDER
    // ════════════════════════════════════════════
    return (
        <div className="flex h-full overflow-hidden bg-white dark:bg-[#202124] font-sans">



            {/* ════════════════════════════════════════════
                LEFT PANEL: Hotel List
            ════════════════════════════════════════════ */}
            <div className="w-[60%] flex-shrink-0 flex flex-col relative z-[2000] border-r border-[#e8eaed] dark:border-slate-700 bg-white dark:bg-[#303134]">

                {/* Search Context Bar */}
                <div className="px-4 pt-4 pb-3 shrink-0 border-b border-[#e8eaed] dark:border-slate-700 bg-white dark:bg-[#303134] flex items-center w-full relative z-50">
                    <ListingSearch />
                </div>

                {/* Filter Chips Row */}
                <div className="relative shrink-0 border-b border-[#e8eaed] dark:border-slate-700 bg-white dark:bg-[#303134] z-10">
                    <div className="flex items-center gap-2 px-4 py-2.5 overflow-x-auto scrollbar-hide">
                    {/* All Filters */}
                    <button
                        onClick={() => setIsFilterDrawerOpen(true)}
                        className={`flex items-center gap-1.5 border rounded-lg px-3 h-8 text-[13px] font-medium whitespace-nowrap shrink-0 transition-colors ${activeFilterCount > 0 ? 'bg-[#e8f0fe] dark:bg-blue-900/30 border-[#1a73e8]/40 text-[#1a73e8] dark:text-blue-300' : 'border-[#dadce0] dark:border-slate-600 text-[#3c4043] dark:text-slate-200 hover:bg-[#f8f9fa] dark:hover:bg-slate-700'}`}
                    >
                        <span className="material-symbols-outlined text-[#1a73e8]" style={{ fontSize: '16px' }}>tune</span>
                        {currentLang === 'tr' ? 'Tüm filtreler' : currentLang === 'ar' ? 'كل الفلاتر' : currentLang === 'ru' ? 'Все фильтры' : 'All filters'}
                        {activeFilterCount > 0 && (
                            <span className="bg-[#1a73e8] text-white text-[10px] font-bold rounded-lg min-w-[16px] h-4 flex items-center justify-center px-1 ml-0.5">
                                {activeFilterCount}
                            </span>
                        )}
                    </button>

                    {/* Property Type */}
                    <button
                        onClick={() => setIsFilterDrawerOpen(true)}
                        className="flex items-center gap-1.5 border border-[#dadce0] dark:border-slate-600 rounded-lg px-3 h-8 text-[13px] text-[#3c4043] dark:text-slate-200 whitespace-nowrap shrink-0 hover:bg-[#f8f9fa] dark:hover:bg-slate-700 transition-colors"
                    >
                        <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>home</span>
                        {currentLang === 'tr' ? 'Mülk türü' : currentLang === 'ar' ? 'نوع العقار' : 'Property type'}
                    </button>

                    {/* Free Cancellation */}
                    <button
                        onClick={handleFreeCancelChip}
                        className={`flex items-center gap-1.5 border rounded-lg px-3 h-8 text-[13px] font-medium whitespace-nowrap shrink-0 transition-colors ${searchParams.get('freeCancellation') === 'true' ? 'bg-[#e8f0fe] dark:bg-blue-900/30 border-[#1a73e8]/40 text-[#1a73e8] dark:text-blue-300' : 'border-[#dadce0] dark:border-slate-600 text-[#3c4043] dark:text-slate-200 hover:bg-[#f8f9fa] dark:hover:bg-slate-700'}`}
                    >
                        {currentLang === 'tr' ? 'Ücretsiz iptal' : currentLang === 'ar' ? 'إلغاء مجاني' : currentLang === 'ru' ? 'Бесплатная отмена' : 'Free cancellation'}
                    </button>

                    {/* Guest Rating */}
                    <button
                        onClick={() => setIsFilterDrawerOpen(true)}
                        className="flex items-center gap-1.5 border border-[#dadce0] dark:border-slate-600 rounded-lg px-3 h-8 text-[13px] text-[#3c4043] dark:text-slate-200 whitespace-nowrap shrink-0 hover:bg-[#f8f9fa] dark:hover:bg-slate-700 transition-colors"
                    >
                        <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>star</span>
                        {currentLang === 'tr' ? 'Konuk puanı' : currentLang === 'ar' ? 'تقييم النزلاء' : 'Guest rating'}
                    </button>

                    {/* Hotel class / star chips */}
                    <button
                        onClick={() => setIsFilterDrawerOpen(true)}
                        className={`flex items-center gap-1 border rounded-lg px-3 h-8 text-[13px] font-medium whitespace-nowrap shrink-0 transition-colors ${urlStars.length > 0 ? 'bg-[#e8f0fe] dark:bg-blue-900/30 border-[#1a73e8]/40 text-[#1a73e8] dark:text-blue-300' : 'border-[#dadce0] dark:border-slate-600 text-[#3c4043] dark:text-slate-200 hover:bg-[#f8f9fa] dark:hover:bg-slate-700'}`}
                    >
                        <span style={{ color: '#fabb05', fontSize: '14px' }}>★</span>
                        {currentLang === 'tr' ? 'Otel sınıfı' : currentLang === 'ar' ? 'فئة الفندق' : 'Hotel class'}
                    </button>

                    {/* Amenities */}
                    <button
                        onClick={() => setIsFilterDrawerOpen(true)}
                        className="flex items-center gap-1.5 border border-[#dadce0] dark:border-slate-600 rounded-lg px-3 h-8 text-[13px] text-[#3c4043] dark:text-slate-200 whitespace-nowrap shrink-0 hover:bg-[#f8f9fa] dark:hover:bg-slate-700 transition-colors"
                    >
                        <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>wifi</span>
                        {currentLang === 'tr' ? 'Sunulan olanaklar' : currentLang === 'ar' ? 'المرافق' : 'Amenities'}
                    </button>
                </div>

                {/* Filter Popup Overlay */}
                {isFilterDrawerOpen && (
                    <>
                        <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setIsFilterDrawerOpen(false)} />
                        <div className="absolute top-full left-4 mt-2 w-[360px] max-w-[90vw] bg-white dark:bg-[#303134] rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.15)] border border-[#dadce0] dark:border-slate-700 z-50 flex flex-col overflow-hidden animate-in fade-in slide-in-from-top-2" style={{ maxHeight: 'calc(100vh - 200px)' }}>
                            <div className="flex items-center justify-between px-5 py-4 border-b border-[#e8eaed] dark:border-slate-700 shrink-0">
                                <h2 className="text-[15px] font-medium text-[#3c4043] dark:text-slate-100">
                                    {currentLang === 'tr' ? 'Filtreler' : currentLang === 'ar' ? 'الفلاتر' : currentLang === 'ru' ? 'Фильтры' : 'Filters'}
                                </h2>
                                <button onClick={() => setIsFilterDrawerOpen(false)} className="text-[#70757a] hover:text-[#3c4043] dark:hover:text-white transition-colors">
                                    <span className="material-symbols-outlined text-xl">close</span>
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto custom-scrollbar">
                                <Sidebar filters={dynamicFilters} locationNames={locationNames} facilityNames={facilityNames} />
                            </div>
                            <div className="px-5 py-3 border-t border-[#e8eaed] dark:border-slate-700 flex justify-between items-center bg-[#f8f9fa] dark:bg-slate-800 shrink-0">
                                <span className="text-[13px] text-[#70757a]">{hotels.length} {currentLang === 'tr' ? 'sonuç' : 'results'}</span>
                                <button onClick={() => {
                                    setSearchParams(new URLSearchParams());
                                    setIsFilterDrawerOpen(false);
                                }} className="text-[#1a73e8] text-[13px] font-medium hover:underline">
                                    {currentLang === 'tr' ? 'Tümünü temizle' : 'Clear all'}
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>

                {/* Results count + Sort row */}
                <div className="flex items-center justify-between px-4 py-2 shrink-0 bg-white dark:bg-[#303134]">
                    <p className="text-[13px] text-[#3c4043] dark:text-slate-300 truncate">
                        {resultsText}
                    </p>
                    {/* Sort dropdown */}
                    <div className="relative shrink-0 ml-2" ref={sortDropdownRef}>
                        <button
                            onClick={() => setIsSortOpen(!isSortOpen)}
                            className="flex items-center gap-1 text-[13px] text-[#3c4043] dark:text-slate-200 hover:bg-[#f8f9fa] dark:hover:bg-slate-700 rounded-lg px-2.5 py-1.5 transition-colors"
                        >
                            <span className="material-symbols-outlined text-[#1a73e8]" style={{ fontSize: '16px' }}>{currentSortOption.icon}</span>
                            <span className="hidden sm:inline text-[13px]">{currentSortOption.label}</span>
                            <span className={`material-symbols-outlined text-[#70757a] transition-transform duration-200 ${isSortOpen ? 'rotate-180' : ''}`} style={{ fontSize: '18px' }}>expand_more</span>
                        </button>
                        {isSortOpen && (
                            <div className="absolute right-0 top-full mt-1 w-[240px] bg-white dark:bg-[#303134] rounded-2xl border border-[#e8eaed] dark:border-slate-700 shadow-xl z-[200] py-1.5 animate-in fade-in zoom-in-95 duration-150">
                                {sortOptions.map(opt => {
                                    const isSelected = opt.value === currentSortValue;
                                    return (
                                        <button
                                            key={opt.value}
                                            onClick={() => handleSortSelect(opt.value)}
                                            className={`w-full flex items-center gap-3 px-4 py-2.5 text-[13px] text-left transition-colors ${isSelected ? 'bg-[#e8f0fe] dark:bg-blue-900/30 text-[#1a73e8] font-medium' : 'text-[#3c4043] dark:text-slate-300 hover:bg-[#f8f9fa] dark:hover:bg-slate-700'}`}
                                        >
                                            <span className={`material-symbols-outlined ${isSelected ? 'text-[#1a73e8]' : 'text-[#70757a]'}`} style={{ fontSize: '18px' }}>{opt.icon}</span>
                                            <span className="flex-1">{opt.label}</span>
                                            {isSelected && <span className="material-symbols-outlined text-[#1a73e8]" style={{ fontSize: '16px' }}>check</span>}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Scrollable Hotel List ── */}
                <div
                    ref={listScrollRef}
                    className="flex-1 overflow-y-auto"
                    onScroll={handleListScroll}
                >
                    {/* Initial skeleton */}
                    {isLoading && hotels.length === 0 && (
                        <>{[...Array(6)].map((_, i) => <GoogleCardSkeleton key={i} />)}</>
                    )}

                    {/* Hotel cards */}
                    {hotels.map(hotel => (
                        <GoogleHotelCard
                            key={hotel.id}
                            hotel={hotel}
                            searchParams={searchParams}
                            isSelected={selectedHotel?.id === hotel.id}
                            isHovered={hoveredHotel?.id === hotel.id}
                            onHover={setHoveredHotel}
                            onSelect={setSelectedHotel}
                            currentLang={currentLang}
                            isFav={isFavorite(String(hotel.hotelId))}
                            onToggleFav={() => toggleFavorite(hotel)}
                        />
                    ))}

                    {/* Loading more */}
                    {isLoading && hotels.length > 0 && (
                        <>{[...Array(3)].map((_, i) => <GoogleCardSkeleton key={`more-${i}`} />)}</>
                    )}

                    {/* Sentinel + end state */}
                    <div ref={loaderRef} className="py-4 flex items-center justify-center">
                        {!hasMore && hotels.length > 0 && (
                            <div className="flex items-center gap-3 text-[12px] text-[#70757a] dark:text-slate-400 w-full px-4">
                                <div className="flex-1 h-px bg-[#e8eaed] dark:bg-slate-700" />
                                {tListing('reachedEnd', currentLang)}
                                <div className="flex-1 h-px bg-[#e8eaed] dark:bg-slate-700" />
                            </div>
                        )}
                    </div>

                    {/* Empty state */}
                    {hotels.length === 0 && !isLoading && (
                        <div className="flex flex-col items-center justify-center py-20 text-center px-8">
                            <span className="material-symbols-outlined text-5xl text-[#dadce0] dark:text-slate-600 mb-4">search_off</span>
                            <h3 className="text-[16px] font-medium text-[#3c4043] dark:text-slate-300 mb-2">
                                {tListing('noProperties', currentLang)}
                            </h3>
                            <p className="text-[13px] text-[#70757a] dark:text-slate-400">
                                {tListing('tryAdjusting', currentLang)}
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* ════════════════════════════════════════════
                RIGHT PANEL: Map & Favorites Sidebar
            ════════════════════════════════════════════ */}
            <div className="flex-1 relative flex">
                <div className="flex-1 relative overflow-hidden">
                <MapContainer
                    center={[39.9, 32.8]}
                    zoom={6}
                    style={{ height: '100%', width: '100%' }}
                    zoomControl={false}
                    attributionControl={true}
                >
                    <TileLayer
                        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        maxZoom={19}
                    />
                    {/* Capture map instance */}
                    <MapInstanceCapture setMap={setMapInstance} />

                    {/* Price markers for hotels with coordinates */}
                    {hotels
                        .filter(h => h.lat && h.lng && !isNaN(parseFloat(h.lat)) && !isNaN(parseFloat(h.lng)))
                        .map(hotel => (
                            <PriceMarker
                                key={hotel.id}
                                hotel={hotel}
                                isSelected={selectedHotel?.id === hotel.id}
                                isHovered={hoveredHotel?.id === hotel.id}
                                onSelect={setSelectedHotel}
                                onHover={setHoveredHotel}
                                searchParams={searchParams}
                                currencySymbol={getCurrencySymbol(hotel.currency)}
                            />
                        ))
                    }

                    {/* Auto-fit to hotel bounds */}
                    <MapFitControl
                        hotels={hotels}
                        shouldRefit={shouldRefitMap}
                        onRefitDone={React.useCallback(() => setShouldRefitMap(false), [])}
                    />

                    {/* Map move detector */}
                    <MapBoundsWatcher
                        searchOnMove={searchOnMapMove}
                        onBoundsChange={handleMapBoundsChange}
                        onMapMoved={handleMapMoved}
                    />
                </MapContainer>

                {/* Top center: Search-on-move toggle OR "Listeyi güncelle" button */}
                <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000] pointer-events-auto">
                    {/* Always show the toggle */}
                    {!mapMoved && (
                        <div className="flex items-center gap-2 bg-white dark:bg-[#303134] border border-[#dadce0] dark:border-slate-600 rounded-full px-3 py-2 shadow-md">
                            <button
                                onClick={() => setSearchOnMapMove(v => !v)}
                                className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors shrink-0 ${
                                    searchOnMapMove
                                        ? 'bg-[#1a73e8] border-[#1a73e8]'
                                        : 'bg-white dark:bg-[#303134] border-[#80868b] dark:border-slate-500'
                                }`}
                            >
                                {searchOnMapMove && (
                                    <span className="material-symbols-outlined text-white" style={{ fontSize: '14px', fontVariationSettings: "'FILL' 1" }}>check</span>
                                )}
                            </button>
                            <span
                                onClick={() => setSearchOnMapMove(v => !v)}
                                className="text-[13px] font-medium text-[#3c4043] dark:text-slate-200 cursor-pointer select-none whitespace-nowrap"
                            >
                                {currentLang === 'tr' ? 'Harita hareket ettiğinde listeyi güncelle' : 'Search as map moves'}
                            </span>
                        </div>
                    )}

                    {/* Show manual update button when map moved but searchOnMove is off */}
                    {mapMoved && !searchOnMapMove && (
                        <button
                            onClick={() => {
                                updateUrlForMapSearch(mapBoundsRef.current);
                                loadMoreHotels(true, mapBoundsRef.current);
                                setMapMoved(false);
                            }}
                            className="flex items-center gap-2 bg-white dark:bg-[#303134] hover:bg-[#f8f9fa] dark:hover:bg-slate-700 border border-[#dadce0] dark:border-slate-600 rounded-full px-4 py-2 text-[13px] font-medium text-[#3c4043] dark:text-slate-200 shadow-md transition-colors cursor-pointer"
                        >
                            <span className="material-symbols-outlined text-[#1a73e8]" style={{ fontSize: '18px' }}>refresh</span>
                            {currentLang === 'tr' ? 'Listeyi güncelle' : 'Search this area'}
                        </button>
                    )}
                </div>
            </div>

            {/* Favorites Right Sidebar (Google Style) */}
            <div 
                className={`relative bg-white dark:bg-[#202124] border-l border-[#e8eaed] dark:border-slate-700 transition-all duration-300 flex flex-col z-[2000] ${isFavOpen ? 'w-[320px] shadow-[-4px_0_15px_rgba(0,0,0,0.05)]' : 'w-12 bg-[#f8f9fa] dark:bg-[#303134] hover:bg-white dark:hover:bg-[#202124]'}`}
                onMouseEnter={() => setIsFavOpen(true)}
                onMouseLeave={() => setIsFavOpen(false)}
            >
                {!isFavOpen ? (
                    <div className="flex flex-col items-center w-full py-3 gap-2">
                        <button className="w-10 h-10 rounded-full flex items-center justify-center text-[#5f6368] dark:text-slate-400 hover:bg-[#f1f3f4] dark:hover:bg-slate-700 transition-colors cursor-pointer">
                            <span className="material-symbols-outlined text-[20px]">bookmark</span>
                        </button>
                        <div className="w-6 h-[1px] bg-[#dadce0] dark:bg-slate-700 my-1"></div>
                        <div className="flex flex-col gap-3 mt-1 items-center w-full">
                            {favorites.slice(0, 4).map(fav => (
                                <div key={fav.hotelId || fav.id} className="w-8 h-8 rounded-full overflow-hidden border border-[#dadce0] dark:border-slate-600 shadow-sm cursor-pointer hover:opacity-80 transition-opacity">
                                    <img src={fav.image || fav.images?.[0]?.url || placeholderHotel} className="w-full h-full object-cover" />
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col h-full bg-white dark:bg-[#202124]">
                        <div className="flex items-center justify-between p-4 pb-2">
                            <h2 className="text-[18px] font-normal text-[#202124] dark:text-white">{currentLang === 'tr' ? 'Seyahat planlarınız' : 'Your travel plans'} ({favorites.length})</h2>
                            <button onClick={() => setIsFavOpen(false)} className="w-8 h-8 rounded-full hover:bg-[#f1f3f4] dark:hover:bg-slate-700 flex items-center justify-center text-[#5f6368] dark:text-slate-400 transition-colors">
                                <span className="material-symbols-outlined text-[20px]">info</span>
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto bg-white dark:bg-[#202124]">
                            <div className="px-4 py-2 flex items-center gap-2">
                                <span className="material-symbols-outlined text-[#5f6368] dark:text-slate-400 text-[20px]">bookmark</span>
                                <span className="text-[14px] font-medium text-[#202124] dark:text-slate-200">{currentLang === 'tr' ? 'Kayıtlı öğeler' : 'Saved items'}</span>
                            </div>

                            {favorites.length === 0 ? (
                                <div className="text-center mt-10 px-4">
                                    <h3 className="text-[14px] font-medium text-[#202124] dark:text-white mb-2">{currentLang === 'tr' ? 'Burada henüz bir şey yok' : 'Nothing here yet'}</h3>
                                    <p className="text-[13px] text-[#70757a] dark:text-slate-400">{currentLang === 'tr' ? 'Seyahat etkinlikleriniz siz seyahat öğelerini görüntülemeye veya kaydetmeye başladıktan sonra burada görünecek' : 'Your travel activity will appear here once you start viewing or saving items'}</p>
                                </div>
                            ) : (
                                <div className="px-4 pb-4 pt-1 flex flex-col gap-3">
                                    {favorites.map(fav => (
                                        <div 
                                            key={fav.hotelId || fav.id} 
                                            className="bg-white dark:bg-[#303134] rounded-[16px] border border-[#dadce0] dark:border-slate-700 p-3 flex gap-3 cursor-pointer hover:bg-[#f8f9fa] dark:hover:bg-slate-700/50 transition-colors"
                                            onClick={() => window.open(`/hotel/${fav.hotelId || fav.id}`, '_blank')}
                                        >
                                            <div className="shrink-0 w-[72px] h-[72px] rounded-[12px] overflow-hidden bg-[#f1f3f4] dark:bg-slate-800">
                                                <img src={fav.image || fav.images?.[0]?.url || placeholderHotel} className="w-full h-full object-cover" />
                                            </div>
                                            <div className="flex-1 min-w-0 flex flex-col justify-center py-0.5">
                                                <h4 className="text-[14px] font-semibold text-[#3c4043] dark:text-white leading-[1.2] line-clamp-2">{fav.name || fav.hotelName || fav.names?.en || 'Otel'}</h4>
                                                <div className="flex items-center gap-1 mt-1 text-[12px] text-[#70757a] dark:text-slate-400">
                                                    {fav.rating && (
                                                        <>
                                                            <span className="font-medium text-[#70757a] dark:text-slate-300">{fav.rating}</span>
                                                            <span className="material-symbols-outlined text-[#fbbc04] text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                                                            <span>({fav.reviewCount || Math.floor(Math.random() * 1000) + 100})</span>
                                                        </>
                                                    )}
                                                </div>
                                                <div className="text-[12px] text-[#70757a] dark:text-slate-400 mt-0.5 truncate">
                                                    {fav.stars ? `${fav.stars} yıldızlı otel` : 'Otel'}
                                                </div>
                                            </div>
                                            <div className="shrink-0 flex items-center justify-center">
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); toggleFavorite(fav); }} 
                                                    className="w-10 h-10 rounded-full border border-[#dadce0] dark:border-slate-600 bg-white dark:bg-[#303134] hover:bg-[#f8f9fa] dark:hover:bg-slate-700 flex items-center justify-center transition-colors shadow-sm"
                                                >
                                                    <span className="material-symbols-outlined text-[#1a73e8] dark:text-[#8ab4f8] text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>bookmark</span>
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
            </div>
        </div>
    );
};

export default HotelListing;
