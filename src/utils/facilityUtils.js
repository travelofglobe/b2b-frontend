export const FACILITY_ICON_MAP = {
    98445: { icon: 'wifi', label: 'Free Wifi' },
    48325: { icon: 'wifi', label: 'Wifi Access' },
    3664: { icon: 'wifi', label: 'High Speed Internet' },
    616: { icon: 'pool', label: 'Outdoor Pool' },
    649: { icon: 'pool', label: 'Indoor Pool' },
    1685: { icon: 'pool', label: 'Kids Pool' },
    1985: { icon: 'spa', label: 'Spa' },
    1978: { icon: 'fitness_center', label: 'Health Club' },
    98455: { icon: 'fitness_center', label: 'Fitness' },
    47935: { icon: 'fitness_center', label: 'Gym' },
    641: { icon: 'restaurant', label: 'Restaurant' },
    3134: { icon: 'local_bar', label: 'Bar' },
    606: { icon: 'pets', label: 'Pets Allowed' },
    719: { icon: 'ac_unit', label: 'Air Conditioning' },
    101165: { icon: 'inventory_2', label: 'Minibar' },
    618: { icon: 'sports_tennis', label: 'Tennis' },
    3164: { icon: 'casino', label: 'Casino' },
    3154: { icon: 'nightlife', label: 'Night Club' },
    3891: { icon: 'hot_tub', label: 'Jacuzzi' },
    650: { icon: 'spa', label: 'Sauna' },
    3064: { icon: 'atm', label: 'ATM' },
    18006: { icon: 'business_center', label: 'Business Centre' },
    18366: { icon: 'local_laundry_service', label: 'Laundry' },
    603: { icon: 'child_care', label: 'Babysitting' },
    638: { icon: 'explore', label: 'Tour Desk' },
    646: { icon: 'support_agent', label: 'Concierge' },
    666: { icon: 'car_rental', label: 'Car Rental' },
    1993: { icon: 'lock', label: 'Safety Box' },
    1995: { icon: 'wheelchair_pickup', label: 'Wheelchair Access' },
    2007: { icon: 'elevator', label: 'Elevator' },
    98485: { icon: 'security', label: 'Security' },
    100075: { icon: 'smoking_rooms', label: 'Smoking Area' },
    1687: { icon: 'water_sports', label: 'Water Sports' },
    1981: { icon: 'child_friendly', label: 'Kids Club' },
    3724: { icon: 'beach_access', label: 'Beach' },
    18126: { icon: 'directions_bike', label: 'Bicycle Rental' },
    98415: { icon: 'airport_shuttle', label: 'Airport Shuttle' },
    334: { icon: 'wifi', label: 'Internet' },
    610: { icon: 'local_parking', label: 'Parking' },
    1984: { icon: 'self_improvement', label: 'Yoga' },
    1991: { icon: 'meeting_room', label: 'Meeting Rooms' },
    611: { icon: 'room_service', label: 'Room Service' },
    1986: { icon: 'sports_soccer', label: 'Sports' },
    3184: { icon: 'live_tv', label: 'Satellite TV' },
    607: { icon: 'coffee_maker', label: 'Coffee Maker' },
    100065: { icon: 'dry_cleaning', label: 'Dry Cleaning' },
    637: { icon: 'local_shipping', label: 'Shuttle Service' },
    18096: { icon: 'storefront', label: 'Gift Shop' },
    623: { icon: 'library_books', label: 'Library' },
    1979: { icon: 'medical_services', label: 'Doctor' },
    1989: { icon: 'local_florist', label: 'Garden' },
    3174: { icon: 'event_seat', label: 'Banquet Hall' },
    18226: { icon: 'videogame_asset', label: 'Game Room' },
    3144: { icon: 'theater_comedy', label: 'Entertainment' },
    1988: { icon: 'desk', label: 'Work Desk' },
    639: { icon: 'kitchen', label: 'Kitchenette' },
    98425: { icon: 'balcony', label: 'Balcony' }
};

export const resolveFacility = (f, currentLang = 'tr') => {
    if (!f) return null;
    let label = '';
    let id = null;

    if (typeof f === 'string') {
        label = f.trim();
    } else if (typeof f === 'number') {
        id = f;
    } else if (typeof f === 'object') {
        id = f.facilityId || f.id || f.value;
        label = f.names?.[currentLang] || f.name || f.names?.tr || f.names?.en || f.label || '';
        if (Array.isArray(label)) label = label[0] || '';
    }

    if (!label && id && FACILITY_ICON_MAP[Number(id)]) {
        label = FACILITY_ICON_MAP[Number(id)].label;
    }

    if (!label && id) {
        label = `Facility #${id}`;
    }

    if (!label) return null;

    // Detect icon from ID first if matched
    let icon = (id && FACILITY_ICON_MAP[Number(id)]?.icon) || null;

    // If icon not found by ID, infer by keyword
    if (!icon) {
        const lower = label.toLowerCase();
        if (lower.includes('wifi') || lower.includes('wi-fi') || lower.includes('internet') || lower.includes('kablosuz')) {
            icon = 'wifi';
        } else if (lower.includes('otopark') || lower.includes('park') || lower.includes('garaj') || lower.includes('valet')) {
            icon = 'local_parking';
        } else if (lower.includes('klima') || lower.includes('air condition') || lower.includes('havalandırma') || lower.includes('ac')) {
            icon = 'ac_unit';
        } else if (lower.includes('kahvaltı') || lower.includes('breakfast') || lower.includes('coffee') || lower.includes('çay') || lower.includes('cafe')) {
            icon = 'free_breakfast';
        } else if (lower.includes('restoran') || lower.includes('restaurant') || lower.includes('yemek') || lower.includes('büfe') || lower.includes('dining')) {
            icon = 'restaurant';
        } else if (lower.includes('havuz') || lower.includes('pool') || lower.includes('yüzme')) {
            icon = 'pool';
        } else if (lower.includes('spa') || lower.includes('sauna') || lower.includes('masaj') || lower.includes('hamam') || lower.includes('buhar')) {
            icon = 'spa';
        } else if (lower.includes('fitness') || lower.includes('spor') || lower.includes('gym') || lower.includes('egzersiz')) {
            icon = 'fitness_center';
        } else if (lower.includes('bar') || lower.includes('lounge') || lower.includes('gece')) {
            icon = 'local_bar';
        } else if (lower.includes('transfer') || lower.includes('shuttle') || lower.includes('servis') || lower.includes('havaalan') || lower.includes('havaliman')) {
            icon = 'airport_shuttle';
        } else if (lower.includes('mutfak') || lower.includes('kitchen') || lower.includes('ocak') || lower.includes('fırın') || lower.includes('mikrodalga')) {
            icon = 'kitchen';
        } else if (lower.includes('plaj') || lower.includes('beach') || lower.includes('sahil') || lower.includes('deniz')) {
            icon = 'beach_access';
        } else if (lower.includes('çamaşır') || lower.includes('laundry') || lower.includes('kuru temizleme') || lower.includes('ütü')) {
            icon = 'local_laundry_service';
        } else if (lower.includes('resepsiyon') || lower.includes('front desk') || lower.includes('danışma') || lower.includes('concierge') || lower.includes('24 saat')) {
            icon = 'support_agent';
        } else if (lower.includes('asansör') || lower.includes('elevator') || lower.includes('lift')) {
            icon = 'elevator';
        } else if (lower.includes('evcil') || lower.includes('pet')) {
            icon = 'pets';
        } else if (lower.includes('sigara') || lower.includes('smoke')) {
            icon = lower.includes('içilmeyen') || lower.includes('free') ? 'smoke_free' : 'smoking_rooms';
        } else if (lower.includes('çocuk') || lower.includes('bebek') || lower.includes('kids') || lower.includes('child')) {
            icon = 'child_friendly';
        } else if (lower.includes('bahçe') || lower.includes('garden') || lower.includes('teras') || lower.includes('balkon') || lower.includes('balcony')) {
            icon = 'deck';
        } else if (lower.includes('kasa') || lower.includes('safe') || lower.includes('güvenlik') || lower.includes('lock')) {
            icon = 'lock';
        } else if (lower.includes('tv') || lower.includes('televizyon') || lower.includes('uydu')) {
            icon = 'tv';
        } else if (lower.includes('oda servisi') || lower.includes('room service')) {
            icon = 'room_service';
        } else {
            icon = 'check_circle';
        }
    }

    return { icon, label };
};
