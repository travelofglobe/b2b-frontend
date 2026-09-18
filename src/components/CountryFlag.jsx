import React, { useState } from 'react';

/**
 * Converts 2-letter ISO country code to Google Noto Emoji hex pair (e.g. TR -> 1f1f9_1f1f7)
 */
const codeToGoogleEmojiHex = (code) => {
    if (!code || typeof code !== 'string') return null;
    const clean = code.trim().toUpperCase();
    if (clean.length !== 2) return null;
    const c1 = (127397 + clean.charCodeAt(0)).toString(16);
    const c2 = (127397 + clean.charCodeAt(1)).toString(16);
    return `${c1}_${c2}`;
};

/**
 * High-quality Google Noto Color Emoji Country Flag component with fallback.
 * Renders Google's official vector flag icon set.
 */
const CountryFlag = ({ 
    code, 
    name = '', 
    fallbackEmoji = '', 
    size = 'md', 
    variant = 'rounded', // 'rounded' | 'circle' | 'flat'
    className = '' 
}) => {
    const [useFallback, setUseFallback] = useState(false);
    const [hasError, setHasError] = useState(false);

    if (!code) {
        return fallbackEmoji ? <span className="leading-none">{fallbackEmoji}</span> : null;
    }

    const cleanCode = code.toLowerCase().trim();
    const googleHex = codeToGoogleEmojiHex(code);

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
        rounded: 'rounded-[3px] shadow-[0_1px_2px_rgba(0,0,0,0.12)] border border-black/10 dark:border-white/10',
        circle: 'w-5 h-5 rounded-full object-cover shadow-xs border border-black/10',
        flat: 'rounded-none'
    }[variant] || 'rounded-[3px] shadow-[0_1px_2px_rgba(0,0,0,0.12)] border border-black/10 dark:border-white/10';

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

    // Google's official Noto Emoji vector flag SVG
    const flagSrc = (!useFallback && googleHex)
        ? `https://fonts.gstatic.com/s/e/notoemoji/latest/${googleHex}/emoji.svg`
        : `https://flagcdn.com/w40/${cleanCode}.png`;

    return (
        <img
            src={flagSrc}
            alt={name || code}
            loading="lazy"
            decoding="async"
            onError={() => {
                if (!useFallback && googleHex) {
                    setUseFallback(true);
                } else {
                    setHasError(true);
                }
            }}
            className={`inline-block shrink-0 object-contain ${sizeClasses} ${shapeClasses} ${className}`}
        />
    );
};

export default CountryFlag;
