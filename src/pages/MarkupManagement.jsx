import React, { useState, useEffect, useCallback } from 'react';
import { markupService } from '../services/markupService';
import AgencyMultiSelect from '../components/AgencyMultiSelect';
import ConfirmModal from '../components/ConfirmModal';
import AddMarkupModal from '../components/AddMarkupModal';

const MarkupManagement = () => {
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
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

    const showNotification = (message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 4000);
    };

    const fetchMarkups = useCallback(async () => {
        setLoading(true);
        try {
            const params = {
                ...filters,
                query: filters.query || undefined,
                status: filters.status || undefined,
                agencyIds: filters.agencyIds.length > 0 ? filters.agencyIds : undefined
            };
            const response = await markupService.filterMarkups(params);
            if (response && response.markups) {
                setMarkups(response.markups);
                setTotalItems(response.numberOfItems || 0);
                setTotalPages(response.numberOfPages || 0);
            } else {
                setMarkups([]);
                setTotalItems(0);
                setTotalPages(0);
            }
        } catch (error) {
            console.error("Error fetching markups:", error);
            showNotification("Failed to load markups", "error");
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        fetchMarkups();
    }, [fetchMarkups]);

    const handleFilterChange = (field, value) => {
        setFilters(prev => ({ ...prev, [field]: value, page: 0 }));
    };

    const handlePageChange = (newPage) => {
        setFilters(prev => ({ ...prev, page: newPage }));
    };

    const handleToggleStatus = async (markup) => {
        const newStatus = markup.status === 'ACTIVE' ? 'PASSIVE' : 'ACTIVE';
        try {
            await markupService.updateStatus(markup.id, newStatus);
            showNotification(`Markup marked as ${newStatus}`);
            fetchMarkups();
        } catch (error) {
            showNotification("Failed to update status", "error");
        }
    };

    const handleDeleteMarkup = (markup) => {
        setDeleteModal({ show: true, id: markup.id, name: markup.name, isDeleting: false });
    };

    const confirmDelete = async () => {
        try {
            setDeleteModal(prev => ({ ...prev, isDeleting: true }));
            await markupService.deleteMarkup(deleteModal.id);
            showNotification('Markup rule deleted successfully');
            fetchMarkups();
            setDeleteModal({ show: false, id: null, name: '', isDeleting: false });
        } catch (error) {
            showNotification("Failed to delete markup", "error");
            setDeleteModal(prev => ({ ...prev, isDeleting: false }));
        }
    };

    return (
        <div className="h-full flex flex-col p-8 space-y-6 overflow-hidden">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight leading-none mb-2 underline decoration-primary/20 decoration-4 underline-offset-8">Markup Management</h1>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-3">Define and manage pricing rules for hotels and agencies</p>
                </div>
            </div>

            {/* Filter Section */}
            <div className="relative z-[60] bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl p-5 rounded-[32px] border border-slate-200/50 dark:border-white/5">
                <div className="flex flex-wrap items-center gap-4">
                    <div className="relative flex-[2] min-w-[200px]">
                        <span className="material-icons-round absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
                        <input 
                            type="text" 
                            placeholder="Rule name, ID..." 
                            value={filters.query}
                            onChange={(e) => handleFilterChange('query', e.target.value)}
                            className="w-full h-11 bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/5 rounded-2xl pl-12 pr-4 text-[11px] font-bold outline-none focus:border-primary transition-all" 
                        />
                    </div>
                    
                    <div className="flex-[1] min-w-[150px]">
                        <AgencyMultiSelect 
                            selectedValues={filters.agencyIds}
                            onChange={(values) => handleFilterChange('agencyIds', values)}
                        />
                    </div>

                    <select 
                        value={filters.status}
                        onChange={(e) => handleFilterChange('status', e.target.value)}
                        className="h-11 px-6 bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/5 rounded-2xl text-[10px] font-black uppercase tracking-tight outline-none cursor-pointer focus:border-primary transition-all"
                    >
                        <option value="">All Rules</option>
                        <option value="ACTIVE">Active</option>
                        <option value="PASSIVE">Passive</option>
                    </select>

                    <button 
                        onClick={fetchMarkups}
                        className={`size-11 flex items-center justify-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl hover:bg-slate-50 transition-all text-slate-500 shadow-sm ${loading ? 'animate-spin opacity-50 pointer-events-none' : ''}`}
                    >
                        <span className="material-icons-round text-lg">refresh</span>
                    </button>

                    <button 
                        onClick={() => setIsAddModalOpen(true)}
                        className="h-11 ml-auto px-8 bg-primary text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow-primary/20 flex items-center gap-2 hover:scale-[1.02] active:scale-95 transition-all"
                    >
                        <span className="material-icons-round text-lg">add</span>
                        New Rule
                    </button>
                </div>
            </div>

            {/* Main Content Area - Table Card */}
            <div className="flex-1 bg-white dark:bg-slate-900/50 backdrop-blur-3xl rounded-[40px] border border-slate-100 dark:border-white/5 overflow-hidden shadow-sm flex flex-col">
                <div className="flex-1 overflow-x-auto overflow-y-auto custom-scrollbar">
                    <table className="w-full text-left border-separate border-spacing-0">
                        <thead>
                            <tr>
                                <th className="sticky top-0 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest w-16 text-center border-b border-slate-50 dark:border-white/5">ID</th>
                                <th className="sticky top-0 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 dark:border-white/5">Markup Rule</th>
                                <th className="sticky top-0 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 dark:border-white/5">Associated Hotels</th>
                                <th className="sticky top-0 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 dark:border-white/5">Agencies / Groups</th>
                                <th className="sticky top-0 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center w-24 border-b border-slate-50 dark:border-white/5">Priority</th>
                                <th className="sticky top-0 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center w-24 border-b border-slate-50 dark:border-white/5">Value</th>
                                <th className="sticky top-0 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center w-24 border-b border-slate-50 dark:border-white/5">Status</th>
                                <th className="sticky top-0 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right border-b border-slate-50 dark:border-white/5">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 dark:divide-white/5">
                            {loading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        {Array(8).fill(0).map((_, j) => (
                                            <td key={j} className="px-4 py-5"><div className="h-4 bg-slate-100 dark:bg-slate-800 rounded-lg w-full"></div></td>
                                        ))}
                                    </tr>
                                ))
                            ) : markups.length > 0 ? markups.map((m) => (
                                <tr key={m.id} className="group hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors">
                                    <td className="px-6 py-5 text-[11px] font-black text-slate-400 text-center">#{m.id}</td>
                                    <td className="px-6 py-5">
                                        <div className="flex flex-col">
                                            <span className="font-black text-slate-800 dark:text-white text-[12px]">{m.name}</span>
                                            <span className="text-[10px] text-slate-400 font-bold tracking-tight mt-0.5">By: {m.updatedBy || m.createdBy}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 w-72">
                                        <div className="flex flex-wrap gap-1.5 items-center">
                                            {m.hotels && m.hotels.length > 0 ? (
                                                <>
                                                    {m.hotels.slice(0, 3).map((h, idx) => (
                                                        <span key={idx} className="px-2 py-1 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg text-[10px] font-bold text-blue-600 dark:text-blue-400 whitespace-nowrap">
                                                            {h.name}
                                                        </span>
                                                    ))}
                                                    {m.hotels.length > 3 && (
                                                        <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-lg text-[10px] font-black">
                                                            +{m.hotels.length - 3}
                                                        </span>
                                                    )}
                                                </>
                                            ) : (
                                                <span className="text-[11px] font-bold text-slate-400 italic tracking-tight">All Hotels</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 w-72">
                                        <div className="flex flex-wrap gap-1.5 items-center">
                                            {m.agencies && m.agencies.length > 0 ? (
                                                <>
                                                    {m.agencies.slice(0, 3).map((a, idx) => (
                                                        <span key={idx} className="px-2 py-1 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 rounded-lg text-[10px] font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                                                            {a.name}
                                                        </span>
                                                    ))}
                                                    {m.agencies.length > 3 && (
                                                        <span className="px-2 py-1 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 rounded-lg text-[10px] font-black">
                                                            +{m.agencies.length - 3}
                                                        </span>
                                                    )}
                                                </>
                                            ) : (
                                                <span className="text-[11px] font-bold text-slate-400 italic tracking-tight">All Agencies</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 text-center">
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black ${m.priority === 1 ? 'bg-rose-50 text-rose-500' : 'bg-blue-50 text-primary'}`}>
                                            {m.priority}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5 text-center">
                                        <div className="flex flex-col items-center">
                                            <span className="font-black text-slate-900 dark:text-white text-[13px]">{m.value}%</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex justify-center">
                                            <button 
                                                onClick={() => handleToggleStatus(m)}
                                                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-all focus:outline-none ${m.status === 'ACTIVE' ? 'bg-emerald-500 shadow-lg shadow-emerald-500/20' : 'bg-slate-200 dark:bg-slate-700'}`}
                                            >
                                                <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${m.status === 'ACTIVE' ? 'translate-x-5' : 'translate-x-1'}`} />
                                            </button>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <button className="size-8 rounded-xl flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-primary transition-all active:scale-90">
                                                <span className="material-icons-round text-lg">edit</span>
                                            </button>
                                            <button 
                                                onClick={() => handleDeleteMarkup(m)}
                                                className="size-8 rounded-xl flex items-center justify-center text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 transition-all active:scale-90"
                                            >
                                                <span className="material-icons-round text-lg">delete_outline</span>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="8" className="px-4 py-20 text-center">
                                        <div className="flex flex-col items-center opacity-40">
                                            <span className="material-icons-round text-5xl mb-4">analytics</span>
                                            <p className="text-sm font-bold uppercase tracking-widest">No markup rules found</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Footer Section - Pagination */}
                <div className="px-8 py-5 border-t border-slate-50 dark:border-white/5 bg-slate-50/20 dark:bg-transparent flex items-center justify-between">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        Showing {totalItems > 0 ? filters.page * filters.size + 1 : 0} to {Math.min((filters.page + 1) * filters.size, totalItems)} of {totalItems} rules
                    </p>
                    <div className="flex items-center gap-2">
                        <button 
                            disabled={filters.page === 0}
                            onClick={() => handlePageChange(filters.page - 1)}
                            className="size-8 rounded-xl border border-slate-100 dark:border-white/5 flex items-center justify-center text-slate-400 disabled:opacity-30 hover:bg-white dark:hover:bg-slate-800 transition-all shadow-sm"
                        >
                            <span className="material-icons-round text-lg">chevron_left</span>
                        </button>
                        
                        <div className="flex items-center gap-1">
                            {[...Array(Math.min(5, totalPages))].map((_, i) => {
                                let pageNum = i;
                                if (totalPages > 5) {
                                    if (filters.page > 2) {
                                        pageNum = Math.min(filters.page - 2 + i, totalPages - 5 + i);
                                    }
                                }
                                return (
                                    <button
                                        key={pageNum}
                                        onClick={() => handlePageChange(pageNum)}
                                        className={`size-8 rounded-xl text-[10px] font-black transition-all ${filters.page === pageNum ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-400 hover:bg-white dark:hover:bg-slate-800'}`}
                                    >
                                        {pageNum + 1}
                                    </button>
                                );
                            })}
                        </div>

                        <button 
                            disabled={filters.page >= totalPages - 1 || totalPages === 0}
                            onClick={() => handlePageChange(filters.page + 1)}
                            className="size-8 rounded-xl border border-slate-100 dark:border-white/5 flex items-center justify-center text-slate-400 disabled:opacity-30 hover:bg-white dark:hover:bg-slate-800 transition-all shadow-sm"
                        >
                            <span className="material-icons-round text-lg">chevron_right</span>
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
                title="Delete Markup"
                message={<span>Are you sure you want to delete the markup rule <b>{deleteModal.name}</b>? This action cannot be undone.</span>}
                confirmText="Yes, Delete Rule"
                cancelText="No, Keep It"
                type="danger"
            />

            <AddMarkupModal 
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onSuccess={() => {
                    showNotification("Markup rule created successfully");
                    fetchMarkups();
                }}
            />
        </div>
    );
};

export default MarkupManagement;
