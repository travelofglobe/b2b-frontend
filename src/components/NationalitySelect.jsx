import React, { useState, useEffect, useRef } from 'react';
import { countries } from '../data/countries';

const NationalitySelect = ({ value, onChange, compact = false }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const wrapperRef = useRef(null);

    const selectedCountry = countries.find(c => c.code === value) || countries.find(c => c.code === 'TR');

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredCountries = countries.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="relative border-r border-slate-300 dark:border-slate-600 px-3" ref={wrapperRef}>
            <button
                onClick={() => { setIsOpen(!isOpen); setSearchTerm(''); }}
                className="flex items-center gap-2 bg-transparent border-none p-0 focus:ring-0"
            >
                <span className="text-xl">{selectedCountry?.flag}</span>
                <span className={`text-xs font-medium text-slate-900 dark:text-white truncate ${compact ? 'max-w-[100px]' : ''}`}>
                    {selectedCountry?.name}
                </span>
                <span className="material-symbols-outlined text-slate-400 text-sm">expand_more</span>
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 mt-2 w-[240px] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl shadow-2xl z-[1300] overflow-hidden">
                    <div className="p-2 border-b border-slate-100 dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-900 z-10">
                        <div className="relative">
                            <span className="material-symbols-outlined absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-sm">search</span>
                            <input
                                type="text"
                                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-lg py-1.5 pl-8 pr-3 text-xs font-semibold focus:ring-1 focus:ring-primary"
                                placeholder="Search country..."
                                autoFocus
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="max-h-[220px] overflow-y-auto custom-scrollbar p-1">
                        {filteredCountries.map(country => (
                            <button
                                key={country.code}
                                onClick={() => {
                                    onChange(country.code);
                                    setIsOpen(false);
                                }}
                                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-left ${value === country.code ? 'bg-blue-50 dark:bg-blue-900/20 text-primary' : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'}`}
                            >
                                <span className="text-lg">{country.flag}</span>
                                <span className="text-sm font-semibold truncate">{country.name}</span>
                                {value === country.code && (
                                    <span className="material-symbols-outlined text-primary text-sm ml-auto">check</span>
                                )}
                            </button>
                        ))}
                        {filteredCountries.length === 0 && (
                            <div className="p-4 text-center text-xs text-slate-400 font-medium">
                                No countries found
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NationalitySelect;
