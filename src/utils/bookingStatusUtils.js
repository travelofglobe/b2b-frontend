/**
 * Booking Status Configuration and Helpers
 * Maps BookingStatusEnum values to UI labels and styling classes.
 */

export const BOOKING_STATUS_CONFIG = {
    NEW: {
        label: 'New',
        colorClass: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
        icon: 'fiber_new'
    },
    CONFIRMED: {
        label: 'Confirmed',
        colorClass: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
        icon: 'check_circle'
    },
    ERROR: {
        label: 'Error',
        colorClass: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
        icon: 'error'
    },
    PARTIALLY_CANCELLED: {
        label: 'Partially Cancelled',
        colorClass: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
        icon: 'warning'
    },
    CANCELLED: {
        label: 'Cancelled',
        colorClass: 'bg-slate-100 text-slate-600 dark:bg-slate-900/30 dark:text-slate-400',
        icon: 'cancel'
    },
    CANCELLED_WITH_PENALTY: {
        label: 'Cancelled (Penalty)',
        colorClass: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
        icon: 'money_off'
    },
    // Fallback/Legacy statuses if any
    ACTIVE: {
        label: 'Active',
        colorClass: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
        icon: 'check'
    }
};

const DEFAULT_STATUS_CONFIG = {
    label: 'Unknown',
    colorClass: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    icon: 'help_outline'
};

/**
 * Get configuration for a specific status
 * @param {string} status - The booking status enum value
 * @returns {object} - The configuration object { label, colorClass, icon }
 */
export const getBookingStatusConfig = (status) => {
    if (!status) return DEFAULT_STATUS_CONFIG;
    return BOOKING_STATUS_CONFIG[status] || { ...DEFAULT_STATUS_CONFIG, label: status };
};

/**
 * Get display label for a status
 * @param {string} status 
 * @returns {string}
 */
export const getBookingStatusLabel = (status) => {
    return getBookingStatusConfig(status).label;
};

/**
 * Get tailwind color classes for a status
 * @param {string} status 
 * @returns {string}
 */
export const getBookingStatusColor = (status) => {
    return getBookingStatusConfig(status).colorClass;
};
