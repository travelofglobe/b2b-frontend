import React, { useState } from 'react';

/**
 * A professional, high-end tooltip component.
 * Uses glassmorphism and smooth animations to match the premium theme.
 */
const Tooltip = ({ text, children, position = 'top' }) => {
    const [isVisible, setIsVisible] = useState(false);

    const positionClasses = {
        top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
        bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
        left: 'right-full top-1/2 -translate-y-1/2 mr-2',
        right: 'left-full top-1/2 -translate-y-1/2 ml-2'
    };

    return (
        <div 
            className="relative inline-block"
            onMouseEnter={() => setIsVisible(true)}
            onMouseLeave={() => setIsVisible(false)}
        >
            {children}
            
            {isVisible && text && (
                <div className={`absolute z-[100] px-3 py-2.5 rounded-xl tooltip-glass text-white text-[10px] font-black uppercase tracking-widest shadow-2xl pointer-events-none animate-tooltip ${positionClasses[position]}`}>
                    <div className="flex flex-col gap-1 items-start">
                        {Array.isArray(text) ? (
                            text.map((item, i) => <div key={i} className="whitespace-nowrap">{item}</div>)
                        ) : (
                            text.split('\n').map((item, i) => <div key={i} className="whitespace-nowrap">{item}</div>)
                        )}
                    </div>
                    {/* Tiny Arrow */}
                    <div className={`absolute border-4 border-transparent ${
                        position === 'top' ? 'top-full left-1/2 -translate-x-1/2 border-t-[#0f172a] dark:border-t-[#1e293b]' :
                        position === 'bottom' ? 'bottom-full left-1/2 -translate-x-1/2 border-b-[#0f172a] dark:border-b-[#1e293b]' :
                        position === 'left' ? 'left-full top-1/2 -translate-y-1/2 border-l-[#0f172a] dark:border-l-[#1e293b]' :
                        'right-full top-1/2 -translate-y-1/2 border-r-[#0f172a] dark:border-r-[#1e293b]'
                    }`} />
                </div>
            )}
        </div>
    );
};

export default Tooltip;
