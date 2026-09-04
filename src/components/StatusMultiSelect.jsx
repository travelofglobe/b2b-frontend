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
                <div className="absolute left-0 right-0 mt-1 bg-white dark:bg-[#202124] border border-[#dadce0] dark:border-slate-700 rounded-lg shadow-[0_2px_6px_2px_rgba(60,64,67,0.15),0_1px_2px_0_rgba(60,64,67,0.3)] z-[100] overflow-hidden min-w-[170px] animate-in fade-in duration-150">
                    <div className="py-1 max-h-60 overflow-y-auto custom-scrollbar">
                        {options.map((option) => {
                            const isSelected = selectedValues.includes(option.value);
                            return (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => toggleOption(option.value)}
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
                                    <span className="truncate flex-1">{option.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

export default StatusMultiSelect;
