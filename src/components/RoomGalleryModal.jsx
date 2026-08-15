import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { FACILITY_ICON_MAP } from '../pages/MapView';

const PLACEHOLDER_IMG = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=800';

const LOCAL_TRANSLATIONS = {
    en: {
        roomSpecs: "Room Specifications",
        amenities: "Amenities",
        showMore: "Show More",
        showLess: "Show Less",
        adults: "Adults",
        children: "Children",
        adult: "Adult",
        child: "Child",
        pax: "Pax",
        photos: "Photos"
    },
    tr: {
        roomSpecs: "Oda Özellikleri",
        amenities: "Olanaklar",
        showMore: "Devamını Göster",
        showLess: "Daha Az Göster",
        adults: "Yetişkin",
        children: "Çocuk",
        adult: "Yetişkin",
        child: "Çocuk",
        pax: "Kişi",
        photos: "Fotoğraf"
    }
};

const RoomGalleryModal = ({ 
    isOpen, 
    onClose, 
    roomName,
    images = [],
    description = '',
    attributes = [],
    maxAdult = 0,
    maxChildren = 0,
    squareMeter = null,
}) => {
    const { i18n } = useTranslation();
    const currentLang = i18n.language || 'en';
    const tLocal = (key) => LOCAL_TRANSLATIONS[currentLang]?.[key] || LOCAL_TRANSLATIONS['en'][key];
    
    const [currentIndex, setCurrentIndex] = useState(0);
    const [showFullDesc, setShowFullDesc] = useState(false);
    const touchStartX = useRef(null);
    
    // Ensure we always have an array of at least 1 image
    const validImages = images?.length > 0 ? images : [PLACEHOLDER_IMG];
    
    // Reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            setCurrentIndex(0);
            setShowFullDesc(false);
        }
    }, [isOpen, roomName]);

    // Preload next and prev images for performance
    useEffect(() => {
        if (!isOpen || validImages.length <= 1) return;
        
        const preloadImage = (src) => {
            if (src === PLACEHOLDER_IMG) return;
            const img = new Image();
            img.src = src;
        };
        
        const nextIndex = (currentIndex + 1) % validImages.length;
        const prevIndex = (currentIndex - 1 + validImages.length) % validImages.length;
        
        preloadImage(validImages[nextIndex]);
        preloadImage(validImages[prevIndex]);
    }, [currentIndex, validImages, isOpen]);

    const handlePrevious = useCallback((e) => {
        e?.stopPropagation();
        setCurrentIndex((prev) => (prev === 0 ? validImages.length - 1 : prev - 1));
    }, [validImages.length]);

    const handleNext = useCallback((e) => {
        e?.stopPropagation();
        setCurrentIndex((prev) => (prev === validImages.length - 1 ? 0 : prev + 1));
    }, [validImages.length]);

    // Keyboard navigation
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

    // Swipe logic for mobile
    const handleTouchStart = (e) => {
        touchStartX.current = e.touches[0].clientX;
    };
    const handleTouchEnd = (e) => {
        if (touchStartX.current === null) return;
        const touchEndX = e.changedTouches[0].clientX;
        const diff = touchStartX.current - touchEndX;
        if (Math.abs(diff) > 50) {
            if (diff > 0) handlePrevious(); // Swipe right -> previous
            else handleNext(); // Swipe left -> next
        }
        touchStartX.current = null;
    };

    if (!isOpen) return null;

    const hasLongDescription = description && description.length > 150;
    const displayedDescription = (hasLongDescription && !showFullDesc) 
        ? `${description.substring(0, 150)}...` 
        : description;

    // Process Attributes to get Icons
    const processedAttributes = (attributes || []).map(attr => {
        const label = attr.names?.tr || attr.names?.en || attr.label || '';
        const lowerLabel = label.toLowerCase();
        
        const iconMatch = Object.entries(FACILITY_ICON_MAP || {}).find(([id, data]) =>
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
            else if (lowerLabel.includes('sqm') || lowerLabel.includes('m²')) iconKey = 'square_foot';
            else if (lowerLabel.includes('wifi') || lowerLabel.includes('internet')) iconKey = 'wifi';
            else if (lowerLabel.includes('tv') || lowerLabel.includes('television')) iconKey = 'tv';
            else if (lowerLabel.includes('ac') || lowerLabel.includes('air condition') || lowerLabel.includes('iklimlendirme')) iconKey = 'ac_unit';
            else if (lowerLabel.includes('safe') || lowerLabel.includes('kasa')) iconKey = 'lock';
            else if (lowerLabel.includes('minibar')) iconKey = 'kitchen';
            else if (lowerLabel.includes('shower') || lowerLabel.includes('duş')) iconKey = 'shower';
            else if (lowerLabel.includes('bath') || lowerLabel.includes('küvet')) iconKey = 'bathtub';
        }
        return { label, iconKey };
    });

    return (
        <div className="fixed inset-0 z-[4000] flex flex-col lg:flex-row bg-black/95 backdrop-blur-xl animate-in fade-in duration-300">
            
            {/* Left/Top Area: Photo Gallery */}
            <div className="relative flex-1 flex flex-col h-[50vh] lg:h-full lg:p-6 overflow-hidden select-none" onClick={onClose}>
                
                {/* Image Viewer Container */}
                <div 
                    className="relative flex-1 bg-black lg:rounded-[32px] overflow-hidden flex items-center justify-center border border-white/10 shadow-2xl"
                    onClick={(e) => e.stopPropagation()}
                    onTouchStart={handleTouchStart}
                    onTouchEnd={handleTouchEnd}
                >
                    {/* Top Bar with Close Button (Mobile) & Counter */}
                    <div className="absolute top-0 left-0 right-0 p-4 lg:p-6 flex justify-between items-start z-20 pointer-events-none bg-gradient-to-b from-black/50 to-transparent">
                        <div className="bg-black/40 backdrop-blur-md px-4 py-2 rounded-xl text-white font-black tracking-widest text-xs uppercase border border-white/10 shadow-lg pointer-events-auto">
                            {currentIndex + 1} / {validImages.length} {tLocal('photos')}
                        </div>
                        {/* Mobile Close Button */}
                        <button
                            onClick={onClose}
                            className="lg:hidden size-10 rounded-full bg-black/40 backdrop-blur-md text-white flex items-center justify-center border border-white/10 shadow-lg pointer-events-auto hover:bg-white/20 transition-colors"
                        >
                            <span className="material-symbols-outlined text-xl">close</span>
                        </button>
                    </div>

                    {/* Main Image (No transitions/animations for performance) */}
                    <img
                        src={validImages[currentIndex]}
                        className="w-full h-full object-contain"
                        alt={`${roomName} - Photo ${currentIndex + 1}`}
                        draggable="false"
                        onError={(e) => { e.target.src = PLACEHOLDER_IMG; }}
                    />

                    {/* Navigation Buttons (Desktop) */}
                    {validImages.length > 1 && (
                        <>
                            <button
                                onClick={handlePrevious}
                                className="hidden lg:flex absolute left-6 size-12 rounded-full bg-black/40 hover:bg-white/10 backdrop-blur-md text-white items-center justify-center transition-all group z-20 border border-white/10 shadow-xl"
                            >
                                <span className="material-symbols-outlined text-3xl group-hover:-translate-x-1 transition-transform">chevron_left</span>
                            </button>
                            <button
                                onClick={handleNext}
                                className="hidden lg:flex absolute right-6 size-12 rounded-full bg-black/40 hover:bg-white/10 backdrop-blur-md text-white items-center justify-center transition-all group z-20 border border-white/10 shadow-xl"
                            >
                                <span className="material-symbols-outlined text-3xl group-hover:translate-x-1 transition-transform">chevron_right</span>
                            </button>
                        </>
                    )}
                </div>

                {/* Thumbnails (Desktop bottom, Mobile below image) */}
                {validImages.length > 1 && (
                    <div className="h-20 lg:h-24 shrink-0 mt-4 px-4 lg:px-0 flex justify-center items-center overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="flex gap-3 overflow-x-auto no-scrollbar max-w-full pb-2 snap-x px-2">
                            {validImages.map((img, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setCurrentIndex(idx)}
                                    className={`relative size-16 lg:size-20 shrink-0 rounded-xl overflow-hidden transition-all duration-300 snap-center border-2 ${idx === currentIndex ? 'border-primary ring-2 ring-primary/30 scale-105' : 'border-transparent opacity-50 hover:opacity-100 hover:scale-95'}`}
                                >
                                    <img src={img} className="w-full h-full object-cover" alt={`Thumb ${idx + 1}`} onError={(e) => { e.target.src = PLACEHOLDER_IMG; }} />
                                    {idx === currentIndex && (
                                        <div className="absolute inset-0 bg-primary/20"></div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Right/Bottom Area: Room Details */}
            <div className="flex-1 lg:flex-none lg:w-[360px] xl:w-[420px] bg-white dark:bg-slate-900 rounded-t-[32px] lg:rounded-none lg:rounded-l-[32px] flex flex-col h-[50vh] lg:h-full overflow-hidden shadow-[-10px_0_30px_rgba(0,0,0,0.5)] z-30 transition-colors duration-300">
                
                {/* Desktop Close Button */}
                <div className="hidden lg:flex justify-end p-6 pb-0">
                    <button
                        onClick={onClose}
                        className="size-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center justify-center transition-all duration-300 hover:rotate-90"
                    >
                        <span className="material-symbols-outlined text-2xl">close</span>
                    </button>
                </div>

                {/* Content Scrollable Area */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-5 lg:p-6 pt-8 lg:pt-4">
                    
                    {/* Header Tags */}
                    <div className="flex flex-wrap gap-2 mb-4">
                        {squareMeter && (
                            <span className="flex items-center gap-1.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-black px-2.5 py-1.5 rounded-lg uppercase tracking-wider border border-blue-500/10">
                                <span className="material-symbols-outlined text-sm">square_foot</span>
                                {squareMeter}
                            </span>
                        )}
                        <span className="flex items-center gap-1.5 bg-orange-500/10 text-orange-600 dark:text-orange-400 text-[10px] font-black px-2.5 py-1.5 rounded-lg uppercase tracking-wider border border-orange-500/10">
                            <span className="material-symbols-outlined text-sm">group</span>
                            {maxAdult + maxChildren} {tLocal('pax')}
                        </span>
                        {maxAdult > 0 && (
                            <span className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-black px-2.5 py-1.5 rounded-lg uppercase tracking-wider">
                                {maxAdult} {maxAdult > 1 ? tLocal('adults') : tLocal('adult')}
                            </span>
                        )}
                        {maxChildren > 0 && (
                            <span className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-black px-2.5 py-1.5 rounded-lg uppercase tracking-wider">
                                {maxChildren} {maxChildren > 1 ? tLocal('children') : tLocal('child')}
                            </span>
                        )}
                    </div>

                    {/* Room Name */}
                    <h2 className="text-lg lg:text-xl font-medium text-slate-800 dark:text-slate-100 mb-5 tracking-normal leading-snug">
                        {roomName}
                    </h2>

                    {/* Room Description */}
                    {description && (
                        <div className="mb-6">
                            <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-2.5 flex items-center gap-1.5">
                                <span className="material-symbols-outlined text-primary text-[14px]">description</span>
                                {tLocal('roomSpecs')}
                            </h3>
                            <div className="bg-slate-50/80 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                                <p className="text-[13px] text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
                                    {displayedDescription}
                                </p>
                                {hasLongDescription && (
                                    <button 
                                        onClick={() => setShowFullDesc(!showFullDesc)}
                                        className="mt-2.5 text-primary text-[11px] font-bold uppercase tracking-wider hover:underline flex items-center gap-0.5"
                                    >
                                        {showFullDesc ? tLocal('showLess') : tLocal('showMore')}
                                        <span className="material-symbols-outlined text-[14px]">
                                            {showFullDesc ? 'expand_less' : 'expand_more'}
                                        </span>
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Room Amenities */}
                    {processedAttributes.length > 0 && (
                        <div>
                            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary text-sm">stars</span>
                                {tLocal('amenities')}
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {processedAttributes.map((attr, idx) => (
                                    <div key={idx} className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-primary/30 transition-all group">
                                        <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-white transition-colors">
                                            <span className="material-symbols-outlined text-[18px]">{attr.iconKey}</span>
                                        </div>
                                        <span className="text-xs font-bold text-slate-700 dark:text-slate-200 leading-tight">
                                            {attr.label}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RoomGalleryModal;
