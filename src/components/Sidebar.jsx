import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import FilterSection from './FilterSection';
import { tFilter } from '../utils/filterLocales';
import { tListing, getAmenityIcon } from '../utils/hotelListingLocales';

const Sidebar = ({
    filters,
    locationNames = {},
    facilityNames = {},
    hideHeader = false,
    sortOptions = [],
    currentSortValue = '',
    onSortChange = null,
    priceRange,
    setPriceRange,
    maxHotelPrice,
    priceHistogram,
    currentCurrencySymbol = '$',
    setIsPriceCustomized
}) => {
    const [searchParams, setSearchParams] = useSearchParams();
    const { i18n } = useTranslation();
    const currentLang = (i18n.language || localStorage.getItem('language') || 'en').split('-')[0].toLowerCase();

    // 1. Star Rating
    const currentStarsStr = searchParams.get('stars');
    const urlStars = currentStarsStr ? currentStarsStr.split(',').map(Number) : [];
    const [selectedStars, setSelectedStars] = useState(urlStars);

    // 2. Locations
    const currentLocationsStr = searchParams.get('locations');
    const urlLocations = currentLocationsStr ? currentLocationsStr.split(',').map(decodeURIComponent).filter(Boolean) : [];
    const [selectedLocations, setSelectedLocations] = useState(urlLocations);

    // 3. Property / Accommodation Type
    const currentCategoriesStr = searchParams.get('categories');
    const urlCategories = currentCategoriesStr ? currentCategoriesStr.split(',').map(decodeURIComponent).filter(Boolean) : [];
    const [selectedCategories, setSelectedCategories] = useState(urlCategories);

    // 4. Hotel Chains & Brands
    const currentChainsStr = searchParams.get('chains');
    const urlChains = currentChainsStr ? currentChainsStr.split(',').map(decodeURIComponent).filter(Boolean) : [];
    const [selectedChains, setSelectedChains] = useState(urlChains);

    // 5. Guest Rating
    const currentGuestRating = searchParams.get('guestRating') || '';
    const [selectedGuestRating, setSelectedGuestRating] = useState(currentGuestRating);

    // 6. Facilities / Amenities
    const currentFacilitiesStr = searchParams.get('facilities');
    const [selectedFacilities, setSelectedFacilities] = useState(currentFacilitiesStr ? currentFacilitiesStr.split(',').map(Number) : []);

    // 7. Capacities
    const currentMaxAdultStr = searchParams.get('roomMaxAdult');
    const [selectedMaxAdult, setSelectedMaxAdult] = useState(currentMaxAdultStr ? currentMaxAdultStr.split(',').map(Number) : []);
    const currentMaxChildrenStr = searchParams.get('roomMaxChildren');
    const [selectedMaxChildren, setSelectedMaxChildren] = useState(currentMaxChildrenStr ? currentMaxChildrenStr.split(',').map(Number) : []);

    // Search and Expand states
    const [isLocationsExpanded, setIsLocationsExpanded] = useState(false);
    const [locationSearch, setLocationSearch] = useState('');

    const [isCategoriesExpanded, setIsCategoriesExpanded] = useState(false);
    const [categorySearch, setCategorySearch] = useState('');

    const [isChainsExpanded, setIsChainsExpanded] = useState(false);
    const [chainSearch, setChainSearch] = useState('');

    const [isFacilitiesExpanded, setIsFacilitiesExpanded] = useState(false);
    const [facilitySearch, setFacilitySearch] = useState('');

    // Sync state when URL searchParams change
    useEffect(() => {
        setSelectedStars(currentStarsStr ? currentStarsStr.split(',').map(Number) : []);
    }, [currentStarsStr]);

    useEffect(() => {
        setSelectedLocations(currentLocationsStr ? currentLocationsStr.split(',').map(decodeURIComponent).filter(Boolean) : []);
    }, [currentLocationsStr]);

    useEffect(() => {
        setSelectedCategories(currentCategoriesStr ? currentCategoriesStr.split(',').map(decodeURIComponent).filter(Boolean) : []);
    }, [currentCategoriesStr]);

    useEffect(() => {
        setSelectedChains(currentChainsStr ? currentChainsStr.split(',').map(decodeURIComponent).filter(Boolean) : []);
    }, [currentChainsStr]);

    useEffect(() => {
        setSelectedGuestRating(searchParams.get('guestRating') || '');
    }, [searchParams.get('guestRating')]);

    useEffect(() => {
        setSelectedFacilities(searchParams.get('facilities') ? searchParams.get('facilities').split(',').map(Number) : []);
    }, [searchParams.get('facilities')]);

    useEffect(() => {
        setSelectedMaxAdult(searchParams.get('roomMaxAdult') ? searchParams.get('roomMaxAdult').split(',').map(Number) : []);
    }, [searchParams.get('roomMaxAdult')]);

    useEffect(() => {
        setSelectedMaxChildren(searchParams.get('roomMaxChildren') ? searchParams.get('roomMaxChildren').split(',').map(Number) : []);
    }, [searchParams.get('roomMaxChildren')]);

    // Direct parameter application for modal/hideHeader mode
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

    // Toggle Handlers
    const handleStarToggle = (val) => {
        const next = selectedStars.includes(val) ? selectedStars.filter(v => v !== val) : [...selectedStars, val];
        setSelectedStars(next);
        if (hideHeader) applyParamDirect('stars', next);
    };

    const handleLocationToggle = (val) => {
        const valStr = String(val);
        const next = selectedLocations.includes(valStr) ? selectedLocations.filter(v => v !== valStr) : [...selectedLocations, valStr];
        setSelectedLocations(next);
        if (hideHeader) applyParamDirect('locations', next);
    };

    const handleCategoryToggle = (val) => {
        const next = selectedCategories.includes(val) ? selectedCategories.filter(v => v !== val) : [...selectedCategories, val];
        setSelectedCategories(next);
        if (hideHeader) applyParamDirect('categories', next);
    };

    const handleChainToggle = (val) => {
        const next = selectedChains.includes(val) ? selectedChains.filter(v => v !== val) : [...selectedChains, val];
        setSelectedChains(next);
        if (hideHeader) applyParamDirect('chains', next);
    };

    const handleGuestRatingToggle = (val) => {
        const next = selectedGuestRating === val ? '' : val;
        setSelectedGuestRating(next);
        if (hideHeader) applyParamDirect('guestRating', next);
    };

    const handleFacilityToggle = (val) => {
        const next = selectedFacilities.includes(val) ? selectedFacilities.filter(v => v !== val) : [...selectedFacilities, val];
        setSelectedFacilities(next);
        if (hideHeader) applyParamDirect('facilities', next);
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

    const handleApplyFilters = () => {
        const newParams = new URLSearchParams(searchParams);

        if (selectedStars.length > 0) newParams.set('stars', selectedStars.join(','));
        else newParams.delete('stars');

        if (selectedLocations.length > 0) newParams.set('locations', selectedLocations.join(','));
        else newParams.delete('locations');

        if (selectedCategories.length > 0) newParams.set('categories', selectedCategories.join(','));
        else newParams.delete('categories');

        if (selectedChains.length > 0) newParams.set('chains', selectedChains.join(','));
        else newParams.delete('chains');

        if (selectedGuestRating) newParams.set('guestRating', selectedGuestRating);
        else newParams.delete('guestRating');

        if (selectedFacilities.length > 0) newParams.set('facilities', selectedFacilities.join(','));
        else newParams.delete('facilities');

        if (selectedMaxAdult.length > 0) newParams.set('roomMaxAdult', selectedMaxAdult.join(','));
        else newParams.delete('roomMaxAdult');

        if (selectedMaxChildren.length > 0) newParams.set('roomMaxChildren', selectedMaxChildren.join(','));
        else newParams.delete('roomMaxChildren');

        // Delete obsolete legacy params if still present in URL
        newParams.delete('freeCancellation');
        newParams.delete('prePayment');
        newParams.delete('roomTwin');
        newParams.delete('roomMaxExtraBed');

        setSearchParams(newParams);
    };

    const handleClearAll = () => {
        setSelectedStars([]);
        setSelectedLocations([]);
        setSelectedCategories([]);
        setSelectedChains([]);
        setSelectedGuestRating('');
        setSelectedFacilities([]);
        setSelectedMaxAdult([]);
        setSelectedMaxChildren([]);

        const newParams = new URLSearchParams(searchParams);
        newParams.delete('stars');
        newParams.delete('locations');
        newParams.delete('categories');
        newParams.delete('chains');
        newParams.delete('guestRating');
        newParams.delete('facilities');
        newParams.delete('roomMaxAdult');
        newParams.delete('roomMaxChildren');
        newParams.delete('freeCancellation');
        newParams.delete('prePayment');
        newParams.delete('roomTwin');
        newParams.delete('roomMaxExtraBed');

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
        selectedCategories.length > 0,
        selectedChains.length > 0,
        Boolean(selectedGuestRating),
        selectedFacilities.length > 0,
        selectedMaxAdult.length > 0,
        selectedMaxChildren.length > 0
    ].filter(Boolean).length;

    // Resolve location items from backend filters (city, regionId, or locationId)
    const locationItems = (filters?.city && filters.city.length > 0)
        ? filters.city
        : ((filters?.regionId && filters.regionId.length > 0)
            ? filters.regionId
            : (filters?.locationId || []));

    // Resolve category items
    const categoryItems = filters?.categoryName || [];

    // Resolve chain items
    const chainItems = filters?.chainName || [];

    // Resolve guest rating items
    const guestRatingItems = filters?.guestRating || [];

    return (
        <aside className="w-full shrink-0 animate-in slide-in-from-left-4 fade-in duration-500">
            <div className="relative">
                {/* Header with Reset and Apply Actions */}
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
                    {/* Sort Options (In Modal Mode) */}
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
                            {locationItems && locationItems.length > 0 ? (
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

                                    {[...locationItems]
                                        .filter(loc => {
                                            const name = loc.label || locationNames[loc.value] || String(loc.value || '');
                                            if (!name || name.startsWith('Location ') || name.startsWith('Location')) return false;
                                            if (locationSearch && !name.toLowerCase().includes(locationSearch.toLowerCase())) return false;
                                            return true;
                                        })
                                        .sort((a, b) => b.count - a.count)
                                        .slice(0, (locationSearch || isLocationsExpanded) ? undefined : 10)
                                        .map(locFilter => {
                                            const locName = locFilter.label || locationNames[locFilter.value] || String(locFilter.value);
                                            const isSelected = selectedLocations.includes(String(locFilter.value));
                                            return (
                                                <label key={locFilter.value} className="flex items-center justify-between cursor-pointer group animate-in fade-in duration-200">
                                                    <div className="flex items-center gap-2.5 overflow-hidden">
                                                        <input
                                                            checked={isSelected}
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
                                    
                                    {!locationSearch && locationItems.length > 10 && (
                                        <button
                                            onClick={() => setIsLocationsExpanded(!isLocationsExpanded)}
                                            className="text-xs font-medium text-[#1a73e8] hover:text-blue-700 flex items-center gap-1 mt-2 transition-colors uppercase tracking-wider pl-8"
                                            lang={currentLang}
                                        >
                                            {isLocationsExpanded ? (
                                                <>{tFilter('showLess', currentLang)} <span className="material-symbols-outlined text-sm">expand_less</span></>
                                            ) : (
                                                <>{tFilter('showMore', currentLang)} ({locationItems.length - 10}) <span className="material-symbols-outlined text-sm">expand_more</span></>
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
                                    <div className="absolute left-0 right-0 h-[4px] bg-[#dadce0] dark:bg-slate-600 rounded-full pointer-events-none" />
                                    <div
                                        className="absolute h-[4px] bg-[#1a73e8] rounded-full pointer-events-none z-10"
                                        style={{
                                            left: `${Math.max(0, Math.min(100, (priceRange[0] / maxHotelPrice) * 100))}%`,
                                            width: `${Math.max(0, Math.max(0, Math.min(100, (priceRange[1] / maxHotelPrice) * 100)) - Math.max(0, Math.min(100, (priceRange[0] / maxHotelPrice) * 100)))}%`
                                        }}
                                    />
                                    <div
                                        className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 w-[18px] h-[18px] bg-[#1a73e8] rounded-full shadow-[0_1px_3px_rgba(0,0,0,0.3)] pointer-events-none z-10"
                                        style={{ left: `${Math.max(0, Math.min(100, (priceRange[0] / maxHotelPrice) * 100))}%` }}
                                    />
                                    <div
                                        className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 w-[18px] h-[18px] bg-[#1a73e8] rounded-full shadow-[0_1px_3px_rgba(0,0,0,0.3)] pointer-events-none z-10"
                                        style={{ left: `${Math.max(0, Math.min(100, (priceRange[1] / maxHotelPrice) * 100))}%` }}
                                    />
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
                        const starBuckets = filters?.hotelStarCategoryId || [];
                        const countMap = {};
                        starBuckets.forEach(b => {
                            countMap[Number(b.value)] = b.count;
                        });

                        const starGrid = (
                            <div className="grid grid-cols-2 border border-[#dadce0] dark:border-slate-700 rounded-lg overflow-hidden">
                                {[5, 4, 3, 2].map((star, index) => {
                                    const isSelected = selectedStars.includes(star);
                                    const count = countMap[star] || 0;
                                    let subtitle = '';
                                    if (star === 5) subtitle = tListing('star5Desc', currentLang);
                                    else if (star === 4) subtitle = tListing('star4Desc', currentLang);
                                    else if (star === 3) subtitle = tListing('star3Desc', currentLang);
                                    else if (star === 2) subtitle = tListing('star2Desc', currentLang);
                                    const isLeftCol = index % 2 === 0;
                                    const isLastRow = index >= 2;

                                    return (
                                        <button
                                            key={star}
                                            type="button"
                                            onClick={() => handleStarToggle(star)}
                                            className={`py-3.5 px-2 text-center flex flex-col items-center justify-center cursor-pointer transition-colors select-none
                                                ${isLeftCol ? 'border-r border-[#dadce0] dark:border-slate-700' : ''}
                                                ${!isLastRow ? 'border-b border-[#dadce0] dark:border-slate-700' : ''}
                                                ${isSelected
                                                    ? 'bg-[#e8f0fe] dark:bg-blue-900/30'
                                                    : 'bg-white dark:bg-[#303134] hover:bg-[#f8f9fa] dark:hover:bg-slate-700/50'
                                                }`}
                                        >
                                            <div className="flex items-center gap-1">
                                                <span className={`text-[14px] font-semibold font-roboto ${isSelected ? 'text-[#1a73e8] dark:text-blue-300' : 'text-[#202124] dark:text-slate-100'}`}>
                                                    {star} {tListing('starSingle', currentLang)}
                                                </span>
                                                {count > 0 && (
                                                    <span className="text-[11px] text-slate-400 dark:text-slate-500 font-normal">
                                                        ({count})
                                                    </span>
                                                )}
                                            </div>
                                            {subtitle && (
                                                <span className={`text-[11px] mt-0.5 font-roboto leading-snug ${isSelected ? 'text-[#1a73e8] dark:text-blue-300' : 'text-[#5f6368] dark:text-slate-400'}`}>
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

                    {/* Accommodation Type / Konaklama Türü */}
                    {categoryItems.length > 0 && (
                        <FilterSection title={tFilter('propertyType', currentLang)} icon="apartment">
                            <div className="space-y-2.5">
                                {categoryItems.length > 6 && (
                                    <div className="relative mb-3 group/search">
                                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/search:text-primary text-sm transition-colors">search</span>
                                        <input 
                                            type="text" 
                                            placeholder={tFilter('searchPropertyTypes', currentLang)} 
                                            value={categorySearch}
                                            onChange={(e) => setCategorySearch(e.target.value)}
                                            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 focus:border-primary/50 focus:ring-4 focus:ring-primary/5 rounded-xl text-xs font-medium placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all"
                                        />
                                        {categorySearch && (
                                            <button 
                                                onClick={() => setCategorySearch('')}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary transition-colors"
                                            >
                                                <span className="material-symbols-outlined text-sm">close</span>
                                            </button>
                                        )}
                                    </div>
                                )}

                                {[...categoryItems]
                                    .filter(cat => {
                                        const label = cat.label || cat.value;
                                        if (categorySearch && !label.toLowerCase().includes(categorySearch.toLowerCase())) return false;
                                        return true;
                                    })
                                    .sort((a, b) => b.count - a.count)
                                    .slice(0, (categorySearch || isCategoriesExpanded) ? undefined : 6)
                                    .map(cat => {
                                        const isSelected = selectedCategories.includes(cat.value);
                                        return (
                                            <label key={cat.value} className="flex items-center justify-between cursor-pointer group animate-in fade-in duration-200">
                                                <div className="flex items-center gap-2.5 overflow-hidden">
                                                    <input
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        onChange={() => handleCategoryToggle(cat.value)}
                                                        className="h-4 w-4 rounded border-slate-300 dark:border-[#324d67] bg-transparent text-[#1a73e8] focus:ring-[#1a73e8] focus:ring-offset-0 flex-shrink-0"
                                                    />
                                                    <span className="text-[14px] text-[#3c4043] dark:text-slate-300 truncate" title={cat.label || cat.value}>
                                                        {cat.label || cat.value}
                                                    </span>
                                                </div>
                                                <span className="text-[12px] text-slate-400 dark:text-slate-500 font-normal whitespace-nowrap ml-2">
                                                    ({cat.count})
                                                </span>
                                            </label>
                                        );
                                    })}

                                {!categorySearch && categoryItems.length > 6 && (
                                    <button
                                        onClick={() => setIsCategoriesExpanded(!isCategoriesExpanded)}
                                        className="text-xs font-medium text-[#1a73e8] hover:text-blue-700 flex items-center gap-1 mt-2 transition-colors uppercase tracking-wider pl-8"
                                        lang={currentLang}
                                    >
                                        {isCategoriesExpanded ? (
                                            <>{tFilter('showLess', currentLang)} <span className="material-symbols-outlined text-sm">expand_less</span></>
                                        ) : (
                                            <>{tFilter('showMore', currentLang)} ({categoryItems.length - 6}) <span className="material-symbols-outlined text-sm">expand_more</span></>
                                        )}
                                    </button>
                                )}
                            </div>
                        </FilterSection>
                    )}

                    {/* Guest Rating / Konuk Puanı */}
                    {guestRatingItems.length > 0 && (
                        <FilterSection title={tFilter('guestRating', currentLang)} icon="grade">
                            <div className="space-y-2">
                                {guestRatingItems.map(ratingItem => {
                                    const isSelected = selectedGuestRating === ratingItem.value;
                                    return (
                                        <button
                                            key={ratingItem.value}
                                            type="button"
                                            onClick={() => handleGuestRatingToggle(ratingItem.value)}
                                            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border text-left transition-all ${
                                                isSelected
                                                    ? 'bg-[#e8f0fe] dark:bg-blue-900/30 border-[#1a73e8] text-[#1a73e8] dark:text-blue-300 font-medium'
                                                    : 'bg-white dark:bg-[#303134] border-[#dadce0] dark:border-slate-700 text-[#3c4043] dark:text-slate-200 hover:bg-[#f8f9fa] dark:hover:bg-slate-700/50'
                                            }`}
                                        >
                                            <div className="flex items-center gap-2">
                                                <span className="material-symbols-outlined text-[18px] text-amber-500">
                                                    star
                                                </span>
                                                <span className="text-[13.5px]">
                                                    {ratingItem.label || ratingItem.value}
                                                </span>
                                            </div>
                                            <span className="text-[12px] text-slate-400 dark:text-slate-500 font-normal">
                                                ({ratingItem.count})
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </FilterSection>
                    )}

                    {/* Hotel Chains & Brands / Otel Zincirleri */}
                    {chainItems.length > 0 && (
                        <FilterSection title={tFilter('hotelChains', currentLang)} icon="domain">
                            <div className="space-y-2.5">
                                {chainItems.length > 5 && (
                                    <div className="relative mb-3 group/search">
                                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/search:text-primary text-sm transition-colors">search</span>
                                        <input 
                                            type="text" 
                                            placeholder={tFilter('searchChains', currentLang)} 
                                            value={chainSearch}
                                            onChange={(e) => setChainSearch(e.target.value)}
                                            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 focus:border-primary/50 focus:ring-4 focus:ring-primary/5 rounded-xl text-xs font-medium placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all"
                                        />
                                        {chainSearch && (
                                            <button 
                                                onClick={() => setChainSearch('')}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary transition-colors"
                                            >
                                                <span className="material-symbols-outlined text-sm">close</span>
                                            </button>
                                        )}
                                    </div>
                                )}

                                {[...chainItems]
                                    .filter(ch => {
                                        const label = ch.label || ch.value;
                                        if (chainSearch && !label.toLowerCase().includes(chainSearch.toLowerCase())) return false;
                                        return true;
                                    })
                                    .sort((a, b) => b.count - a.count)
                                    .slice(0, (chainSearch || isChainsExpanded) ? undefined : 6)
                                    .map(ch => {
                                        const isSelected = selectedChains.includes(ch.value);
                                        return (
                                            <label key={ch.value} className="flex items-center justify-between cursor-pointer group animate-in fade-in duration-200">
                                                <div className="flex items-center gap-2.5 overflow-hidden">
                                                    <input
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        onChange={() => handleChainToggle(ch.value)}
                                                        className="h-4 w-4 rounded border-slate-300 dark:border-[#324d67] bg-transparent text-[#1a73e8] focus:ring-[#1a73e8] focus:ring-offset-0 flex-shrink-0"
                                                    />
                                                    <span className="text-[14px] text-[#3c4043] dark:text-slate-300 truncate" title={ch.label || ch.value}>
                                                        {ch.label || ch.value}
                                                    </span>
                                                </div>
                                                <span className="text-[12px] text-slate-400 dark:text-slate-500 font-normal whitespace-nowrap ml-2">
                                                    ({ch.count})
                                                </span>
                                            </label>
                                        );
                                    })}

                                {!chainSearch && chainItems.length > 6 && (
                                    <button
                                        onClick={() => setIsChainsExpanded(!isChainsExpanded)}
                                        className="text-xs font-medium text-[#1a73e8] hover:text-blue-700 flex items-center gap-1 mt-2 transition-colors uppercase tracking-wider pl-8"
                                        lang={currentLang}
                                    >
                                        {isChainsExpanded ? (
                                            <>{tFilter('showLess', currentLang)} <span className="material-symbols-outlined text-sm">expand_less</span></>
                                        ) : (
                                            <>{tFilter('showMore', currentLang)} ({chainItems.length - 6}) <span className="material-symbols-outlined text-sm">expand_more</span></>
                                        )}
                                    </button>
                                )}
                            </div>
                        </FilterSection>
                    )}

                    {/* Hotel Facilities / Amenities */}
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

                                    <div className="grid grid-cols-2 gap-2.5">
                                        {[...filters.hotelFacilityIds]
                                            .filter(fac => {
                                                const name = fac.label || facilityNames[fac.value] || ('Facility ' + fac.value);
                                                if (!name) return false;
                                                if (facilitySearch && !name.toLowerCase().includes(facilitySearch.toLowerCase())) return false;
                                                return true;
                                            })
                                            .sort((a, b) => b.count - a.count)
                                            .slice(0, (facilitySearch || isFacilitiesExpanded) ? undefined : 10)
                                            .map(facFilter => {
                                                const facName = facFilter.label || facilityNames[facFilter.value] || ('Facility ' + facFilter.value);
                                                const isSelected = selectedFacilities.includes(facFilter.value);
                                                return (
                                                    <div 
                                                        key={facFilter.value}
                                                        onClick={() => handleFacilityToggle(facFilter.value)}
                                                        className={`flex flex-col items-center justify-center p-2.5 rounded-lg border cursor-pointer transition-colors text-center min-h-[75px] ${isSelected ? 'bg-[#e8f0fe] dark:bg-blue-900/20 border-[#1a73e8] dark:border-blue-500' : 'bg-white dark:bg-[#303134] border-[#dadce0] dark:border-slate-600 hover:bg-[#f8f9fa] dark:hover:bg-slate-700'}`}
                                                    >
                                                        <span className={`material-symbols-outlined text-[22px] mb-1 ${isSelected ? 'text-[#1a73e8] dark:text-blue-300' : 'text-[#5f6368] dark:text-slate-400'}`}>
                                                            {getAmenityIcon(facName)}
                                                        </span>
                                                        <span className={`text-[12px] font-medium leading-tight line-clamp-2 ${isSelected ? 'text-[#1a73e8] dark:text-blue-300' : 'text-[#3c4043] dark:text-slate-200'}`}>
                                                            {facName}
                                                        </span>
                                                        <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                                                            ({facFilter.count})
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

                    {/* Room Capacity Filters */}
                    {filters?.roomMaxAdult?.length > 0 && (
                        <FilterSection title={tFilter('maxAdult', currentLang)} icon="person" defaultOpen={false}>
                            <div className="space-y-2.5">
                                {[...filters.roomMaxAdult]
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
                                    ))}
                            </div>
                        </FilterSection>
                    )}

                    {filters?.roomMaxChildren?.length > 0 && (
                        <FilterSection title={tFilter('maxChildren', currentLang)} icon="child_care" defaultOpen={false}>
                            <div className="space-y-2.5">
                                {[...filters.roomMaxChildren]
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
                                    ))}
                            </div>
                        </FilterSection>
                    )}
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
