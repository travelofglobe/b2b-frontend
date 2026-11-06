import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { agencyService } from '../services/agencyService';
import { agencyGroupService } from '../services/agencyGroupService';
import { geographyService } from '../services/geographyService';
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
            const response = await geographyService.listCountries();
            const list = response?.regionList || response?.locationList;
            if (response && list) {
                setCountries(list.sort((a, b) => 
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
                const response = await geographyService.listSubRegions(agencyFilters.countryId);
                const list = response?.regionList || response?.locationList;
                if (response && list) {
                    setCities(list.sort((a, b) => 
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

    const handleClearAgencyFilters = () => {
        setAgencyFilters({
            query: '',
            status: '',
            agencyType: '',
            countryId: '',
            cityId: '',
            page: 0,
            size: agencyFilters.size
        });
    };

    const handleGroupFilterChange = (field, value) => {
        setGroupFilters(prev => ({ ...prev, [field]: value, page: 0 }));
    };

    const handleClearGroupFilters = () => {
        setGroupFilters({
            query: '',
            status: '',
            page: 0,
            size: groupFilters.size
        });
    };

    const hasActiveAgencyFilters = Boolean(
        agencyFilters.query || agencyFilters.status || agencyFilters.agencyType || agencyFilters.countryId || agencyFilters.cityId
    );

    const hasActiveGroupFilters = Boolean(
        groupFilters.query || groupFilters.status
    );

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
        <div className="flex-1 flex flex-col min-h-0 bg-[#f8f9fa] dark:bg-[#18191c] overflow-y-auto font-roboto">
            {detailModal.isOpen ? (
                <main className="max-w-[1440px] w-full mx-auto px-6 sm:px-10 lg:px-12 xl:px-14 py-6">
                    <SubAgencyDetailView
                        agency={detailModal.agency}
                        onBack={() => setDetailModal({ isOpen: false, agency: null })}
                    />
                </main>
            ) : (
                <>
                    {/* Header - Google Standard */}
                    <header className="sticky top-0 bg-white/95 dark:bg-[#202124]/95 backdrop-blur-md border-b border-[#dadce0] dark:border-[#3c4043] px-6 sm:px-10 lg:px-12 xl:px-14 py-3.5 flex-shrink-0 z-30 transition-all shadow-2xs">
                        <div className="max-w-[1440px] mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-3.5">
                                <div className="w-11 h-11 rounded-2xl bg-[#e8f0fe] dark:bg-[#1a73e8]/20 flex items-center justify-center text-[#1a73e8] dark:text-[#8ab4f8] shrink-0 shadow-2xs">
                                    <span className="material-symbols-outlined text-[24px]">admin_panel_settings</span>
                                </div>
                                <div>
                                    <h1 className="text-xl font-bold text-[#202124] dark:text-[#e8eaed] tracking-tight">{t.pageTitle}</h1>
                                    <p className="text-xs text-[#5f6368] dark:text-[#9aa0a6] mt-0.5">{t.pageSubtitle}</p>
                                </div>
                            </div>

                            {/* Google Material Tabs */}
                            <div className="flex items-center gap-1.5 p-1 bg-white dark:bg-[#303134] rounded-xl border border-[#dadce0] dark:border-[#5f6368] shadow-2xs">
                                <button
                                    type="button"
                                    onClick={() => setActiveTab('agencies')}
                                    className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                                        activeTab === 'agencies'
                                            ? 'bg-[#e8f0fe] text-[#1a73e8] font-semibold dark:bg-[#1a73e8]/25 dark:text-[#8ab4f8] shadow-2xs'
                                            : 'text-[#5f6368] dark:text-slate-300 font-medium hover:bg-[#f1f3f4] dark:hover:bg-[#3c4043]'
                                    }`}
                                >
                                    <span className="material-symbols-outlined text-[18px]">business_center</span>
                                    <span>{t.tabAgencies}</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setActiveTab('groups')}
                                    className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                                        activeTab === 'groups'
                                            ? 'bg-[#e8f0fe] text-[#1a73e8] font-semibold dark:bg-[#1a73e8]/25 dark:text-[#8ab4f8] shadow-2xs'
                                            : 'text-[#5f6368] dark:text-slate-300 font-medium hover:bg-[#f1f3f4] dark:hover:bg-[#3c4043]'
                                    }`}
                                >
                                    <span className="material-symbols-outlined text-[18px]">groups</span>
                                    <span>{t.tabGroups}</span>
                                </button>
                            </div>
                        </div>
                    </header>

                    {/* Main Content Area */}
                    <main className="max-w-[1440px] w-full mx-auto px-6 sm:px-10 lg:px-12 xl:px-14 py-6 space-y-5">
                        {activeTab === 'agencies' ? (
                            <div className="flex flex-col space-y-5">
                                {/* Summary Metric Cards (Matching MyBookings Style) */}
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                                    {[
                                        {
                                            label: t.statTotalAgencies,
                                            value: agencySummary.totalAgencyCount ?? 0,
                                            sub: 'Kayıtlı toplam acente',
                                            icon: 'business_center',
                                            iconColor: 'bg-[#e8f0fe] dark:bg-[#1a73e8]/20 text-[#1a73e8] dark:text-[#8ab4f8]'
                                        },
                                        {
                                            label: t.statActive,
                                            value: agencySummary.activeAgencyCount ?? 0,
                                            sub: 'Aktif çalışan acenteler',
                                            icon: 'check_circle',
                                            iconColor: 'bg-emerald-50 dark:bg-emerald-900/30 text-[#1e8e3e] dark:text-emerald-400'
                                        },
                                        {
                                            label: t.statPassive,
                                            value: agencySummary.passiveAgencyCount ?? 0,
                                            sub: 'Askıya alınan / pasif',
                                            icon: 'pause_circle',
                                            iconColor: 'bg-rose-50 dark:bg-rose-900/30 text-[#d93025] dark:text-rose-400'
                                        },
                                        {
                                            label: t.statDirectIntegration,
                                            value: agencySummary.directIntegrationAgencyCount ?? 0,
                                            sub: 'Doğrudan API entegrasyonu',
                                            icon: 'electric_bolt',
                                            iconColor: 'bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
                                        }
                                    ].map((stat, idx) => (
                                        <div
                                            key={idx}
                                            className="bg-white dark:bg-[#28292c] rounded-2xl border border-[#dadce0] dark:border-[#3c4043] p-4 shadow-xs hover:border-[#1a73e8]/40 transition-all flex flex-col justify-between"
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-[11px] font-bold text-[#5f6368] dark:text-slate-400 uppercase tracking-wider">
                                                    {stat.label}
                                                </span>
                                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${stat.iconColor}`}>
                                                    <span className="material-symbols-outlined text-[18px]">{stat.icon}</span>
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-2xl font-bold text-[#202124] dark:text-white">
                                                    {stat.value}
                                                </div>
                                                <span className="text-[11px] text-[#70757a] dark:text-slate-400">
                                                    {stat.sub}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Table Container (Matching MyBookings Style) */}
                                <div className="bg-white dark:bg-[#28292c] rounded-2xl border border-[#dadce0] dark:border-[#3c4043] shadow-xs overflow-hidden flex flex-col">
                                    {/* Card Header */}
                                    <div className="p-4 border-b border-[#dadce0] dark:border-[#3c4043] flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-[#28292c]">
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-8 h-8 rounded-xl bg-[#e8f0fe] dark:bg-[#1a73e8]/20 flex items-center justify-center text-[#1a73e8] dark:text-[#8ab4f8] shrink-0">
                                                <span className="material-symbols-outlined text-[18px]">business_center</span>
                                            </div>
                                            <h2 className="text-xs font-bold uppercase tracking-wider text-[#202124] dark:text-[#e8eaed]">
                                                {t.tabAgencies}
                                            </h2>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={handleAddClick}
                                            className="h-9 px-4 bg-[#1a73e8] hover:bg-[#1557b0] text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs active:scale-95 cursor-pointer whitespace-nowrap"
                                        >
                                            <span className="material-symbols-outlined text-[18px]">add</span>
                                            <span>{t.addAgency}</span>
                                        </button>
                                    </div>

                                    {/* Toolbar Filters */}
                                    <div className="p-4 border-b border-[#dadce0] dark:border-[#3c4043] flex flex-wrap items-center gap-2.5 bg-white dark:bg-[#28292c]">
                                        <div className="relative flex-1 min-w-[220px] max-w-sm">
                                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#70757a] text-[18px] pointer-events-none">
                                                search
                                            </span>
                                            <input
                                                type="text"
                                                placeholder={t.searchAgencies}
                                                value={agencyFilters.query}
                                                onChange={(e) => handleFilterChange('query', e.target.value)}
                                                className="w-full h-9 pl-9 pr-8 bg-[#f1f3f4] dark:bg-[#303134] border border-transparent focus:border-[#1a73e8] focus:bg-white dark:focus:bg-[#202124] rounded-xl text-[13px] text-[#202124] dark:text-white placeholder-[#70757a] outline-none transition-all shadow-2xs"
                                            />
                                            {agencyFilters.query && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleFilterChange('query', '')}
                                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#70757a] hover:text-[#202124] dark:hover:text-white cursor-pointer"
                                                >
                                                    <span className="material-symbols-outlined text-[16px]">close</span>
                                                </button>
                                            )}
                                        </div>

                                        <div className="relative">
                                            <select
                                                value={agencyFilters.status}
                                                onChange={(e) => handleFilterChange('status', e.target.value)}
                                                className="appearance-none h-9 pl-3 pr-8 bg-white dark:bg-[#303134] border border-[#dadce0] dark:border-[#5f6368] rounded-xl text-[13px] font-medium text-[#3c4043] dark:text-slate-200 outline-none focus:border-[#1a73e8] transition-colors cursor-pointer shadow-2xs hover:bg-[#f8f9fa] dark:hover:bg-[#383a3e]"
                                            >
                                                <option value="">{t.allStatus}</option>
                                                <option value="ACTIVE">{t.active}</option>
                                                <option value="PASSIVE">{t.passive}</option>
                                            </select>
                                            <span className="material-symbols-outlined pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[#70757a] text-[18px]">
                                                expand_more
                                            </span>
                                        </div>

                                        <div className="relative">
                                            <select
                                                value={agencyFilters.agencyType}
                                                onChange={(e) => handleFilterChange('agencyType', e.target.value)}
                                                className="appearance-none h-9 pl-3 pr-8 bg-white dark:bg-[#303134] border border-[#dadce0] dark:border-[#5f6368] rounded-xl text-[13px] font-medium text-[#3c4043] dark:text-slate-200 outline-none focus:border-[#1a73e8] transition-colors cursor-pointer shadow-2xs hover:bg-[#f8f9fa] dark:hover:bg-[#383a3e]"
                                            >
                                                <option value="">{t.allTypes}</option>
                                                <option value="AGENCY">{t.agency}</option>
                                                <option value="RSA">{t.rsa}</option>
                                            </select>
                                            <span className="material-symbols-outlined pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[#70757a] text-[18px]">
                                                expand_more
                                            </span>
                                        </div>

                                        <div className="relative">
                                            <select
                                                value={agencyFilters.countryId}
                                                onChange={(e) => handleFilterChange('countryId', e.target.value)}
                                                className="appearance-none h-9 pl-3 pr-8 bg-white dark:bg-[#303134] border border-[#dadce0] dark:border-[#5f6368] rounded-xl text-[13px] font-medium text-[#3c4043] dark:text-slate-200 outline-none focus:border-[#1a73e8] transition-colors cursor-pointer shadow-2xs hover:bg-[#f8f9fa] dark:hover:bg-[#383a3e] max-w-[180px] truncate"
                                            >
                                                <option value="">{t.allCountries}</option>
                                                {countries.map(c => <option key={c.locationId} value={c.locationId}>{getName(c.name)}</option>)}
                                            </select>
                                            <span className="material-symbols-outlined pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[#70757a] text-[18px]">
                                                expand_more
                                            </span>
                                        </div>

                                        <div className="relative">
                                            <select
                                                value={agencyFilters.cityId}
                                                onChange={(e) => handleFilterChange('cityId', e.target.value)}
                                                disabled={!agencyFilters.countryId}
                                                className="appearance-none h-9 pl-3 pr-8 bg-white dark:bg-[#303134] border border-[#dadce0] dark:border-[#5f6368] rounded-xl text-[13px] font-medium text-[#3c4043] dark:text-slate-200 outline-none focus:border-[#1a73e8] transition-colors cursor-pointer shadow-2xs hover:bg-[#f8f9fa] dark:hover:bg-[#383a3e] disabled:opacity-40 disabled:cursor-not-allowed max-w-[180px] truncate"
                                            >
                                                <option value="">{agencyFilters.countryId ? t.allCities : t.selectCountryFirst}</option>
                                                {cities.map(c => <option key={c.locationId} value={c.locationId}>{getName(c.name)}</option>)}
                                            </select>
                                            <span className="material-symbols-outlined pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[#70757a] text-[18px]">
                                                expand_more
                                            </span>
                                        </div>

                                        {hasActiveAgencyFilters && (
                                            <button
                                                type="button"
                                                onClick={handleClearAgencyFilters}
                                                className="h-9 px-3 rounded-xl border border-[#dadce0] dark:border-[#5f6368] hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs font-medium text-[#d93025] dark:text-rose-400 flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
                                                title="Filtreleri Temizle"
                                            >
                                                <span className="material-symbols-outlined text-[16px]">filter_alt_off</span>
                                                <span>Temizle</span>
                                            </button>
                                        )}

                                        <button
                                            type="button"
                                            onClick={() => { fetchAgencies(); fetchAgencySummary(); }}
                                            className="size-9 rounded-xl border border-[#dadce0] dark:border-[#5f6368] hover:bg-[#f1f3f4] dark:hover:bg-[#303134] flex items-center justify-center text-[#5f6368] dark:text-slate-300 transition-all cursor-pointer shadow-2xs ml-auto"
                                            title="Yenile"
                                        >
                                            <span className={`material-symbols-outlined text-[18px] ${isLoading ? 'animate-spin' : ''}`}>refresh</span>
                                        </button>
                                    </div>

                                    {/* Table matching MyBookings */}
                                    <div className="overflow-x-auto">
                                        <table className="w-full border-collapse">
                                            <thead>
                                                <tr className="bg-[#f8f9fa] dark:bg-[#202124] border-b border-[#dadce0] dark:border-[#3c4043]">
                                                    <th className="px-4 py-3 text-left text-[11px] font-bold text-[#5f6368] dark:text-slate-400 uppercase tracking-wider whitespace-nowrap select-none w-16">{t.colId}</th>
                                                    <th className="px-4 py-3 text-left text-[11px] font-bold text-[#5f6368] dark:text-slate-400 uppercase tracking-wider whitespace-nowrap select-none">{t.colAgency}</th>
                                                    <th className="px-4 py-3 text-left text-[11px] font-bold text-[#5f6368] dark:text-slate-400 uppercase tracking-wider whitespace-nowrap select-none w-24">{t.colType}</th>
                                                    <th className="px-4 py-3 text-left text-[11px] font-bold text-[#5f6368] dark:text-slate-400 uppercase tracking-wider whitespace-nowrap select-none">{t.colLocation}</th>
                                                    <th className="px-4 py-3 text-center text-[11px] font-bold text-[#5f6368] dark:text-slate-400 uppercase tracking-wider whitespace-nowrap select-none w-24">{t.colCurrency}</th>
                                                    <th className="px-4 py-3 text-center text-[11px] font-bold text-[#5f6368] dark:text-slate-400 uppercase tracking-wider whitespace-nowrap select-none w-28">{t.colStatus}</th>
                                                    <th className="px-4 py-3 text-right text-[11px] font-bold text-[#5f6368] dark:text-slate-400 uppercase tracking-wider whitespace-nowrap select-none w-32">{t.colActions}</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {agencies.length > 0 ? (
                                                    agencies.map((agency) => (
                                                        <tr
                                                            key={agency.id}
                                                            className="border-b border-[#dadce0]/60 dark:border-[#3c4043]/60 last:border-0 hover:bg-[#f1f3f4] dark:hover:bg-[#3c4043]/50 even:bg-[#f8f9fa]/50 dark:even:bg-[#202124]/30 transition-colors group"
                                                        >
                                                            <td className="px-4 py-3.5 text-[13px] font-semibold text-[#1a73e8] dark:text-[#8ab4f8] group-hover:underline whitespace-nowrap">
                                                                #{agency.id}
                                                            </td>
                                                            <td className="px-4 py-3.5 text-[13px] font-normal text-[#3c4043] dark:text-slate-300">
                                                                <div className="flex items-center gap-2.5">
                                                                    <div className="size-7 rounded-full bg-[#e8f0fe] dark:bg-[#1a73e8]/20 text-[#1a73e8] dark:text-[#8ab4f8] flex items-center justify-center text-xs font-bold shrink-0">
                                                                        {agency.name?.[0]?.toUpperCase()}
                                                                    </div>
                                                                    <div className="min-w-0">
                                                                        <div className="text-[13px] font-medium text-[#3c4043] dark:text-slate-200 truncate max-w-[210px]" title={agency.name}>
                                                                            {agency.name}
                                                                        </div>
                                                                        {agency.email && (
                                                                            <div className="text-[11px] text-[#70757a] dark:text-slate-400 truncate max-w-[210px]" title={agency.email}>
                                                                                {agency.email}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-3.5 text-[13px] whitespace-nowrap">
                                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium ${
                                                                    agency.agencyType === 'RSA'
                                                                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                                                                        : 'bg-[#e8f0fe] text-[#1a73e8] dark:bg-[#1a73e8]/20 dark:text-[#8ab4f8]'
                                                                }`}>
                                                                    {agency.agencyType}
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-3.5 text-[13px] font-normal text-[#3c4043] dark:text-slate-300 whitespace-nowrap">
                                                                <div className="text-[13px] text-[#3c4043] dark:text-slate-200 truncate max-w-[150px]">{agency.countryName || '-'}</div>
                                                                {agency.cityName && <div className="text-[11px] text-[#70757a] dark:text-slate-400 truncate max-w-[150px]">{agency.cityName}</div>}
                                                            </td>
                                                            <td className="px-4 py-3.5 text-[13px] font-medium text-[#3c4043] dark:text-slate-300 text-center whitespace-nowrap">
                                                                {agency.currency || '-'}
                                                            </td>
                                                            <td className="px-4 py-3.5 text-[13px] whitespace-nowrap">
                                                                <div className="flex items-center justify-center">
                                                                    <AppleSwitch checked={agency.status === 'ACTIVE'} onChange={() => handleStatusToggle(agency)} size="sm" />
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-3.5 text-[13px] whitespace-nowrap text-right">
                                                                <div className="flex items-center justify-end gap-1">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setDetailModal({ isOpen: true, agency })}
                                                                        className="size-8 rounded-full border border-[#dadce0] dark:border-[#5f6368] hover:bg-[#f1f3f4] dark:hover:bg-[#3c4043] text-[#5f6368] dark:text-slate-300 hover:text-[#1a73e8] flex items-center justify-center transition-all cursor-pointer"
                                                                        title={t.agencyDetail}
                                                                    >
                                                                        <span className="material-symbols-outlined text-[18px]">visibility</span>
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleEditClick(agency)}
                                                                        className="size-8 rounded-full border border-[#dadce0] dark:border-[#5f6368] hover:bg-[#f1f3f4] dark:hover:bg-[#3c4043] text-[#5f6368] dark:text-slate-300 hover:text-[#1a73e8] flex items-center justify-center transition-all cursor-pointer"
                                                                        title="Düzenle"
                                                                    >
                                                                        <span className="material-symbols-outlined text-[18px]">edit</span>
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleDeleteClick(agency.id, agency.name)}
                                                                        className="size-8 rounded-full border border-[#dadce0] dark:border-[#5f6368] hover:bg-rose-50 dark:hover:bg-rose-950/30 text-[#5f6368] dark:text-slate-300 hover:text-[#d93025] hover:border-rose-200 flex items-center justify-center transition-all cursor-pointer"
                                                                        title="Sil"
                                                                    >
                                                                        <span className="material-symbols-outlined text-[18px]">delete</span>
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))
                                                ) : !isLoading && (
                                                    <tr>
                                                        <td colSpan="7" className="px-4 py-16 text-center text-[#70757a] dark:text-slate-400">
                                                            <div className="flex flex-col items-center gap-2">
                                                                <span className="material-symbols-outlined text-4xl opacity-50">search_off</span>
                                                                <span className="text-xs font-semibold">{t.noAgenciesFound}</span>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Pagination (Matching MyBookings Style) */}
                                    <div className="border-t border-[#dadce0] dark:border-[#3c4043] px-6 py-4 flex flex-wrap items-center justify-between bg-white dark:bg-[#28292c] gap-3">
                                        <div className="flex items-center gap-2 text-[13px] text-[#5f6368] dark:text-slate-400">
                                            <span>Göster:</span>
                                            <div className="relative">
                                                <select
                                                    value={agencyFilters.size}
                                                    onChange={(e) => handleFilterChange('size', Number(e.target.value))}
                                                    className="appearance-none h-8 pl-2.5 pr-7 bg-white dark:bg-[#202124] border border-[#dadce0] dark:border-[#5f6368] rounded-lg text-xs text-[#202124] dark:text-white outline-none cursor-pointer hover:bg-[#f8f9fa] dark:hover:bg-[#383a3e]"
                                                >
                                                    <option value="10">10</option>
                                                    <option value="20">20</option>
                                                    <option value="50">50</option>
                                                </select>
                                                <span className="material-symbols-outlined pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 text-[#70757a] text-[16px]">
                                                    expand_more
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-3 text-[13px] font-normal">
                                            <span className="text-[#70757a] dark:text-slate-400">
                                                {totalAgencyCount} {t.tabAgencies}
                                            </span>
                                            <div className="flex items-center gap-1">
                                                <button
                                                    type="button"
                                                    disabled={agencyFilters.page === 0}
                                                    onClick={() => handleFilterChange('page', agencyFilters.page - 1)}
                                                    className="size-8 rounded-full border border-[#dadce0] dark:border-[#5f6368] hover:bg-[#f1f3f4] dark:hover:bg-[#3c4043] disabled:opacity-30 disabled:hover:bg-transparent transition-all flex items-center justify-center text-[#5f6368] dark:text-slate-300 cursor-pointer"
                                                >
                                                    <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                                                </button>
                                                <span className="min-w-[32px] h-8 px-2 flex items-center justify-center rounded-full text-xs font-semibold bg-[#1a73e8] text-white shadow-xs">
                                                    {agencyFilters.page + 1}
                                                </span>
                                                <button
                                                    type="button"
                                                    disabled={agencies.length < agencyFilters.size}
                                                    onClick={() => handleFilterChange('page', agencyFilters.page + 1)}
                                                    className="size-8 rounded-full border border-[#dadce0] dark:border-[#5f6368] hover:bg-[#f1f3f4] dark:hover:bg-[#3c4043] disabled:opacity-30 disabled:hover:bg-transparent transition-all flex items-center justify-center text-[#5f6368] dark:text-slate-300 cursor-pointer"
                                                >
                                                    <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col space-y-5">
                                {/* 3 Executive Summary Metric Cards for Groups (Matching MyBookings Style) */}
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                                    {[
                                        {
                                            label: t.statTotalGroups,
                                            value: groupSummary.totalGroupCount ?? 0,
                                            sub: 'Tanımlı acente grupları',
                                            icon: 'groups',
                                            iconColor: 'bg-[#e8f0fe] dark:bg-[#1a73e8]/20 text-[#1a73e8] dark:text-[#8ab4f8]'
                                        },
                                        {
                                            label: t.statActive,
                                            value: groupSummary.activeGroupCount ?? 0,
                                            sub: 'Aktif grup kayıtları',
                                            icon: 'check_circle',
                                            iconColor: 'bg-emerald-50 dark:bg-emerald-900/30 text-[#1e8e3e] dark:text-emerald-400'
                                        },
                                        {
                                            label: t.statPassive,
                                            value: groupSummary.passiveGroupCount ?? 0,
                                            sub: 'Pasife alınan gruplar',
                                            icon: 'pause_circle',
                                            iconColor: 'bg-rose-50 dark:bg-rose-900/30 text-[#d93025] dark:text-rose-400'
                                        }
                                    ].map((stat, idx) => (
                                        <div
                                            key={idx}
                                            className="bg-white dark:bg-[#28292c] rounded-2xl border border-[#dadce0] dark:border-[#3c4043] p-4 shadow-xs hover:border-[#1a73e8]/40 transition-all flex flex-col justify-between"
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-[11px] font-bold text-[#5f6368] dark:text-slate-400 uppercase tracking-wider">
                                                    {stat.label}
                                                </span>
                                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${stat.iconColor}`}>
                                                    <span className="material-symbols-outlined text-[18px]">{stat.icon}</span>
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-2xl font-bold text-[#202124] dark:text-white">
                                                    {stat.value}
                                                </div>
                                                <span className="text-[11px] text-[#70757a] dark:text-slate-400">
                                                    {stat.sub}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Groups Table Container (Matching MyBookings Style) */}
                                <div className="bg-white dark:bg-[#28292c] rounded-2xl border border-[#dadce0] dark:border-[#3c4043] shadow-xs overflow-hidden flex flex-col">
                                    {/* Card Header */}
                                    <div className="p-4 border-b border-[#dadce0] dark:border-[#3c4043] flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-[#28292c]">
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-8 h-8 rounded-xl bg-[#e8f0fe] dark:bg-[#1a73e8]/20 flex items-center justify-center text-[#1a73e8] dark:text-[#8ab4f8] shrink-0">
                                                <span className="material-symbols-outlined text-[18px]">groups</span>
                                            </div>
                                            <h2 className="text-xs font-bold uppercase tracking-wider text-[#202124] dark:text-[#e8eaed]">
                                                {t.tabGroups}
                                            </h2>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={handleAddClick}
                                            className="h-9 px-4 bg-[#1a73e8] hover:bg-[#1557b0] text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs active:scale-95 cursor-pointer whitespace-nowrap"
                                        >
                                            <span className="material-symbols-outlined text-[18px]">add</span>
                                            <span>{t.addGroup}</span>
                                        </button>
                                    </div>

                                    {/* Toolbar */}
                                    <div className="p-4 border-b border-[#dadce0] dark:border-[#3c4043] flex flex-wrap items-center gap-2.5 bg-white dark:bg-[#28292c]">
                                        <div className="relative flex-1 min-w-[220px] max-w-sm">
                                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#70757a] text-[18px] pointer-events-none">
                                                search
                                            </span>
                                            <input
                                                type="text"
                                                placeholder={t.searchGroups}
                                                value={groupFilters.query}
                                                onChange={(e) => handleGroupFilterChange('query', e.target.value)}
                                                className="w-full h-9 pl-9 pr-8 bg-[#f1f3f4] dark:bg-[#303134] border border-transparent focus:border-[#1a73e8] focus:bg-white dark:focus:bg-[#202124] rounded-xl text-[13px] text-[#202124] dark:text-white placeholder-[#70757a] outline-none transition-all shadow-2xs"
                                            />
                                            {groupFilters.query && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleGroupFilterChange('query', '')}
                                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#70757a] hover:text-[#202124] dark:hover:text-white cursor-pointer"
                                                >
                                                    <span className="material-symbols-outlined text-[16px]">close</span>
                                                </button>
                                            )}
                                        </div>

                                        <div className="relative">
                                            <select
                                                value={groupFilters.status}
                                                onChange={(e) => handleGroupFilterChange('status', e.target.value)}
                                                className="appearance-none h-9 pl-3 pr-8 bg-white dark:bg-[#303134] border border-[#dadce0] dark:border-[#5f6368] rounded-xl text-[13px] font-medium text-[#3c4043] dark:text-slate-200 outline-none focus:border-[#1a73e8] transition-colors cursor-pointer shadow-2xs hover:bg-[#f8f9fa] dark:hover:bg-[#383a3e]"
                                            >
                                                <option value="">{t.allStatus}</option>
                                                <option value="ACTIVE">{t.active}</option>
                                                <option value="PASSIVE">{t.passive}</option>
                                            </select>
                                            <span className="material-symbols-outlined pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[#70757a] text-[18px]">
                                                expand_more
                                            </span>
                                        </div>

                                        {hasActiveGroupFilters && (
                                            <button
                                                type="button"
                                                onClick={handleClearGroupFilters}
                                                className="h-9 px-3 rounded-xl border border-[#dadce0] dark:border-[#5f6368] hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs font-medium text-[#d93025] dark:text-rose-400 flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
                                                title="Filtreleri Temizle"
                                            >
                                                <span className="material-symbols-outlined text-[16px]">filter_alt_off</span>
                                                <span>Temizle</span>
                                            </button>
                                        )}

                                        <button
                                            type="button"
                                            onClick={() => { fetchAgencyGroups(); fetchGroupSummary(); }}
                                            className="size-9 rounded-xl border border-[#dadce0] dark:border-[#5f6368] hover:bg-[#f1f3f4] dark:hover:bg-[#303134] flex items-center justify-center text-[#5f6368] dark:text-slate-300 transition-all cursor-pointer shadow-2xs ml-auto"
                                            title="Yenile"
                                        >
                                            <span className={`material-symbols-outlined text-[18px] ${isGroupsLoading ? 'animate-spin' : ''}`}>refresh</span>
                                        </button>
                                    </div>

                                    {/* Groups Table */}
                                    <div className="overflow-x-auto">
                                        <table className="w-full border-collapse">
                                            <thead>
                                                <tr className="bg-[#f8f9fa] dark:bg-[#202124] border-b border-[#dadce0] dark:border-[#3c4043]">
                                                    <th className="px-4 py-3 text-left text-[11px] font-bold text-[#5f6368] dark:text-slate-400 uppercase tracking-wider whitespace-nowrap select-none w-16">{t.colId}</th>
                                                    <th className="px-4 py-3 text-left text-[11px] font-bold text-[#5f6368] dark:text-slate-400 uppercase tracking-wider whitespace-nowrap select-none">{t.colGroupName}</th>
                                                    <th className="px-4 py-3 text-left text-[11px] font-bold text-[#5f6368] dark:text-slate-400 uppercase tracking-wider whitespace-nowrap select-none">{t.colDescription}</th>
                                                    <th className="px-4 py-3 text-left text-[11px] font-bold text-[#5f6368] dark:text-slate-400 uppercase tracking-wider whitespace-nowrap select-none">{t.colAgenciesCount}</th>
                                                    <th className="px-4 py-3 text-center text-[11px] font-bold text-[#5f6368] dark:text-slate-400 uppercase tracking-wider whitespace-nowrap select-none w-28">{t.colStatus}</th>
                                                    <th className="px-4 py-3 text-right text-[11px] font-bold text-[#5f6368] dark:text-slate-400 uppercase tracking-wider whitespace-nowrap select-none w-28">{t.colActions}</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {isGroupsLoading ? (
                                                    [...Array(5)].map((_, i) => (
                                                        <tr key={i} className="border-b border-[#dadce0]/60 dark:border-[#3c4043]/60 even:bg-[#f8f9fa]/50 dark:even:bg-[#202124]/30">
                                                            <td colSpan="6" className="px-4 py-3.5"><div className="h-3.5 bg-slate-200/80 dark:bg-slate-700/60 rounded animate-pulse w-full"></div></td>
                                                        </tr>
                                                    ))
                                                ) : agencyGroups.length > 0 ? (
                                                    agencyGroups.map((group) => (
                                                        <tr
                                                            key={group.name}
                                                            className="border-b border-[#dadce0]/60 dark:border-[#3c4043]/60 last:border-0 hover:bg-[#f1f3f4] dark:hover:bg-[#3c4043]/50 even:bg-[#f8f9fa]/50 dark:even:bg-[#202124]/30 transition-colors group"
                                                        >
                                                            <td className="px-4 py-3.5 text-[13px] font-semibold text-[#1a73e8] dark:text-[#8ab4f8] group-hover:underline whitespace-nowrap">
                                                                #{group.id || '-'}
                                                            </td>
                                                            <td className="px-4 py-3.5 text-[13px] font-medium text-[#3c4043] dark:text-slate-200 whitespace-nowrap">
                                                                {group.name}
                                                            </td>
                                                            <td className="px-4 py-3.5 text-[13px] font-normal text-[#3c4043] dark:text-slate-300">
                                                                <p className="text-[13px] text-[#70757a] dark:text-slate-400 line-clamp-1 max-w-sm">{group.description || '-'}</p>
                                                            </td>
                                                            <td className="px-4 py-3.5 text-[13px] whitespace-nowrap">
                                                                <span className="inline-flex items-center px-2.5 py-0.5 bg-[#e8f0fe] dark:bg-[#1a73e8]/20 text-[#1a73e8] dark:text-[#8ab4f8] rounded-full text-[11px] font-medium">
                                                                    {group.agencies?.length || 0} {t.tabAgencies}
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-3.5 text-[13px] whitespace-nowrap">
                                                                <div className="flex items-center justify-center">
                                                                    <AppleSwitch checked={group.status === 'ACTIVE'} onChange={() => handleGroupStatusToggle(group)} size="sm" />
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-3.5 text-[13px] whitespace-nowrap text-right">
                                                                <div className="flex items-center justify-end gap-1">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleGroupEditClick(group)}
                                                                        className="size-8 rounded-full border border-[#dadce0] dark:border-[#5f6368] hover:bg-[#f1f3f4] dark:hover:bg-[#3c4043] text-[#5f6368] dark:text-slate-300 hover:text-[#1a73e8] flex items-center justify-center transition-all cursor-pointer"
                                                                        title={t.editGroup}
                                                                    >
                                                                        <span className="material-symbols-outlined text-[18px]">edit</span>
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleGroupDeleteClick(group)}
                                                                        className="size-8 rounded-full border border-[#dadce0] dark:border-[#5f6368] hover:bg-rose-50 dark:hover:bg-rose-950/30 text-[#5f6368] dark:text-slate-300 hover:text-[#d93025] hover:border-rose-200 flex items-center justify-center transition-all cursor-pointer"
                                                                        title={t.deleteGroup}
                                                                    >
                                                                        <span className="material-symbols-outlined text-[18px]">delete</span>
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))
                                                ) : !isGroupsLoading && (
                                                    <tr>
                                                        <td colSpan="6" className="px-4 py-16 text-center text-[#70757a] dark:text-slate-400">
                                                            <div className="flex flex-col items-center gap-2">
                                                                <span className="material-symbols-outlined text-4xl opacity-50">group_off</span>
                                                                <span className="text-xs font-semibold">{t.noGroupsFound}</span>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Pagination (Matching MyBookings Style) */}
                                    <div className="border-t border-[#dadce0] dark:border-[#3c4043] px-6 py-4 flex flex-wrap items-center justify-between bg-white dark:bg-[#28292c] gap-3">
                                        <div className="flex items-center gap-2 text-[13px] text-[#5f6368] dark:text-slate-400">
                                            <span>Göster:</span>
                                            <div className="relative">
                                                <select
                                                    value={groupFilters.size}
                                                    onChange={(e) => handleGroupFilterChange('size', Number(e.target.value))}
                                                    className="appearance-none h-8 pl-2.5 pr-7 bg-white dark:bg-[#202124] border border-[#dadce0] dark:border-[#5f6368] rounded-lg text-xs text-[#202124] dark:text-white outline-none cursor-pointer hover:bg-[#f8f9fa] dark:hover:bg-[#383a3e]"
                                                >
                                                    <option value="10">10</option>
                                                    <option value="20">20</option>
                                                    <option value="50">50</option>
                                                </select>
                                                <span className="material-symbols-outlined pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 text-[#70757a] text-[16px]">
                                                    expand_more
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-3 text-[13px] font-normal">
                                            <span className="text-[#70757a] dark:text-slate-400">
                                                {totalGroupCount} {t.tabGroups}
                                            </span>
                                            <div className="flex items-center gap-1">
                                                <button
                                                    type="button"
                                                    disabled={groupFilters.page === 0}
                                                    onClick={() => handleGroupFilterChange('page', groupFilters.page - 1)}
                                                    className="size-8 rounded-full border border-[#dadce0] dark:border-[#5f6368] hover:bg-[#f1f3f4] dark:hover:bg-[#3c4043] disabled:opacity-30 disabled:hover:bg-transparent transition-all flex items-center justify-center text-[#5f6368] dark:text-slate-300 cursor-pointer"
                                                >
                                                    <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                                                </button>
                                                <span className="min-w-[32px] h-8 px-2 flex items-center justify-center rounded-full text-xs font-semibold bg-[#1a73e8] text-white shadow-xs">
                                                    {groupFilters.page + 1}
                                                </span>
                                                <button
                                                    type="button"
                                                    disabled={agencyGroups.length < groupFilters.size}
                                                    onClick={() => handleGroupFilterChange('page', groupFilters.page + 1)}
                                                    className="size-8 rounded-full border border-[#dadce0] dark:border-[#5f6368] hover:bg-[#f1f3f4] dark:hover:bg-[#3c4043] disabled:opacity-30 disabled:hover:bg-transparent transition-all flex items-center justify-center text-[#5f6368] dark:text-slate-300 cursor-pointer"
                                                >
                                                    <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </main>

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

