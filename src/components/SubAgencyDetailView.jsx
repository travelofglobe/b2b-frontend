import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { agencyService } from '../services/agencyService';
import { roleService } from '../services/userService';
import { useToast } from '../context/ToastContext';
import EditSubAgencyUserModal from './EditSubAgencyUserModal';
import ConfirmModal from './ConfirmModal';
import AssignRoleModal from './AssignRoleModal';
import AppleSwitch from './AppleSwitch';

const SubAgencyDetailView = ({ onBack, agency }) => {
    const { t } = useTranslation();
    const toast = useToast();
    const [activeTab, setActiveTab] = useState('users');
    const [users, setUsers] = useState([]);
    const [roles, setRoles] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [totalCount, setTotalCount] = useState(0);
    const [filters, setFilters] = useState({
        page: 0,
        size: 10,
        query: '',
        status: 'ACTIVE',
        roleIds: []
    });
    const [editModal, setEditModal] = useState({ isOpen: false, user: null });
    const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, user: null, isLoading: false });
    const [roleModal, setRoleModal] = useState({ isOpen: false, user: null });

    const fetchRoles = useCallback(async () => {
        try {
            const response = await roleService.filterRoles();
            setRoles(response.roles || response.content || []);
        } catch (error) {
            console.error('Error fetching roles:', error);
        }
    }, []);

    useEffect(() => {
        fetchRoles();
    }, [fetchRoles]);

    const fetchUsers = useCallback(async () => {
        if (!agency?.id) return;
        setIsLoading(true);
        try {
            const params = {
                page: filters.page,
                size: filters.size,
                agencyId: agency.id,
                query: filters.query || undefined,
                status: filters.status || undefined,
                roleIds: filters.roleIds.length > 0 ? filters.roleIds : undefined
            };
            const response = await agencyService.filterSubAgencyUsers(params);
            if (response && response.agencyUsers) {
                setUsers(response.agencyUsers);
                setTotalCount(response.numberOfItems || 0);
            } else {
                setUsers([]);
                setTotalCount(0);
            }
        } catch (error) {
            console.error('Error fetching sub-agency users:', error);
            setUsers([]);
        } finally {
            setIsLoading(false);
        }
    }, [agency?.id, filters]);

    useEffect(() => {
        if (activeTab === 'users') {
            fetchUsers();
        }
    }, [activeTab, fetchUsers]);

    const handleFilterChange = (field, value) => {
        setFilters(prev => ({ ...prev, [field]: value, page: 0 }));
    };

    const handleClearFilters = () => {
        setFilters({
            page: 0,
            size: filters.size,
            query: '',
            status: '',
            roleIds: []
        });
    };

    const hasActiveFilters = Boolean(
        filters.query || filters.status || filters.roleIds.length > 0
    );

    const handleStatusToggle = async (user) => {
        const newStatus = user.status === 'ACTIVE' ? 'PASSIVE' : 'ACTIVE';
        try {
            setUsers(prev => prev.map(u => u.id === user.id ? { ...u, status: newStatus } : u));
            const payload = {
                name: user.name,
                surname: user.surname,
                phoneCountryCode: user.phoneCountryCode?.replace('+', '') || '90',
                phoneNumber: user.phoneNumber || '',
                status: newStatus,
                agencyId: agency.id
            };
            await agencyService.updateSubAgencyUser(user.id, payload);
            fetchUsers();
        } catch (error) {
            console.error('Error toggling user status:', error);
            setUsers(prev => prev.map(u => u.id === user.id ? { ...u, status: user.status } : u));
            toast.error(error.message || 'Failed to update status');
        }
    };

    const handleDeleteUser = async () => {
        if (!deleteConfirm.user) return;
        setDeleteConfirm(prev => ({ ...prev, isLoading: true }));
        try {
            await agencyService.deleteSubAgencyUser(deleteConfirm.user.id);
            setDeleteConfirm({ isOpen: false, user: null, isLoading: false });
            fetchUsers();
        } catch (error) {
            console.error('Error deleting sub-agency user:', error);
            toast.error(error.message || 'Failed to delete user');
            setDeleteConfirm(prev => ({ ...prev, isLoading: false }));
        }
    };

    return (
        <div className="flex flex-col space-y-5 animate-in fade-in duration-200">
            {/* Header / Breadcrumbs / Back button */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-[#28292c] p-4 rounded-2xl border border-[#dadce0] dark:border-[#3c4043] shadow-xs">
                <div className="flex items-center gap-3.5">
                    <button
                        type="button"
                        onClick={onBack}
                        className="size-9 rounded-full border border-[#dadce0] dark:border-[#5f6368] hover:bg-[#f1f3f4] dark:hover:bg-[#3c4043] flex items-center justify-center text-[#5f6368] dark:text-slate-300 transition-all cursor-pointer shadow-2xs group"
                        title="Geri Dön"
                    >
                        <span className="material-symbols-outlined text-[20px] transition-transform group-hover:-translate-x-0.5">arrow_back</span>
                    </button>
                    <div>
                        <div className="flex items-center gap-2 text-xs text-[#5f6368] dark:text-slate-400">
                            <span>Acente Yönetimi</span>
                            <span className="text-[#dadce0] dark:text-[#5f6368]">•</span>
                            <span>Acente Detayı</span>
                            <span className="text-[#dadce0] dark:text-[#5f6368]">•</span>
                            <span className="font-semibold text-[#1a73e8] dark:text-[#8ab4f8]">#{agency?.id}</span>
                        </div>
                        <h1 className="text-lg font-bold text-[#202124] dark:text-white mt-0.5 tracking-tight flex items-center gap-2">
                            {agency?.name}
                        </h1>
                    </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide border ${
                        agency?.agencyType === 'RSA'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/40'
                            : 'bg-[#e8f0fe] text-[#1a73e8] dark:bg-[#1a73e8]/20 dark:text-[#8ab4f8] border-blue-200 dark:border-blue-800/40'
                    }`}>
                        {agency?.agencyType || 'AGENCY'}
                    </span>
                    {agency?.currency && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-[#f8f9fa] dark:bg-[#303134] text-[#3c4043] dark:text-slate-200 border border-[#dadce0] dark:border-[#5f6368]">
                            {agency.currency}
                        </span>
                    )}
                </div>
            </div>

            {/* Table & Content Card */}
            <div className="bg-white dark:bg-[#28292c] rounded-2xl border border-[#dadce0] dark:border-[#3c4043] shadow-xs overflow-hidden flex flex-col">
                {/* Card Header & Tabs */}
                <div className="p-4 border-b border-[#dadce0] dark:border-[#3c4043] flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-[#28292c]">
                    <div className="flex items-center gap-1.5 p-1 bg-[#f1f3f4] dark:bg-[#202124] rounded-xl border border-[#dadce0] dark:border-[#5f6368]">
                        <button
                            type="button"
                            onClick={() => setActiveTab('users')}
                            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                                activeTab === 'users'
                                    ? 'bg-white dark:bg-[#303134] text-[#1a73e8] dark:text-[#8ab4f8] font-semibold shadow-2xs'
                                    : 'text-[#5f6368] dark:text-slate-300 font-medium hover:bg-white/60 dark:hover:bg-[#3c4043]'
                            }`}
                        >
                            <span className="material-symbols-outlined text-[17px]">groups</span>
                            <span>Kullanıcılar ({totalCount})</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('roles')}
                            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                                activeTab === 'roles'
                                    ? 'bg-white dark:bg-[#303134] text-[#1a73e8] dark:text-[#8ab4f8] font-semibold shadow-2xs'
                                    : 'text-[#5f6368] dark:text-slate-300 font-medium hover:bg-white/60 dark:hover:bg-[#3c4043]'
                            }`}
                        >
                            <span className="material-symbols-outlined text-[17px]">admin_panel_settings</span>
                            <span>Roller</span>
                        </button>
                    </div>

                    {activeTab === 'users' && (
                        <button
                            type="button"
                            onClick={() => setEditModal({ isOpen: true, user: null })}
                            className="h-9 px-4 bg-[#1a73e8] hover:bg-[#1557b0] text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs active:scale-95 cursor-pointer whitespace-nowrap"
                        >
                            <span className="material-symbols-outlined text-[18px]">person_add</span>
                            <span>Yeni Kullanıcı Ekle</span>
                        </button>
                    )}
                </div>

                {/* Tab Content: Users */}
                {activeTab === 'users' ? (
                    <>
                        {/* Toolbar Filters */}
                        <div className="p-4 border-b border-[#dadce0] dark:border-[#3c4043] flex flex-wrap items-center gap-2.5 bg-white dark:bg-[#28292c]">
                            <div className="relative flex-1 min-w-[220px] max-w-sm">
                                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#70757a] text-[18px] pointer-events-none">
                                    search
                                </span>
                                <input
                                    type="text"
                                    placeholder="İsim veya e-posta ile ara..."
                                    value={filters.query}
                                    onChange={(e) => handleFilterChange('query', e.target.value)}
                                    className="w-full h-9 pl-9 pr-8 bg-[#f1f3f4] dark:bg-[#303134] border border-transparent focus:border-[#1a73e8] focus:bg-white dark:focus:bg-[#202124] rounded-xl text-[13px] text-[#202124] dark:text-white placeholder-[#70757a] outline-none transition-all shadow-2xs"
                                />
                                {filters.query && (
                                    <button
                                        type="button"
                                        onClick={() => handleFilterChange('query', '')}
                                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#70757a] hover:text-[#202124] dark:hover:text-white cursor-pointer"
                                    >
                                        <span className="material-symbols-outlined text-[16px]">close</span>
                                    </button>
                                )}
                            </div>

                            <div className="relative">
                                <select
                                    value={filters.roleIds[0] || ''}
                                    onChange={(e) => handleFilterChange('roleIds', e.target.value ? [parseInt(e.target.value)] : [])}
                                    className="appearance-none h-9 pl-3 pr-8 bg-white dark:bg-[#303134] border border-[#dadce0] dark:border-[#5f6368] rounded-xl text-[13px] font-medium text-[#3c4043] dark:text-slate-200 outline-none focus:border-[#1a73e8] transition-colors cursor-pointer shadow-2xs hover:bg-[#f8f9fa] dark:hover:bg-[#383a3e]"
                                >
                                    <option value="">Tüm Roller</option>
                                    {roles.map(r => <option key={r.id} value={r.id}>{r.roleName || r.name}</option>)}
                                </select>
                                <span className="material-symbols-outlined pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[#70757a] text-[18px]">
                                    expand_more
                                </span>
                            </div>

                            <div className="relative">
                                <select
                                    value={filters.status}
                                    onChange={(e) => handleFilterChange('status', e.target.value)}
                                    className="appearance-none h-9 pl-3 pr-8 bg-white dark:bg-[#303134] border border-[#dadce0] dark:border-[#5f6368] rounded-xl text-[13px] font-medium text-[#3c4043] dark:text-slate-200 outline-none focus:border-[#1a73e8] transition-colors cursor-pointer shadow-2xs hover:bg-[#f8f9fa] dark:hover:bg-[#383a3e]"
                                >
                                    <option value="">Tüm Durumlar</option>
                                    <option value="ACTIVE">Aktif</option>
                                    <option value="PASSIVE">Pasif</option>
                                </select>
                                <span className="material-symbols-outlined pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[#70757a] text-[18px]">
                                    expand_more
                                </span>
                            </div>

                            {hasActiveFilters && (
                                <button
                                    type="button"
                                    onClick={handleClearFilters}
                                    className="h-9 px-3 rounded-xl border border-[#dadce0] dark:border-[#5f6368] hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs font-medium text-[#d93025] dark:text-rose-400 flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
                                    title="Filtreleri Temizle"
                                >
                                    <span className="material-symbols-outlined text-[16px]">filter_alt_off</span>
                                    <span>Temizle</span>
                                </button>
                            )}

                            <button
                                type="button"
                                onClick={() => fetchUsers()}
                                className="size-9 rounded-xl border border-[#dadce0] dark:border-[#5f6368] hover:bg-[#f1f3f4] dark:hover:bg-[#303134] flex items-center justify-center text-[#5f6368] dark:text-slate-300 transition-all cursor-pointer shadow-2xs ml-auto"
                                title="Yenile"
                            >
                                <span className={`material-symbols-outlined text-[18px] ${isLoading ? 'animate-spin' : ''}`}>refresh</span>
                            </button>
                        </div>

                        {/* Table */}
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="bg-[#f8f9fa] dark:bg-[#202124] border-b border-[#dadce0] dark:border-[#3c4043]">
                                        <th className="px-4 py-3 text-left text-[11px] font-bold text-[#5f6368] dark:text-slate-400 uppercase tracking-wider whitespace-nowrap select-none">Kullanıcı Bilgisi</th>
                                        <th className="px-4 py-3 text-left text-[11px] font-bold text-[#5f6368] dark:text-slate-400 uppercase tracking-wider whitespace-nowrap select-none">İletişim Bilgileri</th>
                                        <th className="px-4 py-3 text-left text-[11px] font-bold text-[#5f6368] dark:text-slate-400 uppercase tracking-wider whitespace-nowrap select-none">Roller</th>
                                        <th className="px-4 py-3 text-center text-[11px] font-bold text-[#5f6368] dark:text-slate-400 uppercase tracking-wider whitespace-nowrap select-none w-28">Durum</th>
                                        <th className="px-4 py-3 text-right text-[11px] font-bold text-[#5f6368] dark:text-slate-400 uppercase tracking-wider whitespace-nowrap select-none w-32">İşlemler</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {isLoading ? (
                                        [...Array(4)].map((_, i) => (
                                            <tr key={i} className="border-b border-[#dadce0]/60 dark:border-[#3c4043]/60 even:bg-[#f8f9fa]/50 dark:even:bg-[#202124]/30">
                                                <td colSpan="5" className="px-4 py-3.5"><div className="h-3.5 bg-slate-200/80 dark:bg-slate-700/60 rounded animate-pulse w-full"></div></td>
                                            </tr>
                                        ))
                                    ) : users.length > 0 ? (
                                        users.map((user) => (
                                            <tr
                                                key={user.id}
                                                className="border-b border-[#dadce0]/60 dark:border-[#3c4043]/60 last:border-0 hover:bg-[#f1f3f4] dark:hover:bg-[#3c4043]/50 even:bg-[#f8f9fa]/50 dark:even:bg-[#202124]/30 transition-colors group"
                                            >
                                                <td className="px-4 py-3.5 text-[13px] font-normal text-[#3c4043] dark:text-slate-300">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="size-7 rounded-full bg-[#e8f0fe] dark:bg-[#1a73e8]/20 text-[#1a73e8] dark:text-[#8ab4f8] flex items-center justify-center text-xs font-bold shrink-0">
                                                            {user.name?.[0]?.toUpperCase()}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <div className="text-[13px] font-medium text-[#3c4043] dark:text-slate-200 truncate">
                                                                {user.name} {user.surname}
                                                            </div>
                                                            <div className="text-[11px] text-[#70757a] dark:text-slate-400">
                                                                ID: #{user.id}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3.5 text-[13px] font-normal text-[#3c4043] dark:text-slate-300">
                                                    <div className="flex flex-col gap-0.5">
                                                        <div className="flex items-center gap-1.5 text-[13px] text-[#3c4043] dark:text-slate-200 truncate">
                                                            <span className="material-symbols-outlined text-[15px] text-[#70757a] shrink-0">mail</span>
                                                            <span className="truncate">{user.email || '-'}</span>
                                                        </div>
                                                        {user.phoneNumber && (
                                                            <div className="flex items-center gap-1.5 text-[11px] text-[#70757a] dark:text-slate-400">
                                                                <span className="material-symbols-outlined text-[14px] text-[#70757a] shrink-0">call</span>
                                                                <span>+{user.phoneCountryCode} {user.phoneNumber}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3.5 text-[13px] whitespace-nowrap">
                                                    <div className="flex flex-wrap gap-1">
                                                        {user.roles && user.roles.length > 0 ? (
                                                            user.roles.map(role => (
                                                                <span
                                                                    key={role.id}
                                                                    className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#e8f0fe] text-[#1a73e8] dark:bg-[#1a73e8]/20 dark:text-[#8ab4f8]"
                                                                >
                                                                    {role.roleName || role.name}
                                                                </span>
                                                            ))
                                                        ) : (
                                                            <span className="text-xs text-[#70757a]">-</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3.5 text-[13px] whitespace-nowrap">
                                                    <div className="flex items-center justify-center">
                                                        <AppleSwitch
                                                            checked={user.status === 'ACTIVE'}
                                                            onChange={() => handleStatusToggle(user)}
                                                            size="sm"
                                                        />
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3.5 text-[13px] whitespace-nowrap text-right">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <button
                                                            type="button"
                                                            onClick={() => setRoleModal({ isOpen: true, user })}
                                                            className="size-8 rounded-full border border-[#dadce0] dark:border-[#5f6368] hover:bg-[#f1f3f4] dark:hover:bg-[#3c4043] text-[#5f6368] dark:text-slate-300 hover:text-[#1a73e8] flex items-center justify-center transition-all cursor-pointer"
                                                            title="Rol Ata"
                                                        >
                                                            <span className="material-symbols-outlined text-[18px]">admin_panel_settings</span>
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => setEditModal({ isOpen: true, user })}
                                                            className="size-8 rounded-full border border-[#dadce0] dark:border-[#5f6368] hover:bg-[#f1f3f4] dark:hover:bg-[#3c4043] text-[#5f6368] dark:text-slate-300 hover:text-[#1a73e8] flex items-center justify-center transition-all cursor-pointer"
                                                            title="Düzenle"
                                                        >
                                                            <span className="material-symbols-outlined text-[18px]">edit</span>
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => setDeleteConfirm({ isOpen: true, user, isLoading: false })}
                                                            className="size-8 rounded-full border border-[#dadce0] dark:border-[#5f6368] hover:bg-rose-50 dark:hover:bg-rose-950/30 text-[#5f6368] dark:text-slate-300 hover:text-[#d93025] hover:border-rose-200 flex items-center justify-center transition-all cursor-pointer"
                                                            title="Sil"
                                                        >
                                                            <span className="material-symbols-outlined text-[18px]">delete</span>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="5" className="px-4 py-16 text-center text-[#70757a] dark:text-slate-400">
                                                <div className="flex flex-col items-center gap-2">
                                                    <span className="material-symbols-outlined text-4xl opacity-50">person_off</span>
                                                    <span className="text-xs font-semibold">Kullanıcı bulunamadı</span>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        <div className="border-t border-[#dadce0] dark:border-[#3c4043] px-6 py-4 flex flex-wrap items-center justify-between bg-white dark:bg-[#28292c] gap-3">
                            <div className="flex items-center gap-2 text-[13px] text-[#5f6368] dark:text-slate-400">
                                <span>{t('pagination.show')}</span>
                                <div className="relative">
                                    <select
                                        value={filters.size}
                                        onChange={(e) => handleFilterChange('size', Number(e.target.value))}
                                        className="appearance-none h-8 pl-2.5 pr-7 bg-white dark:bg-[#202124] border border-[#dadce0] dark:border-[#5f6368] rounded-lg text-xs text-[#202124] dark:text-white outline-none cursor-pointer hover:bg-[#f8f9fa] dark:hover:bg-[#383a3e]"
                                    >
                                        <option value="10">10</option>
                                        <option value="20">20</option>
                                        <option value="50">50</option>
                                    </select>
                                    <span className="material-symbols-outlined pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 text-[#70757a] text-[16px]">
                                        expand_more
                                    </span>
                                </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-3 text-[13px] font-normal">
                                <span className="text-[#70757a] dark:text-slate-400">
                                    {totalCount} Kullanıcı
                                </span>
                                <div className="flex items-center gap-1">
                                    <button
                                        type="button"
                                        disabled={filters.page === 0}
                                        onClick={() => handleFilterChange('page', filters.page - 1)}
                                        className="size-8 rounded-full border border-[#dadce0] dark:border-[#5f6368] hover:bg-[#f1f3f4] dark:hover:bg-[#3c4043] disabled:opacity-30 disabled:hover:bg-transparent transition-all flex items-center justify-center text-[#5f6368] dark:text-slate-300 cursor-pointer"
                                    >
                                        <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                                    </button>
                                    <span className="min-w-[32px] h-8 px-2 flex items-center justify-center rounded-full text-xs font-semibold bg-[#1a73e8] text-white shadow-xs">
                                        {filters.page + 1}
                                    </span>
                                    <button
                                        type="button"
                                        disabled={users.length < filters.size}
                                        onClick={() => handleFilterChange('page', filters.page + 1)}
                                        className="size-8 rounded-full border border-[#dadce0] dark:border-[#5f6368] hover:bg-[#f1f3f4] dark:hover:bg-[#3c4043] disabled:opacity-30 disabled:hover:bg-transparent transition-all flex items-center justify-center text-[#5f6368] dark:text-slate-300 cursor-pointer"
                                    >
                                        <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="p-16 flex flex-col items-center justify-center text-center">
                        <div className="size-16 rounded-2xl bg-[#e8f0fe] dark:bg-[#1a73e8]/20 flex items-center justify-center text-[#1a73e8] dark:text-[#8ab4f8] mb-3">
                            <span className="material-symbols-outlined text-3xl">construction</span>
                        </div>
                        <h3 className="text-base font-bold text-[#202124] dark:text-white capitalize">
                            {activeTab} Yönetimi
                        </h3>
                        <p className="text-xs text-[#70757a] dark:text-slate-400 mt-1 max-w-sm">
                            Bu alan yakında aktif olacaktır.
                        </p>
                    </div>
                )}
            </div>

            <EditSubAgencyUserModal 
                isOpen={editModal.isOpen}
                onClose={() => setEditModal({ isOpen: false, user: null })}
                user={editModal.user}
                agency={agency}
                onUpdate={fetchUsers}
            />

            <ConfirmModal 
                isOpen={deleteConfirm.isOpen}
                onClose={() => setDeleteConfirm({ isOpen: false, user: null, isLoading: false })}
                onConfirm={handleDeleteUser}
                title="Kullanıcıyı Sil"
                message={`${deleteConfirm.user?.name} ${deleteConfirm.user?.surname || ''} kullanıcısını silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`}
                confirmText="Evet, Sil"
                cancelText="Vazgeç"
                type="danger"
                isLoading={deleteConfirm.isLoading}
            />

            <AssignRoleModal 
                isOpen={roleModal.isOpen}
                onClose={() => setRoleModal({ isOpen: false, user: null })}
                user={roleModal.user}
                roles={roles}
                onUpdate={fetchUsers}
            />
        </div>
    );
};

export default SubAgencyDetailView;
