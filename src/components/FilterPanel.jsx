import React, { useState, useEffect } from 'react';
import FilterSection from './FilterSection';

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
    const [selectedPaxCapacity, setSelectedPaxCapacity] = useState(searchParams.get('roomPaxCapacity') ? searchParams.get('roomPaxCapacity').split(',').map(Number) : []);

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
        setSelectedPaxCapacity(searchParams.get('roomPaxCapacity') ? searchParams.get('roomPaxCapacity').split(',').map(Number) : []);
        setSelectedFacilities(searchParams.get('facilities') ? searchParams.get('facilities').split(',').map(Number) : []);
    }, [
        searchParams.get('roomMaxAdult'), 
        searchParams.get('roomMaxChildren'), 
        searchParams.get('roomMaxExtraBed'), 
        searchParams.get('roomPaxCapacity'), 
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
        setOrDelete('roomPaxCapacity', selectedPaxCapacity);
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
        setSelectedPaxCapacity([]);
        setSelectedFacilities([]);

        const newParams = new URLSearchParams(searchParams);
        ['stars', 'locations', 'freeCancellation', 'prePayment', 'roomTwin', 'roomMaxAdult', 'roomMaxChildren', 'roomMaxExtraBed', 'roomPaxCapacity', 'facilities'].forEach(k => newParams.delete(k));
        
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
        selectedPaxCapacity.length > 0,
        selectedFacilities.length > 0
    ].filter(Boolean).length;

    return (
        <div className="flex flex-col h-full overflow-hidden">
            {/* Sticky Header with Actions */}
            <div className="flex-shrink-0 px-6 py-5 bg-white dark:bg-[#111a22] border-b border-slate-100/50 dark:border-slate-800/50 flex items-center justify-between z-10">
                <h2 className="text-lg font-black tracking-tight text-slate-800 dark:text-slate-100">Filters</h2>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleClear}
                        className="text-[10px] font-bold text-slate-400 hover:text-red-500 uppercase tracking-widest px-2 py-1 transition-colors"
                    >
                        Reset
                    </button>
                    <button
                        onClick={handleApply}
                        className="group flex items-center gap-2 bg-primary hover:bg-primary-hover text-white text-[10px] font-extrabold uppercase tracking-widest px-4 py-2 rounded-xl transition-all shadow-lg shadow-primary/20 active:scale-95 whitespace-nowrap relative"
                    >
                        Apply
                        {activeFilterCount > 0 && (
                            <span className="flex items-center justify-center min-w-[14px] h-[14px] bg-white text-primary text-[9px] font-black rounded-full px-1 animate-in zoom-in duration-300">
                                {activeFilterCount}
                            </span>
                        )}
                    </button>
                    {onClose && (
                        <>
                            <div className="w-px h-6 bg-slate-100 dark:bg-slate-800 mx-1"></div>
                            <button
                                onClick={onClose}
                                className="size-8 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-all active:scale-95"
                            >
                                <span className="material-symbols-outlined text-[20px]">close</span>
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar px-6 pb-8 pt-2">
                {/* Price Range Slider (Disabled) */}
                <FilterSection title="Price per night" icon="payments" disabled>
                    <div className="px-2 pt-2">
                        <div className="relative h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full mb-6 mt-2">
                            <div className="absolute left-1/4 right-1/4 h-full bg-primary rounded-full"></div>
                        </div>
                    </div>
                </FilterSection>

                {/* Locations */}
                <FilterSection title="Locations" icon="location_on">
                    <div className="space-y-3">
                        {filters?.locationId && filters.locationId.length > 0 ? (
                            <>
                                <div className="relative mb-3 group/search">
                                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/search:text-primary text-sm transition-colors">search</span>
                                    <input 
                                        type="text" 
                                        placeholder="Search locations..." 
                                        value={locationSearch}
                                        onChange={(e) => setLocationSearch(e.target.value)}
                                        className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 focus:border-primary/50 focus:ring-4 focus:ring-primary/5 rounded-xl text-xs font-medium placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all"
                                    />
                                    {locationSearch && (
                                        <button onClick={() => setLocationSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary transition-colors">
                                            <span className="material-symbols-outlined text-sm">close</span>
                                        </button>
                                    )}
                                </div>

                                {[...filters.locationId]
                                    .filter(loc => !locationSearch || (locationNames[loc.value] || `Location ${loc.value}`).toLowerCase().includes(locationSearch.toLowerCase()))
                                    .sort((a, b) => b.count - a.count)
                                    .slice(0, (locationSearch || isLocationsExpanded) ? undefined : 10)
                                    .map(locFilter => (
                                        <label key={locFilter.value} className="flex items-center justify-between cursor-pointer group animate-in fade-in duration-200">
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                <input
                                                    checked={selectedLocations.includes(locFilter.value)}
                                                    onChange={() => handleToggle(setSelectedLocations, locFilter.value)}
                                                    className="h-5 w-5 rounded border-slate-300 dark:border-[#324d67] bg-transparent text-primary focus:ring-primary focus:ring-offset-0 checkbox-tick flex-shrink-0"
                                                    type="checkbox"
                                                />
                                                <div className="flex items-center gap-2 overflow-hidden">
                                                    <span className="material-symbols-outlined text-[16px] text-slate-400 group-hover:text-primary transition-colors flex-shrink-0">location_on</span>
                                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate" title={locationNames[locFilter.value] || `Location ${locFilter.value}`}>
                                                        {locationNames[locFilter.value] || `Location ${locFilter.value}`}
                                                    </span>
                                                </div>
                                            </div>
                                            <span className="text-xs text-slate-400 dark:text-slate-500 font-medium whitespace-nowrap ml-2">({locFilter.count})</span>
                                        </label>
                                    ))}
                                
                                {!locationSearch && filters.locationId.length > 10 && (
                                    <button onClick={() => setIsLocationsExpanded(!isLocationsExpanded)} className="text-xs font-bold text-primary hover:text-primary-hover flex items-center gap-1 mt-2 transition-colors uppercase tracking-wider pl-8">
                                        {isLocationsExpanded ? <>Show Less <span className="material-symbols-outlined text-sm">expand_less</span></> : <>Show More ({filters.locationId.length - 10} more) <span className="material-symbols-outlined text-sm">expand_more</span></>}
                                    </button>
                                )}
                            </>
                        ) : <div className="text-sm text-slate-500 dark:text-slate-400 italic">No specific locations found</div>}
                    </div>
                </FilterSection>

                {/* Star Rating */}
                <FilterSection title="Star Rating" icon="star">
                    <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                        {filters?.hotelStarCategoryId?.sort((a, b) => b.value - a.value).map(starFilter => (
                            <label key={starFilter.value} className="flex items-center justify-between cursor-pointer group">
                                <div className="flex items-center gap-3">
                                    <input
                                        checked={selectedStars.includes(starFilter.value)}
                                        onChange={() => handleToggle(setSelectedStars, starFilter.value)}
                                        className="h-5 w-5 rounded border-slate-300 dark:border-[#324d67] bg-transparent text-primary focus:ring-primary focus:ring-offset-0 checkbox-tick"
                                        type="checkbox"
                                    />
                                    <div className="flex items-center gap-1">
                                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{starFilter.value === 0 ? 'Unrated' : `${starFilter.value}*`}</span>
                                        {starFilter.value > 0 && (
                                            <div className="flex text-amber-400">
                                                <span className="material-symbols-outlined text-[10px] fill-1">star</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">({starFilter.count})</span>
                            </label>
                        ))}
                    </div>
                </FilterSection>

                {/* Free Cancellation */}
                <FilterSection title="Free Cancellation" icon="event_available">
                    <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                        {(filters?.hasFreeCancellation || [{ value: true, count: null }, { value: false, count: null }]).sort((a,b) => (b.value === true ? 1 : -1)).map(f => (
                            <label key={String(f.value)} className="flex items-center justify-between cursor-pointer group">
                                <div className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        checked={freeCancellation === f.value}
                                        onChange={() => handleBoolToggle(setFreeCancellation, freeCancellation, f.value)}
                                        className="h-5 w-5 rounded border-slate-300 dark:border-[#324d67] bg-transparent text-primary focus:ring-primary focus:ring-offset-0 checkbox-tick"
                                    />
                                    <div className="flex items-center gap-2">
                                        <span className={`material-symbols-outlined text-[18px] transition-colors ${f.value ? 'text-emerald-500' : 'text-slate-400'}`}>{f.value ? 'verified' : 'info'}</span>
                                        <span className="text-[13px] font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">{f.value ? 'Free Cancel' : 'Non-ref'}</span>
                                    </div>
                                </div>
                                {f.count !== null && <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">({f.count})</span>}
                            </label>
                        ))}
                    </div>
                </FilterSection>

                {/* Pre-Payment */}
                <FilterSection title="Pre-Payment Required" icon="credit_card">
                    <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                        {(filters?.hasPrePayment || [{ value: true, count: null }, { value: false, count: null }]).sort((a,b) => (b.value === true ? 1 : -1)).map(f => (
                            <label key={String(f.value)} className="flex items-center justify-between cursor-pointer group">
                                <div className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        checked={prePayment === f.value}
                                        onChange={() => handleBoolToggle(setPrePayment, prePayment, f.value)}
                                        className="h-5 w-5 rounded border-slate-300 dark:border-[#324d67] bg-transparent text-primary focus:ring-primary focus:ring-offset-0 checkbox-tick"
                                    />
                                    <div className="flex items-center gap-2">
                                        <span className="material-symbols-outlined text-[18px] text-slate-400">{f.value ? 'credit_card' : 'payments'}</span>
                                        <span className="text-[13px] font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">{f.value ? 'Required' : 'Pay Later'}</span>
                                    </div>
                                </div>
                                {f.count !== null && <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">({f.count})</span>}
                            </label>
                        ))}
                    </div>
                </FilterSection>

                {/* Room Twin */}
                <FilterSection title="Twin Room" icon="bed">
                    <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                        {(filters?.roomTwin || [{ value: true, count: null }, { value: false, count: null }]).sort((a,b) => (b.value === true ? 1 : -1)).map(f => (
                            <label key={String(f.value)} className="flex items-center justify-between cursor-pointer group">
                                <div className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        checked={roomTwin === f.value}
                                        onChange={() => handleBoolToggle(setRoomTwin, roomTwin, f.value)}
                                        className="h-5 w-5 rounded border-slate-300 dark:border-[#324d67] bg-transparent text-primary focus:ring-primary focus:ring-offset-0 checkbox-tick"
                                    />
                                    <div className="flex items-center gap-2 text-slate-500">
                                        <span className="material-symbols-outlined text-[18px]">bed</span>
                                        <span className="text-[13px] font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">{f.value ? 'Twin Available' : 'No Twin'}</span>
                                    </div>
                                </div>
                                {f.count !== null && <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">({f.count})</span>}
                            </label>
                        ))}
                    </div>
                </FilterSection>

                {/* Capacities */}
                <FilterSection title="Max Adult Capacity" icon="person" defaultOpen={false}>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                        {filters?.roomMaxAdult?.sort((a, b) => a.value - b.value).map(f => (
                            <label key={f.value} className="flex items-center justify-between cursor-pointer group">
                                <div className="flex items-center gap-3">
                                    <input checked={selectedMaxAdult.includes(f.value)} onChange={() => handleToggle(setSelectedMaxAdult, f.value)} className="h-5 w-5 rounded border-slate-300 dark:border-[#324d67] bg-transparent text-primary focus:ring-primary focus:ring-offset-0 checkbox-tick" type="checkbox" />
                                    <div className="flex items-center gap-2"><span className="material-symbols-outlined text-[16px] text-slate-400">person</span><span className="text-sm font-medium text-slate-700 dark:text-slate-300">{f.value} Adults</span></div>
                                </div>
                                <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">({f.count})</span>
                            </label>
                        ))}
                    </div>
                </FilterSection>

                <FilterSection title="Max Children Capacity" icon="child_care" defaultOpen={false}>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                        {filters?.roomMaxChildren?.sort((a, b) => a.value - b.value).map(f => (
                            <label key={f.value} className="flex items-center justify-between cursor-pointer group">
                                <div className="flex items-center gap-3">
                                    <input checked={selectedMaxChildren.includes(f.value)} onChange={() => handleToggle(setSelectedMaxChildren, f.value)} className="h-5 w-5 rounded border-slate-300 dark:border-[#324d67] bg-transparent text-primary focus:ring-primary focus:ring-offset-0 checkbox-tick" type="checkbox" />
                                    <div className="flex items-center gap-2"><span className="material-symbols-outlined text-[16px] text-slate-400">child_care</span><span className="text-sm font-medium text-slate-700 dark:text-slate-300">{f.value === 0 ? 'None' : f.value}</span></div>
                                </div>
                                <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">({f.count})</span>
                            </label>
                        ))}
                    </div>
                </FilterSection>

                <FilterSection title="Max Extra Beds" icon="hotel_class" defaultOpen={false}>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                        {filters?.roomMaxExtraBed?.sort((a, b) => a.value - b.value).map(f => (
                            <label key={f.value} className="flex items-center justify-between cursor-pointer group">
                                <div className="flex items-center gap-3">
                                    <input checked={selectedMaxExtraBed.includes(f.value)} onChange={() => handleToggle(setSelectedMaxExtraBed, f.value)} className="h-5 w-5 rounded border-slate-300 dark:border-[#324d67] bg-transparent text-primary focus:ring-primary focus:ring-offset-0 checkbox-tick" type="checkbox" />
                                    <div className="flex items-center gap-2"><span className="material-symbols-outlined text-[16px] text-slate-400">hotel_class</span><span className="text-sm font-medium text-slate-700 dark:text-slate-300">{f.value === 0 ? 'None' : f.value} Bed</span></div>
                                </div>
                                <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">({f.count})</span>
                            </label>
                        ))}
                    </div>
                </FilterSection>

                <FilterSection title="Total Pax Capacity" icon="groups" defaultOpen={false}>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                        {filters?.roomPaxCapacity?.sort((a, b) => a.value - b.value).map(f => (
                            <label key={f.value} className="flex items-center justify-between cursor-pointer group">
                                <div className="flex items-center gap-3">
                                    <input checked={selectedPaxCapacity.includes(f.value)} onChange={() => handleToggle(setSelectedPaxCapacity, f.value)} className="h-5 w-5 rounded border-slate-300 dark:border-[#324d67] bg-transparent text-primary focus:ring-primary focus:ring-offset-0 checkbox-tick" type="checkbox" />
                                    <div className="flex items-center gap-2"><span className="material-symbols-outlined text-[16px] text-slate-400">groups</span><span className="text-sm font-medium text-slate-700 dark:text-slate-300">{f.value} Pax</span></div>
                                </div>
                                <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">({f.count})</span>
                            </label>
                        ))}
                    </div>
                </FilterSection>

                {/* Hotel Facilities */}
                <FilterSection title="Hotel Facilities" icon="pool">
                    <div className="space-y-3">
                        {filters?.hotelFacilityIds && filters.hotelFacilityIds.length > 0 ? (
                            <>
                                <div className="relative mb-3 group/search">
                                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/search:text-primary text-sm transition-colors">search</span>
                                    <input 
                                        type="text" 
                                        placeholder="Search facilities..." 
                                        value={facilitySearch}
                                        onChange={(e) => setFacilitySearch(e.target.value)}
                                        className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 focus:border-primary/50 focus:ring-4 focus:ring-primary/5 rounded-xl text-xs font-medium placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all"
                                    />
                                    {facilitySearch && (
                                        <button onClick={() => setFacilitySearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary transition-colors">
                                            <span className="material-symbols-outlined text-sm">close</span>
                                        </button>
                                    )}
                                </div>

                                {[...filters.hotelFacilityIds]
                                    .filter(fac => !facilitySearch || (facilityNames[fac.value] || `Facility ${fac.value}`).toLowerCase().includes(facilitySearch.toLowerCase()))
                                    .sort((a, b) => b.count - a.count)
                                    .slice(0, (facilitySearch || isFacilitiesExpanded) ? undefined : 10)
                                    .map(facFilter => (
                                        <label key={facFilter.value} className="flex items-center justify-between cursor-pointer group animate-in fade-in duration-200">
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                <input checked={selectedFacilities.includes(facFilter.value)} onChange={() => handleToggle(setSelectedFacilities, facFilter.value)} className="h-5 w-5 rounded border-slate-300 dark:border-[#324d67] bg-transparent text-primary focus:ring-primary focus:ring-offset-0 checkbox-tick flex-shrink-0" type="checkbox" />
                                                <div className="flex items-center gap-2 overflow-hidden">
                                                    <span className="material-symbols-outlined text-[16px] text-slate-400 group-hover:text-primary flex-shrink-0">business_center</span>
                                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate" title={facilityNames[facFilter.value] || `Facility ${facFilter.value}`}>{facilityNames[facFilter.value] || `Facility ${facFilter.value}`}</span>
                                                </div>
                                            </div>
                                            <span className="text-xs text-slate-400 dark:text-slate-500 font-medium whitespace-nowrap ml-2">({facFilter.count})</span>
                                        </label>
                                    ))}
                                
                                {!facilitySearch && filters.hotelFacilityIds.length > 10 && (
                                    <button onClick={() => setIsFacilitiesExpanded(!isFacilitiesExpanded)} className="text-xs font-bold text-primary hover:text-primary-hover flex items-center gap-1 mt-2 transition-colors uppercase tracking-wider pl-8">
                                        {isFacilitiesExpanded ? <>Show Less <span className="material-symbols-outlined text-sm">expand_less</span></> : <>Show More ({filters.hotelFacilityIds.length - 10} more) <span className="material-symbols-outlined text-sm">expand_more</span></>}
                                    </button>
                                )}
                            </>
                        ) : <div className="text-sm text-slate-500 dark:text-slate-400 italic">No specific facilities found</div>}
                    </div>
                </FilterSection>
            </div>
        </div>
    );
};

export default FilterPanel;
