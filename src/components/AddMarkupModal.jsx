import React, { useState, useEffect, useCallback, useRef } from 'react';
import { markupService } from '../services/markupService';
import { agencyService } from '../services/agencyService';
import { locationService } from '../services/locationService';
import { autocompleteService } from '../services/autocompleteService';
import AgencyMultiSelect from './AgencyMultiSelect';

const AddMarkupModal = ({ isOpen, onClose, onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [agencies, setAgencies] = useState([]);
    const [countries, setCountries] = useState([]);
    const [subRegions, setSubRegions] = useState({}); // { countryId: [cities] }
    
    // Get current language
    const currentLang = localStorage.getItem('language') || 'en';

    // Helper to get localized name
    const getLocalizedName = (nameObj) => {
        if (!nameObj) return '';
        return nameObj.translations?.[currentLang] || nameObj.defaultName || nameObj.searchName || '';
    };

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        agencyIds: [],
        priority: 5,
        value: 0,
        nationalityIds: [],
        salesStartDateTime: '',
        salesEndDateTime: '',
        checkinStartDate: '',
        checkoutEndDate: '',
        locationIds: [],
        hotelIds: []
    });

    // Selection helper states
    const [selectedHotels, setSelectedHotels] = useState([]);
    
    // Location groups: [{ id, country: {id, name}, cities: [{id, name}], isEditing: boolean }]
    const [locationGroups, setLocationGroups] = useState([]);
    const [selectedNationalities, setSelectedNationalities] = useState([]); // [{id, name}]

    // Autocomplete state
    const [hotelSearch, setHotelSearch] = useState('');
    const [hotelSuggestions, setHotelSuggestions] = useState([]);
    const [isHotelLoading, setIsHotelLoading] = useState(false);
    const hotelRef = useRef(null);
    const [showHotelSuggestions, setShowHotelSuggestions] = useState(false);
    const [showNationalities, setShowNationalities] = useState(false);
    const [activeCityDropdown, setActiveCityDropdown] = useState(null); // stores groupId

    useEffect(() => {
        if (isOpen) {
            fetchInitialData();
        } else {
            resetForm();
        }
    }, [isOpen]);

    const resetForm = () => {
        setFormData({
            name: '',
            agencyIds: [],
            priority: 5,
            value: 0,
            nationalityIds: [],
            salesStartDateTime: '',
            salesEndDateTime: '',
            checkinStartDate: '',
            checkoutEndDate: '',
            locationIds: [],
            hotelIds: []
        });
        setSelectedHotels([]);
        setLocationGroups([]);
        setSelectedNationalities([]);
        setHotelSearch('');
    };

    const fetchInitialData = async () => {
        try {
            const countryRes = await locationService.listCountries();
            if (countryRes && countryRes.locationList) {
                setCountries(countryRes.locationList);
            }
        } catch (error) {
            console.error("Error fetching initial data:", error);
        }
    };

    const handleHotelSearch = useCallback(async (query) => {
        if (!query || query.length < 3) {
            setHotelSuggestions([]);
            return;
        }
        setIsHotelLoading(true);
        try {
            const res = await autocompleteService.search(query);
            if (res && res.content) {
                setHotelSuggestions(res.content.filter(item => item.type === 'HOTEL'));
            }
        } catch (error) {
            console.error("Hotel search error:", error);
        } finally {
            setIsHotelLoading(false);
        }
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (hotelSearch) handleHotelSearch(hotelSearch);
        }, 300);
        return () => clearTimeout(timer);
    }, [hotelSearch, handleHotelSearch]);

    const addHotel = (hotel) => {
        const hotelIdNum = Number(hotel.hotelId);
        if (formData.hotelIds.includes(hotelIdNum)) return;
        
        setFormData(prev => ({ ...prev, hotelIds: [...prev.hotelIds, hotelIdNum] }));
        setSelectedHotels(prev => [...prev, { 
            id: hotelIdNum, 
            name: getLocalizedName(hotel.name), 
            location: hotel.locationBreadcrumbs?.map(l => getLocalizedName(l.name)).join(', ') 
        }]);
        setHotelSearch('');
        setShowHotelSuggestions(false);
    };

    const removeHotel = (id) => {
        setFormData(prev => ({ ...prev, hotelIds: prev.hotelIds.filter(hId => hId !== id) }));
        setSelectedHotels(prev => prev.filter(h => h.id !== id));
    };

    const addLocationGroup = () => {
        const newGroup = {
            id: Date.now(),
            country: null,
            cities: [],
            isEditing: true
        };
        setLocationGroups(prev => [...prev, newGroup]);
    };

    const setGroupCountry = async (groupId, countryId, countryName) => {
        const cId = Number(countryId);
        await fetchSubRegions(cId);
        
        setLocationGroups(prev => prev.map(g => 
            g.id === groupId ? { ...g, country: { id: cId, name: countryName }, isEditing: false } : g
        ));
    };

    const toggleCityInGroup = (groupId, cityId, cityName) => {
        const cId = Number(cityId);
        setLocationGroups(prev => prev.map(g => {
            if (g.id !== groupId) return g;
            const exists = g.cities.find(c => c.id === cId);
            return {
                ...g,
                cities: exists 
                    ? g.cities.filter(c => c.id !== cId) 
                    : [...g.cities, { id: cId, name: cityName }]
            };
        }));
    };

    const removeLocationGroup = (groupId) => {
        setLocationGroups(prev => prev.filter(g => g.id !== groupId));
    };

    const fetchSubRegions = async (countryId) => {
        if (subRegions[countryId]) return;
        try {
            const res = await locationService.listSubRegions(countryId);
            if (res && res.locationList) {
                setSubRegions(prev => ({ ...prev, [countryId]: res.locationList }));
            }
        } catch (error) {
            console.error("Error fetching sub-regions:", error);
        }
    };

    const toggleNationality = (id, name) => {
        const natId = Number(id);
        if (formData.nationalityIds.includes(natId)) {
            setFormData(prev => ({ ...prev, nationalityIds: prev.nationalityIds.filter(nId => nId !== natId) }));
            setSelectedNationalities(prev => prev.filter(n => n.id !== natId));
        } else {
            setFormData(prev => ({ ...prev, nationalityIds: [...prev.nationalityIds, natId] }));
            setSelectedNationalities(prev => [...prev, { id: natId, name }]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            // ISO format with .00 as requested for specific date fields if needed, 
            // but standard ISO usually works. 
            // format: "2026-09-01T00:00:00.00"
            const formatDateForApi = (dateStr) => {
                if (!dateStr) return null;
                if (dateStr.includes('T')) return dateStr;
                return `${dateStr}T00:00:00.00`;
            };

            // Compute final locationIds
            const finalLocationIds = [];
            locationGroups.forEach(group => {
                if (group.country) {
                    if (group.cities.length > 0) {
                        group.cities.forEach(c => finalLocationIds.push(c.id));
                    } else {
                        finalLocationIds.push(group.country.id);
                    }
                }
            });

            const payload = {
                ...formData,
                locationIds: [...new Set(finalLocationIds)],
                salesStartDateTime: formatDateForApi(formData.salesStartDateTime),
                salesEndDateTime: formatDateForApi(formData.salesEndDateTime),
                // checkin/checkout usually just yyyy-MM-dd
            };

            await markupService.createMarkup(payload);
            onSuccess();
            onClose();
        } catch (error) {
            console.error("Error creating markup:", error);
            // Handle error toast?
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={onClose} />
            
            <div className="relative bg-white dark:bg-[#0B1120] w-full max-w-5xl max-h-[90vh] rounded-[40px] shadow-2xl flex flex-col border border-slate-100 dark:border-white/5 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="p-8 border-b border-slate-50 dark:border-white/5 flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-none mb-2">Create New Markup</h2>
                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Define pricing rules and conditions</p>
                    </div>
                    <button onClick={onClose} className="size-10 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-rose-500 transition-colors">
                        <span className="material-icons-round">close</span>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-10 custom-scrollbar space-y-10">
                    {/* 1. Identity & Value */}
                    <div className="bg-slate-100/30 dark:bg-white/5 p-8 rounded-[32px] border border-slate-200 dark:border-white/10 space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="size-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                <span className="material-icons-round text-lg">badge</span>
                            </div>
                            <h3 className="text-[12px] font-black uppercase tracking-[0.2em] text-slate-800 dark:text-white">Identity & Value</h3>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="md:col-span-1 space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Rule Name *</label>
                                <input 
                                    required
                                    type="text" 
                                    value={formData.name}
                                    onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
                                    className="w-full h-11 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl px-4 text-[11px] font-bold outline-none focus:border-primary transition-all"
                                    placeholder="e.g. Summer Special"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Priority (1-10) *</label>
                                <input 
                                    required
                                    type="number" 
                                    min="1" max="10"
                                    value={formData.priority}
                                    onChange={(e) => setFormData(p => ({ ...p, priority: Number(e.target.value) }))}
                                    className="w-full h-11 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl px-4 text-[11px] font-bold outline-none focus:border-primary transition-all"
                                />
                            </div>
                            
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Markup Value (%) *</label>
                                <div className="relative">
                                    <input 
                                        required
                                        type="number" 
                                        step="0.01"
                                        value={formData.value}
                                        onChange={(e) => setFormData(p => ({ ...p, value: Number(e.target.value) }))}
                                        className="w-full h-11 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl px-4 text-[11px] font-bold outline-none focus:border-primary transition-all pr-12"
                                    />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">%</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 2. Target Agencies */}
                    <div className="bg-slate-100/30 dark:bg-white/5 p-8 rounded-[32px] border border-slate-200 dark:border-white/10 space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="size-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                                <span className="material-icons-round text-lg">corporate_fare</span>
                            </div>
                            <h3 className="text-[12px] font-black uppercase tracking-[0.2em] text-slate-800 dark:text-white">Target Agencies</h3>
                        </div>
                        <div className="max-w-md">
                            <AgencyMultiSelect 
                                selectedValues={formData.agencyIds} 
                                onChange={val => setFormData(p => ({ ...p, agencyIds: val }))} 
                            />
                        </div>
                    </div>

                    {/* 3. Nationalities */}
                    <div className="bg-slate-100/30 dark:bg-white/5 p-8 rounded-[32px] border border-slate-200 dark:border-white/10 space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="size-8 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500">
                                <span className="material-icons-round text-lg">public</span>
                            </div>
                            <h3 className="text-[12px] font-black uppercase tracking-[0.2em] text-slate-800 dark:text-white">Nationalities</h3>
                        </div>
                        <div className="relative max-w-md">
                            <div 
                                onClick={() => setShowNationalities(!showNationalities)}
                                className="min-h-11 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl px-4 py-2 flex flex-wrap gap-1.5 items-center cursor-pointer"
                            >
                                {selectedNationalities.length > 0 ? (
                                    selectedNationalities.map(n => (
                                        <span key={n.id} className="px-2.5 py-1 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300 rounded-lg text-[10px] font-bold flex items-center gap-1.5">
                                            {n.name}
                                            <span onClick={(e) => { e.stopPropagation(); toggleNationality(n.id, n.name); }} className="material-icons-round text-[14px] cursor-pointer hover:text-rose-500">close</span>
                                        </span>
                                    ))
                                ) : <span className="text-[11px] text-slate-400 font-bold ml-1">Select nationalities...</span>}
                                <span className={`material-icons-round text-slate-400 text-sm ml-auto transition-transform ${showNationalities ? 'rotate-180' : ''}`}>expand_more</span>
                            </div>
                            
                            {showNationalities && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setShowNationalities(false)} />
                                    <div className="absolute top-full left-0 right-0 mt-2 max-h-60 overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-[24px] shadow-2xl z-50 p-3 custom-scrollbar animate-in fade-in slide-in-from-top-2">
                                        {countries.map(c => (
                                            <div 
                                                key={c.id} 
                                                onClick={() => toggleNationality(c.locationId, getLocalizedName(c.name))}
                                                className={`px-3 py-2.5 rounded-xl text-[11px] font-bold cursor-pointer transition-colors flex items-center justify-between mb-1 ${formData.nationalityIds.includes(Number(c.locationId)) ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'}`}
                                            >
                                                {getLocalizedName(c.name)}
                                                {formData.nationalityIds.includes(Number(c.locationId)) && <span className="material-icons-round text-xs">check</span>}
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* 4. Dates & Scheduling */}
                    <div className="bg-slate-100/30 dark:bg-white/5 p-8 rounded-[32px] border border-slate-200 dark:border-white/10 space-y-8">
                        <div className="flex items-center gap-3">
                            <div className="size-8 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                                <span className="material-icons-round text-lg">calendar_month</span>
                            </div>
                            <h3 className="text-[12px] font-black uppercase tracking-[0.2em] text-slate-800 dark:text-white">Scheduling Period</h3>
                        </div>
                        
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                            {/* Sales Period */}
                            <div className="space-y-4">
                                <p className="text-[10px] font-black uppercase tracking-widest text-primary/60 px-1">Sales Window</p>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Start Date</label>
                                        <input type="date" value={formData.salesStartDateTime.split('T')[0]} onChange={e => setFormData(p => ({ ...p, salesStartDateTime: e.target.value }))} className="w-full h-11 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl px-4 text-[11px] font-bold outline-none" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">End Date</label>
                                        <input type="date" value={formData.salesEndDateTime.split('T')[0]} onChange={e => setFormData(p => ({ ...p, salesEndDateTime: e.target.value }))} className="w-full h-11 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl px-4 text-[11px] font-bold outline-none" />
                                    </div>
                                </div>
                            </div>
                            {/* Check-in Period */}
                            <div className="space-y-4">
                                <p className="text-[10px] font-black uppercase tracking-widest text-primary/60 px-1">Stay Window</p>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Check-in Start</label>
                                        <input type="date" value={formData.checkinStartDate} onChange={e => setFormData(p => ({ ...p, checkinStartDate: e.target.value }))} className="w-full h-11 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl px-4 text-[11px] font-bold outline-none" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Checkout End</label>
                                        <input type="date" value={formData.checkoutEndDate} onChange={e => setFormData(p => ({ ...p, checkoutEndDate: e.target.value }))} className="w-full h-11 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl px-4 text-[11px] font-bold outline-none" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 5. Hotel Filter */}
                    <div className="bg-slate-100/30 dark:bg-white/5 p-8 rounded-[32px] border border-slate-200 dark:border-white/10 space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="size-8 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                                <span className="material-icons-round text-lg">hotel</span>
                            </div>
                            <h3 className="text-[12px] font-black uppercase tracking-[0.2em] text-slate-800 dark:text-white">Specific Hotels</h3>
                        </div>
                        <div className="relative max-w-2xl" ref={hotelRef}>
                            <div className="relative">
                                <span className="material-icons-round absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
                                <input 
                                    type="text" 
                                    placeholder="Search by hotel name..."
                                    value={hotelSearch}
                                    onChange={(e) => { setHotelSearch(e.target.value); setShowHotelSuggestions(true); }}
                                    onFocus={() => setShowHotelSuggestions(true)}
                                    className="w-full h-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl pl-12 pr-4 text-[11px] font-bold outline-none focus:border-primary transition-all"
                                />
                                {isHotelLoading && (
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 size-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                                )}
                            </div>

                            {/* Hotel Suggestions */}
                            {showHotelSuggestions && hotelSuggestions.length > 0 && (
                                <>
                                    <div className="fixed inset-0 z-[90]" onClick={() => setShowHotelSuggestions(false)} />
                                    <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-[32px] shadow-2xl z-[100] overflow-hidden py-2 animate-in fade-in slide-in-from-top-2">
                                        <div className="max-h-72 overflow-y-auto custom-scrollbar">
                                            {hotelSuggestions
                                                .filter(h => !formData.hotelIds.includes(Number(h.hotelId)))
                                                .map((hotel) => (
                                                    <div 
                                                        key={hotel.id} 
                                                        onClick={() => addHotel(hotel)}
                                                        className="px-5 py-4 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer flex items-center gap-5 group transition-colors"
                                                    >
                                                        <div className="size-12 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-primary dark:text-blue-400 group-hover:scale-110 transition-transform">
                                                            <span className="material-icons-round text-xl">king_bed</span>
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-[12px] font-black text-slate-800 dark:text-white truncate tracking-tight">
                                                                {getLocalizedName(hotel.name)}
                                                            </p>
                                                            <p className="text-[10px] font-bold text-slate-400 truncate mt-1">
                                                                {hotel.locationBreadcrumbs?.map(l => getLocalizedName(l.name)).join(', ')}
                                                            </p>
                                                        </div>
                                                    </div>
                                                ))}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Hotel Tags */}
                        <div className="flex flex-wrap gap-2.5">
                            {selectedHotels.map(h => (
                                <div key={h.id} className="px-4 py-2 bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800/30 rounded-2xl flex items-center gap-4 animate-in zoom-in">
                                    <div className="flex flex-col">
                                        <span className="text-[11px] font-black text-primary dark:text-blue-300 uppercase leading-none">{h.name}</span>
                                        <span className="text-[9px] font-bold text-slate-500 mt-1">{h.location}</span>
                                    </div>
                                    <button onClick={() => removeHotel(h.id)} className="text-slate-400 hover:text-rose-500 transition-colors">
                                        <span className="material-icons-round text-lg">cancel</span>
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 6. Locations filter */}
                    <div className="bg-slate-100/30 dark:bg-white/5 p-8 rounded-[32px] border border-slate-200 dark:border-white/10 space-y-8">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="size-8 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-500">
                                    <span className="material-icons-round text-lg">map</span>
                                </div>
                                <h3 className="text-[12px] font-black uppercase tracking-[0.2em] text-slate-800 dark:text-white">Locations & Regions</h3>
                            </div>
                            <button 
                                type="button"
                                onClick={addLocationGroup}
                                className="h-9 px-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-slate-900/10"
                            >
                                <span className="material-icons-round text-base">add_location</span>
                                Add Country
                            </button>
                        </div>
                        
                        <div className="space-y-4">
                            {locationGroups.map((group) => (
                                <div key={group.id} className="bg-white/50 dark:bg-slate-900/50 p-6 rounded-[28px] border border-slate-200/60 dark:border-white/5 space-y-6 animate-in slide-in-from-left-2">
                                    <div className="flex flex-wrap items-center gap-6">
                                        {/* Country Selection */}
                                        <div className="w-64 space-y-2">
                                            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 px-1">Country</label>
                                            {!group.country ? (
                                                <select 
                                                    className="w-full h-11 bg-white dark:bg-slate-900 border-2 border-primary/20 dark:border-primary/10 rounded-2xl px-4 text-[11px] font-bold outline-none cursor-pointer focus:border-primary transition-all animate-pulse"
                                                    onChange={(e) => {
                                                        const opt = e.target.options[e.target.selectedIndex];
                                                        if (opt.value) setGroupCountry(group.id, opt.value, opt.text);
                                                    }}
                                                >
                                                    <option value="">Choose Country...</option>
                                                    {countries.map(c => (
                                                        <option key={c.id} value={c.locationId}>{getLocalizedName(c.name)}</option>
                                                    ))}
                                                </select>
                                            ) : (
                                                <div className="h-11 px-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/30 rounded-2xl flex items-center gap-3">
                                                    <span className="material-icons-round text-emerald-600 dark:text-emerald-400 text-lg">public</span>
                                                    <span className="text-[11px] font-black text-emerald-700 dark:text-emerald-300 uppercase truncate flex-1">{group.country.name}</span>
                                                    <button onClick={() => removeLocationGroup(group.id)} className="text-slate-400 hover:text-rose-500 transition-colors">
                                                        <span className="material-icons-round text-lg">cancel</span>
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        {/* City Multi-Selection (Optional) */}
                                        {group.country && (
                                            <div className="flex-1 min-w-[300px] space-y-2">
                                                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 px-1">Cities (Optional - Leave blank for all)</label>
                                                <div className="flex flex-wrap gap-4 items-center">
                                                    <div className="relative">
                                                        <div 
                                                            onClick={() => setActiveCityDropdown(activeCityDropdown === group.id ? null : group.id)}
                                                            className="h-11 px-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl flex items-center gap-3 cursor-pointer min-w-[180px]"
                                                        >
                                                            <span className="material-icons-round text-slate-400 text-lg">location_city</span>
                                                            <span className="text-[10px] font-black text-slate-400 uppercase">Add Cities...</span>
                                                            <span className={`material-icons-round text-slate-400 text-sm ml-auto transition-transform ${activeCityDropdown === group.id ? 'rotate-180' : ''}`}>expand_more</span>
                                                        </div>
                                                        
                                                        {activeCityDropdown === group.id && (
                                                            <>
                                                                <div className="fixed inset-0 z-40" onClick={() => setActiveCityDropdown(null)} />
                                                                <div className="absolute top-full left-0 mt-2 w-72 max-h-60 overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl shadow-2xl z-50 p-3 custom-scrollbar animate-in fade-in slide-in-from-top-2">
                                                                    {(subRegions[group.country.id] || []).map(city => (
                                                                        <div 
                                                                            key={city.id} 
                                                                            onClick={() => toggleCityInGroup(group.id, city.locationId, getLocalizedName(city.name))}
                                                                            className={`px-3 py-2.5 rounded-xl text-[11px] font-bold cursor-pointer transition-colors flex items-center justify-between mb-1 ${group.cities.some(c => c.id === Number(city.locationId)) ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'}`}
                                                                        >
                                                                            {getLocalizedName(city.name)}
                                                                            {group.cities.some(c => c.id === Number(city.locationId)) && <span className="material-icons-round text-xs">check</span>}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>

                                                    {/* City Tags */}
                                                    <div className="flex flex-wrap gap-2">
                                                        {group.cities.map(city => (
                                                            <span key={city.id} className="px-3 py-1.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/30 rounded-xl text-[9px] font-black text-amber-700 dark:text-amber-300 uppercase flex items-center gap-2">
                                                                {city.name}
                                                                <span onClick={() => toggleCityInGroup(group.id, city.id, city.name)} className="material-icons-round text-[14px] cursor-pointer hover:text-rose-500">close</span>
                                                            </span>
                                                        ))}
                                                        {group.cities.length === 0 && (
                                                            <span className="text-[10px] font-bold text-slate-400 italic px-2">All regions in {group.country.name}</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                            
                            {locationGroups.length === 0 && (
                                <div className="py-12 border-2 border-dashed border-slate-100 dark:border-white/5 rounded-[32px] flex flex-col items-center justify-center space-y-4 opacity-50">
                                    <div className="size-16 rounded-full bg-slate-50 dark:bg-white/5 flex items-center justify-center text-slate-300">
                                        <span className="material-icons-round text-4xl">travel_explore</span>
                                    </div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">No Location Filters Defined</p>
                                    <button 
                                        type="button"
                                        onClick={addLocationGroup}
                                        className="text-[10px] font-black uppercase text-primary hover:underline underline-offset-4"
                                    >
                                        + Click to add your first location
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="sticky bottom-0 bg-white dark:bg-[#0B1120] border-t border-slate-100 dark:border-white/5 pt-8 flex items-center justify-end gap-5">
                        <button 
                            type="button" 
                            onClick={onClose}
                            className="px-10 h-14 rounded-2xl text-[12px] font-black uppercase tracking-widest text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 transition-all"
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit"
                            disabled={loading}
                            className="px-14 h-14 bg-primary text-white rounded-2xl text-[12px] font-black uppercase tracking-widest shadow-2xl shadow-primary/30 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-4 disabled:opacity-50"
                        >
                            {loading ? (
                                <div className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    Publish Rule
                                    <span className="material-icons-round text-xl">auto_awesome</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddMarkupModal;
