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
                className={`w-full bg-white dark:bg-[#303134] border ${isOpen ? 'border-[#1a73e8] ring-1 ring-[#1a73e8]' : 'border-[#dadce0] dark:border-[#5f6368]'} rounded-lg py-1 px-2.5 text-[13px] font-normal flex items-center justify-between transition-all outline-none text-[#202124] dark:text-slate-200 hover:bg-[#f1f3f4] dark:hover:bg-[#3c4043] cursor-pointer`}
            >
                <span className="truncate">{getDisplayText()}</span>
                <span className={`material-symbols-outlined text-[18px] text-[#70757a] dark:text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>arrow_drop_down</span>
            </button>

            {isOpen && (
                <div className="absolute left-0 right-0 mt-1 bg-white dark:bg-[#202124] border border-[#dadce0] dark:border-slate-700 rounded-lg shadow-[0_2px_6px_2px_rgba(60,64,67,0.15),0_1px_2px_0_rgba(60,64,67,0.3)] z-[100] overflow-hidden min-w-[170px] animate-in fade-in duration-150 font-roboto">
                    <div className="py-1 max-h-60 overflow-y-auto custom-scrollbar">
                        {options.map((option) => {
                            const isSelected = selectedValues.includes(option.value);
                            return (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => toggleOption(option.value)}
                                    className={`w-full flex items-center px-3 py-2 text-left transition-colors cursor-pointer text-[13px] font-normal ${
                                        isSelected 
                                            ? 'bg-[#e8f0fe] dark:bg-[#1a73e8]/20 text-[#202124] dark:text-white' 
                                            : 'hover:bg-[#f1f3f4] dark:hover:bg-slate-800 text-[#3c4043] dark:text-slate-200'
                                    }`}
                                >
                                    <span className="w-6 flex items-center justify-start shrink-0">
                                        {isSelected && (
                                            <span className="material-symbols-outlined text-[18px] text-[#3c4043] dark:text-slate-200">check</span>
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
