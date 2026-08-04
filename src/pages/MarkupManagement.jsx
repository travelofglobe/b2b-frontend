import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { COMMON, getLang } from '../utils/sharedLocales';
import { markupService } from '../services/markupService';
import AgencyMultiSelect from '../components/AgencyMultiSelect';
import ConfirmModal from '../components/ConfirmModal';
import AddMarkupModal from '../components/AddMarkupModal';
import HeaderActions from '../components/HeaderActions';
import AppleSwitch from '../components/AppleSwitch';

const MK = {
  en: { title: 'Markup Management', subtitle: 'Define and manage pricing rules for hotels and agencies', searchPh: 'Rule name, ID...', allRules: 'All Rules', active: 'Active', passive: 'Passive', newRule: 'New Rule', colRule: 'Markup Rule', colHotels: 'Associated Hotels', colAgencies: 'Agencies / Groups', colPriority: 'Priority', colValue: 'Value', colStatus: 'Status', colActions: 'Actions', allHotels: 'All Hotels', allAgencies: 'All Agencies', noRules: 'No markup rules found', showing: 'Showing', to2: 'to', of: 'of', rules: 'rules', deleteTitle: 'Delete Markup', yesDelete: 'Yes, Delete Rule', noKeep: 'No, Keep It', failedLoad: 'Failed to load markups', failedStatus: 'Failed to update status', failedDelete: 'Failed to delete markup', deleted: 'Markup rule deleted', created: 'Markup rule created', updated: 'Markup rule updated', markedAs: 'Markup marked as' },
  tr: { title: 'Markup Yonetimi', subtitle: 'Oteller ve acenteler icin fiyatlandirma kurallarini tanimla', searchPh: 'Kural adi, ID...', allRules: 'Tum Kurallar', active: 'Aktif', passive: 'Pasif', newRule: 'Yeni Kural', colRule: 'Markup Kurali', colHotels: 'Iliskili Oteller', colAgencies: 'Acenteler', colPriority: 'Oncelik', colValue: 'Deger', colStatus: 'Durum', colActions: 'Islemler', allHotels: 'Tum Oteller', allAgencies: 'Tum Acenteler', noRules: 'Markup kurali bulunamadi', showing: 'Gosterilen', to2: '-', of: '/', rules: 'kural', deleteTitle: 'Markup Sil', yesDelete: 'Evet, Sil', noKeep: 'Hayir', failedLoad: 'Markuplar yuklenemedi', failedStatus: 'Durum guncellenemedi', failedDelete: 'Markup silinemedi', deleted: 'Markup silindi', created: 'Markup olusturuldu', updated: 'Markup guncellendi', markedAs: 'Markup isaretlendi:' },
  ar: { title: 'ادارة الترميز', subtitle: 'تعريف قواعد التسعير للفنادق والوكالات', searchPh: 'اسم القاعدة، ID...', allRules: 'كل القواعد', active: 'نشط', passive: 'غير نشط', newRule: 'قاعدة جديدة', colRule: 'قاعدة الترميز', colHotels: 'الفنادق المرتبطة', colAgencies: 'الوكالات', colPriority: 'الاولوية', colValue: 'القيمة', colStatus: 'الحالة', colActions: 'الاجراءات', allHotels: 'جميع الفنادق', allAgencies: 'جميع الوكالات', noRules: 'لا توجد قواعد ترميز', showing: 'عرض', to2: 'الى', of: 'من', rules: 'قواعد', deleteTitle: 'حذف الترميز', yesDelete: 'نعم، احذف', noKeep: 'لا، احتفظ', failedLoad: 'فشل التحميل', failedStatus: 'فشل التحديث', failedDelete: 'فشل الحذف', deleted: 'تم حذف القاعدة', created: 'تم انشاء القاعدة', updated: 'تم تحديث القاعدة', markedAs: 'تم تحديد الترميز كـ' },
  es: { title: 'Gestion de Markup', subtitle: 'Definir y gestionar reglas de precios', searchPh: 'Nombre de regla, ID...', allRules: 'Todas las Reglas', active: 'Activo', passive: 'Inactivo', newRule: 'Nueva Regla', colRule: 'Regla de Markup', colHotels: 'Hoteles Asociados', colAgencies: 'Agencias', colPriority: 'Prioridad', colValue: 'Valor', colStatus: 'Estado', colActions: 'Acciones', allHotels: 'Todos los Hoteles', allAgencies: 'Todas las Agencias', noRules: 'No se encontraron reglas', showing: 'Mostrando', to2: 'a', of: 'de', rules: 'reglas', deleteTitle: 'Eliminar Markup', yesDelete: 'Si, Eliminar', noKeep: 'No, Conservar', failedLoad: 'Error al cargar', failedStatus: 'Error al actualizar', failedDelete: 'Error al eliminar', deleted: 'Regla eliminada', created: 'Regla creada', updated: 'Regla actualizada', markedAs: 'Markup marcado como' },
  ru: { title: 'Upravlenie nakidkoy', subtitle: 'Sozdanie pravil cenoobrazovaniya', searchPh: 'Nazvanie pravila, ID...', allRules: 'Vse pravila', active: 'Aktivnyy', passive: 'Passivnyy', newRule: 'Novoe pravilo', colRule: 'Pravilo nakidki', colHotels: 'Svyazannye oteli', colAgencies: 'Agentstva', colPriority: 'Prioritet', colValue: 'Znachenie', colStatus: 'Status', colActions: 'Deystviya', allHotels: 'Vse oteli', allAgencies: 'Vse agentstva', noRules: 'Pravila ne naydeny', showing: 'Pokazano', to2: '-', of: 'iz', rules: 'pravil', deleteTitle: 'Udalit nakidku', yesDelete: 'Da, udalit', noKeep: 'Net, ostavit', failedLoad: 'Oshibka zagruzki', failedStatus: 'Oshibka obnovleniya', failedDelete: 'Oshibka udaleniya', deleted: 'Pravilo udaleno', created: 'Pravilo sozdano', updated: 'Pravilo obnovleno', markedAs: 'Nakidka pomechena kak' },
  fr: { title: 'Gestion des Majorations', subtitle: 'Definir et gerer les regles de tarification', searchPh: 'Nom de la regle, ID...', allRules: 'Toutes les regles', active: 'Actif', passive: 'Inactif', newRule: 'Nouvelle regle', colRule: 'Regle de majoration', colHotels: 'Hotels associes', colAgencies: 'Agences', colPriority: 'Priorite', colValue: 'Valeur', colStatus: 'Statut', colActions: 'Actions', allHotels: 'Tous les hotels', allAgencies: 'Toutes les agences', noRules: 'Aucune regle trouvee', showing: 'Affichage', to2: 'a', of: 'sur', rules: 'regles', deleteTitle: 'Supprimer la majoration', yesDelete: 'Oui, supprimer', noKeep: 'Non, conserver', failedLoad: 'Echec du chargement', failedStatus: 'Echec de la mise a jour', failedDelete: 'Echec de la suppression', deleted: 'Regle supprimee', created: 'Regle creee', updated: 'Regle mise a jour', markedAs: 'Majoration marquee comme' },
  zh: { title: '加价管理', subtitle: '定义和管理酒店和代理商的定价规则', searchPh: '规则名称，ID...', allRules: '所有规则', active: '活跃', passive: '不活跃', newRule: '新规则', colRule: '加价规则', colHotels: '关联酒店', colAgencies: '代理商', colPriority: '优先级', colValue: '值', colStatus: '状态', colActions: '操作', allHotels: '所有酒店', allAgencies: '所有代理商', noRules: '未找到加价规则', showing: '显示', to2: '至', of: '共', rules: '条规则', deleteTitle: '删除加价', yesDelete: '是的，删除规则', noKeep: '不，保留', failedLoad: '加载加价失败', failedStatus: '更新状态失败', failedDelete: '删除加价失败', deleted: '加价规则已删除', created: '加价规则已创建', updated: '加价规则已更新', markedAs: '加价标记为' },
  ja: { title: 'マークアップ管理', subtitle: 'ホテルや代理店の価格設定ルールを定義および管理します', searchPh: 'ルール名、ID...', allRules: 'すべてのルール', active: 'アクティブ', passive: '非アクティブ', newRule: '新しいルール', colRule: 'マークアップルール', colHotels: '関連ホテル', colAgencies: '代理店', colPriority: '優先度', colValue: '値', colStatus: 'ステータス', colActions: 'アクション', allHotels: 'すべてのホテル', allAgencies: 'すべての代理店', noRules: 'マークアップルールが見つかりません', showing: '表示中', to2: 'から', of: '件中', rules: 'ルール', deleteTitle: 'マークアップの削除', yesDelete: 'はい、削除します', noKeep: 'いいえ、保持します', failedLoad: '読み込みに失敗しました', failedStatus: 'ステータスの更新に失敗しました', failedDelete: '削除に失敗しました', deleted: 'ルールが削除されました', created: 'ルールが作成されました', updated: 'ルールが更新されました', markedAs: '次のようにマークされました' },
  fa: { title: 'مدیریت افزایش قیمت', subtitle: 'تعریف و مدیریت قوانین قیمت‌گذاری', searchPh: 'نام قانون، شناسه...', allRules: 'همه قوانین', active: 'فعال', passive: 'غیرفعال', newRule: 'قانون جدید', colRule: 'قانون افزایش', colHotels: 'هتل‌های مرتبط', colAgencies: 'آژانس‌ها', colPriority: 'اولویت', colValue: 'مقدار', colStatus: 'وضعیت', colActions: 'اقدامات', allHotels: 'همه هتل‌ها', allAgencies: 'همه آژانس‌ها', noRules: 'هیچ قانونی یافت نشد', showing: 'نمایش', to2: 'تا', of: 'از', rules: 'قوانین', deleteTitle: 'حذف افزایش قیمت', yesDelete: 'بله، حذف کن', noKeep: 'خیر، نگه دار', failedLoad: 'بارگیری انجام نشد', failedStatus: 'به‌روزرسانی وضعیت انجام نشد', failedDelete: 'حذف انجام نشد', deleted: 'قانون حذف شد', created: 'قانون ایجاد شد', updated: 'قانون به‌روز شد', markedAs: 'علامت‌گذاری شد به عنوان' },
  it: { title: 'Gestione Ricarichi', subtitle: 'Definisci e gestisci le regole di prezzo per hotel e agenzie', searchPh: 'Nome regola, ID...', allRules: 'Tutte le Regole', active: 'Attivo', passive: 'Inattivo', newRule: 'Nuova Regola', colRule: 'Regola di Ricarico', colHotels: 'Hotel Associati', colAgencies: 'Agenzie', colPriority: 'Priorità', colValue: 'Valore', colStatus: 'Stato', colActions: 'Azioni', allHotels: 'Tutti gli Hotel', allAgencies: 'Tutte le Agenzie', noRules: 'Nessuna regola trovata', showing: 'In visualizzazione', to2: 'a', of: 'di', rules: 'regole', deleteTitle: 'Elimina Ricarico', yesDelete: 'Sì, Elimina Regola', noKeep: 'No, Mantieni', failedLoad: 'Caricamento fallito', failedStatus: 'Aggiornamento stato fallito', failedDelete: 'Eliminazione fallita', deleted: 'Regola eliminata', created: 'Regola creata', updated: 'Regola aggiornata', markedAs: 'Contrassegnato come' },
  el: { title: 'Διαχείριση Προσαυξήσεων', subtitle: 'Ορισμός και διαχείριση κανόνων τιμολόγησης', searchPh: 'Όνομα κανόνα, ID...', allRules: 'Όλοι οι Κανόνες', active: 'Ενεργό', passive: 'Ανενεργό', newRule: 'Νέος Κανόνας', colRule: 'Κανόνας Προσαύξησης', colHotels: 'Συνδεδεμένα Ξενοδοχεία', colAgencies: 'Πρακτορεία', colPriority: 'Προτεραιότητα', colValue: 'Αξία', colStatus: 'Κατάσταση', colActions: 'Ενέργειες', allHotels: 'Όλα τα Ξενοδοχεία', allAgencies: 'Όλα τα Πρακτορεία', noRules: 'Δεν βρέθηκαν κανόνες', showing: 'Εμφάνιση', to2: 'έως', of: 'από', rules: 'κανόνες', deleteTitle: 'Διαγραφή', yesDelete: 'Ναι, Διαγραφή', noKeep: 'Όχι, Διατήρηση', failedLoad: 'Αποτυχία φόρτωσης', failedStatus: 'Αποτυχία ενημέρωσης', failedDelete: 'Αποτυχία διαγραφής', deleted: 'Ο κανόνας διαγράφηκε', created: 'Ο κανόνας δημιουργήθηκε', updated: 'Ο κανόνας ενημερώθηκε', markedAs: 'Σημειώθηκε ως' },
  pt: { title: 'Gestão de Margens', subtitle: 'Definir e gerir regras de preços', searchPh: 'Nome da regra, ID...', allRules: 'Todas as Regras', active: 'Ativo', passive: 'Inativo', newRule: 'Nova Regra', colRule: 'Regra de Margem', colHotels: 'Hotéis Associados', colAgencies: 'Agências', colPriority: 'Prioridade', colValue: 'Valor', colStatus: 'Status', colActions: 'Ações', allHotels: 'Todos os Hotéis', allAgencies: 'Todas as Agências', noRules: 'Nenhuma regra encontrada', showing: 'Mostrando', to2: 'a', of: 'de', rules: 'regras', deleteTitle: 'Excluir Margem', yesDelete: 'Sim, Excluir', noKeep: 'Não, Manter', failedLoad: 'Falha ao carregar', failedStatus: 'Falha ao atualizar', failedDelete: 'Falha ao excluir', deleted: 'Regra excluída', created: 'Regra criada', updated: 'Regra atualizada', markedAs: 'Marcado como' }
};
const tMK = (lang, key) => { const l = getLang(lang); return MK[l]?.[key] ?? MK.en[key] ?? COMMON[l]?.[key] ?? COMMON.en[key] ?? key; };

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
            setTotalPages(response?.numberOfPages ?? 1);
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
        
        // Explicitly construct payload according to MarkupRequestDto
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

    return (
        <div className="h-full flex flex-col p-6 space-y-4 overflow-hidden">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0">
                <div>
                    <h1 className="text-base font-semibold text-slate-900 dark:text-white leading-none mb-1">{L('title')}</h1>
                    <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">{L('subtitle')}</p>
                </div>
                <div className="flex items-center gap-3">
                    <HeaderActions />
                </div>
            </div>

            {/* Table Container */}
            <div className="flex-1 bg-white dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-white/5 shadow-xs flex flex-col overflow-hidden min-h-0">
                {/* Toolbar */}
                <div className="flex flex-wrap items-center gap-2 px-4 py-3 border-b border-slate-100 dark:border-white/5 shrink-0">
                    <div className="relative flex-1 min-w-[180px]">
                        <span className="material-icons-round absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">search</span>
                        <input
                            type="text"
                            placeholder={L('searchPh')}
                            value={filters.query}
                            onChange={(e) => handleFilterChange('query', e.target.value)}
                            className="w-full h-8 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg pl-8 pr-3 text-xs font-medium outline-none focus:border-primary transition-colors"
                        />
                    </div>
                    <select
                        value={filters.status}
                        onChange={(e) => handleFilterChange('status', e.target.value)}
                        className="h-8 px-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium outline-none cursor-pointer"
                    >
                        <option value="">{L('allRules')}</option>
                        <option value="ACTIVE">{L('active')}</option>
                        <option value="PASSIVE">{L('passive')}</option>
                    </select>
                    <button
                        onClick={fetchMarkups}
                        className={`size-8 flex items-center justify-center bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-500 hover:bg-slate-100 transition-all ${loading ? 'animate-spin opacity-50 pointer-events-none' : ''}`}
                    >
                        <span className="material-icons-round text-sm">refresh</span>
                    </button>
                    {loading && (
                        <div className="flex items-center gap-1.5">
                            <div className="size-3 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                            <span className="text-[10px] font-medium text-primary">Loading...</span>
                        </div>
                    )}
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="ml-auto h-8 px-4 bg-primary text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 hover:bg-primary/90 active:scale-95 transition-all shadow-xs shadow-primary/20 whitespace-nowrap"
                    >
                        <span className="material-icons-round text-sm">add</span>
                        {L('newRule')}
                    </button>
                </div>

                {/* Table */}
                <div className="flex-1 overflow-x-auto overflow-y-auto">
                    <table className="w-full text-left text-xs">
                        <thead className="sticky top-0 bg-slate-50 dark:bg-slate-800/80 z-10 border-b border-slate-200 dark:border-white/5">
                            <tr>
                                <th className="px-4 py-2.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider w-14 text-center">ID</th>
                                <th className="px-4 py-2.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">{L('colRule')}</th>
                                <th className="px-4 py-2.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">{L('colHotels')}</th>
                                <th className="px-4 py-2.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider text-center w-20">{L('colPriority')}</th>
                                <th className="px-4 py-2.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider text-center w-20">{L('colValue')}</th>
                                <th className="px-4 py-2.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider text-center w-28">{L('colStatus')}</th>
                                <th className="px-4 py-2.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider text-right">{L('colActions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse border-b border-slate-100 dark:border-white/[0.04]">
                                        {Array(7).fill(0).map((_, j) => (
                                            <td key={j} className="px-4 py-3"><div className="h-5 bg-slate-100 dark:bg-slate-800 rounded w-full"></div></td>
                                        ))}
                                    </tr>
                                ))
                            ) : markups.length > 0 ? markups.map((m, rowIdx) => (
                                <tr key={m.id} className={`border-b border-slate-100 dark:border-white/[0.04] hover:bg-primary/5 transition-colors ${rowIdx % 2 === 1 ? 'bg-slate-50/60 dark:bg-white/[0.02]' : ''}`}>
                                    <td className="px-4 py-2.5 text-center">
                                        <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[10px] font-medium text-slate-500">#{m.id}</span>
                                    </td>
                                    <td className="px-4 py-2.5">
                                        <p className="font-semibold text-slate-800 dark:text-white text-xs">{m.name}</p>
                                        <p className="text-[10px] text-slate-400 mt-0.5">By: {m.updatedBy || m.createdBy}</p>
                                    </td>
                                    <td className="px-4 py-2.5">
                                        <div className="flex flex-wrap gap-1 items-center">
                                            {m.hotels && m.hotels.length > 0 ? (
                                                <>
                                                    {m.hotels.slice(0, 1).map((h, idx) => (
                                                        <span key={idx} className="px-1.5 py-0.5 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded text-[10px] font-semibold text-blue-600 dark:text-blue-400 whitespace-nowrap">
                                                            {h.name}
                                                        </span>
                                                    ))}
                                                    {m.hotels.length > 1 && (
                                                        <span className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded text-[10px] font-semibold">
                                                            +{m.hotels.length - 1}
                                                        </span>
                                                    )}
                                                </>
                                            ) : (
                                                <span className="text-[10px] text-slate-400 italic">{L('allHotels')}</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-4 py-2.5 text-center">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${m.priority === 1 ? 'bg-rose-50 text-rose-500 dark:bg-rose-900/20' : 'bg-blue-50 text-primary dark:bg-blue-900/20'}`}>
                                            {m.priority}
                                        </span>
                                    </td>
                                    <td className="px-4 py-2.5 text-center">
                                        <span className="font-bold text-slate-900 dark:text-white text-xs">{m.value}%</span>
                                    </td>
                                    <td className="px-4 py-2.5">
                                        <div className="flex flex-col items-center gap-0.5">
                                            <AppleSwitch
                                                checked={m.status === 'ACTIVE'}
                                                onChange={() => handleToggleStatus(m)}
                                                size="sm"
                                            />
                                            <span className={`text-[9px] font-semibold uppercase tracking-wider ${m.status === 'ACTIVE' ? 'text-emerald-500' : 'text-slate-400'}`}>
                                                {m.status === 'ACTIVE' ? L('active') : L('passive')}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-2.5 text-right">
                                        <div className="flex items-center justify-end gap-0.5">
                                            <button onClick={() => handleEditMarkup(m)} className="size-7 rounded-lg flex items-center justify-center text-slate-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-500 transition-all">
                                                <span className="material-icons-round text-sm">edit</span>
                                            </button>
                                            <button onClick={() => handleDeleteMarkup(m)} className="size-7 rounded-lg flex items-center justify-center text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 transition-all">
                                                <span className="material-icons-round text-sm">delete_outline</span>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="7" className="py-16 text-center">
                                        <div className="flex flex-col items-center gap-2 text-slate-300">
                                            <span className="material-icons-round text-4xl">analytics</span>
                                            <span className="text-xs font-semibold text-slate-400">{L('noRules')}</span>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Footer */}
                <div className="px-4 py-2.5 border-t border-slate-100 dark:border-white/5 flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-slate-900/30">
                    <span className="text-[10px] font-medium text-slate-400">
                        {L('showing')} {totalItems > 0 ? filters.page * filters.size + 1 : 0} {L('to2')} {Math.min((filters.page + 1) * filters.size, totalItems)} {L('of')} {totalItems} {L('rules')}
                    </span>
                    <div className="flex items-center gap-1.5">
                        <button
                            disabled={filters.page === 0}
                            onClick={() => handlePageChange(filters.page - 1)}
                            className="size-7 rounded-lg border border-slate-200 dark:border-white/5 flex items-center justify-center text-slate-400 disabled:opacity-30 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                        >
                            <span className="material-icons-round text-sm">chevron_left</span>
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
                                        className={`size-7 rounded-lg text-[10px] font-semibold transition-all ${filters.page === pageNum ? 'bg-primary text-white' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                                    >
                                        {pageNum + 1}
                                    </button>
                                );
                            })}
                        </div>
                        <button
                            disabled={filters.page >= totalPages - 1 || totalPages === 0}
                            onClick={() => handlePageChange(filters.page + 1)}
                            className="size-7 rounded-lg border border-slate-200 dark:border-white/5 flex items-center justify-center text-slate-400 disabled:opacity-30 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                        >
                            <span className="material-icons-round text-sm">chevron_right</span>
                        </button>
                    </div>
                </div>
            </div>


            {/* Styling for line-clamp */}
            <style jsx="true">{`
                .line-clamp-2 {
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }
            `}</style>

            {/* Notification Toast */}
            {toast.show && (
                <div className={`fixed bottom-8 right-8 z-[50000] flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl animate-in slide-in-from-right-10 duration-300 ${toast.type === 'error' ? 'bg-red-500 text-white' : 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'}`}>
                    <span className="material-icons-round text-xl">{toast.type === 'error' ? 'error_outline' : 'check_circle_outline'}</span>
                    <p className="text-[11px] font-black uppercase tracking-widest">{toast.message}</p>
                </div>
            )}

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
