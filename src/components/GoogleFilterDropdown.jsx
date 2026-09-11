import React, { useState, useRef, useEffect } from 'react';

const GoogleFilterDropdown = ({
    icon,
    prefixLabel,
    value,
    onChange,
    options = [],
    defaultValue = 'ALL',
    placeholder = '',
    className = ''
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    const isFiltered = value && value !== defaultValue;
    const selectedOption = options.find(opt => opt.value === value);
    const displayLabel = selectedOption?.label || placeholder || value;

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') setIsOpen(false);
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('keydown', handleKeyDown);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen]);

    const handleSelect = (val) => {
        onChange(val);
        setIsOpen(false);
    };

    const handleClear = (e) => {
        e.stopPropagation();
        onChange(defaultValue);
        setIsOpen(false);
    };

    return (
        <div className={`relative inline-block text-left shrink-0 ${className}`} ref={dropdownRef}>
            <button
                type="button"
                onClick={() => setIsOpen(prev => !prev)}
                className={`group inline-flex items-center gap-1.5 h-8 px-3 rounded-full text-xs font-medium border transition-all cursor-pointer select-none font-roboto shadow-2xs active:scale-[0.98] ${
                    isFiltered
                        ? 'bg-[#e8f0fe] dark:bg-blue-900/30 border-[#1a73e8] dark:border-blue-500 text-[#1a73e8] dark:text-blue-300'
                        : 'bg-white dark:bg-[#202124] border-[#dadce0] dark:border-slate-600 text-[#3c4043] dark:text-slate-300 hover:bg-[#f8f9fa] dark:hover:bg-slate-700/50 hover:border-[#bdc1c6] dark:hover:border-slate-500'
                }`}
                aria-expanded={isOpen}
            >
                {icon && (
                    <span 
                        className={`material-symbols-outlined text-[16px] shrink-0 transition-colors ${
                            isFiltered ? 'text-[#1a73e8] dark:text-blue-300' : 'text-[#5f6368] dark:text-slate-400 group-hover:text-[#202124] dark:group-hover:text-white'
                        }`}
                    >
                        {icon}
                    </span>
                )}

                {prefixLabel && (
                    <span className="text-[#5f6368] dark:text-slate-400 font-normal">
                        {prefixLabel}
                    </span>
                )}

                <span className="truncate max-w-[140px] sm:max-w-[200px]">
                    {displayLabel}
                </span>

                {isFiltered ? (
                    <span
                        role="button"
                        onClick={handleClear}
                        className="ml-0.5 w-4 h-4 rounded-full flex items-center justify-center hover:bg-black/10 dark:hover:bg-white/20 transition-colors cursor-pointer"
                        title="Filtreyi Temizle"
                    >
                        <span className="material-symbols-outlined text-[13px] leading-none">close</span>
                    </span>
                ) : (
                    <span 
                        className={`material-symbols-outlined text-[16px] text-[#70757a] dark:text-slate-400 shrink-0 transition-transform duration-200 ${
                            isOpen ? 'rotate-180 text-[#1a73e8]' : ''
                        }`}
                    >
                        expand_more
                    </span>
                )}
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div 
                    className="absolute left-0 top-full mt-1.5 min-w-[210px] max-w-[300px] max-h-72 overflow-y-auto bg-white dark:bg-[#202124] rounded-2xl border border-[#dadce0] dark:border-slate-700 shadow-[0_4px_24px_rgba(0,0,0,0.18)] py-1.5 z-[210] animate-in fade-in zoom-in-95 duration-150 custom-scrollbar"
                >
                    {options.map((opt) => {
                        const isSelected = opt.value === value;
                        return (
                            <button
                                key={opt.value}
                                type="button"
                                onClick={() => handleSelect(opt.value)}
                                className={`w-[calc(100%-8px)] mx-1 flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-xs text-left transition-colors cursor-pointer ${
                                    isSelected
                                        ? 'bg-[#e8f0fe] dark:bg-blue-900/30 text-[#1a73e8] dark:text-blue-300 font-semibold'
                                        : 'text-[#202124] dark:text-slate-200 hover:bg-[#f1f3f4] dark:hover:bg-slate-700/60'
                                }`}
                            >
                                <div className="flex items-center gap-2 truncate min-w-0">
                                    {opt.icon && (
                                        <span className={`material-symbols-outlined text-[15px] shrink-0 ${isSelected ? 'text-[#1a73e8]' : 'text-[#70757a]'}`}>
                                            {opt.icon}
                                        </span>
                                    )}
                                    <span className="truncate">{opt.label}</span>
                                </div>

                                {isSelected && (
                                    <span className="material-symbols-outlined text-[15px] text-[#1a73e8] dark:text-blue-300 shrink-0 ml-1">
                                        check
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default React.memo(GoogleFilterDropdown);
