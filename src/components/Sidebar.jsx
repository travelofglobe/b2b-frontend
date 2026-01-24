import React from 'react';

const Sidebar = () => {
    return (
        <aside className="w-full lg:w-72 flex-shrink-0">
            <div className="sticky top-24 bg-white dark:bg-[#111a22] rounded-xl p-6 border border-slate-200 dark:border-[#233648] shadow-sm">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-bold">Filters</h2>
                    <button className="text-primary text-xs font-bold uppercase tracking-wider hover:underline">Clear All</button>
                </div>
                {/* Price Range Slider */}
                <div className="mb-8">
                    <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary text-lg">payments</span>
                        Price per night
                    </h3>
                    <div className="px-2">
                        <div className="relative h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full mb-6">
                            <div className="absolute left-1/4 right-1/4 h-full bg-primary rounded-full"></div>
                            <div className="absolute left-1/4 -top-1.5 size-4 bg-primary border-2 border-white dark:border-background-dark rounded-full shadow-md cursor-pointer"></div>
                            <div className="absolute right-1/4 -top-1.5 size-4 bg-primary border-2 border-white dark:border-background-dark rounded-full shadow-md cursor-pointer"></div>
                        </div>
                        <div className="flex justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
                            <span>$120</span>
                            <span>$850+</span>
                        </div>
                    </div>
                </div>
                {/* Star Rating Checklist */}
                <div className="mb-8">
                    <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary text-lg">star</span>
                        Star Rating
                    </h3>
                    <div className="space-y-2">
                        {[5, 4, 3, 2].map(star => (
                            <label key={star} className="flex items-center gap-3 cursor-pointer group">
                                <input
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
                        ))}
                    </div>
                </div>
                {/* Amenities */}
                <div className="mb-8">
                    <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary text-lg">pool</span>
                        Popular Amenities
                    </h3>
                    <div className="space-y-2">
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input defaultChecked className="h-5 w-5 rounded border-slate-300 dark:border-[#324d67] bg-transparent text-primary focus:ring-primary focus:ring-offset-0 checkbox-tick" type="checkbox" />
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Free WiFi</span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input className="h-5 w-5 rounded border-slate-300 dark:border-[#324d67] bg-transparent text-primary focus:ring-primary focus:ring-offset-0 checkbox-tick" type="checkbox" />
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Swimming Pool</span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input className="h-5 w-5 rounded border-slate-300 dark:border-[#324d67] bg-transparent text-primary focus:ring-primary focus:ring-offset-0 checkbox-tick" type="checkbox" />
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Spa & Wellness</span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input className="h-5 w-5 rounded border-slate-300 dark:border-[#324d67] bg-transparent text-primary focus:ring-primary focus:ring-offset-0 checkbox-tick" type="checkbox" />
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Breakfast Included</span>
                        </label>
                    </div>
                </div>
                {/* Guest Rating */}
                <div className="mb-6">
                    <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary text-lg">thumb_up</span>
                        Guest Rating
                    </h3>
                    <div className="space-y-3">
                        <label className="flex items-center justify-between cursor-pointer">
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Superb 9+</span>
                            <input className="text-primary border-slate-300 dark:border-slate-600 focus:ring-primary bg-transparent" name="rating" type="radio" />
                        </label>
                        <label className="flex items-center justify-between cursor-pointer">
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Very Good 8+</span>
                            <input defaultChecked className="text-primary border-slate-300 dark:border-slate-600 focus:ring-primary bg-transparent" name="rating" type="radio" />
                        </label>
                        <label className="flex items-center justify-between cursor-pointer">
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Good 7+</span>
                            <input className="text-primary border-slate-300 dark:border-slate-600 focus:ring-primary bg-transparent" name="rating" type="radio" />
                        </label>
                    </div>
                </div>
                <button className="w-full bg-primary/10 hover:bg-primary/20 text-primary font-bold py-3 rounded-xl transition-all border border-primary/20">
                    Apply Filters
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
