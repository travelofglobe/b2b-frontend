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
                className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200" 
                onClick={onClose} 
            />
            
            <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-white/10 overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="px-5 py-4 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
                    <div>
                        <h2 className="text-base font-semibold text-slate-900 dark:text-white leading-none mb-1">
                            {isEdit ? 'Edit User' : 'New User'}
                        </h2>
                        <p className="text-[11px] font-medium text-slate-400">
                            {isEdit ? `Update account details for ${user?.name}` : 'Create a new sub-agency user'}
                        </p>
                    </div>
                    <button 
                        onClick={onClose}
                        className="size-7 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-white transition-all"
                    >
                        <span className="material-icons-round text-lg">close</span>
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-5 space-y-3.5">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <label className="text-[11px] font-medium text-slate-600 dark:text-slate-300">Name *</label>
                            <input 
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                className={`w-full h-9 bg-slate-50 dark:bg-slate-800 border ${errors.name ? 'border-rose-500' : 'border-slate-200 dark:border-slate-700'} rounded-lg px-3 text-xs font-medium text-slate-900 dark:text-white outline-none focus:border-primary transition-all`}
                                placeholder="Enter name"
                            />
                            {errors.name && <p className="text-[10px] text-rose-500 font-medium">{errors.name}</p>}
                        </div>
                        <div className="space-y-1">
                            <label className="text-[11px] font-medium text-slate-600 dark:text-slate-300">Surname *</label>
                            <input 
                                type="text"
                                value={formData.surname}
                                onChange={(e) => setFormData(prev => ({ ...prev, surname: e.target.value }))}
                                className={`w-full h-9 bg-slate-50 dark:bg-slate-800 border ${errors.surname ? 'border-rose-500' : 'border-slate-200 dark:border-slate-700'} rounded-lg px-3 text-xs font-medium text-slate-900 dark:text-white outline-none focus:border-primary transition-all`}
                                placeholder="Enter surname"
                            />
                            {errors.surname && <p className="text-[10px] text-rose-500 font-medium">{errors.surname}</p>}
                        </div>
                    </div>

                    {!isEdit && (
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <label className="text-[11px] font-medium text-slate-600 dark:text-slate-300">Email *</label>
                                <input 
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                    className={`w-full h-9 bg-slate-50 dark:bg-slate-800 border ${errors.email ? 'border-rose-500' : 'border-slate-200 dark:border-slate-700'} rounded-lg px-3 text-xs font-medium text-slate-900 dark:text-white outline-none focus:border-primary transition-all`}
                                    placeholder="user@example.com"
                                />
                                {errors.email && <p className="text-[10px] text-rose-500 font-medium">{errors.email}</p>}
                            </div>
                            <div className="space-y-1">
                                <label className="text-[11px] font-medium text-slate-600 dark:text-slate-300">Password *</label>
                                <input 
                                    type="password"
                                    value={formData.password}
                                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                                    className={`w-full h-9 bg-slate-50 dark:bg-slate-800 border ${errors.password ? 'border-rose-500' : 'border-slate-200 dark:border-slate-700'} rounded-lg px-3 text-xs font-medium text-slate-900 dark:text-white outline-none focus:border-primary transition-all`}
                                    placeholder="******"
                                />
                                {errors.password && <p className="text-[10px] text-rose-500 font-medium">{errors.password}</p>}
                            </div>
                        </div>
                    )}

                    <PhoneInput 
                        label="Phone Number *"
                        value={formData.phoneNumber}
                        countryCode={formData.phoneCountryCode}
                        onChange={(val) => setFormData(prev => ({ ...prev, phoneNumber: val }))}
                        onCountryCodeChange={(code) => setFormData(prev => ({ ...prev, phoneCountryCode: code }))}
                        error={errors.phoneNumber}
                    />

                    <div className="space-y-1">
                        <label className="text-[11px] font-medium text-slate-600 dark:text-slate-300">Status</label>
                        <div className="flex gap-2 p-1 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                            {['ACTIVE', 'PASSIVE'].map((status) => (
                                <button
                                    key={status}
                                    type="button"
                                    onClick={() => setFormData(prev => ({ ...prev, status }))}
                                    className={`flex-1 h-7 rounded-md text-xs font-medium transition-all ${
                                        formData.status === status 
                                        ? 'bg-white dark:bg-slate-700 text-primary shadow-xs' 
                                        : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                                    }`}
                                >
                                    {status}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Footer / Actions */}
                    <div className="pt-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-end gap-2">
                        <button 
                            type="button"
                            onClick={onClose}
                            className="h-8 px-4 rounded-lg text-xs font-medium text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit"
                            disabled={isSaving}
                            className="h-8 px-4 bg-primary text-white rounded-lg text-xs font-semibold shadow-xs hover:bg-primary/90 active:scale-95 transition-all flex items-center gap-1.5"
                        >
                            {isSaving ? (
                                <div className="size-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <span className="material-icons-round text-base">check</span>
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
