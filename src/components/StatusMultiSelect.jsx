import React, { useState, useRef, useEffect } from 'react';
import { BOOKING_STATUS_CONFIG } from '../utils/bookingStatusUtils';

const StatusMultiSelect = ({ selectedValues, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Filter out internal or legacy statuses if needed, but here we'll show all from config
    const options = Object.entries(BOOKING_STATUS_CONFIG).map(([key, config]) => ({
        value: key,
        label: config.label,
        icon: config.icon,
        colorClass: config.colorClass
    })).filter(opt => !['ACTIVE', 'PARTIALLY_CANCELLED'].includes(opt.value)); // Matching user's provided list mostly

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const toggleOption = (value) => {
        const newValues = selectedValues.includes(value)
            ? selectedValues.filter(v => v !== value)
            : [...selectedValues, value];
        onChange(newValues);
    };

    const getDisplayText = () => {
        if (selectedValues.length === 0) return 'Status';
        if (selectedValues.length === 1) return options.find(o => o.value === selectedValues[0])?.label || '1 Selected';
        return `${selectedValues.length} Selected`;
    };

    return (
        <div className="relative w-full" ref={dropdownRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full bg-white/20 dark:bg-slate-800/40 border ${isOpen ? 'border-primary/50 ring-2 ring-primary/20 bg-white/40' : 'border-white/40 dark:border-white/5'} rounded-xl py-2 px-2 text-[10px] font-black uppercase tracking-tight flex items-center justify-between transition-all outline-none`}
            >
                <span className="truncate">{getDisplayText()}</span>
                <span className={`material-icons-round text-xs transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>expand_more</span>
            </button>

            {isOpen && (
                <div className="absolute left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl z-[100] overflow-hidden min-w-[160px] animate-in fade-in slide-in-from-top-2">
                    <div className="p-1 max-h-60 overflow-y-auto">
                        {options.map((option) => {
                            const isSelected = selectedValues.includes(option.value);
                            return (
                                <div
                                    key={option.value}
                                    onClick={() => toggleOption(option.value)}
                                    className={`flex items-center gap-2 px-3 py-2 cursor-pointer rounded-lg transition-colors ${isSelected ? 'bg-primary/10 text-primary' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-400'}`}
                                >
                                    <div className={`size-4 rounded border flex items-center justify-center transition-all ${isSelected ? 'bg-primary border-primary text-white' : 'border-slate-300 dark:border-slate-600'}`}>
                                        {isSelected && <span className="material-icons-round text-[10px]">check</span>}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black uppercase tracking-tight leading-none">{option.label}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

export default StatusMultiSelect;
