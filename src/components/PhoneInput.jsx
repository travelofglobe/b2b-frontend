import React, { useState, useRef, useEffect } from 'react';
import CountryFlag from './CountryFlag';

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
    
    const initialCountry = countries.find(c => value?.startsWith(c.code)) || countries[0];
    const [selectedCountry, setSelectedCountry] = useState(initialCountry);
    const [phoneNumber, setPhoneNumber] = useState(() => {
        if (!value) return '';
        const matching = countries.find(c => value.startsWith(c.code));
        return matching ? value.replace(matching.code, '').trim() : value;
    });

    const filteredCountries = countries.filter(c => 
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.code.includes(searchTerm) ||
        (c.id && c.id.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const toggleOpen = () => {
        setIsOpen(!isOpen);
        setSearchTerm('');
        setActiveIndex(-1);
    };

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
        setPhoneNumber(val);
        onChange(`${selectedCountry.code || selectedCountry.dial_code} ${val}`);
    };

    const handleCountrySelect = (country) => {
        setSelectedCountry(country);
        setIsOpen(false);
        onChange(`${country.code || country.dial_code} ${phoneNumber}`);
    };

    return (
        <div>
            {label && (
                <label className="text-xs font-medium text-[#5f6368] dark:text-slate-400 mb-1 block">
                    {label}
                </label>
            )}
            <div className="relative" ref={dropdownRef}>
                <div className={`flex items-stretch h-10 bg-white dark:bg-[#303134] border rounded-[4px] transition-all ${
                    error ? 'border-[#d93025]' : 'border-[#dadce0] dark:border-slate-600 focus-within:border-[#1a73e8] focus-within:ring-1 focus-within:ring-[#1a73e8]'
                }`}>
                    <button
                        type="button"
                        ref={buttonRef}
                        onClick={toggleOpen}
                        className="flex items-center gap-1.5 px-2.5 border-r border-[#dadce0] dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors rounded-l-[4px] shrink-0 cursor-pointer"
                    >
                        <CountryFlag code={selectedCountry.code || selectedCountry.id} name={selectedCountry.name} fallbackEmoji={selectedCountry.flag || selectedCountry.emoji} size="sm" />
                        <span className="text-xs font-normal text-[#202124] dark:text-white">{selectedCountry.code}</span>
                        <span className={`material-symbols-outlined text-[18px] text-[#5f6368] dark:text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
                            expand_more
                        </span>
                    </button>

                    {/* Number Input */}
                    <input
                        type="text"
                        value={phoneNumber}
                        onChange={handlePhoneChange}
                        className="flex-1 bg-transparent px-3 outline-none text-xs text-[#202124] dark:text-white placeholder:text-[#70757a]"
                        placeholder="5__ ___ __ __"
                    />
                </div>

                {/* Dropdown */}
                {isOpen && (
                    <div className={`absolute left-0 mt-1 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[4px] shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200`}>
                        <div className="p-2 border-b border-slate-100 dark:border-slate-800">
                            <div className="relative">
                                <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">search</span>
                                <input
                                    type="text"
                                    placeholder="Search country..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 pl-8 pr-3 py-1.5 rounded-[4px] text-xs focus:outline-none focus:border-primary"
                                    autoFocus
                                />
                            </div>
                        </div>
                        <div className="max-h-56 overflow-y-auto custom-scrollbar py-1">
                            {filteredCountries.map((country, index) => (
                                <button
                                    key={country.code || country.id}
                                    type="button"
                                    onClick={() => handleCountrySelect(country)}
                                    className={`w-full flex items-center justify-between px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-xs cursor-pointer ${
                                        (selectedCountry.code === country.code) ? 'bg-primary/5 dark:bg-primary/10' : ''
                                    } ${activeIndex === index ? 'bg-slate-100 dark:bg-slate-800' : ''}`}
                                >
                                    <div className="flex items-center gap-2">
                                        <CountryFlag code={country.code || country.id} name={country.name} fallbackEmoji={country.flag || country.emoji} size="sm" />
                                        <span className="font-semibold text-slate-700 dark:text-slate-300">{country.dial_code || country.code}</span>
                                        <span className="font-medium text-slate-500 dark:text-slate-400">{country.name}</span>
                                    </div>
                                    {selectedCountry.code === country.code && (
                                        <span className="material-symbols-outlined text-primary text-sm">check</span>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PhoneInput;
