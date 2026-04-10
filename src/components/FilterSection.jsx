import React, { useState, useEffect } from 'react';

const FilterSection = ({ title, icon, defaultOpen = true, disabled = false, children }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    // Keep it synced if the requirement changes externally
    useEffect(() => {
        setIsOpen(defaultOpen);
    }, [defaultOpen]);

    return (
        <div className={`border-b border-slate-100 dark:border-slate-800/50 py-4 last:border-0 ${disabled ? 'opacity-50' : ''}`}>
            <button
                onClick={() => !disabled && setIsOpen(!isOpen)}
                className={`w-full flex items-center justify-between group ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
            >
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2 group-hover:text-primary transition-colors">
                    {icon && <span className="material-symbols-outlined text-slate-400 group-hover:text-primary transition-colors text-[20px]">{icon}</span>}
                    {title}
                    {disabled && (
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded ml-1">Soon</span>
                    )}
                </h3>
                {!disabled && (
                    <span className="material-symbols-outlined text-slate-400 group-hover:text-primary transition-transform duration-300" style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0)' }}>
                        expand_more
                    </span>
                )}
            </button>
            {/* The wrapper handles height animation gracefully */}
            <div
                className={`transition-all duration-300 ease-in-out overflow-hidden ${disabled ? 'pointer-events-none' : ''}`}
                style={{ maxHeight: isOpen && !disabled ? '5000px' : '0px', opacity: isOpen && !disabled ? 1 : 0, marginTop: isOpen && !disabled ? '16px' : '0px' }}
            >
                {children}
            </div>
        </div>
    );
};

export default FilterSection;
