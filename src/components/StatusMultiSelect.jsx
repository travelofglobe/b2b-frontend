import React, { useState, useRef, useEffect } from 'react';
import { BOOKING_STATUS_CONFIG, getBookingStatusConfig } from '../utils/bookingStatusUtils';

const StatusMultiSelect = ({ selectedValues = [], onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    const options = Object.entries(BOOKING_STATUS_CONFIG).map(([key, config]) => ({
        value: key,
        label: getBookingStatusConfig(key).label,
        icon: config.icon,
        colorClass: config.colorClass
    })).filter(opt => !['ACTIVE', 'PARTIALLY_CANCELLED'].includes(opt.value));

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

    const clearAll = (e) => {
        e.stopPropagation();
        onChange([]);
    };

    const getDisplayText = () => {
        if (!selectedValues || selectedValues.length === 0) return 'Durum / Status';
        if (selectedValues.length === 1) return options.find(o => o.value === selectedValues[0])?.label || '1 Seçildi';
        return `${selectedValues.length} Durum Seçili`;
    };

    return (
        <div className="relative w-full font-roboto" ref={dropdownRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full bg-white dark:bg-[#303134] border ${
                    isOpen 
                        ? 'border-[#1a73e8] ring-2 ring-[#1a73e8]/20' 
                        : 'border-[#dadce0] dark:border-[#5f6368] hover:border-[#1a73e8]/60'
                } rounded-xl py-2 px-3 text-[13px] font-medium flex items-center justify-between transition-all outline-none text-[#202124] dark:text-slate-200 hover:bg-[#f8f9fa] dark:hover:bg-[#383a3e] cursor-pointer shadow-2xs`}
            >
                <div className="flex items-center gap-1.5 truncate">
                    <span className="material-symbols-outlined text-[17px] text-[#70757a]">rule</span>
                    <span className="truncate">{getDisplayText()}</span>
                    {selectedValues.length > 0 && (
                        <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-[#e8f0fe] dark:bg-[#1a73e8]/30 text-[#1a73e8] dark:text-[#8ab4f8]">
                            {selectedValues.length}
                        </span>
                    )}
                </div>
                <span className={`material-symbols-outlined text-[18px] text-[#70757a] dark:text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
                    arrow_drop_down
                </span>
            </button>

            {isOpen && (
                <div className="absolute left-0 mt-1.5 w-64 bg-white dark:bg-[#28292c] border border-[#dadce0] dark:border-[#3c4043] rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.12)] z-[100] overflow-hidden animate-in fade-in duration-150">
                    <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-[#dadce0] dark:border-[#3c4043] bg-[#f8f9fa] dark:bg-[#202124]">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-[#5f6368] dark:text-slate-400">
                            Rezervasyon Durumu
                        </span>
                        {selectedValues.length > 0 && (
                            <button
                                type="button"
                                onClick={clearAll}
                                className="text-[11px] font-semibold text-[#1a73e8] dark:text-[#8ab4f8] hover:underline cursor-pointer"
                            >
                                Temizle
                            </button>
                        )}
                    </div>
                    <div className="p-1.5 max-h-64 overflow-y-auto custom-scrollbar space-y-0.5">
                        {options.map((option) => {
                            const isSelected = selectedValues.includes(option.value);
                            return (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => toggleOption(option.value)}
                                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-left transition-colors cursor-pointer text-[13px] font-medium ${
                                        isSelected 
                                            ? 'bg-[#e8f0fe] dark:bg-[#1a73e8]/20 text-[#1a73e8] dark:text-[#8ab4f8]' 
                                            : 'hover:bg-[#f1f3f4] dark:hover:bg-[#383a3e] text-[#3c4043] dark:text-slate-200'
                                    }`}
                                >
                                    <div className="flex items-center gap-2 truncate">
                                        <span className="material-symbols-outlined text-[17px] text-[#70757a] dark:text-slate-400">
                                            {option.icon}
                                        </span>
                                        <span className="truncate">{option.label}</span>
                                    </div>
                                    <div className={`size-4.5 rounded flex items-center justify-center transition-all ${
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
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

export default StatusMultiSelect;
