import React, { useState, useRef, useEffect } from 'react';

const countries = [
    { name: 'Türkiye', code: '+90', flag: '🇹🇷', id: 'TR' },
    { name: 'Birleşik Krallık', code: '+44', flag: '🇬🇧', id: 'GB' },
    { name: 'Almanya', code: '+49', flag: '🇩🇪', id: 'DE' },
    { name: 'ABD', code: '+1', flag: '🇺🇸', id: 'US' },
    { name: 'Fransa', code: '+33', flag: '🇫🇷', id: 'FR' },
    { name: 'İtalya', code: '+39', flag: '🇮🇹', id: 'IT' },
    { name: 'İspanya', code: '+34', flag: '🇪🇸', id: 'ES' },
    { name: 'Hollanda', code: '+31', flag: '🇳🇱', id: 'NL' },
    { name: 'Belçika', code: '+32', flag: '🇧🇪', id: 'BE' },
    { name: 'İsviçre', code: '+41', flag: '🇨🇭', id: 'CH' },
    { name: 'Avusturya', code: '+43', flag: '🇦🇹', id: 'AT' },
    { name: 'Rusya', code: '+7', flag: '🇷🇺', id: 'RU' },
    { name: 'Azerbaycan', code: '+994', flag: '🇦🇿', id: 'AZ' },
    { name: 'Kazakistan', code: '+7', flag: '🇰🇿', id: 'KZ' },
    { name: 'Özbekistan', code: '+998', flag: '🇺🇿', id: 'UZ' },
    { name: 'Türkmenistan', code: '+993', flag: '🇹🇲', id: 'TM' },
    { name: 'Kırgızistan', code: '+996', flag: '🇰🇬', id: 'KG' },
    { name: 'Gürcistan', code: '+995', flag: '🇬🇪', id: 'GE' },
    { name: 'Ukrayna', code: '+380', flag: '🇺🇦', id: 'UA' },
    { name: 'Bulgaristan', code: '+359', flag: '🇧🇬', id: 'BG' },
    { name: 'Yunanistan', code: '+30', flag: '🇬🇷', id: 'GR' },
    { name: 'Romanya', code: '+40', flag: '🇷🇴', id: 'RO' },
    { name: 'Suudi Arabistan', code: '+966', flag: '🇸🇦', id: 'SA' },
    { name: 'Birleşik Arap Emirlikleri', code: '+971', flag: '🇦🇪', id: 'AE' },
    { name: 'Katar', code: '+974', flag: '🇶🇦', id: 'QA' },
    { name: 'Kuveyt', code: '+965', flag: '🇰🇼', id: 'KW' },
    { name: 'Bahreyn', code: '+973', flag: '🇧🇭', id: 'BH' },
    { name: 'Umman', code: '+968', flag: '🇴🇲', id: 'OM' },
    { name: 'Ürdün', code: '+962', flag: '🇯🇴', id: 'JO' },
    { name: 'Lübnan', code: '+961', flag: '🇱🇧', id: 'LB' },
    { name: 'Mısır', code: '+20', flag: '🇪🇬', id: 'EG' },
    { name: 'Fas', code: '+212', flag: '🇲🇦', id: 'MA' },
    { name: 'Cezayir', code: '+213', flag: '🇩🇿', id: 'DZ' },
    { name: 'Tunus', code: '+216', flag: '🇹🇳', id: 'TN' },
    { name: 'İran', code: '+98', flag: '🇮🇷', id: 'IR' },
    { name: 'Irak', code: '+964', flag: '🇮🇶', id: 'IQ' },
    { name: 'Pakistan', code: '+92', flag: '🇵🇰', id: 'PK' },
    { name: 'Hindistan', code: '+91', flag: '🇮🇳', id: 'IN' },
    { name: 'Çin', code: '+86', flag: '🇨🇳', id: 'CN' },
    { name: 'Japonya', code: '+81', flag: '🇯🇵', id: 'JP' },
    { name: 'Güney Kore', code: '+82', flag: '🇰🇷', id: 'KR' },
    { name: 'Malezya', code: '+60', flag: '🇲🇾', id: 'MY' },
    { name: 'Endonezya', code: '+62', flag: '🇮🇩', id: 'ID' },
    { name: 'Tayland', code: '+66', flag: '🇹🇭', id: 'TH' },
    { name: 'Singapur', code: '+65', flag: '🇸🇬', id: 'SG' },
    { name: 'Brezilya', code: '+55', flag: '🇧🇷', id: 'BR' },
    { name: 'Arjantin', code: '+54', flag: '🇦🇷', id: 'AR' },
    { name: 'Meksika', code: '+52', flag: '🇲🇽', id: 'MX' },
    { name: 'Kanada', code: '+1', flag: '🇨🇦', id: 'CA' },
    { name: 'Avustralya', code: '+61', flag: '🇦🇺', id: 'AU' },
    { name: 'Yeni Zelanda', code: '+64', flag: '🇳🇿', id: 'NZ' },
    { name: 'Güney Afrika', code: '+27', flag: '🇿🇦', id: 'ZA' },
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
        <div className="relative z-[9999]" ref={dropdownRef} onKeyDown={handleKeyDown}>
            {label && (
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 mb-2 block">
                    {label}
                </label>
            )}
            
            <div className={`flex items-stretch bg-slate-50 dark:bg-slate-800/50 border rounded-2xl transition-all duration-300 ${
                error ? 'border-red-500/50 ring-2 ring-red-500/10' : 'border-slate-200 dark:border-slate-700 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10'
            }`}>
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
