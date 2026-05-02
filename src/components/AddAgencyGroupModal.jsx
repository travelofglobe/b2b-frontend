import React, { useState, useEffect } from 'react';
import { agencyService } from '../services/agencyService';
import { agencyGroupService } from '../services/agencyGroupService';

const AddAgencyGroupModal = ({ isOpen, onClose, onSuccess, initialData = null, mode = 'add' }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [isFetchingAgencies, setIsFetchingAgencies] = useState(false);
    const [error, setError] = useState(null);
    const [availableAgencies, setAvailableAgencies] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    
    const [form, setForm] = useState({
        name: '',
        description: '',
        agencyIds: []
    });

    useEffect(() => {
        if (isOpen) {
            if (mode === 'edit' && initialData) {
                setForm({
                    name: initialData.name,
                    description: initialData.description,
                    agencyIds: initialData.agencies?.map(a => a.id) || []
                });
            } else {
                setForm({ name: '', description: '', agencyIds: [] });
            }
            setError(null);
            fetchAvailableAgencies();
        }
    }, [isOpen, initialData, mode]);

    const fetchAvailableAgencies = async () => {
        setIsFetchingAgencies(true);
        try {
            // Fetch all ACTIVE agencies for selection
            const response = await agencyService.filterAgencies({ status: 'ACTIVE', size: 1000 });
            if (response && response.agencyList) {
                setAvailableAgencies(response.agencyList);
            }
        } catch (err) {
            console.error('Error fetching agencies for selection:', err);
        } finally {
            setIsFetchingAgencies(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const toggleAgency = (id) => {
        setForm(prev => {
            const isSelected = prev.agencyIds.includes(id);
            if (isSelected) {
                return { ...prev, agencyIds: prev.agencyIds.filter(aId => aId !== id) };
            } else {
                return { ...prev, agencyIds: [...prev.agencyIds, id] };
            }
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (form.agencyIds.length === 0) {
            setError('Please select at least one agency.');
            return;
        }
        
        setIsLoading(true);
        setError(null);
        try {
            const payload = {
                ...form,
                status: mode === 'edit' ? initialData.status : 'ACTIVE'
            };

            if (mode === 'edit') {
                await agencyGroupService.updateGroup(initialData.id, payload);
            } else {
                await agencyGroupService.createGroup(payload);
            }
            onSuccess();
            onClose();
        } catch (err) {
            console.error('Error saving agency group:', err);
            setError(err.message || 'An error occurred while saving the group.');
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    const filteredAgencies = availableAgencies.filter(agency => 
        agency.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-hidden">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity" onClick={onClose} />

            <div className="relative bg-white dark:bg-[#0B1120] w-full max-w-2xl max-h-[90vh] rounded-[40px] shadow-2xl flex flex-col border border-slate-100 dark:border-white/5 animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
                
                {/* Header */}
                <div className="p-8 border-b border-slate-50 dark:border-white/5 flex items-center justify-between shrink-0">
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-none mb-2">
                            {mode === 'edit' ? 'Update Agency Group' : 'Create Agency Group'}
                        </h2>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                            Manage agency clusters and permissions
                        </p>
                    </div>
                    <button 
                        onClick={onClose}
                        className="size-10 rounded-2xl bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all hover:scale-110 active:scale-95 shadow-sm"
                    >
                        <span className="material-icons-round">close</span>
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    <form id="group-form" onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-2xl text-[11px] font-bold text-red-500 flex items-center gap-3">
                                <span className="material-icons-round text-lg">error_outline</span>
                                {error}
                            </div>
                        )}

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Group Name</label>
                            <input 
                                required name="name" value={form.name} onChange={handleChange}
                                placeholder="e.g. European Partners"
                                className="w-full h-12 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-white/10 focus:border-primary rounded-2xl px-5 text-[12px] font-bold outline-none transition-all shadow-sm"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Description</label>
                            <textarea 
                                name="description" value={form.description} onChange={handleChange}
                                placeholder="Details about this group..."
                                className="w-full h-24 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-white/10 focus:border-primary rounded-2xl p-5 text-[12px] font-bold outline-none transition-all shadow-sm resize-none"
                            />
                        </div>

                        {/* Agency Selector */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Select Agencies ({form.agencyIds.length})</label>
                                <div className="text-[10px] font-bold text-primary dark:text-blue-400">Status: ACTIVE ONLY</div>
                            </div>
                            
                            <div className="relative group">
                                <span className="material-icons-round absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
                                <input 
                                    type="text" 
                                    placeholder="Search agencies..." 
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full h-11 bg-white dark:bg-slate-900/50 border border-slate-100 dark:border-white/5 rounded-2xl pl-12 pr-4 text-[11px] font-semibold outline-none focus:border-primary transition-all shadow-sm"
                                />
                            </div>

                            <div className="border border-slate-100 dark:border-white/5 rounded-[24px] overflow-hidden bg-slate-50/50 dark:bg-slate-950/30">
                                <div className="max-h-[240px] overflow-y-auto custom-scrollbar">
                                    {isFetchingAgencies ? (
                                        <div className="p-8 text-center"><div className="size-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto"></div></div>
                                    ) : filteredAgencies.length > 0 ? (
                                        <div className="grid grid-cols-1 divide-y divide-slate-100 dark:divide-white/5">
                                            {filteredAgencies.map(agency => (
                                                <div 
                                                    key={agency.id}
                                                    onClick={() => toggleAgency(agency.id)}
                                                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-white dark:hover:bg-white/5 transition-colors group"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className={`size-5 rounded-lg border-2 flex items-center justify-center transition-all ${form.agencyIds.includes(agency.id) ? 'bg-primary border-primary text-white' : 'border-slate-300 dark:border-slate-700'}`}>
                                                            {form.agencyIds.includes(agency.id) && <span className="material-icons-round text-sm">check</span>}
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="text-[11px] font-black text-slate-700 dark:text-slate-200 uppercase tracking-tight">{agency.name}</span>
                                                            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">{agency.countryName} | {agency.cityName}</span>
                                                        </div>
                                                    </div>
                                                    <span className="text-[9px] font-black text-slate-400 group-hover:text-primary transition-colors">ID: {agency.id}</span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="p-10 text-center text-slate-400">
                                            <span className="material-icons-round text-3xl mb-2">person_search</span>
                                            <p className="text-[10px] font-bold uppercase tracking-widest leading-relaxed">No active agencies found matching your search</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </form>
                </div>

                {/* Footer */}
                <div className="p-8 border-t border-slate-50 dark:border-white/5 flex items-center justify-end gap-4 shrink-0 bg-white dark:bg-[#0B1120]/80 backdrop-blur-md">
                    <button 
                        onClick={onClose}
                        className="h-14 px-8 rounded-2xl text-[12px] font-black text-slate-500 uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-800 transition-all active:scale-95"
                    >
                        Cancel
                    </button>
                    <button 
                        type="submit" form="group-form" disabled={isLoading}
                        className="h-14 px-10 bg-primary text-white rounded-2xl text-[12px] font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 disabled:opacity-50 transition-all flex items-center gap-3"
                    >
                        {isLoading ? (
                            <div className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : (
                            <>
                                <span className="material-icons-round text-xl">{mode === 'edit' ? 'save' : 'add'}</span>
                                {mode === 'edit' ? 'Save Changes' : 'Create Group'}
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AddAgencyGroupModal;
