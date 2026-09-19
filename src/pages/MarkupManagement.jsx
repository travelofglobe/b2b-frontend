import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { COMMON, getLang } from '../utils/sharedLocales';
import { markupService } from '../services/markupService';
import ConfirmModal from '../components/ConfirmModal';
import AddMarkupModal from '../components/AddMarkupModal';
import AppleSwitch from '../components/AppleSwitch';

const MK = {
  en: {
    title: 'Markup Management',
    subtitle: 'Define and manage pricing rules and profit margins for hotels and agencies',
    searchPh: 'Search rules by name, ID...',
    allRules: 'All Rules',
    active: 'Active',
    passive: 'Passive',
    newRule: 'New Rule',
    colRule: 'Markup Rule',
    colHotels: 'Associated Hotels',
    colAgencies: 'Agencies / Groups',
    colPriority: 'Priority',
    colValue: 'Markup Value',
    colStatus: 'Status',
    colActions: 'Actions',
    allHotels: 'All Hotels (Global)',
    allAgencies: 'All Agencies',
    noRules: 'No markup rules found',
    showing: 'Showing',
    to2: 'to',
    of: 'of',
    rules: 'rules',
    totalRules: 'Total Rules',
    activeRules: 'Active Rules',
    passiveRules: 'Passive Rules',
    refresh: 'Refresh',
    deleteTitle: 'Delete Markup Rule',
    yesDelete: 'Yes, Delete Rule',
    noKeep: 'No, Keep It',
    failedLoad: 'Failed to load markups',
    failedStatus: 'Failed to update status',
    failedDelete: 'Failed to delete markup',
    deleted: 'Markup rule deleted successfully',
    created: 'Markup rule created successfully',
    updated: 'Markup rule updated successfully',
    markedAs: 'Markup marked as'
  },
  tr: {
    title: 'Komisyon Yönetimi',
    subtitle: 'Oteller ve acenteler için fiyatlandırma ve komisyon kurallarını yönetin',
    searchPh: 'Kural adı veya ID ile ara...',
    allRules: 'Tüm Kurallar',
    active: 'Aktif',
    passive: 'Pasif',
    newRule: 'Yeni Kural',
    colRule: 'Komisyon Kuralı',
    colHotels: 'İlişkili Oteller',
    colAgencies: 'Acenteler',
    colPriority: 'Öncelik',
    colValue: 'Komisyon Oranı',
    colStatus: 'Durum',
    colActions: 'İşlemler',
    allHotels: 'Tüm Oteller (Global)',
    allAgencies: 'Tüm Acenteler',
    noRules: 'Tanımlı komisyon kuralı bulunamadı',
    showing: 'Gösterilen',
    to2: '-',
    of: '/',
    rules: 'kural',
    totalRules: 'Toplam Kural',
    activeRules: 'Aktif Kurallar',
    passiveRules: 'Pasif Kurallar',
    refresh: 'Yenile',
    deleteTitle: 'Komisyon Kuralını Sil',
    yesDelete: 'Evet, Sil',
    noKeep: 'Hayır, Vazgeç',
    failedLoad: 'Komisyonlar yüklenemedi',
    failedStatus: 'Durum güncellenemedi',
    failedDelete: 'Komisyon silinemedi',
    deleted: 'Komisyon kuralı başarıyla silindi',
    created: 'Komisyon kuralı oluşturuldu',
    updated: 'Komisyon kuralı güncellendi',
    markedAs: 'Komisyon işaretlendi:'
  },
  ar: {
    title: 'إدارة الهوامش',
    subtitle: 'تعريف وإدارة قواعد التسعير وهامش الربح للفنادق والوكالات',
    searchPh: 'بحث بالاسم أو المعرف...',
    allRules: 'كل القواعد',
    active: 'نشط',
    passive: 'غير نشط',
    newRule: 'قاعدة جديدة',
    colRule: 'قاعدة الهامش',
    colHotels: 'الفنادق المرتبطة',
    colAgencies: 'الوكالات',
    colPriority: 'الأولوية',
    colValue: 'قيمة الهامش',
    colStatus: 'الحالة',
    colActions: 'الإجراءات',
    allHotels: 'جميع الفنادق',
    allAgencies: 'جميع الوكالات',
    noRules: 'لا توجد قواعد هوامش',
    showing: 'عرض',
    to2: 'إلى',
    of: 'من',
    rules: 'قواعد',
    totalRules: 'إجمالي القواعد',
    activeRules: 'القواعد النشطة',
    passiveRules: 'القواعد المعطلة',
    refresh: 'تحديث',
    deleteTitle: 'حذف قاعدة الهامش',
    yesDelete: 'نعم، احذف',
    noKeep: 'إلغاء',
    failedLoad: 'فشل التحميل',
    failedStatus: 'فشل التحديث',
    failedDelete: 'فشل الحذف',
    deleted: 'تم حذف القاعدة',
    created: 'تم إنشاء القاعدة',
    updated: 'تم تحديث القاعدة',
    markedAs: 'تم تحديد الحالة كـ'
  },
  es: {
    title: 'Gestión de Márgenes',
    subtitle: 'Definir y gestionar reglas de precios y comisiones',
    searchPh: 'Buscar por nombre o ID...',
    allRules: 'Todas las Reglas',
    active: 'Activo',
    passive: 'Inactivo',
    newRule: 'Nueva Regla',
    colRule: 'Regla de Margen',
    colHotels: 'Hoteles Asociados',
    colAgencies: 'Agencias',
    colPriority: 'Prioridad',
    colValue: 'Valor Margen',
    colStatus: 'Estado',
    colActions: 'Acciones',
    allHotels: 'Todos los Hoteles',
    allAgencies: 'Todas las Agencias',
    noRules: 'No se encontraron reglas',
    showing: 'Mostrando',
    to2: 'a',
    of: 'de',
    rules: 'reglas',
    totalRules: 'Total de Reglas',
    activeRules: 'Reglas Activas',
    passiveRules: 'Reglas Inactivas',
    refresh: 'Actualizar',
    deleteTitle: 'Eliminar Regla',
    yesDelete: 'Sí, Eliminar',
    noKeep: 'Cancelar',
    failedLoad: 'Error al cargar',
    failedStatus: 'Error al actualizar',
    failedDelete: 'Error al eliminar',
    deleted: 'Regla eliminada',
    created: 'Regla creada',
    updated: 'Regla actualizada',
    markedAs: 'Margen marcado como'
  },
  ru: {
    title: 'Управление наценками',
    subtitle: 'Создание и управление правилами ценообразования',
    searchPh: 'Поиск по названию или ID...',
    allRules: 'Все правила',
    active: 'Активный',
    passive: 'Пассивный',
    newRule: 'Новое правило',
    colRule: 'Правило наценки',
    colHotels: 'Связанные отели',
    colAgencies: 'Агентства',
    colPriority: 'Приоритет',
    colValue: 'Значение наценки',
    colStatus: 'Статус',
    colActions: 'Действия',
    allHotels: 'Все отели',
    allAgencies: 'Все агентства',
    noRules: 'Правила не найдены',
    showing: 'Показано',
    to2: '-',
    of: 'из',
    rules: 'правил',
    totalRules: 'Всего правил',
    activeRules: 'Активные правила',
    passiveRules: 'Пассивные правила',
    refresh: 'Обновить',
    deleteTitle: 'Удалить правило',
    yesDelete: 'Да, удалить',
    noKeep: 'Отмена',
    failedLoad: 'Ошибка загрузки',
    failedStatus: 'Ошибка обновления',
    failedDelete: 'Ошибка удаления',
    deleted: 'Правило удалено',
    created: 'Правило создано',
    updated: 'Правило обновлено',
    markedAs: 'Статус изменен на'
  },
  fr: {
    title: 'Gestion des Marges',
    subtitle: 'Définir et gérer les règles de tarification et de commission',
    searchPh: 'Rechercher par nom, ID...',
    allRules: 'Toutes les règles',
    active: 'Actif',
    passive: 'Inactif',
    newRule: 'Nouvelle règle',
    colRule: 'Règle de marge',
    colHotels: 'Hôtels associés',
    colAgencies: 'Agences',
    colPriority: 'Priorité',
    colValue: 'Valeur de marge',
    colStatus: 'Statut',
    colActions: 'Actions',
    allHotels: 'Tous les hôtels',
    allAgencies: 'Toutes les agences',
    noRules: 'Aucune règle trouvée',
    showing: 'Affichage',
    to2: 'à',
    of: 'sur',
    rules: 'règles',
    totalRules: 'Total des règles',
    activeRules: 'Règles actives',
    passiveRules: 'Règles inactives',
    refresh: 'Actualiser',
    deleteTitle: 'Supprimer la règle',
    yesDelete: 'Oui, supprimer',
    noKeep: 'Annuler',
    failedLoad: 'Échec du chargement',
    failedStatus: 'Échec de la mise à jour',
    failedDelete: 'Échec de la suppression',
    deleted: 'Règle supprimée',
    created: 'Règle créée',
    updated: 'Règle mise à jour',
    markedAs: 'Marge marquée comme'
  },
  zh: {
    title: '加价与佣金管理',
    subtitle: '定义和管理酒店及代理商的定价规则与利润率',
    searchPh: '搜索规则名称或ID...',
    allRules: '所有规则',
    active: '活跃',
    passive: '不活跃',
    newRule: '新规则',
    colRule: '加价规则',
    colHotels: '关联酒店',
    colAgencies: '代理商',
    colPriority: '优先级',
    colValue: '加价值',
    colStatus: '状态',
    colActions: '操作',
    allHotels: '所有酒店',
    allAgencies: '所有代理商',
    noRules: '未找到加价规则',
    showing: '显示',
    to2: '至',
    of: '共',
    rules: '条规则',
    totalRules: '全部规则',
    activeRules: '启用规则',
    passiveRules: '停用规则',
    refresh: '刷新',
    deleteTitle: '删除加价规则',
    yesDelete: '是的，删除',
    noKeep: '取消',
    failedLoad: '加载失败',
    failedStatus: '状态更新失败',
    failedDelete: '删除失败',
    deleted: '规则已删除',
    created: '规则已创建',
    updated: '规则已更新',
    markedAs: '状态已标记为'
  },
  ja: {
    title: 'マークアップ管理',
    subtitle: 'ホテルや代理店の価格設定およびコミッションルールを定義・管理します',
    searchPh: 'ルール名やIDで検索...',
    allRules: 'すべてのルール',
    active: 'アクティブ',
    passive: '非アクティブ',
    newRule: '新規ルール',
    colRule: 'マークアップルール',
    colHotels: '関連ホテル',
    colAgencies: '代理店',
    colPriority: '優先度',
    colValue: 'マークアップ値',
    colStatus: 'ステータス',
    colActions: 'アクション',
    allHotels: 'すべてのホテル',
    allAgencies: 'すべての代理店',
    noRules: 'マークアップルールが見つかりません',
    showing: '表示中',
    to2: 'から',
    of: '件中',
    rules: 'ルール',
    totalRules: '総ルール数',
    activeRules: '有効ルール',
    passiveRules: '無効ルール',
    refresh: '更新',
    deleteTitle: 'ルールの削除',
    yesDelete: '削除する',
    noKeep: 'キャンセル',
    failedLoad: '読み込み失敗',
    failedStatus: '更新失敗',
    failedDelete: '削除失敗',
    deleted: 'ルールを削除しました',
    created: 'ルールを作成しました',
    updated: 'ルールを更新しました',
    markedAs: 'ステータスを変更しました:'
  },
  fa: {
    title: 'مدیریت سود و کارمزد',
    subtitle: 'تعریف و مدیریت قوانین افزایش قیمت و کارمزد',
    searchPh: 'جستجو با نام یا شناسه...',
    allRules: 'همه قوانین',
    active: 'فعال',
    passive: 'غیرفعال',
    newRule: 'قانون جدید',
    colRule: 'قانون کارمزد',
    colHotels: 'هتل‌های مرتبط',
    colAgencies: 'آژانس‌ها',
    colPriority: 'اولویت',
    colValue: 'درصد افزایش',
    colStatus: 'وضعیت',
    colActions: 'اقدامات',
    allHotels: 'همه هتل‌ها',
    allAgencies: 'همه آژانس‌ها',
    noRules: 'هیچ قانونی یافت نشد',
    showing: 'نمایش',
    to2: 'تا',
    of: 'از',
    rules: 'قوانین',
    totalRules: 'کل قوانین',
    activeRules: 'قوانین فعال',
    passiveRules: 'قوانین غیرفعال',
    refresh: 'تازه‌سازی',
    deleteTitle: 'حذف قانون',
    yesDelete: 'بله، حذف کن',
    noKeep: 'انصراف',
    failedLoad: 'خطا در بارگیری',
    failedStatus: 'خطا در به‌روزرسانی',
    failedDelete: 'خطا در حذف',
    deleted: 'قانون حذف شد',
    created: 'قانون ایجاد شد',
    updated: 'قانون به‌روز شد',
    markedAs: 'علامت‌گذاری شد:'
  },
  it: {
    title: 'Gestione Ricarichi',
    subtitle: 'Definisci e gestisci le regole di ricarico e profitto per hotel e agenzie',
    searchPh: 'Cerca per nome, ID...',
    allRules: 'Tutte le Regole',
    active: 'Attivo',
    passive: 'Inattivo',
    newRule: 'Nuova Regola',
    colRule: 'Regola di Ricarico',
    colHotels: 'Hotel Associati',
    colAgencies: 'Agenzie',
    colPriority: 'Priorità',
    colValue: 'Valore Ricarico',
    colStatus: 'Stato',
    colActions: 'Azioni',
    allHotels: 'Tutti gli Hotel',
    allAgencies: 'Tutte le Agenzie',
    noRules: 'Nessuna regola trovata',
    showing: 'Visualizzazione',
    to2: 'a',
    of: 'di',
    rules: 'regole',
    totalRules: 'Totale Regole',
    activeRules: 'Regole Attive',
    passiveRules: 'Regole Inattive',
    refresh: 'Aggiorna',
    deleteTitle: 'Elimina Regola',
    yesDelete: 'Sì, Elimina',
    noKeep: 'Annulla',
    failedLoad: 'Caricamento fallito',
    failedStatus: 'Aggiornamento fallito',
    failedDelete: 'Eliminazione fallita',
    deleted: 'Regola eliminata',
    created: 'Regola creata',
    updated: 'Regola aggiornata',
    markedAs: 'Stato impostato su'
  },
  el: {
    title: 'Διαχείριση Προσαυξήσεων',
    subtitle: 'Ορισμός και διαχείριση κανόνων τιμολόγησης και κέρδους',
    searchPh: 'Αναζήτηση με όνομα, ID...',
    allRules: 'Όλοι οι Κανόνες',
    active: 'Ενεργό',
    passive: 'Ανενεργό',
    newRule: 'Νέος Κανόνας',
    colRule: 'Κανόνας Προσαύξησης',
    colHotels: 'Συνδεδεμένα Ξενοδοχεία',
    colAgencies: 'Πρακτορεία',
    colPriority: 'Προτεραιότητα',
    colValue: 'Ποσοστό',
    colStatus: 'Κατάσταση',
    colActions: 'Ενέργειες',
    allHotels: 'Όλα τα Ξενοδοχεία',
    allAgencies: 'Όλα τα Πρακτορεία',
    noRules: 'Δεν βρέθηκαν κανόνες',
    showing: 'Εμφάνιση',
    to2: 'έως',
    of: 'από',
    rules: 'κανόνες',
    totalRules: 'Συνολικοί Κανόνες',
    activeRules: 'Ενεργοί Κανόνες',
    passiveRules: 'Ανενεργοί Κανόνες',
    refresh: 'Ανανέωση',
    deleteTitle: 'Διαγραφή Κανόνα',
    yesDelete: 'Ναι, Διαγραφή',
    noKeep: 'Ακύρωση',
    failedLoad: 'Αποτυχία φόρτωσης',
    failedStatus: 'Αποτυχία ενημέρωσης',
    failedDelete: 'Αποτυχία διαγραφής',
    deleted: 'Ο κανόνας διαγράφηκε',
    created: 'Ο κανόνας δημιουργήθηκε',
    updated: 'Ο κανόνας ενημερώθηκε',
    markedAs: 'Σημειώθηκε ως'
  },
  pt: {
    title: 'Gestão de Margens',
    subtitle: 'Definir e gerir regras de preços e comissões para hotéis e agências',
    searchPh: 'Buscar por nome, ID...',
    allRules: 'Todas as Regras',
    active: 'Ativo',
    passive: 'Inativo',
    newRule: 'Nova Regra',
    colRule: 'Regra de Margem',
    colHotels: 'Hotéis Associados',
    colAgencies: 'Agências',
    colPriority: 'Prioridade',
    colValue: 'Valor da Margem',
    colStatus: 'Status',
    colActions: 'Ações',
    allHotels: 'Todos os Hotéis',
    allAgencies: 'Todas as Agências',
    noRules: 'Nenhuma regra encontrada',
    showing: 'Mostrando',
    to2: 'a',
    of: 'de',
    rules: 'regras',
    totalRules: 'Total de Regras',
    activeRules: 'Regras Ativas',
    passiveRules: 'Regras Inativas',
    refresh: 'Atualizar',
    deleteTitle: 'Excluir Regra',
    yesDelete: 'Sim, Excluir',
    noKeep: 'Cancelar',
    failedLoad: 'Falha ao carregar',
    failedStatus: 'Falha ao atualizar',
    failedDelete: 'Falha ao excluir',
    deleted: 'Regra excluída com sucesso',
    created: 'Regra criada com sucesso',
    updated: 'Regra atualizada com sucesso',
    markedAs: 'Status alterado para'
  }
};

const tMK = (lang, key) => {
    const l = getLang(lang);
    return MK[l]?.[key] ?? MK.en[key] ?? COMMON[l]?.[key] ?? COMMON.en[key] ?? key;
};

// Skeleton loading row component matching MyOffice
const TableSkeleton = ({ columns = 6, rows = 5 }) => (
    <>
        {[...Array(rows)].map((_, i) => (
            <tr key={`skel-row-${i}`} className="animate-pulse border-b border-[#f1f3f4] dark:border-[#3c4043]">
                {[...Array(columns)].map((_, j) => (
                    <td key={`skel-col-${j}`} className="px-4 py-3.5">
                        {j === 0 ? (
                            <div className="flex items-center gap-3">
                                <div className="size-9 rounded-full bg-slate-200 dark:bg-slate-800 shrink-0"></div>
                                <div className="space-y-1.5 flex-1">
                                    <div className="h-3.5 bg-slate-200 dark:bg-slate-800 rounded-md w-32"></div>
                                    <div className="h-2.5 bg-slate-200/70 dark:bg-slate-800/70 rounded-md w-20"></div>
                                </div>
                            </div>
                        ) : j === columns - 2 ? (
                            <div className="flex items-center gap-2">
                                <div className="h-5 w-9 rounded-full bg-slate-200 dark:bg-slate-800 shrink-0"></div>
                                <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded-md w-10"></div>
                            </div>
                        ) : j === columns - 1 ? (
                            <div className="flex items-center justify-end gap-1">
                                <div className="size-8 rounded-full bg-slate-200/80 dark:bg-slate-800/80"></div>
                                <div className="size-8 rounded-full bg-slate-200/80 dark:bg-slate-800/80"></div>
                            </div>
                        ) : (
                            <div className="h-3.5 bg-slate-200/80 dark:bg-slate-800/80 rounded-md w-20"></div>
                        )}
                    </td>
                ))}
            </tr>
        ))}
    </>
);

const MarkupManagement = () => {
    const { i18n } = useTranslation();
    const [currentLang, setCurrentLang] = useState(() => (i18n.language || localStorage.getItem('i18nextLng') || 'en').split('-')[0].toLowerCase());

    useEffect(() => {
        setCurrentLang((i18n.language || 'en').split('-')[0].toLowerCase());
        const handler = (lng) => setCurrentLang((lng || 'en').split('-')[0].toLowerCase());
        i18n.on('languageChanged', handler);
        return () => i18n.off('languageChanged', handler);
    }, [i18n]);

    const L = useCallback((key) => tMK(currentLang, key), [currentLang]);

    const [loading, setLoading] = useState(false);
    const [markups, setMarkups] = useState([]);
    const [totalItems, setTotalItems] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    const [filters, setFilters] = useState({
        query: '',
        status: 'ACTIVE',
        agencyIds: [],
        page: 0,
        size: 10
    });

    const [deleteModal, setDeleteModal] = useState({ show: false, id: null, name: '', isDeleting: false });
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editMarkup, setEditMarkup] = useState(null);
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

    const showNotification = useCallback((message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 4000);
    }, []);

    const fetchMarkups = useCallback(async (signal) => {
        setLoading(true);
        try {
            const params = {
                page: filters.page,
                size: filters.size,
                query: filters.query || undefined,
                status: filters.status || undefined,
                agencyIds: filters.agencyIds?.length > 0 ? filters.agencyIds : undefined
            };
            const response = await markupService.filterMarkups(params, signal);

            const markupsList = Array.isArray(response)
                ? response
                : (response?.markups || response?.content || response?.data || []);

            // Filter: Only show markups without agencies (global markups)
            const globalMarkups = markupsList.filter(m => !m.agencies || m.agencies.length === 0);
            setMarkups(globalMarkups);
            setTotalItems(response?.numberOfItems ?? globalMarkups.length);
            setTotalPages(response?.numberOfPages ?? Math.max(1, Math.ceil((response?.numberOfItems ?? globalMarkups.length) / (filters.size || 10))));
        } catch (error) {
            if (error?.name === 'AbortError') return;
            console.error("Error fetching markups:", error);
            showNotification(L('failedLoad'), "error");
        } finally {
            setLoading(false);
        }
    }, [filters, L, showNotification]);

    useEffect(() => {
        const controller = new AbortController();
        fetchMarkups(controller.signal);
        return () => controller.abort();
    }, [fetchMarkups]);

    const handleFilterChange = (field, value) => {
        setFilters(prev => ({ ...prev, [field]: value, page: 0 }));
    };

    const handlePageChange = (newPage) => {
        setFilters(prev => ({ ...prev, page: newPage }));
    };

    const handleToggleStatus = async (markup) => {
        const newStatus = markup.status === 'ACTIVE' ? 'PASSIVE' : 'ACTIVE';

        const payload = {
            name: markup.name,
            agencyIds: markup.agencies?.map(a => a.id) || [],
            feedIds: markup.feeds?.map(f => f.id) || [],
            supplierIds: markup.suppliers?.map(s => s.id) || [],
            priority: markup.priority,
            value: markup.value,
            nationalityIds: markup.nationalities?.map(n => n.locationId || n.id) || [],
            salesStartDateTime: markup.salesStartDateTime ? (markup.salesStartDateTime.includes('T') ? markup.salesStartDateTime : `${markup.salesStartDateTime}T00:00:00.00`) : null,
            salesEndDateTime: markup.salesEndDateTime ? (markup.salesEndDateTime.includes('T') ? markup.salesEndDateTime : `${markup.salesEndDateTime}T00:00:00.00`) : null,
            checkinStartDate: markup.checkinStartDate,
            checkoutEndDate: markup.checkoutEndDate,
            hotelIds: markup.hotels?.map(h => h.hotelId || h.id) || [],
            locationIds: markup.locationIds || [],
            status: newStatus
        };

        try {
            await markupService.updateMarkup(markup.id, payload);
            showNotification(`${L('markedAs')} ${newStatus}`);
            fetchMarkups();
        } catch (error) {
            console.error("Status update error:", error);
            showNotification(L('failedStatus'), "error");
        }
    };

    const handleEditMarkup = (markup) => {
        setEditMarkup(markup);
        setIsAddModalOpen(true);
    };

    const handleDeleteMarkup = (markup) => {
        setDeleteModal({ show: true, id: markup.id, name: markup.name, isDeleting: false });
    };

    const confirmDelete = async () => {
        try {
            setDeleteModal(prev => ({ ...prev, isDeleting: true }));
            await markupService.deleteMarkup(deleteModal.id);
            showNotification(L('deleted'));
            fetchMarkups();
            setDeleteModal({ show: false, id: null, name: '', isDeleting: false });
        } catch (error) {
            console.error("Delete error:", error);
            showNotification(L('failedDelete'), "error");
            setDeleteModal(prev => ({ ...prev, isDeleting: false }));
        }
    };

    // Calculate quick counts
    const summaryStats = useMemo(() => {
        const activeCount = markups.filter(m => m.status === 'ACTIVE').length;
        const passiveCount = markups.filter(m => m.status === 'PASSIVE').length;
        return {
            total: totalItems || markups.length,
            active: filters.status === 'PASSIVE' ? 0 : (filters.status === 'ACTIVE' ? (totalItems || markups.length) : activeCount),
            passive: filters.status === 'ACTIVE' ? 0 : (filters.status === 'PASSIVE' ? (totalItems || markups.length) : passiveCount)
        };
    }, [markups, totalItems, filters.status]);

    return (
        <div className="flex-1 flex flex-col px-4 sm:px-8 py-6 min-h-0 bg-[#f8f9fa] dark:bg-[#202124] w-full">
            <div className="max-w-7xl mx-auto w-full flex flex-col h-full min-h-0 space-y-4">
                {/* Header - Google Workspace Material Style */}
                <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#e8f0fe] dark:bg-[#1a73e8]/20 flex items-center justify-center text-[#1a73e8] dark:text-[#8ab4f8] shrink-0">
                            <span className="material-symbols-outlined text-[24px]">trending_up</span>
                        </div>
                        <div>
                            <h1 className="text-xl font-medium text-[#202124] dark:text-[#e8eaed] tracking-tight">{L('title')}</h1>
                            <p className="text-xs text-[#5f6368] dark:text-[#9aa0a6]">{L('subtitle')}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => {
                                setEditMarkup(null);
                                setIsAddModalOpen(true);
                            }}
                            className="h-10 px-5 bg-[#1a73e8] hover:bg-[#1765cc] text-white rounded-full text-xs font-medium flex items-center gap-1.5 shadow-none hover:shadow-xs active:scale-95 transition-all cursor-pointer"
                        >
                            <span className="material-symbols-outlined text-[18px]">add</span>
                            <span>{L('newRule')}</span>
                        </button>
                    </div>
                </header>

                {/* Summary Metric Cards matching MyOffice */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 shrink-0">
                    <div className="bg-white dark:bg-[#303134] p-4 rounded-2xl border border-[#dadce0] dark:border-[#3c4043] shadow-xs">
                        <div className="flex justify-between items-start mb-2">
                            <span className="text-[11px] font-medium text-[#5f6368] dark:text-[#9aa0a6] uppercase tracking-wider">{L('totalRules')}</span>
                            <div className="size-8 bg-[#e8f0fe] dark:bg-[#1a73e8]/20 rounded-full flex items-center justify-center text-[#1a73e8] dark:text-[#8ab4f8]">
                                <span className="material-symbols-outlined text-[18px]">trending_up</span>
                            </div>
                        </div>
                        <div className="flex items-end gap-2">
                            <div className="text-2xl font-normal text-[#202124] dark:text-white leading-none">
                                {loading && markups.length === 0 ? '...' : summaryStats.total}
                            </div>
                            <div className="text-[10px] font-medium text-[#5f6368] dark:text-[#9aa0a6] mb-0.5">RULES</div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-[#303134] p-4 rounded-2xl border border-[#dadce0] dark:border-[#3c4043] shadow-xs">
                        <div className="flex justify-between items-start mb-2">
                            <span className="text-[11px] font-medium text-[#137333] dark:text-[#81c995] uppercase tracking-wider">{L('activeRules')}</span>
                            <div className="size-8 bg-[#e6f4ea] dark:bg-[#137333]/20 rounded-full flex items-center justify-center text-[#137333] dark:text-[#81c995]">
                                <span className="material-symbols-outlined text-[18px]">check_circle</span>
                            </div>
                        </div>
                        <div className="flex items-end gap-2">
                            <div className="text-2xl font-normal text-[#202124] dark:text-white leading-none">
                                {loading && markups.length === 0 ? '...' : summaryStats.active}
                            </div>
                            <div className="text-[10px] font-medium text-[#137333] dark:text-[#81c995] mb-0.5">ACTIVE</div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-[#303134] p-4 rounded-2xl border border-[#dadce0] dark:border-[#3c4043] shadow-xs">
                        <div className="flex justify-between items-start mb-2">
                            <span className="text-[11px] font-medium text-[#c5221f] dark:text-[#f28b82] uppercase tracking-wider">{L('passiveRules')}</span>
                            <div className="size-8 bg-[#fce8e6] dark:bg-[#c5221f]/20 rounded-full flex items-center justify-center text-[#c5221f] dark:text-[#f28b82]">
                                <span className="material-symbols-outlined text-[18px]">pause_circle</span>
                            </div>
                        </div>
                        <div className="flex items-end gap-2">
                            <div className="text-2xl font-normal text-[#202124] dark:text-white leading-none">
                                {loading && markups.length === 0 ? '...' : summaryStats.passive}
                            </div>
                            <div className="text-[10px] font-medium text-[#c5221f] dark:text-[#f28b82] mb-0.5">DISABLED</div>
                        </div>
                    </div>
                </div>

                {/* Main Table Card matching MyOffice */}
                <div className="flex-1 flex flex-col bg-white dark:bg-[#303134] rounded-2xl border border-[#dadce0] dark:border-[#3c4043] overflow-hidden shadow-xs min-h-0">
                    {/* Toolbar */}
                    <div className="p-3.5 sm:p-4 border-b border-[#dadce0] dark:border-[#3c4043] flex flex-wrap items-center justify-between gap-3 shrink-0">
                        <div className="flex items-center gap-2.5 flex-1 max-w-xl">
                            <div className="relative flex-1">
                                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5f6368] dark:text-[#9aa0a6] text-[18px]">search</span>
                                <input
                                    type="text"
                                    placeholder={L('searchPh')}
                                    value={filters.query}
                                    onChange={(e) => handleFilterChange('query', e.target.value)}
                                    className="w-full h-10 bg-[#f1f3f4] dark:bg-[#202124] border border-transparent focus:border-[#1a73e8] focus:bg-white dark:focus:bg-[#303134] rounded-full pl-10 pr-4 text-xs font-normal text-[#202124] dark:text-[#e8eaed] outline-none transition-all placeholder-[#5f6368] dark:placeholder-[#9aa0a6]"
                                />
                            </div>
                            <select
                                value={filters.status}
                                onChange={(e) => handleFilterChange('status', e.target.value)}
                                className="h-10 px-3.5 bg-[#f8f9fa] dark:bg-[#202124] border border-[#dadce0] dark:border-[#3c4043] rounded-full text-xs font-normal text-[#3c4043] dark:text-[#bdc1c6] focus:border-[#1a73e8] outline-none cursor-pointer"
                            >
                                <option value="">{L('allRules')}</option>
                                <option value="ACTIVE">{L('active')}</option>
                                <option value="PASSIVE">{L('passive')}</option>
                            </select>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => fetchMarkups()}
                                disabled={loading}
                                className="size-10 rounded-full border border-[#dadce0] dark:border-[#3c4043] hover:bg-[#f1f3f4] dark:hover:bg-[#3c4043] flex items-center justify-center text-[#5f6368] dark:text-[#9aa0a6] transition-all cursor-pointer disabled:opacity-50"
                                title={L('refresh')}
                            >
                                <span className={`material-symbols-outlined text-[18px] ${loading ? 'animate-spin' : ''}`}>refresh</span>
                            </button>
                        </div>
                    </div>

                    {/* Table View */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        <table className="w-full border-collapse">
                            <thead className="bg-[#f8f9fa] dark:bg-[#202124] border-b border-[#dadce0] dark:border-[#3c4043] sticky top-0 z-10">
                                <tr>
                                    <th className="px-4 py-3 text-left text-[11px] font-medium text-[#5f6368] dark:text-[#9aa0a6] uppercase tracking-wider whitespace-nowrap select-none">{L('colRule')}</th>
                                    <th className="px-4 py-3 text-left text-[11px] font-medium text-[#5f6368] dark:text-[#9aa0a6] uppercase tracking-wider whitespace-nowrap select-none">{L('colHotels')}</th>
                                    <th className="px-4 py-3 text-center text-[11px] font-medium text-[#5f6368] dark:text-[#9aa0a6] uppercase tracking-wider whitespace-nowrap select-none w-24">{L('colPriority')}</th>
                                    <th className="px-4 py-3 text-center text-[11px] font-medium text-[#5f6368] dark:text-[#9aa0a6] uppercase tracking-wider whitespace-nowrap select-none w-28">{L('colValue')}</th>
                                    <th className="px-4 py-3 text-left text-[11px] font-medium text-[#5f6368] dark:text-[#9aa0a6] uppercase tracking-wider whitespace-nowrap select-none w-32">{L('colStatus')}</th>
                                    <th className="px-4 py-3 text-right text-[11px] font-medium text-[#5f6368] dark:text-[#9aa0a6] uppercase tracking-wider whitespace-nowrap select-none w-24">{L('colActions')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading && markups.length === 0 ? (
                                    <TableSkeleton columns={6} rows={6} />
                                ) : markups.length > 0 ? (
                                    markups.map((m) => (
                                        <tr
                                            key={m.id}
                                            className="hover:bg-[#f8f9fa] dark:hover:bg-[#202124]/50 transition-colors border-b border-[#f1f3f4] dark:border-[#3c4043] text-xs"
                                        >
                                            {/* Markup Rule */}
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="size-9 rounded-full bg-[#e8f0fe] dark:bg-[#1a73e8]/20 text-[#1a73e8] dark:text-[#8ab4f8] font-medium text-xs flex items-center justify-center shrink-0">
                                                        <span className="material-symbols-outlined text-[18px]">trending_up</span>
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-[#202124] dark:text-[#e8eaed] leading-tight mb-0.5">{m.name}</p>
                                                        <p className="text-[10px] text-[#5f6368] dark:text-[#9aa0a6] font-mono">
                                                            ID: #{m.id} {m.updatedBy || m.createdBy ? `• By: ${m.updatedBy || m.createdBy}` : ''}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Associated Hotels */}
                                            <td className="px-4 py-3">
                                                <div className="flex flex-wrap gap-1 items-center">
                                                    {m.hotels && m.hotels.length > 0 ? (
                                                        <>
                                                            {m.hotels.slice(0, 2).map((h, idx) => (
                                                                <span
                                                                    key={h.id || idx}
                                                                    className="px-2.5 py-0.5 bg-[#e8f0fe] dark:bg-[#1a73e8]/20 text-[#1a73e8] dark:text-[#8ab4f8] text-[11px] font-medium rounded-full truncate max-w-[160px]"
                                                                    title={h.name}
                                                                >
                                                                    {h.name}
                                                                </span>
                                                            ))}
                                                            {m.hotels.length > 2 && (
                                                                <span className="px-2 py-0.5 bg-[#f1f3f4] dark:bg-[#3c4043] text-[#5f6368] dark:text-[#bdc1c6] text-[11px] font-medium rounded-full">
                                                                    +{m.hotels.length - 2}
                                                                </span>
                                                            )}
                                                        </>
                                                    ) : (
                                                        <span className="text-[#5f6368] dark:text-[#9aa0a6] text-[11px] italic">{L('allHotels')}</span>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Priority */}
                                            <td className="px-4 py-3 text-center">
                                                <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-medium ${
                                                    m.priority === 1
                                                        ? 'bg-[#fce8e6] text-[#c5221f] dark:bg-[#c5221f]/20 dark:text-[#f28b82]'
                                                        : 'bg-[#e8f0fe] text-[#1a73e8] dark:bg-[#1a73e8]/20 dark:text-[#8ab4f8]'
                                                }`}>
                                                    #{m.priority}
                                                </span>
                                            </td>

                                            {/* Markup Value */}
                                            <td className="px-4 py-3 text-center">
                                                <span className="font-semibold text-[#137333] dark:text-[#81c995] text-xs bg-[#e6f4ea] dark:bg-[#137333]/20 px-2.5 py-0.5 rounded-full">
                                                    +{m.value}%
                                                </span>
                                            </td>

                                            {/* Status with AppleSwitch */}
                                            <td className="px-4 py-3">
                                                <div className="flex items-center">
                                                    <AppleSwitch
                                                        checked={m.status === 'ACTIVE'}
                                                        onChange={() => handleToggleStatus(m)}
                                                        size="sm"
                                                    />
                                                </div>
                                            </td>

                                            {/* Actions */}
                                            <td className="px-4 py-3 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <button
                                                        onClick={() => handleEditMarkup(m)}
                                                        className="size-8 rounded-full flex items-center justify-center text-[#5f6368] hover:bg-[#f1f3f4] dark:text-[#9aa0a6] dark:hover:bg-[#202124] transition-colors cursor-pointer"
                                                        title="Edit"
                                                    >
                                                        <span className="material-symbols-outlined text-[18px]">edit</span>
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteMarkup(m)}
                                                        className="size-8 rounded-full flex items-center justify-center text-[#5f6368] hover:bg-[#fce8e6] hover:text-[#d93025] dark:hover:bg-[#c5221f]/20 transition-colors cursor-pointer"
                                                        title="Delete"
                                                    >
                                                        <span className="material-symbols-outlined text-[18px]">delete</span>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="6" className="px-4 py-16 text-center">
                                            <div className="flex flex-col items-center gap-2">
                                                <div className="size-12 rounded-full bg-[#f1f3f4] dark:bg-[#202124] flex items-center justify-center text-[#5f6368] dark:text-[#9aa0a6]">
                                                    <span className="material-symbols-outlined text-[26px]">trending_up</span>
                                                </div>
                                                <p className="text-[#5f6368] dark:text-[#9aa0a6] text-xs font-medium italic">{L('noRules')}</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Footer Pagination */}
                    {totalItems > 0 && (
                        <div className="px-4 py-3 border-t border-[#dadce0] dark:border-[#3c4043] flex flex-wrap items-center justify-between gap-3 shrink-0 bg-[#f8f9fa]/50 dark:bg-[#202124]/30">
                            <span className="text-xs font-normal text-[#5f6368] dark:text-[#9aa0a6]">
                                {L('showing')} {totalItems > 0 ? filters.page * filters.size + 1 : 0} {L('to2')} {Math.min((filters.page + 1) * filters.size, totalItems)} {L('of')} {totalItems} {L('rules')}
                            </span>
                            <div className="flex items-center gap-1.5">
                                <button
                                    disabled={filters.page === 0}
                                    onClick={() => handlePageChange(filters.page - 1)}
                                    className="size-8 rounded-full border border-[#dadce0] dark:border-[#3c4043] flex items-center justify-center text-[#5f6368] dark:text-[#9aa0a6] disabled:opacity-30 hover:bg-[#f1f3f4] dark:hover:bg-[#3c4043] transition-all cursor-pointer"
                                >
                                    <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                                </button>
                                <div className="flex items-center gap-1">
                                    {[...Array(Math.min(5, totalPages))].map((_, i) => {
                                        let pageNum = i;
                                        if (totalPages > 5 && filters.page > 2) {
                                            pageNum = Math.min(filters.page - 2 + i, totalPages - 5 + i);
                                        }
                                        return (
                                            <button
                                                key={pageNum}
                                                onClick={() => handlePageChange(pageNum)}
                                                className={`size-8 rounded-full text-xs font-medium transition-all cursor-pointer ${
                                                    filters.page === pageNum
                                                        ? 'bg-[#1a73e8] text-white shadow-xs'
                                                        : 'text-[#5f6368] dark:text-[#9aa0a6] hover:bg-[#f1f3f4] dark:hover:bg-[#3c4043]'
                                                }`}
                                            >
                                                {pageNum + 1}
                                            </button>
                                        );
                                    })}
                                </div>
                                <button
                                    disabled={filters.page >= totalPages - 1 || totalPages === 0}
                                    onClick={() => handlePageChange(filters.page + 1)}
                                    className="size-8 rounded-full border border-[#dadce0] dark:border-[#3c4043] flex items-center justify-center text-[#5f6368] dark:text-[#9aa0a6] disabled:opacity-30 hover:bg-[#f1f3f4] dark:hover:bg-[#3c4043] transition-all cursor-pointer"
                                >
                                    <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Notification Toast */}
            {toast.show && (
                <div className={`fixed bottom-8 right-8 z-[50000] flex items-center gap-3 px-5 py-3 rounded-2xl shadow-xl animate-in slide-in-from-right-10 duration-300 ${
                    toast.type === 'error' ? 'bg-[#d93025] text-white' : 'bg-[#202124] text-white dark:bg-white dark:text-[#202124]'
                }`}>
                    <span className="material-symbols-outlined text-[20px]">{toast.type === 'error' ? 'error' : 'check_circle'}</span>
                    <p className="text-xs font-medium">{toast.message}</p>
                </div>
            )}

            {/* Delete Modal */}
            <ConfirmModal
                isOpen={deleteModal.show}
                onClose={() => setDeleteModal({ ...deleteModal, show: false })}
                onConfirm={confirmDelete}
                isLoading={deleteModal.isDeleting}
                title={L('deleteTitle')}
                message={<span>Are you sure you want to delete <b>{deleteModal.name}</b>?</span>}
                confirmText={L('yesDelete')}
                cancelText={L('noKeep')}
                type="danger"
            />

            {/* Add / Edit Markup Modal */}
            <AddMarkupModal
                isOpen={isAddModalOpen}
                editData={editMarkup}
                hideAgencySelect={true}
                onClose={() => {
                    setIsAddModalOpen(false);
                    setEditMarkup(null);
                }}
                onSuccess={() => {
                    showNotification(editMarkup ? L('updated') : L('created'));
                    fetchMarkups();
                }}
            />
        </div>
    );
};

export default MarkupManagement;
