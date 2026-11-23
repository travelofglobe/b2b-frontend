import React, { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Footer from '../components/Footer';
import { hotelService } from '../services/hotelService';
import { guestService } from '../services/guestService';
import CheckoutStepper from '../components/CheckoutStepper';
import PhoneInput from '../components/PhoneInput';
import ConfirmationModal from '../components/ConfirmationModal';
import CheckoutTimer from '../components/CheckoutTimer';
import RefundPolicyTooltip from '../components/RefundPolicyTooltip';
import HotelReservationSummaryCard from '../components/HotelReservationSummaryCard';
import CrmGuestSelectionModal from '../components/CrmGuestSelectionModal';
import { useAuth } from '../context/AuthContext';

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
        message: "If you return to room selection, all entered guest details will be lost.",
        cancel: "Cancel",
        confirm: "Yes, Continue",
        backToRoomSelection: "Back to Room Selection",
        step2ReservationDetails: "Step 2 / 3: Reservation Details",
        autoFillAssistant: "Auto-Fill Assistant",
        autoFillDesc: "Complete the form with 1-click using your CRM or previous booking data.",
        autoFillAction: "Auto-Fill Details",
        enterGuestDetailsTitle: "Enter Guest Details",
        enterGuestDetailsNotice: "Please enter official information that exactly matches identity documents or passport upon hotel check-in.",
        leadGuestBadge: "LEAD GUEST",
        leadGuestTitle: "1. Guest (Lead Contact & Reservation Holder)",
        leadGuestNotice: "Reservation confirmation voucher and check-in details will be sent instantly to these contact channels.",
        selectFromCrm: "Select from Contacts",
        preferencesAndSpecialServices: "Personalized Preferences & Special Services",
        preferencesSubtitle: "Customize your stay according to your wishes, any extra fees will be detailed.",
        specialNotesLabel: "Special Notes to Hotel",
        specialNotesPlaceholder: "e.g. Flight arrives at 16:30, expected hotel check-in around 18:00...",
        unspecified: "Unspecified",
        proceedToPayment: "Proceed to Payment Step",
        securePaymentNote: "Secure payment with card or Google Pay in the next step.",
        crmSuggestionsTitle: "Saved Contacts (CRM)",
        autoFillActionShort: "Fill",
        keyboardNavTip: "↑↓ Navigate • Enter to select • Esc close",
        seeAllContacts: "View All",
        noCrmMatch: "No matching CRM record found",
        searchingCrm: "Searching CRM records..."
    },
    tr: {
        title: "Emin misiniz?",
        message: "Oda seçimine geri dönerseniz girdiğiniz tüm konuk bilgileri silinecektir.",
        cancel: "İptal",
        confirm: "Evet, Devam Et",
        backToRoomSelection: "Oda Seçimine Dön",
        step2ReservationDetails: "Adım 2 / 3: Rezervasyon Detayları",
        autoFillAssistant: "Hızlı Doldurma Asistanı",
        autoFillDesc: "Google profiliniz veya geçmiş rezervasyon verileriniz ile tek tıkla formu tamamlayın.",
        autoFillAction: "Bilgileri Otomatik Doldur",
        enterGuestDetailsTitle: "Misafir Bilgilerini Girin",
        enterGuestDetailsNotice: "Otele giriş esnasında kimlik belgesi veya pasaportla tam eşleşecek resmi bilgileri eksiksiz belirtiniz.",
        leadGuestBadge: "ASIL MİSAFİR",
        leadGuestTitle: "1. Misafir (Ana İletişim & Rezervasyon Sahibi)",
        leadGuestNotice: "Rezervasyon onay belgesi ve giriş bilgileri bu iletişim kanallarına anında gönderilir.",
        selectFromCrm: "Kayıtlı Kişilerden Seç",
        preferencesAndSpecialServices: "Kişiselleştirilmiş Tercihler & Özel Hizmetler",
        preferencesSubtitle: "İsteğinize göre konaklamanızı özelleştirin, ek ücretler ayrıntılandırılır.",
        specialNotesLabel: "Otele İletmek İstediğiniz Özel Notlar",
        specialNotesPlaceholder: "Varsa otele iletmek istediğiniz özel isteklerinizi veya tahmini varış saatinizi belirtebilirsiniz...",
        unspecified: "Belirtme",
        proceedToPayment: "Ödeme Adımına İlerle",
        securePaymentNote: "Sonraki adımda kart veya Google Pay ile güvenli ödeme yapılır.",
        crmSuggestionsTitle: "Kayıtlı Kişiler (CRM)",
        autoFillActionShort: "Doldur",
        keyboardNavTip: "↑↓ Gezin • Enter ile seç • Esc kapat",
        seeAllContacts: "Tümünü Gör",
        noCrmMatch: "Eşleşen CRM kaydı bulunamadı",
        searchingCrm: "CRM aranıyor..."
    },
    ar: {
        title: "هل أنت متأكد؟",
        message: "إذا عدت إلى اختيار الغرفة، فستفقد جميع تفاصيل النزلاء التي تم إدخالها.",
        cancel: "إلغاء",
        confirm: "نعم، استمر",
        backToRoomSelection: "العودة إلى اختيار الغرفة",
        step2ReservationDetails: "الخطوة 2 / 3: تفاصيل الحجز",
        autoFillAssistant: "مساعد التعبئة التلقائية",
        autoFillDesc: "أكمل النموذج بنقرة واحدة باستخدام ملفك الشخصي أو بيانات الحجوزات السابقة.",
        autoFillAction: "تعبئة البيانات تلقائياً",
        enterGuestDetailsTitle: "أدخل بيانات النزلاء",
        enterGuestDetailsNotice: "يرجى إدخال البيانات الرسمية المطابقة تماماً لوثيقة الهوية أو جواز السفر عند تسجيل الوصول.",
        leadGuestBadge: "النزيل الرئيسي",
        leadGuestTitle: "1. النزيل (جهة الاتصال الرئيسية وصاحب الحجز)",
        leadGuestNotice: "سيتم إرسال قسيمة تأكيد الحجز وتفاصيل الدخول فوراً عبر قنوات الاتصال هذه.",
        selectFromCrm: "اختر من جهات الاتصال",
        preferencesAndSpecialServices: "التفضيلات والخدمات الخاصة",
        preferencesSubtitle: "خصص إقامتك حسب رغبتك.",
        specialNotesLabel: "ملاحظات خاصة للفندق",
        specialNotesPlaceholder: "مثال: رحلتنا تصل في 16:30، وتسجيل الوصول حوالي 18:00...",
        unspecified: "غير محدد",
        proceedToPayment: "الانتقال إلى خطوة الدفع",
        securePaymentNote: "دفع آمن بالبطاقة أو Google Pay في الخطوة التالية."
    },
    es: {
        title: "¿Está seguro?",
        message: "Si regresa a la selección de habitación, se perderán todos los datos ingresados de los huéspedes.",
        cancel: "Cancelar",
        confirm: "Sí, continuar",
        backToRoomSelection: "Volver a la selección de habitación",
        step2ReservationDetails: "Paso 2 / 3: Detalles de la reserva",
        autoFillAssistant: "Asistente de Autocompletado",
        autoFillDesc: "Complete el formulario con un clic usando su perfil o reservas anteriores.",
        autoFillAction: "Autocompletar datos",
        enterGuestDetailsTitle: "Introducir los datos de los huéspedes",
        enterGuestDetailsNotice: "Introduzca los datos oficiales que coincidan con el documento de identidad o pasaporte al registrarse.",
        leadGuestBadge: "HUÉSPED PRINCIPAL",
        leadGuestTitle: "1. Huésped (Contacto principal y Titular)",
        leadGuestNotice: "El bono de reserva y los detalles de acceso se enviarán al instante a estos canales de contacto.",
        selectFromCrm: "Elegir de contactos guardados",
        preferencesAndSpecialServices: "Preferencias Personalizadas y Servicios Especiales",
        preferencesSubtitle: "Personalice su estancia según sus deseos.",
        specialNotesLabel: "Notas especiales para el hotel",
        specialNotesPlaceholder: "ej. El vuelo llega a las 16:30, llegada estimada al hotel hacia las 18:00...",
        unspecified: "No especificado",
        proceedToPayment: "Continuar al paso de pago",
        securePaymentNote: "Pago seguro con tarjeta o Google Pay en el siguiente paso."
    },
    ru: {
        title: "Вы уверены?",
        message: "Если вы вернетесь к выбору номера, все введенные данные гостей будут утеряны.",
        cancel: "Отмена",
        confirm: "Да, продолжить",
        backToRoomSelection: "Вернуться к выбору номера",
        step2ReservationDetails: "Шаг 2 / 3: Данные бронирования",
        autoFillAssistant: "Ассистент автозаполнения",
        autoFillDesc: "Заполните форму в один клик данными из профиля или прошлых бронирований.",
        autoFillAction: "Заполнить автоматически",
        enterGuestDetailsTitle: "Введите данные гостей",
        enterGuestDetailsNotice: "Укажите официальные данные, в точности совпадающие с паспортом при заселении.",
        leadGuestBadge: "ОСНОВНОЙ ГОСТЬ",
        leadGuestTitle: "1. Гость (Основной контакт и держатель брони)",
        leadGuestNotice: "Ваучер бронирования и данные для заселения будут отправлены на эти контакты.",
        selectFromCrm: "Выбрать из контактов",
        preferencesAndSpecialServices: "Индивидуальные предпочтения и услуги",
        preferencesSubtitle: "Настройте проживание по вашему желанию.",
        specialNotesLabel: "Особые пожелания для отеля",
        specialNotesPlaceholder: "например: Прилет в 16:30, заезд в отель ориентировочно в 18:00...",
        unspecified: "Не указано",
        proceedToPayment: "Перейти к оплате",
        securePaymentNote: "Безопасная оплата картой или Google Pay на следующем шаге."
    },
    zh: {
        title: "您确定吗？",
        message: "如果您返回选择客房，所有已输入的旅客信息都将丢失。",
        cancel: "取消",
        confirm: "是的，继续",
        backToRoomSelection: "返回选择客房",
        step2ReservationDetails: "步骤 2 / 3: 预订详情",
        autoFillAssistant: "快速自动填充助手",
        autoFillDesc: "一键使用您的个人资料或历史预订快速完成表单填写。",
        autoFillAction: "自动填充信息",
        enterGuestDetailsTitle: "填写住客信息",
        enterGuestDetailsNotice: "请准确填写与入住时出示的身份证件或护照完全一致的官方信息。",
        leadGuestBadge: "主要住客",
        leadGuestTitle: "1. 住客（主要联系人及预订人）",
        leadGuestNotice: "预订确认凭证及入住信息将即时发送至此联系渠道。",
        selectFromCrm: "从联系人中选择",
        preferencesAndSpecialServices: "个性化偏好与特别服务",
        preferencesSubtitle: "根据您的需要定制住宿体验。",
        specialNotesLabel: "给酒店的特别要求",
        specialNotesPlaceholder: "例如：航班于 16:30 抵达，预计于 18:00 左右办理入住...",
        unspecified: "不透露",
        proceedToPayment: "前往支付步骤",
        securePaymentNote: "下一步将通过信用卡或 Google Pay 进行安全支付。"
    },
    ja: {
        title: "よろしいですか？",
        message: "客室選択に戻ると、入力されたすべての宿泊者情報が失われます。",
        cancel: "キャンセル",
        confirm: "はい、続行します",
        backToRoomSelection: "客室選択に戻る",
        step2ReservationDetails: "ステップ 2 / 3: 予約詳細",
        autoFillAssistant: "自動入力アシスタント",
        autoFillDesc: "プロフィールや過去の予約データからワンクリックでフォームを入力できます。",
        autoFillAction: "情報を自動入力",
        enterGuestDetailsTitle: "宿泊者情報の入力",
        enterGuestDetailsNotice: "チェックイン時の身分証明書やパスポートと完全に一致する正式な情報を入力してください。",
        leadGuestBadge: "代表宿泊者",
        leadGuestTitle: "1. 宿泊者（メイン連絡先・予約代表者）",
        leadGuestNotice: "予約確認バウチャーとチェックイン詳細はこれらの連絡先に即座に送信されます。",
        selectFromCrm: "連絡先から選択",
        preferencesAndSpecialServices: "カスタマイズ・特別リクエスト",
        preferencesSubtitle: "ご要望に応じて滞在をカスタマイズいただけます。",
        specialNotesLabel: "ホテルへの特別リクエスト",
        specialNotesPlaceholder: "例：フライトが16:30に到着予定のため、ホテルへのチェックインは18:00頃になります...",
        unspecified: "指定なし",
        proceedToPayment: "お支払いへ進む",
        securePaymentNote: "次のステップでカードまたはGoogle Payによる安全な決済が行われます。"
    },
    fa: {
        title: "آیا مطمئن هستید؟",
        message: "در صورت بازگشت به انتخاب اتاق، تمام اطلاعات وارد شده مهمانان پاک خواهد شد.",
        cancel: "لغو",
        confirm: "بله، ادامه دهید",
        backToRoomSelection: "بازگشت به انتخاب اتاق",
        step2ReservationDetails: "مرحله ۲ / ۳: جزئیات رزرو",
        autoFillAssistant: "دستیار تکمیل سریع فرم",
        autoFillDesc: "با یک کلیک از طریق اطلاعات ذخیره شده فرم را تکمیل کنید.",
        autoFillAction: "تکمیل خودکار اطلاعات",
        enterGuestDetailsTitle: "وارد کردن اطلاعات مهمانان",
        enterGuestDetailsNotice: "لطفاً اطلاعات رسمی مطابق با مدارک هویتی یا پاسپورت را دقیق وارد نمایید.",
        leadGuestBadge: "مهمان اصلی",
        leadGuestTitle: "۱. مهمان (مخاطب اصلی و صاحب رزرو)",
        leadGuestNotice: "ووچر تأیید رزرو و اطلاعات پذیرش به این اطلاعات تماس ارسال خواهد شد.",
        selectFromCrm: "انتخاب از مخاطبین",
        preferencesAndSpecialServices: "ترجیحات اختصاصی و خدمات ویژه",
        preferencesSubtitle: "اقامت خود را سفارشی‌سازی کنید.",
        specialNotesLabel: "یادداشت‌های ویژه به هتل",
        specialNotesPlaceholder: "مثال: پرواز ما ساعت ۱۶:۳۰ می‌نشیند و ورود ما حدود ساعت ۱۸:۰۰ خواهد بود...",
        unspecified: "عدم ذکر",
        proceedToPayment: "ادامه به مرحله پرداخت",
        securePaymentNote: "پرداخت امن در مرحله بعد انجام می‌شود."
    },
    fr: {
        title: "Êtes-vous sûr ?",
        message: "Si vous retournez au choix de la chambre, toutes les coordonnées des voyageurs saisies seront perdues.",
        cancel: "Annuler",
        confirm: "Oui, continuer",
        backToRoomSelection: "Retour au choix de chambre",
        step2ReservationDetails: "Étape 2 / 3 : Détails de la réservation",
        autoFillAssistant: "Assistant de remplissage rapide",
        autoFillDesc: "Complétez le formulaire en 1 clic grâce à votre profil ou réservations passées.",
        autoFillAction: "Remplir automatiquement",
        enterGuestDetailsTitle: "Saisir les informations des voyageurs",
        enterGuestDetailsNotice: "Veuillez renseigner les informations officielles correspondant exactement à la pièce d'identité ou au passeport.",
        leadGuestBadge: "VOYAGEUR PRINCIPAL",
        leadGuestTitle: "1. Voyageur (Contact principal & Responsable)",
        leadGuestNotice: "Le bon de réservation et les détails d'accès seront envoyés immédiatement à ces coordonnées.",
        selectFromCrm: "Choisir parmi les contacts",
        preferencesAndSpecialServices: "Préférences personnalisées & Services spéciaux",
        preferencesSubtitle: "Personnalisez votre séjour selon vos souhaits.",
        specialNotesLabel: "Demandes particulières pour l'hôtel",
        specialNotesPlaceholder: "ex. Vol arrivant à 16h30, arrivée prévue à l'hôtel vers 18h00...",
        unspecified: "Non spécifié",
        proceedToPayment: "Passer à l'étape du paiement",
        securePaymentNote: "Paiement sécurisé par carte bancaire ou Google Pay à l'étape suivante."
    },
    it: {
        title: "Sei sicuro?",
        message: "Se torni alla scelta della camera, tutti i dettagli degli ospiti inseriti andranno persi.",
        cancel: "Annulla",
        confirm: "Sì, continua",
        backToRoomSelection: "Torna alla scelta camera",
        step2ReservationDetails: "Passo 2 / 3: Dettagli prenotazione",
        autoFillAssistant: "Assistente compilazione rapida",
        autoFillDesc: "Completa il modulo in 1 clic con il tuo profilo o i dati salvati.",
        autoFillAction: "Compila automaticamente",
        enterGuestDetailsTitle: "Inserisci i dati degli ospiti",
        enterGuestDetailsNotice: "Inserisci le informazioni ufficiali corrispondenti esattamente al documento di identità o passaporto.",
        leadGuestBadge: "OSPITE PRINCIPALE",
        leadGuestTitle: "1. Ospite (Contatto principale e Titolare prenotazione)",
        leadGuestNotice: "Il voucher di conferma e i dettagli di accesso verranno inviati immediatamente a questi recapiti.",
        selectFromCrm: "Seleziona da contatti",
        preferencesAndSpecialServices: "Preferenze personalizzate & Servizi speciali",
        preferencesSubtitle: "Personalizza il tuo soggiorno secondo i tuoi desideri.",
        specialNotesLabel: "Note speciali per l'hotel",
        specialNotesPlaceholder: "es. Volo in arrivo alle 16:30, check-in previsto in hotel verso le 18:00...",
        unspecified: "Non specificato",
        proceedToPayment: "Procedi al pagamento",
        securePaymentNote: "Pagamento sicuro con carta o Google Pay al passaggio successivo."
    },
    el: {
        title: "Είστε σίγουροι;",
        message: "Εάν επιστρέψετε στην επιλογή δωματίου, όλα τα στοιχεία επισκεπτών που καταχωρίσατε θα χαθούν.",
        cancel: "Ακύρωση",
        confirm: "Ναι, συνέχεια",
        backToRoomSelection: "Επιστροφή στην επιλογή δωματίου",
        step2ReservationDetails: "Βήμα 2 / 3: Στοιχεία κράτησης",
        autoFillAssistant: "Βοηθός γρήγορης συμπλήρωσης",
        autoFillDesc: "Συμπληρώστε τη φόρμα με 1 κλικ από το προφίλ ή τα αποθηκευμένα στοιχεία σας.",
        autoFillAction: "Αυτόματη συμπλήρωση",
        enterGuestDetailsTitle: "Εισαγωγή στοιχείων επισκεπτών",
        enterGuestDetailsNotice: "Παρακαλούμε καταχωρίστε τα επίσημα στοιχεία που ταυτίζονται με την ταυτότητα ή το διαβατήριο κατά το check-in.",
        leadGuestBadge: "ΚΥΡΙΟΣ ΕΠΙΣΚΕΠΤΗΣ",
        leadGuestTitle: "1. Επισκέπτης (Κύρια επικοινωνία & Κάτοχος κράτησης)",
        leadGuestNotice: "Το κουπόνι επιβεβαίωσης θα αποσταλεί άμεσα σε αυτά τα στοιχεία επικοινωνίας.",
        selectFromCrm: "Επιλογή από επαφές",
        preferencesAndSpecialServices: "Εξατομικευμένες προτιμήσεις & Ειδικές υπηρεσίες",
        preferencesSubtitle: "Προσαρμόστε τη διαμονή σας.",
        specialNotesLabel: "Ειδικές σημειώσεις για το ξενοδοχείο",
        specialNotesPlaceholder: "π.χ. Άφιξη πτήσης στις 16:30, αναμενόμενο check-in στις 18:00...",
        unspecified: "Δεν δηλώνεται",
        proceedToPayment: "Συνέχεια στο βήμα πληρωμής",
        securePaymentNote: "Ασφαλής πληρωμή με κάρτα ή Google Pay στο επόμενο βήμα."
    },
    pt: {
        title: "Tem certeza?",
        message: "Se você retornar à seleção de quartos, todos os detalhes do hóspede inseridos serão perdidos.",
        cancel: "Cancelar",
        confirm: "Sim, continuar",
        backToRoomSelection: "Voltar à seleção de quarto",
        step2ReservationDetails: "Passo 2 / 3: Detalhes da reserva",
        autoFillAssistant: "Assistente de Preenchimento Rápido",
        autoFillDesc: "Complete o formulário em 1 clique usando seu perfil ou reservas anteriores.",
        autoFillAction: "Preencher dados automaticamente",
        enterGuestDetailsTitle: "Inserir dados dos hóspedes",
        enterGuestDetailsNotice: "Insira as informações oficiais que coincidam exatamente com o documento de identidade ou passaporte no check-in.",
        leadGuestBadge: "HÓSPEDE PRINCIPAL",
        leadGuestTitle: "1. Hóspede (Contato principal e Titular da reserva)",
        leadGuestNotice: "O voucher de confirmação e detalhes de acesso serão enviados imediatamente para esses contatos.",
        selectFromCrm: "Selecionar dos contatos",
        preferencesAndSpecialServices: "Preferências Personalizadas e Serviços Especiais",
        preferencesSubtitle: "Personalize sua estadia de acordo com suas preferências.",
        specialNotesLabel: "Observações especiais para o hotel",
        specialNotesPlaceholder: "ex: Voo chega às 16:30, check-in previsto por volta das 18:00...",
        unspecified: "Não especificado",
        proceedToPayment: "Avançar para a etapa de pagamento",
        securePaymentNote: "Pagamento seguro com cartão ou Google Pay na próxima etapa."
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
        invalidEmail: "Please enter a valid email address (e.g. name@example.com)",
        invalidPhone: "Please enter a valid phone number",
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
        invalidEmail: "Lütfen geçerli bir e-posta adresi giriniz (ör: ad@ornek.com)",
        invalidPhone: "Lütfen geçerli bir telefon numarası giriniz",
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

const PREFERENCE_OPTIONS = [
    { id: 'quiet_room', labelTr: 'Sessiz Oda Talebi', labelEn: 'Quiet Room Request' },
    { id: 'non_smoking', labelTr: 'Sigara İçilmeyen Oda Talebi', labelEn: 'Non-Smoking Room Request' },
    { id: 'high_floor', labelTr: 'Yüksek Kat Talebi', labelEn: 'High Floor Request' },
    { id: 'early_checkin', labelTr: 'Erken Giriş Talebi', labelEn: 'Early Check-in Request' },
    { id: 'late_checkout', labelTr: 'Geç Çıkış Talebi', labelEn: 'Late Check-out Request' }
];

const CheckoutGuestDetails = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { i18n } = useTranslation();
    const { agencyCurrency } = useAuth();
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
    const [selectedPreferences, setSelectedPreferences] = useState([]);

    const togglePreference = (pref) => {
        const isSelected = selectedPreferences.includes(pref.id);
        const updated = isSelected
            ? selectedPreferences.filter(id => id !== pref.id)
            : [...selectedPreferences, pref.id];
        setSelectedPreferences(updated);

        const prefLabel = currentLang === 'tr' ? pref.labelTr : pref.labelEn;
        if (!isSelected) {
            setRemark(prev => prev ? `${prev}\n• ${prefLabel}` : `• ${prefLabel}`);
        } else {
            setRemark(prev => prev.replace(new RegExp(`\\n?• ${prefLabel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`), '').trim());
        }
    };

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
        const mainContainer = document.querySelector('main');
        if (mainContainer) {
            mainContainer.scrollTop = 0;
        }
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
                                let rateAdults = null;
                                let rateChildren = null;
                                let rateChildAges = null;
                                try {
                                    const rawRateCode = room.hubRateModel?.rateCode || room.rateCode;
                                    if (rawRateCode) {
                                        const decoded = JSON.parse(atob(rawRateCode));
                                        if (typeof decoded.adultCount === 'number') {
                                            rateAdults = decoded.adultCount;
                                        }
                                        if (Array.isArray(decoded.childrenAges)) {
                                            rateChildren = decoded.childrenAges.length;
                                            rateChildAges = decoded.childrenAges;
                                        }
                                    }
                                } catch (e) { }

                                const occ = room.hubRateModel?.occupancy;
                                if (rateAdults === null && occ && typeof occ.adults === 'number') {
                                    rateAdults = occ.adults;
                                }
                                if (rateChildren === null && occ && typeof occ.child === 'number') {
                                    rateChildren = occ.child;
                                }

                                const config = (session.roomState || [])[roomIdx] || { adults: 1, children: 0, childAges: [] };
                                const adults = rateAdults !== null ? rateAdults : (config.adults || 1);
                                const children = rateChildren !== null ? rateChildren : (config.children || 0);
                                const childAges = rateChildAges !== null ? rateChildAges : (config.childAges || []);

                                const guests = [];
                                for (let i = 0; i < adults; i++) {
                                    guests.push({ type: 'Adult', firstName: '', lastName: '', email: '', phone: '', birthDate: '', gender: '' });
                                }
                                for (let i = 0; i < children; i++) {
                                    guests.push({ type: 'Child', age: childAges[i] !== undefined ? childAges[i] : 0, firstName: '', lastName: '', birthDate: '', gender: '' });
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
    const [emailTouched, setEmailTouched] = useState({});

    // CRM Autocomplete Suggestion States
    const [activeAutocomplete, setActiveAutocomplete] = useState(null); // { roomIdx, guestIdx, field, query }
    const [crmSuggestions, setCrmSuggestions] = useState([]);
    const [isCrmSuggestLoading, setIsCrmSuggestLoading] = useState(false);
    const [autocompleteSelectedIndex, setAutocompleteSelectedIndex] = useState(-1);
    const autocompleteDropdownRef = useRef(null);
    const crmAbortRef = useRef(null);

    const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email ? email.trim() : '');

    const handleInputChange = (roomIdx, guestIdx, field, value) => {
        const newData = [...roomsData];

        let filteredValue = value;
        // Validation for Name fields: only letters and spaces allowed
        if (field === 'firstName' || field === 'lastName') {
            // Remove numbers and special characters (keeping Turkish characters)
            filteredValue = value.replace(/[^a-zA-Z\sğüşıöçĞÜŞİÖÇ]/g, '');
            newData[roomIdx].guests[guestIdx][field] = filteredValue;
        } else {
            newData[roomIdx].guests[guestIdx][field] = value;
        }

        // Live error clearing when valid
        const errKey = `${roomIdx}-${guestIdx}`;
        if (errors[errKey]?.[field]) {
            let isValidNow = false;
            if (field === 'email') {
                isValidNow = validateEmail(value);
            } else if (field === 'firstName' || field === 'lastName' || field === 'gender') {
                isValidNow = Boolean(value && value.trim().length > 0);
            } else if (field === 'birthDate') {
                isValidNow = validateBirthDate(value);
            }
            if (isValidNow) {
                setErrors(prev => ({
                    ...prev,
                    [errKey]: {
                        ...prev[errKey],
                        [field]: false
                    }
                }));
            }
        }

        setRoomsData(newData);

        // CRM Autocomplete trigger for first name, last name, and email fields
        if (field === 'firstName' || field === 'lastName' || field === 'email') {
            const queryVal = (field === 'firstName' || field === 'lastName') ? filteredValue : value;
            if (queryVal && queryVal.trim().length >= 2) {
                setActiveAutocomplete({
                    roomIdx,
                    guestIdx,
                    field,
                    query: queryVal.trim()
                });
            } else {
                setActiveAutocomplete(null);
                setCrmSuggestions([]);
                setAutocompleteSelectedIndex(-1);
            }
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

    const applyCrmGuest = (roomIdx, guestIdx, crmGuest) => {
        if (!crmGuest || roomIdx === undefined || guestIdx === undefined) return;

        const newData = roomsData.map((room, rIdx) => {
            if (rIdx === roomIdx) {
                return {
                    ...room,
                    guests: room.guests.map((guest, gIdx) => {
                        if (gIdx === guestIdx) {
                            const updatedGuest = { ...guest };

                            if (crmGuest.firstName) {
                                updatedGuest.firstName = crmGuest.firstName.replace(/[^a-zA-Z\sğüşıöçĞÜŞİÖÇ]/g, '');
                            }
                            if (crmGuest.lastName) {
                                updatedGuest.lastName = crmGuest.lastName.replace(/[^a-zA-Z\sğüşıöçĞÜŞİÖÇ]/g, '');
                            }

                            if (crmGuest.email && guest.type === 'Adult' && roomIdx === 0 && guestIdx === 0) {
                                updatedGuest.email = crmGuest.email;
                            }

                            if (crmGuest.phoneNumber && guest.type === 'Adult' && roomIdx === 0 && guestIdx === 0) {
                                updatedGuest.phone = `${crmGuest.phoneCountryCode || '+90'} ${crmGuest.phoneNumber}`.trim();
                            }

                            if (crmGuest.gender) {
                                const gLower = crmGuest.gender.toLowerCase();
                                updatedGuest.gender = gLower === 'female' ? 'female' : 'male';
                            }

                            if (crmGuest.birthDate) {
                                const b = crmGuest.birthDate;
                                if (b.includes('.')) {
                                    const parts = b.split('.');
                                    if (parts.length === 3) {
                                        updatedGuest.birthDate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
                                    }
                                } else if (b.includes('-')) {
                                    updatedGuest.birthDate = b.split('T')[0];
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

        // Clear error flags for this guest
        const errKey = `${roomIdx}-${guestIdx}`;
        setErrors(prev => {
            const nextErrors = { ...prev };
            delete nextErrors[errKey];
            return nextErrors;
        });

        if (crmGuest.email && roomIdx === 0 && guestIdx === 0) {
            setEmailTouched(prev => ({ ...prev, [errKey]: true }));
        }

        setIsCrmModalOpen(false);
        setTargetGuestIndex(null);
        setActiveAutocomplete(null);
        setCrmSuggestions([]);
        setAutocompleteSelectedIndex(-1);
    };

    const handleCrmGuestSelect = (crmGuest) => {
        if (!targetGuestIndex) return;
        const { roomIdx, guestIdx } = targetGuestIndex;
        applyCrmGuest(roomIdx, guestIdx, crmGuest);
    };

    // Debounced CRM search for active autocomplete input
    useEffect(() => {
        if (!activeAutocomplete || !activeAutocomplete.query || activeAutocomplete.query.trim().length < 2) {
            setCrmSuggestions([]);
            setIsCrmSuggestLoading(false);
            setAutocompleteSelectedIndex(-1);
            return;
        }

        const queryText = activeAutocomplete.query.trim();

        if (crmAbortRef.current) {
            crmAbortRef.current.abort();
        }
        const controller = new AbortController();
        crmAbortRef.current = controller;

        setIsCrmSuggestLoading(true);

        const timer = setTimeout(async () => {
            try {
                const response = await guestService.filterGuests(
                    { query: queryText },
                    0,
                    6,
                    controller.signal
                );
                if (response) {
                    const content = response.content || response.guests || response.agencyCrmGuests || (Array.isArray(response) ? response : []);
                    setCrmSuggestions(content || []);
                    setAutocompleteSelectedIndex(-1);
                }
            } catch (err) {
                if (err.name !== 'AbortError' && err.code !== 'ERR_CANCELED') {
                    console.error('CRM autocomplete search error:', err);
                    setCrmSuggestions([]);
                }
            } finally {
                setIsCrmSuggestLoading(false);
            }
        }, 220);

        return () => {
            clearTimeout(timer);
            controller.abort();
        };
    }, [activeAutocomplete?.query, activeAutocomplete?.roomIdx, activeAutocomplete?.guestIdx, activeAutocomplete?.field]);

    // Click outside to dismiss CRM autocomplete dropdown
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (autocompleteDropdownRef.current && !autocompleteDropdownRef.current.contains(e.target)) {
                if (e.target.closest && e.target.closest('[data-autocomplete-input]')) {
                    return;
                }
                setActiveAutocomplete(null);
                setCrmSuggestions([]);
                setAutocompleteSelectedIndex(-1);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('touchstart', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
        };
    }, []);

    const handleKeyDownAutocomplete = (e, roomIdx, guestIdx) => {
        if (!activeAutocomplete || crmSuggestions.length === 0) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setAutocompleteSelectedIndex(prev => (prev < crmSuggestions.length - 1 ? prev + 1 : 0));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setAutocompleteSelectedIndex(prev => (prev > 0 ? prev - 1 : crmSuggestions.length - 1));
        } else if (e.key === 'Enter') {
            if (autocompleteSelectedIndex >= 0 && autocompleteSelectedIndex < crmSuggestions.length) {
                e.preventDefault();
                applyCrmGuest(roomIdx, guestIdx, crmSuggestions[autocompleteSelectedIndex]);
            }
        } else if (e.key === 'Escape') {
            e.preventDefault();
            setActiveAutocomplete(null);
            setCrmSuggestions([]);
            setAutocompleteSelectedIndex(-1);
        }
    };

    const handleInputFocus = (roomIdx, guestIdx, field, val) => {
        if (val && val.trim().length >= 2) {
            setActiveAutocomplete({
                roomIdx,
                guestIdx,
                field,
                query: val.trim()
            });
        }
    };

    const renderCrmAutocompleteDropdown = (roomIdx, guestIdx, field) => {
        const isThisFieldActive =
            activeAutocomplete &&
            activeAutocomplete.roomIdx === roomIdx &&
            activeAutocomplete.guestIdx === guestIdx &&
            activeAutocomplete.field === field &&
            (crmSuggestions.length > 0 || isCrmSuggestLoading);

        if (!isThisFieldActive) return null;

        return (
            <div
                ref={autocompleteDropdownRef}
                className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 bg-white dark:bg-[#1e2023] rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.18)] border border-slate-200/90 dark:border-slate-700/80 overflow-hidden animate-in fade-in slide-in-from-top-1.5 duration-150"
            >
                {/* Header */}
                <div className="px-3.5 py-2 bg-slate-50 dark:bg-slate-800/70 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200">
                        <span className="material-symbols-outlined text-[16px] text-[#0b57d0]">contact_page</span>
                        <span>{cl.crmSuggestionsTitle || "Kayıtlı Kişiler (CRM)"}</span>
                    </div>
                    <span className="text-[11px] text-slate-400 font-medium">
                        {isCrmSuggestLoading ? (
                            <span className="inline-flex items-center gap-1 text-[#0b57d0] dark:text-blue-400">
                                <span className="size-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></span>
                                <span>{cl.searchingCrm || "Aranıyor..."}</span>
                            </span>
                        ) : (
                            `${crmSuggestions.length} ${cl.records || "kayıt"}`
                        )}
                    </span>
                </div>

                {/* Body */}
                {isCrmSuggestLoading && crmSuggestions.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                        <span className="size-3.5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></span>
                        <span>{cl.searchingCrm || "CRM kayıtları taranıyor..."}</span>
                    </div>
                ) : crmSuggestions.length === 0 ? (
                    <div className="p-3.5 text-center text-xs text-slate-400">
                        {cl.noCrmMatch || "Eşleşen CRM kaydı bulunamadı"}
                    </div>
                ) : (
                    <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
                        {crmSuggestions.map((item, idx) => {
                            const isSelected = autocompleteSelectedIndex === idx;
                            const isFemale = item.gender?.toUpperCase() === 'FEMALE';
                            return (
                                <button
                                    key={item.id || idx}
                                    type="button"
                                    onMouseDown={(e) => {
                                        e.preventDefault();
                                        applyCrmGuest(roomIdx, guestIdx, item);
                                    }}
                                    onMouseEnter={() => setAutocompleteSelectedIndex(idx)}
                                    className={`w-full text-left px-3.5 py-2.5 flex items-center gap-3 transition-colors cursor-pointer ${
                                        isSelected
                                            ? 'bg-blue-50/90 dark:bg-blue-950/50'
                                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                                    }`}
                                >
                                    {/* Avatar */}
                                    <div className={`size-8 rounded-full flex items-center justify-center shrink-0 text-xs font-semibold ${
                                        isFemale
                                            ? 'bg-pink-100 text-pink-700 dark:bg-pink-950/60 dark:text-pink-300'
                                            : 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                                    }`}>
                                        <span className="material-symbols-outlined text-[17px]">
                                            {isFemale ? 'female' : 'person'}
                                        </span>
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                                {item.firstName} {item.lastName}
                                            </span>
                                            {item.birthDate && (
                                                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 shrink-0">
                                                    {item.birthDate}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2.5 mt-0.5 text-[11px] text-slate-500 dark:text-slate-400 truncate">
                                            {item.email && (
                                                <span className="truncate flex items-center gap-1">
                                                    <span className="material-symbols-outlined text-[12px] text-slate-400">mail</span>
                                                    <span className="truncate">{item.email}</span>
                                                </span>
                                            )}
                                            {item.phoneNumber && (
                                                <span className="shrink-0 flex items-center gap-1">
                                                    <span className="material-symbols-outlined text-[12px] text-slate-400">phone</span>
                                                    <span>{item.phoneCountryCode || '+90'} {item.phoneNumber}</span>
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Action button */}
                                    <div className="shrink-0">
                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#e8f0fe] text-[#0b57d0] dark:bg-blue-950/80 dark:text-blue-300 border border-blue-200/50 dark:border-blue-800/40">
                                            {cl.autoFillActionShort || "Doldur"}
                                        </span>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}

                {/* Footer hints */}
                <div className="px-3.5 py-1.5 bg-slate-50/90 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 flex items-center justify-between">
                    <span>{cl.keyboardNavTip || "↑↓ Gezin • Enter ile seç • Esc kapat"}</span>
                    <button
                        type="button"
                        onMouseDown={(e) => {
                            e.preventDefault();
                            setTargetGuestIndex({ roomIdx, guestIdx });
                            setIsCrmModalOpen(true);
                            setActiveAutocomplete(null);
                        }}
                        className="text-[#0b57d0] dark:text-blue-400 hover:underline font-medium cursor-pointer"
                    >
                        {cl.seeAllContacts || "Tümünü Gör"}
                    </button>
                </div>
            </div>
        );
    };

    const isRoomCompleted = (roomIdx) => {
        const room = roomsData[roomIdx];
        if (!room || !room.guests || room.guests.length === 0) return false;
        return room.guests.every((guest, gIdx) => {
            const hasName = Boolean(guest.firstName && guest.firstName.trim().length > 0 && guest.lastName && guest.lastName.trim().length > 0);
            const hasGender = Boolean(guest.gender);
            const hasBirthDate = validateBirthDate(guest.birthDate);
            let ageOk = true;
            if (guest.type === 'Child' && guest.birthDate) {
                ageOk = calculateAge(guest.birthDate, checkInDate) === guest.age;
            }
            let contactOk = true;
            if (roomIdx === 0 && gIdx === 0 && guest.type === 'Adult') {
                contactOk = validateEmail(guest.email) && Boolean(guest.phone && guest.phone.trim().split(' ').length >= 2 && guest.phone.trim().split(' ')[1].length >= 3);
            }
            return hasName && hasGender && hasBirthDate && ageOk && contactOk;
        });
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

            const isLeadGuest = activeRoomIdx === 0 && gIdx === 0 && guest.type === 'Adult';
            const guestErrors = {
                firstName: !guest.firstName,
                lastName: !guest.lastName,
                email: isLeadGuest && !validateEmail(guest.email),
                birthDate: !validateBirthDate(guest.birthDate) || ageMismatch,
                ageMismatch: ageMismatch,
                gender: !guest.gender,
                phone: isLeadGuest && (!guest.phone || guest.phone.trim().split(' ').length < 2 || guest.phone.trim().split(' ')[1].length < 3)
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
                // Check if any previous room is incomplete before submitting
                for (let rIdx = 0; rIdx < roomsData.length; rIdx++) {
                    if (!isRoomCompleted(rIdx)) {
                        setActiveRoomIdx(rIdx);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                        return;
                    }
                }

                // Sync CRM guests in background - non-blocking
                syncCrmGuests();

                navigate(`/travel/hotels/checkout/payment?sessionId=${sessionId}`, {
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
            <div className="flex-1 bg-white dark:bg-[#202124] text-slate-900 dark:text-white font-sans">
                <main className="max-w-7xl mx-auto px-6 sm:px-12 lg:px-16 py-8 lg:py-10">
                    {/* Stepper Skeleton */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                        <div className="flex-1 h-12 bg-slate-200/50 dark:bg-slate-800/50 rounded-2xl animate-pulse"></div>
                        <div className="w-32 h-12 bg-slate-200/50 dark:bg-slate-800/50 rounded-2xl animate-pulse"></div>
                    </div>
                    <div className="flex flex-col lg:flex-row gap-7 items-start">
                        <div className="flex-1 min-w-0 space-y-6">
                            <div className="flex gap-2">
                                <div className="w-28 h-10 bg-slate-200/50 dark:bg-slate-800/50 rounded-xl animate-pulse"></div>
                                <div className="w-28 h-10 bg-slate-200/50 dark:bg-slate-800/50 rounded-xl animate-pulse"></div>
                            </div>
                            <div className="h-56 bg-slate-200/40 dark:bg-slate-800/40 rounded-3xl border border-slate-200/50 dark:border-slate-700/50 animate-pulse"></div>
                            <div className="h-56 bg-slate-200/40 dark:bg-slate-800/40 rounded-3xl border border-slate-200/50 dark:border-slate-700/50 animate-pulse"></div>
                        </div>
                        <div className="w-full lg:w-[410px] xl:w-[430px] shrink-0">
                            <div className="h-[480px] bg-slate-200/40 dark:bg-slate-800/40 rounded-[40px] border border-slate-200/50 dark:border-slate-700/50 animate-pulse"></div>
                        </div>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    if (!selectedRooms || !hotel) {
        return (
            <div className="flex-1 bg-white dark:bg-[#202124] text-slate-900 dark:text-white flex flex-col font-sans">
                <main className="flex-1 flex items-center justify-center p-6 py-20">
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

    const currentRoom = roomsData[activeRoomIdx] || { guests: [], roomName: '' };

    const hotelName = decodeHTMLEntities(hotel?.names?.[currentLang] || hotel?.names?.tr || hotel?.names?.en || hotel?.name || 'Hotel');
    const hotelStars = hotel?.starRating || (hotel?.propertyRating ? parseFloat(hotel.propertyRating) : (hotel?.stars || hotel?.hotelStar?.star || 5));
    const hotelAddress = hotel?.address ? `${hotel.address.street || ''}, ${hotel.address.cityName || ''}`.replace(/^,\s*/, '').replace(/,\s*$/, '') : (hotel?.location || '');
    const hotelImage = hotel?.images?.[0]?.url || hotel?.image || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80';

    // Use price from checkRatesData if available, otherwise fallback to local calculation
    const checkRate = checkRatesData?.rooms?.[0]?.rates?.[0];
    const grandTotal = checkRatesData?.rooms?.reduce((sum, room) => sum + (room.rates?.[0]?.price?.calculatedAmount || room.rates?.[0]?.price?.totalPaymentAmount || 0), 0) || selectedRooms.reduce((sum, r) => sum + r.rate, 0);
    const displayCurrency = checkRate?.price?.currency || selectedRooms[0]?.currency || agencyCurrency || 'USD';

    return (
        <div className="flex-1 min-h-screen bg-slate-50/50 dark:bg-[#18191b] text-slate-900 dark:text-white font-sans antialiased">
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 lg:py-7">
                {/* Top Action & Step Bar */}
                <div className="flex items-center justify-between gap-4 mb-4">
                    <button
                        type="button"
                        onClick={() => {
                            setPendingStepId(1);
                            setShowConfirmBack(true);
                        }}
                        className="inline-flex items-center gap-1.5 text-sm font-medium text-[#0b57d0] hover:text-[#0842a0] transition-colors cursor-pointer"
                    >
                        <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                        <span>{cl.backToRoomSelection || "← Oda Seçimine Dön"}</span>
                    </button>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium border border-blue-200/60 dark:border-slate-700">
                        <span className="material-symbols-outlined text-[15px] text-[#0b57d0]">lock</span>
                        <span>{cl.step2ReservationDetails || "Adım 2 / 3: Rezervasyon Detayları"}</span>
                    </div>
                </div>

                <div className="mb-6">
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

                <CrmGuestSelectionModal
                    isOpen={isCrmModalOpen}
                    onClose={() => setIsCrmModalOpen(false)}
                    onSelect={handleCrmGuestSelect}
                />

                <div className="flex flex-col lg:flex-row gap-7 items-start">
                    <div className="flex-1 min-w-0 space-y-5">
                        {/* Title & Subtitle */}
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                                {cl.enterGuestDetailsTitle || "Misafir Bilgilerini Girin"}
                            </h1>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                {cl.enterGuestDetailsNotice || "Otele giriş esnasında kimlik belgesi veya pasaportla tam eşleşecek resmi bilgileri eksiksiz belirtiniz."}
                            </p>
                        </div>

                        {/* Multiple Rooms Tab Navigation (Only shown when there are 2+ rooms) */}
                        {roomsData.length > 1 && (
                            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1" lang={currentLang}>
                                {roomsData.map((room, idx) => {
                                    const isCurrent = idx === activeRoomIdx;
                                    const isDone = isRoomCompleted(idx);
                                    const adultCount = room.guests.filter(g => g.type === 'Adult').length;
                                    const childCount = room.guests.filter(g => g.type === 'Child').length;

                                    return (
                                        <button
                                            key={idx}
                                            type="button"
                                            onClick={() => setActiveRoomIdx(idx)}
                                            className={`flex items-center gap-2 px-4 py-2 rounded-2xl border text-xs font-semibold transition-all shrink-0 cursor-pointer ${isCurrent
                                                    ? 'bg-[#1a73e8] border-[#1a73e8] text-white shadow-xs cursor-default'
                                                    : isDone
                                                        ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800 hover:bg-emerald-100/70'
                                                        : 'bg-white dark:bg-[#202124] border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                                                }`}
                                        >
                                            <span className="material-symbols-outlined text-[16px]">
                                                {isDone ? 'check_circle' : 'bed'}
                                            </span>
                                            <span>{tSummary('room', currentLang)} {idx + 1}</span>
                                            <span className={`text-[10px] font-normal px-2 py-0.5 rounded-full ${isCurrent ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-current'
                                                }`}>
                                                {adultCount} {tSummary('adult', currentLang)}
                                                {childCount > 0 ? `, ${childCount} ${tSummary('child', currentLang)}` : ''}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                        {/* Room Title Header */}
                        <div className="bg-white dark:bg-[#202124] border border-slate-200/90 dark:border-slate-800 rounded-2xl px-4 py-3 shadow-xs flex items-center justify-between gap-3" lang={currentLang}>
                            <div className="min-w-0 flex items-center gap-2.5">
                                <span className="size-7 rounded-xl bg-blue-50 dark:bg-slate-800 text-[#0b57d0] dark:text-blue-400 flex items-center justify-center text-xs font-semibold shrink-0">
                                    {activeRoomIdx + 1}
                                </span>
                                <h2 className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                                    {currentRoom.roomName}
                                </h2>
                            </div>
                            <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-medium shrink-0">
                                {currentRoom.guests.filter(g => g.type === 'Adult').length} {tSummary('adult', currentLang)}
                                {currentRoom.guests.filter(g => g.type === 'Child').length > 0 && `, ${currentRoom.guests.filter(g => g.type === 'Child').length} ${tSummary('child', currentLang)}`}
                            </span>
                        </div>

                        {/* Guest Cards */}
                        <div className="space-y-5" key={activeRoomIdx}>
                            {currentRoom.guests.map((guest, gIdx) => (
                                <div
                                    key={gIdx}
                                    className="bg-white dark:bg-[#202124] rounded-3xl border border-slate-200/90 dark:border-slate-800 p-6 sm:p-7 shadow-xs relative space-y-5"
                                    lang={currentLang}
                                >
                                    {/* Header */}
                                    <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800/80">
                                        <div className="flex items-center gap-2.5">
                                            <span className="size-7 rounded-full bg-[#0b57d0] text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-xs">
                                                {gIdx + 1}
                                            </span>
                                            <h3 className="text-[15px] sm:text-[16px] font-semibold text-slate-900 dark:text-white">
                                                {activeRoomIdx === 0 && gIdx === 0 && guest.type === 'Adult'
                                                    ? (cl.leadGuestTitle || "1. Misafir (Ana İletişim & Rezervasyon Sahibi)")
                                                    : `${gIdx + 1}. Misafir (${guest.type === 'Adult' ? tSummary('adult', currentLang) : `${tSummary('child', currentLang)} (${tSummary('age', currentLang)} ${guest.age})`})`}
                                            </h3>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {activeRoomIdx === 0 && gIdx === 0 && guest.type === 'Adult' && (
                                                <span className="px-3.5 py-1 rounded-full bg-[#e8f0fe] dark:bg-blue-950/60 text-[11px] font-semibold text-[#0b57d0] dark:text-blue-300 tracking-wider uppercase">
                                                    {cl.leadGuestBadge || "ASIL MİSAFİR"}
                                                </span>
                                            )}
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setTargetGuestIndex({ roomIdx: activeRoomIdx, guestIdx: gIdx });
                                                    setIsCrmModalOpen(true);
                                                }}
                                                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium text-[#0b57d0] hover:bg-blue-50 dark:hover:bg-blue-950/50 border border-blue-200 dark:border-blue-800/70 transition-colors cursor-pointer"
                                            >
                                                <span className="material-symbols-outlined text-[15px]">contact_page</span>
                                                <span>{cl.selectFromCrm || "Kayıtlı Kişilerden Seç"}</span>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Auto-Fill Assistant Banner for Lead Guest */}
                                    {activeRoomIdx === 0 && gIdx === 0 && (
                                        <div className="rounded-2xl bg-gradient-to-r from-blue-50/90 via-sky-50/70 to-indigo-50/80 dark:from-blue-950/40 dark:via-sky-950/30 dark:to-indigo-950/30 border border-blue-200/80 dark:border-blue-900/50 p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 shadow-2xs">
                                            <div className="flex items-center gap-3">
                                                <div className="size-9 rounded-xl bg-[#0b57d0] text-white flex items-center justify-center shadow-xs shrink-0">
                                                    <span className="material-symbols-outlined text-lg">auto_awesome</span>
                                                </div>
                                                <div>
                                                    <h4 className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                                                        <span>{cl.autoFillAssistant || "Hızlı Doldurma Asistanı"}</span>
                                                    </h4>
                                                    <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                                        {cl.autoFillDesc || "Google profiliniz veya geçmiş rezervasyon verileriniz ile tek tıkla formu tamamlayın."}
                                                    </p>
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setTargetGuestIndex({ roomIdx: 0, guestIdx: 0 });
                                                    setIsCrmModalOpen(true);
                                                }}
                                                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-slate-800 text-[#0b57d0] dark:text-blue-400 font-semibold text-xs border border-blue-200/80 dark:border-blue-800 shadow-2xs hover:bg-blue-50 dark:hover:bg-slate-700/80 transition-all shrink-0 cursor-pointer"
                                            >
                                                <span className="material-symbols-outlined text-[16px]">magic_button</span>
                                                <span>{cl.autoFillAction || "Bilgileri Otomatik Doldur"}</span>
                                            </button>
                                        </div>
                                    )}

                                    {/* Form Inputs Grid */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        {/* First Name */}
                                        <div className={`relative ${activeAutocomplete?.roomIdx === activeRoomIdx && activeAutocomplete?.guestIdx === gIdx && activeAutocomplete?.field === 'firstName' ? 'z-40' : ''}`}>
                                            <label className="text-[13px] font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">
                                                {tSummary('firstName', currentLang)}
                                            </label>
                                            <input
                                                data-field={`${activeRoomIdx}-${gIdx}-firstName`}
                                                data-autocomplete-input="true"
                                                required
                                                className={`w-full h-12 bg-[#f0f4f9] hover:bg-[#e9eef6] dark:bg-[#282a2d] dark:hover:bg-[#2f3136] border ${errors[`${activeRoomIdx}-${gIdx}`]?.firstName
                                                        ? '!border-[#d93025] !bg-rose-50/20 dark:!bg-rose-950/20'
                                                        : 'border-transparent focus:border-[#0b57d0]'
                                                    } px-5 rounded-full outline-none focus:bg-white dark:focus:bg-[#1f2023] transition-all duration-200 text-sm font-normal text-slate-900 dark:text-white placeholder:text-slate-400`}
                                                placeholder={tSummary('enterFirstName', currentLang)}
                                                value={guest.firstName}
                                                onChange={(e) => handleInputChange(activeRoomIdx, gIdx, 'firstName', e.target.value)}
                                                onFocus={() => handleInputFocus(activeRoomIdx, gIdx, 'firstName', guest.firstName)}
                                                onKeyDown={(e) => handleKeyDownAutocomplete(e, activeRoomIdx, gIdx)}
                                            />
                                            {renderCrmAutocompleteDropdown(activeRoomIdx, gIdx, 'firstName')}
                                        </div>

                                        {/* Last Name */}
                                        <div className={`relative ${activeAutocomplete?.roomIdx === activeRoomIdx && activeAutocomplete?.guestIdx === gIdx && activeAutocomplete?.field === 'lastName' ? 'z-40' : ''}`}>
                                            <label className="text-[13px] font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">
                                                {tSummary('lastName', currentLang)}
                                            </label>
                                            <input
                                                data-field={`${activeRoomIdx}-${gIdx}-lastName`}
                                                data-autocomplete-input="true"
                                                required
                                                className={`w-full h-12 bg-[#f0f4f9] hover:bg-[#e9eef6] dark:bg-[#282a2d] dark:hover:bg-[#2f3136] border ${errors[`${activeRoomIdx}-${gIdx}`]?.lastName
                                                        ? '!border-[#d93025] !bg-rose-50/20 dark:!bg-rose-950/20'
                                                        : 'border-transparent focus:border-[#0b57d0]'
                                                    } px-5 rounded-full outline-none focus:bg-white dark:focus:bg-[#1f2023] transition-all duration-200 text-sm font-normal text-slate-900 dark:text-white placeholder:text-slate-400`}
                                                placeholder={tSummary('enterLastName', currentLang)}
                                                value={guest.lastName}
                                                onChange={(e) => handleInputChange(activeRoomIdx, gIdx, 'lastName', e.target.value)}
                                                onFocus={() => handleInputFocus(activeRoomIdx, gIdx, 'lastName', guest.lastName)}
                                                onKeyDown={(e) => handleKeyDownAutocomplete(e, activeRoomIdx, gIdx)}
                                            />
                                            {renderCrmAutocompleteDropdown(activeRoomIdx, gIdx, 'lastName')}
                                        </div>

                                        {/* Birth Date */}
                                        <div>
                                            <label className="text-[13px] font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">
                                                {tSummary('birthDate', currentLang)}
                                            </label>
                                            <div className="relative flex items-center group">
                                                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 group-focus-within:text-[#0b57d0] transition-colors text-[20px] pointer-events-none">
                                                    calendar_today
                                                </span>
                                                <input
                                                    data-field={`${activeRoomIdx}-${gIdx}-birthDate`}
                                                    type="date"
                                                    className={`w-full h-12 bg-[#f0f4f9] hover:bg-[#e9eef6] dark:bg-[#282a2d] dark:hover:bg-[#2f3136] border ${errors[`${activeRoomIdx}-${gIdx}`]?.birthDate
                                                            ? '!border-[#d93025] !bg-rose-50/20 dark:!bg-rose-950/20'
                                                            : 'border-transparent focus:border-[#0b57d0]'
                                                        } pl-12 pr-5 rounded-full outline-none focus:bg-white dark:focus:bg-[#1f2023] transition-all duration-200 text-sm font-normal text-slate-900 dark:text-white`}
                                                    value={guest.birthDate}
                                                    min="1900-01-01"
                                                    max={new Date().toISOString().split('T')[0]}
                                                    onChange={(e) => handleInputChange(activeRoomIdx, gIdx, 'birthDate', e.target.value)}
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
                                            </div>
                                            {errors[`${activeRoomIdx}-${gIdx}`]?.birthDate && !errors[`${activeRoomIdx}-${gIdx}`]?.ageMismatch && (
                                                <p className="text-[#d93025] dark:text-rose-400 text-xs font-semibold mt-1.5 ml-4 flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1 duration-150">
                                                    <span className="material-symbols-outlined text-[16px] shrink-0">error</span>
                                                    <span>{tSummary('invalidBirthDate', currentLang)}</span>
                                                </p>
                                            )}
                                            {errors[`${activeRoomIdx}-${gIdx}`]?.ageMismatch && (
                                                <p className="text-[#d93025] dark:text-rose-400 text-xs font-semibold mt-1.5 ml-4 flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1 duration-150">
                                                    <span className="material-symbols-outlined text-[16px] shrink-0">error</span>
                                                    <span>{tSummary('childAgeMismatch', currentLang).replace('{age}', guest.age)}</span>
                                                </p>
                                            )}
                                        </div>

                                        {/* Gender 2-Way Segmented Switch (Male / Female only) */}
                                        <div>
                                            <label className="text-[13px] font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">
                                                {tSummary('gender', currentLang)}
                                            </label>
                                            <div
                                                data-field={`${activeRoomIdx}-${gIdx}-gender`}
                                                className={`h-12 p-1.5 bg-[#f0f4f9] hover:bg-[#e9eef6] dark:bg-[#282a2d] dark:hover:bg-[#2f3136] rounded-full flex items-center gap-1.5 border ${errors[`${activeRoomIdx}-${gIdx}`]?.gender ? '!border-[#d93025] !bg-rose-50/20' : 'border-transparent'
                                                    } transition-all duration-200`}
                                            >
                                                <button
                                                    type="button"
                                                    onClick={() => handleInputChange(activeRoomIdx, gIdx, 'gender', 'male')}
                                                    className={`flex-1 h-full flex items-center justify-center rounded-full text-[13px] transition-all duration-200 cursor-pointer ${guest.gender === 'male'
                                                            ? 'bg-white dark:bg-[#1f2023] text-[#0b57d0] dark:text-blue-400 font-semibold shadow-xs border border-blue-100 dark:border-blue-900/30'
                                                            : 'text-slate-600 dark:text-slate-400 font-normal hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-white/5'
                                                        }`}
                                                >
                                                    {tSummary('male', currentLang)}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleInputChange(activeRoomIdx, gIdx, 'gender', 'female')}
                                                    className={`flex-1 h-full flex items-center justify-center rounded-full text-[13px] transition-all duration-200 cursor-pointer ${guest.gender === 'female'
                                                            ? 'bg-white dark:bg-[#1f2023] text-[#0b57d0] dark:text-blue-400 font-semibold shadow-xs border border-blue-100 dark:border-blue-900/30'
                                                            : 'text-slate-600 dark:text-slate-400 font-normal hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-white/5'
                                                        }`}
                                                >
                                                    {tSummary('female', currentLang)}
                                                </button>
                                            </div>
                                        </div>

                                        {/* Lead Guest Email & Phone */}
                                        {activeRoomIdx === 0 && gIdx === 0 && guest.type === 'Adult' && (
                                            <>
                                                {(() => {
                                                    const emailKey = `${activeRoomIdx}-${gIdx}`;
                                                    const emailVal = guest.email || '';
                                                    const isFormatValid = validateEmail(emailVal);
                                                    const hasEmailError = Boolean(
                                                        errors[emailKey]?.email ||
                                                        (emailTouched[emailKey] && emailVal.length > 0 && !isFormatValid)
                                                    );

                                                    return (
                                                        <div className={`relative ${activeAutocomplete?.roomIdx === activeRoomIdx && activeAutocomplete?.guestIdx === gIdx && activeAutocomplete?.field === 'email' ? 'z-40' : ''}`}>
                                                            <label className="text-[13px] font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">
                                                                {tSummary('emailAddress', currentLang)}
                                                            </label>
                                                            <div className="relative flex items-center group">
                                                                <span className={`material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 transition-colors text-[20px] pointer-events-none ${hasEmailError
                                                                        ? 'text-[#d93025]'
                                                                        : 'text-slate-400 dark:text-slate-500 group-focus-within:text-[#0b57d0]'
                                                                    }`}>
                                                                    mail
                                                                </span>
                                                                <input
                                                                    data-field={`${activeRoomIdx}-${gIdx}-email`}
                                                                    data-autocomplete-input="true"
                                                                    required
                                                                    type="email"
                                                                    className={`w-full h-12 bg-[#f0f4f9] hover:bg-[#e9eef6] dark:bg-[#282a2d] dark:hover:bg-[#2f3136] border ${hasEmailError
                                                                            ? '!border-[#d93025] !bg-rose-50/20 dark:!bg-rose-950/20'
                                                                            : 'border-transparent focus:border-[#0b57d0]'
                                                                        } pl-12 pr-12 rounded-full outline-none focus:bg-white dark:focus:bg-[#1f2023] transition-all duration-200 text-sm font-normal text-slate-900 dark:text-white placeholder:text-slate-400`}
                                                                    placeholder={tSummary('enterEmail', currentLang)}
                                                                    value={guest.email}
                                                                    onChange={(e) => handleInputChange(activeRoomIdx, gIdx, 'email', e.target.value)}
                                                                    onFocus={() => handleInputFocus(activeRoomIdx, gIdx, 'email', guest.email)}
                                                                    onKeyDown={(e) => handleKeyDownAutocomplete(e, activeRoomIdx, gIdx)}
                                                                    onBlur={() => setEmailTouched(prev => ({ ...prev, [emailKey]: true }))}
                                                                />
                                                                {/* Validation Status Indicator */}
                                                                {isFormatValid && (
                                                                    <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-[#0b57d0] text-[20px] font-bold animate-in zoom-in-50 duration-200">
                                                                        check_circle
                                                                    </span>
                                                                )}
                                                                {hasEmailError && (
                                                                    <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-[#d93025] text-[20px] font-bold animate-in zoom-in-50 duration-200">
                                                                        error
                                                                    </span>
                                                                )}
                                                            </div>
                                                            {/* Explicit Validation Error Message */}
                                                            {hasEmailError && (
                                                                <p className="text-[#d93025] dark:text-rose-400 text-xs font-semibold mt-1.5 ml-4 flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1 duration-150">
                                                                    <span className="material-symbols-outlined text-[16px] shrink-0">error</span>
                                                                    <span>{tSummary('invalidEmail', currentLang) || "Lütfen geçerli bir e-posta adresi giriniz"}</span>
                                                                </p>
                                                            )}
                                                            {renderCrmAutocompleteDropdown(activeRoomIdx, gIdx, 'email')}
                                                        </div>
                                                    );
                                                })()}

                                                <div>
                                                    <PhoneInput
                                                        label={tSummary('phoneNumber', currentLang)}
                                                        value={guest.phone}
                                                        onChange={(val) => handleInputChange(activeRoomIdx, gIdx, 'phone', val)}
                                                        error={errors[`${activeRoomIdx}-${gIdx}`]?.phone}
                                                        className={`h-12 rounded-full bg-[#f0f4f9] hover:bg-[#e9eef6] dark:bg-[#282a2d] dark:hover:bg-[#2f3136] border ${errors[`${activeRoomIdx}-${gIdx}`]?.phone
                                                                ? '!border-[#d93025] !bg-rose-50/20 dark:!bg-rose-950/20'
                                                                : 'border-transparent focus-within:border-[#0b57d0]'
                                                            } focus-within:bg-white dark:focus-within:bg-[#1f2023] transition-all duration-200`}
                                                    />
                                                    {errors[`${activeRoomIdx}-${gIdx}`]?.phone && (
                                                        <p className="text-[#d93025] dark:text-rose-400 text-xs font-semibold mt-1.5 ml-4 flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1 duration-150">
                                                            <span className="material-symbols-outlined text-[16px] shrink-0">error</span>
                                                            <span>{tSummary('invalidPhone', currentLang) || "Lütfen geçerli bir telefon numarası giriniz"}</span>
                                                        </p>
                                                    )}
                                                </div>
                                            </>
                                        )}
                                    </div>

                                    {/* Lead Guest Notice Banner */}
                                    {activeRoomIdx === 0 && gIdx === 0 && guest.type === 'Adult' && (
                                        <div className="flex items-center gap-2.5 p-3.5 rounded-2xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/40 text-xs text-blue-900/90 dark:text-blue-200 font-normal">
                                            <span className="material-symbols-outlined text-[18px] text-[#0b57d0] shrink-0">verified_user</span>
                                            <span>{cl.leadGuestNotice || "Rezervasyon onay belgesi ve giriş bilgileri bu iletişim kanallarına anında gönderilir."}</span>
                                        </div>
                                    )}
                                </div>
                            ))}

                            {/* Preferences & Special Services Card */}
                            {activeRoomIdx === roomsData.length - 1 && (
                                <div className="bg-white dark:bg-[#202124] rounded-3xl border border-slate-200/90 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-4">
                                    <div className="flex items-start justify-between gap-4 pb-3 border-b border-slate-100 dark:border-slate-800/80">
                                        <div>
                                            <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                                                {cl.preferencesAndSpecialServices || "Kişiselleştirilmiş Tercihler & Özel Hizmetler"}
                                            </h3>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                                {cl.preferencesSubtitle || "İsteğinize göre konaklamanızı özelleştirin, ek ücretler ayrıntılandırılır."}
                                            </p>
                                        </div>
                                        <div className="size-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#0b57d0] dark:text-blue-400 flex items-center justify-center shrink-0">
                                            <span className="material-symbols-outlined text-lg">hotel_class</span>
                                        </div>
                                    </div>

                                    {/* Interactive Chip Tags */}
                                    <div className="flex flex-wrap gap-2 pt-1">
                                        {PREFERENCE_OPTIONS.map((pref) => {
                                            const isSelected = selectedPreferences.includes(pref.id);
                                            const label = currentLang === 'tr' ? pref.labelTr : pref.labelEn;
                                            return (
                                                <button
                                                    key={pref.id}
                                                    type="button"
                                                    onClick={() => togglePreference(pref)}
                                                    className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-medium transition-all cursor-pointer ${isSelected
                                                            ? 'bg-blue-50 dark:bg-blue-950/60 border border-blue-400 text-[#0b57d0] dark:text-blue-300 shadow-2xs'
                                                            : 'bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200/90 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-slate-700/80'
                                                        }`}
                                                >
                                                    <span className="material-symbols-outlined text-[15px]">
                                                        {isSelected ? 'check' : 'add'}
                                                    </span>
                                                    <span>{label}</span>
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {/* Special Requests Textarea */}
                                    <div className="pt-2">
                                        <label className="text-[13px] font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">
                                            {cl.specialNotesLabel || "Otele İletmek İstediğiniz Özel Notlar"}
                                        </label>
                                        <textarea
                                            rows={3}
                                            className="w-full bg-[#f0f4f9] hover:bg-[#e9eef6] dark:bg-[#282a2d] dark:hover:bg-[#2f3136] border border-transparent p-4 rounded-3xl outline-none focus:bg-white dark:focus:bg-[#1f2023] focus:border-[#0b57d0] transition-all duration-200 text-sm font-normal text-slate-900 dark:text-white placeholder:text-slate-400 resize-none"
                                            placeholder={cl.specialNotesPlaceholder || tSummary('enterRemarks', currentLang)}
                                            value={remark}
                                            onChange={(e) => setRemark(e.target.value)}
                                        />
                                    </div>

                                    {/* Client Reference ID (Retained B2B Feature) */}
                                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80">
                                        <label className="text-[13px] font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">
                                            {tSummary('clientReferenceId', currentLang)}
                                        </label>
                                        <input
                                            className="w-full h-12 bg-[#f0f4f9] hover:bg-[#e9eef6] dark:bg-[#282a2d] dark:hover:bg-[#2f3136] border border-transparent px-5 rounded-full outline-none focus:bg-white dark:focus:bg-[#1f2023] focus:border-[#0b57d0] transition-all duration-200 text-sm font-normal text-slate-900 dark:text-white placeholder:text-slate-400"
                                            placeholder={tSummary('internalReferenceNumber', currentLang)}
                                            value={clientReferenceId}
                                            onChange={(e) => setClientReferenceId(e.target.value)}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Stepper Buttons */}
                            <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (activeRoomIdx > 0) {
                                            setActiveRoomIdx(prev => prev - 1);
                                        } else {
                                            setPendingStepId(1);
                                            setShowConfirmBack(true);
                                        }
                                    }}
                                    className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                                >
                                    <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                                    <span>
                                        {activeRoomIdx > 0
                                            ? `${tSummary('backToRoom', currentLang)} ${activeRoomIdx}`
                                            : (cl.backToRoomSelection || "← Oda Seçimine Geri Dön")}
                                    </span>
                                </button>

                                <div className="flex flex-col items-end gap-1.5">
                                    <button
                                        type="button"
                                        onClick={handleNext}
                                        className="w-full sm:w-auto px-8 py-3.5 bg-[#0b57d0] hover:bg-[#0842a0] text-white rounded-full font-semibold text-sm shadow-sm hover:shadow transition-all flex items-center justify-center gap-2.5 cursor-pointer active:scale-[0.98]"
                                    >
                                        <span className="material-symbols-outlined text-[18px]">lock</span>
                                        <span>
                                            {activeRoomIdx < roomsData.length - 1 ? (
                                                <>{tSummary('nextRoom', currentLang)} {activeRoomIdx + 2}</>
                                            ) : (
                                                cl.proceedToPayment || "Ödeme Adımına İlerle"
                                            )}
                                        </span>
                                        <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                                    </button>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 text-right">
                                        {cl.securePaymentNote || "Sonraki adımda kart veya Google Pay ile güvenli ödeme yapılır."}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Google Travel Sticky Reservation Summary Sidebar */}
                    <div className="w-full lg:w-[410px] xl:w-[430px] shrink-0 lg:sticky lg:top-4 space-y-4">
                        <HotelReservationSummaryCard
                            hotel={{
                                ...hotel,
                                name: hotelName,
                                image: hotelImage,
                                stars: hotelStars,
                                address: hotelAddress
                            }}
                            formattedDates={formattedDates}
                            checkInDate={checkInDate}
                            checkOutDate={checkOutDate}
                            nights={nights}
                            roomState={roomState}
                            selectedRooms={selectedRooms}
                            checkRatesData={checkRatesData}
                            totalAmount={grandTotal}
                            currency={displayCurrency}
                            isLoadingRates={isLoadingRates}
                            showSecurityBadge={true}
                            lang={currentLang}
                            expireAt={expireAt}
                            onChangeRoom={() => {
                                setPendingStepId(1);
                                setShowConfirmBack(true);
                            }}
                        />
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
