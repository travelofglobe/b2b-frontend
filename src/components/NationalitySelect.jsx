import React, { useState, useEffect, useRef, useMemo } from 'react';
import { countries } from '../data/countries';
import { getUserCountryCode } from '../utils/geoUtils';

const PRIORITY_COUNTRY_CODES = ['GB', 'FR', 'DE', 'RU', 'US', 'CN', 'ES', 'NL', 'AT', 'JP'];

const NationalitySelect = ({ value, onChange, compact = false, googleStyle = false, inputStyle = false, onToggle }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const wrapperRef = useRef(null);

    const toggleOpen = () => {
        const next = !isOpen;
        setIsOpen(next);
        setSearchTerm('');
        onToggle?.(next);
    };

    // Sales channel country (or fallback user country)
    const agencyCountryCode = useMemo(() => {
        return localStorage.getItem('agency_country_code') || getUserCountryCode();
    }, []);

    // 1st Country: Agency/Sales channel country
    const firstCode = agencyCountryCode || 'TR';
    const firstCountry = useMemo(() => countries.find(c => c.code === firstCode), [firstCode]);

    // 2nd Country: Always Turkey (TR) if not already 1st
    const secondCountry = useMemo(() => {
        if (firstCode === 'TR') return null;
        return countries.find(c => c.code === 'TR');
    }, [firstCode]);

    // Priority popular countries (excluding 1st and 2nd)
    const priorityCountries = useMemo(() => {
        return PRIORITY_COUNTRY_CODES
            .filter(code => code !== firstCode && (firstCode === 'TR' || code !== 'TR'))
            .map(code => countries.find(c => c.code === code))
            .filter(Boolean);
    }, [firstCode]);

    // Used codes set for top section
    const topSectionCodes = useMemo(() => {
        const set = new Set();
        if (firstCountry) set.add(firstCountry.code);
        if (secondCountry) set.add(secondCountry.code);
        priorityCountries.forEach(c => set.add(c.code));
        return set;
    }, [firstCountry, secondCountry, priorityCountries]);

    // Top section items list
    const topSectionList = useMemo(() => {
        const list = [];
        if (firstCountry) list.push({ ...firstCountry, isAgency: true });
        if (secondCountry) list.push(secondCountry);
        list.push(...priorityCountries);
        return list;
    }, [firstCountry, secondCountry, priorityCountries]);

    // Remaining countries sorted alphabetically
    const otherCountries = useMemo(() => {
        return countries
            .filter(c => !topSectionCodes.has(c.code))
            .sort((a, b) => a.name.localeCompare(b.name));
    }, [topSectionCodes]);

    const selectedCountry = useMemo(() => {
        return countries.find(c => c.code === value) || firstCountry || countries.find(c => c.code === 'TR');
    }, [value, firstCountry]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const searchFilteredCountries = useMemo(() => {
        if (!searchTerm.trim()) return [];
        const term = searchTerm.toLowerCase();
        return countries.filter(c =>
            c.name.toLowerCase().includes(term) ||
            c.code.toLowerCase().includes(term)
        );
    }, [searchTerm]);

    return (
        <div className={`relative ${inputStyle ? 'w-full h-full' : ''}`} ref={wrapperRef}>
            {inputStyle ? (
                <button
                    type="button"
                    onClick={toggleOpen}
                    className={`w-full h-full flex items-center justify-between px-3.5 sm:px-4 border rounded-lg bg-white dark:bg-[#303134] transition-all text-left focus:outline-none font-roboto ${
                        isOpen 
                            ? 'border-[#1a73e8] ring-1 ring-[#1a73e8]' 
                            : 'border-[#dadce0] dark:border-slate-600 hover:border-[#bdc1c6]'
                    }`}
                    title="Vatandaşlık"
                >
                    <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                        <span className="text-xl flex-shrink-0 leading-none">{selectedCountry?.flag}</span>
                        <span className="text-[15px] font-normal text-[#3c4043] dark:text-white truncate">
                            {selectedCountry?.name || selectedCountry?.code || 'Türkiye'}
                        </span>
                    </div>
                    <span className="material-symbols-outlined text-[20px] text-[#5f6368] dark:text-slate-400 flex-shrink-0 ml-1">
                        {isOpen ? 'arrow_drop_up' : 'arrow_drop_down'}
                    </span>
                </button>
            ) : (
                <button
                    type="button"
                    onClick={toggleOpen}
                    className={googleStyle 
                        ? `flex items-center gap-1.5 px-3 py-1.5 rounded transition-colors font-normal text-[13px] focus:outline-none cursor-pointer ${
                            isOpen 
                                ? 'bg-[#e8f0fe] dark:bg-blue-900/30 text-[#1a73e8] dark:text-blue-300' 
                                : 'hover:bg-[#f1f3f4] dark:hover:bg-slate-700/50 text-[#3c4043] dark:text-slate-300'
                        }`
                        : `w-full flex items-center gap-2 bg-transparent border-none p-0 focus:ring-0 ${compact ? 'justify-center' : ''}`
                    }
                >
                    <span className={`${compact ? 'text-lg' : 'text-base'} flex-shrink-0`}>{selectedCountry?.flag}</span>
                    <span className={`${compact ? 'text-[11px]' : 'text-[13px]'} font-normal truncate`}>
                        {compact || googleStyle ? selectedCountry?.code : selectedCountry?.name}
                    </span>
                    <span className="material-symbols-outlined text-[18px] text-[#70757a] flex-shrink-0">
                        {isOpen ? 'arrow_drop_up' : 'arrow_drop_down'}
                    </span>
                </button>
            )}

            {isOpen && (
                <div className={`absolute top-[calc(100%+4px)] left-0 ${inputStyle ? 'w-full min-w-[320px]' : 'w-[320px]'} bg-white dark:bg-[#202124] border border-[#dadce0] dark:border-slate-700 rounded-[4px] shadow-[0_2px_6px_2px_rgba(60,64,67,0.15),0_1px_2px_0_rgba(60,64,67,0.3)] z-[250] overflow-hidden animate-in fade-in duration-100 font-roboto`}>
                    {/* Search Input Box */}
                    <div className="p-2.5 border-b border-[#dadce0] dark:border-slate-700 bg-white dark:bg-[#202124] sticky top-0 z-10">
                        <div className="flex items-center gap-2 h-10 px-3 bg-[#f1f3f4] dark:bg-slate-800 rounded-[4px] border border-transparent focus-within:border-[#1a73e8] focus-within:bg-white dark:focus-within:bg-slate-900 transition-colors">
                            <span className="material-symbols-outlined text-[20px] text-[#5f6368] dark:text-slate-400 shrink-0">search</span>
                            <input
                                type="text"
                                className="w-full bg-transparent border-none outline-none focus:outline-none focus:ring-0 p-0 text-[14px] font-roboto text-[#202124] dark:text-white placeholder-[#70757a]"
                                placeholder="Ülke veya kod ara..."
                                autoFocus
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            {searchTerm && (
                                <button type="button" onClick={() => setSearchTerm('')} className="text-[#5f6368] hover:text-[#202124] dark:hover:text-white cursor-pointer">
                                    <span className="material-symbols-outlined text-[18px]">close</span>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Countries List (Google Flights Menu Style with Left Checkmark) */}
                    <div className="max-h-[320px] overflow-y-auto py-1 scrollbar-thin">
                        {!searchTerm.trim() ? (
                            <>
                                <div className="px-4 py-1.5 text-[11px] font-medium text-[#70757a] dark:text-slate-400 uppercase tracking-wider bg-slate-50/60 dark:bg-slate-800/40">
                                    Önerilen Ülkeler
                                </div>
                                {topSectionList.map(country => {
                                    const isSelected = value === country.code;
                                    return (
                                        <button
                                            key={country.code}
                                            type="button"
                                            onClick={() => {
                                                onChange(country.code);
                                                setIsOpen(false);
                                            }}
                                            className={`w-full flex items-center px-4 py-2.5 text-left transition-colors cursor-pointer ${
                                                isSelected 
                                                    ? 'bg-[#e8f0fe] dark:bg-blue-900/30 text-[#202124] dark:text-white font-normal' 
                                                    : 'hover:bg-[#f1f3f4] dark:hover:bg-slate-800 text-[#3c4043] dark:text-slate-200 font-normal'
                                            }`}
                                        >
                                            {/* Google Flights Checkmark on Left */}
                                            <span className="w-7 flex items-center justify-start shrink-0">
                                                {isSelected && (
                                                    <span className="material-symbols-outlined text-[#5f6368] dark:text-slate-300 text-[20px]">check</span>
                                                )}
                                            </span>
                                            <span className="text-xl shrink-0 mr-3 leading-none">{country.flag}</span>
                                            <span className="text-[15px] truncate flex-1">{country.name}</span>
                                            <span className="text-[13px] text-[#70757a] dark:text-slate-400 ml-2 font-normal shrink-0">{country.code}</span>
                                        </button>
                                    );
                                })}

                                <div className="h-[1px] bg-[#dadce0] dark:bg-slate-700 my-1" />

                                <div className="px-4 py-1.5 text-[11px] font-medium text-[#70757a] dark:text-slate-400 uppercase tracking-wider bg-slate-50/60 dark:bg-slate-800/40">
                                    Tüm Ülkeler
                                </div>
                                {otherCountries.map(country => {
                                    const isSelected = value === country.code;
                                    return (
                                        <button
                                            key={country.code}
                                            type="button"
                                            onClick={() => {
                                                onChange(country.code);
                                                setIsOpen(false);
                                            }}
                                            className={`w-full flex items-center px-4 py-2.5 text-left transition-colors cursor-pointer ${
                                                isSelected 
                                                    ? 'bg-[#e8f0fe] dark:bg-blue-900/30 text-[#202124] dark:text-white font-normal' 
                                                    : 'hover:bg-[#f1f3f4] dark:hover:bg-slate-800 text-[#3c4043] dark:text-slate-200 font-normal'
                                            }`}
                                        >
                                            <span className="w-7 flex items-center justify-start shrink-0">
                                                {isSelected && (
                                                    <span className="material-symbols-outlined text-[#5f6368] dark:text-slate-300 text-[20px]">check</span>
                                                )}
                                            </span>
                                            <span className="text-xl shrink-0 mr-3 leading-none">{country.flag}</span>
                                            <span className="text-[15px] truncate flex-1">{country.name}</span>
                                            <span className="text-[13px] text-[#70757a] dark:text-slate-400 ml-2 font-normal shrink-0">{country.code}</span>
                                        </button>
                                    );
                                })}
                            </>
                        ) : (
                            searchFilteredCountries.length > 0 ? (
                                searchFilteredCountries.map(country => {
                                    const isSelected = value === country.code;
                                    return (
                                        <button
                                            key={country.code}
                                            type="button"
                                            onClick={() => {
                                                onChange(country.code);
                                                setIsOpen(false);
                                            }}
                                            className={`w-full flex items-center px-4 py-2.5 text-left transition-colors cursor-pointer ${
                                                isSelected 
                                                    ? 'bg-[#e8f0fe] dark:bg-blue-900/30 text-[#202124] dark:text-white font-normal' 
                                                    : 'hover:bg-[#f1f3f4] dark:hover:bg-slate-800 text-[#3c4043] dark:text-slate-200 font-normal'
                                            }`}
                                        >
                                            <span className="w-7 flex items-center justify-start shrink-0">
                                                {isSelected && (
                                                    <span className="material-symbols-outlined text-[#5f6368] dark:text-slate-300 text-[20px]">check</span>
                                                )}
                                            </span>
                                            <span className="text-xl shrink-0 mr-3 leading-none">{country.flag}</span>
                                            <span className="text-[15px] truncate flex-1">{country.name}</span>
                                            <span className="text-[13px] text-[#70757a] dark:text-slate-400 ml-2 font-normal shrink-0">{country.code}</span>
                                        </button>
                                    );
                                })
                            ) : (
                                <div className="p-4 text-center text-[13px] text-[#70757a]">
                                    Ülke bulunamadı
                                </div>
                            )
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NationalitySelect;
