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
                className={`w-full bg-white dark:bg-[#303134] border ${isOpen ? 'border-[#1a73e8] ring-2 ring-[#1a73e8]/20' : 'border-[#dadce0] dark:border-[#5f6368]'} rounded-lg py-1 px-2 text-xs font-medium flex items-center justify-between transition-all outline-none text-[#202124] dark:text-slate-200 shadow-xs hover:border-[#1a73e8]`}
            >
                <span className="truncate">{getDisplayText()}</span>
                <span className={`material-symbols-outlined text-[16px] text-[#5f6368] dark:text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>expand_more</span>
            </button>

            {isOpen && (
                <div className="absolute left-0 right-0 mt-1 bg-white dark:bg-[#303134] border border-[#dadce0] dark:border-[#5f6368] rounded-xl shadow-xl z-[100] overflow-hidden min-w-[170px] animate-in fade-in slide-in-from-top-1">
                    <div className="p-1 max-h-60 overflow-y-auto">
                        {options.map((option) => {
                            const isSelected = selectedValues.includes(option.value);
                            return (
                                <div
                                    key={option.value}
                                    onClick={() => toggleOption(option.value)}
                                    className={`flex items-center gap-2 px-2.5 py-1.5 cursor-pointer rounded-lg transition-colors ${isSelected ? 'bg-[#e8f0fe] dark:bg-[#1a73e8]/20 text-[#1a73e8] dark:text-[#8ab4f8] font-semibold' : 'hover:bg-[#f1f3f4] dark:hover:bg-[#3c4043] text-[#202124] dark:text-slate-200 font-medium'}`}
                                >
                                    <div className={`size-3.5 rounded border flex items-center justify-center transition-all ${isSelected ? 'bg-primary border-primary text-white' : 'border-slate-300 dark:border-slate-600'}`}>
                                        {isSelected && <span className="material-icons-round text-[9px]">check</span>}
                                    </div>
                                    <span className="text-xs tracking-normal leading-none">{option.label}</span>
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
