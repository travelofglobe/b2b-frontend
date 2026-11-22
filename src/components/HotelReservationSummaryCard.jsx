import React, { useState, useEffect } from 'react';
import RefundPolicyTooltip from './RefundPolicyTooltip';
import { getCurrencySymbol, useAuth } from '../context/AuthContext';

const SUMMARY_LOCALES = {
    en: {
        checkIn: "Check-in",
        checkOut: "Check-out",
        nightsStay: "Nights Stay",
        nightStay: "Night Stay",
        selectedRooms: "Selected Rooms",
        dailyRates: "Daily Rates",
        cancellationPolicy: "Cancellation Policy",
        flexible: "Flexible",
        cancellationPenalty: "Cancellation Penalty",
        freeCancel: "Free Cancel",
        standardCancellation: "Standard cancellation applies",
        adults: "Adults",
        adult: "Adult",
        children: "Children",
        child: "Child",
        roomOnly: "Room Only",
        bedAndBreakfast: "Bed & Breakfast",
        halfBoard: "Half Board",
        fullBoard: "Full Board",
        allInclusive: "All Inclusive",
        ultraAllInclusive: "Ultra All Inclusive",
        night: "Night",
        nights: "Nights",
        stay: "Stay",
        taxesAndFees: "Taxes & Fees",
        instantConfirmation: "Instant Confirmation Available",
        reservationSummary: "Reservation Summary",
        totalStayPrice: "Total Stay Price (Net)",
        pricesIncludeTaxesAndFees: "Taxes & Fees Included",
        taxesIncl: "Taxes Incl.",
        b2bRates: "B2B AGENCY RATES APPLIED",
        securePayment: "SECURE PAYMENT",
        protectedBooking: "TOG Protected Booking",
        in: "In",
        out: "Out",
        rateNotes: "Rate Notes",
        room: "Room",
        pleaseSelectARoom: "Please select a room to view reservation summary",
        freeCancellation: "Free Cancellation",
        nonRefundable: "Non-refundable",
        instantReservation: "Instant Reservation",
        checkingBestRates: "Checking Best Rates...",
        authorizePayment: "Authorize Payment",
        processing: "Processing...",
        remove: "Remove",
        priceAndRoomHoldingActive: "Price & Room Holding Active",
        changeRoom: "Change Room",
        selectedServices: "Selected Services",
        freeComplimentary: "Complimentary",
        totalAmount: "Total Amount",
        allTaxesIncluded: "All taxes included",
        googlePaySslTrust: "Google Pay & 256-Bit SSL / PCI-DSS Protected",
        bestPriceGuarantee: "Best Price Guarantee • No Hidden Fees",
        conciergeSupport: "24/7 Agency & Concierge Support",
        welcomeAmenity: "Welcome Amenity & Valet Service",
        roomStayPrice: "Room Stay Price",
        freeCancellationGuarantee: "Free Cancellation Guarantee"
        },
    tr: {
        checkIn: "Giriş",
        checkOut: "Çıkış",
        nightsStay: "Gece Konaklama",
        nightStay: "Gece Konaklama",
        selectedRooms: "Seçilen Odalar",
        dailyRates: "Günlük Fiyatlar",
        cancellationPolicy: "İptal Politikası",
        flexible: "Esnek",
        cancellationPenalty: "İptal Cezası",
        freeCancel: "Ücretsiz İptal",
        standardCancellation: "Standart iptal politikası geçerlidir",
        adults: "Yetişkin",
        adult: "Yetişkin",
        children: "Çocuk",
        child: "Çocuk",
        roomOnly: "Sadece Oda",
        bedAndBreakfast: "Oda Kahvaltı",
        halfBoard: "Yarım Pansiyon",
        fullBoard: "Tam Pansiyon",
        allInclusive: "Her Şey Dahil",
        ultraAllInclusive: "Ultra Her Şey Dahil",
        night: "Gece",
        nights: "Gece",
        stay: "Konaklama",
        taxesAndFees: "Vergiler ve Harçlar",
        instantConfirmation: "Anında Onaylanabilir",
        reservationSummary: "Rezervasyon Özeti",
        totalStayPrice: "Toplam Konaklama Tutarı (Net)",
        pricesIncludeTaxesAndFees: "Fiyatlara Vergiler ve Ücretler Dahildir",
        taxesIncl: "Vergiler Dahil",
        b2bRates: "B2B ACENTE FİYATLARI UYGULANDI",
        securePayment: "GÜVENLİ ÖDEME",
        protectedBooking: "TOG Korumalı Rezervasyon",
        in: "Giriş",
        out: "Çıkış",
        rateNotes: "Fiyat Notları",
        room: "Oda",
        pleaseSelectARoom: "Rezervasyon özetini görmek için lütfen bir oda seçin",
        freeCancellation: "Ücretsiz İptal",
        nonRefundable: "İade Edilemez",
        instantReservation: "Anında Rezervasyon",
        checkingBestRates: "En İyi Fiyatlar Kontrol Ediliyor...",
        authorizePayment: "Ödemeyi Onayla",
        processing: "İşleniyor...",
        remove: "Kaldır",
        priceAndRoomHoldingActive: "Fiyat & Oda Koruması Aktif",
        changeRoom: "Oda Değiştir",
        selectedServices: "Seçilen Hizmetler",
        freeComplimentary: "Ücretsiz İkram",
        totalAmount: "Toplam Tutar",
        allTaxesIncluded: "Tüm vergiler dahildir",
        googlePaySslTrust: "Google Pay & 256-Bit SSL / PCI-DSS Koruması",
        bestPriceGuarantee: "En İyi Fiyat Garantisi • Sürpriz Masraf Yok",
        conciergeSupport: "7/24 Acente & Konsiyerj Desteği",
        welcomeAmenity: "Odaya Karşılama İkramı & Vale Hizmeti",
        roomStayPrice: "Süit / Oda Ücreti",
        freeCancellationGuarantee: "Ücretsiz İptal Garantisi"
        },
    ar: {
        checkIn: "تسجيل الوصول",
        checkOut: "تسجيل المغادرة",
        nightsStay: "ليالي الإقامة",
        nightStay: "ليلة الإقامة",
        selectedRooms: "الغرف المختارة",
        dailyRates: "الأسعار اليومية",
        cancellationPolicy: "سياسة الإلغاء",
        flexible: "مرن",
        cancellationPenalty: "غرامة الإلغاء",
        freeCancel: "إلغاء مجاني",
        standardCancellation: "تنطبق شروط الإلغاء القياسية",
        adults: "بالغين",
        adult: "بالغ",
        children: "أطفال",
        child: "طفل",
        roomOnly: "غرفة فقط",
        bedAndBreakfast: "مبيت وإفطار",
        halfBoard: "نصف إقامة",
        fullBoard: "إقامة كاملة",
        allInclusive: "شامل كلياً",
        ultraAllInclusive: "شامل كلياً فائق",
        night: "ليلة",
        nights: "ليالي",
        stay: "إقامة",
        taxesAndFees: "الضرائب والرسوم",
        instantConfirmation: "تأكيد فوري متاح",
        reservationSummary: "ملخص الحجز",
        totalStayPrice: "إجمالي سعر الإقامة (صافي)",
        pricesIncludeTaxesAndFees: "الأسعار تشمل الضرائب والرسوم",
        taxesIncl: "شامل الضرائب",
        b2bRates: "تم تطبيق أسعار وكالات B2B",
        securePayment: "دفع آمن",
        protectedBooking: "حجز محمي بواسطة TOG",
        in: "دخول",
        out: "خروج",
        rateNotes: "ملاحظات الأسعار",
        room: "غرفة",
        pleaseSelectARoom: "يرجى تحديد غرفة لعرض ملخص الحجز",
        freeCancellation: "إلغاء مجاني",
        nonRefundable: "غير قابل للاسترداد",
        instantReservation: "حجز فوري",
        checkingBestRates: "جاري التحقق من أفضل الأسعار...",
        authorizePayment: "تفويض الدفع",
        processing: "جاري المعالجة...",
        remove: "إزالة",
        priceAndRoomHoldingActive: "ضمان السعر والغرفة نشط",
        changeRoom: "تغيير الغرفة",
        selectedServices: "الخدمات المختارة",
        freeComplimentary: "مجاناً",
        totalAmount: "المبلغ الإجمالي",
        allTaxesIncluded: "شامل جميع الضرائب",
        googlePaySslTrust: "حماية Google Pay وتشفير 256 بت SSL / PCI-DSS",
        bestPriceGuarantee: "ضمان أفضل سعر • بدون رسوم خفية",
        conciergeSupport: "دعم الوكالة والكونسيرج على مدار الساعة",
        welcomeAmenity: "ضيافة ترحيبية وخدمة صف السيارات",
        roomStayPrice: "سعر الإقامة في الغرفة",
        freeCancellationGuarantee: "ضمان الإلغاء المجاني"
        },
    es: {
        checkIn: "Entrada",
        checkOut: "Salida",
        nightsStay: "Noches de Estancia",
        nightStay: "Noche de Estancia",
        selectedRooms: "Habitaciones Seleccionadas",
        dailyRates: "Tarifas Diarias",
        cancellationPolicy: "Política de Cancelación",
        flexible: "Flexible",
        cancellationPenalty: "Penalización por Cancelación",
        freeCancel: "Cancelación Gratuita",
        standardCancellation: "Se aplica la política de cancelación estándar",
        adults: "Adultos",
        adult: "Adulto",
        children: "Niños",
        child: "Niño",
        roomOnly: "Solo Alojamiento",
        bedAndBreakfast: "Alojamiento y Desayuno",
        halfBoard: "Media Pensión",
        fullBoard: "Pensión Completa",
        allInclusive: "Todo Incluido",
        ultraAllInclusive: "Ultra Todo Incluido",
        night: "Noche",
        nights: "Noches",
        stay: "Estancia",
        taxesAndFees: "Impuestos y Tasas",
        instantConfirmation: "Confirmación Inmediata Disponible",
        reservationSummary: "Resumen de la Reserva",
        totalStayPrice: "Precio Total de la Estancia (Neto)",
        pricesIncludeTaxesAndFees: "Impuestos y tasas incluidos",
        taxesIncl: "Impuestos Incl.",
        b2bRates: "TARIFAS DE AGENCIA B2B APLICADAS",
        securePayment: "PAGO SEGURO",
        protectedBooking: "Reserva Protegida por TOG",
        in: "Entrada",
        out: "Salida",
        rateNotes: "Notas de Tarifas",
        room: "Habitación",
        pleaseSelectARoom: "Por favor seleccione una habitación para ver el resumen",
        freeCancellation: "Cancelación Gratuita",
        nonRefundable: "No Reembolsable",
        instantReservation: "Reserva Instantánea",
        checkingBestRates: "Comprobando mejores tarifas...",
        authorizePayment: "Autorizar Pago",
        processing: "Procesando...",
        remove: "Eliminar",
        priceAndRoomHoldingActive: "Bloqueo de precio y habitación activo",
        changeRoom: "Cambiar habitación",
        selectedServices: "Servicios seleccionados",
        freeComplimentary: "Cortesía",
        totalAmount: "Importe Total",
        allTaxesIncluded: "Todos los impuestos incluidos",
        googlePaySslTrust: "Protegido por Google Pay y SSL 256 bits / PCI-DSS",
        bestPriceGuarantee: "Mejor precio garantizado • Sin cargos ocultos",
        conciergeSupport: "Soporte de agencia y conserjería 24/7",
        welcomeAmenity: "Atención de bienvenida y servicio de aparcacoches",
        roomStayPrice: "Tarifa de habitación",
        freeCancellationGuarantee: "Garantía de cancelación gratuita"
        },
    ru: {
        checkIn: "Заезд",
        checkOut: "Выезд",
        nightsStay: "Ночей Проживания",
        nightStay: "Ночь Проживания",
        selectedRooms: "Выбранные Номера",
        dailyRates: "Дневные Тарифы",
        cancellationPolicy: "Правила Отмены",
        flexible: "Гибкий",
        cancellationPenalty: "Штраф за Отмену",
        freeCancel: "Бесплатная Отмена",
        standardCancellation: "Применяются стандартные правила отмены",
        adults: "Взрослые",
        adult: "Взрослый",
        children: "Дети",
        child: "Ребенок",
        roomOnly: "Без Питания",
        bedAndBreakfast: "Завтрак Включен",
        halfBoard: "Полупансион",
        fullBoard: "Полный Пансион",
        allInclusive: "Все Включено",
        ultraAllInclusive: "Ультра Все Включено",
        night: "Ночь",
        nights: "Ночей",
        stay: "Проживание",
        taxesAndFees: "Налоги и Сборы",
        instantConfirmation: "Доступно Мгновенное Подтверждение",
        reservationSummary: "Детали Бронирования",
        totalStayPrice: "Общая Стоимость Проживания (Нетто)",
        pricesIncludeTaxesAndFees: "Налоги и сборы включены",
        taxesIncl: "Включая Налоги",
        b2bRates: "ПРИМЕНЕНЫ ТАРИФЫ B2B АГЕНТСТВА",
        securePayment: "БЕЗОПАСНАЯ ОПЛАТА",
        protectedBooking: "Защищенное Бронирование TOG",
        in: "Заезд",
        out: "Выезд",
        rateNotes: "Примечания к Тарифу",
        room: "Номер",
        pleaseSelectARoom: "Пожалуйста, выберите номер для просмотра деталей",
        freeCancellation: "Бесплатная Отмена",
        nonRefundable: "Невозвратный",
        instantReservation: "Моментальное Бронирование",
        checkingBestRates: "Проверка лучших тарифов...",
        authorizePayment: "Подтвердить Оплату",
        processing: "Обработка...",
        remove: "Удалить",
        priceAndRoomHoldingActive: "Фиксация цены и номера активна",
        changeRoom: "Изменить номер",
        selectedServices: "Выбранные услуги",
        freeComplimentary: "Бесплатно",
        totalAmount: "Итоговая сумма",
        allTaxesIncluded: "Все налоги включены",
        googlePaySslTrust: "Защита Google Pay и 256-битный SSL / PCI-DSS",
        bestPriceGuarantee: "Гарантия лучшей цены • Без скрытых комиссий",
        conciergeSupport: "Круглосуточная поддержка агентства и консьержа",
        welcomeAmenity: "Приветственный комплимент и услуги парковщика",
        roomStayPrice: "Стоимость номера",
        freeCancellationGuarantee: "Гарантия бесплатной отмены"
        },
    zh: {
        checkIn: "入住",
        checkOut: "离店",
        nightsStay: "晚住宿",
        nightStay: "晚住宿",
        selectedRooms: "已选客房",
        dailyRates: "每日房价",
        cancellationPolicy: "取消政策",
        flexible: "灵活",
        cancellationPenalty: "取消费用",
        freeCancel: "免费取消",
        standardCancellation: "适用标准取消政策",
        adults: "成人",
        adult: "成人",
        children: "儿童",
        child: "儿童",
        roomOnly: "仅客房",
        bedAndBreakfast: "含早餐",
        halfBoard: "半膳",
        fullBoard: "全膳",
        allInclusive: "全包",
        ultraAllInclusive: "超豪华全包",
        night: "晚",
        nights: "晚",
        stay: "住宿",
        taxesAndFees: "税费",
        instantConfirmation: "可即时确认",
        reservationSummary: "预订摘要",
        totalStayPrice: "住宿总价 (净价)",
        pricesIncludeTaxesAndFees: "包含税费",
        taxesIncl: "含税",
        b2bRates: "已应用B2B同业价格",
        securePayment: "安全支付",
        protectedBooking: "TOG保障预订",
        in: "入",
        out: "离",
        rateNotes: "价格备注",
        room: "客房",
        pleaseSelectARoom: "请选择客房以查看预订摘要",
        freeCancellation: "免费取消",
        nonRefundable: "不可退款",
        instantReservation: "立即预订",
        checkingBestRates: "正在查询最佳价格...",
        authorizePayment: "授权支付",
        processing: "处理中...",
        remove: "移除",
        priceAndRoomHoldingActive: "价格与房型保留中",
        changeRoom: "更换房型",
        selectedServices: "已选服务",
        freeComplimentary: "免费赠送",
        totalAmount: "总计金额",
        allTaxesIncluded: "含所有税费",
        googlePaySslTrust: "Google Pay 与 256 位 SSL / PCI-DSS 安全防护",
        bestPriceGuarantee: "最优惠价格保证 · 无任何隐藏费用",
        conciergeSupport: "7x24小时代理商与礼宾服务",
        welcomeAmenity: "欢迎礼遇与代客泊车服务",
        roomStayPrice: "房费",
        freeCancellationGuarantee: "免费取消保障"
        },
    ja: {
        checkIn: "チェックイン",
        checkOut: "チェックアウト",
        nightsStay: "泊の滞在",
        nightStay: "泊の滞在",
        selectedRooms: "選択された部屋",
        dailyRates: "日替わり料金",
        cancellationPolicy: "キャンセルポリシー",
        flexible: "フレキシブル",
        cancellationPenalty: "キャンセル料",
        freeCancel: "キャンセル無料",
        standardCancellation: "標準のキャンセルポリシーが適用されます",
        adults: "大人",
        adult: "大人",
        children: "子供",
        child: "子供",
        roomOnly: "食事なし",
        bedAndBreakfast: "朝食付き",
        halfBoard: "1泊2食",
        fullBoard: "3食付き",
        allInclusive: "オールインクルーシブ",
        ultraAllInclusive: "ウルトラオールインクルーシブ",
        night: "泊",
        nights: "泊",
        stay: "滞在",
        taxesAndFees: "税金・手数料",
        instantConfirmation: "即時確認が可能",
        reservationSummary: "予約内容",
        totalStayPrice: "滞在合計料金（ネット）",
        pricesIncludeTaxesAndFees: "税金・手数料込み",
        taxesIncl: "税込み",
        b2bRates: "B2B代理店料金適用済み",
        securePayment: "安全な決済",
        protectedBooking: "TOG保護予約",
        in: "イン",
        out: "アウト",
        rateNotes: "料金メモ",
        room: "客室",
        pleaseSelectARoom: "予約概要を表示するには部屋を選択してください",
        freeCancellation: "キャンセル無料",
        nonRefundable: "返金不可",
        instantReservation: "即時予約",
        checkingBestRates: "最安値を照会中...",
        authorizePayment: "支払いを承認",
        processing: "処理中...",
        remove: "削除",
        priceAndRoomHoldingActive: "価格と客室を確保中",
        changeRoom: "客室を変更",
        selectedServices: "選択されたサービス",
        freeComplimentary: "無料サービス",
        totalAmount: "合計金額",
        allTaxesIncluded: "諸税込み",
        googlePaySslTrust: "Google Pay & 256ビットSSL / PCI-DSS保護",
        bestPriceGuarantee: "ベストプライス保証・隠れた手数料なし",
        conciergeSupport: "24時間365日の代理店＆コンシェルジュサポート",
        welcomeAmenity: "ウェルカムアメニティ＆バレーパーキング",
        roomStayPrice: "宿泊料金",
        freeCancellationGuarantee: "無料キャンセル保証"
        },
    fa: {
        checkIn: "ورود",
        checkOut: "خروج",
        nightsStay: "شب اقامت",
        nightStay: "شب اقامت",
        selectedRooms: "اتاق‌های انتخاب شده",
        dailyRates: "نرخ‌های روزانه",
        cancellationPolicy: "قوانین کنسلی",
        flexible: "قابل انعطاف",
        cancellationPenalty: "جریمه کنسلی",
        freeCancel: "کنسلی رایگان",
        standardCancellation: "قوانین استاندارد کنسلی اعمال می‌شود",
        adults: "بزرگسال",
        adult: "بزرگسال",
        children: "کودک",
        child: "کودک",
        roomOnly: "فقط اتاق",
        bedAndBreakfast: "تخت و صبحانه",
        halfBoard: "هافبرد (صبحانه و شام)",
        fullBoard: "فولبرد (سه وعده)",
        allInclusive: "آل اینکلوسیو",
        ultraAllInclusive: "اولترا آل اینکلوسیو",
        night: "شب",
        nights: "شب",
        stay: "اقامت",
        taxesAndFees: "مالیات و هزینه‌ها",
        instantConfirmation: "تایید فوری در دسترس است",
        reservationSummary: "خلاصه رزرو",
        totalStayPrice: "قیمت کل اقامت (خالص)",
        pricesIncludeTaxesAndFees: "قیمت‌ها شامل مالیات و عوارض است",
        taxesIncl: "شامل مالیات",
        b2bRates: "نرخ‌های آژانسی B2B اعمال شد",
        securePayment: "پرداخت امن",
        protectedBooking: "رزرو محافظت شده TOG",
        in: "ورود",
        out: "خروج",
        rateNotes: "یادداشت‌های نرخ",
        room: "اتاق",
        pleaseSelectARoom: "لطفاً برای مشاهده خلاصه رزرو، یک اتاق انتخاب کنید",
        freeCancellation: "کنسلی رایگان",
        nonRefundable: "غیر قابل استرداد",
        instantReservation: "رزرو فوری",
        checkingBestRates: "بررسی بهترین نرخ‌ها...",
        authorizePayment: "تایید پرداخت",
        processing: "در حال پردازش...",
        remove: "حذف",
        priceAndRoomHoldingActive: "تضمین قیمت و اتاق فعال است",
        changeRoom: "تغییر اتاق",
        selectedServices: "خدمات انتخاب شده",
        freeComplimentary: "رایگان",
        totalAmount: "مبلغ کل",
        allTaxesIncluded: "با احتساب کلیه مالیات‌ها",
        googlePaySslTrust: "محافظت شده با Google Pay و SSL ۲۵۶ بیتی / PCI-DSS",
        bestPriceGuarantee: "تضمین بهترین قیمت • بدون هزینه پنهان",
        conciergeSupport: "پشتیبانی ۲۴ ساعته آژانس و خدمات اختصاصی",
        welcomeAmenity: "پذیرایی خوش‌آمدگویی و خدمات پارک خودرو",
        roomStayPrice: "هزینه اقامت اتاق",
        freeCancellationGuarantee: "تضمین کنسلی رایگان"
        },
    fr: {
        checkIn: "Arrivée",
        checkOut: "Départ",
        nightsStay: "Nuits de Séjour",
        nightStay: "Nuit de Séjour",
        selectedRooms: "Chambres Sélectionnées",
        dailyRates: "Tarifs Journaliers",
        cancellationPolicy: "Politique d'Annulation",
        flexible: "Flexible",
        cancellationPenalty: "Pénalité d'Annulation",
        freeCancel: "Annulation Gratuite",
        standardCancellation: "La politique d'annulation standard s'applique",
        adults: "Adultes",
        adult: "Adulte",
        children: "Enfants",
        child: "Enfant",
        roomOnly: "Chambre Seule",
        bedAndBreakfast: "Chambre avec Petit-Déjeuner",
        halfBoard: "Demi-Pension",
        fullBoard: "Pension Complète",
        allInclusive: "Tout Compris",
        ultraAllInclusive: "Ultra Tout Compris",
        night: "Nuit",
        nights: "Nuits",
        stay: "Séjour",
        taxesAndFees: "Taxes et Frais",
        instantConfirmation: "Confirmation Immédiate Disponible",
        reservationSummary: "Résumé de la Réservation",
        totalStayPrice: "Prix Total du Séjour (Net)",
        pricesIncludeTaxesAndFees: "Taxes et frais inclus",
        taxesIncl: "Taxes Incl.",
        b2bRates: "TARIFS D'AGENCE B2B APPLIQUÉS",
        securePayment: "PAIEMENT SÉCURISÉ",
        protectedBooking: "Réservation Protégée par TOG",
        in: "Arrivée",
        out: "Départ",
        rateNotes: "Notes Tarifaires",
        room: "Chambre",
        pleaseSelectARoom: "Veuillez sélectionner une chambre pour voir le résumé",
        freeCancellation: "Annulation Gratuite",
        nonRefundable: "Non Remboursable",
        instantReservation: "Réservation Instantanée",
        checkingBestRates: "Vérification des meilleurs tarifs...",
        authorizePayment: "Autoriser le Paiement",
        processing: "Traitement en cours...",
        remove: "Supprimer",
        priceAndRoomHoldingActive: "Garantie de prix et chambre active",
        changeRoom: "Changer de chambre",
        selectedServices: "Services sélectionnés",
        freeComplimentary: "Offert",
        totalAmount: "Montant Total",
        allTaxesIncluded: "Toutes taxes comprises",
        googlePaySslTrust: "Protection Google Pay et SSL 256 bits / PCI-DSS",
        bestPriceGuarantee: "Meilleur prix garanti • Aucun frais caché",
        conciergeSupport: "Assistance conciergerie 24h/24 et 7j/7",
        welcomeAmenity: "Accueil en chambre & Service voiturier",
        roomStayPrice: "Tarif de la chambre",
        freeCancellationGuarantee: "Garantie d'annulation gratuite"
        },
    it: {
        checkIn: "Check-in",
        checkOut: "Check-out",
        nightsStay: "Notti di Soggiorno",
        nightStay: "Notte di Soggiorno",
        selectedRooms: "Camere Selezionate",
        dailyRates: "Tariffe Giornaliere",
        cancellationPolicy: "Politica di Cancellazione",
        flexible: "Flessibile",
        cancellationPenalty: "Penale di Cancellazione",
        freeCancel: "Cancellazione Gratuita",
        standardCancellation: "Si applica la politica di cancellazione standard",
        adults: "Adulti",
        adult: "Adulto",
        children: "Bambini",
        child: "Bambino",
        roomOnly: "Solo Pernottamento",
        bedAndBreakfast: "Pernottamento e Prima Colazione",
        halfBoard: "Mezza Pensione",
        fullBoard: "Pensione Completa",
        allInclusive: "Tutto Incluso",
        ultraAllInclusive: "Ultra Tutto Incluso",
        night: "Notte",
        nights: "Notti",
        stay: "Soggiorno",
        taxesAndFees: "Tasse e Commissioni",
        instantConfirmation: "Conferma Immediata Disponibile",
        reservationSummary: "Riepilogo Prenotazione",
        totalStayPrice: "Prezzo Totale Soggiorno (Netto)",
        pricesIncludeTaxesAndFees: "Tasse e commissioni incluse",
        taxesIncl: "Tasse Incl.",
        b2bRates: "TARIFFE AGENZIA B2B APPLICATE",
        securePayment: "PAGAMENTO SICURO",
        protectedBooking: "Prenotazione Protetta TOG",
        in: "In",
        out: "Out",
        rateNotes: "Note Tariffarie",
        room: "Camera",
        pleaseSelectARoom: "Seleziona una camera per visualizzare il riepilogo",
        freeCancellation: "Cancellazione Gratuita",
        nonRefundable: "Non Rimborsabile",
        instantReservation: "Prenota Ora",
        checkingBestRates: "Verifica delle migliori tariffe...",
        authorizePayment: "Autorizza Pagamento",
        processing: "Elaborazione in corso...",
        remove: "Rimuovi",
        priceAndRoomHoldingActive: "Blocco prezzo e camera attivo",
        changeRoom: "Cambia camera",
        selectedServices: "Servizi selezionati",
        freeComplimentary: "Gratuito",
        totalAmount: "Importo Totale",
        allTaxesIncluded: "Tutte le tasse incluse",
        googlePaySslTrust: "Protetto da Google Pay e SSL a 256 bit / PCI-DSS",
        bestPriceGuarantee: "Miglior prezzo garantito • Nessun costo nascosto",
        conciergeSupport: "Supporto agenzia e concierge 24/7",
        welcomeAmenity: "Omaggio di benvenuto e servizio parcheggio",
        roomStayPrice: "Tariffa camera",
        freeCancellationGuarantee: "Garanzia di cancellazione gratuita"
        },
    el: {
        checkIn: "Check-in",
        checkOut: "Check-out",
        nightsStay: "Διανυκτερεύσεις",
        nightStay: "Διανυκτέρευση",
        selectedRooms: "Επιλεγμένα Δωμάτια",
        dailyRates: "Ημερήσιες Τιμές",
        cancellationPolicy: "Πολιτική Ακύρωσης",
        flexible: "Ευέλικτο",
        cancellationPenalty: "Πέναλτι Ακύρωσης",
        freeCancel: "Δωρεάν Ακύρωση",
        standardCancellation: "Ισχύει η τυπική πολιτική ακύρωσης",
        adults: "Ενήλικες",
        adult: "Ενήλικας",
        children: "Παιδιά",
        child: "Παιδί",
        roomOnly: "Μόνο Δωμάτιο",
        bedAndBreakfast: "Πρωινό",
        halfBoard: "Ημιδιατροφή",
        fullBoard: "Πλήρης Διατροφή",
        allInclusive: "All Inclusive",
        ultraAllInclusive: "Ultra All Inclusive",
        night: "Νύχτα",
        nights: "Νύχτες",
        stay: "Διαμονή",
        taxesAndFees: "Φόροι και Τέλη",
        instantConfirmation: "Διαθέσιμη Άμεση Επιβεβαίωση",
        reservationSummary: "Σύνοψη Κράτησης",
        totalStayPrice: "Συνολική Τιμή Διαμονής (Καθαρή)",
        pricesIncludeTaxesAndFees: "Συμπεριλαμβάνονται φόροι και τέλη",
        taxesIncl: "Συμπ. Φόρων",
        b2bRates: "ΕΦΑΡΜΟΣΤΗΚΑΝ ΤΙΜΕΣ ΠΡΑΚΤΟΡΕΙΟΥ B2B",
        securePayment: "ΑΣΦΑΛΗΣ ΠΛΗΡΩΜΗ",
        protectedBooking: "Προστατευμένη Κράτηση TOG",
        in: "Check-in",
        out: "Check-out",
        rateNotes: "Σημειώσεις Τιμών",
        room: "Δωμάτιο",
        pleaseSelectARoom: "Παρακαλώ επιλέξτε δωμάτιο για σύνοψη κράτησης",
        freeCancellation: "Δωρεάν Ακύρωση",
        nonRefundable: "Μη Επιστρέψιμο",
        instantReservation: "Άμεση Κράτηση",
        checkingBestRates: "Έλεγχος καλύτερων τιμών...",
        authorizePayment: "Έγκριση Πληρωμής",
        processing: "Επεξεργασία...",
        remove: "Αφαίρεση",
        priceAndRoomHoldingActive: "Ενεργή δέσμευση τιμής & δωματίου",
        changeRoom: "Αλλαγή δωματίου",
        selectedServices: "Επιλεγμένες υπηρεσίες",
        freeComplimentary: "Δωρεάν",
        totalAmount: "Συνολικό Ποσό",
        allTaxesIncluded: "Συμπεριλαμβάνονται όλοι οι φόροι",
        googlePaySslTrust: "Προστασία Google Pay & 256-Bit SSL / PCI-DSS",
        bestPriceGuarantee: "Εγγύηση καλύτερης τιμής • Χωρίς κρυφές χρεώσεις",
        conciergeSupport: "24/7 Υποστήριξη πρακτορείου & θυρωρού",
        welcomeAmenity: "Κέρασμα καλωσορίσματος & Υπηρεσία παρκαδόρου",
        roomStayPrice: "Τιμή διαμονής δωματίου",
        freeCancellationGuarantee: "Εγγύηση δωρεάν ακύρωσης"
        },
    pt: {
        checkIn: "Entrada",
        checkOut: "Saída",
        nightsStay: "Noites de Estadia",
        nightStay: "Noite de Estadia",
        selectedRooms: "Quartos Selecionados",
        dailyRates: "Tarifas Diárias",
        cancellationPolicy: "Política de Cancelamento",
        flexible: "Flexível",
        cancellationPenalty: "Penalidade de Cancelamento",
        freeCancel: "Cancelamento Gratuito",
        standardCancellation: "Aplica-se a política padrão de cancelamento",
        adults: "Adultos",
        adult: "Adulto",
        children: "Crianças",
        child: "Criança",
        roomOnly: "Apenas Quarto",
        bedAndBreakfast: "Alojamento e Pequeno-Almoço",
        halfBoard: "Meia Pensão",
        fullBoard: "Pensão Completa",
        allInclusive: "Tudo Incluído",
        ultraAllInclusive: "Ultra Tudo Incluído",
        night: "Noite",
        nights: "Noites",
        stay: "Estadia",
        taxesAndFees: "Impostos e Taxas",
        instantConfirmation: "Confirmação Imediata Disponível",
        reservationSummary: "Resumo da Reserva",
        totalStayPrice: "Preço Total da Estadia (Líquido)",
        pricesIncludeTaxesAndFees: "Impostos e taxas incluídos",
        taxesIncl: "Impostos Incl.",
        b2bRates: "TARIFAS DE AGÊNCIA B2B APLICADAS",
        securePayment: "PAGAMENTO SEGURO",
        protectedBooking: "Reserva Protegida TOG",
        in: "Entrada",
        out: "Saída",
        rateNotes: "Notas de Tarifa",
        room: "Quarto",
        pleaseSelectARoom: "Por favor selecione um quarto para ver o resumo",
        freeCancellation: "Cancelamento Gratuito",
        nonRefundable: "Não Reembolsável",
        instantReservation: "Reserva Instantânea",
        checkingBestRates: "A verificar melhores tarifas...",
        authorizePayment: "Autorizar Pagamento",
        processing: "A processar...",
        remove: "Remover",
        priceAndRoomHoldingActive: "Garantia de preço e quarto ativa",
        changeRoom: "Alterar quarto",
        selectedServices: "Serviços selecionados",
        freeComplimentary: "Cortesia",
        totalAmount: "Valor Total",
        allTaxesIncluded: "Todos os impostos inclusos",
        googlePaySslTrust: "Protegido por Google Pay e SSL de 256 bits / PCI-DSS",
        bestPriceGuarantee: "Melhor Preço Garantido • Sem taxas ocultas",
        conciergeSupport: "Suporte 24/7 de agência e concierge",
        welcomeAmenity: "Cortesia de boas-vindas e manobrista",
        roomStayPrice: "Diária do quarto",
        freeCancellationGuarantee: "Garantia de cancelamento grátis"
        }
};

const decodeHTMLEntities = (text) => {
    if (!text || typeof text !== 'string') return text || '';
    const textarea = document.createElement('textarea');
    textarea.innerHTML = text;
    return textarea.value;
};

const getBoardLabel = (rawBoard, t, lang) => {
    if (!rawBoard) return t('roomOnly', lang);
    const upper = String(rawBoard).trim().toUpperCase();
    if (upper === 'RO' || upper === 'ROOM ONLY' || upper === 'ROOMONLY') return t('roomOnly', lang);
    if (upper === 'BB' || upper === 'BED AND BREAKFAST' || upper === 'BED & BREAKFAST') return t('bedAndBreakfast', lang);
    if (upper === 'HB' || upper === 'HALF BOARD') return t('halfBoard', lang);
    if (upper === 'FB' || upper === 'FULL BOARD') return t('fullBoard', lang);
    if (upper === 'AI' || upper === 'ALL INCLUSIVE') return t('allInclusive', lang);
    if (upper === 'UAI' || upper === 'ULTRA ALL INCLUSIVE') return t('ultraAllInclusive', lang);
    return rawBoard;
};

/**
 * Universal Hotel Reservation Summary Card Component
 * Standardized with Google Travel design system & rounded-[4px] corners.
 */
const HotelReservationSummaryCard = ({
    hotel = {},
    formattedDates = {},
    dates = {},
    nights = 1,
    guests = null,
    totalAdults = null,
    totalChildren = null,
    nationality = null,
    roomState = null,
    totalRoomsRequested = null,
    selectedRooms = [],
    checkRatesData = null,
    totalAmount = null,
    currency = null,
    isLoadingRates = false,
    onRemoveRoom = null,
    actionButton = null,
    actionConfig = null,
    showSecurityBadge = true,
    lang = null,
    expireAt = null,
    onChangeRoom = null
}) => {
    const { currencySymbolMap: authCurrencyMap } = useAuth ? useAuth() : { currencySymbolMap: {} };
    const currentLang = (lang || localStorage.getItem('language') || 'tr').split('-')[0].toLowerCase();

    const t = (key) => {
        return SUMMARY_LOCALES[currentLang]?.[key] || SUMMARY_LOCALES['en']?.[key] || key;
    };

    // Holding Countdown Timer (Synchronized with expireAt)
    const [summaryTimeLeft, setSummaryTimeLeft] = useState(() => {
        if (!expireAt) return null;
        return Math.max(0, expireAt - Date.now());
    });

    useEffect(() => {
        if (!expireAt) {
            setSummaryTimeLeft(null);
            return;
        }

        const updateTimer = () => {
            const diff = Math.max(0, expireAt - Date.now());
            setSummaryTimeLeft(diff);
            if (diff <= 0) {
                window.location.href = '/';
            }
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
    }, [expireAt]);

    const timerMin = summaryTimeLeft ? Math.floor(summaryTimeLeft / 1000 / 60) : 0;
    const timerSec = summaryTimeLeft ? Math.floor((summaryTimeLeft / 1000) % 60) : 0;
    const formattedTimerMinutes = timerMin.toString().padStart(2, '0');
    const formattedTimerSeconds = timerSec.toString().padStart(2, '0');

    // Dates formatting
    const startDate = formattedDates?.start || dates?.start || hotel?.checkInDate || '';
    const endDate = formattedDates?.end || dates?.end || hotel?.checkOutDate || '';

    const formatCheckDate = (dateVal) => {
        if (!dateVal) return { dateStr: '', dayStr: '' };
        try {
            const d = new Date(dateVal);
            if (isNaN(d.getTime())) return { dateStr: String(dateVal), dayStr: '' };
            const dateStr = d.toLocaleDateString(currentLang, { day: 'numeric', month: 'short', year: 'numeric' });
            const dayStr = d.toLocaleDateString(currentLang, { weekday: 'long' });
            return { dateStr, dayStr };
        } catch {
            return { dateStr: String(dateVal), dayStr: '' };
        }
    };

    const checkInFormatted = formatCheckDate(checkRatesData?.checkIn || hotel?.checkInDate || startDate);
    const checkOutFormatted = formatCheckDate(checkRatesData?.checkOut || hotel?.checkOutDate || endDate);

    // Hotel details extraction
    const hotelName = decodeHTMLEntities(
        hotel?.names?.[currentLang] || hotel?.names?.tr || hotel?.names?.en || hotel?.name || 'Hotel'
    );
    const hotelStars = Number(hotel?.starRating || (hotel?.propertyRating ? parseFloat(hotel?.propertyRating) : (hotel?.stars || 5)));
    const hotelImage = hotel?.images?.[0]?.url || hotel?.images?.[0] || hotel?.image || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80';
    const hotelAddress = typeof hotel?.address === 'object'
        ? (hotel?.address?.addressLine || hotel?.address?.street || `${hotel?.address?.city || ''}, ${hotel?.address?.country || ''}`)
        : (hotel?.address || hotel?.location || '');

    // Currency determination
    const displayCurrency = currency 
        || checkRatesData?.currency 
        || selectedRooms?.[0]?.hubRateModel?.price?.currency 
        || selectedRooms?.[0]?.currency 
        || 'EUR';

    // Total Amount Calculation
    const grandTotal = totalAmount !== null && totalAmount !== undefined
        ? Number(totalAmount)
        : (checkRatesData?.totalPrice || checkRatesData?.rooms?.reduce((sum, r) => sum + (r.rates?.[0]?.price?.calculatedAmount || r.rates?.[0]?.price?.totalPaymentAmount || 0), 0)
            || selectedRooms.reduce((sum, r) => sum + (r.hubRateModel?.price?.calculatedAmount || r.hubRateModel?.price?.netTotal || r.hubRateModel?.price?.grossTotal || r.rate || 0), 0));

    // Guests summary computation
    const getGuestsSummaryText = () => {
        if (typeof guests === 'string') return guests;
        if (guests && typeof guests === 'object') {
            const a = guests.adults || guests.adultCount || 1;
            const c = guests.children || guests.childCount || 0;
            const nat = guests.nationality ? ` (${guests.nationality})` : '';
            return `${a} ${a > 1 ? t('adults') : t('adult')}${c > 0 ? `, ${c} ${c > 1 ? t('children') : t('child')}` : ''}${nat}`;
        }
        if (totalAdults !== null) {
            const a = totalAdults || 1;
            const c = totalChildren || 0;
            const nat = nationality ? ` (${nationality})` : '';
            return `${a} ${a > 1 ? t('adults') : t('adult')}${c > 0 ? `, ${c} ${c > 1 ? t('children') : t('child')}` : ''}${nat}`;
        }
        if (checkRatesData?.occupancy || checkRatesData?.rooms?.[0]?.rates?.[0]?.occupancy) {
            const occ = checkRatesData.occupancy || checkRatesData.rooms[0].rates[0].occupancy;
            const a = occ.adults || 1;
            const c = occ.child || occ.children || 0;
            return `${a} ${a > 1 ? t('adults') : t('adult')}${c > 0 ? `, ${c} ${c > 1 ? t('children') : t('child')}` : ''}`;
        }
        if (Array.isArray(roomState) && roomState.length > 0) {
            const a = roomState.reduce((sum, r) => sum + (r.adults || 1), 0);
            const c = roomState.reduce((sum, r) => sum + (r.children || 0), 0);
            return `${a} ${a > 1 ? t('adults') : t('adult')}${c > 0 ? `, ${c} ${c > 1 ? t('children') : t('child')}` : ''}`;
        }
        return `2 ${t('adults')}`;
    };

    // Target room count badge
    const totalRoomsCount = totalRoomsRequested 
        || (Array.isArray(roomState) ? roomState.length : null) 
        || (checkRatesData?.rooms ? checkRatesData.rooms.length : null) 
        || selectedRooms.length 
        || 1;

    // Primary room information for headline display
    const primaryRoom = selectedRooms?.[0];
    const primaryRoomName = decodeHTMLEntities(primaryRoom?.name || 'Standard Room');
    const primaryBoardLabel = getBoardLabel(
        checkRatesData?.rooms?.[0]?.rates?.[0]?.boardName || primaryRoom?.hubRateModel?.boardCode || primaryRoom?.boardName || primaryRoom?.boardCode || 'Room Only',
        t,
        currentLang
    );
    const primaryRefundable = checkRatesData?.rooms?.[0]?.rates?.[0]?.refundable !== undefined
        ? checkRatesData?.rooms?.[0]?.rates?.[0]?.refundable
        : (primaryRoom?.hubRateModel?.refundable ?? (primaryRoom?.isRefundable ?? true));

    // Rate notes
    const rateNotesList = checkRatesData?.notes || hotel?.rateNotes || [];

    return (
        <div className="font-sans antialiased">
            <div className="rounded-3xl shadow-sm border border-slate-200/90 dark:border-slate-800 overflow-hidden bg-white dark:bg-[#202124]">
                {/* 1. Top Price & Room Holding Timer Banner (Mockup Style Header) */}
                {summaryTimeLeft !== null && summaryTimeLeft > 0 && (
                    <div className="bg-rose-50/75 dark:bg-rose-950/25 px-4 py-2 border-b border-rose-100/80 dark:border-rose-900/40 flex items-center justify-between transition-all">
                        <div className="flex items-center gap-1.5 text-[#991b1b] dark:text-rose-200">
                            <span className="material-symbols-outlined text-[16px] text-[#b91c1c] dark:text-rose-300">timer</span>
                            <span className="text-xs font-medium text-[#991b1b] dark:text-rose-200 tracking-tight">{t('priceAndRoomHoldingActive')}</span>
                        </div>
                        <div className="bg-white dark:bg-slate-900 px-2.5 py-0.5 rounded-full border border-rose-200/70 dark:border-rose-800/60 shadow-2xs">
                            <span className="tabular-nums font-mono font-bold text-xs tracking-wide text-[#991b1b] dark:text-rose-200">
                                {formattedTimerMinutes}:{formattedTimerSeconds}
                            </span>
                        </div>
                    </div>
                )}

                {/* 2. Hotel Image Card with Padding and Rounded Corners */}
                <div className="p-3.5 sm:p-4">
                    <div className="relative w-full h-52 sm:h-56 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 group shadow-xs">
                        <img
                            src={hotelImage}
                            alt={hotelName}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 rounded-2xl"
                            loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent rounded-2xl" />

                        {/* Top Overlay Badge: Board Type */}
                        {primaryBoardLabel && (
                            <div className="absolute top-3 left-3 flex items-center gap-1.5">
                                <span className="px-3.5 py-1.5 rounded-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-md text-[#202124] dark:text-white text-xs font-semibold shadow-xs">
                                    {primaryBoardLabel}
                                </span>
                            </div>
                        )}

                        {/* Bottom Overlay: Stars, Hotel Name & Location */}
                        <div className="absolute bottom-3.5 left-3.5 right-3.5">
                            <div className="flex items-center gap-1 mb-1.5 text-amber-400">
                                {[...Array(Math.min(5, Math.max(1, hotelStars)))].map((_, i) => (
                                    <span key={i} className="material-symbols-outlined text-[14px] fill-1 drop-shadow-xs">star</span>
                                ))}
                                <span className="text-white text-xs font-bold drop-shadow-xs ml-0.5">{hotelStars}.0</span>
                                {hotel?.isRecommended && (
                                    <span className="ml-1.5 bg-[#0b57d0] text-white text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded shadow-xs flex items-center gap-0.5">
                                        <span className="material-symbols-outlined text-[10px] fill-1">thumb_up</span>
                                        REC
                                    </span>
                                )}
                            </div>
                            <h3 className="font-bold text-white text-lg leading-tight line-clamp-2 drop-shadow-md" title={hotelName}>
                                {hotelName}
                            </h3>
                            {Boolean(hotelAddress || hotel?.location) && (
                                <p className="text-white/90 text-xs font-normal flex items-center gap-1 mt-1.5 drop-shadow-xs truncate">
                                    <span className="material-symbols-outlined text-[13px] text-white/90 shrink-0">location_on</span>
                                    <span className="truncate">{hotelAddress || hotel?.location}</span>
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                <div className="px-4 pb-4 sm:px-5 sm:pb-5 space-y-4">
                    {/* 3. Check-in & Check-out Times */}
                    <div className="flex items-center justify-between text-xs px-1 text-slate-600 dark:text-slate-300" lang={currentLang}>
                        <div className="flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-[15px] text-[#0b57d0]">login</span>
                            <span className="text-xs font-normal text-slate-500 dark:text-slate-400">
                                {t('in')}: <span className="font-semibold text-slate-800 dark:text-slate-200">{hotel?.checkIn || '15:00'}</span>
                            </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-[15px] text-[#0b57d0]">logout</span>
                            <span className="text-xs font-normal text-slate-500 dark:text-slate-400">
                                {t('out')}: <span className="font-semibold text-slate-800 dark:text-slate-200">{hotel?.checkOut || '11:00'}</span>
                            </span>
                        </div>
                    </div>

                    {/* 4. Dates & Room Stay Box */}
                    <div className="rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/80 p-4 space-y-3">
                        <div className="grid grid-cols-2 divide-x divide-slate-200 dark:divide-slate-700/80">
                            <div className="pr-3">
                                <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 block uppercase tracking-wider">
                                    {t('checkIn')}
                                </span>
                                <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 block mt-0.5">
                                    {checkInFormatted.dateStr || startDate}
                                </span>
                                <span className="text-xs text-slate-500 dark:text-slate-400 block mt-0.5">
                                    {checkInFormatted.dayStr ? `${checkInFormatted.dayStr} • ` : ''}{hotel?.checkIn || '15:00'}
                                </span>
                            </div>
                            <div className="pl-3">
                                <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 block uppercase tracking-wider">
                                    {t('checkOut')}
                                </span>
                                <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 block mt-0.5">
                                    {checkOutFormatted.dateStr || endDate}
                                </span>
                                <span className="text-xs text-slate-500 dark:text-slate-400 block mt-0.5">
                                    {checkOutFormatted.dayStr ? `${checkOutFormatted.dayStr} • ` : ''}{hotel?.checkOut || '11:00'}
                                </span>
                            </div>
                        </div>
                        <div className="pt-2.5 border-t border-slate-200/70 dark:border-slate-700/70 flex items-center justify-between text-xs">
                            <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-medium">
                                <span className="material-symbols-outlined text-[16px] text-[#0b57d0]">hotel</span>
                                <span>{nights} {nights > 1 ? t('nights') : t('night')} • {getGuestsSummaryText()}</span>
                            </div>
                            {onChangeRoom && (
                                <button
                                    type="button"
                                    onClick={onChangeRoom}
                                    className="text-xs font-semibold text-[#0b57d0] dark:text-blue-400 hover:underline cursor-pointer"
                                >
                                    {t('changeRoom')}
                                </button>
                            )}
                        </div>
                    </div>

                    {/* 5. Guaranteed Benefits Checklist */}
                    <div className="space-y-2 py-1">
                        {primaryBoardLabel && (
                            <div className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300">
                                <span className="size-4.5 rounded-full bg-blue-100 text-[#0b57d0] dark:bg-blue-900/50 dark:text-blue-300 flex items-center justify-center shrink-0">
                                    <span className="material-symbols-outlined text-[13px] font-bold">check</span>
                                </span>
                                <span>{primaryBoardLabel}</span>
                            </div>
                        )}
                        <div className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300">
                            <span className={`size-4.5 rounded-full flex items-center justify-center shrink-0 ${
                                primaryRefundable ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                            }`}>
                                <span className="material-symbols-outlined text-[13px] font-bold">check</span>
                            </span>
                            <span>{primaryRefundable ? t('freeCancellationGuarantee') : t('nonRefundable')}</span>
                        </div>
                    </div>

                    {/* 6. Selected Rooms Breakdown (All existing detailed features preserved) */}
                    <div className="space-y-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                        <div className="flex items-center justify-between">
                            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider" lang={currentLang}>
                                {t('selectedRooms')}
                            </p>
                            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-[#e8f0fe] text-[#0b57d0] dark:bg-blue-900/30 dark:text-blue-300">
                                {selectedRooms.length} / {totalRoomsCount} {t('room')}
                            </span>
                        </div>
                        {selectedRooms && selectedRooms.length > 0 ? (
                            selectedRooms.map((room, idx) => {
                                const hubRate = room.hubRateModel || {};
                                const checkRatesRoom = checkRatesData?.rooms?.[idx];
                                const checkRatesRate = checkRatesRoom?.rates?.[0];

                                const rawBoard = checkRatesRate?.boardName || hubRate.boardCode || room.boardName || room.boardCode || 'Room Only';
                                const boardLabel = getBoardLabel(rawBoard, t, currentLang);

                                const refundable = checkRatesRate?.refundable !== undefined 
                                    ? checkRatesRate.refundable 
                                    : (hubRate.refundable ?? (room.isRefundable ?? true));

                                const policies = checkRatesRate?.price?.cancellationPolicies 
                                    || hubRate.price?.cancellationPolicies 
                                    || room.cancellationPolicies 
                                    || [];

                                const roomPrice = Number(
                                    checkRatesRate?.price?.calculatedAmount 
                                    || checkRatesRate?.price?.totalPaymentAmount 
                                    || hubRate.price?.calculatedAmount 
                                    || hubRate.price?.netTotal 
                                    || hubRate.price?.grossTotal 
                                    || room.rate 
                                    || 0
                                ) || 0;

                                const roomCurr = checkRatesRate?.price?.currency 
                                    || hubRate.price?.currency 
                                    || room.currency 
                                    || displayCurrency;

                                const roomName = decodeHTMLEntities(room.name || `Room ${idx + 1}`);

                                return (
                                    <div key={idx} className="relative p-3 sm:p-3.5 rounded-2xl bg-[#f8f9fa] dark:bg-[#303134]/70 border border-[#dadce0] dark:border-slate-700 shadow-2xs">
                                        {onRemoveRoom && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onRemoveRoom(idx);
                                                }}
                                                className="absolute top-2.5 right-2.5 size-6 text-[#5f6368] hover:text-[#d93025] flex items-center justify-center rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors cursor-pointer"
                                                title={t('remove')}
                                            >
                                                <span className="material-symbols-outlined text-[16px]">close</span>
                                            </button>
                                        )}
                                        <div className={`${onRemoveRoom ? 'pr-6' : 'pr-2'} mb-1.5`}>
                                            <div className="flex items-start gap-1.5">
                                                <div className="size-5 rounded-md bg-[#e8f0fe] text-[#0b57d0] text-xs font-semibold flex items-center justify-center shrink-0 mt-0.5">
                                                    {idx + 1}
                                                </div>
                                                <span className="font-semibold text-slate-900 dark:text-white text-sm line-clamp-2">
                                                    {roomName}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-[#dadce0] dark:border-slate-700">
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                <span className="bg-white dark:bg-slate-800 border border-[#dadce0] dark:border-slate-600 text-slate-700 dark:text-slate-300 text-xs px-2.5 py-0.5 rounded-full font-medium">
                                                    {boardLabel}
                                                </span>
                                                {refundable !== undefined && (
                                                    <RefundPolicyTooltip
                                                        isRefundable={refundable}
                                                        textOverride={refundable ? t('freeCancel') : t('nonRefundable')}
                                                        className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${refundable ? 'bg-[#e6f4ea] text-[#137333] border border-[#ceead6]' : 'bg-[#f1f3f4] text-[#5f6368] border border-[#dadce0]'}`}
                                                    />
                                                )}
                                            </div>
                                            <div className="text-right">
                                                <span className="text-sm font-semibold text-slate-900 dark:text-white tabular-nums">
                                                    {getCurrencySymbol(roomCurr, authCurrencyMap)} {roomPrice.toFixed(2)}
                                                </span>
                                                <p className="text-xs text-slate-500">
                                                    {nights} {nights > 1 ? t('nights') : t('night')}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Cancellation Policy Details */}
                                        <div className="mt-2 pt-1.5 border-t border-dashed border-[#dadce0] dark:border-slate-700">
                                            {policies && policies.length > 0 ? (
                                                <div className="space-y-1">
                                                    <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-0.5" lang={currentLang}>
                                                        {t('cancellationPolicy')}
                                                    </p>
                                                    {policies.map((policy, pIdx) => {
                                                        const rawAmt = policy?.calculatedAmount ?? policy?.amount;
                                                        const policyAmount = rawAmt != null && !isNaN(Number(rawAmt)) ? Number(rawAmt) : null;
                                                        const isFree = policyAmount === 0;

                                                        return (
                                                            <div key={pIdx} className="flex justify-between items-center text-xs">
                                                                <span className="text-slate-600 dark:text-slate-400">
                                                                    {policy?.fromDate 
                                                                        ? (policy.fromDate.includes('[') 
                                                                            ? new Date(policy.fromDate.split('[')[0]).toLocaleDateString(currentLang, { day: '2-digit', month: 'short', year: 'numeric' })
                                                                            : new Date(policy.fromDate).toLocaleDateString(currentLang, { day: '2-digit', month: 'short', year: 'numeric' }))
                                                                        : (isFree ? t('flexible') : t('cancellationPenalty'))
                                                                    }
                                                                </span>
                                                                <span className={`font-medium px-2 py-0.5 rounded-full text-xs ${
                                                                    isFree ? 'bg-[#e6f4ea] text-[#137333]' : 'bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300'
                                                                }`}>
                                                                    {isFree 
                                                                        ? t('freeCancel') 
                                                                        : (policyAmount != null 
                                                                            ? `${getCurrencySymbol(policy?.currency || roomCurr, authCurrencyMap)} ${policyAmount.toFixed(2)}` 
                                                                            : t('cancellationPenalty'))}
                                                                </span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            ) : (
                                                <span className="text-xs text-slate-500 flex items-center gap-1" lang={currentLang}>
                                                    <span className="material-symbols-outlined text-[13px]">info</span>
                                                    {t('standardCancellation')}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="p-5 rounded-2xl bg-[#f8f9fa] dark:bg-[#303134] border border-dashed border-[#dadce0] dark:border-slate-700 text-center">
                                <span className="material-symbols-outlined text-2xl text-[#70757a] mb-1">bed</span>
                                <p className="text-xs text-[#5f6368] dark:text-slate-400 font-medium">
                                    {t('pleaseSelectARoom')}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* 7. Daily Prices Breakdown (If Available) */}
                    {selectedRooms && selectedRooms.length > 0 && selectedRooms.some(r => (r.dailyPrices && r.dailyPrices.length > 0) || (r.hubRateModel?.price?.dailyPrices && r.hubRateModel?.price?.dailyPrices.length > 0)) && (
                        <div className="p-3 rounded-2xl bg-[#f8f9fa] dark:bg-[#303134] border border-[#dadce0] dark:border-slate-700">
                            <p className="text-[10px] font-semibold text-[#5f6368] dark:text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5" lang={currentLang}>
                                <span className="material-symbols-outlined text-xs text-[#1a73e8]">calendar_month</span>
                                {t('dailyRates')}
                            </p>
                            {selectedRooms.map((room, idx) => {
                                const dpList = room.dailyPrices || room.hubRateModel?.price?.dailyPrices || [];
                                if (dpList.length === 0) return null;
                                const roomCurr = room.hubRateModel?.price?.currency || room.currency || displayCurrency;

                                return (
                                    <div key={idx} className="mb-2 last:mb-0">
                                        {selectedRooms.length > 1 && (
                                            <p className="text-[9px] font-semibold text-[#70757a] uppercase tracking-wider mb-1" lang={currentLang}>
                                                {t('room')} {idx + 1}
                                            </p>
                                        )}
                                        <div className="space-y-1">
                                            {dpList.map((dp, dpIdx) => (
                                                <div key={dpIdx} className="flex justify-between items-center text-xs">
                                                    <span className="text-[#5f6368] dark:text-slate-400">
                                                        {new Date(dp.date).toLocaleDateString(currentLang, { day: '2-digit', month: 'short', year: 'numeric' })}
                                                    </span>
                                                    <span className="font-semibold text-[#202124] dark:text-white tabular-nums">
                                                        {getCurrencySymbol(roomCurr, authCurrencyMap)} {Number(dp.calculatedAmount || dp.amount || 0).toFixed(2)}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* 8. Price Breakdown Summary (Mockup style) */}
                    <div className="border-t border-slate-200/80 dark:border-slate-700/80 pt-3.5 space-y-2 text-xs">
                        <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                            <span>{t('roomStayPrice')} ({nights} {nights > 1 ? t('nights') : t('night')})</span>
                            <span className="font-medium text-slate-900 dark:text-slate-100 tabular-nums">
                                {getCurrencySymbol(displayCurrency, authCurrencyMap)} {Number(grandTotal).toFixed(2)}
                            </span>
                        </div>
                        <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                            <span>{t('taxesAndFees')}</span>
                            <span className="text-slate-500 dark:text-slate-400 font-medium">{t('taxesIncl')}</span>
                        </div>
                    </div>

                    {/* 9. Grand Total (Mockup style - large bold blue) */}
                    <div className="border-t border-slate-200/80 dark:border-slate-700/80 pt-3.5 flex items-baseline justify-between" lang={currentLang}>
                        <div>
                            <span className="text-sm font-semibold text-slate-900 dark:text-white block">
                                {t('totalAmount')}
                            </span>
                            <span className="text-xs text-slate-400 dark:text-slate-500">
                                {t('allTaxesIncluded')}
                            </span>
                        </div>
                        <span className="text-2xl font-bold text-[#0b57d0] dark:text-blue-400 tracking-tight tabular-nums">
                            {getCurrencySymbol(displayCurrency, authCurrencyMap)} {isLoadingRates ? '...' : (Number(grandTotal) || 0).toFixed(2)}
                        </span>
                    </div>

                    {/* 10. Rate Notes (Preserved) */}
                    {rateNotesList && rateNotesList.length > 0 && (
                        <div className="p-3 rounded-2xl bg-[#fef7e0] dark:bg-amber-950/30 border border-[#fce8e6] dark:border-amber-900/50" lang={currentLang}>
                            <p className="text-[10px] font-semibold text-amber-800 dark:text-amber-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                                <span className="material-symbols-outlined text-[13px]">info</span>
                                {t('rateNotes')}
                            </p>
                            <div 
                                className="text-xs font-normal text-amber-900 dark:text-amber-200 space-y-1 max-h-32 overflow-y-auto pr-2 custom-scrollbar html-content"
                                dangerouslySetInnerHTML={{ __html: decodeHTMLEntities(rateNotesList.join('<br/>')) }}
                            />
                        </div>
                    )}

                    {/* 11. Optional Custom Action Button / Config */}
                    {actionButton}
                    {actionConfig && (
                        <button
                            onClick={actionConfig.onClick}
                            disabled={actionConfig.disabled}
                            className={`w-full h-11 font-medium rounded-xl transition-all text-xs sm:text-sm shadow-xs hover:shadow flex items-center justify-center gap-2 active:scale-[0.98] mb-2 cursor-pointer ${
                                !actionConfig.disabled
                                    ? 'bg-[#1a73e8] hover:bg-[#1557b0] text-white cursor-pointer'
                                    : 'bg-[#f1f3f4] dark:bg-slate-800 text-[#70757a] cursor-not-allowed opacity-60'
                            } ${actionConfig.loading ? 'animate-pulse' : ''}`}
                            lang={currentLang}
                        >
                            {actionConfig.loading ? (
                                <>
                                    <span className="size-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                                    <span>{actionConfig.loadingText || t('processing')}</span>
                                </>
                            ) : (
                                <>
                                    <span>{actionConfig.text}</span>
                                    {actionConfig.icon && (
                                        <span className="material-symbols-outlined text-[18px]">{actionConfig.icon}</span>
                                    )}
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default HotelReservationSummaryCard;
