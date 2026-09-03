import React, { useState, useEffect, useRef, useMemo } from 'react';
import { countries } from '../data/countries';
import { getUserCountryCode } from '../utils/geoUtils';

const PRIORITY_COUNTRY_CODES = ['GB', 'FR', 'DE', 'RU', 'US', 'CN', 'ES', 'NL', 'AT', 'JP'];

const NationalitySelect = ({ value, onChange, compact = false, googleStyle = false, inputStyle = false }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const wrapperRef = useRef(null);

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
                    onClick={() => { setIsOpen(!isOpen); setSearchTerm(''); }}
                    className={`w-full h-14 flex items-center justify-between px-3.5 border rounded-[4px] bg-white dark:bg-[#303134] transition-all text-left focus:outline-none ${
                        isOpen 
                            ? 'border-[#1a73e8] ring-1 ring-[#1a73e8]' 
                            : 'border-[#dadce0] dark:border-slate-600 hover:border-[#bdc1c6]'
                    }`}
                >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <span className="text-xl flex-shrink-0 leading-none">{selectedCountry?.flag}</span>
                        <div className="flex flex-col min-w-0 flex-1 justify-center">
                            <span className="text-[10px] font-medium text-slate-500 -mb-0.5">Vatandaşlık</span>
                            <span className="text-base font-normal text-[#3c4043] dark:text-white truncate">
                                {selectedCountry?.name || selectedCountry?.code || 'Türkiye'}
                            </span>
                        </div>
                    </div>
                    <span className="material-symbols-outlined text-[20px] text-slate-500 flex-shrink-0 ml-1">arrow_drop_down</span>
                </button>
            ) : (
                <button
                    type="button"
                    onClick={() => { setIsOpen(!isOpen); setSearchTerm(''); }}
                    className={googleStyle 
                        ? "flex items-center gap-1.5 hover:bg-slate-100 dark:hover:bg-slate-700/50 px-2.5 py-1.5 rounded transition-colors text-[#3c4043] dark:text-slate-300 font-medium text-sm focus:outline-none"
                        : `w-full flex items-center gap-2 bg-transparent border-none p-0 focus:ring-0 ${compact ? 'justify-center' : ''}`
                    }
                >
                    <span className={`${compact ? 'text-lg' : 'text-base'} flex-shrink-0`}>{selectedCountry?.flag}</span>
                    <span className={`${compact ? 'text-[11px]' : 'text-sm'} font-medium text-[#3c4043] dark:text-slate-200 truncate`}>
                        {compact || googleStyle ? selectedCountry?.code : selectedCountry?.name}
                    </span>
                    <span className="material-symbols-outlined text-[18px] text-slate-500 flex-shrink-0">arrow_drop_down</span>
                </button>
            )}

            {isOpen && (
                <div className={`absolute top-[calc(100%+6px)] left-0 ${inputStyle ? 'w-full min-w-[280px]' : 'w-[280px]'} bg-white dark:bg-[#202124] border border-[#dadce0] dark:border-slate-700 rounded-xl shadow-[0_4px_16px_rgba(32,33,36,0.28)] z-[250] overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150`}>
                    {/* Search Input Box */}
                    <div className="px-3 py-2 border-b border-[#dadce0] dark:border-slate-700 bg-white dark:bg-[#202124] sticky top-0 z-10">
                        <div className="flex items-center gap-2 h-9 px-2.5 bg-[#f1f3f4] dark:bg-slate-800 rounded-lg">
                            <span className="material-symbols-outlined text-[18px] text-[#5f6368] dark:text-slate-400">search</span>
                            <input
                                type="text"
                                className="w-full bg-transparent border-none outline-none focus:outline-none focus:ring-0 p-0 text-[13px] text-[#202124] dark:text-white placeholder-[#70757a]"
                                placeholder="Ülke ara..."
                                autoFocus
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            {searchTerm && (
                                <button type="button" onClick={() => setSearchTerm('')} className="text-[#5f6368] hover:text-[#202124] dark:hover:text-white">
                                    <span className="material-symbols-outlined text-[16px]">close</span>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Countries List */}
                    <div className="max-h-[280px] overflow-y-auto py-1 scrollbar-thin">
                        {!searchTerm.trim() ? (
                            <>
                                <div className="px-3 py-1.5 text-[11px] font-medium text-[#70757a] dark:text-slate-400 uppercase tracking-wider">
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
                                            className={`w-full flex items-center justify-between px-3.5 py-2 text-left transition-colors ${
                                                isSelected 
                                                    ? 'bg-[#e8f0fe] dark:bg-blue-900/30 text-[#1a73e8] dark:text-blue-300 font-medium' 
                                                    : 'hover:bg-[#f1f3f4] dark:hover:bg-slate-800 text-[#3c4043] dark:text-slate-200'
                                            }`}
                                        >
                                            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                                <span className="text-lg shrink-0 leading-none">{country.flag}</span>
                                                <span className="text-[13px] truncate">{country.name}</span>
                                            </div>
                                            {isSelected && (
                                                <span className="material-symbols-outlined text-[#1a73e8] text-[18px] shrink-0 ml-2">check</span>
                                            )}
                                        </button>
                                    );
                                })}

                                <div className="h-[1px] bg-[#dadce0] dark:bg-slate-700 my-1 mx-3" />

                                <div className="px-3 py-1.5 text-[11px] font-medium text-[#70757a] dark:text-slate-400 uppercase tracking-wider">
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
                                            className={`w-full flex items-center justify-between px-3.5 py-2 text-left transition-colors ${
                                                isSelected 
                                                    ? 'bg-[#e8f0fe] dark:bg-blue-900/30 text-[#1a73e8] dark:text-blue-300 font-medium' 
                                                    : 'hover:bg-[#f1f3f4] dark:hover:bg-slate-800 text-[#3c4043] dark:text-slate-200'
                                            }`}
                                        >
                                            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                                <span className="text-lg shrink-0 leading-none">{country.flag}</span>
                                                <span className="text-[13px] truncate">{country.name}</span>
                                            </div>
                                            {isSelected && (
                                                <span className="material-symbols-outlined text-[#1a73e8] text-[18px] shrink-0 ml-2">check</span>
                                            )}
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
                                            className={`w-full flex items-center justify-between px-3.5 py-2 text-left transition-colors ${
                                                isSelected 
                                                    ? 'bg-[#e8f0fe] dark:bg-blue-900/30 text-[#1a73e8] dark:text-blue-300 font-medium' 
                                                    : 'hover:bg-[#f1f3f4] dark:hover:bg-slate-800 text-[#3c4043] dark:text-slate-200'
                                            }`}
                                        >
                                            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                                <span className="text-lg shrink-0 leading-none">{country.flag}</span>
                                                <span className="text-[13px] truncate">{country.name}</span>
                                            </div>
                                            {isSelected && (
                                                <span className="material-symbols-outlined text-[#1a73e8] text-[18px] shrink-0 ml-2">check</span>
                                            )}
                                        </button>
                                    );
                                })
                            ) : (
                                <div className="p-4 text-center text-[13px] text-slate-500">
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
