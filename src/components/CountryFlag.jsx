import React, { useState } from 'react';

/**
 * High-quality Country Flag component using FlagCDN with fallback.
 * Renders crisp, standardized vector/raster flags with subtle borders.
 */
const CountryFlag = ({ 
    code, 
    name = '', 
    fallbackEmoji = '', 
    size = 'md', 
    variant = 'rounded', // 'rounded' | 'circle' | 'flat'
    className = '' 
}) => {
    const [hasError, setHasError] = useState(false);

    if (!code) {
        return fallbackEmoji ? <span className="leading-none">{fallbackEmoji}</span> : null;
    }

    const cleanCode = code.toLowerCase().trim();

    // Size presets
    const sizeClasses = {
        xs: 'w-4 h-3',
        sm: 'w-4.5 h-3.5',
        md: 'w-5 h-3.5',
        lg: 'w-6 h-4.5',
        xl: 'w-7 h-5'
    }[size] || 'w-5 h-3.5';

    // Variant shape
    const shapeClasses = {
        rounded: 'rounded-[3px] shadow-[0_1px_2px_rgba(0,0,0,0.12)] border border-black/15 dark:border-white/15',
        circle: 'w-5 h-5 rounded-full object-cover shadow-xs border border-black/10',
        flat: 'rounded-none'
    }[variant] || 'rounded-[3px] shadow-[0_1px_2px_rgba(0,0,0,0.12)] border border-black/15 dark:border-white/15';

    if (hasError) {
        if (fallbackEmoji) {
            return <span className="leading-none">{fallbackEmoji}</span>;
        }
        return (
            <span className={`inline-flex items-center justify-center bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-mono text-[9px] font-bold uppercase rounded-[2px] ${sizeClasses} ${className}`}>
                {code.slice(0, 2)}
            </span>
        );
    }

    return (
        <img
            src={`https://flagcdn.com/w40/${cleanCode}.png`}
            srcSet={`https://flagcdn.com/w80/${cleanCode}.png 2x`}
            alt={name || code}
            loading="lazy"
            decoding="async"
            onError={() => setHasError(true)}
            className={`inline-block shrink-0 object-cover ${sizeClasses} ${shapeClasses} ${className}`}
        />
    );
};

export default CountryFlag;
