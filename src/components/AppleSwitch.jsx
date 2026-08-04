import React from 'react';

/**
 * AppleSwitch Component
 * An iOS-styled toggle switch built with React and Tailwind CSS.
 * 
 * @param {boolean} checked - Current toggle state
 * @param {function} onChange - Callback function when state changes: (checked: boolean, e: Event) => void
 * @param {boolean} [disabled=false] - Disable interaction
 * @param {'sm' | 'md' | 'lg'} [size='md'] - Size of the switch
 * @param {string} [label] - Optional text label beside switch
 * @param {string} [className] - Additional wrapper class
 */
const AppleSwitch = ({
    checked = false,
    onChange,
    disabled = false,
    size = 'md',
    label,
    className = '',
    id,
    name,
    ...props
}) => {
    const handleToggle = (e) => {
        if (disabled) return;
        if (onChange) {
            onChange(!checked, e);
        }
    };

    const sizeClasses = {
        sm: {
            track: 'w-9 h-5',
            thumb: 'w-4 h-4',
            translate: 'translate-x-4',
            translateOff: 'translate-x-0.5',
        },
        md: {
            track: 'w-11 h-6',
            thumb: 'w-5 h-5',
            translate: 'translate-x-5',
            translateOff: 'translate-x-0.5',
        },
        lg: {
            track: 'w-14 h-7.5',
            thumb: 'w-6.5 h-6.5',
            translate: 'translate-x-6.5',
            translateOff: 'translate-x-0.5',
        }
    };

    const currentSize = sizeClasses[size] || sizeClasses.md;

    return (
        <label
            className={`inline-flex items-center gap-2.5 cursor-pointer select-none ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
        >
            <button
                type="button"
                role="switch"
                aria-checked={checked}
                id={id}
                name={name}
                disabled={disabled}
                onClick={handleToggle}
                className={`relative inline-flex shrink-0 ${currentSize.track} items-center rounded-full p-0.5 transition-colors duration-300 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 ${
                    checked
                        ? 'bg-[#10B981] shadow-inner'
                        : 'bg-[#E9E9EA] dark:bg-[#39393D]'
                }`}
                {...props}
            >
                <span
                    className={`pointer-events-none inline-block ${currentSize.thumb} transform rounded-full bg-white shadow-[0_2px_5px_rgba(0,0,0,0.22),0_1px_2px_rgba(0,0,0,0.1)] transition-transform duration-300 cubic-bezier(0.4,0,0.2,1) ${
                        checked ? currentSize.translate : currentSize.translateOff
                    }`}
                />
            </button>
            {label && (
                <span className="text-xs font-medium text-slate-700 dark:text-slate-200">
                    {label}
                </span>
            )}
        </label>
    );
};

export default AppleSwitch;
