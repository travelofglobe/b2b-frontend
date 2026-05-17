import React, { useState, useLayoutEffect, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { hotelService } from '../services/hotelService';
import { useToast } from '../context/ToastContext';
import CheckoutStepper from '../components/CheckoutStepper';
import ConfirmationModal from '../components/ConfirmationModal';
import CheckoutTimer from '../components/CheckoutTimer';
import RefundPolicyTooltip from '../components/RefundPolicyTooltip';

const confirmLocales = {
    en: {
        title: "Are you sure?",
        message: "If you return to room selection, all entered guest details will be lost."
    },
    tr: {
        title: "Emin misiniz?",
        message: "Oda seçimine geri dönerseniz girdiğiniz tüm konuk bilgileri silinecektir."
    },
    ar: {
        title: "هل أنت متأكد؟",
        message: "إذا عدت إلى اختيار الغرفة، فستفقد جميع تفاصيل النزلاء التي تم إدخالها."
    },
    es: {
        title: "¿Está seguro?",
        message: "Si regresa a la selección de habitación, se perderán todos los datos ingresados de los huéspedes."
    },
    ru: {
        title: "Вы уверены?",
        message: "Если вы вернетесь к выбору номера, все введенные данные гостей будут утеряны."
    },
    zh: {
        title: "您确定吗？",
        message: "如果您返回选择客房，所有已输入的旅客信息都将丢失。"
    },
    ja: {
        title: "よろしいですか？",
        message: "客室選択に戻ると、入力されたすべての宿泊者情報が失われます。"
    },
    fa: {
        title: "آیا مطمئن هستید؟",
        message: "در صورت بازگشت به انتخاب اتاق، تمام اطلاعات وارد شده مهمانان پاک خواهد شد."
    },
    fr: {
        title: "Êtes-vous sûr ?",
        message: "Si vous retournez au choix de la chambre, toutes les coordonnées des voyageurs saisies seront perdues."
    },
    it: {
        title: "Sei sicuro?",
        message: "Se torni alla scelta della camera, tutti i dettagli degli ospiti inseriti andranno persi."
    },
    el: {
        title: "Είστε σίγουροι;",
        message: "Εάν επιστρέψετε στην επιλογή δωματίου, όλα τα στοιχεία επισκεπτών που καταχωρίσατε θα χαθούν."
    },
    pt: {
        title: "Tem certeza?",
        message: "Se você retornar à seleção de quartos, todos os detalhes do hóspede inseridos serão perdidos."
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
        return mapping[lang] || mapping['en'];
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
        return mapping[lang] || mapping['en'];
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
        return mapping[lang] || mapping['en'];
    }
    return CHECKOUT_SUMMARY_LOCALES[lang]?.[key] || CHECKOUT_SUMMARY_LOCALES['en']?.[key] || key;
};
const CheckoutPayment = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { i18n } = useTranslation();
    const currentLang = i18n.language || localStorage.getItem('language') || 'tr';
    const cl = confirmLocales[currentLang] || confirmLocales['tr'];

    // Pre-populate from location.state if navigating from guests page (instant, no flash)
    const navState = location.state || {};
    const hasNavState = !!(navState.hotel || navState.selectedRooms);

    const [hotel, setHotel] = useState(navState.hotel || null);
    const [totalPrice, setTotalPrice] = useState(navState.totalPrice || null);
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

    const { error: toastError } = useToast();

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
        const currentLang = localStorage.getItem('language') || 'tr';
        return {
            start: new Date(checkInDate).toLocaleDateString(currentLang, options),
            end: new Date(checkOutDate).toLocaleDateString(currentLang, options)
        };
    }, [checkInDate, checkOutDate]);

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
                    occupancies: room.guests.map((guest, guestIdx) => ({
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

            navigate('/hotel/checkout/result', {
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

    const getCurrencySymbol = (code) => {
        const symbols = { 'USD': '$', 'EUR': '€', 'GBP': '£', 'TRY': '₺', 'AED': 'د.إ', 'SAR': 'ر.س', 'JPY': '¥', 'CHF': 'Fr', 'CAD': 'CA$', 'AUD': 'A$' };
        return symbols[code] || code || '$';
    };

    const decodeHTMLEntities = (text) => {
        if (!text) return '';
        const textArea = document.createElement('textarea');
        textArea.innerHTML = text;
        return textArea.value;
    };

    if (isLoadingSession) {
        return (
            <div className="min-h-screen bg-background-light dark:bg-background-dark text-slate-900 dark:text-white font-sans">
                <Header />
                <main className="max-w-7xl mx-auto px-6 pt-6 pb-20 w-full">
                    {/* Stepper Skeleton */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                        <div className="flex-1 h-12 bg-slate-200/50 dark:bg-slate-800/50 rounded-2xl animate-pulse"></div>
                        <div className="w-32 h-12 bg-slate-200/50 dark:bg-slate-800/50 rounded-2xl animate-pulse"></div>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
                        <div className="lg:col-span-8 space-y-6">
                            <div className="max-w-[420px] mx-auto grid grid-cols-2 gap-4">
                                <div className="h-32 bg-slate-200/50 dark:bg-slate-800/50 rounded-3xl animate-pulse"></div>
                                <div className="h-32 bg-slate-200/50 dark:bg-slate-800/50 rounded-3xl animate-pulse"></div>
                            </div>
                            <div className="h-80 bg-slate-200/40 dark:bg-slate-800/40 rounded-[40px] border border-slate-200/50 dark:border-slate-700/50 animate-pulse"></div>
                        </div>
                        <div className="lg:col-span-4">
                            <div className="h-[480px] bg-slate-200/40 dark:bg-slate-800/40 rounded-[40px] border border-slate-200/50 dark:border-slate-700/50 animate-pulse"></div>
                        </div>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    if (!hotel) {
        return (
            <div className="min-h-screen bg-background-light dark:bg-background-dark text-slate-900 dark:text-white flex flex-col font-sans">
                <Header />
                <main className="flex-1 flex items-center justify-center p-6 pt-32 pb-20">
                    <div className="w-full max-w-xl relative group">
                        {/* Glow effect */}
                        <div className="absolute -inset-1 bg-gradient-to-r from-primary/30 via-purple-500/30 to-primary/30 rounded-[40px] blur-2xl opacity-100 transition-opacity duration-500"></div>

                        <div className="relative bg-white/60 dark:bg-slate-900/60 backdrop-blur-3xl border border-white/40 dark:border-white/10 rounded-[40px] p-12 text-center shadow-2xl overflow-hidden">
                            {/* Decorative background icon */}
                            <div className="absolute -top-10 -right-10 opacity-5 pointer-events-none">
                                <span className="material-symbols-outlined text-[200px]">lock_reset</span>
                            </div>

                            <div className="size-24 bg-primary/10 rounded-3xl flex items-center justify-center text-primary mx-auto mb-8 shadow-inner">
                                <span className="material-symbols-outlined text-5xl">lock_person</span>
                            </div>

                            <h2 className="text-3xl font-black uppercase tracking-tight mb-4 text-slate-900 dark:text-white">Invalid Checkout Session</h2>
                            <p className="text-slate-500 dark:text-slate-400 font-medium mb-10 leading-relaxed max-w-sm mx-auto">
                                We couldn't find an active checkout for your request. Direct access to the payment page is restricted for your security.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <button
                                    onClick={() => navigate('/')}
                                    className="px-8 py-4 bg-primary text-white rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                                >
                                    Back to Dashboard
                                </button>
                                <button
                                    onClick={() => navigate('/hotels')}
                                    className="px-8 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm"
                                >
                                    Search Hotels
                                </button>
                            </div>
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
    const grandTotal = checkRatesData?.rooms?.reduce((sum, room) => sum + (room.rates?.[0]?.price?.totalPaymentAmount || 0), 0) || checkRatesData?.price?.totalPaymentAmount || ((selectedRooms?.reduce((sum, r) => sum + r.rate, 0) || 0));
    const displayCurrency = checkRate?.price?.currency || checkRatesData?.price?.currency || selectedRooms?.[0]?.currency || '$';

    const availableFunds = 12450.00;
    const isInsufficientBalance = grandTotal > availableFunds;

    return (
        <div className="min-h-screen bg-background-light dark:bg-background-dark text-slate-900 dark:text-white font-sans">
            <Header />
            <main className="max-w-7xl mx-auto px-6 pt-6 pb-20">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
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
                                    navigate(`/hotel/checkout/guests?sessionId=${sid}`, { state: location.state });
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
                            navigate(`/hotel/${hId}${searchStr}`, { state: location.state });
                        } else {
                            setShowConfirmBack(false);
                        }
                    }}
                    title={cl.title}
                    message={cl.message}
                />

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    <div className="lg:col-span-8 space-y-8">
                        {/* Refined Payment Method Selection - More prominent */}
                        <div className="max-w-[420px] mx-auto">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <button
                                    onClick={() => setPaymentMethod('deposit')}
                                    className={`relative p-5 rounded-[24px] transition-all duration-500 text-left group overflow-hidden border backdrop-blur-3xl ${paymentMethod === 'deposit' ? 'bg-primary/[0.04] border-primary/20 shadow-[0_20px_80px_-20px_rgba(255,59,92,0.25)] scale-[1.01]' : 'bg-white/60 dark:bg-slate-900/60 border-white/40 dark:border-white/5 shadow-lg shadow-slate-200/50 dark:shadow-black/50 hover:bg-white/80 dark:hover:bg-slate-900/80'}`}
                                >
                                    {/* Subtle Shading Overlays */}
                                    <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white/20 to-transparent pointer-events-none"></div>

                                    {/* Floating Background Icon - More subtle */}
                                    <div className={`absolute -top-6 -right-6 transition-all duration-1000 ${paymentMethod === 'deposit' ? 'text-primary opacity-[0.06] scale-150 rotate-12 blur-[2px]' : 'text-slate-300 dark:text-slate-700 opacity-[0.02]'}`}>
                                        <span className="material-symbols-outlined text-[120px] select-none">account_balance_wallet</span>
                                    </div>

                                    <div className={`size-10 rounded-xl mb-6 flex items-center justify-center transition-all duration-500 ${paymentMethod === 'deposit' ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                                        <span className="material-symbols-outlined text-xl">account_balance_wallet</span>
                                    </div>

                                    <div className="relative z-10">
                                        <h3 className={`text-base font-black uppercase tracking-tight mb-0.5 ${paymentMethod === 'deposit' ? 'text-primary' : 'text-slate-900 dark:text-white'}`}>
                                            B2B Deposit
                                        </h3>
                                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest opacity-60">
                                            Instant Settlement
                                        </p>
                                    </div>

                                    {paymentMethod === 'deposit' && (
                                        <div className="absolute top-6 right-6 size-5 bg-primary text-white rounded-full flex items-center justify-center animate-in zoom-in duration-500 shadow-md ring-2 ring-white dark:ring-slate-900">
                                            <span className="material-symbols-outlined text-[10px] font-black">check</span>
                                        </div>
                                    )}
                                </button>

                                <div className="relative p-5 rounded-[24px] text-left overflow-hidden border backdrop-blur-3xl bg-white/40 dark:bg-slate-900/40 border-slate-200/60 dark:border-white/5 shadow-lg opacity-60 cursor-not-allowed select-none">
                                    {/* Subtle Shading Overlays */}
                                    <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white/20 to-transparent pointer-events-none"></div>

                                    {/* Diagonal "Coming Soon" ribbon */}
                                    <div className="absolute top-4 right-4 z-20">
                                        <span className="flex items-center gap-1 bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 text-[8px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest border border-slate-300 dark:border-slate-600">
                                            <span className="material-symbols-outlined text-[10px]">schedule</span>
                                            Soon
                                        </span>
                                    </div>

                                    {/* Floating Background Icon */}
                                    <div className="absolute -top-6 -right-6 text-slate-300 dark:text-slate-700 opacity-[0.04]">
                                        <span className="material-symbols-outlined text-[120px] select-none">credit_card</span>
                                    </div>

                                    <div className="size-10 rounded-xl mb-6 flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-400">
                                        <span className="material-symbols-outlined text-xl">credit_card</span>
                                    </div>

                                    <div className="relative z-10">
                                        <h3 className="text-base font-black uppercase tracking-tight mb-0.5 text-slate-400 dark:text-slate-500">
                                            Credit Card
                                        </h3>
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest opacity-60">
                                            Coming Soon
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Card Visual & Form */}
                        {paymentMethod === 'credit_card' ? (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                                {/* Enhanced Credit Card Visual with Flip Animation */}
                                <div className="relative h-64 w-full max-w-[420px] mx-auto perspective-1000 group">
                                    <div className={`relative w-full h-full transition-all duration-700 preserve-3d ${cardDetails.cvvFocused ? 'rotate-y-180' : ''}`}>

                                        {/* Glow effects */}
                                        <div className="absolute -inset-4 bg-gradient-to-br from-primary/30 via-purple-500/30 to-blue-500/30 rounded-[40px] blur-3xl opacity-50 group-hover:opacity-100 transition-opacity duration-700"></div>

                                        {/* FRONT SIDE */}
                                        <div className="absolute inset-0 w-full h-full backface-hidden">
                                            <div className="w-full h-full relative rounded-[32px] bg-gradient-to-br from-slate-800 via-slate-900 to-black p-10 flex flex-col justify-between overflow-hidden shadow-2xl border border-white/10">
                                                {/* Glassmorphism overlays */}
                                                <div className="absolute top-0 right-0 w-1/2 h-full bg-white/5 skew-x-[-20deg] translate-x-1/2 pointer-events-none"></div>
                                                <div className="absolute -bottom-20 -left-20 size-64 bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>

                                                <div className="flex justify-between items-start relative z-10">
                                                    <div className="flex flex-col gap-1">
                                                        <div className="size-14 rounded-xl bg-gradient-to-br from-yellow-400 via-yellow-200 to-yellow-600 shadow-[0_0_20px_rgba(234,179,8,0.3)] relative overflow-hidden">
                                                            <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                                                            {/* Simple chip lines */}
                                                            <div className="absolute inset-x-2 top-4 h-px bg-black/20"></div>
                                                            <div className="absolute inset-x-2 top-7 h-px bg-black/20"></div>
                                                            <div className="absolute inset-x-2 top-10 h-px bg-black/20"></div>
                                                            <div className="absolute inset-y-2 left-4 w-px bg-black/20"></div>
                                                            <div className="absolute inset-y-2 left-7 w-px bg-black/20"></div>
                                                            <div className="absolute inset-y-2 left-10 w-px bg-black/20"></div>
                                                        </div>
                                                        <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mt-2">Global Reserve</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white via-white/80 to-white/40">PREMIUM PLATINUM</p>
                                                        <div className="flex justify-end gap-1 mt-1">
                                                            <div className="size-2 rounded-full bg-primary/80"></div>
                                                            <div className="size-2 rounded-full bg-white/20"></div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="relative z-10">
                                                    <p className="text-xl font-black tracking-[0.15em] min-h-[40px] flex items-center text-white drop-shadow-lg whitespace-nowrap">
                                                        {cardDetails.number || '••••  ••••  ••••  ••••'}
                                                    </p>
                                                </div>

                                                <div className="flex justify-between items-end relative z-10">
                                                    <div className="max-w-[70%]">
                                                        <p className="text-[8px] font-black uppercase tracking-widest text-slate-500 mb-1">Card Holder</p>
                                                        <p className="text-base font-black uppercase tracking-wider truncate text-white/90">
                                                            {cardDetails.holder || 'GUEST NAME'}
                                                        </p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-[8px] font-black uppercase tracking-widest text-slate-500 mb-1">Expires</p>
                                                        <p className="text-base font-black text-white/90">{cardDetails.expiry || 'MM / YY'}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* BACK SIDE */}
                                        <div className="absolute inset-0 w-full h-full backface-hidden rotate-y-180">
                                            <div className="w-full h-full relative rounded-[32px] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 flex flex-col shadow-2xl border border-white/10">
                                                <div className="w-full h-14 bg-black mt-10"></div>
                                                <div className="flex-1 p-10 flex flex-col justify-center">
                                                    <div className="flex items-center gap-4">
                                                        <div className="flex-1 h-12 bg-slate-200/90 rounded-lg flex items-center justify-end px-4 overflow-hidden relative">
                                                            {/* Security pattern lines */}
                                                            <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #000 0, #000 1px, transparent 0, transparent 50%)', backgroundSize: '8px 8px' }}></div>
                                                            <p className="text-black font-black italic tracking-widest relative z-10 text-lg">{cardDetails.cvv || '•••'}</p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">CVV / CVC Code</p>
                                                            <p className="text-[8px] font-medium text-white/20 uppercase mt-1 leading-tight max-w-[80px]">AUTHORIZED SIGNATURE NOT TRANSFERABLE</p>
                                                        </div>
                                                    </div>
                                                    <div className="mt-8 flex justify-between items-center opacity-30">
                                                        <div className="flex gap-2 text-white">
                                                            <span className="material-symbols-outlined">wifi_tethering</span>
                                                            <span className="material-symbols-outlined">lock_person</span>
                                                        </div>
                                                        <p className="text-[10px] font-black text-white uppercase tracking-widest italic font-serif">TOG BANK</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-10 rounded-[40px] border border-white/40 dark:border-white/10 bg-white/60 dark:bg-slate-900/60 backdrop-blur-3xl shadow-xl space-y-6 max-w-[420px] mx-auto">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Card Number</label>
                                        <input
                                            name="number"
                                            maxLength={22}
                                            value={cardDetails.number}
                                            onChange={handleCardInputChange}
                                            onFocus={() => setCardDetails(prev => ({ ...prev, cvvFocused: false }))}
                                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4 rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none transition-all font-black tracking-[0.2em]"
                                            placeholder="••••  ••••  ••••  ••••"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Card Holder Name</label>
                                        <input
                                            name="holder"
                                            value={cardDetails.holder}
                                            onChange={handleCardInputChange}
                                            onFocus={() => setCardDetails(prev => ({ ...prev, cvvFocused: false }))}
                                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4 rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none transition-all font-bold uppercase tracking-tight"
                                            placeholder="FULL NAME AS PRINTED ON CARD"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Expiry Date</label>
                                            <input
                                                name="expiry"
                                                maxLength={7}
                                                value={cardDetails.expiry}
                                                onChange={handleCardInputChange}
                                                onFocus={() => setCardDetails(prev => ({ ...prev, cvvFocused: false }))}
                                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4 rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none transition-all font-black tracking-widest"
                                                placeholder="MM / YY"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">CVV / CVC</label>
                                            <input
                                                name="cvv"
                                                maxLength={4}
                                                value={cardDetails.cvv}
                                                onChange={handleCardInputChange}
                                                onFocus={() => setCardDetails(prev => ({ ...prev, cvvFocused: true }))}
                                                onBlur={() => setCardDetails(prev => ({ ...prev, cvvFocused: false }))}
                                                type="password"
                                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4 rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none transition-all font-black tracking-[0.5em]"
                                                placeholder="•••"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="p-10 rounded-[40px] border border-white/40 dark:border-white/10 bg-white/60 dark:bg-slate-900/60 backdrop-blur-3xl shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-700" lang={currentLang === 'tr' ? 'tr' : 'en'}>
                                <div className="flex items-center gap-6 mb-8">
                                    <div className="size-20 rounded-[28px] bg-primary/10 flex items-center justify-center text-primary"><span className="material-symbols-outlined text-4xl">account_balance_wallet</span></div>
                                    <div><h3 className="text-xl font-black uppercase tracking-tight mb-1">{tSummary('corporateDepositAccount', currentLang)}</h3><p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{tSummary('verifiedB2bBalance', currentLang)}</p></div>
                                </div>
                                <div className="space-y-4">
                                    {/* Current Balance */}
                                    <div className="p-6 rounded-3xl bg-slate-100 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{tSummary('availableFunds', currentLang)}</p>
                                            <p className="text-2xl font-black tracking-tighter opacity-60">$12,450.00</p>
                                        </div>
                                        <div className="text-right">
                                            <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${isInsufficientBalance ? 'text-red-500' : 'text-emerald-500'}`}>{tSummary('status', currentLang)}</p>
                                            <span className={`px-3 py-1.5 text-[10px] font-black rounded-xl uppercase tracking-widest border ${
                                                isInsufficientBalance 
                                                    ? 'bg-red-500/10 text-red-500 border-red-500/10' 
                                                    : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/10'
                                            }`}>
                                                {isInsufficientBalance ? tSummary('insufficientFunds', currentLang) : tSummary('activeReady', currentLang)}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Red Deduction Card */}
                                    <div className="p-6 rounded-3xl bg-red-500/5 border border-red-500/20 flex items-center justify-between relative overflow-hidden group">
                                        <div className="absolute -right-4 -top-4 opacity-[0.03] group-hover:scale-110 transition-transform duration-700">
                                            <span className="material-symbols-outlined text-8xl text-red-500">trending_down</span>
                                        </div>
                                        <div className="relative z-10">
                                            <p className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-1">{tSummary('deductionAmount', currentLang)}</p>
                                            <div className="flex items-center gap-2">
                                                <span className="text-4xl font-black text-red-600 leading-none">-</span>
                                                <p className="text-4xl font-black text-red-600 tracking-tighter leading-none">
                                                    {getCurrencySymbol(displayCurrency)} {grandTotal.toFixed(2)}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right relative z-10">
                                            <p className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-1">{tSummary('paymentImpact', currentLang)}</p>
                                            <span className="px-3 py-1.5 bg-red-500/10 text-red-600 text-[10px] font-black rounded-xl uppercase tracking-widest border border-red-500/10">{tSummary('balanceDecrease', currentLang)}</span>
                                        </div>
                                    </div>

                                    {/* Estimated Balance or Warning */}
                                    {isInsufficientBalance ? (
                                        <div className="p-6 rounded-[32px] bg-red-600 dark:bg-red-900/40 text-white flex flex-col gap-3 shadow-2xl border border-red-500/20 animate-pulse">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-[10px] font-black text-white/60 uppercase tracking-widest mb-1">{tSummary('deficitAmount', currentLang)}</p>
                                                    <p className="text-3xl font-black tracking-tighter">
                                                        - $ {(grandTotal - availableFunds).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </p>
                                                </div>
                                                <div className="size-12 rounded-2xl bg-white/20 flex items-center justify-center">
                                                    <span className="material-symbols-outlined text-white">warning</span>
                                                </div>
                                            </div>
                                            <p className="text-[10px] font-bold text-red-100 uppercase tracking-wider bg-black/20 p-2 rounded-xl text-center">
                                                {tSummary('topUpPrompt', currentLang)}
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="p-6 rounded-[32px] bg-slate-900 dark:bg-black text-white flex items-center justify-between shadow-2xl border border-white/5">
                                            <div>
                                                <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">{tSummary('estimatedNewBalance', currentLang)}</p>
                                                <p className="text-3xl font-black tracking-tighter">
                                                    $ {(availableFunds - (grandTotal * (displayCurrency === 'USD' ? 1 : 1))).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </p>
                                            </div>
                                            <div className="size-12 rounded-2xl bg-white/10 flex items-center justify-center">
                                                <span className="material-symbols-outlined text-white/40">account_balance</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Sticky Reservation Summary Sidebar */}
                    <div className="lg:col-span-4 lg:sticky lg:top-24 space-y-6">
                        <div className="relative group/sidebar">
                            {/* Glass Background */}
                            <div className="absolute inset-0 bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl rounded-[40px] border border-white/40 dark:border-white/10 shadow-[0_32px_80px_-16px_rgba(0,0,0,0.1)] transition-all duration-500 group-hover/sidebar:shadow-[0_48px_96px_-16px_rgba(0,0,0,0.15)]"></div>

                            <div className="relative p-8 z-10">

                                {/* Header */}
                                <div className="flex items-center gap-2 text-primary font-black text-[10px] mb-6 uppercase tracking-[0.2em] bg-primary/5 dark:bg-primary/20 p-3 rounded-2xl border border-primary/10" lang={currentLang === 'tr' ? 'tr' : 'en'}>
                                    <span className="material-symbols-outlined text-sm fill-1">bolt</span>
                                    {tSummary('instantConfirmation', currentLang)}
                                </div>

                                <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2" lang={currentLang === 'tr' ? 'tr' : 'en'}>
                                    <span className="material-symbols-outlined text-sm">auto_awesome</span>
                                    {tSummary('reservationSummary', currentLang)}
                                </h3>

                                {/* Hotel Info Card */}
                                <div className="mb-6 rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm">
                                    <div className="relative h-32 overflow-hidden">
                                        <img src={hotelImage} alt={hotelName} className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
                                        <div className="absolute bottom-3 left-4 right-4">
                                            <div className="flex items-center gap-0.5 mb-1">
                                                {[...Array(hotelStars)].map((_, i) => (
                                                    <span key={i} className="material-symbols-outlined text-[11px] text-amber-400 fill-1">star</span>
                                                ))}
                                            </div>
                                            <h3 className="font-black text-white text-sm uppercase tracking-tight leading-tight line-clamp-1">{hotelName}</h3>
                                        </div>
                                    </div>
                                    <div className="p-3 bg-slate-50 dark:bg-slate-800/50 space-y-2">
                                        {hotelAddress && (
                                            <div className="flex items-center gap-2">
                                                <span className="material-symbols-outlined text-[13px] text-primary shrink-0">location_on</span>
                                                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 truncate">{hotelAddress}</p>
                                            </div>
                                        )}
                                        <div className="flex gap-3" lang={currentLang === 'tr' ? 'tr' : 'en'}>
                                            <div className="flex items-center gap-1.5">
                                                <span className="material-symbols-outlined text-[11px] text-primary">login</span>
                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">{tSummary('in', currentLang)}: {hotel.checkIn || '15:00'}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <span className="material-symbols-outlined text-[11px] text-primary">logout</span>
                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">{tSummary('out', currentLang)}: {hotel.checkOut || '11:00'}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Booking Dates */}
                                <div className="grid grid-cols-2 gap-3 mb-6">
                                    <div className="p-3.5 rounded-2xl bg-slate-500/5 border border-slate-500/10">
                                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1" lang={currentLang === 'tr' ? 'tr' : 'en'}>{tSummary('checkIn', currentLang)}</p>
                                        <p className="text-sm font-black uppercase text-primary leading-tight">{formattedDates.start}</p>
                                    </div>
                                    <div className="p-3.5 rounded-2xl bg-slate-500/5 border border-slate-500/10">
                                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1" lang={currentLang === 'tr' ? 'tr' : 'en'}>{tSummary('checkOut', currentLang)}</p>
                                        <p className="text-sm font-black uppercase text-primary leading-tight">{formattedDates.end}</p>
                                    </div>
                                    <div className="col-span-2 p-3.5 rounded-2xl bg-slate-500/5 border border-slate-500/10 flex justify-between items-center">
                                        <div className="flex items-center gap-2">
                                            <span className="material-symbols-outlined text-[13px] text-primary">nights_stay</span>
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest" lang={currentLang === 'tr' ? 'tr' : 'en'}>
                                                {currentLang === 'tr' 
                                                    ? `${nights} Gece Konaklama` 
                                                    : `${nights} ${nights > 1 ? tSummary('nights', currentLang) : tSummary('night', currentLang)} ${tSummary('stay', currentLang)}`}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="material-symbols-outlined text-[13px] text-primary">group</span>
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest" lang={currentLang === 'tr' ? 'tr' : 'en'}>
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
                                <div className="space-y-4 mb-6">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest" lang={currentLang === 'tr' ? 'tr' : 'en'}>{tSummary('selectedRooms', currentLang)}</p>
                                    {selectedRooms?.map((room, idx) => {
                                        const policies = room.cancellationPolicies || [];
                                        return (
                                            <div key={idx} className="relative p-4 rounded-[20px] bg-white/40 dark:bg-slate-800/40 border border-white/60 dark:border-white/5 shadow-sm">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div className="flex items-start gap-2.5">
                                                        <div className="size-6 rounded-lg bg-primary/10 flex items-center justify-center text-[10px] font-black text-primary shrink-0 mt-0.5">{idx + 1}</div>
                                                        <div>
                                                            <p className="font-black text-[13px] uppercase tracking-tight text-slate-900 dark:text-white line-clamp-2"><span lang="en">{room.name}</span></p>
                                                            <div className="flex flex-wrap gap-2 mt-1" lang={currentLang === 'tr' ? 'tr' : 'en'}>
                                                                <p className="text-[11px] font-bold text-slate-500 uppercase">
                                                                    {checkRatesData?.rooms?.[idx]?.rates?.[0]?.boardName === 'RO' || !checkRatesData?.rooms?.[idx]?.rates?.[0]?.boardName || checkRatesData?.rooms?.[idx]?.rates?.[0]?.boardName === 'Room Only' ? tSummary('roomOnly', currentLang) : checkRatesData?.rooms?.[idx]?.rates?.[0]?.boardName}
                                                                </p>
                                                                {(() => {
                                                                    const refundable = checkRatesData?.rooms?.[idx]?.rates?.[0]?.refundable;
                                                                    if (refundable === undefined) return null;
                                                                    return (
                                                                        <RefundPolicyTooltip
                                                                            isRefundable={refundable}
                                                                            className={`text-[10px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest ${refundable ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}
                                                                        />
                                                                    );
                                                                })()}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="text-right shrink-0 ml-2">
                                                        <div className="flex items-baseline justify-end gap-1">
                                                            <span className="text-base font-black text-primary leading-none">{getCurrencySymbol(room.currency)}</span>
                                                            <span className="font-black text-sm text-primary leading-none">
                                                                {(checkRatesData?.rooms?.[idx]?.rates?.[0]?.price?.totalPaymentAmount || room.rate).toFixed(2)}
                                                            </span>
                                                        </div>
                                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5" lang={currentLang === 'tr' ? 'tr' : 'en'}>{room.currency || '$'} · {nights} {nights > 1 ? tSummary('nights', currentLang) : tSummary('night', currentLang)}</p>
                                                    </div>
                                                </div>
                                                {/* Cancellation policy */}
                                                <div className="pt-2 border-t border-slate-100 dark:border-slate-700/50" lang={currentLang === 'tr' ? 'tr' : 'en'}>
                                                    {(() => {
                                                        const currentPolicies = checkRatesData?.rooms?.[idx]?.rates?.[0]?.price?.cancellationPolicies || policies;
                                                        if (!currentPolicies || currentPolicies.length === 0) {
                                                            return (
                                                                <span className="text-[11px] font-bold text-slate-400 uppercase flex items-center gap-1">
                                                                    <span className="material-symbols-outlined text-[12px]">info</span>
                                                                    {tSummary('standardCancellation', currentLang)}
                                                                </span>
                                                            );
                                                        }
                                                        return (
                                                            <div className="space-y-1">
                                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{tSummary('cancellationPolicy', currentLang)}</p>
                                                                {currentPolicies.map((policy, pIdx) => {
                                                                    return (
                                                                        <div key={pIdx} className="flex justify-between items-center">
                                                                            <span className="text-[11px] font-bold text-slate-500">
                                                                                {policy.fromDate 
                                                                                    ? (policy.fromDate.includes('[') 
                                                                                        ? new Date(policy.fromDate.split('[')[0]).toLocaleDateString(currentLang, { day: '2-digit', month: 'short', year: 'numeric' })
                                                                                        : new Date(policy.fromDate).toLocaleDateString(currentLang, { day: '2-digit', month: 'short', year: 'numeric' }))
                                                                                    : (policy.amount === 0 ? tSummary('flexible', currentLang) : tSummary('cancellationPenalty', currentLang))
                                                                                }
                                                                            </span>
                                                                            <span className={`text-[11px] font-black px-2 py-0.5 rounded-md ${
                                                                                policy.amount === 0
                                                                                    ? 'bg-emerald-500/10 text-emerald-500'
                                                                                    : 'bg-orange-500/10 text-orange-500'
                                                                            }`}>
                                                                                {policy.amount === 0 ? tSummary('freeCancel', currentLang) : `${getCurrencySymbol(policy.currency || displayCurrency)} ${policy.amount.toFixed(2)}`}
                                                                            </span>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        );
                                                    })()}
                                                </div>

                                                {/* Daily Prices - Updated to handle both formats */}
                                                {(() => {
                                                    const currentDailyPrices = checkRatesData?.rooms?.[idx]?.rates?.[0]?.price?.dailyPrices;
                                                    if (!currentDailyPrices || currentDailyPrices.length === 0) return null;
                                                    return (
                                                        <div className="pt-2 mt-2 border-t border-slate-100 dark:border-slate-700/50" lang={currentLang === 'tr' ? 'tr' : 'en'}>
                                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{tSummary('dailyRates', currentLang)}</p>
                                                            <div className="space-y-1">
                                                                {currentDailyPrices.map((dp, dpIdx) => (
                                                                    <div key={dpIdx} className="flex justify-between items-center text-[11px]">
                                                                        <span className="font-medium text-slate-500">
                                                                            {new Date(dp.date).toLocaleDateString(currentLang, { day: '2-digit', month: 'short' })}
                                                                        </span>
                                                                        <span className="font-black text-slate-700 dark:text-slate-300">
                                                                            {getCurrencySymbol(displayCurrency)} {dp.amount.toFixed(2)}
                                                                        </span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    );
                                                })()}
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Taxes - Updated to handle both formats */}
                                {(() => {
                                    const allTaxes = [];
                                    if (checkRatesData?.rooms) {
                                        checkRatesData.rooms.forEach(room => {
                                            room.rates?.[0]?.price?.taxes?.forEach(tax => allTaxes.push(tax));
                                        });
                                    } else if (checkRatesData?.price?.taxes) {
                                        checkRatesData.price.taxes.forEach(tax => allTaxes.push(tax));
                                    }
                                    
                                    if (allTaxes.length === 0) return null;
                                    return (
                                        <div className="mb-6 space-y-2" lang={currentLang === 'tr' ? 'tr' : 'en'}>
                                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{tSummary('taxesAndFees', currentLang)}</p>
                                            {allTaxes.map((tax, tIdx) => (
                                                <div key={tIdx} className="flex justify-between items-center text-[11px]">
                                                    <span className="font-medium text-slate-500 capitalize">
                                                        {(tax.name || tax.type || 'Tax').replace(/_/g, ' ')}
                                                    </span>
                                                    <span className="font-black text-slate-700 dark:text-slate-300">
                                                        {getCurrencySymbol(tax.currency || displayCurrency)} {tax.amount.toFixed(2)}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    );
                                })()}

                                {/* Grand Total */}
                                <div className="pt-6 border-t border-slate-200 dark:border-slate-800 mb-6" lang={currentLang === 'tr' ? 'tr' : 'en'}>
                                    <div className="flex items-end justify-between">
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none mb-2">{tSummary('totalStayPrice', currentLang)}</p>
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-2xl font-black text-primary leading-none">{getCurrencySymbol(displayCurrency)}</span>
                                                <p className="text-4xl font-black text-primary leading-none tracking-tighter">{grandTotal.toFixed(2)}</p>
                                            </div>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">{displayCurrency} · {tSummary('taxesIncl', currentLang)} · {nights} {nights > 1 ? tSummary('nights', currentLang) : tSummary('night', currentLang)}</p>
                                        </div>
                                        <div className="size-10 rounded-2xl flex items-center justify-center text-primary bg-primary/10 border border-primary/20">
                                            <span className="material-symbols-outlined">payments</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Rate Notes - Added as per request */}
                                {checkRatesData?.notes && checkRatesData.notes.length > 0 && (
                                    <div className="mb-6 p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10" lang={currentLang === 'tr' ? 'tr' : 'en'}>
                                        <p className="text-[8px] font-black text-amber-600 dark:text-amber-500 uppercase tracking-widest mb-2 flex items-center gap-1">
                                            <span className="material-symbols-outlined text-[10px]">info</span>
                                            {tSummary('rateNotes', currentLang)}
                                        </p>
                                        <div 
                                            className="text-[11px] font-medium text-slate-600 dark:text-slate-400 space-y-1 max-h-40 overflow-y-auto pr-2 custom-scrollbar html-content"
                                            dangerouslySetInnerHTML={{ __html: decodeHTMLEntities(checkRatesData.notes.join('<br/>')) }}
                                        />
                                    </div>
                                )}

                                {/* Authorize Payment Button */}
                                <button
                                    onClick={handlePayment}
                                    disabled={isProcessing || (paymentMethod === 'credit_card' && (!cardDetails.number || !cardDetails.holder || !cardDetails.expiry || !cardDetails.cvv))}
                                    className={`w-full py-5 bg-primary text-white rounded-[24px] font-black text-xs uppercase tracking-widest shadow-2xl shadow-primary/30 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 overflow-hidden relative ${isProcessing || (paymentMethod === 'credit_card' && (!cardDetails.number || !cardDetails.holder || !cardDetails.expiry || !cardDetails.cvv)) ? 'opacity-50 grayscale cursor-not-allowed' : ''}`}
                                    lang={currentLang === 'tr' ? 'tr' : 'en'}
                                >
                                    {isProcessing ? <><div className="size-5 rounded-full border-4 border-white/20 border-t-white animate-spin"></div>{tSummary('processing', currentLang)}</> : <>{tSummary('authorizePayment', currentLang)}<span className="material-symbols-outlined text-[18px]">lock</span></>}
                                </button>

                                <p className="text-[10px] text-center text-slate-400 dark:text-slate-500 font-black uppercase tracking-[0.2em] mt-4" lang={currentLang === 'tr' ? 'tr' : 'en'}>
                                    {tSummary('b2bRates', currentLang)}
                                </p>
                            </div>
                        </div>

                        {/* Security Badge */}
                        <div className="bg-slate-100 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 flex items-center gap-4" lang={currentLang === 'tr' ? 'tr' : 'en'}>
                            <div className="size-12 rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center text-primary shadow-sm">
                                <span className="material-symbols-outlined">verified_user</span>
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{tSummary('securePayment', currentLang)}</p>
                                <p className="text-sm font-black">{tSummary('protectedBooking', currentLang)}</p>
                            </div>
                        </div>
                    </div>
                </div >
            </main >
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

            {/* Professional Booking Error Modal */}
            {bookingError && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="w-full max-w-xl relative group">
                        {/* Glow effect */}
                        <div className="absolute -inset-1 bg-gradient-to-r from-red-500/30 via-orange-500/30 to-red-500/30 rounded-[40px] blur-2xl opacity-100 transition-opacity duration-500"></div>

                        <div className="relative bg-white dark:bg-slate-900/90 backdrop-blur-3xl border border-red-500/30 dark:border-red-500/20 rounded-[40px] p-10 text-left shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">


                            <div className="flex justify-between items-start mb-6">
                                <div className="flex items-center gap-4">
                                    <div className="size-14 rounded-2xl bg-red-500/10 dark:bg-red-500/20 text-red-500 flex items-center justify-center border border-red-500/20 shadow-inner">
                                        <span className="material-symbols-outlined text-3xl">error</span>
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-black uppercase tracking-tight text-slate-900 dark:text-white">
                                            Booking Issue
                                        </h2>
                                        <p className="text-[10px] font-black text-red-500 uppercase tracking-widest mt-0.5">
                                            {bookingError.errorCode || 'Action Required'}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setBookingError(null)}
                                    className="size-10 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white transition-all border border-slate-200/60 dark:border-white/10"
                                >
                                    <span className="material-symbols-outlined text-xl">close</span>
                                </button>
                            </div>

                            {/* Main message */}
                            <div className="p-6 bg-red-50/50 dark:bg-red-500/5 rounded-3xl border border-red-500/10 dark:border-red-500/10 mb-6 max-h-[160px] overflow-y-auto custom-scrollbar">
                                <p className="text-[11px] font-black text-red-500 uppercase tracking-widest mb-2 select-none flex items-center gap-1">
                                    <span className="material-symbols-outlined text-xs">warning</span> Detailed Message
                                </p>
                                <p className="text-sm font-bold text-slate-700 dark:text-red-200/90 leading-relaxed break-words">
                                    {bookingError.message || 'We encountered a problem processing your request. Please check the details or try again.'}
                                </p>
                            </div>

                            {/* Supplementary technical details if available */}
                            {(bookingError.timestamp || bookingError.requestId) && (
                                <div className="p-5 bg-slate-50 dark:bg-slate-800/40 rounded-3xl border border-slate-100 dark:border-slate-800/80 mb-8 space-y-3">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Error Information</p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {bookingError.timestamp && (
                                            <div>
                                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Time</p>
                                                <p className="text-[11px] font-bold text-slate-600 dark:text-slate-300 truncate">{new Date(bookingError.timestamp).toLocaleString(localStorage.getItem('language') || 'tr')}</p>
                                            </div>
                                        )}
                                        {bookingError.requestId && (
                                            <div>
                                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Request ID</p>
                                                <p className="text-[11px] font-bold text-slate-600 dark:text-slate-300 font-mono tracking-tight truncate select-all">{bookingError.requestId}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            <div className="flex flex-col sm:flex-row gap-4 justify-end">
                                {(bookingError.message?.toLowerCase().includes('expired') || bookingError.message?.toLowerCase().includes('yeni bir arama')) && (
                                    <button
                                        onClick={() => navigate('/')}
                                        className="px-8 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] hover:bg-slate-200 dark:hover:bg-slate-700 transition-all shadow-sm flex items-center justify-center gap-2"
                                    >
                                        <span className="material-symbols-outlined text-sm">search</span> New Search
                                    </button>
                                )}
                                <button
                                    onClick={() => setBookingError(null)}
                                    className="px-8 py-4 bg-primary text-white rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                                >
                                    Dismiss <span className="material-symbols-outlined text-sm">check</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div >
    );
};

export default CheckoutPayment;
