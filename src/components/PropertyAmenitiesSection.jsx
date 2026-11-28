import React, { useMemo } from 'react';
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
    SquareParking,
    CircleParking,
    CircleDollarSign,
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
    Check,
    Info
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
    SquareParking,
    CircleParking,
    CircleDollarSign,
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
    Check
};

export const AmenityLucideIcon = ({ name, className = 'w-[18px] h-[18px]', strokeWidth = 1.75 }) => {
    const IconComponent = LUCIDE_AMENITY_ICONS[name] || Check;
    return <IconComponent className={className} strokeWidth={strokeWidth} aria-hidden="true" />;
};

const SECTION_LOCALES = {
    tr: {
        title: 'Sunulan olanaklar',
        popularTitle: 'Popüler olanaklar',
        infoTooltip: 'Olanaklar tesis tarafından sağlanan bilgilere dayanmaktadır ve sezon veya oda tipine göre değişiklik gösterebilir.',
        noData: 'Bu tesis için detaylı olanak bilgisi henüz listelenmemiş.'
    },
    en: {
        title: 'Amenities',
        popularTitle: 'Popular amenities',
        infoTooltip: 'Amenities are provided by the property and may vary by room type or season.',
        noData: 'Detailed amenity information is not listed for this property.'
    },
    de: {
        title: 'Ausstattung',
        popularTitle: 'Beliebte Ausstattungen',
        infoTooltip: 'Die Angaben zur Ausstattung stammen von der Unterkunft und können je nach Zimmertyp variieren.',
        noData: 'Für diese Unterkunft sind keine detaillierten Ausstattungsmerkmale aufgeführt.'
    },
    ar: {
        title: 'المرافق والخدمات',
        popularTitle: 'المرافق الشائعة',
        infoTooltip: 'تعتمد المرافق على المعلومات المقدمة من المنشأة وقد تختلف حسب نوع الغرفة أو الموسم.',
        noData: 'لا توجد معلومات تفصيلية عن المرافق لهذه المنشأة.'
    },
    es: {
        title: 'Servicios e instalaciones',
        popularTitle: 'Servicios populares',
        infoTooltip: 'Los servicios son proporcionados por el alojamiento y pueden variar según el tipo de habitación.',
        noData: 'No hay información detallada de servicios para este alojamiento.'
    },
    ru: {
        title: 'Удобства и услуги',
        popularTitle: 'Популярные удобства',
        infoTooltip: 'Информация об удобствах предоставлена объектом размещения и может зависеть от типа номера.',
        noData: 'Подробная информация об удобствах для этого объекта не указана.'
    }
};

/**
 * Distribute category blocks across 2 balanced columns so vertical heights match cleanly
 * (Google Hotels layout: Internet & Policies left, Food & Drink & Services right, etc.).
 */
const balanceIntoTwoColumns = (groups) => {
    const left = [];
    const right = [];
    let leftWeight = 0;
    let rightWeight = 0;

    groups.forEach((group, idx) => {
        const weight = 2.4 + group.items.length;
        if (idx === 0) {
            left.push(group);
            leftWeight += weight;
        } else if (idx === 1) {
            right.push(group);
            rightWeight += weight;
        } else if (leftWeight <= rightWeight) {
            left.push(group);
            leftWeight += weight;
        } else {
            right.push(group);
            rightWeight += weight;
        }
    });

    return [left, right];
};

const CategoryColumnBlock = ({ group, currentLang }) => {
    const categoryTitle = getAmenityCategoryLabel(group.id, currentLang);

    return (
        <div>
            {/* Category Header with monochrome icon & crisp divider line */}
            <div className="flex items-center gap-2.5 pb-2.5 mb-3.5 border-b border-[#dadce0] dark:border-slate-700">
                <AmenityLucideIcon
                    name={group.meta.lucideIcon}
                    className="w-[19px] h-[19px] text-[#202124] dark:text-slate-100 shrink-0"
                    strokeWidth={1.8}
                />
                <h4 className="text-[15.5px] font-medium text-[#202124] dark:text-slate-100 leading-snug">
                    {categoryTitle}
                </h4>
            </div>

            {/* Clean checkmark list */}
            <ul className="space-y-3">
                {group.items.map(item => (
                    <li
                        key={item.key}
                        className="flex items-start gap-3 text-[13.5px] text-[#202124] dark:text-slate-200 leading-snug"
                    >
                        <Check
                            className="w-[16px] h-[16px] text-[#202124] dark:text-slate-300 shrink-0 mt-[2px]"
                            strokeWidth={1.85}
                            aria-hidden="true"
                        />
                        <span className="min-w-0 flex-1 break-words">
                            <span>{item.displayLabel}</span>
                            {item.badges?.map((badge, bIdx) => (
                                <span
                                    key={bIdx}
                                    className="inline-block align-middle ml-1.5 px-2 py-[1px] rounded-[4px] bg-[#e8eaed] dark:bg-slate-700/80 text-[#3c4043] dark:text-slate-200 text-[11.5px] font-normal leading-tight whitespace-nowrap"
                                >
                                    {badge}
                                </span>
                            ))}
                        </span>
                    </li>
                ))}
            </ul>
        </div>
    );
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

    const groups = useMemo(
        () => groupFacilities(facilities, currentLang),
        [facilities, currentLang]
    );

    const totalCount = useMemo(
        () => groups.reduce((sum, g) => sum + g.items.length, 0),
        [groups]
    );

    const popularAmenities = useMemo(
        () => extractHighlightAmenities(facilities, currentLang, variant === 'detail' ? 6 : 5),
        [facilities, currentLang, variant]
    );

    const [leftGroups, rightGroups] = useMemo(
        () => balanceIntoTwoColumns(groups),
        [groups]
    );

    // Loading state when initial facilities haven't arrived yet
    if (isLoading && totalCount === 0) {
        return (
            <div
                id={sectionId}
                className="bg-white dark:bg-[#202124] rounded-xl border border-[#dadce0] dark:border-slate-700 overflow-hidden animate-pulse"
            >
                {showHeader && (
                    <div className="px-5 sm:px-6 py-4 border-b border-[#dadce0] dark:border-slate-700">
                        <div className="h-5 w-40 rounded bg-slate-200 dark:bg-slate-700" />
                    </div>
                )}
                <div className="px-5 sm:px-6 py-5 border-b border-[#dadce0] dark:border-slate-700 space-y-3">
                    <div className="h-4 w-32 rounded bg-slate-200 dark:bg-slate-700" />
                    <div className="flex flex-wrap gap-6">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="h-4 w-28 rounded bg-slate-100 dark:bg-slate-800" />
                        ))}
                    </div>
                </div>
                <div className="px-5 sm:px-6 py-6 grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6">
                    {[1, 2].map(col => (
                        <div key={col} className="space-y-3">
                            <div className="h-4 w-36 rounded bg-slate-200 dark:bg-slate-700" />
                            <div className="h-px bg-slate-200 dark:bg-slate-700" />
                            {[1, 2, 3, 4].map(r => (
                                <div key={r} className="h-3.5 w-3/4 rounded bg-slate-100 dark:bg-slate-800" />
                            ))}
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // Empty state
    if (totalCount === 0) {
        return (
            <div
                id={sectionId}
                className="bg-white dark:bg-[#202124] rounded-xl border border-[#dadce0] dark:border-slate-700 overflow-hidden"
            >
                {showHeader && (
                    <div className="px-5 sm:px-6 py-4 border-b border-[#dadce0] dark:border-slate-700 flex items-center gap-2">
                        <h3 className="text-[17px] sm:text-[18px] font-medium text-[#202124] dark:text-slate-100">
                            {title || loc.title}
                        </h3>
                    </div>
                )}
                <div className="px-5 sm:px-6 py-8 text-center">
                    <p className="text-[13.5px] text-[#5f6368] dark:text-slate-400">
                        {loc.noData}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div
            id={sectionId}
            className="bg-white dark:bg-[#202124] rounded-xl border border-[#dadce0] dark:border-slate-700 overflow-hidden"
        >
            {/* 1. Card Header: "Sunulan olanaklar ⓘ" */}
            {showHeader && (
                <div className="px-5 sm:px-6 py-4 border-b border-[#dadce0] dark:border-slate-700 flex items-center gap-2">
                    <h3 className="text-[17px] sm:text-[18px] font-medium text-[#202124] dark:text-slate-100 leading-tight">
                        {title || loc.title}
                    </h3>
                    <span
                        title={loc.infoTooltip}
                        className="inline-flex items-center justify-center text-[#5f6368] dark:text-slate-400 hover:text-[#202124] dark:hover:text-slate-200 transition-colors cursor-help"
                    >
                        <Info className="w-[17px] h-[17px]" strokeWidth={1.75} />
                    </span>
                </div>
            )}

            {/* 2. Popular Amenities Strip */}
            {popularAmenities.length > 0 && (
                <div className="px-5 sm:px-6 py-5 border-b border-[#dadce0] dark:border-slate-700">
                    <h4 className="text-[15px] font-medium text-[#202124] dark:text-slate-100 mb-3.5">
                        {loc.popularTitle}
                    </h4>
                    <div className="flex flex-wrap items-center gap-x-7 gap-y-3">
                        {popularAmenities.map((item, idx) => (
                            <div
                                key={`${item.displayLabel}-${idx}`}
                                className="inline-flex items-center gap-2 text-[13.5px] sm:text-[14px] text-[#202124] dark:text-slate-200"
                            >
                                <AmenityLucideIcon
                                    name={item.lucideIcon}
                                    className="w-[18px] h-[18px] text-[#202124] dark:text-slate-200 shrink-0"
                                    strokeWidth={1.7}
                                />
                                <span>{item.displayLabel}</span>
                                {item.badges?.map((badge, bIdx) => (
                                    <span
                                        key={bIdx}
                                        className="px-2 py-[1px] rounded-[4px] bg-[#e8eaed] dark:bg-slate-700/80 text-[#3c4043] dark:text-slate-200 text-[11.5px] font-normal leading-tight whitespace-nowrap"
                                    >
                                        {badge}
                                    </span>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* 3. Two-Column Categorized Amenities Grid */}
            <div className="px-5 sm:px-6 py-6 grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8 items-start">
                <div className="space-y-8 min-w-0">
                    {leftGroups.map(group => (
                        <CategoryColumnBlock
                            key={group.id}
                            group={group}
                            currentLang={currentLang}
                        />
                    ))}
                </div>
                {rightGroups.length > 0 && (
                    <div className="space-y-8 min-w-0">
                        {rightGroups.map(group => (
                            <CategoryColumnBlock
                                key={group.id}
                                group={group}
                                currentLang={currentLang}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default React.memo(PropertyAmenitiesSection);
