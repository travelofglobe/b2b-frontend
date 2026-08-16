import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

const GenericMultiSelect = ({ options, selectedValues, onChange, placeholder, disabled = false, icon = null, alignRight = false }) => {
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

    const toggleOption = (value) => {
        const newValues = selectedValues.includes(value)
            ? selectedValues.filter(v => v !== value)
            : [...selectedValues, value];
        onChange(newValues);
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
    );

    const dropdownContent = isOpen ? (
        <div 
            ref={dropdownRef} 
            style={dropdownStyles}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl overflow-hidden max-w-[340px] animate-in fade-in slide-in-from-top-2"
        >
            <div className="p-1.5 border-b border-slate-100 dark:border-slate-800">
                <input
                    type="text"
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg py-1 px-2.5 text-xs font-normal text-slate-700 dark:text-slate-200 outline-none focus:border-primary/50"
                />
            </div>
            <div className="p-1 max-h-64 overflow-y-auto custom-scrollbar">
                {filteredOptions.length === 0 ? (
                    <div className="p-3 text-center text-xs text-slate-500">No options found</div>
                ) : (
                    filteredOptions.map((opt) => {
                        const isSelected = selectedValues.includes(opt.id);
                        return (
                            <div
                                key={opt.id}
                                onClick={() => toggleOption(opt.id)}
                                className={`flex items-center gap-2 px-2.5 py-1.5 cursor-pointer rounded-lg transition-colors ${isSelected ? 'bg-primary/10 text-primary font-semibold' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-300 font-medium'}`}
                            >
                                <div className={`size-3.5 rounded border flex flex-shrink-0 items-center justify-center transition-all ${isSelected ? 'bg-primary border-primary text-white' : 'border-slate-300 dark:border-slate-600'}`}>
                                    {isSelected && <span className="material-icons-round text-[9px]">check</span>}
                                </div>
                                <div className="flex items-center justify-between gap-2 flex-1 overflow-hidden">
                                    <span className="text-xs tracking-normal leading-tight font-medium text-slate-700 dark:text-slate-200 whitespace-normal break-words">
                                        {opt.iconText && <span className="mr-1.5 font-bold text-emerald-600 dark:text-emerald-400">{opt.iconText}</span>}
                                        {opt.name}
                                    </span>
                                    {opt.agencyType && (
                                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-semibold tracking-wider shrink-0 ${
                                            opt.agencyType === 'GSA' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40' : 
                                            opt.agencyType === 'RSA' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/40' : 
                                            'bg-blue-100 text-blue-700 dark:bg-blue-900/40'
                                        }`}>
                                            {opt.agencyType}
                                        </span>
                                    )}
                                </div>
                            </div>
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
                className={`w-full bg-white/20 dark:bg-slate-800/40 border ${isOpen ? 'border-primary/50 ring-2 ring-primary/20 bg-white/40' : 'border-white/40 dark:border-white/5'} rounded-xl py-1.5 px-2 text-xs font-semibold flex items-center justify-between transition-all outline-none text-slate-700 dark:text-slate-200`}
            >
                <span className="flex items-center gap-1.5 truncate">
                    {icon && <span className="material-icons-round text-[14px] text-emerald-600 dark:text-emerald-400">{icon}</span>}
                    {getDisplayText()}
                </span>
                <span className={`material-icons-round text-xs transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>expand_more</span>
            </button>

            {isOpen && createPortal(dropdownContent, document.body)}
        </div>
    );
};

export default GenericMultiSelect;
