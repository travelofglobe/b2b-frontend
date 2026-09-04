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
            className="bg-white dark:bg-[#202124] border border-[#dadce0] dark:border-slate-700 rounded-lg shadow-[0_2px_6px_2px_rgba(60,64,67,0.15),0_1px_2px_0_rgba(60,64,67,0.3)] overflow-hidden max-w-[340px] animate-in fade-in duration-150"
        >
            <div className="p-2 border-b border-[#dadce0] dark:border-slate-700">
                <div className="flex items-center gap-2 h-8 px-2.5 bg-[#f1f3f4] dark:bg-slate-800 rounded border border-transparent focus-within:border-[#1a73e8] focus-within:bg-white dark:focus-within:bg-slate-900 transition-colors">
                    <span className="material-symbols-outlined text-[16px] text-[#5f6368] dark:text-slate-400 shrink-0">search</span>
                    <input
                        type="text"
                        placeholder="Ara..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-transparent border-none outline-none focus:outline-none focus:ring-0 p-0 text-xs text-[#202124] dark:text-white placeholder-[#70757a]"
                    />
                </div>
            </div>
            <div className="py-1 max-h-64 overflow-y-auto custom-scrollbar">
                {filteredOptions.length === 0 ? (
                    <div className="p-3 text-center text-xs text-[#5f6368] dark:text-slate-400">Sonuç bulunamadı</div>
                ) : (
                    filteredOptions.map((opt) => {
                        const isSelected = selectedValues.includes(opt.id);
                        return (
                            <button
                                key={opt.id}
                                type="button"
                                onClick={() => toggleOption(opt.id)}
                                className={`w-full flex items-center px-3 py-2 text-left transition-colors cursor-pointer text-xs ${
                                    isSelected 
                                        ? 'bg-[#e8f0fe] dark:bg-blue-900/30 text-[#1a73e8] dark:text-blue-300 font-medium' 
                                        : 'hover:bg-[#f1f3f4] dark:hover:bg-slate-800 text-[#3c4043] dark:text-slate-200 font-normal'
                                }`}
                            >
                                <span className="w-5 flex items-center justify-start shrink-0">
                                    {isSelected && (
                                        <span className="material-symbols-outlined text-[16px] text-[#1a73e8] dark:text-blue-300">check</span>
                                    )}
                                </span>
                                <div className="flex items-center justify-between gap-2 flex-1 overflow-hidden">
                                    <span className="text-xs tracking-normal leading-tight truncate">
                                        {opt.iconText && <span className="mr-1.5 font-bold text-emerald-600 dark:text-emerald-400">{opt.iconText}</span>}
                                        {opt.name}
                                    </span>
                                    {opt.agencyType && (
                                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-medium tracking-wider shrink-0 ${
                                            opt.agencyType === 'GSA' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40' : 
                                            opt.agencyType === 'RSA' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/40' : 
                                            'bg-blue-100 text-blue-700 dark:bg-blue-900/40'
                                        }`}>
                                            {opt.agencyType}
                                        </span>
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
        <div className={`relative w-full ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
            <button
                ref={buttonRef}
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full bg-white dark:bg-[#303134] border ${isOpen ? 'border-[#1a73e8] ring-2 ring-[#1a73e8]/20' : 'border-[#dadce0] dark:border-[#5f6368]'} rounded-lg py-1 px-2 text-xs font-medium flex items-center justify-between transition-all outline-none text-[#202124] dark:text-slate-200 shadow-xs hover:border-[#1a73e8]`}
            >
                <span className="flex items-center gap-1.5 truncate">
                    {icon && <span className="material-icons-round text-[14px] text-emerald-600 dark:text-emerald-400">{icon}</span>}
                    {getDisplayText()}
                </span>
                <span className={`material-symbols-outlined text-[16px] text-[#5f6368] dark:text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>expand_more</span>
            </button>

            {isOpen && createPortal(dropdownContent, document.body)}
        </div>
    );
};

export default GenericMultiSelect;
