import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

const FilterSection = ({ title, icon, defaultOpen = true, disabled = false, children }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    // Keep it synced if the requirement changes externally
    useEffect(() => {
        setIsOpen(defaultOpen);
    }, [defaultOpen]);

    return (
        <div className={`border-b border-slate-100 dark:border-slate-800/50 py-4 last:border-0 ${disabled ? 'opacity-50' : ''}`}>
            <button
                onClick={() => !disabled && setIsOpen(!isOpen)}
                className={`w-full flex items-center justify-between group ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
            >
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2 group-hover:text-primary transition-colors">
                    {icon && <span className="material-symbols-outlined text-slate-400 group-hover:text-primary transition-colors text-[20px]">{icon}</span>}
                    {title}
                    {disabled && (
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded ml-1">Soon</span>
                    )}
                </h3>
                {!disabled && (
                    <span className="material-symbols-outlined text-slate-400 group-hover:text-primary transition-transform duration-300" style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0)' }}>
                        expand_more
                    </span>
                )}
            </button>
            {/* The wrapper handles height animation gracefully */}
            <div
                className={`transition-all duration-300 ease-in-out overflow-hidden pointer-events-none`}
                style={{ maxHeight: isOpen && !disabled ? '1000px' : '0px', opacity: isOpen && !disabled ? 1 : 0, marginTop: isOpen && !disabled ? '16px' : '0px' }}
            >
                {children}
            </div>
        </div>
    );
};

const Sidebar = ({ filters }) => {
    const [searchParams, setSearchParams] = useSearchParams();

    // Parse current URL stars
    const currentStarsStr = searchParams.get('stars');
    const urlStars = currentStarsStr ? currentStarsStr.split(',').map(Number) : [];

    // Maintain local state for checkboxes before Apply
    const [selectedStars, setSelectedStars] = useState(urlStars);

    // Free Cancellation filter: null = no filter, true = yes, false = no
    const parseBool = (val) => val === 'true' ? true : val === 'false' ? false : null;
    const [freeCancellation, setFreeCancellation] = useState(parseBool(searchParams.get('freeCancellation')));

    // Pre-Payment filter: null = no filter, true = yes, false = no
    const [prePayment, setPrePayment] = useState(parseBool(searchParams.get('prePayment')));

    useEffect(() => {
        setSelectedStars(currentStarsStr ? currentStarsStr.split(',').map(Number) : []);
    }, [currentStarsStr]);

    useEffect(() => {
        setFreeCancellation(parseBool(searchParams.get('freeCancellation')));
    }, [searchParams.get('freeCancellation')]);

    useEffect(() => {
        setPrePayment(parseBool(searchParams.get('prePayment')));
    }, [searchParams.get('prePayment')]);

    // Toggle 3-state boolean: clicking same value again → deselect (null)
    const handleBoolToggle = (setter, current, clickedValue) => {
        setter(current === clickedValue ? null : clickedValue);
    };

    const handleStarToggle = (val) => {
        setSelectedStars(prev =>
            prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]
        );
    };

    const handleApplyFilters = () => {
        const newParams = new URLSearchParams(searchParams);
        if (selectedStars.length > 0) {
            newParams.set('stars', selectedStars.join(','));
        } else {
            newParams.delete('stars');
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
        setSearchParams(newParams);
    };

    const handleClearAll = () => {
        setSelectedStars([]);
        setFreeCancellation(null);
        setPrePayment(null);
        const newParams = new URLSearchParams(searchParams);
        newParams.delete('stars');
        newParams.delete('freeCancellation');
        newParams.delete('prePayment');
        setSearchParams(newParams);
    };

    return (
        <aside className="w-full lg:w-72 flex-shrink-0">
            <div className="sticky top-24 bg-white dark:bg-[#111a22] rounded-xl p-6 border border-slate-200 dark:border-[#233648] shadow-sm max-h-[calc(100vh-8rem)] overflow-y-auto custom-scrollbar">
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100 dark:border-slate-800/50">
                    <h2 className="text-lg font-bold">Filters</h2>
                    <button
                        onClick={handleClearAll}
                        className="text-primary text-xs font-bold uppercase tracking-wider hover:underline"
                    >
                        Clear All
                    </button>
                </div>
                {/* Price Range Slider - disabled until backend support is ready */}
                <FilterSection title="Price per night" icon="payments" disabled>
                    <div className="px-2 pt-2">
                        <div className="relative h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full mb-6 mt-2">
                            <div className="absolute left-1/4 right-1/4 h-full bg-primary rounded-full"></div>
                            <div className="absolute left-1/4 -top-1.5 size-4 bg-primary border-2 border-white dark:border-[#111a22] rounded-full shadow-sm cursor-pointer hover:scale-110 transition-transform"></div>
                            <div className="absolute right-1/4 -top-1.5 size-4 bg-primary border-2 border-white dark:border-[#111a22] rounded-full shadow-sm cursor-pointer hover:scale-110 transition-transform"></div>
                        </div>
                        <div className="flex justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
                            <span>$120</span>
                            <span>$850+</span>
                        </div>
                    </div>
                </FilterSection>
                {/* Star Rating Checklist */}
                <FilterSection title="Star Rating" icon="star">
                    <div className="space-y-3">
                        {filters?.hotelStarCategoryId ? (
                            [...filters.hotelStarCategoryId]
                                .sort((a, b) => b.value - a.value)
                                .map(starFilter => (
                                    <label key={starFilter.value} className="flex items-center justify-between cursor-pointer group">
                                        <div className="flex items-center gap-3">
                                            <input
                                                checked={selectedStars.includes(starFilter.value)}
                                                onChange={() => handleStarToggle(starFilter.value)}
                                                className="h-5 w-5 rounded border-slate-300 dark:border-[#324d67] bg-transparent text-primary focus:ring-primary focus:ring-offset-0 checkbox-tick"
                                                type="checkbox"
                                            />
                                            <div className="flex items-center gap-1">
                                                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                                    {starFilter.value === 0 ? 'Unrated' : `${starFilter.value} Stars`}
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
                                        <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                                            ({starFilter.count})
                                        </span>
                                    </label>
                                ))
                        ) : (
                            [5, 4, 3, 2].map(star => (
                                <label key={star} className="flex items-center gap-3 cursor-pointer group">
                                    <input
                                        checked={selectedStars.includes(star)}
                                        onChange={() => handleStarToggle(star)}
                                        className="h-5 w-5 rounded border-slate-300 dark:border-[#324d67] bg-transparent text-primary focus:ring-primary focus:ring-offset-0 checkbox-tick"
                                        type="checkbox"
                                    />
                                    <div className="flex items-center gap-1">
                                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{star} Stars</span>
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
                <FilterSection title="Free Cancellation" icon="event_available">
                    <div className="space-y-3">
                        {(filters?.hasFreeCancellation ?? [
                            { value: true, count: null },
                            { value: false, count: null }
                        ]).sort((a, b) => (b.value === true ? 1 : -1)).map(f => (
                            <label key={String(f.value)} className="flex items-center justify-between cursor-pointer group">
                                <div className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        checked={freeCancellation === f.value}
                                        onChange={() => handleBoolToggle(setFreeCancellation, freeCancellation, f.value)}
                                        className="h-5 w-5 rounded border-slate-300 dark:border-[#324d67] bg-transparent text-primary focus:ring-primary focus:ring-offset-0 checkbox-tick"
                                    />
                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                        {f.value ? 'Yes – Free Cancellation' : 'No – Non-refundable'}
                                    </span>
                                </div>
                                {f.count !== null && (
                                    <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">({f.count})</span>
                                )}
                            </label>
                        ))}
                    </div>
                </FilterSection>
                {/* Pre-Payment */}
                <FilterSection title="Pre-Payment Required" icon="credit_card">
                    <div className="space-y-3">
                        {(filters?.hasPrePayment ?? [
                            { value: true, count: null },
                            { value: false, count: null }
                        ]).sort((a, b) => (b.value === true ? 1 : -1)).map(f => (
                            <label key={String(f.value)} className="flex items-center justify-between cursor-pointer group">
                                <div className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        checked={prePayment === f.value}
                                        onChange={() => handleBoolToggle(setPrePayment, prePayment, f.value)}
                                        className="h-5 w-5 rounded border-slate-300 dark:border-[#324d67] bg-transparent text-primary focus:ring-primary focus:ring-offset-0 checkbox-tick"
                                    />
                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                        {f.value ? 'Yes – Pre-Payment Required' : 'No – Pay Later'}
                                    </span>
                                </div>
                                {f.count !== null && (
                                    <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">({f.count})</span>
                                )}
                            </label>
                        ))}
                    </div>
                </FilterSection>
                {/* Amenities */}
                <FilterSection title="Popular Amenities" icon="pool">
                    <div className="space-y-3 pt-1">
                        <label className="flex items-center justify-between cursor-pointer group">
                            <div className="flex items-center gap-3">
                                <input className="h-5 w-5 rounded border-slate-300 dark:border-[#324d67] bg-transparent text-primary focus:ring-primary focus:ring-offset-0 checkbox-tick" type="checkbox" />
                                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Free WiFi</span>
                            </div>
                        </label>
                        <label className="flex items-center justify-between cursor-pointer group">
                            <div className="flex items-center gap-3">
                                <input className="h-5 w-5 rounded border-slate-300 dark:border-[#324d67] bg-transparent text-primary focus:ring-primary focus:ring-offset-0 checkbox-tick" type="checkbox" />
                                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Swimming Pool</span>
                            </div>
                        </label>
                        <label className="flex items-center justify-between cursor-pointer group">
                            <div className="flex items-center gap-3">
                                <input className="h-5 w-5 rounded border-slate-300 dark:border-[#324d67] bg-transparent text-primary focus:ring-primary focus:ring-offset-0 checkbox-tick" type="checkbox" />
                                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Spa & Wellness</span>
                            </div>
                        </label>
                        <label className="flex items-center justify-between cursor-pointer group">
                            <div className="flex items-center gap-3">
                                <input className="h-5 w-5 rounded border-slate-300 dark:border-[#324d67] bg-transparent text-primary focus:ring-primary focus:ring-offset-0 checkbox-tick" type="checkbox" />
                                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Breakfast Included</span>
                            </div>
                        </label>
                    </div>
                </FilterSection>
                {/* Guest Rating */}
                <FilterSection title="Guest Rating" icon="thumb_up">
                    <div className="space-y-3 pt-1">
                        <label className="flex items-center justify-between cursor-pointer">
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Superb 9+</span>
                            <input className="text-primary border-slate-300 dark:border-slate-600 focus:ring-primary bg-transparent" name="rating" type="radio" />
                        </label>
                        <label className="flex items-center justify-between cursor-pointer">
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Very Good 8+</span>
                            <input className="text-primary border-slate-300 dark:border-slate-600 focus:ring-primary bg-transparent" name="rating" type="radio" />
                        </label>
                        <label className="flex items-center justify-between cursor-pointer">
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Good 7+</span>
                            <input className="text-primary border-slate-300 dark:border-slate-600 focus:ring-primary bg-transparent" name="rating" type="radio" />
                        </label>
                    </div>
                </FilterSection>
                <button
                    onClick={handleApplyFilters}
                    className="w-full bg-primary/10 hover:bg-primary/20 text-primary font-bold py-3 mt-4 rounded-xl transition-all border border-primary/20"
                >
                    Apply Filters
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
