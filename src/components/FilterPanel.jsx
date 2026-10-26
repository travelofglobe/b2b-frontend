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

    // 1. Star Rating
    const currentStarsStr = searchParams.get('stars');
    const urlStars = currentStarsStr ? currentStarsStr.split(',').map(Number) : [];
    const [selectedStars, setSelectedStars] = useState(urlStars);

    // 2. Locations
    const currentLocationsStr = searchParams.get('locations');
    const urlLocations = currentLocationsStr ? currentLocationsStr.split(',').map(decodeURIComponent).filter(Boolean) : [];
    const [selectedLocations, setSelectedLocations] = useState(urlLocations);

    // 3. Property Type
    const currentCategoriesStr = searchParams.get('categories');
    const urlCategories = currentCategoriesStr ? currentCategoriesStr.split(',').map(decodeURIComponent).filter(Boolean) : [];
    const [selectedCategories, setSelectedCategories] = useState(urlCategories);

    // 4. Hotel Chains
    const currentChainsStr = searchParams.get('chains');
    const urlChains = currentChainsStr ? currentChainsStr.split(',').map(decodeURIComponent).filter(Boolean) : [];
    const [selectedChains, setSelectedChains] = useState(urlChains);

    // 5. Guest Rating
    const currentGuestRating = searchParams.get('guestRating') || '';
    const [selectedGuestRating, setSelectedGuestRating] = useState(currentGuestRating);

    // 6. Facilities
    const currentFacilitiesStr = searchParams.get('facilities');
    const [selectedFacilities, setSelectedFacilities] = useState(currentFacilitiesStr ? currentFacilitiesStr.split(',').map(Number) : []);

    // 7. Capacities
    const [selectedMaxAdult, setSelectedMaxAdult] = useState(searchParams.get('roomMaxAdult') ? searchParams.get('roomMaxAdult').split(',').map(Number) : []);
    const [selectedMaxChildren, setSelectedMaxChildren] = useState(searchParams.get('roomMaxChildren') ? searchParams.get('roomMaxChildren').split(',').map(Number) : []);

    // Search and Expand states
    const [isLocationsExpanded, setIsLocationsExpanded] = useState(false);
    const [locationSearch, setLocationSearch] = useState('');

    const [isCategoriesExpanded, setIsCategoriesExpanded] = useState(false);
    const [categorySearch, setCategorySearch] = useState('');

    const [isChainsExpanded, setIsChainsExpanded] = useState(false);
    const [chainSearch, setChainSearch] = useState('');

    const [isFacilitiesExpanded, setIsFacilitiesExpanded] = useState(false);
    const [facilitySearch, setFacilitySearch] = useState('');

    // Sync local state when searchParams change externally
    useEffect(() => {
        setSelectedStars(searchParams.get('stars') ? searchParams.get('stars').split(',').map(Number) : []);
    }, [searchParams.get('stars')]);

    useEffect(() => {
        setSelectedLocations(searchParams.get('locations') ? searchParams.get('locations').split(',').map(decodeURIComponent).filter(Boolean) : []);
    }, [searchParams.get('locations')]);

    useEffect(() => {
        setSelectedCategories(searchParams.get('categories') ? searchParams.get('categories').split(',').map(decodeURIComponent).filter(Boolean) : []);
    }, [searchParams.get('categories')]);

    useEffect(() => {
        setSelectedChains(searchParams.get('chains') ? searchParams.get('chains').split(',').map(decodeURIComponent).filter(Boolean) : []);
    }, [searchParams.get('chains')]);

    useEffect(() => {
        setSelectedGuestRating(searchParams.get('guestRating') || '');
    }, [searchParams.get('guestRating')]);

    useEffect(() => {
        setSelectedFacilities(searchParams.get('facilities') ? searchParams.get('facilities').split(',').map(Number) : []);
    }, [searchParams.get('facilities')]);

    useEffect(() => {
        setSelectedMaxAdult(searchParams.get('roomMaxAdult') ? searchParams.get('roomMaxAdult').split(',').map(Number) : []);
        setSelectedMaxChildren(searchParams.get('roomMaxChildren') ? searchParams.get('roomMaxChildren').split(',').map(Number) : []);
    }, [searchParams.get('roomMaxAdult'), searchParams.get('roomMaxChildren')]);

    // Handlers
    const handleToggle = (setter, val) => {
        setter(prev => prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]);
    };

    const handleApply = () => {
        const newParams = new URLSearchParams(searchParams);
        
        const setOrDelete = (key, value) => {
            if (value && (Array.isArray(value) ? value.length > 0 : String(value).length > 0)) {
                newParams.set(key, Array.isArray(value) ? value.join(',') : String(value));
            } else {
                newParams.delete(key);
            }
        };

        setOrDelete('stars', selectedStars);
        setOrDelete('locations', selectedLocations);
        setOrDelete('categories', selectedCategories);
        setOrDelete('chains', selectedChains);
        setOrDelete('guestRating', selectedGuestRating);
        setOrDelete('facilities', selectedFacilities);
        setOrDelete('roomMaxAdult', selectedMaxAdult);
        setOrDelete('roomMaxChildren', selectedMaxChildren);

        newParams.delete('freeCancellation');
        newParams.delete('prePayment');
        newParams.delete('roomTwin');
        newParams.delete('roomMaxExtraBed');

        setSearchParams(newParams);
        if (onApply) onApply();
    };

    const handleClear = () => {
        setSelectedStars([]);
        setSelectedLocations([]);
        setSelectedCategories([]);
        setSelectedChains([]);
        setSelectedGuestRating('');
        setSelectedFacilities([]);
        setSelectedMaxAdult([]);
        setSelectedMaxChildren([]);

        const newParams = new URLSearchParams(searchParams);
        ['stars', 'locations', 'categories', 'chains', 'guestRating', 'facilities', 'roomMaxAdult', 'roomMaxChildren', 'freeCancellation', 'prePayment', 'roomTwin', 'roomMaxExtraBed'].forEach(k => newParams.delete(k));
        
        setSearchParams(newParams);
        if (onClearAll) onClearAll();
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

    const locationItems = (filters?.city && filters.city.length > 0)
        ? filters.city
        : ((filters?.regionId && filters.regionId.length > 0)
            ? filters.regionId
            : (filters?.locationId || []));

    const categoryItems = filters?.categoryName || [];
    const chainItems = filters?.chainName || [];
    const guestRatingItems = filters?.guestRating || [];

    return (
        <div className="flex flex-col h-full overflow-hidden">
            {/* Header with Actions */}
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
                {/* Locations */}
                <FilterSection title={tFilter('locations', currentLang)} icon="location_on">
                    <div className="space-y-2">
                        {locationItems && locationItems.length > 0 ? (
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
                                        return (
                                            <label key={locFilter.value} className="flex items-center justify-between cursor-pointer group animate-in fade-in duration-200 py-0.5">
                                                <div className="flex items-center gap-2 overflow-hidden">
                                                    <input
                                                        checked={selectedLocations.includes(String(locFilter.value))}
                                                        onChange={() => handleToggle(setSelectedLocations, String(locFilter.value))}
                                                        className="h-3.5 w-3.5 rounded border-slate-300 dark:border-[#324d67] bg-transparent text-primary focus:ring-primary focus:ring-offset-0 checkbox-tick flex-shrink-0"
                                                        type="checkbox"
                                                    />
                                                    <div className="flex items-center gap-1.5 overflow-hidden">
                                                        <span className="material-symbols-outlined text-sm text-slate-400 group-hover:text-primary transition-colors flex-shrink-0">location_on</span>
                                                        <span className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate" title={locName}>
                                                            {locName}
                                                        </span>
                                                    </div>
                                                </div>
                                                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium whitespace-nowrap ml-1.5">({locFilter.count})</span>
                                            </label>
                                        );
                                    })}
                                
                                {!locationSearch && locationItems.length > 10 && (
                                    <button 
                                        onClick={() => setIsLocationsExpanded(!isLocationsExpanded)} 
                                        className="text-xs font-bold text-primary hover:text-primary-hover flex items-center gap-1 mt-2 transition-colors uppercase tracking-wider pl-8"
                                        lang={currentLang}
                                    >
                                        {isLocationsExpanded ? (
                                            <>{tFilter('showLess', currentLang)} <span className="material-symbols-outlined text-sm">expand_less</span></>
                                        ) : (
                                            <>{tFilter('showMore', currentLang)} ({locationItems.length - 10} {tFilter('showMore', currentLang).toLowerCase().includes('more') ? 'more' : ''}) <span className="material-symbols-outlined text-sm">expand_more</span></>
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
                        {[5, 4, 3, 2].map(star => {
                            const match = (filters?.hotelStarCategoryId || []).find(b => Number(b.value) === star);
                            const count = match ? match.count : 0;
                            return (
                                <label key={star} className="flex items-center justify-between cursor-pointer group py-0.5">
                                    <div className="flex items-center gap-2">
                                        <input
                                            checked={selectedStars.includes(star)}
                                            onChange={() => handleToggle(setSelectedStars, star)}
                                            className="h-3.5 w-3.5 rounded border-slate-300 dark:border-[#324d67] bg-transparent text-primary focus:ring-primary focus:ring-offset-0 checkbox-tick"
                                            type="checkbox"
                                        />
                                        <div className="flex items-center gap-1">
                                            <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                                                {star}*
                                            </span>
                                            <div className="flex text-amber-400">
                                                <span className="material-symbols-outlined text-[9px] fill-1">star</span>
                                            </div>
                                        </div>
                                    </div>
                                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">({count})</span>
                                </label>
                            );
                        })}
                    </div>
                </FilterSection>

                {/* Property Type */}
                {categoryItems.length > 0 && (
                    <FilterSection title={tFilter('propertyType', currentLang)} icon="apartment">
                        <div className="space-y-1.5">
                            {categoryItems.map(cat => (
                                <label key={cat.value} className="flex items-center justify-between cursor-pointer group py-0.5">
                                    <div className="flex items-center gap-2 overflow-hidden">
                                        <input
                                            type="checkbox"
                                            checked={selectedCategories.includes(cat.value)}
                                            onChange={() => handleToggle(setSelectedCategories, cat.value)}
                                            className="h-3.5 w-3.5 rounded border-slate-300 dark:border-[#324d67] bg-transparent text-primary focus:ring-primary focus:ring-offset-0 checkbox-tick"
                                        />
                                        <span className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate">
                                            {cat.label || cat.value}
                                        </span>
                                    </div>
                                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">({cat.count})</span>
                                </label>
                            ))}
                        </div>
                    </FilterSection>
                )}

                {/* Guest Rating */}
                {guestRatingItems.length > 0 && (
                    <FilterSection title={tFilter('guestRating', currentLang)} icon="grade">
                        <div className="space-y-1.5">
                            {guestRatingItems.map(item => {
                                const isSelected = selectedGuestRating === item.value;
                                return (
                                    <button
                                        key={item.value}
                                        type="button"
                                        onClick={() => setSelectedGuestRating(isSelected ? '' : item.value)}
                                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md border text-left text-xs transition-colors ${
                                            isSelected
                                                ? 'bg-primary/10 border-primary text-primary font-medium'
                                                : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                                        }`}
                                    >
                                        <span>{item.label || item.value}</span>
                                        <span className="text-[10px] text-slate-400">({item.count})</span>
                                    </button>
                                );
                            })}
                        </div>
                    </FilterSection>
                )}

                {/* Hotel Chains */}
                {chainItems.length > 0 && (
                    <FilterSection title={tFilter('hotelChains', currentLang)} icon="domain">
                        <div className="space-y-1.5">
                            {chainItems.slice(0, (chainSearch || isChainsExpanded) ? undefined : 6).map(ch => (
                                <label key={ch.value} className="flex items-center justify-between cursor-pointer group py-0.5">
                                    <div className="flex items-center gap-2 overflow-hidden">
                                        <input
                                            type="checkbox"
                                            checked={selectedChains.includes(ch.value)}
                                            onChange={() => handleToggle(setSelectedChains, ch.value)}
                                            className="h-3.5 w-3.5 rounded border-slate-300 dark:border-[#324d67] bg-transparent text-primary focus:ring-primary focus:ring-offset-0 checkbox-tick"
                                        />
                                        <span className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate">
                                            {ch.label || ch.value}
                                        </span>
                                    </div>
                                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">({ch.count})</span>
                                </label>
                            ))}
                        </div>
                    </FilterSection>
                )}

                {/* Capacities */}
                {filters?.roomMaxAdult?.length > 0 && (
                    <FilterSection title={tFilter('maxAdult', currentLang)} icon="person" defaultOpen={false}>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                            {filters.roomMaxAdult.slice().sort((a, b) => a.value - b.value).map(f => (
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
                )}

                {filters?.roomMaxChildren?.length > 0 && (
                    <FilterSection title={tFilter('maxChildren', currentLang)} icon="child_care" defaultOpen={false}>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                            {filters.roomMaxChildren.slice().sort((a, b) => a.value - b.value).map(f => (
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
                )}

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
                                        const name = fac.label || facilityNames[fac.value] || ('Facility ' + fac.value);
                                        if (!name) return false;
                                        if (facilitySearch && !name.toLowerCase().includes(facilitySearch.toLowerCase())) return false;
                                        return true;
                                    })
                                    .sort((a, b) => b.count - a.count)
                                    .slice(0, (facilitySearch || isFacilitiesExpanded) ? undefined : 10)
                                    .map(facFilter => {
                                        const name = facFilter.label || facilityNames[facFilter.value] || ('Facility ' + facFilter.value);
                                        return (
                                            <label key={facFilter.value} className="flex items-center justify-between cursor-pointer group animate-in fade-in duration-200 py-0.5">
                                                <div className="flex items-center gap-2 overflow-hidden">
                                                    <input checked={selectedFacilities.includes(facFilter.value)} onChange={() => handleToggle(setSelectedFacilities, facFilter.value)} className="h-3.5 w-3.5 rounded border-slate-300 dark:border-[#324d67] bg-transparent text-primary focus:ring-primary focus:ring-offset-0 checkbox-tick flex-shrink-0" type="checkbox" />
                                                    <div className="flex items-center gap-1.5 overflow-hidden">
                                                        <span className="material-symbols-outlined text-sm text-slate-400 group-hover:text-primary flex-shrink-0">business_center</span>
                                                        <span className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate" title={name}>{name}</span>
                                                    </div>
                                                </div>
                                                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium whitespace-nowrap ml-1.5">({facFilter.count})</span>
                                            </label>
                                        );
                                    })}
                                
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
