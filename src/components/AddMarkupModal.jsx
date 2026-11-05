import React, { useState, useEffect, useCallback, useRef } from 'react';
import { markupService } from '../services/markupService';
import { geographyService } from '../services/geographyService';
import { autocompleteService } from '../services/autocompleteService';
import AgencyMultiSelect from './AgencyMultiSelect';

const AddMarkupModal = ({ isOpen, onClose, onSuccess, editData, hideAgencySelect = false }) => {
    const [loading, setLoading] = useState(false);
    const [countries, setCountries] = useState([]);
    
    // Get current language
    const currentLang = localStorage.getItem('language') || 'en';

    // Helper to get localized name
    const getLocalizedName = (nameObj) => {
        if (!nameObj) return '';
        if (typeof nameObj === 'string') return nameObj;
        
        const translations = nameObj.translations || {};
        
        // 1. Current locale
        if (translations[currentLang]) return translations[currentLang];
        
        // 2. "tr" (Turkish)
        if (translations['tr']) return translations['tr'];
        
        // 3. First available language data
        const availableLangs = Object.keys(translations);
        if (availableLangs.length > 0) return translations[availableLangs[0]];
        
        return nameObj.defaultName || nameObj.searchName || '';
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
        locationRegionIds: [],
        hotelIds: [],
        cancelPolicy: '',
        priceRanges: []
    });

    // Selection helper states
    const [selectedHotels, setSelectedHotels] = useState([]);
    const [selectedNationalities, setSelectedNationalities] = useState([]);
    
    // Autocomplete & UI states
    const [hotelSearch, setHotelSearch] = useState('');
    const [hotelSuggestions, setHotelSuggestions] = useState([]);
    const [isHotelLoading, setIsHotelLoading] = useState(false);
    const [apiError, setApiError] = useState(null);
    const [nationalitySearch, setNationalitySearch] = useState('');
    const [showHotelSuggestions, setShowHotelSuggestions] = useState(false);
    const [showNationalities, setShowNationalities] = useState(false);

    // Location autocomplete states
    const [locationSearch, setLocationSearch] = useState('');
    const [locationSuggestions, setLocationSuggestions] = useState([]);
    const [isLocationLoading, setIsLocationLoading] = useState(false);
    const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
    // selectedLocations: array of { regionId: string, name: string, locationType: string }
    const [selectedLocations, setSelectedLocations] = useState([]);

    // Refs
    const modalBodyRef = useRef(null);
    const hotelRef = useRef(null);

    useEffect(() => {
        if (isOpen) {
            fetchInitialData();
        }
        
        if (isOpen && editData) {
            // Populate basic form fields
            setFormData({
                name: editData.name || '',
                agencyIds: editData.agencies?.map(a => a.id) || [],
                priority: editData.priority || '5',
                value: editData.value || '',
                nationalityIds: editData.nationalities?.map(n => n.dbId || n.locationId || n.id).filter(Boolean) || [],
                salesStartDateTime: editData.salesStartDateTime ? editData.salesStartDateTime.split('T')[0] : '',
                salesEndDateTime: editData.salesEndDateTime ? editData.salesEndDateTime.split('T')[0] : '',
                checkinStartDate: editData.checkinStartDate || '',
                checkoutEndDate: editData.checkoutEndDate || '',
                locationRegionIds: editData.locations?.map(l => l.regionId || String(l.locationId)).filter(Boolean) || [],
                hotelIds: editData.hotels?.map(h => h.hotelId || h.id) || [],
                cancelPolicy: editData.cancelPolicy || '',
                priceRanges: editData.priceRanges
                    ? editData.priceRanges.map(pr => ({
                        minPrice: pr.minPrice ?? '',
                        maxPrice: pr.maxPrice ?? '',
                        value: pr.value ?? ''
                    }))
                    : []
            });

            // Populate selection helpers
            setSelectedHotels(editData.hotels?.map(h => ({
                id: h.hotelId || h.id,
                name: h.name
            })) || []);

            setSelectedNationalities(editData.nationalities?.map(n => ({
                id: n.dbId || n.locationId || n.id,
                name: getLocalizedName(n.name)
            })).filter(n => n.id) || []);

            // Populate selected locations from edit data
            const editLocations = editData.locations || editData.regions || [];
            setSelectedLocations(editLocations.map(l => ({
                regionId: l.regionId || String(l.locationId),
                name: typeof l.name === 'string' ? l.name : getLocalizedName(l.name),
                locationType: l.locationType || l.type || ''
            })).filter(l => l.regionId));
        } else if (isOpen) {
            resetForm();
        }
    }, [isOpen, editData]);

    const resetForm = () => {
        setFormData({
            name: '',
            agencyIds: [],
            priority: '5',
            value: '',
            nationalityIds: [],
            salesStartDateTime: '',
            salesEndDateTime: '',
            checkinStartDate: '',
            checkoutEndDate: '',
            locationRegionIds: [],
            hotelIds: [],
            cancelPolicy: '',
            priceRanges: []
        });
        setSelectedHotels([]);
        setSelectedNationalities([]);
        setSelectedLocations([]);
        setHotelSearch('');
        setNationalitySearch('');
        setLocationSearch('');
        setLocationSuggestions([]);
    };

    // Price range helpers
    const addPriceRange = () => {
        setFormData(prev => ({
            ...prev,
            priceRanges: [...prev.priceRanges, { minPrice: '', maxPrice: '', value: '' }]
        }));
    };

    const removePriceRange = (index) => {
        setFormData(prev => ({
            ...prev,
            priceRanges: prev.priceRanges.filter((_, i) => i !== index)
        }));
    };

    const updatePriceRange = (index, field, val) => {
        // Allow only valid decimal numbers (BigDecimal compatible)
        if (val !== '' && !/^\d*\.?\d*$/.test(val)) return;
        setFormData(prev => {
            const updated = [...prev.priceRanges];
            updated[index] = { ...updated[index], [field]: val };
            return { ...prev, priceRanges: updated };
        });
    };

    const fetchInitialData = async () => {
        try {
            const countryRes = await geographyService.listCountries();
            const list = countryRes?.regionList || countryRes?.locationList;
            if (list) {
                setCountries(list);
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
            const res = await autocompleteService.search({ 
                query, 
                types: ["PROPERTY"] 
            });
            if (res && res.content) {
                const mappedHotels = res.content
                    .filter(item => item.type === 'PROPERTY' || item.type === 'HOTEL')
                    .map(item => ({
                        ...item,
                        hotelId: item.togId || (item.id?.includes('property_') ? item.id.replace('property_', '') : (item.id?.includes('hotel_') ? item.id.replace('hotel_', '') : item.id))
                    }));
                setHotelSuggestions(mappedHotels);
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
        
        const locString = (hotel.ancestors?.map(l => typeof l.name === 'string' ? l.name : getLocalizedName(l.name)) || hotel.locationBreadcrumbs?.map(l => getLocalizedName(l.name)) || []).join(', ');

        setFormData(prev => ({ ...prev, hotelIds: [...prev.hotelIds, hotelIdNum] }));
        setSelectedHotels(prev => [...prev, { 
            id: hotelIdNum, 
            name: getLocalizedName(hotel.name), 
            location: locString 
        }]);
        setHotelSearch('');
        setShowHotelSuggestions(false);
    };

    const removeHotel = (id) => {
        setFormData(prev => ({ ...prev, hotelIds: prev.hotelIds.filter(hId => hId !== id) }));
        setSelectedHotels(prev => prev.filter(h => h.id !== id));
    };


    const toggleNationality = (dbId, name) => {
        const natId = Number(dbId);
        if (!natId) return; // null/undefined guard
        if (formData.nationalityIds.includes(natId)) {
            setFormData(prev => ({ ...prev, nationalityIds: prev.nationalityIds.filter(nId => nId !== natId) }));
            setSelectedNationalities(prev => prev.filter(n => n.id !== natId));
        } else {
            setFormData(prev => ({ ...prev, nationalityIds: [...prev.nationalityIds, natId] }));
            setSelectedNationalities(prev => [...prev, { id: natId, name }]);
        }
    };

    // ── Location autocomplete ──────────────────────────────────────────────
    const getLocalizedLocationName = useCallback((item) => {
        const translations = item?.name?.translations || {};
        // Try exact lang, then base lang (e.g. "tr" from "tr-TR"), then "en", then searchName
        return translations[currentLang]
            || translations[currentLang.split('-')[0]]
            || translations['en']
            || item?.name?.searchName?.split(' ')[0]
            || '';
    }, [currentLang]);

    const handleLocationSearch = useCallback(async (query, signal) => {
        if (!query || query.length < 3) {
            setLocationSuggestions([]);
            setIsLocationLoading(false);
            return;
        }
        setIsLocationLoading(true);
        try {
            const res = await autocompleteService.search({ query, types: ['GEOGRAPHY_REGION'] }, signal);
            setLocationSuggestions(res?.content || []);
        } catch (err) {
            if (err?.name !== 'AbortError') console.error('Location search error:', err);
        } finally {
            setIsLocationLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!locationSearch || locationSearch.length < 3) {
            setLocationSuggestions([]);
            setIsLocationLoading(false);
            return;
        }
        setIsLocationLoading(true);
        const controller = new AbortController();
        const timer = setTimeout(() => {
            handleLocationSearch(locationSearch, controller.signal);
        }, 300);
        return () => {
            clearTimeout(timer);
            controller.abort();
        };
    }, [locationSearch, handleLocationSearch]);

    const addLocation = (item) => {
        const regionId = item.regionId;
        if (!regionId || formData.locationRegionIds.includes(regionId)) return;
        const name = getLocalizedLocationName(item);
        setFormData(prev => ({ ...prev, locationRegionIds: [...prev.locationRegionIds, regionId] }));
        setSelectedLocations(prev => [...prev, { regionId, name, locationType: item.locationType || '' }]);
        setLocationSearch('');
        setLocationSuggestions([]);
        setShowLocationSuggestions(false);
    };

    const removeLocation = (regionId) => {
        setFormData(prev => ({ ...prev, locationRegionIds: prev.locationRegionIds.filter(id => id !== regionId) }));
        setSelectedLocations(prev => prev.filter(l => l.regionId !== regionId));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setApiError(null);
        try {
            const formatDateForApi = (dateStr) => {
                if (!dateStr) return null;
                if (dateStr.includes('T')) return dateStr;
                return `${dateStr}T00:00:00.00`;
            };

            const payload = {
                name: formData.name,
                agencyIds: formData.agencyIds,
                feedIds: [],
                supplierIds: [],
                priority: Number(formData.priority) || 0,
                value: Number(formData.value) || 0,
                nationalityIds: formData.nationalityIds,
                salesStartDateTime: formatDateForApi(formData.salesStartDateTime),
                salesEndDateTime: formatDateForApi(formData.salesEndDateTime),
                checkinStartDate: formData.checkinStartDate || null,
                checkoutEndDate: formData.checkoutEndDate || null,
                hotelIds: formData.hotelIds,
                locationIds: formData.locationRegionIds,
                status: editData ? editData.status : "ACTIVE",
                cancelPolicy: formData.cancelPolicy || null,
                priceRanges: formData.priceRanges.length > 0
                    ? formData.priceRanges.map(pr => ({
                        minPrice: pr.minPrice !== '' ? Number(pr.minPrice) : null,
                        maxPrice: pr.maxPrice !== '' ? Number(pr.maxPrice) : null,
                        value: pr.value !== '' ? Number(pr.value) : null
                    }))
                    : null
            };

            if (editData) {
                await markupService.updateMarkup(editData.id, payload);
            } else {
                await markupService.createMarkup(payload);
            }
            onSuccess();
            onClose();
        } catch (error) {
            console.error("Error creating markup:", error);
            const errorMessage = error.response?.data?.message || error.message || "An unexpected error occurred while saving the markup.";
            setApiError(errorMessage);
            if (modalBodyRef.current) {
                modalBodyRef.current.scrollTo({ top: 0, behavior: 'smooth' });
            }
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity" onClick={onClose} />
            
            <div className="relative bg-white dark:bg-slate-900 w-full max-w-3xl max-h-[90vh] rounded-xl shadow-xl flex flex-col border border-slate-200 dark:border-white/10 animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 dark:border-white/5 flex items-center justify-between shrink-0">
                    <div>
                        <h2 className="text-base font-semibold text-slate-900 dark:text-white leading-none mb-1">
                            {editData ? 'Edit Markup Rule' : 'Create New Markup'}
                        </h2>
                        <p className="text-[11px] font-medium text-slate-400">Define pricing rules and conditions</p>
                    </div>
                    <button onClick={onClose} className="size-7 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-white transition-all">
                        <span className="material-icons-round text-lg">close</span>
                    </button>
                </div>

                <form 
                    ref={modalBodyRef}
                    onSubmit={handleSubmit} 
                    className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4"
                >
                    {apiError && (
                        <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-500/30 rounded-lg p-3 flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                            <span className="material-icons-round text-rose-500 text-lg">error_outline</span>
                            <div className="flex-1">
                                <p className="text-xs font-semibold text-rose-600 dark:text-rose-300">{apiError}</p>
                            </div>
                            <button 
                                type="button"
                                onClick={() => setApiError(null)}
                                className="text-rose-400 hover:text-rose-600 transition-colors"
                            >
                                <span className="material-icons-round text-base">close</span>
                            </button>
                        </div>
                    )}

                    {/* 1. Identity & Value */}
                    <div className="bg-slate-50/50 dark:bg-slate-900/30 p-4 rounded-xl border border-slate-100 dark:border-white/5 space-y-3">
                        <div className="flex items-center gap-2">
                            <div className="size-6 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                <span className="material-icons-round text-sm">badge</span>
                            </div>
                            <h3 className="text-xs font-semibold text-slate-800 dark:text-white">Identity & Value</h3>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div className="md:col-span-1 space-y-1">
                                <label className="text-[11px] font-medium text-slate-600 dark:text-slate-300">Rule Name *</label>
                                <input 
                                    required
                                    type="text" 
                                    value={formData.name}
                                    onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
                                    className="w-full h-9 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 text-xs font-medium outline-none focus:border-primary transition-all"
                                    placeholder="Rule name"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-[11px] font-medium text-slate-600 dark:text-slate-300">Priority (1 highest) *</label>
                                <div className="relative">
                                    <select 
                                        value={formData.priority}
                                        onChange={(e) => setFormData(p => ({ ...p, priority: e.target.value }))}
                                        className="w-full h-9 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 text-xs font-medium outline-none focus:border-primary transition-all appearance-none cursor-pointer"
                                    >
                                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(p => (
                                            <option key={p} value={p}>{p}</option>
                                        ))}
                                    </select>
                                    <span className="material-icons-round absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-base">expand_more</span>
                                </div>
                            </div>
                            
                            <div className="space-y-1">
                                <label className="text-[11px] font-medium text-slate-600 dark:text-slate-300">Markup Value (%) *</label>
                                <div className="relative">
                                    <input 
                                        required
                                        type="text" 
                                        value={formData.value}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            if (val === '') {
                                                setFormData(p => ({ ...p, value: '' }));
                                                return;
                                            }
                                            const cleanVal = val.replace(/[^0-9.]/g, '');
                                            const parts = cleanVal.split('.');
                                            if (parts.length > 2) return;
                                            if (parts[0].length > 2) return;
                                            if (parts[1] && parts[1].length > 1) return;
                                            setFormData(p => ({ ...p, value: cleanVal }));
                                        }}
                                        className="w-full h-9 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 pr-8 text-xs font-medium outline-none focus:border-primary transition-all"
                                        placeholder="0.00"
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-semibold">%</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {!hideAgencySelect && (
                        <div className="bg-slate-50/50 dark:bg-slate-900/30 p-4 rounded-xl border border-slate-100 dark:border-white/5 space-y-3">
                            <div className="flex items-center gap-2">
                                <div className="size-6 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                                    <span className="material-icons-round text-sm">corporate_fare</span>
                                </div>
                                <h3 className="text-xs font-semibold text-slate-800 dark:text-white">Target Agencies</h3>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[11px] font-medium text-slate-600 dark:text-slate-300">Agencies & Agency Groups</label>
                                <AgencyMultiSelect 
                                    selectedValues={formData.agencyIds}
                                    onChange={(values) => setFormData(prev => ({ ...prev, agencyIds: values }))}
                                />
                            </div>
                        </div>
                    )}

                    {/* 3. Nationalities */}
                    <div className="bg-slate-50/50 dark:bg-slate-900/30 p-4 rounded-xl border border-slate-100 dark:border-white/5 space-y-3">
                        <div className="flex items-center gap-2">
                            <div className="size-6 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-500">
                                <span className="material-icons-round text-sm">public</span>
                            </div>
                            <h3 className="text-xs font-semibold text-slate-800 dark:text-white">Nationalities</h3>
                        </div>
                        <div className="relative max-w-md">
                            <div 
                                onClick={() => setShowNationalities(!showNationalities)}
                                className="min-h-9 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 flex flex-wrap gap-1 items-center cursor-pointer"
                            >
                                {selectedNationalities.length > 0 ? (
                                    selectedNationalities.map(n => (
                                        <span key={n.id} className="px-2 py-0.5 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300 rounded text-[10px] font-semibold flex items-center gap-1">
                                            {n.name}
                                            <span onClick={(e) => { e.stopPropagation(); toggleNationality(n.id, n.name); }} className="material-icons-round text-[12px] cursor-pointer hover:text-rose-500">close</span>
                                        </span>
                                    ))
                                ) : <span className="text-xs text-slate-400 font-medium">Select nationalities...</span>}
                                <span className={`material-icons-round text-slate-400 text-sm ml-auto transition-transform ${showNationalities ? 'rotate-180' : ''}`}>expand_more</span>
                            </div>
                            
                            {showNationalities && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => { setShowNationalities(false); setNationalitySearch(''); }} />
                                    <div className="absolute top-full left-0 right-0 mt-1 max-h-64 overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 flex flex-col animate-in fade-in slide-in-from-top-2">
                                        <div className="p-2 border-b border-slate-100 dark:border-slate-800">
                                            <div className="relative">
                                                <span className="material-icons-round absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">search</span>
                                                <input 
                                                    type="text" 
                                                    placeholder="Search nationalities..." 
                                                    value={nationalitySearch}
                                                    onChange={(e) => setNationalitySearch(e.target.value)}
                                                    autoFocus
                                                    className="w-full h-8 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg pl-8 pr-3 text-xs font-medium outline-none focus:border-primary transition-all"
                                                />
                                            </div>
                                        </div>
                                        <div className="flex-1 overflow-y-auto p-1 custom-scrollbar max-h-48">
                                            {countries
                                                .filter(c => getLocalizedName(c.name).toLowerCase().includes(nationalitySearch.toLowerCase()))
                                                .map(c => (
                                                    <div 
                                                        key={c.id} 
                                                        onClick={() => toggleNationality(c.dbId, getLocalizedName(c.name))}
                                                        className={`px-2.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors flex items-center justify-between mb-0.5 ${formData.nationalityIds.includes(c.dbId) ? 'bg-primary text-white' : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'}`}
                                                    >
                                                        {getLocalizedName(c.name)}
                                                        {formData.nationalityIds.includes(c.dbId) && <span className="material-icons-round text-xs">check</span>}
                                                    </div>
                                                ))}
                                            {countries.filter(c => getLocalizedName(c.name).toLowerCase().includes(nationalitySearch.toLowerCase())).length === 0 && (
                                                <div className="p-3 text-center text-xs font-medium text-slate-400">No results found</div>
                                            )}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* 4. Sales Date & Check-in Date */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-slate-50/50 dark:bg-slate-900/30 p-4 rounded-xl border border-slate-100 dark:border-white/5 space-y-3">
                            <div className="flex items-center gap-2">
                                <div className="size-6 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
                                    <span className="material-icons-round text-sm">calendar_today</span>
                                </div>
                                <h3 className="text-xs font-semibold text-slate-800 dark:text-white">Sales Period</h3>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-1">
                                    <label className="text-[11px] font-medium text-slate-600 dark:text-slate-300">Start Date</label>
                                    <input 
                                        type="date"
                                        value={formData.salesStartDateTime}
                                        onChange={(e) => setFormData(p => ({ ...p, salesStartDateTime: e.target.value }))}
                                        className="w-full h-9 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 text-xs font-medium outline-none focus:border-primary"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[11px] font-medium text-slate-600 dark:text-slate-300">End Date</label>
                                    <input 
                                        type="date"
                                        value={formData.salesEndDateTime}
                                        onChange={(e) => setFormData(p => ({ ...p, salesEndDateTime: e.target.value }))}
                                        className="w-full h-9 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 text-xs font-medium outline-none focus:border-primary"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-50/50 dark:bg-slate-900/30 p-4 rounded-xl border border-slate-100 dark:border-white/5 space-y-3">
                            <div className="flex items-center gap-2">
                                <div className="size-6 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500">
                                    <span className="material-icons-round text-sm">hotel</span>
                                </div>
                                <h3 className="text-xs font-semibold text-slate-800 dark:text-white">Stay Period</h3>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-1">
                                    <label className="text-[11px] font-medium text-slate-600 dark:text-slate-300">Check-in</label>
                                    <input 
                                        type="date"
                                        value={formData.checkinStartDate}
                                        onChange={(e) => setFormData(p => ({ ...p, checkinStartDate: e.target.value }))}
                                        className="w-full h-9 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 text-xs font-medium outline-none focus:border-primary"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[11px] font-medium text-slate-600 dark:text-slate-300">Check-out</label>
                                    <input 
                                        type="date"
                                        value={formData.checkoutEndDate}
                                        onChange={(e) => setFormData(p => ({ ...p, checkoutEndDate: e.target.value }))}
                                        className="w-full h-9 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 text-xs font-medium outline-none focus:border-primary"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 5. Hotels & Destinations */}
                    <div className="bg-slate-50/50 dark:bg-slate-900/30 p-4 rounded-xl border border-slate-100 dark:border-white/5 space-y-3">
                        <div className="flex items-center gap-2">
                            <div className="size-6 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-500">
                                <span className="material-icons-round text-sm">location_city</span>
                            </div>
                            <h3 className="text-xs font-semibold text-slate-800 dark:text-white">Hotels & Destinations</h3>
                        </div>

                        {/* Hotel Search */}
                        <div className="relative" ref={hotelRef}>
                            <label className="text-[11px] font-medium text-slate-600 dark:text-slate-300 mb-1 block">Specific Hotels</label>
                            <div className="min-h-9 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 flex flex-wrap gap-1 items-center">
                                {selectedHotels.map(h => (
                                    <span key={h.id} className="px-2 py-0.5 bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-300 rounded text-[10px] font-semibold flex items-center gap-1">
                                        {h.name}
                                        <span onClick={() => removeHotel(h.id)} className="material-icons-round text-[12px] cursor-pointer hover:text-rose-700">close</span>
                                    </span>
                                ))}
                                <input 
                                    type="text"
                                    value={hotelSearch}
                                    onChange={(e) => { setHotelSearch(e.target.value); setShowHotelSuggestions(true); }}
                                    placeholder={selectedHotels.length === 0 ? "Search hotels by name..." : "Add more..."}
                                    className="flex-1 min-w-[120px] bg-transparent text-xs font-medium outline-none placeholder:text-slate-400"
                                />
                            </div>

                            {showHotelSuggestions && (
                                <div className="absolute top-full left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 p-1 custom-scrollbar">
                                    {isHotelLoading ? (
                                        <div className="p-3 text-center text-xs font-medium text-slate-400 flex items-center justify-center gap-2">
                                            <div className="size-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                                            Searching...
                                        </div>
                                    ) : hotelSuggestions.length > 0 ? (
                                        hotelSuggestions.map(h => (
                                            <div 
                                                key={h.id}
                                                onClick={() => addHotel(h)}
                                                className="px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg cursor-pointer transition-colors text-xs font-medium text-slate-700 dark:text-slate-300"
                                            >
                                                {getLocalizedName(h.name)}
                                            </div>
                                        ))
                                    ) : (
                                        <div className="p-3 text-center text-xs font-medium text-slate-400">No hotels found</div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Location Autocomplete */}
                        <div className="relative">
                            <label className="text-[11px] font-medium text-slate-600 dark:text-slate-300 mb-1 block">Regions / Cities</label>
                            {/* Selected tags */}
                            {selectedLocations.length > 0 && (
                                <div className="flex flex-wrap gap-1 mb-1.5">
                                    {selectedLocations.map(loc => (
                                        <span
                                            key={loc.regionId}
                                            className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 rounded text-[10px] font-semibold flex items-center gap-1"
                                        >
                                            {loc.name}
                                            {loc.locationType && (
                                                <span className="text-blue-400 dark:text-blue-500 font-normal">· {loc.locationType}</span>
                                            )}
                                            <span
                                                onClick={() => removeLocation(loc.regionId)}
                                                className="material-icons-round text-[12px] cursor-pointer hover:text-rose-500 ml-0.5"
                                            >close</span>
                                        </span>
                                    ))}
                                </div>
                            )}
                            {/* Search input */}
                            <div className="relative">
                                <span className="material-icons-round absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none">search</span>
                                <input
                                    type="text"
                                    value={locationSearch}
                                    onChange={(e) => {
                                        setLocationSearch(e.target.value);
                                        setShowLocationSuggestions(true);
                                    }}
                                    onFocus={() => locationSearch.length >= 3 && setShowLocationSuggestions(true)}
                                    placeholder="Type at least 3 characters to search regions, cities..."
                                    className="w-full h-9 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg pl-8 pr-3 text-xs font-medium outline-none focus:border-primary transition-all"
                                />
                                {isLocationLoading && (
                                    <div className="absolute right-2.5 top-1/2 -translate-y-1/2 size-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                )}
                            </div>

                            {/* Dropdown */}
                            {showLocationSuggestions && locationSearch.length >= 3 && (
                                <>
                                    <div
                                        className="fixed inset-0 z-40"
                                        onClick={() => { setShowLocationSuggestions(false); }}
                                    />
                                    <div className="absolute top-full left-0 right-0 mt-1 max-h-60 overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 p-1 custom-scrollbar animate-in fade-in slide-in-from-top-2">
                                        {isLocationLoading ? (
                                            <div className="p-3 text-center text-xs font-medium text-slate-400 flex items-center justify-center gap-2">
                                                <div className="size-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                                Searching...
                                            </div>
                                        ) : locationSuggestions.length > 0 ? (
                                            locationSuggestions.map(item => {
                                                const name = getLocalizedLocationName(item);
                                                const isSelected = formData.locationRegionIds.includes(item.regionId);
                                                const locationTypeColors = {
                                                    city: 'text-blue-500',
                                                    country: 'text-emerald-500',
                                                    province_state: 'text-purple-500',
                                                    continent: 'text-orange-500',
                                                    airport: 'text-sky-500',
                                                    neighborhood: 'text-pink-500',
                                                };
                                                const typeColor = locationTypeColors[item.locationType] || 'text-slate-400';
                                                return (
                                                    <div
                                                        key={item.id}
                                                        onClick={() => !isSelected && addLocation(item)}
                                                        className={`px-3 py-2 rounded-lg cursor-pointer transition-colors flex items-center justify-between gap-2 mb-0.5 ${
                                                            isSelected
                                                                ? 'bg-blue-50 dark:bg-blue-900/20 cursor-default'
                                                                : 'hover:bg-slate-50 dark:hover:bg-slate-800'
                                                        }`}
                                                    >
                                                        <div className="flex items-center gap-2 min-w-0">
                                                            <span className="material-icons-round text-slate-300 text-sm shrink-0">location_on</span>
                                                            <div className="min-w-0">
                                                                <div className="flex items-center gap-1.5">
                                                                    <span className="text-xs font-medium text-slate-700 dark:text-slate-200 truncate">
                                                                        {name}
                                                                    </span>
                                                                    {item.locationType && (
                                                                        <span className={`text-[10px] font-semibold shrink-0 ${typeColor}`}>
                                                                            {item.locationType}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                {item.locationPath && (
                                                                    <p className="text-[10px] text-slate-400 truncate">{item.locationPath}</p>
                                                                )}
                                                            </div>
                                                        </div>
                                                        {isSelected && (
                                                            <span className="material-icons-round text-blue-500 text-sm shrink-0">check_circle</span>
                                                        )}
                                                    </div>
                                                );
                                            })
                                        ) : (
                                            <div className="p-3 text-center text-xs font-medium text-slate-400">No results found</div>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* 6. Price Ranges */}
                    <div className="bg-slate-50/50 dark:bg-slate-900/30 p-4 rounded-xl border border-slate-100 dark:border-white/5 space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="size-6 rounded-lg bg-teal-500/10 flex items-center justify-center text-teal-500">
                                    <span className="material-icons-round text-sm">price_change</span>
                                </div>
                                <h3 className="text-xs font-semibold text-slate-800 dark:text-white">Price Ranges</h3>
                                <span className="text-[10px] font-medium text-slate-400">(optional)</span>
                            </div>
                            <button
                                type="button"
                                onClick={addPriceRange}
                                className="h-7 px-2.5 rounded-lg bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400 text-[11px] font-semibold flex items-center gap-1 hover:bg-teal-100 dark:hover:bg-teal-900/40 transition-all"
                            >
                                <span className="material-icons-round text-sm">add</span>
                                Add Range
                            </button>
                        </div>

                        {formData.priceRanges.length === 0 ? (
                            <div className="flex items-center justify-center gap-2 py-4 border border-dashed border-slate-200 dark:border-slate-700 rounded-lg">
                                <span className="material-icons-round text-slate-300 text-lg">tune</span>
                                <span className="text-[11px] font-medium text-slate-400">No price ranges defined — markup applies to all prices</span>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {/* Header row */}
                                <div className="grid grid-cols-[1fr_1fr_1fr_32px] gap-2 px-1">
                                    <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Min Price</span>
                                    <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Max Price</span>
                                    <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Markup Value (%)</span>
                                    <span />
                                </div>
                                {formData.priceRanges.map((range, idx) => (
                                    <div key={idx} className="grid grid-cols-[1fr_1fr_1fr_32px] gap-2 items-center">
                                        <div className="relative">
                                            <input
                                                type="text"
                                                inputMode="decimal"
                                                value={range.minPrice}
                                                onChange={(e) => updatePriceRange(idx, 'minPrice', e.target.value)}
                                                placeholder="0"
                                                className="w-full h-8 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 text-xs font-medium outline-none focus:border-teal-400 transition-all"
                                            />
                                        </div>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                inputMode="decimal"
                                                value={range.maxPrice}
                                                onChange={(e) => updatePriceRange(idx, 'maxPrice', e.target.value)}
                                                placeholder="0"
                                                className="w-full h-8 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 text-xs font-medium outline-none focus:border-teal-400 transition-all"
                                            />
                                        </div>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                inputMode="decimal"
                                                value={range.value}
                                                onChange={(e) => updatePriceRange(idx, 'value', e.target.value)}
                                                placeholder="0.0"
                                                className="w-full h-8 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 pr-7 text-xs font-medium outline-none focus:border-teal-400 transition-all"
                                            />
                                            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[10px] font-semibold">%</span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => removePriceRange(idx)}
                                            className="size-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 hover:text-rose-500 transition-all"
                                        >
                                            <span className="material-icons-round text-sm">delete_outline</span>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* 7. Cancel Policy */}
                    <div className="bg-slate-50/50 dark:bg-slate-900/30 p-4 rounded-xl border border-slate-100 dark:border-white/5 space-y-3">
                        <div className="flex items-center gap-2">
                            <div className="size-6 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-500">
                                <span className="material-icons-round text-sm">policy</span>
                            </div>
                            <h3 className="text-xs font-semibold text-slate-800 dark:text-white">Cancel Policy</h3>
                            <span className="text-[10px] font-medium text-slate-400">(optional)</span>
                        </div>
                        <div className="flex items-center gap-3">
                            {[
                                { value: 'FREE_CANCELLATION', label: 'Free Cancellation', icon: 'check_circle', color: 'emerald' },
                                { value: 'NON_REFUNDABLE',    label: 'Non-Refundable',    icon: 'cancel',       color: 'rose'    },
                            ].map(opt => {
                                const isSelected = formData.cancelPolicy === opt.value;
                                return (
                                    <button
                                        key={opt.value}
                                        type="button"
                                        onClick={() => setFormData(p => ({
                                            ...p,
                                            cancelPolicy: p.cancelPolicy === opt.value ? '' : opt.value
                                        }))}
                                        className={`flex-1 h-10 rounded-xl border-2 flex items-center justify-center gap-2 text-xs font-semibold transition-all ${
                                            isSelected
                                                ? opt.color === 'emerald'
                                                    ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400'
                                                    : 'border-rose-400 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400'
                                                : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-white dark:hover:bg-slate-800'
                                        }`}
                                    >
                                        <span className={`material-icons-round text-base ${
                                            isSelected
                                                ? opt.color === 'emerald' ? 'text-emerald-500' : 'text-rose-500'
                                                : 'text-slate-400'
                                        }`}>{opt.icon}</span>
                                        {opt.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="pt-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-end gap-2 shrink-0">
                        <button 
                            type="button" 
                            onClick={onClose}
                            className="h-8 px-4 rounded-lg text-xs font-medium text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit"
                            disabled={loading}
                            className="h-8 px-4 bg-primary text-white rounded-lg text-xs font-semibold shadow-xs hover:bg-primary/90 active:scale-95 transition-all flex items-center gap-1.5 disabled:opacity-50"
                        >
                            {loading ? (
                                <div className="size-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <span className="material-icons-round text-base">auto_awesome</span>
                                    {editData ? 'Update Rule' : 'Publish Rule'}
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
