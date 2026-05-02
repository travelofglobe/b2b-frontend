import React, { useState, useEffect, useCallback } from 'react';
import { agencyService } from '../services/agencyService';
import { agencyGroupService } from '../services/agencyGroupService';
import { locationService } from '../services/locationService';
import AddAgencyModal from '../components/AddAgencyModal';
import AddAgencyGroupModal from '../components/AddAgencyGroupModal';
import ConfirmModal from '../components/ConfirmModal';

const GSAAgencyManagement = () => {
    const [activeTab, setActiveTab] = useState('agencies');
    const [isLoading, setIsLoading] = useState(false);
    
    // Modal Management
    const [agencyModal, setAgencyModal] = useState({ isOpen: false, mode: 'add', data: null });
    const [groupModal, setGroupModal] = useState({ isOpen: false, mode: 'add', data: null });
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null, name: '', type: 'agency', isDeleting: false });
    
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

    useEffect(() => {
        if (activeTab === 'agencies') {
            fetchAgencies();
        }
    }, [fetchAgencies, activeTab]);

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

    useEffect(() => {
        if (activeTab === 'groups') {
            fetchAgencyGroups();
        }
    }, [fetchAgencyGroups, activeTab]);

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
        } catch (error) {
            console.error('Error toggling group status:', error);
            fetchAgencyGroups();
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

    const handleGroupDeleteClick = (id, name) => {
        setDeleteModal({ isOpen: true, id, name, type: 'group', isDeleting: false });
    };

    const confirmDelete = async () => {
        setDeleteModal(prev => ({ ...prev, isDeleting: true }));
        try {
            if (deleteModal.type === 'agency') {
                await agencyService.deleteAgency(deleteModal.id);
                fetchAgencies();
            } else {
                await agencyGroupService.deleteGroup(deleteModal.id);
                fetchAgencyGroups();
            }
            setDeleteModal({ isOpen: false, id: null, name: '', type: 'agency', isDeleting: false });
        } catch (error) {
            console.error('Error deleting:', error);
            alert(error.message || `Failed to delete ${deleteModal.type}`);
            setDeleteModal(prev => ({ ...prev, isDeleting: false }));
        }
    };

    const handleDeleteClick = (id, name) => {
        setDeleteModal({ isOpen: true, id, name, type: 'agency', isDeleting: false });
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
        } catch (error) {
            console.error('Error toggling status:', error);
            fetchAgencies();
            alert('Failed to update status');
        }
    };

    return (
        <div className="h-full flex flex-col p-8 space-y-6 overflow-hidden bg-slate-50/50 dark:bg-transparent">
            {/* Header Area - Clean Title Only */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
                <div>
                    <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight leading-none mb-2">Agency Management</h1>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Manage GSA agencies and users</p>
                </div>
                {/* Add Agency button removed from global header */}
            </div>

            {/* Tabs */}
            <div className="flex items-center p-1.5 bg-slate-100/80 dark:bg-slate-900/50 backdrop-blur rounded-2xl w-fit shrink-0">
                <button 
                    onClick={() => setActiveTab('agencies')}
                    className={`flex items-center gap-2 px-6 py-2 rounded-xl text-[11px] font-bold transition-all ${activeTab === 'agencies' ? 'bg-white dark:bg-primary text-primary dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-100'}`}
                >
                    <span className="material-icons-round text-lg">business_center</span>
                    Agencies
                </button>
                <button 
                    onClick={() => setActiveTab('groups')}
                    className={`flex items-center gap-2 px-6 py-2 rounded-xl text-[11px] font-bold transition-all ${activeTab === 'groups' ? 'bg-white dark:bg-primary text-primary dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-100'}`}
                >
                    <span className="material-icons-round text-lg">groups</span>
                    Agency Groups
                </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-hidden flex flex-col min-h-0">
                {activeTab === 'agencies' ? (
                    <div className="space-y-6 flex flex-col h-full overflow-hidden">
                        {/* Filters Row - Integrated Add Agency Button */}
                        <div className="flex flex-col lg:flex-row items-center gap-4 shrink-0">
                            <div className="relative flex-[3] w-full">
                                <span className="material-icons-round absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
                                <input 
                                    type="text" 
                                    placeholder="Search by name, country, or ID..." 
                                    value={agencyFilters.query}
                                    onChange={(e) => handleFilterChange('query', e.target.value)}
                                    className="w-full h-11 bg-white dark:bg-slate-900/50 border border-slate-100 dark:border-white/5 rounded-2xl pl-12 pr-4 text-[11px] font-semibold outline-none focus:border-primary transition-colors shadow-sm"
                                />
                            </div>
                            
                            <select 
                                value={agencyFilters.status}
                                onChange={(e) => handleFilterChange('status', e.target.value)}
                                className="h-11 px-4 bg-white dark:bg-slate-900/50 border border-slate-100 dark:border-white/5 rounded-2xl text-[11px] font-bold outline-none cursor-pointer flex-[1] shadow-sm"
                            >
                                <option value="">All Status</option>
                                <option value="ACTIVE">Active</option>
                                <option value="PASSIVE">Passive</option>
                            </select>

                            <select 
                                value={agencyFilters.agencyType}
                                onChange={(e) => handleFilterChange('agencyType', e.target.value)}
                                className="h-11 px-4 bg-white dark:bg-slate-900/50 border border-slate-100 dark:border-white/5 rounded-2xl text-[11px] font-bold outline-none cursor-pointer flex-[1] shadow-sm"
                            >
                                <option value="">All Types</option>
                                <option value="AGENCY">Agency</option>
                                <option value="RSA">RSA</option>
                            </select>

                            {/* MOVED BUTTON: Now inside the Agencies tab div */}
                            <button 
                                onClick={handleAddClick}
                                className="h-11 px-6 bg-primary text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 flex items-center justify-center gap-2 active:scale-95 transition-all hover:scale-[1.02] flex-[1] whitespace-nowrap"
                            >
                                <span className="material-icons-round text-lg">add</span>
                                Add Agency
                            </button>
                        </div>
                        
                        {/* Location Selectors */}
                        <div className="flex items-center gap-4 py-3 px-6 bg-white dark:bg-slate-900/20 rounded-[24px] border border-slate-100 dark:border-white/5 shadow-sm shrink-0">
                            <div className="flex items-center gap-2 text-slate-400">
                                <span className="material-icons-round text-lg">location_on</span>
                                <span className="text-[10px] font-black uppercase tracking-widest">Location:</span>
                            </div>
                            <select 
                                value={agencyFilters.countryId}
                                onChange={(e) => handleFilterChange('countryId', e.target.value)}
                                className="bg-transparent text-[11px] font-bold text-slate-600 dark:text-slate-300 outline-none cursor-pointer"
                            >
                                <option value="">Select country</option>
                                {countries.map(country => (
                                    <option key={country.locationId} value={country.locationId}>{getName(country.name)}</option>
                                ))}
                            </select>
                            <div className="h-4 w-[1px] bg-slate-200 dark:bg-slate-800 mx-2"></div>
                            <select 
                                value={agencyFilters.cityId}
                                onChange={(e) => handleFilterChange('cityId', e.target.value)}
                                disabled={!agencyFilters.countryId}
                                className={`bg-transparent text-[11px] font-bold outline-none ${!agencyFilters.countryId ? 'text-slate-400 cursor-not-allowed' : 'text-slate-600 dark:text-slate-300 cursor-pointer'}`}
                            >
                                <option value="">{agencyFilters.countryId ? 'Select city' : 'Select country first'}</option>
                                {cities.map(city => (
                                    <option key={city.locationId} value={city.locationId}>{getName(city.name)}</option>
                                ))}
                            </select>
                            
                            {isLoading && (
                                <div className="ml-auto flex items-center gap-2">
                                    <div className="size-3 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                                    <span className="text-[10px] font-bold text-primary animate-pulse">Updating...</span>
                                </div>
                            )}
                        </div>

                        {/* Table */}
                        <div className="flex-1 bg-white dark:bg-slate-900/50 backdrop-blur-3xl rounded-[32px] border border-slate-100 dark:border-white/5 overflow-hidden shadow-sm flex flex-col relative min-h-0">
                            {isLoading && agencies.length === 0 && (
                                <div className="absolute inset-0 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm z-10 flex items-center justify-center">
                                    <div className="flex flex-col items-center gap-3">
                                        <div className="size-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                                        <span className="text-[10px] font-black text-primary uppercase tracking-widest">Loading Agencies</span>
                                    </div>
                                </div>
                            )}
                            
                            <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                                <table className="w-full text-left">
                                    <thead className="sticky top-0 bg-white dark:bg-slate-900 z-10 shadow-[0_1px_0_0_rgba(0,0,0,0.05)] dark:shadow-[0_1px_0_0_rgba(255,255,255,0.05)]">
                                        <tr>
                                            <th className="px-4 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest w-20">ID</th>
                                            <th className="px-4 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Agency</th>
                                            <th className="px-4 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest w-28">Type</th>
                                            <th className="px-4 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Location</th>
                                            <th className="px-4 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest w-28 text-center">Currency</th>
                                            <th className="px-4 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest w-40 text-center">Status</th>
                                            <th className="px-4 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50 dark:divide-white/5">
                                        {agencies.length > 0 ? (
                                            agencies.map((agency) => (
                                                <tr key={agency.id} className="group hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors">
                                                    <td className="px-4 py-4">
                                                        <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-[10px] font-black text-slate-500 uppercase tracking-tight">
                                                            {agency.id}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <div className="flex flex-col">
                                                            <span className="font-bold text-slate-800 dark:text-white text-[11px] truncate max-w-[150px]">{agency.name}</span>
                                                            <span className="text-[9px] text-slate-400 font-medium truncate max-w-[200px]">{agency.email}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-tight ${agency.agencyType === 'RSA' ? 'bg-emerald-50 text-emerald-500 dark:bg-emerald-900/30' : 'bg-blue-50 text-blue-500 dark:bg-blue-900/30'}`}>
                                                            {agency.agencyType}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-4 flex flex-col">
                                                        <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 truncate max-w-[120px]">{agency.countryName}</span>
                                                        <span className="text-[9px] font-bold text-slate-400 truncate max-w-[120px]">{agency.cityName}</span>
                                                    </td>
                                                    <td className="px-4 py-4 text-[11px] font-black text-slate-700 dark:text-slate-300 text-center">{agency.currency}</td>
                                                    <td className="px-4 py-4">
                                                        <div className="flex flex-col items-center gap-1 group/status">
                                                            <div 
                                                                onClick={() => handleStatusToggle(agency)}
                                                                className={`relative inline-flex h-4.5 w-9 items-center rounded-full transition-all cursor-pointer shadow-sm hover:scale-110 active:scale-95 duration-300 ${
                                                                    agency.status === 'ACTIVE' 
                                                                    ? 'bg-emerald-500 shadow-md shadow-emerald-500/20' 
                                                                    : 'bg-slate-200 dark:bg-slate-800'
                                                                }`}
                                                            >
                                                                <span 
                                                                    className={`inline-block size-3 transform rounded-full bg-white shadow-sm transition-all duration-300 ${
                                                                        agency.status === 'ACTIVE' ? 'translate-x-[22px]' : 'translate-x-0.5'
                                                                    }`} 
                                                                />
                                                            </div>
                                                            <span className={`text-[9px] font-black uppercase tracking-widest transition-colors duration-300 ${
                                                                agency.status === 'ACTIVE' ? 'text-emerald-500' : 'text-slate-400'
                                                            }`}>
                                                                {agency.status === 'ACTIVE' ? 'Active' : 'Passive'}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-4 text-right">
                                                        <div className="flex items-center justify-end gap-1">
                                                            <button 
                                                                onClick={() => handleEditClick(agency)}
                                                                className="size-8 rounded-xl flex items-center justify-center text-slate-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-500 transition-all active:scale-90"
                                                            >
                                                                <span className="material-icons-round text-lg">edit</span>
                                                            </button>
                                                            <button 
                                                                onClick={() => handleDeleteClick(agency.id, agency.name)}
                                                                className="size-8 rounded-xl flex items-center justify-center text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 transition-all active:scale-90"
                                                            >
                                                                <span className="material-icons-round text-lg">delete_outline</span>
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : !isLoading && (
                                            <tr>
                                                <td colSpan="7" className="py-20 text-center">
                                                    <div className="flex flex-col items-center gap-2 text-slate-300">
                                                        <span className="material-icons-round text-5xl">search_off</span>
                                                        <span className="text-[11px] font-black uppercase tracking-[0.2em]">No agencies found</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            
                            {/* Table Footer */}
                            <div className="p-4 border-t border-slate-50 dark:border-white/5 flex items-center justify-between shrink-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{totalAgencyCount} Agencies found</span>
                                <div className="flex gap-2">
                                     <button 
                                        disabled={agencyFilters.page === 0}
                                        onClick={() => handleFilterChange('page', agencyFilters.page - 1)}
                                        className="size-8 rounded-xl border border-slate-100 dark:border-white/5 flex items-center justify-center text-slate-400 disabled:opacity-30 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm"
                                    >
                                        <span className="material-icons-round text-lg">chevron_left</span>
                                     </button>
                                     <button 
                                        disabled={agencies.length < agencyFilters.size}
                                        onClick={() => handleFilterChange('page', agencyFilters.page + 1)}
                                        className="size-8 rounded-xl border border-slate-100 dark:border-white/5 flex items-center justify-center text-slate-400 disabled:opacity-30 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm"
                                    >
                                        <span className="material-icons-round text-lg">chevron_right</span>
                                     </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6 flex flex-col h-full overflow-hidden animate-in fade-in duration-500">
                        {/* Group Filters Row */}
                        <div className="flex flex-col lg:flex-row items-center gap-4 shrink-0">
                            <div className="relative flex-[3] w-full">
                                <span className="material-icons-round absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
                                <input 
                                    type="text" 
                                    placeholder="Search by name or description..." 
                                    value={groupFilters.query}
                                    onChange={(e) => handleGroupFilterChange('query', e.target.value)}
                                    className="w-full h-11 bg-white dark:bg-slate-900/50 border border-slate-100 dark:border-white/5 rounded-2xl pl-12 pr-4 text-[11px] font-semibold outline-none focus:border-primary transition-colors shadow-sm"
                                />
                            </div>
                            
                            <select 
                                value={groupFilters.status}
                                onChange={(e) => handleGroupFilterChange('status', e.target.value)}
                                className="h-11 px-4 bg-white dark:bg-slate-900/50 border border-slate-100 dark:border-white/5 rounded-2xl text-[11px] font-bold outline-none cursor-pointer flex-[1] shadow-sm ml-auto"
                            >
                                <option value="">All Status</option>
                                <option value="ACTIVE">Active</option>
                                <option value="PASSIVE">Passive</option>
                            </select>

                            <button 
                                onClick={handleAddClick}
                                className="h-11 px-6 bg-primary text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 flex items-center justify-center gap-2 active:scale-95 transition-all hover:scale-[1.02] flex-[1] whitespace-nowrap"
                            >
                                <span className="material-icons-round text-lg">add</span>
                                Add Group
                            </button>
                        </div>

                        {/* Groups Table */}
                        <div className="flex-1 overflow-hidden bg-white dark:bg-slate-900/50 rounded-[32px] border border-slate-100 dark:border-white/5 shadow-sm flex flex-col">
                            <div className="flex-1 overflow-auto">
                                <table className="w-full border-collapse text-left">
                                    <thead className="sticky top-0 z-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur border-b border-slate-50 dark:border-white/5">
                                        <tr>
                                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">ID</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Group Name</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Description</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Agencies</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Created By</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50 dark:divide-white/5">
                                        {isGroupsLoading ? (
                                            [...Array(5)].map((_, i) => (
                                                <tr key={i} className="animate-pulse">
                                                    <td colSpan="7" className="px-6 py-4"><div className="h-8 bg-slate-100 dark:bg-slate-800 rounded-xl w-full"></div></td>
                                                </tr>
                                            ))
                                        ) : agencyGroups.length > 0 ? (
                                            agencyGroups.map((group) => (
                                                <tr key={group.name} className="group hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                                                    <td className="px-6 py-4">
                                                        <span className="text-[11px] font-bold text-slate-400 tracking-tight">#{group.id || '-'}</span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-col">
                                                            <span className="text-sm font-bold text-slate-900 dark:text-white">{group.name}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <p className="text-[11px] text-slate-500 line-clamp-1 max-w-xs">{group.description}</p>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-2">
                                                            <div className="px-2.5 py-1 bg-blue-50 dark:bg-blue-900/20 text-primary dark:text-blue-400 rounded-lg text-[10px] font-black uppercase tracking-wider">
                                                                {group.agencies?.length || 0} Agencies
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-col">
                                                            <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">{group.createdBy || 'System'}</span>
                                                            <span className="text-[9px] text-slate-400">{new Date(group.createDateTime).toLocaleDateString()}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div 
                                                                onClick={() => handleGroupStatusToggle(group)}
                                                                className={`relative inline-flex h-4.5 w-9 items-center rounded-full transition-all cursor-pointer shadow-sm hover:scale-110 active:scale-95 duration-300 ${
                                                                    group.status === 'ACTIVE' 
                                                                    ? 'bg-emerald-500 shadow-md shadow-emerald-500/20' 
                                                                    : 'bg-slate-200 dark:bg-slate-800'
                                                                }`}
                                                            >
                                                                <span 
                                                                    className={`inline-block size-3 transform rounded-full bg-white shadow-sm transition-all duration-300 ${
                                                                        group.status === 'ACTIVE' ? 'translate-x-[22px]' : 'translate-x-0.5'
                                                                    }`} 
                                                                />
                                                            </div>
                                                            <span className={`text-[9px] font-black uppercase tracking-widest transition-colors duration-300 ${
                                                                group.status === 'ACTIVE' ? 'text-emerald-500' : 'text-slate-400'
                                                            }`}>
                                                                {group.status === 'ACTIVE' ? 'Active' : 'Passive'}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="flex items-center justify-end gap-1">
                                                            <button 
                                                                onClick={() => handleGroupEditClick(group)}
                                                                className="size-8 rounded-xl flex items-center justify-center text-slate-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-500 transition-all active:scale-90"
                                                            >
                                                                <span className="material-icons-round text-lg">edit</span>
                                                            </button>
                                                            <button 
                                                                onClick={() => handleGroupDeleteClick(group.id, group.name)}
                                                                className="size-8 rounded-xl flex items-center justify-center text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 transition-all active:scale-90"
                                                            >
                                                                <span className="material-icons-round text-lg">delete_outline</span>
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : !isGroupsLoading && (
                                            <tr>
                                                <td colSpan="6" className="py-20 text-center text-slate-300">
                                                    <span className="material-icons-round text-5xl block mb-2">group_off</span>
                                                    <span className="text-[11px] font-black uppercase tracking-widest">No groups found</span>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Table Footer */}
                            <div className="p-4 border-t border-slate-50 dark:border-white/5 flex items-center justify-between shrink-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{totalGroupCount} Groups found</span>
                                <div className="flex gap-2">
                                     <button 
                                        disabled={groupFilters.page === 0}
                                        onClick={() => handleGroupFilterChange('page', groupFilters.page - 1)}
                                        className="size-8 rounded-xl border border-slate-100 dark:border-white/5 flex items-center justify-center text-slate-400 disabled:opacity-30 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm"
                                    >
                                        <span className="material-icons-round text-lg">chevron_left</span>
                                     </button>
                                     <button 
                                        disabled={agencyGroups.length < groupFilters.size}
                                        onClick={() => handleGroupFilterChange('page', groupFilters.page + 1)}
                                        className="size-8 rounded-xl border border-slate-100 dark:border-white/5 flex items-center justify-center text-slate-400 disabled:opacity-30 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm"
                                    >
                                        <span className="material-icons-round text-lg">chevron_right</span>
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
                onSuccess={fetchAgencies}
                mode={agencyModal.mode}
                initialData={agencyModal.data}
            />

            <AddAgencyGroupModal 
                isOpen={groupModal.isOpen} 
                onClose={() => setGroupModal({ ...groupModal, isOpen: false })} 
                onSuccess={fetchAgencyGroups}
                mode={groupModal.mode}
                initialData={groupModal.data}
            />

            <ConfirmModal 
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal({ ...deleteModal, isOpen: false })}
                onConfirm={confirmDelete}
                isLoading={deleteModal.isDeleting}
                title={deleteModal.type === 'agency' ? 'Delete Agency' : 'Delete Agency Group'}
                message={
                    <span>
                        Are you sure you want to permanently delete <b className="text-slate-900 dark:text-white uppercase">{deleteModal.name}</b>? 
                        This action cannot be undone.
                    </span>
                }
                confirmText={deleteModal.isDeleting ? "Deleting..." : `Yes, Delete ${deleteModal.type === 'agency' ? 'Agency' : 'Group'}`}
                cancelText={`Keep ${deleteModal.type === 'agency' ? 'Agency' : 'Group'}`}
                type="danger"
            />
        </div>
    );
};

export default GSAAgencyManagement;
