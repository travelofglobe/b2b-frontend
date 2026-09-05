/**
 * Booking Status Configuration and Helpers
 * Maps BookingStatusEnum values to UI labels and styling classes across all 12 supported languages.
 */

const STATUS_TRANSLATIONS = {
    NEW: {
        en: 'New', tr: 'Yeni', ar: 'جديد', es: 'Nuevo', ru: 'Новый', zh: '新订单', ja: '新規', fa: 'جدید', fr: 'Nouveau', it: 'Nuovo', el: 'Νέο', pt: 'Novo'
    },
    CONFIRMED: {
        en: 'Confirmed', tr: 'Onaylandı', ar: 'مؤكد', es: 'Confirmado', ru: 'Подтверждено', zh: '已确认', ja: '確認済み', fa: 'تایید شده', fr: 'Confirmé', it: 'Confermato', el: 'Επιβεβαιωμένο', pt: 'Confirmado'
    },
    ERROR: {
        en: 'Error', tr: 'Hata', ar: 'خطأ', es: 'Error', ru: 'Ошибка', zh: '错误', ja: 'エラー', fa: 'خطا', fr: 'Erreur', it: 'Errore', el: 'Σφάλμα', pt: 'Erro'
    },
    PARTIALLY_CANCELLED: {
        en: 'Partially Cancelled', tr: 'Kısmen İptal', ar: 'ملغى جزئياً', es: 'Parcialmente Cancelado', ru: 'Частично отменено', zh: '部分取消', ja: '一部キャンセル', fa: 'لغو جزئی', fr: 'Partiellement Annulé', it: 'Parzialmente Annullato', el: 'Μερικώς Ακυρωμένο', pt: 'Parcialmente Cancelado'
    },
    CANCELLED: {
        en: 'Cancelled', tr: 'İptal Edildi', ar: 'ملغى', es: 'Cancelado', ru: 'Отменено', zh: '已取消', ja: 'キャンセル済み', fa: 'لغو شده', fr: 'Annulé', it: 'Annullato', el: 'Ακυρωμένο', pt: 'Cancelado'
    },
    CANCELLED_WITH_PENALTY: {
        en: 'Cancelled (with Penalty)', tr: 'Cezalı İptal', ar: 'ملغى مع غرامة', es: 'Cancelado con penalización', ru: 'Отменено со штрафом', zh: '扣费取消', ja: '違約金付きキャンセル', fa: 'لغو با جریمه', fr: 'Annulé avec pénalité', it: 'Annullato con penale', el: 'Ακυρωμένο με χρέωση', pt: 'Cancelado com penalidade'
    },
    ACTIVE: {
        en: 'Active', tr: 'Aktif', ar: 'نشط', es: 'Activo', ru: 'Активный', zh: '活跃', ja: '有効', fa: 'فعال', fr: 'Actif', it: 'Attivo', el: 'Ενεργό', pt: 'Ativo'
    },
    SUCCESS: {
        en: 'Success', tr: 'Başarılı', ar: 'ناجح', es: 'Exitoso', ru: 'Успешно', zh: '成功', ja: '成功', fa: 'موفق', fr: 'Succès', it: 'Successo', el: 'Επιτυχία', pt: 'Sucesso'
    },
    FAILED: {
        en: 'Failed', tr: 'Başarısız', ar: 'فاشل', es: 'Fallido', ru: 'Неуспешно', zh: '失败', ja: '失敗', fa: 'ناموفق', fr: 'Échoué', it: 'Fallito', el: 'Αποτυχία', pt: 'Falhou'
    },
    UNKNOWN: {
        en: 'Unknown', tr: 'Bilinmiyor', ar: 'غير معروف', es: 'Desconocido', ru: 'Неизвестно', zh: '未知', ja: '不明', fa: 'نامشخص', fr: 'Inconnu', it: 'Sconosciuto', el: 'Άγνωστο', pt: 'Desconhecido'
    }
};

export const BOOKING_STATUS_CONFIG = {
    NEW: {
        colorClass: 'bg-sky-50 text-sky-600 border border-sky-200/60 dark:bg-sky-950/40 dark:text-sky-400 dark:border-sky-800/50',
        icon: 'fiber_new'
    },
    CONFIRMED: {
        colorClass: 'bg-emerald-50 text-emerald-600 border border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/50',
        icon: 'check_circle'
    },
    ERROR: {
        colorClass: 'bg-rose-50 text-rose-600 border border-rose-200/60 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800/50',
        icon: 'error'
    },
    PARTIALLY_CANCELLED: {
        colorClass: 'bg-amber-50 text-amber-600 border border-amber-200/60 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/50',
        icon: 'warning'
    },
    CANCELLED: {
        colorClass: 'bg-slate-100/70 text-slate-500 border border-slate-200/60 dark:bg-slate-900/50 dark:text-slate-400 dark:border-slate-800/50',
        icon: 'cancel'
    },
    CANCELLED_WITH_PENALTY: {
        colorClass: 'bg-orange-50 text-orange-600 border border-orange-200/60 dark:bg-orange-950/40 dark:text-orange-400 dark:border-orange-800/50',
        icon: 'money_off'
    },
    ACTIVE: {
        colorClass: 'bg-emerald-50 text-emerald-600 border border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/50',
        icon: 'check'
    },
    SUCCESS: {
        colorClass: 'bg-emerald-50 text-emerald-600 border border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/50',
        icon: 'check_circle'
    },
    FAILED: {
        colorClass: 'bg-rose-50 text-rose-600 border border-rose-200/60 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800/50',
        icon: 'error'
    }
};

const DEFAULT_STATUS_CONFIG = {
    colorClass: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    icon: 'help_outline'
};

const getActiveLang = (lang) => {
    if (lang) return (lang || 'en').split('-')[0].toLowerCase();
    const stored = typeof localStorage !== 'undefined' ? (localStorage.getItem('language') || localStorage.getItem('i18nextLng') || 'en') : 'en';
    return (stored || 'en').split('-')[0].toLowerCase();
};

/**
 * Get configuration for a specific status
 * @param {string} status - The booking status enum value
 * @param {string} [lang] - Language code
 * @returns {object} - The configuration object { label, colorClass, icon }
 */
export const getBookingStatusConfig = (status, lang) => {
    const l = getActiveLang(lang);
    const trans = STATUS_TRANSLATIONS[status] || STATUS_TRANSLATIONS.UNKNOWN;
    const label = trans[l] || trans.en || status || 'Unknown';
    const baseConfig = BOOKING_STATUS_CONFIG[status] || DEFAULT_STATUS_CONFIG;
    return {
        ...baseConfig,
        label
    };
};

/**
 * Get display label for a status
 * @param {string} status 
 * @param {string} [lang]
 * @returns {string}
 */
export const getBookingStatusLabel = (status, lang) => {
    return getBookingStatusConfig(status, lang).label;
};

/**
 * Get tailwind color classes for a status
 * @param {string} status 
 * @returns {string}
 */
export const getBookingStatusColor = (status) => {
    return (BOOKING_STATUS_CONFIG[status] || DEFAULT_STATUS_CONFIG).colorClass;
};
