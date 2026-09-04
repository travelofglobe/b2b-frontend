import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

const GenericMultiSelect = ({ options, selectedValues, onChange, placeholder, disabled = false, icon = null, alignRight = false, closeOnSelect = true }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);
    const buttonRef = useRef(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [dropdownStyles, setDropdownStyles] = useState({});

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target) &&
                buttonRef.current && !buttonRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const updatePosition = () => {
        if (isOpen && buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            setDropdownStyles({
                position: 'fixed',
                top: `${rect.bottom + 4}px`,
                left: alignRight ? 'auto' : `${rect.left}px`,
                right: alignRight ? `${window.innerWidth - rect.right}px` : 'auto',
                width: `${Math.max(280, rect.width)}px`,
                zIndex: 9999
            });
        }
    };

    useEffect(() => {
        if (isOpen) {
            updatePosition();
            window.addEventListener('scroll', updatePosition, true);
            window.addEventListener('resize', updatePosition);
            return () => {
                window.removeEventListener('scroll', updatePosition, true);
                window.removeEventListener('resize', updatePosition);
            };
        }
    }, [isOpen, alignRight]);

    useEffect(() => {
        if (!isOpen) {
            setSearchTerm('');
        }
    }, [isOpen]);

    const toggleOption = (value) => {
        const newValues = selectedValues.includes(value)
            ? selectedValues.filter(v => v !== value)
            : [...selectedValues, value];
        onChange(newValues);
        if (closeOnSelect) {
            setIsOpen(false);
        }
    };

    const getDisplayText = () => {
        if (!selectedValues || selectedValues.length === 0) return placeholder;
        if (selectedValues.length === 1) {
            const opt = options.find(a => a.id === selectedValues[0]);
            return opt ? opt.name : '1 Selected';
        }
        return `${selectedValues.length} Selected`;
    };

    const filteredOptions = options.filter(opt => 
        (opt.name || '').toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a, b) => {
        const aSelected = selectedValues.includes(a.id);
        const bSelected = selectedValues.includes(b.id);
        if (aSelected && !bSelected) return -1;
        if (!aSelected && bSelected) return 1;
        return 0;
    });

    const dropdownContent = isOpen ? (
        <div 
            ref={dropdownRef} 
            style={dropdownStyles}
            className="bg-white dark:bg-[#28292c] border border-[#dadce0] dark:border-[#3c4043] rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.15)] overflow-hidden max-w-[340px] animate-in fade-in duration-150 font-roboto"
        >
            <div className="p-2.5 border-b border-[#dadce0] dark:border-[#3c4043] bg-[#f8f9fa] dark:bg-[#202124]">
                <div className="flex items-center gap-2 h-9 px-3 bg-[#f1f3f4] dark:bg-[#202124] rounded-xl border border-transparent focus-within:border-[#1a73e8] focus-within:bg-white dark:focus-within:bg-[#202124] focus-within:ring-2 focus-within:ring-[#1a73e8]/20 transition-all">
                    <span className="material-symbols-outlined text-[18px] text-[#70757a] dark:text-slate-400 shrink-0">search</span>
                    <input
                        type="text"
                        placeholder="Ara..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-transparent border-none outline-none focus:outline-none focus:ring-0 p-0 text-[13px] font-normal text-[#202124] dark:text-white placeholder-[#70757a]"
                    />
                </div>
            </div>
            <div className="p-1.5 max-h-64 overflow-y-auto custom-scrollbar font-roboto space-y-0.5">
                {filteredOptions.length === 0 ? (
                    <div className="p-3 text-center text-[13px] text-[#70757a] dark:text-slate-400">Sonuç bulunamadı</div>
                ) : (
                    filteredOptions.map((opt) => {
                        const isSelected = selectedValues.includes(opt.id);
                        return (
                            <button
                                key={opt.id}
                                type="button"
                                onClick={() => toggleOption(opt.id)}
                                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-left transition-colors cursor-pointer text-[13px] font-medium ${
                                    isSelected 
                                        ? 'bg-[#e8f0fe] dark:bg-[#1a73e8]/20 text-[#1a73e8] dark:text-[#8ab4f8]' 
                                        : 'hover:bg-[#f1f3f4] dark:hover:bg-[#383a3e] text-[#3c4043] dark:text-slate-200'
                                }`}
                            >
                                <div className="flex items-center gap-2 flex-1 overflow-hidden mr-2">
                                    <span className="truncate">
                                        {opt.iconText && <span className="mr-1.5 font-bold text-emerald-600 dark:text-emerald-400">{opt.iconText}</span>}
                                        {opt.name}
                                    </span>
                                    {opt.agencyType && (
                                        <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase shrink-0 ${
                                            opt.agencyType === 'GSA' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300' : 
                                            opt.agencyType === 'RSA' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300' : 
                                            'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300'
                                        }`}>
                                            {opt.agencyType}
                                        </span>
                                    )}
                                </div>
                                <div className={`size-4.5 rounded flex items-center justify-center shrink-0 transition-all ${
                                    isSelected 
                                        ? 'bg-[#1a73e8] text-white' 
                                        : 'border border-[#dadce0] dark:border-[#5f6368]'
                                }`}>
                                    {isSelected && (
                                        <span className="material-symbols-outlined text-[14px]">check</span>
                                    )}
                                </div>
                            </button>
                        );
                    })
                )}
            </div>
        </div>
    ) : null;

    return (
        <div className={`relative w-full font-roboto ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
            <button
                ref={buttonRef}
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full bg-white dark:bg-[#303134] border ${
                    isOpen 
                        ? 'border-[#1a73e8] ring-2 ring-[#1a73e8]/20' 
                        : 'border-[#dadce0] dark:border-[#5f6368] hover:border-[#1a73e8]/60'
                } rounded-xl py-2 px-3 text-[13px] font-medium flex items-center justify-between transition-all outline-none text-[#202124] dark:text-slate-200 hover:bg-[#f8f9fa] dark:hover:bg-[#383a3e] cursor-pointer shadow-2xs`}
            >
                <span className="flex items-center gap-1.5 truncate">
                    {icon && <span className="material-symbols-outlined text-[17px] text-emerald-600 dark:text-emerald-400">{icon}</span>}
                    <span className="truncate">{getDisplayText()}</span>
                    {selectedValues && selectedValues.length > 0 && (
                        <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-[#e8f0fe] dark:bg-[#1a73e8]/30 text-[#1a73e8] dark:text-[#8ab4f8]">
                            {selectedValues.length}
                        </span>
                    )}
                </span>
                <span className={`material-symbols-outlined text-[18px] text-[#70757a] dark:text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>arrow_drop_down</span>
            </button>

            {isOpen && createPortal(dropdownContent, document.body)}
        </div>
    );
};

export default GenericMultiSelect;
