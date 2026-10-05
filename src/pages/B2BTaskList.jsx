import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { taskManagementService } from '../services/taskManagementService';
import TaskDetailDrawer from '../components/TaskDetailDrawer';
import { getTaskTypeLabel } from '../utils/taskTypeDictionary';

const statusConfig = {
    OPEN: { bg: 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800', dot: 'bg-blue-500' },
    IN_PROGRESS: { bg: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800', dot: 'bg-amber-500' },
    WAITING_FOR_SUPPLIER: { bg: 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800', dot: 'bg-purple-500' },
    WAITING_FOR_AGENCY: { bg: 'bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800 animate-pulse', dot: 'bg-orange-500' },
    APPROVED: { bg: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800', dot: 'bg-emerald-500' },
    REJECTED: { bg: 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800', dot: 'bg-rose-500' },
    COMPLETED: { bg: 'bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800', dot: 'bg-green-500' },
    CANCELLED: { bg: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700', dot: 'bg-slate-400' }
};

const priorityConfig = {
    LOW: { color: 'text-slate-600 bg-slate-100 dark:bg-slate-800 dark:text-slate-300 border-slate-200' },
    NORMAL: { color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/30 dark:text-blue-300 border-blue-200' },
    HIGH: { color: 'text-amber-700 bg-amber-50 dark:bg-amber-950/30 dark:text-amber-300 border-amber-200' },
    URGENT: { color: 'text-rose-700 bg-rose-50 dark:bg-rose-950/30 dark:text-rose-300 border-rose-300' }
};

const productIcons = {
    HOTEL: 'hotel',
    FLIGHT: 'flight',
    TRANSFER: 'directions_car',
    TRAIN: 'train',
    RENT_A_CAR: 'car_rental',
    GENERAL: 'support_agent'
};

const B2BTaskList = () => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();

    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(0);
    const [size, setSize] = useState(15);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);

    // Slide-over Drawer State
    const [selectedTask, setSelectedTask] = useState(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    const handleOpenDetail = (task) => {
        setSelectedTask(task);
        setIsDrawerOpen(true);
    };

    const handleCloseDrawer = () => {
        setIsDrawerOpen(false);
        setSelectedTask(null);
    };

    // Filters
    const [productTab, setProductTab] = useState('ALL');
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [priorityFilter, setPriorityFilter] = useState('');

    const fetchTasks = useCallback(async (isSilent = false) => {
        try {
            if (!isSilent) setLoading(true);
            const payload = {
                productType: productTab === 'ALL' ? null : productTab,
                search: search.trim() || null,
                taskStatus: statusFilter || null,
                priority: priorityFilter || null,
                sortBy: 'updatedAt',
                sortDirection: 'DESC',
                page,
                size
            };
            const data = await taskManagementService.searchTasks(payload);
            setTasks(data.content || []);
            setTotalPages(data.totalPages || 0);
            setTotalElements(data.totalElements || 0);
        } catch (err) {
            console.error('Error fetching tasks:', err);
        } finally {
            if (!isSilent) setLoading(false);
        }
    }, [productTab, search, statusFilter, priorityFilter, page, size]);

    useEffect(() => {
        fetchTasks();
    }, [fetchTasks]);

    const handleTaskUpdated = useCallback(() => {
        fetchTasks(true);
    }, [fetchTasks]);

    const resetFilters = () => {
        setSearch('');
        setStatusFilter('');
        setPriorityFilter('');
        setProductTab('ALL');
        setPage(0);
    };

    return (
        <div className="flex-1 bg-[#f8f9fa] dark:bg-[#18191c] overflow-y-auto font-roboto p-6 sm:p-10 lg:px-16 xl:px-20 py-8 space-y-6">
            <div className="max-w-7xl mx-auto space-y-6">
                
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2.5">
                            <div className="size-10 rounded-2xl bg-[#137fec]/10 dark:bg-[#137fec]/20 text-[#137fec] flex items-center justify-center shadow-xs">
                                <span className="material-symbols-outlined text-[24px]">support_agent</span>
                            </div>
                            <div>
                                <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                                    {t('taskManagement.title', 'Talep Yönetimi')}
                                </h1>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    {t('taskManagement.subtitle', 'Rezervasyonlarınızla ilgili oluşturduğunuz tüm operasyonel talepleri ve durumlarını takip edin')}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Product Filter Tabs - Google Material 3 Chip Style */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
                    {[
                        { id: 'ALL', labelKey: 'taskManagement.productTypes.ALL', defaultLabel: 'Tüm Ürünler', icon: 'apps' },
                        { id: 'HOTEL', labelKey: 'taskManagement.productTypes.HOTEL', defaultLabel: 'Otel', icon: 'hotel' },
                        { id: 'FLIGHT', labelKey: 'taskManagement.productTypes.FLIGHT', defaultLabel: 'Uçak', icon: 'flight' },
                        { id: 'TRANSFER', labelKey: 'taskManagement.productTypes.TRANSFER', defaultLabel: 'Transfer', icon: 'directions_car' },
                        { id: 'RENT_A_CAR', labelKey: 'taskManagement.productTypes.RENT_A_CAR', defaultLabel: 'Araç Kiralama', icon: 'car_rental' },
                        { id: 'TRAIN', labelKey: 'taskManagement.productTypes.TRAIN', defaultLabel: 'Tren', icon: 'train' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => {
                                setProductTab(tab.id);
                                setPage(0);
                            }}
                            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                                productTab === tab.id
                                    ? 'bg-[#1a73e8] text-white shadow-xs'
                                    : 'bg-white dark:bg-[#202124] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#303134] border border-slate-200 dark:border-slate-700/80'
                            }`}
                        >
                            <span className="material-symbols-outlined text-[17px]">{tab.icon}</span>
                            <span>{t(tab.labelKey, tab.defaultLabel)}</span>
                        </button>
                    ))}
                </div>

                {/* Filter Toolbar - Google Style Search & Filter Bar */}
                <div className="bg-white dark:bg-[#202124] border border-slate-200 dark:border-slate-700/80 rounded-2xl p-2.5 sm:p-3 shadow-xs">
                    <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2.5">
                        {/* Google Style Search Input */}
                        <div className="relative flex-1 min-w-[220px]">
                            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 text-[18px] pointer-events-none">
                                search
                            </span>
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                                placeholder={t('taskManagement.searchPlaceholder', 'Search by request #, reservation no, or subject...')}
                                className="w-full pl-10 pr-9 py-2 text-xs rounded-full bg-slate-100/80 hover:bg-slate-100 dark:bg-[#303134] dark:hover:bg-[#383a3e] border border-transparent focus:border-[#1a73e8] focus:bg-white dark:focus:bg-[#202124] focus:ring-2 focus:ring-[#1a73e8]/20 text-slate-900 dark:text-white font-medium placeholder-slate-400 dark:placeholder-slate-500 transition-all outline-none"
                            />
                            {search && (
                                <button
                                    type="button"
                                    onClick={() => { setSearch(''); setPage(0); }}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 size-4 rounded-full bg-slate-300 dark:bg-slate-600 hover:bg-slate-400 dark:hover:bg-slate-500 text-slate-700 dark:text-white flex items-center justify-center cursor-pointer transition-colors"
                                    title={t('common.clear', 'Temizle')}
                                >
                                    <span className="material-symbols-outlined text-[12px]">close</span>
                                </button>
                            )}
                        </div>

                        {/* Status Select - Google Pill Chip */}
                        <div className="relative shrink-0">
                            <select
                                value={statusFilter}
                                onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
                                className={`appearance-none pl-4 pr-8 py-2 text-xs rounded-full font-medium transition-all cursor-pointer outline-none border ${
                                    statusFilter
                                        ? 'bg-blue-50 dark:bg-blue-950/40 text-[#1a73e8] dark:text-[#8ab4f8] border-blue-200 dark:border-blue-800 ring-1 ring-blue-500/20'
                                        : 'bg-slate-100/80 hover:bg-slate-100 dark:bg-[#303134] dark:hover:bg-[#383a3e] text-slate-700 dark:text-slate-200 border-transparent hover:border-slate-300 dark:hover:border-slate-600 focus:border-[#1a73e8]'
                                }`}
                            >
                                <option value="">{t('taskManagement.allStatuses', 'All Statuses')}</option>
                                {Object.keys(statusConfig).map((k) => (
                                    <option key={k} value={k}>
                                        {t(`taskManagement.statuses.${k}`, k)}
                                    </option>
                                ))}
                            </select>
                            <span className="material-symbols-outlined pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 text-[18px]">
                                arrow_drop_down
                            </span>
                        </div>

                        {/* Priority Select - Google Pill Chip */}
                        <div className="relative shrink-0">
                            <select
                                value={priorityFilter}
                                onChange={(e) => { setPriorityFilter(e.target.value); setPage(0); }}
                                className={`appearance-none pl-4 pr-8 py-2 text-xs rounded-full font-medium transition-all cursor-pointer outline-none border ${
                                    priorityFilter
                                        ? 'bg-blue-50 dark:bg-blue-950/40 text-[#1a73e8] dark:text-[#8ab4f8] border-blue-200 dark:border-blue-800 ring-1 ring-blue-500/20'
                                        : 'bg-slate-100/80 hover:bg-slate-100 dark:bg-[#303134] dark:hover:bg-[#383a3e] text-slate-700 dark:text-slate-200 border-transparent hover:border-slate-300 dark:hover:border-slate-600 focus:border-[#1a73e8]'
                                }`}
                            >
                                <option value="">{t('taskManagement.allPriorities', 'All Priorities')}</option>
                                <option value="LOW">{t('taskManagement.priorities.LOW', 'Low')}</option>
                                <option value="NORMAL">{t('taskManagement.priorities.NORMAL', 'Normal')}</option>
                                <option value="HIGH">{t('taskManagement.priorities.HIGH', 'High')}</option>
                                <option value="URGENT">{t('taskManagement.priorities.URGENT', 'Urgent')}</option>
                            </select>
                            <span className="material-symbols-outlined pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 text-[18px]">
                                arrow_drop_down
                            </span>
                        </div>

                        {/* Clear Filters Button - Google Style Pill */}
                        <button
                            type="button"
                            onClick={resetFilters}
                            className="px-3.5 py-2 rounded-full border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-[#303134] text-slate-600 dark:text-slate-300 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0"
                            title={t('taskManagement.clearFilters', 'Clear Filters')}
                        >
                            <span className="material-symbols-outlined text-[16px]">filter_alt_off</span>
                            <span>{t('taskManagement.clearFilters', 'Clear Filters')}</span>
                        </button>

                        {/* Refresh Button - Google Style Circular */}
                        <button
                            type="button"
                            onClick={() => fetchTasks()}
                            className="size-9 rounded-full border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-[#303134] text-slate-600 dark:text-slate-300 flex items-center justify-center transition-colors cursor-pointer shrink-0 ml-auto sm:ml-0"
                            title={t('taskManagement.refresh', 'Refresh')}
                        >
                            <span className={`material-symbols-outlined text-[18px] ${loading ? 'animate-spin' : ''}`}>refresh</span>
                        </button>
                    </div>
                </div>

                {/* Compact Table View - Google Workspace Style */}
                <div className="bg-white dark:bg-[#202124] border border-slate-200 dark:border-slate-700/80 rounded-2xl shadow-xs overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-[#28292c] text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                    <th className="py-2.5 px-3">{t('taskManagement.table.taskNo', 'Talep No')}</th>
                                    <th className="py-2.5 px-3">{t('taskManagement.table.productAndRez', 'Ürün & Rez No')}</th>
                                    <th className="py-2.5 px-3">{t('taskManagement.table.taskType', 'Talep Tipi')}</th>
                                    <th className="py-2.5 px-3">{t('taskManagement.table.priority', 'Öncelik')}</th>
                                    <th className="py-2.5 px-3">{t('taskManagement.table.status', 'Durum')}</th>
                                    <th className="py-2.5 px-3">{t('taskManagement.table.priceDiff', 'Fiyat Farkı')}</th>
                                    <th className="py-2.5 px-3">{t('taskManagement.drawer.tabMessages', 'Mesaj')}</th>
                                    <th className="py-2.5 px-3">{t('taskManagement.table.lastUpdate', 'Son Güncelleme')}</th>
                                    <th className="py-2.5 px-3 text-right">{t('taskManagement.table.action', 'İşlem')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs text-slate-700 dark:text-slate-300">
                                {loading ? (
                                    Array.from({ length: 6 }).map((_, idx) => (
                                        <tr key={`b2b-skeleton-${idx}`} className="animate-pulse">
                                            <td className="py-2.5 px-3 whitespace-nowrap">
                                                <div className="h-3.5 w-16 bg-slate-200 dark:bg-slate-700/60 rounded-md"></div>
                                            </td>
                                            <td className="py-2.5 px-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="size-4 bg-slate-200 dark:bg-slate-700/60 rounded-full shrink-0"></div>
                                                    <div>
                                                        <div className="h-3 w-24 bg-slate-200 dark:bg-slate-700/60 rounded mb-1"></div>
                                                        <div className="h-2 w-14 bg-slate-100 dark:bg-slate-800 rounded"></div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-2.5 px-3">
                                                <div className="h-4.5 w-24 bg-slate-200 dark:bg-slate-700/60 rounded-md"></div>
                                            </td>
                                            <td className="py-2.5 px-3 whitespace-nowrap">
                                                <div className="h-4.5 w-14 bg-slate-200 dark:bg-slate-700/60 rounded-full"></div>
                                            </td>
                                            <td className="py-2.5 px-3 whitespace-nowrap">
                                                <div className="h-4.5 w-16 bg-slate-200 dark:bg-slate-700/60 rounded-full"></div>
                                            </td>
                                            <td className="py-2.5 px-3">
                                                <div className="h-3 w-12 bg-slate-200 dark:bg-slate-700/60 rounded"></div>
                                            </td>
                                            <td className="py-2.5 px-3">
                                                <div className="h-3 w-7 bg-slate-200 dark:bg-slate-700/60 rounded"></div>
                                            </td>
                                            <td className="py-2.5 px-3 whitespace-nowrap">
                                                <div className="h-2.5 w-16 bg-slate-200 dark:bg-slate-700/60 rounded"></div>
                                            </td>
                                            <td className="py-2.5 px-3 text-right">
                                                <div className="h-5 w-12 bg-slate-200 dark:bg-slate-700/60 rounded-full ml-auto"></div>
                                            </td>
                                        </tr>
                                    ))
                                ) : tasks.length === 0 ? (
                                    <tr>
                                        <td colSpan="9" className="py-10 text-center text-slate-400">
                                            <span className="material-symbols-outlined text-[32px] text-slate-300 dark:text-slate-600 block mb-1.5">inbox</span>
                                            <span className="font-medium text-slate-600 dark:text-slate-300 block mb-0.5 text-xs">
                                                {t('taskManagement.table.emptyTitle', 'Kayıtlı talep bulunamadı.')}
                                            </span>
                                            <span className="text-[11px] text-slate-400">
                                                {t('taskManagement.table.emptySubtitle', 'Filtreleme kriterlerinize uygun talep bulunmuyor.')}
                                            </span>
                                        </td>
                                    </tr>
                                ) : (
                                    tasks.map((task) => {
                                        const status = statusConfig[task.taskStatus] || statusConfig.OPEN;
                                        const priority = priorityConfig[task.priority] || priorityConfig.NORMAL;
                                        const productIcon = productIcons[task.productType] || 'category';

                                        return (
                                            <tr
                                                key={task.id}
                                                onClick={() => handleOpenDetail(task)}
                                                className="hover:bg-blue-50/40 dark:hover:bg-blue-950/20 cursor-pointer transition-colors group"
                                            >
                                                <td className="py-2 px-3 font-mono font-bold text-xs text-[#1a73e8] dark:text-[#8ab4f8] whitespace-nowrap">
                                                    #{task.taskNumber || task.id}
                                                </td>

                                                <td className="py-2 px-3">
                                                    <div className="flex items-center gap-2">
                                                        <span className="material-symbols-outlined text-[17px] text-slate-400 group-hover:text-[#1a73e8] transition-colors shrink-0">
                                                            {productIcon}
                                                        </span>
                                                        <div className="min-w-0">
                                                            <strong className="block font-semibold text-xs text-slate-900 dark:text-white truncate max-w-[160px]" title={task.productName || task.productType}>
                                                                {task.productName || task.productType}
                                                            </strong>
                                                            <span className="text-[10px] text-slate-400 font-mono">
                                                                {t('taskManagement.table.rez', 'Rez')}: #{task.reservationNo || '-'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>

                                                <td className="py-2 px-3">
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium text-[11px] truncate max-w-[160px]" title={getTaskTypeLabel(task, i18n.language)}>
                                                        {getTaskTypeLabel(task, i18n.language)}
                                                    </span>
                                                </td>

                                                <td className="py-2 px-3 whitespace-nowrap">
                                                    <span className={`inline-flex items-center px-2 py-0.2 rounded-full text-[10px] font-semibold border ${priority.color}`}>
                                                        {t(`taskManagement.priorities.${task.priority}`, task.priority)}
                                                    </span>
                                                </td>

                                                <td className="py-2 px-3 whitespace-nowrap">
                                                    <span className={`inline-flex items-center gap-1 px-2 py-0.2 rounded-full text-[10px] font-semibold border ${status.bg}`}>
                                                        <span className={`size-1.5 rounded-full ${status.dot}`}></span>
                                                        <span>{t(`taskManagement.statuses.${task.taskStatus}`, task.taskStatus)}</span>
                                                    </span>
                                                </td>

                                                <td className="py-2 px-3 whitespace-nowrap text-xs">
                                                    {task.priceDifference ? (
                                                        <div>
                                                            <strong className="text-amber-600 dark:text-amber-400 font-bold">
                                                                +{task.priceDifference} {task.currency || 'EUR'}
                                                            </strong>
                                                            {task.confirmationStatus === 'PENDING_CONFIRMATION' && (
                                                                <span className="block text-[10px] text-orange-600 font-bold animate-pulse">
                                                                    {t('taskManagement.statuses.WAITING_FOR_AGENCY', 'Onay Bekliyor')}
                                                                </span>
                                                            )}
                                                            {task.confirmationStatus === 'CONFIRMED' && (
                                                                <span className="block text-[10px] text-emerald-600 font-medium">
                                                                    {t('taskManagement.statuses.APPROVED', 'Onaylandı')}
                                                                </span>
                                                            )}
                                                            {task.confirmationStatus === 'REJECTED' && (
                                                                <span className="block text-[10px] text-rose-600 font-medium">
                                                                    {t('taskManagement.statuses.REJECTED', 'Reddedildi')}
                                                                </span>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <span className="text-slate-400">-</span>
                                                    )}
                                                </td>

                                                <td className="py-2 px-3 whitespace-nowrap">
                                                    <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                                                        <span className="material-symbols-outlined text-[15px]">chat_bubble_outline</span>
                                                        <span>{task.messageCount || 0}</span>
                                                    </span>
                                                </td>

                                                <td className="py-2 px-3 text-slate-400 text-[11px] whitespace-nowrap">
                                                    {task.lastActivityDate
                                                        ? new Date(task.lastActivityDate).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })
                                                        : (task.createdAt ? new Date(task.createdAt).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' }) : '-')}
                                                </td>

                                                <td className="py-2 px-3 text-right whitespace-nowrap">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleOpenDetail(task);
                                                        }}
                                                        className="px-2.5 py-1 rounded-full text-xs font-semibold text-[#1a73e8] dark:text-[#8ab4f8] hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors inline-flex items-center gap-0.5 cursor-pointer"
                                                    >
                                                        <span>{t('taskManagement.table.view', 'Detay')}</span>
                                                        <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Compact Pagination */}
                    <div className="py-2.5 px-3 border-t border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-[#28292c] flex items-center justify-between text-xs text-slate-500">
                        <span>
                            {t('common.total', 'Toplam')} <strong>{totalElements}</strong> {t('taskManagement.table.taskType', 'talep').toLowerCase()}
                        </span>
                        {totalPages > 1 && (
                            <div className="flex items-center gap-1.5">
                                <button
                                    disabled={page === 0}
                                    onClick={() => setPage(p => Math.max(0, p - 1))}
                                    className="px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none cursor-pointer transition-colors"
                                >
                                    {t('common.previous', 'Önceki')}
                                </button>
                                <span className="font-semibold text-slate-700 dark:text-slate-300 px-1 text-[11px]">
                                    {page + 1} / {totalPages}
                                </span>
                                <button
                                    disabled={page >= totalPages - 1}
                                    onClick={() => setPage(p => p + 1)}
                                    className="px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none cursor-pointer transition-colors"
                                >
                                    {t('common.next', 'Sonraki')}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Slide-over Task Detail Drawer */}
            <TaskDetailDrawer
                taskId={selectedTask?.id}
                initialTask={selectedTask}
                isOpen={isDrawerOpen}
                onClose={handleCloseDrawer}
                onUpdated={handleTaskUpdated}
            />
        </div>
    );
};

export default B2BTaskList;
