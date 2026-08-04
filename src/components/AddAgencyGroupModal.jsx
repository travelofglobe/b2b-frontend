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

    const [formErrors, setFormErrors] = useState({});

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
            setFormErrors({});
            fetchAvailableAgencies();
        }
    }, [isOpen, initialData, mode]);

    const fetchAvailableAgencies = async () => {
        setIsFetchingAgencies(true);
        try {
            // Fetch all agencies for selection (both ACTIVE and PASSIVE)
            const response = await agencyService.filterAgencies({ size: 1000 });
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
        // Clear field error when user starts typing
        if (formErrors[name]) {
            setFormErrors(prev => ({ ...prev, [name]: null }));
        }
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
        
        // Validation
        const errors = {};
        if (!form.name.trim()) errors.name = 'Group name is required';
        if (!form.description.trim()) errors.description = 'Description is required';
        
        if (Object.keys(errors).length > 0) {
            setFormErrors(errors);
            return;
        }

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
            <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity" onClick={onClose} />

            <div className="relative bg-white dark:bg-slate-900 w-full max-w-xl max-h-[90vh] rounded-xl shadow-xl flex flex-col border border-slate-200 dark:border-white/10 animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
                
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 dark:border-white/5 flex items-center justify-between shrink-0">
                    <div>
                        <h2 className="text-base font-semibold text-slate-900 dark:text-white leading-none mb-1">
                            {mode === 'edit' ? 'Update Agency Group' : 'Create Agency Group'}
                        </h2>
                        <p className="text-[11px] font-medium text-slate-400">
                            Manage agency clusters and permissions
                        </p>
                    </div>
                    <button 
                        onClick={onClose}
                        className="size-7 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-white transition-all"
                    >
                        <span className="material-icons-round text-lg">close</span>
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                    <form id="group-form" onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-lg text-xs font-semibold text-red-500 flex items-center gap-2">
                                <span className="material-icons-round text-base">error_outline</span>
                                {error}
                            </div>
                        )}

                        <div className="space-y-1">
                            <label className="text-[11px] font-medium text-slate-600 dark:text-slate-300">Group Name *</label>
                            <input 
                                name="name" value={form.name} onChange={handleChange}
                                placeholder="e.g. European Partners"
                                className={`w-full h-9 bg-slate-50 dark:bg-slate-800 border ${formErrors.name ? 'border-rose-500' : 'border-slate-200 dark:border-slate-700'} focus:border-primary rounded-lg px-3 text-xs font-medium outline-none transition-all`}
                            />
                            {formErrors.name && <p className="text-[10px] font-medium text-rose-500">{formErrors.name}</p>}
                        </div>

                        <div className="space-y-1">
                            <label className="text-[11px] font-medium text-slate-600 dark:text-slate-300">Description *</label>
                            <textarea 
                                name="description" value={form.description} onChange={handleChange}
                                placeholder="Details about this group..."
                                className={`w-full h-20 bg-slate-50 dark:bg-slate-800 border ${formErrors.description ? 'border-rose-500' : 'border-slate-200 dark:border-slate-700'} focus:border-primary rounded-lg p-3 text-xs font-medium outline-none transition-all resize-none`}
                            />
                            {formErrors.description && <p className="text-[10px] font-medium text-rose-500">{formErrors.description}</p>}
                        </div>

                        {/* Agency Selector */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="text-[11px] font-medium text-slate-600 dark:text-slate-300">Select Agencies ({form.agencyIds.length})</label>
                                <span className="text-[10px] text-slate-400">All registered agencies</span>
                            </div>
                            
                            <div className="relative">
                                <span className="material-icons-round absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">search</span>
                                <input 
                                    type="text" 
                                    placeholder="Search agencies..." 
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full h-8 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg pl-8 pr-3 text-xs font-medium outline-none focus:border-primary transition-all"
                                />
                            </div>

                            <div className="border border-slate-200 dark:border-white/10 rounded-lg overflow-hidden bg-slate-50/50 dark:bg-slate-900/30">
                                <div className="max-h-[200px] overflow-y-auto custom-scrollbar">
                                    {isFetchingAgencies ? (
                                        <div className="p-6 text-center"><div className="size-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto"></div></div>
                                    ) : filteredAgencies.length > 0 ? (
                                        <div className="divide-y divide-slate-100 dark:divide-white/5">
                                            {filteredAgencies.map(agency => {
                                                const isPassive = agency.status === 'PASSIVE';
                                                const isRsa = agency.agencyType === 'RSA';
                                                
                                                return (
                                                    <div 
                                                        key={agency.id}
                                                        onClick={() => !isPassive && toggleAgency(agency.id)}
                                                        className={`flex items-center justify-between px-3 py-2 transition-colors ${isPassive ? 'opacity-50 cursor-not-allowed bg-slate-100/50 dark:bg-slate-800/20' : 'cursor-pointer hover:bg-white dark:hover:bg-white/5'}`}
                                                    >
                                                        <div className="flex items-center gap-2.5">
                                                            <div className={`size-4 rounded border flex items-center justify-center transition-all ${form.agencyIds.includes(agency.id) ? 'bg-primary border-primary text-white' : 'border-slate-300 dark:border-slate-600'}`}>
                                                                {form.agencyIds.includes(agency.id) && <span className="material-icons-round text-xs">check</span>}
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">{agency.name}</span>
                                                                <span className={`px-1.5 py-0.5 rounded text-[9px] font-semibold ${isRsa ? 'bg-amber-50 text-amber-600 dark:bg-amber-900/30' : 'bg-blue-50 text-blue-600 dark:bg-blue-900/30'}`}>
                                                                    {agency.agencyType || 'AGENCY'}
                                                                </span>
                                                                {isPassive && (
                                                                    <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-400 text-[9px] font-semibold">
                                                                        Passive
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <span className="text-[10px] font-medium text-slate-400">ID: {agency.id}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className="p-8 text-center text-slate-400">
                                            <span className="material-icons-round text-2xl mb-1">person_search</span>
                                            <p className="text-xs font-medium">No agencies found</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </form>
                </div>

                {/* Footer */}
                <div className="px-6 py-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-end gap-2 shrink-0 bg-slate-50/50 dark:bg-slate-900/40">
                    <button 
                        onClick={onClose}
                        className="h-8 px-4 rounded-lg text-xs font-medium text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                    >
                        Cancel
                    </button>
                    <button 
                        type="submit" form="group-form" disabled={isLoading}
                        className="h-8 px-4 bg-primary text-white rounded-lg text-xs font-semibold shadow-xs hover:bg-primary/90 active:scale-95 disabled:opacity-50 transition-all flex items-center gap-1.5"
                    >
                        {isLoading ? (
                            <div className="size-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : (
                            <>
                                <span className="material-icons-round text-base">{mode === 'edit' ? 'save' : 'add'}</span>
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
