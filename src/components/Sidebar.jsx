import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import FilterSection from './FilterSection';
import { tFilter } from '../utils/filterLocales';

const Sidebar = ({ filters, locationNames = {}, facilityNames = {}, hideHeader = false }) => {
    const [searchParams, setSearchParams] = useSearchParams();
    const { i18n } = useTranslation();
    const currentLang = (i18n.language || localStorage.getItem('language') || 'en').split('-')[0].toLowerCase();

    const currentStarsStr = searchParams.get('stars');
    const urlStars = currentStarsStr ? currentStarsStr.split(',').map(Number) : [];

    // Maintain local state for checkboxes before Apply
    const [selectedStars, setSelectedStars] = useState(urlStars);

    // Parse current URL locations
    const currentLocationsStr = searchParams.get('locations');
    const urlLocations = currentLocationsStr ? currentLocationsStr.split(',').map(Number) : [];
    
    // Maintain local state for locations
    const [selectedLocations, setSelectedLocations] = useState(urlLocations);

    // Free Cancellation filter: null = no filter, true = yes, false = no
    const parseBool = (val) => val === 'true' ? true : val === 'false' ? false : null;
    const [freeCancellation, setFreeCancellation] = useState(parseBool(searchParams.get('freeCancellation')));

    // Pre-Payment filter: null = no filter, true = yes, false = no
    const [prePayment, setPrePayment] = useState(parseBool(searchParams.get('prePayment')));

    // Room Twin
    const [roomTwin, setRoomTwin] = useState(parseBool(searchParams.get('roomTwin')));

    // Room Max Adult
    const currentMaxAdultStr = searchParams.get('roomMaxAdult');
    const [selectedMaxAdult, setSelectedMaxAdult] = useState(currentMaxAdultStr ? currentMaxAdultStr.split(',').map(Number) : []);

    // Room Max Children
    const currentMaxChildrenStr = searchParams.get('roomMaxChildren');
    const [selectedMaxChildren, setSelectedMaxChildren] = useState(currentMaxChildrenStr ? currentMaxChildrenStr.split(',').map(Number) : []);

    // Room Max Extra Bed
    const currentMaxExtraBedStr = searchParams.get('roomMaxExtraBed');
    const [selectedMaxExtraBed, setSelectedMaxExtraBed] = useState(currentMaxExtraBedStr ? currentMaxExtraBedStr.split(',').map(Number) : []);

    const currentFacilitiesStr = searchParams.get('facilities');
    const [selectedFacilities, setSelectedFacilities] = useState(currentFacilitiesStr ? currentFacilitiesStr.split(',').map(Number) : []);

    // Expandable sections state
    const [isFacilitiesExpanded, setIsFacilitiesExpanded] = useState(false);
    const [facilitySearch, setFacilitySearch] = useState('');
    const [isLocationsExpanded, setIsLocationsExpanded] = useState(false);
    const [locationSearch, setLocationSearch] = useState('');

    useEffect(() => {
        setSelectedStars(currentStarsStr ? currentStarsStr.split(',').map(Number) : []);
    }, [currentStarsStr]);

    useEffect(() => {
        setSelectedLocations(currentLocationsStr ? currentLocationsStr.split(',').map(Number) : []);
    }, [currentLocationsStr]);

    useEffect(() => {
        setFreeCancellation(parseBool(searchParams.get('freeCancellation')));
    }, [searchParams.get('freeCancellation')]);

    useEffect(() => {
        setPrePayment(parseBool(searchParams.get('prePayment')));
    }, [searchParams.get('prePayment')]);

    useEffect(() => {
        setRoomTwin(parseBool(searchParams.get('roomTwin')));
    }, [searchParams.get('roomTwin')]);

    useEffect(() => {
        setSelectedMaxAdult(searchParams.get('roomMaxAdult') ? searchParams.get('roomMaxAdult').split(',').map(Number) : []);
    }, [searchParams.get('roomMaxAdult')]);

    useEffect(() => {
        setSelectedMaxChildren(searchParams.get('roomMaxChildren') ? searchParams.get('roomMaxChildren').split(',').map(Number) : []);
    }, [searchParams.get('roomMaxChildren')]);

    useEffect(() => {
        setSelectedMaxExtraBed(searchParams.get('roomMaxExtraBed') ? searchParams.get('roomMaxExtraBed').split(',').map(Number) : []);
    }, [searchParams.get('roomMaxExtraBed')]);

    useEffect(() => {
        setSelectedFacilities(searchParams.get('facilities') ? searchParams.get('facilities').split(',').map(Number) : []);
    }, [searchParams.get('facilities')]);

    const applyParamDirect = (key, value) => {
        if (!hideHeader) return;
        const newParams = new URLSearchParams(searchParams);
        if (value !== null && value !== undefined && (Array.isArray(value) ? value.length > 0 : String(value).length > 0)) {
            newParams.set(key, Array.isArray(value) ? value.join(',') : String(value));
        } else {
            newParams.delete(key);
        }
        setSearchParams(newParams);
    };

    // Toggle 3-state boolean: clicking same value again → deselect (null)
    const handleBoolToggle = (setter, current, clickedValue, paramKey) => {
        const next = current === clickedValue ? null : clickedValue;
        setter(next);
        if (hideHeader && paramKey) {
            applyParamDirect(paramKey, next);
        }
    };

    const handleStarToggle = (val) => {
        const next = selectedStars.includes(val) ? selectedStars.filter(v => v !== val) : [...selectedStars, val];
        setSelectedStars(next);
        if (hideHeader) applyParamDirect('stars', next);
    };

    const handleLocationToggle = (val) => {
        const next = selectedLocations.includes(val) ? selectedLocations.filter(v => v !== val) : [...selectedLocations, val];
        setSelectedLocations(next);
        if (hideHeader) applyParamDirect('locations', next);
    };

    const handleMaxAdultToggle = (val) => {
        const next = selectedMaxAdult.includes(val) ? selectedMaxAdult.filter(v => v !== val) : [...selectedMaxAdult, val];
        setSelectedMaxAdult(next);
        if (hideHeader) applyParamDirect('roomMaxAdult', next);
    };

    const handleMaxChildrenToggle = (val) => {
        const next = selectedMaxChildren.includes(val) ? selectedMaxChildren.filter(v => v !== val) : [...selectedMaxChildren, val];
        setSelectedMaxChildren(next);
        if (hideHeader) applyParamDirect('roomMaxChildren', next);
    };

    const handleMaxExtraBedToggle = (val) => {
        const next = selectedMaxExtraBed.includes(val) ? selectedMaxExtraBed.filter(v => v !== val) : [...selectedMaxExtraBed, val];
        setSelectedMaxExtraBed(next);
        if (hideHeader) applyParamDirect('roomMaxExtraBed', next);
    };

    const handleFacilityToggle = (val) => {
        const next = selectedFacilities.includes(val) ? selectedFacilities.filter(v => v !== val) : [...selectedFacilities, val];
        setSelectedFacilities(next);
        if (hideHeader) applyParamDirect('facilities', next);
    };

    const handleApplyFilters = () => {
        const newParams = new URLSearchParams(searchParams);
        if (selectedStars.length > 0) {
            newParams.set('stars', selectedStars.join(','));
        } else {
            newParams.delete('stars');
        }
        if (selectedLocations.length > 0) {
            newParams.set('locations', selectedLocations.join(','));
        } else {
            newParams.delete('locations');
        }
        if (freeCancellation !== null) {
            newParams.set('freeCancellation', String(freeCancellation));
        } else {
            newParams.delete('freeCancellation');
        }
        if (prePayment !== null) {
            newParams.set('prePayment', String(prePayment));
        } else {
            newParams.delete('prePayment');
        }
        if (roomTwin !== null) {
            newParams.set('roomTwin', String(roomTwin));
        } else {
            newParams.delete('roomTwin');
        }
        if (selectedMaxAdult.length > 0) {
            newParams.set('roomMaxAdult', selectedMaxAdult.join(','));
        } else {
            newParams.delete('roomMaxAdult');
        }
        if (selectedMaxChildren.length > 0) {
            newParams.set('roomMaxChildren', selectedMaxChildren.join(','));
        } else {
            newParams.delete('roomMaxChildren');
        }
        if (selectedMaxExtraBed.length > 0) {
            newParams.set('roomMaxExtraBed', selectedMaxExtraBed.join(','));
        } else {
            newParams.delete('roomMaxExtraBed');
        }
        if (selectedFacilities.length > 0) {
            newParams.set('facilities', selectedFacilities.join(','));
        } else {
            newParams.delete('facilities');
        }
        setSearchParams(newParams);
    };

    const handleClearAll = () => {
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
        newParams.delete('stars');
        newParams.delete('locations');
        newParams.delete('freeCancellation');
        newParams.delete('prePayment');
        newParams.delete('roomTwin');
        newParams.delete('roomMaxAdult');
        newParams.delete('roomMaxChildren');
        newParams.delete('roomMaxExtraBed');
        newParams.delete('facilities');
        setSearchParams(newParams);
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
        <aside className="w-full shrink-0 animate-in slide-in-from-left-4 fade-in duration-500">
            <div className="relative">
                {/* Sticky Header with Actions */}
                {!hideHeader && (
                    <div className="sticky top-0 z-50 px-6 py-4 bg-white dark:bg-[#111a22] border-b border-slate-100/50 dark:border-slate-800/50 flex items-center justify-between shadow-lg shadow-black/[0.03] dark:shadow-white/[0.02]">
                        <h2 className="text-sm font-semibold tracking-tight text-slate-800 dark:text-slate-100" lang={currentLang}>
                            {tFilter('filters', currentLang)}
                        </h2>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleClearAll}
                                className="text-[10px] font-medium text-slate-400 hover:text-red-500 uppercase tracking-wider px-2 py-1 transition-colors"
                                lang={currentLang}
                            >
                                {tFilter('reset', currentLang)}
                            </button>
                            <button
                                onClick={handleApplyFilters}
                                className="group flex items-center gap-2 bg-primary hover:bg-primary-hover text-white text-[10px] font-medium uppercase tracking-wider px-3.5 py-1.5 rounded-xl transition-all shadow-md shadow-primary/20 active:scale-95 whitespace-nowrap relative"
                                lang={currentLang}
                            >
                                {tFilter('apply', currentLang)}
                                {activeFilterCount > 0 && (
                                    <span className="flex items-center justify-center min-w-[14px] h-[14px] bg-white text-primary text-[9px] font-semibold rounded-full px-1 animate-in zoom-in duration-300">
                                        {activeFilterCount}
                                    </span>
                                )}
                            </button>
                        </div>
                    </div>
                )}

                <div className={`px-5 pb-6 ${hideHeader ? 'pt-4' : ''}`}>
                {/* Locations */}
                <FilterSection title={tFilter('locations', currentLang)} icon="location_on">
                    <div className="space-y-2.5">
                        {filters?.locationId && filters.locationId.length > 0 ? (
                            <>
                                {/* Location Search Input */}
                                <div className="relative mb-3 group/search">
                                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/search:text-primary text-sm transition-colors">search</span>
                                    <input 
                                        type="text" 
                                        placeholder={tFilter('searchLocations', currentLang)} 
                                        value={locationSearch}
                                        onChange={(e) => setLocationSearch(e.target.value)}
                                        className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 focus:border-primary/50 focus:ring-4 focus:ring-primary/5 rounded-xl text-xs font-medium placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all"
                                    />
                                    {locationSearch && (
                                        <button 
                                            onClick={() => setLocationSearch('')}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary transition-colors"
                                        >
                                            <span className="material-symbols-outlined text-sm">close</span>
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
                                    .map(locFilter => {
                                        const locName = locationNames[locFilter.value] || '';
                                        return (
                                            <label key={locFilter.value} className="flex items-center justify-between cursor-pointer group animate-in fade-in duration-200">
                                                <div className="flex items-center gap-2.5 overflow-hidden">
                                                    <input
                                                        checked={selectedLocations.includes(locFilter.value)}
                                                        onChange={() => handleLocationToggle(locFilter.value)}
                                                        className="h-3.5 w-3.5 rounded border-slate-300 dark:border-[#324d67] bg-transparent text-primary focus:ring-primary focus:ring-offset-0 checkbox-tick flex-shrink-0"
                                                        type="checkbox"
                                                    />
                                                    <div className="flex items-center gap-1.5 overflow-hidden">
                                                        <span className="material-symbols-outlined text-[15px] text-slate-400 group-hover:text-primary transition-colors flex-shrink-0">location_on</span>
                                                        <span className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate" title={locName}>
                                                            {locName}
                                                        </span>
                                                    </div>
                                                </div>
                                                <span className="text-[11px] text-slate-400 dark:text-slate-500 font-normal whitespace-nowrap ml-2">
                                                    ({locFilter.count})
                                                </span>
                                            </label>
                                        );
                                    })}
                                
                                {!locationSearch && filters.locationId.length > 10 && (
                                    <button
                                        onClick={() => setIsLocationsExpanded(!isLocationsExpanded)}
                                        className="text-xs font-medium text-primary hover:text-primary-hover flex items-center gap-1 mt-2 transition-colors uppercase tracking-wider pl-8"
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
                            <div className="text-xs text-slate-500 dark:text-slate-400 italic" lang={currentLang}>
                                {tFilter('noLocations', currentLang)}
                            </div>
                        )}
                    </div>
                </FilterSection>

                {/* Star Rating Checklist */}
                <FilterSection title={tFilter('starRating', currentLang)} icon="star">
                    <div className="space-y-2.5">
                        {filters?.hotelStarCategoryId ? (
                            [...filters.hotelStarCategoryId]
                                .sort((a, b) => b.value - a.value)
                                .map(starFilter => (
                                    <label key={starFilter.value} className="flex items-center justify-between cursor-pointer group">
                                        <div className="flex items-center gap-2.5">
                                            <input
                                                checked={selectedStars.includes(starFilter.value)}
                                                onChange={() => handleStarToggle(starFilter.value)}
                                                className="h-3.5 w-3.5 rounded border-slate-300 dark:border-[#324d67] bg-transparent text-primary focus:ring-primary focus:ring-offset-0 checkbox-tick"
                                                type="checkbox"
                                            />
                                            <div className="flex items-center gap-1">
                                                <span className="text-xs font-medium text-slate-700 dark:text-slate-300" lang={currentLang}>
                                                    {starFilter.value === 0 ? tFilter('unrated', currentLang) : `${starFilter.value} ${tFilter('stars', currentLang)}`}
                                                </span>
                                                {starFilter.value > 0 && (
                                                    <div className="flex text-amber-400">
                                                        {[...Array(starFilter.value)].map((_, i) => (
                                                            <span key={i} className="material-symbols-outlined text-xs fill-1">star</span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <span className="text-[11px] text-slate-400 dark:text-slate-500 font-normal">
                                            ({starFilter.count})
                                        </span>
                                    </label>
                                ))
                        ) : (
                            [5, 4, 3, 2].map(star => (
                                <label key={star} className="flex items-center gap-2.5 cursor-pointer group">
                                    <input
                                        checked={selectedStars.includes(star)}
                                        onChange={() => handleStarToggle(star)}
                                        className="h-3.5 w-3.5 rounded border-slate-300 dark:border-[#324d67] bg-transparent text-primary focus:ring-primary focus:ring-offset-0 checkbox-tick"
                                        type="checkbox"
                                    />
                                    <div className="flex items-center gap-1">
                                        <span className="text-xs font-medium text-slate-700 dark:text-slate-300" lang={currentLang}>
                                            {star} {tFilter('stars', currentLang)}
                                        </span>
                                        <div className="flex text-amber-400">
                                            {[...Array(star)].map((_, i) => (
                                                <span key={i} className="material-symbols-outlined text-xs fill-1">star</span>
                                            ))}
                                        </div>
                                    </div>
                                </label>
                            ))
                        )}
                    </div>
                </FilterSection>

                {/* Free Cancellation */}
                <FilterSection title={tFilter('freeCancellation', currentLang)} icon="event_available">
                    <div className="space-y-2.5">
                        {(filters?.hasFreeCancellation ?? [
                            { value: true, count: null },
                            { value: false, count: null }
                        ]).sort((a, b) => (b.value === true ? 1 : -1)).map(f => (
                            <label key={String(f.value)} className="flex items-center justify-between cursor-pointer group">
                                <div className="flex items-center gap-2.5">
                                    <input
                                        type="checkbox"
                                        checked={freeCancellation === f.value}
                                        onChange={() => handleBoolToggle(setFreeCancellation, freeCancellation, f.value)}
                                        className="h-3.5 w-3.5 rounded border-slate-300 dark:border-[#324d67] bg-transparent text-primary focus:ring-primary focus:ring-offset-0 checkbox-tick"
                                    />
                                    <div className="flex items-center gap-1.5">
                                        <span className={`material-symbols-outlined text-[16px] transition-colors ${f.value ? 'text-emerald-500' : 'text-slate-400'}`}>
                                            {f.value ? 'verified' : 'info'}
                                        </span>
                                        <span className="text-xs font-medium text-slate-700 dark:text-slate-300" lang={currentLang}>
                                            {f.value ? tFilter('freeCancellation', currentLang) : tFilter('nonRefundable', currentLang)}
                                        </span>
                                    </div>
                                </div>
                                {f.count !== null && (
                                    <span className="text-[11px] text-slate-400 dark:text-slate-500 font-normal">({f.count})</span>
                                )}
                            </label>
                        ))}
                    </div>
                </FilterSection>

                {/* Pre-Payment */}
                <FilterSection title={tFilter('prePayment', currentLang)} icon="credit_card">
                    <div className="space-y-2.5">
                        {(filters?.hasPrePayment ?? [
                            { value: true, count: null },
                            { value: false, count: null }
                        ]).sort((a, b) => (b.value === true ? 1 : -1)).map(f => (
                            <label key={String(f.value)} className="flex items-center justify-between cursor-pointer group">
                                <div className="flex items-center gap-2.5">
                                    <input
                                        type="checkbox"
                                        checked={prePayment === f.value}
                                        onChange={() => handleBoolToggle(setPrePayment, prePayment, f.value)}
                                        className="h-3.5 w-3.5 rounded border-slate-300 dark:border-[#324d67] bg-transparent text-primary focus:ring-primary focus:ring-offset-0 checkbox-tick"
                                    />
                                    <div className="flex items-center gap-1.5">
                                        <span className="material-symbols-outlined text-[16px] text-slate-400 group-hover:text-primary transition-colors">
                                            {f.value ? 'credit_card' : 'payments'}
                                        </span>
                                        <span className="text-xs font-medium text-slate-700 dark:text-slate-300" lang={currentLang}>
                                            {f.value ? tFilter('prePayment', currentLang) : tFilter('payLater', currentLang)}
                                        </span>
                                    </div>
                                </div>
                                {f.count !== null && (
                                    <span className="text-[11px] text-slate-400 dark:text-slate-500 font-normal">({f.count})</span>
                                )}
                            </label>
                        ))}
                    </div>
                </FilterSection>

                {/* Room Twin */}
                <FilterSection title={tFilter('twinRoom', currentLang)} icon="bed">
                    <div className="space-y-2.5">
                        {(filters?.roomTwin ?? [
                            { value: true, count: null },
                            { value: false, count: null }
                        ]).sort((a, b) => (b.value === true ? 1 : -1)).map(f => (
                            <label key={String(f.value)} className="flex items-center justify-between cursor-pointer group">
                                <div className="flex items-center gap-2.5">
                                    <input
                                        type="checkbox"
                                        checked={roomTwin === f.value}
                                        onChange={() => handleBoolToggle(setRoomTwin, roomTwin, f.value)}
                                        className="h-3.5 w-3.5 rounded border-slate-300 dark:border-[#324d67] bg-transparent text-primary focus:ring-primary focus:ring-offset-0 checkbox-tick"
                                    />
                                    <div className="flex items-center gap-1.5 text-slate-500">
                                        <span className="material-symbols-outlined text-[16px]">bed</span>
                                        {f.value && <span className="material-symbols-outlined text-[11px] -ml-2 mb-2">bed</span>}
                                        <span className="text-xs font-medium text-slate-700 dark:text-slate-300 ml-0.5" lang={currentLang}>
                                            {f.value ? tFilter('twinAvailable', currentLang) : tFilter('noTwin', currentLang)}
                                        </span>
                                    </div>
                                </div>
                                {f.count !== null && (
                                    <span className="text-[11px] text-slate-400 dark:text-slate-500 font-normal">({f.count})</span>
                                )}
                            </label>
                        ))}
                    </div>
                </FilterSection>

                {/* Max Adult */}
                <FilterSection title={tFilter('maxAdult', currentLang)} icon="person" defaultOpen={false}>
                    <div className="space-y-2.5">
                        {filters?.roomMaxAdult?.length > 0 ? (
                            [...filters.roomMaxAdult]
                                .sort((a, b) => a.value - b.value)
                                .map(f => (
                                    <label key={f.value} className="flex items-center justify-between cursor-pointer group">
                                        <div className="flex items-center gap-2.5">
                                            <input
                                                checked={selectedMaxAdult.includes(f.value)}
                                                onChange={() => handleMaxAdultToggle(f.value)}
                                                className="h-3.5 w-3.5 rounded border-slate-300 dark:border-[#324d67] bg-transparent text-primary focus:ring-primary focus:ring-offset-0 checkbox-tick"
                                                type="checkbox"
                                            />
                                            <div className="flex items-center gap-1.5">
                                                <span className="material-symbols-outlined text-[15px] text-slate-400 group-hover:text-primary transition-colors">person</span>
                                                <span className="text-xs font-medium text-slate-700 dark:text-slate-300" lang={currentLang}>
                                                    {f.value} {tFilter('adults', currentLang)}
                                                </span>
                                            </div>
                                        </div>
                                        <span className="text-[11px] text-slate-400 dark:text-slate-500 font-normal">
                                            ({f.count})
                                        </span>
                                    </label>
                                ))
                        ) : (
                            <div className="text-xs text-slate-500 dark:text-slate-400 italic" lang={currentLang}>
                                {tFilter('noOptions', currentLang)}
                            </div>
                        )}
                    </div>
                </FilterSection>

                {/* Max Children */}
                <FilterSection title={tFilter('maxChildren', currentLang)} icon="child_care" defaultOpen={false}>
                    <div className="space-y-2.5">
                        {filters?.roomMaxChildren?.length > 0 ? (
                            [...filters.roomMaxChildren]
                                .sort((a, b) => a.value - b.value)
                                .map(f => (
                                    <label key={f.value} className="flex items-center justify-between cursor-pointer group">
                                        <div className="flex items-center gap-2.5">
                                            <input
                                                checked={selectedMaxChildren.includes(f.value)}
                                                onChange={() => handleMaxChildrenToggle(f.value)}
                                                className="h-3.5 w-3.5 rounded border-slate-300 dark:border-[#324d67] bg-transparent text-primary focus:ring-primary focus:ring-offset-0 checkbox-tick"
                                                type="checkbox"
                                            />
                                            <div className="flex items-center gap-1.5">
                                                <span className="material-symbols-outlined text-[15px] text-slate-400 group-hover:text-primary transition-colors">child_care</span>
                                                <span className="text-xs font-medium text-slate-700 dark:text-slate-300" lang={currentLang}>
                                                    {f.value === 0 ? tFilter('noChildren', currentLang) : `${f.value} ${tFilter('children', currentLang)}`}
                                                </span>
                                            </div>
                                        </div>
                                        <span className="text-[11px] text-slate-400 dark:text-slate-500 font-normal">
                                            ({f.count})
                                        </span>
                                    </label>
                                ))
                        ) : (
                            <div className="text-xs text-slate-500 dark:text-slate-400 italic" lang={currentLang}>
                                {tFilter('noOptions', currentLang)}
                            </div>
                        )}
                    </div>
                </FilterSection>

                {/* Max Extra Bed */}
                <FilterSection title={tFilter('maxExtraBed', currentLang)} icon="hotel_class" defaultOpen={false}>
                    <div className="space-y-2.5">
                        {filters?.roomMaxExtraBed?.length > 0 ? (
                            [...filters.roomMaxExtraBed]
                                .sort((a, b) => a.value - b.value)
                                .map(f => (
                                    <label key={f.value} className="flex items-center justify-between cursor-pointer group">
                                        <div className="flex items-center gap-2.5">
                                            <input
                                                checked={selectedMaxExtraBed.includes(f.value)}
                                                onChange={() => handleMaxExtraBedToggle(f.value)}
                                                className="h-3.5 w-3.5 rounded border-slate-300 dark:border-[#324d67] bg-transparent text-primary focus:ring-primary focus:ring-offset-0 checkbox-tick"
                                                type="checkbox"
                                            />
                                            <div className="flex items-center gap-1.5">
                                                <span className="material-symbols-outlined text-[15px] text-slate-400 group-hover:text-primary transition-colors">hotel_class</span>
                                                <span className="text-xs font-medium text-slate-700 dark:text-slate-300" lang={currentLang}>
                                                    {f.value === 0 ? tFilter('noExtraBed', currentLang) : `${f.value} ${f.value === 1 ? tFilter('extraBed', currentLang) : tFilter('extraBeds', currentLang)}`}
                                                </span>
                                            </div>
                                        </div>
                                        <span className="text-[11px] text-slate-400 dark:text-slate-500 font-normal">
                                            ({f.count})
                                        </span>
                                    </label>
                                ))
                        ) : (
                            <div className="text-xs text-slate-500 dark:text-slate-400 italic" lang={currentLang}>
                                {tFilter('noOptions', currentLang)}
                            </div>
                        )}
                    </div>
                </FilterSection>

                {/* Hotel Facilities */}
                <FilterSection title={tFilter('hotelFacilities', currentLang)} icon="pool">
                    <div className="space-y-2.5">
                        {filters?.hotelFacilityIds && filters.hotelFacilityIds.length > 0 ? (
                            <>
                                {/* Facility Search Input */}
                                <div className="relative mb-3 group/search">
                                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/search:text-primary text-sm transition-colors">search</span>
                                    <input 
                                        type="text" 
                                        placeholder={tFilter('searchFacilities', currentLang)} 
                                        value={facilitySearch}
                                        onChange={(e) => setFacilitySearch(e.target.value)}
                                        className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 focus:border-primary/50 focus:ring-4 focus:ring-primary/5 rounded-xl text-xs font-medium placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all"
                                    />
                                    {facilitySearch && (
                                        <button 
                                            onClick={() => setFacilitySearch('')}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary transition-colors"
                                        >
                                            <span className="material-symbols-outlined text-sm">close</span>
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
                                    .map(facFilter => {
                                        const facName = facilityNames[facFilter.value] || '';
                                        return (
                                            <label key={facFilter.value} className="flex items-center justify-between cursor-pointer group animate-in fade-in duration-200">
                                                <div className="flex items-center gap-2.5 overflow-hidden">
                                                    <input
                                                        checked={selectedFacilities.includes(facFilter.value)}
                                                        onChange={() => handleFacilityToggle(facFilter.value)}
                                                        className="h-3.5 w-3.5 rounded border-slate-300 dark:border-[#324d67] bg-transparent text-primary focus:ring-primary focus:ring-offset-0 checkbox-tick flex-shrink-0"
                                                        type="checkbox"
                                                    />
                                                    <div className="flex items-center gap-1.5 overflow-hidden">
                                                        <span className="material-symbols-outlined text-[15px] text-slate-400 group-hover:text-primary transition-colors flex-shrink-0">business_center</span>
                                                        <span className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate" title={facName}>
                                                            {facName}
                                                        </span>
                                                    </div>
                                                </div>
                                                <span className="text-[11px] text-slate-400 dark:text-slate-500 font-normal whitespace-nowrap ml-2">
                                                    ({facFilter.count})
                                                </span>
                                            </label>
                                        );
                                    })}
                                
                                {!facilitySearch && filters.hotelFacilityIds.length > 10 && (
                                    <button
                                        onClick={() => setIsFacilitiesExpanded(!isFacilitiesExpanded)}
                                        className="text-xs font-medium text-primary hover:text-primary-hover flex items-center gap-1 mt-2 transition-colors uppercase tracking-wider pl-8"
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
                            <div className="text-xs text-slate-500 dark:text-slate-400 italic" lang={currentLang}>
                                {tFilter('noFacilities', currentLang)}
                            </div>
                        )}
                    </div>
                </FilterSection>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
