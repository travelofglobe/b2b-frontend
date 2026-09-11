import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import FilterSection from './FilterSection';
import { tFilter } from '../utils/filterLocales';
import { tListing } from '../utils/hotelListingLocales';

const Sidebar = ({ filters, locationNames = {}, facilityNames = {}, hideHeader = false, sortOptions = [], currentSortValue = '', onSortChange = null, priceRange, setPriceRange, maxHotelPrice, priceHistogram, currentCurrencySymbol = '$', setIsPriceCustomized }) => {
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
        if (setPriceRange && maxHotelPrice) {
            setPriceRange([0, maxHotelPrice]);
        }
        if (setIsPriceCustomized) {
            setIsPriceCustomized(false);
        }
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

                <div className={`pb-6 ${hideHeader ? 'pt-4' : ''}`}>
                {/* Sort Options (Only in Popup) */}
                {sortOptions && sortOptions.length > 0 && hideHeader && (
                    <FilterSection title="Sıralama ölçütü" isFlat={true}>
                        <div className="space-y-4">
                            {sortOptions.map(opt => (
                                <label key={opt.value} className="flex items-center gap-3 cursor-pointer group">
                                    <input
                                        type="radio"
                                        name="sortOptions"
                                        value={opt.value}
                                        checked={currentSortValue === opt.value}
                                        onChange={() => onSortChange(opt.value)}
                                        className="h-5 w-5 border-2 border-[#dadce0] dark:border-slate-500 text-[#1a73e8] focus:ring-[#1a73e8] transition-colors cursor-pointer"
                                    />
                                    <span className="text-[14px] text-[#3c4043] dark:text-slate-200">
                                        {opt.label}
                                    </span>
                                </label>
                            ))}
                        </div>
                    </FilterSection>
                )}

                {/* Locations */}
                <FilterSection title={tFilter('locations', currentLang)} icon={hideHeader ? null : "location_on"}>
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
                                                        className="h-4 w-4 rounded border-slate-300 dark:border-[#324d67] bg-transparent text-[#1a73e8] focus:ring-[#1a73e8] focus:ring-offset-0 flex-shrink-0"
                                                        type="checkbox"
                                                    />
                                                    <div className="flex items-center gap-1.5 overflow-hidden">
                                                        <span className="text-[14px] text-[#3c4043] dark:text-slate-300 truncate" title={locName}>
                                                            {locName}
                                                        </span>
                                                    </div>
                                                </div>
                                                <span className="text-[12px] text-slate-400 dark:text-slate-500 font-normal whitespace-nowrap ml-2">
                                                    ({locFilter.count})
                                                </span>
                                            </label>
                                        );
                                    })}
                                
                                {!locationSearch && filters.locationId.length > 10 && (
                                    <button
                                        onClick={() => setIsLocationsExpanded(!isLocationsExpanded)}
                                        className="text-xs font-medium text-[#1a73e8] hover:text-blue-700 flex items-center gap-1 mt-2 transition-colors uppercase tracking-wider pl-8"
                                        lang={currentLang}
                                    >
                                        {isLocationsExpanded ? (
                                            <>{tFilter('showLess', currentLang)} <span className="material-symbols-outlined text-sm">expand_less</span></>
                                        ) : (
                                            <>{tFilter('showMore', currentLang)} ({filters.locationId.length - 10}) <span className="material-symbols-outlined text-sm">expand_more</span></>
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

                {/* Price Filter */}
                {priceRange && (
                    <FilterSection title={currentLang === 'tr' ? 'Fiyat' : 'Price'} icon={hideHeader ? null : "payments"} isFlat={hideHeader}>
                        <div className="flex flex-col pt-2 pb-2 px-2">
                            {/* Histogram Bars */}
                            <div className="flex items-center gap-[2px] h-[34px] px-1 mb-0 relative z-0 pointer-events-none select-none">
                                {priceHistogram && priceHistogram.map((item, idx) => (
                                    <div
                                        key={idx}
                                        className="flex-1 bg-[#dadce0] dark:bg-slate-600 rounded-t-[2px] transition-all"
                                        style={{ height: `${Math.round(item.height * 0.85)}px` }}
                                    />
                                ))}
                            </div>

                            {/* Range Slider Container */}
                            <div className="relative w-full h-7 flex items-center">
                                {/* Inactive Base Track */}
                                <div className="absolute left-0 right-0 h-[4px] bg-[#dadce0] dark:bg-slate-600 rounded-full pointer-events-none" />

                                {/* Active Track Highlight */}
                                <div
                                    className="absolute h-[4px] bg-[#1a73e8] rounded-full pointer-events-none z-10"
                                    style={{
                                        left: `${Math.max(0, Math.min(100, (priceRange[0] / maxHotelPrice) * 100))}%`,
                                        width: `${Math.max(0, Math.max(0, Math.min(100, (priceRange[1] / maxHotelPrice) * 100)) - Math.max(0, Math.min(100, (priceRange[0] / maxHotelPrice) * 100)))}%`
                                    }}
                                />

                                {/* Left Thumb Dot */}
                                <div
                                    className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 w-[18px] h-[18px] bg-[#1a73e8] rounded-full shadow-[0_1px_3px_rgba(0,0,0,0.3)] pointer-events-none z-10"
                                    style={{ left: `${Math.max(0, Math.min(100, (priceRange[0] / maxHotelPrice) * 100))}%` }}
                                />

                                {/* Right Thumb Dot */}
                                <div
                                    className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 w-[18px] h-[18px] bg-[#1a73e8] rounded-full shadow-[0_1px_3px_rgba(0,0,0,0.3)] pointer-events-none z-10"
                                    style={{ left: `${Math.max(0, Math.min(100, (priceRange[1] / maxHotelPrice) * 100))}%` }}
                                />

                                {/* Hidden interactive range inputs */}
                                <input
                                    type="range"
                                    min={0}
                                    max={maxHotelPrice}
                                    step={100}
                                    value={priceRange[0]}
                                    onChange={(e) => {
                                        const val = Math.min(Number(e.target.value), priceRange[1] - 100);
                                        setPriceRange([val, priceRange[1]]);
                                        if (setIsPriceCustomized) setIsPriceCustomized(true);
                                    }}
                                    className={`google-range-slider absolute inset-0 w-full pointer-events-none appearance-none bg-transparent ${priceRange[0] > maxHotelPrice * 0.5 ? 'z-30' : 'z-20'}`}
                                />
                                <input
                                    type="range"
                                    min={0}
                                    max={maxHotelPrice}
                                    step={100}
                                    value={priceRange[1]}
                                    onChange={(e) => {
                                        const val = Math.max(Number(e.target.value), priceRange[0] + 100);
                                        setPriceRange([priceRange[0], val]);
                                        if (setIsPriceCustomized) setIsPriceCustomized(true);
                                    }}
                                    className={`google-range-slider absolute inset-0 w-full pointer-events-none appearance-none bg-transparent ${priceRange[1] <= maxHotelPrice * 0.5 ? 'z-30' : 'z-20'}`}
                                />
                            </div>
                            
                            <div className="flex justify-between items-center mt-3">
                                <span className="text-[13px] font-medium text-slate-700 dark:text-slate-300 border border-[#dadce0] dark:border-slate-700 px-3 py-1.5 rounded-md">
                                    {currentCurrencySymbol}{priceRange[0].toLocaleString('tr-TR')}
                                </span>
                                <span className="text-[13px] font-medium text-slate-700 dark:text-slate-300 border border-[#dadce0] dark:border-slate-700 px-3 py-1.5 rounded-md">
                                    {currentCurrencySymbol}{priceRange[1].toLocaleString('tr-TR')}{priceRange[1] >= maxHotelPrice ? '+' : ''}
                                </span>
                            </div>
                        </div>
                    </FilterSection>
                )}

                {/* Star Rating / Otel Sınıfı */}
                {(() => {
                    const rawStars = filters?.hotelStarCategoryId;
                    const starValues = (rawStars && rawStars.length > 0)
                        ? [...rawStars].filter(s => s.value >= 2 && s.value <= 5).sort((a, b) => a.value - b.value).map(s => s.value)
                        : [2, 3, 4, 5];

                    const starGrid = (
                        <div className="grid grid-cols-2 border border-[#dadce0] dark:border-slate-700 rounded-lg overflow-hidden">
                            {starValues.map((star, index, arr) => {
                                const isSelected = selectedStars.includes(star);
                                let subtitle = '';
                                if (star === 5) subtitle = tListing('star5Desc', currentLang);
                                else if (star === 4) subtitle = tListing('star4Desc', currentLang);
                                else if (star === 3) subtitle = tListing('star3Desc', currentLang);
                                else if (star === 2) subtitle = tListing('star2Desc', currentLang);
                                const isLeftCol = index % 2 === 0;
                                const totalRows = Math.ceil(arr.length / 2);
                                const currentRow = Math.floor(index / 2);
                                const isLastRow = currentRow === totalRows - 1;
                                return (
                                    <button
                                        key={star}
                                        type="button"
                                        onClick={() => handleStarToggle(star)}
                                        className={`py-4 px-2 text-center flex flex-col items-center justify-center cursor-pointer transition-colors select-none
                                            ${isLeftCol ? 'border-r border-[#dadce0] dark:border-slate-700' : ''}
                                            ${!isLastRow ? 'border-b border-[#dadce0] dark:border-slate-700' : ''}
                                            ${isSelected
                                                ? 'bg-[#e8f0fe] dark:bg-blue-900/30'
                                                : 'bg-white dark:bg-[#303134] hover:bg-[#f8f9fa] dark:hover:bg-slate-700/50'
                                            }`}
                                    >
                                        <span className={`text-[14px] font-semibold font-roboto ${isSelected ? 'text-[#1a73e8] dark:text-blue-300' : 'text-[#202124] dark:text-slate-100'}`}>
                                            {star} {tListing('starSingle', currentLang)}
                                        </span>
                                        {subtitle && (
                                            <span className={`text-[12px] mt-0.5 font-roboto leading-snug ${isSelected ? 'text-[#1a73e8] dark:text-blue-300' : 'text-[#5f6368] dark:text-slate-400'}`}>
                                                {subtitle}
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    );

                    if (hideHeader) {
                        return (
                            <div className="py-5 px-5 border-b border-[#e8eaed] dark:border-slate-700/50">
                                <h3 className="text-[15px] font-medium text-[#202124] dark:text-slate-200 mb-4 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-slate-400 text-lg">hotel_class</span>
                                    {currentLang === 'tr' ? 'Otel sınıfı' : tFilter('starRating', currentLang)}
                                </h3>
                                {starGrid}
                            </div>
                        );
                    }

                    return (
                        <FilterSection title={currentLang === 'tr' ? 'Otel sınıfı' : tFilter('starRating', currentLang)} icon="hotel_class">
                            {starGrid}
                        </FilterSection>
                    );
                })()}

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
                                        className="h-4 w-4 rounded border-slate-300 dark:border-[#324d67] bg-transparent text-[#1a73e8] focus:ring-[#1a73e8] focus:ring-offset-0 checkbox-tick"
                                    />
                                    <div className="flex items-center gap-1.5">
                                        <span className={`material-symbols-outlined text-[20px] transition-colors ${f.value ? 'text-emerald-500' : 'text-slate-400'}`}>
                                            {f.value ? 'verified' : 'info'}
                                        </span>
                                        <span className="text-[14px] text-[#3c4043] dark:text-slate-300" lang={currentLang}>
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
                                        className="h-4 w-4 rounded border-slate-300 dark:border-[#324d67] bg-transparent text-[#1a73e8] focus:ring-[#1a73e8] focus:ring-offset-0 checkbox-tick"
                                    />
                                    <div className="flex items-center gap-1.5">
                                        <span className="material-symbols-outlined text-[20px] text-slate-400 group-hover:text-[#1a73e8] transition-colors">
                                            {f.value ? 'credit_card' : 'payments'}
                                        </span>
                                        <span className="text-[14px] text-[#3c4043] dark:text-slate-300" lang={currentLang}>
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
                                        className="h-4 w-4 rounded border-slate-300 dark:border-[#324d67] bg-transparent text-[#1a73e8] focus:ring-[#1a73e8] focus:ring-offset-0 checkbox-tick"
                                    />
                                    <div className="flex items-center gap-1.5 text-slate-500">
                                        <span className="material-symbols-outlined text-[20px]">bed</span>
                                        {f.value && <span className="material-symbols-outlined text-[13px] -ml-2 mb-2">bed</span>}
                                        <span className="text-[14px] text-[#3c4043] dark:text-slate-300 ml-0.5" lang={currentLang}>
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
                                                className="h-4 w-4 rounded border-slate-300 dark:border-[#324d67] bg-transparent text-[#1a73e8] focus:ring-[#1a73e8] focus:ring-offset-0 checkbox-tick"
                                                type="checkbox"
                                            />
                                            <div className="flex items-center gap-1.5">
                                                <span className="material-symbols-outlined text-[20px] text-slate-400 group-hover:text-[#1a73e8] transition-colors">person</span>
                                                <span className="text-[14px] text-[#3c4043] dark:text-slate-300" lang={currentLang}>
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
                                                className="h-4 w-4 rounded border-slate-300 dark:border-[#324d67] bg-transparent text-[#1a73e8] focus:ring-[#1a73e8] focus:ring-offset-0 checkbox-tick"
                                                type="checkbox"
                                            />
                                            <div className="flex items-center gap-1.5">
                                                <span className="material-symbols-outlined text-[20px] text-slate-400 group-hover:text-[#1a73e8] transition-colors">child_care</span>
                                                <span className="text-[14px] text-[#3c4043] dark:text-slate-300" lang={currentLang}>
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
                                                className="h-4 w-4 rounded border-slate-300 dark:border-[#324d67] bg-transparent text-[#1a73e8] focus:ring-[#1a73e8] focus:ring-offset-0 checkbox-tick"
                                                type="checkbox"
                                            />
                                            <div className="flex items-center gap-1.5">
                                                <span className="material-symbols-outlined text-[20px] text-slate-400 group-hover:text-[#1a73e8] transition-colors">hotel_class</span>
                                                <span className="text-[14px] text-[#3c4043] dark:text-slate-300" lang={currentLang}>
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

                                <div className="grid grid-cols-2 gap-3">
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
                                        const isSelected = selectedFacilities.includes(facFilter.value);
                                        return (
                                            <div 
                                                key={facFilter.value}
                                                onClick={() => handleFacilityToggle(facFilter.value)}
                                                className={`flex flex-col items-center justify-center p-3 rounded-lg border cursor-pointer transition-colors text-center min-h-[90px] ${isSelected ? 'bg-[#e8f0fe] dark:bg-blue-900/20 border-[#1a73e8] dark:border-blue-500' : 'bg-white dark:bg-[#303134] border-[#dadce0] dark:border-slate-600 hover:bg-[#f8f9fa] dark:hover:bg-slate-700'}`}
                                            >
                                                <span className={`material-symbols-outlined text-[24px] mb-1 ${isSelected ? 'text-[#1a73e8] dark:text-blue-300' : 'text-[#5f6368] dark:text-slate-400'}`}>
                                                    business_center
                                                </span>
                                                <span className={`text-[13px] font-medium leading-tight ${isSelected ? 'text-[#1a73e8] dark:text-blue-300' : 'text-[#3c4043] dark:text-slate-200'}`}>
                                                    {facName}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                                
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
