import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import FilterSection from './FilterSection';

const FILTER_LOCALES = {
    filters: {
        en: "Filters", tr: "Filtreler", ar: "الفلاتر", es: "Filtros", ru: "Фильтры", zh: "筛选", ja: "フィルター", fa: "فیلترها", fr: "Filtres", it: "Filtri", el: "Φίλτρα", pt: "Filtros"
    },
    reset: {
        en: "Reset", tr: "Sıfırla", ar: "إعادة ضبط", es: "Restablecer", ru: "Сбросить", zh: "重置", ja: "リセット", fa: "بازنشانی", fr: "Réinitialiser", it: "Ripristina", el: "Επαναφορά", pt: "Redefinir"
    },
    apply: {
        en: "Apply", tr: "Uygula", ar: "تطبيق", es: "Aplicar", ru: "Применить", zh: "应用", ja: "適用する", fa: "اعمال", fr: "Appliquer", it: "Applica", el: "Εφαρμογή", pt: "Aplicar"
    },
    locations: {
        en: "Locations", tr: "Konumlar", ar: "المواقع", es: "Ubicaciones", ru: "Места", zh: "位置", ja: "場所", fa: "مکان‌ها", fr: "Emplacements", it: "Località", el: "Τοποθεσίες", pt: "Locais"
    },
    searchLocations: {
        en: "Search locations...", tr: "Konum ara...", ar: "البحث عن المواقع...", es: "Buscar ubicaciones...", ru: "Поиск мест...", zh: "搜索位置...", ja: "場所を検索...", fa: "جستجوی مکان‌ها...", fr: "Rechercher des emplacements...", it: "Cerca località...", el: "Αναζήτηση τοποθεσιών...", pt: "Pesquisar locais..."
    },
    noLocations: {
        en: "No specific locations found", tr: "Belirli bir konum bulunamadı", ar: "لم يتم العثور على مواقع محددة", es: "No se encontraron ubicaciones específicas", ru: "Конкретные места не найдены", zh: "未找到特定位置", ja: "特定の場所が見つかりません", fa: "هیچ مکان مشخصی یافت نشد", fr: "Aucun emplacement spécifique trouvé", it: "Nessuna località specifica trovata", el: "Δεν βρέθηκαν συγκεκριμένες τοποθεσίες", pt: "Nenhum local específico encontrado"
    },
    starRating: {
        en: "Star Rating", tr: "Yıldız Sayısı", ar: "تصنيف النجوم", es: "Clasificación por estrellas", ru: "Звездный рейтинг", zh: "星级", ja: "星の数", fa: "ستاره‌های هتل", fr: "Nombre d'étoiles", it: "Stelle hotel", el: "Αξιολόγηση Αστέρων", pt: "Classificação por Estrelas"
    },
    unrated: {
        en: "Unrated", tr: "Derecelendirilmemiş", ar: "غير مصنف", es: "Sin clasificar", ru: "Без рейтинга", zh: "未评分", ja: "評価なし", fa: "بدون ستاره", fr: "Non classé", it: "Non classificato", el: "Χωρίς Αξιολόγηση", pt: "Sem classificação"
    },
    stars: {
        en: "Stars", tr: "Yıldız", ar: "نجوم", es: "Estrellas", ru: "Звезд", zh: "星级", ja: "つ星", fa: "ستاره", fr: "Étoiles", it: "Stelle", el: "Αστέρια", pt: "Estrelas"
    },
    freeCancellation: {
        en: "Free Cancellation", tr: "Ücretsiz İptal", ar: "إلغاء مجاني", es: "Cancelación gratuita", ru: "Бесплатная отмена", zh: "免费取消", ja: "無料キャンセル", fa: "کنسلی رایگان", fr: "Annulation gratuite", it: "Cancellazione gratuita", el: "Δωρεάν Ακύρωση", pt: "Cancelamento Grátis"
    },
    nonRefundable: {
        en: "Non-refundable", tr: "İade Edilemez", ar: "غير مستردة", es: "No reembolsable", ru: "Без возврата средств", zh: "不可退款", ja: "返金不可", fa: "غیر قابل استرداد", fr: "Non remboursable", it: "Non rimborsabile", el: "Μη επιστρέψιμη", pt: "Não reembolsável"
    },
    prePayment: {
        en: "Pre-Payment Required", tr: "Ön Ödeme Gerekli", ar: "الدفع المسبق مطلوب", es: "Se requiere pago por adelantado", ru: "Требуется предоплата", zh: "需要预付", ja: "要事前支払い", fa: "نیاز به پرداخت پیش‌پرداخت", fr: "Prépaiement requis", it: "Pagamento anticipato richiesto", el: "Απαιτείται Προπληρωμή", pt: "Pré-pagamento Requerido"
    },
    payLater: {
        en: "Pay Later", tr: "Sonra Öde", ar: "ادفع لاحقاً", es: "Pagar más tarde", ru: "Оплата позже", zh: "稍后付款", ja: "後払い", fa: "پرداخت در محل", fr: "Payer plus tard", it: "Paga dopo", el: "Πληρωμή αργότερα", pt: "Pagar mais tarde"
    },
    twinRoom: {
        en: "Twin Room", tr: "İki Yataklı Oda", ar: "غرفة بسريرين منفصلين", es: "Habitación Twin", ru: "Двухместный номер с 2 кроватями", zh: "双床房", ja: "ツインルーム", fa: "اتاق دو تخته مجزا", fr: "Chambre lits jumeaux", it: "Camera doppia con letti singoli", el: "Δίκλινο με 2 μονά κρεβάτια", pt: "Quarto Twin"
    },
    twinAvailable: {
        en: "Twin Available", tr: "İki Yatak Mevcut", ar: "سرير ثنائي متاح", es: "Camas Twin disponibles", ru: "2 отдельные кровати доступны", zh: "提供双床", ja: "ツイン利用可", fa: "تخت مجزا موجود است", fr: "Lits jumeaux disponibles", it: "Letti singoli disponibili", el: "Διαθέσιμα 2 μονά κρεβάτια", pt: "Camas Twin disponíveis"
    },
    noTwin: {
        en: "No Twin", tr: "İki Yatak Yok", ar: "لا يوجد سرير ثنائي", es: "Sin camas Twin", ru: "Без 2 кроватей", zh: "无双床", ja: "ツインなし", fa: "بدون تخت مجزا", fr: "Pas de lits jumeaux", it: "Nessun letto singolo", el: "Όχι 2 μονά κρεβάτια", pt: "Sem camas Twin"
    },
    maxAdult: {
        en: "Max Adult Capacity", tr: "Maks. Yetişkin Kapasitesi", ar: "الحد الأقصى للبالغين", es: "Capacidad máx. de adultos", ru: "Макс. число взрослых", zh: "最大成人人数", ja: "最大大人人数", fa: "حداکثر ظرفیت بزرگسال", fr: "Capacité adulte max", it: "Capacità massima adulti", el: "Μέγιστη Χωρητικότητα Ενηλίκων", pt: "Capacidade Máx. de Adultos"
    },
    adults: {
        en: "Adults", tr: "Yetişkin", ar: "بالغين", es: "Adultos", ru: "Взрослых", zh: "成人", ja: "名", fa: "بزرگسال", fr: "Adultes", it: "Adulti", el: "Ενήλικες", pt: "Adultos"
    },
    maxChildren: {
        en: "Max Children Capacity", tr: "Maks. Çocuk Kapasitesi", ar: "الحد الأقصى للأطفال", es: "Capacidad máx. de niños", ru: "Макс. число детей", zh: "最大儿童人数", ja: "最大子供人数", fa: "حداکثر ظرفیت کودک", fr: "Capacité enfants max", it: "Capacità massima bambini", el: "Μέγιστη Χωρητικότητα Παιδιών", pt: "Capacidade Máx. de Crianças"
    },
    noChildren: {
        en: "No Children", tr: "Çocuk Yok", ar: "بدون أطفال", es: "Sin niños", ru: "Без детей", zh: "无儿童", ja: "子供なし", fa: "بدون کودک", fr: "Sans enfants", it: "Senza bambini", el: "ΧΩΡΙΣ ΠΑΙΔΙΑ", pt: "Sem crianças"
    },
    children: {
        en: "Children", tr: "Çocuk", ar: "أطفال", es: "Niños", ru: "Детей", zh: "儿童", ja: "名", fa: "کودک", fr: "Enfants", it: "Bambini", el: "Παιδιά", pt: "Crianças"
    },
    maxExtraBed: {
        en: "Max Extra Beds", tr: "Maks. İlave Yatak", ar: "الأسرة الإضافية القصوى", es: "Camas supletorias máx.", ru: "Макс. доп. кроватей", zh: "最大加床数", ja: "最大エキストラベッド数", fa: "حداکثر تخت اضافه", fr: "Lits d'appoint max", it: "Letti aggiuntivi max", el: "Μέγιστος Αριθμός Πρόσθετων Κρεβατιών", pt: "Camas Extra Máx."
    },
    noExtraBed: {
        en: "No Extra Bed", tr: "İlave Yatak Yok", ar: "لا توجد أسرة إضافية", es: "Sin camas supletorias", ru: "Без доп. кроватей", zh: "不可加床", ja: "エキストラベッドなし", fa: "بدون تخت اضافه", fr: "Sans lit d'appoint", it: "Nessun letto aggiuntivo", el: "ΧΩΡΙΣ ΠΡΟΣΘΕΤΟ ΚΡΕΒΑΤΙ", pt: "Sem cama extra"
    },
    extraBed: {
        en: "Extra Bed", tr: "İlave Yatak", ar: "سرير إضافي", es: "Cama supletoria", ru: "Доп. кровать", zh: "加床", ja: "台", fa: "تخت اضافه", fr: "Lit d'appoint", it: "Letto aggiuntivo", el: "Πρόσθετο Κρεβάτι", pt: "Cama extra"
    },
    extraBeds: {
        en: "Extra Beds", tr: "İlave Yatak", ar: "أسرة إضافية", es: "Camas supletorias", ru: "Доп. кроватей", zh: "加床", ja: "台", fa: "تخت اضافه", fr: "Lits d'appoint", it: "Letti aggiuntivi", el: "Πρόσθετα Κρεβάτια", pt: "Camas extra"
    },
    hotelFacilities: {
        en: "Hotel Facilities", tr: "Otel Olanakları", ar: "مرافق الفندق", es: "Instalaciones del hotel", ru: "Удобства отеля", zh: "酒店设施", ja: "ホテル設備", fa: "امکانات هتل", fr: "Équipements de l'hôtel", it: "Servizi dell'hotel", el: "Παροχές Ξενοδοχείου", pt: "Instalações do hotel"
    },
    searchFacilities: {
        en: "Search facilities...", tr: "Olanak ara...", ar: "البحث عن المرافق...", es: "Buscar instalaciones...", ru: "Поиск удобств...", zh: "搜索设施...", ja: "設備を検索...", fa: "جستجوی امکانات...", fr: "Rechercher des équipements...", it: "Cerca servizi...", el: "Αναζήτηση παροχών...", pt: "Pesquisar instalações..."
    },
    noFacilities: {
        en: "No specific facilities found", tr: "Belirli bir olanak bulunamadı", ar: "لم يتم العثور على مرافق محددة", es: "No se encontraron instalaciones específicas", ru: "Конкретные удобства не найдены", zh: "未找到特定设施", ja: "特定の設備が見つかりません", fa: "هیچ امکانات مشخصی یافت نشد", fr: "Aucun équipement spécifique trouvé", it: "Nessun servizio specifico trovato", el: "Δεν βρέθηκαν συγκεκριμένες παροχές", pt: "Nenhuma instalação específica encontrada"
    },
    showMore: {
        en: "Show More", tr: "Daha Fazla Göster", ar: "عرض المزيد", es: "Mostrar más", ru: "Показать больше", zh: "显示更多", ja: "もっと見る", fa: "نمایش بیشتر", fr: "Voir plus", it: "Mostra altro", el: "Περισσότερα", pt: "Mostrar mais"
    },
    showLess: {
        en: "Show Less", tr: "Daha Az Göster", ar: "عرض أقل", es: "Mostrar menos", ru: "Показать меньше", zh: "显示较少", ja: "折りたたむ", fa: "نمایش کمتر", fr: "Voir moins", it: "Mostra meno", el: "Λιγότερα", pt: "Mostrar menos"
    },
    pricePerNight: {
        en: "Price per night", tr: "Gecelik Fiyat", ar: "السعر لليلة الواحدة", es: "Precio por noche", ru: "Цена за ночь", zh: "每晚价格", ja: "1泊あたりの料金", fa: "قیمت هر شب", fr: "Prix par nuit", it: "Prezzo per notte", el: "Τιμή ανά διανυκτέρευση", pt: "Preço por noite"
    }
};

const tFilter = (key, lang = 'tr') => {
    const entry = FILTER_LOCALES[key];
    if (!entry) return key;
    return entry[lang] || entry['en'] || key;
};

const Sidebar = ({ filters, locationNames = {}, facilityNames = {} }) => {
    const [searchParams, setSearchParams] = useSearchParams();
    const { i18n } = useTranslation();
    const currentLang = i18n.language || localStorage.getItem('language') || 'tr';

    const currentStarsStr = searchParams.get('stars');
    const urlStars = currentStarsStr ? currentStarsStr.split(',').map(Number) : [];

    // Maintain local state for checkboxes before Apply
    const [selectedStars, setSelectedStars] = useState(urlStars);

    // Parse current URL locations
    const currentLocationsStr = searchParams.get('locations');
    const urlLocations = currentLocationsStr ? currentLocationsStr.split(',').map(Number) : [];
    
    // Maintain local state for locations
    const [selectedLocations, setSelectedLocations] = useState(urlLocations);

    // Free Cancellation filter: null = no filter, true = yes, false = no
    const parseBool = (val) => val === 'true' ? true : val === 'false' ? false : null;
    const [freeCancellation, setFreeCancellation] = useState(parseBool(searchParams.get('freeCancellation')));

    // Pre-Payment filter: null = no filter, true = yes, false = no
    const [prePayment, setPrePayment] = useState(parseBool(searchParams.get('prePayment')));

    // Room Twin
    const [roomTwin, setRoomTwin] = useState(parseBool(searchParams.get('roomTwin')));

    // Room Max Adult
    const currentMaxAdultStr = searchParams.get('roomMaxAdult');
    const [selectedMaxAdult, setSelectedMaxAdult] = useState(currentMaxAdultStr ? currentMaxAdultStr.split(',').map(Number) : []);

    // Room Max Children
    const currentMaxChildrenStr = searchParams.get('roomMaxChildren');
    const [selectedMaxChildren, setSelectedMaxChildren] = useState(currentMaxChildrenStr ? currentMaxChildrenStr.split(',').map(Number) : []);

    // Room Max Extra Bed
    const currentMaxExtraBedStr = searchParams.get('roomMaxExtraBed');
    const [selectedMaxExtraBed, setSelectedMaxExtraBed] = useState(currentMaxExtraBedStr ? currentMaxExtraBedStr.split(',').map(Number) : []);

    const currentFacilitiesStr = searchParams.get('facilities');
    const [selectedFacilities, setSelectedFacilities] = useState(currentFacilitiesStr ? currentFacilitiesStr.split(',').map(Number) : []);

    // Expandable sections state
    const [isFacilitiesExpanded, setIsFacilitiesExpanded] = useState(false);
    const [facilitySearch, setFacilitySearch] = useState('');
    const [isLocationsExpanded, setIsLocationsExpanded] = useState(false);
    const [locationSearch, setLocationSearch] = useState('');

    useEffect(() => {
        setSelectedStars(currentStarsStr ? currentStarsStr.split(',').map(Number) : []);
    }, [currentStarsStr]);

    useEffect(() => {
        setSelectedLocations(currentLocationsStr ? currentLocationsStr.split(',').map(Number) : []);
    }, [currentLocationsStr]);

    useEffect(() => {
        setFreeCancellation(parseBool(searchParams.get('freeCancellation')));
    }, [searchParams.get('freeCancellation')]);

    useEffect(() => {
        setPrePayment(parseBool(searchParams.get('prePayment')));
    }, [searchParams.get('prePayment')]);

    useEffect(() => {
        setRoomTwin(parseBool(searchParams.get('roomTwin')));
    }, [searchParams.get('roomTwin')]);

    useEffect(() => {
        setSelectedMaxAdult(searchParams.get('roomMaxAdult') ? searchParams.get('roomMaxAdult').split(',').map(Number) : []);
    }, [searchParams.get('roomMaxAdult')]);

    useEffect(() => {
        setSelectedMaxChildren(searchParams.get('roomMaxChildren') ? searchParams.get('roomMaxChildren').split(',').map(Number) : []);
    }, [searchParams.get('roomMaxChildren')]);

    useEffect(() => {
        setSelectedMaxExtraBed(searchParams.get('roomMaxExtraBed') ? searchParams.get('roomMaxExtraBed').split(',').map(Number) : []);
    }, [searchParams.get('roomMaxExtraBed')]);

    useEffect(() => {
        setSelectedFacilities(searchParams.get('facilities') ? searchParams.get('facilities').split(',').map(Number) : []);
    }, [searchParams.get('facilities')]);

    // Toggle 3-state boolean: clicking same value again → deselect (null)
    const handleBoolToggle = (setter, current, clickedValue) => {
        setter(current === clickedValue ? null : clickedValue);
    };

    const handleStarToggle = (val) => {
        setSelectedStars(prev =>
            prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]
        );
    };

    const handleLocationToggle = (val) => {
        setSelectedLocations(prev =>
            prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]
        );
    };

    const handleMaxAdultToggle = (val) => {
        setSelectedMaxAdult(prev =>
            prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]
        );
    };

    const handleMaxChildrenToggle = (val) => {
        setSelectedMaxChildren(prev =>
            prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]
        );
    };

    const handleMaxExtraBedToggle = (val) => {
        setSelectedMaxExtraBed(prev =>
            prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]
        );
    };

    const handleFacilityToggle = (val) => {
        setSelectedFacilities(prev =>
            prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]
        );
    };

    const handleApplyFilters = () => {
        const newParams = new URLSearchParams(searchParams);
        if (selectedStars.length > 0) {
            newParams.set('stars', selectedStars.join(','));
        } else {
            newParams.delete('stars');
        }
        if (selectedLocations.length > 0) {
            newParams.set('locations', selectedLocations.join(','));
        } else {
            newParams.delete('locations');
        }
        if (freeCancellation !== null) {
            newParams.set('freeCancellation', String(freeCancellation));
        } else {
            newParams.delete('freeCancellation');
        }
        if (prePayment !== null) {
            newParams.set('prePayment', String(prePayment));
        } else {
            newParams.delete('prePayment');
        }
        if (roomTwin !== null) {
            newParams.set('roomTwin', String(roomTwin));
        } else {
            newParams.delete('roomTwin');
        }
        if (selectedMaxAdult.length > 0) {
            newParams.set('roomMaxAdult', selectedMaxAdult.join(','));
        } else {
            newParams.delete('roomMaxAdult');
        }
        if (selectedMaxChildren.length > 0) {
            newParams.set('roomMaxChildren', selectedMaxChildren.join(','));
        } else {
            newParams.delete('roomMaxChildren');
        }
        if (selectedMaxExtraBed.length > 0) {
            newParams.set('roomMaxExtraBed', selectedMaxExtraBed.join(','));
        } else {
            newParams.delete('roomMaxExtraBed');
        }
        if (selectedFacilities.length > 0) {
            newParams.set('facilities', selectedFacilities.join(','));
        } else {
            newParams.delete('facilities');
        }
        setSearchParams(newParams);
    };

    const handleClearAll = () => {
        setSelectedStars([]);
        setSelectedLocations([]);
        setFreeCancellation(null);
        setPrePayment(null);
        setRoomTwin(null);
        setSelectedMaxAdult([]);
        setSelectedMaxChildren([]);
        setSelectedMaxExtraBed([]);
        setSelectedFacilities([]);
        const newParams = new URLSearchParams(searchParams);
        newParams.delete('stars');
        newParams.delete('locations');
        newParams.delete('freeCancellation');
        newParams.delete('prePayment');
        newParams.delete('roomTwin');
        newParams.delete('roomMaxAdult');
        newParams.delete('roomMaxChildren');
        newParams.delete('roomMaxExtraBed');
        newParams.delete('facilities');
        setSearchParams(newParams);
    };

    const activeFilterCount = [
        selectedStars.length > 0,
        selectedLocations.length > 0,
        freeCancellation !== null,
        prePayment !== null,
        roomTwin !== null,
        selectedMaxAdult.length > 0,
        selectedMaxChildren.length > 0,
        selectedMaxExtraBed.length > 0,
        selectedFacilities.length > 0
    ].filter(Boolean).length;

    return (
        <aside className="w-full lg:w-72 flex-shrink-0 lg:sticky lg:top-24 h-fit">
            <div className="bg-white/80 dark:bg-[#111a22]/80 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-slate-800/50 shadow-2xl shadow-black/5 dark:shadow-white/5 max-h-[calc(100vh-8rem)] overflow-y-auto custom-scrollbar relative">
                {/* Sticky Header with Actions */}
                <div className="sticky top-0 z-50 px-6 py-5 bg-white dark:bg-[#111a22] border-b border-slate-100/50 dark:border-slate-800/50 flex items-center justify-between shadow-lg shadow-black/[0.03] dark:shadow-white/[0.02]">
                    <h2 className="text-lg font-black tracking-tight text-slate-800 dark:text-slate-100" lang={currentLang === 'tr' ? 'tr' : 'en'}>
                        {tFilter('filters', currentLang)}
                    </h2>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleClearAll}
                            className="text-[10px] font-bold text-slate-400 hover:text-red-500 uppercase tracking-widest px-2 py-1 transition-colors"
                            lang={currentLang === 'tr' ? 'tr' : 'en'}
                        >
                            {tFilter('reset', currentLang)}
                        </button>
                        <button
                            onClick={handleApplyFilters}
                            className="group flex items-center gap-2 bg-primary hover:bg-primary-hover text-white text-[10px] font-extrabold uppercase tracking-widest px-4 py-2 rounded-xl transition-all shadow-lg shadow-primary/20 active:scale-95 whitespace-nowrap relative"
                            lang={currentLang === 'tr' ? 'tr' : 'en'}
                        >
                            {tFilter('apply', currentLang)}
                            {activeFilterCount > 0 && (
                                <span className="flex items-center justify-center min-w-[14px] h-[14px] bg-white text-primary text-[9px] font-black rounded-full px-1 animate-in zoom-in duration-300">
                                    {activeFilterCount}
                                </span>
                            )}
                        </button>
                    </div>
                </div>

                <div className="px-6 pb-6">
                {/* Locations */}
                <FilterSection title={tFilter('locations', currentLang)} icon="location_on">
                    <div className="space-y-3">
                        {filters?.locationId && filters.locationId.length > 0 ? (
                            <>
                                {/* Location Search Input */}
                                <div className="relative mb-3 group/search">
                                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/search:text-primary text-sm transition-colors">search</span>
                                    <input 
                                        type="text" 
                                        placeholder={tFilter('searchLocations', currentLang)} 
                                        value={locationSearch}
                                        onChange={(e) => setLocationSearch(e.target.value)}
                                        className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 focus:border-primary/50 focus:ring-4 focus:ring-primary/5 rounded-xl text-xs font-medium placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all"
                                    />
                                    {locationSearch && (
                                        <button 
                                            onClick={() => setLocationSearch('')}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary transition-colors"
                                        >
                                            <span className="material-symbols-outlined text-sm">close</span>
                                        </button>
                                    )}
                                </div>

                                {[...filters.locationId]
                                    .filter(loc => {
                                        const name = locationNames[loc.value];
                                        if (!name || name.startsWith('Location ') || name.startsWith('Location')) return false;
                                        if (locationSearch && !name.toLowerCase().includes(locationSearch.toLowerCase())) return false;
                                        return true;
                                    })
                                    .sort((a, b) => b.count - a.count)
                                    .slice(0, (locationSearch || isLocationsExpanded) ? undefined : 10)
                                    .map(locFilter => {
                                        const locName = locationNames[locFilter.value] || '';
                                        return (
                                            <label key={locFilter.value} className="flex items-center justify-between cursor-pointer group animate-in fade-in duration-200">
                                                <div className="flex items-center gap-3 overflow-hidden">
                                                    <input
                                                        checked={selectedLocations.includes(locFilter.value)}
                                                        onChange={() => handleLocationToggle(locFilter.value)}
                                                        className="h-5 w-5 rounded border-slate-300 dark:border-[#324d67] bg-transparent text-primary focus:ring-primary focus:ring-offset-0 checkbox-tick flex-shrink-0"
                                                        type="checkbox"
                                                    />
                                                    <div className="flex items-center gap-2 overflow-hidden">
                                                        <span className="material-symbols-outlined text-[16px] text-slate-400 group-hover:text-primary transition-colors flex-shrink-0">location_on</span>
                                                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate" title={locName}>
                                                            {locName}
                                                        </span>
                                                    </div>
                                                </div>
                                                <span className="text-xs text-slate-400 dark:text-slate-500 font-medium whitespace-nowrap ml-2">
                                                    ({locFilter.count})
                                                </span>
                                            </label>
                                        );
                                    })}
                                
                                {!locationSearch && filters.locationId.length > 10 && (
                                    <button
                                        onClick={() => setIsLocationsExpanded(!isLocationsExpanded)}
                                        className="text-xs font-bold text-primary hover:text-primary-hover flex items-center gap-1 mt-2 transition-colors uppercase tracking-wider pl-8"
                                        lang={currentLang === 'tr' ? 'tr' : 'en'}
                                    >
                                        {isLocationsExpanded ? (
                                            <>{tFilter('showLess', currentLang)} <span className="material-symbols-outlined text-sm">expand_less</span></>
                                        ) : (
                                            <>{tFilter('showMore', currentLang)} ({filters.locationId.length - 10} {tFilter('showMore', currentLang).toLowerCase().includes('more') ? 'more' : ''}) <span className="material-symbols-outlined text-sm">expand_more</span></>
                                        )}
                                    </button>
                                )}
                            </>
                        ) : (
                            <div className="text-sm text-slate-500 dark:text-slate-400 italic" lang={currentLang === 'tr' ? 'tr' : 'en'}>
                                {tFilter('noLocations', currentLang)}
                            </div>
                        )}
                    </div>
                </FilterSection>

                {/* Star Rating Checklist */}
                <FilterSection title={tFilter('starRating', currentLang)} icon="star">
                    <div className="space-y-3">
                        {filters?.hotelStarCategoryId ? (
                            [...filters.hotelStarCategoryId]
                                .sort((a, b) => b.value - a.value)
                                .map(starFilter => (
                                    <label key={starFilter.value} className="flex items-center justify-between cursor-pointer group">
                                        <div className="flex items-center gap-3">
                                            <input
                                                checked={selectedStars.includes(starFilter.value)}
                                                onChange={() => handleStarToggle(starFilter.value)}
                                                className="h-5 w-5 rounded border-slate-300 dark:border-[#324d67] bg-transparent text-primary focus:ring-primary focus:ring-offset-0 checkbox-tick"
                                                type="checkbox"
                                            />
                                            <div className="flex items-center gap-1">
                                                <span className="text-sm font-medium text-slate-700 dark:text-slate-300" lang={currentLang === 'tr' ? 'tr' : 'en'}>
                                                    {starFilter.value === 0 ? tFilter('unrated', currentLang) : `${starFilter.value} ${tFilter('stars', currentLang)}`}
                                                </span>
                                                {starFilter.value > 0 && (
                                                    <div className="flex text-amber-400">
                                                        {[...Array(starFilter.value)].map((_, i) => (
                                                            <span key={i} className="material-symbols-outlined text-xs fill-1">star</span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                                            ({starFilter.count})
                                        </span>
                                    </label>
                                ))
                        ) : (
                            [5, 4, 3, 2].map(star => (
                                <label key={star} className="flex items-center gap-3 cursor-pointer group">
                                    <input
                                        checked={selectedStars.includes(star)}
                                        onChange={() => handleStarToggle(star)}
                                        className="h-5 w-5 rounded border-slate-300 dark:border-[#324d67] bg-transparent text-primary focus:ring-primary focus:ring-offset-0 checkbox-tick"
                                        type="checkbox"
                                    />
                                    <div className="flex items-center gap-1">
                                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300" lang={currentLang === 'tr' ? 'tr' : 'en'}>
                                            {star} {tFilter('stars', currentLang)}
                                        </span>
                                        <div className="flex text-amber-400">
                                            {[...Array(star)].map((_, i) => (
                                                <span key={i} className="material-symbols-outlined text-xs fill-1">star</span>
                                            ))}
                                        </div>
                                    </div>
                                </label>
                            ))
                        )}
                    </div>
                </FilterSection>

                {/* Free Cancellation */}
                <FilterSection title={tFilter('freeCancellation', currentLang)} icon="event_available">
                    <div className="space-y-3">
                        {(filters?.hasFreeCancellation ?? [
                            { value: true, count: null },
                            { value: false, count: null }
                        ]).sort((a, b) => (b.value === true ? 1 : -1)).map(f => (
                            <label key={String(f.value)} className="flex items-center justify-between cursor-pointer group">
                                <div className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        checked={freeCancellation === f.value}
                                        onChange={() => handleBoolToggle(setFreeCancellation, freeCancellation, f.value)}
                                        className="h-5 w-5 rounded border-slate-300 dark:border-[#324d67] bg-transparent text-primary focus:ring-primary focus:ring-offset-0 checkbox-tick"
                                    />
                                    <div className="flex items-center gap-2">
                                        <span className={`material-symbols-outlined text-[18px] transition-colors ${f.value ? 'text-emerald-500' : 'text-slate-400'}`}>
                                            {f.value ? 'verified' : 'info'}
                                        </span>
                                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300" lang={currentLang === 'tr' ? 'tr' : 'en'}>
                                            {f.value ? tFilter('freeCancellation', currentLang) : tFilter('nonRefundable', currentLang)}
                                        </span>
                                    </div>
                                </div>
                                {f.count !== null && (
                                    <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">({f.count})</span>
                                )}
                            </label>
                        ))}
                    </div>
                </FilterSection>

                {/* Pre-Payment */}
                <FilterSection title={tFilter('prePayment', currentLang)} icon="credit_card">
                    <div className="space-y-3">
                        {(filters?.hasPrePayment ?? [
                            { value: true, count: null },
                            { value: false, count: null }
                        ]).sort((a, b) => (b.value === true ? 1 : -1)).map(f => (
                            <label key={String(f.value)} className="flex items-center justify-between cursor-pointer group">
                                <div className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        checked={prePayment === f.value}
                                        onChange={() => handleBoolToggle(setPrePayment, prePayment, f.value)}
                                        className="h-5 w-5 rounded border-slate-300 dark:border-[#324d67] bg-transparent text-primary focus:ring-primary focus:ring-offset-0 checkbox-tick"
                                    />
                                    <div className="flex items-center gap-2">
                                        <span className="material-symbols-outlined text-[18px] text-slate-400 group-hover:text-primary transition-colors">
                                            {f.value ? 'credit_card' : 'payments'}
                                        </span>
                                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300" lang={currentLang === 'tr' ? 'tr' : 'en'}>
                                            {f.value ? tFilter('prePayment', currentLang) : tFilter('payLater', currentLang)}
                                        </span>
                                    </div>
                                </div>
                                {f.count !== null && (
                                    <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">({f.count})</span>
                                )}
                            </label>
                        ))}
                    </div>
                </FilterSection>

                {/* Room Twin */}
                <FilterSection title={tFilter('twinRoom', currentLang)} icon="bed">
                    <div className="space-y-3">
                        {(filters?.roomTwin ?? [
                            { value: true, count: null },
                            { value: false, count: null }
                        ]).sort((a, b) => (b.value === true ? 1 : -1)).map(f => (
                            <label key={String(f.value)} className="flex items-center justify-between cursor-pointer group">
                                <div className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        checked={roomTwin === f.value}
                                        onChange={() => handleBoolToggle(setRoomTwin, roomTwin, f.value)}
                                        className="h-5 w-5 rounded border-slate-300 dark:border-[#324d67] bg-transparent text-primary focus:ring-primary focus:ring-offset-0 checkbox-tick"
                                    />
                                    <div className="flex items-center gap-2 text-slate-500">
                                        <span className="material-symbols-outlined text-[18px]">bed</span>
                                        {f.value && <span className="material-symbols-outlined text-[12px] -ml-2 mb-2">bed</span>}
                                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300 ml-1" lang={currentLang === 'tr' ? 'tr' : 'en'}>
                                            {f.value ? tFilter('twinAvailable', currentLang) : tFilter('noTwin', currentLang)}
                                        </span>
                                    </div>
                                </div>
                                {f.count !== null && (
                                    <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">({f.count})</span>
                                )}
                            </label>
                        ))}
                    </div>
                </FilterSection>

                {/* Max Adult */}
                <FilterSection title={tFilter('maxAdult', currentLang)} icon="person" defaultOpen={false}>
                    <div className="space-y-3">
                        {filters?.roomMaxAdult?.length > 0 ? (
                            [...filters.roomMaxAdult]
                                .sort((a, b) => a.value - b.value)
                                .map(f => (
                                    <label key={f.value} className="flex items-center justify-between cursor-pointer group">
                                        <div className="flex items-center gap-3">
                                            <input
                                                checked={selectedMaxAdult.includes(f.value)}
                                                onChange={() => handleMaxAdultToggle(f.value)}
                                                className="h-5 w-5 rounded border-slate-300 dark:border-[#324d67] bg-transparent text-primary focus:ring-primary focus:ring-offset-0 checkbox-tick"
                                                type="checkbox"
                                            />
                                            <div className="flex items-center gap-2">
                                                <span className="material-symbols-outlined text-[16px] text-slate-400 group-hover:text-primary transition-colors">person</span>
                                                <span className="text-sm font-medium text-slate-700 dark:text-slate-300" lang={currentLang === 'tr' ? 'tr' : 'en'}>
                                                    {f.value} {tFilter('adults', currentLang)}
                                                </span>
                                            </div>
                                        </div>
                                        <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                                            ({f.count})
                                        </span>
                                    </label>
                                ))
                        ) : (
                            <div className="text-sm text-slate-500 dark:text-slate-400 italic" lang={currentLang === 'tr' ? 'tr' : 'en'}>
                                {tFilter('noLocations', currentLang).includes('belirli') ? 'Seçenek bulunamadı' : 'No options found'}
                            </div>
                        )}
                    </div>
                </FilterSection>

                {/* Max Children */}
                <FilterSection title={tFilter('maxChildren', currentLang)} icon="child_care" defaultOpen={false}>
                    <div className="space-y-3">
                        {filters?.roomMaxChildren?.length > 0 ? (
                            [...filters.roomMaxChildren]
                                .sort((a, b) => a.value - b.value)
                                .map(f => (
                                    <label key={f.value} className="flex items-center justify-between cursor-pointer group">
                                        <div className="flex items-center gap-3">
                                            <input
                                                checked={selectedMaxChildren.includes(f.value)}
                                                onChange={() => handleMaxChildrenToggle(f.value)}
                                                className="h-5 w-5 rounded border-slate-300 dark:border-[#324d67] bg-transparent text-primary focus:ring-primary focus:ring-offset-0 checkbox-tick"
                                                type="checkbox"
                                            />
                                            <div className="flex items-center gap-2">
                                                <span className="material-symbols-outlined text-[16px] text-slate-400 group-hover:text-primary transition-colors">child_care</span>
                                                <span className="text-sm font-medium text-slate-700 dark:text-slate-300" lang={currentLang === 'tr' ? 'tr' : 'en'}>
                                                    {f.value === 0 ? tFilter('noChildren', currentLang) : `${f.value} ${tFilter('children', currentLang)}`}
                                                </span>
                                            </div>
                                        </div>
                                        <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                                            ({f.count})
                                        </span>
                                    </label>
                                ))
                        ) : (
                            <div className="text-sm text-slate-500 dark:text-slate-400 italic" lang={currentLang === 'tr' ? 'tr' : 'en'}>
                                {tFilter('noLocations', currentLang).includes('belirli') ? 'Seçenek bulunamadı' : 'No options found'}
                            </div>
                        )}
                    </div>
                </FilterSection>

                {/* Max Extra Bed */}
                <FilterSection title={tFilter('maxExtraBed', currentLang)} icon="hotel_class" defaultOpen={false}>
                    <div className="space-y-3">
                        {filters?.roomMaxExtraBed?.length > 0 ? (
                            [...filters.roomMaxExtraBed]
                                .sort((a, b) => a.value - b.value)
                                .map(f => (
                                    <label key={f.value} className="flex items-center justify-between cursor-pointer group">
                                        <div className="flex items-center gap-3">
                                            <input
                                                checked={selectedMaxExtraBed.includes(f.value)}
                                                onChange={() => handleMaxExtraBedToggle(f.value)}
                                                className="h-5 w-5 rounded border-slate-300 dark:border-[#324d67] bg-transparent text-primary focus:ring-primary focus:ring-offset-0 checkbox-tick"
                                                type="checkbox"
                                            />
                                            <div className="flex items-center gap-2">
                                                <span className="material-symbols-outlined text-[16px] text-slate-400 group-hover:text-primary transition-colors">hotel_class</span>
                                                <span className="text-sm font-medium text-slate-700 dark:text-slate-300" lang={currentLang === 'tr' ? 'tr' : 'en'}>
                                                    {f.value === 0 ? tFilter('noExtraBed', currentLang) : `${f.value} ${f.value === 1 ? tFilter('extraBed', currentLang) : tFilter('extraBeds', currentLang)}`}
                                                </span>
                                            </div>
                                        </div>
                                        <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                                            ({f.count})
                                        </span>
                                    </label>
                                ))
                        ) : (
                            <div className="text-sm text-slate-500 dark:text-slate-400 italic" lang={currentLang === 'tr' ? 'tr' : 'en'}>
                                {tFilter('noLocations', currentLang).includes('belirli') ? 'Seçenek bulunamadı' : 'No options found'}
                            </div>
                        )}
                    </div>
                </FilterSection>

                {/* Hotel Facilities */}
                <FilterSection title={tFilter('hotelFacilities', currentLang)} icon="pool">
                    <div className="space-y-3">
                        {filters?.hotelFacilityIds && filters.hotelFacilityIds.length > 0 ? (
                            <>
                                {/* Facility Search Input */}
                                <div className="relative mb-3 group/search">
                                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/search:text-primary text-sm transition-colors">search</span>
                                    <input 
                                        type="text" 
                                        placeholder={tFilter('searchFacilities', currentLang)} 
                                        value={facilitySearch}
                                        onChange={(e) => setFacilitySearch(e.target.value)}
                                        className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 focus:border-primary/50 focus:ring-4 focus:ring-primary/5 rounded-xl text-xs font-medium placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all"
                                    />
                                    {facilitySearch && (
                                        <button 
                                            onClick={() => setFacilitySearch('')}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary transition-colors"
                                        >
                                            <span className="material-symbols-outlined text-sm">close</span>
                                        </button>
                                    )}
                                </div>

                                {[...filters.hotelFacilityIds]
                                    .filter(fac => {
                                        const name = facilityNames[fac.value];
                                        if (!name || name.startsWith('Facility ') || name.startsWith('Facility')) return false;
                                        if (facilitySearch && !name.toLowerCase().includes(facilitySearch.toLowerCase())) return false;
                                        return true;
                                    })
                                    .sort((a, b) => b.count - a.count)
                                    .slice(0, (facilitySearch || isFacilitiesExpanded) ? undefined : 10)
                                    .map(facFilter => {
                                        const facName = facilityNames[facFilter.value] || '';
                                        return (
                                            <label key={facFilter.value} className="flex items-center justify-between cursor-pointer group animate-in fade-in duration-200">
                                                <div className="flex items-center gap-3 overflow-hidden">
                                                    <input
                                                        checked={selectedFacilities.includes(facFilter.value)}
                                                        onChange={() => handleFacilityToggle(facFilter.value)}
                                                        className="h-5 w-5 rounded border-slate-300 dark:border-[#324d67] bg-transparent text-primary focus:ring-primary focus:ring-offset-0 checkbox-tick flex-shrink-0"
                                                        type="checkbox"
                                                    />
                                                    <div className="flex items-center gap-2 overflow-hidden">
                                                        <span className="material-symbols-outlined text-[16px] text-slate-400 group-hover:text-primary transition-colors flex-shrink-0">business_center</span>
                                                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate" title={facName}>
                                                            {facName}
                                                        </span>
                                                    </div>
                                                </div>
                                                <span className="text-xs text-slate-400 dark:text-slate-500 font-medium whitespace-nowrap ml-2">
                                                    ({facFilter.count})
                                                </span>
                                            </label>
                                        );
                                    })}
                                
                                {!facilitySearch && filters.hotelFacilityIds.length > 10 && (
                                    <button
                                        onClick={() => setIsFacilitiesExpanded(!isFacilitiesExpanded)}
                                        className="text-xs font-bold text-primary hover:text-primary-hover flex items-center gap-1 mt-2 transition-colors uppercase tracking-wider pl-8"
                                        lang={currentLang === 'tr' ? 'tr' : 'en'}
                                    >
                                        {isFacilitiesExpanded ? (
                                            <>{tFilter('showLess', currentLang)} <span className="material-symbols-outlined text-sm">expand_less</span></>
                                        ) : (
                                            <>{tFilter('showMore', currentLang)} ({filters.hotelFacilityIds.length - 10} {tFilter('showMore', currentLang).toLowerCase().includes('more') ? 'more' : ''}) <span className="material-symbols-outlined text-sm">expand_more</span></>
                                        )}
                                    </button>
                                )}
                            </>
                        ) : (
                            <div className="text-sm text-slate-500 dark:text-slate-400 italic" lang={currentLang === 'tr' ? 'tr' : 'en'}>
                                {tFilter('noFacilities', currentLang)}
                            </div>
                        )}
                    </div>
                </FilterSection>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
