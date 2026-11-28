import React, { useMemo, useState } from 'react';
import {
    Wifi,
    Monitor,
    Tv,
    Phone,
    Waves,
    Umbrella,
    Sun,
    Trees,
    Flame,
    Palmtree,
    Utensils,
    Coffee,
    Wine,
    Martini,
    Music,
    ConciergeBell,
    Refrigerator,
    ChefHat,
    Sparkles,
    Bath,
    Droplets,
    Dumbbell,
    Bike,
    Trophy,
    Snowflake,
    Wind,
    Gamepad2,
    Ticket,
    Car,
    CircleParking,
    Zap,
    Plane,
    Bus,
    Clock,
    KeyRound,
    Compass,
    Globe,
    Luggage,
    Shirt,
    WashingMachine,
    BedDouble,
    Lock,
    ShieldCheck,
    CreditCard,
    ShoppingBag,
    Scissors,
    HeartPulse,
    BookOpen,
    Heart,
    Briefcase,
    Users,
    Presentation,
    Printer,
    Baby,
    PawPrint,
    Accessibility,
    ArrowUpDown,
    Building2,
    CigaretteOff,
    Cigarette,
    Leaf,
    Recycle,
    Sofa,
    ShowerHead,
    CheckCircle2,
    Search,
    X,
    ChevronDown,
    ChevronUp
} from 'lucide-react';
import {
    groupFacilities,
    extractHighlightAmenities,
    getAmenityCategoryLabel
} from '../utils/facilityUtils';

const LUCIDE_AMENITY_ICONS = {
    Wifi,
    Monitor,
    Tv,
    Phone,
    Waves,
    Umbrella,
    Sun,
    Trees,
    Flame,
    Palmtree,
    Utensils,
    Coffee,
    Wine,
    Martini,
    Music,
    ConciergeBell,
    Refrigerator,
    ChefHat,
    Sparkles,
    Bath,
    Droplets,
    Dumbbell,
    Bike,
    Trophy,
    Snowflake,
    Wind,
    Gamepad2,
    Ticket,
    Car,
    CircleParking,
    Zap,
    Plane,
    Bus,
    Clock,
    KeyRound,
    Compass,
    Globe,
    Luggage,
    Shirt,
    WashingMachine,
    BedDouble,
    Lock,
    ShieldCheck,
    CreditCard,
    ShoppingBag,
    Scissors,
    HeartPulse,
    BookOpen,
    Heart,
    Briefcase,
    Users,
    Presentation,
    Printer,
    Baby,
    PawPrint,
    Accessibility,
    ArrowUpDown,
    Building2,
    CigaretteOff,
    Cigarette,
    Leaf,
    Recycle,
    Sofa,
    ShowerHead,
    CheckCircle2
};

export const AmenityLucideIcon = ({ name, className = 'w-4 h-4', strokeWidth = 1.9 }) => {
    const IconComponent = LUCIDE_AMENITY_ICONS[name] || CheckCircle2;
    return <IconComponent className={className} strokeWidth={strokeWidth} aria-hidden="true" />;
};

const SECTION_LOCALES = {
    tr: {
        title: 'Tesis Olanakları & Hizmetleri',
        highlights: 'Öne Çıkanlar',
        all: 'Tümü',
        searchPlaceholder: 'Olanaklarda ara...',
        clearSearch: 'Aramayı temizle',
        noMatches: 'Aramanızla eşleşen olanak bulunamadı.',
        noData: 'Bu tesis için detaylı olanak bilgisi henüz listelenmemiş.',
        showMore: (n) => `+${n} daha fazla göster`,
        showLess: 'Daha az göster',
        amenitiesCount: (n) => `${n} olanak`,
        freeBadge: 'Ücretsiz'
    },
    en: {
        title: 'Property Amenities & Services',
        highlights: 'Key Highlights',
        all: 'All',
        searchPlaceholder: 'Search amenities...',
        clearSearch: 'Clear search',
        noMatches: 'No amenities match your search.',
        noData: 'Detailed amenity information is not listed for this property.',
        showMore: (n) => `Show ${n} more`,
        showLess: 'Show less',
        amenitiesCount: (n) => `${n} amenities`,
        freeBadge: 'Free'
    },
    de: {
        title: 'Ausstattung & Service',
        highlights: 'Highlights',
        all: 'Alle',
        searchPlaceholder: 'Ausstattung suchen...',
        clearSearch: 'Suche löschen',
        noMatches: 'Keine passenden Ausstattungsmerkmale gefunden.',
        noData: 'Für diese Unterkunft sind keine detaillierten Ausstattungsmerkmale aufgeführt.',
        showMore: (n) => `+${n} weitere anzeigen`,
        showLess: 'Weniger anzeigen',
        amenitiesCount: (n) => `${n} Merkmale`,
        freeBadge: 'Kostenlos'
    },
    ar: {
        title: 'المرافق والخدمات',
        highlights: 'أبرز المرافق',
        all: 'الكل',
        searchPlaceholder: 'ابحث في المرافق...',
        clearSearch: 'مسح البحث',
        noMatches: 'لم يتم العثور على مرافق مطابقة لبحثك.',
        noData: 'لا توجد معلومات تفصيلية عن المرافق لهذه المنشأة.',
        showMore: (n) => `عرض ${n} إضافية`,
        showLess: 'عرض أقل',
        amenitiesCount: (n) => `${n} مرفق`,
        freeBadge: 'مجاني'
    },
    es: {
        title: 'Servicios e instalaciones',
        highlights: 'Destacados',
        all: 'Todos',
        searchPlaceholder: 'Buscar servicios...',
        clearSearch: 'Borrar búsqueda',
        noMatches: 'No hay servicios que coincidan con tu búsqueda.',
        noData: 'No hay información detallada de servicios para este alojamiento.',
        showMore: (n) => `Ver ${n} más`,
        showLess: 'Ver menos',
        amenitiesCount: (n) => `${n} servicios`,
        freeBadge: 'Gratis'
    },
    ru: {
        title: 'Удобства и услуги',
        highlights: 'Главные удобства',
        all: 'Все',
        searchPlaceholder: 'Поиск удобств...',
        clearSearch: 'Сбросить поиск',
        noMatches: 'Удобства по вашему запросу не найдены.',
        noData: 'Подробная информация об удобствах для этого объекта не указана.',
        showMore: (n) => `Показать еще ${n}`,
        showLess: 'Свернуть',
        amenitiesCount: (n) => `${n} удобств`,
        freeBadge: 'Бесплатно'
    }
};

const PropertyAmenitiesSection = ({
    facilities = [],
    currentLang = 'en',
    isLoading = false,
    variant = 'drawer', // 'drawer' | 'detail'
    showHeader = true,
    title = null,
    sectionId = undefined
}) => {
    const normLang = String(currentLang || 'en').split(/[-_]/)[0].toLowerCase();
    const loc = SECTION_LOCALES[normLang] || SECTION_LOCALES.en;

    const [selectedCategory, setSelectedCategory] = useState('ALL');
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedGroups, setExpandedGroups] = useState({});

    // Group & deduplicate facilities
    const groups = useMemo(
        () => groupFacilities(facilities, currentLang),
        [facilities, currentLang]
    );

    const totalCount = useMemo(
        () => groups.reduce((sum, g) => sum + g.items.length, 0),
        [groups]
    );

    const highlights = useMemo(
        () => extractHighlightAmenities(facilities, currentLang, variant === 'detail' ? 8 : 6),
        [facilities, currentLang, variant]
    );

    // Derive effective category safely without synchronous setState in effect
    const effectiveSelectedCategory = useMemo(() => {
        if (selectedCategory !== 'ALL' && !groups.some(g => g.id === selectedCategory)) {
            return 'ALL';
        }
        return selectedCategory;
    }, [groups, selectedCategory]);

    // Filter groups by search query & selected category
    const visibleGroups = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        return groups
            .filter(g => effectiveSelectedCategory === 'ALL' || g.id === effectiveSelectedCategory)
            .map(g => {
                if (!q) return g;
                const catTitle = getAmenityCategoryLabel(g.id, currentLang).toLowerCase();
                if (catTitle.includes(q)) return g;
                const filteredItems = g.items.filter(item =>
                    item.label.toLowerCase().includes(q)
                );
                return { ...g, items: filteredItems };
            })
            .filter(g => g.items.length > 0);
    }, [groups, effectiveSelectedCategory, searchQuery, currentLang]);

    const collapsedLimit = variant === 'detail' ? 9 : 8;
    const isFiltering = Boolean(searchQuery.trim()) || effectiveSelectedCategory !== 'ALL';

    const toggleExpandGroup = (groupId) => {
        setExpandedGroups(prev => ({ ...prev, [groupId]: !prev[groupId] }));
    };

    // Loading state when no initial facilities are available yet
    if (isLoading && totalCount === 0) {
        return (
            <div id={sectionId} className="space-y-3">
                {showHeader && (
                    <div className="flex items-center justify-between gap-2">
                        <h3 className="text-[16px] font-medium text-[#202124] dark:text-slate-100">
                            {title || loc.title}
                        </h3>
                    </div>
                )}
                <div className="space-y-3 animate-pulse">
                    {[1, 2, 3].map(i => (
                        <div
                            key={i}
                            className="rounded-xl border border-[#e2e8f0] dark:border-slate-700/80 bg-white dark:bg-[#25272a] overflow-hidden"
                        >
                            <div className="px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-700/70 flex items-center gap-2.5">
                                <div className="size-7 rounded-lg bg-slate-200 dark:bg-slate-700" />
                                <div className="h-3.5 w-36 rounded bg-slate-200 dark:bg-slate-700" />
                            </div>
                            <div className="p-3 grid grid-cols-2 gap-2.5">
                                {[1, 2, 3, 4].map(j => (
                                    <div key={j} className="flex items-center gap-2.5 p-1.5">
                                        <div className="size-6 rounded-md bg-slate-100 dark:bg-slate-800" />
                                        <div className="h-3 flex-1 rounded bg-slate-100 dark:bg-slate-800" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // Empty state
    if (totalCount === 0) {
        return (
            <div id={sectionId} className="space-y-3">
                {showHeader && (
                    <h3 className="text-[16px] font-medium text-[#202124] dark:text-slate-100">
                        {title || loc.title}
                    </h3>
                )}
                <div className="rounded-xl border border-dashed border-[#dadce0] dark:border-slate-700 bg-[#f8f9fa] dark:bg-[#25272a] px-4 py-6 text-center">
                    <Building2 className="w-6 h-6 text-[#9aa0a6] mx-auto mb-2" strokeWidth={1.6} />
                    <p className="text-[13px] text-[#5f6368] dark:text-slate-400">
                        {loc.noData}
                    </p>
                </div>
            </div>
        );
    }

    const showSearch = totalCount > 10;
    const showCategoryChips = groups.length >= 2;
    const showHighlights = !isFiltering && totalCount >= 10 && highlights.length >= 3;

    return (
        <div id={sectionId} className="space-y-3.5">
            {/* Header Row: Title + Count Pill + Compact Search */}
            {(showHeader || showSearch) && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    {showHeader ? (
                        <div className="flex items-center gap-2 min-w-0">
                            <h3 className="text-[16px] font-medium text-[#202124] dark:text-slate-100 truncate">
                                {title || loc.title}
                            </h3>
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#e8f0fe] text-[#1a73e8] dark:bg-blue-500/15 dark:text-blue-300 shrink-0">
                                {loc.amenitiesCount(totalCount)}
                            </span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11.5px] font-semibold bg-[#e8f0fe] text-[#1a73e8] dark:bg-blue-500/15 dark:text-blue-300">
                                {loc.amenitiesCount(totalCount)}
                            </span>
                        </div>
                    )}

                    {showSearch && (
                        <div className="relative w-full sm:w-56 shrink-0">
                            <Search
                                className="w-3.5 h-3.5 text-[#5f6368] dark:text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                                strokeWidth={2}
                            />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder={loc.searchPlaceholder}
                                className="w-full pl-8 pr-7 py-1.5 text-[12.5px] rounded-full bg-[#f1f3f4] dark:bg-[#303134] border border-transparent focus:border-[#1a73e8] focus:bg-white dark:focus:bg-[#202124] text-[#202124] dark:text-slate-100 placeholder-[#70757a] dark:placeholder-slate-400 outline-none transition-all"
                            />
                            {searchQuery && (
                                <button
                                    type="button"
                                    onClick={() => setSearchQuery('')}
                                    aria-label={loc.clearSearch}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 size-5 rounded-full flex items-center justify-center text-[#5f6368] hover:text-[#202124] dark:text-slate-400 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer transition-colors"
                                >
                                    <X className="w-3 h-3" strokeWidth={2.2} />
                                </button>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Key Highlights Strip */}
            {showHighlights && (
                <div className="p-3 rounded-xl bg-gradient-to-br from-[#f8fafd] to-[#f1f5f9]/70 dark:from-[#262a30] dark:to-[#22252a] border border-[#e2e8f0] dark:border-slate-700/80">
                    <div className="text-[10.5px] font-semibold uppercase tracking-wider text-[#5f6368] dark:text-slate-400 mb-2">
                        {loc.highlights}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                        {highlights.map((item, idx) => {
                            const catMeta = groups.find(g => g.id === item.category)?.meta;
                            return (
                                <span
                                    key={`${item.label}-${idx}`}
                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-medium bg-white dark:bg-[#303134] text-[#1e293b] dark:text-slate-100 border border-[#e2e8f0] dark:border-slate-600/80 shadow-[0_1px_2px_rgba(0,0,0,0.03)]"
                                >
                                    <span className={`size-4 rounded-full flex items-center justify-center shrink-0 ${catMeta?.accent?.itemBg || 'text-[#1a73e8]'}`}>
                                        <AmenityLucideIcon name={item.lucideIcon} className="w-3 h-3" strokeWidth={2.2} />
                                    </span>
                                    <span className="truncate max-w-[200px]">{item.label}</span>
                                </span>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Category Quick-Filter Pills */}
            {showCategoryChips && (
                <div className="flex flex-wrap items-center gap-1.5">
                    <button
                        type="button"
                        onClick={() => setSelectedCategory('ALL')}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-medium border transition-all cursor-pointer ${
                            effectiveSelectedCategory === 'ALL'
                                ? 'bg-[#1a73e8] text-white border-[#1a73e8] shadow-xs'
                                : 'bg-white dark:bg-[#303134] text-[#3c4043] dark:text-slate-300 border-[#dadce0] dark:border-slate-700 hover:bg-[#f8f9fa] dark:hover:bg-slate-700/70'
                        }`}
                    >
                        <span>{loc.all}</span>
                        <span className={`text-[10.5px] font-semibold px-1.5 py-0.2 rounded-full ${
                            effectiveSelectedCategory === 'ALL'
                                ? 'bg-white/20 text-white'
                                : 'bg-[#f1f3f4] dark:bg-slate-700 text-[#5f6368] dark:text-slate-300'
                        }`}>
                            {totalCount}
                        </span>
                    </button>

                    {groups.map(group => {
                        const isActive = effectiveSelectedCategory === group.id;
                        const shortLabel = getAmenityCategoryLabel(group.id, currentLang, true);
                        return (
                            <button
                                key={group.id}
                                type="button"
                                onClick={() => setSelectedCategory(prev => (prev === group.id ? 'ALL' : group.id))}
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-medium border transition-all cursor-pointer ${
                                    isActive
                                        ? `${group.meta.accent.chipActive} shadow-xs`
                                        : 'bg-white dark:bg-[#303134] text-[#3c4043] dark:text-slate-300 border-[#dadce0] dark:border-slate-700 hover:bg-[#f8f9fa] dark:hover:bg-slate-700/70'
                                }`}
                            >
                                <AmenityLucideIcon
                                    name={group.meta.lucideIcon}
                                    className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-white' : 'text-[#5f6368] dark:text-slate-400'}`}
                                    strokeWidth={2}
                                />
                                <span>{shortLabel}</span>
                                <span className={`text-[10.5px] font-semibold ${
                                    isActive ? 'text-white/90' : 'text-[#70757a] dark:text-slate-400'
                                }`}>
                                    ({group.items.length})
                                </span>
                            </button>
                        );
                    })}
                </div>
            )}

            {/* Grouped Category Cards */}
            {visibleGroups.length === 0 ? (
                <div className="rounded-xl border border-[#dadce0] dark:border-slate-700 bg-[#f8f9fa] dark:bg-[#25272a] px-4 py-6 text-center space-y-2">
                    <p className="text-[13px] text-[#5f6368] dark:text-slate-400">
                        {loc.noMatches}
                    </p>
                    {searchQuery && (
                        <button
                            type="button"
                            onClick={() => setSearchQuery('')}
                            className="inline-flex items-center gap-1 text-[12px] font-medium text-[#1a73e8] dark:text-blue-400 hover:underline cursor-pointer"
                        >
                            {loc.clearSearch}
                        </button>
                    )}
                </div>
            ) : (
                <div className="space-y-3">
                    {visibleGroups.map(group => {
                        const isExpanded = isFiltering || Boolean(expandedGroups[group.id]);
                        const hasOverflow = !isFiltering && group.items.length > collapsedLimit;
                        const displayedItems = isExpanded ? group.items : group.items.slice(0, collapsedLimit);
                        const hiddenCount = group.items.length - collapsedLimit;
                        const categoryTitle = getAmenityCategoryLabel(group.id, currentLang, false);

                        return (
                            <div
                                key={group.id}
                                className="rounded-xl border border-[#e2e8f0] dark:border-slate-700/80 bg-white dark:bg-[#25272a] overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.03)]"
                            >
                                {/* Group Header */}
                                <div className={`px-3.5 py-2.5 border-b border-[#edf2f7] dark:border-slate-700/70 flex items-center justify-between gap-2 ${group.meta.accent.headerBg}`}>
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <div className={`size-7 rounded-lg flex items-center justify-center shrink-0 ${group.meta.accent.badgeBg}`}>
                                            <AmenityLucideIcon name={group.meta.lucideIcon} className="w-4 h-4" strokeWidth={2} />
                                        </div>
                                        <h4 className="text-[13.5px] font-semibold text-[#1e293b] dark:text-slate-100 truncate">
                                            {categoryTitle}
                                        </h4>
                                    </div>
                                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-white/90 dark:bg-slate-800/90 text-[#5f6368] dark:text-slate-300 border border-[#e2e8f0]/80 dark:border-slate-700 shrink-0">
                                        {group.items.length}
                                    </span>
                                </div>

                                {/* Items Grid */}
                                <div
                                    className={`grid gap-x-2.5 gap-y-1 p-2.5 ${
                                        variant === 'detail'
                                            ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
                                            : 'grid-cols-1 sm:grid-cols-2'
                                    }`}
                                >
                                    {displayedItems.map(item => (
                                        <div
                                            key={item.key}
                                            title={item.label}
                                            className="flex items-start gap-2.5 px-2 py-1.5 rounded-lg hover:bg-[#f8fafc] dark:hover:bg-slate-800/60 transition-colors"
                                        >
                                            <div className={`size-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${group.meta.accent.itemBg}`}>
                                                <AmenityLucideIcon
                                                    name={item.lucideIcon}
                                                    className="w-[15px] h-[15px]"
                                                    strokeWidth={1.9}
                                                />
                                            </div>
                                            <div className="min-w-0 flex-1 pt-0.5">
                                                <span className="text-[12.5px] leading-snug text-[#334155] dark:text-slate-200 block break-words">
                                                    {item.label}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Expand / Collapse Footer */}
                                {hasOverflow && (
                                    <div className="px-3 pb-2.5 pt-0.5">
                                        <button
                                            type="button"
                                            onClick={() => toggleExpandGroup(group.id)}
                                            className="w-full py-1.5 rounded-lg text-[12px] font-medium text-[#1a73e8] dark:text-blue-400 hover:bg-blue-50/70 dark:hover:bg-blue-950/30 flex items-center justify-center gap-1 transition-colors cursor-pointer"
                                        >
                                            {isExpanded ? (
                                                <>
                                                    <span>{loc.showLess}</span>
                                                    <ChevronUp className="w-3.5 h-3.5" strokeWidth={2.2} />
                                                </>
                                            ) : (
                                                <>
                                                    <span>{loc.showMore(hiddenCount)}</span>
                                                    <ChevronDown className="w-3.5 h-3.5" strokeWidth={2.2} />
                                                </>
                                            )}
                                        </button>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default React.memo(PropertyAmenitiesSection);
