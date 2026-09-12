import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import Footer from '../components/Footer';
import { useTranslation } from 'react-i18next';
import Breadcrumbs from '../components/Breadcrumbs';
import DatePicker, { registerLocale } from 'react-datepicker';
import { enGB, tr, es, ru, zhCN, ja, faIR, fr, it, el, pt, ar, enUS, de, nl, pl, uk, bg } from 'date-fns/locale';
import { format } from "date-fns";
import HolidaySidePanel from "../components/HolidaySidePanel";
import "react-datepicker/dist/react-datepicker.css";
import "../datepicker-custom.css";
import { useHolidays } from '../utils/useHolidays';
import { mockHotels } from '../data/mockHotels';
import NationalitySelect from '../components/NationalitySelect';
import { hotelService } from '../services/hotelService';
import { useToast } from '../context/ToastContext';
import { parseGuestsParam, serializeGuestsParam, validateAndSanitizeDates, formatDateForUrl } from '../utils/searchParamsUtils';
import GoogleFlightDatePicker, { formatGoogleFlightDate } from '../components/GoogleFlightDatePicker';
import { getBoardTypeLabel, getBoardTypeDescription, BOARD_TYPES } from '../utils/boardTypeUtils';
import { useAuth, getCurrencySymbol } from '../context/AuthContext';
import { useFavorites } from '../context/FavoritesContext';
import { FACILITY_ICON_MAP } from '../utils/facilityUtils';
import Tooltip from '../components/Tooltip';
import RefundPolicyTooltip from '../components/RefundPolicyTooltip';
import RoomGalleryModal from '../components/RoomGalleryModal';
import GoogleFilterDropdown from '../components/GoogleFilterDropdown';
import { MapContainer, Marker, Popup } from 'react-leaflet';
import OpenFreeMapLayer from '../components/OpenFreeMapLayer';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Fix for default marker icons in Leaflet
let DefaultIcon = L.icon({
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const decodeHTMLEntities = (text) => {
    if (!text || typeof text !== 'string') return text || '';
    let decoded = text
        .replace(/&amp;quot;/g, '&quot;')
        .replace(/&amp;amp;/g, '&amp;')
        .replace(/&amp;lt;/g, '&lt;')
        .replace(/&amp;gt;/g, '&gt;')
        .replace(/&amp;#39;/g, '&#39;')
        .replace(/&amp;#039;/g, '&#039;');

    decoded = decoded
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'")
        .replace(/&#39;/g, "'")
        .replace(/&#039;/g, "'")
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&nbsp;/g, ' ')
        .replace(/&ndash;/g, '–')
        .replace(/&mdash;/g, '—')
        .replace(/&rsquo;/g, "'")
        .replace(/&lsquo;/g, "'")
        .replace(/&rdquo;/g, '"')
        .replace(/&ldquo;/g, '"')
        .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(dec))
        .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));

    decoded = decoded.replace(/&amp;/g, '&');
    return decoded;
};

const ImageLightbox = ({ images, currentIndex, isOpen, onClose, setCurrentIndex, description }) => {
    const handlePrevious = useCallback((e) => {
        e?.stopPropagation();
        setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
    }, [images.length, setCurrentIndex]);

    const handleNext = useCallback((e) => {
        e?.stopPropagation();
        setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    }, [images.length, setCurrentIndex]);

    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e) => {
            if (e.key === 'ArrowLeft') handlePrevious();
            if (e.key === 'ArrowRight') handleNext();
            if (e.key === 'Escape') onClose();
        };

        window.addEventListener('keydown', handleKeyDown);
        document.body.style.overflow = 'hidden';
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'auto';
        };
    }, [isOpen, handlePrevious, handleNext, onClose]);

    const [isDescriptionVisible, setIsDescriptionVisible] = useState(true);

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[3000] flex flex-col bg-black/95 backdrop-blur-xl animate-in fade-in duration-300 select-none" onClick={onClose}>
            {/* Top Bar */}
            <div className="absolute top-0 left-0 right-0 p-4 md:p-6 flex justify-between items-center z-40 pointer-events-none">
                <div className="text-white/70 font-black tracking-widest text-xs uppercase bg-black/40 px-3 py-1.5 rounded-lg backdrop-blur-md pointer-events-auto">
                    {currentIndex + 1} / {images.length} Photos
                </div>
                <div className="flex items-center gap-3 pointer-events-auto">
                    {description && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsDescriptionVisible(!isDescriptionVisible);
                            }}
                            className={`size-10 md:size-12 rounded-full border border-white/10 flex items-center justify-center transition-all group ${isDescriptionVisible ? 'bg-primary text-white shadow-[0_0_20px_rgba(255,59,92,0.3)]' : 'bg-white/10 text-white/70 hover:bg-white/20'}`}
                            title={isDescriptionVisible ? "Hide Info" : "Show Info"}
                        >
                            <span className="material-symbols-outlined text-xl md:text-2xl">{isDescriptionVisible ? 'visibility_off' : 'info'}</span>
                        </button>
                    )}
                    <button
                        onClick={onClose}
                        className="size-10 md:size-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all group"
                    >
                        <span className="material-symbols-outlined text-2xl md:text-3xl group-hover:rotate-90 transition-transform">close</span>
                    </button>
                </div>
            </div>

            {/* Main Image Container */}
            <div className="relative flex-1 flex items-center justify-center px-12 md:px-24 pt-20 pb-4 overflow-hidden" onClick={(e) => e.stopPropagation()}>
                {/* Navigation Buttons */}
                <button
                    onClick={handlePrevious}
                    className="absolute left-2 md:left-6 size-10 md:size-14 rounded-full bg-white/5 hover:bg-white/10 text-white flex items-center justify-center transition-all group z-20 border border-white/5"
                >
                    <span className="material-symbols-outlined text-2xl md:text-4xl group-hover:-translate-x-1 transition-transform">chevron_left</span>
                </button>

                <button
                    onClick={handleNext}
                    className="absolute right-2 md:right-6 size-10 md:size-14 rounded-full bg-white/5 hover:bg-white/10 text-white flex items-center justify-center transition-all group z-20 border border-white/5"
                >
                    <span className="material-symbols-outlined text-2xl md:text-4xl group-hover:translate-x-1 transition-transform">chevron_right</span>
                </button>

                <img
                    src={images[currentIndex]}
                    className="max-w-full max-h-full object-contain shadow-[0_0_80px_rgba(0,0,0,0.5)] rounded-2xl animate-in zoom-in-95 duration-500"
                    alt={`Photo ${currentIndex + 1}`}
                />

                {/* Room Description - Floating Glass Card */}
                {description && isDescriptionVisible && (
                    <div className="absolute bottom-8 left-8 max-w-sm w-full z-40 hidden md:block">
                        <div className="bg-black/40 backdrop-blur-2xl p-6 rounded-[32px] border border-white/10 shadow-2xl animate-in slide-in-from-left-8 duration-700 relative group/desc">
                            <button
                                onClick={() => setIsDescriptionVisible(false)}
                                className="absolute top-4 right-4 size-6 rounded-lg bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-all flex items-center justify-center opacity-0 group-hover/desc:opacity-100"
                            >
                                <span className="material-symbols-outlined text-sm">close</span>
                            </button>
                            <div className="flex items-center gap-3 mb-3 text-primary">
                                <div className="size-8 rounded-xl bg-primary/10 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-sm">info</span>
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-[0.3em]">Room Specs</span>
                            </div>
                            <div className="max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                                <p className="text-white/80 text-xs font-medium leading-relaxed italic">{description}</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Thumbnail Strip */}
            <div className="h-28 md:h-32 shrink-0 flex justify-center items-center px-4 pb-4 z-30" onClick={(e) => e.stopPropagation()}>
                <div className="bg-black/60 backdrop-blur-2xl p-2 md:p-3 rounded-2xl md:rounded-3xl border border-white/10 flex gap-2 overflow-x-auto no-scrollbar max-w-full shadow-2xl">
                    {images.map((img, idx) => (
                        <button
                            key={idx}
                            onClick={() => setCurrentIndex(idx)}
                            className={`size-16 md:size-20 shrink-0 rounded-xl overflow-hidden transition-all duration-300 border-2 ${idx === currentIndex ? 'border-primary scale-110 shadow-[0_0_20px_rgba(255,59,92,0.4)]' : 'border-transparent opacity-40 hover:opacity-100'}`}
                        >
                            <img src={img} className="w-full h-full object-cover" alt={`Thumb ${idx + 1}`} />
                        </button>
                    ))}
                </div>
            </div>
        </div>,
        document.body
    );
};

const ShareModal = ({ isOpen, onClose, hotel }) => {
    if (!isOpen) return null;

    const shareUrl = window.location.href;
    const hotelName = decodeHTMLEntities(hotel.names?.tr || hotel.names?.en || hotel.name);
    const hotelLocation = hotel.address ? `${hotel.address.cityName}, ${hotel.address.countryName || ''}` : '';

    // Fix image path: handle both array of objects and simple string array
    const hotelImage = (hotel.images?.[0]?.url || hotel.images?.[0] || hotel.image || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=800');

    const shareOptions = [
        {
            name: 'Facebook',
            icon: (
                <svg className="size-7 fill-white" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
            ),
            color: 'bg-[#1877F2]',
            shadow: 'shadow-[#1877F2]/30'
        },
        {
            name: 'X',
            icon: (
                <svg className="size-6 fill-white" viewBox="0 0 24 24">
                    <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932 6.064-6.932zm-1.292 19.49h2.039L6.486 3.24H4.298l13.311 17.403z" />
                </svg>
            ),
            color: 'bg-black',
            shadow: 'shadow-black/30'
        },
        {
            name: 'Whatsapp',
            icon: (
                <svg className="size-7 fill-white" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.414 0 .018 5.396.015 12.03c0 2.12.554 4.189 1.605 6.006L0 24l6.117-1.605a11.77 11.77 0 005.925 1.585h.005c6.637 0 12.032-5.396 12.035-12.032a11.76 11.76 0 00-3.517-8.487" />
                </svg>
            ),
            color: 'bg-[#25D366]',
            shadow: 'shadow-[#25D366]/30'
        },
        {
            name: 'E-Posta',
            icon: <span className="material-symbols-outlined text-[32px] font-light">mail</span>,
            color: 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300',
            shadow: 'shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-700'
        },
        {
            name: 'Kopyala',
            icon: <span className="material-symbols-outlined text-[32px] font-light">content_copy</span>,
            color: 'bg-primary/5 text-primary',
            shadow: 'shadow-primary/10 border border-primary/10'
        }
    ];

    const handleShare = (option) => {
        if (option.name === 'Kopyala') {
            navigator.clipboard.writeText(shareUrl);
            // Could add a mini toast here if needed
        } else if (option.name === 'E-Posta') {
            window.location.href = `mailto:?subject=Check out this hotel: ${hotelName}&body=${shareUrl}`;
        } else if (option.name === 'Whatsapp') {
            window.open(`https://wa.me/?text=${encodeURIComponent(hotelName + ' ' + shareUrl)}`, '_blank');
        } else if (option.name === 'Facebook') {
            window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank');
        } else if (option.name === 'X') {
            window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(hotelName)}&url=${encodeURIComponent(shareUrl)}`, '_blank');
        }
    };

    return createPortal(
        <div className="fixed inset-0 z-[5000] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-500" onClick={onClose}></div>
            <div className="relative bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl w-full max-w-lg rounded-[48px] shadow-[0_32px_128px_rgba(0,0,0,0.4)] border border-white/40 dark:border-white/10 overflow-hidden animate-in zoom-in-95 duration-500">
                {/* Decorative background element */}
                <div className="absolute -top-24 -right-24 size-64 bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>
                <div className="absolute -bottom-24 -left-24 size-64 bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>

                <div className="p-10 relative z-10">
                    <div className="flex items-center justify-between mb-10">
                        <div className="space-y-1">
                            <h3 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">Paylaş ve İlham Ver</h3>
                            <p className="text-sm text-slate-500 font-medium tracking-wide">Bu harika tesisi sevdiklerinle paylaş</p>
                        </div>
                        <button onClick={onClose} className="size-12 rounded-2xl bg-white dark:bg-slate-800 text-slate-400 border border-slate-100 dark:border-slate-700 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-700 transition-all hover:rotate-90 shadow-sm active:scale-90">
                            <span className="material-symbols-outlined text-2xl">close</span>
                        </button>
                    </div>

                    <div className="bg-white/40 dark:bg-slate-800/40 backdrop-blur-md border border-white/60 dark:border-white/10 rounded-[32px] p-6 flex gap-6 mb-12 shadow-xl shadow-slate-200/20 group">
                        <div className="size-32 rounded-[24px] overflow-hidden shrink-0 shadow-2xl relative">
                            <img src={hotelImage} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
                        </div>
                        <div className="flex flex-col justify-center min-w-0 flex-1">
                            <div className="flex items-center gap-1 mb-2 text-amber-400">
                                {[...Array(hotel.hotelStar?.star || 5)].map((_, i) => (
                                    <span key={i} className="material-symbols-outlined text-[10px] fill-1">star</span>
                                ))}
                            </div>
                            <h4 className="text-xl font-black text-slate-900 dark:text-white truncate mb-1 leading-tight">{hotelName}</h4>
                            <div className="flex items-center gap-1.5 text-slate-500 font-bold text-xs truncate">
                                <span className="material-symbols-outlined text-sm text-primary">location_on</span>
                                {hotelLocation}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-5 gap-6">
                        {shareOptions.map((opt) => (
                            <button key={opt.name} onClick={() => handleShare(opt)} className="flex flex-col items-center gap-4 group">
                                <div className={`size-16 rounded-3xl ${opt.color} flex items-center justify-center shadow-2xl ${opt.shadow} group-hover:scale-110 group-active:scale-95 transition-all duration-500 relative overflow-hidden`}>
                                    <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    <div className="relative z-10 flex items-center justify-center">
                                        {opt.icon}
                                    </div>
                                </div>
                                <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 text-center leading-tight uppercase tracking-[0.15em] group-hover:text-primary transition-colors duration-300">{opt.name}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};

const BookingConfirmationModal = ({ isOpen, onClose, hotelName }) => {
    if (!isOpen) return null;
    return createPortal(
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose}></div>
            <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-[40px] p-10 shadow-2xl animate-in fade-in zoom-in duration-300 text-center border border-white/20 overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary via-purple-500 to-primary"></div>
                <div className="size-24 bg-emerald-50 dark:bg-emerald-900/20 rounded-full flex items-center justify-center mx-auto mb-6 text-emerald-500 ring-8 ring-emerald-50/50 dark:ring-emerald-900/10">
                    <span className="material-symbols-outlined text-5xl animate-bounce-slow">check_circle</span>
                </div>
                <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-3 tracking-tight">Booking Confirmed!</h2>
                <p className="text-slate-500 dark:text-slate-400 font-medium mb-8 leading-relaxed">
                    Great choice! Your reservation at <br /> <span className="text-slate-900 dark:text-white font-black">{hotelName}</span> <br /> has been successfully secured.
                </p>

                <div className="flex flex-col gap-3">
                    <button
                        onClick={onClose}
                        className="w-full py-4 bg-primary text-white rounded-2xl font-black uppercase text-xs tracking-[0.2em] hover:bg-primary/90 transition-all shadow-xl shadow-primary/30 hover:scale-[1.02] active:scale-[0.98]"
                    >
                        Download Voucher
                    </button>
                    <button
                        onClick={onClose}
                        className="w-full py-4 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl font-black uppercase text-xs tracking-[0.2em] hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};


const MapModal = ({ isOpen, onClose, hotel }) => {
    const [isMounted, setIsMounted] = React.useState(false);
    const [isClosing, setIsClosing] = React.useState(false);

    React.useEffect(() => {
        if (isOpen) {
            requestAnimationFrame(() => setIsMounted(true));
            setIsClosing(false);
        } else {
            setIsMounted(false);
            setIsClosing(false);
        }
    }, [isOpen]);

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(() => {
            setIsClosing(false);
            setIsMounted(false);
            onClose?.();
        }, 300);
    };

    if (!isOpen && !isClosing) return null;
    if (!hotel) return null;

    const lat = hotel.coordinates?.lat || hotel.lat;
    const lng = hotel.coordinates?.lon || hotel.lng || hotel.lon;

    if (!lat || !lng) return null;

    // Custom Marker Icon
    const customIcon = L.divIcon({
        className: 'custom-hotel-marker bg-transparent border-none',
        html: `
            <div class="absolute bottom-0 left-1/2 -translate-x-1/2 flex flex-col items-center justify-end pb-[2px] w-max group pointer-events-auto">
                <div class="absolute bottom-1 w-4 h-4 rounded-full bg-[#1a73e8] animate-ping opacity-60"></div>
                <div class="px-3 py-1.5 rounded-full font-bold text-[12px] bg-[#1a73e8] text-white shadow-xl flex items-center justify-center gap-1.5 whitespace-nowrap z-10 scale-105 -translate-y-1 border-2 border-white">
                    <span class="material-symbols-outlined text-[14px]">apartment</span>
                    <span class="tracking-tight">${decodeHTMLEntities(hotel.names?.tr || hotel.names?.en || hotel.name)}</span>
                </div>
                <div class="flex flex-col items-center justify-end z-0 origin-bottom scale-y-125 -translate-y-0.5">
                    <div class="w-[2px] h-3 bg-[#1a73e8] shadow-sm"></div>
                    <div class="w-2 h-2 rounded-full bg-[#1a73e8] shadow-sm"></div>
                </div>
            </div>
        `,
        iconSize: [0, 0],
        iconAnchor: [0, 0],
    });

    return createPortal(
        <div className={`fixed inset-0 z-[10000] flex items-center justify-center p-4 sm:p-6 md:p-10 transition-opacity duration-300 ${
            isMounted && !isClosing ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}>
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity duration-300" onClick={handleClose}></div>

            <div
                className="relative w-full max-w-5xl bg-white dark:bg-slate-900 rounded-[32px] overflow-hidden shadow-2xl flex flex-col h-[70vh] sm:h-[80vh] border border-white/20 transition-all duration-300 ease-out"
                style={{
                    transform: isMounted && !isClosing ? 'translateY(0)' : 'translateY(80px)',
                    opacity: isMounted && !isClosing ? 1 : 0
                }}
            >
                {/* Header */}
                <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl">
                    <div className="flex items-center gap-4">
                        <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-sm border border-primary/10">
                            <span className="material-symbols-outlined text-2xl fill-1">map</span>
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight leading-none mb-1.5">
                                Explore Location
                            </h3>
                            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest flex items-center gap-2">
                                <span className="size-1.5 rounded-full bg-primary animate-pulse"></span>
                                {decodeHTMLEntities(hotel.names?.tr || hotel.names?.en || hotel.name)}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleClose}
                        className="size-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:bg-red-500 hover:text-white transition-all duration-500 shadow-sm border border-transparent hover:border-red-400 group"
                    >
                        <span className="material-symbols-outlined text-2xl group-hover:rotate-90 transition-transform duration-500">close</span>
                    </button>
                </div>

                {/* Map Body */}
                <div className="flex-1 relative z-0">
                    <MapContainer
                        center={[lat, lng]}
                        zoom={15}
                        scrollWheelZoom={true}
                        className="w-full h-full"
                    >
                        <OpenFreeMapLayer style="google" />
                        <Marker position={[lat, lng]} icon={customIcon}>
                            <Popup className="custom-hotel-popup">
                                <div className="p-2 min-w-[200px]">
                                    <div className="relative h-24 mb-3 rounded-lg overflow-hidden">
                                        <img
                                            src={hotel.images?.[0]?.url || hotel.image}
                                            className="w-full h-full object-cover"
                                            alt={hotel.name}
                                        />
                                        <div className="absolute top-2 right-2 bg-primary text-white text-[8px] font-black px-2 py-1 rounded-md shadow-lg">
                                            {hotel.rating || '8.5'} / 10
                                        </div>
                                    </div>
                                    <h4 className="font-black text-sm uppercase tracking-tight text-slate-900 mb-1">
                                        {decodeHTMLEntities(hotel.names?.tr || hotel.names?.en || hotel.name)}
                                    </h4>
                                    <p className="text-[10px] text-slate-500 font-bold leading-tight">
                                        {decodeHTMLEntities(hotel.address ? `${hotel.address.street}, ${hotel.address.cityName}` : hotel.location)}
                                    </p>
                                </div>
                            </Popup>
                        </Marker>
                    </MapContainer>
                </div>

                {/* Footer / Instructions */}
                <div className="px-8 py-4 bg-slate-50 dark:bg-black/20 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-slate-400 text-lg">mouse</span>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Scroll to zoom</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-slate-400 text-lg">info</span>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Click marker for details</span>
                        </div>
                    </div>
                    <a
                        href={`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 bg-white dark:bg-slate-800 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-primary/50 transition-all group"
                    >
                        <span className="text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest group-hover:text-primary transition-colors">
                            Google Maps
                        </span>
                        <span className="material-symbols-outlined text-primary text-lg">directions</span>
                    </a>
                </div>
            </div>
        </div>,
        document.body
    );
};

const LOCAL_TRANSLATIONS = {
    en: {
        roomsAndRates: "Rooms & Rates",
        overview: "Overview",
        amenities: "Amenities",
        transportation: "Transportation",
        policies: "Policies",
        reviews: "Reviews",
        boardType: "Board Type:",
        allBoards: "All Boards",
        policyLabel: "Policy:",
        allPolicies: "All Policies",
        freeCancellation: "Free Cancellation",
        nonRefundable: "Non-Refundable",
        roomTypesFound: "Room Types Found",
        instantConfirmationAvailable: "Instant Confirmation Available",
        reservationSummary: "Reservation Summary",
        pleaseSelectARoom: "Please select a room",
        guests: "Guests",
        nationality: "Nationality",
        dates: "Dates",
        stay: "Stay",
        nights: "Nights",
        night: "Night",
        totalStayPrice: "Total Stay Price (Net)",
        checkingBestRates: "Checking Best Rates...",
        instantReservation: "Instant Reservation",
        b2bAgencyRatesApplied: "B2B AGENCY RATES APPLIED",
        adults: "Adults",
        adult: "Adult",
        children: "Children",
        child: "Child",
        room: "Room",
        remove: "Remove",
        childAge: "Child Age",
        addAnotherRoom: "Add Another Room",
        backToSearch: "Back to Search",
        tryAgain: "Try Again",
        showOnMap: "Show on Map",
        reviewsLabel: "reviews",
        highlyPopular: "Highly Popular",
        photos: "Photos",
        showAllPhotos: "Show All Photos",
        checkInOut: "Check-in / Out",
        guestsAndRooms: "Guests & Rooms",
        yr: "yr",
        availableRates: "Available Rates",
        pricesIncludeTaxesAndFees: "Prices include taxes & fees",
        selected: "Selected",
        viewPolicies: "View Policies",
        cancellationTimeline: "Cancellation Timeline",
        penalty: "Penalty",
        from: "From",
        standardPoliciesApply: "Standard policies apply.",
        totalStay: "Total Stay",
        selectRate: "Select Rate",
        showLessRates: "Show Less Rates",
        show: "Show",
        moreRates: "More Rates",
        fetchingBestRates: "Fetching best rates...",
        maxRoomsSelectedError: "You searched for {{count}} room(s). You can select a maximum of {{count}} room(s).",
        search: "Search",
        cancel: "Cancel",
        done: "Done",
        in: "In",
        out: "Out",
        dailyRates: "Daily Rates",
        cancellationPolicy: "Cancellation Policy",
        standardCancellation: "Standard cancellation applies",
        flexible: "Flexible",
        cancellationPenalty: "Cancellation Penalty",
        freeCancel: "Free Cancel",
        securePayment: "SECURE PAYMENT",
        protectedBooking: "TOG Protected Booking",
        checkIn: "Check-in",
        checkOut: "Check-out",
        nightsStay: "Nights Stay",
        nightStay: "Night Stay"
    },
    tr: {
        roomsAndRates: "Odalar & Fiyatlar",
        overview: "Genel Bakış",
        amenities: "Olanaklar",
        transportation: "Ulaşım",
        policies: "Kurallar",
        reviews: "Değerlendirmeler",
        boardType: "Pansiyon Tipi:",
        allBoards: "Tüm Pansiyonlar",
        policyLabel: "İptal Kuralı:",
        allPolicies: "Tüm Kurallar",
        freeCancellation: "Ücretsiz İptal",
        nonRefundable: "İade Edilmez",
        roomTypesFound: "Oda Tipi Bulundu",
        instantConfirmationAvailable: "Anında Onay Mevcut",
        reservationSummary: "Rezervasyon Özeti",
        pleaseSelectARoom: "Lütfen bir oda seçin",
        guests: "Konuklar",
        nationality: "Uyruk",
        dates: "Tarihler",
        stay: "Konaklama",
        nights: "Gece",
        night: "Gece",
        totalStayPrice: "Toplam Konaklama Tutarı (Net)",
        checkingBestRates: "En İyi Fiyatlar Sorgulanıyor...",
        instantReservation: "Anında Rezervasyon",
        b2bAgencyRatesApplied: "B2B ACENTE FİYATLARI UYGULANMIŞTIR",
        adults: "Yetişkin",
        adult: "Yetişkin",
        children: "Çocuk",
        child: "Çocuk",
        room: "Oda",
        remove: "Kaldır",
        childAge: "Çocuk Yaşı",
        addAnotherRoom: "Başka Oda Ekle",
        backToSearch: "Aramaya Dön",
        tryAgain: "Tekrar Dene",
        showOnMap: "Haritada Göster",
        reviewsLabel: "değerlendirme",
        highlyPopular: "Çok Popüler",
        photos: "Fotoğraf",
        showAllPhotos: "Tüm Fotoğrafları Göster",
        checkInOut: "Giriş / Çıkış",
        guestsAndRooms: "Konuklar & Odalar",
        yr: "yaş",
        availableRates: "Mevcut Fiyatlar",
        pricesIncludeTaxesAndFees: "Fiyatlara vergi ve harçlar dahildir",
        selected: "Seçildi",
        viewPolicies: "Kuralları Göster",
        cancellationTimeline: "İptal Takvimi",
        penalty: "Ceza",
        from: "İtibaren",
        standardPoliciesApply: "Standart kurallar geçerlidir.",
        totalStay: "Toplam Konaklama",
        selectRate: "Fiyatı Seç",
        showLessRates: "Daha Az Fiyat Göster",
        show: "Göster",
        moreRates: "Daha Fazla Fiyat",
        fetchingBestRates: "En iyi fiyatlar sorgulanıyor...",
        maxRoomsSelectedError: "Aramanızda {{count}} oda belirttiniz. En fazla {{count}} oda seçebilirsiniz.",
        search: "Ara",
        cancel: "İptal",
        done: "Bitti",
        in: "Giriş",
        out: "Çıkış",
        dailyRates: "Günlük Fiyatlar",
        cancellationPolicy: "İptal Kuralı",
        standardCancellation: "Standart iptal kuralı geçerlidir",
        flexible: "Esnek",
        cancellationPenalty: "İptal Cezası",
        freeCancel: "Ücretsiz İptal",
        securePayment: "GÜVENLİ İŞLEM",
        protectedBooking: "TOG Garantili B2B Rezervasyon",
        checkIn: "Giriş",
        checkOut: "Çıkış",
        nightsStay: "Gece Konaklama",
        nightStay: "Gece Konaklama"
    },
    ar: {
        roomsAndRates: "الغرف والأسعار",
        overview: "نظرة عامة",
        amenities: "الخدمات والمرافق",
        transportation: "وسائل النقل",
        policies: "السياسات",
        reviews: "التقييمات",
        boardType: "نوع الإقامة:",
        allBoards: "جميع الخيارات",
        policyLabel: "السياسة:",
        allPolicies: "جميع السياسات",
        freeCancellation: "إلغاء مجاني",
        nonRefundable: "غير مسترد",
        roomTypesFound: "أنواع الغرف التي تم العثور عليها",
        instantConfirmationAvailable: "تأكيد فوري متاح",
        reservationSummary: "ملخص الحجز",
        pleaseSelectARoom: "يرجى اختيار غرفة",
        guests: "الضيوف",
        nationality: "الجنسية",
        dates: "التواريخ",
        stay: "مدة الإقامة",
        nights: "ليالي",
        night: "ليلة",
        totalStayPrice: "إجمالي سعر الإقامة (صافي)",
        checkingBestRates: "جاري التحقق من أفضل الأسعار...",
        instantReservation: "حجز فوري",
        b2bAgencyRatesApplied: "تم تطبيق أسعار وكالات B2B",
        adults: "بالغين",
        adult: "بالغ",
        children: "أطفال",
        child: "طفل",
        room: "غرفة",
        remove: "إزالة",
        childAge: "عمر الطفل",
        addAnotherRoom: "إضافة غرفة أخرى",
        backToSearch: "العودة للبحث",
        tryAgain: "إعادة المحاولة",
        showOnMap: "عرض على الخريطة",
        reviewsLabel: "تقييمات",
        highlyPopular: "شعبية كبيرة",
        photos: "صور",
        showAllPhotos: "عرض جميع الصور",
        checkInOut: "الدخول / المغادرة",
        guestsAndRooms: "الضيوف والغرف",
        yr: "سنة",
        availableRates: "الأسعار المتاحة",
        pricesIncludeTaxesAndFees: "الأسعار تشمل الضرائب والرسوم",
        selected: "محدد",
        viewPolicies: "عرض السياسات",
        cancellationTimeline: "الجدول الزمني للإلغاء",
        penalty: "غرامة",
        from: "من",
        standardPoliciesApply: "تطبق السياسات القياسية.",
        totalStay: "إجمالي الإقامة",
        selectRate: "اختر السعر",
        showLessRates: "عرض أسعار أقل",
        show: "عرض",
        moreRates: "المزيد من الأسعار",
        fetchingBestRates: "جاري جلب أفضل الأسعار..."
    },
    es: {
        roomsAndRates: "Habitaciones y Tarifas",
        overview: "Descripción General",
        amenities: "Servicios",
        transportation: "Transporte",
        policies: "Políticas",
        reviews: "Reseñas",
        boardType: "Tipo de Régimen:",
        allBoards: "Todos los Regímenes",
        policyLabel: "Política:",
        allPolicies: "Todas las Políticas",
        freeCancellation: "Cancelación Gratuita",
        nonRefundable: "No Reembolsable",
        roomTypesFound: "Tipos de Habitación Encontrados",
        instantConfirmationAvailable: "Confirmación Instantánea Disponible",
        reservationSummary: "Resumen de la Reserva",
        pleaseSelectARoom: "Por favor seleccione una habitación",
        guests: "Huéspedes",
        nationality: "Nacionalidad",
        dates: "Fechas",
        stay: "Estancia",
        nights: "Noches",
        night: "Noche",
        totalStayPrice: "Precio Total de la Estancia (Neto)",
        checkingBestRates: "Buscando las Mejores Tarifas...",
        instantReservation: "Reserva Instantánea",
        b2bAgencyRatesApplied: "TARIFAS DE AGENCIA B2B APLICADAS",
        adults: "Adultos",
        adult: "Adulto",
        children: "Niños",
        child: "Niño",
        room: "Habitación",
        remove: "Eliminar",
        childAge: "Edad del Niño",
        addAnotherRoom: "Añadir Otra Habitación",
        backToSearch: "Volver a la Búsqueda",
        tryAgain: "Intentar de Nuevo",
        showOnMap: "Mostrar en el Mapa",
        reviewsLabel: "reseñas",
        highlyPopular: "Muy Popular",
        photos: "Fotos",
        showAllPhotos: "Mostrar Todas las Fotos",
        checkInOut: "Entrada / Salida",
        guestsAndRooms: "Huéspedes y Habitaciones",
        yr: "años",
        availableRates: "Tarifas Disponibles",
        pricesIncludeTaxesAndFees: "Los precios incluyen tasas y cargos",
        selected: "Seleccionado",
        viewPolicies: "Ver Políticas",
        cancellationTimeline: "Calendario de Cancelación",
        penalty: "Penalización",
        from: "Desde",
        standardPoliciesApply: "Se aplican las políticas estándar.",
        totalStay: "Estancia Total",
        selectRate: "Seleccionar Tarifa",
        showLessRates: "Mostrar Menos Tarifas",
        show: "Mostrar",
        moreRates: "Más Tarifas",
        fetchingBestRates: "Buscando las mejores tarifas..."
    },
    ru: {
        roomsAndRates: "Номера и Цены",
        overview: "Обзор",
        amenities: "Удобства",
        transportation: "Транспорт",
        policies: "Правила",
        reviews: "Отзывы",
        boardType: "Тип питания:",
        allBoards: "Все варианты питания",
        policyLabel: "Правило отмены:",
        allPolicies: "Все правила",
        freeCancellation: "Бесплатная отмена",
        nonRefundable: "Невозвратный",
        roomTypesFound: "Типов номеров найдено",
        instantConfirmationAvailable: "Доступно моментальное подтверждение",
        reservationSummary: "Детали бронирования",
        pleaseSelectARoom: "Пожалуйста, выберите номер",
        guests: "Гости",
        nationality: "Гражданство",
        dates: "Даты",
        stay: "Пребывание",
        nights: "Ночей",
        night: "Ночь",
        totalStayPrice: "Итого к оплате (Нетто)",
        checkingBestRates: "Поиск лучших тарифов...",
        instantReservation: "Моментальное бронирование",
        b2bAgencyRatesApplied: "ПРИМЕНЕНЫ ТАРИФЫ АГЕНТСТВА B2B",
        adults: "Взрослых",
        adult: "Взрослый",
        children: "Детей",
        child: "Ребенок",
        room: "Номер",
        remove: "Удалить",
        childAge: "Возраст ребенка",
        addAnotherRoom: "Добавить еще номер",
        backToSearch: "Назад к поиску",
        tryAgain: "Попробовать снова",
        showOnMap: "Показать на карте",
        reviewsLabel: "отзывов",
        highlyPopular: "Очень популярно",
        photos: "Фото",
        showAllPhotos: "Показать все фото",
        checkInOut: "Заезд / Выезд",
        guestsAndRooms: "Гости и Номера",
        yr: "лет",
        availableRates: "Доступные тарифы",
        pricesIncludeTaxesAndFees: "Цены включают налоги и сборы",
        selected: "Выбрано",
        viewPolicies: "Посмотреть правила",
        cancellationTimeline: "Сроки отмены",
        penalty: "Штраф",
        from: "С",
        standardPoliciesApply: "Применяются стандартные правила.",
        totalStay: "Всего пребывание",
        selectRate: "Выбрать тариф",
        showLessRates: "Показать меньше тарифов",
        show: "Показать",
        moreRates: "Еще тарифы",
        fetchingBestRates: "Получение лучших цен..."
    },
    zh: {
        roomsAndRates: "客房与价格",
        overview: "概述",
        amenities: "便利设施",
        transportation: "交通出行",
        policies: "政策条款",
        reviews: "客户评价",
        boardType: "膳食类型:",
        allBoards: "所有膳食",
        policyLabel: "取消政策:",
        allPolicies: "所有政策",
        freeCancellation: "免费取消",
        nonRefundable: "不可退款",
        roomTypesFound: "找到的客房类型",
        instantConfirmationAvailable: "可立即确认",
        reservationSummary: "预订摘要",
        pleaseSelectARoom: "请选择客房",
        guests: "宾客人数",
        nationality: "国籍",
        dates: "日期",
        stay: "入住时长",
        nights: "晚",
        night: "晚",
        totalStayPrice: "总房价 (净价)",
        checkingBestRates: "正在查询最佳价格...",
        instantReservation: "立即预订",
        b2bAgencyRatesApplied: "已应用 B2B 代理商特惠价格",
        adults: "成人",
        adult: "成人",
        children: "儿童",
        child: "儿童",
        room: "客房",
        remove: "移除",
        childAge: "儿童年龄",
        addAnotherRoom: "添加另一间客房",
        backToSearch: "返回搜索",
        tryAgain: "重试",
        showOnMap: "在地图上显示",
        reviewsLabel: "条评价",
        highlyPopular: "极具人气",
        photos: "张照片",
        showAllPhotos: "显示所有照片",
        checkInOut: "入住 / 退房",
        guestsAndRooms: "宾客与客房",
        yr: "岁",
        availableRates: "可用价格",
        pricesIncludeTaxesAndFees: "价格已含税费",
        selected: "已选",
        viewPolicies: "查看政策",
        cancellationTimeline: "取消期限",
        penalty: "罚金",
        from: "自",
        standardPoliciesApply: "适用标准政策。",
        totalStay: "总入住",
        selectRate: "选择价格",
        showLessRates: "显示较少价格",
        show: "显示",
        moreRates: "更多价格",
        fetchingBestRates: "正在获取最佳价格..."
    },
    ja: {
        roomsAndRates: "客室と料金",
        overview: "概要",
        amenities: "アメニティ",
        transportation: "交通機関",
        policies: "ポリシー",
        reviews: "クチコミ",
        boardType: "食事タイプ:",
        allBoards: "すべての食事",
        policyLabel: "ポリシー:",
        allPolicies: "すべてのポリシー",
        freeCancellation: "キャンセル無料",
        nonRefundable: "返金不可",
        roomTypesFound: "件の部屋タイプが見つかりました",
        instantConfirmationAvailable: "即時確約可能",
        reservationSummary: "予約内容",
        pleaseSelectARoom: "部屋を選択してください",
        guests: "ゲスト数",
        nationality: "国籍",
        dates: "日程",
        stay: "滞在",
        nights: "泊",
        night: "泊",
        totalStayPrice: "合計滞在料金 (ネット)",
        checkingBestRates: "最安料金を確認中...",
        instantReservation: "即時予約",
        b2bAgencyRatesApplied: "B2B代理店向け料金適用済み",
        adults: "大人",
        adult: "大人",
        children: "子供",
        child: "子供",
        room: "部屋",
        remove: "削除",
        childAge: "子供の年齢",
        addAnotherRoom: "別の部屋を追加",
        backToSearch: "検索に戻る",
        tryAgain: "もう一度試す",
        showOnMap: "地図で見る",
        reviewsLabel: "件のクチコミ",
        highlyPopular: "大人気",
        photos: "枚の写真",
        showAllPhotos: "すべての写真を表示",
        checkInOut: "チェックイン・アウト",
        guestsAndRooms: "ゲストと部屋",
        yr: "歳",
        availableRates: "利用可能な料金",
        pricesIncludeTaxesAndFees: "料金には税金と手数料が含まれています",
        selected: "選択済み",
        viewPolicies: "ポリシーを表示",
        cancellationTimeline: "キャンセル期間",
        penalty: "ペナルティ",
        from: "から",
        standardPoliciesApply: "標準ポリシーが適用されます。",
        totalStay: "合計滞在",
        selectRate: "料金を選択",
        showLessRates: "表示数を減らす",
        show: "表示",
        moreRates: "件の追加料金",
        fetchingBestRates: "最安値を検索中..."
    },
    fa: {
        roomsAndRates: "اتاق‌ها و نرخ‌ها",
        overview: "بررسی اجمالی",
        amenities: "امکانات رفاهی",
        transportation: "حمل و نقل",
        policies: "قوانین و سیاست‌ها",
        reviews: "نظرات",
        boardType: "نوع خدمات غذا:",
        allBoards: "همه وعده‌های غذایی",
        policyLabel: "قوانین:",
        allPolicies: "همه قوانین",
        freeCancellation: "کنسلی رایگان",
        nonRefundable: "غیرقابل استرداد",
        roomTypesFound: "نوع اتاق پیدا شد",
        instantConfirmationAvailable: "تایید فوری در دسترس است",
        reservationSummary: "خلاصه رزرو",
        pleaseSelectARoom: "لطفاً یک اتاق انتخاب کنید",
        guests: "مهمانان",
        nationality: "ملیت",
        dates: "تاریخ‌ها",
        stay: "اقامت",
        nights: "شب",
        night: "شب",
        totalStayPrice: "کل هزینه اقامت (خالص)",
        checkingBestRates: "در حال بررسی بهترین نرخ‌ها...",
        instantReservation: "رزرو فوری",
        b2bAgencyRatesApplied: "نرخ‌های آژانس B2B اعمال شد",
        adults: "بزرگسال",
        adult: "بزرگسال",
        children: "کودک",
        child: "کودک",
        room: "اتاق",
        remove: "حذف",
        childAge: "سن کودک",
        addAnotherRoom: "افزودن اتاق دیگر",
        backToSearch: "بازگشت به جستجو",
        tryAgain: "تلاش مجدد",
        showOnMap: "نمایش روی نقشه",
        reviewsLabel: "نظر",
        highlyPopular: "بسیار محبوب",
        photos: "عکس",
        showAllPhotos: "نمایش همه عکس‌ها",
        checkInOut: "ورود / خروج",
        guestsAndRooms: "مهمانان و اتاق‌ها",
        yr: "سال",
        availableRates: "نرخ‌های موجود",
        pricesIncludeTaxesAndFees: "قیمت‌ها شامل مالیات و عوارض است",
        selected: "انتخاب شده",
        viewPolicies: "مشاهده قوانین",
        cancellationTimeline: "جدول زمانی کنسلی",
        penalty: "جریمه",
        from: "از",
        standardPoliciesApply: "قوانین استاندارد اعمال می‌شود.",
        totalStay: "کل اقامت",
        selectRate: "انتخاب نرخ",
        showLessRates: "نمایش نرخ‌های کمتر",
        show: "نمایش",
        moreRates: "نرخ‌های بیشتر",
        fetchingBestRates: "در حال دریافت بهترین نرخ‌ها..."
    },
    fr: {
        roomsAndRates: "Chambres & Tarifs",
        overview: "Aperçu",
        amenities: "Équipements",
        transportation: "Transport",
        policies: "Politiques",
        reviews: "Avis",
        boardType: "Type de Pension:",
        allBoards: "Toutes les Pensions",
        policyLabel: "Politique:",
        allPolicies: "Toutes les Politiques",
        freeCancellation: "Annulation Gratuite",
        nonRefundable: "Non Remboursable",
        roomTypesFound: "Types de Chambres Trouvés",
        instantConfirmationAvailable: "Confirmation Instantanée Disponible",
        reservationSummary: "Résumé de la Réservation",
        pleaseSelectARoom: "Veuillez choisir une chambre",
        guests: "Voyageurs",
        nationality: "Nationalité",
        dates: "Dates",
        stay: "Séjour",
        nights: "Nuits",
        night: "Nuit",
        totalStayPrice: "Prix Total du Séjour (Net)",
        checkingBestRates: "Recherche des Meilleurs Tarifs...",
        instantReservation: "Réservation Instantanée",
        b2bAgencyRatesApplied: "TARIFS AGENCE B2B APPLIQUÉS",
        adults: "Adultes",
        adult: "Adulte",
        children: "Enfants",
        child: "Enfant",
        room: "Chambre",
        remove: "Supprimer",
        childAge: "Âge de l'Enfant",
        addAnotherRoom: "Ajouter une Autre Chambre",
        backToSearch: "Retour à la Recherche",
        tryAgain: "Réessayer",
        showOnMap: "Afficher sur la Carte",
        reviewsLabel: "avis",
        highlyPopular: "Très Populaire",
        photos: "Photos",
        showAllPhotos: "Afficher Toutes les Photos",
        checkInOut: "Arrivée / Départ",
        guestsAndRooms: "Voyageurs & Chambres",
        yr: "ans",
        availableRates: "Tarifs Disponibles",
        pricesIncludeTaxesAndFees: "Les tarifs incluent taxes et frais",
        selected: "Sélectionné",
        viewPolicies: "Voir les Politiques",
        cancellationTimeline: "Calendrier d'Annulation",
        penalty: "Pénalité",
        from: "À partir de",
        standardPoliciesApply: "Les conditions standard s'appliquent.",
        totalStay: "Séjour Total",
        selectRate: "Choisir le Tarif",
        showLessRates: "Afficher Moins de Tarifs",
        show: "Afficher",
        moreRates: "Plus de Tarifs",
        fetchingBestRates: "Recherche des meilleurs tarifs..."
    },
    it: {
        roomsAndRates: "Camere & Tariffe",
        overview: "Panoramica",
        amenities: "Servizi",
        transportation: "Trasporti",
        policies: "Politiche",
        reviews: "Recensioni",
        boardType: "Trattamento:",
        allBoards: "Tutti i Trattamenti",
        policyLabel: "Politica:",
        allPolitiche: "Tutte le Politiche",
        freeCancellation: "Cancellazione Gratuita",
        nonRefundable: "Non Rimborsabile",
        roomTypesFound: "Tipi di Camere Trovate",
        instantConfirmationAvailable: "Conferma Istantanea Disponibile",
        reservationSummary: "Riepilogo Prenotazione",
        pleaseSelectARoom: "Seleziona una camera",
        guests: "Ospiti",
        nationality: "Nazionalità",
        dates: "Date",
        stay: "Soggiorno",
        nights: "Notti",
        night: "Notte",
        totalStayPrice: "Prezzo Totale Soggiorno (Netto)",
        checkingBestRates: "Verifica delle Migliori Tariffe...",
        instantReservation: "Prenota Ora",
        b2bAgencyRatesApplied: "APPLICATE TARIFFE AGENZIA B2B",
        adults: "Adulti",
        adult: "Adulto",
        children: "Bambini",
        child: "Bambino",
        room: "Camera",
        remove: "Rimuovi",
        childAge: "Età Bambino",
        addAnotherRoom: "Aggiungi un'Altra Camera",
        backToSearch: "Torna alla Ricerca",
        tryAgain: "Riprova",
        showOnMap: "Mostra sulla Mappa",
        reviewsLabel: "recensioni",
        highlyPopular: "Molto Popolare",
        photos: "Foto",
        showAllPhotos: "Mostra Tutte le Foto",
        checkInOut: "Check-in / Out",
        guestsAndRooms: "Ospiti & Camere",
        yr: "anni",
        availableRates: "Tariffe Disponibili",
        pricesIncludeTaxesAndFees: "I prezzi includono tasse e commissioni",
        selected: "Selezionato",
        viewPolicies: "Vedi Politiche",
        cancellationTimeline: "Termini di Cancellazione",
        penalty: "Penale",
        from: "Da",
        standardPoliciesApply: "Si applicano le condizioni standard.",
        totalStay: "Soggiorno Totale",
        selectRate: "Seleziona Tariffa",
        showLessRates: "Mostra Meno Tariffe",
        show: "Mostra",
        moreRates: "Altre Tariffe",
        fetchingBestRates: "Ricerca delle migliori tariffe..."
    },
    el: {
        roomsAndRates: "Δωμάτια & Τιμές",
        overview: "Σύνοψη",
        amenities: "Παροχές",
        transportation: "Μεταφορές",
        policies: "Πολιτικές",
        reviews: "Κριτικές",
        boardType: "Τύπος Διατροφής:",
        allBoards: "Όλες οι Διατροφές",
        policyLabel: "Πολιτική:",
        allPolicies: "Όλες οι Πολιτικές",
        freeCancellation: "Δωρεάν Ακύρωση",
        nonRefundable: "Μη Επιστρεπτέα",
        roomTypesFound: "Τύποι Δωματίων Βρέθηκαν",
        instantConfirmationAvailable: "Διαθέσιμη Άμεση Επιβεβαίωση",
        reservationSummary: "Σύνοψη Κράτησης",
        pleaseSelectARoom: "Παρακαλώ επιλέξτε δωμάτιο",
        guests: "Επισκέπτες",
        nationality: "Υπηκοότητα",
        dates: "Ημερομηνίες",
        stay: "Διαμονή",
        nights: "Νύχτες",
        night: "Νύχτα",
        totalStayPrice: "Συνολική Τιμή Διαμονής (Καθαρή)",
        checkingBestRates: "Έλεγχος Καλύτερων Τιμών...",
        instantReservation: "Άμεση Κράτηση",
        b2bAgencyRatesApplied: "ΕΦΑΡΜΟΣΤΗΚΑΝ ΤΙΜΕΣ B2B ΣΥΝΕΡΓΑΤΗ",
        adults: "Ενήλικες",
        adult: "Ενήλικας",
        children: "Παιδιά",
        child: "Παιδί",
        room: "Δωμάτιο",
        remove: "Αφαίρεση",
        childAge: "Ηλικία Παιδιού",
        addAnotherRoom: "Προσθήκη Άλλου Δωματίου",
        backToSearch: "Επιστροφή στην Αναζήτηση",
        tryAgain: "Δοκιμάστε Ξανά",
        showOnMap: "Εμφάνιση στο Χάρτη",
        reviewsLabel: "κριτικές",
        highlyPopular: "Πολύ Δημοφιλές",
        photos: "Φωτογραφίες",
        showAllPhotos: "Εμφάνιση Όλων των Φωτογραφιών",
        checkInOut: "Check-in / Out",
        guestsAndRooms: "Επισκέπτες & Δωμάτια",
        yr: "ετών",
        availableRates: "Διαθέσιμες Τιμές",
        pricesIncludeTaxesAndFees: "Οι τιμές περιλαμβάνουν φόρους & τέλη",
        selected: "Επιλέχθηκε",
        viewPolicies: "Προβολή Πολιτικών",
        cancellationTimeline: "Χρονοδιάγραμμα Ακύρωσης",
        penalty: "Ποινή",
        from: "Από",
        standardPoliciesApply: "Ισχύουν οι τυπικές πολιτικές.",
        totalStay: "Συνολική Διαμονή",
        selectRate: "Επιλογή Τιμής",
        showLessRates: "Εμφάνιση Λιγότερων Τιμών",
        show: "Εμφάνιση",
        moreRates: "Περισσότερες Τιμές",
        fetchingBestRates: "Αναζήτηση καλύτερων τιμών..."
    },
    pt: {
        roomsAndRates: "Quartos & Tarifas",
        overview: "Visão Geral",
        amenities: "Comodidades",
        transportation: "Transporte",
        policies: "Políticas",
        reviews: "Avaliações",
        boardType: "Tipo de Pensão:",
        allBoards: "Todas as Pensões",
        policyLabel: "Política:",
        allPolicies: "Todas as Políticas",
        freeCancellation: "Cancelamento Gratuito",
        nonRefundable: "Não Reembolsável",
        roomTypesFound: "Tipos de Quarto Encontrados",
        instantConfirmationAvailable: "Confirmação Instantânea Disponível",
        reservationSummary: "Resumo da Reserva",
        pleaseSelectARoom: "Por favor selecione um quarto",
        guests: "Hóspedes",
        nationality: "Nacionalidade",
        dates: "Datas",
        stay: "Estadia",
        nights: "Noites",
        night: "Noite",
        totalStayPrice: "Preço Total da Estadia (Líquido)",
        checkingBestRates: "Verificando Melhores Tarifas...",
        instantReservation: "Reserva Instantânea",
        b2bAgencyRatesApplied: "TARIFAS DE AGÊNCIA B2B APLICADAS",
        adults: "Adultos",
        adult: "Adulto",
        children: "Crianças",
        child: "Criança",
        room: "Quarto",
        remove: "Remover",
        childAge: "Idade da Criança",
        addAnotherRoom: "Adicionar Outro Quarto",
        backToSearch: "Voltar à Pesquisa",
        tryAgain: "Tentar Novamente",
        showOnMap: "Mostrar no Mapa",
        reviewsLabel: "avaliações",
        highlyPopular: "Muito Popular",
        photos: "Fotos",
        showAllPhotos: "Mostrar Todas las Fotos",
        checkInOut: "Entrada / Saída",
        guestsAndRooms: "Hóspedes e Quartos",
        yr: "anos",
        availableRates: "Tarifas Disponíveis",
        pricesIncludeTaxesAndFees: "Os preços incluem taxas e impostos",
        selected: "Selecionado",
        viewPolicies: "Ver Políticas",
        cancellationTimeline: "Cronograma de Cancelamento",
        penalty: "Multa",
        from: "De",
        standardPoliciesApply: "Aplicam-se as políticas padrão.",
        totalStay: "Estadia Total",
        selectRate: "Selecionar Tarifa",
        showLessRates: "Mostrar Menos Tarifas",
        show: "Mostrar",
        moreRates: "Mais Tarifas",
        fetchingBestRates: "Buscando as melhores tarifas..."
    }
};

const HotelDetail = () => {
    const { i18n } = useTranslation();
    const { agencyCurrency, currencySymbolMap } = useAuth();
    const currentLang = i18n.language || 'en';
    const tLocal = (key) => {
        return LOCAL_TRANSLATIONS[currentLang]?.[key] || LOCAL_TRANSLATIONS['en']?.[key] || key;
    };

    const formatPrice = (amount, currencyCode) => {
        const symbol = getCurrencySymbol(currencyCode || agencyCurrency || 'EUR', currencySymbolMap);
        const val = Number(amount) || 0;
        return `${symbol} ${val.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };



    const formatPolicyDate = (dateStr) => {
        if (!dateStr) return '';
        try {
            // Remove timezone info like [Asia/Shanghai] if present for basic parsing
            const cleanDate = dateStr.split('[')[0];
            const date = new Date(cleanDate);
            const currentLang = localStorage.getItem('language') || 'tr';
            return date.toLocaleDateString(currentLang, { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
        } catch {
            return dateStr;
        }
    };

    const { slug } = useParams();
    const id = slug; // Map the route parameter (which matches hotel/:slug) to id
    const [searchParams] = useSearchParams();
    const { error: toastError } = useToast();
    const navigate = useNavigate();

    const [dynamicHotel, setDynamicHotel] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isRoomsLoading, setIsRoomsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [visibleMonth, setVisibleMonth] = useState(new Date());

    const images = dynamicHotel?.images?.map(img => img.url) || (dynamicHotel?.image ? [dynamicHotel.image] : []);

    // -- Lightbox State --
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [lightboxImages, setLightboxImages] = useState([]);
    const [activeLightboxDescription, setActiveLightboxDescription] = useState('');

    // -- Room Gallery Modal State --
    const [isRoomGalleryOpen, setIsRoomGalleryOpen] = useState(false);
    const [selectedRoomGroup, setSelectedRoomGroup] = useState(null);

    const openLightbox = (index, contextImages = images, description = '') => {
        setLightboxImages(contextImages);
        setActiveLightboxDescription(description);
        setCurrentImageIndex(index);
        setIsLightboxOpen(true);
    };

    // -- Search State Initialization --
    const parseDateParam = (param) => {
        if (!param) return null;
        // Support both yyyy-mm-dd (ISO) and dd-mm-yyyy
        if (/^\d{4}-\d{2}-\d{2}$/.test(param)) {
            const [year, month, day] = param.split('-').map(Number);
            return new Date(year, month - 1, day);
        }
        const [day, month, year] = param.split('-').map(Number);
        if (day && month && year) {
            const date = new Date(year, month - 1, day);
            if (date instanceof Date && !isNaN(date.getTime())) return date;
        }
        return null;
    };

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfter = new Date(tomorrow);
    dayAfter.setDate(dayAfter.getDate() + 1);

    const [checkInDate, setCheckInDate] = useState(() => {
        return validateAndSanitizeDates(searchParams.get('checkin'), searchParams.get('checkout')).checkInDate;
    });
    const [checkOutDate, setCheckOutDate] = useState(() => {
        return validateAndSanitizeDates(searchParams.get('checkin'), searchParams.get('checkout')).checkOutDate;
    });

    const [nationality, setNationality] = useState(() => {
        return searchParams.get('nationality') || 'TR';
    });

    const [roomState, setRoomState] = useState(() => {
        const guestsParam = searchParams.get('guests');
        return parseGuestsParam(guestsParam);
    });

    const [showGuestDropdown, setShowGuestDropdown] = useState(false);
    const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
    const [activeDateField, setActiveDateField] = useState('checkIn');
    const guestWrapperRef = useRef(null);
    const datePickerRef = useRef(null);
    const lastFetchRef = useRef('');

    const stepCheckIn = (days) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const target = new Date(checkInDate || today);
        target.setDate(target.getDate() + days);
        if (target < today) return;
        setCheckInDate(target);
        if (checkOutDate && target >= checkOutDate) {
            const nextOut = new Date(target);
            nextOut.setDate(nextOut.getDate() + 1);
            setCheckOutDate(nextOut);
        }
    };

    const stepCheckOut = (days) => {
        const target = new Date(checkOutDate || new Date());
        target.setDate(target.getDate() + days);
        if (checkInDate && target <= checkInDate) return;
        setCheckOutDate(target);
    };

    const { holidays } = useHolidays(dynamicHotel?.address?.countryCode || dynamicHotel?.countryCode);

    // Computed totals
    const totalAdults = roomState.reduce((sum, r) => sum + r.adults, 0);
    const totalChildren = roomState.reduce((sum, r) => sum + r.children, 0);
    const totalRooms = roomState.length;

    const [activeTab, setActiveTab] = useState('Rooms & Rates');
    const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
    const [selectedRooms, setSelectedRooms] = useState([]);
    const [isCheckingRates, setIsCheckingRates] = useState(false);

    // -- Favorites Integration --
    const { isFavorite, toggleFavorite } = useFavorites();
    const [boardTypeFilter, setBoardTypeFilter] = useState('ALL');
    const [cancelFilter, setCancelFilter] = useState('ALL');
    const [expandedRates, setExpandedRates] = useState({}); // { roomKey: boolean }
    const [isMapModalOpen, setIsMapModalOpen] = useState(false);
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);

    const hotel = dynamicHotel || {};
    const currentHotelId = hotel.hotelId || hotel.id || slug;
    const isLiked = isFavorite(currentHotelId);

    const handleFavoriteToggle = (e) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        toggleFavorite({
            hotelId: currentHotelId,
            id: currentHotelId,
            name: hotel.name || hotel.hotelName || 'Hotel',
            stars: hotel.stars || hotel.hotelStar?.star || 5,
            city: hotel.city || hotel.locationPathNames?.split(',')?.[0]?.trim() || '',
            country: hotel.country || hotel.locationPathNames?.split(',')?.slice(-1)?.[0]?.trim() || '',
            location: hotel.location || hotel.locationPathNames || '',
            supplier: hotel.supplier || hotel.provider || 'Hotel Hub',
            image: hotel.image || images?.[0] || '',
            images: images || []
        });
    };

    // Counts for filters
    const boardCounts = React.useMemo(() => {
        if (!hotel?.rooms) return {};
        return hotel.rooms.reduce((acc, r) => {
            const code = r.hubRateModel?.boardCode || r.boardCode;
            if (code) {
                acc[code] = (acc[code] || 0) + 1;
            }
            return acc;
        }, {});
    }, [hotel?.rooms]);

    const policyCounts = React.useMemo(() => {
        if (!hotel?.rooms) return { FREE: 0, NON_REFUNDABLE: 0 };
        return hotel.rooms.reduce((acc, r) => {
            const cancelAmount = r.hubRateModel?.price?.cancellationPolicies?.[0]?.amount;
            if (r.hubRateModel?.refundable === true || cancelAmount === 0 || r.hasFreeCancellation) {
                acc.FREE++;
            } else if (r.hubRateModel?.refundable === false || (cancelAmount !== undefined && cancelAmount > 0)) {
                acc.NON_REFUNDABLE++;
            }
            return acc;
        }, { FREE: 0, NON_REFUNDABLE: 0 });
    }, [hotel?.rooms]);

    // Grouping rooms by name/type
    const groupedRooms = React.useMemo(() => {
        if (!hotel.rooms) return [];

        const groups = hotel.rooms.reduce((acc, room) => {
            const key = room.names?.tr || room.names?.en || room.names?.defaultName || 'Standard Room';
            if (!acc[key]) {
                acc[key] = {
                    name: key,
                    images: room.images || [],
                    attributes: room.attributes || [],
                    maxAdult: room.maxAdult,
                    maxChildren: room.maxChildren,
                    roomPaxCapacity: room.roomPaxCapacity,
                    squareMeter: room.attributes?.find(a => a.names?.en?.toLowerCase().includes('sqm') || a.label?.toLowerCase().includes('sqm') || a.names?.en?.toLowerCase().includes('meter'))?.label,
                    rates: []
                };
            }
            acc[key].rates.push(room);
            return acc;
        }, {});

        let result = Object.values(groups);

        // Apply local filters
        if (boardTypeFilter !== 'ALL') {
            result = result.map(group => ({
                ...group,
                rates: group.rates.filter(r => r.hubRateModel?.boardCode === boardTypeFilter)
            })).filter(group => group.rates.length > 0);
        }

        if (cancelFilter !== 'ALL') {
            result = result.map(group => ({
                ...group,
                rates: group.rates.filter(r => {
                    const isFree = r.hubRateModel?.price?.cancellationPolicies?.[0]?.amount === 0;
                    return cancelFilter === 'FREE' ? isFree : !isFree;
                })
            })).filter(group => group.rates.length > 0);
        }

        // Sort rates inside each room group by price ascending
        function getRatePrice(r) {
            return r.hubRateModel?.price?.calculatedAmount || r.hubRateModel?.price?.totalPaymentAmount || r.price || 0;
        }

        result = result.map(group => ({
            ...group,
            rates: [...group.rates].sort((a, b) => getRatePrice(a) - getRatePrice(b))
        }));

        // Sort room groups by their cheapest rate price ascending
        result.sort((a, b) => {
            const priceA = a.rates.length > 0 ? getRatePrice(a.rates[0]) : 0;
            const priceB = b.rates.length > 0 ? getRatePrice(b.rates[0]) : 0;
            return priceA - priceB;
        });

        return result;
    }, [hotel.rooms, boardTypeFilter, cancelFilter]);

    // Fetch data when search parameters or hotel ID change
    useEffect(() => {
        const fetchKey = `${id}-${searchParams.toString()}`;
        if (lastFetchRef.current === fetchKey) return;
        lastFetchRef.current = fetchKey;

        // Clear previous selection when a new search is initiated
        setSelectedRooms([]);

        const sanitizedDates = validateAndSanitizeDates(searchParams.get('checkin'), searchParams.get('checkout'));
        const fetchCheckIn = sanitizedDates.checkInDate;
        const fetchCheckOut = sanitizedDates.checkOutDate;
        const fetchNationality = searchParams.get('nationality') || 'TR';
        const fetchRooms = parseGuestsParam(searchParams.get('guests'));

        // Sync local state with URL params
        setCheckInDate(fetchCheckIn);
        setCheckOutDate(fetchCheckOut);
        setNationality(fetchNationality);
        setRoomState(fetchRooms);

        const fetchData = async () => {
            console.log('Fetching detailed room data for hotel:', id, { checkin: fetchCheckIn, checkout: fetchCheckOut });

            // If we already have hotel data, only show loading for rooms
            if (dynamicHotel) {
                setIsRoomsLoading(true);
            } else {
                setIsLoading(true);
            }

            setError(null);
            try {
                const response = await hotelService.searchRooms({
                    hotelId: id,
                    searchCriteria: {
                        checkin: fetchCheckIn,
                        checkout: fetchCheckOut,
                        nationality: fetchNationality,
                        rooms: fetchRooms
                    }
                });

                if (response?.data?.content?.length > 0) {
                    setDynamicHotel(response.data.content[0]);
                } else if (response?.data?.content) {
                    setError('Hotel not found or no rooms available for selected dates.');
                }
            } catch (err) {
                console.error('Error fetching hotel details:', err);
                setError('Failed to fetch hotel details. Please try again later.');
            } finally {
                setIsLoading(false);
                setIsRoomsLoading(false);
            }
        };

        if (id) {
            fetchData();
        }
    }, [id, searchParams]);


    const nights = React.useMemo(() => {
        if (!checkInDate || !checkOutDate) return 1;
        const start = new Date(checkInDate);
        const end = new Date(checkOutDate);
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays || 1;
    }, [checkInDate, checkOutDate]);

    const formattedDates = React.useMemo(() => {
        if (!checkInDate || !checkOutDate) return { start: 'Select Date', end: 'Select Date' };
        const options = { month: 'short', day: 'numeric', year: 'numeric' };
        return {
            start: new Date(checkInDate).toLocaleDateString(currentLang, options),
            end: new Date(checkOutDate).toLocaleDateString(currentLang, options)
        };
    }, [checkInDate, checkOutDate, currentLang]);

    const toggleRoomSelection = (roomType, rate, roomName, fullRateData) => {
        const rateCode = fullRateData?.hubRateModel?.rateCode || fullRateData?.rateCode;
        const maxAllowedRooms = Math.min(roomState.length || 1, 4);

        // Check if this specific rate offer is already selected
        const existingIndex = selectedRooms.findIndex(r =>
            (rateCode && (r.hubRateModel?.rateCode === rateCode || r.rateCode === rateCode)) ||
            (!rateCode && r.type === roomType && r.name === roomName && r.rate === rate)
        );

        // If user clicks an already selected rate, remove/deselect it
        if (existingIndex > -1) {
            setSelectedRooms(prev => prev.filter((_, i) => i !== existingIndex));
            return;
        }

        // Single room search: selecting an unselected room rate replaces current selection
        if (maxAllowedRooms === 1) {
            setSelectedRooms([{
                type: roomType,
                rate,
                name: roomName,
                currency: fullRateData?.currency || agencyCurrency || 'USD',
                hubRateModel: fullRateData?.hubRateModel,
                dailyPrices: fullRateData?.hubRateModel?.price?.dailyPrices || []
            }]);
            return;
        }

        // Multi-room search: check if selection is at maximum capacity
        if (selectedRooms.length >= maxAllowedRooms) {
            const errorTemplate = tLocal('maxRoomsSelectedError') || 'Aramanızda {{count}} oda belirttiniz. En fazla {{count}} oda seçebilirsiniz.';
            const errorMsg = errorTemplate.replace(/\{\{count\}\}/g, maxAllowedRooms);
            toastError(errorMsg);
            return;
        }

        // If selection is below maximum capacity, add new room selection instance
        setSelectedRooms(prev => [...prev, {
            type: roomType,
            rate,
            name: roomName,
            currency: fullRateData?.currency || agencyCurrency || 'USD',
            hubRateModel: fullRateData?.hubRateModel,
            dailyPrices: fullRateData?.hubRateModel?.price?.dailyPrices || []
        }]);
    };

    // Auto-select room rate if rateCode is provided in URL params
    useEffect(() => {
        const targetRateCode = searchParams.get('rateCode');
        if (!targetRateCode || !groupedRooms || groupedRooms.length === 0) return;

        // If already selected, skip
        if (selectedRooms.some(r => r.hubRateModel?.rateCode === targetRateCode || r.rateCode === targetRateCode)) return;

        for (const group of groupedRooms) {
            const matchingRate = group.rates.find(r => 
                (r.hubRateModel?.rateCode === targetRateCode || r.rateCode === targetRateCode)
            );
            if (matchingRate) {
                const ratePrice = matchingRate.hubRateModel?.price?.calculatedAmount 
                    || matchingRate.hubRateModel?.price?.totalPaymentAmount 
                    || matchingRate.price || 0;
                toggleRoomSelection(group.name, ratePrice, group.name, matchingRate);
                break;
            }
        }
    }, [groupedRooms, searchParams]);

    // -- Handlers --
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (guestWrapperRef.current && !guestWrapperRef.current.contains(event.target)) {
                setShowGuestDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSearch = () => {
        const guestsParam = serializeGuestsParam(roomState);
        const params = new URLSearchParams(searchParams);
        params.set('checkin', formatDateForUrl(checkInDate));
        params.set('checkout', formatDateForUrl(checkOutDate));
        params.set('guests', guestsParam);
        params.set('nationality', nationality);
        if (!params.get('q')) {
            params.set('q', hotel.names?.tr || hotel.names?.en || hotel.name || '');
        }

        // Keep current path but update search params
        navigate(`${window.location.pathname}?${params.toString()}`);
    };

    const handleBreadcrumbClick = (locationId, name) => {
        const params = new URLSearchParams(searchParams);
        params.set('locationId', locationId);
        params.set('q', name);
        navigate(`/hotels?${params.toString()}`);
    };

    const isRequestingRef = useRef(false);

    const handleInstantReservation = async () => {
        if (isRequestingRef.current || isCheckingRates) return;
        const maxAllowedRooms = Math.min(roomState.length || 1, 4);
        if (selectedRooms.length > maxAllowedRooms) {
            const errorTemplate = tLocal('maxRoomsSelectedError') || 'Aramanızda {{count}} oda belirttiniz. En fazla {{count}} oda seçebilirsiniz.';
            const errorMsg = errorTemplate.replace(/\{\{count\}\}/g, maxAllowedRooms);
            toastError(errorMsg);
            return;
        }
        if (selectedRooms.length > 0) {
            isRequestingRef.current = true;
            setIsCheckingRates(true);
            try {
                const checkRatesRequest = {
                    rooms: selectedRooms.map(room => ({
                        rateCode: room.hubRateModel?.rateCode || room.rateCode || ''
                    }))
                };

                const response = await hotelService.checkRates(checkRatesRequest);
                console.log('Check rates response:', response);

                const checkRatesList = Array.isArray(response) ? response : (response?.data ? (Array.isArray(response.data) ? response.data : [response.data]) : []);
                const firstHotel = checkRatesList[0] || {};
                const firstRoom = firstHotel?.rooms?.[0] || {};
                const firstRate = firstRoom?.rates?.[0] || {};
                const rateSearchUuid = response?.rateSearchUuid || firstHotel?.rateSearchUuid || '';

                console.log('Obtained rateSearchUuid:', rateSearchUuid);

                const concatRateCodes = (selectedRooms || [])
                    .map(r => r.hubRateModel?.rateCode || r.rateCode || '')
                    .sort()
                    .join('_');

                let sid = '';
                if (window.crypto && window.crypto.subtle) {
                    try {
                        const encoder = new TextEncoder();
                        const data = encoder.encode(concatRateCodes);
                        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
                        const hashArray = Array.from(new Uint8Array(hashBuffer));
                        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
                        sid = hashHex.substring(0, 16);
                    } catch (e) {
                        console.warn('Subtle crypto failed, falling back to simple hash', e);
                    }
                }

                // Fallback for non-HTTPS insecure environments or exceptions
                if (!sid) {
                    let hash = 0;
                    for (let i = 0; i < concatRateCodes.length; i++) {
                        const char = concatRateCodes.charCodeAt(i);
                        hash = ((hash << 5) - hash) + char;
                        hash = hash & hash; // Convert to 32bit integer
                    }
                    sid = Math.abs(hash).toString(16).padEnd(16, 'a');
                }

                const isoCheckIn = checkInDate instanceof Date ? checkInDate.toISOString() : new Date(checkInDate).toISOString();
                const isoCheckOut = checkOutDate instanceof Date ? checkOutDate.toISOString() : new Date(checkOutDate).toISOString();

                const sessionData = {
                    selectedRooms,
                    hotel,
                    roomState,
                    checkInDate: isoCheckIn,
                    checkOutDate: isoCheckOut,
                    totalPrice: selectedRooms.reduce((sum, r) => sum + r.rate, 0),
                    nights,
                    rateSearchUuid: rateSearchUuid,
                    checkRatesData: firstHotel,
                    originalSearch: window.location.search,
                    hotelSlug: id
                };

                // Save session to backend first
                await hotelService.saveCheckoutSession(sid, sessionData);

                // Navigate with only sessionId
                navigate(`/travel/hotels/checkout/guests?sessionId=${sid}`);
            } catch (err) {
                console.error('Check rates failed:', err);
                toastError('Rate check failed. The price might have changed or the room is no longer available.');
            } finally {
                setIsCheckingRates(false);
                isRequestingRef.current = false;
            }
        }
    };

    const updateRoom = (index, field, value) => {
        const newRooms = [...roomState];
        newRooms[index] = { ...newRooms[index], [field]: value };
        if (field === 'children') {
            const diff = value - newRooms[index].childAges.length;
            if (diff > 0) newRooms[index].childAges = [...newRooms[index].childAges, ...Array(diff).fill(0)];
            else if (diff < 0) newRooms[index].childAges = newRooms[index].childAges.slice(0, value);
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
        if (roomState.length < 4) setRoomState([...roomState, { adults: 2, children: 0, childAges: [] }]);
    };

    const removeRoom = (index) => {
        if (roomState.length > 1) setRoomState(roomState.filter((_, i) => i !== index));
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background-light dark:bg-background-dark flex items-center justify-center">
                <div className="flex flex-col items-center gap-6">
                    <div className="size-20 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                    <p className="text-slate-500 font-black uppercase tracking-[0.3em] text-xs" lang={currentLang}>
                        {tLocal('fetchingBestRates')}
                    </p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-background-light dark:bg-background-dark flex flex-col items-center justify-center p-6 text-center">
                <div className="size-24 bg-red-50 dark:bg-red-900/10 rounded-full flex items-center justify-center text-red-500 mb-6">
                    <span className="material-symbols-outlined text-5xl">warning</span>
                </div>
                <h2 className="text-3xl font-black mb-4 tracking-tight">Oops! Something went wrong</h2>
                <p className="text-slate-500 dark:text-slate-400 font-medium mb-8 max-w-md">{error}</p>
                <button
                    onClick={() => window.location.reload()}
                    className="px-8 py-4 bg-primary text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:scale-105 transition-all shadow-xl shadow-primary/30"
                >
                    {tLocal('tryAgain')}
                </button>
            </div>
        );
    }

    const tabs = ['Rooms & Rates', 'Overview', 'Amenities', 'Transportation', 'Policies', 'Reviews'];
    const tabLabelMap = {
        'Rooms & Rates': 'roomsAndRates',
        'Overview': 'overview',
        'Amenities': 'amenities',
        'Transportation': 'transportation',
        'Policies': 'policies',
        'Reviews': 'reviews'
    };

    return (
        <div className="relative flex min-h-full flex-col bg-white dark:bg-[#202124] text-[#202124] dark:text-white transition-colors duration-200 font-roboto">
            <div className="flex-1 max-w-[1440px] mx-auto w-full px-4 sm:px-6 lg:px-12 py-6">
                {/* Top Navigation & Breadcrumbs */}
                <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-2 overflow-x-auto overflow-y-hidden scrollbar-hide py-1">
                        {hotel.locationBreadcrumbs?.map((bc, i) => {
                            const name = bc.name?.translations?.tr || bc.name?.translations?.en || bc.name?.defaultName;
                            return (
                                <React.Fragment key={bc.locationId}>
                                    <button
                                        type="button"
                                        onClick={() => handleBreadcrumbClick(bc.locationId, name)}
                                        className="text-xs font-normal text-[#5f6368] dark:text-slate-400 whitespace-nowrap hover:text-[#1a73e8] transition-colors cursor-pointer bg-transparent border-0 p-0 leading-normal"
                                    >
                                        {name}
                                    </button>
                                    {i < hotel.locationBreadcrumbs.length - 1 && (
                                        <span className="material-symbols-outlined text-[14px] leading-none text-[#70757a] select-none shrink-0">chevron_right</span>
                                    )}
                                </React.Fragment>
                            );
                        }) || <Breadcrumbs />}
                    </div>
                    <Link to={`/travel/hotels/search?${searchParams.toString()}`} className="flex items-center gap-1.5 text-sm font-medium text-[#1a73e8] hover:underline group">
                        <span className="material-symbols-outlined text-[18px] group-hover:-translate-x-0.5 transition-transform">arrow_back</span>
                        {tLocal('backToSearch')}
                    </Link>
                </div>

                {/* Hotel Title & Header Section - Google Style */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-4 pb-4 border-b border-[#dadce0] dark:border-slate-700">
                    <div>
                        <div className="flex flex-wrap items-center gap-2.5 mb-1.5">
                            <h1 className="text-2xl sm:text-3xl font-medium text-[#202124] dark:text-white tracking-normal">{decodeHTMLEntities(hotel.names?.tr || hotel.names?.en || hotel.name)}</h1>
                            <div className="flex text-[#fbbc04]">
                                {[...Array(hotel.hotelStar?.star || 5)].map((_, i) => (
                                    <span key={i} className="material-symbols-outlined fill-1 text-[18px]">star</span>
                                ))}
                            </div>
                            {hotel.isRecommended && (
                                <div className="bg-[#e6f4ea] text-[#137333] dark:bg-emerald-950/40 dark:text-emerald-300 border border-[#ceead6] dark:border-emerald-800 text-xs font-medium px-2.5 py-0.5 rounded-full flex items-center gap-1">
                                    <span className="material-symbols-outlined text-[14px] fill-1">thumb_up</span>
                                    Recommended
                                </div>
                            )}
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-sm text-[#5f6368] dark:text-slate-400">
                            <div className="flex items-center gap-1">
                                <span className="material-symbols-outlined text-[18px] text-[#5f6368]">location_on</span>
                                <span>{decodeHTMLEntities(hotel.address ? `${hotel.address.street}, ${hotel.address.cityName}` : hotel.location)}</span>
                            </div>
                            <span>•</span>
                            <button
                                onClick={() => setIsMapModalOpen(true)}
                                className="text-[#1a73e8] font-medium hover:underline flex items-center gap-1 cursor-pointer">
                                <span>{tLocal('showOnMap')}</span>
                            </button>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-3 shrink-0">
                        <div className="flex items-center gap-2 mr-2">
                            <button
                                type="button"
                                onClick={handleFavoriteToggle}
                                title={isLiked ? (tLocal('removeFromFavorites') || 'Kaydedilenlerden Çıkar') : (tLocal('saveToFavorites') || 'Kaydet')}
                                className={`size-10 rounded-full border flex items-center justify-center transition-colors cursor-pointer ${
                                    isLiked 
                                        ? 'bg-blue-50 dark:bg-blue-950/30 text-[#1a73e8] dark:text-[#8ab4f8] border-blue-200 dark:border-blue-800' 
                                        : 'border-[#dadce0] dark:border-slate-600 hover:bg-[#f1f3f4] dark:hover:bg-slate-700 text-[#5f6368] dark:text-slate-300'
                                }`}
                            >
                                <span 
                                    className={`material-symbols-outlined text-[20px] ${isLiked ? 'fill-1 text-[#1a73e8] dark:text-[#8ab4f8]' : ''}`}
                                    style={isLiked ? { fontVariationSettings: "'FILL' 1" } : undefined}
                                >
                                    {isLiked ? 'bookmark' : 'bookmark_border'}
                                </span>
                            </button>
                            <button
                                onClick={() => setIsShareModalOpen(true)}
                                className="size-10 rounded-full border border-[#dadce0] dark:border-slate-600 hover:bg-[#f1f3f4] dark:hover:bg-slate-700 text-[#5f6368] dark:text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
                                title="Paylaş"
                            >
                                <span className="material-symbols-outlined text-[20px]">share</span>
                            </button>
                        </div>

                        {/* Rating Display */}
                        <div className="flex items-center gap-3 border-l border-[#dadce0] dark:border-slate-700 pl-4">
                            <div className="bg-[#1a73e8] text-white font-medium text-sm px-2.5 py-1 rounded-md">
                                {hotel.stars || hotel.hotelStar?.star || '4.5'}
                            </div>
                            <div className="flex flex-col">
                                <span className="text-sm font-medium text-[#202124] dark:text-white leading-tight">{hotel.ratingLabel || 'Çok İyi'}</span>
                                <span className="text-xs text-[#5f6368] dark:text-slate-400 mt-0.5">1,240 {tLocal('reviewsLabel')}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Info Badges - Google Chips */}
                <div className="flex flex-wrap gap-2 mb-6">
                    {(hotel.facilities?.slice(0, 6).map(f => decodeHTMLEntities(f.names?.tr || f.names?.en || f.name)) || ['Free WiFi', 'Free Parking', 'Breakfast Available']).map((item, i) => (
                        <span key={i} className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-[#303134] text-[#3c4043] dark:text-slate-200 rounded-full text-xs font-normal border border-[#dadce0] dark:border-slate-600 hover:bg-[#f8f9fa] dark:hover:bg-slate-700 transition-colors cursor-default">
                            <span className="material-symbols-outlined text-[16px] text-[#1a73e8]">check</span> {item}
                        </span>
                    ))}
                </div>

                {/* Gallery Grid - Google Travel Style */}
                <div className="grid grid-cols-1 md:grid-cols-4 grid-rows-2 gap-2 h-[420px] mb-8 overflow-hidden rounded-xl border border-[#dadce0] dark:border-slate-700 relative group/gallery bg-slate-100 dark:bg-slate-800">
                    <div className="md:col-span-2 md:row-span-2 relative overflow-hidden cursor-pointer" onClick={() => openLightbox(0, images)}>
                        <img className="w-full h-full object-cover transition-transform duration-500 hover:scale-105" src={images[0]} alt={hotel.name} />
                        <div className="absolute bottom-3 left-3 bg-white/95 dark:bg-[#202124]/90 backdrop-blur-md px-3 py-1.5 rounded-lg text-xs font-medium text-[#202124] dark:text-white shadow-md border border-[#dadce0] dark:border-slate-700">
                            1 / {images.length} {tLocal('photos')}
                        </div>
                    </div>
                    <div className="hidden md:block relative overflow-hidden cursor-pointer" onClick={() => openLightbox(1, images)}>
                        <img className="w-full h-full object-cover transition-transform duration-500 hover:scale-105" src={images[1] || images[0]} alt="" />
                    </div>
                    <div className="hidden md:block relative overflow-hidden cursor-pointer" onClick={() => openLightbox(2, images)}>
                        <img className="w-full h-full object-cover transition-transform duration-500 hover:scale-105" src={images[2] || images[0]} alt="" />
                    </div>
                    <div className="hidden md:block relative overflow-hidden cursor-pointer" onClick={() => openLightbox(3, images)}>
                        <img className="w-full h-full object-cover transition-transform duration-500 hover:scale-105" src={images[3] || images[0]} alt="" />
                    </div>
                    <div className="hidden md:block relative overflow-hidden cursor-pointer group/viewall" onClick={() => openLightbox(0, images)}>
                        <img className="w-full h-full object-cover group-hover/viewall:scale-105 blur-[1px] transition-transform duration-500" src={images[4] || images[0]} alt="" />
                        <div className="absolute inset-0 bg-black/40 backdrop-blur-xs flex flex-col items-center justify-center text-white text-center p-4">
                            <span className="material-symbols-outlined text-3xl mb-1">photo_library</span>
                            <span className="text-xs font-medium tracking-wide">{tLocal('showAllPhotos')}</span>
                        </div>
                    </div>
                </div>

                {/* Main Content Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    <div className="lg:col-span-8">
                        {/* Google Flights Style Search Bar - Matching Hotel Listing */}
                        <div className="w-full flex flex-wrap sm:flex-nowrap items-center gap-2 relative z-50 mb-6 font-roboto">
                            {/* Twin Datepicker Container */}
                            <div className={`flex-1 min-w-[280px] relative h-12 bg-white dark:bg-[#303134] flex items-center google-flight-date-trigger ${
                                isDatePickerOpen && (activeDateField === 'checkIn' || activeDateField === 'checkOut')
                                    ? ''
                                    : 'border border-[#dadce0] dark:border-slate-600 rounded-lg hover:border-[#bdc1c6] transition-all overflow-hidden'
                            }`}>
                                {/* Check-In Half */}
                                <div
                                    onClick={() => {
                                        setActiveDateField('checkIn');
                                        setIsDatePickerOpen(true);
                                        setShowGuestDropdown(false);
                                    }}
                                    className={`relative flex-1 h-full flex items-center justify-between px-3 sm:px-3.5 cursor-pointer transition-colors min-w-0 ${
                                        isDatePickerOpen && activeDateField === 'checkIn'
                                            ? 'border-2 border-[#1a73e8] rounded-lg z-10 bg-white dark:bg-[#303134]'
                                            : isDatePickerOpen && activeDateField === 'checkOut'
                                            ? 'border border-[#dadce0] dark:border-slate-600 border-r-0 rounded-l-lg hover:bg-slate-50 dark:hover:bg-slate-700/40'
                                            : 'rounded-l-lg hover:bg-slate-50 dark:hover:bg-slate-700/40'
                                    }`}
                                >
                                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                        <span className="material-symbols-outlined text-[20px] text-[#5f6368] dark:text-slate-400 flex-shrink-0">
                                            calendar_today
                                        </span>
                                        <span className="text-[14px] sm:text-[15px] font-normal text-[#3c4043] dark:text-white truncate">
                                            {formatGoogleFlightDate(checkInDate) || 'Giriş'}
                                        </span>
                                    </div>

                                    {/* Quick 1-day step buttons */}
                                    <div className="flex items-center text-[#5f6368] dark:text-slate-400 shrink-0 ml-1">
                                        <button
                                            type="button"
                                            onClick={(e) => { e.stopPropagation(); stepCheckIn(-1); }}
                                            className="hover:bg-slate-200 dark:hover:bg-slate-600 p-0.5 rounded transition-colors cursor-pointer"
                                            title="1 gün geri"
                                        >
                                            <span className="material-symbols-outlined text-[15px]">chevron_left</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={(e) => { e.stopPropagation(); stepCheckIn(1); }}
                                            className="hover:bg-slate-200 dark:hover:bg-slate-600 p-0.5 rounded transition-colors cursor-pointer"
                                            title="1 gün ileri"
                                        >
                                            <span className="material-symbols-outlined text-[15px]">chevron_right</span>
                                        </button>
                                    </div>
                                </div>

                                {/* Middle Vertical Divider */}
                                {!(isDatePickerOpen && (activeDateField === 'checkIn' || activeDateField === 'checkOut')) && (
                                    <div className="w-[1px] h-7 bg-[#dadce0] dark:bg-slate-600 flex-shrink-0" />
                                )}

                                {/* Check-Out Half */}
                                <div
                                    onClick={() => {
                                        setActiveDateField('checkOut');
                                        setIsDatePickerOpen(true);
                                        setShowGuestDropdown(false);
                                    }}
                                    className={`relative flex-1 h-full flex items-center justify-between px-3 sm:px-3.5 cursor-pointer transition-colors min-w-0 ${
                                        isDatePickerOpen && activeDateField === 'checkOut'
                                            ? 'border-2 border-[#1a73e8] rounded-lg z-10 bg-white dark:bg-[#303134]'
                                            : isDatePickerOpen && activeDateField === 'checkIn'
                                            ? 'border border-[#dadce0] dark:border-slate-600 border-l-0 rounded-r-lg hover:bg-slate-50 dark:hover:bg-slate-700/40'
                                            : 'rounded-r-lg hover:bg-slate-50 dark:hover:bg-slate-700/40'
                                    }`}
                                >
                                    <div className="flex items-center min-w-0 flex-1">
                                        <span className="text-[14px] sm:text-[15px] font-normal text-[#3c4043] dark:text-white truncate">
                                            {formatGoogleFlightDate(checkOutDate) || 'Çıkış'}
                                        </span>
                                    </div>

                                    {/* Quick 1-day step buttons */}
                                    <div className="flex items-center text-[#5f6368] dark:text-slate-400 shrink-0 ml-1">
                                        <button
                                            type="button"
                                            onClick={(e) => { e.stopPropagation(); stepCheckOut(-1); }}
                                            className="hover:bg-slate-200 dark:hover:bg-slate-600 p-0.5 rounded transition-colors cursor-pointer"
                                            title="1 gün geri"
                                        >
                                            <span className="material-symbols-outlined text-[15px]">chevron_left</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={(e) => { e.stopPropagation(); stepCheckOut(1); }}
                                            className="hover:bg-slate-200 dark:hover:bg-slate-600 p-0.5 rounded transition-colors cursor-pointer"
                                            title="1 gün ileri"
                                        >
                                            <span className="material-symbols-outlined text-[15px]">chevron_right</span>
                                        </button>
                                    </div>
                                </div>

                                {/* Google Flights 2-Month Datepicker Popover */}
                                <GoogleFlightDatePicker
                                    isOpen={isDatePickerOpen}
                                    onClose={() => {
                                        setIsDatePickerOpen(false);
                                    }}
                                    checkInDate={checkInDate}
                                    checkOutDate={checkOutDate}
                                    onCheckInChange={setCheckInDate}
                                    onCheckOutChange={setCheckOutDate}
                                    activeField={activeDateField}
                                    setActiveField={setActiveDateField}
                                    holidays={holidays}
                                    countryCode={dynamicHotel?.address?.countryCode || dynamicHotel?.countryCode || nationality || 'TR'}
                                />
                            </div>

                            {/* Elegant Guest Selector */}
                            <div className="relative group/field flex-shrink-0" ref={guestWrapperRef}>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowGuestDropdown(!showGuestDropdown);
                                        setIsDatePickerOpen(false);
                                    }}
                                    className="flex items-center gap-1.5 border border-[#dadce0] dark:border-slate-600 hover:bg-[#f8f9fa] dark:hover:bg-[#303134] px-4 h-12 rounded-lg transition-colors text-[#3c4043] dark:text-slate-300 font-normal text-[14px] focus:outline-none cursor-pointer"
                                >
                                    <span className="material-symbols-outlined text-[18px] text-[#70757a]">person</span>
                                    <span className="text-[13px] font-normal text-[#3c4043] dark:text-slate-200">
                                        {totalAdults + totalChildren}
                                    </span>
                                    <span className="material-symbols-outlined text-[18px] text-[#70757a]">arrow_drop_down</span>
                                </button>

                                {/* Guest Dropdown - Google Flights Style */}
                                {showGuestDropdown && (
                                    <div className="absolute top-full left-0 w-[340px] mt-2 bg-white dark:bg-[#202124] rounded-lg border border-[#dadce0] dark:border-slate-700 shadow-[0_4px_6px_rgba(0,0,0,0.1),0_1px_3px_rgba(0,0,0,0.08)] p-4 z-[1000] animate-in fade-in slide-in-from-top-2 duration-200">
                                        <div className="max-h-[60vh] overflow-y-auto custom-scrollbar pr-3 -mr-3">
                                            {roomState.map((room, index) => (
                                                <div key={index} className="mb-4 pb-4 border-b border-slate-100 dark:border-slate-800 last:border-0 last:pb-0 last:mb-0">
                                                    {roomState.length > 1 && (
                                                        <div className="flex justify-between items-center mb-3">
                                                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{tLocal('room')} {index + 1}</span>
                                                            <button type="button" onClick={() => removeRoom(index)} className="text-red-500 hover:text-red-700 text-xs font-medium px-2 py-1 rounded hover:bg-red-50">{tLocal('remove')}</button>
                                                        </div>
                                                    )}

                                                    <div className="flex flex-col gap-4">
                                                        {/* Adults Row */}
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-[14px] text-[#3c4043] dark:text-slate-300">{tLocal('adults')}</span>
                                                            <div className="flex items-center gap-1">
                                                                <button 
                                                                    type="button"
                                                                    onClick={() => updateRoom(index, 'adults', Math.max(1, room.adults - 1))} 
                                                                    disabled={room.adults <= 1}
                                                                    className="w-8 h-8 rounded bg-[#e8f0fe] text-[#1a73e8] disabled:bg-slate-100 disabled:text-slate-400 dark:bg-blue-900/30 dark:text-blue-400 flex items-center justify-center transition-colors cursor-pointer"
                                                                >
                                                                    <span className="material-symbols-outlined text-[20px]">remove</span>
                                                                </button>
                                                                <span className="w-8 text-center text-[15px] font-medium text-[#3c4043] dark:text-white">{room.adults}</span>
                                                                <button 
                                                                    type="button"
                                                                    onClick={() => updateRoom(index, 'adults', Math.min(6, room.adults + 1))} 
                                                                    disabled={room.adults >= 6} 
                                                                    className="w-8 h-8 rounded bg-[#e8f0fe] text-[#1a73e8] disabled:bg-slate-100 disabled:text-slate-400 dark:bg-blue-900/30 dark:text-blue-400 flex items-center justify-center transition-colors cursor-pointer"
                                                                >
                                                                    <span className="material-symbols-outlined text-[20px]">add</span>
                                                                </button>
                                                            </div>
                                                        </div>

                                                        {/* Children Row */}
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex flex-col">
                                                                <span className="text-[14px] text-[#3c4043] dark:text-slate-300">{tLocal('children')}</span>
                                                                <span className="text-[12px] text-slate-500">{tLocal('childAge') || '0-17 yaş'}</span>
                                                            </div>
                                                            <div className="flex items-center gap-1">
                                                                <button 
                                                                    type="button"
                                                                    onClick={() => updateRoom(index, 'children', Math.max(0, room.children - 1))} 
                                                                    disabled={room.children <= 0}
                                                                    className="w-8 h-8 rounded bg-[#e8f0fe] text-[#1a73e8] disabled:bg-slate-100 disabled:text-slate-400 dark:bg-blue-900/30 dark:text-blue-400 flex items-center justify-center transition-colors cursor-pointer"
                                                                >
                                                                    <span className="material-symbols-outlined text-[20px]">remove</span>
                                                                </button>
                                                                <span className="w-8 text-center text-[15px] font-medium text-[#3c4043] dark:text-white">{room.children}</span>
                                                                <button 
                                                                    type="button"
                                                                    onClick={() => updateRoom(index, 'children', Math.min(4, room.children + 1))} 
                                                                    disabled={room.children >= 4} 
                                                                    className="w-8 h-8 rounded bg-[#e8f0fe] text-[#1a73e8] disabled:bg-slate-100 disabled:text-slate-400 dark:bg-blue-900/30 dark:text-blue-400 flex items-center justify-center transition-colors cursor-pointer"
                                                                >
                                                                    <span className="material-symbols-outlined text-[20px]">add</span>
                                                                </button>
                                                            </div>
                                                        </div>

                                                        {/* Child Ages */}
                                                        {room.children > 0 && (
                                                            <div className="grid grid-cols-2 gap-3 mt-1">
                                                                {room.childAges.map((age, ageIdx) => (
                                                                    <div key={ageIdx} className="flex flex-col gap-1">
                                                                        <span className="text-[12px] text-slate-500">{tLocal('children')} {ageIdx + 1} {tLocal('yr')}</span>
                                                                        <select
                                                                            value={age}
                                                                            onChange={(e) => updateChildAge(index, ageIdx, e.target.value)}
                                                                            className="w-full h-8 bg-white dark:bg-slate-800 rounded border border-[#dadce0] dark:border-slate-600 text-[13px] px-2 focus:border-[#1a73e8] focus:ring-0 outline-none text-[#3c4043] dark:text-white cursor-pointer"
                                                                        >
                                                                            {[...Array(18)].map((_, i) => <option key={i} value={i}>{i} {tLocal('yr')}</option>)}
                                                                        </select>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}

                                            {roomState.length < 5 && (
                                                <button type="button" onClick={addRoom} className="mt-4 text-[14px] text-[#1a73e8] font-medium hover:underline flex items-center cursor-pointer">
                                                    <span className="material-symbols-outlined text-[18px] mr-1">add</span>
                                                    {tLocal('addAnotherRoom')}
                                                </button>
                                            )}
                                        </div>

                                        {/* Google Flights Style Footer */}
                                        <div className="flex items-center justify-end gap-6 mt-6 pt-2">
                                            <button type="button" onClick={() => setShowGuestDropdown(false)} className="text-[14px] text-[#1a73e8] font-medium hover:bg-blue-50 dark:hover:bg-blue-900/20 px-3 py-1.5 rounded transition-colors cursor-pointer">
                                                {tLocal('cancel') || 'İptal'}
                                            </button>
                                            <button type="button" onClick={() => {
                                                setShowGuestDropdown(false);
                                            }} className="text-[14px] text-[#1a73e8] font-medium hover:bg-blue-50 dark:hover:bg-blue-900/20 px-3 py-1.5 rounded transition-colors cursor-pointer">
                                                {tLocal('done') || 'Bitti'}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Nationality Selector Input */}
                            <div className="w-full sm:w-[150px] lg:w-[160px] flex-shrink-0 relative h-12">
                                <NationalitySelect 
                                    value={nationality} 
                                    onChange={(newNat) => {
                                        setNationality(newNat);
                                    }} 
                                    inputStyle={true} 
                                    rounded="rounded-lg"
                                    onToggle={(isOpen) => {
                                        if (isOpen) {
                                            setShowGuestDropdown(false);
                                            setIsDatePickerOpen(false);
                                        }
                                    }}
                                />
                            </div>

                            {/* Search / Update Button */}
                            <div className="flex-shrink-0">
                                <button
                                    type="button"
                                    onClick={handleSearch}
                                    className="h-12 px-5 bg-[#1a73e8] hover:bg-[#1557b0] text-white rounded-lg font-medium text-[14px] flex items-center justify-center gap-2 shadow-[0_1px_2px_rgba(60,64,67,0.3),0_1px_3px_1px_rgba(60,64,67,0.15)] hover:shadow-md transition-all active:scale-[0.98] cursor-pointer"
                                >
                                    <span className="material-symbols-outlined text-[20px]">search</span>
                                    <span className="hidden sm:inline">{tLocal('search') || 'Ara'}</span>
                                </button>
                            </div>
                        </div>

                        {/* Tab Bar Container - Google Style */}
                        <div className="relative">
                            {/* Sticky Tab Bar */}
                            <div className="flex items-center gap-8 border-b border-[#dadce0] dark:border-slate-700 mb-6 sticky top-0 bg-white dark:bg-[#202124] z-20 overflow-x-auto scrollbar-hide no-scrollbar py-0 transition-colors">
                                {tabs.map((tab, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setActiveTab(tab)}
                                        className={`py-3.5 text-[14px] whitespace-nowrap transition-all border-b-2 cursor-pointer ${
                                            activeTab === tab 
                                                ? 'border-[#1a73e8] text-[#1a73e8] font-medium' 
                                                : 'border-transparent text-[#5f6368] dark:text-slate-400 hover:text-[#202124] dark:hover:text-white font-normal'
                                        }`}
                                    >
                                        {tLocal(tabLabelMap[tab])}
                                    </button>
                                ))}
                            </div>

                            {/* Dynamic Tab Content */}
                            <div className="animate-in fade-in slide-in-from-bottom-2 duration-200">
                                {activeTab === 'Rooms & Rates' && (
                                    <div className="relative space-y-4">
                                        {/* Filters Bar - Google Chips Style */}
                                        <div className="flex flex-wrap items-center gap-3 mb-6 p-3 bg-white dark:bg-[#303134] rounded-xl border border-[#dadce0] dark:border-slate-700">
                                            <GoogleFilterDropdown
                                                icon="restaurant"
                                                prefixLabel={tLocal('boardType')}
                                                value={boardTypeFilter}
                                                onChange={setBoardTypeFilter}
                                                options={[
                                                    { value: 'ALL', label: `${tLocal('allBoards')} (${hotel?.rooms?.length || 0})`, icon: 'check_circle' },
                                                    ...Object.keys(BOARD_TYPES)
                                                        .filter(code => boardCounts[code] > 0)
                                                        .map(code => ({
                                                            value: code,
                                                            label: `${getBoardTypeLabel(code, currentLang)} (${boardCounts[code]})`,
                                                            icon: 'restaurant'
                                                        }))
                                                ]}
                                                defaultValue="ALL"
                                                placeholder={tLocal('allBoards')}
                                            />

                                            <div className="w-px h-5 bg-[#dadce0] dark:bg-slate-700 hidden md:block"></div>

                                            <GoogleFilterDropdown
                                                icon="event_busy"
                                                prefixLabel={tLocal('policyLabel')}
                                                value={cancelFilter}
                                                onChange={setCancelFilter}
                                                options={[
                                                    { value: 'ALL', label: `${tLocal('allPolicies')} (${hotel?.rooms?.length || 0})`, icon: 'rule' },
                                                    { value: 'FREE', label: `${tLocal('freeCancellation')} (${policyCounts.FREE})`, icon: 'verified' },
                                                    { value: 'NON_REFUNDABLE', label: `${tLocal('nonRefundable')} (${policyCounts.NON_REFUNDABLE})`, icon: 'cancel' }
                                                ]}
                                                defaultValue="ALL"
                                                placeholder={tLocal('allPolicies')}
                                            />

                                            <div className="ml-auto text-xs font-normal text-[#5f6368] dark:text-slate-400">
                                                {groupedRooms.length} {tLocal('roomTypesFound')}
                                            </div>
                                        </div>

                                        {isRoomsLoading ? (
                                            // Skeleton loading cards
                                            <div className="space-y-4 animate-in fade-in duration-300">
                                                {[...Array(3)].map((_, i) => (
                                                    <div key={i} className="flex flex-col rounded-xl border border-[#dadce0] dark:border-slate-700 bg-white dark:bg-[#202124] overflow-hidden">
                                                        <div className="flex flex-col md:flex-row">
                                                            <div className="md:w-72 h-56 md:h-auto shrink-0 relative overflow-hidden bg-slate-200 dark:bg-slate-800">
                                                                <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/30 dark:via-white/10 to-transparent" style={{ animationDelay: `${i * 0.15}s` }}></div>
                                                            </div>
                                                            <div className="flex-1 p-5 flex flex-col min-w-0">
                                                                <div className="flex justify-end gap-2 mb-3">
                                                                    <div className="relative overflow-hidden h-5 w-12 bg-slate-100 dark:bg-slate-700/60 rounded-md">
                                                                        <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/40 dark:via-white/10 to-transparent"></div>
                                                                    </div>
                                                                </div>
                                                                <div className="relative overflow-hidden h-6 w-3/5 bg-slate-200 dark:bg-slate-800 rounded-md mb-2">
                                                                    <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/40 dark:via-white/10 to-transparent"></div>
                                                                </div>
                                                                <div className="flex gap-3 mb-4">
                                                                    <div className="relative overflow-hidden h-4 w-16 bg-slate-100 dark:bg-slate-700/60 rounded-md"></div>
                                                                    <div className="relative overflow-hidden h-4 w-16 bg-slate-100 dark:bg-slate-700/60 rounded-md"></div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                                <div className="flex items-center justify-center gap-3 py-2">
                                                    <div className="size-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                                                    <p className="text-xs font-medium text-[#5f6368]">{tLocal('fetchingBestRates')}</p>
                                                </div>
                                            </div>
                                        ) : (
                                            <>{(groupedRooms || []).map((roomGroup, roomIndex) => {
                                                const roomName = decodeHTMLEntities(roomGroup.name);
                                                const isGroupExpanded = expandedRates[roomName];
                                                const ratesToShow = isGroupExpanded ? roomGroup.rates : roomGroup.rates.slice(0, 4);
                                                const hasMoreRates = roomGroup.rates.length > 4;

                                                return (
                                                    <div key={roomIndex} className="relative group transition-all duration-300 mb-6">
                                                        <div className="relative flex flex-col rounded-xl border border-[#dadce0] dark:border-slate-700 bg-white dark:bg-[#202124] shadow-none hover:shadow-md transition-shadow overflow-hidden">
                                                            {/* Room Top Section */}
                                                            <div className="flex flex-col md:flex-row">
                                                                {/* Image Section */}
                                                                <div
                                                                    className="md:w-72 h-56 md:h-auto relative overflow-hidden shrink-0 cursor-pointer group/room"
                                                                    onClick={() => {
                                                                        setSelectedRoomGroup(roomGroup);
                                                                        setIsRoomGalleryOpen(true);
                                                                    }}
                                                                >
                                                                    <img className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" src={roomGroup.images?.[0]?.url || images[roomIndex % images.length]} alt="" />
                                                                    {roomGroup.images?.length > 0 && (
                                                                        <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md text-white text-[11px] font-medium px-2.5 py-1 rounded-md flex items-center gap-1.5">
                                                                            <span className="material-symbols-outlined text-[14px]">photo_library</span> {roomGroup.images.length} {tLocal('photos')}
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                {/* Details Section */}
                                                                <div className="flex-1 p-5 flex flex-col min-w-0">
                                                                    <div className="flex items-start justify-between gap-3 mb-2">
                                                                        <h3 className="text-base sm:text-lg font-medium text-[#202124] dark:text-white leading-tight truncate" lang="en">{roomName}</h3>
                                                                        <div className="flex items-center gap-1.5 shrink-0">
                                                                            {roomGroup.squareMeter && (
                                                                                <span className="bg-[#f1f3f4] dark:bg-slate-700 text-[#3c4043] dark:text-slate-300 text-xs font-normal px-2.5 py-0.5 rounded-md">
                                                                                    {roomGroup.squareMeter}
                                                                                </span>
                                                                            )}
                                                                            <span className="bg-[#f1f3f4] dark:bg-slate-700 text-[#3c4043] dark:text-slate-300 text-xs font-normal px-2.5 py-0.5 rounded-md" lang="en">
                                                                                {roomGroup.roomPaxCapacity || roomGroup.maxAdult} Pax
                                                                            </span>
                                                                        </div>
                                                                    </div>

                                                                    <div className="flex gap-4 text-[#5f6368] dark:text-slate-400 text-xs mb-4">
                                                                        <span className="flex items-center gap-1">
                                                                            <span className="material-symbols-outlined text-[16px] text-[#5f6368]">group</span> {roomGroup.maxAdult} {roomGroup.maxAdult > 1 ? tLocal('adults') : tLocal('adult')}
                                                                        </span>
                                                                        {roomGroup.maxChildren > 0 && (
                                                                            <span className="flex items-center gap-1">
                                                                                <span className="material-symbols-outlined text-[16px] text-[#5f6368]">child_care</span> {roomGroup.maxChildren} {roomGroup.maxChildren > 1 ? tLocal('children') : tLocal('child')}
                                                                            </span>
                                                                        )}
                                                                    </div>

                                                                    {/* Attribute Chips */}
                                                                    <div className="flex flex-wrap gap-1.5 mt-auto pt-2">
                                                                        {(() => {
                                                                            const groupedAttributes = (roomGroup.attributes || []).reduce((acc, attr) => {
                                                                                const label = attr.names?.tr || attr.names?.en || attr.label;
                                                                                const lowerLabel = label?.toLowerCase() || '';

                                                                                const iconMatch = Object.entries(FACILITY_ICON_MAP).find(([id, data]) =>
                                                                                    lowerLabel.includes(data.label.toLowerCase()) ||
                                                                                    data.label.toLowerCase().includes(lowerLabel)
                                                                                );

                                                                                let iconKey = iconMatch ? iconMatch[1].icon : 'done';

                                                                                if (iconKey === 'done') {
                                                                                    if (lowerLabel.includes('bed') || lowerLabel.includes('king') || lowerLabel.includes('queen') || lowerLabel.includes('twin')) iconKey = 'bed';
                                                                                    else if (lowerLabel.includes('view')) {
                                                                                        if (lowerLabel.includes('sea') || lowerLabel.includes('ocean')) iconKey = 'waves';
                                                                                        else if (lowerLabel.includes('city') || lowerLabel.includes('skyline')) iconKey = 'location_city';
                                                                                        else if (lowerLabel.includes('garden') || lowerLabel.includes('park')) iconKey = 'park';
                                                                                        else if (lowerLabel.includes('mountain')) iconKey = 'terrain';
                                                                                        else iconKey = 'visibility';
                                                                                    }
                                                                                    else if (lowerLabel.includes('sqm') || lowerLabel.includes('meter') || lowerLabel.includes('square')) iconKey = 'straighten';
                                                                                    else if (lowerLabel.includes('bath') || lowerLabel.includes('shower') || lowerLabel.includes('tub')) iconKey = 'bathtub';
                                                                                    else if (lowerLabel.includes('coffee') || lowerLabel.includes('tea') || lowerLabel.includes('kettle')) iconKey = 'coffee_maker';
                                                                                    else if (lowerLabel.includes('breakfast')) iconKey = 'free_breakfast';
                                                                                    else if (lowerLabel.includes('safe') || lowerLabel.includes('security')) iconKey = 'lock';
                                                                                    else if (lowerLabel.includes('non-smoking') || lowerLabel.includes('smoke free')) iconKey = 'smoke_free';
                                                                                    else if (lowerLabel.includes('balcony') || lowerLabel.includes('terrace')) iconKey = 'balcony';
                                                                                }

                                                                                if (!acc[iconKey]) {
                                                                                    acc[iconKey] = { icon: iconKey, labels: new Set() };
                                                                                }
                                                                                acc[iconKey].labels.add(label);
                                                                                return acc;
                                                                            }, {});

                                                                            const items = Object.values(groupedAttributes);
                                                                            const visibleItems = items.slice(0, 10);
                                                                            const remainingCount = items.length - 10;
                                                                            return (
                                                                                <>
                                                                                    {visibleItems.map((item, i) => (
                                                                                        <div key={i} className="group/attr relative" title={Array.from(item.labels).join(', ')}>
                                                                                            <div className="size-8 rounded-lg bg-[#f8f9fa] dark:bg-[#303134] border border-[#dadce0] dark:border-slate-600 flex items-center justify-center text-[#5f6368] dark:text-slate-300 hover:text-[#1a73e8] hover:border-[#1a73e8] transition-colors cursor-help">
                                                                                                <span className="material-symbols-outlined text-[17px]">
                                                                                                    {item.icon}
                                                                                                </span>
                                                                                            </div>
                                                                                        </div>
                                                                                    ))}
                                                                                    {remainingCount > 0 && (
                                                                                        <div className="size-8 rounded-lg bg-[#f8f9fa] dark:bg-[#303134] border border-[#dadce0] dark:border-slate-600 flex items-center justify-center text-xs text-[#5f6368] font-normal">
                                                                                            +{remainingCount}
                                                                                        </div>
                                                                                    )}
                                                                                </>
                                                                            );
                                                                        })()}
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Rates List Section - Google Style */}
                                                            <div className="border-t border-[#dadce0] dark:border-slate-700 bg-[#f8f9fa] dark:bg-[#303134]/30 p-4 sm:p-5 space-y-3">
                                                                <div className="flex items-center justify-between mb-1 text-xs text-[#5f6368] dark:text-slate-400">
                                                                    <span className="font-medium">{tLocal('availableRates')}</span>
                                                                    <span>{tLocal('pricesIncludeTaxesAndFees')}</span>
                                                                </div>

                                                                {ratesToShow.map((rateItem, rateIdx) => {
                                                                    const ratePrice = rateItem.hubRateModel?.price?.calculatedAmount || rateItem.hubRateModel?.price?.totalPaymentAmount || rateItem.price || 0;
                                                                    const currency = rateItem.hubRateModel?.price?.currency || agencyCurrency || 'USD';
                                                                    const isSelected = selectedRooms.some(r => r.hubRateModel?.rateCode === rateItem.hubRateModel?.rateCode);
                                                                    const boardType = rateItem.hubRateModel?.boardCode || 'RO';
                                                                    const isFreeCancel = rateItem.hubRateModel?.refundable ?? (rateItem.hubRateModel?.price?.cancellationPolicies?.[0]?.amount === 0);

                                                                    return (
                                                                        <div
                                                                            key={rateIdx}
                                                                            onClick={() => {
                                                                                if (ratePrice <= 0 && !isSelected) return;
                                                                                toggleRoomSelection(roomName, ratePrice, roomName, rateItem);
                                                                            }}
                                                                            className={`relative p-3.5 sm:p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3 transition-all duration-200 border ${
                                                                                ratePrice > 0 ? 'cursor-pointer' : 'cursor-not-allowed opacity-80'
                                                                            } ${
                                                                                isSelected 
                                                                                    ? 'bg-[#e8f0fe] dark:bg-blue-950/40 border-[#1a73e8] shadow-sm' 
                                                                                    : 'bg-white dark:bg-[#202124] border-[#dadce0] dark:border-slate-700 hover:border-[#bdc1c6] shadow-none'
                                                                            }`}
                                                                        >
                                                                            <div className="flex items-center gap-3 w-full sm:w-auto">
                                                                                <div className={`size-9 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                                                                                    isSelected 
                                                                                        ? 'bg-[#1a73e8] text-white' 
                                                                                        : 'bg-[#f1f3f4] dark:bg-slate-700 text-[#5f6368] dark:text-slate-300'
                                                                                }`}>
                                                                                    <span className="material-symbols-outlined text-[18px]">{isSelected ? 'check' : 'add'}</span>
                                                                                </div>
                                                                                <div className="flex-1 min-w-0">
                                                                                    <div className="flex items-center gap-2 mb-1">
                                                                                        <p className="font-medium text-sm text-[#202124] dark:text-white">
                                                                                            {rateItem.hubRateModel?.boardName || getBoardTypeLabel(boardType, currentLang)}
                                                                                        </p>
                                                                                        {isSelected && (
                                                                                            <span className="bg-[#1a73e8] text-white text-[10px] font-medium px-2 py-0.5 rounded uppercase" lang="en">
                                                                                                {tLocal('selected')}
                                                                                            </span>
                                                                                        )}
                                                                                    </div>
                                                                                    <div className="flex flex-wrap items-center gap-2">
                                                                                        <RefundPolicyTooltip
                                                                                            isRefundable={isFreeCancel}
                                                                                            textOverride={isFreeCancel ? tLocal('freeCancellation') : tLocal('nonRefundable')}
                                                                                            className={`text-[11px] font-medium px-2 py-0.5 rounded ${
                                                                                                isFreeCancel 
                                                                                                    ? 'bg-[#e6f4ea] text-[#137333] border border-[#ceead6] dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800' 
                                                                                                    : 'bg-[#f1f3f4] text-[#5f6368] border border-[#dadce0] dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                                                                                            }`}
                                                                                        />
                                                                                        <div className="group/cancel relative">
                                                                                            <span className="text-xs text-[#1a73e8] hover:underline cursor-pointer">
                                                                                                {tLocal('viewPolicies')}
                                                                                            </span>
                                                                                            <div className="absolute bottom-full left-0 mb-2 w-72 p-4 bg-white dark:bg-[#202124] text-[#202124] dark:text-white rounded-lg shadow-xl opacity-0 invisible group-hover/cancel:opacity-100 group-hover/cancel:visible transition-all z-[100] border border-[#dadce0] dark:border-slate-700 duration-200">
                                                                                                <div className="flex items-center gap-2 mb-3 border-b border-[#dadce0] dark:border-slate-700 pb-2">
                                                                                                    <span className="material-symbols-outlined text-base text-[#1a73e8]">event_busy</span>
                                                                                                    <p className="text-xs font-semibold uppercase tracking-wider">{tLocal('cancellationTimeline')}</p>
                                                                                                </div>
                                                                                                <div className="space-y-3">
                                                                                                    {rateItem.hubRateModel?.price?.cancellationPolicies?.length > 0 ? (
                                                                                                        rateItem.hubRateModel.price.cancellationPolicies.map((policy, pIdx) => (
                                                                                                            <div key={pIdx} className="relative pl-3 border-l-2 border-[#1a73e8]">
                                                                                                                <div className="flex justify-between items-start mb-1 text-xs">
                                                                                                                    <span className="font-medium text-[#5f6368] dark:text-slate-400 uppercase">{tLocal('penalty')}</span>
                                                                                                                    <span className={`font-semibold ${policy.amount === 0 ? 'text-[#137333]' : 'text-[#d93025]'}`}>
                                                                                                                        {policy.currency} {policy.amount}
                                                                                                                    </span>
                                                                                                                </div>
                                                                                                                <p className="text-xs text-[#5f6368] dark:text-slate-400">{tLocal('from')}: {formatPolicyDate(policy.fromDate)}</p>
                                                                                                            </div>
                                                                                                        ))
                                                                                                    ) : <p className="text-xs text-[#5f6368] dark:text-slate-400 italic">{tLocal('standardPoliciesApply')}</p>}
                                                                                                </div>
                                                                                            </div>
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                            </div>

                                                                            <div className="flex items-center gap-4 w-full sm:w-auto border-t sm:border-t-0 sm:border-l border-[#dadce0] dark:border-slate-700 pt-3 sm:pt-0 sm:pl-4 justify-between sm:justify-end">
                                                                                <div className="text-right">
                                                                                    <div className="flex items-baseline justify-end gap-1">
                                                                                        <span className="text-xs font-normal text-[#1a73e8]">{getCurrencySymbol(currency, currencySymbolMap)}</span>
                                                                                        <p className="text-xl font-medium text-[#1a73e8] dark:text-blue-400 leading-none">
                                                                                            {ratePrice.toFixed(2)}
                                                                                        </p>
                                                                                    </div>
                                                                                    <p className="text-[11px] text-[#5f6368] dark:text-slate-400 font-normal mt-0.5">Toplam Tutar</p>
                                                                                </div>
                                                                                <div className={`px-4 py-2 rounded-lg font-medium text-xs uppercase tracking-wider transition-colors cursor-pointer ${
                                                                                    isSelected 
                                                                                        ? 'bg-[#202124] dark:bg-white text-white dark:text-[#202124]' 
                                                                                        : 'bg-[#1a73e8] hover:bg-[#1557b0] text-white shadow-none'
                                                                                }`}>
                                                                                    {isSelected ? tLocal('remove') : tLocal('selectRate')}
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })}

                                                                {hasMoreRates && (
                                                                    <button
                                                                        onClick={() => setExpandedRates(prev => ({ ...prev, [roomName]: !prev[roomName] }))}
                                                                        className="w-full py-2.5 rounded-lg bg-white dark:bg-[#202124] border border-[#dadce0] dark:border-slate-700 text-xs font-medium text-[#1a73e8] hover:bg-[#f8f9fa] dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                                                                    >
                                                                        <span className="material-symbols-outlined text-[18px]">{isGroupExpanded ? 'keyboard_arrow_up' : 'expand_more'}</span>
                                                                        {isGroupExpanded ? (tLocal('showLessRates') || 'Daha Az Fiyat Göster') : `${roomGroup.rates.length - 4} ${tLocal('moreRates') || 'Daha Fazla Fiyat'}`}
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}</>
                                        )}
                                    </div>
                                )}

                                {activeTab === 'Overview' && (
                                    <div className="bg-white dark:bg-[#202124] p-6 rounded-xl border border-[#dadce0] dark:border-slate-700">
                                        <h2 className="text-lg font-medium mb-4 text-[#202124] dark:text-white">About the Property</h2>

                                        <div className="space-y-4">
                                            {hotel.descriptions?.length > 0 ? (
                                                hotel.descriptions.map((desc, idx) => (
                                                    <div key={idx} className="space-y-1">
                                                        <h4 className="text-xs font-semibold uppercase text-[#1a73e8] tracking-wider">{desc.type}</h4>
                                                        <p
                                                            className="text-sm text-[#3c4043] dark:text-slate-300 leading-relaxed"
                                                            dangerouslySetInnerHTML={{ __html: desc.text }}
                                                        />
                                                    </div>
                                                ))
                                            ) : (
                                                <p
                                                    className="text-sm text-[#3c4043] dark:text-slate-300 leading-relaxed"
                                                    dangerouslySetInnerHTML={{ __html: hotel.description || "Experience the ultimate luxury at our TOG-certified property." }}
                                                />
                                            )}
                                        </div>

                                        {/* Address & Contact Details */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 pt-6 border-t border-[#dadce0] dark:border-slate-700">
                                            <div>
                                                <div className="flex items-center gap-2 mb-4">
                                                    <div className="size-8 rounded-lg bg-[#e8f0fe] text-[#1a73e8] flex items-center justify-center">
                                                        <span className="material-symbols-outlined text-base">location_on</span>
                                                    </div>
                                                    <h3 className="text-sm font-medium">Location Details</h3>
                                                </div>
                                                <div className="grid grid-cols-1 gap-2.5">
                                                    {hotel.address?.street && (
                                                        <div className="p-3 rounded-lg bg-[#f8f9fa] dark:bg-[#303134] border border-[#dadce0] dark:border-slate-700">
                                                            <span className="text-[10px] font-medium text-[#5f6368] uppercase tracking-wider block mb-0.5">Street Address</span>
                                                            <p className="text-xs font-normal text-[#202124] dark:text-white leading-relaxed">{hotel.address.street}</p>
                                                        </div>
                                                    )}
                                                    <div className="grid grid-cols-2 gap-2.5">
                                                        {(hotel.address?.zipCode || hotel.address?.postalCode) && (
                                                            <div className="p-3 rounded-lg bg-[#f8f9fa] dark:bg-[#303134] border border-[#dadce0] dark:border-slate-700">
                                                                <span className="text-[10px] font-medium text-[#5f6368] uppercase tracking-wider block mb-0.5">Postal / Zip</span>
                                                                <p className="text-xs font-normal text-[#202124] dark:text-white">{hotel.address.zipCode || hotel.address.postalCode}</p>
                                                            </div>
                                                        )}
                                                        {hotel.address?.cityName && (
                                                            <div className="p-3 rounded-lg bg-[#f8f9fa] dark:bg-[#303134] border border-[#dadce0] dark:border-slate-700">
                                                                <span className="text-[10px] font-medium text-[#5f6368] uppercase tracking-wider block mb-0.5">City</span>
                                                                <p className="text-xs font-normal text-[#202124] dark:text-white">{hotel.address.cityName}</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                    {hotel.address?.countryName && (
                                                        <div className="p-3 rounded-lg bg-[#f8f9fa] dark:bg-[#303134] border border-[#dadce0] dark:border-slate-700">
                                                            <span className="text-[10px] font-medium text-[#5f6368] uppercase tracking-wider block mb-0.5">Country</span>
                                                            <div className="flex items-center gap-1.5">
                                                                <span className="text-xs font-normal text-[#202124] dark:text-white">{hotel.address.countryName}</span>
                                                                <span className="text-[10px] text-[#5f6368]">({hotel.address.countryCode})</span>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div>
                                                <div className="flex items-center gap-2 mb-4">
                                                    <div className="size-8 rounded-lg bg-[#e8f0fe] text-[#1a73e8] flex items-center justify-center">
                                                        <span className="material-symbols-outlined text-base">contact_phone</span>
                                                    </div>
                                                    <h3 className="text-sm font-medium">Contact Property</h3>
                                                </div>
                                                <div className="grid grid-cols-1 gap-2.5">
                                                    {hotel.contact?.phoneNumber && (
                                                        <div className="p-3 rounded-lg bg-[#f8f9fa] dark:bg-[#303134] border border-[#dadce0] dark:border-slate-700 flex items-center justify-between">
                                                            <div className="min-w-0">
                                                                <span className="text-[10px] font-medium text-[#5f6368] uppercase tracking-wider block mb-0.5">Phone Number</span>
                                                                <p className="text-xs font-normal text-[#202124] dark:text-white truncate">{hotel.contact.phoneNumber}</p>
                                                            </div>
                                                            <a href={`tel:${hotel.contact.phoneNumber}`} className="size-8 rounded-md bg-white dark:bg-slate-800 flex items-center justify-center text-[#1a73e8] border border-[#dadce0] dark:border-slate-600">
                                                                <span className="material-symbols-outlined text-base">call</span>
                                                            </a>
                                                        </div>
                                                    )}
                                                    {hotel.contact?.email && (
                                                        <div className="p-3 rounded-lg bg-[#f8f9fa] dark:bg-[#303134] border border-[#dadce0] dark:border-slate-700 flex items-center justify-between">
                                                            <div className="min-w-0">
                                                                <span className="text-[10px] font-medium text-[#5f6368] uppercase tracking-wider block mb-0.5">Email Address</span>
                                                                <p className="text-xs font-normal text-[#202124] dark:text-white truncate">{hotel.contact.email}</p>
                                                            </div>
                                                            <a href={`mailto:${hotel.contact.email}`} className="size-8 rounded-md bg-white dark:bg-slate-800 flex items-center justify-center text-[#1a73e8] border border-[#dadce0] dark:border-slate-600">
                                                                <span className="material-symbols-outlined text-base">mail</span>
                                                            </a>
                                                        </div>
                                                    )}
                                                    {hotel.contact?.website && (
                                                        <div className="p-3 rounded-lg bg-[#f8f9fa] dark:bg-[#303134] border border-[#dadce0] dark:border-slate-700 flex items-center justify-between">
                                                            <div className="min-w-0">
                                                                <span className="text-[10px] font-medium text-[#5f6368] uppercase tracking-wider block mb-0.5">Official Website</span>
                                                                <p className="text-xs font-normal text-[#1a73e8] truncate">{hotel.contact.website}</p>
                                                            </div>
                                                            <a href={hotel.contact.website} target="_blank" rel="noopener noreferrer" className="size-8 rounded-md bg-white dark:bg-slate-800 flex items-center justify-center text-[#1a73e8] border border-[#dadce0] dark:border-slate-600">
                                                                <span className="material-symbols-outlined text-base">open_in_new</span>
                                                            </a>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'Amenities' && (
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                        {(hotel.facilities || []).map((amenity, idx) => {
                                            const id = typeof amenity === 'object' ? (amenity.facilityId || amenity.id) : amenity;
                                            const match = FACILITY_ICON_MAP[Number(id)];

                                            return (
                                                <div key={idx} className="bg-white dark:bg-[#202124] p-3.5 rounded-xl border border-[#dadce0] dark:border-slate-700 flex items-center gap-3">
                                                    <div className="size-8 rounded-lg bg-[#e8f0fe] dark:bg-blue-900/30 flex items-center justify-center text-[#1a73e8] shrink-0">
                                                        <span className="material-symbols-outlined text-base">
                                                            {match ? match.icon : 'done'}
                                                        </span>
                                                    </div>
                                                    <span className="text-xs text-[#3c4043] dark:text-slate-200">
                                                        {decodeHTMLEntities(amenity.names?.tr || amenity.names?.en || amenity.label || (match ? match.label : 'Amenity'))}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}

                                {activeTab === 'Transportation' && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {(hotel.transportations || []).map((t, idx) => (
                                            <div key={idx} className="bg-white dark:bg-[#202124] p-4 rounded-xl border border-[#dadce0] dark:border-slate-700">
                                                <div className="flex items-center gap-3 mb-3">
                                                    <div className="size-9 rounded-lg bg-[#e8f0fe] dark:bg-blue-900/30 flex items-center justify-center text-[#1a73e8] shrink-0">
                                                        <span className="material-symbols-outlined text-lg">
                                                            {t.type === 'AIRPORT' ? 'flight_takeoff' : t.type === 'RAIL' ? 'train' : 'directions_car'}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <h4 className="font-medium text-xs text-[#202124] dark:text-white">{t.name || (t.type === 'AIRPORT' ? 'Airport' : t.type === 'RAIL' ? 'Train Station' : 'Location')}</h4>
                                                        <p className="text-[10px] text-[#1a73e8] font-normal">
                                                            {t.type === 'AIRPORT' ? 'By Flight' : t.type === 'RAIL' ? 'By Rail' : 'By Road'}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="space-y-1 text-xs text-[#5f6368] dark:text-slate-400">
                                                    <div className="flex justify-between">
                                                        <span>Distance:</span>
                                                        <span className="font-medium text-[#202124] dark:text-white">{t.distanceKm} km</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span>Duration:</span>
                                                        <span className="font-medium text-[#202124] dark:text-white">{t.durationMinutes} min</span>
                                                    </div>
                                                    {t.directions && (
                                                        <p className="text-[11px] text-[#70757a] italic pt-1 border-t border-[#dadce0] dark:border-slate-700">
                                                            Via {t.directions}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {activeTab === 'Policies' && (
                                    <div className="bg-white dark:bg-[#202124] p-6 rounded-xl border border-[#dadce0] dark:border-slate-700">
                                        <div className="flex items-center gap-2 mb-4">
                                            <div className="size-8 rounded-lg bg-[#e8f0fe] text-[#1a73e8] flex items-center justify-center">
                                                <span className="material-symbols-outlined text-base">info</span>
                                            </div>
                                            <h2 className="text-base font-medium">Hotel Policies</h2>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="p-4 rounded-xl bg-[#f8f9fa] dark:bg-[#303134] border border-[#dadce0] dark:border-slate-700">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <span className="material-symbols-outlined text-[#1a73e8] text-xl">login</span>
                                                    <div>
                                                        <p className="text-[10px] font-medium text-[#5f6368] uppercase tracking-wider">Standard Check-In</p>
                                                        <h4 className="text-base font-medium text-[#1a73e8]">{hotel.checkIn || '15:00'}</h4>
                                                    </div>
                                                </div>
                                                <p className="text-xs text-[#5f6368] dark:text-slate-400 leading-relaxed">
                                                    Guests are required to show a photo identification and credit card upon check-in.
                                                </p>
                                            </div>

                                            <div className="p-4 rounded-xl bg-[#f8f9fa] dark:bg-[#303134] border border-[#dadce0] dark:border-slate-700">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <span className="material-symbols-outlined text-[#1a73e8] text-xl">logout</span>
                                                    <div>
                                                        <p className="text-[10px] font-medium text-[#5f6368] uppercase tracking-wider">Standard Check-Out</p>
                                                        <h4 className="text-base font-medium text-[#1a73e8]">{hotel.checkOut || '11:00'}</h4>
                                                    </div>
                                                </div>
                                                <p className="text-xs text-[#5f6368] dark:text-slate-400 leading-relaxed">
                                                    Please ensure your balance is settled and keys are returned to the front desk.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'Reviews' && (
                                    <div className="bg-white dark:bg-[#202124] p-10 rounded-xl border border-[#dadce0] dark:border-slate-700 flex flex-col items-center justify-center text-center">
                                        <div className="size-12 rounded-full bg-[#f1f3f4] dark:bg-slate-700 flex items-center justify-center text-[#5f6368] dark:text-slate-300 mb-3 text-sm font-semibold uppercase">
                                            R
                                        </div>
                                        <h3 className="text-sm font-medium mb-1">Guest Reviews</h3>
                                        <p className="text-xs text-[#5f6368]">Real-time feedback from verified Travel of Globe guests.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Booking Sidebar - Google Travel Sticky Card with Full Summary Details */}
                    <div className="lg:col-span-4 h-fit">
                        <div className="lg:sticky lg:top-4 space-y-3 font-roboto">
                            <div className="bg-white dark:bg-[#202124] border border-[#dadce0] dark:border-slate-700 rounded-xl p-4 sm:p-5 shadow-sm">
                                {/* Instant Confirmation Alert */}
                                <div className="flex items-center gap-2 text-[#137333] dark:text-emerald-300 font-medium text-xs mb-3.5 bg-[#e6f4ea] dark:bg-emerald-950/40 p-2.5 rounded-lg border border-[#ceead6] dark:border-emerald-800">
                                    <span className="material-symbols-outlined text-base fill-1">bolt</span>
                                    <span>{tLocal('instantConfirmationAvailable')}</span>
                                </div>

                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-xs font-semibold text-[#5f6368] dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                        <span className="material-symbols-outlined text-sm text-[#1a73e8]">auto_awesome</span>
                                        {tLocal('reservationSummary')}
                                    </h3>
                                    <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-[#e8f0fe] text-[#1a73e8] border border-[#d2e3fc]">
                                        {selectedRooms.length} / {roomState.length} {tLocal('room')}
                                    </span>
                                </div>

                                {/* Hotel Info Preview Card */}
                                <div className="mb-3.5 rounded-xl overflow-hidden border border-[#dadce0] dark:border-slate-700 shadow-xs">
                                    <div className="relative h-24 overflow-hidden">
                                        <img
                                            src={hotel.images?.[0]?.url || hotel.images?.[0] || images?.[0] || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80'}
                                            alt={hotel.name}
                                            className="w-full h-full object-cover"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent"></div>
                                        <div className="absolute bottom-2 left-3 right-3">
                                            <div className="flex items-center gap-0.5 mb-0.5">
                                                {[...Array(Number(hotel.stars || hotel.starRating || 5))].map((_, i) => (
                                                    <span key={i} className="material-symbols-outlined text-[11px] text-[#fbbc04] fill-1">star</span>
                                                ))}
                                                {hotel.isRecommended && (
                                                    <span className="ml-1 bg-[#1a73e8] text-white text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded shadow-xs flex items-center gap-0.5">
                                                        <span className="material-symbols-outlined text-[10px] fill-1">thumb_up</span>
                                                        REC
                                                    </span>
                                                )}
                                            </div>
                                            <h4 className="font-semibold text-white text-xs uppercase tracking-tight leading-tight line-clamp-1">{hotel.name}</h4>
                                        </div>
                                    </div>
                                    <div className="p-2.5 bg-[#f8f9fa] dark:bg-[#303134] space-y-1.5 border-t border-[#dadce0] dark:border-slate-700">
                                        {(hotel.address || hotel.location) && (
                                            <div className="flex items-center gap-1.5">
                                                <span className="material-symbols-outlined text-xs text-[#1a73e8] shrink-0">location_on</span>
                                                <p className="text-[10px] font-normal text-[#5f6368] dark:text-slate-300 truncate">
                                                    {typeof hotel.address === 'object' 
                                                        ? (hotel.address?.addressLine || hotel.address?.street || `${hotel.address?.city || ''}, ${hotel.address?.country || ''}`) 
                                                        : (hotel.address || hotel.location || '')}
                                                </p>
                                            </div>
                                        )}
                                        <div className="flex gap-4">
                                            <div className="flex items-center gap-1">
                                                <span className="material-symbols-outlined text-[11px] text-[#1a73e8]">login</span>
                                                <span className="text-[9px] font-medium text-[#5f6368] dark:text-slate-400 uppercase tracking-wider">
                                                    {tLocal('in')}: {hotel.checkIn || '15:00'}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <span className="material-symbols-outlined text-[11px] text-[#1a73e8]">logout</span>
                                                <span className="text-[9px] font-medium text-[#5f6368] dark:text-slate-400 uppercase tracking-wider">
                                                    {tLocal('out')}: {hotel.checkOut || '11:00'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Dates & Guests Stay Box */}
                                <div className="grid grid-cols-2 gap-2 mb-3.5">
                                    <div className="p-2 rounded-lg bg-[#f8f9fa] dark:bg-[#303134] border border-[#dadce0] dark:border-slate-700">
                                        <p className="text-[8px] font-semibold text-[#5f6368] dark:text-slate-400 uppercase tracking-wider mb-0.5">{tLocal('checkIn')}</p>
                                        <p className="text-xs font-semibold text-[#1a73e8] leading-tight">{formattedDates.start}</p>
                                    </div>
                                    <div className="p-2 rounded-lg bg-[#f8f9fa] dark:bg-[#303134] border border-[#dadce0] dark:border-slate-700">
                                        <p className="text-[8px] font-semibold text-[#5f6368] dark:text-slate-400 uppercase tracking-wider mb-0.5">{tLocal('checkOut')}</p>
                                        <p className="text-xs font-semibold text-[#1a73e8] leading-tight">{formattedDates.end}</p>
                                    </div>
                                    <div className="col-span-2 p-2 rounded-lg bg-[#f8f9fa] dark:bg-[#303134] border border-[#dadce0] dark:border-slate-700 flex justify-between items-center">
                                        <div className="flex items-center gap-1.5">
                                            <span className="material-symbols-outlined text-xs text-[#1a73e8]">nights_stay</span>
                                            <span className="text-[9px] font-semibold text-[#5f6368] dark:text-slate-300 uppercase tracking-wider">
                                                {nights} {nights > 1 ? tLocal('nights') : tLocal('night')} {tLocal('stay')}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <span className="material-symbols-outlined text-xs text-[#1a73e8]">group</span>
                                            <span className="text-[9px] font-semibold text-[#5f6368] dark:text-slate-300 uppercase tracking-wider">
                                                {totalAdults} {totalAdults > 1 ? tLocal('adults') : tLocal('adult')}
                                                {totalChildren > 0 ? `, ${totalChildren} ${totalChildren > 1 ? tLocal('children') : tLocal('child')}` : ''} ({nationality})
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Selected Rooms List */}
                                <div className="space-y-2 mb-3.5">
                                    <div className="flex items-center justify-between">
                                        <p className="text-[9px] font-semibold text-[#5f6368] dark:text-slate-400 uppercase tracking-wider">
                                            {tLocal('selectedRooms') || 'Seçilen Odalar'}
                                        </p>
                                    </div>
                                    {selectedRooms.length > 0 ? (
                                        selectedRooms.map((room, idx) => {
                                            const hubRate = room.hubRateModel || {};
                                            const priceObj = hubRate.price || {};
                                            const isFreeCancel = hubRate.refundable ?? (priceObj.cancellationPolicies?.[0]?.amount === 0);
                                            const boardType = hubRate.boardCode || room.boardCode || 'RO';
                                            const roomPrice = priceObj.netTotal || priceObj.grossTotal || room.rate || 0;
                                            const roomCurr = priceObj.currency || room.currency || agencyCurrency || 'EUR';
                                            const cancellationPolicies = priceObj.cancellationPolicies || room.cancellationPolicies || [];

                                            return (
                                                <div key={idx} className="relative p-3 rounded-lg bg-[#f8f9fa] dark:bg-[#303134] border border-[#dadce0] dark:border-slate-700">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setSelectedRooms(prev => prev.filter((_, i) => i !== idx));
                                                        }}
                                                        className="absolute top-2 right-2 size-6 text-[#5f6368] hover:text-[#d93025] flex items-center justify-center rounded-full hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                                                        title="Kaldır"
                                                    >
                                                        <span className="material-symbols-outlined text-[16px]">close</span>
                                                    </button>
                                                    <div className="pr-6 mb-1.5">
                                                        <div className="flex items-start gap-1.5">
                                                            <div className="size-4 rounded bg-[#e8f0fe] text-[#1a73e8] text-[9px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                                                                {idx + 1}
                                                            </div>
                                                            <span className="font-medium text-[#202124] dark:text-white text-xs line-clamp-2">
                                                                {room.name}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#dadce0] dark:border-slate-700">
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="bg-white dark:bg-slate-800 border border-[#dadce0] dark:border-slate-600 text-[#3c4043] dark:text-slate-300 text-[10px] px-1.5 py-0.5 rounded font-normal">{getBoardTypeLabel(boardType)}</span>
                                                            <RefundPolicyTooltip
                                                                isRefundable={isFreeCancel}
                                                                textOverride={isFreeCancel ? tLocal('freeCancellation') : tLocal('nonRefundable')}
                                                                className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${isFreeCancel ? 'bg-[#e6f4ea] text-[#137333]' : 'bg-[#f1f3f4] text-[#5f6368]'}`}
                                                            />
                                                        </div>
                                                        <div className="text-right">
                                                            <span className="text-xs font-bold text-[#202124] dark:text-white">
                                                                {formatPrice(roomPrice, roomCurr)}
                                                            </span>
                                                            <p className="text-[9px] text-[#70757a]">
                                                                {nights} {nights > 1 ? tLocal('nights') : tLocal('night')}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {/* Cancellation Policy Details */}
                                                    <div className="mt-2 pt-1.5 border-t border-dashed border-[#dadce0] dark:border-slate-700">
                                                        {cancellationPolicies.length > 0 ? (
                                                            <div className="space-y-1">
                                                                <p className="text-[9px] font-semibold text-[#5f6368] dark:text-slate-400 uppercase tracking-wider mb-0.5">
                                                                    {tLocal('cancellationPolicy')}
                                                                </p>
                                                                {cancellationPolicies.map((policy, pIdx) => (
                                                                    <div key={pIdx} className="flex justify-between items-center text-[10px]">
                                                                        <span className="text-[#5f6368] dark:text-slate-400">
                                                                            {policy.fromDate ? formatPolicyDate(policy.fromDate) : (policy.amount === 0 ? tLocal('flexible') : tLocal('cancellationPenalty'))}
                                                                        </span>
                                                                        <span className={`font-medium px-1.5 py-0.2 rounded text-[9px] ${
                                                                            policy.amount === 0 ? 'bg-[#e6f4ea] text-[#137333]' : 'bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300'
                                                                        }`}>
                                                                            {policy.amount === 0 ? tLocal('freeCancel') : formatPrice(policy.amount, policy.currency || roomCurr)}
                                                                        </span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <span className="text-[10px] text-[#70757a] flex items-center gap-1">
                                                                <span className="material-symbols-outlined text-[11px]">info</span>
                                                                {tLocal('standardCancellation')}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <div className="p-4 rounded-lg bg-[#f8f9fa] dark:bg-[#303134] border border-dashed border-[#dadce0] dark:border-slate-700 text-center">
                                            <span className="material-symbols-outlined text-2xl text-[#70757a] mb-1">bed</span>
                                            <p className="text-xs text-[#5f6368] dark:text-slate-400">
                                                {tLocal('pleaseSelectARoom')}
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Daily Prices Section (If available) */}
                                {selectedRooms.length > 0 && selectedRooms.some(r => (r.dailyPrices && r.dailyPrices.length > 0) || (r.hubRateModel?.price?.dailyPrices && r.hubRateModel?.price?.dailyPrices.length > 0)) && (
                                    <div className="mb-3.5 p-2.5 rounded-lg bg-[#f8f9fa] dark:bg-[#303134] border border-[#dadce0] dark:border-slate-700">
                                        <p className="text-[9px] font-semibold text-[#5f6368] dark:text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                            <span className="material-symbols-outlined text-xs text-[#1a73e8]">calendar_month</span>
                                            {tLocal('dailyRates')}
                                        </p>
                                        {selectedRooms.map((room, idx) => {
                                            const dpList = room.dailyPrices || room.hubRateModel?.price?.dailyPrices || [];
                                            if (dpList.length === 0) return null;
                                            const roomCurr = room.hubRateModel?.price?.currency || room.currency || agencyCurrency || 'EUR';

                                            return (
                                                <div key={idx} className="mb-2 last:mb-0">
                                                    {selectedRooms.length > 1 && (
                                                        <p className="text-[8px] font-semibold text-[#70757a] uppercase tracking-wider mb-1">
                                                            {tLocal('room')} {idx + 1}
                                                        </p>
                                                    )}
                                                    <div className="space-y-1">
                                                        {dpList.map((dp, dpIdx) => (
                                                            <div key={dpIdx} className="flex justify-between items-center text-[10px]">
                                                                <span className="text-[#5f6368] dark:text-slate-400">
                                                                    {new Date(dp.date).toLocaleDateString(currentLang, { day: '2-digit', month: 'short', year: 'numeric' })}
                                                                </span>
                                                                <span className="font-semibold text-[#202124] dark:text-white">
                                                                    {formatPrice(dp.calculatedAmount || dp.amount || 0, roomCurr)}
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}

                                {/* Total Price Section */}
                                <div className="mb-4 pt-3 border-t border-[#dadce0] dark:border-slate-700">
                                    <div className="flex items-baseline justify-between mb-1">
                                        <div>
                                            <span className="text-xs text-[#5f6368] dark:text-slate-400 font-medium block">{tLocal('totalStayPrice')}</span>
                                            <span className="text-[10px] text-[#70757a]">{tLocal('pricesIncludeTaxesAndFees')}</span>
                                        </div>
                                        <span className="text-xl font-bold text-[#1a73e8] dark:text-blue-400">
                                            {formatPrice(
                                                selectedRooms.reduce((sum, r) => sum + (r.hubRateModel?.price?.netTotal || r.hubRateModel?.price?.grossTotal || r.rate || 0), 0),
                                                selectedRooms[0]?.hubRateModel?.price?.currency || selectedRooms[0]?.currency || agencyCurrency || 'EUR'
                                            )}
                                        </span>
                                    </div>
                                </div>

                                <button
                                    onClick={handleInstantReservation}
                                    disabled={selectedRooms.length === 0 || isCheckingRates}
                                    className={`w-full font-medium py-3 rounded-lg transition-all text-sm shadow-sm flex items-center justify-center gap-2 active:scale-[0.98] mb-2 ${selectedRooms.length > 0 && !isCheckingRates
                                        ? 'bg-[#1a73e8] hover:bg-[#1557b0] text-white cursor-pointer'
                                        : 'bg-[#f1f3f4] dark:bg-slate-800 text-[#70757a] cursor-not-allowed'
                                        } ${isCheckingRates ? 'animate-pulse' : ''}`}>
                                    {isCheckingRates ? (
                                        <>
                                            <span className="size-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                                            <span>{tLocal('checkingBestRates')}</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>{tLocal('instantReservation')}</span>
                                            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                                        </>
                                    )}
                                </button>
                                <p className="text-[10px] text-center text-[#70757a] dark:text-slate-500 font-medium">
                                    {tLocal('b2bAgencyRatesApplied')}
                                </p>
                            </div>

                            <div className="bg-white dark:bg-[#202124] border border-[#dadce0] dark:border-slate-700 rounded-xl p-3.5 flex items-center gap-3">
                                <div className="size-9 rounded-lg bg-[#e8f0fe] dark:bg-slate-800 flex items-center justify-center text-[#1a73e8] shrink-0">
                                    <span className="material-symbols-outlined text-lg">verified_user</span>
                                </div>
                                <div>
                                    <p className="text-[10px] font-medium text-[#70757a] uppercase tracking-wider leading-none mb-0.5">{tLocal('securePayment')}</p>
                                    <p className="text-xs font-semibold text-[#202124] dark:text-white">{tLocal('protectedBooking')}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <Footer />
            <BookingConfirmationModal
                isOpen={isBookingModalOpen}
                onClose={() => setIsBookingModalOpen(false)}
                hotelName={hotel.name}
            />

            <ImageLightbox
                images={lightboxImages}
                currentIndex={currentImageIndex}
                isOpen={isLightboxOpen}
                onClose={() => setIsLightboxOpen(false)}
                setCurrentIndex={setCurrentImageIndex}
                description={activeLightboxDescription}
            />

            <RoomGalleryModal
                isOpen={isRoomGalleryOpen}
                onClose={() => setIsRoomGalleryOpen(false)}
                roomName={selectedRoomGroup?.name}
                images={selectedRoomGroup?.images?.length > 0 ? selectedRoomGroup.images.map(img => img.url) : images}
                description={selectedRoomGroup?.rates?.[0]?.description}
                attributes={selectedRoomGroup?.attributes}
                maxAdult={selectedRoomGroup?.maxAdult}
                maxChildren={selectedRoomGroup?.maxChildren}
                squareMeter={selectedRoomGroup?.squareMeter}
            />

            <MapModal
                isOpen={isMapModalOpen}
                onClose={() => setIsMapModalOpen(false)}
                hotel={hotel}
            />
            <ShareModal
                isOpen={isShareModalOpen}
                onClose={() => setIsShareModalOpen(false)}
                hotel={hotel}
            />
        </div >
    );
};

export default HotelDetail;
