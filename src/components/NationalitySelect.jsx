import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { countries } from '../data/countries';
import { getUserCountryCode } from '../utils/geoUtils';

const PRIORITY_COUNTRY_CODES = ['GB', 'FR', 'DE', 'RU', 'US', 'CN', 'ES', 'NL', 'AT', 'JP'];

const NationalitySelect = ({ value, onChange, compact = false, googleStyle = false, inputStyle = false, rounded = 'rounded-[4px]', onToggle }) => {
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const [isMounted, setIsMounted] = useState(false);
    const [isClosing, setIsClosing] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const triggerRef = useRef(null);
    const popoverRef = useRef(null);
    const searchInputRef = useRef(null);

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

    // Animation trigger on open/close
    useEffect(() => {
        if (isOpen) {
            requestAnimationFrame(() => {
                setIsMounted(true);
            });
            setIsClosing(false);
            const focusTimer = setTimeout(() => {
                searchInputRef.current?.focus();
            }, 60);
            return () => clearTimeout(focusTimer);
        } else {
            setIsMounted(false);
            setIsClosing(false);
        }
    }, [isOpen]);

    // Smooth exit handler
    const handleCloseWithAnimation = (callback) => {
        if (isClosing) return;
        setIsClosing(true);
        setTimeout(() => {
            setIsClosing(false);
            setIsMounted(false);
            setIsOpen(false);
            setSearchTerm('');
            onToggle?.(false);
            callback?.();
        }, 240);
    };

    const toggleOpen = () => {
        if (isOpen) {
            handleCloseWithAnimation();
        } else {
            setIsOpen(true);
            setSearchTerm('');
            onToggle?.(true);
        }
    };

    // Country selection with auto-close and animation
    const handleSelectCountry = (code) => {
        onChange?.(code);
        handleCloseWithAnimation();
    };

    // Close on escape key
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && isOpen && !isClosing) {
                handleCloseWithAnimation();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, isClosing]);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (triggerRef.current && triggerRef.current.contains(event.target)) {
                return;
            }
            if (popoverRef.current && !popoverRef.current.contains(event.target)) {
                handleCloseWithAnimation();
            }
        };
        if (isOpen && !isClosing) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen, isClosing]);

    const searchFilteredCountries = useMemo(() => {
        if (!searchTerm.trim()) return [];
        const term = searchTerm.toLowerCase();
        const termTr = searchTerm.toLocaleLowerCase('tr');
        return countries.filter(c => {
            const nameLower = c.name.toLowerCase();
            const nameTr = c.name.toLocaleLowerCase('tr');
            const codeLower = c.code.toLowerCase();
            return nameLower.includes(term) || nameTr.includes(termTr) || codeLower.includes(term);
        });
    }, [searchTerm]);

    const canUseDOM = typeof window !== 'undefined' && typeof document !== 'undefined';
    const showPopover = (isOpen || isClosing) && canUseDOM;

    const popoverContent = (
        <div
            ref={popoverRef}
            className="fixed left-1/2 bottom-3 sm:bottom-4 z-[1000] bg-white dark:bg-[#202124] rounded-[8px] shadow-[0_8px_32px_rgba(0,0,0,0.16),0_1px_3px_rgba(60,64,67,0.25)] border border-[#dadce0] dark:border-slate-700 p-4 sm:p-5 w-[94vw] max-w-[420px] max-h-[calc(100vh-24px)] flex flex-col font-roboto transition-all duration-300 ease-out pointer-events-auto"
            style={{
                transform: isMounted && !isClosing ? 'translate(-50%, 0)' : 'translate(-50%, 48px)',
                opacity: isMounted && !isClosing ? 1 : 0
            }}
        >
            {/* --- Top Header Bar --- */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#dadce0] dark:border-slate-700">
                <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[20px] text-[#1a73e8] dark:text-blue-400">public</span>
                    <h3 className="text-[15px] font-medium text-[#202124] dark:text-white">
                        {t('common.selectNationality', 'Uyruk / Vatandaşlık Seçin')}
                    </h3>
                </div>
                <button
                    type="button"
                    onClick={() => handleCloseWithAnimation()}
                    className="p-1 rounded-full text-[#5f6368] hover:text-[#202124] dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    title={t('common.close', 'Kapat')}
                >
                    <span className="material-symbols-outlined text-[20px] block">close</span>
                </button>
            </div>

            {/* --- Search Input Box --- */}
            <div className="pb-3">
                <div className="flex items-center gap-2 h-10 px-3 bg-[#f1f3f4] dark:bg-slate-800 rounded-[4px] border border-transparent focus-within:border-[#1a73e8] focus-within:bg-white dark:focus-within:bg-slate-900 transition-colors">
                    <span className="material-symbols-outlined text-[20px] text-[#5f6368] dark:text-slate-400 shrink-0">search</span>
                    <input
                        ref={searchInputRef}
                        type="text"
                        className="w-full bg-transparent border-none outline-none focus:outline-none focus:ring-0 p-0 text-[14px] font-roboto text-[#202124] dark:text-white placeholder-[#70757a]"
                        placeholder={t('common.searchCountry', 'Ülke veya kod ara...')}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    {searchTerm && (
                        <button
                            type="button"
                            onClick={() => {
                                setSearchTerm('');
                                searchInputRef.current?.focus();
                            }}
                            className="text-[#5f6368] hover:text-[#202124] dark:hover:text-white cursor-pointer p-0.5"
                            title={t('common.clear', 'Temizle')}
                        >
                            <span className="material-symbols-outlined text-[18px] block">close</span>
                        </button>
                    )}
                </div>
            </div>

            {/* --- Countries List (Scrollable) --- */}
            <div className="flex-1 overflow-y-auto max-h-[320px] sm:max-h-[360px] -mx-1 px-1 scrollbar-thin">
                {!searchTerm.trim() ? (
                    <>
                        <div className="px-3 py-1.5 text-[11px] font-medium text-[#70757a] dark:text-slate-400 uppercase tracking-wider bg-slate-50/80 dark:bg-slate-800/60 rounded-[4px] mb-1">
                            {t('common.suggestedCountries', 'Önerilen Ülkeler')}
                        </div>
                        {topSectionList.map(country => {
                            const isSelected = value === country.code;
                            return (
                                <button
                                    key={country.code}
                                    type="button"
                                    onClick={() => handleSelectCountry(country.code)}
                                    className={`w-full flex items-center px-3 py-2 rounded-[4px] text-left transition-colors cursor-pointer ${
                                        isSelected 
                                            ? 'bg-[#e8f0fe] dark:bg-blue-900/30 text-[#1a73e8] dark:text-blue-200 font-medium' 
                                            : 'hover:bg-[#f1f3f4] dark:hover:bg-slate-800 text-[#3c4043] dark:text-slate-200 font-normal'
                                    }`}
                                >
                                    <span className="w-6 flex items-center justify-start shrink-0">
                                        {isSelected && (
                                            <span className="material-symbols-outlined text-[#1a73e8] dark:text-blue-400 text-[19px]">check</span>
                                        )}
                                    </span>
                                    <span className="text-xl shrink-0 mr-3 leading-none">{country.flag}</span>
                                    <span className="text-[14px] truncate flex-1">{country.name}</span>
                                    <span className={`text-[12px] font-mono ml-2 shrink-0 ${isSelected ? 'text-[#1a73e8] dark:text-blue-300 font-medium' : 'text-[#70757a] dark:text-slate-400'}`}>
                                        {country.code}
                                    </span>
                                </button>
                            );
                        })}

                        <div className="h-[1px] bg-[#dadce0] dark:bg-slate-700 my-2" />

                        <div className="px-3 py-1.5 text-[11px] font-medium text-[#70757a] dark:text-slate-400 uppercase tracking-wider bg-slate-50/80 dark:bg-slate-800/60 rounded-[4px] mb-1">
                            {t('common.allCountries', 'Tüm Ülkeler')}
                        </div>
                        {otherCountries.map(country => {
                            const isSelected = value === country.code;
                            return (
                                <button
                                    key={country.code}
                                    type="button"
                                    onClick={() => handleSelectCountry(country.code)}
                                    className={`w-full flex items-center px-3 py-2 rounded-[4px] text-left transition-colors cursor-pointer ${
                                        isSelected 
                                            ? 'bg-[#e8f0fe] dark:bg-blue-900/30 text-[#1a73e8] dark:text-blue-200 font-medium' 
                                            : 'hover:bg-[#f1f3f4] dark:hover:bg-slate-800 text-[#3c4043] dark:text-slate-200 font-normal'
                                    }`}
                                >
                                    <span className="w-6 flex items-center justify-start shrink-0">
                                        {isSelected && (
                                            <span className="material-symbols-outlined text-[#1a73e8] dark:text-blue-400 text-[19px]">check</span>
                                        )}
                                    </span>
                                    <span className="text-xl shrink-0 mr-3 leading-none">{country.flag}</span>
                                    <span className="text-[14px] truncate flex-1">{country.name}</span>
                                    <span className={`text-[12px] font-mono ml-2 shrink-0 ${isSelected ? 'text-[#1a73e8] dark:text-blue-300 font-medium' : 'text-[#70757a] dark:text-slate-400'}`}>
                                        {country.code}
                                    </span>
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
                                    onClick={() => handleSelectCountry(country.code)}
                                    className={`w-full flex items-center px-3 py-2 rounded-[4px] text-left transition-colors cursor-pointer ${
                                        isSelected 
                                            ? 'bg-[#e8f0fe] dark:bg-blue-900/30 text-[#1a73e8] dark:text-blue-200 font-medium' 
                                            : 'hover:bg-[#f1f3f4] dark:hover:bg-slate-800 text-[#3c4043] dark:text-slate-200 font-normal'
                                    }`}
                                >
                                    <span className="w-6 flex items-center justify-start shrink-0">
                                        {isSelected && (
                                            <span className="material-symbols-outlined text-[#1a73e8] dark:text-blue-400 text-[19px]">check</span>
                                        )}
                                    </span>
                                    <span className="text-xl shrink-0 mr-3 leading-none">{country.flag}</span>
                                    <span className="text-[14px] truncate flex-1">{country.name}</span>
                                    <span className={`text-[12px] font-mono ml-2 shrink-0 ${isSelected ? 'text-[#1a73e8] dark:text-blue-300 font-medium' : 'text-[#70757a] dark:text-slate-400'}`}>
                                        {country.code}
                                    </span>
                                </button>
                            );
                        })
                    ) : (
                        <div className="p-6 text-center text-[13px] text-[#70757a] dark:text-slate-400">
                            {t('common.countryNotFound', 'Ülke bulunamadı')}
                        </div>
                    )
                )}
            </div>

            {/* --- Footer Bar --- */}
            <div className="flex items-center justify-between pt-3 mt-3 border-t border-[#dadce0] dark:border-slate-700">
                <div className="flex items-center gap-2 text-[13px] text-[#5f6368] dark:text-slate-300 min-w-0">
                    <span className="text-base shrink-0">{selectedCountry?.flag}</span>
                    <span className="truncate font-normal">
                        {selectedCountry?.name || selectedCountry?.code}
                    </span>
                </div>
                <button
                    type="button"
                    onClick={() => handleCloseWithAnimation()}
                    className="bg-[#1a73e8] hover:bg-[#1557b0] text-white rounded-full font-medium text-[13px] px-6 py-1.5 transition-all shadow-none hover:shadow active:scale-95 cursor-pointer shrink-0 ml-2"
                >
                    {t('common.done', 'Bitti')}
                </button>
            </div>
        </div>
    );

    return (
        <div className={`relative ${inputStyle ? 'w-full h-full' : ''}`}>
            {inputStyle ? (
                <button
                    ref={triggerRef}
                    type="button"
                    onClick={toggleOpen}
                    className={`nationality-trigger w-full h-full flex items-center justify-between px-3.5 sm:px-4 border ${rounded} bg-white dark:bg-[#303134] transition-all text-left focus:outline-none font-roboto cursor-pointer ${
                        isOpen 
                            ? 'border-[#1a73e8] ring-1 ring-[#1a73e8]' 
                            : 'border-[#dadce0] dark:border-slate-600 hover:border-[#bdc1c6]'
                    }`}
                    title={t('common.nationality', 'Vatandaşlık')}
                >
                    <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                        <span className="text-lg flex-shrink-0 leading-none">{selectedCountry?.flag}</span>
                        <span className="text-[14px] font-normal text-[#202124] dark:text-white truncate">
                            {selectedCountry?.name || selectedCountry?.code || 'Türkiye'}
                        </span>
                    </div>
                    <span className="material-symbols-outlined text-[19px] text-[#5f6368] dark:text-slate-300 flex-shrink-0 ml-1">
                        {isOpen ? 'arrow_drop_up' : 'arrow_drop_down'}
                    </span>
                </button>
            ) : (
                <button
                    ref={triggerRef}
                    type="button"
                    onClick={toggleOpen}
                    className={`nationality-trigger ${googleStyle 
                        ? `flex items-center gap-1.5 px-3 py-1.5 rounded transition-colors font-normal text-[13px] focus:outline-none cursor-pointer ${
                            isOpen 
                                ? 'bg-[#e8f0fe] dark:bg-blue-900/30 text-[#1a73e8] dark:text-blue-300' 
                                : 'hover:bg-[#f1f3f4] dark:hover:bg-slate-700/50 text-[#3c4043] dark:text-slate-300'
                        }`
                        : `w-full flex items-center gap-2 bg-transparent border-none p-0 focus:ring-0 ${compact ? 'justify-center' : ''}`
                    }`}
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

            {showPopover && createPortal(popoverContent, document.body)}
        </div>
    );
};

export default NationalitySelect;

