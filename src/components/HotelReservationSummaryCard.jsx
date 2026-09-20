import React from 'react';
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
        remove: "Remove"
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
        remove: "Kaldır"
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
        remove: "إزالة"
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
        remove: "Eliminar"
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
        remove: "Удалить"
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
        remove: "移除"
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
        remove: "削除"
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
        remove: "حذف"
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
        remove: "Supprimer"
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
        remove: "Rimuovi"
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
        remove: "Αφαίρεση"
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
        remove: "Remover"
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
    lang = null
}) => {
    const { currencySymbolMap: authCurrencyMap } = useAuth ? useAuth() : { currencySymbolMap: {} };
    const currentLang = (lang || localStorage.getItem('language') || 'tr').split('-')[0].toLowerCase();

    const t = (key) => {
        return SUMMARY_LOCALES[currentLang]?.[key] || SUMMARY_LOCALES['en']?.[key] || key;
    };

    // Dates formatting
    const startDate = formattedDates?.start || dates?.start || hotel?.checkInDate || '';
    const endDate = formattedDates?.end || dates?.end || hotel?.checkOutDate || '';

    // Hotel details extraction
    const hotelName = decodeHTMLEntities(
        hotel?.names?.[currentLang] || hotel?.names?.tr || hotel?.names?.en || hotel?.name || 'Hotel'
    );
    const hotelStars = Number(hotel?.stars || hotel?.starRating || 5);
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

    // Rate notes
    const rateNotesList = checkRatesData?.notes || hotel?.rateNotes || [];

    return (
        <div className="space-y-3 font-roboto">
            <div className="bg-white dark:bg-[#202124] border border-[#dadce0] dark:border-slate-700 rounded-xl p-4 sm:p-5 shadow-sm">
                {/* Instant Confirmation Header */}
                <div className="flex items-center gap-2 text-[#137333] dark:text-emerald-300 font-medium text-xs mb-3.5 bg-[#e6f4ea] dark:bg-emerald-950/40 p-2.5 rounded-lg border border-[#ceead6] dark:border-emerald-800" lang={currentLang}>
                    <span className="material-symbols-outlined text-base fill-1">bolt</span>
                    <span>{t('instantConfirmation')}</span>
                </div>

                {/* Reservation Summary Title & Room Count Badge */}
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-semibold text-[#5f6368] dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5" lang={currentLang}>
                        <span className="material-symbols-outlined text-sm text-[#1a73e8]">auto_awesome</span>
                        {t('reservationSummary')}
                    </h3>
                    <span className="text-xs font-medium px-2.5 py-0.5 rounded-md bg-[#e8f0fe] text-[#1a73e8] border border-[#d2e3fc]">
                        {selectedRooms.length} / {totalRoomsCount} {t('room')}
                    </span>
                </div>

                {/* Hotel Preview Mini Card */}
                <div className="mb-3.5 rounded-xl overflow-hidden border border-[#dadce0] dark:border-slate-700 shadow-xs">
                    <div className="relative h-24 overflow-hidden bg-gray-100 dark:bg-slate-800">
                        <img
                            src={hotelImage}
                            alt={hotelName}
                            className="w-full h-full object-cover"
                            loading="lazy"
                            decoding="async"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent"></div>
                        <div className="absolute bottom-2 left-3 right-3">
                            <div className="flex items-center gap-0.5 mb-0.5">
                                {[...Array(hotelStars)].map((_, i) => (
                                    <span key={i} className="material-symbols-outlined text-[11px] text-[#fbbc04] fill-1">star</span>
                                ))}
                                {hotel?.isRecommended && (
                                    <span className="ml-1 bg-[#1a73e8] text-white text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md shadow-xs flex items-center gap-0.5">
                                        <span className="material-symbols-outlined text-[10px] fill-1">thumb_up</span>
                                        REC
                                    </span>
                                )}
                            </div>
                            <h4 className="font-semibold text-white text-xs uppercase tracking-tight leading-tight line-clamp-1">{hotelName}</h4>
                        </div>
                    </div>
                    <div className="p-2.5 bg-[#f8f9fa] dark:bg-[#303134] space-y-1.5 border-t border-[#dadce0] dark:border-slate-700">
                        {hotelAddress && (
                            <div className="flex items-center gap-1.5">
                                <span className="material-symbols-outlined text-xs text-[#1a73e8] shrink-0">location_on</span>
                                <p className="text-[10px] font-normal text-[#5f6368] dark:text-slate-300 truncate">{hotelAddress}</p>
                            </div>
                        )}
                        <div className="flex gap-4" lang={currentLang}>
                            <div className="flex items-center gap-1">
                                <span className="material-symbols-outlined text-[11px] text-[#1a73e8]">login</span>
                                <span className="text-[9px] font-medium text-[#5f6368] dark:text-slate-400 uppercase tracking-wider">
                                    {t('in')}: {hotel?.checkIn || '15:00'}
                                </span>
                            </div>
                            <div className="flex items-center gap-1">
                                <span className="material-symbols-outlined text-[11px] text-[#1a73e8]">logout</span>
                                <span className="text-[9px] font-medium text-[#5f6368] dark:text-slate-400 uppercase tracking-wider">
                                    {t('out')}: {hotel?.checkOut || '11:00'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Dates & Guests Stay Box */}
                <div className="grid grid-cols-2 gap-2 mb-3.5">
                    <div className="p-2.5 rounded-lg bg-[#f8f9fa] dark:bg-[#303134] border border-[#dadce0] dark:border-slate-700">
                        <p className="text-[8px] font-semibold text-[#5f6368] dark:text-slate-400 uppercase tracking-wider mb-0.5" lang={currentLang}>{t('checkIn')}</p>
                        <p className="text-xs font-semibold text-[#1a73e8] leading-tight">{startDate}</p>
                    </div>
                    <div className="p-2.5 rounded-lg bg-[#f8f9fa] dark:bg-[#303134] border border-[#dadce0] dark:border-slate-700">
                        <p className="text-[8px] font-semibold text-[#5f6368] dark:text-slate-400 uppercase tracking-wider mb-0.5" lang={currentLang}>{t('checkOut')}</p>
                        <p className="text-xs font-semibold text-[#1a73e8] leading-tight">{endDate}</p>
                    </div>
                    <div className="col-span-2 p-2.5 rounded-lg bg-[#f8f9fa] dark:bg-[#303134] border border-[#dadce0] dark:border-slate-700 flex justify-between items-center">
                        <div className="flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-xs text-[#1a73e8]">nights_stay</span>
                            <span className="text-[9px] font-semibold text-[#5f6368] dark:text-slate-300 uppercase tracking-wider" lang={currentLang}>
                                {`${nights} ${nights > 1 ? t('nights') : t('night')} ${t('stay')}`}
                            </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-xs text-[#1a73e8]">group</span>
                            <span className="text-[9px] font-semibold text-[#5f6368] dark:text-slate-300 uppercase tracking-wider" lang={currentLang}>
                                {getGuestsSummaryText()}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Selected Rooms Breakdown */}
                <div className="space-y-2 mb-3.5">
                    <p className="text-[9px] font-semibold text-[#5f6368] dark:text-slate-400 uppercase tracking-wider" lang={currentLang}>
                        {t('selectedRooms')}
                    </p>
                    {selectedRooms && selectedRooms.length > 0 ? (
                        selectedRooms.map((room, idx) => {
                            const hubRate = room.hubRateModel || {};
                            const checkRatesRoom = checkRatesData?.rooms?.[idx];
                            const checkRatesRate = checkRatesRoom?.rates?.[0];

                            // Board name
                            const rawBoard = checkRatesRate?.boardName || hubRate.boardCode || room.boardName || room.boardCode || 'Room Only';
                            const boardLabel = getBoardLabel(rawBoard, t, currentLang);

                            // Refundable & Cancellation
                            const refundable = checkRatesRate?.refundable !== undefined 
                                ? checkRatesRate.refundable 
                                : (hubRate.refundable ?? (room.isRefundable ?? true));

                            const policies = checkRatesRate?.price?.cancellationPolicies 
                                || hubRate.price?.cancellationPolicies 
                                || room.cancellationPolicies 
                                || [];

                            // Price
                            const roomPrice = checkRatesRate?.price?.calculatedAmount 
                                || checkRatesRate?.price?.totalPaymentAmount 
                                || hubRate.price?.calculatedAmount 
                                || hubRate.price?.netTotal 
                                || hubRate.price?.grossTotal 
                                || room.rate 
                                || 0;

                            const roomCurr = checkRatesRate?.price?.currency 
                                || hubRate.price?.currency 
                                || room.currency 
                                || displayCurrency;

                            const roomName = decodeHTMLEntities(room.name || `Room ${idx + 1}`);

                            return (
                                <div key={idx} className="relative p-3 rounded-xl bg-[#f8f9fa] dark:bg-[#303134] border border-[#dadce0] dark:border-slate-700">
                                    {onRemoveRoom && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onRemoveRoom(idx);
                                            }}
                                            className="absolute top-2 right-2 size-6 text-[#5f6368] hover:text-[#d93025] flex items-center justify-center rounded-md hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                                            title={t('remove')}
                                        >
                                            <span className="material-symbols-outlined text-[16px]">close</span>
                                        </button>
                                    )}
                                    <div className={`${onRemoveRoom ? 'pr-6' : 'pr-2'} mb-1.5`}>
                                        <div className="flex items-start gap-1.5">
                                            <div className="size-4 rounded-md bg-[#e8f0fe] text-[#1a73e8] text-[9px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                                                {idx + 1}
                                            </div>
                                            <span className="font-medium text-[#202124] dark:text-white text-xs line-clamp-2">
                                                {roomName}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#dadce0] dark:border-slate-700">
                                        <div className="flex items-center gap-1.5">
                                            <span className="bg-white dark:bg-slate-800 border border-[#dadce0] dark:border-slate-600 text-[#3c4043] dark:text-slate-300 text-[10px] px-1.5 py-0.5 rounded-md font-normal">
                                                {boardLabel}
                                            </span>
                                            {refundable !== undefined && (
                                                <RefundPolicyTooltip
                                                    isRefundable={refundable}
                                                    textOverride={refundable ? t('freeCancel') : t('nonRefundable')}
                                                    className={`text-[10px] font-medium px-1.5 py-0.5 rounded-md ${refundable ? 'bg-[#e6f4ea] text-[#137333]' : 'bg-[#f1f3f4] text-[#5f6368]'}`}
                                                />
                                            )}
                                        </div>
                                        <div className="text-right">
                                            <span className="text-xs font-bold text-[#202124] dark:text-white">
                                                {getCurrencySymbol(roomCurr, authCurrencyMap)} {roomPrice.toFixed(2)}
                                            </span>
                                            <p className="text-[9px] text-[#70757a]">
                                                {nights} {nights > 1 ? t('nights') : t('night')}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Cancellation Policy Details */}
                                    <div className="mt-2 pt-1.5 border-t border-dashed border-[#dadce0] dark:border-slate-700">
                                        {policies && policies.length > 0 ? (
                                            <div className="space-y-1">
                                                <p className="text-[9px] font-semibold text-[#5f6368] dark:text-slate-400 uppercase tracking-wider mb-0.5" lang={currentLang}>
                                                    {t('cancellationPolicy')}
                                                </p>
                                                {policies.map((policy, pIdx) => (
                                                    <div key={pIdx} className="flex justify-between items-center text-[10px]">
                                                        <span className="text-[#5f6368] dark:text-slate-400">
                                                            {policy.fromDate 
                                                                ? (policy.fromDate.includes('[') 
                                                                    ? new Date(policy.fromDate.split('[')[0]).toLocaleDateString(currentLang, { day: '2-digit', month: 'short', year: 'numeric' })
                                                                    : new Date(policy.fromDate).toLocaleDateString(currentLang, { day: '2-digit', month: 'short', year: 'numeric' }))
                                                                : (policy.amount === 0 ? t('flexible') : t('cancellationPenalty'))
                                                            }
                                                        </span>
                                                        <span className={`font-medium px-1.5 py-0.5 rounded-md text-[9px] ${
                                                            policy.amount === 0 ? 'bg-[#e6f4ea] text-[#137333]' : 'bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300'
                                                        }`}>
                                                            {policy.amount === 0 ? t('freeCancel') : `${getCurrencySymbol(policy.currency || roomCurr, authCurrencyMap)} ${policy.amount.toFixed(2)}`}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <span className="text-[10px] text-[#70757a] flex items-center gap-1" lang={currentLang}>
                                                <span className="material-symbols-outlined text-[11px]">info</span>
                                                {t('standardCancellation')}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="p-4 rounded-xl bg-[#f8f9fa] dark:bg-[#303134] border border-dashed border-[#dadce0] dark:border-slate-700 text-center">
                            <span className="material-symbols-outlined text-2xl text-[#70757a] mb-1">bed</span>
                            <p className="text-xs text-[#5f6368] dark:text-slate-400">
                                {t('pleaseSelectARoom')}
                            </p>
                        </div>
                    )}
                </div>

                {/* Daily Prices Breakdown (If Available) */}
                {selectedRooms && selectedRooms.length > 0 && selectedRooms.some(r => (r.dailyPrices && r.dailyPrices.length > 0) || (r.hubRateModel?.price?.dailyPrices && r.hubRateModel?.price?.dailyPrices.length > 0)) && (
                    <div className="mb-3.5 p-2.5 rounded-xl bg-[#f8f9fa] dark:bg-[#303134] border border-[#dadce0] dark:border-slate-700">
                        <p className="text-[9px] font-semibold text-[#5f6368] dark:text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5" lang={currentLang}>
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
                                        <p className="text-[8px] font-semibold text-[#70757a] uppercase tracking-wider mb-1" lang={currentLang}>
                                            {t('room')} {idx + 1}
                                        </p>
                                    )}
                                    <div className="space-y-1">
                                        {dpList.map((dp, dpIdx) => (
                                            <div key={dpIdx} className="flex justify-between items-center text-[10px]">
                                                <span className="text-[#5f6368] dark:text-slate-400">
                                                    {new Date(dp.date).toLocaleDateString(currentLang, { day: '2-digit', month: 'short', year: 'numeric' })}
                                                </span>
                                                <span className="font-semibold text-[#202124] dark:text-white">
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

                {/* Grand Total */}
                <div className="pt-3 border-t border-[#dadce0] dark:border-slate-700 mb-3" lang={currentLang}>
                    <div className="flex items-baseline justify-between mb-1">
                        <div>
                            <span className="text-xs text-[#5f6368] dark:text-slate-400 font-medium block">{t('totalStayPrice')}</span>
                            <span className="text-[10px] text-[#70757a]">{displayCurrency} · {t('taxesIncl')}</span>
                        </div>
                        <span className="text-xl font-bold text-[#1a73e8] dark:text-blue-400">
                            {getCurrencySymbol(displayCurrency, authCurrencyMap)} {isLoadingRates ? '...' : grandTotal.toFixed(2)}
                        </span>
                    </div>
                </div>

                {/* Rate Notes */}
                {rateNotesList && rateNotesList.length > 0 && (
                    <div className="mb-3 p-2.5 rounded-xl bg-[#fef7e0] dark:bg-amber-950/30 border border-[#fce8e6] dark:border-amber-900/50" lang={currentLang}>
                        <p className="text-[9px] font-semibold text-amber-800 dark:text-amber-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                            <span className="material-symbols-outlined text-[12px]">info</span>
                            {t('rateNotes')}
                        </p>
                        <div 
                            className="text-[10px] font-normal text-amber-900 dark:text-amber-200 space-y-1 max-h-32 overflow-y-auto pr-2 custom-scrollbar html-content"
                            dangerouslySetInnerHTML={{ __html: decodeHTMLEntities(rateNotesList.join('<br/>')) }}
                        />
                    </div>
                )}

                {/* Optional Custom Action Button / Config */}
                {actionButton}
                {actionConfig && (
                    <button
                        onClick={actionConfig.onClick}
                        disabled={actionConfig.disabled}
                        className={`w-full font-medium py-3 rounded-[4px] transition-all text-sm shadow-sm flex items-center justify-center gap-2 active:scale-[0.98] mb-2 ${
                            !actionConfig.disabled
                                ? 'bg-[#1a73e8] hover:bg-[#1557b0] text-white cursor-pointer'
                                : 'bg-[#f1f3f4] dark:bg-slate-800 text-[#70757a] cursor-not-allowed'
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

                <p className="text-[10px] text-center text-[#70757a] dark:text-slate-500 font-medium" lang={currentLang}>
                    {t('b2bRates')}
                </p>
            </div>

            {/* Security Badge */}
            {showSecurityBadge && (
                <div className="bg-white dark:bg-[#202124] border border-[#dadce0] dark:border-slate-700 rounded-xl p-3.5 flex items-center gap-3" lang={currentLang}>
                    <div className="size-9 rounded-lg bg-[#e8f0fe] dark:bg-slate-800 flex items-center justify-center text-[#1a73e8] shrink-0">
                        <span className="material-symbols-outlined text-lg">verified_user</span>
                    </div>
                    <div>
                        <p className="text-[10px] font-medium text-[#70757a] uppercase tracking-wider leading-none mb-0.5">{t('securePayment')}</p>
                        <p className="text-xs font-semibold text-[#202124] dark:text-white">{t('protectedBooking')}</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HotelReservationSummaryCard;
