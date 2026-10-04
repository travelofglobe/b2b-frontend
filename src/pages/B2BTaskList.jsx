import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { taskManagementService } from '../services/taskManagementService';
import TaskDetailDrawer from '../components/TaskDetailDrawer';

const statusConfig = {
    OPEN: { label: 'Açık / Open', bg: 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800', dot: 'bg-blue-500' },
    IN_PROGRESS: { label: 'İşleniyor', bg: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800', dot: 'bg-amber-500' },
    WAITING_FOR_SUPPLIER: { label: 'Tedarikçi Bekleniyor', bg: 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800', dot: 'bg-purple-500' },
    WAITING_FOR_AGENCY: { label: 'Onayınız Bekleniyor', bg: 'bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800 animate-pulse', dot: 'bg-orange-500' },
    APPROVED: { label: 'Onaylandı', bg: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800', dot: 'bg-emerald-500' },
    REJECTED: { label: 'Reddedildi', bg: 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800', dot: 'bg-rose-500' },
    COMPLETED: { label: 'Tamamlandı', bg: 'bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800', dot: 'bg-green-500' },
    CANCELLED: { label: 'İptal Edildi', bg: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700', dot: 'bg-slate-400' }
};

const priorityConfig = {
    LOW: { label: 'Düşük', color: 'text-slate-600 bg-slate-100 dark:bg-slate-800 dark:text-slate-300 border-slate-200' },
    NORMAL: { label: 'Normal', color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/30 dark:text-blue-300 border-blue-200' },
    HIGH: { label: 'Yüksek', color: 'text-amber-700 bg-amber-50 dark:bg-amber-950/30 dark:text-amber-300 border-amber-200' },
    URGENT: { label: 'Acil', color: 'text-rose-700 bg-rose-50 dark:bg-rose-950/30 dark:text-rose-300 border-rose-300' }
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
    const { t } = useTranslation();
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
    const [typeFilter, setTypeFilter] = useState('');
    const [availableTypes, setAvailableTypes] = useState([]);

    // Load available types when product tab changes
    useEffect(() => {
        const fetchTypes = async () => {
            try {
                const types = await taskManagementService.getActiveTaskTypes(productTab === 'ALL' ? null : productTab);
                setAvailableTypes(types || []);
            } catch (err) {
                console.warn('Failed to load types:', err);
            }
        };
        fetchTypes();
    }, [productTab]);

    const fetchTasks = useCallback(async () => {
        try {
            setLoading(true);
            const payload = {
                productType: productTab === 'ALL' ? null : productTab,
                search: search.trim() || null,
                taskStatus: statusFilter || null,
                priority: priorityFilter || null,
                taskTypeCode: typeFilter || null,
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
            setLoading(false);
        }
    }, [productTab, search, statusFilter, priorityFilter, typeFilter, page, size]);

    useEffect(() => {
        fetchTasks();
    }, [fetchTasks]);

    const resetFilters = () => {
        setSearch('');
        setStatusFilter('');
        setPriorityFilter('');
        setTypeFilter('');
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
                            <div className="size-10 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-xs">
                                <span className="material-symbols-outlined text-[24px]">support_agent</span>
                            </div>
                            <div>
                                <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                                    Talep Yönetimi
                                </h1>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    Rezervasyonlarınızla ilgili oluşturduğunuz tüm operasyonel talepleri ve durumlarını takip edin
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Product Filter Tabs */}
                <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 pb-2 overflow-x-auto">
                    {[
                        { id: 'ALL', label: 'Tüm Ürünler', icon: 'apps' },
                        { id: 'HOTEL', label: 'Otel', icon: 'hotel' },
                        { id: 'FLIGHT', label: 'Uçak', icon: 'flight' },
                        { id: 'TRANSFER', label: 'Transfer', icon: 'directions_car' },
                        { id: 'RENT_A_CAR', label: 'Araç Kiralama', icon: 'car_rental' },
                        { id: 'TRAIN', label: 'Tren', icon: 'train' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => {
                                setProductTab(tab.id);
                                setTypeFilter('');
                                setPage(0);
                            }}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                                productTab === tab.id
                                    ? 'bg-blue-600 text-white shadow-xs'
                                    : 'bg-white dark:bg-[#202124] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700'
                            }`}
                        >
                            <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </div>

                {/* Filter Toolbar */}
                <div className="bg-white dark:bg-[#202124] border border-slate-200 dark:border-slate-700/80 rounded-2xl p-4 shadow-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
                        {/* Search Input */}
                        <div className="relative">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
                                search
                            </span>
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                                placeholder="Talep No, Rez No, Ürün Adı..."
                                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-[#28292c] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                            />
                        </div>

                        {/* Status Select */}
                        <div>
                            <select
                                value={statusFilter}
                                onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
                                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-[#28292c] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium cursor-pointer"
                            >
                                <option value="">Tüm Durumlar</option>
                                {Object.entries(statusConfig).map(([k, v]) => (
                                    <option key={k} value={k}>{v.label}</option>
                                ))}
                            </select>
                        </div>

                        {/* Priority Select */}
                        <div>
                            <select
                                value={priorityFilter}
                                onChange={(e) => { setPriorityFilter(e.target.value); setPage(0); }}
                                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-[#28292c] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium cursor-pointer"
                            >
                                <option value="">Tüm Öncelikler</option>
                                <option value="LOW">Düşük</option>
                                <option value="NORMAL">Normal</option>
                                <option value="HIGH">Yüksek</option>
                                <option value="URGENT">Acil</option>
                            </select>
                        </div>

                        {/* Dynamic Task Type Select */}
                        <div>
                            <select
                                value={typeFilter}
                                onChange={(e) => { setTypeFilter(e.target.value); setPage(0); }}
                                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-[#28292c] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium cursor-pointer"
                            >
                                <option value="">Tüm Talep Tipleri</option>
                                {availableTypes.map(t => (
                                    <option key={t.code} value={t.code}>{t.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Reset Filters */}
                        <div>
                            <button
                                onClick={resetFilters}
                                className="w-full py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                            >
                                <span className="material-symbols-outlined text-[16px]">filter_alt_off</span>
                                <span>Filtreleri Temizle</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Table View */}
                <div className="bg-white dark:bg-[#202124] border border-slate-200 dark:border-slate-700/80 rounded-2xl shadow-xs overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50/75 dark:bg-[#28292c] text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                    <th className="py-3.5 px-4">Talep No</th>
                                    <th className="py-3.5 px-4">Ürün & Rez No</th>
                                    <th className="py-3.5 px-4">Talep Tipi</th>
                                    <th className="py-3.5 px-4">Öncelik</th>
                                    <th className="py-3.5 px-4">Durum</th>
                                    <th className="py-3.5 px-4">Fiyat Farkı</th>
                                    <th className="py-3.5 px-4">Mesaj</th>
                                    <th className="py-3.5 px-4">Son Güncelleme</th>
                                    <th className="py-3.5 px-4 text-right">İşlem</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs text-slate-700 dark:text-slate-300">
                                {loading ? (
                                    <tr>
                                        <td colSpan="9" className="py-12 text-center text-slate-400">
                                            <div className="size-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                                            <span>Talepler yükleniyor...</span>
                                        </td>
                                    </tr>
                                ) : tasks.length === 0 ? (
                                    <tr>
                                        <td colSpan="9" className="py-12 text-center text-slate-400">
                                            <span className="material-symbols-outlined text-[36px] text-slate-300 dark:text-slate-600 block mb-2">inbox</span>
                                            <span>Kayıtlı talep bulunamadı.</span>
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
                                                className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                                            >
                                                <td className="py-3.5 px-4 font-mono font-bold text-blue-600 dark:text-blue-400 whitespace-nowrap">
                                                    #{task.taskNumber || task.id}
                                                </td>

                                                <td className="py-3.5 px-4">
                                                    <div className="flex items-center gap-2">
                                                        <span className="material-symbols-outlined text-[18px] text-slate-400">
                                                            {productIcon}
                                                        </span>
                                                        <div>
                                                            <strong className="block font-semibold text-slate-900 dark:text-white truncate max-w-[180px]">
                                                                {task.productName || task.productType}
                                                            </strong>
                                                            <span className="text-[11px] text-slate-400">
                                                                Rez: #{task.reservationNo || '-'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>

                                                <td className="py-3.5 px-4">
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-medium">
                                                        {task.taskTypeName || task.taskTypeCode}
                                                    </span>
                                                </td>

                                                <td className="py-3.5 px-4">
                                                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${priority.color}`}>
                                                        {priority.label}
                                                    </span>
                                                </td>

                                                <td className="py-3.5 px-4">
                                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${status.bg}`}>
                                                        <span className={`size-1.5 rounded-full ${status.dot}`}></span>
                                                        <span>{status.label}</span>
                                                    </span>
                                                </td>

                                                <td className="py-3.5 px-4">
                                                    {task.priceDifference ? (
                                                        <div>
                                                            <strong className="text-amber-600 dark:text-amber-400 font-bold">
                                                                +{task.priceDifference} {task.currency || 'EUR'}
                                                            </strong>
                                                            {task.confirmationStatus === 'PENDING_CONFIRMATION' && (
                                                                <span className="block text-[10px] text-orange-600 font-bold animate-pulse">
                                                                    Onay Bekliyor
                                                                </span>
                                                            )}
                                                            {task.confirmationStatus === 'CONFIRMED' && (
                                                                <span className="block text-[10px] text-emerald-600 font-medium">
                                                                    Onaylandı
                                                                </span>
                                                            )}
                                                            {task.confirmationStatus === 'REJECTED' && (
                                                                <span className="block text-[10px] text-rose-600 font-medium">
                                                                    Reddedildi
                                                                </span>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <span className="text-slate-400">-</span>
                                                    )}
                                                </td>

                                                <td className="py-3.5 px-4">
                                                    <div className="flex items-center gap-1 text-slate-500">
                                                        <span className="material-symbols-outlined text-[16px]">chat_bubble_outline</span>
                                                        <span>{task.messageCount || 0}</span>
                                                    </div>
                                                </td>

                                                <td className="py-3.5 px-4 text-slate-400 text-[11px] whitespace-nowrap">
                                                    {task.lastActivityDate
                                                        ? new Date(task.lastActivityDate).toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' })
                                                        : (task.createdAt ? new Date(task.createdAt).toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' }) : '-')}
                                                </td>

                                                <td className="py-3.5 px-4 text-right">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleOpenDetail(task);
                                                        }}
                                                        className="px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white text-xs font-semibold transition-all inline-flex items-center gap-1 cursor-pointer"
                                                    >
                                                        <span>Detay</span>
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

                    {/* Pagination */}
                    <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-[#28292c] flex items-center justify-between text-xs text-slate-500">
                        <span>Toplam <strong>{totalElements}</strong> talep bulundu</span>
                        {totalPages > 1 && (
                            <div className="flex items-center gap-2">
                                <button
                                    disabled={page === 0}
                                    onClick={() => setPage(p => Math.max(0, p - 1))}
                                    className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
                                >
                                    Önceki
                                </button>
                                <span className="font-semibold text-slate-700 dark:text-slate-300">
                                    {page + 1} / {totalPages}
                                </span>
                                <button
                                    disabled={page >= totalPages - 1}
                                    onClick={() => setPage(p => p + 1)}
                                    className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
                                >
                                    Sonraki
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
                onUpdated={fetchTasks}
            />
        </div>
    );
};

export default B2BTaskList;
