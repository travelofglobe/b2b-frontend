import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { hotelService } from '../services/hotelService';
import { guestService } from '../services/guestService';
import CheckoutStepper from '../components/CheckoutStepper';
import PhoneInput from '../components/PhoneInput';
import ConfirmationModal from '../components/ConfirmationModal';
import CheckoutTimer from '../components/CheckoutTimer';
import RefundPolicyTooltip from '../components/RefundPolicyTooltip';
import CrmGuestSelectionModal from '../components/CrmGuestSelectionModal';

const crmLocales = {
    en: "Fill from CRM",
    tr: "CRM'den Doldur",
    ar: "ملء من CRM",
    es: "Llenar de CRM",
    ru: "Заполнить из CRM",
    zh: "从 CRM 填充",
    ja: "CRMから入力",
    fa: "پر کردن از CRM",
    fr: "Remplir depuis le CRM",
    it: "Compila da CRM",
    el: "Συμπλήρωση από CRM",
    pt: "Preencher do CRM"
};

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
        firstName: "First Name",
        lastName: "Last Name",
        birthDate: "Birth Date",
        gender: "Gender",
        male: "Male",
        female: "Female",
        emailAddress: "Email Address",
        phoneNumber: "Phone Number",
        enterFirstName: "Enter first name",
        enterLastName: "Enter last name",
        enterEmail: "email@example.com",
        invalidBirthDate: "Please enter a valid birth date",
        childAgeMismatch: "Child must be {age} years old on check-in date"
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
        firstName: "Adı",
        lastName: "Soyadı",
        birthDate: "Doğum Tarihi",
        gender: "Cinsiyet",
        male: "Erkek",
        female: "Kadın",
        emailAddress: "E-posta Adresi",
        phoneNumber: "Telefon Numarası",
        enterFirstName: "Adı giriniz",
        enterLastName: "Soyadı giriniz",
        enterEmail: "e-posta@ornek.com",
        invalidBirthDate: "Lütfen geçerli bir doğum tarihi giriniz",
        childAgeMismatch: "Çocuk giriş tarihinde {age} yaşında olmalıdır"
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
        room: "غرفة",
        firstName: "الاسم الأول",
        lastName: "اسم العائلة",
        birthDate: "تاريخ الميلاد",
        gender: "الجنس",
        male: "ذكر",
        female: "أنثى",
        emailAddress: "البريد الإلكتروني",
        phoneNumber: "رقم الهاتف",
        enterFirstName: "أدخل الاسم الأول",
        enterLastName: "أدخل اسم العائلة",
        enterEmail: "email@example.com",
        invalidBirthDate: "يرجى إدخال تاريخ ميلاد صحيح",
        childAgeMismatch: "يجب أن يكون الطفل في عمر {age} سنوات في تاريخ الوصول"
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
        room: "Habitación",
        firstName: "Nombre",
        lastName: "Apellido",
        birthDate: "Fecha de Nacimiento",
        gender: "Género",
        male: "Masculino",
        female: "Femenino",
        emailAddress: "Correo Electrónico",
        phoneNumber: "Número de Teléfono",
        enterFirstName: "Ingrese el nombre",
        enterLastName: "Ingrese el apellido",
        enterEmail: "correo@ejemplo.com",
        invalidBirthDate: "Por favor ingrese una fecha de nacimiento válida",
        childAgeMismatch: "El niño debe tener {age} años en la fecha de entrada"
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
        instantConfirmation: "Доступно мгновенное подтверждение",
        backToRoom: "Назад к номеру",
        backToSelection: "Назад к выбору",
        nextRoom: "Далее: Номер",
        reviewAndPay: "Проверить и оплатить",
        totalStayPrice: "Итого к оплате (Нетто)",
        taxesIncl: "Вкл. Налоги",
        b2bRates: "ПРИМЕНЕНЫ АГЕНТСКИЕ ТАРИФЫ B2B",
        securePayment: "БЕЗОПАСНЫЙ ПЛАТЕЖ",
        protectedBooking: "Защищенное бронирование TOG",
        in: "Заезд",
        out: "Выезд",
        leadGuest: "Основной Гость (Контакт)",
        traveler: "Путешественник",
        standardPolicy: "Стандартные правила для взрослых",
        childPassenger: "Ребенок-пассажир",
        age: "Возраст",
        occupancyInfo: "Информация о размещении",
        rateNotes: "Примечания к тарифу",
        room: "Номер",
        firstName: "Имя",
        lastName: "Фамилия",
        birthDate: "Дата рождения",
        gender: "Пол",
        male: "Мужской",
        female: "Женский",
        emailAddress: "Эл. почта",
        phoneNumber: "Номер телефона",
        enterFirstName: "Введите имя",
        enterLastName: "Введите фамилию",
        enterEmail: "email@example.com",
        invalidBirthDate: "Пожалуйста, введите корректную дату рождения",
        childAgeMismatch: "Ребёнку должно быть {age} лет на дату заезда"
    },
    zh: {
        checkIn: "入住",
        checkOut: "退房",
        nightsStay: "晚入住",
        nightStay: "晚入住",
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
        stay: "入住",
        taxesAndFees: "税费",
        bookingReferences: "预订参考",
        internalIdentifiers: "内部标识与特殊要求",
        clientReferenceId: "客户参考 ID",
        internalReferenceNumber: "您的内部参考编号",
        specialRemarks: "特殊备注",
        enterRemarks: "任何特殊要求或备注",
        instantConfirmation: "提供即时确认",
        backToRoom: "返回客房",
        backToSelection: "返回选择",
        nextRoom: "下一步: 客房",
        reviewAndPay: "确认并支付",
        totalStayPrice: "总价（净价）",
        taxesIncl: "含税",
        b2bRates: "已应用 B2B 代理价",
        securePayment: "安全支付",
        protectedBooking: "TOG 保障预订",
        in: "入住",
        out: "退房",
        leadGuest: "主要住客（联系人）",
        traveler: "旅客",
        standardPolicy: "标准成人政策",
        childPassenger: "儿童旅客",
        age: "年龄",
        occupancyInfo: "入住人数信息",
        rateNotes: "价格备注",
        room: "客房",
        firstName: "名字",
        lastName: "姓氏",
        birthDate: "出生日期",
        gender: "性别",
        male: "男性",
        female: "女性",
        emailAddress: "电子邮箱",
        phoneNumber: "手机号码",
        enterFirstName: "请输入名字",
        enterLastName: "请输入姓氏",
        enterEmail: "email@example.com",
        invalidBirthDate: "请输入有效的出生日期",
        childAgeMismatch: "儿童在入住日期必须满 {age} 岁"
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
        night: "泊",
        nights: "泊",
        stay: "滞在",
        taxesAndFees: "税金・手数料",
        bookingReferences: "予約リファレンス",
        internalIdentifiers: "内部識別子と特別なリクエスト",
        clientReferenceId: "クライアント参照ID",
        internalReferenceNumber: "内部参照番号",
        specialRemarks: "特別な注意事項",
        enterRemarks: "特別なリクエストやメモ",
        instantConfirmation: "即時確認が可能",
        backToRoom: "部屋に戻る",
        backToSelection: "選択に戻る",
        nextRoom: "次へ: 部屋",
        reviewAndPay: "確認して支払う",
        totalStayPrice: "滞在合計料金（ネット）",
        taxesIncl: "税込み",
        b2bRates: "B2B代理店料金適用済み",
        securePayment: "安全な決済",
        protectedBooking: "TOG保護予約",
        in: "イン",
        out: "アウト",
        leadGuest: "代表宿泊者（連絡先）",
        traveler: "旅行者",
        standardPolicy: "標準大人ポリシー",
        childPassenger: "子供宿泊者",
        age: "年齢",
        occupancyInfo: "定員情報",
        rateNotes: "料金メモ",
        room: "客室",
        firstName: "名前",
        lastName: "苗字",
        birthDate: "生年月日",
        gender: "性別",
        male: "男性",
        female: "女性",
        emailAddress: "メールアドレス",
        phoneNumber: "電話番号",
        enterFirstName: "名前を入力",
        enterLastName: "苗字を入力",
        enterEmail: "email@example.com",
        invalidBirthDate: "有効な生年月日を入力してください",
        childAgeMismatch: "お子様はチェックイン日に {age} 歳でなければなりません"
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
        night: "شب",
        nights: "شب",
        stay: "اقامت",
        taxesAndFees: "مالیات و هزینه‌ها",
        bookingReferences: "شناسه‌های رزرو",
        internalIdentifiers: "شناسه‌های داخلی و درخواست‌های ویژه",
        clientReferenceId: "شناسه مرجع مشتری",
        internalReferenceNumber: "شماره مرجع داخلی شما",
        specialRemarks: "توضیحات ویژه",
        enterRemarks: "هرگونه درخواست یا یادداشت ویژه",
        instantConfirmation: "تایید فوری در دسترس است",
        backToRoom: "بازگشت به اتاق",
        backToSelection: "بازگشت به انتخاب",
        nextRoom: "بعدی: اتاق",
        reviewAndPay: "بررسی و پرداخت",
        totalStayPrice: "قیمت کل اقامت (خالص)",
        taxesIncl: "شامل مالیات",
        b2bRates: "نرخ‌های آژانسی B2B اعمال شد",
        securePayment: "پرداخت امن",
        protectedBooking: "رزرو محافظت شده TOG",
        in: "ورود",
        out: "خروج",
        leadGuest: "مسافر اصلی (تماس)",
        traveler: "مسافر",
        standardPolicy: "قوانین استاندارد بزرگسال",
        childPassenger: "مسافر کودک",
        age: "سن",
        occupancyInfo: "اطلاعات ظرفیت اتاق",
        rateNotes: "یادداشت‌های نرخ",
        room: "اتاق",
        firstName: "نام",
        lastName: "نام خانوادگی",
        birthDate: "تاریخ تولد",
        gender: "جنسیت",
        male: "مرد",
        female: "زن",
        emailAddress: "آدرس ایمیل",
        phoneNumber: "شماره تلفن",
        enterFirstName: "نام را وارد کنید",
        enterLastName: "نام خانوادگی را وارد کنید",
        enterEmail: "email@example.com",
        invalidBirthDate: "لطفاً یک تاریخ تولد معتبر وارد کنید",
        childAgeMismatch: "کودک باید در تاریخ ورود {age} ساله باشد"
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
        standardCancellation: "Les conditions standard d'annulation s'appliquent",
        adults: "Adultes",
        adult: "Adulte",
        children: "Enfants",
        child: "Enfant",
        roomOnly: "Logement Seul",
        night: "Nuit",
        nights: "Nuits",
        stay: "Séjour",
        taxesAndFees: "Taxes & Frais",
        bookingReferences: "Références de Réservation",
        internalIdentifiers: "Identifiants internes & demandes spéciales",
        clientReferenceId: "Réf. Client",
        internalReferenceNumber: "Votre numéro de référence interne",
        specialRemarks: "Remarques Spéciales",
        enterRemarks: "Toutes demandes ou notes particulières",
        instantConfirmation: "Confirmation Instantanée Disponible",
        backToRoom: "Retour à la Chambre",
        backToSelection: "Retour à la Sélection",
        nextRoom: "Suivant: Chambre",
        reviewAndPay: "Vérifier & Payer",
        totalStayPrice: "Prix Total Séjour (Net)",
        taxesIncl: "Taxes Incl.",
        b2bRates: "TARIFS D'AGENCE B2B APPLIQUÉS",
        securePayment: "PAIEMENT SÉCURISÉ",
        protectedBooking: "Réservation Protégée par TOG",
        in: "Entrée",
        out: "Sortie",
        leadGuest: "Voyageur Principal (Contact)",
        traveler: "Voyageur",
        standardPolicy: "Politique Adultes Standard",
        childPassenger: "Voyageur Enfant",
        age: "Âge",
        occupancyInfo: "Informations d'Occupation",
        rateNotes: "Notes de Tarif",
        room: "Chambre",
        firstName: "Prénom",
        lastName: "Nom de famille",
        birthDate: "Date de naissance",
        gender: "Genre",
        male: "Masculin",
        female: "Féminin",
        emailAddress: "Adresse e-mail",
        phoneNumber: "Numéro de téléphone",
        enterFirstName: "Entrez le prénom",
        enterLastName: "Entrez le nom de famille",
        enterEmail: "email@exemple.com",
        invalidBirthDate: "Veuillez entrer une date de naissance valide",
        childAgeMismatch: "L'enfant doit avoir {age} ans à la date d'arrivée"
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
        standardCancellation: "Si applicano le condizioni standard di cancellazione",
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
        internalIdentifiers: "Identificativi interni e richieste speciali",
        clientReferenceId: "ID Riferimento Cliente",
        internalReferenceNumber: "Il tuo numero di riferimento interno",
        specialRemarks: "Note Speciali",
        enterRemarks: "Eventuali richieste o note speciali",
        instantConfirmation: "Conferma Istantanea Disponibile",
        backToRoom: "Torna alla Camera",
        backToSelection: "Torna alla Selezione",
        nextRoom: "Avanti: Camera",
        reviewAndPay: "Rivedi & Paga",
        totalStayPrice: "Prezzo Totale Soggiorno (Netto)",
        taxesIncl: "Tasse Incl.",
        b2bRates: "TARIFFE AGENZIA B2B APPLICATE",
        securePayment: "PAGAMENTO SICURO",
        protectedBooking: "Prenotazione Protetta da TOG",
        in: "In",
        out: "Out",
        leadGuest: "Ospite Principale (Contatto)",
        traveler: "Ospite",
        standardPolicy: "Politica Adulti Standard",
        childPassenger: "Ospite Bambino",
        age: "Età",
        occupancyInfo: "Informazioni Occupazione",
        rateNotes: "Note Tariffa",
        room: "Camera",
        firstName: "Nome",
        lastName: "Cognome",
        birthDate: "Data di Nascita",
        gender: "Sesso",
        male: "Maschio",
        female: "Femmina",
        emailAddress: "Indirizzo e-mail",
        phoneNumber: "Numero di telefono",
        enterFirstName: "Inserisci il nome",
        enterLastName: "Inserisci il cognome",
        enterEmail: "email@esempio.com",
        invalidBirthDate: "Inserisci una data di nascita valida",
        childAgeMismatch: "Il bambino deve avere {age} anni alla data di check-in"
    },
    el: {
        checkIn: "Check-in",
        checkOut: "Check-out",
        nightsStay: "Νύχτες Διαμονής",
        nightStay: "Νύχτα Διαμονής",
        selectedRooms: "Επιλεγμένα Δωμάτια",
        dailyRates: "Καθημερινές Τιμές",
        cancellationPolicy: "Πολιτική Ακύρωσης",
        flexible: "Ευέλικτη",
        cancellationPenalty: "Χρέωση Ακύρωσης",
        freeCancel: "Δωρεάν Ακύρωση",
        standardCancellation: "Ισχύει η τυπική πολιτική ακύρωσης",
        adults: "Ενήλικες",
        adult: "Ενήλικας",
        children: "Παιδιά",
        child: "Παιδί",
        roomOnly: "Μόνο Διαμονή",
        night: "Νύχτα",
        nights: "Νύχτες",
        stay: "Διαμονή",
        taxesAndFees: "Φόροι & Τέλη",
        bookingReferences: "Κωδικοί Αναφοράς Κράτησης",
        internalIdentifiers: "Εσωτερικά αναγνωριστικά & ειδικά αιτήματα",
        clientReferenceId: "Κωδικός Αναφοράς Πελάτη",
        internalReferenceNumber: "Ο εσωτερικός σας κωδικός αναφοράς",
        specialRemarks: "Ειδικές Παρατηρήσεις",
        enterRemarks: "Τυχόν ειδικές παρατηρήσεις ή αιτήματα",
        instantConfirmation: "Διαθέσιμη Άμεση Επιβεβαίωση",
        backToRoom: "Πίσω στο Δωμάτιο",
        backToSelection: "Πίσω στην Επιλογή",
        nextRoom: "Επόμενο: Δωμάτιο",
        reviewAndPay: "Έλεγχος & Πληρωμή",
        totalStayPrice: "Συνολικό Κόστος Διαμονής (Καθαρό)",
        taxesIncl: "Συμπ. Φόρων",
        b2bRates: "ΕΦΑΡΜΟΣΤΗΚΑΝ ΤΙΜΕΣ B2B AGENCY",
        securePayment: "ΑΣΦΑΛΗΣ ΠΛΗΡΩΜΗ",
        protectedBooking: "Προστατευμένη Κράτηση TOG",
        in: "Είσοδος",
        out: "Έξοδος",
        leadGuest: "Κύριος Επισκέπτης (Επικοινωνία)",
        traveler: "Επισκέπτης",
        standardPolicy: "Τυπική Πολιτική Ενηλίκων",
        childPassenger: "Παιδί Επισκέπτης",
        age: "Ηλικία",
        occupancyInfo: "Πληροφορίες Διαμονής",
        rateNotes: "Σημειώσεις Τιμής",
        room: "Δωμάτιο",
        firstName: "Όνομα",
        lastName: "Επώνυμο",
        birthDate: "Ημερομηνία Γέννησης",
        gender: "Φύλο",
        male: "Άνδρας",
        female: "Γυναίκα",
        emailAddress: "Διεύθυνση e-mail",
        phoneNumber: "Αριθμός τηλεφώνου",
        enterFirstName: "Εισάγετε το όνομα",
        enterLastName: "Εισάγετε το επώνυμο",
        enterEmail: "email@example.com",
        invalidBirthDate: "Παρακαλώ εισάγετε έγκυρη ημερομηνία γέννησης",
        childAgeMismatch: "Το παιδί πρέπει να είναι {age} ετών κατά την ημερομηνία άφιξης"
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
        cancellationPenalty: "Multa de Cancelamento",
        freeCancel: "Cancelamento Gratuito",
        standardCancellation: "Aplica-se o cancelamento padrão",
        adults: "Adultos",
        adult: "Adulto",
        children: "Crianças",
        child: "Criança",
        roomOnly: "Somente Quarto",
        night: "Noite",
        nights: "Noites",
        stay: "Estadia",
        taxesAndFees: "Impostos e Taxas",
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
        backToRoom: "Voltar ao Quarto",
        backToSelection: "Voltar à Seleção",
        totalStayPrice: "Preço Total Estadia (Líquido)",
        taxesIncl: "Impostos Incl.",
        b2bRates: "TARIFAS DE AGÊNCIA B2B APLICADAS",
        securePayment: "PAGAMENTO SEGURO",
        protectedBooking: "Reserva Protegida pela TOG",
        in: "Entrada",
        out: "Saída",
        leadGuest: "Hóspede Principal (Contacto)",
        traveler: "Hóspede",
        standardPolicy: "Política Padrão de Adultos",
        childPassenger: "Hóspede Criança",
        age: "Idade",
        occupancyInfo: "Informações de Ocupação",
        rateNotes: "Notas de Tarifa",
        room: "Quarto",
        firstName: "Primeiro Nome",
        lastName: "Apelido",
        birthDate: "Data de Nascimento",
        gender: "Género",
        male: "Masculino",
        female: "Feminino",
        emailAddress: "Endereço de e-mail",
        phoneNumber: "Número de telefone",
        enterFirstName: "Insira o primeiro nome",
        enterLastName: "Insira o apelido",
        enterEmail: "email@exemplo.com",
        invalidBirthDate: "Por favor insira uma data de nascimento válida",
        childAgeMismatch: "A criança deve ter {age} anos na data de entrada"
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
    return CHECKOUT_SUMMARY_LOCALES[baseLang]?.[key] || CHECKOUT_SUMMARY_LOCALES['en']?.[key] || key;
};

const CheckoutGuestDetails = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { i18n } = useTranslation();
    const [currentLang, setCurrentLang] = useState(() => {
        const rawLang = i18n.language || localStorage.getItem('i18nextLng') || localStorage.getItem('language') || 'en';
        return rawLang.split('-')[0].toLowerCase();
    });

    useEffect(() => {
        // Sync immediately in case language changed before this component mounted
        const rawLang = i18n.language || localStorage.getItem('i18nextLng') || localStorage.getItem('language') || 'en';
        setCurrentLang(rawLang.split('-')[0].toLowerCase());

        const handleLangChange = (lng) => {
            if (lng) setCurrentLang(lng.split('-')[0].toLowerCase());
        };
        i18n.on('languageChanged', handleLangChange);
        return () => {
            i18n.off('languageChanged', handleLangChange);
        };
    }, [i18n]);

    const cl = confirmLocales[currentLang] || confirmLocales['tr'];
    const crmText = crmLocales[currentLang] || crmLocales['tr'];

    const [selectedRooms, setSelectedRooms] = useState(null);
    const [hotel, setHotel] = useState(null);
    const [roomState, setRoomState] = useState(null);
    const [checkInDate, setCheckInDate] = useState(null);
    const [checkOutDate, setCheckOutDate] = useState(null);
    const [rateSearchUuid, setRateSearchUuid] = useState(null);
    const [checkRatesData, setCheckRatesData] = useState(null);
    const [originalSearch, setOriginalSearch] = useState('');
    const [hotelSlug, setHotelSlug] = useState('');
    const [isLoadingRates, setIsLoadingRates] = useState(true);
    const [roomsData, setRoomsData] = useState([]);
    const [clientReferenceId, setClientReferenceId] = useState('');
    const [remark, setRemark] = useState('');
    const [expireAt, setExpireAt] = useState(null);
    
    const [sessionId, setSessionId] = useState(() => {
        const params = new URLSearchParams(window.location.search);
        return params.get('sessionId') || '';
    });
    const [isLoadingSession, setIsLoadingSession] = useState(!!sessionId);

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

    const [activeRoomIdx, setActiveRoomIdx] = useState(0);
    const [showConfirmBack, setShowConfirmBack] = useState(false);
    const [pendingStepId, setPendingStepId] = useState(null);
    const [isCrmModalOpen, setIsCrmModalOpen] = useState(false);
    const [targetGuestIndex, setTargetGuestIndex] = useState(null);

    // Auto-scroll to top on mount
    useLayoutEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const urlSessionId = params.get('sessionId');

        if (urlSessionId) {
            const loadSession = async () => {
                setIsLoadingRates(true);
                setIsLoadingSession(true);
                try {
                    const session = await hotelService.getCheckoutSession(urlSessionId);
                    if (session && session.success !== false) {
                        setSelectedRooms(session.selectedRooms || null);
                        setHotel(session.hotel || null);
                        setRoomState(session.roomState || null);
                        setCheckInDate(session.checkInDate || null);
                        setCheckOutDate(session.checkOutDate || null);
                        setRateSearchUuid(session.rateSearchUuid || null);
                        setCheckRatesData(session.checkRatesData || null);
                        
                        // Initial roomsData setup if empty
                        if (!session.roomsData || session.roomsData.length === 0) {
                            const initialRoomsData = (session.selectedRooms || []).map((room, roomIdx) => {
                                const config = (session.roomState || [])[roomIdx] || { adults: 1, children: 0, childAges: [] };
                                const guests = [];
                                for (let i = 0; i < config.adults; i++) {
                                    guests.push({ type: 'Adult', firstName: '', lastName: '', email: '', phone: '', birthDate: '', gender: '' });
                                }
                                for (let i = 0; i < config.children; i++) {
                                    guests.push({ type: 'Child', age: config.childAges[i], firstName: '', lastName: '', birthDate: '', gender: '' });
                                }
                                return { roomName: room.name, guests, cancellationPolicies: room.cancellationPolicies || [], hubRateModel: room.hubRateModel };
                            });
                            setRoomsData(initialRoomsData);
                        } else {
                            setRoomsData(session.roomsData);
                        }

                        setClientReferenceId(session.clientReferenceId || '');
                        setRemark(session.remark || '');
                        setOriginalSearch(session.originalSearch || '');
                        setHotelSlug(session.hotelSlug || '');
                        setExpireAt(session.expireAt || null);
                        setSessionId(urlSessionId);
                    }
                } catch (err) {
                    console.error('Failed to load checkout session:', err);
                } finally {
                    setIsLoadingRates(false);
                    setIsLoadingSession(false);
                }
            };
            loadSession();
        }
    }, [location.search]);

    // Save updated context automatically to Redis on any data change (with debounce)
    useEffect(() => {
        if (!sessionId || !selectedRooms || !hotel) return;

        const timer = setTimeout(async () => {
            try {
                await hotelService.saveCheckoutSession(sessionId, {
                    selectedRooms,
                    hotel,
                    roomState,
                    checkInDate,
                    checkOutDate,
                    rateSearchUuid,
                    checkRatesData,
                    roomsData,
                    clientReferenceId,
                    remark,
                    originalSearch,
                    hotelSlug
                });
            } catch (err) {
                console.error('Failed to save updated checkout context:', err);
            }
        }, 1000); // Debounce: Wait 1 second after last input change before saving

        return () => clearTimeout(timer);
    }, [roomsData, clientReferenceId, remark, checkRatesData, rateSearchUuid, sessionId]);

    // Fetch latest rates and info on mount if not provided
    useEffect(() => {
        // If we are still loading session from Redis, or already have rates data, don't fetch again
        if (isLoadingSession || location.state?.checkRatesData || checkRatesData || !selectedRooms) {
            return;
        }

        const fetchRates = async () => {
            setIsLoadingRates(true);
            try {
                const checkRatesRequest = {
                    rooms: selectedRooms.map(room => ({
                        rateCode: room.hubRateModel?.rateCode
                    }))
                };

                const response = await hotelService.checkRates(checkRatesRequest);
                console.log('Checkout check-rates response:', response);

                if (response && Array.isArray(response) && response.length > 0) {
                    setCheckRatesData(response[0]); // Store the full hotel object from check-rates
                    if (response[0].rateSearchUuid) {
                        setRateSearchUuid(response[0].rateSearchUuid);
                    }
                }
            } catch (err) {
                console.error('Checkout check-rates failed:', err);
            } finally {
                setIsLoadingRates(false);
            }
        };

        fetchRates();
    }, [selectedRooms]);

    const [errors, setErrors] = useState({});



    const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    const getCurrencySymbol = (code) => {
        const symbols = { 'USD': '$', 'EUR': '€', 'GBP': '£', 'TRY': '₺', 'AED': 'د.إ', 'SAR': 'ر.س', 'JPY': '¥', 'CHF': 'Fr', 'CAD': 'CA$', 'AUD': 'A$' };
        return symbols[code] || code || '$';
    };

    const handleInputChange = (roomIdx, guestIdx, field, value) => {
        const newData = [...roomsData];
        
        // Validation for Name fields: only letters and spaces allowed
        if (field === 'firstName' || field === 'lastName') {
            // Remove numbers and special characters (keeping Turkish characters)
            const filteredValue = value.replace(/[^a-zA-Z\sğüşıöçĞÜŞİÖÇ]/g, '');
            newData[roomIdx].guests[guestIdx][field] = filteredValue;
        } else {
            newData[roomIdx].guests[guestIdx][field] = value;
        }
        
        setRoomsData(newData);
    };

    const decodeHTMLEntities = (text) => {
        if (!text) return '';
        const textArea = document.createElement('textarea');
        textArea.innerHTML = text;
        return textArea.value;
    };

    // Birth date validation: must be a valid date, not in the future, year must be 4 digits
    const validateBirthDate = (dateStr) => {
        if (!dateStr) return false;
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return false;
        const year = date.getFullYear();
        if (year < 1900 || year > new Date().getFullYear()) return false;
        return date <= new Date();
    };

    const calculateAge = (birthDate, referenceDate) => {
        if (!birthDate || !referenceDate) return 0;
        const birth = new Date(birthDate);
        const ref = new Date(referenceDate);
        let age = ref.getFullYear() - birth.getFullYear();
        const m = ref.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && ref.getDate() < birth.getDate())) {
            age--;
        }
        return age;
    };

    const handleCrmGuestSelect = (crmGuest) => {
        if (!targetGuestIndex) return;
        const { roomIdx, guestIdx } = targetGuestIndex;

        // Update newData with cloned room and guest to ensure React detects changes and props are preserved
        const newData = roomsData.map((room, rIdx) => {
            if (rIdx === roomIdx) {
                return {
                    ...room,
                    guests: room.guests.map((guest, gIdx) => {
                        if (gIdx === guestIdx) {
                            const updatedGuest = { ...guest };
                            
                            if (crmGuest.firstName) updatedGuest.firstName = crmGuest.firstName.replace(/[^a-zA-Z\sğüşıöçĞÜŞİÖÇ]/g, '');
                            if (crmGuest.lastName) updatedGuest.lastName = crmGuest.lastName.replace(/[^a-zA-Z\sğüşıöçĞÜŞİÖÇ]/g, '');
                            
                            if (crmGuest.email && guest.type === 'Adult' && guestIdx === 0) {
                                updatedGuest.email = crmGuest.email;
                            }
                            
                            if (crmGuest.phoneNumber && guest.type === 'Adult' && guestIdx === 0) {
                                updatedGuest.phone = `${crmGuest.phoneCountryCode || '+90'} ${crmGuest.phoneNumber}`;
                            }
                            
                            if (crmGuest.gender) updatedGuest.gender = crmGuest.gender.toLowerCase();
                            
                            if (crmGuest.birthDate) {
                                const parts = crmGuest.birthDate.split('.');
                                if (parts.length === 3) {
                                    updatedGuest.birthDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
                                }
                            }
                            
                            updatedGuest.crmGuestId = crmGuest.id;
                            updatedGuest.agencyId = crmGuest.agencyId;
                            
                            // Store original data snapshot for later comparison
                            updatedGuest.originalData = {
                                firstName: updatedGuest.firstName,
                                lastName: updatedGuest.lastName,
                                email: updatedGuest.email,
                                phone: updatedGuest.phone,
                                gender: updatedGuest.gender,
                                birthDate: updatedGuest.birthDate
                            };
                            
                            return updatedGuest;
                        }
                        return guest;
                    })
                };
            }
            return room;
        });

        setRoomsData(newData);
        setIsCrmModalOpen(false);
        setTargetGuestIndex(null);
    };

    const handleNext = async () => {
        const currentRoom = roomsData[activeRoomIdx];
        const newErrors = { ...errors };
        let hasRoomError = false;
        let firstErrorField = null;

        currentRoom.guests.forEach((guest, gIdx) => {
            const key = `${activeRoomIdx}-${gIdx}`;
            
            // Age validation for children
            let ageMismatch = false;
            if (guest.type === 'Child' && guest.birthDate) {
                const calculatedAge = calculateAge(guest.birthDate, checkInDate);
                if (calculatedAge !== guest.age) {
                    ageMismatch = true;
                }
            }

            const guestErrors = {
                firstName: !guest.firstName,
                lastName: !guest.lastName,
                email: guest.type === 'Adult' && gIdx === 0 && !validateEmail(guest.email),
                birthDate: !validateBirthDate(guest.birthDate) || ageMismatch,
                ageMismatch: ageMismatch,
                gender: !guest.gender,
                phone: guest.type === 'Adult' && gIdx === 0 && (!guest.phone || guest.phone.trim().split(' ').length < 2 || guest.phone.trim().split(' ')[1].length < 3)
            };
            newErrors[key] = guestErrors;
            if (Object.values(guestErrors).some(v => v)) {
                hasRoomError = true;
                // Track first error field for scroll
                if (!firstErrorField) {
                    const fieldName = Object.keys(guestErrors).find(k => guestErrors[k]);
                    firstErrorField = { key, field: fieldName, gIdx };
                }
            }
        });

        setErrors(newErrors);

        if (hasRoomError) {
            // Scroll to first invalid field after state update
            setTimeout(() => {
                const selector = firstErrorField
                    ? `[data-field="${firstErrorField.key}-${firstErrorField.field}"]`
                    : '[data-error="true"]';
                const el = document.querySelector(selector);
                if (el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    el.focus?.();
                } else {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }
            }, 50);
        } else {
            if (activeRoomIdx < roomsData.length - 1) {
                setActiveRoomIdx(prev => prev + 1);
                window.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
                // Sync CRM guests in background - non-blocking
                syncCrmGuests();

                navigate(`/hotel/checkout/payment?sessionId=${sessionId}`, {
                    state: { ...location.state, selectedRooms, hotel, roomState, checkInDate, checkOutDate, roomsData, clientReferenceId, remark, rateSearchUuid, checkRatesData, expireAt }
                });
            }
        }
    };

    const syncCrmGuests = async () => {
        console.log('Syncing CRM guests... Current roomsData:', roomsData);
        try {
            const guestsToUpdate = [];
            roomsData.forEach(room => {
                room.guests.forEach(guest => {
                    if (guest.crmGuestId) {
                        guestsToUpdate.push(guest);
                    }
                });
            });

            console.log('Guests found to update:', guestsToUpdate);
            if (guestsToUpdate.length === 0) return;

            await Promise.all(guestsToUpdate.map(async (guest) => {
                // Check if any tracked field has actually changed
                const hasChanged = !guest.originalData || 
                    guest.firstName !== guest.originalData.firstName ||
                    guest.lastName !== guest.originalData.lastName ||
                    guest.email !== guest.originalData.email ||
                    guest.phone !== guest.originalData.phone ||
                    guest.gender !== guest.originalData.gender ||
                    guest.birthDate !== guest.originalData.birthDate;

                if (!hasChanged) {
                    console.log(`Skipping update for guest ${guest.crmGuestId} - No changes detected.`);
                    return null;
                }

                const updateDto = {
                    firstName: guest.firstName,
                    lastName: guest.lastName,
                    gender: guest.gender?.toUpperCase(),
                    email: guest.email,
                    phoneNumber: guest.phone?.includes(' ') ? guest.phone.split(' ')[1] : guest.phone,
                    phoneCountryCode: guest.phone?.includes(' ') ? guest.phone.split(' ')[0].replace('+', '') : '90',
                    birthDate: guest.birthDate?.includes('-') 
                        ? guest.birthDate.split('-').reverse().join('.') 
                        : guest.birthDate
                };
                
                console.log(`Updating guest ${guest.crmGuestId} with data:`, updateDto);
                const response = await guestService.updateGuest(guest.crmGuestId, updateDto);
                console.log(`Update response for ${guest.crmGuestId}:`, response);
                return response;
            }));
        } catch (error) {
            console.error('Failed to sync CRM guests:', error);
        }
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
                            <div className="flex gap-2">
                                <div className="w-28 h-10 bg-slate-200/50 dark:bg-slate-800/50 rounded-xl animate-pulse"></div>
                                <div className="w-28 h-10 bg-slate-200/50 dark:bg-slate-800/50 rounded-xl animate-pulse"></div>
                            </div>
                            <div className="h-56 bg-slate-200/40 dark:bg-slate-800/40 rounded-3xl border border-slate-200/50 dark:border-slate-700/50 animate-pulse"></div>
                            <div className="h-56 bg-slate-200/40 dark:bg-slate-800/40 rounded-3xl border border-slate-200/50 dark:border-slate-700/50 animate-pulse"></div>
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

    if (!selectedRooms) {
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
                                <span className="material-symbols-outlined text-[200px]">production_quantity_limits</span>
                            </div>

                            <div className="size-24 bg-primary/10 rounded-3xl flex items-center justify-center text-primary mx-auto mb-8 shadow-inner">
                                <span className="material-symbols-outlined text-5xl">shopping_cart_off</span>
                            </div>

                            <h2 className="text-3xl font-black uppercase tracking-tight mb-4 text-slate-900 dark:text-white">No Selection Found</h2>
                            <p className="text-slate-500 dark:text-slate-400 font-medium mb-10 leading-relaxed max-w-sm mx-auto">
                                It looks like you haven't selected any rooms yet. Please return to the hotel details to choose your preferred accommodation.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <button
                                    onClick={() => navigate('/')}
                                    className="px-8 py-4 bg-primary text-white rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                                >
                                    Back to Dashboard
                                </button>
                                <button
                                    onClick={() => {
                                        const slug = localStorage.getItem('last_hotel_search_slug');
                                        const params = localStorage.getItem('last_hotel_search_params');
                                        if (slug && params) {
                                            navigate(`/hotels/${slug}?${params}`);
                                        } else if (params) {
                                            navigate(`/hotels?${params}`);
                                        } else {
                                            navigate('/hotels');
                                        }
                                    }}
                                    className="px-8 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm"
                                >
                                    Browse Hotels
                                </button>
                            </div>
                        </div>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    const currentRoom = roomsData[activeRoomIdx];

    const hotelName = hotel.names?.tr || hotel.names?.en || hotel.name || 'Hotel';
    const hotelStars = hotel.hotelStar?.star || hotel.stars || 5;
    const hotelAddress = hotel.address ? `${hotel.address.street || ''}, ${hotel.address.cityName || ''}`.replace(/^,\s*/, '').replace(/,\s*$/, '') : (hotel.location || '');
    const hotelImage = hotel.images?.[0]?.url || hotel.image || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80';
    
    // Use price from checkRatesData if available, otherwise fallback to local calculation
    const checkRate = checkRatesData?.rooms?.[0]?.rates?.[0];
    const grandTotal = checkRatesData?.rooms?.reduce((sum, room) => sum + (room.rates?.[0]?.price?.totalPaymentAmount || 0), 0) || selectedRooms.reduce((sum, r) => sum + r.rate, 0);
    const displayCurrency = checkRate?.price?.currency || selectedRooms[0]?.currency || '$';

    return (
        <div className="min-h-screen bg-background-light dark:bg-background-dark text-slate-900 dark:text-white font-sans">
            <Header />
            <main className="max-w-7xl mx-auto px-6 pt-6 pb-20">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                    <div className="flex-1">
                        <CheckoutStepper 
                            currentStep={2} 
                            onStepClick={(stepId) => {
                                if (stepId === 1) {
                                    setPendingStepId(stepId);
                                    setShowConfirmBack(true);
                                } else if (stepId === 3) {
                                    handleNext(); 
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

                <CrmGuestSelectionModal
                    isOpen={isCrmModalOpen}
                    onClose={() => setIsCrmModalOpen(false)}
                    onSelect={handleCrmGuestSelect}
                />

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
                    <div className="lg:col-span-8">
                        {/* Room Stepper */}
                        <div className="flex gap-2 mb-8 overflow-x-auto pb-4 no-scrollbar">
                            {roomsData.map((room, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => idx < activeRoomIdx && setActiveRoomIdx(idx)}
                                    className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border transition-all shrink-0 ${idx === activeRoomIdx ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20' : idx < activeRoomIdx ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-white/40 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 text-slate-400 cursor-not-allowed'}`}
                                >
                                    <span className="material-symbols-outlined text-[16px]">{idx < activeRoomIdx ? 'check_circle' : 'bed'}</span>
                                    <span className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap">Room {idx + 1}</span>
                                </button>
                            ))}
                        </div>

                        <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500" key={activeRoomIdx}>
                            <div className="flex items-center justify-between mb-2" lang={currentLang === 'tr' ? 'tr' : 'en'}>
                                <h2 className="text-xl font-black uppercase tracking-tight">{currentRoom.roomName}</h2>
                                <span className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-[9px] font-black text-slate-500 uppercase tracking-widest">{tSummary('occupancyInfo', currentLang)}</span>
                            </div>

                            {currentRoom.guests.map((guest, gIdx) => (
                                <div key={gIdx} className="relative group z-[5] focus-within:z-[50]">
                                    <div className="absolute -inset-1 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 rounded-[40px] blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                    <div className="relative p-7 rounded-3xl border border-white/40 dark:border-white/10 bg-white/60 dark:bg-slate-900/60 backdrop-blur-3xl shadow-2xl z-10 focus-within:z-[100]" lang={currentLang === 'tr' ? 'tr' : 'en'}>
                                        <div className="flex items-center justify-between mb-7">
                                            <div className="flex items-center gap-3">
                                                <div className={`size-10 rounded-xl flex items-center justify-center transition-colors ${guest.type === 'Adult' ? 'bg-slate-100 dark:bg-slate-800 text-primary' : 'bg-emerald-500/10 text-emerald-500'}`}>
                                                    <span className="material-symbols-outlined text-xl">{guest.type === 'Adult' ? 'person' : 'child_care'}</span>
                                                </div>
                                                <div>
                                                    <h3 className="text-lg font-black uppercase tracking-tight">
                                                        {gIdx === 0 && guest.type === 'Adult' 
                                                            ? tSummary('leadGuest', currentLang) 
                                                            : `${guest.type === 'Adult' ? tSummary('adult', currentLang) : tSummary('child', currentLang)} ${tSummary('traveler', currentLang)} ${gIdx + 1}`}
                                                    </h3>
                                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                                        {guest.type === 'Adult' 
                                                            ? tSummary('standardPolicy', currentLang) 
                                                            : `${tSummary('childPassenger', currentLang)} • ${tSummary('age', currentLang)} ${guest.age}`}
                                                    </p>
                                                </div>
                                            </div>
                                            <button 
                                                type="button" 
                                                onClick={() => {
                                                    setTargetGuestIndex({ roomIdx: activeRoomIdx, guestIdx: gIdx });
                                                    setIsCrmModalOpen(true);
                                                }}
                                                className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary/20 transition-colors"
                                            >
                                                <span className="material-symbols-outlined text-sm">contact_page</span>
                                                <span className="hidden sm:inline">{crmText}</span>
                                                <span className="sm:hidden">CRM</span>
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                            <div className="space-y-1.5">
                                                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">{tSummary('firstName', currentLang)}</label>
                                                <input
                                                    data-field={`${activeRoomIdx}-${gIdx}-firstName`}
                                                    required
                                                    className={`w-full bg-slate-50 dark:bg-slate-800 border ${errors[`${activeRoomIdx}-${gIdx}`]?.firstName ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'} p-3.5 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold text-sm`}
                                                    placeholder={tSummary('enterFirstName', currentLang)}
                                                    value={guest.firstName}
                                                    onChange={(e) => handleInputChange(activeRoomIdx, gIdx, 'firstName', e.target.value)}
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">{tSummary('lastName', currentLang)}</label>
                                                <input
                                                    data-field={`${activeRoomIdx}-${gIdx}-lastName`}
                                                    required
                                                    className={`w-full bg-slate-50 dark:bg-slate-800 border ${errors[`${activeRoomIdx}-${gIdx}`]?.lastName ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'} p-3.5 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold text-sm`}
                                                    placeholder={tSummary('enterLastName', currentLang)}
                                                    value={guest.lastName}
                                                    onChange={(e) => handleInputChange(activeRoomIdx, gIdx, 'lastName', e.target.value)}
                                                />
                                            </div>

                                            {/* Birth Date and Gender */}
                                            <div className="space-y-1.5">
                                                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">{tSummary('birthDate', currentLang)}</label>
                                                <input
                                                    data-field={`${activeRoomIdx}-${gIdx}-birthDate`}
                                                    type="date"
                                                    className={`w-full bg-slate-50 dark:bg-slate-800 border ${errors[`${activeRoomIdx}-${gIdx}`]?.birthDate ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'} p-3.5 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold uppercase text-sm`}
                                                    value={guest.birthDate}
                                                    min="1900-01-01"
                                                    max={new Date().toISOString().split('T')[0]}
                                                    onChange={(e) => {
                                                        handleInputChange(activeRoomIdx, gIdx, 'birthDate', e.target.value);
                                                    }}
                                                    onBlur={(e) => {
                                                        const val = e.target.value;
                                                        if (val) {
                                                            const year = parseInt(val.split('-')[0], 10);
                                                            if (isNaN(year) || year < 1900 || year > new Date().getFullYear()) {
                                                                 handleInputChange(activeRoomIdx, gIdx, 'birthDate', '');
                                                            }
                                                        }
                                                    }}
                                                />
                                                {errors[`${activeRoomIdx}-${gIdx}`]?.birthDate && !errors[`${activeRoomIdx}-${gIdx}`]?.ageMismatch && (
                                                    <p className="text-red-500 text-[10px] font-black uppercase tracking-wider mt-1 ml-1 animate-in fade-in duration-300">{tSummary('invalidBirthDate', currentLang)}</p>
                                                )}
                                                {errors[`${activeRoomIdx}-${gIdx}`]?.ageMismatch && (
                                                    <p className="text-red-500 text-[10px] font-black uppercase tracking-wider mt-1 ml-1 animate-in fade-in duration-300">
                                                        {tSummary('childAgeMismatch', currentLang).replace('{age}', guest.age)}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">{tSummary('gender', currentLang)}</label>
                                                <div
                                                    data-field={`${activeRoomIdx}-${gIdx}-gender`}
                                                    className={`grid grid-cols-2 gap-2.5 p-1 rounded-xl border ${errors[`${activeRoomIdx}-${gIdx}`]?.gender ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'} bg-slate-50 dark:bg-slate-800`}>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleInputChange(activeRoomIdx, gIdx, 'gender', 'male')}
                                                        className={`flex items-center justify-center gap-2 py-3 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${guest.gender === 'male' ? 'bg-primary text-white shadow-lg' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                                                    >
                                                        <span className="material-symbols-outlined text-base">male</span> {tSummary('male', currentLang)}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleInputChange(activeRoomIdx, gIdx, 'gender', 'female')}
                                                        className={`flex items-center justify-center gap-2 py-3 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${guest.gender === 'female' ? 'bg-primary text-white shadow-lg' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                                                    >
                                                        <span className="material-symbols-outlined text-base">female</span> {tSummary('female', currentLang)}
                                                    </button>
                                                </div>
                                            </div>

                                            {gIdx === 0 && guest.type === 'Adult' && (
                                                <>
                                                    <div className="space-y-1.5">
                                                        <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">{tSummary('emailAddress', currentLang)}</label>
                                                        <input
                                                            data-field={`${activeRoomIdx}-${gIdx}-email`}
                                                            required
                                                            type="email"
                                                            className={`w-full bg-slate-50 dark:bg-slate-800 border ${errors[`${activeRoomIdx}-${gIdx}`]?.email ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'} p-3.5 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold text-sm`}
                                                            placeholder={tSummary('enterEmail', currentLang)}
                                                            value={guest.email}
                                                            onChange={(e) => handleInputChange(activeRoomIdx, gIdx, 'email', e.target.value)}
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <PhoneInput 
                                                            label={tSummary('phoneNumber', currentLang)}
                                                            value={guest.phone}
                                                            onChange={(val) => handleInputChange(activeRoomIdx, gIdx, 'phone', val)}
                                                            error={errors[`${activeRoomIdx}-${gIdx}`]?.phone}
                                                        />
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {/* Booking Reference & Remark Section - Added for Book Service */}
                            {activeRoomIdx === roomsData.length - 1 && (
                                <div className="relative group animate-in fade-in slide-in-from-bottom-4 duration-700">
                                    <div className="absolute -inset-1 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 rounded-[40px] blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                    <div className="relative p-7 rounded-3xl border border-white/40 dark:border-white/10 bg-white/60 dark:bg-slate-900/60 backdrop-blur-3xl shadow-2xl">
                                        <div className="flex items-center gap-3 mb-7">
                                            <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                                <span className="material-symbols-outlined text-xl">receipt_long</span>
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-black uppercase tracking-tight" lang={currentLang === 'tr' ? 'tr' : 'en'}>{tSummary('bookingReferences', currentLang)}</h3>
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest" lang={currentLang === 'tr' ? 'tr' : 'en'}>{tSummary('internalIdentifiers', currentLang)}</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                            <div className="space-y-1.5">
                                                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1" lang={currentLang === 'tr' ? 'tr' : 'en'}>{tSummary('clientReferenceId', currentLang)}</label>
                                                <input
                                                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3.5 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold text-sm"
                                                    placeholder={tSummary('internalReferenceNumber', currentLang)}
                                                    value={clientReferenceId}
                                                    onChange={(e) => setClientReferenceId(e.target.value)}
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1" lang={currentLang === 'tr' ? 'tr' : 'en'}>{tSummary('specialRemarks', currentLang)}</label>
                                                <input
                                                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3.5 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold text-sm"
                                                    placeholder={tSummary('enterRemarks', currentLang)}
                                                    value={remark}
                                                    onChange={(e) => setRemark(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="pt-10 flex items-center justify-between">
                                <button
                                    type="button"
                                    onClick={() => activeRoomIdx > 0 ? setActiveRoomIdx(prev => prev - 1) : navigate(-1)}
                                    className="px-10 py-5 rounded-[24px] font-black text-[10px] uppercase tracking-[0.2em] text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all flex items-center gap-3"
                                    lang={currentLang === 'tr' ? 'tr' : 'en'}
                                >
                                    <span className="material-symbols-outlined text-[18px]">keyboard_backspace</span>
                                    {activeRoomIdx > 0 ? `${tSummary('backToRoom', currentLang)} ${activeRoomIdx}` : tSummary('backToSelection', currentLang)}
                                </button>
                                <button
                                    type="button"
                                    onClick={handleNext}
                                    className="px-12 py-5 bg-primary text-white rounded-[24px] font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl shadow-primary/30 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-3"
                                    lang={currentLang === 'tr' ? 'tr' : 'en'}
                                >
                                    {activeRoomIdx < roomsData.length - 1 ? (
                                        <>{tSummary('nextRoom', currentLang)} {activeRoomIdx + 2} <span className="material-symbols-outlined text-[18px]">arrow_forward</span></>
                                    ) : (
                                        <>{tSummary('reviewAndPay', currentLang)} <span className="material-symbols-outlined text-[18px]">credit_score</span></>
                                    )}
                                </button>
                            </div>
                        </div>
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
                                        <img
                                            src={hotelImage}
                                            alt={hotelName}
                                            className="w-full h-full object-cover"
                                        />
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
                                                    const adultsCount = checkRatesData?.rooms?.[0]?.rates?.[0]?.occupancy?.adults || roomState.reduce((s, r) => s + r.adults, 0);
                                                    const childrenCount = checkRatesData?.rooms?.[0]?.rates?.[0]?.occupancy?.child || roomState.reduce((s, r) => s + r.children, 0);
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
                                        const rawBoard = checkRatesData?.rooms?.[idx]?.rates?.[0]?.boardName || 'Room Only';
                                        const boardLabel = rawBoard.toLowerCase() === 'room only' 
                                            ? tSummary('roomOnly', currentLang) 
                                            : rawBoard;
                                        
                                        return (
                                            <div key={idx} className="relative p-4 rounded-[20px] bg-white/40 dark:bg-slate-800/40 border border-white/60 dark:border-white/5 shadow-sm">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div className="flex items-start gap-2.5">
                                                        <div className="size-6 rounded-lg bg-primary/10 flex items-center justify-center text-[10px] font-black text-primary shrink-0 mt-0.5">
                                                            {idx + 1}
                                                        </div>
                                                        <div>
                                                            <p className="font-black text-[13px] uppercase tracking-tight text-slate-900 dark:text-white line-clamp-2" lang="en">{room.name}</p>
                                                            <div className="flex flex-wrap gap-2 mt-1">
                                                                <p className="text-[11px] font-bold text-slate-500 uppercase" lang={currentLang === 'tr' ? 'tr' : 'en'}>
                                                                    {boardLabel}
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
                                                        <div className="flex items-baseline justify-end gap-1" lang="en">
                                                            <span className="text-base font-black text-primary leading-none">{getCurrencySymbol(room.currency)}</span>
                                                            <span className="font-black text-sm text-primary leading-none">
                                                                {(checkRatesData?.rooms?.[idx]?.rates?.[0]?.price?.totalPaymentAmount || room.rate).toFixed(2)}
                                                            </span>
                                                        </div>
                                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5" lang={currentLang === 'tr' ? 'tr' : 'en'}>
                                                            {room.currency || '$'} · {nights} {nights > 1 ? tSummary('nights', currentLang) : tSummary('night', currentLang)}
                                                        </p>
                                                    </div>
                                                </div>
                                                {/* Cancellation policy */}
                                                <div className="pt-2 border-t border-slate-100 dark:border-slate-700/50">
                                                    {(() => {
                                                        const currentPolicies = checkRatesData?.rooms?.[idx]?.rates?.[0]?.price?.cancellationPolicies || policies;
                                                        if (!currentPolicies || currentPolicies.length === 0) {
                                                            return (
                                                                <span className="text-[11px] font-bold text-slate-400 uppercase flex items-center gap-1" lang={currentLang === 'tr' ? 'tr' : 'en'}>
                                                                    <span className="material-symbols-outlined text-[12px]">info</span>
                                                                    {tSummary('standardCancellation', currentLang)}
                                                                </span>
                                                            );
                                                        }
                                                        return (
                                                            <div className="space-y-1">
                                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1" lang={currentLang === 'tr' ? 'tr' : 'en'}>{tSummary('cancellationPolicy', currentLang)}</p>
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
                                                                            }`} lang={currentLang === 'tr' ? 'tr' : 'en'}>
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
                                                        <div className="pt-2 mt-2 border-t border-slate-100 dark:border-slate-700/50">
                                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1" lang={currentLang === 'tr' ? 'tr' : 'en'}>{tSummary('dailyRates', currentLang)}</p>
                                                            <div className="space-y-1">
                                                                {currentDailyPrices.map((dp, dpIdx) => (
                                                                    <div key={dpIdx} className="flex justify-between items-center text-[9px]">
                                                                        <span className="font-medium text-slate-500">
                                                                            {new Date(dp.date).toLocaleDateString(currentLang, { day: '2-digit', month: 'short' })}
                                                                        </span>
                                                                        <span className="font-black text-slate-700 dark:text-slate-300" lang="en">
                                                                            {getCurrencySymbol(displayCurrency)} {dp.amount.toFixed(2)}
                                                                        </span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    );
                                                })()}

                                                {/* Room Specific Taxes */}
                                                {(() => {
                                                    const roomTaxes = checkRatesData?.rooms?.[idx]?.rates?.[0]?.price?.taxes;
                                                    if (!roomTaxes || roomTaxes.length === 0) return null;
                                                    return (
                                                        <div className="pt-2 mt-2 border-t border-slate-100 dark:border-slate-700/50">
                                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1" lang={currentLang === 'tr' ? 'tr' : 'en'}>{tSummary('taxesAndFees', currentLang)}</p>
                                                            <div className="space-y-1">
                                                                {roomTaxes.map((tax, tIdx) => (
                                                                    <div key={tIdx} className="flex justify-between items-center text-[9px]">
                                                                        <span className="font-medium text-slate-500 capitalize">
                                                                            {(tax.name || tax.type || 'Tax').replace(/_/g, ' ')}
                                                                        </span>
                                                                        <span className="font-black text-slate-700 dark:text-slate-300">
                                                                            {getCurrencySymbol(tax.currency || displayCurrency)} {tax.amount.toFixed(2)}
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



                                {/* Grand Total */}
                                <div className="pt-6 border-t border-slate-200 dark:border-slate-800 mb-6" lang={currentLang === 'tr' ? 'tr' : 'en'}>
                                    <div className="flex items-end justify-between">
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none mb-2">{tSummary('totalStayPrice', currentLang)}</p>
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-2xl font-black text-primary leading-none">{getCurrencySymbol(displayCurrency)}</span>
                                                <p className="text-4xl font-black text-primary leading-none tracking-tighter">
                                                    {isLoadingRates ? '...' : grandTotal.toFixed(2)}
                                                </p>
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

                                <p className="text-[10px] text-center text-slate-400 dark:text-slate-500 font-black uppercase tracking-[0.2em]" lang={currentLang === 'tr' ? 'tr' : 'en'}>
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
        </div>
    );
};

export default CheckoutGuestDetails;
