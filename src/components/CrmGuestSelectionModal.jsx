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

    // Modal smooth animation state
    const [isRendered, setIsRendered] = useState(isOpen);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setIsRendered(true);
            const raf = requestAnimationFrame(() => {
                setIsVisible(true);
            });
            return () => cancelAnimationFrame(raf);
        } else {
            setIsVisible(false);
            const timer = setTimeout(() => {
                setIsRendered(false);
            }, 220);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    const handleSmoothClose = useCallback(() => {
        setIsVisible(false);
        setTimeout(() => {
            onClose();
        }, 200);
    }, [onClose]);

    const [query, setQuery] = useState('');
    const debouncedQuery = useDebounce(query, 300);
    const [guests, setGuests] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [error, setError] = useState(null);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [hasLoadedInitial, setHasLoadedInitial] = useState(false);
    const PAGE_SIZE = 10;
    const abortRef = React.useRef(null);
    const isFirstSearchRef = React.useRef(true);

    const fetchGuests = useCallback(async (searchQuery, targetPage = 0, isInitial = false) => {
        if (abortRef.current) {
            abortRef.current.abort();
        }
        const controller = new AbortController();
        abortRef.current = controller;

        if (isInitial || !hasLoadedInitial) {
            setIsLoading(true);
        } else {
            setIsSearching(true);
        }
        setError(null);

        try {
            const response = await guestService.filterGuests(
                { query: searchQuery?.trim() || null }, 
                targetPage, 
                PAGE_SIZE,
                controller.signal
            );
            if (response) {
                const content = response.content || response.guests || response.agencyCrmGuests || (Array.isArray(response) ? response : []);
                const calcTotalPages = response.totalPages !== undefined ? response.totalPages : (response.numberOfPages || 0);
                const calcTotalElements = response.totalElements !== undefined ? response.totalElements : (response.numberOfItems || content.length);
                
                setGuests(content);
                setTotalPages(calcTotalPages);
                setTotalElements(calcTotalElements);
                setSelectedIndex(0);
                setPage(targetPage);
                setHasLoadedInitial(true);
            } else {
                setGuests([]);
                setTotalPages(0);
                setTotalElements(0);
            }
        } catch (err) {
            if (err.name !== 'AbortError' && err.name !== 'CanceledError') {
                console.error('Failed to fetch CRM guests:', err);
                setError(tCrm(currentLang, 'noRecord'));
            }
        } finally {
            setIsLoading(false);
            setIsSearching(false);
        }
    }, [currentLang, hasLoadedInitial]);

    // Handle open reset & initial fetch
    useEffect(() => {
        if (isOpen) {
            setQuery('');
            setPage(0);
            setSelectedIndex(0);
            isFirstSearchRef.current = true;
            fetchGuests('', 0, true);
        } else {
            if (abortRef.current) {
                abortRef.current.abort();
            }
        }
    }, [isOpen]);

    // Debounced search (only when user actually searches)
    useEffect(() => {
        if (!isOpen) return;
        if (isFirstSearchRef.current) {
            isFirstSearchRef.current = false;
            return;
        }
        setPage(0);
        fetchGuests(debouncedQuery, 0, false);
    }, [debouncedQuery, isOpen]);

    // Keyboard navigation
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
                if (guests[selectedIndex]) {
                    onSelect(guests[selectedIndex]);
                }
            } else if (e.key === 'Escape') {
                handleSmoothClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, guests, selectedIndex, onSelect, handleSmoothClose]);

    if (!isRendered) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex justify-center items-center p-4 sm:p-6 overflow-hidden pointer-events-auto font-sans">
            {/* Soft Backdrop */}
            <div
                className={`fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity duration-200 ease-out ${
                    isVisible ? 'opacity-100' : 'opacity-0'
                }`}
                onClick={handleSmoothClose}
            />

            {/* Soft Modal Container */}
            <div 
                className={`relative w-full max-w-4xl max-h-[85vh] bg-white dark:bg-slate-900 rounded-xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] border border-slate-200/80 dark:border-slate-800 flex flex-col overflow-hidden transition-all duration-200 ease-out transform ${
                    isVisible 
                        ? 'opacity-100 scale-100 translate-y-0' 
                        : 'opacity-0 scale-[0.97] -translate-y-3'
                }`}
            >
                {/* Header & Search */}
                <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 z-20 relative">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2.5">
                            <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                                <span className="material-symbols-outlined text-[20px]">groups</span>
                            </div>
                            <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider">
                                {tCrm(currentLang, 'title')}
                            </h3>
                        </div>
                        <button 
                            type="button"
                            onClick={handleSmoothClose} 
                            className="size-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        >
                            <span className="material-symbols-outlined text-lg">close</span>
                        </button>
                    </div>

                    <div className="relative">
                        <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-lg pointer-events-none">search</span>
                        <input
                            autoFocus
                            type="text"
                            placeholder={tCrm(currentLang, 'searchPlaceholder')}
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 py-2.5 pl-10 pr-10 rounded-lg outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-medium text-xs text-slate-900 dark:text-white placeholder:text-slate-400"
                        />
                        {query && (
                            <button
                                type="button"
                                onClick={() => setQuery('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                            >
                                <span className="material-symbols-outlined text-base">cancel</span>
                            </button>
                        )}
                    </div>

                    {/* Non-glitch top loading progress bar */}
                    {isSearching && (
                        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-slate-100 dark:bg-slate-800 overflow-hidden">
                            <div className="w-full h-full bg-primary animate-pulse"></div>
                        </div>
                    )}
                </div>

                {/* Table Header */}
                <div className="hidden md:grid grid-cols-12 gap-3 px-5 py-2.5 bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider select-none">
                    <div className="col-span-3">{tCrm(currentLang, 'colPassenger')}</div>
                    <div className="col-span-2">{tCrm(currentLang, 'colBirthDate')}</div>
                    <div className="col-span-3">{tCrm(currentLang, 'colContact')}</div>
                    <div className="col-span-3">{tCrm(currentLang, 'colPassport')}</div>
                    <div className="col-span-1 text-right">{tCrm(currentLang, 'colAction')}</div>
                </div>

                {/* Table Body */}
                <div className="flex-1 overflow-y-auto min-h-[280px] max-h-[50vh] relative">
                    {isLoading ? (
                        <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                            {[...Array(6)].map((_, i) => (
                                <div key={i} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center px-5 py-3 animate-pulse">
                                    {/* Passenger Info Skeleton */}
                                    <div className="col-span-1 md:col-span-3 flex items-center gap-2.5">
                                        <div className="size-7 rounded-md bg-slate-200/70 dark:bg-slate-700/60 shrink-0" />
                                        <div className="space-y-1.5 flex-1 min-w-0">
                                            <div className="h-3.5 bg-slate-200/80 dark:bg-slate-700/60 rounded w-28" />
                                        </div>
                                    </div>

                                    {/* Birth Date Skeleton */}
                                    <div className="col-span-1 md:col-span-2">
                                        <div className="h-3 bg-slate-200/70 dark:bg-slate-700/50 rounded w-20" />
                                    </div>

                                    {/* Contact Skeleton */}
                                    <div className="col-span-1 md:col-span-3 space-y-1.5">
                                        <div className="h-3 bg-slate-200/80 dark:bg-slate-700/60 rounded w-36" />
                                        <div className="h-2.5 bg-slate-200/50 dark:bg-slate-700/40 rounded w-24" />
                                    </div>

                                    {/* Passport Skeleton */}
                                    <div className="col-span-1 md:col-span-3 flex items-center gap-2">
                                        <div className="h-3 bg-slate-200/70 dark:bg-slate-700/50 rounded w-20" />
                                        <div className="h-4 bg-slate-200/60 dark:bg-slate-700/40 rounded w-16" />
                                    </div>

                                    {/* Action Button Skeleton */}
                                    <div className="col-span-1 md:col-span-1 flex justify-end">
                                        <div className="h-6 w-14 bg-slate-200/70 dark:bg-slate-700/50 rounded-md" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : error ? (
                        <div className="p-12 text-center">
                            <p className="text-red-500 font-bold text-xs">{error}</p>
                        </div>
                    ) : guests.length === 0 ? (
                        <div className="p-12 text-center text-slate-400 text-xs font-medium">
                            <span className="material-symbols-outlined text-3xl text-slate-300 dark:text-slate-600 block mb-2">person_search</span>
                            {tCrm(currentLang, 'noRecord')}
                        </div>
                    ) : (
                        <div className={`divide-y divide-slate-100 dark:divide-slate-800/60 transition-opacity duration-150 ${isSearching ? 'opacity-60' : 'opacity-100'}`}>
                            {guests.map((guest, index) => (
                                <div
                                    key={guest.id || index}
                                    onClick={() => onSelect(guest)}
                                    onMouseEnter={() => setSelectedIndex(index)}
                                    className={`group grid grid-cols-1 md:grid-cols-12 gap-3 items-center px-5 py-2.5 cursor-pointer transition-colors duration-150 ${
                                        selectedIndex === index
                                            ? 'bg-primary/5 dark:bg-primary/10 border-l-4 border-primary'
                                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/40 border-l-4 border-transparent'
                                    }`}
                                >
                                    {/* Name */}
                                    <div className="col-span-1 md:col-span-3 flex items-center gap-2.5 min-w-0">
                                        <div className={`size-7 rounded-md flex items-center justify-center shrink-0 ${guest.gender === 'FEMALE' ? 'bg-pink-50 dark:bg-pink-950/40 text-pink-500' : 'bg-blue-50 dark:bg-blue-950/40 text-blue-500'}`}>
                                            <span className="material-symbols-outlined text-[16px]">{guest.gender === 'FEMALE' ? 'female' : 'male'}</span>
                                        </div>
                                        <span className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate uppercase">
                                            {guest.firstName} {guest.lastName}
                                        </span>
                                    </div>

                                    {/* Birth Date */}
                                    <div className="col-span-1 md:col-span-2 text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-2">
                                        <span className="md:hidden text-[10px] uppercase text-slate-400 w-24">{tCrm(currentLang, 'birthLabel')}</span>
                                        {guest.birthDate || '—'}
                                    </div>

                                    {/* Contact */}
                                    <div className="col-span-1 md:col-span-3 space-y-0.5 min-w-0">
                                        <div className="text-xs font-medium text-slate-600 dark:text-slate-300 truncate flex items-center gap-1.5">
                                            <span className="material-symbols-outlined text-[14px] text-slate-400 shrink-0">mail</span>
                                            <span className="truncate">{guest.email || '—'}</span>
                                        </div>
                                        {guest.phoneNumber && (
                                            <div className="text-[11px] font-normal text-slate-400 flex items-center gap-1.5">
                                                <span className="material-symbols-outlined text-[14px] text-slate-400 shrink-0">phone</span>
                                                <span>{guest.phoneCountryCode ? `+${guest.phoneCountryCode} ` : ''}{guest.phoneNumber}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Passport */}
                                    <div className="col-span-1 md:col-span-3 flex flex-wrap items-center gap-x-2.5 gap-y-1">
                                        <div className="text-xs font-medium text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                                            <span className="material-symbols-outlined text-[14px] text-slate-400">badge</span>
                                            <span>{guest.passportNo || '—'}</span>
                                        </div>
                                        {guest.passportExpiry && (
                                            <div className="text-[9px] font-semibold text-slate-400 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                                                Exp: {guest.passportExpiry}
                                            </div>
                                        )}
                                    </div>

                                    {/* Action */}
                                    <div className="col-span-1 md:col-span-1 text-right">
                                        <button 
                                            type="button"
                                            className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all duration-150 ${
                                                selectedIndex === index 
                                                    ? 'bg-primary text-white shadow-xs' 
                                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 group-hover:bg-primary group-hover:text-white'
                                            }`}
                                        >
                                            {tCrm(currentLang, 'selectBtn')}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-5 py-3.5 bg-slate-50/80 dark:bg-slate-800/80 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 select-none">
                    <div className="flex items-center gap-5 text-[10px] font-bold text-slate-400 uppercase tracking-wider order-2 sm:order-1">
                        <span className="flex items-center gap-1.5">
                            <kbd className="bg-white dark:bg-slate-700 px-1.5 py-0.5 rounded shadow-xs border border-slate-200 dark:border-slate-600 font-mono">↑↓</kbd>
                            {tCrm(currentLang, 'navigate')}
                        </span>
                        <span className="flex items-center gap-1.5">
                            <kbd className="bg-white dark:bg-slate-700 px-1.5 py-0.5 rounded shadow-xs border border-slate-200 dark:border-slate-600 font-mono">ENTER</kbd>
                            {tCrm(currentLang, 'select')}
                        </span>
                        <span className="flex items-center gap-1.5">
                            <kbd className="bg-white dark:bg-slate-700 px-1.5 py-0.5 rounded shadow-xs border border-slate-200 dark:border-slate-600 font-mono">ESC</kbd>
                            {tCrm(currentLang, 'close') || 'Close'}
                        </span>
                    </div>

                    <div className="flex items-center gap-2.5 order-1 sm:order-2">
                        <button
                            type="button"
                            disabled={page === 0 || isLoading || isSearching}
                            onClick={() => fetchGuests(query, page - 1)}
                            className="size-7 flex items-center justify-center rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-xs cursor-pointer"
                        >
                            <span className="material-symbols-outlined text-base">chevron_left</span>
                        </button>

                        <div className="flex items-center gap-1">
                            <span className="text-[11px] font-bold text-slate-800 dark:text-white bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 px-2 py-0.5 rounded text-center min-w-[24px]">
                                {page + 1}
                            </span>
                            <span className="text-[10px] font-bold text-slate-400">/</span>
                            <span className="text-[11px] font-medium text-slate-500">{totalPages || 1}</span>
                        </div>

                        <button
                            type="button"
                            disabled={page >= totalPages - 1 || isLoading || isSearching}
                            onClick={() => fetchGuests(query, page + 1)}
                            className="size-7 flex items-center justify-center rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-xs cursor-pointer"
                        >
                            <span className="material-symbols-outlined text-base">chevron_right</span>
                        </button>

                        <div className="hidden sm:block ml-3 text-[11px] font-bold text-primary tracking-wide">
                            {totalElements} {tCrm(currentLang, 'records')}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CrmGuestSelectionModal;
