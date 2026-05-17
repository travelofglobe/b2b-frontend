import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useTranslation } from 'react-i18next';
import Breadcrumbs from '../components/Breadcrumbs';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import "../datepicker-custom.css";
import { mockHotels } from '../data/mockHotels';
import NationalitySelect from '../components/NationalitySelect';
import { hotelService } from '../services/hotelService';
import { useToast } from '../context/ToastContext';
import { parseGuestsParam, serializeGuestsParam } from '../utils/searchParamsUtils';
import { getBoardTypeLabel, getBoardTypeDescription, BOARD_TYPES } from '../utils/boardTypeUtils';
import { FACILITY_ICON_MAP } from './MapView';
import Tooltip from '../components/Tooltip';
import RefundPolicyTooltip from '../components/RefundPolicyTooltip';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
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

    return (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/95 backdrop-blur-xl animate-in fade-in duration-300" onClick={onClose}>
            {/* Top Bar */}
            <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-10">
                <div className="text-white/70 font-black tracking-widest text-xs uppercase">
                    {currentIndex + 1} / {images.length} Photos
                </div>
                <div className="flex items-center gap-3">
                    {description && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsDescriptionVisible(!isDescriptionVisible);
                            }}
                            className={`size-12 rounded-full border border-white/10 flex items-center justify-center transition-all group ${isDescriptionVisible ? 'bg-primary text-white shadow-[0_0_20px_rgba(255,59,92,0.3)]' : 'bg-white/10 text-white/70 hover:bg-white/20'}`}
                            title={isDescriptionVisible ? "Hide Info" : "Show Info"}
                        >
                            <span className="material-symbols-outlined text-2xl">{isDescriptionVisible ? 'visibility_off' : 'info'}</span>
                        </button>
                    )}
                    <button
                        onClick={onClose}
                        className="size-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all group"
                    >
                        <span className="material-symbols-outlined text-3xl group-hover:rotate-90 transition-transform">close</span>
                    </button>
                </div>
            </div>

            {/* Navigation Buttons */}
            <button
                onClick={handlePrevious}
                className="absolute left-6 size-14 rounded-full bg-white/5 hover:bg-white/10 text-white flex items-center justify-center transition-all group z-20 border border-white/5"
            >
                <span className="material-symbols-outlined text-4xl group-hover:-translate-x-1 transition-transform">chevron_left</span>
            </button>

            <button
                onClick={handleNext}
                className="absolute right-6 size-14 rounded-full bg-white/5 hover:bg-white/10 text-white flex items-center justify-center transition-all group z-20 border border-white/5"
            >
                <span className="material-symbols-outlined text-4xl group-hover:translate-x-1 transition-transform">chevron_right</span>
            </button>

            {/* Main Image Container - Full Space */}
            <div className="absolute inset-0 flex items-center justify-center p-4 md:p-20 lg:p-32" onClick={(e) => e.stopPropagation()}>
                <img
                    src={images[currentIndex]}
                    className="max-w-full max-h-full object-contain shadow-[0_0_80px_rgba(0,0,0,0.5)] rounded-2xl animate-in zoom-in-95 duration-500"
                    alt={`Photo ${currentIndex + 1}`}
                />
            </div>

            {/* Room Description - Floating Glass Card */}
            {description && isDescriptionVisible && (
                <div className="absolute bottom-32 left-8 max-w-sm w-full z-40 hidden md:block" onClick={(e) => e.stopPropagation()}>
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

            {/* Mobile Description Toggle/Indicator could go here, but for now let's focus on the desktop experience requested */}

            {/* Thumbnail Strip - Fixed at bottom */}
            <div className="absolute bottom-6 left-0 right-0 flex justify-center px-6 z-30 pointer-events-none" onClick={(e) => e.stopPropagation()}>
                <div className="bg-black/60 backdrop-blur-2xl p-3 rounded-3xl border border-white/10 flex gap-2 overflow-x-auto no-scrollbar max-w-full pointer-events-auto shadow-2xl">
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
        </div>
    );
};

const ShareModal = ({ isOpen, onClose, hotel }) => {
    if (!isOpen) return null;

    const shareUrl = window.location.href;
    const hotelName = hotel.names?.tr || hotel.names?.en || hotel.name;
    const hotelLocation = hotel.address ? `${hotel.address.cityName}, ${hotel.address.countryName || ''}` : '';
    
    // Fix image path: handle both array of objects and simple string array
    const hotelImage = (hotel.images?.[0]?.url || hotel.images?.[0] || hotel.image || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=800');

    const shareOptions = [
        { 
            name: 'Facebook', 
            icon: (
                <svg className="size-7 fill-white" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
            ), 
            color: 'bg-[#1877F2]', 
            shadow: 'shadow-[#1877F2]/30' 
        },
        { 
            name: 'X', 
            icon: (
                <svg className="size-6 fill-white" viewBox="0 0 24 24">
                    <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932 6.064-6.932zm-1.292 19.49h2.039L6.486 3.24H4.298l13.311 17.403z"/>
                </svg>
            ), 
            color: 'bg-black', 
            shadow: 'shadow-black/30' 
        },
        { 
            name: 'Whatsapp', 
            icon: (
                <svg className="size-7 fill-white" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.414 0 .018 5.396.015 12.03c0 2.12.554 4.189 1.605 6.006L0 24l6.117-1.605a11.77 11.77 0 005.925 1.585h.005c6.637 0 12.032-5.396 12.035-12.032a11.76 11.76 0 00-3.517-8.487"/>
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

    return (
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
        </div>
    );
};

const BookingConfirmationModal = ({ isOpen, onClose, hotelName }) => {
    if (!isOpen) return null;
    return (
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
        </div>
    );
};


const MapModal = ({ isOpen, onClose, hotel }) => {
    if (!isOpen || !hotel) return null;

    const lat = hotel.coordinates?.lat || hotel.lat;
    const lng = hotel.coordinates?.lon || hotel.lng || hotel.lon;

    if (!lat || !lng) return null;

    // Custom Marker Icon
    const customIcon = L.divIcon({
        className: 'custom-hotel-marker',
        html: `
            <div class="relative flex flex-col items-center">
                <div class="bg-primary text-white px-3 py-1.5 rounded-xl font-black text-[10px] uppercase tracking-tighter shadow-2xl border-2 border-white flex items-center gap-1.5 whitespace-nowrap group animate-in zoom-in duration-500">
                    <span class="material-symbols-outlined text-[14px] fill-1">apartment</span>
                    ${hotel.names?.tr || hotel.names?.en || hotel.name}
                </div>
                <div class="w-0.5 h-3 bg-primary shadow-lg"></div>
                <div class="size-2 rounded-full bg-primary ring-4 ring-primary/20 shadow-xl"></div>
            </div>
        `,
        iconSize: [200, 50],
        iconAnchor: [100, 50],
    });

    return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 sm:p-6 md:p-10 animate-in fade-in duration-300">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={onClose}></div>
            
            <div className="relative w-full max-w-5xl bg-white dark:bg-slate-900 rounded-[32px] overflow-hidden shadow-2xl flex flex-col h-[70vh] sm:h-[80vh] animate-in zoom-in-95 duration-500 border border-white/20">
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
                                {hotel.names?.tr || hotel.names?.en || hotel.name}
                            </p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
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
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                        />
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
                                        {hotel.names?.tr || hotel.names?.en || hotel.name}
                                    </h4>
                                    <p className="text-[10px] text-slate-500 font-bold leading-tight">
                                        {hotel.address ? `${hotel.address.street}, ${hotel.address.cityName}` : hotel.location}
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
        </div>
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
        fetchingBestRates: "Fetching best rates..."
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
        fetchingBestRates: "En iyi fiyatlar sorgulanıyor..."
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
        allPolicies: "Tutte le Politiche",
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
    const currentLang = i18n.language || 'en';
    const tLocal = (key) => {
        return LOCAL_TRANSLATIONS[currentLang]?.[key] || LOCAL_TRANSLATIONS['en']?.[key] || key;
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

    const images = dynamicHotel?.images?.map(img => img.url) || (dynamicHotel?.image ? [dynamicHotel.image] : []);

    // -- Lightbox State --
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [lightboxImages, setLightboxImages] = useState([]);
    const [activeLightboxDescription, setActiveLightboxDescription] = useState('');

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
        return parseDateParam(searchParams.get('checkin')) || tomorrow;
    });
    const [checkOutDate, setCheckOutDate] = useState(() => {
        return parseDateParam(searchParams.get('checkout')) || dayAfter;
    });

    const [nationality, setNationality] = useState(() => {
        return searchParams.get('nationality') || 'TR';
    });

    const [roomState, setRoomState] = useState(() => {
        const guestsParam = searchParams.get('guests');
        return parseGuestsParam(guestsParam);
    });

    const [showGuestDropdown, setShowGuestDropdown] = useState(false);
    const guestWrapperRef = useRef(null);
    const datePickerRef = useRef(null);
    const lastFetchRef = useRef('');

    // Computed totals
    const totalAdults = roomState.reduce((sum, r) => sum + r.adults, 0);
    const totalChildren = roomState.reduce((sum, r) => sum + r.children, 0);
    const totalRooms = roomState.length;

    const [activeTab, setActiveTab] = useState('Rooms & Rates');
    const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
    const [selectedRooms, setSelectedRooms] = useState([]);
    const [isCheckingRates, setIsCheckingRates] = useState(false);
    
    // -- Local Filters --
    const [boardTypeFilter, setBoardTypeFilter] = useState('ALL');
    const [cancelFilter, setCancelFilter] = useState('ALL');
    const [expandedRates, setExpandedRates] = useState({}); // { roomKey: boolean }
    const [isMapModalOpen, setIsMapModalOpen] = useState(false);
    const [isLiked, setIsLiked] = useState(false);
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);

    const hotel = dynamicHotel || {};

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
                rates: group.rates.filter(r => r.hubRateModel?.boardType === boardTypeFilter)
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

        return result;
    }, [hotel.rooms, boardTypeFilter, cancelFilter]);

    // Fetch data when search parameters or hotel ID change
    useEffect(() => {
        const fetchKey = `${id}-${searchParams.toString()}`;
        if (lastFetchRef.current === fetchKey) return;
        lastFetchRef.current = fetchKey;

        // Clear previous selection when a new search is initiated
        setSelectedRooms([]);

        const fetchCheckIn = parseDateParam(searchParams.get('checkin')) || tomorrow;
        const fetchCheckOut = parseDateParam(searchParams.get('checkout')) || dayAfter;
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

    const toggleRoomSelection = (roomType, rate, roomName, fullRateData) => {
        const isSelected = selectedRooms.some(r => 
            (r.hubRateModel?.rateCode === fullRateData?.hubRateModel?.rateCode) || 
            (r.type === roomType && r.name === roomName && r.rate === rate)
        );

        if (!isSelected && selectedRooms.length >= 4) {
            toastError('You can select a maximum of 4 rates per reservation.');
            return;
        }

        setSelectedRooms(prev => {
            const index = prev.findIndex(r => 
                (r.hubRateModel?.rateCode === fullRateData?.hubRateModel?.rateCode) || 
                (r.type === roomType && r.name === roomName && r.rate === rate)
            );
            
            if (index > -1) {
                // Remove if already selected
                return prev.filter((_, i) => i !== index);
            } else {
                // Add to selection (limit already checked above)
                return [...prev, { 
                    type: roomType, 
                    rate, 
                    name: roomName, 
                    currency: fullRateData?.currency || '$',
                    hubRateModel: fullRateData?.hubRateModel 
                }];
            }
        });
    };

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

    const formatDateForUrl = (date) => {
        if (!date) return '';
        const d = new Date(date);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return `${day}-${month}-${year}`;
    };

    const handleSearch = () => {
        const guestsParam = serializeGuestsParam(roomState);
        const params = new URLSearchParams();
        params.set('checkin', formatDateForUrl(checkInDate));
        params.set('checkout', formatDateForUrl(checkOutDate));
        params.set('guests', guestsParam);
        params.set('nationality', nationality);
        params.set('q', hotel.names?.tr || hotel.names?.en || hotel.name || '');

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
                navigate(`/hotel/checkout/guests?sessionId=${sid}`);
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
                    <p className="text-slate-500 font-black uppercase tracking-[0.3em] text-xs">Finding the best rates...</p>
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
        <div className="relative flex min-h-screen flex-col bg-background-light dark:bg-background-dark text-slate-900 dark:text-white transition-colors duration-200 font-sans">
            <Header />

            <main className="flex-1 max-w-[1440px] mx-auto w-full px-6 lg:px-20 py-8">
                <div className="mb-6 flex items-center justify-between">
                    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                        {hotel.locationBreadcrumbs?.map((bc, i) => {
                            const name = bc.name?.translations?.tr || bc.name?.translations?.en || bc.name?.defaultName;
                            return (
                                <React.Fragment key={bc.locationId}>
                                    <button
                                        onClick={() => handleBreadcrumbClick(bc.locationId, name)}
                                        className="text-xs font-bold text-slate-400 dark:text-slate-500 whitespace-nowrap hover:text-primary transition-colors cursor-pointer"
                                    >
                                        {name}
                                    </button>
                                    {i < hotel.locationBreadcrumbs.length - 1 && (
                                        <span className="material-symbols-outlined text-xs text-slate-300">chevron_right</span>
                                    )}
                                </React.Fragment>
                            );
                        }) || <Breadcrumbs />}
                    </div>
                    <Link to={`/hotels?${searchParams.toString()}`} className="flex items-center gap-1.5 text-sm font-bold text-primary group">
                        <span className="material-symbols-outlined text-[18px] group-hover:-translate-x-1 transition-transform">arrow_back</span>
                        {tLocal('backToSearch')}
                    </Link>
                </div>

                {/* Hotel Title & Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <h1 className="text-4xl font-black tracking-tight">{hotel.names?.tr || hotel.names?.en || hotel.name}</h1>
                            <div className="flex text-amber-400">
                                {[...Array(hotel.hotelStar?.star || 5)].map((_, i) => (
                                    <span key={i} className="material-symbols-outlined fill-1 text-lg">star</span>
                                ))}
                            </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-4 mt-3">
                            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                                <span className="material-symbols-outlined text-sm text-primary">location_on</span>
                                <span className="font-semibold text-sm">
                                    {hotel.address ? `${hotel.address.street}, ${hotel.address.cityName}` : hotel.location}
                                </span>
                            </div>

                            <button
                                onClick={() => setIsMapModalOpen(true)}
                                className="text-primary text-sm font-bold hover:underline">
                                {tLocal('showOnMap')}
                            </button>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 mr-4">
                            <button 
                                onClick={() => setIsLiked(!isLiked)}
                                className={`size-12 rounded-2xl flex items-center justify-center transition-all ${isLiked ? 'bg-red-50 text-red-500 border-red-100 shadow-[0_0_15px_rgba(239,68,68,0.15)]' : 'bg-white dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700 hover:text-red-500'} border shadow-sm active:scale-90`}
                            >
                                <span className={`material-symbols-outlined text-2xl ${isLiked ? 'fill-1' : ''}`}>favorite</span>
                            </button>
                            <button 
                                onClick={() => setIsShareModalOpen(true)}
                                className="size-12 rounded-2xl bg-white dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:text-primary transition-all shadow-sm active:scale-90"
                            >
                                <span className="material-symbols-outlined text-2xl">share</span>
                            </button>
                        </div>
                        <div className="flex flex-col items-end border-l border-slate-200 dark:border-slate-700 pl-6">
                            <span className="text-lg font-black text-slate-900 dark:text-white leading-none">{hotel.ratingLabel}</span>
                            <span className="text-xs text-slate-500 font-bold mt-1">1,240 {tLocal('reviewsLabel')}</span>
                            <span className="text-[10px] text-primary font-black flex items-center gap-1 mt-1 uppercase tracking-tighter">
                                <span className="material-symbols-outlined text-xs fill-1">trending_up</span> {tLocal('highlyPopular')}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Quick Info Badges */}
                <div className="flex flex-wrap gap-2 mb-8">
                    {(hotel.facilities?.slice(0, 5).map(f => f.names?.tr || f.names?.en) || ['Free WiFi', 'Free Parking', 'Breakfast Available']).map((item, i) => (
                        <span key={i} className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 rounded-full text-xs font-bold border border-slate-200 dark:border-slate-700 hover:border-primary/50 transition-all cursor-default backdrop-blur-md shadow-sm">
                            <span className="material-symbols-outlined text-sm text-primary">check_circle</span> {item}
                        </span>
                    ))}
                </div>

                {/* Benton Grid Gallery */}
                <div className="grid grid-cols-1 md:grid-cols-4 grid-rows-2 gap-3 h-[540px] mb-8 overflow-hidden rounded-[32px] relative group/gallery">
                    <div className="md:col-span-2 md:row-span-2 relative overflow-hidden ring-1 ring-white/10 shadow-2xl cursor-pointer" onClick={() => openLightbox(0, images)}>
                        <img className="w-full h-full object-cover transition-all duration-700 hover:scale-105" src={images[0]} alt={hotel.name} />
                        <div className="absolute bottom-6 left-6 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-4 py-2 rounded-2xl text-xs font-black shadow-2xl border border-white/20">
                            1 / {images.length} {tLocal('photos')}
                        </div>
                    </div>
                    <div className="hidden md:block relative overflow-hidden ring-1 ring-white/10 cursor-pointer" onClick={() => openLightbox(1, images)}>
                        <img className="w-full h-full object-cover transition-all duration-700 hover:scale-105" src={images[1] || images[0]} alt="" />
                        <div className="absolute top-4 right-4 flex gap-2 translate-y-2 opacity-0 group-hover/gallery:translate-y-0 group-hover/gallery:opacity-100 transition-all duration-500">
                            <button className="size-9 rounded-xl bg-white/90 dark:bg-slate-800/90 backdrop-blur-md flex items-center justify-center text-slate-800 dark:text-white shadow-xl hover:text-red-500 transition-colors" onClick={(e) => e.stopPropagation()}><span className="material-symbols-outlined text-xl">favorite</span></button>
                            <button className="size-9 rounded-xl bg-white/90 dark:bg-slate-800/90 backdrop-blur-md flex items-center justify-center text-slate-800 dark:text-white shadow-xl hover:text-primary transition-colors" onClick={(e) => e.stopPropagation()}><span className="material-symbols-outlined text-xl">share</span></button>
                        </div>
                    </div>
                    <div className="hidden md:block relative overflow-hidden ring-1 ring-white/10 cursor-pointer" onClick={() => openLightbox(2, images)}>
                        <img className="w-full h-full object-cover transition-all duration-700 hover:scale-105" src={images[2] || images[0]} alt="" />
                    </div>
                    <div className="hidden md:block relative overflow-hidden ring-1 ring-white/10 cursor-pointer" onClick={() => openLightbox(3, images)}>
                        <img className="w-full h-full object-cover transition-all duration-700 hover:scale-105" src={images[3] || images[0]} alt="" />
                    </div>
                    <div className="hidden md:block relative overflow-hidden ring-1 ring-white/10 group/viewall cursor-pointer" onClick={() => openLightbox(0, images)}>
                        <img className="w-full h-full object-cover group-hover/viewall:scale-110 blur-[2px] transition-all duration-700" src={images[4] || images[0]} alt="" />
                        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex flex-col items-center justify-center text-white text-center p-4">
                            <span className="material-symbols-outlined text-4xl mb-2 animate-bounce-slow">photo_library</span>
                            <span className="text-sm font-black uppercase tracking-widest">{tLocal('showAllPhotos')}</span>
                        </div>
                    </div>
                </div>


                {/* Main Content Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    <div className="lg:col-span-8">
                        {/* Compact Search Bar - Now aligned with room cards */}
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded-[24px] shadow-md grid grid-cols-1 md:grid-cols-10 gap-2 mb-6 h-[72px]">
                            <div className="md:col-span-4 relative group">
                                <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800 border border-transparent group-hover:bg-slate-100 dark:group-hover:bg-slate-700/50 px-4 rounded-xl cursor-pointer transition-all h-full" onClick={() => datePickerRef.current?.setOpen(true)}>
                                    <span className="material-symbols-outlined text-primary text-xl shrink-0">calendar_month</span>
                                    <div className="flex flex-col flex-1 min-w-0">
                                        <div className="flex items-center justify-between w-full mb-0.5">
                                            <label className="text-[8px] uppercase tracking-wider font-bold text-slate-400">{tLocal('checkInOut')}</label>
                                            {checkInDate && checkOutDate && (
                                                <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-primary/10 text-primary border border-primary/20 animate-in fade-in zoom-in duration-300">
                                                    <span className="material-symbols-outlined text-[12px] leading-none">bedtime</span>
                                                    <span className="text-[9px] font-black uppercase tracking-tight">
                                                        {Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24))} {tLocal('nights')}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                        <DatePicker
                                            ref={datePickerRef}
                                            selected={checkInDate}
                                            onChange={(dates) => {
                                                const [start, end] = dates;
                                                setCheckInDate(start);
                                                setCheckOutDate(end);
                                            }}
                                            startDate={checkInDate}
                                            endDate={checkOutDate}
                                            selectsRange
                                            minDate={new Date()}
                                            maxDate={checkInDate && !checkOutDate ? new Date(checkInDate.getTime() + 30 * 24 * 60 * 60 * 1000) : null}
                                            monthsShown={2}
                                            locale="en-GB"
                                            className="bg-transparent border-none outline-none focus:outline-none focus:ring-0 w-full p-0 text-[13px] font-black text-slate-900 dark:text-white cursor-pointer whitespace-nowrap"
                                            wrapperClassName="w-full"
                                            dateFormat="dd MMM yyyy"
                                            calendarClassName="shadow-2xl border-none font-sans mt-4"
                                            popperPlacement="bottom-start"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="md:col-span-3 relative group/guest" ref={guestWrapperRef}>
                                <button
                                    onClick={() => setShowGuestDropdown(!showGuestDropdown)}
                                    className="w-full h-full flex items-center gap-3 px-4 bg-slate-50 dark:bg-slate-800 border border-transparent hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-xl transition-all text-left"
                                >
                                    <span className="material-symbols-outlined text-primary text-xl shrink-0 group-hover/guest:scale-110 transition-transform">group</span>
                                    <div className="flex flex-col flex-1 min-w-0">
                                        <label className="text-[8px] uppercase tracking-wider font-bold text-slate-400 mb-0.5">{tLocal('guestsAndRooms')}</label>
                                        <span className="text-[13px] font-black text-slate-900 dark:text-white whitespace-nowrap block truncate">
                                            {totalAdults} {totalAdults > 1 ? tLocal('adults') : tLocal('adult')}, {totalChildren} {totalChildren > 1 ? tLocal('children') : tLocal('child')}
                                        </span>
                                    </div>
                                    <span className="material-symbols-outlined text-slate-400 text-lg group-hover/guest:translate-y-0.5 transition-transform">expand_more</span>
                                </button>

                                {showGuestDropdown && (
                                    <div className="absolute top-full left-0 right-0 mt-3 bg-white dark:bg-slate-900 rounded-[28px] border border-slate-100 dark:border-slate-700 shadow-2xl p-5 z-[100] max-h-[60vh] overflow-y-auto animate-in fade-in slide-in-from-top-4 duration-300">
                                        {roomState.map((room, index) => (
                                            <div key={index} className="mb-4 pb-4 border-b border-slate-100 dark:border-slate-800 last:mb-0 last:pb-0 last:border-0">
                                                <div className="flex items-center justify-between mb-3">
                                                    <div className="text-[9px] font-black uppercase text-slate-400 tracking-widest">{tLocal('room')} {index + 1}</div>
                                                    {roomState.length > 1 && (
                                                        <button onClick={() => removeRoom(index)} className="text-red-500 hover:text-red-700 text-[9px] font-black uppercase tracking-widest">{tLocal('remove')}</button>
                                                    )}
                                                </div>

                                                <div className="flex items-center justify-between mb-3">
                                                    <div className="text-xs font-black uppercase tracking-tight">{tLocal('adults')}</div>
                                                    <div className="flex items-center gap-3">
                                                        <button onClick={() => updateRoom(index, 'adults', Math.max(1, room.adults - 1))} className="size-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:bg-primary hover:text-white transition-colors"><span className="material-symbols-outlined text-base">remove</span></button>
                                                        <span className="w-4 text-center text-xs font-black">{room.adults}</span>
                                                        <button onClick={() => updateRoom(index, 'adults', Math.min(6, room.adults + 1))} className="size-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:bg-primary hover:text-white transition-colors"><span className="material-symbols-outlined text-base">add</span></button>
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-between mb-3">
                                                    <div className="text-xs font-black uppercase tracking-tight">{tLocal('children')}</div>
                                                    <div className="flex items-center gap-3">
                                                        <button onClick={() => updateRoom(index, 'children', Math.max(0, room.children - 1))} className="size-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:bg-primary hover:text-white transition-colors"><span className="material-symbols-outlined text-base">remove</span></button>
                                                        <span className="w-4 text-center text-xs font-black">{room.children}</span>
                                                        <button onClick={() => updateRoom(index, 'children', Math.min(4, room.children + 1))} className="size-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:bg-primary hover:text-white transition-colors"><span className="material-symbols-outlined text-base">add</span></button>
                                                    </div>
                                                </div>

                                                {room.children > 0 && (
                                                    <div className="grid grid-cols-2 gap-2 pt-1">
                                                        {room.childAges.map((age, ageIdx) => (
                                                            <div key={ageIdx} className="space-y-1">
                                                                <label className="text-[8px] font-black uppercase text-slate-400">{tLocal('child')} {ageIdx + 1} {tLocal('childAge')}</label>
                                                                <select
                                                                    value={age}
                                                                    onChange={(e) => updateChildAge(index, ageIdx, e.target.value)}
                                                                    className="w-full h-8 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-[10px] px-1 font-black focus:border-primary focus:ring-0"
                                                                >
                                                                    {[...Array(18)].map((_, i) => <option key={i} value={i}>{i} {tLocal('yr')}</option>)}
                                                                </select>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ))}

                                        {roomState.length < 4 && (
                                            <button
                                                onClick={addRoom}
                                                className="w-full py-3 mt-2 bg-primary/5 text-primary rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-primary/10 transition-all border border-dashed border-primary/20 flex items-center justify-center gap-2"
                                            >
                                                <span className="material-symbols-outlined text-sm">add_circle</span>
                                                {tLocal('addAnotherRoom')}
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="md:col-span-2 relative group/nat">
                                <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 border border-transparent hover:bg-slate-100 dark:hover:bg-slate-700/50 px-3 rounded-xl transition-all h-full">
                                    <div className="flex flex-col flex-1 min-w-0">
                                        <label className="text-[8px] uppercase tracking-wider font-bold text-slate-400 mb-0.5">{tLocal('nationality')}</label>
                                        <NationalitySelect
                                            value={nationality}
                                            onChange={setNationality}
                                            compact={true}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="md:col-span-1 h-full">
                                <button
                                    onClick={handleSearch}
                                    className="w-full h-full bg-primary text-white rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-primary/20 flex items-center justify-center group"
                                >
                                    <span className="material-symbols-outlined text-2xl group-hover:rotate-12 transition-transform">search</span>
                                </button>
                            </div>
                        </div>
                        {/* Tab Bar Container */}
                        <div className="relative">
                            {/* Sticky Tab Bar */}
                            <div className="flex items-center gap-8 border-b border-slate-200 dark:border-slate-800 mb-8 sticky top-[64px] bg-background-light dark:bg-background-dark z-20 overflow-x-auto no-scrollbar py-2 transition-all duration-300">
                                {tabs.map((tab, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setActiveTab(tab)}
                                        className={`py-4 text-sm font-black whitespace-nowrap transition-all border-b-2 ${activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
                                    >
                                        {tLocal(tabLabelMap[tab])}
                                    </button>
                                ))}
                            </div>

                            {/* Dynamic Tab Content */}
                            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                                {activeTab === 'Rooms & Rates' && (
                                    <div className="relative space-y-4">
                                        {/* Local Filters Bar */}
                                        <div className="flex flex-wrap items-center gap-4 mb-6 p-4 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl rounded-3xl border border-white/20">
                                            <div className="flex items-center gap-2">
                                                <span className="material-symbols-outlined text-sm text-primary">restaurant</span>
                                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{tLocal('boardType')}</span>
                                                <select 
                                                    value={boardTypeFilter} 
                                                    onChange={(e) => setBoardTypeFilter(e.target.value)}
                                                    className="bg-transparent border-none text-xs font-bold focus:ring-0 cursor-pointer"
                                                >
                                                    <option value="ALL">{tLocal('allBoards')}</option>
                                                    {Object.keys(BOARD_TYPES).map(code => (
                                                        <option key={code} value={code}>{getBoardTypeLabel(code, currentLang)}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 hidden md:block"></div>
                                            <div className="flex items-center gap-2">
                                                <span className="material-symbols-outlined text-sm text-primary">event_busy</span>
                                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{tLocal('policyLabel')}</span>
                                                <select 
                                                    value={cancelFilter} 
                                                    onChange={(e) => setCancelFilter(e.target.value)}
                                                    className="bg-transparent border-none text-xs font-bold focus:ring-0 cursor-pointer"
                                                >
                                                    <option value="ALL">{tLocal('allPolicies')}</option>
                                                    <option value="FREE">{tLocal('freeCancellation')}</option>
                                                    <option value="NON_REFUNDABLE">{tLocal('nonRefundable')}</option>
                                                </select>
                                            </div>
                                            <div className="ml-auto text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                {groupedRooms.length} {tLocal('roomTypesFound')}
                                            </div>
                                        </div>

                                        {isRoomsLoading ? (
                                            // Skeleton loading cards
                                            <div className="space-y-4 animate-in fade-in duration-300">
                                                {[...Array(3)].map((_, i) => (
                                                    <div key={i} className="flex flex-col md:flex-row rounded-[28px] border border-white/40 dark:border-white/10 bg-white/40 dark:bg-slate-900/40 backdrop-blur-3xl shadow-xl overflow-hidden">
                                                        {/* Image skeleton */}
                                                        <div className="md:w-64 h-52 md:h-auto shrink-0 relative overflow-hidden bg-slate-200 dark:bg-slate-800 rounded-t-[28px] md:rounded-tr-none md:rounded-l-[28px]">
                                                            <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/30 dark:via-white/10 to-transparent" style={{ animationDelay: `${i * 0.15}s` }}></div>
                                                        </div>
                                                        {/* Content skeleton */}
                                                        <div className="flex-1 p-6 flex flex-col justify-between gap-4">
                                                            <div className="space-y-3">
                                                                {/* Title */}
                                                                <div className="relative overflow-hidden h-7 w-3/5 bg-slate-200 dark:bg-slate-800 rounded-xl">
                                                                    <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/40 dark:via-white/10 to-transparent" style={{ animationDelay: `${i * 0.15}s` }}></div>
                                                                </div>
                                                                {/* Subtitle */}
                                                                <div className="relative overflow-hidden h-4 w-2/5 bg-slate-100 dark:bg-slate-700/60 rounded-lg">
                                                                    <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/40 dark:via-white/10 to-transparent" style={{ animationDelay: `${i * 0.15 + 0.1}s` }}></div>
                                                                </div>
                                                                {/* Attribute tags */}
                                                                <div className="flex gap-2 mt-2">
                                                                    {[40, 56, 44, 36].map((w, j) => (
                                                                        <div key={j} className={`relative overflow-hidden h-6 bg-slate-100 dark:bg-slate-700/60 rounded-xl`} style={{ width: `${w}px` }}>
                                                                            <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/40 dark:via-white/10 to-transparent" style={{ animationDelay: `${i * 0.15 + j * 0.05}s` }}></div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                            {/* Price bar skeleton */}
                                                            <div className="relative overflow-hidden h-14 w-full bg-slate-100 dark:bg-slate-800/60 rounded-[18px]">
                                                                <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/40 dark:via-white/10 to-transparent" style={{ animationDelay: `${i * 0.15 + 0.2}s` }}></div>
                                                                {/* Inner price placeholders */}
                                                                <div className="absolute inset-0 flex items-center justify-between px-4">
                                                                    <div className="flex items-center gap-2">
                                                                        <div className="size-8 rounded-lg bg-slate-200 dark:bg-slate-700"></div>
                                                                        <div className="space-y-1.5">
                                                                            <div className="h-2.5 w-16 bg-slate-200 dark:bg-slate-700 rounded-md"></div>
                                                                            <div className="h-2 w-24 bg-slate-200 dark:bg-slate-700 rounded-md"></div>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="space-y-1 text-right">
                                                                            <div className="h-5 w-20 bg-slate-200 dark:bg-slate-700 rounded-md"></div>
                                                                            <div className="h-2 w-14 bg-slate-200 dark:bg-slate-700 rounded-md ml-auto"></div>
                                                                        </div>
                                                                        <div className="h-8 w-16 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                                {/* Loading label */}
                                                <div className="flex items-center justify-center gap-3 py-2">
                                                    <div className="size-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{tLocal('fetchingBestRates')}</p>
                                                </div>
                                            </div>
                                        ) : (
                                        <>{(groupedRooms || []).map((roomGroup, roomIndex) => {
                                            const roomName = roomGroup.name;
                                            const isGroupExpanded = expandedRates[roomName];
                                            const ratesToShow = isGroupExpanded ? roomGroup.rates : roomGroup.rates.slice(0, 4);
                                            const hasMoreRates = roomGroup.rates.length > 4;

                                            return (
                                                <div key={roomIndex} className="relative group transition-all duration-500 mb-8">
                                                    <div className={`relative flex flex-col rounded-[28px] border border-white/40 dark:border-white/10 bg-white/40 dark:bg-slate-900/40 backdrop-blur-3xl group-hover:bg-white/50 dark:group-hover:bg-slate-900/50 shadow-2xl shadow-black/5 z-10 hover:z-[70] transition-all duration-300`}>
                                                        
                                                        <div className="flex flex-col md:flex-row rounded-t-[28px]">
                                                            {/* Image Section */}
                                                            <div 
                                                                className="md:w-72 h-64 md:h-auto relative overflow-hidden shrink-0 cursor-pointer group/room isolation-isolate rounded-t-[28px] md:rounded-tr-none md:rounded-l-[28px]" 
                                                                onClick={() => {
                                                                    const roomImages = roomGroup.images?.length > 0 
                                                                        ? roomGroup.images.map(img => img.url) 
                                                                        : images;
                                                                    const roomDesc = roomGroup.rates?.[0]?.description || '';
                                                                    openLightbox(0, roomImages, roomDesc);
                                                                }}
                                                            >
                                                                <img className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 will-change-transform" src={roomGroup.images?.[0]?.url || images[roomIndex % images.length]} alt="" />
                                                                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/room:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[4px] will-change-transform">
                                                                    <div className="size-14 rounded-full bg-white/20 backdrop-blur-xl border border-white/40 flex items-center justify-center text-white scale-75 group-hover/room:scale-100 transition-all duration-500 shadow-2xl">
                                                                        <span className="material-symbols-outlined text-3xl">fullscreen</span>
                                                                    </div>
                                                                </div>
                                                                {roomGroup.images?.length > 0 && (
                                                                    <div className="absolute top-5 left-5 bg-black/40 backdrop-blur-xl text-white text-[10px] font-black px-3.5 py-2 rounded-2xl flex items-center gap-2 border border-white/20 shadow-lg">
                                                                        <span className="material-symbols-outlined text-sm">photo_library</span> {roomGroup.images.length} PHOTOS
                                                                    </div>
                                                                )}
                                                            </div>

                                                            {/* Details Section */}
                                                            <div className="flex-1 p-6 flex flex-col min-w-0">
                                                                <div className="relative">
                                                                    <div className="absolute top-0 right-0 flex gap-2">
                                                                        {roomGroup.squareMeter && (
                                                                            <span className="bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[8px] font-black px-2 py-1 rounded-lg uppercase tracking-wider border border-blue-500/10 backdrop-blur-md">
                                                                                {roomGroup.squareMeter}
                                                                            </span>
                                                                        )}
                                                                        <span className="bg-orange-500/10 text-orange-600 dark:text-orange-400 text-[8px] font-black px-2 py-1 rounded-lg uppercase tracking-wider border border-orange-500/10 backdrop-blur-md" lang="en">
                                                                            {roomGroup.roomPaxCapacity || roomGroup.maxAdult} Pax
                                                                        </span>
                                                                    </div>

                                                                    <div className="mb-4 pr-24">
                                                                        <h3 className="text-2xl font-black mb-1 uppercase tracking-tight text-slate-900 dark:text-white leading-tight truncate" lang="en">{roomName}</h3>
                                                                        <div className="flex gap-3 text-slate-500 dark:text-slate-400">
                                                                            <span className="flex items-center gap-1 text-[10px] font-bold uppercase">
                                                                                <span className="material-symbols-outlined text-sm text-primary">group</span> {roomGroup.maxAdult} {roomGroup.maxAdult > 1 ? tLocal('adults') : tLocal('adult')}
                                                                            </span>
                                                                            {roomGroup.maxChildren > 0 && (
                                                                                <span className="flex items-center gap-1 text-[10px] font-bold uppercase">
                                                                                    <span className="material-symbols-outlined text-sm text-primary">child_care</span> {roomGroup.maxChildren} {roomGroup.maxChildren > 1 ? tLocal('children') : tLocal('child')}
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    </div>

                                                                    <div className="flex flex-wrap gap-2 mb-6">
                                                                        {(() => {
                                                                            const groupedAttributes = (roomGroup.attributes || []).reduce((acc, attr) => {
                                                                                const label = attr.names?.tr || attr.names?.en || attr.label;
                                                                                const lowerLabel = label?.toLowerCase() || '';
                                                                                
                                                                                // 1. Try to find a match in the global facility icon map
                                                                                const iconMatch = Object.entries(FACILITY_ICON_MAP).find(([id, data]) => 
                                                                                    lowerLabel.includes(data.label.toLowerCase()) || 
                                                                                    data.label.toLowerCase().includes(lowerLabel)
                                                                                );
                                                                                
                                                                                let iconKey = iconMatch ? iconMatch[1].icon : 'done';

                                                                                // 2. Room-specific keyword fallbacks for even richer icons
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
                                                                            const visibleItems = items.slice(0, 12);
                                                                            const remainingCount = items.length - 12;
                                                                            return (
                                                                                <>
                                                                                    {visibleItems.map((item, i) => (
                                                                                        <div key={i} className="group/attr relative">
                                                                                            <div className="size-9 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center transition-all hover:bg-primary/10 hover:border-primary/30 cursor-help shadow-sm">
                                                                                                <span className="material-symbols-outlined text-lg text-primary">
                                                                                                    {item.icon}
                                                                                                </span>
                                                                                            </div>
                                                                                            {/* Elegant Tooltip with List */}
                                                                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-slate-900 dark:bg-slate-950 text-white text-[10px] font-black uppercase tracking-wider rounded-xl opacity-0 invisible group-hover/attr:opacity-100 group-hover/attr:visible transition-all whitespace-nowrap z-[200] shadow-2xl pointer-events-none border border-white/10 scale-95 group-hover/attr:scale-100 origin-bottom duration-300">
                                                                                                <div className="flex flex-col gap-1">
                                                                                                    {Array.from(item.labels).map((lbl, idx) => (
                                                                                                        <div key={idx} className="flex items-center gap-2">
                                                                                                            <div className="size-1 rounded-full bg-primary/40"></div>
                                                                                                            {lbl}
                                                                                                        </div>
                                                                                                    ))}
                                                                                                </div>
                                                                                                <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-900 dark:border-t-slate-950"></div>
                                                                                            </div>
                                                                                        </div>
                                                                                    ))}
                                                                                    {remainingCount > 0 && (
                                                                                        <div className="size-9 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center text-[10px] font-black text-slate-400">
                                                                                            +{remainingCount}
                                                                                        </div>
                                                                                    )}
                                                                                </>
                                                                            );
                                                                        })()}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Rates List Section */}
                                                        <div className="border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-black/20 p-4 sm:p-6 space-y-3 rounded-b-[28px]">
                                                            <div className="flex items-center justify-between mb-2">
                                                                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{tLocal('availableRates')}</h4>
                                                                <div className="text-[9px] font-bold text-slate-400 uppercase">{tLocal('pricesIncludeTaxesAndFees')}</div>
                                                            </div>
                                                            
                                                            {ratesToShow.map((rateItem, rateIdx) => {
                                                                const ratePrice = rateItem.hubRateModel?.price?.totalPaymentAmount || rateItem.hubRateModel?.price?.calculatedAmount || rateItem.price || 0;
                                                                const currency = rateItem.hubRateModel?.price?.currency || '$';
                                                                const isSelected = selectedRooms.some(r => r.hubRateModel?.rateCode === rateItem.hubRateModel?.rateCode);
                                                                const boardType = rateItem.hubRateModel?.boardType || 'RO';
                                                                const isFreeCancel = rateItem.hubRateModel?.refundable ?? (rateItem.hubRateModel?.price?.cancellationPolicies?.[0]?.amount === 0);

                                                                return (
                                                                    <div
                                                                        key={rateIdx}
                                                                        onClick={() => {
                                                                            if (ratePrice <= 0 && !isSelected) return;
                                                                            toggleRoomSelection(roomName, ratePrice, roomName, rateItem);
                                                                        }}
                                                                        className={`relative p-3 sm:p-4 rounded-[22px] flex flex-col sm:flex-row items-center justify-between gap-3 transition-all duration-300 border ${ratePrice > 0 ? 'cursor-pointer' : 'cursor-not-allowed opacity-80'} ${isSelected ? 'bg-primary/10 border-primary ring-2 ring-primary/5 shadow-lg' : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-white/5 hover:border-primary/50 shadow-sm'}`}
                                                                    >
                                                                        <div className="flex items-center gap-4 w-full sm:w-auto">
                                                                            <div className={`size-10 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300 ${isSelected ? 'bg-primary text-white shadow-md' : 'bg-slate-100 dark:bg-slate-700 text-slate-400'}`}>
                                                                                <span className="material-symbols-outlined text-xl font-black">{isSelected ? 'check' : 'add'}</span>
                                                                            </div>
                                                                            <div className="flex-1 min-w-0">
                                                                                <div className="flex items-center gap-2 mb-1">
                                                                                    <p className="font-black text-xs uppercase tracking-wide text-slate-900 dark:text-white">{getBoardTypeLabel(boardType, currentLang)}</p>
                                                                                    {isSelected && (
                                                                                        <span className="bg-primary text-white text-[7px] font-black px-2 py-0.5 rounded-full uppercase" lang="en">{tLocal('selected')}</span>
                                                                                    )}
                                                                                </div>
                                                                                <div className="flex flex-wrap items-center gap-2">
                                                                                    <RefundPolicyTooltip
                                                                                        isRefundable={isFreeCancel}
                                                                                        textOverride={isFreeCancel ? tLocal('freeCancellation') : tLocal('nonRefundable')}
                                                                                        className={`text-[8px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider ${isFreeCancel ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-orange-500/10 text-orange-500 border border-orange-500/20'}`}
                                                                                    />
                                                                                    <div className="group/cancel relative">
                                                                                        <span className="text-[8px] font-bold text-slate-400 hover:text-primary transition-colors cursor-help border-b border-dashed border-slate-300">{tLocal('viewPolicies')}</span>
                                                                                        <div className="absolute bottom-full left-0 mb-3 w-72 p-5 bg-slate-900 dark:bg-slate-950 text-white rounded-[24px] shadow-2xl opacity-0 invisible group-hover/cancel:opacity-100 group-hover/cancel:visible transition-all z-[100] border border-slate-700/50 backdrop-blur-xl scale-95 group-hover/cancel:scale-100 origin-bottom-left duration-300">
                                                                                            <div className="flex items-center gap-2 mb-4 border-b border-slate-800 pb-3">
                                                                                                <span className="material-symbols-outlined text-sm text-primary">event_busy</span>
                                                                                                <p className="text-[10px] uppercase font-black tracking-widest">{tLocal('cancellationTimeline')}</p>
                                                                                            </div>
                                                                                            <div className="space-y-4">
                                                                                                {rateItem.hubRateModel?.price?.cancellationPolicies?.length > 0 ? (
                                                                                                    rateItem.hubRateModel.price.cancellationPolicies.map((policy, idx) => (
                                                                                                        <div key={idx} className="relative pl-4 border-l-2 border-slate-800">
                                                                                                            <div className="flex justify-between items-start mb-1.5">
                                                                                                                <span className="text-[9px] font-black text-slate-400 uppercase">{tLocal('penalty')}</span>
                                                                                                                <span className={`text-[11px] font-black ${policy.amount === 0 ? 'text-emerald-400' : 'text-orange-400'}`} lang="en">
                                                                                                                    {policy.currency} {policy.amount}
                                                                                                                </span>
                                                                                                            </div>
                                                                                                            <p className="text-[9px] text-slate-300 font-bold">{tLocal('from')}: {formatPolicyDate(policy.fromDate)}</p>
                                                                                                        </div>
                                                                                                    ))
                                                                                                ) : <p className="text-[10px] text-slate-500 italic">{tLocal('standardPoliciesApply')}</p>}
                                                                                            </div>
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        </div>

                                                                        <div className="flex items-center gap-4 w-full sm:w-auto border-t sm:border-t-0 sm:border-l border-slate-200 dark:border-slate-800 pt-3 sm:pt-0 sm:pl-4 justify-between sm:justify-end">
                                                                            <div className="text-right">
                                                                                <div className="flex items-baseline justify-end gap-1">
                                                                                    <span className="text-[10px] font-black text-primary">{currency}</span>
                                                                                    <p className="text-2xl font-black text-primary leading-none tracking-tighter">
                                                                                        {ratePrice.toFixed(2)}
                                                                                    </p>
                                                                                </div>
                                                                                <p className="text-[7px] text-slate-400 font-black uppercase tracking-widest mt-1">Total Stay</p>
                                                                            </div>
                                                                            <div className={`px-4 py-2 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all duration-300 ${isSelected ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900' : 'bg-primary text-white hover:scale-105'}`}>
                                                                                {isSelected ? 'Remove' : 'Select Rate'}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}

                                                            {hasMoreRates && (
                                                                <button 
                                                                    onClick={() => setExpandedRates(prev => ({ ...prev, [roomName]: !prev[roomName] }))}
                                                                    className="w-full py-3 rounded-2xl bg-white/40 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-[10px] font-black uppercase tracking-widest text-primary hover:bg-white/60 transition-all flex items-center justify-center gap-2"
                                                                >
                                                                    <span className="material-symbols-outlined">{isGroupExpanded ? 'keyboard_arrow_up' : 'expand_more'}</span>
                                                                    {isGroupExpanded ? 'Show Less Rates' : `Show ${roomGroup.rates.length - 4} More Rates`}
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
                                    <div className="bg-white dark:bg-slate-900/50 p-10 rounded-[40px] border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-500">
                                        <h2 className="text-3xl font-black mb-6 uppercase tracking-tight">About the Property</h2>
                                        
                                        <div className="space-y-6">
                                            {hotel.descriptions?.length > 0 ? (
                                                hotel.descriptions.map((desc, idx) => (
                                                    <div key={idx} className="space-y-2">
                                                        <h4 className="text-[10px] font-black uppercase text-primary tracking-[0.2em]">{desc.type}</h4>
                                                        <p 
                                                            className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed font-medium"
                                                            dangerouslySetInnerHTML={{ __html: desc.text }}
                                                        />
                                                    </div>
                                                ))
                                            ) : (
                                                <p 
                                                    className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed font-medium"
                                                    dangerouslySetInnerHTML={{ __html: hotel.description || "Experience the ultimate luxury at our TOG-certified property." }}
                                                />
                                            )}
                                        </div>

                                        {/* Address & Contact Details */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mt-12 pt-12 border-t border-slate-100 dark:border-slate-800">
                                            <div>
                                                <div className="flex items-center gap-3 mb-8">
                                                    <div className="size-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                                                        <span className="material-symbols-outlined text-2xl">location_on</span>
                                                    </div>
                                                    <h3 className="text-2xl font-black uppercase tracking-tight">Location Details</h3>
                                                </div>
                                                <div className="grid grid-cols-1 gap-6">
                                                    {hotel.address?.street && (
                                                        <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Street Address</span>
                                                            <p className="text-sm font-bold text-slate-900 dark:text-white leading-relaxed">{hotel.address.street}</p>
                                                        </div>
                                                    )}
                                                    <div className="grid grid-cols-2 gap-4">
                                                        {(hotel.address?.zipCode || hotel.address?.postalCode) && (
                                                            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Postal / Zip Code</span>
                                                                <p className="text-sm font-bold text-slate-900 dark:text-white">{hotel.address.zipCode || hotel.address.postalCode}</p>
                                                            </div>
                                                        )}
                                                        {hotel.address?.cityName && (
                                                            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">City</span>
                                                                <p className="text-sm font-bold text-slate-900 dark:text-white">{hotel.address.cityName}</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                    {hotel.address?.countryName && (
                                                        <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Country</span>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-sm font-bold text-slate-900 dark:text-white">{hotel.address.countryName}</span>
                                                                <span className="text-[10px] font-black text-slate-400 uppercase">({hotel.address.countryCode})</span>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            
                                            <div>
                                                <div className="flex items-center gap-3 mb-8">
                                                    <div className="size-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                                                        <span className="material-symbols-outlined text-2xl">contact_phone</span>
                                                    </div>
                                                    <h3 className="text-2xl font-black uppercase tracking-tight">Contact Property</h3>
                                                </div>
                                                <div className="grid grid-cols-1 gap-6">
                                                    {hotel.contact?.phoneNumber && (
                                                        <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center justify-between group cursor-pointer hover:border-primary/30 transition-all">
                                                            <div className="min-w-0">
                                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Phone Number</span>
                                                                <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{hotel.contact.phoneNumber}</p>
                                                            </div>
                                                            <a href={`tel:${hotel.contact.phoneNumber}`} className="size-10 rounded-xl bg-white dark:bg-slate-900 flex items-center justify-center text-primary shadow-sm group-hover:scale-110 transition-transform">
                                                                <span className="material-symbols-outlined text-xl">call</span>
                                                            </a>
                                                        </div>
                                                    )}
                                                    {hotel.contact?.email && (
                                                        <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center justify-between group cursor-pointer hover:border-primary/30 transition-all">
                                                            <div className="min-w-0">
                                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Email Address</span>
                                                                <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{hotel.contact.email}</p>
                                                            </div>
                                                            <a href={`mailto:${hotel.contact.email}`} className="size-10 rounded-xl bg-white dark:bg-slate-900 flex items-center justify-center text-primary shadow-sm group-hover:scale-110 transition-transform">
                                                                <span className="material-symbols-outlined text-xl">mail</span>
                                                            </a>
                                                        </div>
                                                    )}
                                                    {hotel.contact?.website && (
                                                        <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center justify-between group cursor-pointer hover:border-primary/30 transition-all">
                                                            <div className="min-w-0">
                                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Official Website</span>
                                                                <p className="text-sm font-bold text-primary truncate">{hotel.contact.website}</p>
                                                            </div>
                                                            <a href={hotel.contact.website} target="_blank" rel="noopener noreferrer" className="size-10 rounded-xl bg-white dark:bg-slate-900 flex items-center justify-center text-primary shadow-sm group-hover:scale-110 transition-transform">
                                                                <span className="material-symbols-outlined text-xl">open_in_new</span>
                                                            </a>
                                                        </div>
                                                    )}
                                                    {!hotel.contact?.phoneNumber && !hotel.contact?.email && !hotel.contact?.website && (
                                                        <div className="p-8 rounded-3xl border-2 border-dashed border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center text-center opacity-50">
                                                            <span className="material-symbols-outlined text-3xl text-slate-300 mb-2">contact_support</span>
                                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Contact details unavailable</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'Amenities' && (
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 animate-in fade-in zoom-in-95 duration-500">
                                        {(hotel.facilities || []).map((amenity, idx) => {
                                            const id = typeof amenity === 'object' ? (amenity.facilityId || amenity.id) : amenity;
                                            const match = FACILITY_ICON_MAP[Number(id)];
                                            
                                            return (
                                                <div key={idx} className="bg-white dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 flex items-center gap-4 hover:border-primary/50 transition-all hover:shadow-lg group">
                                                    <div className="size-12 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-primary transition-colors">
                                                        <span className="material-symbols-outlined text-3xl">
                                                            {match ? match.icon : 'done_all'}
                                                        </span>
                                                    </div>
                                                    <span className="font-black text-sm uppercase tracking-tight">
                                                        {amenity.names?.tr || amenity.names?.en || amenity.label || (match ? match.label : 'Amenity')}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}

                                {activeTab === 'Transportation' && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in zoom-in-95 duration-500">
                                        {(hotel.transportations || []).map((t, idx) => (
                                            <div key={idx} className="bg-white dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 hover:border-primary/50 transition-all group">
                                                <div className="flex items-center gap-4 mb-4">
                                                    <div className="size-12 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-primary shadow-sm">
                                                        <span className="material-symbols-outlined text-2xl">
                                                            {t.type === 'AIRPORT' ? 'flight_takeoff' : t.type === 'RAIL' ? 'train' : 'directions_car'}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <h4 className="font-black text-sm uppercase tracking-tight">{t.name || (t.type === 'AIRPORT' ? 'Airport' : t.type === 'RAIL' ? 'Train Station' : 'Location')}</h4>
                                                        <p className="text-[10px] font-black text-primary uppercase tracking-widest">
                                                            {t.type === 'AIRPORT' ? 'By Flight' : t.type === 'RAIL' ? 'By Rail' : 'By Road'}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <div className="flex justify-between text-xs font-bold">
                                                        <span className="text-slate-400">Distance:</span>
                                                        <span>{t.distanceKm} km</span>
                                                    </div>
                                                    <div className="flex justify-between text-xs font-bold">
                                                        <span className="text-slate-400">Duration:</span>
                                                        <span>{t.durationMinutes} min</span>
                                                    </div>
                                                    {t.directions && (
                                                        <p className="text-[10px] text-slate-400 italic mt-2 border-t border-slate-100 dark:border-slate-800 pt-2">
                                                            Via {t.directions}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {activeTab === 'Policies' && (
                                    <div className="animate-in fade-in zoom-in-95 duration-500">
                                        <div className="bg-white dark:bg-slate-900/50 p-10 rounded-[40px] border border-slate-200 dark:border-slate-800">
                                            <div className="flex items-center gap-3 mb-8">
                                                <div className="size-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                                                    <span className="material-symbols-outlined text-2xl">info</span>
                                                </div>
                                                <h2 className="text-3xl font-black uppercase tracking-tight">Hotel Policies</h2>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="p-8 rounded-[32px] bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 group hover:border-primary/30 transition-all">
                                                    <div className="flex items-center gap-4 mb-6">
                                                        <div className="size-14 rounded-2xl bg-white dark:bg-slate-900 flex items-center justify-center text-primary shadow-sm group-hover:scale-110 transition-transform">
                                                            <span className="material-symbols-outlined text-3xl">login</span>
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Standard Check-In</p>
                                                            <h4 className="text-2xl font-black text-primary">{hotel.checkIn || '15:00'}</h4>
                                                        </div>
                                                    </div>
                                                    <p className="text-sm text-slate-500 font-medium leading-relaxed">
                                                        Guests are required to show a photo identification and credit card upon check-in.
                                                    </p>
                                                </div>

                                                <div className="p-8 rounded-[32px] bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 group hover:border-primary/30 transition-all">
                                                    <div className="flex items-center gap-4 mb-6">
                                                        <div className="size-14 rounded-2xl bg-white dark:bg-slate-900 flex items-center justify-center text-primary shadow-sm group-hover:scale-110 transition-transform">
                                                            <span className="material-symbols-outlined text-3xl">logout</span>
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Standard Check-Out</p>
                                                            <h4 className="text-2xl font-black text-primary">{hotel.checkOut || '11:00'}</h4>
                                                        </div>
                                                    </div>
                                                    <p className="text-sm text-slate-500 font-medium leading-relaxed">
                                                        Please ensure your balance is settled and keys are returned to the front desk.
                                                    </p>
                                                </div>
                                            </div>
                                            
                                            <div className="mt-8 p-6 bg-amber-500/5 rounded-3xl border border-amber-500/10 flex items-start gap-4">
                                                <span className="material-symbols-outlined text-amber-500">warning</span>
                                                <p className="text-xs font-bold text-amber-700/80 dark:text-amber-400/80 leading-relaxed">
                                                    Special requests are subject to availability and cannot be guaranteed. They may incur additional charges.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'Reviews' && (
                                    <div className="bg-white dark:bg-slate-900/50 p-20 rounded-[40px] border-2 border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center text-center">
                                        <div className="size-20 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-6 font-black uppercase tracking-widest">
                                            R
                                        </div>
                                        <h3 className="text-xl font-black uppercase mb-2">Guest Reviews</h3>
                                        <p className="text-slate-500 font-medium tracking-tight">Real-time feedback from verified Travel of Globe guests.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Booking Sidebar - Sticky Behavior Refined */}
                    <div className="lg:col-span-4 h-fit">
                        <div className="lg:sticky lg:top-[96px] space-y-6">
                            <div className="relative group/sidebar">
                                {/* Glass Background */}
                                <div className="absolute inset-0 bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl rounded-[40px] border border-white/40 dark:border-white/10 shadow-[0_32px_80px_-16px_rgba(0,0,0,0.1)] transition-all duration-500 group-hover/sidebar:shadow-[0_48px_96px_-16px_rgba(0,0,0,0.15)] group-hover/sidebar:bg-white/50 dark:group-hover/sidebar:bg-slate-900/50"></div>

                                {/* Content */}
                                <div className="relative p-8 z-10">

                                    <div className="flex items-center gap-2 text-primary font-black text-[10px] mb-6 uppercase tracking-[0.2em] bg-primary/5 dark:bg-primary/20 p-3 rounded-2xl border border-primary/10 backdrop-blur-md" lang={currentLang === 'tr' ? 'tr' : 'en'}>
                                        <span className="material-symbols-outlined text-sm fill-1">bolt</span>
                                        {tLocal('instantConfirmationAvailable')}
                                    </div>

                                    <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2" lang={currentLang === 'tr' ? 'tr' : 'en'}>
                                        <span className="material-symbols-outlined text-sm">auto_awesome</span>
                                        {tLocal('reservationSummary')}
                                    </h3>

                                    <div className="space-y-4 mb-8">
                                        {selectedRooms.length > 0 ? (
                                            selectedRooms.map((room, idx) => {
                                                const isFreeCancel = room.hubRateModel?.refundable ?? (room.hubRateModel?.price?.cancellationPolicies?.[0]?.amount === 0);
                                                const boardType = room.hubRateModel?.boardType || 'RO';
                                                
                                                return (
                                                    <div key={idx} className="relative p-5 rounded-3xl bg-white/40 dark:bg-slate-800/40 border border-white/60 dark:border-white/5 shadow-sm group/item hover:bg-white/60 dark:hover:bg-slate-800/60 transition-all">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setSelectedRooms(prev => prev.filter((_, i) => i !== idx));
                                                            }}
                                                            className="absolute -top-1.5 -right-1.5 size-7 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/40 rounded-full text-red-500 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center shadow-lg z-20 group/btn"
                                                        >
                                                            <span className="material-symbols-outlined text-[16px] group-hover/btn:rotate-90 transition-transform">close</span>
                                                        </button>
                                                        <div className="flex justify-between items-start mb-2 pr-4">
                                                            <span className="font-black text-slate-900 dark:text-white text-[11px] uppercase tracking-tight line-clamp-2">{idx + 1}. <span lang="en">{room.name}</span></span>
                                                            <div className="flex items-baseline gap-1 shrink-0">
                                                                <span className="text-[10px] font-black text-primary">{room.currency}</span>
                                                                <span className="font-black text-primary text-sm leading-none">{room.rate.toFixed(2)}</span>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <span className="bg-emerald-500/10 text-emerald-500 text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest">{getBoardTypeLabel(boardType)}</span>
                                                            <RefundPolicyTooltip
                                                                isRefundable={isFreeCancel}
                                                                textOverride={isFreeCancel ? tLocal('freeCancellation') : tLocal('nonRefundable')}
                                                                className={`text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest ${isFreeCancel ? 'bg-emerald-500/10 text-emerald-500' : 'bg-orange-500/10 text-orange-500'}`}
                                                            />
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        ) : (
                                            <div className="py-12 px-6 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 text-center">
                                                <span className="material-symbols-outlined text-4xl text-slate-300 dark:text-slate-700 mb-2">bed</span>
                                                <p className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{tLocal('pleaseSelectARoom')}</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Dynamic Details Section */}
                                    <div className="grid grid-cols-2 gap-3 mb-8">
                                        <div className="p-3.5 rounded-2xl bg-slate-500/5 border border-slate-500/10">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 leading-none">{tLocal('guests')}</p>
                                            <p className="text-xs font-black text-slate-900 dark:text-white truncate">
                                                {totalAdults} {totalAdults > 1 ? tLocal('adults') : tLocal('adult')}, {totalChildren} {totalChildren > 1 ? tLocal('children') : tLocal('child')}
                                            </p>
                                        </div>
                                        <div className="p-3.5 rounded-2xl bg-slate-500/5 border border-slate-500/10">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 leading-none">{tLocal('nationality')}</p>
                                            <p className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                                                {nationality}
                                                <span className="material-symbols-outlined text-[10px] text-primary">verified</span>
                                            </p>
                                        </div>
                                        <div className="col-span-2 p-3.5 rounded-2xl bg-slate-500/5 border border-slate-500/10 flex items-center justify-between">
                                            <div>
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 leading-none">{tLocal('dates')}</p>
                                                <p className="text-xs font-black text-slate-900 dark:text-white">
                                                    {formatDateForUrl(checkInDate)} - {formatDateForUrl(checkOutDate)}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 leading-none">{tLocal('stay')}</p>
                                                <p className="text-xs font-black text-primary">{nights} {nights > 1 ? tLocal('nights') : tLocal('night')}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-8 border-t border-slate-200 dark:border-slate-800 mb-8">
                                        <div className="flex items-end justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="material-symbols-outlined text-slate-400 text-sm">receipt_long</span>
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none">{tLocal('totalStayPrice')}</p>
                                                </div>
                                                <div className="flex items-baseline gap-1.5 ml-1">
                                                    <span className="text-sm font-black text-primary uppercase tracking-wider">{(selectedRooms[0]?.currency || '$')}</span>
                                                    <p className="text-4xl font-black text-primary leading-none tracking-tighter shadow-primary/10">
                                                        {(selectedRooms.reduce((sum, r) => sum + r.rate, 0)).toFixed(2)}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="size-10 rounded-2xl flex items-center justify-center text-primary bg-primary/10 border border-primary/20">
                                                <span className="material-symbols-outlined">payments</span>
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleInstantReservation}
                                        disabled={selectedRooms.length === 0 || isCheckingRates}
                                        className={`w-full font-black py-5 rounded-[24px] transition-all shadow-2xl flex items-center justify-center gap-3 active:scale-[0.98] mb-4 group/btn overflow-hidden relative ${
                                            selectedRooms.length > 0 && !isCheckingRates 
                                                ? 'bg-primary text-white shadow-primary/30 hover:scale-[1.02]' 
                                                : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed opacity-50'
                                        } ${isCheckingRates ? 'animate-pulse ring-4 ring-primary/20' : ''}`}>
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000"></div>
                                        <span className="relative z-10 flex items-center gap-2">
                                            {isCheckingRates ? (
                                                <>
                                                    <span className="size-5 border-3 border-white/20 border-t-white rounded-full animate-spin"></span>
                                                    <span className="animate-pulse">{tLocal('checkingBestRates')}</span>
                                                </>
                                            ) : (
                                                <>
                                                    {tLocal('instantReservation')}
                                                    <span className="material-symbols-outlined text-[20px] group-hover/btn:translate-x-1 transition-transform">arrow_forward</span>
                                                </>
                                            )}
                                        </span>
                                    </button>
                                    <p className="text-[10px] text-center text-slate-400 dark:text-slate-500 font-black uppercase tracking-[0.2em]">
                                        {tLocal('b2bAgencyRatesApplied')}
                                    </p>
                                </div>
                            </div>

                            <div className="mt-6 bg-slate-100 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 flex items-center gap-4">
                                <div className="size-12 rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center text-primary shadow-sm">
                                    <span className="material-symbols-outlined">verified_user</span>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">SECURE PAYMENT</p>
                                    <p className="text-sm font-black">TOG Protected Booking</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

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
