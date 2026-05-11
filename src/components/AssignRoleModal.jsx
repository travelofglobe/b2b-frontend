import React, { useState, useEffect } from 'react';
import { agencyService } from '../services/agencyService';

const AssignRoleModal = ({ isOpen, onClose, user, roles, onUpdate }) => {
    const [selectedRoleIds, setSelectedRoleIds] = useState([]);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (user && user.roles) {
            setSelectedRoleIds(user.roles.map(r => r.id));
        } else {
            setSelectedRoleIds([]);
        }
    }, [user]);

    const toggleRole = (roleId) => {
        setSelectedRoleIds(prev => 
            prev.includes(roleId) 
                ? prev.filter(id => id !== roleId) 
                : [...prev, roleId]
        );
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await agencyService.assignSubAgencyRole({
                agencyUserId: user.id,
                roleIds: selectedRoleIds
            });
            onUpdate();
            onClose();
        } catch (error) {
            console.error('Error assigning roles:', error);
            alert('Failed to assign roles');
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
            <div 
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300" 
                onClick={onClose} 
            />
            
            <div className="relative w-full max-w-md bg-white dark:bg-[#0B1120] rounded-[32px] shadow-2xl border border-slate-100 dark:border-white/5 overflow-hidden animate-in zoom-in-95 duration-300">
                {/* Header */}
                <div className="p-8 border-b border-slate-50 dark:border-white/5 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight leading-none mb-1">
                            Assign Roles
                        </h2>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            Managing permissions for {user?.name}
                        </p>
                    </div>
                    <button 
                        onClick={onClose}
                        className="size-10 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all shadow-sm active:scale-90"
                    >
                        <span className="material-icons-round">close</span>
                    </button>
                </div>

                {/* Role List */}
                <div className="p-8 max-h-[60vh] overflow-y-auto custom-scrollbar">
                    <div className="grid grid-cols-1 gap-3">
                        {roles.map((role) => {
                            const isSelected = selectedRoleIds.includes(role.id);
                            return (
                                <button
                                    key={role.id}
                                    type="button"
                                    onClick={() => toggleRole(role.id)}
                                    className={`w-full p-4 rounded-2xl border-2 text-left transition-all flex items-center justify-between group ${
                                        isSelected 
                                            ? 'border-primary bg-primary/5 dark:bg-primary/10' 
                                            : 'border-slate-50 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30'
                                    }`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`size-10 rounded-xl flex items-center justify-center transition-all ${
                                            isSelected ? 'bg-primary text-white' : 'bg-white dark:bg-slate-700 text-slate-400 group-hover:text-slate-600'
                                        }`}>
                                            <span className="material-icons-round text-xl">
                                                {isSelected ? 'verified_user' : 'security'}
                                            </span>
                                        </div>
                                        <div>
                                            <p className={`text-sm font-bold ${isSelected ? 'text-primary' : 'text-slate-700 dark:text-slate-300'}`}>
                                                {role.roleName || role.name}
                                            </p>
                                            <p className="text-[10px] text-slate-400 font-medium italic">
                                                Role ID: {role.id}
                                            </p>
                                        </div>
                                    </div>
                                    <div className={`size-6 rounded-full border-2 flex items-center justify-center transition-all ${
                                        isSelected 
                                            ? 'border-primary bg-primary' 
                                            : 'border-slate-200 dark:border-slate-700'
                                    }`}>
                                        {isSelected && <span className="material-icons-round text-white text-sm">check</span>}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-8 border-t border-slate-50 dark:border-white/5 flex items-center gap-3 bg-slate-50/30 dark:bg-transparent">
                    <button 
                        onClick={onClose}
                        className="flex-1 h-12 rounded-2xl text-[11px] font-black text-slate-400 uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex-[2] h-12 bg-primary text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                        {isSaving ? (
                            <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <span className="material-icons-round text-lg">save</span>
                        )}
                        Update Permissions
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AssignRoleModal;
