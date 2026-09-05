/**
 * Board Type Mapping and Translations
 */

export const BOARD_TYPES = {
    BB: {
        code: 'BB',
        description: 'Konaklama ve kahvaltı dahildir. Diğer öğünler yoktur.',
        translations: { "ar": "مبيت وإفطار", "de": "Übernachtung mit Frühstück", "el": "Διαμονή & Πρωινό", "en": "Bed and Breakfast", "es": "Alojamiento y desayuno", "fa": "اقامت و صبحانه", "fr": "Chambre avec petit déjeuner", "it": "Pernottamento e colazione", "ja": "朝食付き", "pt": "Alojamento e Café da Manhã", "ru": "Ночлег и завтрак", "tr": "Oda Kahvaltı", "zh": "含早餐" }
    },
    HB: {
        code: 'HB',
        description: 'Konaklama, kahvaltı ve akşam yemeği dahildir. Öğle yemeği yoktur.',
        translations: { "ar": "نصف إقامة", "de": "Halbpension", "el": "Ημιδιατροφή", "en": "Half Board", "es": "Media pensión", "fa": "نیم‌بُرد (صبحانه و شام)", "fr": "Demi-pension", "it": "Mezza pensione", "ja": "ハーフボード (2食付)", "pt": "Meia Pensão", "ru": "Полупансион", "tr": "Yarım Pansiyon", "zh": "半食宿 (早晚餐)" }
    },
    FB: {
        code: 'FB',
        description: 'Konaklama, kahvaltı, öğle yemeği ve akşam yemeği dahildir. İçecekler genellikle dahil değildir.',
        translations: { "ar": "إقامة كاملة", "de": "Vollpension", "el": "Πλήρης Διατροφή", "en": "Full Board", "es": "Pensión completa", "fa": "فول بُرد (سه وعده غذا)", "fr": "Pension complète", "it": "Pensione completa", "ja": "フルボード (3食付)", "pt": "Pensão Completa", "ru": "Полный пансион", "tr": "Tam Pansiyon", "zh": "全食宿 (三餐)" }
    },
    AI: {
        code: 'AI',
        description: 'Konaklama, üç öğün yemek ve sınırsız yerli içecekler dahildir.',
        translations: { "ar": "شامل كلياً", "de": "All Inclusive", "el": "All Inclusive", "en": "All Inclusive", "es": "Todo incluido", "fa": "همه چیز شامل (All Inclusive)", "fr": "Tout compris", "it": "Tutto incluso", "ja": "オールインクルーシブ", "pt": "Tudo Incluído", "ru": "Всё включено", "tr": "Her Şey Dahil", "zh": "全包 (All Inclusive)" }
    },
    UAI: {
        code: 'UAI',
        description: 'Konaklama, tüm öğünler ve yerli/yabancı içecekler 24 saat boyunca dahildirrr.',
        translations: { "ar": "شامل كلياً فائق", "de": "Ultra All Inclusive", "el": "Ultra All Inclusive", "en": "Ultra All Inclusive", "es": "Ultra todo incluido", "fa": "اولترا همه چیز شامل (Ultra All Inclusive)", "fr": "Ultra tout compris", "it": "Ultra tutto incluso", "ja": "ウルトラ・オールインクルーシブ", "pt": "Ultra Tudo Incluído", "ru": "Ультра всё включено", "tr": "Ultra Her Şey Dahil", "zh": "超全包 (Ultra All Inclusive)" }
    },
    DINNER: {
        code: 'DINNER',
        description: 'Sadece akşam yemeği dahildir. Konaklama, kahvaltı ve öğle yemeği dahil değildir.',
        translations: { "ar": "عشاء", "de": "Abendessen", "el": "Δείπνο", "en": "Dinner", "es": "Cena", "fa": "فقط شام", "fr": "Dîner", "it": "Cena", "ja": "夕食", "pt": "Jantar", "ru": "Ужин", "tr": "Akşam Yemeği", "zh": "晚餐" }
    },
    HB_L: {
        code: 'HB_L',
        description: 'Accommodation includes breakfast and lunch. Dinner is not included.',
        translations: { "ar": "نصف إقامة (إفطار وغداء)", "de": "Halbpension (Frühstück und Mittagessen)", "el": "Ημιδιατροφή (Πρωινό & Μεσημεριανό)", "en": "Half Board (Breakfast and Lunch)", "es": "Media pensión (Desayuno y almuerzo)", "fa": "نیم‌بُرد (صبحانه و ناهار)", "fr": "Demi-pension (Petit-dejéuner et déjeuner)", "it": "Mezza pensione (Colazione e pranzo)", "ja": "ハーフボード (朝・昼食)", "pt": "Meia Pensão (Café e Almoço)", "ru": "Полупансион (Завтрак и обед)", "tr": "Yarım Pansiyon (Kahvaltı ve Öğle Yemeği)", "zh": "半食宿 (早中餐)" }
    },
    RO: {
        code: 'RO',
        description: 'Sadece konaklama vardır. Herhangi bir öğün dahil değildir....',
        translations: { "ar": "غرفة فقط", "de": "Nur Zimmer", "el": "Μόνο Διαμονή", "en": "Room Only", "es": "Solo habitación", "fa": "فقط اتاق (بدون غذا)", "fr": "Chambre seule", "it": "Solo camera", "ja": "素泊まり", "pt": "Apenas Quarto", "ru": "Только номер", "tr": "Sadece Oda", "zh": "仅客房 (不含餐)" }
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
