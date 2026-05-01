import React, { useState, useEffect } from 'react';
import { agencyService } from '../services/agencyService';
import { locationService } from '../services/locationService';
import { currencyService } from '../services/currencyService';

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
        } else {
            setForm(prev => ({ ...prev, [name]: val }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
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
        <div className="flex items-center gap-3 mb-6">
            <div className={`size-8 bg-${color}-500/10 rounded-xl flex items-center justify-center text-${color}-500 shadow-sm border border-${color}-500/20`}>
                <span className="material-icons-round text-lg">{icon}</span>
            </div>
            <h3 className="text-[12px] font-black text-slate-800 dark:text-white uppercase tracking-widest leading-none mt-0.5">{title}</h3>
        </div>
    );

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-hidden">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity" onClick={onClose} />

            <div className="relative bg-white dark:bg-[#0B1120] w-full max-w-4xl max-h-[90vh] rounded-[40px] shadow-2xl flex flex-col border border-slate-100 dark:border-white/5 animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
                
                {/* Header */}
                <div className="p-8 border-b border-slate-50 dark:border-white/5 flex items-center justify-between shrink-0">
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-none mb-2">
                            {mode === 'edit' ? 'Update Agency' : 'Add New Agency'}
                        </h2>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                            {mode === 'edit' ? `Modifying: ${initialData?.name}` : 'Fill in the details to create a new record'}
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
                <form id="agency-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-10 custom-scrollbar space-y-10">
                    {error && (
                        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-2xl flex items-center gap-4 animate-in slide-in-from-top-2 duration-300">
                            <div className="size-10 bg-red-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-red-500/20">
                                <span className="material-icons-round">error_outline</span>
                            </div>
                            <div className="flex-1">
                                <p className="text-[10px] font-black text-red-500 uppercase tracking-widest leading-none mb-1">Operation Failed</p>
                                <p className="text-[11px] font-bold text-slate-600 dark:text-slate-300">{error}</p>
                            </div>
                            <button onClick={() => setError(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors">
                                <span className="material-icons-round text-lg">close</span>
                            </button>
                        </div>
                    )}

                    <div className="flex flex-col gap-10">
                        {/* Section 1: General */}
                        <div className="p-8 border border-slate-100 dark:border-white/5 rounded-[40px] bg-slate-50/30 dark:bg-slate-900/10 shadow-sm relative overflow-hidden group transition-all hover:border-blue-500/20">
                            <SectionHeader icon="info" title="General Information" color="blue" />
                            
                            <div className="space-y-5">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1 flex justify-between">
                                        Agency Name <span>*</span>
                                    </label>
                                    <input 
                                        required name="name" value={form.name} onChange={handleChange}
                                        placeholder="e.g. Travel of Globe London"
                                        className="w-full h-12 bg-white dark:bg-slate-950 border border-slate-100 dark:border-white/10 focus:border-blue-500/50 shadow-sm focus:shadow-blue-500/5 rounded-2xl px-5 text-[12px] font-bold outline-none transition-all"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Email Address</label>
                                        <input 
                                            required type="email" name="email" value={form.email} onChange={handleChange}
                                            placeholder="agency@example.com"
                                            className="w-full h-12 bg-white dark:bg-slate-950 border border-slate-100 dark:border-white/10 focus:border-blue-500/50 shadow-sm rounded-2xl px-5 text-[12px] font-bold outline-none transition-all"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Phone Number</label>
                                        <div className="flex gap-2">
                                            <input 
                                                name="phoneCountryCode" value={form.phoneCountryCode} onChange={handleChange}
                                                className="w-20 h-12 bg-white dark:bg-slate-950 border border-slate-100 dark:border-white/10 focus:border-blue-500/50 shadow-sm rounded-2xl px-4 text-[12px] font-bold outline-none transition-all text-center"
                                                placeholder="+90"
                                            />
                                            <input 
                                                name="phoneNumber" value={form.phoneNumber} onChange={handleChange}
                                                className="flex-1 h-12 bg-white dark:bg-slate-950 border border-slate-100 dark:border-white/10 focus:border-blue-500/50 shadow-sm rounded-2xl px-5 text-[12px] font-bold outline-none transition-all"
                                                placeholder="555..."
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Agency Type</label>
                                            <select 
                                                name="agencyType" value={form.agencyType} onChange={handleChange}
                                                className="w-full h-12 bg-white dark:bg-slate-950 border border-slate-100 dark:border-white/10 rounded-2xl px-4 text-[12px] font-bold outline-none transition-all appearance-none cursor-pointer focus:border-blue-500/50"
                                            >
                                                <option value="AGENCY">Agency</option>
                                                <option value="RSA">RSA</option>
                                            </select>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Integration</label>
                                            <select 
                                                name="integrationType" value={form.integrationType} onChange={handleChange}
                                                className="w-full h-12 bg-white dark:bg-slate-950 border border-slate-100 dark:border-white/10 rounded-2xl px-4 text-[12px] font-bold outline-none transition-all appearance-none cursor-pointer focus:border-blue-500/50"
                                            >
                                                <option value="TGX">TGX</option>
                                                <option value="JUNIPER">Juniper</option>
                                                <option value="DIRECT">Direct</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Currency</label>
                                            <select 
                                                name="currency" value={form.currency} onChange={handleChange}
                                                className="w-full h-12 bg-white dark:bg-slate-950 border border-slate-100 dark:border-white/10 rounded-2xl px-4 text-[12px] font-bold outline-none transition-all appearance-none cursor-pointer focus:border-blue-500/50"
                                            >
                                                {currencies.map(curr => (
                                                    <option key={curr.code} value={curr.code}>{curr.code}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Language</label>
                                            <select 
                                                name="defaultLanguage" value={form.defaultLanguage} onChange={handleChange}
                                                className="w-full h-12 bg-white dark:bg-slate-950 border border-slate-100 dark:border-white/10 rounded-2xl px-4 text-[12px] font-bold outline-none transition-all appearance-none cursor-pointer focus:border-blue-500/50"
                                            >
                                                <option value="EN">English</option>
                                                <option value="TR">Turkish</option>
                                                <option value="DE">German</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-4 border-t border-slate-100 dark:border-white/5">
                                    <label className="flex items-center gap-4 cursor-pointer group w-fit">
                                        <div className={`size-11 rounded-2xl flex items-center justify-center transition-all ${form.allowedForSale ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                                            <span className="material-icons-round text-xl">{form.allowedForSale ? 'check_circle' : 'block'}</span>
                                        </div>
                                        <div>
                                            <p className="text-[12px] font-black text-slate-800 dark:text-white uppercase leading-none mb-1">Allowed for Sale</p>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Booking capabilities</p>
                                        </div>
                                        <input 
                                            type="checkbox" name="allowedForSale" checked={form.allowedForSale} onChange={handleChange}
                                            className="hidden"
                                        />
                                    </label>

                                    {mode === 'edit' && (
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Status</label>
                                            <select 
                                                name="status" value={form.status} onChange={handleChange}
                                                className="w-full h-12 bg-white dark:bg-slate-950 border border-slate-100 dark:border-white/10 rounded-2xl px-4 text-[12px] font-bold outline-none cursor-pointer"
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
                        <div className="p-8 border border-slate-100 dark:border-white/5 rounded-[40px] bg-slate-50/30 dark:bg-slate-900/10 shadow-sm group transition-all hover:border-indigo-500/20">
                            <SectionHeader icon="location_on" title="Office Location" color="indigo" />
                            <div className="space-y-5">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Country</label>
                                        <select 
                                            name="countryId" value={form.countryId} onChange={handleChange}
                                            className="w-full h-12 bg-white dark:bg-slate-950 border border-slate-100 dark:border-white/10 rounded-2xl px-5 text-[12px] font-bold outline-none cursor-pointer focus:border-indigo-500/50"
                                        >
                                            <option value="">Select Country</option>
                                            {countries.map(c => (
                                                <option key={c.locationId} value={c.locationId}>{getName(c.name)}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-400 uppercase ml-1">City</label>
                                        <select 
                                            name="cityId" value={form.cityId} onChange={handleChange} disabled={!form.countryId}
                                            className="w-full h-12 bg-white dark:bg-slate-950 border border-slate-100 dark:border-white/10 rounded-2xl px-5 text-[12px] font-bold outline-none cursor-pointer focus:border-indigo-500/50 disabled:opacity-50"
                                        >
                                            <option value="">{form.countryId ? 'Select City' : 'Select Country First'}</option>
                                            {cities.map(c => (
                                                <option key={c.locationId} value={c.locationId}>{getName(c.name)}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                                    <div className="md:col-span-3 space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Full Address</label>
                                        <input 
                                            name="address" value={form.address} onChange={handleChange}
                                            placeholder="Street, Building, etc."
                                            className="w-full h-12 bg-white dark:bg-slate-950 border border-slate-100 dark:border-white/10 rounded-2xl px-5 text-[12px] font-bold outline-none focus:border-indigo-500/50"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Zip Code</label>
                                        <input 
                                            name="zipCode" value={form.zipCode} onChange={handleChange}
                                            placeholder="07070"
                                            className="w-full h-12 bg-white dark:bg-slate-950 border border-slate-100 dark:border-white/10 rounded-2xl px-5 text-[12px] font-bold outline-none focus:border-indigo-500/50"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Section 3: Financial */}
                        <div className="p-8 border border-slate-100 dark:border-white/5 rounded-[40px] bg-slate-50/30 dark:bg-slate-900/10 shadow-sm group transition-all hover:border-emerald-500/20">
                            <SectionHeader icon="payments" title="Financial Information" color="emerald" />
                            <div className="space-y-5">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Company Official Title</label>
                                    <input 
                                        name="agencyFinancialInfo.title" value={form.agencyFinancialInfo.title} onChange={handleChange}
                                        placeholder="Legal entity name"
                                        className="w-full h-12 bg-white dark:bg-slate-950 border border-slate-100 dark:border-white/10 rounded-2xl px-5 text-[12px] font-bold outline-none focus:border-emerald-500/50 shadow-sm"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Financial Email</label>
                                        <input 
                                            name="agencyFinancialInfo.email" value={form.agencyFinancialInfo.email} onChange={handleChange}
                                            placeholder="accounting@example.com"
                                            className="w-full h-12 bg-white dark:bg-slate-950 border border-slate-100 dark:border-white/10 rounded-2xl px-5 text-[12px] font-bold outline-none focus:border-emerald-500/50"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Financial Phone</label>
                                        <div className="flex gap-2">
                                            <input 
                                                name="agencyFinancialInfo.phoneCountryCode" value={form.agencyFinancialInfo.phoneCountryCode} onChange={handleChange}
                                                className="w-20 h-12 bg-white dark:bg-slate-950 border border-slate-100 dark:border-white/10 rounded-2xl px-4 text-[12px] font-bold outline-none text-center"
                                                placeholder="+90"
                                            />
                                            <input 
                                                name="agencyFinancialInfo.phoneNumber" value={form.agencyFinancialInfo.phoneNumber} onChange={handleChange}
                                                className="flex-1 h-12 bg-white dark:bg-slate-950 border border-slate-100 dark:border-white/10 rounded-2xl px-5 text-[12px] font-bold outline-none"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Tax Office</label>
                                        <input 
                                            name="agencyFinancialInfo.taxOffice" value={form.agencyFinancialInfo.taxOffice} onChange={handleChange}
                                            placeholder="Local tax office"
                                            className="w-full h-12 bg-white dark:bg-slate-950 border border-slate-100 dark:border-white/10 rounded-2xl px-5 text-[12px] font-bold outline-none"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Tax Number</label>
                                        <input 
                                            name="agencyFinancialInfo.taxNumber" value={form.agencyFinancialInfo.taxNumber} onChange={handleChange}
                                            placeholder="Registration ID"
                                            className="w-full h-12 bg-white dark:bg-slate-950 border border-slate-100 dark:border-white/10 rounded-2xl px-5 text-[12px] font-bold outline-none"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Fin. Country</label>
                                        <select 
                                            name="agencyFinancialInfo.countryId" value={form.agencyFinancialInfo.countryId} onChange={handleChange}
                                            className="w-full h-12 bg-white dark:bg-slate-950 border border-slate-100 dark:border-white/10 rounded-2xl px-5 text-[12px] font-bold outline-none cursor-pointer appearance-none"
                                        >
                                            <option value="">Select Country</option>
                                            {countries.map(c => (
                                                <option key={c.locationId} value={c.locationId}>{getName(c.name)}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Fin. City</label>
                                        <select 
                                            name="agencyFinancialInfo.cityId" value={form.agencyFinancialInfo.cityId} onChange={handleChange} disabled={!form.agencyFinancialInfo.countryId}
                                            className="w-full h-12 bg-white dark:bg-slate-950 border border-slate-100 dark:border-white/10 rounded-2xl px-5 text-[12px] font-bold outline-none cursor-pointer appearance-none disabled:opacity-50"
                                        >
                                            <option value="">{form.agencyFinancialInfo.countryId ? 'Select City' : 'Select Country First'}</option>
                                            {finCities.map(c => (
                                                <option key={c.locationId} value={c.locationId}>{getName(c.name)}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Financial Address</label>
                                    <input 
                                        name="agencyFinancialInfo.address" value={form.agencyFinancialInfo.address} onChange={handleChange}
                                        placeholder="Official registered address"
                                        className="w-full h-12 bg-white dark:bg-slate-950 border border-slate-100 dark:border-white/10 rounded-2xl px-5 text-[12px] font-bold outline-none"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </form>

                {/* Footer */}
                <div className="p-8 border-t border-slate-50 dark:border-white/5 flex items-center justify-end gap-4 shrink-0 bg-white dark:bg-[#0B1120]/80 backdrop-blur-md">
                    <button 
                        onClick={onClose}
                        className="h-14 px-10 rounded-[24px] text-[12px] font-black text-slate-500 uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-800 transition-all active:scale-95"
                    >
                        Cancel
                    </button>
                    <button 
                        type="submit" form="agency-form" disabled={isLoading}
                        className={`h-14 px-12 ${mode === 'edit' ? 'bg-indigo-600 shadow-indigo-500/20' : 'bg-blue-600 shadow-blue-500/20'} text-white rounded-[24px] text-[12px] font-black uppercase tracking-widest shadow-xl hover:scale-[1.02] active:scale-95 disabled:opacity-50 transition-all flex items-center gap-3`}
                    >
                        {isLoading ? (
                            <>
                                <div className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                Saving...
                            </>
                        ) : (
                            <>
                                <span className="material-icons-round text-xl">{mode === 'edit' ? 'save' : 'verified'}</span>
                                {mode === 'edit' ? 'Update Changes' : 'Complete Registration'}
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AddAgencyModal;
