import React, { useState, useRef, useEffect } from 'react';

const countries = [
    { name: 'Türkiye', code: '+90', flag: '🇹🇷', id: 'TR' },
    { name: 'İngiltere', code: '+44', flag: '🇬🇧', id: 'GB' },
    { name: 'Almanya', code: '+49', flag: '🇩🇪', id: 'DE' },
    { name: 'Rusya', code: '+7', flag: '🇷🇺', id: 'RU' },
    { name: 'Azerbaycan', code: '+994', flag: '🇦🇿', id: 'AZ' },
    { name: 'Suudi Arabistan', code: '+966', flag: '🇸🇦', id: 'SA' },
    { name: 'ABD', code: '+1', flag: '🇺🇸', id: 'US' },
    { name: 'Fransa', code: '+33', flag: '🇫🇷', id: 'FR' },
    { name: 'İtalya', code: '+39', flag: '🇮🇹', id: 'IT' },
    { name: 'İspanya', code: '+34', flag: '🇪🇸', id: 'ES' },
];

const PhoneInput = ({ value, onChange, label, error }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeIndex, setActiveIndex] = useState(0);
    const [openUpwards, setOpenUpwards] = useState(false);
    const dropdownRef = useRef(null);
    const buttonRef = useRef(null);
    
    // Parse initial value
    const initialCountry = countries.find(c => value?.startsWith(c.code)) || countries[0];
    const [selectedCountry, setSelectedCountry] = useState(initialCountry);
    const phoneNumber = value?.replace(selectedCountry.code, '').trim() || '';

    const filteredCountries = countries.filter(c => 
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        c.code.includes(searchTerm)
    );

    useEffect(() => {
        setActiveIndex(0);
    }, [searchTerm, isOpen]);

    const handleKeyDown = (e) => {
        if (!isOpen) {
            if (e.key === 'Enter' || e.key === 'ArrowDown') {
                setIsOpen(true);
                e.preventDefault();
            }
            return;
        }

        if (e.key === 'ArrowDown') {
            setActiveIndex(prev => (prev + 1) % filteredCountries.length);
            e.preventDefault();
        } else if (e.key === 'ArrowUp') {
            setActiveIndex(prev => (prev - 1 + filteredCountries.length) % filteredCountries.length);
            e.preventDefault();
        } else if (e.key === 'Enter') {
            if (filteredCountries[activeIndex]) {
                handleCountrySelect(filteredCountries[activeIndex]);
            }
            e.preventDefault();
        } else if (e.key === 'Escape') {
            setIsOpen(false);
            e.preventDefault();
        }
    };

    useEffect(() => {
        if (isOpen && buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            const spaceBelow = window.innerHeight - rect.bottom;
            if (spaceBelow < 300) { // If less than 300px space below
                setOpenUpwards(true);
            } else {
                setOpenUpwards(false);
            }
        }
    }, [isOpen]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handlePhoneChange = (e) => {
        const val = e.target.value.replace(/\D/g, ''); // Only digits
        onChange(`${selectedCountry.code} ${val}`);
    };

    const handleCountrySelect = (country) => {
        setSelectedCountry(country);
        setIsOpen(false);
        onChange(`${country.code} ${phoneNumber}`);
    };

    return (
        <div className="space-y-2 relative z-[50]" ref={dropdownRef} onKeyDown={handleKeyDown}>
            {label && (
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                    {label}
                </label>
            )}
            
            <div className={`flex items-stretch bg-slate-50 dark:bg-slate-800/50 border rounded-2xl transition-all duration-300 ${
                error ? 'border-red-500/50 ring-2 ring-red-500/10' : 'border-slate-200 dark:border-slate-700 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10'
            }`}>
                {/* Country Selector */}
                <button
                    type="button"
                    ref={buttonRef}
                    onClick={() => setIsOpen(!isOpen)}
                    className="flex items-center gap-2 px-4 border-r border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors rounded-l-2xl shrink-0"
                >
                    <span className="text-xl leading-none">{selectedCountry.flag}</span>
                    <span className="text-sm font-black text-slate-700 dark:text-slate-300">{selectedCountry.code}</span>
                    <span className={`material-symbols-outlined text-sm text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
                        expand_more
                    </span>
                </button>

                {/* Number Input */}
                <input
                    type="text"
                    value={phoneNumber}
                    onChange={handlePhoneChange}
                    className="flex-1 bg-transparent p-4 outline-none font-bold text-slate-900 dark:text-white placeholder:text-slate-400 placeholder:font-medium"
                    placeholder="5__ ___ __ __"
                />
            </div>

            {/* Dropdown */}
            {isOpen && (
                <div className={`absolute left-0 w-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl z-[100] overflow-hidden animate-in fade-in duration-300 ${
                    openUpwards ? 'bottom-full mb-2 slide-in-from-bottom-2' : 'top-full mt-2 slide-in-from-top-2'
                }`}>
                    <div className="p-3 border-b border-slate-100 dark:border-slate-800">
                        <div className="relative">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
                            <input
                                type="text"
                                placeholder="Ara..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 pl-10 pr-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-primary/50"
                                autoFocus
                            />
                        </div>
                    </div>
                    <div className="max-h-64 overflow-y-auto no-scrollbar py-2">
                        {filteredCountries.map((country, index) => (
                            <button
                                key={country.id}
                                type="button"
                                onClick={() => handleCountrySelect(country)}
                                className={`w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${
                                    selectedCountry.id === country.id ? 'bg-primary/5 dark:bg-primary/10' : ''
                                } ${activeIndex === index ? 'bg-slate-100 dark:bg-slate-800 ring-1 ring-inset ring-primary/20' : ''}`}
                            >
                                <div className="flex items-center gap-3">
                                    <span className="text-xl leading-none">{country.flag}</span>
                                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{country.code}</span>
                                    <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{country.name}</span>
                                </div>
                                {selectedCountry.id === country.id && (
                                    <span className="material-symbols-outlined text-primary text-lg">check</span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default PhoneInput;
