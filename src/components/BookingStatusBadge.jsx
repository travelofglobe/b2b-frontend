import React from 'react';
import { getBookingStatusConfig } from '../utils/bookingStatusUtils';

/**
 * BookingStatusBadge Component
 * Displays a formatted badge for booking statuses with consistent styling.
 * 
 * @param {string} status - The booking status enum value
 * @param {string} className - Optional additional classes
 * @param {boolean} showIcon - Whether to show the icon (default: false to keep it clean in tables)
 */
const BookingStatusBadge = ({ status, className = '', showIcon = false }) => {
    const config = getBookingStatusConfig(status);

    return (
        <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider whitespace-nowrap align-middle ${config.colorClass} ${className}`}
            title={`Status: ${config.label}`}
        >
            {showIcon && (
                <span className="material-icons-round text-[14px] leading-none">
                    {config.icon}
                </span>
            )}
            {config.label}
        </span>
    );
};

export default BookingStatusBadge;
