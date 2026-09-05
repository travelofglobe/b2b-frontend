import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import FilterSection from './FilterSection';
import { tFilter } from '../utils/filterLocales';

const FilterPanel = ({ 
    filters, 
    locationNames = {}, 
    facilityNames = {}, 
    searchParams, 
    setSearchParams,
    onApply,
    onClearAll,
    onClose 
}) => {
    const { i18n } = useTranslation();
    const currentLang = (i18n.language || localStorage.getItem('language') || 'en').split('-')[0].toLowerCase();

    // Parse current URL stars
    const currentStarsStr = searchParams.get('stars');
    const urlStars = currentStarsStr ? currentStarsStr.split(',').map(Number) : [];

    // Maintain local state for checkboxes before Apply
    const [selectedStars, setSelectedStars] = useState(urlStars);

    // Parse current URL locations
    const currentLocationsStr = searchParams.get('locations');
    const urlLocations = currentLocationsStr ? currentLocationsStr.split(',').map(Number) : [];
    
    // Maintain local state for locations
    const [selectedLocations, setSelectedLocations] = useState(urlLocations);

    // Free Cancellation filter
    const parseBool = (val) => val === 'true' ? true : val === 'false' ? false : null;
    const [freeCancellation, setFreeCancellation] = useState(parseBool(searchParams.get('freeCancellation')));

    // Pre-Payment filter
    const [prePayment, setPrePayment] = useState(parseBool(searchParams.get('prePayment')));

    // Room Twin
    const [roomTwin, setRoomTwin] = useState(parseBool(searchParams.get('roomTwin')));

    // Capacity filters
    const [selectedMaxAdult, setSelectedMaxAdult] = useState(searchParams.get('roomMaxAdult') ? searchParams.get('roomMaxAdult').split(',').map(Number) : []);
    const [selectedMaxChildren, setSelectedMaxChildren] = useState(searchParams.get('roomMaxChildren') ? searchParams.get('roomMaxChildren').split(',').map(Number) : []);
    const [selectedMaxExtraBed, setSelectedMaxExtraBed] = useState(searchParams.get('roomMaxExtraBed') ? searchParams.get('roomMaxExtraBed').split(',').map(Number) : []);

    // Facility filter
    const currentFacilitiesStr = searchParams.get('facilities');
    const [selectedFacilities, setSelectedFacilities] = useState(currentFacilitiesStr ? currentFacilitiesStr.split(',').map(Number) : []);

    // Search and Expand states
    const [isFacilitiesExpanded, setIsFacilitiesExpanded] = useState(false);
    const [facilitySearch, setFacilitySearch] = useState('');
    const [isLocationsExpanded, setIsLocationsExpanded] = useState(false);
    const [locationSearch, setLocationSearch] = useState('');

    // Sync local state when searchParams change externally
    useEffect(() => {
        setSelectedStars(searchParams.get('stars') ? searchParams.get('stars').split(',').map(Number) : []);
    }, [searchParams.get('stars')]);

    useEffect(() => {
        setSelectedLocations(searchParams.get('locations') ? searchParams.get('locations').split(',').map(Number) : []);
    }, [searchParams.get('locations')]);

    useEffect(() => {
        setFreeCancellation(parseBool(searchParams.get('freeCancellation')));
        setPrePayment(parseBool(searchParams.get('prePayment')));
        setRoomTwin(parseBool(searchParams.get('roomTwin')));
    }, [searchParams.get('freeCancellation'), searchParams.get('prePayment'), searchParams.get('roomTwin')]);

    useEffect(() => {
        setSelectedMaxAdult(searchParams.get('roomMaxAdult') ? searchParams.get('roomMaxAdult').split(',').map(Number) : []);
        setSelectedMaxChildren(searchParams.get('roomMaxChildren') ? searchParams.get('roomMaxChildren').split(',').map(Number) : []);
        setSelectedMaxExtraBed(searchParams.get('roomMaxExtraBed') ? searchParams.get('roomMaxExtraBed').split(',').map(Number) : []);
        setSelectedFacilities(searchParams.get('facilities') ? searchParams.get('facilities').split(',').map(Number) : []);
    }, [
        searchParams.get('roomMaxAdult'), 
        searchParams.get('roomMaxChildren'), 
        searchParams.get('roomMaxExtraBed'), 
        searchParams.get('facilities')
    ]);

    // Handlers
    const handleBoolToggle = (setter, current, clickedValue) => {
        setter(current === clickedValue ? null : clickedValue);
    };

    const handleToggle = (setter, val) => {
        setter(prev => prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]);
    };

    const handleApply = () => {
        const newParams = new URLSearchParams(searchParams);
        
        const setOrDelete = (key, value) => {
            if (value && (Array.isArray(value) ? value.length > 0 : value !== null)) {
                newParams.set(key, Array.isArray(value) ? value.join(',') : String(value));
            } else {
                newParams.delete(key);
            }
        };

        setOrDelete('stars', selectedStars);
        setOrDelete('locations', selectedLocations);
        setOrDelete('freeCancellation', freeCancellation);
        setOrDelete('prePayment', prePayment);
        setOrDelete('roomTwin', roomTwin);
        setOrDelete('roomMaxAdult', selectedMaxAdult);
        setOrDelete('roomMaxChildren', selectedMaxChildren);
        setOrDelete('roomMaxExtraBed', selectedMaxExtraBed);
        setOrDelete('facilities', selectedFacilities);

        setSearchParams(newParams);
        if (onApply) onApply();
    };

    const handleClear = () => {
        setSelectedStars([]);
        setSelectedLocations([]);
        setFreeCancellation(null);
        setPrePayment(null);
        setRoomTwin(null);
        setSelectedMaxAdult([]);
        setSelectedMaxChildren([]);
        setSelectedMaxExtraBed([]);
        setSelectedFacilities([]);

        const newParams = new URLSearchParams(searchParams);
        ['stars', 'locations', 'freeCancellation', 'prePayment', 'roomTwin', 'roomMaxAdult', 'roomMaxChildren', 'roomMaxExtraBed', 'facilities'].forEach(k => newParams.delete(k));
        
        setSearchParams(newParams);
        if (onClearAll) onClearAll();
    };

    const activeFilterCount = [
        selectedStars.length > 0,
        selectedLocations.length > 0,
        freeCancellation !== null,
        prePayment !== null,
        roomTwin !== null,
        selectedMaxAdult.length > 0,
        selectedMaxChildren.length > 0,
        selectedMaxExtraBed.length > 0,
        selectedFacilities.length > 0
    ].filter(Boolean).length;

    return (
        <div className="flex flex-col h-full overflow-hidden">
            {/* Sticky Header with Actions */}
            <div className="flex-shrink-0 px-4 py-3.5 bg-white dark:bg-[#111a22] border-b border-slate-100/50 dark:border-slate-800/50 flex items-center justify-between z-10">
                <h2 className="text-xs font-semibold tracking-tight text-slate-800 dark:text-slate-100" lang={currentLang}>
                    {tFilter('filters', currentLang)}
                </h2>
                <div className="flex items-center gap-1.5">
                    <button
                        onClick={handleClear}
                        className="text-[9px] font-semibold text-slate-400 hover:text-red-500 uppercase tracking-wider px-1.5 py-0.5 transition-colors"
                        lang={currentLang}
                    >
                        {tFilter('reset', currentLang)}
                    </button>
                    <button
                        onClick={handleApply}
                        className="group flex items-center gap-1.5 bg-primary hover:bg-primary-hover text-white text-[9px] font-semibold uppercase tracking-wider px-3 py-1.5 rounded-lg transition-all shadow-xs active:scale-95 whitespace-nowrap relative"
                        lang={currentLang}
                    >
                        {tFilter('apply', currentLang)}
                        {activeFilterCount > 0 && (
                            <span className="flex items-center justify-center min-w-[12px] h-[12px] bg-white text-primary text-[8px] font-bold rounded-full px-1 animate-in zoom-in duration-300">
                                {activeFilterCount}
                            </span>
                        )}
                    </button>
                    {onClose && (
                        <>
                            <div className="w-px h-5 bg-slate-100 dark:bg-slate-800 mx-0.5"></div>
                            <button
                                onClick={onClose}
                                className="size-7 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-all active:scale-95"
                            >
                                <span className="material-symbols-outlined text-[16px]">close</span>
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar px-4 pb-6 pt-1">
                {/* Price Range Slider (Disabled) */}
                <FilterSection title={tFilter('pricePerNight', currentLang)} icon="payments" disabled>
                    <div className="px-2 pt-2">
                        <div className="relative h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full mb-6 mt-2">
                            <div className="absolute left-1/4 right-1/4 h-full bg-primary rounded-full"></div>
                        </div>
                    </div>
                </FilterSection>

                {/* Locations */}
                <FilterSection title={tFilter('locations', currentLang)} icon="location_on">
                    <div className="space-y-2">
                        {filters?.locationId && filters.locationId.length > 0 ? (
                            <>
                                <div className="relative mb-2 group/search">
                                    <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/search:text-primary text-xs transition-colors">search</span>
                                    <input 
                                        type="text" 
                                        placeholder={tFilter('searchLocations', currentLang)} 
                                        value={locationSearch}
                                        onChange={(e) => setLocationSearch(e.target.value)}
                                        className="w-full pl-7 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 focus:border-primary/50 focus:ring-2 focus:ring-primary/5 rounded-lg text-xs font-medium placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all"
                                    />
                                    {locationSearch && (
                                        <button onClick={() => setLocationSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary transition-colors">
                                            <span className="material-symbols-outlined text-xs">close</span>
                                        </button>
                                    )}
                                </div>

                                {[...filters.locationId]
                                    .filter(loc => {
                                        const name = locationNames[loc.value];
                                        if (!name || name.startsWith('Location ') || name.startsWith('Location')) return false;
                                        if (locationSearch && !name.toLowerCase().includes(locationSearch.toLowerCase())) return false;
                                        return true;
                                    })
                                    .sort((a, b) => b.count - a.count)
                                    .slice(0, (locationSearch || isLocationsExpanded) ? undefined : 10)
                                    .map(locFilter => (
                                        <label key={locFilter.value} className="flex items-center justify-between cursor-pointer group animate-in fade-in duration-200 py-0.5">
                                            <div className="flex items-center gap-2 overflow-hidden">
                                                <input
                                                    checked={selectedLocations.includes(locFilter.value)}
                                                    onChange={() => handleToggle(setSelectedLocations, locFilter.value)}
                                                    className="h-3.5 w-3.5 rounded border-slate-300 dark:border-[#324d67] bg-transparent text-primary focus:ring-primary focus:ring-offset-0 checkbox-tick flex-shrink-0"
                                                    type="checkbox"
                                                />
                                                <div className="flex items-center gap-1.5 overflow-hidden">
                                                    <span className="material-symbols-outlined text-sm text-slate-400 group-hover:text-primary transition-colors flex-shrink-0">location_on</span>
                                                    <span className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate" title={locationNames[locFilter.value] || ''}>
                                                        {locationNames[locFilter.value] || ''}
                                                    </span>
                                                </div>
                                            </div>
                                            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium whitespace-nowrap ml-1.5">({locFilter.count})</span>
                                        </label>
                                    ))}

                                
                                {!locationSearch && filters.locationId.length > 10 && (
                                    <button 
                                        onClick={() => setIsLocationsExpanded(!isLocationsExpanded)} 
                                        className="text-xs font-bold text-primary hover:text-primary-hover flex items-center gap-1 mt-2 transition-colors uppercase tracking-wider pl-8"
                                        lang={currentLang}
                                    >
                                        {isLocationsExpanded ? (
                                            <>{tFilter('showLess', currentLang)} <span className="material-symbols-outlined text-sm">expand_less</span></>
                                        ) : (
                                            <>{tFilter('showMore', currentLang)} ({filters.locationId.length - 10} {tFilter('showMore', currentLang).toLowerCase().includes('more') ? 'more' : ''}) <span className="material-symbols-outlined text-sm">expand_more</span></>
                                        )}
                                    </button>
                                )}
                            </>
                        ) : (
                            <div className="text-sm text-slate-500 dark:text-slate-400 italic" lang={currentLang}>
                                {tFilter('noLocations', currentLang)}
                            </div>
                        )}
                    </div>
                </FilterSection>

                {/* Star Rating */}
                <FilterSection title={tFilter('starRating', currentLang)} icon="star">
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                        {filters?.hotelStarCategoryId?.sort((a, b) => b.value - a.value).map(starFilter => (
                            <label key={starFilter.value} className="flex items-center justify-between cursor-pointer group py-0.5">
                                <div className="flex items-center gap-2">
                                    <input
                                        checked={selectedStars.includes(starFilter.value)}
                                        onChange={() => handleToggle(setSelectedStars, starFilter.value)}
                                        className="h-3.5 w-3.5 rounded border-slate-300 dark:border-[#324d67] bg-transparent text-primary focus:ring-primary focus:ring-offset-0 checkbox-tick"
                                        type="checkbox"
                                    />
                                    <div className="flex items-center gap-1">
                                        <span className="text-xs font-medium text-slate-700 dark:text-slate-300" lang={currentLang}>
                                            {starFilter.value === 0 ? tFilter('unrated', currentLang) : `${starFilter.value}*`}
                                        </span>
                                        {starFilter.value > 0 && (
                                            <div className="flex text-amber-400">
                                                <span className="material-symbols-outlined text-[9px] fill-1">star</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">({starFilter.count})</span>
                            </label>
                        ))}
                    </div>
                </FilterSection>

                {/* Free Cancellation */}
                <FilterSection title={tFilter('freeCancellation', currentLang)} icon="event_available">
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                        {(filters?.hasFreeCancellation || [{ value: true, count: null }, { value: false, count: null }]).sort((a,b) => (b.value === true ? 1 : -1)).map(f => (
                            <label key={String(f.value)} className="flex items-center justify-between cursor-pointer group py-0.5">
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={freeCancellation === f.value}
                                        onChange={() => handleBoolToggle(setFreeCancellation, freeCancellation, f.value)}
                                        className="h-3.5 w-3.5 rounded border-slate-300 dark:border-[#324d67] bg-transparent text-primary focus:ring-primary focus:ring-offset-0 checkbox-tick"
                                    />
                                    <div className="flex items-center gap-1.5">
                                        <span className={`material-symbols-outlined text-sm transition-colors ${f.value ? 'text-emerald-500' : 'text-slate-400'}`}>{f.value ? 'verified' : 'info'}</span>
                                        <span className="text-xs font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap" lang={currentLang}>
                                            {f.value ? tFilter('freeCancel', currentLang) : tFilter('nonRefundable', currentLang)}
                                        </span>
                                    </div>
                                </div>
                                {f.count !== null && <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">({f.count})</span>}
                            </label>
                        ))}
                    </div>
                </FilterSection>

                {/* Pre-Payment */}
                <FilterSection title={tFilter('prePayment', currentLang)} icon="credit_card">
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                        {(filters?.hasPrePayment || [{ value: true, count: null }, { value: false, count: null }]).sort((a,b) => (b.value === true ? 1 : -1)).map(f => (
                            <label key={String(f.value)} className="flex items-center justify-between cursor-pointer group py-0.5">
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={prePayment === f.value}
                                        onChange={() => handleBoolToggle(setPrePayment, prePayment, f.value)}
                                        className="h-3.5 w-3.5 rounded border-slate-300 dark:border-[#324d67] bg-transparent text-primary focus:ring-primary focus:ring-offset-0 checkbox-tick"
                                    />
                                    <div className="flex items-center gap-1.5">
                                        <span className="material-symbols-outlined text-sm text-slate-400">{f.value ? 'credit_card' : 'payments'}</span>
                                        <span className="text-xs font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap" lang={currentLang}>
                                            {f.value ? tFilter('prePayment', currentLang) : tFilter('payLater', currentLang)}
                                        </span>
                                    </div>
                                </div>
                                {f.count !== null && <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">({f.count})</span>}
                            </label>
                        ))}
                    </div>
                </FilterSection>

                {/* Room Twin */}
                <FilterSection title={tFilter('twinRoom', currentLang)} icon="bed">
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                        {(filters?.roomTwin || [{ value: true, count: null }, { value: false, count: null }]).sort((a,b) => (b.value === true ? 1 : -1)).map(f => (
                            <label key={String(f.value)} className="flex items-center justify-between cursor-pointer group py-0.5">
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={roomTwin === f.value}
                                        onChange={() => handleBoolToggle(setRoomTwin, roomTwin, f.value)}
                                        className="h-3.5 w-3.5 rounded border-slate-300 dark:border-[#324d67] bg-transparent text-primary focus:ring-primary focus:ring-offset-0 checkbox-tick"
                                    />
                                    <div className="flex items-center gap-1.5 text-slate-500">
                                        <span className="material-symbols-outlined text-sm">bed</span>
                                        <span className="text-xs font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap" lang={currentLang}>
                                            {f.value ? tFilter('twinAvailable', currentLang) : tFilter('noTwin', currentLang)}
                                        </span>
                                    </div>
                                </div>
                                {f.count !== null && <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">({f.count})</span>}
                            </label>
                        ))}
                    </div>
                </FilterSection>

                {/* Capacities */}
                <FilterSection title={tFilter('maxAdult', currentLang)} icon="person" defaultOpen={false}>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                        {filters?.roomMaxAdult?.sort((a, b) => a.value - b.value).map(f => (
                            <label key={f.value} className="flex items-center justify-between cursor-pointer group py-0.5">
                                <div className="flex items-center gap-2">
                                    <input checked={selectedMaxAdult.includes(f.value)} onChange={() => handleToggle(setSelectedMaxAdult, f.value)} className="h-3.5 w-3.5 rounded border-slate-300 dark:border-[#324d67] bg-transparent text-primary focus:ring-primary focus:ring-offset-0 checkbox-tick" type="checkbox" />
                                    <div className="flex items-center gap-1.5">
                                        <span className="material-symbols-outlined text-sm text-slate-400">person</span>
                                        <span className="text-xs font-medium text-slate-700 dark:text-slate-300" lang={currentLang}>
                                            {f.value} {tFilter('adults', currentLang)}
                                        </span>
                                    </div>
                                </div>
                                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">({f.count})</span>
                            </label>
                        ))}
                    </div>
                </FilterSection>

                <FilterSection title={tFilter('maxChildren', currentLang)} icon="child_care" defaultOpen={false}>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                        {filters?.roomMaxChildren?.sort((a, b) => a.value - b.value).map(f => (
                            <label key={f.value} className="flex items-center justify-between cursor-pointer group py-0.5">
                                <div className="flex items-center gap-2">
                                    <input checked={selectedMaxChildren.includes(f.value)} onChange={() => handleToggle(setSelectedMaxChildren, f.value)} className="h-3.5 w-3.5 rounded border-slate-300 dark:border-[#324d67] bg-transparent text-primary focus:ring-primary focus:ring-offset-0 checkbox-tick" type="checkbox" />
                                    <div className="flex items-center gap-1.5">
                                        <span className="material-symbols-outlined text-sm text-slate-400">child_care</span>
                                        <span className="text-xs font-medium text-slate-700 dark:text-slate-300" lang={currentLang}>
                                            {f.value === 0 ? tFilter('noChildren', currentLang) : `${f.value} ${tFilter('children', currentLang)}`}
                                        </span>
                                    </div>
                                </div>
                                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">({f.count})</span>
                            </label>
                        ))}
                    </div>
                </FilterSection>

                <FilterSection title={tFilter('maxExtraBed', currentLang)} icon="hotel_class" defaultOpen={false}>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                        {filters?.roomMaxExtraBed?.sort((a, b) => a.value - b.value).map(f => (
                            <label key={f.value} className="flex items-center justify-between cursor-pointer group py-0.5">
                                <div className="flex items-center gap-2">
                                    <input checked={selectedMaxExtraBed.includes(f.value)} onChange={() => handleToggle(setSelectedMaxExtraBed, f.value)} className="h-3.5 w-3.5 rounded border-slate-300 dark:border-[#324d67] bg-transparent text-primary focus:ring-primary focus:ring-offset-0 checkbox-tick" type="checkbox" />
                                    <div className="flex items-center gap-1.5">
                                        <span className="material-symbols-outlined text-sm text-slate-400">hotel_class</span>
                                        <span className="text-xs font-medium text-slate-700 dark:text-slate-300" lang={currentLang}>
                                            {f.value === 0 ? tFilter('noExtraBed', currentLang) : `${f.value} ${f.value === 1 ? tFilter('extraBed', currentLang) : tFilter('extraBeds', currentLang)}`}
                                        </span>
                                    </div>
                                </div>
                                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">({f.count})</span>
                            </label>
                        ))}
                    </div>
                </FilterSection>

                {/* Hotel Facilities */}
                <FilterSection title={tFilter('hotelFacilities', currentLang)} icon="pool">
                    <div className="space-y-2">
                        {filters?.hotelFacilityIds && filters.hotelFacilityIds.length > 0 ? (
                            <>
                                <div className="relative mb-2 group/search">
                                    <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/search:text-primary text-xs transition-colors">search</span>
                                    <input 
                                        type="text" 
                                        placeholder={tFilter('searchFacilities', currentLang)} 
                                        value={facilitySearch}
                                        onChange={(e) => setFacilitySearch(e.target.value)}
                                        className="w-full pl-7 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 focus:border-primary/50 focus:ring-2 focus:ring-primary/5 rounded-lg text-xs font-medium placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all"
                                    />
                                    {facilitySearch && (
                                        <button onClick={() => setFacilitySearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary transition-colors">
                                            <span className="material-symbols-outlined text-xs">close</span>
                                        </button>
                                    )}
                                </div>

                                {[...filters.hotelFacilityIds]
                                    .filter(fac => {
                                        const name = facilityNames[fac.value];
                                        if (!name || name.startsWith('Facility ') || name.startsWith('Facility')) return false;
                                        if (facilitySearch && !name.toLowerCase().includes(facilitySearch.toLowerCase())) return false;
                                        return true;
                                    })
                                    .sort((a, b) => b.count - a.count)
                                    .slice(0, (facilitySearch || isFacilitiesExpanded) ? undefined : 10)
                                    .map(facFilter => (
                                        <label key={facFilter.value} className="flex items-center justify-between cursor-pointer group animate-in fade-in duration-200 py-0.5">
                                            <div className="flex items-center gap-2 overflow-hidden">
                                                <input checked={selectedFacilities.includes(facFilter.value)} onChange={() => handleToggle(setSelectedFacilities, facFilter.value)} className="h-3.5 w-3.5 rounded border-slate-300 dark:border-[#324d67] bg-transparent text-primary focus:ring-primary focus:ring-offset-0 checkbox-tick flex-shrink-0" type="checkbox" />
                                                <div className="flex items-center gap-1.5 overflow-hidden">
                                                    <span className="material-symbols-outlined text-sm text-slate-400 group-hover:text-primary flex-shrink-0">business_center</span>
                                                    <span className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate" title={facilityNames[facFilter.value] || ''}>{facilityNames[facFilter.value] || ''}</span>
                                                </div>
                                            </div>
                                            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium whitespace-nowrap ml-1.5">({facFilter.count})</span>
                                        </label>
                                    ))}
                                
                                {!facilitySearch && filters.hotelFacilityIds.length > 10 && (
                                    <button 
                                        onClick={() => setIsFacilitiesExpanded(!isFacilitiesExpanded)} 
                                        className="text-xs font-bold text-primary hover:text-primary-hover flex items-center gap-1 mt-2 transition-colors uppercase tracking-wider pl-8"
                                        lang={currentLang}
                                    >
                                        {isFacilitiesExpanded ? (
                                            <>{tFilter('showLess', currentLang)} <span className="material-symbols-outlined text-sm">expand_less</span></>
                                        ) : (
                                            <>{tFilter('showMore', currentLang)} ({filters.hotelFacilityIds.length - 10} {tFilter('showMore', currentLang).toLowerCase().includes('more') ? 'more' : ''}) <span className="material-symbols-outlined text-sm">expand_more</span></>
                                        )}
                                    </button>
                                )}
                            </>
                        ) : (
                            <div className="text-sm text-slate-500 dark:text-slate-400 italic" lang={currentLang}>
                                {tFilter('noFacilities', currentLang)}
                            </div>
                        )}
                    </div>
                </FilterSection>
            </div>
        </div>
    );
};

export default FilterPanel;
