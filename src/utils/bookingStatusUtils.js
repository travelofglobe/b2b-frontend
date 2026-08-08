/**
 * Booking Status Configuration and Helpers
 * Maps BookingStatusEnum values to UI labels and styling classes.
 */

export const BOOKING_STATUS_CONFIG = {
    NEW: {
        label: 'New',
        colorClass: 'bg-sky-50 text-sky-600 border border-sky-200/60 dark:bg-sky-950/40 dark:text-sky-400 dark:border-sky-800/50',
        icon: 'fiber_new'
    },
    CONFIRMED: {
        label: 'Confirmed',
        colorClass: 'bg-emerald-50 text-emerald-600 border border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/50',
        icon: 'check_circle'
    },
    ERROR: {
        label: 'Error',
        colorClass: 'bg-rose-50 text-rose-600 border border-rose-200/60 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800/50',
        icon: 'error'
    },
    PARTIALLY_CANCELLED: {
        label: 'Partially Cancelled',
        colorClass: 'bg-amber-50 text-amber-600 border border-amber-200/60 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/50',
        icon: 'warning'
    },
    CANCELLED: {
        label: 'Cancelled',
        colorClass: 'bg-slate-100/70 text-slate-500 border border-slate-200/60 dark:bg-slate-900/50 dark:text-slate-400 dark:border-slate-800/50',
        icon: 'cancel'
    },
    CANCELLED_WITH_PENALTY: {
        label: 'Cancelled (with Penalty)',
        colorClass: 'bg-orange-50 text-orange-600 border border-orange-200/60 dark:bg-orange-950/40 dark:text-orange-400 dark:border-orange-800/50',
        icon: 'money_off'
    },
    // Fallback/Legacy statuses if any
    ACTIVE: {
        label: 'Active',
        colorClass: 'bg-emerald-50 text-emerald-600 border border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/50',
        icon: 'check'
    },
    SUCCESS: {
        label: 'Success',
        colorClass: 'bg-emerald-50 text-emerald-600 border border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/50',
        icon: 'check_circle'
    },
    FAILED: {
        label: 'Failed',
        colorClass: 'bg-rose-50 text-rose-600 border border-rose-200/60 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800/50',
        icon: 'error'
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
