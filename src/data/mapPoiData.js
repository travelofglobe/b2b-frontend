// Curated Point of Interest (POI) data for Google Maps overlay styling
export const MAP_POIS = [
    // ═══════════════════════════════════════════════
    // 1. Turistik Yerler & Doğal Alanlar (Touristic & Nature)
    // ═══════════════════════════════════════════════
    {
        id: 'poi-belgrad',
        name: 'Belgrad ormanı',
        category: 'tourist',
        subType: 'nature',
        lat: 41.1850,
        lng: 28.9870,
        icon: 'hiking',
        color: '#0f9d58',
        labelColor: '#137333',
        description: 'Tarihi su kemerleri, yürüyüş parkurları ve doğa alanı.'
    },
    {
        id: 'poi-rumeli',
        name: 'Rumeli Hisarı',
        category: 'tourist',
        subType: 'historic',
        lat: 41.0847,
        lng: 29.0570,
        icon: 'fort',
        color: '#9333ea',
        labelColor: '#7e22ce',
        description: 'Boğaziçi kıyısında tarihi hisar ve müze.'
    },
    {
        id: 'poi-galata',
        name: 'Galata Kulesi',
        category: 'tourist',
        subType: 'historic',
        lat: 41.0257,
        lng: 28.9741,
        icon: 'attractions',
        color: '#9333ea',
        labelColor: '#7e22ce',
        description: 'Panoramik İstanbul manzaralı tarihi kule.'
    },
    {
        id: 'poi-ayasofya',
        name: 'Ayasofya-i Kebir Camii',
        category: 'tourist',
        subType: 'historic',
        lat: 41.0086,
        lng: 28.9802,
        icon: 'account_balance',
        color: '#9333ea',
        labelColor: '#7e22ce',
        description: 'Tarihi yarımadanın simge anıt yapısı.'
    },
    {
        id: 'poi-dolmabahce',
        name: 'Dolmabahçe Sarayı',
        category: 'tourist',
        subType: 'historic',
        lat: 41.0392,
        lng: 29.0003,
        icon: 'castle',
        color: '#9333ea',
        labelColor: '#7e22ce',
        description: 'Boğaz kıyısında görkemli Osmanlı sarayı.'
    },
    {
        id: 'poi-topkapi',
        name: 'Topkapı Sarayı',
        category: 'tourist',
        subType: 'historic',
        lat: 41.0115,
        lng: 28.9834,
        icon: 'fort',
        color: '#9333ea',
        labelColor: '#7e22ce',
        description: 'Tarihi saray kompleksi ve müze.'
    },
    {
        id: 'poi-emirgan',
        name: 'Emirgan Korusu',
        category: 'tourist',
        subType: 'nature',
        lat: 41.1082,
        lng: 29.0535,
        icon: 'park',
        color: '#0f9d58',
        labelColor: '#137333',
        description: 'Boğaz manzaralı lale bahçeleri ve tarihi köşkler.'
    },

    // ═══════════════════════════════════════════════
    // 2. Toplu Taşıma (Transit)
    // ═══════════════════════════════════════════════
    {
        id: 'poi-taksim-metro',
        name: 'Taksim Metro İstasyonu',
        category: 'transit',
        lat: 41.0370,
        lng: 28.9850,
        icon: 'subway',
        color: '#1a73e8',
        labelColor: '#1558d6',
        description: 'M2 Yenikapı - Hacıosman Metro Hattı ve F1 Füniküler.'
    },
    {
        id: 'poi-sisli-metro',
        name: 'Şişli - Mecidiyeköy',
        category: 'transit',
        lat: 41.0632,
        lng: 28.9934,
        icon: 'directions_transit',
        color: '#1a73e8',
        labelColor: '#1558d6',
        description: 'M2, M7 Metro Hatları ve Metrobüs aktarma merkezi.'
    },
    {
        id: 'poi-levent-metro',
        name: 'Levent Metro İstasyonu',
        category: 'transit',
        lat: 41.0772,
        lng: 29.0135,
        icon: 'subway',
        color: '#1a73e8',
        labelColor: '#1558d6',
        description: 'M2 ve M6 Boğaziçi Üniversitesi Metro aktarması.'
    },
    {
        id: 'poi-besiktas-iskele',
        name: 'Beşiktaş Vapur İskelesi',
        category: 'transit',
        lat: 41.0422,
        lng: 29.0067,
        icon: 'directions_boat',
        color: '#1a73e8',
        labelColor: '#1558d6',
        description: 'Kadıköy, Üsküdar ve Adalar şehir hatları vapurları.'
    },
    {
        id: 'poi-kadikoy-metro',
        name: 'Kadıköy İskele & Metro',
        category: 'transit',
        lat: 40.9904,
        lng: 29.0254,
        icon: 'subway',
        color: '#1a73e8',
        labelColor: '#1558d6',
        description: 'M4 Kadıköy - Sabiha Gökçen Havalimanı Metro Hattı ve Vapurlar.'
    },
    {
        id: 'poi-yenikapi',
        name: 'Yenikapı Transfer Merkezi',
        category: 'transit',
        lat: 41.0048,
        lng: 28.9520,
        icon: 'train',
        color: '#1a73e8',
        labelColor: '#1558d6',
        description: 'Marmaray, M1 ve M2 hatları ana aktarma istasyonu.'
    },
    {
        id: 'poi-haciosman',
        name: 'Hacıosman Metro',
        category: 'transit',
        lat: 41.1394,
        lng: 29.0345,
        icon: 'subway',
        color: '#1a73e8',
        labelColor: '#1558d6',
        description: 'M2 hattı kuzey son durağı ve otobüs aktarmaları.'
    },

    // ═══════════════════════════════════════════════
    // 3. Restoran Bölgeleri (Restaurants)
    // ═══════════════════════════════════════════════
    {
        id: 'poi-karakoy-gastronomi',
        name: 'Karaköy Restoranlar Bölgesi',
        category: 'restaurants',
        lat: 41.0234,
        lng: 28.9760,
        icon: 'restaurant',
        color: '#ea4335',
        labelColor: '#c5221f',
        description: 'Şık kafeler, üçüncü nesil kahveciler ve modern restoranlar.'
    },
    {
        id: 'poi-nisantasi-dining',
        name: 'Nişantaşı Brasserie & Dining',
        category: 'restaurants',
        lat: 41.0505,
        lng: 28.9935,
        icon: 'restaurant',
        color: '#ea4335',
        labelColor: '#c5221f',
        description: 'Gurme restoranlar, dünya mutfağı ve açık hava kafeleri.'
    },
    {
        id: 'poi-bebek-dining',
        name: 'Bebek Sahil Kafeleri',
        category: 'restaurants',
        lat: 41.0766,
        lng: 29.0435,
        icon: 'restaurant',
        color: '#ea4335',
        labelColor: '#c5221f',
        description: 'Boğaz manzaralı balık restoranları ve ünlü kafeler.'
    },
    {
        id: 'poi-moda-dining',
        name: 'Moda Kafe & Restoranlar',
        category: 'restaurants',
        lat: 40.9830,
        lng: 29.0260,
        icon: 'restaurant',
        color: '#ea4335',
        labelColor: '#c5221f',
        description: 'Butik kafeler, vegan restoranlar ve nostaljik lezzetler.'
    },
    {
        id: 'poi-besiktas-carsi',
        name: 'Beşiktaş Çarşı Restoranları',
        category: 'restaurants',
        lat: 41.0430,
        lng: 29.0020,
        icon: 'restaurant',
        color: '#ea4335',
        labelColor: '#c5221f',
        description: 'Canlı sokak lezzetleri, balık pazarı ve kahvaltıcılar sokağı.'
    },
    {
        id: 'poi-sultanahmet-dining',
        name: 'Tarihi Sultanahmet Lezzetleri',
        category: 'restaurants',
        lat: 41.0065,
        lng: 28.9770,
        icon: 'restaurant',
        color: '#ea4335',
        labelColor: '#c5221f',
        description: 'Tarihi köfteciler ve geleneksel Türk mutfağı.'
    },

    // ═══════════════════════════════════════════════
    // 4. Alışveriş Bölgeleri (Shopping)
    // ═══════════════════════════════════════════════
    {
        id: 'poi-istinyepark',
        name: 'İstinyePark',
        category: 'shopping',
        lat: 41.1118,
        lng: 29.0335,
        icon: 'shopping_bag',
        color: '#e91e63',
        labelColor: '#ad1457',
        description: 'Lüks moda markaları, açık hava alışveriş caddesi ve restoranlar.'
    },
    {
        id: 'poi-zorlu-center',
        name: 'Zorlu Center',
        category: 'shopping',
        lat: 41.0667,
        lng: 29.0175,
        icon: 'shopping_bag',
        color: '#e91e63',
        labelColor: '#ad1457',
        description: 'Dünya markaları, performans sanatları merkezi ve gastronomi.'
    },
    {
        id: 'poi-kanyon',
        name: 'Kanyon AVM',
        category: 'shopping',
        lat: 41.0782,
        lng: 29.0112,
        icon: 'shopping_bag',
        color: '#e91e63',
        labelColor: '#ad1457',
        description: 'Ödüllü açık hava mimarisi, butikler ve gurme alanları.'
    },
    {
        id: 'poi-kapalicarsi',
        name: 'Tarihi Kapalıçarşı',
        category: 'shopping',
        lat: 41.0108,
        lng: 28.9680,
        icon: 'shopping_bag',
        color: '#e91e63',
        labelColor: '#ad1457',
        description: 'Dünyanın en eski ve en büyük kapalı çarşılarından biri.'
    },
    {
        id: 'poi-cevahir',
        name: 'Cevahir AVM',
        category: 'shopping',
        lat: 41.0631,
        lng: 28.9904,
        icon: 'shopping_bag',
        color: '#e91e63',
        labelColor: '#ad1457',
        description: 'Geniş mağaza yelpazesi, sinema ve eğlence merkezi.'
    },
    {
        id: 'poi-bagdat-caddesi',
        name: 'Bağdat Caddesi Alışveriş',
        category: 'shopping',
        lat: 40.9634,
        lng: 29.0720,
        icon: 'shopping_bag',
        color: '#e91e63',
        labelColor: '#ad1457',
        description: 'Anadolu yakasının ünlü açık hava alışveriş ve yürüyüş caddesi.'
    }
];
