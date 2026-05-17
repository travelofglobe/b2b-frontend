import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { guestService } from '../services/guestService';

const CRM_LOCALES = {
    en: {
        title: 'CRM Passenger List',
        searchPlaceholder: 'Quick search by name, surname, email or phone...',
        colPassenger: 'Passenger Info',
        colBirthDate: 'Birth Date',
        colContact: 'Contact',
        colPassport: 'Passport',
        colAction: 'Action',
        noRecord: 'No records found.',
        selectBtn: 'Select',
        birthLabel: 'Birth:',
        navigate: 'Navigate',
        select: 'Select',
        records: 'Records',
    },
    tr: {
        title: 'CRM Yolcu Listesi',
        searchPlaceholder: 'İsim, soyisim, e-posta veya telefon ile hızlı ara...',
        colPassenger: 'Yolcu Bilgisi',
        colBirthDate: 'Doğum Tarihi',
        colContact: 'İletişim',
        colPassport: 'Pasaport',
        colAction: 'İşlem',
        noRecord: 'Kayıt bulunamadı.',
        selectBtn: 'Seç',
        birthLabel: 'Doğum:',
        navigate: 'Gezin',
        select: 'Seç',
        records: 'Kayıt',
    },
    ar: {
        title: 'قائمة مسافري CRM',
        searchPlaceholder: 'بحث سريع بالاسم أو البريد الإلكتروني أو الهاتف...',
        colPassenger: 'معلومات المسافر',
        colBirthDate: 'تاريخ الميلاد',
        colContact: 'التواصل',
        colPassport: 'جواز السفر',
        colAction: 'إجراء',
        noRecord: 'لا توجد سجلات.',
        selectBtn: 'اختر',
        birthLabel: 'الميلاد:',
        navigate: 'التنقل',
        select: 'اختر',
        records: 'سجل',
    },
    es: {
        title: 'Lista de Pasajeros CRM',
        searchPlaceholder: 'Búsqueda rápida por nombre, apellido, email o teléfono...',
        colPassenger: 'Info del Pasajero',
        colBirthDate: 'Fecha de Nacimiento',
        colContact: 'Contacto',
        colPassport: 'Pasaporte',
        colAction: 'Acción',
        noRecord: 'No se encontraron registros.',
        selectBtn: 'Seleccionar',
        birthLabel: 'Nac:',
        navigate: 'Navegar',
        select: 'Seleccionar',
        records: 'Registros',
    },
    ru: {
        title: 'Список пассажиров CRM',
        searchPlaceholder: 'Быстрый поиск по имени, фамилии, email или телефону...',
        colPassenger: 'Данные пассажира',
        colBirthDate: 'Дата рождения',
        colContact: 'Контакт',
        colPassport: 'Паспорт',
        colAction: 'Действие',
        noRecord: 'Записей не найдено.',
        selectBtn: 'Выбрать',
        birthLabel: 'Рожд:',
        navigate: 'Навигация',
        select: 'Выбрать',
        records: 'Записей',
    },
    fr: {
        title: 'Liste des passagers CRM',
        searchPlaceholder: 'Recherche rapide par nom, prénom, email ou téléphone...',
        colPassenger: 'Info passager',
        colBirthDate: 'Date de naissance',
        colContact: 'Contact',
        colPassport: 'Passeport',
        colAction: 'Action',
        noRecord: 'Aucun enregistrement trouvé.',
        selectBtn: 'Sélectionner',
        birthLabel: 'Né:',
        navigate: 'Naviguer',
        select: 'Sélectionner',
        records: 'Enregistrements',
    },
    de: {
        title: 'CRM-Passagierliste',
        searchPlaceholder: 'Schnellsuche nach Name, E-Mail oder Telefon...',
        colPassenger: 'Passagierinfo',
        colBirthDate: 'Geburtsdatum',
        colContact: 'Kontakt',
        colPassport: 'Reisepass',
        colAction: 'Aktion',
        noRecord: 'Keine Einträge gefunden.',
        selectBtn: 'Auswählen',
        birthLabel: 'Geb:',
        navigate: 'Navigieren',
        select: 'Auswählen',
        records: 'Einträge',
    },
    it: {
        title: 'Lista passeggeri CRM',
        searchPlaceholder: 'Ricerca rapida per nome, cognome, email o telefono...',
        colPassenger: 'Info passeggero',
        colBirthDate: 'Data di nascita',
        colContact: 'Contatto',
        colPassport: 'Passaporto',
        colAction: 'Azione',
        noRecord: 'Nessun record trovato.',
        selectBtn: 'Seleziona',
        birthLabel: 'Nasc:',
        navigate: 'Naviga',
        select: 'Seleziona',
        records: 'Record',
    },
    zh: {
        title: 'CRM 旅客名单',
        searchPlaceholder: '按姓名、电子邮件或电话快速搜索...',
        colPassenger: '旅客信息',
        colBirthDate: '出生日期',
        colContact: '联系方式',
        colPassport: '护照',
        colAction: '操作',
        noRecord: '未找到记录。',
        selectBtn: '选择',
        birthLabel: '生日:',
        navigate: '导航',
        select: '选择',
        records: '条记录',
    },
    ja: {
        title: 'CRM 旅客リスト',
        searchPlaceholder: '氏名、メール、電話で素早く検索...',
        colPassenger: '旅客情報',
        colBirthDate: '生年月日',
        colContact: '連絡先',
        colPassport: 'パスポート',
        colAction: '操作',
        noRecord: '記録が見つかりません。',
        selectBtn: '選択',
        birthLabel: '生年:',
        navigate: 'ナビゲート',
        select: '選択',
        records: '件',
    },
    fa: {
        title: 'لیست مسافران CRM',
        searchPlaceholder: 'جستجوی سریع با نام، ایمیل یا تلفن...',
        colPassenger: 'اطلاعات مسافر',
        colBirthDate: 'تاریخ تولد',
        colContact: 'تماس',
        colPassport: 'گذرنامه',
        colAction: 'عملیات',
        noRecord: 'رکوردی یافت نشد.',
        selectBtn: 'انتخاب',
        birthLabel: 'تولد:',
        navigate: 'ناوبری',
        select: 'انتخاب',
        records: 'رکورد',
    },
    pt: {
        title: 'Lista de Passageiros CRM',
        searchPlaceholder: 'Pesquisa rápida por nome, email ou telefone...',
        colPassenger: 'Info do Passageiro',
        colBirthDate: 'Data de Nascimento',
        colContact: 'Contacto',
        colPassport: 'Passaporte',
        colAction: 'Ação',
        noRecord: 'Nenhum registo encontrado.',
        selectBtn: 'Selecionar',
        birthLabel: 'Nasc:',
        navigate: 'Navegar',
        select: 'Selecionar',
        records: 'Registos',
    },
    el: {
        title: 'Λίστα επιβατών CRM',
        searchPlaceholder: 'Γρήγορη αναζήτηση με όνομα, email ή τηλέφωνο...',
        colPassenger: 'Πληροφορίες επιβάτη',
        colBirthDate: 'Ημερομηνία γέννησης',
        colContact: 'Επικοινωνία',
        colPassport: 'Διαβατήριο',
        colAction: 'Ενέργεια',
        noRecord: 'Δεν βρέθηκαν εγγραφές.',
        selectBtn: 'Επιλογή',
        birthLabel: 'Γέν:',
        navigate: 'Πλοήγηση',
        select: 'Επιλογή',
        records: 'Εγγραφές',
    },
};

const tCrm = (lang, key) => {
    const baseLang = (lang || 'en').split('-')[0].toLowerCase();
    return CRM_LOCALES[baseLang]?.[key] ?? CRM_LOCALES['en'][key] ?? key;
};

const useDebounce = (value, delay) => {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        return () => clearTimeout(handler);
    }, [value, delay]);
    return debouncedValue;
};

const CrmGuestSelectionModal = ({ isOpen, onClose, onSelect }) => {
    const { i18n } = useTranslation();
    const [currentLang, setCurrentLang] = useState(() => {
        const raw = i18n.language || localStorage.getItem('i18nextLng') || localStorage.getItem('language') || 'en';
        return raw.split('-')[0].toLowerCase();
    });

    useEffect(() => {
        const raw = i18n.language || localStorage.getItem('i18nextLng') || localStorage.getItem('language') || 'en';
        setCurrentLang(raw.split('-')[0].toLowerCase());
        const handleLangChange = (lng) => {
            if (lng) setCurrentLang(lng.split('-')[0].toLowerCase());
        };
        i18n.on('languageChanged', handleLangChange);
        return () => { i18n.off('languageChanged', handleLangChange); };
    }, [i18n]);

    const [query, setQuery] = useState('');
    const debouncedQuery = useDebounce(query, 500);
    const [guests, setGuests] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [initialData, setInitialData] = useState(null);
    const PAGE_SIZE = 8;

    const fetchGuests = useCallback(async (searchQuery, targetPage = 0) => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await guestService.filterGuests({ query: searchQuery || null }, targetPage, PAGE_SIZE);
            if (response) {
                const content = response.guests || response.agencyCrmGuests || response.content || (Array.isArray(response) ? response : []);
                const data = {
                    content,
                    totalPages: response.totalPages || 0,
                    totalElements: response.totalElements || content.length,
                    page: targetPage
                };
                setGuests(content);
                setTotalPages(data.totalPages);
                setTotalElements(data.totalElements);
                setSelectedIndex(0);
                setPage(targetPage);
                if (!searchQuery && targetPage === 0) {
                    setInitialData(data);
                }
            } else {
                setGuests([]);
                setTotalPages(0);
                setTotalElements(0);
            }
        } catch (err) {
            console.error('Failed to fetch CRM guests:', err);
            setError(tCrm(currentLang, 'noRecord'));
        } finally {
            setIsLoading(false);
        }
    }, [currentLang]);

    useEffect(() => {
        if (isOpen) {
            setQuery('');
            setPage(0);
            setSelectedIndex(0);
            if (initialData) {
                setGuests(initialData.content);
                setTotalPages(initialData.totalPages);
                setTotalElements(initialData.totalElements);
            } else {
                setGuests([]);
                fetchGuests('', 0);
            }
        } else {
            setQuery('');
            if (initialData) {
                setGuests(initialData.content);
                setTotalPages(initialData.totalPages);
                setTotalElements(initialData.totalElements);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, fetchGuests]);

    useEffect(() => {
        if (isOpen && debouncedQuery !== undefined) {
            setPage(0);
            fetchGuests(debouncedQuery, 0);
        }
    }, [debouncedQuery, isOpen]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!isOpen || guests.length === 0) return;
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex(prev => (prev < guests.length - 1 ? prev + 1 : prev));
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex(prev => (prev > 0 ? prev - 1 : prev));
            } else if (e.key === 'Enter') {
                e.preventDefault();
                onSelect(guests[selectedIndex]);
            } else if (e.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, guests, selectedIndex, onSelect, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex justify-center items-start pt-[5vh] sm:pt-[10vh] p-4 overflow-hidden">
            <div
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300"
                onClick={onClose}
            />

            <div className="relative w-full max-w-5xl max-h-[85vh] bg-white dark:bg-slate-900 rounded-[20px] shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-top-4 duration-300">

                {/* Header & Search */}
                <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 z-20">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary">groups</span>
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white uppercase tracking-tight">
                                {tCrm(currentLang, 'title')}
                            </h3>
                        </div>
                        <button onClick={onClose} className="size-8 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                            <span className="material-symbols-outlined text-xl">close</span>
                        </button>
                    </div>

                    <div className="relative">
                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">search</span>
                        <input
                            autoFocus
                            type="text"
                            placeholder={tCrm(currentLang, 'searchPlaceholder')}
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 py-3 pl-12 pr-4 rounded-xl outline-none focus:border-primary transition-all font-medium text-sm text-slate-900 dark:text-white"
                        />
                    </div>
                </div>

                {/* Table Header */}
                <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <div className="col-span-3">{tCrm(currentLang, 'colPassenger')}</div>
                    <div className="col-span-2">{tCrm(currentLang, 'colBirthDate')}</div>
                    <div className="col-span-3">{tCrm(currentLang, 'colContact')}</div>
                    <div className="col-span-3">{tCrm(currentLang, 'colPassport')}</div>
                    <div className="col-span-1 text-right">{tCrm(currentLang, 'colAction')}</div>
                </div>

                {/* Table Body */}
                <div className="flex-1 overflow-y-auto min-h-[300px]">
                    {isLoading ? (
                        <div className="p-6 space-y-4">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="h-12 bg-slate-50 dark:bg-slate-800/50 rounded-lg animate-pulse" />
                            ))}
                        </div>
                    ) : error ? (
                        <div className="p-20 text-center">
                            <p className="text-red-500 font-bold">{error}</p>
                        </div>
                    ) : guests.length === 0 ? (
                        <div className="p-20 text-center text-slate-400 font-medium">
                            {tCrm(currentLang, 'noRecord')}
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-50 dark:divide-white/5">
                            {guests.map((guest, index) => (
                                <div
                                    key={guest.id}
                                    onClick={() => onSelect(guest)}
                                    onMouseEnter={() => setSelectedIndex(index)}
                                    className={`group grid grid-cols-1 md:grid-cols-12 gap-4 items-center px-6 py-3 cursor-pointer transition-all ${
                                        selectedIndex === index
                                            ? 'bg-primary/5 dark:bg-primary/10 border-l-4 border-primary'
                                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 border-l-4 border-transparent'
                                    }`}
                                >
                                    {/* Name */}
                                    <div className="col-span-1 md:col-span-3 flex items-center gap-3">
                                        <div className={`size-8 rounded-lg flex items-center justify-center shrink-0 ${guest.gender === 'FEMALE' ? 'bg-pink-100 text-pink-500' : 'bg-blue-100 text-blue-500'}`}>
                                            <span className="material-symbols-outlined text-base">{guest.gender === 'FEMALE' ? 'female' : 'male'}</span>
                                        </div>
                                        <span className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate uppercase">
                                            {guest.firstName} {guest.lastName}
                                        </span>
                                    </div>

                                    {/* Birth Date */}
                                    <div className="col-span-1 md:col-span-2 text-xs font-bold text-slate-500 flex items-center gap-2">
                                        <span className="md:hidden text-[10px] uppercase text-slate-400 w-24">{tCrm(currentLang, 'birthLabel')}</span>
                                        {guest.birthDate}
                                    </div>

                                    {/* Contact */}
                                    <div className="col-span-1 md:col-span-3 space-y-0.5">
                                        <div className="text-xs font-bold text-slate-600 dark:text-slate-300 truncate flex items-center gap-1.5">
                                            <span className="material-symbols-outlined text-sm text-slate-400">mail</span>
                                            {guest.email}
                                        </div>
                                        <div className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5">
                                            <span className="material-symbols-outlined text-sm text-slate-400">phone</span>
                                            +{guest.phoneCountryCode} {guest.phoneNumber}
                                        </div>
                                    </div>

                                    {/* Passport */}
                                    <div className="col-span-1 md:col-span-3 flex flex-wrap items-center gap-x-4 gap-y-1">
                                        <div className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5">
                                            <span className="material-symbols-outlined text-sm text-slate-400">badge</span>
                                            {guest.passportNo || '—'}
                                        </div>
                                        {guest.passportExpiry && (
                                            <div className="text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                                                Exp: {guest.passportExpiry}
                                            </div>
                                        )}
                                    </div>

                                    {/* Action */}
                                    <div className="col-span-1 md:col-span-1 text-right">
                                        <button className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${selectedIndex === index ? 'bg-primary text-white shadow-lg' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                                            {tCrm(currentLang, 'selectBtn')}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-6 text-[10px] font-black text-slate-400 uppercase tracking-widest order-2 sm:order-1">
                        <span className="flex items-center gap-1.5">
                            <span className="bg-white dark:bg-slate-700 px-1.5 py-0.5 rounded shadow-sm border border-slate-200 dark:border-slate-600">↑↓</span>
                            {tCrm(currentLang, 'navigate')}
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span className="bg-white dark:bg-slate-700 px-1.5 py-0.5 rounded shadow-sm border border-slate-200 dark:border-slate-600">ENTER</span>
                            {tCrm(currentLang, 'select')}
                        </span>
                    </div>

                    <div className="flex items-center gap-3 order-1 sm:order-2">
                        <button
                            disabled={page === 0 || isLoading}
                            onClick={() => fetchGuests(query, page - 1)}
                            className="size-8 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors shadow-sm"
                        >
                            <span className="material-symbols-outlined text-lg">chevron_left</span>
                        </button>

                        <div className="flex items-center gap-1.5">
                            <span className="text-[11px] font-black text-slate-800 dark:text-white bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md min-w-[32px] text-center">
                                {page + 1}
                            </span>
                            <span className="text-[10px] font-bold text-slate-400">/</span>
                            <span className="text-[11px] font-bold text-slate-500">{totalPages || 1}</span>
                        </div>

                        <button
                            disabled={page >= totalPages - 1 || isLoading}
                            onClick={() => fetchGuests(query, page + 1)}
                            className="size-8 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors shadow-sm"
                        >
                            <span className="material-symbols-outlined text-lg">chevron_right</span>
                        </button>

                        <div className="hidden md:block ml-4 text-[10px] font-black text-primary/60 uppercase tracking-widest">
                            {totalElements} {tCrm(currentLang, 'records')}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CrmGuestSelectionModal;
