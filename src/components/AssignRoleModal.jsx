import React, { useState, useEffect } from 'react';
import { agencyService } from '../services/agencyService';
import { useToast } from '../context/ToastContext';

const AssignRoleModal = ({ isOpen, onClose, user, roles, onUpdate }) => {
    const toast = useToast();
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
            toast.error(error.message || 'Failed to assign roles');
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
            <div 
                className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200" 
                onClick={onClose} 
            />
            
            <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-white/10 overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="px-5 py-4 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
                    <div>
                        <h2 className="text-base font-semibold text-slate-900 dark:text-white leading-none mb-1">
                            Assign Roles
                        </h2>
                        <p className="text-[11px] font-medium text-slate-400">
                            Managing permissions for {user?.name}
                        </p>
                    </div>
                    <button 
                        onClick={onClose}
                        className="size-7 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-white transition-all"
                    >
                        <span className="material-icons-round text-lg">close</span>
                    </button>
                </div>

                {/* Role List */}
                <div className="p-4 max-h-[50vh] overflow-y-auto custom-scrollbar">
                    <div className="grid grid-cols-1 gap-2">
                        {roles.map((role) => {
                            const isSelected = selectedRoleIds.includes(role.id);
                            return (
                                <button
                                    key={role.id}
                                    type="button"
                                    onClick={() => toggleRole(role.id)}
                                    className={`w-full px-3 py-2.5 rounded-lg border text-left transition-all flex items-center justify-between group ${
                                        isSelected 
                                            ? 'border-primary bg-primary/5 dark:bg-primary/10' 
                                            : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                                    }`}
                                >
                                    <div className="flex items-center gap-2.5">
                                        <div className={`size-7 rounded-md flex items-center justify-center transition-all ${
                                            isSelected ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                                        }`}>
                                            <span className="material-icons-round text-base">
                                                {isSelected ? 'verified_user' : 'security'}
                                            </span>
                                        </div>
                                        <div>
                                            <p className={`text-xs font-semibold ${isSelected ? 'text-primary' : 'text-slate-700 dark:text-slate-300'}`}>
                                                {role.roleName || role.name}
                                            </p>
                                            <p className="text-[10px] text-slate-400 font-medium">
                                                ID: {role.id}
                                            </p>
                                        </div>
                                    </div>
                                    <div className={`size-4 rounded-full border flex items-center justify-center transition-all ${
                                        isSelected 
                                            ? 'border-primary bg-primary text-white' 
                                            : 'border-slate-300 dark:border-slate-700'
                                    }`}>
                                        {isSelected && <span className="material-icons-round text-[10px]">check</span>}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Footer */}
                <div className="px-5 py-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-end gap-2 bg-slate-50/50 dark:bg-slate-900/40">
                    <button 
                        onClick={onClose}
                        className="h-8 px-4 rounded-lg text-xs font-medium text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={handleSave}
                        disabled={isSaving}
                        className="h-8 px-4 bg-primary text-white rounded-lg text-xs font-semibold shadow-xs hover:bg-primary/90 active:scale-95 transition-all flex items-center gap-1.5"
                    >
                        {isSaving ? (
                            <div className="size-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <span className="material-icons-round text-base">save</span>
                        )}
                        Update Permissions
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AssignRoleModal;
