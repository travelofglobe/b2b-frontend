import React, { useState, useEffect, useCallback } from 'react';
import { agencyService } from '../services/agencyService';
import { locationService } from '../services/locationService';
import AddAgencyModal from '../components/AddAgencyModal';

const GSAAgencyManagement = () => {
    const [activeTab, setActiveTab] = useState('agencies');
    const [isLoading, setIsLoading] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    
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

    // Groups State (Mocked for now as per previous design)
    const [groupFilters, setGroupFilters] = useState({ query: '', status: '' });
    const groups = [
        { id: 1, name: 'European Partners', description: 'All European based travel agencies', agencyCount: 4, status: 'ACTIVE', created: '1/15/2024' },
        { id: 2, name: 'US Network', description: 'United States agency network', agencyCount: 4, status: 'ACTIVE', created: '2/1/2024' },
        { id: 3, name: 'Asia Pacific', description: 'APAC region agencies', agencyCount: 1, status: 'ACTIVE', created: '2/20/2024' },
        { id: 4, name: 'Premium Tier', description: 'High volume premium agencies', agencyCount: 3, status: 'ACTIVE', created: '3/10/2024' },
        { id: 5, name: 'Legacy Partners', description: 'Long-term partnership agencies - archived', agencyCount: 0, status: 'PASSIVE', created: '11/5/2023' },
    ];

    // Language Helper (hardcoded to 'en' for now, consistent with app patterns)
    const getName = (obj, lang = 'en') => {
        if (!obj) return '';
        if (typeof obj === 'string') return obj;
        return obj.translations?.[lang] || obj.translations?.tr || obj.defaultName || '';
    };

    // Fetch Countries on Mount
    useEffect(() => {
        const fetchCountries = async () => {
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
        };
        fetchCountries();
    }, []);

    // Fetch Cities when Country changes
    useEffect(() => {
        if (!agencyFilters.countryId) {
            setCities([]);
            setAgencyFilters(prev => ({ ...prev, cityId: '' }));
            return;
        }

        const fetchCities = async () => {
            try {
                const country = countries.find(c => c.locationId === Number(agencyFilters.countryId));
                if (country) {
                    const response = await locationService.listSubRegions(country.locationId);
                    if (response && response.locationList) {
                        setCities(response.locationList.sort((a, b) => 
                            getName(a.name).localeCompare(getName(b.name))
                        ));
                    }
                }
            } catch (error) {
                console.error('Error fetching cities:', error);
            }
        };
        fetchCities();
    }, [agencyFilters.countryId, countries]);

    // Fetch Agencies when filters change
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

    return (
        <div className="h-full flex flex-col p-8 space-y-6 overflow-hidden">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight leading-none mb-2">Agency Management</h1>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Manage GSA agencies and users</p>
                </div>
                <button 
                    onClick={() => setIsAddModalOpen(true)}
                    className="h-10 px-6 bg-primary text-white rounded-2xl text-[11px] font-bold shadow-lg shadow-primary/20 flex items-center gap-2 active:scale-95 transition-all"
                >
                    <span className="material-icons-round text-lg">add</span>
                    Add Agency
                </button>
            </div>

            {/* Tabs */}
            <div className="flex items-center p-1.5 bg-slate-100 dark:bg-slate-900/50 rounded-2xl w-fit">
                <button 
                    onClick={() => setActiveTab('agencies')}
                    className={`flex items-center gap-2 px-6 py-2 rounded-xl text-[11px] font-bold transition-all ${activeTab === 'agencies' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-100'}`}
                >
                    <span className="material-icons-round text-lg">business_center</span>
                    Agencies
                </button>
                <button 
                    onClick={() => setActiveTab('groups')}
                    className={`flex items-center gap-2 px-6 py-2 rounded-xl text-[11px] font-bold transition-all ${activeTab === 'groups' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-100'}`}
                >
                    <span className="material-icons-round text-lg">groups</span>
                    Agency Groups
                </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-hidden flex flex-col">
                {activeTab === 'agencies' ? (
                    <div className="space-y-6 flex flex-col h-full">
                        {/* Filters */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                            <div className="relative col-span-1">
                                <span className="material-icons-round absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
                                <input 
                                    type="text" 
                                    placeholder="Search by name, country, or ID..." 
                                    value={agencyFilters.query}
                                    onChange={(e) => handleFilterChange('query', e.target.value)}
                                    className="w-full h-11 bg-white dark:bg-slate-900/50 border border-slate-100 dark:border-white/5 rounded-2xl pl-12 pr-4 text-[11px] font-semibold outline-none focus:border-primary transition-colors shadow-sm"
                                />
                            </div>
                            <div className="flex gap-4 col-span-2">
                                <select 
                                    value={agencyFilters.status}
                                    onChange={(e) => handleFilterChange('status', e.target.value)}
                                    className="h-11 px-4 bg-white dark:bg-slate-900/50 border border-slate-100 dark:border-white/5 rounded-2xl text-[11px] font-bold outline-none cursor-pointer flex-1 shadow-sm"
                                >
                                    <option value="">All Status</option>
                                    <option value="ACTIVE">Active</option>
                                    <option value="PASSIVE">Passive</option>
                                </select>
                                <select 
                                    value={agencyFilters.agencyType}
                                    onChange={(e) => handleFilterChange('agencyType', e.target.value)}
                                    className="h-11 px-4 bg-white dark:bg-slate-900/50 border border-slate-100 dark:border-white/5 rounded-2xl text-[11px] font-bold outline-none cursor-pointer flex-1 shadow-sm"
                                >
                                    <option value="">All Types</option>
                                    <option value="AGENCY">Agency</option>
                                    <option value="RSA">RSA</option>
                                </select>
                            </div>
                        </div>
                        
                        {/* Secondary Filters */}
                        <div className="flex items-center gap-4 py-3 px-6 bg-slate-50/50 dark:bg-slate-900/20 rounded-[24px] border border-slate-100 dark:border-white/5">
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
                        <div className="flex-1 bg-white dark:bg-slate-900/50 backdrop-blur-3xl rounded-[32px] border border-slate-100 dark:border-white/5 overflow-hidden shadow-sm flex flex-col relative">
                            {isLoading && agencies.length === 0 && (
                                <div className="absolute inset-0 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm z-10 flex items-center justify-center">
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="size-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                                        <span className="text-[10px] font-black text-primary uppercase tracking-widest">Loading Agencies</span>
                                    </div>
                                </div>
                            )}
                            
                            <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                                <table className="w-full text-left">
                                    <thead className="sticky top-0 bg-white dark:bg-slate-900 z-10">
                                        <tr className="border-b border-slate-100 dark:border-white/5">
                                            <th className="px-4 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest w-20">ID</th>
                                            <th className="px-4 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Agency</th>
                                            <th className="px-4 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest w-28">Type</th>
                                            <th className="px-4 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Location</th>
                                            <th className="px-4 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest w-28">Currency</th>
                                            <th className="px-4 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest w-32">Status</th>
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
                                                            <span className="font-bold text-slate-800 dark:text-white text-[11px]">{agency.name}</span>
                                                            <span className="text-[9px] text-slate-400 font-medium truncate max-w-[200px]">{agency.email}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-tight ${agency.agencyType === 'RSA' ? 'bg-emerald-50 text-emerald-500 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-blue-50 text-blue-500 dark:bg-blue-900/30 dark:text-blue-400'}`}>
                                                            {agency.agencyType}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-4 flex flex-col">
                                                        <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">{agency.countryName}</span>
                                                        <span className="text-[9px] font-bold text-slate-400">{agency.cityName}</span>
                                                    </td>
                                                    <td className="px-4 py-4 text-[11px] font-black text-slate-700 dark:text-slate-300">{agency.currency}</td>
                                                    <td className="px-4 py-4">
                                                        <div className="flex items-center gap-2">
                                                            <div className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors cursor-pointer ${agency.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'}`}>
                                                                <span className={`inline-block h-2.5 w-2.5 transform rounded-full bg-white transition-transform ${agency.status === 'ACTIVE' ? 'translate-x-3.5' : 'translate-x-1'}`} />
                                                            </div>
                                                            <span className={`text-[10px] font-bold uppercase tracking-wider ${agency.status === 'ACTIVE' ? 'text-emerald-500' : 'text-slate-400'}`}>
                                                                {agency.status === 'ACTIVE' ? 'Active' : 'Inactive'}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-4 text-right">
                                                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button className="size-8 rounded-xl flex items-center justify-center text-slate-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-500 transition-all">
                                                                <span className="material-icons-round text-lg">edit</span>
                                                            </button>
                                                            <button className="size-8 rounded-xl flex items-center justify-center text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 transition-all">
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
                            
                            {/* Table Footer / Pagination Info */}
                            <div className="p-4 border-t border-slate-50 dark:border-white/5 flex items-center justify-between">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{totalAgencyCount} Agencies found</span>
                                <div className="flex gap-2">
                                     <button 
                                        disabled={agencyFilters.page === 0}
                                        onClick={() => handleFilterChange('page', agencyFilters.page - 1)}
                                        className="size-8 rounded-xl border border-slate-100 dark:border-white/5 flex items-center justify-center text-slate-400 disabled:opacity-30 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                                    >
                                        <span className="material-icons-round text-lg">chevron_left</span>
                                    </button>
                                    <button 
                                        disabled={agencies.length < agencyFilters.size}
                                        onClick={() => handleFilterChange('page', agencyFilters.page + 1)}
                                        className="size-8 rounded-xl border border-slate-100 dark:border-white/5 flex items-center justify-center text-slate-400 disabled:opacity-30 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                                    >
                                        <span className="material-icons-round text-lg">chevron_right</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6 flex flex-col h-full overflow-hidden">
                        {/* Summary Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {[
                                { label: 'Total Groups', value: '5', icon: 'groups', color: 'blue' },
                                { label: 'Active Groups', value: '4', icon: 'person_add', color: 'emerald' },
                                { label: 'Total Assignments', value: '12', icon: 'corporate_fare', color: 'purple' },
                            ].map((card, i) => (
                                <div key={i} className="bg-white dark:bg-slate-900/50 p-6 rounded-[32px] border border-slate-100 dark:border-white/5 shadow-sm space-y-4">
                                    <div className="flex items-center justify-between">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{card.label}</p>
                                        <div className={`size-10 bg-${card.color}-50 dark:bg-${card.color}-900/20 rounded-2xl flex items-center justify-center text-${card.color}-500`}>
                                            <span className="material-icons-round">{card.icon}</span>
                                        </div>
                                    </div>
                                    <p className="text-3xl font-black text-slate-900 dark:text-white leading-none">{card.value}</p>
                                </div>
                            ))}
                        </div>

                        {/* Filters & Actions */}
                        <div className="flex items-center gap-4">
                            <div className="relative flex-1 max-w-2xl">
                                <span className="material-icons-round absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
                                <input 
                                    type="text" 
                                    placeholder="Search groups by name, description..." 
                                    className="w-full h-11 bg-white dark:bg-slate-900/50 border border-slate-100 dark:border-white/5 rounded-2xl pl-12 pr-4 text-[11px] font-semibold outline-none focus:border-primary transition-colors shadow-sm"
                                />
                            </div>
                            <select className="h-11 px-6 bg-white dark:bg-slate-900/50 border border-slate-100 dark:border-white/5 rounded-full text-[11px] font-bold outline-none cursor-pointer shadow-sm">
                                <option>All Status</option>
                                <option>Active</option>
                                <option>Inactive</option>
                            </select>
                            <button className="h-11 px-8 bg-blue-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-lg shadow-blue-500/20 active:scale-95 transition-all flex items-center gap-2">
                                <span className="material-icons-round text-lg">add</span>
                                Create Group
                            </button>
                        </div>
                        <p className="text-[10px] font-bold text-slate-400 ml-1">5 of 5 results found</p>

                        {/* Table */}
                        <div className="flex-1 bg-white dark:bg-slate-900/50 backdrop-blur-3xl rounded-[32px] border border-slate-100 dark:border-white/5 overflow-hidden shadow-sm flex flex-col">
                            <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="border-b border-slate-50 dark:border-white/5">
                                            <th className="px-4 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest w-20">ID</th>
                                            <th className="px-4 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Group Name</th>
                                            <th className="px-4 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Description</th>
                                            <th className="px-4 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center w-40">Agencies</th>
                                            <th className="px-4 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest w-24">Status</th>
                                            <th className="px-4 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Created</th>
                                            <th className="px-4 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50 dark:divide-white/5">
                                        {groups.map((group) => (
                                            <tr key={group.id} className="group hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors">
                                                <td className="px-4 py-5 text-[11px] font-bold text-slate-400">#{group.id}</td>
                                                <td className="px-4 py-5 font-bold text-slate-800 dark:text-white text-[12px]">{group.name}</td>
                                                <td className="px-4 py-5 text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate max-w-xs">{group.description}</td>
                                                <td className="px-4 py-5">
                                                    <div className="flex items-center justify-center gap-3">
                                                        <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-500 dark:text-indigo-400 rounded-full text-[10px] font-black tracking-tight">
                                                            {group.agencyCount} agencies
                                                        </span>
                                                        <button className="text-[10px] font-black text-blue-600 hover:text-blue-700 uppercase underline decoration-2 underline-offset-4">Manage</button>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-5">
                                                    <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase ${group.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-500 dark:bg-emerald-900/30' : 'bg-slate-100 text-slate-400 dark:bg-slate-800'}`}>
                                                        {group.status === 'ACTIVE' ? 'Active' : 'Inactive'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-5 text-[11px] font-bold text-slate-500 dark:text-slate-400">{group.created}</td>
                                                <td className="px-4 py-5 text-right">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <button className="size-8 rounded-xl flex items-center justify-center text-slate-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-500 transition-all">
                                                            <span className="material-icons-round text-lg">edit</span>
                                                        </button>
                                                        <button className="size-8 rounded-xl flex items-center justify-center text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 transition-all">
                                                            <span className="material-icons-round text-lg">delete_outline</span>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            
            <AddAgencyModal 
                isOpen={isAddModalOpen} 
                onClose={() => setIsAddModalOpen(false)} 
                onSuccess={fetchAgencies}
            />
        </div>
    );
};

export default GSAAgencyManagement;
