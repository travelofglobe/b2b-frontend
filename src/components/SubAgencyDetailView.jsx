import React, { useState, useEffect, useCallback } from 'react';
import { agencyService } from '../services/agencyService';
import { roleService } from '../services/userService';
import EditSubAgencyUserModal from './EditSubAgencyUserModal';
import ConfirmModal from './ConfirmModal';
import AssignRoleModal from './AssignRoleModal';

const SubAgencyDetailView = ({ onBack, agency }) => {
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
                query: filters.query,
                status: filters.status,
                roleIds: filters.roleIds
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

    const handleStatusToggle = async (user) => {
        const newStatus = user.status === 'ACTIVE' ? 'PASSIVE' : 'ACTIVE';
        try {
            // Optimistic Update
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
            // Revert on error
            setUsers(prev => prev.map(u => u.id === user.id ? { ...u, status: user.status } : u));
            alert('Failed to update status');
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
            alert('Failed to delete user');
            setDeleteConfirm(prev => ({ ...prev, isLoading: false }));
        }
    };

    return (
        <div className="h-full flex flex-col space-y-6 animate-in slide-in-from-right duration-500">
            {/* Header / Breadcrumb / Back */}
            <div className="flex items-center justify-between shrink-0">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={onBack}
                        className="size-11 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 flex items-center justify-center text-slate-500 hover:text-primary dark:hover:text-blue-400 transition-all shadow-sm active:scale-90 group"
                    >
                        <span className="material-icons-round transition-transform group-hover:-translate-x-1">arrow_back</span>
                    </button>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Agency Detail</span>
                            <span className="size-1 rounded-full bg-slate-300" />
                            <span className="text-[10px] font-bold text-primary dark:text-blue-400 uppercase tracking-widest leading-none">#{agency?.id}</span>
                        </div>
                        <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight leading-none uppercase">
                            {agency?.name}
                        </h2>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="px-4 py-2 bg-slate-100 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-white/5">
                        <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Type</div>
                        <div className="text-[11px] font-black text-slate-700 dark:text-slate-200 uppercase">{agency?.agencyType}</div>
                    </div>
                </div>
            </div>

            {/* Content Card */}
            <div className="flex-1 bg-white dark:bg-slate-900/50 backdrop-blur-3xl rounded-[32px] border border-slate-100 dark:border-white/5 overflow-hidden shadow-sm flex flex-col min-h-0">
                {/* Tabs */}
                <div className="px-8 pt-6 flex items-center gap-8 border-b border-slate-50 dark:border-white/5 shrink-0">
                    {['users', 'roles', 'config'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`relative pb-4 text-[11px] font-black uppercase tracking-widest transition-all ${
                                activeTab === tab 
                                ? 'text-primary' 
                                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                            }`}
                        >
                            {tab}
                            {activeTab === tab && (
                                <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full" />
                            )}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <div className="flex-1 overflow-hidden p-8 flex flex-col min-h-0">
                    {activeTab === 'users' ? (
                        <div className="flex-1 flex flex-col min-h-0 space-y-4">
                            <div className="flex items-center justify-between shrink-0">
                                <div className="flex items-center gap-3">
                                    <div className="size-8 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
                                        <span className="material-icons-round text-primary text-sm">groups</span>
                                    </div>
                                    <h3 className="text-[12px] font-black text-slate-800 dark:text-white uppercase tracking-tight">Agency Users</h3>
                                    <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-md text-[10px] font-bold text-slate-500 uppercase">{totalCount}</span>
                                </div>
                                <button className="h-10 px-6 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-primary/20">
                                    <span className="material-icons-round text-base">person_add</span>
                                    New User
                                </button>
                            </div>

                            {/* Filters */}
                            <div className="flex flex-wrap items-center gap-4 bg-white/50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-white/5 shadow-sm shrink-0">
                                <div className="flex items-center gap-4 flex-1 min-w-[300px]">
                                    <div className="relative flex-1">
                                        <span className="material-icons-round absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">search</span>
                                        <input 
                                            type="text" 
                                            placeholder="Search by name or email..." 
                                            value={filters.query} 
                                            onChange={(e) => setFilters(prev => ({ ...prev, query: e.target.value, page: 0 }))} 
                                            className="w-full h-11 bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700 rounded-2xl pl-12 pr-4 text-xs font-semibold outline-none focus:border-primary transition-all" 
                                        />
                                    </div>
                                    <select 
                                        value={filters.roleIds[0] || ''} 
                                        onChange={(e) => setFilters(prev => ({ ...prev, roleIds: e.target.value ? [parseInt(e.target.value)] : [], page: 0 }))} 
                                        className="h-11 px-4 bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700 rounded-2xl text-xs font-bold outline-none cursor-pointer hover:border-primary transition-colors min-w-[140px]"
                                    >
                                        <option value="">All Roles</option>
                                        {roles.map(r => <option key={r.id} value={r.id}>{r.roleName || r.name}</option>)}
                                    </select>
                                    <select 
                                        value={filters.status} 
                                        onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value, page: 0 }))} 
                                        className="h-11 px-4 bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700 rounded-2xl text-xs font-bold outline-none cursor-pointer hover:border-primary transition-colors min-w-[110px]"
                                    >
                                        <option value="ACTIVE">Active</option>
                                        <option value="PASSIVE">Passive</option>
                                    </select>
                                </div>
                                <div className="flex items-center gap-2 ml-auto">
                                    <button 
                                        onClick={() => fetchUsers()} 
                                        className={`size-11 flex items-center justify-center bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl hover:bg-slate-50 transition-all text-slate-500 shadow-sm ${isLoading ? 'animate-spin opacity-50' : ''}`}
                                    >
                                        <span className="material-icons-round text-lg">refresh</span>
                                    </button>
                                </div>
                            </div>

                            <div className="flex-1 border border-slate-50 dark:border-white/5 rounded-[24px] overflow-hidden flex flex-col bg-slate-50/20 dark:bg-black/20">
                                <div className="flex-1 overflow-y-auto custom-scrollbar">
                                    <table className="w-full text-left">
                                        <thead className="sticky top-0 bg-white dark:bg-slate-900 z-10 shadow-sm">
                                            <tr>
                                                <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">User Information</th>
                                                <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Contact Details</th>
                                                <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Assigned Roles</th>
                                                <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest w-24 text-center">Status</th>
                                                <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                            {isLoading ? (
                                                [...Array(3)].map((_, i) => (
                                                    <tr key={i} className="animate-pulse">
                                                        <td colSpan="5" className="px-6 py-6"><div className="h-12 bg-slate-100 dark:bg-slate-800/50 rounded-2xl" /></td>
                                                    </tr>
                                                ))
                                            ) : users.length > 0 ? (
                                                users.map((user) => (
                                                    <tr key={user.id} className="group hover:bg-white dark:hover:bg-white/[0.03] transition-colors">
                                                        <td className="px-6 py-4">
                                                            <div className="flex flex-col">
                                                                <span className="text-[12px] font-black text-slate-900 dark:text-white uppercase tracking-tight leading-none mb-1">
                                                                    {user.name} {user.surname}
                                                                </span>
                                                                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">ID: #{user.id}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex flex-col">
                                                                <div className="flex items-center gap-2 mb-0.5">
                                                                    <span className="material-icons-round text-slate-300 text-sm">alternate_email</span>
                                                                    <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 tracking-tight">{user.email}</span>
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <span className="material-icons-round text-slate-300 text-sm">phone</span>
                                                                    <span className="text-[10px] font-bold text-slate-400 tracking-tight">+{user.phoneCountryCode} {user.phoneNumber}</span>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex flex-wrap gap-1.5">
                                                                {user.roles?.map(role => (
                                                                    <span key={role.id} className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800/50 text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase rounded-lg border border-slate-200 dark:border-white/5">
                                                                        {role.roleName}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex flex-col items-center gap-1 group/status">
                                                                <div 
                                                                    onClick={() => handleStatusToggle(user)}
                                                                    className={`relative inline-flex h-4.5 w-9 items-center rounded-full transition-all cursor-pointer shadow-sm hover:scale-110 active:scale-95 duration-300 ${
                                                                        user.status === 'ACTIVE' 
                                                                        ? 'bg-emerald-500 shadow-md shadow-emerald-500/20' 
                                                                        : 'bg-slate-200 dark:bg-slate-800'
                                                                    }`}
                                                                >
                                                                    <span 
                                                                        className={`inline-block size-3 transform rounded-full bg-white shadow-sm transition-all duration-300 ${
                                                                            user.status === 'ACTIVE' ? 'translate-x-[22px]' : 'translate-x-0.5'
                                                                        }`} 
                                                                    />
                                                                </div>
                                                                <span className={`text-[9px] font-black uppercase tracking-widest transition-colors duration-300 ${
                                                                    user.status === 'ACTIVE' ? 'text-emerald-500' : 'text-slate-400'
                                                                }`}>
                                                                    {user.status === 'ACTIVE' ? 'Active' : 'Passive'}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            <div className="flex items-center justify-end gap-1 px-4">
                                                                <button 
                                                                    onClick={() => setRoleModal({ isOpen: true, user })}
                                                                    className="size-9 rounded-xl flex items-center justify-center text-slate-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 hover:text-emerald-500 active:scale-90 transition-all" 
                                                                    title="Assign Role"
                                                                >
                                                                    <span className="material-icons-round text-lg">admin_panel_settings</span>
                                                                </button>
                                                                <button 
                                                                    onClick={() => setEditModal({ isOpen: true, user })}
                                                                    className="size-9 rounded-xl flex items-center justify-center text-slate-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-500 active:scale-90 transition-all" 
                                                                    title="Edit User"
                                                                >
                                                                    <span className="material-icons-round text-lg">edit</span>
                                                                </button>
                                                                <button 
                                                                    onClick={() => setDeleteConfirm({ isOpen: true, user, isLoading: false })}
                                                                    className="size-9 rounded-xl flex items-center justify-center text-slate-400 hover:bg-rose-50 dark:hover:bg-rose-900/30 hover:text-rose-500 active:scale-90 transition-all" 
                                                                    title="Delete User"
                                                                >
                                                                    <span className="material-icons-round text-lg">delete_outline</span>
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan="5" className="py-24 text-center">
                                                        <div className="flex flex-col items-center gap-3 text-slate-300">
                                                            <div className="size-16 bg-slate-50 dark:bg-slate-800/50 rounded-3xl flex items-center justify-center">
                                                                <span className="material-icons-round text-4xl opacity-30">person_off</span>
                                                            </div>
                                                            <span className="text-[11px] font-black uppercase tracking-[0.2em] opacity-60">No agency users found</span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Pagination */}
                                <div className="px-8 py-5 border-t border-slate-100 dark:border-white/5 flex items-center justify-between bg-white/50 dark:bg-slate-900/50 backdrop-blur shrink-0">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{totalCount} Members Found</span>
                                    <div className="flex items-center gap-3">
                                        <button 
                                            disabled={filters.page === 0}
                                            onClick={() => setFilters(prev => ({ ...prev, page: prev.page - 1 }))}
                                            className="h-10 px-4 rounded-xl border border-slate-100 dark:border-white/5 flex items-center gap-2 text-slate-400 disabled:opacity-20 hover:bg-white dark:hover:bg-slate-800 transition-all shadow-sm active:scale-95"
                                        >
                                            <span className="material-icons-round text-lg">chevron_left</span>
                                            <span className="text-[10px] font-black uppercase">Prev</span>
                                        </button>
                                        <button 
                                            disabled={users.length < filters.size}
                                            onClick={() => setFilters(prev => ({ ...prev, page: prev.page + 1 }))}
                                            className="h-10 px-4 rounded-xl border border-slate-100 dark:border-white/5 flex items-center gap-2 text-slate-400 disabled:opacity-20 hover:bg-white dark:hover:bg-slate-800 transition-all shadow-sm active:scale-95"
                                        >
                                            <span className="text-[10px] font-black uppercase">Next</span>
                                            <span className="material-icons-round text-lg">chevron_right</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center space-y-6">
                            <div className="size-24 bg-white dark:bg-slate-900 rounded-[40px] flex items-center justify-center border border-slate-100 dark:border-white/5 shadow-xl text-slate-200">
                                <span className="material-icons-round text-5xl">construction</span>
                            </div>
                            <div className="text-center">
                                <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tighter">{activeTab} Interface</h3>
                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-2 max-w-xs">This section is currently being architected for maximum performance and premium features.</p>
                            </div>
                        </div>
                    )}
                </div>
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
                title="Delete User"
                message={`Are you sure you want to delete ${deleteConfirm.user?.name}? This action cannot be undone.`}
                confirmText="Yes, Delete"
                cancelText="Keep User"
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
