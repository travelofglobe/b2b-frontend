/**
 * Facility & Amenity resolution, icon mapping, display badge parsing, and category grouping utilities.
 * Supports Expedia Rapid API amenities, legacy numeric facility IDs,
 * backend category slugs (when present), and multilingual keyword classification.
 */

export const decodeAmenityText = (text) => {
    if (!text || typeof text !== 'string') return '';
    let decoded = text
        .replace(/&amp;quot;/g, '&quot;')
        .replace(/&amp;amp;/g, '&amp;')
        .replace(/&amp;lt;/g, '&lt;')
        .replace(/&amp;gt;/g, '&gt;')
        .replace(/&amp;#39;/g, '&#39;')
        .replace(/&amp;#039;/g, '&#039;');

    decoded = decoded
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'")
        .replace(/&#39;/g, "'")
        .replace(/&#039;/g, "'")
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&nbsp;/g, ' ')
        .replace(/&ndash;/g, '–')
        .replace(/&mdash;/g, '—')
        .replace(/&rsquo;/g, "'")
        .replace(/&lsquo;/g, "'")
        .replace(/&rdquo;/g, '"')
        .replace(/&ldquo;/g, '"')
        .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(Number(dec)))
        .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
        .replace(/&amp;/g, '&');

    return decoded.trim();
};

const BADGE_LOCALES = {
    tr: { free: 'ücretsiz', surcharge: 'ek ücret', h24: '24 saat' },
    en: { free: 'free', surcharge: 'extra charge', h24: '24-hour' },
    de: { free: 'kostenlos', surcharge: 'Aufpreis', h24: '24 Std.' },
    ar: { free: 'مجاني', surcharge: 'رسوم إضافية', h24: '24 ساعة' },
    es: { free: 'gratis', surcharge: 'cargo extra', h24: '24 h' },
    ru: { free: 'бесплатно', surcharge: 'доп. плата', h24: '24 часа' },
    fr: { free: 'gratuit', surcharge: 'en supplément', h24: '24 h/24' },
    it: { free: 'gratis', surcharge: 'a pagamento', h24: '24 ore' },
    pt: { free: 'grátis', surcharge: 'taxa extra', h24: '24h' }
};

const capitalizeFirst = (str, lang = 'en') => {
    if (!str) return '';
    const first = str.charAt(0);
    const upper = lang === 'tr' ? first.toLocaleUpperCase('tr-TR') : first.toUpperCase();
    return upper + str.slice(1);
};

/**
 * Parse a raw amenity label into clean Google Hotels-style `{ displayLabel, badges, isFree, isSurcharge, is24Hour }`.
 * Examples:
 * - "Free WiFi" -> { displayLabel: "WiFi", badges: ["free"] }
 * - "Ücretsiz kablosuz bağlantı" -> { displayLabel: "Kablosuz bağlantı", badges: ["ücretsiz"] }
 * - "24-hour room service" -> { displayLabel: "Room service", badges: ["24-hour"] }
 * - "Airport shuttle (available 24 hours, surcharge)" -> { displayLabel: "Airport shuttle", badges: ["24-hour", "extra charge"] }
 * - "Self parking (surcharge)" -> { displayLabel: "Self parking", badges: ["extra charge"] }
 */
export const parseAmenityDisplay = (label, currentLang = 'tr') => {
    const normLang = String(currentLang || 'en').split(/[-_]/)[0].toLowerCase();
    const bLoc = BADGE_LOCALES[normLang] || BADGE_LOCALES.en;

    const cleanRaw = decodeAmenityText(label);
    if (!cleanRaw) {
        return { displayLabel: '', badges: [], isFree: false, isSurcharge: false, is24Hour: false };
    }

    let text = cleanRaw;
    let isFree = false;
    let isSurcharge = false;
    let is24Hour = false;

    // 1. Inspect and clean parenthetical qualifiers such as "(surcharge)", "(available 24 hours, surcharge)", "(ücretli)"
    text = text.replace(/\(([^)]+)\)/g, (fullMatch, inner) => {
        const parts = inner.split(/[,;/]/).map(p => p.trim()).filter(Boolean);
        const keptParts = [];

        for (const part of parts) {
            if (/^(?:surcharge|extra charge|extra fee|fee|fees apply|paid|for a fee|ücretli|ek ücret|ek ücrete tabi|gegen gebühr|de pago|за доп\.? плату|برسوم إضافية)$/i.test(part)) {
                isSurcharge = true;
            } else if (/^(?:free|complimentary|no charge|ücretsiz|kostenlos|gratis|бесплатно|مجاني)$/i.test(part)) {
                isFree = true;
            } else if (/^(?:available\s+)?24[\s-]?(?:hours?|hrs?|h|saat|std\.?)$/i.test(part) || /^24\s*saat(?:\s+açık)?$/i.test(part)) {
                is24Hour = true;
            } else {
                keptParts.push(part);
            }
        }

        if (keptParts.length === 0) return '';
        return `(${keptParts.join(', ')})`;
    });

    // 2. Leading "Free " / "Ücretsiz " / "Complimentary " / "Kostenlos " / "Gratis "
    const freePrefixMatch = text.match(/^(?:free|complimentary|ücretsiz|kostenlos(?:es?|er)?|gratis|бесплатн(?:ый|ая|ое|ые)?)\s+(.+)$/i);
    if (freePrefixMatch && freePrefixMatch[1].trim().length >= 3) {
        isFree = true;
        text = freePrefixMatch[1].trim();
    }

    // 3. Leading "24-hour " / "24 saat " / "24 saat açık "
    const h24PrefixMatch = text.match(/^(?:24[\s-]?hours?|24[\s-]?hr|24\s*saat(?:\s+açık|\s+hizmet veren)?|24[\s-]?stunden|круглосуточн(?:ый|ая|ое|ые)?)\s+(.+)$/i);
    if (h24PrefixMatch && h24PrefixMatch[1].trim().length >= 3) {
        is24Hour = true;
        text = h24PrefixMatch[1].trim();
    }

    // 4. Trailing " - surcharge" / " - free" / " (ücretsiz)" remnants
    text = text.replace(/\s*[-–—]\s*(?:surcharge|extra charge|ücretli|ek ücret)$/i, () => {
        isSurcharge = true;
        return '';
    });
    text = text.replace(/\s*[-–—]\s*(?:free|ücretsiz)$/i, () => {
        isFree = true;
        return '';
    });

    // Detect remaining non-stripped flags without mutating text
    if (!isFree && /\b(?:free|complimentary|ücretsiz|kostenlos|gratis|бесплатн|مجان)\b/i.test(cleanRaw) && !/smoke-?free|stair-?free|step-?free|gluten-?free|plastic-?free|barrier-?free/i.test(cleanRaw)) {
        isFree = true;
    }
    if (!isSurcharge && /\b(?:surcharge|extra charge|fees? apply|ücretli|ek ücret|gegen gebühr|de pago|доп\.?\s*плат|برسوم)\b/i.test(cleanRaw)) {
        isSurcharge = true;
    }
    if (!is24Hour && /(?:24[\s-]?hours?|24\s*saat|24[\s-]?std|круглосуточн|على مدار 24 ساعة)/i.test(cleanRaw)) {
        is24Hour = true;
    }

    // Normalize whitespace & capitalize cleanly
    text = text.replace(/\s{2,}/g, ' ').replace(/\s+([,.;:])/g, '$1').trim();
    if (!text) text = cleanRaw;
    text = capitalizeFirst(text, normLang);

    const badges = [];
    if (is24Hour) badges.push(bLoc.h24);
    if (isFree && !isSurcharge) badges.push(bLoc.free);
    else if (isSurcharge) badges.push(bLoc.surcharge);

    return {
        displayLabel: text,
        badges,
        isFree,
        isSurcharge,
        is24Hour
    };
};

/**
 * Legacy numeric facility ID map (kept for backwards compatibility across
 * HotelListing, HotelCard, RoomGalleryModal, and fallback ID-only lookups).
 * All `icon` values are valid Google Material Symbols Outlined glyph names.
 */
export const FACILITY_ICON_MAP = {
    98445: { icon: 'wifi', lucideIcon: 'Wifi', category: 'internet', label: 'Free Wifi' },
    48325: { icon: 'wifi', lucideIcon: 'Wifi', category: 'internet', label: 'Wifi Access' },
    3664: { icon: 'wifi', lucideIcon: 'Wifi', category: 'internet', label: 'High Speed Internet' },
    334: { icon: 'wifi', lucideIcon: 'Wifi', category: 'internet', label: 'Internet' },
    616: { icon: 'pool', lucideIcon: 'Waves', category: 'pool_beach', label: 'Outdoor Pool' },
    649: { icon: 'pool', lucideIcon: 'Waves', category: 'pool_beach', label: 'Indoor Pool' },
    1685: { icon: 'pool', lucideIcon: 'Waves', category: 'family_pets', label: 'Kids Pool' },
    1985: { icon: 'spa', lucideIcon: 'Sparkles', category: 'wellness', label: 'Spa' },
    1978: { icon: 'fitness_center', lucideIcon: 'Dumbbell', category: 'wellness', label: 'Health Club' },
    98455: { icon: 'fitness_center', lucideIcon: 'Dumbbell', category: 'wellness', label: 'Fitness' },
    47935: { icon: 'fitness_center', lucideIcon: 'Dumbbell', category: 'wellness', label: 'Gym' },
    641: { icon: 'restaurant', lucideIcon: 'Utensils', category: 'dining', label: 'Restaurant' },
    3134: { icon: 'local_bar', lucideIcon: 'Wine', category: 'dining', label: 'Bar' },
    606: { icon: 'pets', lucideIcon: 'PawPrint', category: 'family_pets', label: 'Pets Allowed' },
    719: { icon: 'ac_unit', lucideIcon: 'Snowflake', category: 'general', label: 'Air Conditioning' },
    101165: { icon: 'kitchen', lucideIcon: 'Refrigerator', category: 'dining', label: 'Minibar' },
    618: { icon: 'sports_tennis', lucideIcon: 'Trophy', category: 'wellness', label: 'Tennis' },
    3164: { icon: 'casino', lucideIcon: 'Ticket', category: 'wellness', label: 'Casino' },
    3154: { icon: 'nightlife', lucideIcon: 'Music', category: 'wellness', label: 'Night Club' },
    3891: { icon: 'hot_tub', lucideIcon: 'Bath', category: 'wellness', label: 'Jacuzzi' },
    650: { icon: 'spa', lucideIcon: 'Bath', category: 'wellness', label: 'Sauna' },
    3064: { icon: 'atm', lucideIcon: 'CircleDollarSign', category: 'policies_payments', label: 'ATM' },
    18006: { icon: 'business_center', lucideIcon: 'Briefcase', category: 'business', label: 'Business Centre' },
    18366: { icon: 'local_laundry_service', lucideIcon: 'WashingMachine', category: 'services', label: 'Laundry' },
    603: { icon: 'child_care', lucideIcon: 'Baby', category: 'family_pets', label: 'Babysitting' },
    638: { icon: 'explore', lucideIcon: 'Compass', category: 'services', label: 'Tour Desk' },
    646: { icon: 'support_agent', lucideIcon: 'ConciergeBell', category: 'services', label: 'Concierge' },
    666: { icon: 'car_rental', lucideIcon: 'Car', category: 'parking_transport', label: 'Car Rental' },
    1993: { icon: 'lock', lucideIcon: 'Lock', category: 'services', label: 'Safety Box' },
    1995: { icon: 'accessible', lucideIcon: 'Accessibility', category: 'accessibility', label: 'Wheelchair Access' },
    2007: { icon: 'elevator', lucideIcon: 'ArrowUpDown', category: 'general', label: 'Elevator' },
    98485: { icon: 'security', lucideIcon: 'ShieldCheck', category: 'policies_payments', label: 'Security' },
    100075: { icon: 'smoking_rooms', lucideIcon: 'Cigarette', category: 'policies_payments', label: 'Smoking Area' },
    1687: { icon: 'surfing', lucideIcon: 'Waves', category: 'wellness', label: 'Water Sports' },
    1981: { icon: 'child_friendly', lucideIcon: 'Baby', category: 'family_pets', label: 'Kids Club' },
    3724: { icon: 'beach_access', lucideIcon: 'Umbrella', category: 'pool_beach', label: 'Beach' },
    18126: { icon: 'directions_bike', lucideIcon: 'Bike', category: 'parking_transport', label: 'Bicycle Rental' },
    98415: { icon: 'airport_shuttle', lucideIcon: 'Plane', category: 'parking_transport', label: 'Airport Shuttle' },
    610: { icon: 'local_parking', lucideIcon: 'SquareParking', category: 'parking_transport', label: 'Parking' },
    1984: { icon: 'self_improvement', lucideIcon: 'Sparkles', category: 'wellness', label: 'Yoga' },
    1991: { icon: 'meeting_room', lucideIcon: 'Users', category: 'business', label: 'Meeting Rooms' },
    611: { icon: 'room_service', lucideIcon: 'ConciergeBell', category: 'dining', label: 'Room Service' },
    1986: { icon: 'sports_soccer', lucideIcon: 'Trophy', category: 'wellness', label: 'Sports' },
    3184: { icon: 'tv', lucideIcon: 'Tv', category: 'internet', label: 'Satellite TV' },
    607: { icon: 'coffee_maker', lucideIcon: 'Coffee', category: 'dining', label: 'Coffee Maker' },
    100065: { icon: 'dry_cleaning', lucideIcon: 'Shirt', category: 'services', label: 'Dry Cleaning' },
    637: { icon: 'airport_shuttle', lucideIcon: 'Bus', category: 'parking_transport', label: 'Shuttle Service' },
    18096: { icon: 'storefront', lucideIcon: 'ShoppingBag', category: 'services', label: 'Gift Shop' },
    623: { icon: 'library_books', lucideIcon: 'BookOpen', category: 'services', label: 'Library' },
    1979: { icon: 'medical_services', lucideIcon: 'HeartPulse', category: 'services', label: 'Doctor' },
    1989: { icon: 'yard', lucideIcon: 'Trees', category: 'pool_beach', label: 'Garden' },
    3174: { icon: 'event_seat', lucideIcon: 'Users', category: 'business', label: 'Banquet Hall' },
    18226: { icon: 'videogame_asset', lucideIcon: 'Gamepad2', category: 'wellness', label: 'Game Room' },
    3144: { icon: 'theater_comedy', lucideIcon: 'Ticket', category: 'wellness', label: 'Entertainment' },
    1988: { icon: 'desk', lucideIcon: 'Briefcase', category: 'business', label: 'Work Desk' },
    639: { icon: 'kitchen', lucideIcon: 'ChefHat', category: 'dining', label: 'Kitchenette' },
    98425: { icon: 'balcony', lucideIcon: 'Sun', category: 'pool_beach', label: 'Balcony' }
};

/**
 * Ordered Google Hotels-style hospitality categories.
 */
export const AMENITY_CATEGORIES = [
    {
        id: 'internet',
        lucideIcon: 'Wifi',
        materialIcon: 'wifi',
        labels: {
            tr: 'İnternet',
            en: 'Internet',
            de: 'Internet',
            ar: 'الإنترنت',
            es: 'Internet',
            ru: 'Интернет',
            fr: 'Internet',
            it: 'Internet',
            pt: 'Internet',
            zh: '网络',
            ja: 'インターネット',
            fa: 'اینترنت',
            el: 'Διαδίκτυο'
        }
    },
    {
        id: 'dining',
        lucideIcon: 'Utensils',
        materialIcon: 'restaurant',
        labels: {
            tr: 'Yiyecek ve içecek',
            en: 'Food & drink',
            de: 'Speisen & Getränke',
            ar: 'الطعام والشراب',
            es: 'Comida y bebida',
            ru: 'Питание и напитки',
            fr: 'Restauration et boissons',
            it: 'Cibo e bevande',
            pt: 'Comidas e bebidas',
            zh: '餐饮',
            ja: '飲食',
            fa: 'غذا و نوشیدنی',
            el: 'Φαγητό και ποτό'
        }
    },
    {
        id: 'policies_payments',
        lucideIcon: 'CircleDollarSign',
        materialIcon: 'payments',
        labels: {
            tr: 'Politikalar ve ödeme türleri',
            en: 'Policies & payments',
            de: 'Richtlinien & Zahlungen',
            ar: 'السياسات وطرق الدفع',
            es: 'Políticas y pagos',
            ru: 'Правила и способы оплаты',
            fr: 'Conditions et paiements',
            it: 'Condizioni e pagamenti',
            pt: 'Políticas e pagamentos',
            zh: '政策与付款方式',
            ja: 'ポリシー・お支払い',
            fa: 'قوانین و روش‌های پرداخت',
            el: 'Πολιτικές και πληρωμές'
        }
    },
    {
        id: 'services',
        lucideIcon: 'ConciergeBell',
        materialIcon: 'support_agent',
        labels: {
            tr: 'Hizmetler',
            en: 'Services',
            de: 'Services',
            ar: 'الخدمات',
            es: 'Servicios',
            ru: 'Услуги',
            fr: 'Services',
            it: 'Servizi',
            pt: 'Serviços',
            zh: '服务',
            ja: 'サービス',
            fa: 'خدمات',
            el: 'Υπηρεσίες'
        }
    },
    {
        id: 'pool_beach',
        lucideIcon: 'Waves',
        materialIcon: 'pool',
        labels: {
            tr: 'Havuzlar ve plaj',
            en: 'Pools & beach',
            de: 'Pools & Strand',
            ar: 'المسابح والشاطئ',
            es: 'Piscinas y playa',
            ru: 'Бассейны и пляж',
            fr: 'Piscines et plage',
            it: 'Piscine e spiaggia',
            pt: 'Piscinas e praia',
            zh: '泳池与海滩',
            ja: 'プール・ビーチ',
            fa: 'استخر و ساحل',
            el: 'Πισίνες και παραλία'
        }
    },
    {
        id: 'wellness',
        lucideIcon: 'Sparkles',
        materialIcon: 'spa',
        labels: {
            tr: 'Spa ve aktiviteler',
            en: 'Wellness & activities',
            de: 'Wellness & Aktivitäten',
            ar: 'السبا والأنشطة',
            es: 'Bienestar y actividades',
            ru: 'Спа и развлечения',
            fr: 'Bien-être et activités',
            it: 'Benessere e attività',
            pt: 'Bem-estar e atividades',
            zh: '水疗与活动',
            ja: 'ウェルネス・アクティビティ',
            fa: 'اسپا و تفریحات',
            el: 'Ευεξία και δραστηριότητες'
        }
    },
    {
        id: 'parking_transport',
        lucideIcon: 'Car',
        materialIcon: 'local_parking',
        labels: {
            tr: 'Otopark ve ulaşım',
            en: 'Parking & transport',
            de: 'Parken & Transport',
            ar: 'المواقف والمواصلات',
            es: 'Aparcamiento y transporte',
            ru: 'Парковка и транспорт',
            fr: 'Parking et transport',
            it: 'Parcheggio e trasporti',
            pt: 'Estacionamento e transporte',
            zh: '停车与交通',
            ja: '駐車場・交通',
            fa: 'پارکینگ و حمل‌ونقل',
            el: 'Στάθμευση και μεταφορά'
        }
    },
    {
        id: 'family_pets',
        lucideIcon: 'Baby',
        materialIcon: 'child_friendly',
        labels: {
            tr: 'Çocuklar ve evcil hayvanlar',
            en: 'Children & pets',
            de: 'Kinder & Haustiere',
            ar: 'الأطفال والحيوانات الأليفة',
            es: 'Niños y mascotas',
            ru: 'Дети и животные',
            fr: 'Enfants et animaux',
            it: 'Bambini e animali',
            pt: 'Crianças e animais',
            zh: '儿童与宠物',
            ja: 'お子様・ペット',
            fa: 'کودکان و حیوانات خانگی',
            el: 'Παιδιά και κατοικίδια'
        }
    },
    {
        id: 'business',
        lucideIcon: 'Briefcase',
        materialIcon: 'business_center',
        labels: {
            tr: 'İş ve toplantı',
            en: 'Business',
            de: 'Business',
            ar: 'الأعمال',
            es: 'Negocios',
            ru: 'Бизнес',
            fr: 'Affaires',
            it: 'Business',
            pt: 'Negócios',
            zh: '商务',
            ja: 'ビジネス',
            fa: 'کسب‌وکار',
            el: 'Επιχειρήσεις'
        }
    },
    {
        id: 'accessibility',
        lucideIcon: 'Accessibility',
        materialIcon: 'accessible',
        labels: {
            tr: 'Erişilebilirlik',
            en: 'Accessibility',
            de: 'Barrierefreiheit',
            ar: 'إمكانية الوصول',
            es: 'Accesibilidad',
            ru: 'Доступная среда',
            fr: 'Accessibilité',
            it: 'Accessibilità',
            pt: 'Acessibilidade',
            zh: '无障碍设施',
            ja: 'バリアフリー',
            fa: 'دسترسی‌پذیری',
            el: 'Προσβασιμότητα'
        }
    },
    {
        id: 'sustainability',
        lucideIcon: 'Leaf',
        materialIcon: 'eco',
        labels: {
            tr: 'Sürdürülebilirlik',
            en: 'Sustainability',
            de: 'Nachhaltigkeit',
            ar: 'الاستدامة',
            es: 'Sostenibilidad',
            ru: 'Экологичность',
            fr: 'Développement durable',
            it: 'Sostenibilità',
            pt: 'Sustentabilidade',
            zh: '可持续发展',
            ja: 'サステナビリティ',
            fa: 'پایداری',
            el: 'Βιωσιμότητα'
        }
    },
    {
        id: 'general',
        lucideIcon: 'Building2',
        materialIcon: 'apartment',
        labels: {
            tr: 'Diğer özellikler',
            en: 'General',
            de: 'Allgemein',
            ar: 'مرافق عامة',
            es: 'General',
            ru: 'Общее',
            fr: 'Général',
            it: 'Generale',
            pt: 'Geral',
            zh: '综合设施',
            ja: '一般設備',
            fa: 'امکانات عمومی',
            el: 'Γενικά'
        }
    }
];

const CATEGORY_MAP = AMENITY_CATEGORIES.reduce((acc, cat) => {
    acc[cat.id] = cat;
    return acc;
}, {});

export const getAmenityCategoryMeta = (categoryId) => CATEGORY_MAP[categoryId] || CATEGORY_MAP.general;

export const getAmenityCategoryLabel = (categoryId, lang = 'en') => {
    const meta = getAmenityCategoryMeta(categoryId);
    const norm = String(lang || 'en').split(/[-_]/)[0].toLowerCase();
    return meta.labels?.[norm] || meta.labels.en;
};

/**
 * Backend/Expedia category slug mapping (used when backend returns `categories` or `type`).
 */
const BACKEND_CATEGORY_SLUG_MAP = {
    wifi: 'internet',
    internet: 'internet',
    free_wifi: 'internet',
    breakfast: 'dining',
    free_breakfast: 'dining',
    restaurant: 'dining',
    bar: 'dining',
    kitchen: 'dining',
    all_inclusive: 'dining',
    pool: 'pool_beach',
    indoor_pool: 'pool_beach',
    outdoor_pool: 'pool_beach',
    beach: 'pool_beach',
    ocean_view: 'pool_beach',
    spa: 'wellness',
    hot_tub: 'wellness',
    gym: 'wellness',
    fitness: 'wellness',
    casino: 'wellness',
    golf: 'wellness',
    ski: 'wellness',
    leisure: 'wellness',
    parking: 'parking_transport',
    free_parking: 'parking_transport',
    airport_shuttle: 'parking_transport',
    ev_charging: 'parking_transport',
    dry_cleaning_laundry: 'services',
    laundry: 'services',
    concierge: 'services',
    front_desk: 'services',
    pets: 'family_pets',
    family: 'family_pets',
    kids: 'family_pets',
    business: 'business',
    meeting: 'business',
    accessibility: 'accessibility',
    wheelchair: 'accessibility',
    sustainability: 'sustainability',
    eco: 'sustainability',
    payment: 'policies_payments',
    payments: 'policies_payments',
    smoke_free: 'policies_payments',
    non_smoking: 'policies_payments',
    air_conditioning: 'general'
};

/**
 * Ordered multilingual classification rules.
 */
const CLASSIFICATION_RULES = [
    // 1. ACCESSIBILITY (must precede parking, pool, restaurant, bathroom, elevator paths)
    {
        regex: /wheelchair|accessible|roll-in shower|grab bar|stair-free|step-free|well-lit path|handrail|braille|raised signage|sign language|assistive listening|visual alarm|pool hoist|transfer shower|low-height|tekerlekli sandalye|engelli|erişilebilir|rollstuhl|barrierefrei|behindertengerecht|silla de ruedas|accesible|инвалид|доступн|كرسي متحرك|ذوي الاحتياجات/i,
        category: 'accessibility',
        lucideIcon: 'Accessibility',
        materialIcon: 'accessible'
    },

    // 2. SUSTAINABILITY / ECO-FRIENDLY
    {
        regex: /recycl|single-use plastic|biodegradable|compost|led light|energy-saving|water-efficient|greywater|solar energy|renewable energy|eco-friendly|sustainable|sustainability|locally-sourced|organic food|food waste|reusable cups|double-glazed|change of bedsheets \(on request\)|change of towels \(on request\)|towel change|housekeeping on request|bulk dispenser|plant-based|vegetarian menu|vegan menu|carbon|green key|sürdürülebilir|geri dönüşüm|güneş enerjisi|su tasarruf|enerji tasarruf|çevre dostu|tek kullanımlık plastik|organik|yerel kaynaklı|nachhaltig|umweltfreundlich|sostenib|эколог|переработ|مستدام/i,
        category: 'sustainability',
        lucideIcon: (s) => (/recycl|geri dönüşüm|compost|waste/i.test(s) ? 'Recycle' : (/water-efficient|greywater|su tasarruf/i.test(s) ? 'Droplets' : (/solar|led|energy|enerji|güneş/i.test(s) ? 'Sun' : 'Leaf'))),
        materialIcon: 'eco'
    },

    // 3. FAMILY, KIDS & PETS
    {
        regex: /(?:\bpets?\b|pet[\s-]?friendly|\bdogs?\b|\bcats?\b|service animals?|litter box|dog exercise|pet bowls?|pet[\s-]?sitting|pet grooming|evcil hayvan|köpek|kedi|haustier|hunde|mascotas|perros|животн|питомц|حيوانات أليفة)/i,
        category: 'family_pets',
        lucideIcon: 'PawPrint',
        materialIcon: 'pets'
    },
    {
        regex: /children'?s pool|kids'? pool|kiddie pool|çocuk havuz|kinderpool|kinderbecken|piscina infantil|детский бассейн|مسبح للأطفال/i,
        category: 'family_pets',
        lucideIcon: 'Waves',
        materialIcon: 'pool'
    },
    {
        regex: /(?:\bkids?\b|\bchild(?:ren|care)?\b|babysit|playground|cribs?|infant beds?|strollers?|highchair|supervised childcare|children'?s club|kids'? club|kid-friendly|family[\s-]?friendly|çocuk|bebek|oyun alanı|bakıcı|aile|kinder|spielplatz|niños|guardería|детск|нян|أطفال|رعاية الأطفال)/i,
        category: 'family_pets',
        lucideIcon: 'Baby',
        materialIcon: 'child_friendly'
    },

    // 4. INTERNET & CONNECTIVITY
    {
        regex: /wi-?fi|wireless internet|kablosuz internet|kablosuz bağlantı|wlan|вай-?фай|واي فاي/i,
        category: 'internet',
        lucideIcon: 'Wifi',
        materialIcon: 'wifi'
    },
    {
        regex: /wired internet|high-?speed internet|internet access|free internet|internet erişim|internet/i,
        category: 'internet',
        lucideIcon: 'Wifi',
        materialIcon: 'wifi'
    },
    {
        regex: /computer station|internet point|bilgisayar istasyon|computerarbeitsplatz/i,
        category: 'internet',
        lucideIcon: 'Monitor',
        materialIcon: 'computer'
    },
    {
        regex: /(?:\btv\b|television|televizyon|satellite|cable tv|smart tv|uydu|flat-screen|fernseher|телевизор|تلفزيون)/i,
        category: 'internet',
        lucideIcon: 'Tv',
        materialIcon: 'tv'
    },
    {
        regex: /(?:\btelephones?\b|\bphone\b|telefon)/i,
        category: 'internet',
        lucideIcon: 'Phone',
        materialIcon: 'call'
    },

    // 5. FOOD & DRINK
    {
        regex: /poolside bar|swim-?up bar|beach bar|cocktail|kokteyl|havuz başı bar|plaj bar/i,
        category: 'dining',
        lucideIcon: 'Martini',
        materialIcon: 'local_bar'
    },
    {
        regex: /(?:\bbars?\b|\blounges?\b|\bpub\b|\btavern\b|winery|vineyard|wine tasting|şarap|weinbar|бар|лаунж|بار)/i,
        category: 'dining',
        lucideIcon: 'Wine',
        materialIcon: 'local_bar'
    },
    {
        regex: /breakfast|kahvaltı|kahve|coffee|espresso|caf[eé]|tea in common|çay|frühstück|kaffee|desayuno|cafetería|завтрак|кофе|إفطار|قهوة|مقهى/i,
        category: 'dining',
        lucideIcon: 'Coffee',
        materialIcon: 'free_breakfast'
    },
    {
        regex: /room service|oda servisi|zimmerservice|servicio de habitaciones|обслуживание номеров|خدمة الغرف/i,
        category: 'dining',
        lucideIcon: 'ConciergeBell',
        materialIcon: 'room_service'
    },
    {
        regex: /minibar|refrigerator|fridge|buzdolabı|vending machine|ice machine|mikrodalga|microwave/i,
        category: 'dining',
        lucideIcon: 'Refrigerator',
        materialIcon: 'kitchen'
    },
    {
        regex: /kitchen|kitchenette|shared kitchen|mutfak|küche|cocina|кухня|مطبخ|electric kettle|kettle/i,
        category: 'dining',
        lucideIcon: 'ChefHat',
        materialIcon: 'kitchen'
    },
    {
        regex: /restaurant|dining|snack bar|deli|buffet|büfe|all-?inclusive|her şey dahil|restoran|yemek|lokanta|gala dinner|banquet|speisesaal|restaurante|ресторан|шведский стол|مطعم/i,
        category: 'dining',
        lucideIcon: 'Utensils',
        materialIcon: 'restaurant'
    },

    // 6. POLICIES & PAYMENTS
    {
        regex: /credit card|debit card|cashless|payment|kredi kart|banka kart|nakit|ödeme|visa|mastercard|amex|atm|banking|currency exchange|döviz|bankamatik|geldautomat|cambio de divisas|банкомат|обмен валют|صراف/i,
        category: 'policies_payments',
        lucideIcon: 'CreditCard',
        materialIcon: 'payments'
    },
    {
        regex: /smoke-?free|non-?smoking|sigara içilmez|sigara içilmeyen|nichtraucher|libre de humo|для некурящих|خالي من التدخين/i,
        category: 'policies_payments',
        lucideIcon: 'CigaretteOff',
        materialIcon: 'smoke_free'
    },
    {
        regex: /smoking area|designated smoking|sigara içme|sigara alanı|raucherbereich|zona de fumadores|для курящих|التدخين/i,
        category: 'policies_payments',
        lucideIcon: 'Cigarette',
        materialIcon: 'smoking_rooms'
    },
    {
        regex: /security|cctv|fire extinguisher|smoke detector|carbon monoxide|güvenlik|yangın|kamera|alarm|sicherheit|seguridad|безопасност|أمن/i,
        category: 'policies_payments',
        lucideIcon: 'ShieldCheck',
        materialIcon: 'security'
    },

    // 7. SPA, WELLNESS, SPORTS & ENTERTAINMENT
    {
        regex: /pool table|billiard|bilardo|arcade|game room|oyun odası|bowling|table tennis|ping pong|darts|foosball|spielzimmer|sala de juegos|бильярд|игровая/i,
        category: 'wellness',
        lucideIcon: 'Gamepad2',
        materialIcon: 'videogame_asset'
    },
    {
        regex: /nightclub|disco|karaoke|live music|canlı müzik|gece kulübü|disko|entertainment|animasyon|animation|amphitheater|theater|theatre|shows?|casino|kumarhane|nachtclub|ночной клуб|казино/i,
        category: 'wellness',
        lucideIcon: (s) => (/music|müzik|karaoke|nightclub|disco|kulüb/i.test(s) ? 'Music' : 'Ticket'),
        materialIcon: 'nightlife'
    },
    {
        regex: /sauna|steam room|turkish bath|hammam|hamam|hot tub|jacuzzi|jakuzi|spa tub|whirlpool|thermal|kaplıca|buhar odası|dampfbad|сауна|хаммам|джакузи|ساونا|حمام تركي/i,
        category: 'wellness',
        lucideIcon: 'Bath',
        materialIcon: 'hot_tub'
    },
    {
        regex: /(?:\bspa\b|massage|masaj|wellness|aromatherapy|reflexology|hydrotherapy|thalassotherapy|body treatment|body scrub|body wrap|facial|manicure|pedicure|mud bath|treatment room|wellbeing|cilt bakım|güzellik|health spa|спа|массаж|سبا|مساج)/i,
        category: 'wellness',
        lucideIcon: 'Sparkles',
        materialIcon: 'spa'
    },
    {
        regex: /(?:\bfitness\b|\bgym\b|health club|workout|yoga|pilates|aerobics?|crossfit|spor salonu|egzersiz|antrenman|fitnessraum|gimnasio|фитнес|тренажер|لياقة|رياضية)/i,
        category: 'wellness',
        lucideIcon: 'Dumbbell',
        materialIcon: 'fitness_center'
    },
    {
        regex: /(?:\btennis\b|\bgolf\b|\bbasketball\b|\bvolleyball\b|\bsoccer\b|\bfootball\b|\bsquash\b|\bracquetball\b|\barchery\b|mini[\s-]?golf|bowling|horse riding|hiking|kayaking|snorkeling|scuba|diving|surfing|windsurfing|waterskiing|water sports?|su sporları|parasailing|rafting|rowing|canoeing|sailing|boat tours?|fishing|\bski(?:ing|[\s-]?in|[\s-]?out)?\b|snowboard|tenis|voleybol|basketbol|dalış|sörf|kayak)/i,
        category: 'wellness',
        lucideIcon: (s) => (/ski|snow|kayak/i.test(s) && !/kayaking/i.test(s) ? 'Snowflake' : (/water|snorkel|scuba|div|surf|sail|canoe|kayak|boat|raft|su spor|dalış/i.test(s) ? 'Waves' : 'Trophy')),
        materialIcon: 'sports_tennis'
    },

    // 8. POOL, BEACH & OUTDOORS
    {
        regex: /water park|waterslide|aquapark|aqua park|su kaydırağı|swimming pool|outdoor pool|indoor pool|heated pool|rooftop pool|infinity pool|seasonal pool|plunge pool|lazy river|pool cabana|pool umbrella|pool sun lounger|havuz|yüzme|schwimmbad|innenpool|außenpool|piscina|бассейн|مسبح/i,
        category: 'pool_beach',
        lucideIcon: 'Waves',
        materialIcon: 'pool'
    },
    {
        regex: /beach|plaj|sahil|deniz|seafront|oceanfront|cabana|sun lounger|şezlong|umbrella|şemsiye|strand|playa|пляж|شاطئ/i,
        category: 'pool_beach',
        lucideIcon: 'Umbrella',
        materialIcon: 'beach_access'
    },
    {
        regex: /barbecue|bbq|mangal|grill|firepit|fireplace|şömine/i,
        category: 'pool_beach',
        lucideIcon: 'Flame',
        materialIcon: 'outdoor_grill'
    },
    {
        regex: /garden|bahçe|courtyard|picnic|piknik|garten|jardín|сад|حديقة/i,
        category: 'pool_beach',
        lucideIcon: 'Trees',
        materialIcon: 'yard'
    },
    {
        regex: /terrace|rooftop|balcony|patio|sun deck|veranda|solarium|teras|balkon|güneşlenme|dachterrasse|terraza|терраса|балкон|شرفة|تراس/i,
        category: 'pool_beach',
        lucideIcon: 'Sun',
        materialIcon: 'balcony'
    },

    // 9. PARKING & TRANSPORTATION
    {
        regex: /ev charging|electric car|electric vehicle|elektrikli araç|şarj istasyon|ladestation|cargador.*eléctrico|зарядк.*электро/i,
        category: 'parking_transport',
        lucideIcon: 'Zap',
        materialIcon: 'ev_station'
    },
    {
        regex: /airport shuttle|airport transfer|havalimanı|havaalanı|flughafentransfer|traslado.*aeropuerto|трансфер.*аэропорт|نقل المطار/i,
        category: 'parking_transport',
        lucideIcon: 'Plane',
        materialIcon: 'airport_shuttle'
    },
    {
        regex: /shuttle|transfer|bus station|train station|ferry|cruise terminal|servis aracı|alan servisi|plaj servisi/i,
        category: 'parking_transport',
        lucideIcon: 'Bus',
        materialIcon: 'airport_shuttle'
    },
    {
        regex: /bicycle|bike rental|scooter|moped|bisiklet|fahrrad|bicicleta|велосипед|دراجة/i,
        category: 'parking_transport',
        lucideIcon: 'Bike',
        materialIcon: 'directions_bike'
    },
    {
        regex: /car rental|limo|town car|araç kiralama|otomobil kiralama|autovermietung|alquiler de coches|аренда авто|تأجير سيارات/i,
        category: 'parking_transport',
        lucideIcon: 'Car',
        materialIcon: 'car_rental'
    },
    {
        regex: /(?:\bself[- ]?parking\b|\bvalet\b|\bparking\b|\bgarage\b|\bcarport\b|rv\/bus\/truck|otopark|vale|garaj|park yeri|park alanı|parkplatz|aparcamiento|парковк|موقف سيارات)/i,
        category: 'parking_transport',
        lucideIcon: 'SquareParking',
        materialIcon: 'local_parking'
    },

    // 10. BUSINESS & EVENTS
    {
        regex: /meeting room|conference|convention|banquet|ballroom|event space|exhibition|toplantı|konferans|balo salonu|etkinlik|tagungsraum|konferenz|sala de reuniones|конференц|переговорн|قاعة اجتماعات/i,
        category: 'business',
        lucideIcon: 'Users',
        materialIcon: 'meeting_room'
    },
    {
        regex: /printer|fax|photocop|faks|fotokopi|yazıcı/i,
        category: 'business',
        lucideIcon: 'Printer',
        materialIcon: 'print'
    },
    {
        regex: /business center|business centre|coworking|workstation|work desk|iş merkezi|çalışma alanı|çalışma masası|businesscenter|centro de negocios|бизнес-центр|مركز أعمال/i,
        category: 'business',
        lucideIcon: 'Briefcase',
        materialIcon: 'business_center'
    },
    {
        regex: /wedding|düğün|nikah|hochzeit|bodas|свадьб/i,
        category: 'business',
        lucideIcon: 'Heart',
        materialIcon: 'celebration'
    },

    // 11. GUEST SERVICES & RECEPTION (safe-deposit checked before front desk)
    {
        regex: /safe-?deposit|safety box|kasa|emanet kasası|tresor|caja fuerte|сейф|خزنة/i,
        category: 'services',
        lucideIcon: 'Lock',
        materialIcon: 'lock'
    },
    {
        regex: /24-?hour front desk|front desk|reception|resepsiyon|24 saat|express check-?in|express check-?out|contactless check-?in|hızlı giriş|hızlı çıkış|rezeption|recepción|стойка регистрации|استقبال/i,
        category: 'services',
        lucideIcon: (s) => (/check-?in|check-?out|giriş|çıkış/i.test(s) ? 'KeyRound' : 'Clock'),
        materialIcon: 'support_agent'
    },
    {
        regex: /concierge|danışma|konsiyerj|bellhop|porter|bagaj taşıma/i,
        category: 'services',
        lucideIcon: 'ConciergeBell',
        materialIcon: 'support_agent'
    },
    {
        regex: /luggage|baggage|bavul|bagaj|emanet|gepäck|equipaje|камера хранения|أمتعة/i,
        category: 'services',
        lucideIcon: 'Luggage',
        materialIcon: 'luggage'
    },
    {
        regex: /tour|ticket assistance|excursion|tur masası|bilet|ausflug/i,
        category: 'services',
        lucideIcon: 'Compass',
        materialIcon: 'explore'
    },
    {
        regex: /multilingual|çok dilli|yabancı dil|mehrsprachig|многоязычн/i,
        category: 'services',
        lucideIcon: 'Globe',
        materialIcon: 'translate'
    },
    {
        regex: /laundry|dry cleaning|ironing|çamaşır|kuru temizleme|ütü|wäscherei|lavandería|прачечн|химчистк|غسيل|تنظيف جاف/i,
        category: 'services',
        lucideIcon: (s) => (/dry clean|kuru temizleme|iron|ütü/i.test(s) ? 'Shirt' : 'WashingMachine'),
        materialIcon: 'local_laundry_service'
    },
    {
        regex: /gift shop|newsstand|shopping|market|convenience store|butik|mağaza|hediyelik|alışveriş|geschenkeladen|tienda|магазин|متجر/i,
        category: 'services',
        lucideIcon: 'ShoppingBag',
        materialIcon: 'storefront'
    },
    {
        regex: /hair salon|barber|kuaför|berber|friseur|peluquería|парикмахер/i,
        category: 'services',
        lucideIcon: 'Scissors',
        materialIcon: 'content_cut'
    },
    {
        regex: /doctor|medical|first aid|infirmary|doktor|sağlık hizmet|ilk yardım|arzt|médico|врач|طبيب/i,
        category: 'services',
        lucideIcon: 'HeartPulse',
        materialIcon: 'medical_services'
    },
    {
        regex: /library|newspaper|kütüphane|gazete|bibliothek|biblioteca|библиотек|مكتبة/i,
        category: 'services',
        lucideIcon: 'BookOpen',
        materialIcon: 'library_books'
    },
    {
        regex: /housekeeping|turndown|cleaning|temizlik|kat hizmetleri|oda temizliği/i,
        category: 'services',
        lucideIcon: 'BedDouble',
        materialIcon: 'cleaning_services'
    },

    // 12. GENERAL & PROPERTY FEATURES
    {
        regex: /(?:\bair[\s-]?condition|\ba\/c\b|climate control|klima|havalandırma|klimaanlage|aire acondicionado|кондиционер|تكييف)/i,
        category: 'general',
        lucideIcon: 'Snowflake',
        materialIcon: 'ac_unit'
    },
    {
        regex: /(?:\bheating\b|ısıtma|heizung|calefacción|отопление|تدفئة)/i,
        category: 'general',
        lucideIcon: 'Flame',
        materialIcon: 'heat'
    },
    {
        regex: /(?:\belevators?\b|\blift\b|asansör|aufzug|ascensor|лифт|مصعد)/i,
        category: 'general',
        lucideIcon: 'ArrowUpDown',
        materialIcon: 'elevator'
    },
    {
        regex: /lobby|lobi|sitting area|oturma alanı|ortak alan/i,
        category: 'general',
        lucideIcon: 'Sofa',
        materialIcon: 'weekend'
    },
    {
        regex: /shower|bathroom|duş|banyo/i,
        category: 'general',
        lucideIcon: 'ShowerHead',
        materialIcon: 'shower'
    },
    {
        regex: /(?:\bbeds?\b|mattress|pillow|yatak|yastık)/i,
        category: 'general',
        lucideIcon: 'BedDouble',
        materialIcon: 'bed'
    },
    {
        regex: /soundproof|ses yalıtım|schallisoliert|insonoriz/i,
        category: 'general',
        lucideIcon: 'Wind',
        materialIcon: 'volume_off'
    }
];

/**
 * Extract display label from any facility shape (object, string, or numeric ID).
 */
export const extractFacilityLabel = (f, currentLang = 'tr') => {
    if (f == null) return '';
    if (typeof f === 'string') return decodeAmenityText(f);
    if (typeof f === 'number') {
        return FACILITY_ICON_MAP[f]?.label || `Facility #${f}`;
    }
    if (typeof f === 'object') {
        const normLang = String(currentLang || 'en').split(/[-_]/)[0].toLowerCase();
        const names = f.names && typeof f.names === 'object' ? f.names : null;

        let raw =
            names?.[currentLang] ||
            names?.[normLang] ||
            f.name ||
            names?.name ||
            names?.en ||
            names?.tr ||
            names?.default ||
            f.label ||
            '';

        if (Array.isArray(raw)) raw = raw[0] || '';
        const cleaned = decodeAmenityText(String(raw || ''));
        if (cleaned) {
            if (f.value && typeof f.value === 'string' && f.value.trim() && !cleaned.toLowerCase().includes(f.value.trim().toLowerCase())) {
                const val = f.value.trim();
                if (!/^(true|false|yes|no)$/i.test(val)) {
                    return `${cleaned}: ${val}`;
                }
            }
            return cleaned;
        }

        const id = f.facilityId || f.id || f.value;
        if (id && FACILITY_ICON_MAP[Number(id)]) {
            return FACILITY_ICON_MAP[Number(id)].label;
        }
        if (id) return `Facility #${id}`;
    }
    return '';
};

const resolveBackendCategory = (f) => {
    if (!f || typeof f !== 'object') return null;

    if (Array.isArray(f.categories)) {
        for (const rawCat of f.categories) {
            const slug = String(rawCat || '').trim().toLowerCase().replace(/[\s-]+/g, '_');
            if (BACKEND_CATEGORY_SLUG_MAP[slug]) {
                return BACKEND_CATEGORY_SLUG_MAP[slug];
            }
        }
    }

    if (typeof f.category === 'string' && f.category.trim()) {
        const slug = f.category.trim().toLowerCase().replace(/[\s-]+/g, '_');
        if (CATEGORY_MAP[slug]) return slug;
        if (BACKEND_CATEGORY_SLUG_MAP[slug]) return BACKEND_CATEGORY_SLUG_MAP[slug];
    }

    if (typeof f.type === 'string' && f.type.trim()) {
        const t = f.type.trim().toUpperCase();
        if (t === 'BUSINESS') return 'business';
        if (t === 'LEISURE') return 'wellness';
    }

    return null;
};

/**
 * Resolve a single facility/amenity item.
 * Backwards-compatible with callers expecting `{ icon, label }` (Material Symbols Outlined).
 */
export const resolveFacility = (f, currentLang = 'tr') => {
    if (f == null) return null;

    const id = typeof f === 'object' ? (f.facilityId ?? f.id ?? f.value ?? null) : (typeof f === 'number' ? f : null);
    const label = extractFacilityLabel(f, currentLang);
    if (!label) return null;

    const englishHint = typeof f === 'object' ? decodeAmenityText(f.names?.en || f.names?.default || '') : '';
    const matchText = englishHint && englishHint.toLowerCase() !== label.toLowerCase()
        ? `${label} ${englishHint}`
        : label;

    let category = null;
    let lucideIcon = null;
    let materialIcon = null;

    const isGenericFallbackLabel = /^(facility|amenity)\s*#?\d+$/i.test(label);
    if (!isGenericFallbackLabel) {
        for (const rule of CLASSIFICATION_RULES) {
            if (rule.regex.test(matchText)) {
                category = rule.category;
                lucideIcon = typeof rule.lucideIcon === 'function' ? rule.lucideIcon(matchText) : rule.lucideIcon;
                materialIcon = rule.materialIcon;
                break;
            }
        }
    }

    const backendCat = resolveBackendCategory(f);
    if (!category && backendCat) {
        category = backendCat;
        const catMeta = getAmenityCategoryMeta(category);
        lucideIcon = lucideIcon || catMeta.lucideIcon;
        materialIcon = materialIcon || catMeta.materialIcon;
    }

    if ((!lucideIcon || !category) && id != null && FACILITY_ICON_MAP[Number(id)]) {
        const legacy = FACILITY_ICON_MAP[Number(id)];
        category = category || legacy.category || 'general';
        lucideIcon = lucideIcon || legacy.lucideIcon;
        materialIcon = materialIcon || legacy.icon;
    }

    category = category || 'general';
    lucideIcon = lucideIcon || 'Check';
    materialIcon = materialIcon || 'check_circle';

    const parsed = parseAmenityDisplay(label, currentLang);

    return {
        id,
        label,
        displayLabel: parsed.displayLabel,
        badges: parsed.badges,
        icon: materialIcon,
        lucideIcon,
        category,
        isFree: parsed.isFree,
        isSurcharge: parsed.isSurcharge,
        is24Hour: parsed.is24Hour
    };
};

/**
 * Group an array of raw facilities into ordered, deduplicated hospitality categories.
 */
export const groupFacilities = (facilities = [], currentLang = 'tr') => {
    if (!Array.isArray(facilities) || facilities.length === 0) return [];

    const dedupMap = new Map();

    facilities.forEach((raw, idx) => {
        const resolved = resolveFacility(raw, currentLang);
        if (!resolved || !resolved.displayLabel) return;

        const normKey = `${resolved.category}::${resolved.displayLabel.trim().toLowerCase()}`;
        const existing = dedupMap.get(normKey);
        if (existing) {
            // Merge any richer badges onto existing item
            if (resolved.badges.length > existing.badges.length) {
                dedupMap.set(normKey, {
                    ...existing,
                    badges: resolved.badges,
                    isFree: existing.isFree || resolved.isFree,
                    isSurcharge: existing.isSurcharge || resolved.isSurcharge,
                    is24Hour: existing.is24Hour || resolved.is24Hour
                });
            }
            return;
        }

        dedupMap.set(normKey, {
            ...resolved,
            key: `${resolved.category}-${resolved.id ?? idx}-${idx}`
        });
    });

    const bucketMap = new Map();
    for (const item of dedupMap.values()) {
        if (!bucketMap.has(item.category)) {
            bucketMap.set(item.category, []);
        }
        bucketMap.get(item.category).push(item);
    }

    const groups = [];
    for (const cat of AMENITY_CATEGORIES) {
        const items = bucketMap.get(cat.id);
        if (items && items.length > 0) {
            const sorted = [...items].sort((a, b) => {
                if (a.isFree !== b.isFree) return a.isFree ? -1 : 1;
                if (a.is24Hour !== b.is24Hour) return a.is24Hour ? -1 : 1;
                return a.displayLabel.localeCompare(b.displayLabel, currentLang || 'en');
            });

            groups.push({
                id: cat.id,
                meta: cat,
                items: sorted
            });
        }
    }

    return groups;
};

/**
 * Highlight slots for the "Popüler olanaklar" / "Popular amenities" strip.
 */
const HIGHLIGHT_SLOTS = [
    { key: 'breakfast', regex: /free breakfast|buffet breakfast|breakfast|kahvaltı|frühstück|desayuno|завтрак/i, exclude: /wheelchair/i },
    { key: 'wifi', regex: /wi-?fi|wireless internet|kablosuz/i },
    { key: 'ac', regex: /(?:\bair[\s-]?condition|klima|klimaanlage|кондиционер|تكييف)/i },
    { key: 'parking', regex: /(?:\bfree.*parking\b|\bself[- ]?parking\b|\bvalet parking\b|\bparking\b|otopark|park alanı|parkplatz|aparcamiento|парковк|موقف)/i, exclude: /wheelchair|accessible/i },
    { key: 'pool', regex: /swimming pool|outdoor pool|indoor pool|heated pool|rooftop pool|infinity pool|havuz|schwimmbad|piscina|бассейн/i, exclude: /pool table|wheelchair|children'?s pool|kids'? pool/i },
    { key: 'beach', regex: /private beach|beachfront|on the beach|beach access|plaj|sahil|strand|пляж/i, exclude: /wheelchair|shuttle/i },
    { key: 'spa', regex: /full-?service spa|turkish bath|hammam|hamam|\bspa\b|sauna/i, exclude: /wheelchair|spa tub/i },
    { key: 'restaurant', regex: /(?:\brestaurants?\b|\bdining\b|all-?inclusive|restoran|her şey dahil|ресторан|مطعم)/i, exclude: /wheelchair|accessible/i },
    { key: 'fitness', regex: /(?:\bfitness\b|\bgym\b|health club|spor salonu|фитнес|لياقة)/i, exclude: /wheelchair|accessible/i },
    { key: 'shuttle', regex: /airport shuttle|airport transfer|havalimanı|havaalanı/i },
    { key: 'front_desk', regex: /24-?hour front desk|24 saat.*resepsiyon/i },
    { key: 'family', regex: /kids'? club|children'?s club|çocuk kulübü|babysit/i },
    { key: 'pets', regex: /(?:\bpets? allowed\b|pet[\s-]?friendly|evcil hayvan)/i },
    { key: 'bar', regex: /poolside bar|beach bar|bar\/lounge|\blounge\b/i, exclude: /wheelchair/i }
];

export const extractHighlightAmenities = (facilities = [], currentLang = 'tr', maxCount = 6) => {
    if (!Array.isArray(facilities) || facilities.length === 0) return [];

    const resolvedList = [];
    const seen = new Set();
    for (const raw of facilities) {
        const res = resolveFacility(raw, currentLang);
        if (!res || !res.displayLabel) continue;
        const k = res.displayLabel.toLowerCase();
        if (seen.has(k)) continue;
        seen.add(k);
        resolvedList.push(res);
    }

    const picked = [];
    const usedLabels = new Set();

    for (const slot of HIGHLIGHT_SLOTS) {
        if (picked.length >= maxCount) break;
        const candidates = resolvedList.filter(item => {
            if (usedLabels.has(item.displayLabel.toLowerCase())) return false;
            if (slot.exclude && slot.exclude.test(item.label)) return false;
            return slot.regex.test(item.label);
        });

        if (candidates.length > 0) {
            candidates.sort((a, b) => {
                if (a.isFree !== b.isFree) return a.isFree ? -1 : 1;
                return a.displayLabel.length - b.displayLabel.length;
            });
            const best = candidates[0];
            picked.push(best);
            usedLabels.add(best.displayLabel.toLowerCase());
        }
    }

    if (picked.length < Math.min(maxCount, resolvedList.length)) {
        for (const item of resolvedList) {
            if (picked.length >= maxCount) break;
            const k = item.displayLabel.toLowerCase();
            if (usedLabels.has(k)) continue;
            if (item.category === 'accessibility' || item.category === 'sustainability') continue;
            picked.push(item);
            usedLabels.add(k);
        }
    }

    return picked;
};
