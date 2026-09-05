import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const KNOWN_TITLES = {
    'Keşfet': {
        en: 'Explore', tr: 'Keşfet', ar: 'استكشف', es: 'Explorar', ru: 'Исследовать',
        zh: '探索', ja: '探索', fa: 'کاوش', fr: 'Explorer', de: 'Erkunden', el: 'Εξερεύνηση', pt: 'Explorar'
    },
    'Kiralık Yerler': {
        en: 'Vacation Rentals', tr: 'Kiralık Yerler', ar: 'إيجارات العطلات', es: 'Alquileres Vacacionales', ru: 'Аренда жилья',
        zh: '度假短租', ja: 'バケーションレンタル', fa: 'اجاره تعطیلات', fr: 'Locations de vacances', de: 'Ferienunterkünfte', el: 'Ενοικιάσεις διακοπών', pt: 'Aluguéis de Temporada'
    },
    'Uçuş Fırsatları': {
        en: 'Flight Deals', tr: 'Uçuş Fırsatları', ar: 'عروض الطيران', es: 'Ofertas de Vuelos', ru: 'Спецпредложения на авиабилеты',
        zh: '航班特惠', ja: 'フライトセール', fa: 'پیشنهادات پرواز', fr: 'Offres de vols', de: 'Flugangebote', el: 'Προσφορές πτήσεων', pt: 'Ofertas de Voos'
    },
    'Takip Edilen Uçuş Fiyatları': {
        en: 'Tracked Flight Prices', tr: 'Takip Edilen Uçuş Fiyatları', ar: 'أسعار الرحلات المتتبعة', es: 'Precios de Vuelos Rastreados', ru: 'Отслеживаемые цены на рейсы',
        zh: '已追踪的航班价格', ja: 'トラッキング中のフライト価格', fa: 'قیمت‌های ردیابی شده پرواز', fr: 'Prix des vols suivis', de: 'Verfolgte Flugpreise', el: 'Παρακολουθούμενες τιμές πτήσεων', pt: 'Preços de Voos Monitorados'
    },
    'Finance': {
        en: 'Finance', tr: 'Finans', ar: 'المالية', es: 'Finanzas', ru: 'Финансы',
        zh: '财务', ja: '財務', fa: 'مالی', fr: 'Finance', de: 'Finanzen', el: 'Οικονομικά', pt: 'Finanças'
    },
    'Accounting': {
        en: 'Accounting', tr: 'Muhasebe', ar: 'المحاسبة', es: 'Contabilidad', ru: 'Бухгалтерия',
        zh: '会计', ja: '経理', fa: 'حسابداری', fr: 'Comptabilité', de: 'Buchhaltung', el: 'Λογιστική', pt: 'Contabilidade'
    },
    'Operations': {
        en: 'Operations', tr: 'Operasyonlar', ar: 'العمليات', es: 'Operaciones', ru: 'Операции',
        zh: '运营', ja: '運用', fa: 'عملیات', fr: 'Opérations', de: 'Betrieb', el: 'Λειτουργίες', pt: 'Operações'
    },
    'GSA Finance': {
        en: 'GSA Finance', tr: 'GSA Finans', ar: 'مالية GSA', es: 'Finanzas GSA', ru: 'Финансы GSA',
        zh: 'GSA 财务', ja: 'GSA 財務', fa: 'مالی GSA', fr: 'GSA Finance', de: 'GSA Finanzen', el: 'GSA Οικονομικά', pt: 'GSA Finanças'
    },
    'GSA Reports': {
        en: 'GSA Reports', tr: 'GSA Raporları', ar: 'تقارير GSA', es: 'Informes GSA', ru: 'Отчеты GSA',
        zh: 'GSA 报告', ja: 'GSA レポート', fa: 'گزارش‌های GSA', fr: 'Rapports GSA', de: 'GSA Berichte', el: 'Αναφορές GSA', pt: 'Relatórios GSA'
    }
};

const BADGE_MAP = {
    en: 'Coming Soon', tr: 'Yakında', ar: 'قريباً', es: 'Próximamente', ru: 'Скоро',
    zh: '即将推出', ja: '近日公開', fa: 'به زودی', fr: 'Bientôt disponible', de: 'Demnächst', el: 'Σύντομα', pt: 'Em breve'
};

const DESC_MAP = {
    en: 'This module is currently under development. It will be available soon with the new travel interface standards.',
    tr: 'Bu modül geliştirme aşamasındadır. En kısa sürede yeni Google seyahat arayüzü standartlarıyla kullanıma sunulacaktır.',
    ar: 'هذه الوحدة قيد التطوير حالياً. ستكون متاحة قريباً وفق أحدث معايير واجهة السفر.',
    es: 'Este módulo está actualmente en desarrollo. Estará disponible pronto con los nuevos estándares de interfaz de viaje.',
    ru: 'Этот модуль находится в разработке. Скоро он будет доступен в соответствии с новыми стандартами интерфейса путешествий.',
    zh: '该模块目前正在开发中。将很快按照全新旅行界面标准上线。',
    ja: 'このモジュールは現在開発中です。新しい旅行インターフェース標準に合わせて近日中に公開されます。',
    fa: 'این بخش در حال توسعه است و به زودی با استانداردهای جدید رابط کاربری سفر در دسترس قرار خواهد گرفت.',
    fr: 'Ce module est actuellement en cours de développement. Il sera bientôt disponible avec les nouveaux standards de voyage.',
    de: 'Dieses Modul befindet sich derzeit in der Entwicklung. Es wird in Kürze mit den neuen Reise-Interface-Standards verfügbar sein.',
    el: 'Αυτή η ενότητα βρίσκεται υπό ανάπτυξη. Θα είναι σύντομα διαθέσιμη με τα νέα πρότυπα διεπαφής ταξιδιών.',
    pt: 'Este módulo está atualmente em desenvolvimento. Estará disponível em breve com os novos padrões de interface de viagem.'
};

const BACK_MAP = {
    en: 'Back to Home', tr: 'Ana Sayfaya Dön', ar: 'العودة إلى الرئيسية', es: 'Volver al Inicio', ru: 'На главную',
    zh: '返回首页', ja: 'ホームに戻る', fa: 'بازگشت به خانه', fr: "Retour à l'accueil", de: 'Zurück zur Startseite', el: 'Επιστροφή στην Αρχική', pt: 'Voltar ao Início'
};

const UnderConstruction = ({ title, titleKey, icon }) => {
    const navigate = useNavigate();
    const { t, i18n } = useTranslation();
    const currentLang = (i18n.language || 'en').split('-')[0].toLowerCase();

    // Determine displayed title
    let displayTitle = title;
    if (titleKey) {
        displayTitle = t(titleKey) || title;
    } else if (title && KNOWN_TITLES[title]) {
        displayTitle = KNOWN_TITLES[title][currentLang] || KNOWN_TITLES[title].en || title;
    }

    const badgeText = BADGE_MAP[currentLang] || BADGE_MAP.en;
    const descText = DESC_MAP[currentLang] || DESC_MAP.en;
    const backText = BACK_MAP[currentLang] || BACK_MAP.en;

    return (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-[#f8f9fa] dark:bg-[#202124]">
            <div className="relative mb-6">
                {/* Icon Container - Google Clean Style */}
                <div className="size-20 rounded-full bg-[#e8f0fe] dark:bg-[#1a73e8]/20 border border-[#dadce0] dark:border-[#1a73e8]/30 flex items-center justify-center text-[#1a73e8] dark:text-[#8ab4f8] shadow-xs">
                    <span className="material-symbols-outlined text-4xl">{icon || 'construction'}</span>
                </div>

                {/* Badge */}
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-[#1a73e8] text-white text-[10px] font-semibold uppercase px-2.5 py-0.5 rounded-full shadow-xs tracking-wider whitespace-nowrap">
                    {badgeText}
                </div>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-[#202124] dark:text-white mb-2 tracking-tight">
                {displayTitle}
            </h1>
            <p className="text-sm text-[#5f6368] dark:text-slate-400 max-w-md mx-auto leading-relaxed mb-8">
                {descText}
            </p>

            <div className="flex items-center gap-3">
                <button 
                    onClick={() => navigate('/travel/hotels')}
                    className="px-6 py-2.5 bg-[#1a73e8] hover:bg-[#1765cc] text-white rounded-full font-medium text-sm shadow-xs hover:shadow-sm transition-all active:scale-95 cursor-pointer flex items-center gap-2"
                >
                    <span className="material-symbols-outlined text-[18px]">travel_explore</span>
                    <span>{backText}</span>
                </button>
            </div>
        </div>
    );
};

export default UnderConstruction;
