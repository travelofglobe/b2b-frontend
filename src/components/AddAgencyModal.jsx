import React, { useState, useEffect } from 'react';
import { agencyService } from '../services/agencyService';
import { locationService } from '../services/locationService';
import { currencyService } from '../services/currencyService';
import PhoneInput from './PhoneInput';
import AppleSwitch from './AppleSwitch';

const AddAgencyModal = ({ isOpen, onClose, onSuccess, initialData = null, mode = 'add' }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [countries, setCountries] = useState([]);
    const [cities, setCities] = useState([]);
    const [finCities, setFinCities] = useState([]);
    const [currencies, setCurrencies] = useState([]);

    const initialFormState = {
        name: '',
        email: '',
        phoneCountryCode: '90',
        phoneNumber: '',
        address: '',
        countryId: '',
        cityId: '',
        zipCode: '',
        agencyType: 'AGENCY',
        integrationType: 'TGX',
        currency: 'EUR',
        defaultLanguage: 'EN',
        allowedForSale: true,
        status: 'ACTIVE',
        agencyFinancialInfo: {
            title: '',
            email: '',
            phoneCountryCode: '90',
            phoneNumber: '',
            address: '',
            countryId: '',
            cityId: '',
            taxOffice: '',
            taxNumber: ''
        }
    };

    const [form, setForm] = useState(initialFormState);
    const [formErrors, setFormErrors] = useState({});

    // Localization
    const currentLang = localStorage.getItem('language') || 'tr';
    const t = {
        en: { required: "This field is required", invalidEmail: "Invalid email address" },
        tr: { required: "Bu alan zorunludur", invalidEmail: "Geçersiz e-posta adresi" }
    }[currentLang] || { en: { required: "This field is required", invalidEmail: "Invalid email address" } };

    // Sync form with initialData for Edit Mode
    useEffect(() => {
        if (isOpen) {
            if (mode === 'edit' && initialData) {
                setForm({
                    ...initialFormState,
                    ...initialData,
                    // Ensure nested financial info is correctly merged
                    agencyFinancialInfo: {
                        ...initialFormState.agencyFinancialInfo,
                        ...(initialData.agencyFinancialInfo || {})
                    }
                });
            } else {
                setForm(initialFormState);
            }
            setError(null);
            setFormErrors({});
            fetchInitialData();
        }
    }, [isOpen, initialData, mode]);

    const fetchInitialData = async () => {
        try {
            const [countryRes, currencyRes] = await Promise.all([
                locationService.listCountries(),
                currencyService.listActiveCurrencies()
            ]);
            if (countryRes && countryRes.locationList) setCountries(countryRes.locationList);
            if (currencyRes) setCurrencies(currencyRes);
        } catch (error) {
            console.error('Error fetching initial modal data:', error);
        }
    };

    // Cascading cities for General Info
    useEffect(() => {
        if (!form.countryId) {
            setCities([]);
            return;
        }
        locationService.listSubRegions(form.countryId).then(res => {
            if (res && res.locationList) setCities(res.locationList);
        });
    }, [form.countryId]);

    // Cascading cities for Financial Info
    useEffect(() => {
        if (!form.agencyFinancialInfo.countryId) {
            setFinCities([]);
            return;
        }
        locationService.listSubRegions(form.agencyFinancialInfo.countryId).then(res => {
            if (res && res.locationList) setFinCities(res.locationList);
        });
    }, [form.agencyFinancialInfo.countryId]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        const val = type === 'checkbox' ? checked : value;

        if (name.includes('.')) {
            const [parent, child] = name.split('.');
            setForm(prev => ({
                ...prev,
                [parent]: {
                    ...prev[parent],
                    [child]: val
                }
            }));
            // Clear nested error
            if (formErrors[name]) {
                const newErrors = { ...formErrors };
                delete newErrors[name];
                setFormErrors(newErrors);
            }
        } else {
            setForm(prev => ({ ...prev, [name]: val }));
            // Clear top-level error
            if (formErrors[name]) {
                const newErrors = { ...formErrors };
                delete newErrors[name];
                setFormErrors(newErrors);
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Validation Logic
        const errors = {};
        const validateField = (field, label) => {
            if (!field || (typeof field === 'string' && !field.trim())) {
                errors[label] = t.required;
            }
        };

        // General
        validateField(form.name, 'name');
        validateField(form.email, 'email');
        validateField(form.phoneCountryCode, 'phoneCountryCode');
        validateField(form.phoneNumber, 'phoneNumber');
        
        // Location
        validateField(form.countryId, 'countryId');
        validateField(form.cityId, 'cityId');
        validateField(form.address, 'address');
        validateField(form.zipCode, 'zipCode');

        // Financial
        validateField(form.agencyFinancialInfo.title, 'agencyFinancialInfo.title');
        validateField(form.agencyFinancialInfo.email, 'agencyFinancialInfo.email');
        validateField(form.agencyFinancialInfo.phoneCountryCode, 'agencyFinancialInfo.phoneCountryCode');
        validateField(form.agencyFinancialInfo.phoneNumber, 'agencyFinancialInfo.phoneNumber');
        validateField(form.agencyFinancialInfo.taxOffice, 'agencyFinancialInfo.taxOffice');
        validateField(form.agencyFinancialInfo.taxNumber, 'agencyFinancialInfo.taxNumber');
        validateField(form.agencyFinancialInfo.countryId, 'agencyFinancialInfo.countryId');
        validateField(form.agencyFinancialInfo.cityId, 'agencyFinancialInfo.cityId');
        validateField(form.agencyFinancialInfo.address, 'agencyFinancialInfo.address');

        if (Object.keys(errors).length > 0) {
            setFormErrors(errors);
            const firstErrorField = Object.keys(errors)[0];
            document.getElementsByName(firstErrorField)[0]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }

        setIsLoading(true);
        setError(null);
        try {
            const payload = {
                ...form,
                countryId: Number(form.countryId),
                cityId: Number(form.cityId),
                agencyFinancialInfo: {
                    ...form.agencyFinancialInfo,
                    countryId: Number(form.agencyFinancialInfo.countryId),
                    cityId: Number(form.agencyFinancialInfo.cityId)
                }
            };

            if (mode === 'edit') {
                await agencyService.updateAgency(initialData.id, payload);
            } else {
                await agencyService.createAgency(payload);
            }

            onSuccess();
            onClose();
        } catch (err) {
            console.error('Error saving agency:', err);
            setError(err.message || 'An unexpected error occurred while saving the agency.');
        } finally {
            setIsLoading(false);
        }
    };

    const getName = (obj, lang = 'en') => {
        if (!obj || !obj.translations) return obj?.defaultName || '';
        return obj.translations[lang] || obj.translations['tr'] || obj.defaultName || '';
    };

    if (!isOpen) return null;

    const SectionHeader = ({ icon, title, color = "blue" }) => (
        <div className="flex items-center gap-2 mb-3">
            <div className={`size-6 bg-${color}-500/10 rounded-lg flex items-center justify-center text-${color}-500 shadow-xs border border-${color}-500/20`}>
                <span className="material-icons-round text-sm">{icon}</span>
            </div>
            <h3 className="text-xs font-semibold text-slate-800 dark:text-white leading-none">{title}</h3>
        </div>
    );

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-hidden">
            <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity" onClick={onClose} />

            <div className="relative bg-white dark:bg-slate-900 w-full max-w-3xl max-h-[90vh] rounded-xl shadow-xl flex flex-col border border-slate-200 dark:border-white/10 animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
                
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 dark:border-white/5 flex items-center justify-between shrink-0">
                    <div>
                        <h2 className="text-base font-semibold text-slate-900 dark:text-white leading-none mb-1">
                            {mode === 'edit' ? 'Update Agency' : 'Add New Agency'}
                        </h2>
                        <p className="text-[11px] font-medium text-slate-400">
                            {mode === 'edit' ? `Modifying: ${initialData?.name}` : 'Fill in the details to create a new record'}
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
                <form id="agency-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-6">
                    {error && (
                        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-lg flex items-center gap-3 animate-in slide-in-from-top-2 duration-200">
                            <span className="material-icons-round text-red-500 text-lg">error_outline</span>
                            <div className="flex-1">
                                <p className="text-xs font-semibold text-red-600 dark:text-red-400">{error}</p>
                            </div>
                            <button onClick={() => setError(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors">
                                <span className="material-icons-round text-base">close</span>
                            </button>
                        </div>
                    )}

                    <div className="flex flex-col gap-6">
                        {/* Section 1: General */}
                        <div className="p-4 border border-slate-100 dark:border-white/5 rounded-xl bg-slate-50/50 dark:bg-slate-900/30">
                            <SectionHeader icon="info" title="General Information" color="blue" />
                            
                            <div className="space-y-3">
                                <div className="space-y-1">
                                    <label className="text-[11px] font-medium text-slate-600 dark:text-slate-300">
                                        Agency Name <span className="text-rose-500">*</span>
                                    </label>
                                    <input 
                                        name="name" value={form.name} onChange={handleChange}
                                        placeholder="e.g. Travel of Globe London"
                                        className={`w-full h-9 bg-white dark:bg-slate-800 border ${formErrors.name ? 'border-rose-500' : 'border-slate-200 dark:border-slate-700'} rounded-lg px-3 text-xs font-medium outline-none focus:border-blue-500 transition-all`}
                                    />
                                    {formErrors.name && <p className="text-[10px] font-medium text-rose-500">{formErrors.name}</p>}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <label className="text-[11px] font-medium text-slate-600 dark:text-slate-300">Email Address <span className="text-rose-500">*</span></label>
                                        <input 
                                            type="email" name="email" value={form.email} onChange={handleChange}
                                            placeholder="agency@example.com"
                                            className={`w-full h-9 bg-white dark:bg-slate-800 border ${formErrors.email ? 'border-rose-500' : 'border-slate-200 dark:border-slate-700'} rounded-lg px-3 text-xs font-medium outline-none focus:border-blue-500 transition-all`}
                                        />
                                        {formErrors.email && <p className="text-[10px] font-medium text-rose-500">{formErrors.email}</p>}
                                    </div>
                                    <PhoneInput 
                                        label="Phone Number *"
                                        value={(form.phoneCountryCode?.startsWith('+') ? form.phoneCountryCode : `+${form.phoneCountryCode}`) + ' ' + form.phoneNumber}
                                        onChange={(val) => {
                                            const parts = val.split(' ');
                                            setForm(prev => ({ 
                                                ...prev, 
                                                phoneCountryCode: parts[0].replace('+', ''), 
                                                phoneNumber: parts[1] || '' 
                                            }));
                                            if (formErrors.phoneCountryCode || formErrors.phoneNumber) {
                                                const next = { ...formErrors };
                                                delete next.phoneCountryCode;
                                                delete next.phoneNumber;
                                                setFormErrors(next);
                                            }
                                        }}
                                        error={formErrors.phoneNumber || formErrors.phoneCountryCode}
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <div className="space-y-1">
                                        <label className="text-[11px] font-medium text-slate-600 dark:text-slate-300">Agency Type</label>
                                        <select 
                                            name="agencyType" value={form.agencyType} onChange={handleChange}
                                            className="w-full h-9 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 text-xs font-medium outline-none cursor-pointer focus:border-blue-500"
                                        >
                                            <option value="AGENCY">Agency</option>
                                            <option value="RSA">RSA</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[11px] font-medium text-slate-600 dark:text-slate-300">Currency</label>
                                        <select 
                                            name="currency" value={form.currency} onChange={handleChange}
                                            disabled={mode === 'edit'}
                                            className="w-full h-9 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 text-xs font-medium outline-none cursor-pointer focus:border-blue-500 disabled:opacity-50"
                                        >
                                            {currencies.map(curr => (
                                                <option key={curr.code} value={curr.code}>{curr.code}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[11px] font-medium text-slate-600 dark:text-slate-300">Language</label>
                                        <select 
                                            name="defaultLanguage" value={form.defaultLanguage} onChange={handleChange}
                                            className="w-full h-9 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 text-xs font-medium outline-none cursor-pointer focus:border-blue-500"
                                        >
                                            <option value="EN">English</option>
                                            <option value="TR">Turkish</option>
                                            <option value="DE">German</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                                    <div className="space-y-1">
                                        <label className="text-[11px] font-medium text-slate-600 dark:text-slate-300">Sales Permission</label>
                                        <div className="h-9 px-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg flex items-center justify-between">
                                            <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Allowed for Sale</span>
                                            <AppleSwitch
                                                checked={form.allowedForSale}
                                                onChange={(val) => handleChange({ target: { name: 'allowedForSale', type: 'checkbox', checked: val } })}
                                                size="sm"
                                            />
                                        </div>
                                    </div>

                                    {mode === 'edit' && (
                                        <div className="space-y-1">
                                            <label className="text-[11px] font-medium text-slate-600 dark:text-slate-300">Status</label>
                                            <select 
                                                name="status" value={form.status} onChange={handleChange}
                                                className="w-full h-9 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 text-xs font-medium outline-none cursor-pointer"
                                            >
                                                <option value="ACTIVE">Active</option>
                                                <option value="PASSIVE">Passive</option>
                                            </select>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Section 2: Location */}
                        <div className="p-4 border border-slate-100 dark:border-white/5 rounded-xl bg-slate-50/50 dark:bg-slate-900/30">
                            <SectionHeader icon="location_on" title="Office Location" color="indigo" />
                            <div className="space-y-3">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <label className="text-[11px] font-medium text-slate-600 dark:text-slate-300">Country *</label>
                                        <select 
                                            name="countryId" value={form.countryId} onChange={handleChange}
                                            className={`w-full h-9 bg-white dark:bg-slate-800 border ${formErrors.countryId ? 'border-rose-500' : 'border-slate-200 dark:border-slate-700'} rounded-lg px-3 text-xs font-medium outline-none cursor-pointer focus:border-indigo-500`}
                                        >
                                            <option value="">Select Country</option>
                                            {countries.map(c => (
                                                <option key={c.locationId} value={c.locationId}>{getName(c.name)}</option>
                                            ))}
                                        </select>
                                        {formErrors.countryId && <p className="text-[10px] font-medium text-rose-500">{formErrors.countryId}</p>}
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[11px] font-medium text-slate-600 dark:text-slate-300">City *</label>
                                        <select 
                                            name="cityId" value={form.cityId} onChange={handleChange} disabled={!form.countryId}
                                            className={`w-full h-9 bg-white dark:bg-slate-800 border ${formErrors.cityId ? 'border-rose-500' : 'border-slate-200 dark:border-slate-700'} rounded-lg px-3 text-xs font-medium outline-none cursor-pointer focus:border-indigo-500 disabled:opacity-50`}
                                        >
                                            <option value="">{form.countryId ? 'Select City' : 'Select Country First'}</option>
                                            {cities.map(c => (
                                                <option key={c.locationId} value={c.locationId}>{getName(c.name)}</option>
                                            ))}
                                        </select>
                                        {formErrors.cityId && <p className="text-[10px] font-medium text-rose-500">{formErrors.cityId}</p>}
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                                    <div className="md:col-span-3 space-y-1">
                                        <label className="text-[11px] font-medium text-slate-600 dark:text-slate-300">Full Address *</label>
                                        <input 
                                            name="address" value={form.address} onChange={handleChange}
                                            placeholder="Street, Building, etc."
                                            className={`w-full h-9 bg-white dark:bg-slate-800 border ${formErrors.address ? 'border-rose-500' : 'border-slate-200 dark:border-slate-700'} rounded-lg px-3 text-xs font-medium outline-none focus:border-indigo-500`}
                                        />
                                        {formErrors.address && <p className="text-[10px] font-medium text-rose-500">{formErrors.address}</p>}
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[11px] font-medium text-slate-600 dark:text-slate-300">Zip Code *</label>
                                        <input 
                                            name="zipCode" value={form.zipCode} onChange={handleChange}
                                            placeholder="07070"
                                            className={`w-full h-9 bg-white dark:bg-slate-800 border ${formErrors.zipCode ? 'border-rose-500' : 'border-slate-200 dark:border-slate-700'} rounded-lg px-3 text-xs font-medium outline-none focus:border-indigo-500`}
                                        />
                                        {formErrors.zipCode && <p className="text-[10px] font-medium text-rose-500">{formErrors.zipCode}</p>}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Section 3: Financial */}
                        <div className="p-4 border border-slate-100 dark:border-white/5 rounded-xl bg-slate-50/50 dark:bg-slate-900/30">
                            <SectionHeader icon="payments" title="Financial Information" color="emerald" />
                            <div className="space-y-3">
                                <div className="space-y-1">
                                    <label className="text-[11px] font-medium text-slate-600 dark:text-slate-300">Company Official Title *</label>
                                    <input 
                                        name="agencyFinancialInfo.title" value={form.agencyFinancialInfo.title} onChange={handleChange}
                                        placeholder="Legal entity name"
                                        className={`w-full h-9 bg-white dark:bg-slate-800 border ${formErrors['agencyFinancialInfo.title'] ? 'border-rose-500' : 'border-slate-200 dark:border-slate-700'} rounded-lg px-3 text-xs font-medium outline-none focus:border-emerald-500`}
                                    />
                                    {formErrors['agencyFinancialInfo.title'] && <p className="text-[10px] font-medium text-rose-500">{formErrors['agencyFinancialInfo.title']}</p>}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <label className="text-[11px] font-medium text-slate-600 dark:text-slate-300">Financial Email *</label>
                                        <input 
                                            name="agencyFinancialInfo.email" value={form.agencyFinancialInfo.email} onChange={handleChange}
                                            placeholder="accounting@example.com"
                                            className={`w-full h-9 bg-white dark:bg-slate-800 border ${formErrors['agencyFinancialInfo.email'] ? 'border-rose-500' : 'border-slate-200 dark:border-slate-700'} rounded-lg px-3 text-xs font-medium outline-none focus:border-emerald-500`}
                                        />
                                        {formErrors['agencyFinancialInfo.email'] && <p className="text-[10px] font-medium text-rose-500">{formErrors['agencyFinancialInfo.email']}</p>}
                                    </div>
                                    <PhoneInput 
                                        label="Financial Phone *"
                                        value={(form.agencyFinancialInfo.phoneCountryCode?.startsWith('+') ? form.agencyFinancialInfo.phoneCountryCode : `+${form.agencyFinancialInfo.phoneCountryCode}`) + ' ' + form.agencyFinancialInfo.phoneNumber}
                                        onChange={(val) => {
                                            const parts = val.split(' ');
                                            setForm(prev => ({ 
                                                ...prev, 
                                                agencyFinancialInfo: {
                                                    ...prev.agencyFinancialInfo,
                                                    phoneCountryCode: parts[0].replace('+', ''), 
                                                    phoneNumber: parts[1] || '' 
                                                }
                                            }));
                                            const errKey = 'agencyFinancialInfo.phoneNumber';
                                            const errKeyCC = 'agencyFinancialInfo.phoneCountryCode';
                                            if (formErrors[errKey] || formErrors[errKeyCC]) {
                                                const next = { ...formErrors };
                                                delete next[errKey];
                                                delete next[errKeyCC];
                                                setFormErrors(next);
                                            }
                                        }}
                                        error={formErrors['agencyFinancialInfo.phoneNumber'] || formErrors['agencyFinancialInfo.phoneCountryCode']}
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <label className="text-[11px] font-medium text-slate-600 dark:text-slate-300">Tax Office *</label>
                                        <input 
                                            name="agencyFinancialInfo.taxOffice" value={form.agencyFinancialInfo.taxOffice} onChange={handleChange}
                                            placeholder="Local tax office"
                                            className={`w-full h-9 bg-white dark:bg-slate-800 border ${formErrors['agencyFinancialInfo.taxOffice'] ? 'border-rose-500' : 'border-slate-200 dark:border-slate-700'} rounded-lg px-3 text-xs font-medium outline-none focus:border-emerald-500`}
                                        />
                                        {formErrors['agencyFinancialInfo.taxOffice'] && <p className="text-[10px] font-medium text-rose-500">{formErrors['agencyFinancialInfo.taxOffice']}</p>}
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[11px] font-medium text-slate-600 dark:text-slate-300">Tax Number *</label>
                                        <input 
                                            name="agencyFinancialInfo.taxNumber" value={form.agencyFinancialInfo.taxNumber} onChange={handleChange}
                                            placeholder="Registration ID"
                                            className={`w-full h-9 bg-white dark:bg-slate-800 border ${formErrors['agencyFinancialInfo.taxNumber'] ? 'border-rose-500' : 'border-slate-200 dark:border-slate-700'} rounded-lg px-3 text-xs font-medium outline-none focus:border-emerald-500`}
                                        />
                                        {formErrors['agencyFinancialInfo.taxNumber'] && <p className="text-[10px] font-medium text-rose-500">{formErrors['agencyFinancialInfo.taxNumber']}</p>}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <label className="text-[11px] font-medium text-slate-600 dark:text-slate-300">Fin. Country *</label>
                                        <select 
                                            name="agencyFinancialInfo.countryId" value={form.agencyFinancialInfo.countryId} onChange={handleChange}
                                            className={`w-full h-9 bg-white dark:bg-slate-800 border ${formErrors['agencyFinancialInfo.countryId'] ? 'border-rose-500' : 'border-slate-200 dark:border-slate-700'} rounded-lg px-3 text-xs font-medium outline-none cursor-pointer focus:border-emerald-500`}
                                        >
                                            <option value="">Select Country</option>
                                            {countries.map(c => (
                                                <option key={c.locationId} value={c.locationId}>{getName(c.name)}</option>
                                            ))}
                                        </select>
                                        {formErrors['agencyFinancialInfo.countryId'] && <p className="text-[10px] font-medium text-rose-500">{formErrors['agencyFinancialInfo.countryId']}</p>}
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[11px] font-medium text-slate-600 dark:text-slate-300">Fin. City *</label>
                                        <select 
                                            name="agencyFinancialInfo.cityId" value={form.agencyFinancialInfo.cityId} onChange={handleChange} disabled={!form.agencyFinancialInfo.countryId}
                                            className={`w-full h-9 bg-white dark:bg-slate-800 border ${formErrors['agencyFinancialInfo.cityId'] ? 'border-rose-500' : 'border-slate-200 dark:border-slate-700'} rounded-lg px-3 text-xs font-medium outline-none cursor-pointer focus:border-emerald-500 disabled:opacity-50`}
                                        >
                                            <option value="">{form.agencyFinancialInfo.countryId ? 'Select City' : 'Select Country First'}</option>
                                            {finCities.map(c => (
                                                <option key={c.locationId} value={c.locationId}>{getName(c.name)}</option>
                                            ))}
                                        </select>
                                        {formErrors['agencyFinancialInfo.cityId'] && <p className="text-[10px] font-medium text-rose-500">{formErrors['agencyFinancialInfo.cityId']}</p>}
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[11px] font-medium text-slate-600 dark:text-slate-300">Financial Address *</label>
                                    <input 
                                        name="agencyFinancialInfo.address" value={form.agencyFinancialInfo.address} onChange={handleChange}
                                        placeholder="Official registered address"
                                        className={`w-full h-9 bg-white dark:bg-slate-800 border ${formErrors['agencyFinancialInfo.address'] ? 'border-rose-500' : 'border-slate-200 dark:border-slate-700'} rounded-lg px-3 text-xs font-medium outline-none focus:border-emerald-500`}
                                    />
                                    {formErrors['agencyFinancialInfo.address'] && <p className="text-[10px] font-medium text-rose-500">{formErrors['agencyFinancialInfo.address']}</p>}
                                </div>
                            </div>
                        </div>
                    </div>
                </form>

                {/* Footer */}
                <div className="px-6 py-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-end gap-2 shrink-0 bg-slate-50/50 dark:bg-slate-900/40">
                    <button 
                        onClick={onClose}
                        className="h-8 px-4 rounded-lg text-xs font-medium text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                    >
                        Cancel
                    </button>
                    <button 
                        type="submit" form="agency-form" disabled={isLoading}
                        className={`h-8 px-4 ${mode === 'edit' ? 'bg-indigo-600' : 'bg-primary'} text-white rounded-lg text-xs font-semibold shadow-xs hover:opacity-90 active:scale-95 disabled:opacity-50 transition-all flex items-center gap-1.5`}
                    >
                        {isLoading ? (
                            <>
                                <div className="size-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                Saving...
                            </>
                        ) : (
                            <>
                                <span className="material-icons-round text-base">{mode === 'edit' ? 'save' : 'check'}</span>
                                {mode === 'edit' ? 'Update Agency' : 'Complete Registration'}
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AddAgencyModal;
