import React, { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Header from '../components/Header';
import { mockHotels } from '../data/mockHotels';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in Leaflet
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Custom Marker Component
const CustomPriceMarker = ({ hotel, isSelected, isHovered, onSelect, onHover }) => {
    const icon = L.divIcon({
        className: 'custom-leaflet-marker',
        html: `
            <div class="relative group cursor-pointer">
                <div class="px-4 py-2 rounded-2xl font-black text-sm shadow-2xl transition-all border-2 flex items-center gap-1 overflow-hidden ${isSelected || isHovered
                ? 'bg-[#137fec] text-white border-white scale-110 ring-4 ring-[#137fec]/20'
                : 'bg-white/90 backdrop-blur-md text-slate-900 border-white/20'
            }">
                    <span class="text-[10px] opacity-70 leading-none">$</span>
                    ${hotel.price}
                </div>
                <div class="w-0.5 h-3 mx-auto transition-colors ${isSelected || isHovered ? 'bg-[#137fec]' : 'bg-white/40'}"></div>
            </div>
        `,
        iconSize: [60, 40],
        iconAnchor: [30, 40],
    });

    return (
        <Marker
            position={[hotel.lat, hotel.lng]}
            icon={icon}
            eventHandlers={{
                click: () => onSelect(hotel),
                mouseover: () => onHover(hotel),
                mouseout: () => onHover(null)
            }}
        />
    );
};

// Map Controller for FlyTo
const MapController = ({ selectedHotel }) => {
    const map = useMap();
    useEffect(() => {
        if (selectedHotel) {
            map.flyTo([selectedHotel.lat, selectedHotel.lng], 15, {
                duration: 1.5
            });
        }
    }, [selectedHotel, map]);
    return null;
};

// Glass Filter Modal Component
const FilterModal = ({ isOpen, onClose, currentFilters, onApply }) => {
    const [localFilters, setLocalFilters] = useState(currentFilters);

    useEffect(() => {
        if (isOpen) setLocalFilters(currentFilters);
    }, [isOpen, currentFilters]);

    const handleTypeToggle = (type) => {
        setLocalFilters(prev => {
            const types = prev.types.includes(type)
                ? prev.types.filter(t => t !== type)
                : [...prev.types, type];
            return { ...prev, types };
        });
    };

    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-black/20 backdrop-blur-sm"
                onClick={onClose}
            ></div>
            <div className="relative w-full max-w-lg bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl rounded-[40px] shadow-[0_32px_128px_-16px_rgba(0,0,0,0.5)] border border-white/20 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in duration-300">
                <div className="p-8">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-2xl font-black uppercase tracking-tight text-slate-900 dark:text-white">Professional Filters</h2>
                        <button onClick={onClose} className="size-10 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-primary hover:text-white transition-all">
                            <span className="material-symbols-outlined uppercase font-black">close</span>
                        </button>
                    </div>

                    <div className="space-y-8">
                        <div>
                            <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4 px-1">Property Type</h3>
                            <div className="grid grid-cols-2 gap-3">
                                {['Hotels', 'Resorts', 'Villas', 'Boutique', 'Apartments', 'Hostels'].map((type) => (
                                    <label key={type} className={`flex items-center gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border ${localFilters.types.includes(type) ? 'border-primary bg-primary/5' : 'border-slate-100 dark:border-slate-700'} cursor-pointer hover:border-primary transition-all group`}>
                                        <input
                                            type="checkbox"
                                            checked={localFilters.types.includes(type)}
                                            onChange={() => handleTypeToggle(type)}
                                            className="size-5 rounded-lg border-slate-300 dark:border-slate-600 text-primary focus:ring-primary focus:ring-offset-0 bg-transparent"
                                        />
                                        <span className={`text-sm font-bold ${localFilters.types.includes(type) ? 'text-primary' : 'text-slate-700 dark:text-slate-200'} group-hover:text-primary transition-colors`}>{type}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div>
                            <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4 px-1">Price Range ($)</h3>
                            <div className="flex items-center gap-4">
                                <div className="flex-1 space-y-2">
                                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Min</label>
                                    <input
                                        type="number"
                                        value={localFilters.priceRange[0]}
                                        onChange={(e) => setLocalFilters(prev => ({ ...prev, priceRange: [parseInt(e.target.value) || 0, prev.priceRange[1]] }))}
                                        className="w-full bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 dark:text-white focus:ring-primary focus:border-primary"
                                    />
                                </div>
                                <div className="size-px h-10 bg-slate-200 dark:bg-slate-700 mt-6"></div>
                                <div className="flex-1 space-y-2">
                                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Max</label>
                                    <input
                                        type="number"
                                        value={localFilters.priceRange[1]}
                                        onChange={(e) => setLocalFilters(prev => ({ ...prev, priceRange: [prev.priceRange[0], parseInt(e.target.value) || 0] }))}
                                        className="w-full bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 dark:text-white focus:ring-primary focus:border-primary"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-10 flex gap-4">
                        <button
                            onClick={() => setLocalFilters({ types: [], priceRange: [0, 2000] })}
                            className="flex-1 py-4 rounded-2xl border border-slate-200 dark:border-slate-700 font-black uppercase text-xs tracking-widest hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">Clear All</button>
                        <button
                            onClick={() => { onApply(localFilters); onClose(); }}
                            className="flex-[2] py-4 rounded-2xl bg-primary text-white font-black uppercase text-xs tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all">Apply Results</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Map Instance Capture Component
const MapInstanceCapture = ({ setMap }) => {
    const map = useMap();
    useEffect(() => {
        setMap(map);
    }, [map, setMap]);
    return null;
};

// MapView Component
const MapView = () => {
    const [searchParams] = useSearchParams();
    const [hoveredHotel, setHoveredHotel] = useState(null);
    const [selectedHotel, setSelectedHotel] = useState(() => {
        const queryId = searchParams.get('hotelId');
        if (queryId) {
            return mockHotels.find(h => h.id === parseInt(queryId)) || mockHotels[0];
        }
        return mockHotels[0];
    });
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
    const [filters, setFilters] = useState({
        types: [],
        priceRange: [0, 2000]
    });

    // Map Instance State
    const [map, setMap] = useState(null);

    const filteredHotels = mockHotels.filter(hotel => {
        const matchesType = filters.types.length === 0 || filters.types.includes(hotel.type);
        const matchesPrice = hotel.price >= filters.priceRange[0] && hotel.price <= filters.priceRange[1];
        return matchesType && matchesPrice;
    });

    const handleHotelSelect = (hotel) => {
        setSelectedHotel(hotel);
        if (!isSidebarOpen) setIsSidebarOpen(true);
        const element = document.getElementById(`hotel-card-${hotel.id}`);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    };

    const handleZoomIn = () => {
        if (map) map.zoomIn();
    };

    const handleZoomOut = () => {
        if (map) map.zoomOut();
    };

    const handleLocate = () => {
        if (map) {
            map.locate({ setView: true, maxZoom: 16 });
            map.on('locationfound', (e) => {
                L.marker(e.latlng).addTo(map)
                    .bindPopup("You are here")
                    .openPopup();
            });
        }
    };

    return (
        <div className="flex flex-col h-screen bg-white dark:bg-background-dark overflow-hidden font-sans">
            <Header />

            <main className="flex-1 flex overflow-hidden relative">
                {/* Aside: Hotel List Sidebar */}
                <aside className={`absolute lg:relative z-30 h-full bg-white/80 dark:bg-background-dark/80 backdrop-blur-2xl border-r border-slate-200/50 dark:border-slate-800/50 transition-all duration-500 ease-in-out shadow-2xl ${isSidebarOpen ? 'w-full md:w-[420px] xl:w-[480px] translate-x-0' : 'w-0 -translate-x-full lg:translate-x-0'
                    }`}>
                    <div className="h-full flex flex-col w-[420px] xl:w-[480px]">
                        <div className="p-8 border-b border-slate-100/50 dark:border-slate-800/50 bg-white/50 dark:bg-slate-900/50">
                            <div className="flex items-center justify-between mb-1">
                                <div>
                                    <h1 className="font-black text-2xl tracking-tighter text-slate-900 dark:text-white uppercase leading-none">Santorini</h1>
                                    <p className="text-[10px] font-bold text-primary uppercase tracking-[0.3em] mt-2">{filteredHotels.length} Elite Properties</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setIsFilterModalOpen(true)}
                                        className="px-5 py-3 flex items-center gap-2 rounded-2xl bg-[#137fec] text-white shadow-lg shadow-[#137fec]/20 hover:scale-105 active:scale-95 transition-all group"
                                    >
                                        <span className="material-symbols-outlined text-[20px] font-black uppercase">tune</span>
                                        <span className="text-[10px] font-black uppercase tracking-widest">Filter</span>
                                    </button>
                                    <button
                                        onClick={() => setIsSidebarOpen(false)}
                                        className="size-12 lg:hidden flex items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                                    >
                                        <span className="material-symbols-outlined font-black">close</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-5">
                            {filteredHotels.map((hotel) => (
                                <div
                                    id={`hotel-card-${hotel.id}`}
                                    key={hotel.id}
                                    onMouseEnter={() => setHoveredHotel(hotel)}
                                    onMouseLeave={() => setHoveredHotel(null)}
                                    onClick={() => handleHotelSelect(hotel)}
                                    className={`group flex gap-5 p-5 rounded-[32px] border-2 transition-all duration-300 cursor-pointer relative overflow-hidden backdrop-blur-md ${selectedHotel?.id === hotel.id
                                        ? 'border-primary bg-primary/5 dark:bg-primary/10 shadow-2xl shadow-primary/10'
                                        : 'border-transparent bg-slate-50/50 dark:bg-slate-900/40 hover:bg-white dark:hover:bg-slate-900 shadow-sm hover:shadow-xl hover:border-white dark:hover:border-slate-800'
                                        }`}
                                >
                                    <div className="w-40 h-32 rounded-[24px] overflow-hidden shrink-0 relative">
                                        <img className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" src={hotel.image} alt={hotel.name} />

                                        {/* Modern List-Style Badges */}
                                        <div className="absolute top-3 left-3 flex flex-col gap-2">
                                            {hotel.badges?.map((badge, idx) => (
                                                <div key={idx} className={`${badge.color} text-white text-[8px] font-black uppercase tracking-widest px-2.5 py-1.5 rounded-xl shadow-lg flex items-center gap-1.5 backdrop-blur-sm border border-white/10`}>
                                                    {badge.type === 'featured' && <span className="material-symbols-outlined text-[12px] fill-1">workspace_premium</span>}
                                                    {badge.type === 'opportunity' && <span className="material-symbols-outlined text-[12px] fill-1">local_fire_department</span>}
                                                    {badge.type === 'discount' && <span className="material-symbols-outlined text-[12px] fill-1">sell</span>}
                                                    {badge.type === 'popular' && <span className="material-symbols-outlined text-[12px] fill-1">trending_up</span>}
                                                    {badge.type === 'exclusive' && <span className="material-symbols-outlined text-[12px] fill-1">verified</span>}
                                                    {badge.label}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex flex-col justify-between py-1 flex-1 min-w-0">
                                        <div>
                                            <div className="flex items-center gap-1 mb-1.5 opacity-60">
                                                {[...Array(5)].map((_, i) => (
                                                    <span key={i} className="material-symbols-outlined text-[10px] text-amber-400 fill-1">star</span>
                                                ))}
                                            </div>
                                            <h3 className="font-black text-slate-900 dark:text-white leading-tight uppercase tracking-tight truncate group-hover:text-primary transition-colors text-sm">{hotel.name}</h3>
                                            <p className="text-[10px] text-slate-400 font-bold flex items-center gap-1 mt-1.5 uppercase tracking-widest">
                                                <span className="material-symbols-outlined text-[14px]">location_on</span>
                                                {hotel.location}
                                            </p>
                                        </div>

                                        <div className="flex items-center justify-between mt-4">
                                            <div className="flex items-center gap-2">
                                                <div className="px-2.5 py-1.5 rounded-xl bg-[#137fec]/10 dark:bg-[#137fec]/20 flex items-center justify-center text-[#137fec] font-black text-[10px]">
                                                    {hotel.rating}
                                                </div>
                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Rating</span>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xl font-black text-[#137fec] leading-none tracking-tighter">${hotel.price}</p>
                                                <p className="text-[8px] text-slate-400 font-black uppercase tracking-[0.2em] mt-1.5">Starting At</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </aside>

                {/* Section: Leaflet Map */}
                <section className="flex-1 relative bg-slate-100 dark:bg-[#0c1622] overflow-hidden">
                    <MapContainer
                        center={[selectedHotel.lat, selectedHotel.lng]}
                        zoom={13}
                        style={{ height: '100%', width: '100%' }}
                        zoomControl={false}
                    >
                        <MapInstanceCapture setMap={setMap} />
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                        />

                        <MapController selectedHotel={selectedHotel} />

                        {filteredHotels.map((hotel) => (
                            <CustomPriceMarker
                                key={hotel.id}
                                hotel={hotel}
                                isSelected={selectedHotel?.id === hotel.id}
                                isHovered={hoveredHotel?.id === hotel.id}
                                onSelect={handleHotelSelect}
                                onHover={setHoveredHotel}
                            />
                        ))}
                    </MapContainer>

                    {/* Glass Hover Preview Card */}
                    {hoveredHotel && (
                        <div className="absolute top-8 left-1/2 -translate-x-1/2 z-[1000] w-80 bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl rounded-[32px] shadow-[0_32px_96px_-16px_rgba(0,0,0,0.4)] border border-white/20 dark:border-slate-800 overflow-hidden pointer-events-none transition-all duration-300 animate-in fade-in slide-in-from-top-4">
                            <div className="h-40 relative">
                                <img className="w-full h-full object-cover" src={hoveredHotel.image} alt="" />
                                <div className="absolute top-4 right-4 bg-[#137fec] px-3 py-1.5 rounded-2xl text-[10px] font-black text-white shadow-xl shadow-[#137fec]/30 flex items-center gap-1.5">
                                    <span className="material-symbols-outlined text-[14px]">star</span>
                                    {hoveredHotel.rating}
                                </div>
                            </div>
                            <div className="p-6">
                                <h4 className="font-black text-base uppercase tracking-tight text-slate-900 dark:text-white truncate">{hoveredHotel.name}</h4>
                                <div className="flex items-center justify-between mt-3">
                                    <div className="flex items-center gap-1 opacity-60">
                                        <span className="material-symbols-outlined text-[14px]">location_on</span>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{hoveredHotel.location}</span>
                                    </div>
                                    <span className="text-lg font-black text-[#137fec]">${hoveredHotel.price}<span className="text-[10px] text-slate-400 lowercase ml-1 font-bold">/nt</span></span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Map Controls (Glass) */}
                    <div className="absolute right-8 top-8 z-[1000] flex flex-col gap-4">
                        <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-[24px] shadow-2xl border border-white/20 dark:border-slate-800 overflow-hidden flex flex-col">
                            <button onClick={handleZoomIn} className="p-5 hover:bg-primary hover:text-white text-slate-600 dark:text-slate-300 transition-all border-b border-slate-100/10 active:scale-95">
                                <span className="material-symbols-outlined font-black">add</span>
                            </button>
                            <button onClick={handleZoomOut} className="p-5 hover:bg-primary hover:text-white text-slate-600 dark:text-slate-300 transition-all active:scale-95">
                                <span className="material-symbols-outlined font-black">remove</span>
                            </button>
                        </div>
                        <button onClick={handleLocate} className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-5 rounded-[24px] shadow-2xl border border-white/20 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-primary active:scale-95 transition-all">
                            <span className="material-symbols-outlined font-black">near_me</span>
                        </button>

                        {/* Navigation Controls */}
                        <div className="flex flex-col gap-3 mt-4">
                            <button
                                onClick={() => window.history.back()}
                                className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl p-4 rounded-[20px] shadow-xl border border-white/20 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-primary hover:bg-blue-50 dark:hover:bg-slate-800 active:scale-95 transition-all group flex items-center justify-center relative"
                            >
                                <span className="material-symbols-outlined font-black group-hover:-translate-x-1 transition-transform">arrow_back</span>

                                {/* Modern Tooltip */}
                                <div className="absolute right-full mr-4 px-3 py-2 bg-slate-900 text-white text-[10px] font-bold uppercase tracking-widest rounded-xl whitespace-nowrap opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all pointer-events-none shadow-xl z-50">
                                    Back to List
                                    <div className="absolute top-1/2 -right-1 -translate-y-1/2 w-2 h-2 bg-slate-900 rotate-45"></div>
                                </div>
                            </button>

                            <a
                                href="/"
                                className="bg-primary/90 backdrop-blur-xl p-4 rounded-[20px] shadow-xl shadow-primary/30 border border-white/20 text-white hover:bg-primary active:scale-95 transition-all group flex items-center justify-center relative"
                            >
                                <span className="material-symbols-outlined font-black group-hover:rotate-12 transition-transform">grid_view</span>

                                {/* Modern Tooltip */}
                                <div className="absolute right-full mr-4 px-3 py-2 bg-slate-900 text-white text-[10px] font-bold uppercase tracking-widest rounded-xl whitespace-nowrap opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all pointer-events-none shadow-xl z-50">
                                    Dashboard
                                    <div className="absolute top-1/2 -right-1 -translate-y-1/2 w-2 h-2 bg-slate-900 rotate-45"></div>
                                </div>
                            </a>
                        </div>
                    </div>

                    {/* Sidebar Toggle Action Bar */}
                    <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-[1000] flex items-center gap-4 group">
                        <button
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className="bg-slate-900 dark:bg-slate-900/90 backdrop-blur-xl text-white px-10 py-5 rounded-[30px] font-black uppercase text-xs tracking-[0.2em] shadow-[0_20px_60px_-10px_rgba(0,0,0,0.5)] flex items-center gap-4 hover:scale-105 active:scale-95 transition-all border border-white/10"
                        >
                            <span className="material-symbols-outlined text-xl transition-transform group-hover:rotate-12">
                                {isSidebarOpen ? 'close_fullscreen' : 'list'}
                            </span>
                            {isSidebarOpen ? 'Hide List View' : 'Show List View'}
                        </button>
                    </div>

                    {/* Sub branding Overlay */}
                    <div className="absolute bottom-10 right-10 z-[1000] opacity-30 pointer-events-none hidden md:block">
                        <div className="flex flex-col items-end gap-1">
                            <span className="font-black uppercase tracking-[0.6em] text-[10px] text-slate-500">Travel of Globe</span>
                            <span className="font-bold text-[8px] text-slate-400 uppercase tracking-widest">Elite Map Explorer v1.2</span>
                        </div>
                    </div>
                </section>
            </main>

            {/* Modals */}
            <FilterModal
                isOpen={isFilterModalOpen}
                onClose={() => setIsFilterModalOpen(false)}
                currentFilters={filters}
                onApply={setFilters}
            />
        </div >
    );
};

export default MapView;
