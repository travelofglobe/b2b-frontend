/**
 * Board Type Mapping and Translations
 */

export const BOARD_TYPES = {
    BB: {
        code: 'BB',
        description: 'Konaklama ve kahvaltı dahildir. Diğer öğünler yoktur.',
        translations: {"ar": "مبيت وإفطار", "de": "Übernachtung mit Frühstück", "en": "Bed and Breakfast", "es": "Alojamiento y desayuno", "fr": "Chambre avec petit déjeuner", "it": "Pernottamento e colazione", "ru": "Ночлег и завтрак", "tr": "Oda Kahvaltı"}
    },
    HB: {
        code: 'HB',
        description: 'Konaklama, kahvaltı ve akşam yemeği dahildir. Öğle yemeği yoktur.',
        translations: {"ar": "نصف إقامة", "de": "Halbpension", "en": "Half Board", "es": "Media pensión", "fr": "Demi-pension", "it": "Mezza pensione", "ru": "Полупансион", "tr": "Yarım Pansiyon"}
    },
    FB: {
        code: 'FB',
        description: 'Konaklama, kahvaltı, öğle yemeği ve akşam yemeği dahildir. İçecekler genellikle dahil değildir.',
        translations: {"ar": "إقامة كاملة", "de": "Vollpension", "en": "Full Board", "es": "Pensión completa", "fr": "Pension complète", "it": "Pensione completa", "ru": "Полный пансион", "tr": "Tam Pansiyon"}
    },
    AI: {
        code: 'AI',
        description: 'Konaklama, üç öğün yemek ve sınırsız yerli içecekler dahildir.',
        translations: {"ar": "شامل كلياً", "de": "All Inclusive", "en": "All Inclusive", "es": "Todo incluido", "fr": "Tout compris", "it": "Tutto incluso", "ru": "Всё включено", "tr": "Her Şey Dahil"}
    },
    UAI: {
        code: 'UAI',
        description: 'Konaklama, tüm öğünler ve yerli/yabancı içecekler 24 saat boyunca dahildirrr.',
        translations: {"ar": "شامل كلياً فائق", "de": "Ultra All Inclusive", "en": "Ultra All Inclusive", "es": "Ultra todo incluido", "fr": "Ultra tout compris", "it": "Ultra tutto incluso", "ru": "Ультра всё включено", "tr": "Ultra Her Şey Dahil"}
    },
    DINNER: {
        code: 'DINNER',
        description: 'Sadece akşam yemeği dahildir. Konaklama, kahvaltı ve öğle yemeği dahil değildir.',
        translations: {"ar": "عشاء", "de": "Abendessen", "en": "Dinner", "es": "Cena", "fr": "Dîner", "it": "Cena", "ru": "Ужин", "tr": "Akşam Yemeği"}
    },
    HB_L: {
        code: 'HB_L',
        description: 'Accommodation includes breakfast and lunch. Dinner is not included.',
        translations: {"ar": "نصف إقامة (إفطار وغداء)", "de": "Halbpension (Frühstück und Mittagessen)", "en": "Half Board (Breakfast and Lunch)", "es": "Media pensión (Desayuno y almuerzo)", "fr": "Demi-pension (Petit-dejéuner et déjeuner)", "it": "Mezza pensione (Colazione e pranzo)", "ru": "Полупансион (Завтрак и обед)", "tr": "Yarım Pansiyon (Kahvaltı ve Öğle Yemeği)"}
    },
    RO: {
        code: 'RO',
        description: 'Sadece konaklama vardır. Herhangi bir öğün dahil değildir....',
        translations: {"ar": "غرفة فقط", "de": "Nur Zimmer", "en": "Room Only", "es": "Solo habitación", "fr": "Chambre seule", "it": "Solo camera", "ru": "Только номер", "tr": "Sadece Oda"}
    }
};

/**
 * Get board type translation
 * @param {string} code - Board type code (e.g., 'BB', 'HB')
 * @param {string} lang - Language code (default 'en')
 * @returns {string}
 */
export const getBoardTypeLabel = (code, lang = 'en') => {
    if (!code) return 'Room Only';
    const normalizedCode = code.toUpperCase();
    const boardType = BOARD_TYPES[normalizedCode];
    if (!boardType) return code;
    return boardType.translations[lang] || boardType.translations['en'] || code;
};

/**
 * Get board type description
 * @param {string} code 
 * @returns {string}
 */
export const getBoardTypeDescription = (code) => {
    if (!code) return '';
    const normalizedCode = code.toUpperCase();
    return BOARD_TYPES[normalizedCode]?.description || '';
};
