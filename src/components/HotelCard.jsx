import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import placeholderHotel from '../assets/placeholder-hotel.svg';
import Tooltip from '../components/Tooltip';

const starSuffixes = {
    en: { star: 'Star', stars: 'Stars' },
    tr: { star: 'Yıldız', stars: 'Yıldız' },
    ar: { star: 'نجم', stars: 'نجوم' },
    de: { star: 'Sterne', stars: 'Sterne' },
    es: { star: 'estrellas', stars: 'estrellas' },
    fr: { star: 'étoile', stars: 'étoiles' },
    it: { star: 'stelle', stars: 'stelle' },
    ru: { star: 'звезд', stars: 'звезд' },
    zh: { star: '星', stars: '星' },
    ja: { star: '星', stars: '星' },
    fa: { star: 'ستاره', stars: 'ستاره' },
    el: { star: 'αστέρι', stars: 'αστέρια' },
    pt: { star: 'estrelas', stars: 'estrelas' }
};

const HotelCard = ({ hotel, viewMode = 'list' }) => {
    const { i18n } = useTranslation();
    const currentLang = i18n.language || 'tr';

    const getStarLabel = () => {
        if (!hotel.stars) return hotel.type || 'Hotel';
        const lang = starSuffixes[currentLang] || starSuffixes['en'];
        const suffix = hotel.stars === 1 ? lang.star : lang.stars;
        return `${hotel.stars} ${suffix}`;
    };

    const isList = viewMode === 'list';
    const [currentImg, setCurrentImg] = React.useState(0);
    const [isHovered, setIsHovered] = React.useState(false);
    const [showAllTransports, setShowAllTransports] = React.useState(false);
    const [searchParams] = useSearchParams();
    const images = hotel.images || [hotel.image];

    const nextImg = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setCurrentImg((prev) => (prev + 1) % images.length);
    };

    const prevImg = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setCurrentImg((prev) => (prev - 1 + images.length) % images.length);
    };

    // Auto-slide effect on hover
    React.useEffect(() => {
        let intervalId;
        if (isHovered && images.length > 1) {
            intervalId = setInterval(() => {
                setCurrentImg((prev) => (prev + 1) % images.length);
            }, 2500); // Rotate every 2.5 seconds
        }
        return () => {
            if (intervalId) clearInterval(intervalId);
            // Optionally reset to first image on leave, but usually keeping current is fine
            // if (!isHovered) setCurrentImg(0);
        };
    }, [isHovered, images.length]);

    const handleImageError = (e) => {
        e.target.src = placeholderHotel;
        e.target.onerror = null; // Prevent infinite loop
    };

    const handleFavorite = (e) => {
        e.preventDefault();
        e.stopPropagation();
        // favorite logic here
    };

    const getCurrencySymbol = (code) => {
        const symbols = {
            'USD': '$',
            'EUR': '€',
            'GBP': '£',
            'TRY': '₺',
            'AED': 'د.إ',
            'SAR': 'ر.س',
        };
        return symbols[code] || code || '$';
    };

    const displayPrice = hotel.price ? Math.round(hotel.price) : '---';
    const currencySymbol = getCurrencySymbol(hotel.currency);

    return (
        <Link
            to={`/hotel/${hotel.hotelId}?${searchParams.toString()}`}
            target="_blank"
            rel="noopener noreferrer"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className={`group bg-white dark:bg-[#111a22] rounded-2xl border border-slate-200 dark:border-[#233648] shadow-sm hover:shadow-xl transition-all duration-300 flex ${isList ? 'flex-col md:flex-row' : 'flex-col'}`}
        >
            <div 
                className={`relative overflow-hidden isolate z-0 transform-gpu ${isList ? 'rounded-t-2xl md:rounded-l-2xl md:rounded-tr-none h-64 md:h-auto md:w-[400px] shrink-0' : 'rounded-t-2xl h-60'}`}
                style={{ WebkitMaskImage: '-webkit-radial-gradient(white, black)' }}
            >
                {/* Image Slider */}
                <div className="w-full h-full relative">
                    {images.map((img, idx) => (
                        <img
                            key={idx}
                            src={img}
                            alt={`${hotel.name} ${idx + 1}`}
                            onError={handleImageError}
                            className={`absolute inset-0 w-full h-full object-cover transition-all duration-[1200ms] ease-in-out will-change-[transform,opacity] ${idx === currentImg ? 'opacity-100 scale-100' : 'opacity-0 scale-110'}`}
                        />
                    ))}

                    {/* Navigation Arrows */}
                    {images.length > 1 && (
                        <>
                            <button
                                onClick={prevImg}
                                className="absolute left-2 top-1/2 -translate-y-1/2 z-10 size-8 bg-white/20 hover:bg-white/40 backdrop-blur-md rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all border border-white/30"
                            >
                                <span className="material-symbols-outlined text-lg">chevron_left</span>
                            </button>
                            <button
                                onClick={nextImg}
                                className="absolute right-2 top-1/2 -translate-y-1/2 z-10 size-8 bg-white/20 hover:bg-white/40 backdrop-blur-md rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all border border-white/30"
                            >
                                <span className="material-symbols-outlined text-lg">chevron_right</span>
                            </button>

                            {/* Dots Indicators */}
                            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex gap-1.5 px-2 py-1 rounded-full bg-black/10 backdrop-blur-sm border border-white/10">
                                {images.map((_, idx) => (
                                    <div
                                        key={idx}
                                        className={`size-1.5 rounded-full transition-all duration-300 ${idx === currentImg ? 'bg-white w-3' : 'bg-white/40 hover:bg-white/60'}`}
                                    />
                                ))}
                            </div>
                        </>
                    )}
                </div>

                <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
                    {hotel.badges?.map((badge, idx) => (
                        <div
                            key={idx}
                            className={`${badge.color} text-white text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl shadow-lg flex items-center gap-1.5 animate-in fade-in slide-in-from-left-4 duration-700 backdrop-blur-sm border border-white/10`}
                        >
                            {badge.type === 'featured' && <span className="material-symbols-outlined text-xs fill-1">workspace_premium</span>}
                            {badge.type === 'opportunity' && <span className="material-symbols-outlined text-xs fill-1">local_fire_department</span>}
                            {badge.type === 'discount' && <span className="material-symbols-outlined text-xs fill-1">sell</span>}
                            {badge.type === 'popular' && <span className="material-symbols-outlined text-xs fill-1">trending_up</span>}
                            {badge.type === 'exclusive' && <span className="material-symbols-outlined text-xs fill-1">verified</span>}
                            {badge.label}
                        </div>
                    ))}
                </div>
                <button
                    onClick={handleFavorite}
                    className="absolute top-4 right-4 z-10 size-10 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center text-slate-900 shadow-md hover:text-red-500 transition-all"
                >
                    <span className="material-symbols-outlined text-xl">favorite</span>
                </button>
            </div>
            <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                    <div className="flex justify-between items-start mb-1">
                        <div>
                            <div className="flex items-center gap-1 text-amber-400 mb-1">
                                {[...Array(hotel.stars || 0)].map((_, i) => (
                                    <span key={i} className="material-symbols-outlined text-[10px] fill-1">star</span>
                                ))}
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">{getStarLabel()}</span>
                            </div>
                            <h3 className={`font-bold leading-tight group-hover:text-primary transition-colors ${isList ? 'text-2xl' : 'text-lg'}`}>{hotel.name}</h3>
                            <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 mt-1 relative">
                                <span className="material-symbols-outlined text-sm text-primary">location_on</span>
                                <div className="group/transport relative">
                                    <span className="text-xs font-semibold cursor-help">
                                        {(() => {
                                            const validTransports = hotel.transportations?.filter(t => typeof t.distanceKm === 'number');
                                            const nearest = validTransports?.length > 0 ? [...validTransports].sort((a, b) => a.distanceKm - b.distanceKm)[0] : null;

                                            return nearest
                                                ? `${hotel.location} • ${nearest.distanceKm} km to ${nearest.name}`
                                                : hotel.location;
                                        })()}
                                        {hotel.transportations?.length > 1 && ` • +${hotel.transportations.length - 1} transports`}
                                        {hotel.transportations?.length === 1 && !hotel.transportations.some(t => t.type === 'AIRPORT') && ` • 1 transport nearby`}
                                    </span>
                                    {hotel.transportations?.length > 0 && (
                                        <div className="absolute top-full left-0 pt-2 w-64 opacity-0 invisible group-hover/transport:opacity-100 group-hover/transport:visible transition-all duration-200 z-[999]">
                                            <div className="bg-slate-900 border border-slate-700 text-white text-xs rounded-xl shadow-xl p-3 flex flex-col gap-2 max-h-60 overflow-y-auto custom-scrollbar">
                                                <div className="font-bold border-b border-slate-800 pb-1 mb-1 shrink-0">Nearby Transportation</div>
                                                {hotel.transportations.slice(0, showAllTransports ? hotel.transportations.length : 5).map((trans, i) => (
                                                    <div key={i} className="flex items-center justify-between gap-2 shrink-0">
                                                        <div className="flex items-center gap-1.5 truncate">
                                                            <span className="material-symbols-outlined text-[14px] text-primary shrink-0">
                                                                {trans.type === 'AIRPORT' ? 'flight_takeoff' : trans.type === 'RAIL' || trans.type === 'SUBWAY' ? 'train' : 'directions_boat'}
                                                            </span>
                                                            <span className="truncate flex-1" title={trans.name}>{trans.name}</span>
                                                        </div>
                                                        <span className="text-slate-400 shrink-0 font-medium whitespace-nowrap">
                                                            {trans.distanceKm ? `${trans.distanceKm} km` : trans.durationMinutes ? `${trans.durationMinutes} min` : ''}
                                                        </span>
                                                    </div>
                                                ))}
                                                {!showAllTransports && hotel.transportations.length > 5 && (
                                                    <button 
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            setShowAllTransports(true);
                                                        }}
                                                        className="text-[10px] text-slate-400 hover:text-white text-center italic mt-1 pt-1 border-t border-slate-800 transition-colors cursor-pointer w-full"
                                                    >
                                                        + {hotel.transportations.length - 5} more options
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="bg-primary/10 px-2 py-1.5 rounded-xl text-right shrink-0">
                            <div className="text-sm font-black text-primary leading-none">{hotel.rating}</div>
                            <div className="text-[8px] font-bold text-primary uppercase leading-none mt-1">{hotel.ratingLabel}</div>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2 my-4">
                        {hotel.amenities.slice(0, 10).map((amenity, index) => (
                            <Tooltip key={index} text={amenity.label}>
                                <div className="size-8 flex items-center justify-center bg-slate-50 dark:bg-slate-800/50 rounded-xl text-slate-500 dark:text-slate-400 border border-slate-100 dark:border-slate-800 hover:bg-primary/10 hover:text-primary hover:border-primary/20 transition-all cursor-help">
                                    <span className="material-symbols-outlined text-lg">{amenity.icon}</span>
                                </div>
                            </Tooltip>
                        ))}
                    </div>
                </div>

                <div className={`flex items-center justify-between pt-4 ${isList ? 'border-t border-slate-100 dark:border-[#233648]' : ''}`}>
                    <div className="flex flex-col">
                        <div className="flex items-baseline gap-1">
                            {hotel.price > 0 ? (
                                <>
                                    <div className="flex items-baseline gap-1">
                                        <span className={`font-black ${isList ? 'text-2xl' : 'text-xl'}`}>
                                            {currencySymbol}{Math.round(hotel.price)}
                                        </span>
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{hotel.currency}</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[7px] text-slate-400 font-bold uppercase leading-none">
                                            {hotel.tax > 0 
                                                ? `incl. ${currencySymbol}${hotel.tax.toFixed(2)} tax` 
                                                : 'incl. taxes'}
                                        </span>
                                    </div>
                                </>
                            ) : (
                                <span className="text-sm font-bold text-slate-500 uppercase">Check Availability</span>
                            )}
                        </div>
                    </div>
                    <div
                        className={`bg-primary hover:bg-primary/90 text-white font-bold rounded-xl transition-all shadow-md hover:shadow-primary/20 active:scale-95 flex items-center justify-center whitespace-nowrap ${isList ? 'text-sm py-3 px-8' : 'text-xs py-2.5 px-4'}`}
                    >
                        View Details
                    </div>
                </div>
            </div>
        </Link>
    );
};

export default HotelCard;
