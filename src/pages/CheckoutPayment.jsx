import React, { useState, useLayoutEffect, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Footer from '../components/Footer';
import { hotelService } from '../services/hotelService';
import CheckoutStepper from '../components/CheckoutStepper';
import ConfirmationModal from '../components/ConfirmationModal';
import CheckoutTimer from '../components/CheckoutTimer';
import RefundPolicyTooltip from '../components/RefundPolicyTooltip';
import { useAuth, getCurrencySymbol } from '../context/AuthContext';

const confirmLocales = {
    en: {
        title: "Are you sure?",
        message: "If you return to room selection, all entered guest details will be lost.",
        cancel: "Cancel",
        confirm: "Yes, Continue"
    },
    tr: {
        title: "Emin misiniz?",
        message: "Oda seçimine geri dönerseniz girdiğiniz tüm konuk bilgileri silinecektir.",
        cancel: "İptal",
        confirm: "Evet, Devam Et"
    },
    ar: {
        title: "هل أنت متأكد؟",
        message: "إذا عدت إلى اختيار الغرفة، فستفقد جميع تفاصيل النزلاء التي تم إدخالها.",
        cancel: "إلغاء",
        confirm: "نعم، استمر"
    },
    es: {
        title: "¿Está seguro?",
        message: "Si regresa a la selección de habitación, se perderán todos los datos ingresados de los huéspedes.",
        cancel: "Cancelar",
        confirm: "Sí, continuar"
    },
    ru: {
        title: "Вы уверены?",
        message: "Если вы вернетесь к выбору номера, все введенные данные гостей будут утеряны.",
        cancel: "Отмена",
        confirm: "Да, продолжить"
    },
    zh: {
        title: "您确定吗？",
        message: "如果您返回选择客房，所有已输入的旅客信息都将丢失。",
        cancel: "取消",
        confirm: "是的，继续"
    },
    ja: {
        title: "よろしいですか？",
        message: "客室選択に戻ると、入力されたすべての宿泊者情報が失われます。",
        cancel: "キャンセル",
        confirm: "はい、続行します"
    },
    fa: {
        title: "آیا مطمئن هستید؟",
        message: "در صورت بازگشت به انتخاب اتاق، تمام اطلاعات وارد شده مهمانان پاک خواهد شد.",
        cancel: "لغو",
        confirm: "بله، ادامه دهید"
    },
    fr: {
        title: "Êtes-vous sûr ?",
        message: "Si vous retournez au choix de la chambre, toutes les coordonnées des voyageurs saisies seront perdues.",
        cancel: "Annuler",
        confirm: "Oui, continuer"
    },
    it: {
        title: "Sei sicuro?",
        message: "Se torni alla scelta della camera, tutti i dettagli degli ospiti inseriti andranno persi.",
        cancel: "Annulla",
        confirm: "Sì, continua"
    },
    el: {
        title: "Είστε σίγουροι;",
        message: "Εάν επιστρέψετε στην επιλογή δωματίου, όλα τα στοιχεία επισκεπτών που καταχωρίσατε θα χαθούν.",
        cancel: "Ακύρωση",
        confirm: "Ναι, συνέχεια"
    },
    pt: {
        title: "Tem certeza?",
        message: "Se você retornar à seleção de quartos, todos os detalhes do hóspede inseridos serão perdidos.",
        cancel: "Cancelar",
        confirm: "Sim, continuar"
    }
};
const CHECKOUT_SUMMARY_LOCALES = {
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
        night: "Night",
        nights: "Nights",
        stay: "Stay",
        taxesAndFees: "Taxes & Fees",
        bookingReferences: "Booking References",
        internalIdentifiers: "Internal identifiers & special requests",
        clientReferenceId: "Client Reference ID",
        internalReferenceNumber: "Your internal reference number",
        specialRemarks: "Special Remarks",
        enterRemarks: "Any special requests or notes",
        instantConfirmation: "Instant Confirmation Available",
        backToRoom: "Back to Room",
        backToSelection: "Back to Selection",
        nextRoom: "Next: Room",
        reviewAndPay: "Review & Pay",
        totalStayPrice: "Total Stay Price (Net)",
        taxesIncl: "Taxes Incl.",
        b2bRates: "B2B AGENCY RATES APPLIED",
        securePayment: "SECURE PAYMENT",
        protectedBooking: "TOG Protected Booking",
        in: "In",
        out: "Out",
        leadGuest: "Lead Guest (Contact)",
        traveler: "Traveler",
        standardPolicy: "Standard Adult Policy",
        childPassenger: "Child Passenger",
        age: "Age",
        occupancyInfo: "Occupancy Info",
        rateNotes: "Rate Notes",
        room: "Room",
        corporateDepositAccount: "Corporate Deposit Account",
        verifiedB2bBalance: "Verified B2B Balance",
        availableFunds: "Available Funds",
        status: "Status",
        activeReady: "Active & Ready",
        insufficientFunds: "Insufficient Funds",
        deductionAmount: "Deduction Amount",
        paymentImpact: "Payment Impact",
        balanceDecrease: "Balance Decrease",
        deficitAmount: "Deficit Amount",
        topUpPrompt: "Please top up your account to complete this booking",
        estimatedNewBalance: "Estimated New Balance"
    },
    tr: {
        checkIn: "Giriş",
        checkOut: "Çıkış",
        nightsStay: "Gece Konaklama",
        nightStay: "Gece Konaklama",
        selectedRooms: "Seçilen Odalar",
        dailyRates: "Günlük Fiyatlar",
        cancellationPolicy: "İptal Kuralı",
        flexible: "Esnek",
        cancellationPenalty: "İptal Cezası",
        freeCancel: "Ücretsiz İptal",
        standardCancellation: "Standart iptal kuralı geçerlidir",
        adults: "Yetişkin",
        adult: "Yetişkin",
        children: "Çocuk",
        child: "Çocuk",
        roomOnly: "Sadece Oda",
        night: "Gece",
        nights: "Gece",
        stay: "Konaklama",
        taxesAndFees: "Vergiler & Harçlar",
        bookingReferences: "Rezervasyon Referansları",
        internalIdentifiers: "Dahili kimlikler ve özel istekler",
        clientReferenceId: "Müşteri Referans Numarası",
        internalReferenceNumber: "Dahili referans numaranız",
        specialRemarks: "Özel Notlar",
        enterRemarks: "Varsa özel istek ve notlarınızı giriniz",
        instantConfirmation: "Anında Onaylanabilir Rezervasyon",
        backToRoom: "Odaya Dön",
        backToSelection: "Oda Seçimine Dön",
        nextRoom: "Sonraki: Oda",
        reviewAndPay: "İncele ve Öde",
        totalStayPrice: "Toplam Tutar (Net)",
        taxesIncl: "Vergiler Dahil",
        b2bRates: "B2B ACENTE FİYATLARI UYGULANDI",
        securePayment: "GÜVENLİ ÖDEME",
        protectedBooking: "TOG Korumalı Rezervasyon",
        in: "Giriş",
        out: "Çıkış",
        leadGuest: "Ana Misafir (İletişim)",
        traveler: "Yolcu",
        standardPolicy: "Standart Yetişkin Politikası",
        childPassenger: "Çocuk Yolcu",
        age: "Yaş",
        occupancyInfo: "Doluluk Bilgisi",
        rateNotes: "Fiyat Notları",
        room: "Oda",
        corporateDepositAccount: "Kurumsal Depozito Hesabı",
        verifiedB2bBalance: "Doğrulanmış B2B Bakiyesi",
        availableFunds: "Kullanılabilir Bakiye",
        status: "Durum",
        activeReady: "Aktif ve Hazır",
        insufficientFunds: "Yetersiz Bakiye",
        deductionAmount: "Düşülecek Tutar",
        paymentImpact: "Ödeme Etkisi",
        balanceDecrease: "Bakiye Azalışı",
        deficitAmount: "Eksik Tutar",
        topUpPrompt: "Lütfen bu rezervasyonu tamamlamak için hesabınıza bakiye yükleyin",
        estimatedNewBalance: "Tahmini Yeni Bakiye"
    },
    ar: {
        checkIn: "تسجيل الوصول",
        checkOut: "تسجيل المغادرة",
        nightsStay: "إقامة ليالي",
        nightStay: "إقامة ليلة",
        selectedRooms: "الغرف المختارة",
        dailyRates: "الأسعار اليومية",
        cancellationPolicy: "سياسة الإلغاء",
        flexible: "مرن",
        cancellationPenalty: "غرامة الإلغاء",
        freeCancel: "إلغاء مجاني",
        standardCancellation: "تطبق شروط الإلغاء القياسية",
        adults: "بالغين",
        adult: "بالغ",
        children: "أطفال",
        child: "طفل",
        roomOnly: "غرفة فقط",
        night: "ليلة",
        nights: "ليالي",
        stay: "إقامة",
        taxesAndFees: "الضرائب والرسوم",
        bookingReferences: "مراجع الحجز",
        internalIdentifiers: "المعرفات الداخلية والطلبات الخاصة",
        clientReferenceId: "رقم مرجع العميل",
        internalReferenceNumber: "رقم المرجع الداخلي الخاص بك",
        specialRemarks: "ملاحظات خاصة",
        enterRemarks: "أي ملاحظات أو طلبات خاصة",
        instantConfirmation: "تأكيد فوري متاح",
        backToRoom: "العودة إلى الغرفة",
        backToSelection: "العودة إلى الاختيار",
        nextRoom: "التالي: الغرفة",
        reviewAndPay: "المراجعة والدفع",
        totalStayPrice: "إجمالي سعر الإقامة (صافي)",
        taxesIncl: "شامل الضرائب",
        b2bRates: "تم تطبيق أسعار وكالات B2B",
        securePayment: "دفع آمن",
        protectedBooking: "حجز TOG المحمي",
        in: "دخول",
        out: "خروج",
        leadGuest: "النزيل الرئيسي (الاتصال)",
        traveler: "مسافر",
        standardPolicy: "سياسة البالغين القياسية",
        childPassenger: "مسافر طفل",
        age: "العمر",
        occupancyInfo: "معلومات الإشغال",
        rateNotes: "ملاحظات الأسعار",
        room: "غرفة"
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
        standardCancellation: "Se aplica la cancelación estándar",
        adults: "Adultos",
        adult: "Adulto",
        children: "Niños",
        child: "Niño",
        roomOnly: "Solo Habitación",
        night: "Noche",
        nights: "Noches",
        stay: "Estancia",
        taxesAndFees: "Impuestos y Tasas",
        bookingReferences: "Referencias de Reserva",
        internalIdentifiers: "Identificadores internos y solicitudes especiales",
        clientReferenceId: "ID de Referencia del Cliente",
        internalReferenceNumber: "Su número de referencia interno",
        specialRemarks: "Observaciones Especiales",
        enterRemarks: "Cualquier solicitud especial o nota",
        instantConfirmation: "Confirmación Instantánea Disponible",
        backToRoom: "Volver a la Habitación",
        backToSelection: "Volver a la Selección",
        nextRoom: "Siguiente: Habitación",
        reviewAndPay: "Revisar y Pagar",
        totalStayPrice: "Precio Total Estancia (Neto)",
        taxesIncl: "Impuestos Incl.",
        b2bRates: "TARIFAS DE AGENCIA B2B APLICADAS",
        securePayment: "PAGO SEGURO",
        protectedBooking: "Reserva Protegida por TOG",
        in: "Entrada",
        out: "Salida",
        leadGuest: "Huésped Principal (Contacto)",
        traveler: "Viajero",
        standardPolicy: "Política de Adultos Estándar",
        childPassenger: "Pasajero Niño",
        age: "Edad",
        occupancyInfo: "Información de Ocupación",
        rateNotes: "Notas de Tarifa",
        room: "Habitación"
    },
    ru: {
        checkIn: "Заезд",
        checkOut: "Выезд",
        nightsStay: "Ночей пребывания",
        nightStay: "Ночь пребывания",
        selectedRooms: "Выбранные номера",
        dailyRates: "Дневные тарифы",
        cancellationPolicy: "Правила отмены",
        flexible: "Гибкий",
        cancellationPenalty: "Штраф за отмену",
        freeCancel: "Бесплатная отмена",
        standardCancellation: "Применяются стандартные правила отмены",
        adults: "Взрослых",
        adult: "Взрослый",
        children: "Детей",
        child: "Ребенок",
        roomOnly: "Без питания",
        night: "Ночь",
        nights: "Ночей",
        stay: "Пребывание",
        taxesAndFees: "Налоги и сборы",
        bookingReferences: "Ссылки на бронирование",
        internalIdentifiers: "Внутренние идентификаторы и особые пожелания",
        clientReferenceId: "ID клиента",
        internalReferenceNumber: "Ваш внутренний номер",
        specialRemarks: "Особые отметки",
        enterRemarks: "Любые особые пожелания или примечания",
        instantConfirmation: "Мгновенное подтверждение",
        backToRoom: "Назад к номеру",
        backToSelection: "Назад к выбору",
        nextRoom: "Далее: Номер",
        reviewAndPay: "Проверить и оплатить",
        totalStayPrice: "Итого стоимость проживания (нетто)",
        taxesIncl: "Включая налоги",
        b2bRates: "ПРИМЕНЕНЫ ТАРИФЫ АГЕНТСТВА B2B",
        securePayment: "БЕЗОПАСНАЯ ОПЛАТА",
        protectedBooking: "Защищенное бронирование TOG",
        in: "Заезд",
        out: "Выезд",
        leadGuest: "Основной гость (Контакт)",
        traveler: "Путешественник",
        standardPolicy: "Стандартные правила для взрослых",
        childPassenger: "Пассажир-ребенок",
        age: "Возраст",
        occupancyInfo: "Информация о размещении",
        rateNotes: "Примечания к тарифу",
        room: "Номер"
    },
    zh: {
        checkIn: "入住",
        checkOut: "退房",
        nightsStay: "晚住宿",
        nightStay: "晚住宿",
        selectedRooms: "已选客房",
        dailyRates: "每日房价",
        cancellationPolicy: "取消政策",
        flexible: "灵活",
        cancellationPenalty: "取消罚金",
        freeCancel: "免费取消",
        standardCancellation: "适用标准取消政策",
        adults: "成人",
        adult: "成人",
        children: "儿童",
        child: "儿童",
        roomOnly: "仅限客房",
        night: "晚",
        nights: "晚",
        stay: "住宿",
        taxesAndFees: "税费",
        bookingReferences: "预订参考",
        internalIdentifiers: "内部标识与特殊要求",
        clientReferenceId: "客户参考编号",
        internalReferenceNumber: "您的内部参考编号",
        specialRemarks: "特殊备注",
        enterRemarks: "任何特殊要求或备注",
        instantConfirmation: "可即时确认",
        backToRoom: "返回客房",
        backToSelection: "返回选择",
        nextRoom: "下一步：客房",
        reviewAndPay: "检查并支付",
        totalStayPrice: "总住宿价格（净价）",
        taxesIncl: "含税",
        b2bRates: "已应用 B2B 代理商协议价",
        securePayment: "安全支付",
        protectedBooking: "TOG 担保预订",
        in: "入住",
        out: "退房",
        leadGuest: "主要联系人",
        traveler: "旅客",
        standardPolicy: "标准成人政策",
        childPassenger: "儿童旅客",
        age: "年龄",
        occupancyInfo: "入住人数信息",
        rateNotes: "价格备注",
        room: "客房"
    },
    ja: {
        checkIn: "チェックイン",
        checkOut: "チェックアウト",
        nightsStay: "泊の滞在",
        nightStay: "泊の滞在",
        selectedRooms: "選択された客室",
        dailyRates: "日別料金",
        cancellationPolicy: "キャンセルポリシー",
        flexible: "柔軟",
        cancellationPenalty: "キャンセル料",
        freeCancel: "無料キャンセル",
        standardCancellation: "標準のキャンセルポリシーが適用されます",
        adults: "大人",
        adult: "大人",
        children: "子供",
        child: "子供",
        roomOnly: "食事なし",
        night: "泊",
        nights: "泊",
        stay: "滞在",
        taxesAndFees: "税金・諸費用",
        bookingReferences: "予約リファレンス",
        internalIdentifiers: "内部識別子と特別なリクエスト",
        clientReferenceId: "クライアント参照ID",
        internalReferenceNumber: "社内参照番号",
        specialRemarks: "特別リクエスト",
        enterRemarks: "特別なリクエストやメモ",
        instantConfirmation: "即時確定可能",
        backToRoom: "客室に戻る",
        backToSelection: "選択に戻る",
        nextRoom: "次へ: 客室",
        reviewAndPay: "確認して支払う",
        totalStayPrice: "合計滞在料金（ネット）",
        taxesIncl: "税金込",
        b2bRates: "B2Bエージェンシー料金適用済み",
        securePayment: "安全な決済",
        protectedBooking: "TOG保護された予約",
        in: "イン",
        out: "アウト",
        leadGuest: "代表宿泊者（連絡先）",
        traveler: "宿泊者",
        standardPolicy: "標準大人ポリシー",
        childPassenger: "子供の宿泊者",
        age: "年齢",
        occupancyInfo: "宿泊人数情報",
        rateNotes: "料金に関する注意事項",
        room: "客室"
    },
    fa: {
        checkIn: "ورود",
        checkOut: "خروج",
        nightsStay: "شب اقامت",
        nightStay: "شب اقامت",
        selectedRooms: "اتاق‌های انتخاب شده",
        dailyRates: "قیمت‌های روزانه",
        cancellationPolicy: "قوانین کنسلی",
        flexible: "قابل انعطاف",
        cancellationPenalty: "جریمه کنسلی",
        freeCancel: "کنسلی رایگان",
        standardCancellation: "کنسلی استاندارد اعمال می‌شود",
        adults: "بزرگسال",
        adult: "بزرگسال",
        children: "کودک",
        child: "کودک",
        roomOnly: "فقط اتاق",
        night: "شب",
        nights: "شب",
        stay: "اقامت",
        taxesAndFees: "مالیات و عوارض",
        bookingReferences: "مراجع رزرو",
        internalIdentifiers: "شناسه‌های داخلی و درخواست‌های خاص",
        clientReferenceId: "شناسه مرجع مشتری",
        internalReferenceNumber: "شماره مرجع داخلی شما",
        specialRemarks: "ملاحظات خاص",
        enterRemarks: "هرگونه درخواست خاص یا یادداشت",
        instantConfirmation: "تأیید فوری فعال است",
        backToRoom: "بازگشت به اتاق",
        backToSelection: "بازگشت به انتخاب",
        nextRoom: "بعدی: اتاق",
        reviewAndPay: "بررسی و پرداخت",
        totalStayPrice: "هزینه کل اقامت (خالص)",
        taxesIncl: "شامل مالیات",
        b2bRates: "نرخ‌های آژانس B2B اعمال شد",
        securePayment: "پرداخت امن",
        protectedBooking: "رزرو تحت پوشش TOG",
        in: "ورود",
        out: "خروج",
        leadGuest: "مسافر اصلی (تماس)",
        traveler: "مسافر",
        standardPolicy: "قانون استاندارد بزرگسال",
        childPassenger: "مسافر کودک",
        age: "سن",
        occupancyInfo: "اطلاعات ظرفیت",
        rateNotes: "ملاحظات نرخ",
        room: "اتاق"
    },
    fr: {
        checkIn: "Arrivée",
        checkOut: "Départ",
        nightsStay: "Nuits de Séjour",
        nightStay: "Nuit de Séjour",
        selectedRooms: "Chambres Sélectionnées",
        dailyRates: "Tarifs Quotidiens",
        cancellationPolicy: "Conditions d'Annulation",
        flexible: "Flexible",
        cancellationPenalty: "Frais d'Annulation",
        freeCancel: "Annulation Gratuite",
        standardCancellation: "Conditions d'annulation standard applicables",
        adults: "Adultes",
        adult: "Adulte",
        children: "Enfants",
        child: "Enfant",
        roomOnly: "Chambre Seule",
        night: "Nuit",
        nights: "Nuits",
        stay: "Séjour",
        taxesAndFees: "Taxes & Frais",
        bookingReferences: "Références de Réservation",
        internalIdentifiers: "Identifiants internes & demandes spéciales",
        clientReferenceId: "Réf. Client",
        internalReferenceNumber: "Votre numéro de référence interne",
        specialRemarks: "Remarques Spéciales",
        enterRemarks: "Demandes spéciales ou notes",
        instantConfirmation: "Confirmation Instantanée Disponible",
        backToRoom: "Retour à la Chambre",
        backToSelection: "Retour à la Sélection",
        nextRoom: "Suivant: Chambre",
        reviewAndPay: "Vérifier & Payer",
        totalStayPrice: "Prix Total Séjour (Net)",
        taxesIncl: "Taxes Incl.",
        b2bRates: "TARIFS AGENCE B2B APPLIQUÉS",
        securePayment: "PAIEMENT SÉCURISÉ",
        protectedBooking: "Réservation Protégée TOG",
        in: "Arrivée",
        out: "Départ",
        leadGuest: "Client Principal (Contact)",
        traveler: "Voyageur",
        standardPolicy: "Politique Adulte Standard",
        childPassenger: "Voyageur Enfant",
        age: "Âge",
        occupancyInfo: "Infos d'Occupation",
        rateNotes: "Notes de Tarif",
        room: "Chambre"
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
        standardCancellation: "Si applica la cancellazione standard",
        adults: "Adulti",
        adult: "Adulto",
        children: "Bambini",
        child: "Bambino",
        roomOnly: "Solo Pernottamento",
        night: "Notte",
        nights: "Notti",
        stay: "Soggiorno",
        taxesAndFees: "Tasse & Commissioni",
        bookingReferences: "Riferimenti di Prenotazione",
        internalIdentifiers: "Identificativi interni & richieste speciali",
        clientReferenceId: "ID Riferimento Cliente",
        internalReferenceNumber: "Tuo numero di riferimento interno",
        specialRemarks: "Note Particolari",
        enterRemarks: "Eventuali richieste speciali o note",
        instantConfirmation: "Conferma Immediata Disponibile",
        backToRoom: "Torna alla Camera",
        backToSelection: "Torna alla Selezione",
        nextRoom: "Successivo: Camera",
        reviewAndPay: "Verifica & Paga",
        totalStayPrice: "Prezzo Totale Soggiorno (Netto)",
        taxesIncl: "Tasse Incl.",
        b2bRates: "APPLICATE TARIFFE B2B AGENZIA",
        securePayment: "PAGAMENTO SICURO",
        protectedBooking: "Prenotazione Protetta TOG",
        in: "Ingresso",
        out: "Uscita",
        leadGuest: "Ospite Principale (Contatto)",
        traveler: "Ospite",
        standardPolicy: "Politica Adulti Standard",
        childPassenger: "Ospite Bambino",
        age: "Età",
        occupancyInfo: "Informazioni Occupazione",
        rateNotes: "Note Tariffa",
        room: "Camera"
    },
    el: {
        checkIn: "Check-in",
        checkOut: "Check-out",
        nightsStay: "Νύχτες Διαμονής",
        nightStay: "Νύχτα Διαμονής",
        selectedRooms: "Επιλεγμένα Δωμάτια",
        dailyRates: "Καθημερινές Χρεώσεις",
        cancellationPolicy: "Πολιτική Ακύρωσης",
        flexible: "Ευέλικτο",
        cancellationPenalty: "Ρήτρα Ακύρωσης",
        freeCancel: "Δωρεάν Ακύρωση",
        standardCancellation: "Ισχύει η τυπική πολιτική ακύρωσης",
        adults: "Ενήλικες",
        adult: "Ενήλικας",
        children: "Παιδιά",
        child: "Παιδί",
        roomOnly: "Μόνο Δωμάτιο",
        night: "Νύχτα",
        nights: "Νύχτες",
        stay: "Δαμονή",
        taxesAndFees: "Φόροι & Τέλη",
        bookingReferences: "Κωδικοί Αναφοράς Κράτησης",
        internalIdentifiers: "Εσωτερικοί κωδικοί & ειδικά αιτήματα",
        clientReferenceId: "Κωδικός Αναφοράς Πελάτη",
        internalReferenceNumber: "Ο δικός σας εσωτερικός κωδικός",
        specialRemarks: "Ειδικές Παρατηρήσεις",
        enterRemarks: "Ειδικά αιτήματα ή σημειώσεις",
        instantConfirmation: "Άμεσα Επιβεβαιώσιμο",
        backToRoom: "Πίσω στο Δωμάτιο",
        backToSelection: "Πίσω στην Επιλογή",
        nextRoom: "Επόμενο: Δωμάτιο",
        reviewAndPay: "Έλεγχος & Πληρωμή",
        totalStayPrice: "Συνολικό Κόστος Διαμονής (Net)",
        taxesIncl: "Περιλαμβάνονται Φόροι",
        b2bRates: "ΕΦΑΡΜΟΣΤΗΚΑΝ B2B ΤΙΜΕΣ ΚΟΛΕΓΙΟΥ",
        securePayment: "ΑΣΦΑΛΗΣ ΠΛΗΡΩΜΗ",
        protectedBooking: "TOG Προστατευμένη Κράτηση",
        in: "Είσοδος",
        out: "Έξοδος",
        leadGuest: "Κύριος Επισκέπτης (Επαφή)",
        traveler: "Επισκέπτης",
        standardPolicy: "Τυπική Πολιτική Ενηλίκων",
        childPassenger: "Παιδί Επισκέπτης",
        age: "Ηλικία",
        occupancyInfo: "Πληροφορίες Διαμονής",
        rateNotes: "Σημειώσεις Χρέωσης",
        room: "Δωμάτιο"
    },
    pt: {
        checkIn: "Check-in",
        checkOut: "Check-out",
        nightsStay: "Noites de Estadia",
        nightStay: "Noite de Estadia",
        selectedRooms: "Quartos Selecionados",
        dailyRates: "Tarifas Diárias",
        cancellationPolicy: "Política de Cancelamento",
        flexible: "Flexível",
        cancellationPenalty: "Multa de Cancelamento",
        freeCancel: "Cancelamento Grátis",
        standardCancellation: "Aplica-se o cancelamento padrão",
        adults: "Adultos",
        adult: "Adulto",
        children: "Crianças",
        child: "Criança",
        roomOnly: "Apenas Quarto",
        night: "Noite",
        nights: "Noites",
        stay: "Estadia",
        taxesAndFees: "Impostos & Taxas",
        bookingReferences: "Referências de Reserva",
        internalIdentifiers: "Identificadores internos e pedidos especiais",
        clientReferenceId: "ID de Referência do Cliente",
        internalReferenceNumber: "Seu número de referência interno",
        specialRemarks: "Observações Especiais",
        enterRemarks: "Qualquer pedido especial ou nota",
        instantConfirmation: "Confirmação Instantânea Disponível",
        backToRoom: "Voltar para o Quarto",
        backToSelection: "Voltar para a Seleção",
        nextRoom: "Seguinte: Quarto",
        reviewAndPay: "Revisar e Pagar",
        totalStayPrice: "Preço Total Estadia (Neto)",
        taxesIncl: "Impostos Incl.",
        b2bRates: "TARIFAS DE AGÊNCIA B2B APLICADAS",
        securePayment: "PAGAMENTO SEGURO",
        protectedBooking: "Reserva TOG Protegida",
        in: "Entrada",
        out: "Saída",
        leadGuest: "Hóspede Principal (Contato)",
        traveler: "Hóspede",
        standardPolicy: "Política de Adulto Padrão",
        childPassenger: "Hóspede Criança",
        age: "Idade",
        occupancyInfo: "Informações de Ocupação",
        rateNotes: "Notas de Tarifa",
        room: "Quarto"
    }
};

const tSummary = (key, lang = 'tr') => {
    const baseLang = (lang || 'tr').split('-')[0].toLowerCase();
    if (key === 'reservationSummary') {
        const mapping = {
            en: "Reservation Summary",
            tr: "Rezervasyon Özeti",
            ar: "ملخص الحجز",
            es: "Resumen de la Reserva",
            ru: "Детали бронирования",
            zh: "订单汇总",
            ja: "予約内容の概要",
            fa: "خلاصه رزرو",
            fr: "Résumé de la Réservation",
            it: "Riepilogo della Prenotazione",
            el: "Σύνοψη Κράτησης",
            pt: "Resumo da Reserva"
        };
        return mapping[baseLang] || mapping['en'];
    }
    if (key === 'authorizePayment') {
        const mapping = {
            en: "Authorize Payment",
            tr: "Ödemeyi Onayla",
            ar: "تفويض الدفع",
            es: "Autorizar Pago",
            ru: "Подтвердить оплату",
            zh: "授权支付",
            ja: "支払いを承認する",
            fa: "تایید پرداخت",
            fr: "Autoriser le Paiement",
            it: "Autorizza Pagamento",
            el: "Έγκριση Πληρωμής",
            pt: "Autorizar Pagamento"
        };
        return mapping[baseLang] || mapping['en'];
    }
    if (key === 'processing') {
        const mapping = {
            en: "Processing...",
            tr: "İşleniyor...",
            ar: "جاري المعالجة...",
            es: "Procesando...",
            ru: "Обработка...",
            zh: "处理中...",
            ja: "処理中...",
            fa: "در حال پردازش...",
            fr: "Traitement en cours...",
            it: "Elaborazione...",
            el: "Επεξεργασία...",
            pt: "Processando..."
        };
        return mapping[baseLang] || mapping['en'];
    }
    if (key === 'paymentMethod') {
        const mapping = {
            en: "Payment Method", tr: "Ödeme Yöntemi", ar: "طريقة الدفع", es: "Método de Pago", ru: "Способ оплаты", zh: "支付方式", ja: "支払い方法", fa: "روش پرداخت", fr: "Mode de paiement", it: "Metodo di pagamento", el: "Τρόπος Πληρωμής", pt: "Método de Pagamento"
        };
        return mapping[baseLang] || mapping['en'];
    }
    if (key === 'instantSettlement') {
        const mapping = {
            en: "Instant Settlement", tr: "Anında Tahsilat", ar: "تسوية فورية", es: "Liquidación Instantánea", ru: "Мгновенный расчет", zh: "实时结算", ja: "即時決済", fa: "تسویه آنی", fr: "Règlement instantané", it: "Regolamento istantaneo", el: "Άμεσος Διακανονισμός", pt: "Liquidação Instantânea"
        };
        return mapping[baseLang] || mapping['en'];
    }
    if (key === 'creditCard') {
        const mapping = {
            en: "Credit Card", tr: "Kredi Kartı", ar: "بطاقة ائتمان", es: "Tarjeta de Crédito", ru: "Кредитная карта", zh: "信用卡", ja: "クレジットカード", fa: "کارت اعتباری", fr: "Carte de crédit", it: "Carta di credito", el: "Πιστωτική Κάρτα", pt: "Cartão de Crédito"
        };
        return mapping[baseLang] || mapping['en'];
    }
    if (key === 'comingSoon') {
        const mapping = {
            en: "Coming Soon", tr: "Yakında", ar: "قريباً", es: "Próximamente", ru: "Скоро", zh: "即将推出", ja: "近日公開", fa: "به‌زودی", fr: "Bientôt disponible", it: "Prossimamente", el: "Σύντομα κοντά σας", pt: "Em breve"
        };
        return mapping[baseLang] || mapping['en'];
    }
    if (key === 'soon') {
        const mapping = {
            en: "Soon", tr: "Pek Yakında", ar: "قريباً", es: "Pronto", ru: "Скоро", zh: "即将推出", ja: "まもなく", fa: "به‌زودی", fr: "Bientôt", it: "Presto", el: "Σύντομα", pt: "Em breve"
        };
        return mapping[baseLang] || mapping['en'];
    }
    return CHECKOUT_SUMMARY_LOCALES[baseLang]?.[key] || CHECKOUT_SUMMARY_LOCALES['en']?.[key] || key;
};
const CheckoutPayment = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { i18n } = useTranslation();
    const { agencyCurrency, currencySymbolMap } = useAuth();
    const [currentLang, setCurrentLang] = useState(() => {
        const rawLang = i18n.language || localStorage.getItem('language') || 'tr';
        return rawLang.split('-')[0].toLowerCase();
    });

    useEffect(() => {
        const handleLangChange = (lng) => {
            if (lng) {
                setCurrentLang(lng.split('-')[0].toLowerCase());
            }
        };
        i18n.on('languageChanged', handleLangChange);
        return () => {
            i18n.off('languageChanged', handleLangChange);
        };
    }, [i18n]);

    const cl = confirmLocales[currentLang] || confirmLocales['tr'];

    // Pre-populate from location.state if navigating from guests page (instant, no flash)
    const navState = location.state || {};
    const hasNavState = !!(navState.hotel || navState.selectedRooms);

    const [hotel, setHotel] = useState(navState.hotel || null);
    const [, setTotalPrice] = useState(navState.totalPrice || null);
    const [selectedRooms, setSelectedRooms] = useState(navState.selectedRooms || null);
    const [roomState, setRoomState] = useState(navState.roomState || null);
    const [checkInDate, setCheckInDate] = useState(navState.checkInDate || null);
    const [checkOutDate, setCheckOutDate] = useState(navState.checkOutDate || null);
    const [roomsData, setRoomsData] = useState(navState.roomsData || null);
    const [clientReferenceId, setClientReferenceId] = useState(navState.clientReferenceId || '');
    const [remark, setRemark] = useState(navState.remark || '');
    const [rateSearchUuid, setRateSearchUuid] = useState(navState.rateSearchUuid || null);
    const [checkRatesData, setCheckRatesData] = useState(navState.checkRatesData || null);
    const [originalSearch, setOriginalSearch] = useState(navState.originalSearch || '');
    const [hotelSlug, setHotelSlug] = useState(navState.hotelSlug || '');
    const [expireAt, setExpireAt] = useState(navState.expireAt || null);
    
    const [sessionId, setSessionId] = useState(() => {
        const params = new URLSearchParams(window.location.search);
        return params.get('sessionId') || '';
    });
    // Only show loading skeleton if we DON'T have data from navigation state (i.e. direct URL access)
    const [isLoadingSession, setIsLoadingSession] = useState(!hasNavState && !!sessionId);
    const [showConfirmBack, setShowConfirmBack] = useState(false);
    const [pendingStepId, setPendingStepId] = useState(null);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const urlSessionId = params.get('sessionId');

        // Skip fetching if we already have data from navigation state (guests → payment transition)
        if (urlSessionId && !hasNavState) {
            const loadSession = async () => {
                setIsLoadingSession(true);
                try {
                    const session = await hotelService.getCheckoutSession(urlSessionId);
                    if (session && session.success !== false) {
                        setHotel(session.hotel || null);
                        setTotalPrice(session.totalPrice || null);
                        setSelectedRooms(session.selectedRooms || null);
                        setRoomState(session.roomState || null);
                        setCheckInDate(session.checkInDate || null);
                        setCheckOutDate(session.checkOutDate || null);
                        setRoomsData(session.roomsData || null);
                        setClientReferenceId(session.clientReferenceId || '');
                        setRemark(session.remark || '');
                        setRateSearchUuid(session.rateSearchUuid || null);
                        setCheckRatesData(session.checkRatesData || null);
                        setOriginalSearch(session.originalSearch || '');
                        setHotelSlug(session.hotelSlug || '');
                        setExpireAt(session.expireAt || null);
                        setSessionId(urlSessionId);
                    }
                } catch (err) {
                    console.error('Failed to load checkout session in Payment:', err);
                } finally {
                    setIsLoadingSession(false);
                }
            };
            loadSession();
        }
    }, [location.search]);

    // Calculate nights for accurate pricing
    const nights = React.useMemo(() => {
        if (!checkInDate || !checkOutDate) return 1;
        const start = new Date(checkInDate);
        const end = new Date(checkOutDate);
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays || 1;
    }, [checkInDate, checkOutDate]);

    const formattedDates = React.useMemo(() => {
        if (!checkInDate || !checkOutDate) return { start: 'Select Date', end: 'Select Date' };
        const options = { month: 'short', day: 'numeric', year: 'numeric' };
        return {
            start: new Date(checkInDate).toLocaleDateString(currentLang, options),
            end: new Date(checkOutDate).toLocaleDateString(currentLang, options)
        };
    }, [checkInDate, checkOutDate, currentLang]);

    const [isProcessing, setIsProcessing] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState('deposit'); // 'deposit' or 'credit_card'
    const [cardDetails, setCardDetails] = useState({ number: '', holder: '', expiry: '', cvv: '' });
    const [bookingError, setBookingError] = useState(null);

    // Auto-scroll to top on mount
    useLayoutEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const formatCardNumber = (value) => {
        const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
        const matches = v.match(/\d{4,16}/g);
        const match = matches && matches[0] || '';
        const parts = [];
        for (let i = 0, len = match.length; i < len; i += 4) parts.push(match.substring(i, i + 4));
        return parts.length ? parts.join('  ') : value;
    };

    const handleCardInputChange = (e) => {
        let { name, value } = e.target;
        if (name === 'number') value = formatCardNumber(value);
        if (name === 'expiry') {
            value = value.replace(/\D/g, '');
            if (value.length > 2) value = value.substring(0, 2) + ' / ' + value.substring(2, 4);
        }
        setCardDetails(prev => ({ ...prev, [name]: value }));
    };

    const handlePayment = async () => {
        setIsProcessing(true);
        try {
            // Map frontend state to HubBookRequestModel as per exact required structure
            const firstGuest = roomsData[0]?.guests[0];
            const phoneValue = firstGuest?.phone || '';
            const hasPlus = phoneValue.startsWith('+');
            const countryCode = hasPlus ? phoneValue.split(' ')[0] : '+90';
            const phoneNumber = hasPlus ? phoneValue.split(' ').slice(1).join('') : phoneValue.replace(/\D/g, '');

            // Use rateSearchUuid obtained from checkRates call in HotelDetail
            // Fallback: try to extract from rateCode if empty
            let finalRateSearchUuid = rateSearchUuid;
            if (!finalRateSearchUuid && roomsData && roomsData[0]?.hubRateModel?.rateCode) {
                try {
                    const decoded = JSON.parse(atob(roomsData[0].hubRateModel.rateCode));
                    finalRateSearchUuid = decoded.hotelSearchUuid;
                    console.log('Extracted rateSearchUuid from rateCode fallback:', finalRateSearchUuid);
                } catch (e) {
                    console.error('Failed to decode rateCode for fallback UUID:', e);
                }
            }

            const requestBody = {
                contact: {
                    name: firstGuest?.firstName || 'Guest',
                    surname: firstGuest?.lastName || 'User',
                    phoneCountryCode: countryCode,
                    phoneNumber: phoneNumber,
                    email: firstGuest?.email || ''
                },
                rateSearchUuid: finalRateSearchUuid || '',
                rooms: roomsData.map((room, roomIdx) => ({
                    rateCode: room.hubRateModel?.rateCode,
                    occupancies: room.guests.map((guest) => ({
                        roomId: roomIdx + 1, // Sequential room identifier
                        type: guest.type === 'Adult' ? 'ADULT' : 'CHILD',
                        gender: guest.gender === 'male' ? 'MALE' : (guest.gender === 'female' ? 'FEMALE' : 'UNDEFINED'),
                        name: guest.firstName,
                        surname: guest.lastName,
                        birthday: guest.birthDate // "YYYY-MM-DD"
                    }))
                })),
                clientReferenceId: clientReferenceId || '',
                remark: remark || ''
            };

            const response = await hotelService.book(requestBody);

            // Delete session from Redis on successful booking
            if (response && (response.status === 'CONFIRMED' || response.status === 'NEW')) {
                try {
                    const params = new URLSearchParams(window.location.search);
                    const sid = params.get('sessionId');
                    if (sid) {
                        await hotelService.deleteCheckoutSession(sid);
                        console.log('Checkout session deleted successfully:', sid);
                    }
                } catch (e) {
                    console.error('Failed to delete session after booking confirmation:', e);
                }
            }

            navigate('/travel/hotels/checkout/result', {
                state: {
                    ...location.state,
                    totalPrice: grandTotal,
                    displayCurrency: displayCurrency,
                    paymentMethod,
                    cardDetails,
                    bookingResponse: response
                }
            });
        } catch (error) {
            console.error('Booking failed:', error);
            setBookingError(error.response || { message: error.message || 'An error occurred while booking. Please try again.' });
        } finally {
            setIsProcessing(false);
        }
    };



    const decodeHTMLEntities = (text) => {
        if (!text || typeof text !== 'string') return text || '';
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
            .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(dec))
            .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));

        return decoded.replace(/&amp;/g, '&');
    };

    if (isLoadingSession) {
        return (
            <div className="flex-1 bg-white dark:bg-[#202124] text-[#202124] dark:text-white font-roboto min-h-screen flex flex-col">
                <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-20 w-full">
                    {/* Stepper Skeleton */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                        <div className="flex-1 h-12 bg-gray-200 dark:bg-slate-700/60 rounded-xl animate-pulse"></div>
                        <div className="w-32 h-12 bg-gray-200 dark:bg-slate-700/60 rounded-xl animate-pulse"></div>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                        <div className="lg:col-span-7 space-y-6">
                            <div className="max-w-[420px] mx-auto grid grid-cols-2 gap-3">
                                <div className="h-20 bg-gray-200 dark:bg-slate-700/60 rounded-xl animate-pulse"></div>
                                <div className="h-20 bg-gray-200 dark:bg-slate-700/60 rounded-xl animate-pulse"></div>
                            </div>
                            <div className="h-72 bg-gray-200 dark:bg-slate-700/60 rounded-2xl border border-[#dadce0] dark:border-slate-700 animate-pulse"></div>
                        </div>
                        <div className="lg:col-span-5">
                            <div className="h-[480px] bg-gray-200 dark:bg-slate-700/60 rounded-2xl border border-[#dadce0] dark:border-slate-700 animate-pulse"></div>
                        </div>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    if (!hotel) {
        return (
            <div className="flex-1 bg-white dark:bg-[#202124] text-[#202124] dark:text-white flex flex-col font-roboto min-h-screen">
                <main className="flex-1 flex items-center justify-center p-6 py-20">
                    <div className="w-full max-w-lg bg-white dark:bg-[#303134] border border-[#dadce0] dark:border-slate-700 rounded-2xl p-8 text-center shadow-sm">
                        <div className="size-16 bg-[#e8f0fe] dark:bg-slate-700 rounded-full flex items-center justify-center text-[#1a73e8] mx-auto mb-5">
                            <span className="material-symbols-outlined text-3xl">lock_person</span>
                        </div>

                        <h2 className="text-xl font-medium text-[#202124] dark:text-white mb-2">Invalid Checkout Session</h2>
                        <p className="text-xs text-[#5f6368] dark:text-slate-400 font-normal mb-8 leading-relaxed max-w-sm mx-auto">
                            We couldn't find an active checkout for your request. Direct access to the payment page is restricted for your security.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <button
                                onClick={() => navigate('/')}
                                className="px-6 py-2.5 bg-[#1a73e8] hover:bg-[#1557b0] text-white rounded-lg font-medium text-xs shadow-xs transition-colors"
                            >
                                Back to Dashboard
                            </button>
                            <button
                                onClick={() => navigate('/hotels')}
                                className="px-6 py-2.5 bg-white dark:bg-[#303134] border border-[#dadce0] dark:border-slate-600 text-[#3c4043] dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700 rounded-lg font-medium text-xs transition-colors"
                            >
                                Search Hotels
                            </button>
                        </div>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    const hotelName = hotel.names?.tr || hotel.names?.en || hotel.name || 'Hotel';
    const hotelStars = hotel.hotelStar?.star || hotel.stars || 5;
    const hotelAddress = hotel.address ? `${hotel.address.street || ''}, ${hotel.address.cityName || ''}`.replace(/^,\s*/, '').replace(/,\s*$/, '') : (hotel.location || '');
    const hotelImage = hotel.images?.[0]?.url || hotel.image || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80';

    // Use price from checkRatesData if available, otherwise fallback to local calculation
    const checkRate = checkRatesData?.rooms?.[0]?.rates?.[0];
    const grandTotal = checkRatesData?.rooms?.reduce((sum, room) => sum + (room.rates?.[0]?.price?.calculatedAmount || room.rates?.[0]?.price?.totalPaymentAmount || 0), 0) || checkRatesData?.price?.calculatedAmount || checkRatesData?.price?.totalPaymentAmount || ((selectedRooms?.reduce((sum, r) => sum + r.rate, 0) || 0));
    const displayCurrency = checkRate?.price?.currency || checkRatesData?.price?.currency || selectedRooms?.[0]?.currency || agencyCurrency || 'USD';

    const availableFunds = 12450.00;
    const isInsufficientBalance = grandTotal > availableFunds;

    return (
        <div className="flex-1 bg-white dark:bg-[#202124] text-[#202124] dark:text-white font-roboto min-h-screen flex flex-col">
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full flex-1">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div className="flex-1">
                        <CheckoutStepper 
                            currentStep={3} 
                            onStepClick={(stepId) => {
                                const params = new URLSearchParams(window.location.search);
                                const sid = params.get('sessionId');
                                if (stepId === 1) {
                                    setPendingStepId(stepId);
                                    setShowConfirmBack(true);
                                } else if (stepId === 2) {
                                    navigate(`/travel/hotels/checkout/guests?sessionId=${sid}`, { state: location.state });
                                }
                            }}
                        />
                    </div>
                    {expireAt && <CheckoutTimer expireAt={expireAt} />}
                </div>

                <ConfirmationModal 
                    isOpen={showConfirmBack}
                    onClose={() => setShowConfirmBack(false)}
                    onConfirm={() => {
                        const hId = hotelSlug || hotel?.id || hotel?.giataId || hotel?.slug;
                        if (pendingStepId === 1 && hId) {
                            const searchStr = originalSearch || '';
                            navigate(`/travel/hotels/detail/${hId}${searchStr}`, { state: location.state });
                        } else {
                            setShowConfirmBack(false);
                        }
                    }}
                    title={cl.title}
                    message={cl.message}
                    cancelText={cl.cancel}
                    confirmText={cl.confirm}
                />

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    <div className="lg:col-span-7 space-y-6">
                        {/* Google Style Payment Method Selection */}
                        <div className="bg-white dark:bg-[#303134] rounded-2xl border border-[#dadce0] dark:border-slate-700 p-4 shadow-xs">
                            <h2 className="text-xs font-semibold text-[#5f6368] dark:text-slate-400 uppercase tracking-wider mb-3">
                                {tSummary('paymentMethod', currentLang)}
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <button
                                    onClick={() => setPaymentMethod('deposit')}
                                    className={`relative p-3.5 rounded-xl transition-all duration-200 text-left border flex items-center justify-between ${
                                        paymentMethod === 'deposit' 
                                            ? 'bg-[#e8f0fe] dark:bg-[#1a73e8]/20 border-[#1a73e8] shadow-xs' 
                                            : 'bg-white dark:bg-[#303134] border-[#dadce0] dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`size-9 rounded-lg flex items-center justify-center transition-colors ${
                                            paymentMethod === 'deposit' 
                                                ? 'bg-[#1a73e8] text-white' 
                                                : 'bg-gray-100 dark:bg-slate-700 text-[#5f6368] dark:text-slate-400'
                                        }`}>
                                            <span className="material-symbols-outlined text-lg">account_balance_wallet</span>
                                        </div>
                                        <div>
                                            <h3 className={`text-xs font-medium ${paymentMethod === 'deposit' ? 'text-[#1a73e8] dark:text-blue-400' : 'text-[#202124] dark:text-white'}`}>
                                                B2B Deposit
                                            </h3>
                                            <p className="text-[11px] text-[#5f6368] dark:text-slate-400">
                                                {tSummary('instantSettlement', currentLang)}
                                            </p>
                                        </div>
                                    </div>

                                    {paymentMethod === 'deposit' && (
                                        <div className="size-5 bg-[#1a73e8] text-white rounded-full flex items-center justify-center shadow-xs">
                                            <span className="material-symbols-outlined text-xs font-bold">check</span>
                                        </div>
                                    )}
                                </button>

                                <div className="relative p-3.5 rounded-xl text-left border bg-gray-50/70 dark:bg-slate-800/50 border-[#dadce0]/70 dark:border-slate-700/60 opacity-60 cursor-not-allowed select-none flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="size-9 rounded-lg flex items-center justify-center bg-gray-100 dark:bg-slate-700 text-gray-400">
                                            <span className="material-symbols-outlined text-lg">credit_card</span>
                                        </div>
                                        <div>
                                            <h3 className="text-xs font-medium text-gray-500 dark:text-slate-400">
                                                {tSummary('creditCard', currentLang)}
                                            </h3>
                                            <p className="text-[11px] text-gray-400">
                                                {tSummary('comingSoon', currentLang)}
                                            </p>
                                        </div>
                                    </div>
                                    <span className="bg-gray-200 dark:bg-slate-700 text-gray-600 dark:text-slate-300 text-[10px] font-medium px-2 py-0.5 rounded-md">
                                        {tSummary('soon', currentLang)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Card Visual & Form */}
                        {paymentMethod === 'credit_card' ? (
                            <div className="space-y-6 animate-in fade-in duration-300">
                                {/* Credit Card Visual */}
                                <div className="relative h-56 w-full max-w-[400px] mx-auto perspective-1000">
                                    <div className={`relative w-full h-full transition-all duration-700 preserve-3d ${cardDetails.cvvFocused ? 'rotate-y-180' : ''}`}>
                                        {/* FRONT SIDE */}
                                        <div className="absolute inset-0 w-full h-full backface-hidden">
                                            <div className="w-full h-full relative rounded-2xl bg-gradient-to-br from-[#1a73e8] via-[#1557b0] to-[#174ea6] p-7 flex flex-col justify-between overflow-hidden shadow-md text-white">
                                                <div className="flex justify-between items-start relative z-10">
                                                    <div className="flex flex-col gap-1">
                                                        <div className="w-10 h-7 rounded bg-amber-300/80 shadow-xs"></div>
                                                        <p className="text-[10px] font-medium text-white/70 tracking-widest mt-1">TRAVEL OF GLOBE</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-sm font-semibold tracking-wider text-white">B2B CARD</p>
                                                    </div>
                                                </div>

                                                <div className="relative z-10">
                                                    <p className="text-lg font-mono tracking-widest min-h-[30px] flex items-center text-white drop-shadow">
                                                        {cardDetails.number || '••••  ••••  ••••  ••••'}
                                                    </p>
                                                </div>

                                                <div className="flex justify-between items-end relative z-10">
                                                    <div className="max-w-[70%]">
                                                        <p className="text-[9px] font-medium uppercase tracking-wider text-white/70">Card Holder</p>
                                                        <p className="text-xs font-semibold uppercase tracking-wide truncate text-white">
                                                            {cardDetails.holder || 'GUEST NAME'}
                                                        </p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-[9px] font-medium uppercase tracking-wider text-white/70">Expires</p>
                                                        <p className="text-xs font-semibold text-white">{cardDetails.expiry || 'MM / YY'}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* BACK SIDE */}
                                        <div className="absolute inset-0 w-full h-full backface-hidden rotate-y-180">
                                            <div className="w-full h-full relative rounded-2xl bg-slate-800 flex flex-col shadow-md text-white">
                                                <div className="w-full h-10 bg-slate-950 mt-6"></div>
                                                <div className="flex-1 p-6 flex flex-col justify-center">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex-1 h-9 bg-slate-100 rounded flex items-center justify-end px-3">
                                                            <p className="text-slate-900 font-mono font-bold tracking-widest text-sm">{cardDetails.cvv || '•••'}</p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-[10px] font-medium text-slate-400 uppercase">CVV / CVC</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-6 rounded-2xl border border-[#dadce0] dark:border-slate-700 bg-white dark:bg-[#303134] shadow-xs space-y-4 max-w-[420px] mx-auto">
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-[#5f6368] dark:text-slate-400">Card Number</label>
                                        <input
                                            name="number"
                                            maxLength={22}
                                            value={cardDetails.number}
                                            onChange={handleCardInputChange}
                                            onFocus={() => setCardDetails(prev => ({ ...prev, cvvFocused: false }))}
                                            className="w-full bg-white dark:bg-[#303134] border border-[#dadce0] dark:border-slate-600 p-2.5 rounded-lg focus:border-[#1a73e8] focus:ring-1 focus:ring-[#1a73e8] outline-none text-xs font-mono"
                                            placeholder="••••  ••••  ••••  ••••"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-[#5f6368] dark:text-slate-400">Card Holder Name</label>
                                        <input
                                            name="holder"
                                            value={cardDetails.holder}
                                            onChange={handleCardInputChange}
                                            onFocus={() => setCardDetails(prev => ({ ...prev, cvvFocused: false }))}
                                            className="w-full bg-white dark:bg-[#303134] border border-[#dadce0] dark:border-slate-600 p-2.5 rounded-lg focus:border-[#1a73e8] focus:ring-1 focus:ring-[#1a73e8] outline-none text-xs uppercase"
                                            placeholder="FULL NAME AS PRINTED ON CARD"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <label className="text-xs font-medium text-[#5f6368] dark:text-slate-400">Expiry Date</label>
                                            <input
                                                name="expiry"
                                                maxLength={7}
                                                value={cardDetails.expiry}
                                                onChange={handleCardInputChange}
                                                onFocus={() => setCardDetails(prev => ({ ...prev, cvvFocused: false }))}
                                                className="w-full bg-white dark:bg-[#303134] border border-[#dadce0] dark:border-slate-600 p-2.5 rounded-lg focus:border-[#1a73e8] focus:ring-1 focus:ring-[#1a73e8] outline-none text-xs font-mono"
                                                placeholder="MM / YY"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-medium text-[#5f6368] dark:text-slate-400">CVV / CVC</label>
                                            <input
                                                name="cvv"
                                                maxLength={4}
                                                value={cardDetails.cvv}
                                                onChange={handleCardInputChange}
                                                onFocus={() => setCardDetails(prev => ({ ...prev, cvvFocused: true }))}
                                                onBlur={() => setCardDetails(prev => ({ ...prev, cvvFocused: false }))}
                                                type="password"
                                                className="w-full bg-white dark:bg-[#303134] border border-[#dadce0] dark:border-slate-600 p-2.5 rounded-lg focus:border-[#1a73e8] focus:ring-1 focus:ring-[#1a73e8] outline-none text-xs font-mono"
                                                placeholder="•••"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="p-5 rounded-2xl border border-[#dadce0] dark:border-slate-700 bg-white dark:bg-[#303134] shadow-xs" lang={currentLang}>
                                <div className="flex items-center gap-3 mb-4 pb-3 border-b border-[#dadce0] dark:border-slate-700">
                                    <div className="size-9 rounded-lg bg-[#e8f0fe] dark:bg-[#1a73e8]/20 flex items-center justify-center text-[#1a73e8]">
                                        <span className="material-symbols-outlined text-lg">account_balance_wallet</span>
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-semibold text-[#202124] dark:text-white">
                                            {tSummary('corporateDepositAccount', currentLang)}
                                        </h3>
                                        <p className="text-[11px] text-[#5f6368] dark:text-slate-400">
                                            {tSummary('verifiedB2bBalance', currentLang)}
                                        </p>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    {/* Current Balance */}
                                    <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-slate-800/50 border border-[#dadce0] dark:border-slate-700 flex items-center justify-between">
                                        <div>
                                            <p className="text-[11px] font-medium text-[#5f6368] dark:text-slate-400 mb-0.5">{tSummary('availableFunds', currentLang)}</p>
                                            <p className="text-lg font-semibold text-[#202124] dark:text-white">{getCurrencySymbol(displayCurrency, currencySymbolMap)}12,450.00</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[11px] font-medium text-[#5f6368] dark:text-slate-400 mb-0.5">{tSummary('status', currentLang)}</p>
                                            <span className={`px-2.5 py-1 text-[10px] font-medium rounded-md inline-block ${
                                                isInsufficientBalance 
                                                    ? 'bg-[#fce8e6] text-[#d93025]' 
                                                    : 'bg-[#e6f4ea] text-[#137333]'
                                            }`}>
                                                {isInsufficientBalance ? tSummary('insufficientFunds', currentLang) : tSummary('activeReady', currentLang)}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Deduction Card */}
                                    <div className="p-3.5 rounded-xl bg-[#fce8e6]/60 dark:bg-red-950/20 border border-[#fad2cf] dark:border-red-800/40 flex items-center justify-between">
                                        <div>
                                            <p className="text-[11px] font-medium text-[#d93025] mb-0.5">{tSummary('deductionAmount', currentLang)}</p>
                                            <div className="flex items-center gap-1">
                                                <span className="text-lg font-semibold text-[#d93025]">-</span>
                                                <p className="text-lg font-semibold text-[#d93025]">
                                                    {getCurrencySymbol(displayCurrency, currencySymbolMap)} {grandTotal.toFixed(2)}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[11px] font-medium text-[#d93025] mb-0.5">{tSummary('paymentImpact', currentLang)}</p>
                                            <span className="px-2.5 py-1 bg-[#fce8e6] text-[#d93025] text-[10px] font-medium rounded-md inline-block">
                                                {tSummary('balanceDecrease', currentLang)}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Clean Estimated Balance or Warning Card */}
                                    {isInsufficientBalance ? (
                                        <div className="p-3.5 rounded-xl bg-[#fce8e6] dark:bg-red-950/40 text-[#d93025] dark:text-red-200 flex flex-col gap-2 border border-[#fad2cf] dark:border-red-800/50">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-[11px] font-medium text-[#d93025] mb-0.5">{tSummary('deficitAmount', currentLang)}</p>
                                                    <p className="text-lg font-semibold text-[#d93025]">
                                                        - {getCurrencySymbol(displayCurrency, currencySymbolMap)} {(grandTotal - availableFunds).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </p>
                                                </div>
                                                <div className="size-8 rounded-lg bg-[#d93025]/10 text-[#d93025] flex items-center justify-center">
                                                    <span className="material-symbols-outlined text-lg">warning</span>
                                                </div>
                                            </div>
                                            <p className="text-[11px] font-medium text-[#d93025] bg-white/70 dark:bg-slate-900/60 p-2 rounded-lg text-center">
                                                {tSummary('topUpPrompt', currentLang)}
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="p-3.5 rounded-xl bg-[#e6f4ea] dark:bg-emerald-950/20 border border-[#ceead6] dark:border-emerald-800/40 flex items-center justify-between">
                                            <div>
                                                <p className="text-[11px] font-medium text-[#137333] mb-0.5">{tSummary('estimatedNewBalance', currentLang)}</p>
                                                <p className="text-lg font-semibold text-[#137333]">
                                                    {getCurrencySymbol(displayCurrency, currencySymbolMap)} {(availableFunds - grandTotal).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </p>
                                            </div>
                                            <div className="size-8 rounded-lg bg-[#ceead6] dark:bg-emerald-800/40 text-[#137333] flex items-center justify-center">
                                                <span className="material-symbols-outlined text-lg">account_balance</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Google Style Sticky Reservation Summary Sidebar */}
                    <div className="lg:col-span-5 lg:sticky lg:top-6 space-y-4">
                        <div className="bg-white dark:bg-[#303134] rounded-2xl border border-[#dadce0] dark:border-slate-700 shadow-xs overflow-hidden">
                            {/* Card Header Badge */}
                            <div className="p-4 pb-3 border-b border-[#dadce0] dark:border-slate-700">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xs font-semibold text-[#5f6368] dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5" lang={currentLang}>
                                        <span className="material-symbols-outlined text-base text-[#1a73e8]">receipt_long</span>
                                        {tSummary('reservationSummary', currentLang)}
                                    </h3>
                                    <span className="inline-flex items-center gap-1 bg-[#e8f0fe] dark:bg-[#1a73e8]/20 text-[#1a73e8] dark:text-blue-400 text-[10px] font-medium px-2 py-0.5 rounded-full" lang={currentLang}>
                                        <span className="material-symbols-outlined text-xs">bolt</span>
                                        {tSummary('instantConfirmation', currentLang)}
                                    </span>
                                </div>
                            </div>

                            <div className="p-4 space-y-4">
                                {/* Hotel Mini Card */}
                                <div className="rounded-xl overflow-hidden border border-[#dadce0] dark:border-slate-700">
                                    <div className="relative h-28 overflow-hidden bg-gray-100">
                                        <img src={hotelImage} alt={hotelName} className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent"></div>
                                        <div className="absolute bottom-2.5 left-3 right-3 text-white">
                                            <div className="flex items-center gap-0.5 mb-0.5">
                                                {[...Array(hotelStars)].map((_, i) => (
                                                    <span key={i} className="material-symbols-outlined text-xs text-[#fbbc04] fill-1">star</span>
                                                ))}
                                                {hotel.isRecommended && (
                                                    <span className="ml-1.5 bg-[#1a73e8] text-white text-[9px] font-medium px-1.5 py-0.5 rounded">
                                                        REC
                                                    </span>
                                                )}
                                            </div>
                                            <h4 className="font-semibold text-xs leading-tight line-clamp-1">{hotelName}</h4>
                                        </div>
                                    </div>
                                    <div className="p-2.5 bg-gray-50 dark:bg-slate-800/60 space-y-1">
                                        {hotelAddress && (
                                            <div className="flex items-center gap-1 text-[#5f6368] dark:text-slate-400 text-[11px]">
                                                <span className="material-symbols-outlined text-xs text-[#1a73e8] shrink-0">location_on</span>
                                                <span className="truncate">{hotelAddress}</span>
                                            </div>
                                        )}
                                        <div className="flex gap-4 text-[11px] text-[#5f6368] dark:text-slate-400" lang={currentLang}>
                                            <div className="flex items-center gap-1">
                                                <span className="material-symbols-outlined text-xs text-[#1a73e8]">login</span>
                                                <span>{tSummary('in', currentLang)}: {hotel.checkIn || '15:00'}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <span className="material-symbols-outlined text-xs text-[#1a73e8]">logout</span>
                                                <span>{tSummary('out', currentLang)}: {hotel.checkOut || '11:00'}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Booking Dates Pill Grid */}
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-slate-800/50 border border-[#dadce0] dark:border-slate-700">
                                        <p className="text-[10px] text-[#5f6368] dark:text-slate-400 mb-0.5" lang={currentLang}>{tSummary('checkIn', currentLang)}</p>
                                        <p className="font-semibold text-[#1a73e8]">{formattedDates.start}</p>
                                    </div>
                                    <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-slate-800/50 border border-[#dadce0] dark:border-slate-700">
                                        <p className="text-[10px] text-[#5f6368] dark:text-slate-400 mb-0.5" lang={currentLang}>{tSummary('checkOut', currentLang)}</p>
                                        <p className="font-semibold text-[#1a73e8]">{formattedDates.end}</p>
                                    </div>
                                    <div className="col-span-2 p-2.5 rounded-xl bg-gray-50 dark:bg-slate-800/50 border border-[#dadce0] dark:border-slate-700 flex justify-between items-center text-[11px]">
                                        <div className="flex items-center gap-1.5 text-[#3c4043] dark:text-slate-300">
                                            <span className="material-symbols-outlined text-sm text-[#1a73e8]">nights_stay</span>
                                            <span className="font-medium">
                                                {`${nights} ${nights > 1 ? tSummary('nights', currentLang) : tSummary('night', currentLang)} ${tSummary('stay', currentLang)}`}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-[#3c4043] dark:text-slate-300">
                                            <span className="material-symbols-outlined text-sm text-[#1a73e8]">group</span>
                                            <span className="font-medium">
                                                {(() => {
                                                    const adultsCount = (checkRatesData?.rooms?.[0]?.rates?.[0]?.occupancy || checkRatesData?.occupancy)?.adults || roomState?.reduce((s, r) => s + r.adults, 0) || 0;
                                                    const childrenCount = (checkRatesData?.rooms?.[0]?.rates?.[0]?.occupancy || checkRatesData?.occupancy)?.child || roomState?.reduce((s, r) => s + r.children, 0) || 0;
                                                    const adultsLabel = adultsCount > 1 ? tSummary('adults', currentLang) : tSummary('adult', currentLang);
                                                    const childrenLabel = childrenCount > 1 ? tSummary('children', currentLang) : tSummary('child', currentLang);
                                                    return `${adultsCount} ${adultsLabel}${childrenCount > 0 ? `, ${childrenCount} ${childrenLabel}` : ''}`;
                                                })()}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Room Breakdown */}
                                <div className="space-y-2.5">
                                    <p className="text-xs font-semibold text-[#5f6368] dark:text-slate-400 uppercase tracking-wider" lang={currentLang}>{tSummary('selectedRooms', currentLang)}</p>
                                    {selectedRooms?.map((room, idx) => {
                                        const policies = room.cancellationPolicies || [];
                                        return (
                                            <div key={idx} className="p-3 rounded-xl bg-gray-50 dark:bg-slate-800/40 border border-[#dadce0] dark:border-slate-700 text-xs">
                                                <div className="flex justify-between items-start gap-2 mb-2">
                                                    <div className="flex items-start gap-2 flex-1">
                                                        <div className="size-5 rounded bg-[#e8f0fe] dark:bg-[#1a73e8]/20 flex items-center justify-center text-[10px] font-semibold text-[#1a73e8] shrink-0 mt-0.5">
                                                            {idx + 1}
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-[#202124] dark:text-white line-clamp-2">{room.name}</p>
                                                            <div className="flex flex-wrap gap-1.5 mt-1" lang={currentLang}>
                                                                <span className="text-[10px] text-[#5f6368] dark:text-slate-400">
                                                                    {checkRatesData?.rooms?.[idx]?.rates?.[0]?.boardName === 'RO' || !checkRatesData?.rooms?.[idx]?.rates?.[0]?.boardName || checkRatesData?.rooms?.[idx]?.rates?.[0]?.boardName === 'Room Only' ? tSummary('roomOnly', currentLang) : checkRatesData?.rooms?.[idx]?.rates?.[0]?.boardName}
                                                                </span>
                                                                {(() => {
                                                                    const refundable = checkRatesData?.rooms?.[idx]?.rates?.[0]?.refundable;
                                                                    if (refundable === undefined) return null;
                                                                    return (
                                                                        <RefundPolicyTooltip
                                                                            isRefundable={refundable}
                                                                            className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${refundable ? 'bg-[#e6f4ea] text-[#137333]' : 'bg-[#fce8e6] text-[#d93025]'}`}
                                                                        />
                                                                    );
                                                                })()}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="text-right shrink-0">
                                                        <div className="font-semibold text-xs text-[#1a73e8]">
                                                            {getCurrencySymbol(displayCurrency, currencySymbolMap)} {(checkRatesData?.rooms?.[idx]?.rates?.[0]?.price?.calculatedAmount || checkRatesData?.rooms?.[idx]?.rates?.[0]?.price?.totalPaymentAmount || room.rate).toFixed(2)}
                                                        </div>
                                                        <p className="text-[10px] text-[#5f6368] dark:text-slate-400">{displayCurrency} · {nights} {nights > 1 ? tSummary('nights', currentLang) : tSummary('night', currentLang)}</p>
                                                    </div>
                                                </div>

                                                {/* Cancellation policy */}
                                                <div className="pt-2 border-t border-gray-200 dark:border-slate-700/60" lang={currentLang}>
                                                    {(() => {
                                                        const currentPolicies = checkRatesData?.rooms?.[idx]?.rates?.[0]?.price?.cancellationPolicies || policies;
                                                        if (!currentPolicies || currentPolicies.length === 0) {
                                                            return (
                                                                <span className="text-[10px] text-[#5f6368] dark:text-slate-400 flex items-center gap-1">
                                                                    <span className="material-symbols-outlined text-xs">info</span>
                                                                    {tSummary('standardCancellation', currentLang)}
                                                                </span>
                                                            );
                                                        }
                                                        return (
                                                            <div className="space-y-1">
                                                                <p className="text-[10px] font-medium text-[#5f6368] dark:text-slate-400 mb-0.5">{tSummary('cancellationPolicy', currentLang)}</p>
                                                                {currentPolicies.map((policy, pIdx) => (
                                                                    <div key={pIdx} className="flex justify-between items-center text-[10px]">
                                                                        <span className="text-[#5f6368] dark:text-slate-400">
                                                                            {policy.fromDate 
                                                                                ? (policy.fromDate.includes('[') 
                                                                                    ? new Date(policy.fromDate.split('[')[0]).toLocaleDateString(currentLang, { day: '2-digit', month: 'short', year: 'numeric' })
                                                                                    : new Date(policy.fromDate).toLocaleDateString(currentLang, { day: '2-digit', month: 'short', year: 'numeric' }))
                                                                                : (policy.amount === 0 ? tSummary('flexible', currentLang) : tSummary('cancellationPenalty', currentLang))
                                                                            }
                                                                        </span>
                                                                        <span className={`font-medium px-1.5 py-0.2 rounded ${
                                                                            policy.amount === 0
                                                                                ? 'bg-[#e6f4ea] text-[#137333]'
                                                                                : 'bg-orange-50 dark:bg-orange-950/30 text-orange-600'
                                                                        }`}>
                                                                            {policy.amount === 0 ? tSummary('freeCancel', currentLang) : `${getCurrencySymbol(policy.currency || displayCurrency, currencySymbolMap)} ${policy.amount.toFixed(2)}`}
                                                                        </span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        );
                                                    })()}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Rate Notes */}
                                {checkRatesData?.notes && checkRatesData.notes.length > 0 && (
                                    <div className="p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 text-xs" lang={currentLang}>
                                        <p className="text-[10px] font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                                            <span className="material-symbols-outlined text-xs">info</span>
                                            {tSummary('rateNotes', currentLang)}
                                        </p>
                                        <div 
                                            className="text-[11px] text-[#3c4043] dark:text-slate-300 space-y-1 max-h-32 overflow-y-auto pr-2 custom-scrollbar html-content"
                                            dangerouslySetInnerHTML={{ __html: decodeHTMLEntities(checkRatesData.notes.join('<br/>')) }}
                                        />
                                    </div>
                                )}

                                {/* Grand Total Card */}
                                <div className="pt-3 border-t border-[#dadce0] dark:border-slate-700" lang={currentLang}>
                                    <div className="flex items-center justify-between mb-1">
                                        <p className="text-xs font-semibold text-[#5f6368] dark:text-slate-400 uppercase tracking-wider">{tSummary('totalStayPrice', currentLang)}</p>
                                        <div className="text-right">
                                            <div className="flex items-baseline justify-end gap-1">
                                                <span className="text-lg font-bold text-[#1a73e8]">{getCurrencySymbol(displayCurrency, currencySymbolMap)}</span>
                                                <span className="text-2xl font-bold text-[#1a73e8]">{grandTotal.toFixed(2)}</span>
                                            </div>
                                            <p className="text-[10px] text-[#5f6368] dark:text-slate-400">{displayCurrency} · {tSummary('taxesIncl', currentLang)}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Authorize Payment Button */}
                                <button
                                    onClick={handlePayment}
                                    disabled={isProcessing || (paymentMethod === 'credit_card' && (!cardDetails.number || !cardDetails.holder || !cardDetails.expiry || !cardDetails.cvv))}
                                    className={`w-full py-3 bg-[#1a73e8] hover:bg-[#1557b0] text-white rounded-xl font-medium text-xs shadow-xs transition-colors flex items-center justify-center gap-2 ${
                                        isProcessing || (paymentMethod === 'credit_card' && (!cardDetails.number || !cardDetails.holder || !cardDetails.expiry || !cardDetails.cvv)) 
                                            ? 'opacity-50 cursor-not-allowed' 
                                            : ''
                                    }`}
                                    lang={currentLang}
                                >
                                    {isProcessing ? (
                                        <>
                                            <div className="size-4 rounded-full border-2 border-white/30 border-t-white animate-spin"></div>
                                            <span>{tSummary('processing', currentLang)}</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>{tSummary('authorizePayment', currentLang)}</span>
                                            <span className="material-symbols-outlined text-sm">lock</span>
                                        </>
                                    )}
                                </button>

                                <p className="text-[10px] text-center text-[#5f6368] dark:text-slate-400 font-medium" lang={currentLang}>
                                    {tSummary('b2bRates', currentLang)}
                                </p>
                            </div>
                        </div>

                        {/* Security Badge */}
                        <div className="bg-white dark:bg-[#303134] border border-[#dadce0] dark:border-slate-700 rounded-xl p-3 flex items-center gap-3" lang={currentLang}>
                            <div className="size-8 rounded-lg bg-[#e8f0fe] dark:bg-[#1a73e8]/20 flex items-center justify-center text-[#1a73e8] shrink-0">
                                <span className="material-symbols-outlined text-base">verified_user</span>
                            </div>
                            <div>
                                <p className="text-[10px] font-semibold text-[#5f6368] dark:text-slate-400 uppercase tracking-wider">{tSummary('securePayment', currentLang)}</p>
                                <p className="text-xs font-medium text-[#202124] dark:text-white">{tSummary('protectedBooking', currentLang)}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
            <style jsx="true">{`
                .html-content ul {
                    list-style-type: disc;
                    margin-left: 1.25rem;
                    margin-top: 0.5rem;
                    margin-bottom: 0.5rem;
                }
                .html-content li {
                    margin-bottom: 0.25rem;
                }
                .html-content p {
                    margin-bottom: 0.5rem;
                }
            `}</style>

            {/* Google Style Professional Booking Error Modal */}
            {bookingError && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
                    <div className="w-full max-w-lg bg-white dark:bg-[#303134] border border-[#dadce0] dark:border-slate-700 rounded-2xl p-6 text-left shadow-xl">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                                <div className="size-10 rounded-full bg-[#fce8e6] text-[#d93025] flex items-center justify-center">
                                    <span className="material-symbols-outlined text-xl">error</span>
                                </div>
                                <div>
                                    <h2 className="text-base font-semibold text-[#202124] dark:text-white">
                                        Booking Issue
                                    </h2>
                                    <p className="text-[11px] font-medium text-[#d93025]">
                                        {bookingError.errorCode || 'Action Required'}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setBookingError(null)}
                                className="size-8 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center justify-center text-[#5f6368] dark:text-slate-400 transition-colors"
                            >
                                <span className="material-symbols-outlined text-lg">close</span>
                            </button>
                        </div>

                        {/* Main message */}
                        <div className="p-3.5 bg-[#fce8e6]/60 dark:bg-red-950/20 rounded-xl border border-[#fad2cf] dark:border-red-800/30 mb-4 max-h-[160px] overflow-y-auto custom-scrollbar">
                            <p className="text-xs text-[#3c4043] dark:text-red-200 leading-relaxed break-words">
                                {bookingError.message || 'We encountered a problem processing your request. Please check the details or try again.'}
                            </p>
                        </div>

                        {/* Supplementary technical details if available */}
                        {(bookingError.timestamp || bookingError.requestId) && (
                            <div className="p-3 bg-gray-50 dark:bg-slate-800/40 rounded-xl border border-[#dadce0] dark:border-slate-700 mb-5 space-y-2 text-xs">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                                    {bookingError.timestamp && (
                                        <div>
                                            <p className="text-gray-400 uppercase font-medium">Time</p>
                                            <p className="text-[#3c4043] dark:text-slate-300 font-medium truncate">{new Date(bookingError.timestamp).toLocaleString(localStorage.getItem('language') || 'tr')}</p>
                                        </div>
                                    )}
                                    {bookingError.requestId && (
                                        <div>
                                            <p className="text-gray-400 uppercase font-medium">Request ID</p>
                                            <p className="text-[#3c4043] dark:text-slate-300 font-mono font-medium truncate select-all">{bookingError.requestId}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="flex flex-col sm:flex-row gap-2.5 justify-end">
                            {(bookingError.message?.toLowerCase().includes('expired') || bookingError.message?.toLowerCase().includes('yeni bir arama')) && (
                                <button
                                    onClick={() => navigate('/')}
                                    className="px-5 py-2 bg-gray-100 dark:bg-slate-700 text-[#3c4043] dark:text-slate-200 rounded-lg font-medium text-xs hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors flex items-center justify-center gap-1.5"
                                >
                                    <span className="material-symbols-outlined text-sm">search</span> New Search
                                </button>
                            )}
                            <button
                                onClick={() => setBookingError(null)}
                                className="px-5 py-2 bg-[#1a73e8] hover:bg-[#1557b0] text-white rounded-lg font-medium text-xs shadow-xs transition-colors flex items-center justify-center gap-1.5"
                            >
                                Dismiss <span className="material-symbols-outlined text-sm">check</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CheckoutPayment;
