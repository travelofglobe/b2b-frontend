import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const MarkupManagement = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [markups, setMarkups] = useState([
        { id: 1, name: 'Standard Markup', priority: 3, value: '12%', status: 'PASSIVE', updatedBy: 'Jane Smith' },
        { id: 2, name: 'Summer Special', priority: 1, value: '23%', status: 'ACTIVE', updatedBy: 'Mike Johnson' },
        { id: 5, name: 'Early Bird', priority: 4, value: '25%', status: 'PASSIVE', updatedBy: 'Jane Smith' },
        { id: 6, name: 'Peak Season', priority: 1, value: '13%', status: 'ACTIVE', updatedBy: 'Mike Johnson' },
        { id: 8, name: 'Group Rate', priority: 4, value: '20%', status: 'ACTIVE', updatedBy: 'Mike Johnson' },
        { id: 12, name: 'Business Class', priority: 5, value: '16%', status: 'PASSIVE', updatedBy: 'Mike Johnson' },
        { id: 13, name: 'Family Package', priority: 3, value: '26%', status: 'ACTIVE', updatedBy: 'Mike Johnson' },
        { id: 16, name: 'Student Rate', priority: 3, value: '24%', status: 'ACTIVE', updatedBy: 'Mike Johnson' },
        { id: 18, name: 'Seasonal Offer', priority: 5, value: '21%', status: 'ACTIVE', updatedBy: 'Mike Johnson' },
        { id: 19, name: 'VIP Rate', priority: 4, value: '12%', status: 'ACTIVE', updatedBy: 'Jane Smith' },
    ]);
    const [filters, setFilters] = useState({ query: '', status: '' });
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

    const showNotification = (message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 4000);
    };

    const handleToggleStatus = (id) => {
        setMarkups(prev => prev.map(m => m.id === id ? { ...m, status: m.status === 'ACTIVE' ? 'PASSIVE' : 'ACTIVE' } : m));
        showNotification('Markup status updated');
    };

    const handleDeleteMarkup = (id) => {
        if (window.confirm('Are you sure you want to delete this markup rule?')) {
            setMarkups(prev => prev.filter(m => m.id !== id));
            showNotification('Markup rule deleted', 'success');
        }
    };

    return (
        <div className="h-full flex flex-col p-8 space-y-6 overflow-hidden">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight leading-none mb-2">Markup Management</h1>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Define and manage pricing rules</p>
                </div>
            </div>

            {/* Filter Section */}
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-4 flex-1">
                    <div className="relative flex-1 max-w-sm">
                        <span className="material-icons-round absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
                        <input 
                            type="text" 
                            placeholder="Search by name or ID..." 
                            value={filters.query}
                            onChange={(e) => setFilters(prev => ({ ...prev, query: e.target.value }))}
                            className="w-full h-11 bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 rounded-2xl pl-12 pr-4 text-[11px] font-semibold outline-none focus:border-primary transition-colors shadow-sm" 
                        />
                    </div>
                    <select 
                        value={filters.status}
                        onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                        className="h-11 px-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 rounded-2xl text-[11px] font-bold outline-none cursor-pointer shadow-sm focus:border-primary transition-all underline-offset-4"
                    >
                        <option value="">All Status</option>
                        <option value="ACTIVE">Active</option>
                        <option value="PASSIVE">Passive</option>
                    </select>
                </div>
                <button className="h-11 px-6 bg-primary text-white rounded-2xl text-[11px] font-bold shadow-lg shadow-primary/20 flex items-center gap-2 active:scale-95 transition-all">
                    <span className="material-icons-round text-lg">add</span>
                    Create Markup
                </button>
            </div>

            {/* Main Content Area - Table Card */}
            <div className="flex-1 bg-white dark:bg-slate-900/50 backdrop-blur-3xl rounded-[40px] border border-slate-100 dark:border-white/5 overflow-hidden shadow-sm flex flex-col">
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-slate-50 dark:border-white/5">
                                <th className="px-4 py-4 text-[9px] font-bold text-slate-400 uppercase tracking-widest text center w-20">ID</th>
                                <th className="px-4 py-4 text-[9px] font-bold text-slate-400 uppercase tracking-widest">Name</th>
                                <th className="px-4 py-4 text-[9px] font-bold text-slate-400 uppercase tracking-widest text-center w-32">Priority</th>
                                <th className="px-4 py-4 text-[9px] font-bold text-slate-400 uppercase tracking-widest text-center w-32">Value</th>
                                <th className="px-4 py-4 text-[9px] font-bold text-slate-400 uppercase tracking-widest text-center w-32">Status</th>
                                <th className="px-4 py-4 text-[9px] font-bold text-slate-400 uppercase tracking-widest">Updated By</th>
                                <th className="px-4 py-4 text-[9px] font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 dark:divide-white/5">
                            {markups.map((m) => (
                                <tr key={m.id} className="group hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors">
                                    <td className="px-4 py-5 text-[11px] font-bold text-slate-400">#{m.id}</td>
                                    <td className="px-4 py-5 font-bold text-slate-800 dark:text-white text-[12px]">{m.name}</td>
                                    <td className="px-4 py-5 text-center font-bold text-slate-600 dark:text-slate-400 text-[11px]">{m.priority}</td>
                                    <td className="px-4 py-5 text-center font-black text-slate-900 dark:text-white text-[12px]">{m.value}</td>
                                    <td className="px-4 py-5">
                                        <div className="flex justify-center">
                                            <button 
                                                onClick={() => handleToggleStatus(m.id)}
                                                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${m.status === 'ACTIVE' ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-700'}`}
                                            >
                                                <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${m.status === 'ACTIVE' ? 'translate-x-5' : 'translate-x-1'}`} />
                                            </button>
                                        </div>
                                    </td>
                                    <td className="px-4 py-5 font-bold text-slate-500 dark:text-slate-400 text-[10px] uppercase tracking-wider">{m.updatedBy}</td>
                                    <td className="px-4 py-5 text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <button className="size-8 rounded-xl flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-primary transition-all active:scale-90">
                                                <span className="material-icons-round text-lg">edit</span>
                                            </button>
                                            <button 
                                                onClick={() => handleDeleteMarkup(m.id)}
                                                className="size-8 rounded-xl flex items-center justify-center text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 transition-all active:scale-90"
                                            >
                                                <span className="material-icons-round text-lg">delete_outline</span>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Footer Section - Pagination */}
                <div className="px-8 py-5 border-t border-slate-50 dark:border-white/5 flex items-center justify-between bg-slate-50/30 dark:bg-transparent">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                        Showing 1 to 10 of 12 rules
                    </p>
                    <div className="flex items-center gap-2">
                        <button className="h-8 px-4 rounded-xl text-[9px] font-bold uppercase tracking-widest text-slate-400 hover:bg-white dark:hover:bg-slate-800 transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-700">
                            Previous
                        </button>
                        <div className="flex items-center gap-1">
                            <button className="size-8 rounded-xl bg-primary text-white text-[10px] font-bold shadow-lg shadow-primary/20">1</button>
                            <button className="size-8 rounded-xl text-slate-400 text-[10px] font-bold hover:bg-white dark:hover:bg-slate-800 transition-all">2</button>
                        </div>
                        <button className="h-8 px-4 rounded-xl text-[9px] font-bold uppercase tracking-widest text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 transition-all border border-slate-200 dark:border-slate-700">
                            Next
                        </button>
                    </div>
                </div>
            </div>

            {/* Notification Toast */}
            {toast.show && (
                <div className={`fixed bottom-8 right-8 z-[50000] flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl animate-in slide-in-from-right-10 duration-300 ${toast.type === 'error' ? 'bg-red-500 text-white' : 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'}`}>
                    <span className="material-icons-round text-xl">{toast.type === 'error' ? 'error_outline' : 'check_circle_outline'}</span>
                    <p className="text-sm font-bold">{toast.message}</p>
                </div>
            )}
        </div>
    );
};

export default MarkupManagement;
