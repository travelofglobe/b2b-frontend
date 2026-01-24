import React from 'react';
import { Link } from 'react-router-dom';

const HotelCard = ({ hotel, viewMode = 'grid3' }) => {
    const isList = viewMode === 'list';
    const [currentImg, setCurrentImg] = React.useState(0);
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

    const handleFavorite = (e) => {
        e.preventDefault();
        e.stopPropagation();
        // favorite logic here
    };

    return (
        <Link
            to={`/hotel/${hotel.id}`}
            className={`group bg-white dark:bg-[#111a22] rounded-2xl overflow-hidden border border-slate-200 dark:border-[#233648] shadow-sm hover:shadow-xl transition-all duration-300 flex ${isList ? 'flex-col md:flex-row' : 'flex-col'}`}
        >
            <div className={`relative overflow-hidden ${isList ? 'h-64 md:h-auto md:w-[400px] shrink-0' : 'h-60'}`}>
                {/* Image Slider */}
                <div className="w-full h-full relative">
                    {images.map((img, idx) => (
                        <img
                            key={idx}
                            src={img}
                            alt={`${hotel.name} ${idx + 1}`}
                            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${idx === currentImg ? 'opacity-100 scale-100' : 'opacity-0 scale-105'}`}
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
                                {[...Array(5)].map((_, i) => (
                                    <span key={i} className="material-symbols-outlined text-[10px] fill-1">star</span>
                                ))}
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">RESORT & SPA</span>
                            </div>
                            <h3 className={`font-bold leading-tight group-hover:text-primary transition-colors ${isList ? 'text-2xl' : 'text-lg'}`}>{hotel.name}</h3>
                            <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 mt-1">
                                <span className="material-symbols-outlined text-sm text-primary">location_on</span>
                                <span className="text-xs font-semibold">{hotel.location} • 2.4 km from center</span>
                            </div>
                        </div>
                        <div className="bg-primary/10 px-2 py-1.5 rounded-xl text-right shrink-0">
                            <div className="text-sm font-black text-primary leading-none">{hotel.rating}</div>
                            <div className="text-[8px] font-bold text-primary uppercase leading-none mt-1">{hotel.ratingLabel}</div>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-3 my-4">
                        {hotel.amenities.slice(0, 3).map((amenity, index) => (
                            <div key={index} className="flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-800/30 rounded-lg text-slate-600 dark:text-slate-300 border border-slate-100 dark:border-slate-800">
                                <span className="material-symbols-outlined text-lg text-slate-400">{amenity.icon}</span>
                                <span className="text-[9px] font-black uppercase tracking-wider">{amenity.label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className={`flex items-center justify-between pt-4 ${isList ? 'border-t border-slate-100 dark:border-[#233648]' : ''}`}>
                    <div className="flex flex-col">
                        <div className="flex items-baseline gap-1">
                            <span className={`font-black ${isList ? 'text-2xl' : 'text-xl'}`}>${hotel.price}</span>
                            <div className="flex flex-col">
                                <span className="text-[9px] text-slate-400 font-bold uppercase leading-none">PER NIGHT</span>
                                <span className="text-[7px] text-slate-400 font-bold uppercase leading-none">incl. taxes</span>
                            </div>
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
