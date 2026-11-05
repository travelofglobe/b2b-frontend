import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { COMMON, getLang } from '../utils/sharedLocales';
import { markupService } from '../services/markupService';

// ─── Inline translations ────────────────────────────────────────────────────
const MR = {
    en: {
        title: 'Revision History',
        subtitle: 'All recorded changes for this markup rule',
        loading: 'Loading revisions...',
        noData: 'No revision history found',
        colUpdateDateTime: 'Update Date',
        colCreatedBy: 'Created By',
        colUpdatedBy: 'Updated By',
        colName: 'Name',
        colStatus: 'Status',
        colAgencies: 'Agencies',
        colSuppliers: 'Suppliers',
        colPriority: 'Priority',
        colValue: 'Value',
        colSalesStart: 'Sales Start',
        colSalesEnd: 'Sales End',
        colCheckinStart: 'Check-in Start',
        colCheckoutEnd: 'Check-out End',
        colNationalities: 'Nationalities',
        colHotels: 'Hotels',
        colCancelPolicy: 'Cancel Policy',
        revision: 'Revision',
        failedLoad: 'Failed to load revisions',
        close: 'Close',
    },
    tr: {
        title: 'Revizyon Geçmişi',
        subtitle: 'Bu markup kuralına ait tüm değişiklik kayıtları',
        loading: 'Revizyonlar yükleniyor...',
        noData: 'Revizyon geçmişi bulunamadı',
        colUpdateDateTime: 'Güncelleme Tarihi',
        colCreatedBy: 'Oluşturan',
        colUpdatedBy: 'Güncelleyen',
        colName: 'Ad',
        colStatus: 'Durum',
        colAgencies: 'Acenteler',
        colSuppliers: 'Tedarikçiler',
        colPriority: 'Öncelik',
        colValue: 'Değer',
        colSalesStart: 'Satış Başlangıcı',
        colSalesEnd: 'Satış Bitişi',
        colCheckinStart: 'Check-in Başlangıcı',
        colCheckoutEnd: 'Check-out Bitişi',
        colNationalities: 'Uyruklar',
        colHotels: 'Oteller',
        colCancelPolicy: 'İptal Politikası',
        revision: 'Revizyon',
        failedLoad: 'Revizyonlar yüklenemedi',
        close: 'Kapat',
    },
    ar: {
        title: 'سجل المراجعات',
        subtitle: 'جميع التغييرات المسجلة لقاعدة الترميز هذه',
        loading: 'جارٍ تحميل المراجعات...',
        noData: 'لا يوجد سجل مراجعات',
        colUpdateDateTime: 'تاريخ التحديث',
        colCreatedBy: 'أنشئ بواسطة',
        colUpdatedBy: 'حُدِّث بواسطة',
        colName: 'الاسم',
        colStatus: 'الحالة',
        colAgencies: 'الوكالات',
        colSuppliers: 'الموردون',
        colPriority: 'الأولوية',
        colValue: 'القيمة',
        colSalesStart: 'بداية المبيعات',
        colSalesEnd: 'نهاية المبيعات',
        colCheckinStart: 'بداية تسجيل الوصول',
        colCheckoutEnd: 'نهاية تسجيل المغادرة',
        colNationalities: 'الجنسيات',
        colHotels: 'الفنادق',
        colCancelPolicy: 'سياسة الإلغاء',
        revision: 'مراجعة',
        failedLoad: 'فشل تحميل المراجعات',
        close: 'إغلاق',
    },
    es: {
        title: 'Historial de Revisiones',
        subtitle: 'Todos los cambios registrados para esta regla de markup',
        loading: 'Cargando revisiones...',
        noData: 'No se encontró historial de revisiones',
        colUpdateDateTime: 'Fecha de actualización',
        colCreatedBy: 'Creado por',
        colUpdatedBy: 'Actualizado por',
        colName: 'Nombre',
        colStatus: 'Estado',
        colAgencies: 'Agencias',
        colSuppliers: 'Proveedores',
        colPriority: 'Prioridad',
        colValue: 'Valor',
        colSalesStart: 'Inicio de ventas',
        colSalesEnd: 'Fin de ventas',
        colCheckinStart: 'Inicio de check-in',
        colCheckoutEnd: 'Fin de check-out',
        colNationalities: 'Nacionalidades',
        colHotels: 'Hoteles',
        colCancelPolicy: 'Política de cancelación',
        revision: 'Revisión',
        failedLoad: 'No se pudieron cargar las revisiones',
        close: 'Cerrar',
    },
    ru: {
        title: 'История ревизий',
        subtitle: 'Все записанные изменения для этого правила наценки',
        loading: 'Загрузка ревизий...',
        noData: 'История ревизий не найдена',
        colUpdateDateTime: 'Дата обновления',
        colCreatedBy: 'Создано',
        colUpdatedBy: 'Обновлено',
        colName: 'Название',
        colStatus: 'Статус',
        colAgencies: 'Агентства',
        colSuppliers: 'Поставщики',
        colPriority: 'Приоритет',
        colValue: 'Значение',
        colSalesStart: 'Начало продаж',
        colSalesEnd: 'Конец продаж',
        colCheckinStart: 'Начало заезда',
        colCheckoutEnd: 'Конец выезда',
        colNationalities: 'Национальности',
        colHotels: 'Отели',
        colCancelPolicy: 'Политика отмены',
        revision: 'Ревизия',
        failedLoad: 'Не удалось загрузить ревизии',
        close: 'Закрыть',
    },
    fr: {
        title: 'Historique des révisions',
        subtitle: 'Tous les changements enregistrés pour cette règle de tarification',
        loading: 'Chargement des révisions...',
        noData: 'Aucun historique de révision trouvé',
        colUpdateDateTime: 'Date de mise à jour',
        colCreatedBy: 'Créé par',
        colUpdatedBy: 'Mis à jour par',
        colName: 'Nom',
        colStatus: 'Statut',
        colAgencies: 'Agences',
        colSuppliers: 'Fournisseurs',
        colPriority: 'Priorité',
        colValue: 'Valeur',
        colSalesStart: 'Début des ventes',
        colSalesEnd: 'Fin des ventes',
        colCheckinStart: 'Début du check-in',
        colCheckoutEnd: 'Fin du check-out',
        colNationalities: 'Nationalités',
        colHotels: 'Hôtels',
        colCancelPolicy: 'Politique d\'annulation',
        revision: 'Révision',
        failedLoad: 'Échec du chargement des révisions',
        close: 'Fermer',
    },
    zh: {
        title: '修订历史',
        subtitle: '此加价规则的所有记录更改',
        loading: '正在加载修订...',
        noData: '未找到修订历史',
        colUpdateDateTime: '更新日期',
        colCreatedBy: '创建者',
        colUpdatedBy: '更新者',
        colName: '名称',
        colStatus: '状态',
        colAgencies: '代理商',
        colSuppliers: '供应商',
        colPriority: '优先级',
        colValue: '值',
        colSalesStart: '销售开始',
        colSalesEnd: '销售结束',
        colCheckinStart: '入住开始',
        colCheckoutEnd: '退房结束',
        colNationalities: '国籍',
        colHotels: '酒店',
        colCancelPolicy: '取消政策',
        revision: '修订',
        failedLoad: '无法加载修订',
        close: '关闭',
    },
    ja: {
        title: '改訂履歴',
        subtitle: 'このマークアップルールの記録された変更一覧',
        loading: '改訂を読み込んでいます...',
        noData: '改訂履歴が見つかりません',
        colUpdateDateTime: '更新日時',
        colCreatedBy: '作成者',
        colUpdatedBy: '更新者',
        colName: '名前',
        colStatus: 'ステータス',
        colAgencies: '代理店',
        colSuppliers: 'サプライヤー',
        colPriority: '優先度',
        colValue: '値',
        colSalesStart: '販売開始',
        colSalesEnd: '販売終了',
        colCheckinStart: 'チェックイン開始',
        colCheckoutEnd: 'チェックアウト終了',
        colNationalities: '国籍',
        colHotels: 'ホテル',
        colCancelPolicy: 'キャンセルポリシー',
        revision: '改訂',
        failedLoad: '改訂の読み込みに失敗しました',
        close: '閉じる',
    },
    fa: {
        title: 'تاریخچه بازبینی',
        subtitle: 'تمام تغییرات ثبت‌شده برای این قانون',
        loading: 'در حال بارگذاری بازبینی‌ها...',
        noData: 'تاریخچه بازبینی یافت نشد',
        colUpdateDateTime: 'تاریخ به‌روزرسانی',
        colCreatedBy: 'ایجادکننده',
        colUpdatedBy: 'به‌روزکننده',
        colName: 'نام',
        colStatus: 'وضعیت',
        colAgencies: 'آژانس‌ها',
        colSuppliers: 'تأمین‌کنندگان',
        colPriority: 'اولویت',
        colValue: 'مقدار',
        colSalesStart: 'شروع فروش',
        colSalesEnd: 'پایان فروش',
        colCheckinStart: 'شروع ورود',
        colCheckoutEnd: 'پایان خروج',
        colNationalities: 'ملیت‌ها',
        colHotels: 'هتل‌ها',
        colCancelPolicy: 'سیاست لغو',
        revision: 'بازبینی',
        failedLoad: 'بارگذاری بازبینی‌ها انجام نشد',
        close: 'بستن',
    },
    it: {
        title: 'Cronologia Revisioni',
        subtitle: 'Tutte le modifiche registrate per questa regola di ricarico',
        loading: 'Caricamento revisioni...',
        noData: 'Nessuna cronologia di revisioni trovata',
        colUpdateDateTime: 'Data aggiornamento',
        colCreatedBy: 'Creato da',
        colUpdatedBy: 'Aggiornato da',
        colName: 'Nome',
        colStatus: 'Stato',
        colAgencies: 'Agenzie',
        colSuppliers: 'Fornitori',
        colPriority: 'Priorità',
        colValue: 'Valore',
        colSalesStart: 'Inizio vendite',
        colSalesEnd: 'Fine vendite',
        colCheckinStart: 'Inizio check-in',
        colCheckoutEnd: 'Fine check-out',
        colNationalities: 'Nazionalità',
        colHotels: 'Hotel',
        colCancelPolicy: 'Politica di cancellazione',
        revision: 'Revisione',
        failedLoad: 'Caricamento revisioni fallito',
        close: 'Chiudi',
    },
    el: {
        title: 'Ιστορικό Αναθεωρήσεων',
        subtitle: 'Όλες οι καταγεγραμμένες αλλαγές για αυτόν τον κανόνα',
        loading: 'Φόρτωση αναθεωρήσεων...',
        noData: 'Δεν βρέθηκε ιστορικό αναθεωρήσεων',
        colUpdateDateTime: 'Ημερομηνία ενημέρωσης',
        colCreatedBy: 'Δημιουργήθηκε από',
        colUpdatedBy: 'Ενημερώθηκε από',
        colName: 'Όνομα',
        colStatus: 'Κατάσταση',
        colAgencies: 'Πρακτορεία',
        colSuppliers: 'Προμηθευτές',
        colPriority: 'Προτεραιότητα',
        colValue: 'Αξία',
        colSalesStart: 'Έναρξη πωλήσεων',
        colSalesEnd: 'Λήξη πωλήσεων',
        colCheckinStart: 'Έναρξη check-in',
        colCheckoutEnd: 'Λήξη check-out',
        colNationalities: 'Εθνικότητες',
        colHotels: 'Ξενοδοχεία',
        colCancelPolicy: 'Πολιτική ακύρωσης',
        revision: 'Αναθεώρηση',
        failedLoad: 'Αποτυχία φόρτωσης αναθεωρήσεων',
        close: 'Κλείσιμο',
    },
    pt: {
        title: 'Histórico de Revisões',
        subtitle: 'Todas as alterações registradas para esta regra de markup',
        loading: 'Carregando revisões...',
        noData: 'Nenhum histórico de revisões encontrado',
        colUpdateDateTime: 'Data de atualização',
        colCreatedBy: 'Criado por',
        colUpdatedBy: 'Atualizado por',
        colName: 'Nome',
        colStatus: 'Status',
        colAgencies: 'Agências',
        colSuppliers: 'Fornecedores',
        colPriority: 'Prioridade',
        colValue: 'Valor',
        colSalesStart: 'Início das vendas',
        colSalesEnd: 'Fim das vendas',
        colCheckinStart: 'Início do check-in',
        colCheckoutEnd: 'Fim do check-out',
        colNationalities: 'Nacionalidades',
        colHotels: 'Hotéis',
        colCancelPolicy: 'Política de cancelamento',
        revision: 'Revisão',
        failedLoad: 'Falha ao carregar revisões',
        close: 'Fechar',
    },
};

const tMR = (lang, key) => {
    const l = getLang(lang);
    return MR[l]?.[key] ?? MR.en[key] ?? COMMON[l]?.[key] ?? COMMON.en[key] ?? key;
};

// ─── Helpers ────────────────────────────────────────────────────────────────
const formatDateTime = (value, lang) => {
    if (!value) return '–';
    try {
        return new Intl.DateTimeFormat(lang || 'en', {
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit',
        }).format(new Date(value));
    } catch {
        return value;
    }
};

const formatDate = (value, lang) => {
    if (!value) return '–';
    try {
        return new Intl.DateTimeFormat(lang || 'en', {
            year: 'numeric', month: '2-digit', day: '2-digit',
        }).format(new Date(value));
    } catch {
        return value;
    }
};

const renderIdNameList = (arr) => {
    if (!arr || arr.length === 0) return <span className="text-[#9aa0a6] text-[11px] italic">–</span>;
    const items = arr.slice(0, 2);
    const rest = arr.length - 2;
    return (
        <div className="flex flex-wrap gap-1">
            {items.map((item, i) => (
                <span
                    key={item.id ?? i}
                    className="px-2 py-0.5 bg-[#e8f0fe] dark:bg-[#1a73e8]/20 text-[#1a73e8] dark:text-[#8ab4f8] text-[10px] font-medium rounded-full whitespace-nowrap max-w-[140px] truncate"
                    title={item.name}
                >
                    {item.name}
                </span>
            ))}
            {rest > 0 && (
                <span className="px-2 py-0.5 bg-[#f1f3f4] dark:bg-[#3c4043] text-[#5f6368] dark:text-[#bdc1c6] text-[10px] font-medium rounded-full">
                    +{rest}
                </span>
            )}
        </div>
    );
};

const renderValue = (m) => {
    if (m.value == null) return <span className="text-[#9aa0a6] text-[11px] italic">–</span>;
    return (
        <span className="font-semibold text-[#137333] dark:text-[#81c995] text-[11px] bg-[#e6f4ea] dark:bg-[#137333]/20 px-2 py-0.5 rounded-full">
            +{m.value}%
        </span>
    );
};

// ─── Component ──────────────────────────────────────────────────────────────
const MarkupRevisionModal = ({ isOpen, onClose, markupId, markupName }) => {
    const { i18n } = useTranslation();
    const [currentLang, setCurrentLang] = useState(
        () => (i18n.language || localStorage.getItem('i18nextLng') || 'en').split('-')[0].toLowerCase()
    );

    useEffect(() => {
        setCurrentLang((i18n.language || 'en').split('-')[0].toLowerCase());
        const handler = (lng) => setCurrentLang((lng || 'en').split('-')[0].toLowerCase());
        i18n.on('languageChanged', handler);
        return () => i18n.off('languageChanged', handler);
    }, [i18n]);

    const L = useCallback((key) => tMR(currentLang, key), [currentLang]);

    const [revisions, setRevisions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!isOpen || !markupId) return;
        let cancelled = false;
        setLoading(true);
        setError(null);
        setRevisions([]);
        markupService.findRevisions(markupId)
            .then((res) => {
                if (cancelled) return;
                const list = Array.isArray(res)
                    ? res
                    : (res?.markups || res?.content || res?.data || []);
                setRevisions(list);
            })
            .catch(() => {
                if (!cancelled) setError(L('failedLoad'));
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => { cancelled = true; };
    }, [isOpen, markupId]);

    if (!isOpen) return null;

    // Table column definitions
    const columns = [
        {
            key: 'updateDateTime',
            label: L('colUpdateDateTime'),
            minWidth: 160,
            render: (m) => (
                <span className="text-[11px] text-[#202124] dark:text-[#e8eaed] font-mono whitespace-nowrap">
                    {formatDateTime(m.updateDateTime || m.createDateTime, currentLang)}
                </span>
            ),
        },
        {
            key: 'createdBy',
            label: L('colCreatedBy'),
            minWidth: 140,
            render: (m) => (
                <span className="text-[11px] text-[#5f6368] dark:text-[#9aa0a6]">
                    {m.createdBy || '–'}
                </span>
            ),
        },
        {
            key: 'updatedBy',
            label: L('colUpdatedBy'),
            minWidth: 140,
            render: (m) => (
                <span className="text-[11px] text-[#5f6368] dark:text-[#9aa0a6]">
                    {m.updatedBy || '–'}
                </span>
            ),
        },
        {
            key: 'name',
            label: L('colName'),
            minWidth: 130,
            render: (m) => (
                <span className="text-[11px] font-medium text-[#202124] dark:text-[#e8eaed]">
                    {m.name || '–'}
                </span>
            ),
        },
        {
            key: 'status',
            label: L('colStatus'),
            minWidth: 90,
            render: (m) => {
                if (!m.status) return <span className="text-[#9aa0a6] text-[11px] italic">–</span>;
                const isActive = m.status === 'ACTIVE';
                return (
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                        isActive
                            ? 'bg-[#e6f4ea] text-[#137333] border-[#ceead6] dark:bg-[#137333]/20 dark:text-[#81c995] dark:border-[#137333]/40'
                            : 'bg-[#f1f3f4] text-[#5f6368] border-[#dadce0] dark:bg-[#3c4043] dark:text-[#9aa0a6] dark:border-[#5f6368]/40'
                    }`}>
                        {m.status}
                    </span>
                );
            },
        },
        {
            key: 'agencies',
            label: L('colAgencies'),
            minWidth: 180,
            render: (m) => renderIdNameList(m.agencies),
        },
        {
            key: 'suppliers',
            label: L('colSuppliers'),
            minWidth: 160,
            render: (m) => renderIdNameList(m.suppliers),
        },
        {
            key: 'priority',
            label: L('colPriority'),
            minWidth: 80,
            render: (m) => (
                <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                    m.priority === 1
                        ? 'bg-[#fce8e6] text-[#c5221f] dark:bg-[#c5221f]/20 dark:text-[#f28b82]'
                        : 'bg-[#e8f0fe] text-[#1a73e8] dark:bg-[#1a73e8]/20 dark:text-[#8ab4f8]'
                }`}>
                    #{m.priority ?? '–'}
                </span>
            ),
        },
        {
            key: 'value',
            label: L('colValue'),
            minWidth: 90,
            render: renderValue,
        },
        {
            key: 'salesStartDateTime',
            label: L('colSalesStart'),
            minWidth: 140,
            render: (m) => (
                <span className="text-[11px] text-[#5f6368] dark:text-[#9aa0a6] whitespace-nowrap">
                    {formatDateTime(m.salesStartDateTime, currentLang)}
                </span>
            ),
        },
        {
            key: 'salesEndDateTime',
            label: L('colSalesEnd'),
            minWidth: 140,
            render: (m) => (
                <span className="text-[11px] text-[#5f6368] dark:text-[#9aa0a6] whitespace-nowrap">
                    {formatDateTime(m.salesEndDateTime, currentLang)}
                </span>
            ),
        },
        {
            key: 'checkinStartDate',
            label: L('colCheckinStart'),
            minWidth: 120,
            render: (m) => (
                <span className="text-[11px] text-[#5f6368] dark:text-[#9aa0a6] whitespace-nowrap">
                    {formatDate(m.checkinStartDate, currentLang)}
                </span>
            ),
        },
        {
            key: 'checkoutEndDate',
            label: L('colCheckoutEnd'),
            minWidth: 120,
            render: (m) => (
                <span className="text-[11px] text-[#5f6368] dark:text-[#9aa0a6] whitespace-nowrap">
                    {formatDate(m.checkoutEndDate, currentLang)}
                </span>
            ),
        },
        {
            key: 'nationalities',
            label: L('colNationalities'),
            minWidth: 160,
            render: (m) => renderIdNameList(m.nationalities),
        },
        {
            key: 'hotels',
            label: L('colHotels'),
            minWidth: 180,
            render: (m) => renderIdNameList(m.hotels),
        },
        {
            key: 'cancelPolicy',
            label: L('colCancelPolicy'),
            minWidth: 120,
            render: (m) => (
                <span className="text-[11px] text-[#5f6368] dark:text-[#9aa0a6]">
                    {m.cancelPolicy || '–'}
                </span>
            ),
        },
    ];

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white dark:bg-[#202124] w-full max-w-6xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col border border-[#dadce0] dark:border-[#3c4043] animate-in fade-in zoom-in-95 duration-200 overflow-hidden">

                {/* Header */}
                <div className="px-6 py-4 border-b border-[#dadce0] dark:border-[#3c4043] flex items-center justify-between shrink-0 bg-[#f8f9fa] dark:bg-[#292a2d]">
                    <div className="flex items-center gap-3">
                        <div className="size-9 rounded-full bg-[#fce8e6] dark:bg-[#c5221f]/20 text-[#c5221f] dark:text-[#f28b82] flex items-center justify-center shrink-0">
                            <span className="material-symbols-outlined text-[20px]">history</span>
                        </div>
                        <div>
                            <h2 className="text-sm font-semibold text-[#202124] dark:text-[#e8eaed] leading-none mb-0.5">
                                {L('title')}
                            </h2>
                            <p className="text-[11px] text-[#5f6368] dark:text-[#9aa0a6]">
                                {markupName
                                    ? <><span className="font-medium text-[#202124] dark:text-[#e8eaed]">{markupName}</span> — {L('subtitle')}</>
                                    : L('subtitle')
                                }
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="size-8 rounded-full flex items-center justify-center text-[#5f6368] hover:bg-[#f1f3f4] dark:hover:bg-[#3c4043] dark:text-[#9aa0a6] transition-colors"
                        title={L('close')}
                    >
                        <span className="material-symbols-outlined text-[20px]">close</span>
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-auto custom-scrollbar">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-3">
                            <span className="material-symbols-outlined text-[40px] text-[#1a73e8] animate-spin">autorenew</span>
                            <p className="text-xs text-[#5f6368] dark:text-[#9aa0a6]">{L('loading')}</p>
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-3">
                            <span className="material-symbols-outlined text-[40px] text-[#d93025]">error_outline</span>
                            <p className="text-xs text-[#d93025] font-medium">{error}</p>
                        </div>
                    ) : revisions.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-3">
                            <div className="size-14 rounded-full bg-[#f1f3f4] dark:bg-[#3c4043] flex items-center justify-center">
                                <span className="material-symbols-outlined text-[30px] text-[#5f6368] dark:text-[#9aa0a6]">manage_search</span>
                            </div>
                            <p className="text-xs text-[#5f6368] dark:text-[#9aa0a6] font-medium italic">{L('noData')}</p>
                        </div>
                    ) : (
                        <table className="w-full border-collapse">
                            <thead className="bg-[#f8f9fa] dark:bg-[#292a2d] border-b border-[#dadce0] dark:border-[#3c4043] sticky top-0 z-10">
                                <tr>
                                    <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-[#5f6368] dark:text-[#9aa0a6] uppercase tracking-wider whitespace-nowrap select-none">
                                        #
                                    </th>
                                    {columns.map((col) => (
                                        <th
                                            key={col.key}
                                            className="px-4 py-2.5 text-left text-[10px] font-semibold text-[#5f6368] dark:text-[#9aa0a6] uppercase tracking-wider whitespace-nowrap select-none"
                                            style={{ minWidth: col.minWidth }}
                                        >
                                            {col.label}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {revisions.map((rev, idx) => (
                                    <tr
                                        key={`${rev.id}-${idx}`}
                                        className="hover:bg-[#f8f9fa] dark:hover:bg-[#292a2d]/60 transition-colors border-b border-[#f1f3f4] dark:border-[#3c4043] last:border-0"
                                    >
                                        {/* Revision index badge */}
                                        <td className="px-4 py-2.5">
                                            <span className="inline-flex items-center justify-center size-6 rounded-full bg-[#e8f0fe] dark:bg-[#1a73e8]/20 text-[#1a73e8] dark:text-[#8ab4f8] text-[10px] font-bold">
                                                {idx + 1}
                                            </span>
                                        </td>
                                        {columns.map((col) => (
                                            <td key={col.key} className="px-4 py-2.5">
                                                {col.render(rev)}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Footer */}
                {!loading && !error && revisions.length > 0 && (
                    <div className="px-6 py-3 border-t border-[#dadce0] dark:border-[#3c4043] flex items-center justify-between shrink-0 bg-[#f8f9fa]/50 dark:bg-[#292a2d]/50">
                        <span className="text-[11px] text-[#5f6368] dark:text-[#9aa0a6]">
                            {revisions.length} {L('revision')}{revisions.length !== 1 ? 's' : ''}
                        </span>
                        <button
                            onClick={onClose}
                            className="h-8 px-4 rounded-full border border-[#dadce0] dark:border-[#3c4043] text-xs font-medium text-[#5f6368] dark:text-[#9aa0a6] hover:bg-[#f1f3f4] dark:hover:bg-[#3c4043] transition-colors"
                        >
                            {L('close')}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MarkupRevisionModal;
