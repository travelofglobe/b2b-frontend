/**
 * Facility & Amenity resolution, icon mapping, and category grouping utilities.
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
    3064: { icon: 'atm', lucideIcon: 'CreditCard', category: 'services', label: 'ATM' },
    18006: { icon: 'business_center', lucideIcon: 'Briefcase', category: 'business', label: 'Business Centre' },
    18366: { icon: 'local_laundry_service', lucideIcon: 'WashingMachine', category: 'services', label: 'Laundry' },
    603: { icon: 'child_care', lucideIcon: 'Baby', category: 'family_pets', label: 'Babysitting' },
    638: { icon: 'explore', lucideIcon: 'Compass', category: 'services', label: 'Tour Desk' },
    646: { icon: 'support_agent', lucideIcon: 'ConciergeBell', category: 'services', label: 'Concierge' },
    666: { icon: 'car_rental', lucideIcon: 'Car', category: 'parking_transport', label: 'Car Rental' },
    1993: { icon: 'lock', lucideIcon: 'Lock', category: 'services', label: 'Safety Box' },
    1995: { icon: 'accessible', lucideIcon: 'Accessibility', category: 'accessibility', label: 'Wheelchair Access' },
    2007: { icon: 'elevator', lucideIcon: 'ArrowUpDown', category: 'general', label: 'Elevator' },
    98485: { icon: 'security', lucideIcon: 'ShieldCheck', category: 'general', label: 'Security' },
    100075: { icon: 'smoking_rooms', lucideIcon: 'Cigarette', category: 'general', label: 'Smoking Area' },
    1687: { icon: 'surfing', lucideIcon: 'Waves', category: 'wellness', label: 'Water Sports' },
    1981: { icon: 'child_friendly', lucideIcon: 'Baby', category: 'family_pets', label: 'Kids Club' },
    3724: { icon: 'beach_access', lucideIcon: 'Umbrella', category: 'pool_beach', label: 'Beach' },
    18126: { icon: 'directions_bike', lucideIcon: 'Bike', category: 'parking_transport', label: 'Bicycle Rental' },
    98415: { icon: 'airport_shuttle', lucideIcon: 'Plane', category: 'parking_transport', label: 'Airport Shuttle' },
    610: { icon: 'local_parking', lucideIcon: 'CircleParking', category: 'parking_transport', label: 'Parking' },
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
 * Ordered hospitality category definitions for grouping property amenities.
 */
export const AMENITY_CATEGORIES = [
    {
        id: 'internet',
        lucideIcon: 'Wifi',
        materialIcon: 'wifi',
        accent: {
            headerBg: 'bg-blue-50/70 dark:bg-blue-950/25',
            badgeBg: 'bg-blue-100/90 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300',
            itemBg: 'bg-blue-50/90 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400',
            chipActive: 'bg-blue-600 text-white border-blue-600 dark:bg-blue-500 dark:border-blue-500'
        },
        labels: {
            tr: 'İnternet & Bağlantı',
            en: 'Internet & Connectivity',
            de: 'Internet & Technik',
            ar: 'الإنترنت والتقنية',
            es: 'Internet y conectividad',
            ru: 'Интернет и связь',
            fr: 'Internet et connectivité',
            it: 'Internet e connettività',
            pt: 'Internet e conectividade',
            zh: '网络与连接',
            ja: 'インターネット・通信',
            fa: 'اینترنت و ارتباطات',
            el: 'Διαδίκτυο & Συνδεσιμότητα'
        },
        shortLabels: {
            tr: 'İnternet',
            en: 'Internet',
            de: 'Internet',
            ar: 'الإنترنت',
            es: 'Internet',
            ru: 'Интернет',
            fr: 'Internet',
            it: 'Internet',
            pt: 'Internet'
        }
    },
    {
        id: 'dining',
        lucideIcon: 'Utensils',
        materialIcon: 'restaurant',
        accent: {
            headerBg: 'bg-amber-50/70 dark:bg-amber-950/20',
            badgeBg: 'bg-amber-100/90 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300',
            itemBg: 'bg-amber-50/90 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400',
            chipActive: 'bg-amber-600 text-white border-amber-600 dark:bg-amber-500 dark:border-amber-500'
        },
        labels: {
            tr: 'Yeme & İçme',
            en: 'Food & Drink',
            de: 'Speisen & Getränke',
            ar: 'الطعام والشراب',
            es: 'Comida y bebida',
            ru: 'Питание и напитки',
            fr: 'Restauration et boissons',
            it: 'Cibo e bevande',
            pt: 'Comidas e bebidas',
            zh: '餐饮服务',
            ja: '飲食・レストラン',
            fa: 'غذا و نوشیدنی',
            el: 'Φαγητό & Ποτό'
        },
        shortLabels: {
            tr: 'Yeme & İçme',
            en: 'Food & Drink',
            de: 'Gastronomie',
            ar: 'الطعام',
            es: 'Comida',
            ru: 'Питание',
            fr: 'Restauration',
            it: 'Ristorazione',
            pt: 'Alimentação'
        }
    },
    {
        id: 'pool_beach',
        lucideIcon: 'Waves',
        materialIcon: 'pool',
        accent: {
            headerBg: 'bg-cyan-50/70 dark:bg-cyan-950/20',
            badgeBg: 'bg-cyan-100/90 text-cyan-700 dark:bg-cyan-500/20 dark:text-cyan-300',
            itemBg: 'bg-cyan-50/90 text-cyan-600 dark:bg-cyan-500/15 dark:text-cyan-400',
            chipActive: 'bg-cyan-600 text-white border-cyan-600 dark:bg-cyan-500 dark:border-cyan-500'
        },
        labels: {
            tr: 'Havuz, Plaj & Açık Alanlar',
            en: 'Pool, Beach & Outdoors',
            de: 'Pool, Strand & Außenbereich',
            ar: 'المسبح والشاطئ والمساحات الخارجية',
            es: 'Piscina, playa y exteriores',
            ru: 'Бассейн, пляж и территория',
            fr: 'Piscine, plage et extérieurs',
            it: 'Piscina, spiaggia ed esterni',
            pt: 'Piscina, praia e área externa',
            zh: '泳池、海滩与户外',
            ja: 'プール・ビーチ・屋外',
            fa: 'استخر، ساحل و فضای باز',
            el: 'Πισίνα, Παραλία & Εξωτερικοί Χώροι'
        },
        shortLabels: {
            tr: 'Havuz & Plaj',
            en: 'Pool & Beach',
            de: 'Pool & Strand',
            ar: 'المسبح والشاطئ',
            es: 'Piscina y playa',
            ru: 'Бассейн и пляж',
            fr: 'Piscine & Plage',
            it: 'Piscina & Spiaggia',
            pt: 'Piscina e Praia'
        }
    },
    {
        id: 'wellness',
        lucideIcon: 'Sparkles',
        materialIcon: 'spa',
        accent: {
            headerBg: 'bg-emerald-50/70 dark:bg-emerald-950/20',
            badgeBg: 'bg-emerald-100/90 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300',
            itemBg: 'bg-emerald-50/90 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400',
            chipActive: 'bg-emerald-600 text-white border-emerald-600 dark:bg-emerald-500 dark:border-emerald-500'
        },
        labels: {
            tr: 'Spa, Sağlık & Aktiviteler',
            en: 'Spa, Wellness & Activities',
            de: 'Spa, Wellness & Aktivitäten',
            ar: 'السبا والعافية والأنشطة',
            es: 'Spa, bienestar y actividades',
            ru: 'Спа, велнес и развлечения',
            fr: 'Spa, bien-être et activités',
            it: 'Spa, benessere e attività',
            pt: 'Spa, bem-estar e atividades',
            zh: '水疗、健身与娱乐',
            ja: 'スパ・ウェルネス・アクティビティ',
            fa: 'اسپا، سلامت و تفریحات',
            el: 'Σπα, Ευεξία & Δραστηριότητες'
        },
        shortLabels: {
            tr: 'Spa & Spor',
            en: 'Spa & Fitness',
            de: 'Spa & Fitness',
            ar: 'السبا واللياقة',
            es: 'Spa y fitness',
            ru: 'Спа и спорт',
            fr: 'Spa & Sport',
            it: 'Spa & Fitness',
            pt: 'Spa e Lazer'
        }
    },
    {
        id: 'parking_transport',
        lucideIcon: 'Car',
        materialIcon: 'local_parking',
        accent: {
            headerBg: 'bg-indigo-50/70 dark:bg-indigo-950/20',
            badgeBg: 'bg-indigo-100/90 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300',
            itemBg: 'bg-indigo-50/90 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-400',
            chipActive: 'bg-indigo-600 text-white border-indigo-600 dark:bg-indigo-500 dark:border-indigo-500'
        },
        labels: {
            tr: 'Otopark & Ulaşım',
            en: 'Parking & Transportation',
            de: 'Parken & Transfer',
            ar: 'المواقف والمواصلات',
            es: 'Aparcamiento y transporte',
            ru: 'Парковка и трансфер',
            fr: 'Parking et transport',
            it: 'Parcheggio e trasporti',
            pt: 'Estacionamento e transporte',
            zh: '停车与交通',
            ja: '駐車場・送迎',
            fa: 'پارکینگ و حمل‌ونقل',
            el: 'Στάθμευση & Μεταφορά'
        },
        shortLabels: {
            tr: 'Otopark & Ulaşım',
            en: 'Parking & Transit',
            de: 'Parken & Transfer',
            ar: 'المواقف والنقل',
            es: 'Transporte',
            ru: 'Парковка',
            fr: 'Parking',
            it: 'Parcheggio',
            pt: 'Estacionamento'
        }
    },
    {
        id: 'services',
        lucideIcon: 'ConciergeBell',
        materialIcon: 'support_agent',
        accent: {
            headerBg: 'bg-sky-50/70 dark:bg-sky-950/20',
            badgeBg: 'bg-sky-100/90 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300',
            itemBg: 'bg-sky-50/90 text-sky-600 dark:bg-sky-500/15 dark:text-sky-400',
            chipActive: 'bg-sky-600 text-white border-sky-600 dark:bg-sky-500 dark:border-sky-500'
        },
        labels: {
            tr: 'Resepsiyon & Misafir Hizmetleri',
            en: 'Guest Services & Reception',
            de: 'Rezeption & Gästeservice',
            ar: 'الاستقبال وخدمات النزلاء',
            es: 'Recepción y servicios',
            ru: 'Ресепшн и услуги',
            fr: 'Réception et services',
            it: 'Reception e servizi',
            pt: 'Recepção e serviços',
            zh: '前台与宾客服务',
            ja: 'フロント・ゲストサービス',
            fa: 'پذیرش و خدمات مهمان',
            el: 'Υποδοχή & Υπηρεσίες'
        },
        shortLabels: {
            tr: 'Hizmetler',
            en: 'Services',
            de: 'Service',
            ar: 'الخدمات',
            es: 'Servicios',
            ru: 'Услуги',
            fr: 'Services',
            it: 'Servizi',
            pt: 'Serviços'
        }
    },
    {
        id: 'family_pets',
        lucideIcon: 'Baby',
        materialIcon: 'child_friendly',
        accent: {
            headerBg: 'bg-rose-50/70 dark:bg-rose-950/20',
            badgeBg: 'bg-rose-100/90 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300',
            itemBg: 'bg-rose-50/90 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400',
            chipActive: 'bg-rose-600 text-white border-rose-600 dark:bg-rose-500 dark:border-rose-500'
        },
        labels: {
            tr: 'Aile, Çocuk & Evcil Hayvan',
            en: 'Family, Kids & Pets',
            de: 'Familie, Kinder & Haustiere',
            ar: 'العائلة والأطفال والحيوانات الأليفة',
            es: 'Familia, niños y mascotas',
            ru: 'Семья, дети и питомцы',
            fr: 'Famille, enfants et animaux',
            it: 'Famiglia, bambini e animali',
            pt: 'Família, crianças e pets',
            zh: '亲子与宠物',
            ja: 'ファミリー・ペット',
            fa: 'خانواده، کودک و حیوانات خانگی',
            el: 'Οικογένεια, Παιδιά & Κατοικίδια'
        },
        shortLabels: {
            tr: 'Aile & Çocuk',
            en: 'Family & Pets',
            de: 'Familie',
            ar: 'العائلة',
            es: 'Familia',
            ru: 'Семья и дети',
            fr: 'Famille',
            it: 'Famiglia',
            pt: 'Família'
        }
    },
    {
        id: 'business',
        lucideIcon: 'Briefcase',
        materialIcon: 'business_center',
        accent: {
            headerBg: 'bg-violet-50/70 dark:bg-violet-950/20',
            badgeBg: 'bg-violet-100/90 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300',
            itemBg: 'bg-violet-50/90 text-violet-600 dark:bg-violet-500/15 dark:text-violet-400',
            chipActive: 'bg-violet-600 text-white border-violet-600 dark:bg-violet-500 dark:border-violet-500'
        },
        labels: {
            tr: 'İş, Toplantı & Etkinlik',
            en: 'Business & Events',
            de: 'Business & Tagungen',
            ar: 'الأعمال والفعاليات',
            es: 'Negocios y eventos',
            ru: 'Бизнес и мероприятия',
            fr: 'Affaires et événements',
            it: 'Business ed eventi',
            pt: 'Negócios e eventos',
            zh: '商务与会议',
            ja: 'ビジネス・イベント',
            fa: 'کسب‌وکار و رویدادها',
            el: 'Επιχειρήσεις & Εκδηλώσεις'
        },
        shortLabels: {
            tr: 'İş & Toplantı',
            en: 'Business',
            de: 'Business',
            ar: 'الأعمال',
            es: 'Negocios',
            ru: 'Бизнес',
            fr: 'Affaires',
            it: 'Business',
            pt: 'Negócios'
        }
    },
    {
        id: 'accessibility',
        lucideIcon: 'Accessibility',
        materialIcon: 'accessible',
        accent: {
            headerBg: 'bg-teal-50/70 dark:bg-teal-950/20',
            badgeBg: 'bg-teal-100/90 text-teal-700 dark:bg-teal-500/20 dark:text-teal-300',
            itemBg: 'bg-teal-50/90 text-teal-600 dark:bg-teal-500/15 dark:text-teal-400',
            chipActive: 'bg-teal-600 text-white border-teal-600 dark:bg-teal-500 dark:border-teal-500'
        },
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
        },
        shortLabels: {
            tr: 'Erişilebilirlik',
            en: 'Accessibility',
            de: 'Barrierefrei',
            ar: 'الوصول',
            es: 'Accesibilidad',
            ru: 'Доступность',
            fr: 'Accessibilité',
            it: 'Accessibilità',
            pt: 'Acessibilidade'
        }
    },
    {
        id: 'sustainability',
        lucideIcon: 'Leaf',
        materialIcon: 'eco',
        accent: {
            headerBg: 'bg-lime-50/70 dark:bg-lime-950/20',
            badgeBg: 'bg-lime-100/90 text-lime-700 dark:bg-lime-500/20 dark:text-lime-300',
            itemBg: 'bg-lime-50/90 text-lime-700 dark:bg-lime-500/15 dark:text-lime-400',
            chipActive: 'bg-lime-600 text-white border-lime-600 dark:bg-lime-600 dark:border-lime-600'
        },
        labels: {
            tr: 'Sürdürülebilirlik & Çevre',
            en: 'Eco & Sustainability',
            de: 'Nachhaltigkeit',
            ar: 'الاستدامة والبيئة',
            es: 'Sostenibilidad',
            ru: 'Экологичность',
            fr: 'Développement durable',
            it: 'Sostenibilità',
            pt: 'Sustentabilidade',
            zh: '环保与可持续',
            ja: 'サステナビリティ',
            fa: 'پایداری محیط‌زیست',
            el: 'Βιωσιμότητα'
        },
        shortLabels: {
            tr: 'Sürdürülebilirlik',
            en: 'Eco-friendly',
            de: 'Nachhaltigkeit',
            ar: 'الاستدامة',
            es: 'Ecológico',
            ru: 'Эко',
            fr: 'Éco',
            it: 'Eco',
            pt: 'Eco'
        }
    },
    {
        id: 'general',
        lucideIcon: 'Building2',
        materialIcon: 'apartment',
        accent: {
            headerBg: 'bg-slate-100/80 dark:bg-slate-800/70',
            badgeBg: 'bg-slate-200/80 text-slate-700 dark:bg-slate-700 dark:text-slate-200',
            itemBg: 'bg-slate-100 text-slate-600 dark:bg-slate-700/60 dark:text-slate-300',
            chipActive: 'bg-slate-700 text-white border-slate-700 dark:bg-slate-600 dark:border-slate-600'
        },
        labels: {
            tr: 'Genel Özellikler & Kurallar',
            en: 'General & Property Features',
            de: 'Allgemein & Ausstattung',
            ar: 'المرافق العامة والسياسات',
            es: 'General y políticas',
            ru: 'Общие удобства и правила',
            fr: 'Général et équipements',
            it: 'Generale e struttura',
            pt: 'Geral e comodidades',
            zh: '综合设施与政策',
            ja: '一般設備・ポリシー',
            fa: 'امکانات عمومی و قوانین',
            el: 'Γενικά & Πολιτικές'
        },
        shortLabels: {
            tr: 'Genel',
            en: 'General',
            de: 'Allgemein',
            ar: 'عام',
            es: 'General',
            ru: 'Общее',
            fr: 'Général',
            it: 'Generale',
            pt: 'Geral'
        }
    }
];

const CATEGORY_MAP = AMENITY_CATEGORIES.reduce((acc, cat) => {
    acc[cat.id] = cat;
    return acc;
}, {});

export const getAmenityCategoryMeta = (categoryId) => CATEGORY_MAP[categoryId] || CATEGORY_MAP.general;

export const getAmenityCategoryLabel = (categoryId, lang = 'en', short = false) => {
    const meta = getAmenityCategoryMeta(categoryId);
    const norm = String(lang || 'en').split(/[-_]/)[0].toLowerCase();
    if (short) {
        return meta.shortLabels?.[norm] || meta.shortLabels?.en || meta.labels?.[norm] || meta.labels.en;
    }
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
    air_conditioning: 'general',
    smoke_free: 'general',
    non_smoking: 'general'
};

/**
 * Ordered multilingual classification rules.
 * Order matters carefully to avoid false positives (e.g. wheelchair-accessible parking -> accessibility,
 * water-efficient showers -> sustainability, pool table -> wellness, poolside bar -> dining).
 */
const CLASSIFICATION_RULES = [
    // 1. ACCESSIBILITY (must precede parking, pool, restaurant, bathroom, elevator paths)
    {
        regex: /wheelchair|accessible|roll-in shower|grab bar|stair-free|step-free|well-lit path|handrail|braille|raised signage|sign language|assistive listening|visual alarm|pool hoist|transfer shower|low-height|tekerlekli sandalye|engelli|erişilebilir|rollstuhl|barrierefrei|behindertengerecht|silla de ruedas|accesible|инвалид|доступн|كرسي متحرك|ذوي الاحتياجات/i,
        category: 'accessibility',
        lucideIcon: 'Accessibility',
        materialIcon: 'accessible'
    },

    // 2. SUSTAINABILITY / ECO-FRIENDLY (must precede dining/water/lighting/general)
    {
        regex: /recycl|single-use plastic|biodegradable|compost|led light|energy-saving|water-efficient|greywater|solar energy|renewable energy|eco-friendly|sustainable|sustainability|locally-sourced|organic food|food waste|reusable cups|double-glazed|change of bedsheets \(on request\)|change of towels \(on request\)|towel change|housekeeping on request|bulk dispenser|plant-based|vegetarian menu|vegan menu|carbon|green key|sürdürülebilir|geri dönüşüm|güneş enerjisi|su tasarruf|enerji tasarruf|çevre dostu|tek kullanımlık plastik|organik|yerel kaynaklı|nachhaltig|recycl|umweltfreundlich|sostenib|эколог|переработ|مستدام/i,
        category: 'sustainability',
        lucideIcon: (s) => (/recycl|geri dönüşüm|compost|waste/i.test(s) ? 'Recycle' : (/water-efficient|greywater|su tasarruf/i.test(s) ? 'Droplets' : (/solar|led|energy|enerji|güneş/i.test(s) ? 'Sun' : 'Leaf'))),
        materialIcon: 'eco'
    },

    // 3. FAMILY, KIDS & PETS (catch children's pool, kids club, pets before general pool/services)
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
        regex: /wi-?fi|wireless internet|kablosuz internet|wlan|вай-?фай|واي فاي/i,
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

    // 6. SPA, WELLNESS, SPORTS & ENTERTAINMENT (check pool table / water sports before generic pool!)
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

    // 7. POOL, BEACH & OUTDOORS
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

    // 8. PARKING & TRANSPORTATION
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
        lucideIcon: 'CircleParking',
        materialIcon: 'local_parking'
    },

    // 9. BUSINESS & EVENTS
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

    // 10. GUEST SERVICES & RECEPTION (check safe-deposit before front desk!)
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
        regex: /atm|banking|currency exchange|döviz|bankamatik|geldautomat|cambio de divisas|банкомат|обмен валют|صراف/i,
        category: 'services',
        lucideIcon: 'CreditCard',
        materialIcon: 'atm'
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

    // 11. GENERAL & PROPERTY FEATURES
    {
        regex: /smoke-?free|non-?smoking|sigara içilmez|sigara içilmeyen|nichtraucher|libre de humo|для некурящих|خالي من التدخين/i,
        category: 'general',
        lucideIcon: 'CigaretteOff',
        materialIcon: 'smoke_free'
    },
    {
        regex: /smoking area|designated smoking|sigara içme|sigara alanı|raucherbereich|zona de fumadores|для курящих|التدخين/i,
        category: 'general',
        lucideIcon: 'Cigarette',
        materialIcon: 'smoking_rooms'
    },
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
        regex: /security|cctv|fire extinguisher|smoke detector|carbon monoxide|güvenlik|yangın|kamera|alarm|sicherheit|seguridad|безопасност|أمن/i,
        category: 'general',
        lucideIcon: 'ShieldCheck',
        materialIcon: 'security'
    },
    {
        regex: /lobby|lobi|television in common|sitting area|oturma alanı|ortak alan/i,
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
                // Only append informative non-boolean values like numeric counts or times if absent
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

/**
 * Resolve category from backend-supplied `categories` array or `type` field if present.
 */
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
 * Resolve a single facility/amenity item to { id, label, icon, lucideIcon, category, isFree, isSurcharge }.
 * Backwards-compatible with callers expecting `{ icon, label }` (Material Symbols Outlined).
 */
export const resolveFacility = (f, currentLang = 'tr') => {
    if (f == null) return null;

    const id = typeof f === 'object' ? (f.facilityId ?? f.id ?? f.value ?? null) : (typeof f === 'number' ? f : null);
    const label = extractFacilityLabel(f, currentLang);
    if (!label) return null;

    // Also include English name for reliable keyword matching when UI language is non-Latin (e.g. ar/ru/zh)
    const englishHint = typeof f === 'object' ? decodeAmenityText(f.names?.en || f.names?.default || '') : '';
    const matchText = englishHint && englishHint.toLowerCase() !== label.toLowerCase()
        ? `${label} ${englishHint}`
        : label;

    let category = null;
    let lucideIcon = null;
    let materialIcon = null;

    // 1. Match by descriptive label keywords first (prevents Expedia vs legacy numeric ID collisions)
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

    // 2. Respect explicit backend category slug when keyword didn't match (or refine generic matches)
    const backendCat = resolveBackendCategory(f);
    if (!category && backendCat) {
        category = backendCat;
        const catMeta = getAmenityCategoryMeta(category);
        lucideIcon = lucideIcon || catMeta.lucideIcon;
        materialIcon = materialIcon || catMeta.materialIcon;
    }

    // 3. Fallback to legacy numeric FACILITY_ICON_MAP only if keywords didn't match
    if ((!lucideIcon || !category) && id != null && FACILITY_ICON_MAP[Number(id)]) {
        const legacy = FACILITY_ICON_MAP[Number(id)];
        category = category || legacy.category || 'general';
        lucideIcon = lucideIcon || legacy.lucideIcon;
        materialIcon = materialIcon || legacy.icon;
    }

    // 4. Final clean defaults
    category = category || 'general';
    lucideIcon = lucideIcon || 'CheckCircle2';
    materialIcon = materialIcon || 'check_circle';

    const isFree = /\b(free|complimentary|ücretsiz|kostenlos|gratis|бесплатн|مجان)\b/i.test(matchText);
    const isSurcharge = /\b(surcharge|extra charge|fee|fees|paid|ücretli|ek ücret|gegen gebühr|de pago|платн|برسوم)\b/i.test(matchText);

    return {
        id,
        label,
        icon: materialIcon,
        lucideIcon,
        category,
        isFree,
        isSurcharge
    };
};

/**
 * Group an array of raw facilities into ordered, deduplicated hospitality categories.
 */
export const groupFacilities = (facilities = [], currentLang = 'tr') => {
    if (!Array.isArray(facilities) || facilities.length === 0) return [];

    const seenLabels = new Set();
    const bucketMap = new Map();

    facilities.forEach((raw, idx) => {
        const resolved = resolveFacility(raw, currentLang);
        if (!resolved || !resolved.label) return;

        const normKey = resolved.label.trim().toLowerCase();
        if (seenLabels.has(normKey)) return;
        seenLabels.add(normKey);

        if (!bucketMap.has(resolved.category)) {
            bucketMap.set(resolved.category, []);
        }
        bucketMap.get(resolved.category).push({
            ...resolved,
            key: `${resolved.category}-${resolved.id ?? idx}-${idx}`
        });
    });

    const groups = [];
    for (const cat of AMENITY_CATEGORIES) {
        const items = bucketMap.get(cat.id);
        if (items && items.length > 0) {
            // Sort: free amenities first, then specific-icon amenities before fallback CheckCircle2, then alphabetically
            const sorted = [...items].sort((a, b) => {
                if (a.isFree !== b.isFree) return a.isFree ? -1 : 1;
                const aHasSpecific = a.lucideIcon !== 'CheckCircle2';
                const bHasSpecific = b.lucideIcon !== 'CheckCircle2';
                if (aHasSpecific !== bHasSpecific) return aHasSpecific ? -1 : 1;
                return a.label.localeCompare(b.label, currentLang || 'en');
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
 * Highlight slots for picking the most valuable distinct selling points
 * for overview strips and summary badges (max 1 item per slot).
 */
const HIGHLIGHT_SLOTS = [
    { key: 'wifi', regex: /wi-?fi|wireless internet|kablosuz/i },
    { key: 'pool', regex: /swimming pool|outdoor pool|indoor pool|heated pool|rooftop pool|infinity pool|havuz|schwimmbad|piscina|бассейн/i, exclude: /pool table|wheelchair|children'?s pool|kids'? pool/i },
    { key: 'beach', regex: /private beach|beachfront|on the beach|beach access|plaj|sahil|strand|пляж/i, exclude: /wheelchair|shuttle/i },
    { key: 'breakfast', regex: /free breakfast|buffet breakfast|breakfast|kahvaltı|frühstück|desayuno|завтрак/i, exclude: /wheelchair/i },
    { key: 'spa', regex: /full-?service spa|turkish bath|hammam|hamam|\bspa\b|sauna/i, exclude: /wheelchair|spa tub/i },
    { key: 'parking', regex: /(?:\bfree.*parking\b|\bself[- ]?parking\b|\bvalet parking\b|\bparking\b|otopark|parkplatz|aparcamiento|парковк|موقف)/i, exclude: /wheelchair|accessible/i },
    { key: 'restaurant', regex: /(?:\brestaurants?\b|\bdining\b|all-?inclusive|restoran|her şey dahil|ресторан|مطعم)/i, exclude: /wheelchair|accessible/i },
    { key: 'fitness', regex: /(?:\bfitness\b|\bgym\b|health club|spor salonu|фитнес|لياقة)/i, exclude: /wheelchair|accessible/i },
    { key: 'shuttle', regex: /airport shuttle|airport transfer|havalimanı|havaalanı/i },
    { key: 'ac', regex: /(?:\bair[\s-]?condition|klima|klimaanlage|кондиционер|تكييف)/i },
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
        if (!res || !res.label) continue;
        const k = res.label.toLowerCase();
        if (seen.has(k)) continue;
        seen.add(k);
        resolvedList.push(res);
    }

    const picked = [];
    const usedLabels = new Set();

    for (const slot of HIGHLIGHT_SLOTS) {
        if (picked.length >= maxCount) break;
        // Prefer free items matching this slot first
        const candidates = resolvedList.filter(item => {
            if (usedLabels.has(item.label.toLowerCase())) return false;
            if (slot.exclude && slot.exclude.test(item.label)) return false;
            return slot.regex.test(item.label);
        });

        if (candidates.length > 0) {
            candidates.sort((a, b) => {
                if (a.isFree !== b.isFree) return a.isFree ? -1 : 1;
                return a.label.length - b.label.length;
            });
            const best = candidates[0];
            picked.push(best);
            usedLabels.add(best.label.toLowerCase());
        }
    }

    // If fewer than maxCount highlights matched known slots, top up with clean non-accessibility items
    if (picked.length < Math.min(maxCount, resolvedList.length)) {
        for (const item of resolvedList) {
            if (picked.length >= maxCount) break;
            const k = item.label.toLowerCase();
            if (usedLabels.has(k)) continue;
            if (item.category === 'accessibility' || item.category === 'sustainability') continue;
            picked.push(item);
            usedLabels.add(k);
        }
    }

    return picked;
};
