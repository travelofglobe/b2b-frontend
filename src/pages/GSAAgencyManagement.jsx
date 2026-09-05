import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { agencyService } from '../services/agencyService';
import { agencyGroupService } from '../services/agencyGroupService';
import { locationService } from '../services/locationService';
import AddAgencyModal from '../components/AddAgencyModal';
import AddAgencyGroupModal from '../components/AddAgencyGroupModal';
import SubAgencyDetailView from '../components/SubAgencyDetailView';
import ConfirmModal from '../components/ConfirmModal';
import AppleSwitch from '../components/AppleSwitch';
import { GSA_LOCALES } from '../utils/gsaLocales';
import { getLang } from '../utils/sharedLocales';

const GSAAgencyManagement = () => {
    const [activeTab, setActiveTab] = useState('agencies');
    const [isLoading, setIsLoading] = useState(false);
    
    // Localization
    const { i18n } = useTranslation();
    const currentLang = getLang(i18n.language || localStorage.getItem('language') || 'en');
    const t = GSA_LOCALES[currentLang] || GSA_LOCALES.en;
    
    // Modal Management
    const [agencyModal, setAgencyModal] = useState({ isOpen: false, mode: 'add', data: null });
    const [groupModal, setGroupModal] = useState({ isOpen: false, mode: 'add', data: null });
    const [detailModal, setDetailModal] = useState({ isOpen: false, agency: null });
    const [deleteModal, setDeleteModal] = useState({ 
        isOpen: false, 
        id: null, 
        name: '', 
        type: 'agency', 
        isDeleting: false,
        hasActiveAgencies: false 
    });
    
    // Agencies State
    const [agencies, setAgencies] = useState([]);
    const [countries, setCountries] = useState([]);
    const [cities, setCities] = useState([]);
    const [totalAgencyCount, setTotalAgencyCount] = useState(0);
    const [agencyFilters, setAgencyFilters] = useState({ 
        query: '', 
        status: '', 
        agencyType: '', 
        countryId: '', 
        cityId: '',
        page: 0,
        size: 20
    });
    const [agencySummary, setAgencySummary] = useState({
        totalAgencyCount: 0,
        activeAgencyCount: 0,
        passiveAgencyCount: 0,
        directIntegrationAgencyCount: 0
    });

    // Agency Groups State
    const [agencyGroups, setAgencyGroups] = useState([]);
    const [totalGroupCount, setTotalGroupCount] = useState(0);
    const [groupFilters, setGroupFilters] = useState({
        query: '',
        status: 'ACTIVE',
        page: 0,
        size: 10
    });
    const [isGroupsLoading, setIsGroupsLoading] = useState(false);
    const [groupSummary, setGroupSummary] = useState({
        totalGroupCount: 0,
        activeGroupCount: 0,
        passiveGroupCount: 0
    });

    const getName = (obj, lang = 'en') => {
        if (!obj) return '';
        if (typeof obj === 'string') return obj;
        return obj.translations?.[lang] || obj.translations?.tr || obj.defaultName || '';
    };

    const fetchCountries = useCallback(async () => {
        try {
            const response = await locationService.listCountries();
            if (response && response.locationList) {
                setCountries(response.locationList.sort((a, b) => 
                    getName(a.name).localeCompare(getName(b.name))
                ));
            }
        } catch (error) {
            console.error('Error fetching countries:', error);
        }
    }, []);

    useEffect(() => { fetchCountries(); }, [fetchCountries]);

    useEffect(() => {
        if (!agencyFilters.countryId) {
            setCities([]);
            setAgencyFilters(prev => ({ ...prev, cityId: '' }));
            return;
        }
        const fetchCities = async () => {
            try {
                const response = await locationService.listSubRegions(agencyFilters.countryId);
                if (response && response.locationList) {
                    setCities(response.locationList.sort((a, b) => 
                        getName(a.name).localeCompare(getName(b.name))
                    ));
                }
            } catch (error) {
                console.error('Error fetching cities:', error);
            }
        };
        fetchCities();
    }, [agencyFilters.countryId]);

    const fetchAgencies = useCallback(async () => {
        setIsLoading(true);
        try {
            const params = {
                page: agencyFilters.page,
                size: agencyFilters.size,
                status: agencyFilters.status || undefined,
                agencyType: agencyFilters.agencyType || undefined,
                countryId: agencyFilters.countryId ? Number(agencyFilters.countryId) : undefined,
                cityId: agencyFilters.cityId ? Number(agencyFilters.cityId) : undefined,
                query: agencyFilters.query || undefined
            };
            const response = await agencyService.filterAgencies(params);
            if (response && response.agencyList) {
                setAgencies(response.agencyList);
                setTotalAgencyCount(response.numberOfItems || 0);
            } else {
                setAgencies([]);
                setTotalAgencyCount(0);
            }
        } catch (error) {
            console.error('Error filtering agencies:', error);
            setAgencies([]);
        } finally {
            setIsLoading(false);
        }
    }, [agencyFilters]);

    const fetchAgencySummary = useCallback(async () => {
        try {
            const response = await agencyService.getSummary();
            if (response) {
                setAgencySummary(response);
            }
        } catch (error) {
            console.error('Error fetching agency summary:', error);
        }
    }, []);

    useEffect(() => {
        if (activeTab === 'agencies') {
            fetchAgencies();
            fetchAgencySummary();
        }
    }, [fetchAgencies, fetchAgencySummary, activeTab]);

    const handleFilterChange = (field, value) => {
        setAgencyFilters(prev => ({ ...prev, [field]: value, page: 0 }));
    };

    const handleGroupFilterChange = (field, value) => {
        setGroupFilters(prev => ({ ...prev, [field]: value, page: 0 }));
    };

    const fetchAgencyGroups = useCallback(async () => {
        setIsGroupsLoading(true);
        try {
            const params = {
                page: groupFilters.page,
                size: groupFilters.size,
                status: groupFilters.status || undefined,
                query: groupFilters.query || undefined
            };
            const response = await agencyGroupService.filterGroups(params);
            if (response && response.agencyGroupList) {
                setAgencyGroups(response.agencyGroupList);
                setTotalGroupCount(response.numberOfItems || 0);
            } else {
                setAgencyGroups([]);
                setTotalGroupCount(0);
            }
        } catch (error) {
            console.error('Error fetching agency groups:', error);
            setAgencyGroups([]);
        } finally {
            setIsGroupsLoading(false);
        }
    }, [groupFilters]);

    const fetchGroupSummary = useCallback(async () => {
        try {
            const response = await agencyGroupService.getSummary();
            if (response) {
                setGroupSummary(response);
            }
        } catch (error) {
            console.error('Error fetching group summary:', error);
        }
    }, []);

    useEffect(() => {
        if (activeTab === 'groups') {
            fetchAgencyGroups();
            fetchGroupSummary();
        }
    }, [fetchAgencyGroups, fetchGroupSummary, activeTab]);

    const handleGroupStatusToggle = async (group) => {
        const newStatus = group.status === 'ACTIVE' ? 'PASSIVE' : 'ACTIVE';
        try {
            // Optimistic Update
            if (groupFilters.status && groupFilters.status !== newStatus) {
                setAgencyGroups(prev => prev.filter(g => g.name !== group.name));
            } else {
                setAgencyGroups(prev => prev.map(g => g.name === group.name ? { ...g, status: newStatus } : g));
            }
            
            // Full update call
            await agencyGroupService.updateGroup(group.id, {
                name: group.name,
                description: group.description,
                agencyIds: group.agencies?.map(a => a.id) || [],
                status: newStatus
            });
            
            if (groupFilters.status) {
                fetchAgencyGroups();
            }
            fetchGroupSummary();
        } catch (error) {
            console.error('Error toggling group status:', error);
            fetchAgencyGroups();
            fetchGroupSummary();
            alert('Failed to update group status');
        }
    };

    // Agency Actions
    const handleAddClick = () => {
        if (activeTab === 'agencies') {
            setAgencyModal({ isOpen: true, mode: 'add', data: null });
        } else {
            setGroupModal({ isOpen: true, mode: 'add', data: null });
        }
    };
    
    const handleEditClick = (agency) => setAgencyModal({ isOpen: true, mode: 'edit', data: agency });
    
    const handleGroupEditClick = (group) => setGroupModal({ isOpen: true, mode: 'edit', data: group });

    const handleGroupDeleteClick = (group) => {
        const hasActive = group.agencies?.some(a => a.status === 'ACTIVE');
        setDeleteModal({ 
            isOpen: true, 
            id: group.id, 
            name: group.name, 
            type: 'group', 
            isDeleting: false,
            hasActiveAgencies: hasActive
        });
    };

    const confirmDelete = async () => {
        setDeleteModal(prev => ({ ...prev, isDeleting: true }));
        try {
            if (deleteModal.type === 'agency') {
                await agencyService.deleteAgency(deleteModal.id);
                fetchAgencies();
                fetchAgencySummary();
            } else {
                await agencyGroupService.deleteGroup(deleteModal.id);
                fetchAgencyGroups();
                fetchGroupSummary();
            }
            setDeleteModal({ isOpen: false, id: null, name: '', type: 'agency', isDeleting: false, hasActiveAgencies: false });
        } catch (error) {
            console.error('Error deleting:', error);
            alert(error.message || `Failed to delete ${deleteModal.type}`);
            setDeleteModal(prev => ({ ...prev, isDeleting: false }));
        }
    };

    const handleDeleteClick = (id, name) => {
        setDeleteModal({ isOpen: true, id, name, type: 'agency', isDeleting: false, hasActiveAgencies: false });
    };

    const handleStatusToggle = async (agency) => {
        const newStatus = agency.status === 'ACTIVE' ? 'PASSIVE' : 'ACTIVE';
        try {
            if (agencyFilters.status && agencyFilters.status !== newStatus) {
                setAgencies(prev => prev.filter(a => a.id !== agency.id));
            } else {
                setAgencies(prev => prev.map(a => a.id === agency.id ? { ...a, status: newStatus } : a));
            }
            const payload = { ...agency, status: newStatus };
            payload.countryId = Number(payload.countryId);
            payload.cityId = Number(payload.cityId);
            if (payload.agencyFinancialInfo) {
                payload.agencyFinancialInfo.countryId = Number(payload.agencyFinancialInfo.countryId);
                payload.agencyFinancialInfo.cityId = Number(payload.agencyFinancialInfo.cityId);
            }
            await agencyService.updateAgency(agency.id, payload);
            if (agencyFilters.status) {
                fetchAgencies();
            }
            fetchAgencySummary();
        } catch (error) {
            console.error('Error toggling status:', error);
            fetchAgencies();
            fetchAgencySummary();
            alert('Failed to update status');
        }
    };

    return (
        <div className="flex-1 flex flex-col p-4 md:p-6 space-y-4 min-h-0 bg-[#f8f9fa] dark:bg-[#202124]">
            {detailModal.isOpen ? (
                <SubAgencyDetailView
                    agency={detailModal.agency}
                    onBack={() => setDetailModal({ isOpen: false, agency: null })}
                />
            ) : (
                <>
                    {/* Header - Google Standard */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-[#e8f0fe] dark:bg-[#1a73e8]/20 flex items-center justify-center text-[#1a73e8] dark:text-[#8ab4f8]">
                                <span className="material-symbols-outlined text-[24px]">admin_panel_settings</span>
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-[#202124] dark:text-white tracking-tight">{t.pageTitle}</h1>
                                <p className="text-xs text-[#5f6368] dark:text-slate-400">{t.pageSubtitle}</p>
                            </div>
                        </div>

                        {/* Google Material Tabs */}
                        <div className="flex items-center gap-1.5 p-1 bg-white dark:bg-[#303134] rounded-full border border-[#dadce0] dark:border-[#5f6368]">
                            <button
                                onClick={() => setActiveTab('agencies')}
                                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                                    activeTab === 'agencies'
                                        ? 'bg-[#e8f0fe] text-[#1a73e8] font-semibold dark:bg-[#1a73e8]/25 dark:text-[#8ab4f8]'
                                        : 'text-[#5f6368] dark:text-slate-300 hover:bg-[#f1f3f4] dark:hover:bg-[#3c4043]'
                                }`}
                            >
                                <span className="material-symbols-outlined text-[18px]">business_center</span>
                                <span>{t.tabAgencies}</span>
                            </button>
                            <button
                                onClick={() => setActiveTab('groups')}
                                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                                    activeTab === 'groups'
                                        ? 'bg-[#e8f0fe] text-[#1a73e8] font-semibold dark:bg-[#1a73e8]/25 dark:text-[#8ab4f8]'
                                        : 'text-[#5f6368] dark:text-slate-300 hover:bg-[#f1f3f4] dark:hover:bg-[#3c4043]'
                                }`}
                            >
                                <span className="material-symbols-outlined text-[18px]">groups</span>
                                <span>{t.tabGroups}</span>
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-hidden flex flex-col min-h-0">
                        {activeTab === 'agencies' ? (
                            <div className="flex flex-col h-full overflow-hidden gap-3">
                                {/* Compact Stats Bar */}
                                <div className="flex items-center bg-white dark:bg-[#303134] rounded-lg border border-[#dadce0] dark:border-[#3c4043] overflow-hidden shrink-0">
                                    {[
                                        { label: t.statTotalAgencies, value: agencySummary.totalAgencyCount, icon: 'business_center', color: 'text-blue-600 dark:text-blue-400', dot: 'bg-blue-500' },
                                        { label: t.statActive, value: agencySummary.activeAgencyCount, icon: 'check_circle', color: 'text-emerald-600 dark:text-emerald-400', dot: 'bg-emerald-500' },
                                        { label: t.statPassive, value: agencySummary.passiveAgencyCount, icon: 'pause_circle', color: 'text-rose-500 dark:text-rose-400', dot: 'bg-rose-500' },
                                        { label: t.statDirectIntegration, value: agencySummary.directIntegrationAgencyCount, icon: 'electric_bolt', color: 'text-violet-600 dark:text-violet-400', dot: 'bg-violet-500' }
                                    ].map((stat, idx, arr) => (
                                        <div key={idx} className={`flex items-center gap-3 px-5 py-3 flex-1 ${idx < arr.length - 1 ? 'border-r border-[#dadce0] dark:border-[#3c4043]' : ''}`}>
                                            <div className={`size-1.5 rounded-full ${stat.dot} shrink-0`}></div>
                                            <div className="min-w-0">
                                                <p className="text-[9px] font-medium text-[#5f6368] dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">{stat.label}</p>
                                                <p className={`text-lg font-bold leading-none mt-0.5 ${stat.color}`}>{stat.value}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Table Container */}
                                <div className="flex-1 bg-white dark:bg-[#303134] rounded-lg border border-[#dadce0] dark:border-[#3c4043] shadow-xs flex flex-col overflow-hidden min-h-0">
                                    {/* Toolbar */}
                                    <div className="flex flex-wrap items-center gap-2 px-4 py-3 border-b border-[#dadce0] dark:border-[#3c4043] shrink-0">
                                        <div className="relative flex-1 min-w-[160px]">
                                            <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-[#5f6368] dark:text-slate-400 text-[18px]">search</span>
                                            <input
                                                type="text"
                                                placeholder={t.searchAgencies}
                                                value={agencyFilters.query}
                                                onChange={(e) => handleFilterChange('query', e.target.value)}
                                                className="w-full h-8 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg pl-8 pr-3 text-xs font-medium outline-none focus:border-primary transition-colors"
                                            />
                                        </div>
                                        <select value={agencyFilters.status} onChange={(e) => handleFilterChange('status', e.target.value)} className="h-8 px-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium outline-none cursor-pointer">
                                            <option value="">{t.allStatus}</option>
                                            <option value="ACTIVE">{t.active}</option>
                                            <option value="PASSIVE">{t.passive}</option>
                                        </select>
                                        <select value={agencyFilters.agencyType} onChange={(e) => handleFilterChange('agencyType', e.target.value)} className="h-8 px-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium outline-none cursor-pointer">
                                            <option value="">{t.allTypes}</option>
                                            <option value="AGENCY">{t.agency}</option>
                                            <option value="RSA">{t.rsa}</option>
                                        </select>
                                        <select value={agencyFilters.countryId} onChange={(e) => handleFilterChange('countryId', e.target.value)} className="h-8 px-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium outline-none cursor-pointer">
                                            <option value="">{t.allCountries}</option>
                                            {countries.map(c => <option key={c.locationId} value={c.locationId}>{getName(c.name)}</option>)}
                                        </select>
                                        <select value={agencyFilters.cityId} onChange={(e) => handleFilterChange('cityId', e.target.value)} disabled={!agencyFilters.countryId} className="h-8 px-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium outline-none cursor-pointer disabled:opacity-50">
                                            <option value="">{agencyFilters.countryId ? t.allCities : t.selectCountryFirst}</option>
                                            {cities.map(c => <option key={c.locationId} value={c.locationId}>{getName(c.name)}</option>)}
                                        </select>
                                        {isLoading && (
                                            <div className="flex items-center gap-1.5">
                                                <div className="size-3 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                                                <span className="text-[10px] font-medium text-primary">{t.loading}</span>
                                            </div>
                                        )}
                                        <button onClick={handleAddClick} className="ml-auto h-8 px-4 bg-primary text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 hover:bg-primary/90 active:scale-95 transition-all shadow-xs shadow-primary/20 whitespace-nowrap">
                                            <span className="material-icons-round text-sm">add</span>
                                            {t.addAgency}
                                        </button>
                                    </div>

                                    {/* Table */}
                                    <div className="flex-1 overflow-y-auto">
                                        <table className="w-full text-left text-xs">
                                            <thead className="sticky top-0 bg-slate-50 dark:bg-slate-800/80 z-10 border-b border-slate-200 dark:border-white/5">
                                                <tr>
                                                    <th className="px-4 py-2.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider w-16">{t.colId}</th>
                                                    <th className="px-4 py-2.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">{t.colAgency}</th>
                                                    <th className="px-4 py-2.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider w-20">{t.colType}</th>
                                                    <th className="px-4 py-2.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">{t.colLocation}</th>
                                                    <th className="px-4 py-2.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider w-20 text-center">{t.colCurrency}</th>
                                                    <th className="px-4 py-2.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider w-32 text-center">{t.colStatus}</th>
                                                    <th className="px-4 py-2.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider text-right">{t.colActions}</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {agencies.length > 0 ? (
                                                    agencies.map((agency, rowIdx) => (
                                                        <tr key={agency.id} className={`border-b border-slate-100 dark:border-white/[0.04] hover:bg-primary/5 transition-colors ${rowIdx % 2 === 1 ? 'bg-slate-50/60 dark:bg-white/[0.02]' : ''}`}>
                                                            <td className="px-4 py-2.5">
                                                                <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[10px] font-medium text-slate-500">{agency.id}</span>
                                                            </td>
                                                            <td className="px-4 py-2.5">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="size-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 text-[10px] font-semibold">
                                                                        {agency.name?.[0]?.toUpperCase()}
                                                                    </div>
                                                                    <div className="min-w-0">
                                                                        <p className="font-semibold text-slate-800 dark:text-white text-xs truncate max-w-[160px]">{agency.name}</p>
                                                                        <p className="text-[10px] text-slate-400 truncate max-w-[160px]">{agency.email}</p>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-2.5">
                                                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase ${agency.agencyType === 'RSA' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'}`}>
                                                                    {agency.agencyType}
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-2.5">
                                                                <p className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate max-w-[110px]">{agency.countryName}</p>
                                                                <p className="text-[10px] text-slate-400 truncate max-w-[110px]">{agency.cityName}</p>
                                                            </td>
                                                            <td className="px-4 py-2.5 text-center">
                                                                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">{agency.currency}</span>
                                                            </td>
                                                            <td className="px-4 py-2.5">
                                                                <div className="flex flex-col items-center gap-0.5">
                                                                    <AppleSwitch checked={agency.status === 'ACTIVE'} onChange={() => handleStatusToggle(agency)} size="sm" />
                                                                    <span className={`text-[9px] font-semibold uppercase tracking-wider ${agency.status === 'ACTIVE' ? 'text-emerald-500' : 'text-slate-400'}`}>
                                                                        {agency.status === 'ACTIVE' ? 'Active' : 'Passive'}
                                                                    </span>
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-2.5 text-right">
                                                                <div className="flex items-center justify-end gap-0.5">
                                                                    <button onClick={() => setDetailModal({ isOpen: true, agency })} className="size-7 rounded-lg flex items-center justify-center text-slate-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:text-emerald-500 transition-all" title={t.agencyDetail}>
                                                                        <span className="material-icons-round text-sm">visibility</span>
                                                                    </button>
                                                                    <button onClick={() => handleEditClick(agency)} className="size-7 rounded-lg flex items-center justify-center text-slate-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-500 transition-all">
                                                                        <span className="material-icons-round text-sm">edit</span>
                                                                    </button>
                                                                    <button onClick={() => handleDeleteClick(agency.id, agency.name)} className="size-7 rounded-lg flex items-center justify-center text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 transition-all">
                                                                        <span className="material-icons-round text-sm">delete_outline</span>
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))
                                                ) : !isLoading && (
                                                    <tr>
                                                        <td colSpan="7" className="py-16 text-center">
                                                            <div className="flex flex-col items-center gap-2 text-slate-300">
                                                                <span className="material-icons-round text-4xl">search_off</span>
                                                                <span className="text-xs font-semibold text-slate-400">{t.noAgenciesFound}</span>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Footer */}
                                    <div className="px-4 py-2.5 border-t border-slate-100 dark:border-white/5 flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-slate-900/30">
                                        <span className="text-[10px] font-medium text-slate-400">{totalAgencyCount} {t.tabAgencies}</span>
                                        <div className="flex gap-1.5">
                                            <button disabled={agencyFilters.page === 0} onClick={() => handleFilterChange('page', agencyFilters.page - 1)} className="size-7 rounded-lg border border-slate-200 dark:border-white/5 flex items-center justify-center text-slate-400 disabled:opacity-30 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
                                                <span className="material-icons-round text-sm">chevron_left</span>
                                            </button>
                                            <span className="h-7 px-2.5 flex items-center text-[10px] font-semibold text-slate-500 border border-slate-200 dark:border-white/5 rounded-lg">{agencyFilters.page + 1}</span>
                                            <button disabled={agencies.length < agencyFilters.size} onClick={() => handleFilterChange('page', agencyFilters.page + 1)} className="size-7 rounded-lg border border-slate-200 dark:border-white/5 flex items-center justify-center text-slate-400 disabled:opacity-30 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
                                                <span className="material-icons-round text-sm">chevron_right</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col h-full overflow-hidden gap-3 animate-in fade-in duration-300">
                                {/* Compact Stats Bar */}
                                <div className="flex items-center bg-white dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-white/5 overflow-hidden shrink-0">
                                    {[
                                        { label: t.statTotalGroups, value: groupSummary.totalGroupCount, dot: 'bg-blue-500', color: 'text-blue-600 dark:text-blue-400' },
                                        { label: t.statActive, value: groupSummary.activeGroupCount, dot: 'bg-emerald-500', color: 'text-emerald-600 dark:text-emerald-400' },
                                        { label: t.statPassive, value: groupSummary.passiveGroupCount, dot: 'bg-rose-500', color: 'text-rose-500 dark:text-rose-400' }
                                    ].map((stat, idx, arr) => (
                                        <div key={idx} className={`flex items-center gap-3 px-5 py-3 flex-1 ${idx < arr.length - 1 ? 'border-r border-slate-100 dark:border-white/5' : ''}`}>
                                            <div className={`size-1.5 rounded-full ${stat.dot} shrink-0`}></div>
                                            <div>
                                                <p className="text-[9px] font-medium text-slate-400 uppercase tracking-wider">{stat.label}</p>
                                                <p className={`text-lg font-bold leading-none mt-0.5 ${stat.color}`}>{stat.value}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Groups Table Container */}
                                <div className="flex-1 bg-white dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-white/5 shadow-xs flex flex-col overflow-hidden min-h-0">
                                    {/* Toolbar */}
                                    <div className="flex flex-wrap items-center gap-2 px-4 py-3 border-b border-slate-100 dark:border-white/5 shrink-0">
                                        <div className="relative flex-1 min-w-[160px]">
                                            <span className="material-icons-round absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">search</span>
                                            <input
                                                type="text"
                                                placeholder={t.searchGroups}
                                                value={groupFilters.query}
                                                onChange={(e) => handleGroupFilterChange('query', e.target.value)}
                                                className="w-full h-8 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg pl-8 pr-3 text-xs font-medium outline-none focus:border-primary transition-colors"
                                            />
                                        </div>
                                        <select value={groupFilters.status} onChange={(e) => handleGroupFilterChange('status', e.target.value)} className="h-8 px-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium outline-none cursor-pointer">
                                            <option value="">{t.allStatus}</option>
                                            <option value="ACTIVE">{t.active}</option>
                                            <option value="PASSIVE">{t.passive}</option>
                                        </select>
                                        <button onClick={handleAddClick} className="ml-auto h-8 px-4 bg-primary text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 hover:bg-primary/90 active:scale-95 transition-all shadow-xs shadow-primary/20 whitespace-nowrap">
                                            <span className="material-icons-round text-sm">add</span>
                                            {t.addGroup}
                                        </button>
                                    </div>

                                    {/* Groups Table */}
                                    <div className="flex-1 overflow-auto">
                                        <table className="w-full text-left text-xs">
                                            <thead className="sticky top-0 bg-slate-50 dark:bg-slate-800/80 z-10 border-b border-slate-200 dark:border-white/5">
                                                <tr>
                                                    <th className="px-4 py-2.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider w-16">{t.colId}</th>
                                                    <th className="px-4 py-2.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">{t.colGroupName}</th>
                                                    <th className="px-4 py-2.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">{t.colDescription}</th>
                                                    <th className="px-4 py-2.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">{t.colAgenciesCount}</th>
                                                    <th className="px-4 py-2.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">{t.colStatus}</th>
                                                    <th className="px-4 py-2.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider text-right">{t.colActions}</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {isGroupsLoading ? (
                                                    [...Array(5)].map((_, i) => (
                                                        <tr key={i} className="animate-pulse border-b border-slate-100 dark:border-white/[0.04]">
                                                            <td colSpan="7" className="px-4 py-3"><div className="h-6 bg-slate-100 dark:bg-slate-800 rounded-lg w-full"></div></td>
                                                        </tr>
                                                    ))
                                                ) : agencyGroups.length > 0 ? (
                                                    agencyGroups.map((group, rowIdx) => (
                                                        <tr key={group.name} className={`border-b border-slate-100 dark:border-white/[0.04] hover:bg-primary/5 transition-colors ${rowIdx % 2 === 1 ? 'bg-slate-50/60 dark:bg-white/[0.02]' : ''}`}>
                                                            <td className="px-4 py-2.5">
                                                                <span className="text-[10px] font-medium text-slate-400">#{group.id || '-'}</span>
                                                            </td>
                                                            <td className="px-4 py-2.5">
                                                                <span className="text-xs font-semibold text-slate-800 dark:text-white">{group.name}</span>
                                                            </td>
                                                            <td className="px-4 py-2.5">
                                                                <p className="text-xs text-slate-500 line-clamp-1 max-w-xs">{group.description}</p>
                                                            </td>
                                                            <td className="px-4 py-2.5">
                                                                <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded text-[10px] font-semibold">
                                                                    {group.agencies?.length || 0} {t.tabAgencies}
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-2.5">
                                                                <div className="flex items-center gap-1.5">
                                                                    <AppleSwitch checked={group.status === 'ACTIVE'} onChange={() => handleGroupStatusToggle(group)} size="sm" />
                                                                    <span className={`text-[9px] font-semibold uppercase tracking-wider ${group.status === 'ACTIVE' ? 'text-emerald-500' : 'text-slate-400'}`}>
                                                                        {group.status === 'ACTIVE' ? t.active : t.passive}
                                                                    </span>
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-2.5 text-right">
                                                                <div className="flex items-center justify-end gap-0.5">
                                                                    <button onClick={() => handleGroupEditClick(group)} className="size-7 rounded-lg flex items-center justify-center text-slate-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-500 transition-all" title={t.editGroup}>
                                                                        <span className="material-icons-round text-sm">edit</span>
                                                                    </button>
                                                                    <button onClick={() => handleGroupDeleteClick(group)} className="size-7 rounded-lg flex items-center justify-center text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 transition-all" title={t.deleteGroup}>
                                                                        <span className="material-icons-round text-sm">delete_outline</span>
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))
                                                ) : !isGroupsLoading && (
                                                    <tr>
                                                        <td colSpan="7" className="py-16 text-center">
                                                            <div className="flex flex-col items-center gap-2 text-slate-300">
                                                                <span className="material-icons-round text-4xl">group_off</span>
                                                                <span className="text-xs font-semibold text-slate-400">{t.noGroupsFound}</span>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Footer */}
                                    <div className="px-4 py-2.5 border-t border-slate-100 dark:border-white/5 flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-slate-900/30">
                                        <span className="text-[10px] font-medium text-slate-400">{totalGroupCount} groups found</span>
                                        <div className="flex gap-1.5">
                                            <button disabled={groupFilters.page === 0} onClick={() => handleGroupFilterChange('page', groupFilters.page - 1)} className="size-7 rounded-lg border border-slate-200 dark:border-white/5 flex items-center justify-center text-slate-400 disabled:opacity-30 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
                                                <span className="material-icons-round text-sm">chevron_left</span>
                                            </button>
                                            <span className="h-7 px-2.5 flex items-center text-[10px] font-semibold text-slate-500 border border-slate-200 dark:border-white/5 rounded-lg">{groupFilters.page + 1}</span>
                                            <button disabled={agencyGroups.length < groupFilters.size} onClick={() => handleGroupFilterChange('page', groupFilters.page + 1)} className="size-7 rounded-lg border border-slate-200 dark:border-white/5 flex items-center justify-center text-slate-400 disabled:opacity-30 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
                                                <span className="material-icons-round text-sm">chevron_right</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <AddAgencyModal
                        isOpen={agencyModal.isOpen}
                        onClose={() => setAgencyModal({ ...agencyModal, isOpen: false })}
                        onSuccess={() => { fetchAgencies(); fetchAgencySummary(); }}
                        mode={agencyModal.mode}
                        initialData={agencyModal.data}
                    />
                    <AddAgencyGroupModal
                        isOpen={groupModal.isOpen}
                        onClose={() => setGroupModal({ ...groupModal, isOpen: false })}
                        onSuccess={() => { fetchAgencyGroups(); fetchGroupSummary(); }}
                        mode={groupModal.mode}
                        initialData={groupModal.data}
                    />
                    <ConfirmModal
                        isOpen={deleteModal.isOpen}
                        onClose={() => setDeleteModal({ ...deleteModal, isOpen: false })}
                        onConfirm={confirmDelete}
                        isLoading={deleteModal.isDeleting}
                        title={deleteModal.type === 'agency' ? t.titleAgency : t.titleGroup}
                        message={
                            <span>
                                {deleteModal.hasActiveAgencies && deleteModal.type === 'group' && (
                                    <span className="text-rose-500 block mb-2 font-semibold">{t.activeWarning}</span>
                                )}
                                <b className="text-slate-900 dark:text-white uppercase">{deleteModal.name}</b> {t.confirmPermanently}
                                <br />
                                <span className="text-slate-500 dark:text-slate-400 mt-2 block">{t.undoWarning}</span>
                            </span>
                        }
                        confirmText={deleteModal.isDeleting ? (t.deleting || (t.yesDelete ? `${t.yesDelete}...` : "Deleting...")) : `${t.yesDelete} ${deleteModal.type === 'agency' ? t.agency : t.group}`}
                        cancelText={`${t.keep} ${deleteModal.type === 'agency' ? t.agency : t.group}`}
                        type="danger"
                    />
                </>
            )}
        </div>
    );
};

export default GSAAgencyManagement;

