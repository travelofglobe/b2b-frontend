import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import placeholderHotel from '../assets/placeholder-hotel.svg';
import { hotelService } from '../services/hotelService';
import { getBoardTypeLabel, BOARD_TYPES } from '../utils/boardTypeUtils';
import { FACILITY_ICON_MAP } from '../utils/facilityUtils';
import RefundPolicyTooltip from './RefundPolicyTooltip';
import GoogleFilterDropdown from './GoogleFilterDropdown';
import { useToast } from '../context/ToastContext';

const DRAWER_LOCALES = {
    tr: {
        overview: "Genel bakış",
        prices: "Fiyatlar",
        photos: "Fotoğraflar",
        about: "Hakkında",
        close: "Kapat",
        openInNewTab: "Detay sayfasını yeni sekmede aç",
        noDatesSelected: "Tarih seçilmedi",
        guestRating: "Misafir Değerlendirmesi",
        reviews: "yorum",
        shareSuccess: "Bağlantı kopyalandı!",
        shareLink: "Otel bağlantısını kopyala",
        website: "İnternet sitesi",
        directions: "Yol Tarifi",
        save: "Kaydet",
        saved: "Kaydedildi",
        share: "Paylaş",
        bookRoom: "Oda rezervasyonu yap",
        boardType: "Pansiyon:",
        allBoards: "Tüm Pansiyonlar",
        cancellationPolicy: "İptal Kuralı:",
        allPolicies: "Tüm Kurallar",
        freeCancellation: "Ücretsiz İptal",
        nonRefundable: "İade Edilmez",
        roomTypesFound: "Oda Tipi Bulundu",
        photosCount: (n) => `${n} Fotoğraf`,
        morePhotos: "Daha fazla",
        featuredRates: "Öne Çıkan Fiyat Seçenekleri",
        adults: (n) => `${n} Yetişkin`,
        children: (n) => `${n} Çocuk`,
        availableRates: "Mevcut Fiyatlar",
        options: (n) => `(${n} Seçenek)`,
        taxesAndFeesIncluded: "Fiyatlara vergi ve harçlar dahildir",
        totalNetAmount: "Toplam Net Tutar",
        showRules: "Kuralları Göster",
        cancellationSchedule: "İptal Takvimi",
        penalty: "Ceza:",
        startingFrom: "tarihinden itibaren",
        freeCancelUntil: (d) => `${d} tarihine kadar ücretsiz iptal`,
        selectRoom: "Odayı Seç",
        selecting: "Seçiliyor...",
        selected: (n) => `${n} Seçildi`,
        removeOneRoom: "1 oda çıkar",
        addOneMoreRoom: "1 oda daha ekle",
        maxRoomsSelected: (n) => `Maksimum ${n} oda seçildi`,
        showLessRates: "Daha Az Fiyat Göster",
        showMoreRates: (n) => `+${n} Daha Fazla Fiyat Seçeneği Göster`,
        startingPrice: "Başlangıç Fiyatı:",
        allRoomsDesc: "Seçilen tarihler için tüm oda seçeneklerini ve detaylı iptal koşullarını tam otel detay sayfasından inceleyebilirsiniz.",
        examineAllRooms: "Tüm Odaları İncele",
        propertyPhotos: "Tesis Fotoğrafları",
        totalPhotosCount: (n) => `Toplam ${n} fotoğraf`,
        clickToEnlarge: "Büyütmek için fotoğrafa tıklayın",
        aboutProperty: "Tesis Hakkında",
        checkInCheckOutRules: "Giriş & Çıkış Kuralları",
        checkInTime: "Giriş Saati",
        checkOutTime: "Çıkış Saati",
        fromTime: "'ten itibaren",
        untilTime: "'ye kadar",
        facilitiesAndServices: "Tesis Olanakları & Hizmetleri",
        locationAndContact: "Konum & İletişim Detayları",
        address: "Adres",
        phone: "Telefon",
        email: "E-Posta",
        getDirections: "Google Haritalar'da Yol Tarifi Al",
        popularAmenities: "Popüler olanaklar",
        freeWifi: "Ücretsiz kablosuz internet",
        pool: "Yüzme havuzu",
        spa: "Spa & Masaj",
        parking: "Otopark",
        restaurant: "Restoran",
        airConditioning: "Klima",
        fitness: "Fitness & Spor Salonu",
        roomService: "24 Saat Oda Servisi",
        dryCleaning: "Kuru Temizleme & Çamaşırhane",
        topRoomsAndRates: "En Popüler Odalar & Fiyatlar",
        topRoomsDesc: "Tüm oda ve fiyat seçeneklerini Fiyatlar sekmesinde görebilirsiniz.",
        standardRate: "Standart Fiyat",
        bestAvailability: "En iyi müsaitlik garantisi",
        viewAllRoomsCta: (n) => `Tüm Odaları & Fiyatları Gör (${n} Seçenek) →`,
        hotelDescription: "Tesis Açıklaması",
        readMoreInAbout: "Devamını Hakkında sekmesinde oku →",
        starsHotel: (n) => `${n} yıldızlı otel`,
        recommended: "Önerilen",
        hotelServiceDefault: "Tesis Hizmeti",
        roomsSelected: (c, m) => `${c} / ${m} Oda Seçildi`,
        clearSelections: "Seçimleri Temizle",
        allRoomsSelectedProceed: "Tüm odalar seçildi, rezervasyona devam edebilirsiniz.",
        selectMoreRoomsToProceed: (n) => `İlerlemeniz için ${n} oda daha seçmelisiniz.`,
        totalSelectedPrice: "Toplam Seçilen Fiyat",
        proceedToBooking: (c, m) => `Rezervasyona Devam Et (${c}/${m})`,
        preparing: "Hazırlanıyor...",
        removeRoom: "Odayı kaldır",
        toastCompleteSelection: (max, cur) => `Lütfen ${max} oda seçiminizi tamamlayın (${cur}/${max} seçildi).`,
        toastMaxRoomsReached: (max) => `Aramanızda ${max} oda belirttiniz. En fazla ${max} oda seçebilirsiniz. Farklı bir oda seçmek için mevcut seçimlerden birini kaldırabilirsiniz.`,
        toastCheckRateError: "Fiyat kontrolü sırasında bir hata oluştu veya odalardan biri artık müsait değil."
    },
    en: {
        overview: "Overview",
        prices: "Prices",
        photos: "Photos",
        about: "About",
        close: "Close",
        openInNewTab: "Open details in new tab",
        noDatesSelected: "Dates not selected",
        guestRating: "Guest Rating",
        reviews: "reviews",
        shareSuccess: "Link copied!",
        shareLink: "Copy hotel link",
        website: "Website",
        directions: "Directions",
        save: "Save",
        saved: "Saved",
        share: "Share",
        bookRoom: "Book a room",
        boardType: "Board:",
        allBoards: "All Boards",
        cancellationPolicy: "Cancellation:",
        allPolicies: "All Policies",
        freeCancellation: "Free Cancellation",
        nonRefundable: "Non-refundable",
        roomTypesFound: "Room Types Found",
        photosCount: (n) => `${n} Photos`,
        morePhotos: "More photos",
        featuredRates: "Featured Rates",
        adults: (n) => `${n} Adults`,
        children: (n) => `${n} Children`,
        availableRates: "Available Rates",
        options: (n) => `(${n} Options)`,
        taxesAndFeesIncluded: "Taxes and fees included",
        totalNetAmount: "Total Net Amount",
        showRules: "Show Rules",
        cancellationSchedule: "Cancellation Schedule",
        penalty: "Penalty:",
        startingFrom: "starting from",
        freeCancelUntil: (d) => `Free cancellation until ${d}`,
        selectRoom: "Select Room",
        selecting: "Selecting...",
        selected: (n) => `${n} Selected`,
        removeOneRoom: "Remove 1 room",
        addOneMoreRoom: "Add 1 more room",
        maxRoomsSelected: (n) => `Maximum ${n} rooms selected`,
        showLessRates: "Show fewer rates",
        showMoreRates: (n) => `+${n} More Rate Options`,
        startingPrice: "Starting From:",
        allRoomsDesc: "You can examine all room options and detailed cancellation policies on the full hotel details page.",
        examineAllRooms: "Examine All Rooms",
        propertyPhotos: "Property Photos",
        totalPhotosCount: (n) => `Total ${n} photos`,
        clickToEnlarge: "Click on photo to enlarge",
        aboutProperty: "About the Property",
        checkInCheckOutRules: "Check-in & Check-out Policies",
        checkInTime: "Check-in Time",
        checkOutTime: "Check-out Time",
        fromTime: "from",
        untilTime: "until",
        facilitiesAndServices: "Property Amenities & Services",
        locationAndContact: "Location & Contact Details",
        address: "Address",
        phone: "Phone",
        email: "Email",
        getDirections: "Get Directions on Google Maps",
        popularAmenities: "Popular Amenities",
        freeWifi: "Free Wi-Fi",
        pool: "Swimming pool",
        spa: "Spa & Massage",
        parking: "Parking",
        restaurant: "Restaurant",
        airConditioning: "Air Conditioning",
        fitness: "Fitness & Gym",
        roomService: "24-Hour Room Service",
        dryCleaning: "Dry Cleaning & Laundry",
        topRoomsAndRates: "Popular Rooms & Rates",
        topRoomsDesc: "You can browse all available rooms and rates in the Prices tab.",
        standardRate: "Standard Rate",
        bestAvailability: "Best availability guarantee",
        viewAllRoomsCta: (n) => `View All Rooms & Rates (${n} Options) →`,
        hotelDescription: "Hotel Description",
        readMoreInAbout: "Read more in About tab →",
        starsHotel: (n) => `${n}-star hotel`,
        recommended: "Recommended",
        hotelServiceDefault: "Property Service",
        roomsSelected: (c, m) => `${c} / ${m} Rooms Selected`,
        clearSelections: "Clear Selection",
        allRoomsSelectedProceed: "All rooms selected, you can proceed to booking.",
        selectMoreRoomsToProceed: (n) => `Please select ${n} more room${n > 1 ? 's' : ''} to proceed.`,
        totalSelectedPrice: "Total Selected Price",
        proceedToBooking: (c, m) => `Proceed to Booking (${c}/${m})`,
        preparing: "Preparing...",
        removeRoom: "Remove room",
        toastCompleteSelection: (max, cur) => `Please complete your ${max} room selection (${cur}/${max} selected).`,
        toastMaxRoomsReached: (max) => `You requested ${max} rooms. You can select at most ${max} rooms. To pick a different room, remove an existing selection.`,
        toastCheckRateError: "An error occurred during rate check or one of the selected rooms is no longer available."
    },
    de: {
        overview: "Übersicht",
        prices: "Preise",
        photos: "Fotos",
        about: "Über das Hotel",
        close: "Schließen",
        openInNewTab: "Details in neuem Tab öffnen",
        noDatesSelected: "Keine Daten ausgewählt",
        guestRating: "Gästebewertung",
        reviews: "Bewertungen",
        shareSuccess: "Link kopiert!",
        shareLink: "Hotellink kopieren",
        website: "Webseite",
        directions: "Route",
        save: "Speichern",
        saved: "Gespeichert",
        share: "Teilen",
        bookRoom: "Zimmer buchen",
        boardType: "Verpflegung:",
        allBoards: "Alle Verpflegungen",
        cancellationPolicy: "Stornierung:",
        allPolicies: "Alle Bedingungen",
        freeCancellation: "Kostenlose Stornierung",
        nonRefundable: "Nicht erstattungsfähig",
        roomTypesFound: "Zimmertypen gefunden",
        photosCount: (n) => `${n} Fotos`,
        morePhotos: "Mehr anzeigen",
        featuredRates: "Ausgewählte Tarife",
        adults: (n) => `${n} Erwachsene`,
        children: (n) => `${n} Kinder`,
        availableRates: "Verfügbare Tarife",
        options: (n) => `(${n} Optionen)`,
        taxesAndFeesIncluded: "Steuern und Gebühren inbegriffen",
        totalNetAmount: "Netto-Gesamtbetrag",
        showRules: "Regeln anzeigen",
        cancellationSchedule: "Stornierungsplan",
        penalty: "Gebühr:",
        startingFrom: "ab",
        freeCancelUntil: (d) => `Kostenlose Stornierung bis ${d}`,
        selectRoom: "Zimmer wählen",
        selecting: "Wird ausgewählt...",
        selected: (n) => `${n} Ausgewählt`,
        removeOneRoom: "1 Zimmer entfernen",
        addOneMoreRoom: "1 Zimmer hinzufügen",
        maxRoomsSelected: (n) => `Maximal ${n} Zimmer ausgewählt`,
        showLessRates: "Weniger Tarife anzeigen",
        showMoreRates: (n) => `+${n} Weitere Preisoptionen`,
        startingPrice: "Ab:",
        allRoomsDesc: "Alle Zimmeroptionen und detaillierte Stornierungsbedingungen finden Sie auf der vollständigen Detailseite.",
        examineAllRooms: "Alle Zimmer ansehen",
        propertyPhotos: "Fotos der Unterkunft",
        totalPhotosCount: (n) => `Insgesamt ${n} Fotos`,
        clickToEnlarge: "Zum Vergrößern auf das Foto klicken",
        aboutProperty: "Über die Unterkunft",
        checkInCheckOutRules: "Check-in & Check-out Richtlinien",
        checkInTime: "Check-in Zeit",
        checkOutTime: "Check-out Zeit",
        fromTime: "ab",
        untilTime: "bis",
        facilitiesAndServices: "Ausstattung & Service",
        locationAndContact: "Lage & Kontaktdaten",
        address: "Adresse",
        phone: "Telefon",
        email: "E-Mail",
        getDirections: "Route in Google Maps berechnen",
        popularAmenities: "Beliebte Ausstattungen",
        freeWifi: "Kostenloses WLAN",
        pool: "Schwimmbad",
        spa: "Spa & Massage",
        parking: "Parkplatz",
        restaurant: "Restaurant",
        airConditioning: "Klimaanlage",
        fitness: "Fitnessraum",
        roomService: "24-Stunden-Zimmerservice",
        dryCleaning: "Wäscheservice",
        topRoomsAndRates: "Beliebte Zimmer & Preise",
        topRoomsDesc: "Alle Zimmer und Preise können Sie im Tab Preise einsehen.",
        standardRate: "Standardtarif",
        bestAvailability: "Garantie für beste Verfügbarkeit",
        viewAllRoomsCta: (n) => `Alle Zimmer & Preise ansehen (${n} Optionen) →`,
        hotelDescription: "Hotelbeschreibung",
        readMoreInAbout: "Mehr im Tab Über das Hotel lesen →",
        starsHotel: (n) => `${n}-Sterne-Hotel`,
        recommended: "Empfohlen",
        hotelServiceDefault: "Hotelservice",
        roomsSelected: (c, m) => `${c} / ${m} Zimmer ausgewählt`,
        clearSelections: "Auswahl löschen",
        allRoomsSelectedProceed: "Alle Zimmer ausgewählt, Sie können mit der Buchung fortfahren.",
        selectMoreRoomsToProceed: (n) => `Bitte wählen Sie noch ${n} Zimmer aus.`,
        totalSelectedPrice: "Gesamtpreis der Auswahl",
        proceedToBooking: (c, m) => `Weiter zur Buchung (${c}/${m})`,
        preparing: "Vorbereitung...",
        removeRoom: "Zimmer entfernen",
        toastCompleteSelection: (max, cur) => `Bitte wählen Sie noch Zimmer aus (${cur}/${max} gewählt).`,
        toastMaxRoomsReached: (max) => `Sie haben ${max} Zimmer gesucht. Maximal ${max} Zimmer können ausgewählt werden.`,
        toastCheckRateError: "Fehler bei der Preisprüfung oder eines der Zimmer ist nicht mehr verfügbar."
    },
    ar: {
        overview: "نظرة عامة",
        prices: "الأسعار",
        photos: "الصور",
        about: "حول الفندق",
        close: "إغلاق",
        openInNewTab: "فتح التفاصيل في علامة تبويب جديدة",
        noDatesSelected: "لم يتم تحديد تواريخ",
        guestRating: "تقييم النزلاء",
        reviews: "تقييم",
        shareSuccess: "تم نسخ الرابط!",
        shareLink: "نسخ رابط الفندق",
        website: "الموقع الإلكتروني",
        directions: "الاتجاهات",
        save: "حفظ",
        saved: "تم الحفظ",
        share: "مشاركة",
        bookRoom: "حجز غرفة",
        boardType: "الوجبة:",
        allBoards: "جميع الوجبات",
        cancellationPolicy: "سياسة الإلغاء:",
        allPolicies: "جميع السياسات",
        freeCancellation: "إلغاء مجاني",
        nonRefundable: "غير قابل للاسترداد",
        roomTypesFound: "أنواع الغرف المتاحة",
        photosCount: (n) => `${n} صور`,
        morePhotos: "المزيد",
        featuredRates: "خيارات الأسعار المميزة",
        adults: (n) => `${n} بالغين`,
        children: (n) => `${n} أطفال`,
        availableRates: "الأسعار المتاحة",
        options: (n) => `(${n} خيارات)`,
        taxesAndFeesIncluded: "الضرائب والرسوم مشمولة",
        totalNetAmount: "إجمالي المبلغ الصافي",
        showRules: "عرض القواعد",
        cancellationSchedule: "جدول الإلغاء",
        penalty: "الغرامة:",
        startingFrom: "اعتباراً من",
        freeCancelUntil: (d) => `إلغاء مجاني حتى ${d}`,
        selectRoom: "اختر الغرفة",
        selecting: "جاري الاختيار...",
        selected: (n) => `تم اختيار ${n}`,
        removeOneRoom: "إزالة غرفة واحدة",
        addOneMoreRoom: "إضافة غرفة أخرى",
        maxRoomsSelected: (n) => `الحد الأقصى ${n} غرف تم اختيارها`,
        showLessRates: "عرض خيارات أقل",
        showMoreRates: (n) => `+${n} خيارات أسعار إضافية`,
        startingPrice: "يبدأ من:",
        allRoomsDesc: "يمكنك الاطلاع على جميع خيارات الغرف وسياسات الإلغاء من صفحة تفاصيل الفندق.",
        examineAllRooms: "استعراض جميع الغرف",
        propertyPhotos: "صور المنشأة",
        totalPhotosCount: (n) => `إجمالي ${n} صورة`,
        clickToEnlarge: "انقر على الصورة للتكبير",
        aboutProperty: "عن المنشأة",
        checkInCheckOutRules: "قواعد تسجيل الوصول والمغادرة",
        checkInTime: "وقت تسجيل الوصول",
        checkOutTime: "وقت تسجيل المغادرة",
        fromTime: "من الساعة",
        untilTime: "حتى الساعة",
        facilitiesAndServices: "المرافق والخدمات",
        locationAndContact: "الموقع ومعلومات الاتصال",
        address: "العنوان",
        phone: "الهاتف",
        email: "البريد الإلكتروني",
        getDirections: "الحصول على الاتجاهات في خرائط Google",
        popularAmenities: "المرافق الشائعة",
        freeWifi: "واي فاي مجاني",
        pool: "مسبح",
        spa: "سبا ومساج",
        parking: "موقف سيارات",
        restaurant: "مطعم",
        airConditioning: "تكييف هواء",
        fitness: "صالة لياقة بدنية",
        roomService: "خدمة غرف على مدار 24 ساعة",
        dryCleaning: "غسيل وتنظيف جاف",
        topRoomsAndRates: "الغرف والأسعار الأكثر طلباً",
        topRoomsDesc: "يمكنك استعراض كافة الغرف والأسعار في تبويب الأسعار.",
        standardRate: "السعر القياسي",
        bestAvailability: "أفضل ضمان توفر",
        viewAllRoomsCta: (n) => `عرض كافة الغرف والأسعار (${n} خيارات) ←`,
        hotelDescription: "وصف الفندق",
        readMoreInAbout: "اقرأ المزيد في تبويب حول الفندق ←",
        starsHotel: (n) => `فندق ${n} نجوم`,
        recommended: "موصى به",
        hotelServiceDefault: "خدمة المنشأة",
        roomsSelected: (c, m) => `تم اختيار ${c} / ${m} غرف`,
        clearSelections: "مسح التحديد",
        allRoomsSelectedProceed: "تم اختيار جميع الغرف، يمكنك المتابعة إلى الحجز.",
        selectMoreRoomsToProceed: (n) => `يرجى اختيار ${n} غرف إضافية للمتابعة.`,
        totalSelectedPrice: "إجمالي السعر المختار",
        proceedToBooking: (c, m) => `المتابعة للحجز (${c}/${m})`,
        preparing: "جاري التحضير...",
        removeRoom: "إزالة الغرفة",
        toastCompleteSelection: (max, cur) => `يرجى إكمال اختيار ${max} غرف (${cur}/${max} تم اختيارها).`,
        toastMaxRoomsReached: (max) => `لقد طلبت ${max} غرف. يمكنك اختيار ${max} غرف كحد أقصى.`,
        toastCheckRateError: "حدث خطأ أثناء فحص الأسعار أو أن إحدى الغرف لم تعد متاحة."
    },
    es: {
        overview: "Descripción general",
        prices: "Precios",
        photos: "Fotos",
        about: "Acerca de",
        close: "Cerrar",
        openInNewTab: "Abrir detalles en una nueva pestaña",
        noDatesSelected: "Fechas no seleccionadas",
        guestRating: "Puntuación de los huéspedes",
        reviews: "opiniones",
        shareSuccess: "¡Enlace copiado!",
        shareLink: "Copiar enlace del hotel",
        website: "Sitio web",
        directions: "Cómo llegar",
        save: "Guardar",
        saved: "Guardado",
        share: "Compartir",
        bookRoom: "Reservar habitación",
        boardType: "Régimen:",
        allBoards: "Todos los Regímenes",
        cancellationPolicy: "Cancelación:",
        allPolicies: "Todas las Políticas",
        freeCancellation: "Cancelación gratuita",
        nonRefundable: "No reembolsable",
        roomTypesFound: "Tipos de habitación encontrados",
        photosCount: (n) => `${n} Fotos`,
        morePhotos: "Más fotos",
        featuredRates: "Tarifas destacadas",
        adults: (n) => `${n} Adultos`,
        children: (n) => `${n} Niños`,
        availableRates: "Tarifas disponibles",
        options: (n) => `(${n} Opciones)`,
        taxesAndFeesIncluded: "Impuestos y tasas incluidos",
        totalNetAmount: "Importe neto total",
        showRules: "Ver reglas",
        cancellationSchedule: "Calendario de cancelación",
        penalty: "Penalización:",
        startingFrom: "a partir de",
        freeCancelUntil: (d) => `Cancelación gratuita hasta el ${d}`,
        selectRoom: "Seleccionar habitación",
        selecting: "Seleccionando...",
        selected: (n) => `${n} Seleccionado`,
        removeOneRoom: "Quitar 1 habitación",
        addOneMoreRoom: "Añadir 1 habitación más",
        maxRoomsSelected: (n) => `Máximo ${n} habitaciones seleccionadas`,
        showLessRates: "Mostrar menos tarifas",
        showMoreRates: (n) => `+${n} Más opciones de tarifas`,
        startingPrice: "A partir de:",
        allRoomsDesc: "Puede consultar todas las habitaciones y condiciones de cancelación en la página de detalles.",
        examineAllRooms: "Examinar todas las habitaciones",
        propertyPhotos: "Fotos del alojamiento",
        totalPhotosCount: (n) => `Total ${n} fotos`,
        clickToEnlarge: "Haga clic para ampliar",
        aboutProperty: "Acerca del alojamiento",
        checkInCheckOutRules: "Normas de entrada y salida",
        checkInTime: "Hora de entrada",
        checkOutTime: "Hora de salida",
        fromTime: "a partir de",
        untilTime: "hasta",
        facilitiesAndServices: "Servicios e instalaciones",
        locationAndContact: "Ubicación y contacto",
        address: "Dirección",
        phone: "Teléfono",
        email: "Correo electrónico",
        getDirections: "Cómo llegar en Google Maps",
        popularAmenities: "Servicios populares",
        freeWifi: "Wi-Fi gratis",
        pool: "Piscina",
        spa: "Spa y masajes",
        parking: "Aparcamiento",
        restaurant: "Restaurante",
        airConditioning: "Aire acondicionado",
        fitness: "Gimnasio",
        roomService: "Servicio de habitaciones 24 horas",
        dryCleaning: "Lavandería y tintorería",
        topRoomsAndRates: "Habitaciones y tarifas populares",
        topRoomsDesc: "Consulte todas las habitaciones disponibles en la pestaña Precios.",
        standardRate: "Tarifa estándar",
        bestAvailability: "Mejor disponibilidad garantizada",
        viewAllRoomsCta: (n) => `Ver todas las habitaciones (${n} opciones) →`,
        hotelDescription: "Descripción del hotel",
        readMoreInAbout: "Leer más en la pestaña Acerca de →",
        starsHotel: (n) => `Hotel de ${n} estrellas`,
        recommended: "Recomendado",
        hotelServiceDefault: "Servicio del alojamiento",
        roomsSelected: (c, m) => `${c} / ${m} Habitaciones seleccionadas`,
        clearSelections: "Borrar selección",
        allRoomsSelectedProceed: "Todas las habitaciones seleccionadas, puede proceder con la reserva.",
        selectMoreRoomsToProceed: (n) => `Seleccione ${n} habitación(es) más para continuar.`,
        totalSelectedPrice: "Precio total seleccionado",
        proceedToBooking: (c, m) => `Continuar con la reserva (${c}/${m})`,
        preparing: "Preparando...",
        removeRoom: "Eliminar habitación",
        toastCompleteSelection: (max, cur) => `Complete su selección de ${max} habitaciones (${cur}/${max} seleccionadas).`,
        toastMaxRoomsReached: (max) => `Ha buscado ${max} habitaciones. Puede seleccionar como máximo ${max} habitaciones.`,
        toastCheckRateError: "Ocurrió un error al verificar los precios o una de las habitaciones ya no está disponible."
    },
    ru: {
        overview: "Обзор",
        prices: "Цены",
        photos: "Фотографии",
        about: "Об отеле",
        close: "Закрыть",
        openInNewTab: "Открыть в новой вкладке",
        noDatesSelected: "Даты не выбраны",
        guestRating: "Оценка гостей",
        reviews: "отзывов",
        shareSuccess: "Ссылка скопирована!",
        shareLink: "Скопировать ссылку на отель",
        website: "Веб-сайт",
        directions: "Маршрут",
        save: "Сохранить",
        saved: "Сохранено",
        share: "Поделиться",
        bookRoom: "Забронировать номер",
        boardType: "Питание:",
        allBoards: "Все типы питания",
        cancellationPolicy: "Отмена:",
        allPolicies: "Все правила",
        freeCancellation: "Бесплатная отмена",
        nonRefundable: "Без возврата",
        roomTypesFound: "Типов номеров найдено",
        photosCount: (n) => `${n} Фото`,
        morePhotos: "Больше фото",
        featuredRates: "Популярные варианты цен",
        adults: (n) => `${n} Взрослых`,
        children: (n) => `${n} Детей`,
        availableRates: "Доступные тарифы",
        options: (n) => `(${n} Вариантов)`,
        taxesAndFeesIncluded: "Налоги и сборы включены",
        totalNetAmount: "Итоговая чистая сумма",
        showRules: "Показать правила",
        cancellationSchedule: "График отмены",
        penalty: "Штраф:",
        startingFrom: "начиная с",
        freeCancelUntil: (d) => `Бесплатная отмена до ${d}`,
        selectRoom: "Выбрать номер",
        selecting: "Выбор...",
        selected: (n) => `${n} Выбрано`,
        removeOneRoom: "Удалить 1 номер",
        addOneMoreRoom: "Добавить 1 номер",
        maxRoomsSelected: (n) => `Максимум ${n} номеров выбрано`,
        showLessRates: "Меньше вариантов",
        showMoreRates: (n) => `+${n} Больше вариантов цен`,
        startingPrice: "От:",
        allRoomsDesc: "Все варианты номеров и подробные условия отмены доступны на странице отеля.",
        examineAllRooms: "Посмотреть все номера",
        propertyPhotos: "Фотографии объекта",
        totalPhotosCount: (n) => `Всего ${n} фото`,
        clickToEnlarge: "Нажмите на фото для увеличения",
        aboutProperty: "Об объекте",
        checkInCheckOutRules: "Правила заезда и выезда",
        checkInTime: "Время заезда",
        checkOutTime: "Время выезда",
        fromTime: "с",
        untilTime: "до",
        facilitiesAndServices: "Удобства и услуги",
        locationAndContact: "Расположение и контакты",
        address: "Адрес",
        phone: "Телефон",
        email: "Эл. почта",
        getDirections: "Маршрут на Google Картах",
        popularAmenities: "Популярные удобства",
        freeWifi: "Бесплатный Wi-Fi",
        pool: "Бассейн",
        spa: "Спа и массаж",
        parking: "Парковка",
        restaurant: "Ресторан",
        airConditioning: "Кондиционер",
        fitness: "Фитнес-зал",
        roomService: "Круглосуточное обслуживание номеров",
        dryCleaning: "Прачечная и химчистка",
        topRoomsAndRates: "Популярные номера и цены",
        topRoomsDesc: "Все доступные номера и цены можно посмотреть во вкладке Цены.",
        standardRate: "Стандартный тариф",
        bestAvailability: "Гарантия лучшей доступности",
        viewAllRoomsCta: (n) => `Все номера и цены (${n} вариантов) →`,
        hotelDescription: "Описание отеля",
        readMoreInAbout: "Подробнее во вкладке Об отеле →",
        starsHotel: (n) => `${n}-звездочный отель`,
        recommended: "Рекомендуется",
        hotelServiceDefault: "Услуга отеля",
        roomsSelected: (c, m) => `${c} / ${m} Номеров выбрано`,
        clearSelections: "Очистить выбор",
        allRoomsSelectedProceed: "Все номера выбраны, вы можете перейти к бронированию.",
        selectMoreRoomsToProceed: (n) => `Выберите еще ${n} номер(а), чтобы продолжить.`,
        totalSelectedPrice: "Общая сумма выбранного",
        proceedToBooking: (c, m) => `Перейти к бронированию (${c}/${m})`,
        preparing: "Подготовка...",
        removeRoom: "Удалить номер",
        toastCompleteSelection: (max, cur) => `Завершите выбор ${max} номеров (${cur}/${max} выбрано).`,
        toastMaxRoomsReached: (max) => `Вы искали ${max} номеров. Можно выбрать максимум ${max} номеров.`,
        toastCheckRateError: "Ошибка проверки цен или один из номеров больше недоступен."
    }
};

const HotelQuickLookDrawer = ({
    hotel,
    isOpen,
    onClose,
    searchParams,
    currencySymbol = '₺',
    isFav,
    onToggleFav,
    currentLang = 'tr'
}) => {
    const navigate = useNavigate();
    const { error: toastError } = useToast();
    const [bookingRateCode, setBookingRateCode] = useState(null);
    const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'prices' | 'photos' | 'about'
    const [cachedHotel, setCachedHotel] = useState(hotel);
    const [detailData, setDetailData] = useState(null);
    const [rooms, setRooms] = useState([]);
    const [isRoomsLoading, setIsRoomsLoading] = useState(false);
    const [isCopied, setIsCopied] = useState(false);
    const [lightboxIndex, setLightboxIndex] = useState(null);
    const [boardTypeFilter, setBoardTypeFilter] = useState('ALL');
    const [cancelFilter, setCancelFilter] = useState('ALL');
    const [expandedRates, setExpandedRates] = useState({});
    const [selectedRooms, setSelectedRooms] = useState([]);
    const [isMultiBookingLoading, setIsMultiBookingLoading] = useState(false);

    const parsedRooms = useMemo(() => {
        const guestsParam = searchParams?.get('guests');
        if (guestsParam) {
            try {
                const parsed = JSON.parse(guestsParam);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    return parsed.map(r => ({
                        adults: r.a || 2,
                        children: r.c || 0,
                        childAges: r.ca || []
                    }));
                }
            } catch (e) {}
        }
        return [{ adults: 2, children: 0, childAges: [] }];
    }, [searchParams]);

    const maxAllowedRooms = Math.min(parsedRooms.length || 1, 4);

    const totalSelectedPrice = useMemo(() => {
        return selectedRooms.reduce((sum, r) => sum + (r.rate || 0), 0);
    }, [selectedRooms]);

    // Keep cached hotel so during exit animation the content remains intact
    useEffect(() => {
        if (hotel) {
            setCachedHotel(hotel);
            setDetailData(null);
            setActiveTab('overview');
            setBoardTypeFilter('ALL');
            setCancelFilter('ALL');
            setSelectedRooms([]);
        }
    }, [hotel?.id, hotel?.hotelId]);

    const t = (key, ...args) => {
        const langDict = DRAWER_LOCALES[currentLang] || DRAWER_LOCALES.en || DRAWER_LOCALES.tr;
        const item = langDict?.[key] ?? DRAWER_LOCALES.en?.[key] ?? DRAWER_LOCALES.tr?.[key];
        if (typeof item === 'function') {
            return item(...args);
        }
        return item || key;
    };

    const currentHotel = useMemo(() => {
        return { ...(cachedHotel || {}), ...(detailData || {}) };
    }, [cachedHotel, detailData]);

    // Fetch full hotel rooms & rates from hotelService.searchRooms
    useEffect(() => {
        if (!hotel || !isOpen) return;

        const hotelId = hotel.hotelId || hotel.id;
        if (!hotelId) return;

        let isMounted = true;
        const fetchHotelRooms = async () => {
            setIsRoomsLoading(true);
            try {
                const checkin = searchParams?.get('checkin');
                const checkout = searchParams?.get('checkout');
                const nationality = searchParams?.get('nationality') || 'TR';
                const guestsParam = searchParams?.get('guests');
                let parsedRooms = [{ adults: 2, children: 0, childAges: [] }];
                if (guestsParam) {
                    try {
                        const parsed = JSON.parse(guestsParam);
                        if (Array.isArray(parsed) && parsed.length > 0) {
                            parsedRooms = parsed.map(r => ({
                                adults: r.a || 2,
                                children: r.c || 0,
                                childAges: r.ca || []
                            }));
                        }
                    } catch (e) {}
                }

                const response = await hotelService.searchRooms({
                    hotelId: parseInt(hotelId),
                    searchCriteria: {
                        checkin,
                        checkout,
                        nationality,
                        rooms: parsedRooms
                    }
                });

                if (!isMounted) return;

                const content = response?.data?.content;
                if (content && content.length > 0) {
                    const detailed = content[0];
                    setDetailData(detailed);
                    if (detailed.rooms && detailed.rooms.length > 0) {
                        setRooms(detailed.rooms);
                    } else if (hotel.rooms) {
                        setRooms(hotel.rooms);
                    }
                } else if (hotel.rooms) {
                    setRooms(hotel.rooms);
                }
            } catch (err) {
                console.error('Error fetching rooms in quick look drawer:', err);
                if (isMounted && hotel.rooms) {
                    setRooms(hotel.rooms);
                }
            } finally {
                if (isMounted) setIsRoomsLoading(false);
            }
        };

        fetchHotelRooms();

        return () => {
            isMounted = false;
        };
    }, [hotel?.hotelId, hotel?.id, isOpen, searchParams]);

    // Format dates helper
    const checkin = searchParams?.get('checkin') || '';
    const checkout = searchParams?.get('checkout') || '';

    const formatDateBadge = (dateStr) => {
        if (!dateStr) return '';
        try {
            const parts = dateStr.split('-');
            if (parts.length === 3) {
                const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
                const loc = currentLang === 'tr' ? 'tr-TR' : (currentLang === 'en' ? 'en-GB' : (currentLang === 'de' ? 'de-DE' : (currentLang === 'ar' ? 'ar-SA' : currentLang)));
                return d.toLocaleDateString(loc, { day: 'numeric', month: 'short' });
            }
        } catch {}
        return dateStr;
    };

    const dateRangeLabel = (checkin && checkout) 
        ? `${formatDateBadge(checkin)} - ${formatDateBadge(checkout)}`
        : t('noDatesSelected');

    const formattedPrice = currentHotel.price ? Math.round(currentHotel.price).toLocaleString('tr-TR') : '—';
    const formattedRating = (parseFloat(currentHotel.rating) || 4.4).toFixed(1).replace('.', ',');
    const reviewCount = currentHotel.reviewCount || (currentHotel.stars ? currentHotel.stars * 125 + 42 : 642);
    const starsCount = currentHotel.stars || currentHotel.hotelStar?.star || 4;

    const images = useMemo(() => {
        if (currentHotel.images && currentHotel.images.length > 0) {
            return currentHotel.images.map(img => (typeof img === 'object' ? (img.url || img.originalUrl) : img)).filter(Boolean);
        }
        if (currentHotel.image) return [currentHotel.image];
        return [placeholderHotel, placeholderHotel, placeholderHotel];
    }, [currentHotel.images, currentHotel.image]);

    const detailUrl = `/travel/hotels/detail/${currentHotel.hotelId || currentHotel.id}?${searchParams ? searchParams.toString() : ''}`;

    const handleShare = async () => {
        const fullUrl = window.location.origin + detailUrl;
        if (navigator.share) {
            try {
                await navigator.share({
                    title: currentHotel.name,
                    url: fullUrl,
                });
            } catch {}
        } else {
            try {
                await navigator.clipboard.writeText(fullUrl);
                setIsCopied(true);
                setTimeout(() => setIsCopied(false), 2000);
            } catch {}
        }
    };

    // Keyboard navigation for lightbox
    useEffect(() => {
        if (lightboxIndex === null) return;
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                setLightboxIndex(null);
            } else if (e.key === 'ArrowLeft') {
                setLightboxIndex(prev => (prev - 1 + images.length) % images.length);
            } else if (e.key === 'ArrowRight') {
                setLightboxIndex(prev => (prev + 1) % images.length);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [lightboxIndex, images.length]);

    const directionsUrl = (currentHotel.lat && currentHotel.lng)
        ? `https://www.google.com/maps/dir/?api=1&destination=${currentHotel.lat},${currentHotel.lng}`
        : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(currentHotel.name || '')}`;

    // Group rooms by name, filter by board & policy, sort by price
    const groupedRooms = useMemo(() => {
        if (!rooms || rooms.length === 0) return [];

        let filtered = rooms;
        if (boardTypeFilter !== 'ALL') {
            filtered = filtered.filter(r => (r.hubRateModel?.boardCode || r.boardCode) === boardTypeFilter);
        }
        if (cancelFilter === 'FREE') {
            filtered = filtered.filter(r => {
                const cancelAmount = r.hubRateModel?.price?.cancellationPolicies?.[0]?.amount;
                return r.hubRateModel?.refundable === true || cancelAmount === 0 || r.hasFreeCancellation;
            });
        } else if (cancelFilter === 'NON_REFUNDABLE') {
            filtered = filtered.filter(r => {
                const cancelAmount = r.hubRateModel?.price?.cancellationPolicies?.[0]?.amount;
                return r.hubRateModel?.refundable === false || (cancelAmount !== undefined && cancelAmount > 0);
            });
        }

        const groups = filtered.reduce((acc, r) => {
            const key = r.names?.tr || r.names?.en || r.names?.defaultName || r.name || 'Standart Oda';
            if (!acc[key]) {
                acc[key] = {
                    name: key,
                    images: r.images || [],
                    squareMeter: r.squareMeter,
                    roomPaxCapacity: r.roomPaxCapacity,
                    maxAdult: r.maxAdult || 2,
                    maxChildren: r.maxChildren || 0,
                    attributes: r.attributes || [],
                    rates: []
                };
            }
            acc[key].rates.push(r);
            return acc;
        }, {});

        return Object.values(groups).map(g => ({
            ...g,
            rates: [...g.rates].sort((a, b) => {
                const pA = a.hubRateModel?.price?.calculatedAmount || a.hubRateModel?.price?.totalPaymentAmount || a.price || 0;
                const pB = b.hubRateModel?.price?.calculatedAmount || b.hubRateModel?.price?.totalPaymentAmount || b.price || 0;
                return pA - pB;
            })
        }));
    }, [rooms, boardTypeFilter, cancelFilter]);

    const formatPolicyDate = (dateStr) => {
        if (!dateStr) return '';
        try {
            const d = new Date(dateStr);
            if (!isNaN(d.getTime())) {
                const loc = currentLang === 'tr' ? 'tr-TR' : (currentLang === 'en' ? 'en-GB' : (currentLang === 'de' ? 'de-DE' : (currentLang === 'ar' ? 'ar-SA' : currentLang)));
                return d.toLocaleDateString(loc, { day: 'numeric', month: 'short', year: 'numeric' });
            }
        } catch {}
        return dateStr;
    };

    const handleSelectRateAndCheckout = async (rateItem, roomGroup) => {
        const rateCode = rateItem?.hubRateModel?.rateCode || rateItem?.rateCode;
        if (!rateCode) {
            navigate(detailUrl);
            return;
        }

        setBookingRateCode(rateCode);

        try {
            const checkRatesRequest = {
                rooms: [{ rateCode }]
            };

            const response = await hotelService.checkRates(checkRatesRequest);
            console.log('QuickLook check rates response:', response);

            const checkRatesList = Array.isArray(response) ? response : (response?.data ? (Array.isArray(response.data) ? response.data : [response.data]) : []);
            const firstHotel = checkRatesList[0] || {};
            const rateSearchUuid = response?.rateSearchUuid || firstHotel?.rateSearchUuid || '';

            // Calculate session ID (hash of rateCode)
            let sid = '';
            if (window.crypto && window.crypto.subtle) {
                try {
                    const encoder = new TextEncoder();
                    const data = encoder.encode(rateCode);
                    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
                    const hashArray = Array.from(new Uint8Array(hashBuffer));
                    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
                    sid = hashHex.substring(0, 16);
                } catch (e) {
                    console.warn('Crypto subtle failed', e);
                }
            }
            if (!sid) {
                let hash = 0;
                for (let i = 0; i < rateCode.length; i++) {
                    const char = rateCode.charCodeAt(i);
                    hash = ((hash << 5) - hash) + char;
                    hash = hash & hash;
                }
                sid = Math.abs(hash).toString(16).padEnd(16, 'a');
            }

            const roomName = roomGroup?.name || rateItem?.names?.tr || rateItem?.names?.en || 'Standart Oda';
            const price = rateItem?.hubRateModel?.price?.calculatedAmount 
                || rateItem?.hubRateModel?.price?.totalPaymentAmount 
                || rateItem?.price 
                || currentHotel.price || 0;

            const currency = rateItem?.hubRateModel?.price?.currency || currentHotel.currency || 'EUR';

            const selectedRoom = {
                type: roomName,
                rate: price,
                name: roomName,
                currency: currency,
                hubRateModel: rateItem?.hubRateModel,
                cancellationPolicies: rateItem?.hubRateModel?.price?.cancellationPolicies || [],
                dailyPrices: rateItem?.hubRateModel?.price?.dailyPrices || []
            };

            const parsedCheckIn = checkin ? new Date(checkin) : new Date();
            const parsedCheckOut = checkout ? new Date(checkout) : new Date(Date.now() + 86400000);
            const isoCheckIn = parsedCheckIn.toISOString();
            const isoCheckOut = parsedCheckOut.toISOString();
            const diffDays = Math.max(1, Math.ceil(Math.abs(parsedCheckOut - parsedCheckIn) / (1000 * 60 * 60 * 24)));

            let parsedRooms = [{ adults: 2, children: 0, childAges: [] }];
            const guestsParam = searchParams?.get('guests');
            if (guestsParam) {
                try {
                    const p = JSON.parse(guestsParam);
                    if (Array.isArray(p) && p.length > 0) {
                        parsedRooms = p.map(r => ({ adults: r.a || 2, children: r.c || 0, childAges: r.ca || [] }));
                    }
                } catch {}
            }

            const sessionData = {
                selectedRooms: [selectedRoom],
                hotel: currentHotel,
                roomState: parsedRooms,
                checkInDate: isoCheckIn,
                checkOutDate: isoCheckOut,
                totalPrice: price,
                nights: diffDays,
                rateSearchUuid: rateSearchUuid,
                checkRatesData: firstHotel,
                originalSearch: searchParams ? `?${searchParams.toString()}` : '',
                hotelSlug: String(currentHotel.hotelId || currentHotel.id)
            };

            await hotelService.saveCheckoutSession(sid, sessionData);
            navigate(`/travel/hotels/checkout/guests?sessionId=${sid}`);
        } catch (err) {
            console.error('Check rates error from quick look:', err);
            if (toastError) {
                toastError('Fiyat kontrolü sırasında bir hata oluştu veya bu oda artık müsait değil. Otel detay sayfasına yönlendiriliyorsunuz.');
            }
            navigate(`${detailUrl}&rateCode=${encodeURIComponent(rateCode)}`);
        } finally {
            setBookingRateCode(null);
        }
    };

    const handleToggleRoom = (rateItem, roomGroup) => {
        const rateCode = rateItem?.hubRateModel?.rateCode || rateItem?.rateCode;
        const roomName = roomGroup?.name || rateItem?.names?.tr || rateItem?.names?.en || 'Standart Oda';
        const price = rateItem?.hubRateModel?.price?.calculatedAmount 
            || rateItem?.hubRateModel?.price?.totalPaymentAmount 
            || rateItem?.price 
            || currentHotel.price || 0;
        const currency = rateItem?.hubRateModel?.price?.currency || currentHotel.currency || 'EUR';

        // If single room search, proceed directly to single checkout
        if (maxAllowedRooms === 1) {
            handleSelectRateAndCheckout(rateItem, roomGroup);
            return;
        }

        // Multi-room search
        if (selectedRooms.length >= maxAllowedRooms) {
            if (toastError) {
                toastError(t('toastMaxRoomsReached', maxAllowedRooms));
            }
            return;
        }

        const newRoom = {
            type: roomName,
            rate: price,
            name: roomName,
            currency: currency,
            hubRateModel: rateItem?.hubRateModel,
            rateCode: rateCode,
            cancellationPolicies: rateItem?.hubRateModel?.price?.cancellationPolicies || [],
            dailyPrices: rateItem?.hubRateModel?.price?.dailyPrices || []
        };

        setSelectedRooms(prev => [...prev, newRoom]);
    };

    const handleRemoveRoom = (rateCode) => {
        setSelectedRooms(prev => {
            const index = prev.findIndex(r => (r.hubRateModel?.rateCode || r.rateCode) === rateCode);
            if (index > -1) {
                const next = [...prev];
                next.splice(index, 1);
                return next;
            }
            return prev;
        });
    };

    const handleRemoveRoomByIndex = (index) => {
        setSelectedRooms(prev => {
            const next = [...prev];
            next.splice(index, 1);
            return next;
        });
    };

    const handleMultiRoomCheckout = async () => {
        if (selectedRooms.length === 0 || isMultiBookingLoading) return;
        if (selectedRooms.length < maxAllowedRooms) {
            if (toastError) {
                toastError(t('toastCompleteSelection', maxAllowedRooms, selectedRooms.length));
            }
            return;
        }

        setIsMultiBookingLoading(true);

        try {
            const checkRatesRequest = {
                rooms: selectedRooms.map(room => ({
                    rateCode: room.hubRateModel?.rateCode || room.rateCode || ''
                }))
            };

            const response = await hotelService.checkRates(checkRatesRequest);
            console.log('Multi-room check rates response:', response);

            const checkRatesList = Array.isArray(response) ? response : (response?.data ? (Array.isArray(response.data) ? response.data : [response.data]) : []);
            const firstHotel = checkRatesList[0] || {};
            const rateSearchUuid = response?.rateSearchUuid || firstHotel?.rateSearchUuid || '';

            const concatRateCodes = (selectedRooms || [])
                .map(r => r.hubRateModel?.rateCode || r.rateCode || '')
                .sort()
                .join('_');

            let sid = '';
            if (window.crypto && window.crypto.subtle) {
                try {
                    const encoder = new TextEncoder();
                    const data = encoder.encode(concatRateCodes);
                    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
                    const hashArray = Array.from(new Uint8Array(hashBuffer));
                    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
                    sid = hashHex.substring(0, 16);
                } catch (e) {}
            }
            if (!sid) {
                let hash = 0;
                for (let i = 0; i < concatRateCodes.length; i++) {
                    const char = concatRateCodes.charCodeAt(i);
                    hash = ((hash << 5) - hash) + char;
                    hash = hash & hash;
                }
                sid = Math.abs(hash).toString(16).padEnd(16, 'a');
            }

            const parsedCheckIn = checkin ? new Date(checkin) : new Date();
            const parsedCheckOut = checkout ? new Date(checkout) : new Date(Date.now() + 86400000);
            const isoCheckIn = parsedCheckIn.toISOString();
            const isoCheckOut = parsedCheckOut.toISOString();
            const diffDays = Math.max(1, Math.ceil(Math.abs(parsedCheckOut - parsedCheckIn) / (1000 * 60 * 60 * 24)));

            const sessionData = {
                selectedRooms,
                hotel: currentHotel,
                roomState: parsedRooms,
                checkInDate: isoCheckIn,
                checkOutDate: isoCheckOut,
                totalPrice: totalSelectedPrice,
                nights: diffDays,
                rateSearchUuid: rateSearchUuid,
                checkRatesData: firstHotel,
                originalSearch: searchParams ? `?${searchParams.toString()}` : '',
                hotelSlug: String(currentHotel.hotelId || currentHotel.id)
            };

            await hotelService.saveCheckoutSession(sid, sessionData);
            navigate(`/travel/hotels/checkout/guests?sessionId=${sid}`);
        } catch (err) {
            console.error('Multi room check rates error:', err);
            if (toastError) {
                toastError(t('toastCheckRateError'));
            }
        } finally {
            setIsMultiBookingLoading(false);
        }
    };

    return (
        <div
            className={`absolute inset-0 z-[2100] bg-white dark:bg-[#202124] flex flex-col overflow-hidden transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                isOpen 
                    ? 'translate-x-0 shadow-[8px_0_32px_rgba(0,0,0,0.25)]' 
                    : '-translate-x-full pointer-events-none'
            }`}
            style={{ willChange: 'transform' }}
        >
            {/* ══════════════════════════════════════════
                1. TOP HEADER BAR
            ══════════════════════════════════════════ */}
            <div className="flex items-center justify-between px-6 py-3.5 border-b border-[#dadce0] dark:border-slate-700 shrink-0 bg-white dark:bg-[#202124] z-20">
                <div className="min-w-0 flex-1 pr-3">
                    <div className="flex items-center gap-2">
                        <h1 
                            className="text-[19px] sm:text-[21px] font-medium text-[#202124] dark:text-slate-100 font-roboto truncate"
                            title={currentHotel.name}
                        >
                            {currentHotel.names?.tr || currentHotel.names?.en || currentHotel.name}
                        </h1>
                        <div className="flex text-[#fbbc04] shrink-0">
                            {[...Array(Math.min(starsCount, 5))].map((_, i) => (
                                <span key={i} className="material-symbols-outlined fill-1 text-[16px]">star</span>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    <Link
                        to={detailUrl}
                        target="_blank"
                        className="w-9 h-9 rounded-full flex items-center justify-center text-[#5f6368] dark:text-slate-300 hover:bg-[#f1f3f4] dark:hover:bg-slate-700 transition-colors border border-[#dadce0] dark:border-slate-600"
                        title={t('openInNewTab')}
                    >
                        <span className="material-symbols-outlined text-[19px]">open_in_new</span>
                    </Link>

                    <button
                        onClick={onClose}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 border border-[#dadce0] dark:border-slate-600 rounded-full text-[13px] font-medium text-[#1a73e8] dark:text-blue-400 hover:bg-[#f8fafd] dark:hover:bg-blue-900/20 transition-colors cursor-pointer"
                        title={t('close')}
                    >
                        <span className="material-symbols-outlined text-[17px]">close</span>
                        <span>{t('close')}</span>
                    </button>
                </div>
            </div>

            {/* ══════════════════════════════════════════
                2. NAVIGATION TABS (Yorumlar Kaldırıldı)
            ══════════════════════════════════════════ */}
            <div className="flex items-center px-6 border-b border-[#dadce0] dark:border-slate-700 shrink-0 bg-white dark:bg-[#202124] gap-6 text-[14px] z-10">
                {[
                    { id: 'overview', label: t('overview') },
                    { id: 'prices', label: t('prices') },
                    { id: 'photos', label: t('photos') },
                    { id: 'about', label: t('about') }
                ].map(tab => {
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`py-3 font-medium transition-colors relative cursor-pointer ${
                                isActive 
                                    ? 'text-[#1a73e8] dark:text-blue-400 border-b-2 border-[#1a73e8] dark:border-blue-400' 
                                    : 'text-[#5f6368] dark:text-slate-400 hover:text-[#202124] dark:hover:text-slate-200'
                            }`}
                        >
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* ══════════════════════════════════════════
                3. SCROLLABLE TAB CONTENTS
            ══════════════════════════════════════════ */}
            <div className="flex-1 overflow-y-auto px-6 py-5 custom-scrollbar">

                {/* ──────────────────────────────────────
                    TAB 1: GENEL BAKIŞ (OVERVIEW)
                ────────────────────────────────────── */}
                {activeTab === 'overview' && (
                    <div className="space-y-6">
                        {/* Rating, Address & Price Badge Header */}
                        <div className="flex items-start justify-between gap-4">
                            <div className="space-y-1.5 flex-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-2 text-[13px] text-[#5f6368] dark:text-slate-400">
                                    <span className="font-semibold text-[#202124] dark:text-slate-200">{formattedRating}</span>
                                    <div className="flex text-[#fbbc04] text-[13px]">
                                        {[...Array(5)].map((_, i) => (
                                            <span key={i} className="leading-none">
                                                {i < Math.floor(parseFloat(currentHotel.rating) || 4) ? '★' : '☆'}
                                            </span>
                                        ))}
                                    </div>
                                    <span className="text-[#1a73e8] font-medium">({reviewCount.toLocaleString('tr-TR')})</span>
                                    <span>•</span>
                                    <span>{t('starsHotel', starsCount)}</span>
                                    {currentHotel.isRecommended && (
                                        <span className="bg-[#e6f4ea] text-[#137333] dark:bg-emerald-950/40 dark:text-emerald-300 text-[11px] font-medium px-2 py-0.5 rounded-full">
                                            {t('recommended')}
                                        </span>
                                    )}
                                </div>
                                <p className="text-[13px] text-[#5f6368] dark:text-slate-400 leading-snug">
                                    {currentHotel.address?.street 
                                        ? `${currentHotel.address.street}, ${currentHotel.address.cityName || ''}`
                                        : (currentHotel.address || currentHotel.city || 'İstanbul, Türkiye')}
                                    {currentHotel.contact?.phoneNumber ? ` • ${currentHotel.contact.phoneNumber}` : ''}
                                </p>
                            </div>

                            {/* Blue Price Badge */}
                            <div className="bg-[#1a73e8] text-white rounded-xl px-4 py-2.5 text-right shrink-0 shadow-md min-w-[105px]">
                                <div className="text-[18px] font-bold leading-tight flex items-baseline justify-end">
                                    <span className="mr-1">{currencySymbol}</span>
                                    <span>{formattedPrice}</span>
                                </div>
                                <div className="text-[11px] font-normal opacity-90 leading-tight mt-0.5">
                                    {dateRangeLabel}
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons Row */}
                        <div className="flex flex-wrap items-center gap-2 pt-0.5">
                            {currentHotel.contact?.website && (
                                <a
                                    href={currentHotel.contact.website}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center gap-1.5 px-3.5 py-1.5 border border-[#dadce0] dark:border-slate-600 rounded-full text-[13px] font-medium text-[#1a73e8] dark:text-blue-400 hover:bg-[#f8fafd] dark:hover:bg-blue-900/20 transition-colors"
                                >
                                    <span className="material-symbols-outlined text-[17px]">language</span>
                                    <span>{t('website')}</span>
                                </a>
                            )}

                            <a
                                href={directionsUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-1.5 px-3.5 py-1.5 border border-[#dadce0] dark:border-slate-600 rounded-full text-[13px] font-medium text-[#1a73e8] dark:text-blue-400 hover:bg-[#f8fafd] dark:hover:bg-blue-900/20 transition-colors"
                            >
                                <span className="material-symbols-outlined text-[17px]">directions</span>
                                <span>{t('directions')}</span>
                            </a>

                            <button
                                onClick={onToggleFav}
                                className="flex items-center gap-1.5 px-3.5 py-1.5 border border-[#dadce0] dark:border-slate-600 rounded-full text-[13px] font-medium text-[#1a73e8] dark:text-blue-400 hover:bg-[#f8fafd] dark:hover:bg-blue-900/20 transition-colors cursor-pointer"
                            >
                                <span 
                                    className="material-symbols-outlined text-[17px]"
                                    style={{ fontVariationSettings: isFav ? "'FILL' 1" : "'FILL' 0" }}
                                >
                                    bookmark
                                </span>
                                <span>{isFav ? t('saved') : t('save')}</span>
                            </button>

                            <button
                                onClick={handleShare}
                                className="flex items-center gap-1.5 px-3.5 py-1.5 border border-[#dadce0] dark:border-slate-600 rounded-full text-[13px] font-medium text-[#1a73e8] dark:text-blue-400 hover:bg-[#f8fafd] dark:hover:bg-blue-900/20 transition-colors cursor-pointer"
                            >
                                <span className="material-symbols-outlined text-[17px]">
                                    {isCopied ? 'check' : 'share'}
                                </span>
                                <span>{isCopied ? t('shareSuccess') : t('share')}</span>
                            </button>

                            <button
                                onClick={() => setActiveTab('prices')}
                                className="ml-auto flex items-center justify-center px-5 py-1.5 bg-[#1a73e8] text-white rounded-full text-[13px] font-medium hover:bg-[#1557b0] transition-colors shadow-sm cursor-pointer"
                            >
                                {t('bookRoom')}
                            </button>
                        </div>

                        {/* 3 Photos Strip - Google Style */}
                        <div className="grid grid-cols-12 gap-2 h-[175px] rounded-xl overflow-hidden shadow-sm">
                            <div 
                                onClick={() => setActiveTab('photos')}
                                className="col-span-6 relative h-full overflow-hidden group cursor-pointer"
                            >
                                <img 
                                    src={images[0] || placeholderHotel} 
                                    alt={currentHotel.name}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    onError={e => { e.target.src = placeholderHotel; }}
                                />
                            </div>

                            <div 
                                onClick={() => setActiveTab('photos')}
                                className="col-span-3 relative h-full overflow-hidden group cursor-pointer"
                            >
                                <img 
                                    src={images[1] || images[0] || placeholderHotel} 
                                    alt={currentHotel.name}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    onError={e => { e.target.src = placeholderHotel; }}
                                />
                            </div>

                            <div 
                                onClick={() => setActiveTab('photos')}
                                className="col-span-3 relative h-full overflow-hidden group cursor-pointer"
                            >
                                <img 
                                    src={images[2] || images[0] || placeholderHotel} 
                                    alt={currentHotel.name}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    onError={e => { e.target.src = placeholderHotel; }}
                                />
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setActiveTab('photos');
                                    }}
                                    className="absolute bottom-2.5 right-2.5 bg-black/65 hover:bg-black/85 backdrop-blur-md text-white text-[11.5px] font-medium px-2.5 py-1.5 rounded-full flex items-center gap-1.5 shadow-md transition-colors cursor-pointer"
                                >
                                    <span className="material-symbols-outlined text-[15px]">photo_library</span>
                                    <span>{t('morePhotos')}</span>
                                </button>
                            </div>
                        </div>

                        {/* Featured Prices Preview Card */}
                        <div className="border border-[#dadce0] dark:border-slate-700 rounded-xl p-4 space-y-3 bg-white dark:bg-[#303134]">
                            <div className="flex items-center justify-between">
                                <h3 className="text-[15px] font-medium text-[#202124] dark:text-slate-100">
                                    {t('featuredRates')}
                                </h3>
                                <button
                                    onClick={() => setActiveTab('prices')}
                                    className="text-[13px] font-medium text-[#1a73e8] dark:text-blue-400 hover:underline cursor-pointer"
                                >
                                    {t('viewAllRoomsCta', groupedRooms.length > 0 ? groupedRooms.reduce((sum, g) => sum + g.rates.length, 0) : 0)}
                                </button>
                            </div>

                            {isRoomsLoading ? (
                                <div className="space-y-2 py-2">
                                    <div className="h-12 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse" />
                                    <div className="h-12 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse" />
                                </div>
                            ) : groupedRooms.length > 0 ? (
                                <div className="space-y-2.5">
                                    {groupedRooms.slice(0, 3).map((roomGroup, idx) => {
                                        const bestRate = roomGroup.rates[0];
                                        const price = bestRate?.hubRateModel?.price?.calculatedAmount 
                                            || bestRate?.hubRateModel?.price?.totalPaymentAmount 
                                            || bestRate?.price 
                                            || currentHotel.price;
                                        const boardCode = bestRate?.hubRateModel?.boardCode;
                                        const boardName = getBoardTypeLabel(boardCode, currentLang) 
                                            || bestRate?.hubRateModel?.boardName 
                                            || 'Oda Kahvaltı';
                                        const isFreeCancel = bestRate?.hubRateModel?.price?.cancellationPolicies?.[0]?.amount === 0 
                                            || bestRate?.hasFreeCancellation;

                                        return (
                                            <div key={idx} className="flex items-center justify-between p-3 rounded-lg border border-[#e8eaed] dark:border-slate-700 hover:border-[#1a73e8] transition-colors">
                                                <div className="min-w-0 pr-3">
                                                    <div className="text-[13.5px] font-medium text-[#202124] dark:text-slate-100 truncate">
                                                        {roomGroup.name}
                                                    </div>
                                                    <div className="text-[12px] text-[#5f6368] dark:text-slate-400 flex items-center gap-2 mt-0.5">
                                                        <span>{boardName}</span>
                                                        {isFreeCancel && (
                                                            <span className="text-[#137333] font-medium">• {t('freeCancellation')}</span>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-3 shrink-0">
                                                    <span className="text-[16px] font-bold text-[#202124] dark:text-slate-100 flex items-baseline">
                                                        <span className="mr-1">{currencySymbol}</span>
                                                        <span>{Math.round(price).toLocaleString('tr-TR')}</span>
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            if (maxAllowedRooms > 1) {
                                                                handleToggleRoom(bestRate, roomGroup);
                                                                setActiveTab('prices');
                                                            } else {
                                                                handleSelectRateAndCheckout(bestRate, roomGroup);
                                                            }
                                                        }}
                                                        disabled={!!bookingRateCode}
                                                        className="px-4 py-1.5 bg-[#1a73e8] hover:bg-[#1557b0] text-white text-[12.5px] font-medium rounded-full transition-colors cursor-pointer disabled:opacity-60 flex items-center gap-1.5 shadow-sm"
                                                    >
                                                        {bookingRateCode === (bestRate?.hubRateModel?.rateCode || bestRate?.rateCode) ? (
                                                            <>
                                                                <span className="size-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                                                <span>{t('selecting')}</span>
                                                            </>
                                                        ) : (
                                                            <span>{t('selectRoom')}</span>
                                                        )}
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="flex items-center justify-between p-3 rounded-lg border border-[#e8eaed] dark:border-slate-700">
                                    <div>
                                        <div className="text-[13.5px] font-medium text-[#202124] dark:text-slate-100">
                                            {t('standardRate')}
                                        </div>
                                        <div className="text-[12px] text-[#137333] font-medium">
                                            {t('bestAvailability')}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-[16px] font-bold text-[#202124] dark:text-slate-100 flex items-baseline">
                                            <span className="mr-1">{currencySymbol}</span>
                                            <span>{formattedPrice}</span>
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => navigate(detailUrl)}
                                            className="px-4 py-1.5 bg-[#1a73e8] text-white text-[12.5px] font-medium rounded-full hover:bg-[#1557b0] transition-colors cursor-pointer"
                                        >
                                            {t('selectRoom')}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Popular Amenities */}
                        <div className="space-y-3 pt-1">
                            <h3 className="text-[15px] font-medium text-[#202124] dark:text-slate-100">
                                {t('popularAmenities')}
                            </h3>
                            <div className="grid grid-cols-2 gap-2.5 text-[13px] text-[#3c4043] dark:text-slate-300">
                                <div className="flex items-center gap-2.5">
                                    <span className="material-symbols-outlined text-[19px] text-[#5f6368]">wifi</span>
                                    <span>{t('freeWifi')}</span>
                                </div>
                                <div className="flex items-center gap-2.5">
                                    <span className="material-symbols-outlined text-[19px] text-[#5f6368]">pool</span>
                                    <span>{t('pool')}</span>
                                </div>
                                <div className="flex items-center gap-2.5">
                                    <span className="material-symbols-outlined text-[19px] text-[#5f6368]">spa</span>
                                    <span>{t('spa')}</span>
                                </div>
                                <div className="flex items-center gap-2.5">
                                    <span className="material-symbols-outlined text-[19px] text-[#5f6368]">local_parking</span>
                                    <span>{t('parking')}</span>
                                </div>
                                <div className="flex items-center gap-2.5">
                                    <span className="material-symbols-outlined text-[19px] text-[#5f6368]">restaurant</span>
                                    <span>{t('restaurant')}</span>
                                </div>
                                <div className="flex items-center gap-2.5">
                                    <span className="material-symbols-outlined text-[19px] text-[#5f6368]">ac_unit</span>
                                    <span>{t('airConditioning')}</span>
                                </div>
                            </div>
                        </div>

                        {/* About Property Preview Snippet */}
                        {(currentHotel.description || (currentHotel.descriptions && currentHotel.descriptions.length > 0)) && (
                            <div className="space-y-2 pt-2 border-t border-[#dadce0] dark:border-slate-700">
                                <h3 className="text-[15px] font-medium text-[#202124] dark:text-slate-100">
                                    {t('aboutProperty')}
                                </h3>
                                <p 
                                    className="text-[13px] text-[#5f6368] dark:text-slate-400 line-clamp-3 leading-relaxed"
                                    dangerouslySetInnerHTML={{ 
                                        __html: currentHotel.descriptions?.[0]?.text || currentHotel.description || '' 
                                    }}
                                />
                                <button
                                    onClick={() => setActiveTab('about')}
                                    className="text-[13px] font-medium text-[#1a73e8] dark:text-blue-400 hover:underline cursor-pointer pt-1"
                                >
                                    {t('readMoreInAbout')}
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* ──────────────────────────────────────
                    TAB 2: FİYATLAR (RATES & ROOMS)
                ────────────────────────────────────── */}
                {activeTab === 'prices' && (
                    <div className="-mx-6 -mt-2">
                        {/* Filters Bar - Clean, flush Google style */}
                        <div className="px-6 pb-3.5 pt-1 flex flex-wrap items-center justify-between gap-3 border-b border-[#e8eaed] dark:border-slate-700">
                            <div className="flex flex-wrap items-center gap-2">
                                <GoogleFilterDropdown
                                    icon="restaurant"
                                    prefixLabel={t('boardType')}
                                    value={boardTypeFilter}
                                    onChange={setBoardTypeFilter}
                                    options={[
                                        { value: 'ALL', label: t('allBoards'), icon: 'check_circle' },
                                        ...Object.keys(BOARD_TYPES).map(code => ({
                                            value: code,
                                            label: getBoardTypeLabel(code, currentLang),
                                            icon: 'restaurant'
                                        }))
                                    ]}
                                    defaultValue="ALL"
                                    placeholder={t('allBoards')}
                                />

                                <div className="w-px h-5 bg-[#dadce0] dark:bg-slate-700 hidden sm:block"></div>

                                <GoogleFilterDropdown
                                    icon="event_busy"
                                    prefixLabel={t('cancellationPolicy')}
                                    value={cancelFilter}
                                    onChange={setCancelFilter}
                                    options={[
                                        { value: 'ALL', label: t('allPolicies'), icon: 'rule' },
                                        { value: 'FREE', label: t('freeCancellation'), icon: 'verified' },
                                        { value: 'NON_REFUNDABLE', label: t('nonRefundable'), icon: 'cancel' }
                                    ]}
                                    defaultValue="ALL"
                                    placeholder={t('allPolicies')}
                                />
                            </div>

                            <div className="text-xs text-[#5f6368] dark:text-slate-400 font-medium ml-auto">
                                {groupedRooms.length} {t('roomTypesFound')}
                            </div>
                        </div>

                        {isRoomsLoading ? (
                            <div className="divide-y divide-[#e8eaed] dark:divide-slate-700">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="px-6 py-5 space-y-4 animate-pulse">
                                        <div className="flex gap-4">
                                            <div className="w-44 h-28 bg-slate-200 dark:bg-slate-800 rounded-lg shrink-0" />
                                            <div className="flex-1 space-y-2 py-1">
                                                <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
                                                <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-1/3" />
                                            </div>
                                        </div>
                                        <div className="h-12 bg-slate-100 dark:bg-slate-800 rounded-lg" />
                                    </div>
                                ))}
                            </div>
                        ) : groupedRooms.length > 0 ? (
                            <div className="divide-y divide-[#e8eaed] dark:divide-slate-700">
                                {groupedRooms.map((group, gIdx) => {
                                    const isGroupExpanded = expandedRates[group.name];
                                    const ratesToShow = isGroupExpanded ? group.rates : group.rates.slice(0, 4);
                                    const hasMoreRates = group.rates.length > 4;

                                    return (
                                        <div key={gIdx} className="px-6 py-5 hover:bg-[#fcfdfe] dark:hover:bg-slate-800/20 transition-colors">
                                            {/* Room Top Section: Photo + Specs - Edge-to-edge layout like HotelListing */}
                                            <div className="flex flex-col sm:flex-row gap-4 sm:gap-5">
                                                <div 
                                                    className="w-full sm:w-48 h-40 sm:h-32 rounded-lg overflow-hidden shrink-0 cursor-pointer group/room bg-[#f1f3f4] dark:bg-slate-800 relative"
                                                    onClick={() => {
                                                        const roomImg = group.images?.[0]?.url || images[gIdx % images.length];
                                                        const foundIdx = images.indexOf(roomImg);
                                                        setLightboxIndex(foundIdx >= 0 ? foundIdx : 0);
                                                    }}
                                                >
                                                    <img 
                                                        src={group.images?.[0]?.url || images[gIdx % images.length]} 
                                                        alt={group.name}
                                                        className="w-full h-full object-cover transition-transform duration-500 group-hover/room:scale-105"
                                                        onError={e => { e.target.src = placeholderHotel; }}
                                                    />
                                                    {group.images?.length > 0 && (
                                                        <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-xs text-white text-[11px] font-medium px-2 py-0.5 rounded-md flex items-center gap-1">
                                                            <span className="material-symbols-outlined text-[13px]">photo_library</span>
                                                            <span>{t('photosCount', group.images.length)}</span>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex-1 min-w-0 flex flex-col justify-between">
                                                    <div>
                                                        <div className="flex items-start justify-between gap-3">
                                                            <h3 className="text-[16px] sm:text-[17px] font-semibold text-[#202124] dark:text-slate-100 leading-snug">
                                                                {group.name}
                                                            </h3>
                                                            <div className="flex items-center gap-1.5 shrink-0">
                                                                {group.squareMeter && (
                                                                    <span className="bg-[#f1f3f4] dark:bg-slate-700 text-[#3c4043] dark:text-slate-300 text-[11.5px] font-medium px-2 py-0.5 rounded">
                                                                        {group.squareMeter} m²
                                                                    </span>
                                                                )}
                                                                <span className="bg-[#f1f3f4] dark:bg-slate-700 text-[#3c4043] dark:text-slate-300 text-[11.5px] font-medium px-2 py-0.5 rounded">
                                                                    {group.roomPaxCapacity || group.maxAdult} Pax
                                                                </span>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-3 text-[#5f6368] dark:text-slate-400 text-[12.5px] mt-1.5">
                                                            <span className="flex items-center gap-1">
                                                                <span className="material-symbols-outlined text-[15px]">group</span>
                                                                <span>{t('adults', group.maxAdult)}</span>
                                                            </span>
                                                            {group.maxChildren > 0 && (
                                                                <span className="flex items-center gap-1">
                                                                    <span className="material-symbols-outlined text-[15px]">child_care</span>
                                                                    <span>{t('children', group.maxChildren)}</span>
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Attribute Chips */}
                                                    {(group.attributes || []).length > 0 && (
                                                        <div className="flex flex-wrap gap-1.5 mt-2.5 pt-1">
                                                            {group.attributes.slice(0, 4).map((attr, aIdx) => {
                                                                const label = attr.names?.[currentLang] || attr.names?.tr || attr.names?.en || attr.label;
                                                                return (
                                                                    <span key={aIdx} className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] text-[#5f6368] dark:text-slate-300 bg-[#f8f9fa] dark:bg-slate-800">
                                                                        <span className="material-symbols-outlined text-[13px] text-[#1a73e8]">done</span>
                                                                        <span>{label}</span>
                                                                    </span>
                                                                );
                                                            })}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Rates List - Clean, flat Google design without heavy nested boxes */}
                                            <div className="mt-4 pt-3 border-t border-[#f1f3f4] dark:border-slate-800">
                                                <div className="flex items-center justify-between text-[11.5px] text-[#5f6368] dark:text-slate-400 mb-2">
                                                    <span className="font-medium text-[#202124] dark:text-slate-200">
                                                        {t('availableRates')} ({group.rates.length})
                                                    </span>
                                                    <span>{t('taxesAndFeesIncluded')}</span>
                                                </div>

                                                <div className="space-y-1.5">
                                                    {ratesToShow.map((rateItem, rIdx) => {
                                                        const boardCode = rateItem.hubRateModel?.boardCode;
                                                        const boardLabel = getBoardTypeLabel(boardCode, currentLang) 
                                                            || rateItem.hubRateModel?.boardName 
                                                            || rateItem.boardName 
                                                            || 'Oda Kahvaltı';
                                                        
                                                        const price = rateItem.hubRateModel?.price?.calculatedAmount 
                                                            || rateItem.hubRateModel?.price?.totalPaymentAmount 
                                                            || rateItem.price 
                                                            || currentHotel.price;

                                                        const cancelPolicy = rateItem.hubRateModel?.price?.cancellationPolicies?.[0];
                                                        const isFreeCancel = rateItem.hubRateModel?.refundable === true 
                                                            || cancelPolicy?.amount === 0 
                                                            || rateItem.hasFreeCancellation;
                                                        const cancelDueDate = cancelPolicy?.dueDate ? formatDateBadge(cancelPolicy.dueDate) : null;
                                                        const rateCode = rateItem.hubRateModel?.rateCode || rateItem.rateCode;
                                                        const selectedCount = (selectedRooms || []).filter(r => (r.hubRateModel?.rateCode || r.rateCode) === rateCode).length;
                                                        const isSelected = selectedCount > 0;

                                                        return (
                                                            <div 
                                                                key={rIdx}
                                                                className={`p-3 rounded-xl transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                                                                    isSelected 
                                                                        ? 'bg-[#e8f0fe]/75 dark:bg-blue-950/40 border border-[#1a73e8]/40 ring-1 ring-[#1a73e8]/20' 
                                                                        : 'bg-[#f8f9fa]/80 dark:bg-slate-800/40 hover:bg-[#f1f3f4] dark:hover:bg-slate-800/70 border border-transparent'
                                                                }`}
                                                            >
                                                                <div className="space-y-1 flex-1 min-w-0">
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="material-symbols-outlined text-[17px] text-[#1a73e8]">restaurant</span>
                                                                        <p className="font-medium text-[13.5px] text-[#202124] dark:text-white">
                                                                            {boardLabel}
                                                                        </p>
                                                                    </div>

                                                                    <div className="flex flex-wrap items-center gap-2 pt-0.5">
                                                                        <RefundPolicyTooltip
                                                                            isRefundable={isFreeCancel}
                                                                            textOverride={isFreeCancel ? (cancelDueDate ? t('freeCancelUntil', cancelDueDate) : t('freeCancellation')) : t('nonRefundable')}
                                                                            className={`text-[11px] font-medium px-2 py-0.5 rounded ${
                                                                                isFreeCancel 
                                                                                    ? 'bg-[#e6f4ea] text-[#137333] dark:bg-emerald-950/40 dark:text-emerald-300' 
                                                                                    : 'bg-[#e8eaed] text-[#5f6368] dark:bg-slate-700 dark:text-slate-400'
                                                                            }`}
                                                                        />

                                                                        {rateItem.hubRateModel?.price?.cancellationPolicies?.length > 0 && (
                                                                            <div className="group/cancel relative">
                                                                                <span className="text-[11.5px] text-[#1a73e8] dark:text-blue-400 hover:underline cursor-pointer">
                                                                                    {t('showRules')}
                                                                                </span>
                                                                                <div className="absolute bottom-full left-0 mb-2 w-72 p-3.5 bg-white dark:bg-[#202124] text-[#202124] dark:text-white rounded-lg shadow-xl opacity-0 invisible group-hover/cancel:opacity-100 group-hover/cancel:visible transition-all z-[100] border border-[#dadce0] dark:border-slate-700">
                                                                                    <div className="flex items-center gap-1.5 mb-2.5 border-b border-[#dadce0] dark:border-slate-700 pb-1.5">
                                                                                        <span className="material-symbols-outlined text-sm text-[#1a73e8]">event_busy</span>
                                                                                        <p className="text-xs font-semibold uppercase tracking-wider">{t('cancellationSchedule')}</p>
                                                                                    </div>
                                                                                    <div className="space-y-2">
                                                                                        {rateItem.hubRateModel.price.cancellationPolicies.map((policy, pIdx) => (
                                                                                            <div key={pIdx} className="text-xs border-l-2 border-[#1a73e8] pl-2">
                                                                                                <div className="flex justify-between">
                                                                                                    <span className="text-[#5f6368] dark:text-slate-400">{t('penalty')}</span>
                                                                                                    <span className={policy.amount === 0 ? 'text-[#137333] font-semibold' : 'text-[#d93025] font-semibold'}>
                                                                                                        {policy.currency} {policy.amount}
                                                                                                    </span>
                                                                                                </div>
                                                                                                <p className="text-[11px] text-[#5f6368] dark:text-slate-400">
                                                                                                    {formatPolicyDate(policy.fromDate)} {t('startingFrom')}
                                                                                                </p>
                                                                                            </div>
                                                                                        ))}
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>

                                                                <div className="flex items-center gap-3.5 justify-between sm:justify-end shrink-0 pt-2 sm:pt-0">
                                                                    <div className="text-right">
                                                                        <div className="text-[17px] font-bold text-[#1a73e8] dark:text-blue-400 leading-none flex items-baseline justify-end">
                                                                            <span className="mr-1">{currencySymbol}</span>
                                                                            <span>{Math.round(price).toLocaleString('tr-TR')}</span>
                                                                        </div>
                                                                        <p className="text-[10.5px] text-[#5f6368] dark:text-slate-400 font-normal mt-0.5">
                                                                            {t('totalNetAmount')}
                                                                        </p>
                                                                    </div>

                                                                    {maxAllowedRooms > 1 ? (
                                                                        isSelected ? (
                                                                            <div className="flex items-center gap-1.5 bg-[#e8f0fe] dark:bg-blue-900/40 p-1 rounded-full border border-blue-200 dark:border-blue-800">
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => handleRemoveRoom(rateCode)}
                                                                                    className="w-7 h-7 flex items-center justify-center rounded-full bg-white dark:bg-[#202124] text-[#1a73e8] hover:bg-slate-100 dark:hover:bg-slate-800 shadow-xs cursor-pointer transition-colors"
                                                                                    title={t('removeOneRoom')}
                                                                                >
                                                                                    <span className="material-symbols-outlined text-[16px]">remove</span>
                                                                                </button>
                                                                                <span className="text-[12.5px] font-bold text-[#1a73e8] px-1.5 whitespace-nowrap">
                                                                                    {t('selected', selectedCount)}
                                                                                </span>
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => handleToggleRoom(rateItem, group)}
                                                                                    disabled={selectedRooms.length >= maxAllowedRooms}
                                                                                    className="w-7 h-7 flex items-center justify-center rounded-full bg-[#1a73e8] text-white hover:bg-[#1557b0] disabled:opacity-40 disabled:hover:bg-[#1a73e8] shadow-xs cursor-pointer transition-colors"
                                                                                    title={selectedRooms.length >= maxAllowedRooms ? t('maxRoomsSelected', maxAllowedRooms) : t('addOneMoreRoom')}
                                                                                >
                                                                                    <span className="material-symbols-outlined text-[16px]">add</span>
                                                                                </button>
                                                                            </div>
                                                                        ) : (
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => handleToggleRoom(rateItem, group)}
                                                                                disabled={selectedRooms.length >= maxAllowedRooms}
                                                                                className={`px-4 py-2 text-[12.5px] font-medium rounded-full transition-colors shadow-sm flex items-center gap-1.5 cursor-pointer ${
                                                                                    selectedRooms.length >= maxAllowedRooms
                                                                                        ? 'bg-[#dadce0] dark:bg-slate-700 text-[#70757a] dark:text-slate-400 cursor-not-allowed opacity-60'
                                                                                        : 'bg-[#1a73e8] hover:bg-[#1557b0] text-white'
                                                                                }`}
                                                                            >
                                                                                <span className="material-symbols-outlined text-[16px]">add</span>
                                                                                <span>{t('selectRoom')}</span>
                                                                            </button>
                                                                        )
                                                                    ) : (
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => handleSelectRateAndCheckout(rateItem, group)}
                                                                            disabled={!!bookingRateCode}
                                                                            className="px-4 py-2 bg-[#1a73e8] hover:bg-[#1557b0] text-white text-[12.5px] font-medium rounded-full transition-colors shadow-sm cursor-pointer disabled:opacity-60 flex items-center gap-1.5"
                                                                        >
                                                                            {bookingRateCode === rateCode ? (
                                                                                <>
                                                                                    <span className="size-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                                                                    <span>{t('selecting')}</span>
                                                                                </>
                                                                            ) : (
                                                                                <span>{t('selectRoom')}</span>
                                                                            )}
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>

                                                {hasMoreRates && (
                                                    <button
                                                        onClick={() => setExpandedRates(prev => ({ ...prev, [group.name]: !prev[group.name] }))}
                                                        className="w-full py-2.5 mt-2 text-center text-xs font-medium text-[#1a73e8] dark:text-blue-400 hover:bg-[#f1f3f4] dark:hover:bg-slate-800/60 rounded-lg transition-colors cursor-pointer"
                                                    >
                                                        {isGroupExpanded ? t('showLessRates') : t('showMoreRates', group.rates.length - 4)}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="px-6 py-12 text-center space-y-3">
                                <span className="material-symbols-outlined text-[40px] text-[#70757a]">hotel</span>
                                <h3 className="text-[16px] font-medium text-[#202124] dark:text-slate-100">
                                    {t('startingPrice')} <span className="font-semibold"><span className="mr-1">{currencySymbol}</span>{formattedPrice}</span>
                                </h3>
                                <p className="text-[13px] text-[#5f6368] dark:text-slate-400 max-w-md mx-auto">
                                    {t('allRoomsDesc')}
                                </p>
                                <Link
                                    to={detailUrl}
                                    className="inline-block px-6 py-2.5 bg-[#1a73e8] text-white text-[13px] font-medium rounded-full hover:bg-[#1557b0] transition-colors shadow-sm"
                                >
                                    {t('examineAllRooms')}
                                </Link>
                            </div>
                        )}
                    </div>
                )}

                {/* ──────────────────────────────────────
                    TAB 3: FOTOĞRAFLAR (PHOTOS)
                ────────────────────────────────────── */}
                {activeTab === 'photos' && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between pb-1 border-b border-[#dadce0] dark:border-slate-700">
                            <div>
                                <h2 className="text-[16px] font-medium text-[#202124] dark:text-slate-100">
                                    {t('propertyPhotos')}
                                </h2>
                                <p className="text-[12px] text-[#5f6368] dark:text-slate-400">
                                    {t('totalPhotosCount', images.length)}
                                </p>
                            </div>
                            <span className="text-[12px] text-[#5f6368] dark:text-slate-400">
                                {t('clickToEnlarge')}
                            </span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {images.map((img, idx) => (
                                <div
                                    key={idx}
                                    onClick={() => setLightboxIndex(idx)}
                                    className="relative aspect-[4/3] rounded-xl overflow-hidden group cursor-pointer bg-slate-100 dark:bg-slate-800 border border-[#dadce0] dark:border-slate-700"
                                >
                                    <img
                                        src={img}
                                        alt={`${currentHotel.name} - ${idx + 1}`}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                        onError={e => { e.target.src = placeholderHotel; }}
                                    />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                                        <span className="material-symbols-outlined text-white text-[28px] drop-shadow-md">zoom_in</span>
                                    </div>
                                    <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-sm text-white text-[10px] font-medium px-2 py-0.5 rounded">
                                        {idx + 1} / {images.length}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ──────────────────────────────────────
                    TAB 4: HAKKINDA (ABOUT)
                ────────────────────────────────────── */}
                {activeTab === 'about' && (
                    <div className="space-y-6">
                        {/* Hotel Descriptions */}
                        <div className="space-y-3">
                            <h3 className="text-[16px] font-medium text-[#202124] dark:text-slate-100">
                                {t('aboutProperty')}
                            </h3>
                            {currentHotel.descriptions && currentHotel.descriptions.length > 0 ? (
                                currentHotel.descriptions.map((desc, idx) => (
                                    <div key={idx} className="space-y-1">
                                        {desc.type && (
                                            <h4 className="text-[11px] font-semibold uppercase text-[#1a73e8] tracking-wider">
                                                {desc.type}
                                            </h4>
                                        )}
                                        <p 
                                            className="text-[13.5px] text-[#3c4043] dark:text-slate-300 leading-relaxed"
                                            dangerouslySetInnerHTML={{ __html: desc.text }}
                                        />
                                    </div>
                                ))
                            ) : (
                                <p 
                                    className="text-[13.5px] text-[#3c4043] dark:text-slate-300 leading-relaxed"
                                    dangerouslySetInnerHTML={{ 
                                        __html: currentHotel.description || "Travel of Globe garantili tesisimizde konforlu ve eşsiz bir konaklama deneyimi sizleri bekliyor." 
                                    }}
                                />
                            )}
                        </div>

                        {/* Check-In / Check-Out Policies */}
                        <div className="space-y-3 pt-2 border-t border-[#dadce0] dark:border-slate-700">
                            <h3 className="text-[16px] font-medium text-[#202124] dark:text-slate-100">
                                {t('checkInCheckOutRules')}
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="p-3.5 rounded-xl bg-[#f8f9fa] dark:bg-[#303134] border border-[#dadce0] dark:border-slate-700 flex items-center gap-3">
                                    <div className="size-9 rounded-lg bg-[#e8f0fe] dark:bg-blue-900/30 text-[#1a73e8] flex items-center justify-center shrink-0">
                                        <span className="material-symbols-outlined text-[20px]">login</span>
                                    </div>
                                    <div>
                                        <span className="text-[10.5px] font-medium text-[#5f6368] uppercase tracking-wider block">{t('checkInTime')}</span>
                                        <p className="text-[14px] font-medium text-[#202124] dark:text-white">
                                            {currentHotel.checkIn || '14:00'} {t('fromTime')}
                                        </p>
                                    </div>
                                </div>

                                <div className="p-3.5 rounded-xl bg-[#f8f9fa] dark:bg-[#303134] border border-[#dadce0] dark:border-slate-700 flex items-center gap-3">
                                    <div className="size-9 rounded-lg bg-[#e8f0fe] dark:bg-blue-900/30 text-[#1a73e8] flex items-center justify-center shrink-0">
                                        <span className="material-symbols-outlined text-[20px]">logout</span>
                                    </div>
                                    <div>
                                        <span className="text-[10.5px] font-medium text-[#5f6368] uppercase tracking-wider block">{t('checkOutTime')}</span>
                                        <p className="text-[14px] font-medium text-[#202124] dark:text-white">
                                            {currentHotel.checkOut || '12:00'} {t('untilTime')}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* All Hotel Facilities / Amenities */}
                        <div className="space-y-3 pt-2 border-t border-[#dadce0] dark:border-slate-700">
                            <h3 className="text-[16px] font-medium text-[#202124] dark:text-slate-100">
                                {t('facilitiesAndServices')}
                            </h3>
                            <div className="grid grid-cols-2 gap-2.5">
                                {(currentHotel.facilities && currentHotel.facilities.length > 0) ? (
                                    currentHotel.facilities.map((fac, fIdx) => {
                                        const id = typeof fac === 'object' ? (fac.facilityId || fac.id) : fac;
                                        const match = FACILITY_ICON_MAP[Number(id)];
                                        const label = fac.names?.[currentLang] || fac.names?.tr || fac.names?.en || fac.label || (match ? match.label : t('hotelServiceDefault'));
                                        const icon = match ? match.icon : 'done';

                                        return (
                                            <div key={fIdx} className="flex items-center gap-2.5 p-2 rounded-lg bg-[#f8f9fa] dark:bg-[#303134] border border-[#dadce0] dark:border-slate-700">
                                                <div className="size-7 rounded-md bg-[#e8f0fe] dark:bg-blue-900/30 text-[#1a73e8] flex items-center justify-center shrink-0">
                                                    <span className="material-symbols-outlined text-[16px]">{icon}</span>
                                                </div>
                                                <span className="text-[12.5px] text-[#3c4043] dark:text-slate-200 truncate">{label}</span>
                                            </div>
                                        );
                                    })
                                ) : (
                                    [
                                        { icon: 'wifi', label: t('freeWifi') },
                                        { icon: 'pool', label: t('pool') },
                                        { icon: 'spa', label: t('spa') },
                                        { icon: 'local_parking', label: t('parking') },
                                        { icon: 'restaurant', label: t('restaurant') },
                                        { icon: 'fitness_center', label: t('fitness') },
                                        { icon: 'room_service', label: t('roomService') },
                                        { icon: 'dry_cleaning', label: t('dryCleaning') }
                                    ].map((fac, fIdx) => (
                                        <div key={fIdx} className="flex items-center gap-2.5 p-2 rounded-lg bg-[#f8f9fa] dark:bg-[#303134] border border-[#dadce0] dark:border-slate-700">
                                            <div className="size-7 rounded-md bg-[#e8f0fe] dark:bg-blue-900/30 text-[#1a73e8] flex items-center justify-center shrink-0">
                                                <span className="material-symbols-outlined text-[16px]">{fac.icon}</span>
                                            </div>
                                            <span className="text-[12.5px] text-[#3c4043] dark:text-slate-200 truncate">{fac.label}</span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Location & Contact */}
                        <div className="space-y-3 pt-2 border-t border-[#dadce0] dark:border-slate-700">
                            <h3 className="text-[16px] font-medium text-[#202124] dark:text-slate-100">
                                {t('locationAndContact')}
                            </h3>
                            <div className="p-4 rounded-xl bg-[#f8f9fa] dark:bg-[#303134] border border-[#dadce0] dark:border-slate-700 space-y-3">
                                <div>
                                    <span className="text-[10.5px] font-medium text-[#5f6368] uppercase tracking-wider block">{t('address')}</span>
                                    <p className="text-[13px] font-normal text-[#202124] dark:text-white mt-0.5">
                                        {currentHotel.address?.street 
                                            ? `${currentHotel.address.street}, ${currentHotel.address.cityName || ''}, ${currentHotel.address.countryName || ''}`
                                            : (currentHotel.address || currentHotel.city || 'İstanbul, Türkiye')}
                                    </p>
                                </div>

                                {currentHotel.contact?.phoneNumber && (
                                    <div>
                                        <span className="text-[10.5px] font-medium text-[#5f6368] uppercase tracking-wider block">{t('phone')}</span>
                                        <a href={`tel:${currentHotel.contact.phoneNumber}`} className="text-[13px] font-medium text-[#1a73e8] hover:underline">
                                            {currentHotel.contact.phoneNumber}
                                        </a>
                                    </div>
                                )}

                                {currentHotel.contact?.email && (
                                    <div>
                                        <span className="text-[10.5px] font-medium text-[#5f6368] uppercase tracking-wider block">{t('email')}</span>
                                        <a href={`mailto:${currentHotel.contact.email}`} className="text-[13px] font-medium text-[#1a73e8] hover:underline">
                                            {currentHotel.contact.email}
                                        </a>
                                    </div>
                                )}

                                <div className="pt-2">
                                    <a
                                        href={directionsUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#1a73e8] text-white rounded-lg text-[12.5px] font-medium hover:bg-[#1557b0] transition-colors shadow-sm"
                                    >
                                        <span className="material-symbols-outlined text-[17px]">directions</span>
                                        <span>{t('getDirections')}</span>
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* ══════════════════════════════════════════
                STICKY MULTI-ROOM SELECTION FOOTER BAR
            ══════════════════════════════════════════ */}
            {maxAllowedRooms > 1 && (
                <div className="shrink-0 border-t border-[#dadce0] dark:border-slate-700 bg-white dark:bg-[#202124] px-6 py-3.5 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] z-30">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-xl bg-[#e8f0fe] dark:bg-blue-900/30 text-[#1a73e8] flex items-center justify-center shrink-0">
                                <span className="material-symbols-outlined text-[22px]">hotel</span>
                            </div>
                            <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className="text-[14px] font-semibold text-[#202124] dark:text-white">
                                        {t('roomsSelected', selectedRooms.length, maxAllowedRooms)}
                                    </span>
                                    {selectedRooms.length > 0 && (
                                        <button
                                            type="button"
                                            onClick={() => setSelectedRooms([])}
                                            className="text-[11.5px] text-[#d93025] hover:underline cursor-pointer font-medium"
                                        >
                                            {t('clearSelections')}
                                        </button>
                                    )}
                                </div>
                                <p className="text-[12px] text-[#5f6368] dark:text-slate-400 truncate">
                                    {selectedRooms.length === maxAllowedRooms 
                                        ? t('allRoomsSelectedProceed')
                                        : t('selectMoreRoomsToProceed', maxAllowedRooms - selectedRooms.length)}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                            {selectedRooms.length > 0 && (
                                <div className="text-right">
                                    <div className="text-[18px] font-bold text-[#1a73e8] dark:text-blue-400 leading-tight flex items-baseline justify-end">
                                        <span className="mr-1">{currencySymbol}</span>
                                        <span>{Math.round(totalSelectedPrice).toLocaleString(currentLang === 'tr' ? 'tr-TR' : 'en-US')}</span>
                                    </div>
                                    <p className="text-[10.5px] text-[#5f6368] dark:text-slate-400">
                                        {t('totalSelectedPrice')}
                                    </p>
                                </div>
                            )}

                            <button
                                type="button"
                                onClick={handleMultiRoomCheckout}
                                disabled={selectedRooms.length !== maxAllowedRooms || isMultiBookingLoading}
                                className="px-5 py-2.5 bg-[#1a73e8] hover:bg-[#1557b0] text-white text-[13px] font-medium rounded-full transition-all shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {isMultiBookingLoading ? (
                                    <>
                                        <span className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                        <span>{t('preparing')}</span>
                                    </>
                                ) : (
                                    <>
                                        <span>{t('proceedToBooking', selectedRooms.length, maxAllowedRooms)}</span>
                                        <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Selected rooms pill preview tag list */}
                    {selectedRooms.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-2.5 mt-2 border-t border-[#f1f3f4] dark:border-slate-800">
                            {selectedRooms.map((room, idx) => (
                                <span 
                                    key={idx} 
                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#f1f3f4] dark:bg-slate-800 text-[11.5px] text-[#3c4043] dark:text-slate-200 border border-[#dadce0] dark:border-slate-700"
                                >
                                    <span className="font-semibold text-[#1a73e8]">#{idx + 1}</span>
                                    <span className="truncate max-w-[150px]">{room.name}</span>
                                    <span className="text-[#5f6368] font-medium">({currencySymbol}{Math.round(room.rate)})</span>
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveRoomByIndex(idx)}
                                        className="hover:text-[#d93025] ml-0.5 cursor-pointer flex items-center"
                                        title={t('removeRoom')}
                                    >
                                        <span className="material-symbols-outlined text-[14px]">close</span>
                                    </button>
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ══════════════════════════════════════════
                4. PHOTO LIGHTBOX MODAL
            ══════════════════════════════════════════ */}
            {lightboxIndex !== null && (
                <div 
                    className="absolute inset-0 z-[9999] bg-black flex flex-col justify-between p-4 sm:p-5 select-none"
                    onClick={() => setLightboxIndex(null)}
                >
                    {/* Top Bar: Close Button */}
                    <div className="flex items-center justify-end shrink-0 z-20">
                        <button
                            onClick={() => setLightboxIndex(null)}
                            className="w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center cursor-pointer transition-colors shadow-sm"
                            title={t('close')}
                        >
                            <span className="material-symbols-outlined text-[24px]">close</span>
                        </button>
                    </div>

                    {/* Middle: Left Arrow, Photo, Right Arrow */}
                    <div className="relative flex-1 flex items-center justify-center min-h-0 py-2">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setLightboxIndex((lightboxIndex - 1 + images.length) % images.length);
                            }}
                            className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/15 hover:bg-white/30 text-white flex items-center justify-center cursor-pointer transition-colors z-20 shadow-lg active:scale-95"
                            title={t('previous')}
                        >
                            <span className="material-symbols-outlined text-[28px]">chevron_left</span>
                        </button>

                        <div 
                            className="max-w-full max-h-full flex items-center justify-center rounded-2xl" 
                            onClick={e => e.stopPropagation()}
                        >
                            <img 
                                src={images[lightboxIndex]} 
                                alt={`${currentHotel.name} - ${lightboxIndex + 1}`}
                                className="max-w-full max-h-[70vh] sm:max-h-[74vh] object-contain rounded-xl shadow-2xl"
                            />
                        </div>

                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setLightboxIndex((lightboxIndex + 1) % images.length);
                            }}
                            className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/15 hover:bg-white/30 text-white flex items-center justify-center cursor-pointer transition-colors z-20 shadow-lg active:scale-95"
                            title={t('next')}
                        >
                            <span className="material-symbols-outlined text-[28px]">chevron_right</span>
                        </button>
                    </div>

                    {/* Bottom Bar: Clear Counter Pill */}
                    <div className="flex justify-center shrink-0 z-20 pt-1 pb-1">
                        <div className="text-center text-white/95 text-[13px] font-medium px-4 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/15 shadow-md">
                            {lightboxIndex + 1} / {images.length}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default React.memo(HotelQuickLookDrawer);
