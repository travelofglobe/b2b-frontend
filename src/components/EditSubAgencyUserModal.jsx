import React, { useState, useEffect } from 'react';
import { agencyService } from '../services/agencyService';
import PhoneInput from './PhoneInput';
import { useToast } from '../context/ToastContext';

const EditSubAgencyUserModal = ({ isOpen, onClose, user, agency, onUpdate }) => {
    const toast = useToast();
    const isEdit = !!user;
    const [formData, setFormData] = useState({
        name: '',
        surname: '',
        email: '',
        password: '',
        phoneCountryCode: '90',
        phoneNumber: '',
        status: 'ACTIVE',
        agencyId: null
    });
    const [isSaving, setIsSaving] = useState(false);
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (isOpen) {
            if (user) {
                setFormData({
                    name: user.name || '',
                    surname: user.surname || '',
                    email: user.email || '',
                    password: '',
                    phoneCountryCode: user.phoneCountryCode || '90',
                    phoneNumber: user.phoneNumber || '',
                    status: user.status || 'ACTIVE',
                    agencyId: agency?.id
                });
            } else {
                setFormData({
                    name: '',
                    surname: '',
                    email: '',
                    password: '',
                    phoneCountryCode: '90',
                    phoneNumber: '',
                    status: 'ACTIVE',
                    agencyId: agency?.id
                });
            }
            setErrors({});
        }
    }, [isOpen, user, agency]);

    const validate = () => {
        const newErrors = {};
        if (!formData.name) newErrors.name = 'Name is required';
        if (!formData.surname) newErrors.surname = 'Surname is required';
        if (!formData.phoneNumber) newErrors.phoneNumber = 'Phone number is required';
        
        if (!isEdit) {
            if (!formData.email) {
                newErrors.email = 'Email is required';
            } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
                newErrors.email = 'Invalid email address';
            }
            if (!formData.password) {
                newErrors.password = 'Password is required';
            } else if (formData.password.length < 6) {
                newErrors.password = 'Password must be at least 6 characters';
            }
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;

        setIsSaving(true);
        try {
            const payload = {
                ...formData,
                phoneCountryCode: formData.phoneCountryCode.replace('+', '')
            };
            if (isEdit) {
                await agencyService.updateSubAgencyUser(user.id, payload);
            } else {
                await agencyService.createSubAgencyUser(payload);
            }
            onUpdate();
            onClose();
        } catch (error) {
            console.error(isEdit ? 'Error updating sub-agency user:' : 'Error creating sub-agency user:', error);
            toast.error(error.message || (isEdit ? 'Failed to update user' : 'Failed to create user'));
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
            
            <div className="relative w-full max-w-lg bg-white dark:bg-[#0B1120] rounded-[32px] shadow-2xl border border-slate-100 dark:border-white/5 overflow-hidden animate-in zoom-in-95 duration-300">
                {/* Header */}
                <div className="p-8 border-b border-slate-50 dark:border-white/5 flex items-center justify-between bg-slate-50/30 dark:bg-transparent">
                    <div>
                        <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight leading-none mb-1">
                            {isEdit ? 'Edit User' : 'New User'}
                        </h2>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            {isEdit ? `Update account details for ${user?.name}` : 'Create a new sub-agency user'}
                        </p>
                    </div>
                    <button 
                        onClick={onClose}
                        className="size-10 rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all shadow-sm active:scale-90"
                    >
                        <span className="material-icons-round">close</span>
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Name</label>
                            <input 
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                className={`w-full h-12 bg-slate-50 dark:bg-slate-800/50 border ${errors.name ? 'border-rose-500' : 'border-slate-100 dark:border-slate-700'} rounded-2xl px-5 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-primary transition-all`}
                                placeholder="Enter name"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Surname</label>
                            <input 
                                type="text"
                                value={formData.surname}
                                onChange={(e) => setFormData(prev => ({ ...prev, surname: e.target.value }))}
                                className={`w-full h-12 bg-slate-50 dark:bg-slate-800/50 border ${errors.surname ? 'border-rose-500' : 'border-slate-100 dark:border-slate-700'} rounded-2xl px-5 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-primary transition-all`}
                                placeholder="Enter surname"
                            />
                        </div>
                    </div>

                    {!isEdit && (
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email</label>
                                <input 
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                    className={`w-full h-12 bg-slate-50 dark:bg-slate-800/50 border ${errors.email ? 'border-rose-500' : 'border-slate-100 dark:border-slate-700'} rounded-2xl px-5 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-primary transition-all`}
                                    placeholder="Enter email"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Password</label>
                                <input 
                                    type="password"
                                    value={formData.password}
                                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                                    className={`w-full h-12 bg-slate-50 dark:bg-slate-800/50 border ${errors.password ? 'border-rose-500' : 'border-slate-100 dark:border-slate-700'} rounded-2xl px-5 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-primary transition-all`}
                                    placeholder="Enter password"
                                />
                            </div>
                        </div>
                    )}

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Phone Number</label>
                        <PhoneInput 
                            value={formData.phoneNumber}
                            countryCode={formData.phoneCountryCode}
                            onChange={(val) => setFormData(prev => ({ ...prev, phoneNumber: val }))}
                            onCountryCodeChange={(code) => setFormData(prev => ({ ...prev, phoneCountryCode: code }))}
                            error={errors.phoneNumber}
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Status</label>
                        <div className="flex gap-4 p-2 bg-slate-50 dark:bg-slate-800/50 rounded-[20px] border border-slate-100 dark:border-slate-700">
                            {['ACTIVE', 'PASSIVE'].map((status) => (
                                <button
                                    key={status}
                                    type="button"
                                    onClick={() => setFormData(prev => ({ ...prev, status }))}
                                    className={`flex-1 h-10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                        formData.status === status 
                                        ? 'bg-white dark:bg-slate-700 text-primary shadow-sm' 
                                        : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                                    }`}
                                >
                                    {status}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-4 flex items-center gap-3">
                        <button 
                            type="button"
                            onClick={onClose}
                            className="flex-1 h-12 rounded-2xl text-[11px] font-black text-slate-400 uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit"
                            disabled={isSaving}
                            className="flex-[2] h-12 bg-primary text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                        >
                            {isSaving ? (
                                <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <span className="material-icons-round text-lg">check_circle</span>
                            )}
                            {isEdit ? 'Save Changes' : 'Create User'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditSubAgencyUserModal;
