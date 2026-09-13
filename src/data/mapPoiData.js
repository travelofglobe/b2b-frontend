// Curated Point of Interest (POI) data for Google Maps overlay styling across major global destinations
export const MAP_POIS = [
    // ═══════════════════════════════════════════════
    // ISTANBUL (TÜRKIYE)
    // ═══════════════════════════════════════════════
    { id: 'poi-ist-belgrad', name: 'Belgrad Ormanı', category: 'tourist', lat: 41.1850, lng: 28.9870, icon: 'hiking', color: '#0f9d58', labelColor: '#137333', description: 'Tarihi su kemerleri, yürüyüş parkurları ve doğa alanı.' },
    { id: 'poi-ist-rumeli', name: 'Rumeli Hisarı', category: 'tourist', lat: 41.0847, lng: 29.0570, icon: 'fort', color: '#9333ea', labelColor: '#7e22ce', description: 'Boğaziçi kıyısında tarihi hisar ve müze.' },
    { id: 'poi-ist-galata', name: 'Galata Kulesi', category: 'tourist', lat: 41.0257, lng: 28.9741, icon: 'attractions', color: '#9333ea', labelColor: '#7e22ce', description: 'Panoramik İstanbul manzaralı tarihi kule.' },
    { id: 'poi-ist-ayasofya', name: 'Ayasofya-i Kebir Camii', category: 'tourist', lat: 41.0086, lng: 28.9802, icon: 'account_balance', color: '#9333ea', labelColor: '#7e22ce', description: 'Tarihi yarımadanın simge anıt yapısı.' },
    { id: 'poi-ist-dolmabahce', name: 'Dolmabahçe Sarayı', category: 'tourist', lat: 41.0392, lng: 29.0003, icon: 'castle', color: '#9333ea', labelColor: '#7e22ce', description: 'Boğaz kıyısında görkemli Osmanlı sarayı.' },
    { id: 'poi-ist-topkapi', name: 'Topkapı Sarayı', category: 'tourist', lat: 41.0115, lng: 28.9834, icon: 'fort', color: '#9333ea', labelColor: '#7e22ce', description: 'Tarihi saray kompleksi ve müze.' },
    { id: 'poi-ist-taksim-metro', name: 'Taksim Metro İstasyonu', category: 'transit', lat: 41.0370, lng: 28.9850, icon: 'subway', color: '#1a73e8', labelColor: '#1558d6', description: 'M2 Yenikapı - Hacıosman Metro Hattı.' },
    { id: 'poi-ist-sisli-metro', name: 'Şişli - Mecidiyeköy', category: 'transit', lat: 41.0632, lng: 28.9934, icon: 'directions_transit', color: '#1a73e8', labelColor: '#1558d6', description: 'M2, M7 Metro Hatları ve Metrobüs.' },
    { id: 'poi-ist-kadikoy-metro', name: 'Kadıköy İskele & Metro', category: 'transit', lat: 40.9904, lng: 29.0254, icon: 'subway', color: '#1a73e8', labelColor: '#1558d6', description: 'M4 Metro Hattı ve Vapur İskelesi.' },
    { id: 'poi-ist-karakoy-dining', name: 'Karaköy Restoranlar Bölgesi', category: 'restaurants', lat: 41.0234, lng: 28.9760, icon: 'restaurant', color: '#ea4335', labelColor: '#c5221f', description: 'Şık kafeler ve gurme restoranlar.' },
    { id: 'poi-ist-nisantasi-dining', name: 'Nişantaşı Dining District', category: 'restaurants', lat: 41.0505, lng: 28.9935, icon: 'restaurant', color: '#ea4335', labelColor: '#c5221f', description: 'Dünya mutfağı ve açık hava restoranları.' },
    { id: 'poi-ist-istinyepark', name: 'İstinyePark', category: 'shopping', lat: 41.1118, lng: 29.0335, icon: 'shopping_bag', color: '#e91e63', labelColor: '#ad1457', description: 'Lüks moda markaları ve alışveriş caddesi.' },
    { id: 'poi-ist-zorlu', name: 'Zorlu Center', category: 'shopping', lat: 41.0667, lng: 29.0175, icon: 'shopping_bag', color: '#e91e63', labelColor: '#ad1457', description: 'Dünya markaları ve performans sanatları merkezi.' },

    // ═══════════════════════════════════════════════
    // ANTALYA (TÜRKIYE)
    // ═══════════════════════════════════════════════
    { id: 'poi-ayt-kaleici', name: 'Tarihi Kaleiçi', category: 'tourist', lat: 36.8848, lng: 30.7050, icon: 'fort', color: '#9333ea', labelColor: '#7e22ce', description: 'Tarihi Osmanlı evleri, dar sokaklar ve yat limanı.' },
    { id: 'poi-ayt-duden', name: 'Düden Şelalesi', category: 'tourist', lat: 36.8524, lng: 30.7836, icon: 'waterfall', color: '#0f9d58', labelColor: '#137333', description: 'Akdeniz’e dökülen doğa harikası şelale.' },
    { id: 'poi-ayt-aspendos', name: 'Aspendos Antik Tiyatrosu', category: 'tourist', lat: 36.9389, lng: 31.1722, icon: 'account_balance', color: '#9333ea', labelColor: '#7e22ce', description: 'Dünyanın en iyi korunmuş Roma tiyatrosu.' },
    { id: 'poi-ayt-airport', name: 'Antalya Havalimanı (AYT)', category: 'transit', lat: 36.8987, lng: 30.8005, icon: 'flight_takeoff', color: '#1a73e8', labelColor: '#1558d6', description: 'Uluslararası havalimanı ve Antray bağlantısı.' },
    { id: 'poi-ayt-otogar', name: 'Antalya Şehirlerarası Otogarı', category: 'transit', lat: 36.9208, lng: 30.6620, icon: 'directions_bus', color: '#1a73e8', labelColor: '#1558d6', description: 'Bölgesel ve şehirlerarası otobüs terminali.' },
    { id: 'poi-ayt-kaleici-dining', name: 'Kaleiçi Balık & Restoranlar', category: 'restaurants', lat: 36.8835, lng: 30.7065, icon: 'restaurant', color: '#ea4335', labelColor: '#c5221f', description: 'Tarihi atmosferde Akdeniz balık restoranları.' },
    { id: 'poi-ayt-lara-dining', name: 'Lara Sahil Restoranları', category: 'restaurants', lat: 36.8550, lng: 30.7720, icon: 'restaurant', color: '#ea4335', labelColor: '#c5221f', description: 'Deniz manzaralı mekanlar ve kafeler.' },
    { id: 'poi-ayt-terracity', name: 'TerraCity AVM', category: 'shopping', lat: 36.8530, lng: 30.7562, icon: 'shopping_bag', color: '#e91e63', labelColor: '#ad1457', description: 'Antalya’nın en popüler alışveriş merkezi.' },
    { id: 'poi-ayt-land-of-legends', name: 'The Land of Legends Avenue', category: 'shopping', lat: 36.8765, lng: 31.0542, icon: 'shopping_bag', color: '#e91e63', labelColor: '#ad1457', description: 'Lüks alışveriş caddesi ve tema parkı.' },

    // ═══════════════════════════════════════════════
    // BODRUM & MUĞLA (TÜRKIYE)
    // ═══════════════════════════════════════════════
    { id: 'poi-bjv-castle', name: 'Bodrum Kalesi', category: 'tourist', lat: 37.0315, lng: 27.4292, icon: 'fort', color: '#9333ea', labelColor: '#7e22ce', description: 'Sualtı Arkeoloji Müzesi ve tarihi kale.' },
    { id: 'poi-bjv-oludeniz', name: 'Ölüdeniz Lagünü', category: 'tourist', lat: 36.5492, lng: 29.1170, icon: 'pool', color: '#0f9d58', labelColor: '#137333', description: 'Dünyaca ünlü turkuaz plaj ve yamaç paraşütü.' },
    { id: 'poi-bjv-airport', name: 'Milas-Bodrum Havalimanı (BJV)', category: 'transit', lat: 37.2506, lng: 27.6644, icon: 'flight_takeoff', color: '#1a73e8', labelColor: '#1558d6', description: 'Bodrum ve Muğla bölgesi havalimanı.' },
    { id: 'poi-bjv-marina-dining', name: 'Yalıkavak Marina Dining', category: 'restaurants', lat: 37.1035, lng: 27.2940, icon: 'restaurant', color: '#ea4335', labelColor: '#c5221f', description: 'Lüks marina restoranları ve uluslararası mutfak.' },
    { id: 'poi-bjv-midtown', name: 'Midtown AVM Bodrum', category: 'shopping', lat: 37.0502, lng: 27.3620, icon: 'shopping_bag', color: '#e91e63', labelColor: '#ad1457', description: 'Bodrum yarımadasının alışveriş merkezi.' },

    // ═══════════════════════════════════════════════
    // IZMIR & ALAÇATI (TÜRKIYE)
    // ═══════════════════════════════════════════════
    { id: 'poi-adb-ephesus', name: 'Efes Antik Kenti', category: 'tourist', lat: 37.9407, lng: 27.3416, icon: 'account_balance', color: '#9333ea', labelColor: '#7e22ce', description: 'UNESCO Dünya Mirası antik kent ve Celsus Kütüphanesi.' },
    { id: 'poi-adb-alacati', name: 'Alaçatı Tarihi Taş Evler', category: 'tourist', lat: 38.2825, lng: 26.3742, icon: 'other_houses', color: '#9333ea', labelColor: '#7e22ce', description: 'Nostaljik sokaklar, rüzgar değirmenleri ve plajlar.' },
    { id: 'poi-adb-airport', name: 'İzmir Adnan Menderes Havalimanı (ADB)', category: 'transit', lat: 38.2924, lng: 27.1570, icon: 'flight_takeoff', color: '#1a73e8', labelColor: '#1558d6', description: 'İZBAN tren ve havalimanı aktarması.' },
    { id: 'poi-adb-kordon-dining', name: 'Alsancak Kordon Restoranları', category: 'restaurants', lat: 38.4350, lng: 27.1380, icon: 'restaurant', color: '#ea4335', labelColor: '#c5221f', description: 'Ege deniz manzaralı balıkçı ve kafeler.' },
    { id: 'poi-adb-forum', name: 'Forum Bornova', category: 'shopping', lat: 38.4610, lng: 27.2110, icon: 'shopping_bag', color: '#e91e63', labelColor: '#ad1457', description: 'İzmir’in açık hava mimarisine sahip AVM’si.' },

    // ═══════════════════════════════════════════════
    // KAPADOKYA (NEVŞEHIR)
    // ═══════════════════════════════════════════════
    { id: 'poi-nav-goreme', name: 'Göreme Açık Hava Müzesi', category: 'tourist', lat: 38.6402, lng: 34.8290, icon: 'landscape', color: '#9333ea', labelColor: '#7e22ce', description: 'Kaya kiliseleri ve peribacaları kompleksi.' },
    { id: 'poi-nav-uchisar', name: 'Uçhisar Kalesi', category: 'tourist', lat: 38.6300, lng: 34.8050, icon: 'fort', color: '#9333ea', labelColor: '#7e22ce', description: 'Kapadokya’nın en yüksek noktası ve panoramik manzara.' },
    { id: 'poi-nav-airport', name: 'Nevşehir Kapadokya Havalimanı (NAV)', category: 'transit', lat: 38.7725, lng: 34.5344, icon: 'flight_takeoff', color: '#1a73e8', labelColor: '#1558d6', description: 'Kapadokya havalimanı.' },

    // ═══════════════════════════════════════════════
    // PARIS (FRANCE)
    // ═══════════════════════════════════════════════
    { id: 'poi-par-eiffel', name: 'Eiffel Tower (Tour Eiffel)', category: 'tourist', lat: 48.8584, lng: 2.2945, icon: 'attractions', color: '#9333ea', labelColor: '#7e22ce', description: 'Iconic 330m iron tower & panoramic views of Paris.' },
    { id: 'poi-par-louvre', name: 'Musée du Louvre', category: 'tourist', lat: 48.8606, lng: 2.3376, icon: 'museum', color: '#9333ea', labelColor: '#7e22ce', description: 'World’s largest art museum housing Mona Lisa.' },
    { id: 'poi-par-cdg', name: 'Aéroport Paris-Charles de Gaulle (CDG)', category: 'transit', lat: 49.0097, lng: 2.5479, icon: 'flight_takeoff', color: '#1a73e8', labelColor: '#1558d6', description: 'Major international hub connected via RER B.' },
    { id: 'poi-par-chatelet', name: 'Châtelet - Les Halles Station', category: 'transit', lat: 48.8614, lng: 2.3470, icon: 'subway', color: '#1a73e8', labelColor: '#1558d6', description: 'Central Paris underground hub connecting Metro & RER.' },
    { id: 'poi-par-marais-dining', name: 'Le Marais Dining District', category: 'restaurants', lat: 48.8570, lng: 2.3590, icon: 'restaurant', color: '#ea4335', labelColor: '#c5221f', description: 'Historic district with trendy bistros & cafes.' },
    { id: 'poi-par-lafayette', name: 'Galeries Lafayette Haussmann', category: 'shopping', lat: 48.8732, lng: 2.3316, icon: 'shopping_bag', color: '#e91e63', labelColor: '#ad1457', description: 'Flagship luxury department store under glass dome.' },

    // ═══════════════════════════════════════════════
    // LONDON (UNITED KINGDOM)
    // ═══════════════════════════════════════════════
    { id: 'poi-lon-bigben', name: 'Big Ben & Elizabeth Tower', category: 'tourist', lat: 51.5007, lng: -0.1246, icon: 'account_balance', color: '#9333ea', labelColor: '#7e22ce', description: 'Iconic clock tower by the Houses of Parliament.' },
    { id: 'poi-lon-eye', name: 'The London Eye', category: 'tourist', lat: 51.5033, lng: -0.1195, icon: 'attractions', color: '#9333ea', labelColor: '#7e22ce', description: '135m observation wheel on the River Thames.' },
    { id: 'poi-lon-kingscross', name: 'King’s Cross & St Pancras Station', category: 'transit', lat: 51.5309, lng: -0.1238, icon: 'train', color: '#1a73e8', labelColor: '#1558d6', description: 'Eurostar international hub & Underground station.' },
    { id: 'poi-lon-soho-dining', name: 'Soho Gastropubs & Dining', category: 'restaurants', lat: 51.5137, lng: -0.1337, icon: 'restaurant', color: '#ea4335', labelColor: '#c5221f', description: 'Vibrant food quarter with international cuisine.' },
    { id: 'poi-lon-harrods', name: 'Harrods Knightsbridge', category: 'shopping', lat: 51.4994, lng: -0.1635, icon: 'shopping_bag', color: '#e91e63', labelColor: '#ad1457', description: 'World-famous luxury department store.' },

    // ═══════════════════════════════════════════════
    // ROME (ITALY)
    // ═══════════════════════════════════════════════
    { id: 'poi-rom-colosseum', name: 'Colosseum (Colosseo)', category: 'tourist', lat: 41.8902, lng: 12.4922, icon: 'fort', color: '#9333ea', labelColor: '#7e22ce', description: 'Ancient Roman amphitheatre & UNESCO World Heritage.' },
    { id: 'poi-rom-trevi', name: 'Trevi Fountain (Fontana di Trevi)', category: 'tourist', lat: 41.9009, lng: 12.4833, icon: 'water', color: '#9333ea', labelColor: '#7e22ce', description: 'Famous Baroque fountain in central Rome.' },
    { id: 'poi-rom-termini', name: 'Roma Termini Station', category: 'transit', lat: 41.9010, lng: 12.5018, icon: 'train', color: '#1a73e8', labelColor: '#1558d6', description: 'Main rail station & airport Leonardo Express hub.' },
    { id: 'poi-rom-trastevere-dining', name: 'Trastevere Trattorias', category: 'restaurants', lat: 41.8890, lng: 12.4700, icon: 'restaurant', color: '#ea4335', labelColor: '#c5221f', description: 'Authentic Roman pasta & traditional dining.' },

    // ═══════════════════════════════════════════════
    // DUBAI (UNITED ARAB EMIRATES)
    // ═══════════════════════════════════════════════
    { id: 'poi-dxb-burjkhalifa', name: 'Burj Khalifa', category: 'tourist', lat: 25.1972, lng: 55.2744, icon: 'attractions', color: '#9333ea', labelColor: '#7e22ce', description: 'World’s tallest building at 828m.' },
    { id: 'poi-dxb-palm', name: 'Palm Jumeirah', category: 'tourist', lat: 25.1124, lng: 55.1390, icon: 'pool', color: '#0f9d58', labelColor: '#137333', description: 'Iconic man-made palm archipelago with luxury resorts.' },
    { id: 'poi-dxb-metro', name: 'Burj Khalifa / Dubai Mall Metro Station', category: 'transit', lat: 25.2005, lng: 55.2690, icon: 'subway', color: '#1a73e8', labelColor: '#1558d6', description: 'Dubai Metro Red Line connection to Dubai Mall.' },
    { id: 'poi-dxb-marina-dining', name: 'Dubai Marina Promenade Dining', category: 'restaurants', lat: 25.0780, lng: 55.1400, icon: 'restaurant', color: '#ea4335', labelColor: '#c5221f', description: 'Waterfront dining along Dubai Marina.' },
    { id: 'poi-dxb-mall', name: 'The Dubai Mall', category: 'shopping', lat: 25.1985, lng: 55.2796, icon: 'shopping_bag', color: '#e91e63', labelColor: '#ad1457', description: 'One of the world’s largest shopping malls.' },

    // ═══════════════════════════════════════════════
    // AMSTERDAM (NETHERLANDS)
    // ═══════════════════════════════════════════════
    { id: 'poi-ams-rijksmuseum', name: 'Rijksmuseum', category: 'tourist', lat: 52.3600, lng: 4.8852, icon: 'museum', color: '#9333ea', labelColor: '#7e22ce', description: 'Dutch national museum dedicated to arts & history.' },
    { id: 'poi-ams-centraal', name: 'Amsterdam Centraal Station', category: 'transit', lat: 52.3791, lng: 4.9003, icon: 'train', color: '#1a73e8', labelColor: '#1558d6', description: 'Central station for trains, ferries & trams.' },

    // ═══════════════════════════════════════════════
    // BARCELONA (SPAIN)
    // ═══════════════════════════════════════════════
    { id: 'poi-bcn-sagrada', name: 'La Sagrada Família', category: 'tourist', lat: 41.4036, lng: 2.1744, icon: 'account_balance', color: '#9333ea', labelColor: '#7e22ce', description: 'Gaudí’s iconic unfinished basilica.' },
    { id: 'poi-bcn-sants', name: 'Barcelona Sants Station', category: 'transit', lat: 41.3792, lng: 2.1402, icon: 'train', color: '#1a73e8', labelColor: '#1558d6', description: 'Main AVE high-speed train & metro hub.' },

    // ═══════════════════════════════════════════════
    // BERLIN (GERMANY)
    // ═══════════════════════════════════════════════
    { id: 'poi-ber-brandenburg', name: 'Brandenburg Gate (Brandenburger Tor)', category: 'tourist', lat: 52.5163, lng: 13.3777, icon: 'fort', color: '#9333ea', labelColor: '#7e22ce', description: 'Iconic 18th-century neoclassical monument.' },

    // ═══════════════════════════════════════════════
    // VIENNA (AUSTRIA)
    // ═══════════════════════════════════════════════
    { id: 'poi-vie-schonbrunn', name: 'Schönbrunn Palace', category: 'tourist', lat: 48.1848, lng: 16.3122, icon: 'castle', color: '#9333ea', labelColor: '#7e22ce', description: 'Habsburg summer residence & Baroque palace.' },

    // ═══════════════════════════════════════════════
    // NEW YORK (UNITED STATES)
    // ═══════════════════════════════════════════════
    { id: 'poi-nyc-timessquare', name: 'Times Square', category: 'tourist', lat: 40.7580, lng: -73.9855, icon: 'attractions', color: '#9333ea', labelColor: '#7e22ce', description: 'Major commercial & entertainment hub in Manhattan.' },
    { id: 'poi-nyc-grandcentral', name: 'Grand Central Terminal', category: 'transit', lat: 40.7527, lng: -73.9772, icon: 'train', color: '#1a73e8', labelColor: '#1558d6', description: 'Historic railroad terminal & subway hub.' },

    // ═══════════════════════════════════════════════
    // TOKYO (JAPAN)
    // ═══════════════════════════════════════════════
    { id: 'poi-tyo-shibuya', name: 'Shibuya Crossing', category: 'tourist', lat: 35.6595, lng: 139.7005, icon: 'attractions', color: '#9333ea', labelColor: '#7e22ce', description: 'World’s busiest pedestrian scramble crossing.' },

    // ═══════════════════════════════════════════════
    // BANGKOK (THAILAND)
    // ═══════════════════════════════════════════════
    { id: 'poi-bkk-palace', name: 'Grand Palace & Wat Phra Kaew', category: 'tourist', lat: 13.7500, lng: 100.4915, icon: 'account_balance', color: '#9333ea', labelColor: '#7e22ce', description: 'Historic royal complex & Emerald Buddha temple.' }
];
