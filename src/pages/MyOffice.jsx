import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useAuth } from '../context/AuthContext';
import { agencyService } from '../services/agencyService';
import { locationService } from '../services/locationService';
import { userService, roleService } from '../services/userService';
import { guestService } from '../services/guestService';
import { currencyService } from '../services/currencyService';
import HeaderActions from '../components/HeaderActions';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import '../datepicker-custom.css';

// Fix Leaflet marker icon issue in React
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Module-level cache removed to allow dynamic data refresh on every mount


// Helper to format YYYY-MM-DD to DD.MM.YYYY for backend
const formatToBackendDate = (dateStr) => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    return `${day}.${month}.${year}`;
};

// Helper to format DD.MM.YYYY to YYYY-MM-DD for date picker
const formatToPickerDate = (dateStr) => {
    if (!dateStr || !dateStr.includes('.')) return '';
    const [day, month, year] = dateStr.split('.');
    return `${year}-${month}-${day}`;
};

// Export to CSV Helper
const downloadCSV = (data, filename) => {
    if (!data || data.length === 0) return;
    const headers = Object.keys(data[0]);
    const csvRows = [
        headers.join(','),
        ...data.map(row => headers.map(fieldName => {
            const value = row[fieldName] === null || row[fieldName] === undefined ? '' : row[fieldName];
            return `"${String(value).replace(/"/g, '""')}"`;
        }).join(','))
    ];
    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

// Skeleton Loading Component
const TableSkeleton = ({ columns }) => (
    <>
        {[1, 2, 3, 4, 5].map((i) => (
            <tr key={i} className="animate-pulse">
                {[...Array(columns)].map((_, j) => (
                    <td key={j} className="p-4"><div className="h-4 bg-slate-100 dark:bg-slate-800 rounded-lg w-full"></div></td>
                ))}
            </tr>
        ))}
    </>
);

// Map Recenter Component
const ChangeView = ({ center, zoom }) => {
    const map = useMap();
    useEffect(() => {
        if (center && typeof center[0] === 'number' && typeof center[1] === 'number') {
            map.setView(center, zoom);
        }
    }, [center, zoom, map]);
    return null;
};

// Map Click Handler Component
const LocationMarker = ({ position, setPosition }) => {
    useMapEvents({
        click(e) {
            setPosition([e.latlng.lat, e.latlng.lng]);
        },
    });

    if (!position || typeof position[0] !== 'number' || typeof position[1] !== 'number') {
        return null;
    }

    return <Marker position={position} />;
};

const MyOffice = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const [activeTab, setActiveTab] = useState('general');
    const [loading, setLoading] = useState(true);
    const [usersLoading, setUsersLoading] = useState(false);
    const [guestsLoading, setGuestsLoading] = useState(false);
    const [statsLoading, setStatsLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    const [mapCenter, setMapCenter] = useState([36.6826845, 30.9089719]);
    const [zoom, setZoom] = useState(13);
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

    // Confirm Modal State
    const [confirmModal, setConfirmModal] = useState({ show: false, title: '', message: '', onConfirm: null, type: 'danger' });

    // Cache tracking
    const isUsersLoaded = useRef(false);
    const isGuestsLoaded = useRef(false);

    // Summary data
    const [summary, setSummary] = useState({ totalCount: 0, activeCount: 0, passiveCount: 0, totalGuestCount: 0, activeGuestCount: 0, passiveGuestCount: 0 });

    // User management state
    const [users, setUsers] = useState([]);
    const [roles, setRoles] = useState([]);
    const [userFilters, setUserFilters] = useState({ query: '', status: 'ACTIVE', roleIds: [] });
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [userFormData, setUserFormData] = useState({ name: '', surname: '', email: '', password: '', phoneCountryCode: '90', phoneNumber: '', status: 'ACTIVE', roleIds: [] });

    // Guest management state
    const [guests, setGuests] = useState([]);
    const [guestFilters, setGuestFilters] = useState({ query: '', status: 'ACTIVE', countryCodes: [] });
    const [isGuestModalOpen, setIsGuestModalOpen] = useState(false);
    const [editingGuest, setEditingGuest] = useState(null);
    const [guestFormData, setGuestFormData] = useState({
        gender: 'MALE',
        firstName: '',
        lastName: '',
        birthDate: '', 
        country: '',
        passportNo: '',
        passportExpiry: '', 
        email: '',
        phoneCountryCode: '90',
        phoneNumber: '',
        status: 'ACTIVE'
    });

    // Form data (General Info)
    const [formData, setFormData] = useState({
        id: null,
        name: '',
        officialTitle: '',
        countryId: '',
        cityId: '',
        zipCode: '',
        address: '',
        latitude: null,
        longitude: null,
        phoneCountryCode: '',
        phoneNumber: '',
        email: '',
        website: '',
        taxOffice: '',
        taxNumber: '',
        agencyFinancialInfo: {}
    });

    const [countries, setCountries] = useState([]);
    const [cities, setCities] = useState([]);
    const [finCities, setFinCities] = useState([]);
    const [currencies, setCurrencies] = useState([]);

    // Single Mount Effect
    useEffect(() => {
        const abortController = new AbortController();
        const fetchOnMount = async () => {
            await fetchInitialData(abortController.signal);
        };
        fetchOnMount();
        fetchStats(abortController.signal);
        return () => {
            abortController.abort();
        };
    }, []);

    // Tab Lazy Loading Logic
    useEffect(() => {
        if (activeTab === 'users' && !isUsersLoaded.current) {
            fetchUsersData();
            isUsersLoaded.current = true;
        } else if (activeTab === 'guests' && !isGuestsLoaded.current) {
            fetchGuestsData();
            isGuestsLoaded.current = true;
        }
    }, [activeTab]);

    const showNotification = (message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 4000);
    };

    const fetchInitialData = async (signal) => {
        try {
            setLoading(true);
            const [agencyData, countriesData, currenciesData] = await Promise.all([
                agencyService.getMe(signal),
                locationService.listCountries(signal),
                currencyService.listActiveCurrencies(signal)
            ]);

            setCountries(countriesData.locationList || []);
            setCurrencies(currenciesData || []);

            let initialCities = [];
            if (agencyData.countryId) {
                try {
                    const citiesData = await locationService.listSubRegions(agencyData.countryId);
                    initialCities = citiesData.locationList || [];
                } catch (e) { console.error(e); }
            }
            setCities(initialCities);

            let initialFinCities = [];
            if (agencyData.agencyFinancialInfo?.countryId) {
                try {
                    const finCitiesData = await locationService.listSubRegions(agencyData.agencyFinancialInfo.countryId);
                    initialFinCities = finCitiesData.locationList || [];
                } catch (e) { console.error(e); }
            }
            setFinCities(initialFinCities);

            let lat = agencyData.latitude || agencyData.geoLocation?.latitude || 36.6826845;
            let lng = agencyData.longitude || agencyData.geoLocation?.longitude || 30.9089719;
            lat = parseFloat(lat);
            lng = parseFloat(lng);
            setMapCenter([lat, lng]);

            setFormData({
                ...agencyData,
                latitude: lat,
                longitude: lng,
                officialTitle: agencyData.agencyFinancialInfo?.title || '',
                taxOffice: agencyData.agencyFinancialInfo?.taxOffice || '',
                taxNumber: agencyData.agencyFinancialInfo?.taxNumber || '',
                agencyFinancialInfo: {
                    ...agencyData.agencyFinancialInfo,
                    title: agencyData.agencyFinancialInfo?.title || '',
                    taxOffice: agencyData.agencyFinancialInfo?.taxOffice || '',
                    taxNumber: agencyData.agencyFinancialInfo?.taxNumber || ''
                }
            });

        } catch (err) {
            console.error(err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async (signal) => {
        try {
            setStatsLoading(true);
            const [userSummary, guestSummary] = await Promise.all([
                userService.getSummary(signal).catch(() => ({ totalCount: 0, activeCount: 0, passiveCount: 0 })),
                guestService.getSummary(signal).catch(() => ({ totalCount: 0, activeCount: 0, passiveCount: 0 }))
            ]);

            setSummary({
                totalCount: userSummary.totalCount || 0,
                activeCount: userSummary.activeCount || 0,
                passiveCount: userSummary.passiveCount || 0,
                totalGuestCount: guestSummary.totalCount || 0,
                activeGuestCount: guestSummary.activeCount || 0,
                passiveGuestCount: guestSummary.passiveCount || 0
            });
        } catch (err) {
            if (err.name !== 'AbortError') console.error('Error fetching stats:', err);
        } finally {
            setStatsLoading(false);
        }
    };

    const fetchUsersData = async (isManual = false) => {
        try {
            setUsersLoading(true);
            const [usersResponse, rolesResponse] = await Promise.all([
                userService.filterUsers(userFilters),
                roleService.filterRoles()
            ]);
            setUsers(usersResponse.agencyUsers || usersResponse.content || []);
            setRoles(rolesResponse.roles || rolesResponse.content || []);
            if (isManual) showNotification('User list refreshed');
        } catch (err) { console.error(err); } finally { setUsersLoading(false); }
    };

    const fetchGuestsData = async (isManual = false) => {
        try {
            setGuestsLoading(true);
            const response = await guestService.filterGuests(guestFilters);
            setGuests(response.guests || response.agencyCrmGuests || response.content || []);
            if (isManual) showNotification('Guest list refreshed');
        } catch (err) { console.error(err); } finally { setGuestsLoading(false); }
    };

    const handleUserFilterChange = (newFilters) => {
        setUserFilters(newFilters);
        if (isUsersLoaded.current) {
            setUsersLoading(true);
            userService.filterUsers(newFilters).then(res => {
                setUsers(res.agencyUsers || res.content || []);
                setUsersLoading(false);
            }).catch(() => setUsersLoading(false));
        }
    };

    const handleGuestFilterChange = (newFilters) => {
        setGuestFilters(newFilters);
        if (isGuestsLoaded.current) {
            setGuestsLoading(true);
            guestService.filterGuests(newFilters).then(res => {
                setGuests(res.guests || res.agencyCrmGuests || res.content || []);
                setGuestsLoading(false);
            }).catch(() => setGuestsLoading(false));
        }
    };

    const handleCountryChange = async (e) => {
        const countryId = e.target.value;
        setFormData(prev => ({ ...prev, countryId, cityId: '' }));
        if (countryId) {
            try {
                const citiesData = await locationService.listSubRegions(countryId);
                setCities(citiesData.locationList || []);
            } catch (err) { console.error(err); setCities([]); }
        } else { setCities([]); }
    };

    const handleFinCountryChange = async (e) => {
        const countryId = e.target.value;
        setFormData(prev => ({
            ...prev,
            agencyFinancialInfo: { ...prev.agencyFinancialInfo, countryId, cityId: '' }
        }));
        if (countryId) {
            try {
                const citiesData = await locationService.listSubRegions(countryId);
                setFinCities(citiesData.locationList || []);
            } catch (err) { console.error(err); setFinCities([]); }
        } else { setFinCities([]); }
    };

    const handleInputChange = (field, value) => {
        if (field.includes('.')) {
            const [parent, child] = field.split('.');
            setFormData(prev => ({
                ...prev,
                [parent]: { ...prev[parent], [child]: value }
            }));
        } else {
            setFormData(prev => ({ ...prev, [field]: value }));
        }
    };
    const setMapLocation = (latlng) => setFormData(prev => ({ ...prev, latitude: latlng[0], longitude: latlng[1] }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setSaving(true);
            
            const payload = {
                ...formData,
                countryId: formData.countryId ? Number(formData.countryId) : null,
                cityId: formData.cityId ? Number(formData.cityId) : null,
                agencyFinancialInfo: {
                    ...formData.agencyFinancialInfo,
                    countryId: formData.agencyFinancialInfo?.countryId ? Number(formData.agencyFinancialInfo.countryId) : null,
                    cityId: formData.agencyFinancialInfo?.cityId ? Number(formData.agencyFinancialInfo.cityId) : null,
                    latitude: formData.latitude,
                    longitude: formData.longitude
                }
            };

            delete payload.officialTitle;
            delete payload.taxOffice;
            delete payload.taxNumber;
            delete payload.geoLocation;
            delete payload.cityName;
            delete payload.countryName;

            await agencyService.updateAgency(formData.id, payload);
            showNotification('Agency profile updated successfully.');
            await fetchInitialData();
        } catch (err) { 
            showNotification(err.message || 'Update failed.', 'error'); 
        } finally { 
            setSaving(false); 
        }
    };

    const openAddUser = () => { setEditingUser(null); setUserFormData({ name: '', surname: '', email: '', password: '', phoneCountryCode: '90', phoneNumber: '', status: 'ACTIVE', roleIds: [] }); setIsUserModalOpen(true); };
    const openEditUser = (u) => { setEditingUser(u); setUserFormData({ name: u.name, surname: u.surname, email: u.email, phoneCountryCode: u.phoneCountryCode || '90', phoneNumber: u.phoneNumber || '', status: u.status || 'ACTIVE', roleIds: u.roles?.map(r => r.id) || [] }); setIsUserModalOpen(true); };
    const handleUserSubmit = async (e) => {
        e.preventDefault();
        try {
            setSaving(true);
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (userFormData.email && !emailRegex.test(userFormData.email)) { 
                showNotification('Please enter a valid email address.', 'error'); 
                setSaving(false); 
                return; 
            }
            if (editingUser) {
                await userService.updateUser(editingUser.id, userFormData);
                if (userFormData.roleIds.length > 0) await userService.assignRoles(editingUser.id, userFormData.roleIds);
                showNotification('User updated successfully');
            } else {
                const newUser = await userService.saveUser(userFormData);
                if (userFormData.roleIds.length > 0) await userService.assignRoles(newUser.id, userFormData.roleIds);
                showNotification('User created successfully');
            }
            setIsUserModalOpen(false); fetchUsersData();
            const sumData = await userService.getSummary(); setSummary(prev => ({ ...prev, totalCount: sumData.totalCount, activeCount: sumData.activeCount, passiveCount: sumData.passiveCount }));
        } catch (err) { showNotification(err.message || 'Error saving user', 'error'); } finally { setSaving(false); }
    };

    const requestConfirmation = (title, message, onConfirm, type = 'danger') => {
        setConfirmModal({ show: true, title, message, onConfirm, type });
    };

    const handleDeleteUser = (id) => {
        requestConfirmation(
            'Delete User',
            'This action cannot be undone. All access for this user will be revoked immediately.',
            async () => {
                try {
                    await userService.deleteUser(id);
                    showNotification('User deleted successfully');
                    fetchUsersData();
                    const sumData = await userService.getSummary();
                    setSummary(prev => ({ ...prev, totalCount: sumData.totalCount, activeCount: sumData.activeCount, passiveCount: sumData.passiveCount }));
                } catch (err) { showNotification(err.message || 'Error deleting user', 'error'); }
            }
        );
    };

    const handleExportUsers = () => {
        if (users.length === 0) { showNotification('No user data to export.', 'error'); return; }
        const exportData = users.map(u => ({ ID: u.id, Name: u.name, Surname: u.surname, Email: u.email, Phone: `+${u.phoneCountryCode}${u.phoneNumber}`, Roles: u.roles?.map(r => r.roleName || r.name).join(' | '), Status: u.status }));
        downloadCSV(exportData, `Users_Export_${new Date().toLocaleDateString()}.csv`);
        showNotification('User list exported as CSV.');
    };

    const openAddGuest = () => { setEditingGuest(null); setGuestFormData({ gender: 'MALE', firstName: '', lastName: '', birthDate: '', country: '', passportNo: '', passportExpiry: '', email: '', phoneCountryCode: '90', phoneNumber: '', status: 'ACTIVE' }); setIsGuestModalOpen(true); };
    const openEditGuest = (g) => { setEditingGuest(g); setGuestFormData({ gender: g.gender || 'MALE', firstName: g.firstName, lastName: g.lastName, birthDate: g.birthDate, country: g.country, passportNo: g.passportNo, passportExpiry: g.passportExpiry, email: g.email, phoneCountryCode: g.phoneCountryCode || '90', phoneNumber: g.phoneNumber || '', status: g.status || 'ACTIVE' }); setIsGuestModalOpen(true); };
    const handleGuestSubmit = async (e) => {
        e.preventDefault();
        try {
            setSaving(true);
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (guestFormData.email && !emailRegex.test(guestFormData.email)) { showNotification('Please enter a valid email address.', 'error'); setSaving(false); return; }
            if (editingGuest) { await guestService.updateGuest(editingGuest.id, guestFormData); showNotification('Guest updated successfully'); }
            else { await guestService.saveGuest(guestFormData); showNotification('Guest created successfully'); }
            setIsGuestModalOpen(false); fetchGuestsData();
            const sumData = await guestService.getSummary(); setSummary(prev => ({ ...prev, totalGuestCount: sumData.totalCount, activeGuestCount: sumData.activeCount, passiveGuestCount: sumData.passiveCount }));
        } catch (err) { showNotification(err.message || 'Error saving guest', 'error'); } finally { setSaving(false); }
    };

    const handleDeleteGuest = (id) => {
        requestConfirmation(
            'Delete Guest',
            'Are you sure you want to remove this guest from your CRM? This will delete all associated profile data.',
            async () => {
                try {
                    await guestService.deleteGuest(id);
                    showNotification('Guest deleted successfully');
                    fetchGuestsData();
                    const sumData = await guestService.getSummary();
                    setSummary(prev => ({ ...prev, totalGuestCount: sumData.totalCount, activeGuestCount: sumData.activeCount, passiveGuestCount: sumData.passiveCount }));
                } catch (err) { showNotification(err.message || 'Error deleting guest', 'error'); }
            }
        );
    };

    const handleExportGuests = () => {
        if (guests.length === 0) { showNotification('No guest data to export.', 'error'); return; }
        const exportData = guests.map(g => ({ ID: g.id, Gender: g.gender, FirstName: g.firstName, LastName: g.lastName, BirthDate: g.birthDate, Country: g.country, PassportNo: g.passportNo, PassportExpiry: g.passportExpiry, Email: g.email, Phone: `+${g.phoneCountryCode}${g.phoneNumber}` }));
        downloadCSV(exportData, `Guests_Export_${new Date().toLocaleDateString()}.csv`);
        showNotification('Guest list exported as CSV.');
    };

    const openInMaps = () => { const addressStr = `${formData.address} ${formData.zipCode}`; const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addressStr)}`; window.open(url, '_blank'); };

    if (loading) { return <div className="flex h-screen items-center justify-center bg-[#f8fafc] dark:bg-[#0f172a]"><div className="size-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>; }

    return (
        <>
            <style>{`
                .input-modern { background: transparent; border-bottom: 2px solid #e2e8f0; transition: all 0.3s ease; border-radius: 0; }
                .dark .input-modern { border-color: #1e293b; }
                .input-modern:focus { border-color: #3B82F6; background: rgba(59, 130, 246, 0.02); }
                .map-card { border-radius: 32px; overflow: hidden; box-shadow: 0 20px 50px rgba(0,0,0,0.05); }
                .dark .map-card { box-shadow: 0 20px 50px rgba(0,0,0,0.3); }
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
                .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: #1e293b; }
                .badge-card { background: white; border: 1px solid #f1f5f9; box-shadow: 0 4px 12px rgba(0,0,0,0.02); }
                .dark .badge-card { background: #1e293b; border-color: #334155; }
                .data-table th { font-size: 10px; text-transform: uppercase; color: #94a3b8; font-weight: 700; padding: 16px; border-bottom: 1px solid #f1f5f9; text-align: left; letter-spacing: 0.05em; }
                .dark .data-table th { border-color: #334155; }
                .data-table td { padding: 16px; border-bottom: 1px solid #f8fafc; font-size: 13px; font-weight: 500; }
                .dark .data-table td { border-color: #1e293b; }
                .data-row:hover { background-color: #fcfdfe; }
                .dark .data-row:hover { background-color: #1e293b/50; }
                .modal-overlay { background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(8px); }
            `}</style>

            {toast.show && <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[10000] animate-in fade-in slide-in-from-top-4 duration-500"><div className="px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-2xl rounded-2xl flex items-center gap-3"><div className={`size-2 rounded-full ${toast.type === 'success' ? 'bg-emerald-400' : 'bg-red-400'} animate-pulse`}></div><p className="text-[10px] font-bold uppercase tracking-widest">{toast.message}</p></div></div>}

            <main className="flex-1 p-3 md:p-5 flex flex-col h-screen overflow-hidden">
                <div className="max-w-6xl mx-auto w-full flex flex-col h-full overflow-hidden">
                    <header className="flex flex-wrap items-center justify-between mb-8 gap-4">
                        <div className="flex items-center gap-2">
                            <span className="material-icons-round text-primary text-xl">corporate_fare</span>
                            <h1 className="text-lg font-medium">My Office Management</h1>
                        </div>
                        <div className="flex items-center gap-4">
                            <HeaderActions />
                        </div>
                    </header>


                    <div className="mb-6 flex gap-10 border-b border-slate-200 dark:border-slate-800">
                        {[
                            { id: 'general', label: 'General Information', icon: 'info' },
                            { id: 'users', label: 'Users', count: statsLoading ? 'loading' : summary.totalCount, icon: 'groups' },
                            { id: 'guests', label: 'Guests', count: statsLoading ? 'loading' : summary.totalGuestCount, icon: 'recent_actors' }
                        ].map((tab) => (
                            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`pb-4 text-[10px] font-bold uppercase tracking-widest relative flex items-center gap-2.5 transition-all ${activeTab === tab.id ? 'text-primary' : 'text-slate-400 hover:text-slate-600'}`}>
                                <span className="material-icons-round text-lg">{tab.icon}</span> {tab.label} 
                                {tab.count !== undefined && (
                                    <span className="text-[9px] flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-slate-100 dark:bg-slate-800 ml-1">
                                        {tab.count === 'loading' ? (
                                            <div className="size-3 border-[1.5px] border-primary/30 border-t-primary rounded-full animate-spin"></div>
                                        ) : (
                                            tab.count
                                        )}
                                    </span>
                                )}
                                {activeTab === tab.id && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full"></div>}
                            </button>
                        ))}
                    </div>

                    <div className="flex-1 overflow-hidden">
                        {activeTab === 'general' ? (
                            <div className="h-full flex gap-10 overflow-hidden pb-4">
                                <div className="w-[35%] flex flex-col gap-6 overflow-y-auto custom-scrollbar pr-2 flex-shrink-0">
                                    {/* Agency Identity Card */}
                                    <div className="bg-slate-900 dark:bg-slate-800 rounded-[40px] p-8 text-white relative overflow-hidden shadow-2xl flex-shrink-0">
                                        <div className="absolute top-0 right-0 p-6">
                                            <div className="size-10 bg-white/10 rounded-xl flex items-center justify-center">
                                                <span className="material-icons-round text-xl">security</span>
                                            </div>
                                        </div>
                                        <div className="mt-8 mb-12">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Agency Identity</p>
                                            <h2 className="text-2xl font-bold truncate">{formData.name || 'Your Agency'}</h2>
                                            <div className="flex items-center gap-2 mt-2">
                                                <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-tight ${formData.agencyType === 'GSA' ? 'bg-primary text-white' : 'bg-emerald-500 text-white'}`}>
                                                    {formData.agencyType}
                                                </span>
                                                <span className="text-xs text-slate-400 font-bold opacity-80">{formData.officialTitle}</span>
                                            </div>
                                        </div>
                                        <div className="space-y-6 pt-6 border-t border-white/10">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Base Location</p>
                                                    <p className="text-sm font-semibold truncate">{formData.cityName}, {formData.countryName}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Currency</p>
                                                    <p className="text-sm font-semibold text-primary">{formData.currency}</p>
                                                </div>
                                            </div>
                                            <div>
                                                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Integration</p>
                                                <p className="text-sm font-semibold flex items-center gap-2">
                                                    <span className="size-2 bg-emerald-500 rounded-full animate-pulse"></span>
                                                    {formData.integrationType}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Audit & Timeline Card */}
                                    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 rounded-[40px] p-8 shadow-sm flex-shrink-0">
                                        <div className="flex items-center gap-3 mb-8">
                                            <div className="size-8 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-400">
                                                <span className="material-icons-round text-lg">history</span>
                                            </div>
                                            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-800 dark:text-white">Audit Timeline</h3>
                                        </div>
                                        <div className="space-y-6">
                                            <div className="flex gap-4">
                                                <div className="flex flex-col items-center">
                                                    <div className="size-2 bg-primary rounded-full mt-1.5"></div>
                                                    <div className="w-[1px] h-full bg-slate-100 dark:bg-slate-800 my-1"></div>
                                                </div>
                                                <div className="pb-4">
                                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Created</p>
                                                    <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-0.5">{new Date(formData.createDateTime).toLocaleString()}</p>
                                                    <p className="text-[9px] text-slate-400 font-medium italic">by {formData.createdBy}</p>
                                                </div>
                                            </div>
                                            <div className="flex gap-4">
                                                <div className="flex flex-col items-center">
                                                    <div className="size-2 bg-emerald-500 rounded-full mt-1.5"></div>
                                                </div>
                                                <div>
                                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Last Update</p>
                                                    <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-0.5">{new Date(formData.updateDateTime).toLocaleString()}</p>
                                                    <p className="text-[9px] text-slate-400 font-medium italic">by {formData.updatedBy}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Map Preview */}
                                    <div className="map-card h-[400px] relative group border-4 border-white dark:border-slate-800 flex-shrink-0">
                                        <MapContainer center={mapCenter} zoom={zoom} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}>
                                            <ChangeView center={mapCenter} zoom={zoom} />
                                            <TileLayer attribution='&copy; CARTO' url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
                                            <LocationMarker position={[formData.latitude, formData.longitude]} setPosition={setMapLocation} />
                                        </MapContainer>
                                        <div className="absolute bottom-6 right-6 z-[1000] opacity-0 group-hover:opacity-100 transition-all">
                                            <button onClick={openInMaps} className="size-10 bg-white dark:bg-slate-900 rounded-xl shadow-xl flex items-center justify-center text-primary hover:scale-110 active:scale-95 transition-all">
                                                <span className="material-icons-round">open_in_new</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex-1 bg-white/50 dark:bg-slate-900/50 backdrop-blur-3xl rounded-[40px] border border-white/40 dark:border-white/5 p-12 overflow-y-auto custom-scrollbar">
                                    <form onSubmit={handleSubmit} className="max-w-3xl mx-auto space-y-16 pb-20">
                                        {/* Section 01: Identity */}
                                        <div className="space-y-10">
                                            <div className="flex items-center gap-4">
                                                <div className="size-2 bg-primary rounded-full"></div>
                                                <h3 className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">Section 01 / Identity</h3>
                                            </div>
                                            <div className="grid grid-cols-2 gap-12">
                                                <div className="space-y-1">
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Agency Name</label>
                                                    <input type="text" value={formData.name} onChange={(e) => handleInputChange('name', e.target.value)} className="w-full h-12 input-modern outline-none font-bold text-sm" placeholder="Commercial Name" />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Official Title</label>
                                                    <input type="text" value={formData.officialTitle} onChange={(e) => handleInputChange('officialTitle', e.target.value)} className="w-full h-12 input-modern outline-none font-bold text-sm" placeholder="Legal Title" />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-3 gap-12">
                                                <div className="space-y-1">
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Type</label>
                                                    <input type="text" value={formData.agencyType} disabled className="w-full h-12 input-modern outline-none font-bold text-sm opacity-50 cursor-not-allowed" />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Language</label>
                                                    <select value={formData.defaultLanguage} onChange={(e) => handleInputChange('defaultLanguage', e.target.value)} className="w-full h-12 input-modern outline-none font-bold text-sm bg-transparent appearance-none">
                                                        <option value="EN">English</option>
                                                        <option value="TR">Turkish</option>
                                                    </select>
                                                </div>
                                                {formData.agencyType !== 'GSA' && (
                                                    <div className="space-y-1">
                                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Parent ID</label>
                                                        <input type="text" value={formData.parentId} disabled className="w-full h-12 input-modern outline-none font-bold text-sm opacity-50 cursor-not-allowed" />
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Section 02: Contact */}
                                        <div className="space-y-10">
                                            <div className="flex items-center gap-4">
                                                <div className="size-2 bg-indigo-500 rounded-full"></div>
                                                <h3 className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">Section 02 / Contact</h3>
                                            </div>
                                            <div className="grid grid-cols-2 gap-12">
                                                <div className="space-y-1">
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Direct Email</label>
                                                    <input type="email" value={formData.email} onChange={(e) => handleInputChange('email', e.target.value)} className="w-full h-12 input-modern outline-none font-bold text-sm" placeholder="contact@agency.com" />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Phone Number</label>
                                                    <div className="flex gap-4">
                                                        <input type="text" value={formData.phoneCountryCode} onChange={(e) => handleInputChange('phoneCountryCode', e.target.value)} className="w-16 h-12 input-modern outline-none font-bold text-sm text-center" placeholder="90" />
                                                        <input type="text" value={formData.phoneNumber} onChange={(e) => handleInputChange('phoneNumber', e.target.value)} className="flex-1 h-12 input-modern outline-none font-bold text-sm" placeholder="5XX..." />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Section 03: Geography */}
                                        <div className="space-y-10">
                                            <div className="flex items-center gap-4">
                                                <div className="size-2 bg-emerald-500 rounded-full"></div>
                                                <h3 className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">Section 03 / Geography</h3>
                                            </div>
                                            <div className="grid grid-cols-2 gap-12">
                                                <div className="space-y-1">
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Country</label>
                                                    <select value={formData.countryId} onChange={handleCountryChange} className="w-full h-12 input-modern outline-none font-bold text-sm cursor-pointer appearance-none bg-transparent">
                                                        <option value="">Select Territory</option>
                                                        {countries.map(c => <option key={c.locationId} value={c.locationId}>{c.name?.translations?.en || c.name?.defaultName}</option>)}
                                                    </select>
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">City</label>
                                                    <select value={formData.cityId} onChange={(e) => handleInputChange('cityId', e.target.value)} className="w-full h-12 input-modern outline-none font-bold text-sm cursor-pointer appearance-none bg-transparent">
                                                        <option value="">Select Hub</option>
                                                        {cities.map(c => <option key={c.locationId} value={c.locationId}>{c.name?.translations?.en || c.name?.defaultName}</option>)}
                                                    </select>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-4 gap-12">
                                                <div className="col-span-3 space-y-1">
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Street Address</label>
                                                    <input type="text" value={formData.address} onChange={(e) => handleInputChange('address', e.target.value)} className="w-full h-12 input-modern outline-none font-bold text-sm" placeholder="Full street detail" />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Zip Code</label>
                                                    <input type="text" value={formData.zipCode} onChange={(e) => handleInputChange('zipCode', e.target.value)} className="w-full h-12 input-modern outline-none font-bold text-sm text-center" placeholder="00000" />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Section 04: Finance */}
                                        <div className="space-y-10">
                                            <div className="flex items-center gap-4">
                                                <div className="size-2 bg-amber-500 rounded-full"></div>
                                                <h3 className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">Section 04 / Finance</h3>
                                            </div>
                                            <div className="grid grid-cols-2 gap-12">
                                                <div className="space-y-1">
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tax Office</label>
                                                    <input type="text" value={formData.taxOffice} onChange={(e) => handleInputChange('taxOffice', e.target.value)} className="w-full h-12 input-modern outline-none font-bold text-sm" />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tax Number</label>
                                                    <input type="text" value={formData.taxNumber} onChange={(e) => handleInputChange('taxNumber', e.target.value)} className="w-full h-12 input-modern outline-none font-bold text-sm" />
                                                </div>
                                            </div>
                                            <div className="space-y-10 pt-4 border-t border-slate-50 dark:border-white/5">
                                                <div className="grid grid-cols-2 gap-12">
                                                    <div className="space-y-1">
                                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Accounting Email</label>
                                                        <input type="email" value={formData.agencyFinancialInfo?.email} onChange={(e) => handleInputChange('agencyFinancialInfo.email', e.target.value)} className="w-full h-12 input-modern outline-none font-bold text-sm" placeholder="accounting@mail.com" />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Accounting Phone</label>
                                                        <div className="flex gap-4">
                                                            <input type="text" value={formData.agencyFinancialInfo?.phoneCountryCode} onChange={(e) => handleInputChange('agencyFinancialInfo.phoneCountryCode', e.target.value)} className="w-16 h-12 input-modern outline-none font-bold text-sm text-center" placeholder="90" />
                                                            <input type="text" value={formData.agencyFinancialInfo?.phoneNumber} onChange={(e) => handleInputChange('agencyFinancialInfo.phoneNumber', e.target.value)} className="flex-1 h-12 input-modern outline-none font-bold text-sm" placeholder="5XX..." />
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-12">
                                                    <div className="space-y-1">
                                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Accounting Country</label>
                                                        <select value={formData.agencyFinancialInfo?.countryId} onChange={handleFinCountryChange} className="w-full h-12 input-modern outline-none font-bold text-sm cursor-pointer appearance-none bg-transparent">
                                                            <option value="">Select Territory</option>
                                                            {countries.map(c => <option key={c.locationId} value={c.locationId}>{c.name?.translations?.en || c.name?.defaultName}</option>)}
                                                        </select>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Accounting City</label>
                                                        <select value={formData.agencyFinancialInfo?.cityId} onChange={(e) => handleInputChange('agencyFinancialInfo.cityId', e.target.value)} className="w-full h-12 input-modern outline-none font-bold text-sm cursor-pointer appearance-none bg-transparent">
                                                            <option value="">Select Hub</option>
                                                            {finCities.map(c => <option key={c.locationId} value={c.locationId}>{c.name?.translations?.en || c.name?.defaultName}</option>)}
                                                        </select>
                                                    </div>
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Accounting Address</label>
                                                    <input type="text" value={formData.agencyFinancialInfo?.address} onChange={(e) => handleInputChange('agencyFinancialInfo.address', e.target.value)} className="w-full h-12 input-modern outline-none font-bold text-sm" placeholder="Billing address" />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Section 05: Settings */}
                                        <div className="space-y-10">
                                            <div className="flex items-center gap-4">
                                                <div className="size-2 bg-purple-500 rounded-full"></div>
                                                <h3 className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">Section 05 / Settings</h3>
                                            </div>
                                            <div className="grid grid-cols-2 gap-12">
                                                <div className="space-y-1">
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Main Currency</label>
                                                    <select value={formData.currency} onChange={(e) => handleInputChange('currency', e.target.value)} className="w-full h-12 input-modern outline-none font-bold text-sm cursor-pointer appearance-none bg-transparent">
                                                        {currencies.map(curr => <option key={curr.code} value={curr.code}>{curr.code}</option>)}
                                                    </select>
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Integration Type</label>
                                                    <select value={formData.integrationType} onChange={(e) => handleInputChange('integrationType', e.target.value)} className="w-full h-12 input-modern outline-none font-bold text-sm cursor-pointer appearance-none bg-transparent">
                                                        <option value="TGX">TGX</option>
                                                        <option value="JUNIPER">Juniper</option>
                                                        <option value="DIRECT">Direct</option>
                                                    </select>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-6 pt-4">
                                                <label className="flex items-center gap-3 cursor-pointer">
                                                    <div className={`size-10 rounded-xl flex items-center justify-center transition-all ${formData.allowedForSale ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                                                        <span className="material-icons-round text-lg">{formData.allowedForSale ? 'check_circle' : 'block'}</span>
                                                    </div>
                                                    <div>
                                                        <p className="text-[11px] font-black text-slate-800 dark:text-white uppercase leading-none mb-1">Allowed for Sale</p>
                                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">Booking status</p>
                                                    </div>
                                                    <input type="checkbox" checked={formData.allowedForSale} onChange={(e) => handleInputChange('allowedForSale', e.target.checked)} className="hidden" />
                                                </label>
                                            </div>
                                        </div>

                                        <div className="pt-10">
                                            <button type="submit" disabled={saving} className="w-full h-16 bg-primary text-white rounded-[24px] font-bold text-xs uppercase tracking-[0.3em] shadow-2xl shadow-primary/30 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-3">
                                                {saving ? 'Synchronizing...' : 'Save Office Profile'}
                                                {!saving && <span className="material-icons-round text-xl">check_circle</span>}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        ) : activeTab === 'users' ? (
                            <div className="h-full flex flex-col gap-6 overflow-hidden">
                                {/* User Summary Cards */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="bg-[#eff6ff] dark:bg-blue-900/10 p-4 rounded-[24px] border border-blue-100/50 dark:border-blue-800/20 shadow-sm">
                                        <div className="flex justify-between items-start mb-4">
                                            <span className="text-[9px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-[0.2em]">Total Users</span>
                                            <div className="size-8 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center text-blue-600 shadow-sm">
                                                <span className="material-icons-round text-lg">groups</span>
                                            </div>
                                        </div>
                                        <div className="flex items-end gap-1.5">
                                            <div className="text-2xl font-bold text-slate-900 dark:text-white leading-none">{statsLoading ? '...' : summary.totalCount}</div>
                                            <div className="text-[9px] font-bold text-blue-400 mb-0.5">MEMBERS</div>
                                        </div>
                                    </div>
                                    
                                    <div className="bg-[#f0fdf4] dark:bg-emerald-900/10 p-4 rounded-[24px] border border-emerald-100/50 dark:border-emerald-800/20 shadow-sm">
                                        <div className="flex justify-between items-start mb-4">
                                            <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-[0.2em]">Active Users</span>
                                            <div className="size-8 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center text-emerald-600 shadow-sm">
                                                <span className="material-icons-round text-lg">person_check</span>
                                            </div>
                                        </div>
                                        <div className="flex items-end gap-1.5">
                                            <div className="text-2xl font-bold text-slate-900 dark:text-white leading-none">{statsLoading ? '...' : summary.activeCount}</div>
                                            <div className="text-[9px] font-bold text-emerald-400 mb-0.5">ONLINE</div>
                                        </div>
                                    </div>
                                    
                                    <div className="bg-[#fef2f2] dark:bg-red-900/10 p-4 rounded-[24px] border border-red-100/50 dark:border-red-800/20 shadow-sm">
                                        <div className="flex justify-between items-start mb-4">
                                            <span className="text-[9px] font-bold text-red-600 dark:text-red-400 uppercase tracking-[0.2em]">Passive Users</span>
                                            <div className="size-8 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center text-red-600 shadow-sm">
                                                <span className="material-icons-round text-lg">person_off</span>
                                            </div>
                                        </div>
                                        <div className="flex items-end gap-1.5">
                                            <div className="text-2xl font-bold text-slate-900 dark:text-white leading-none">{statsLoading ? '...' : summary.passiveCount}</div>
                                            <div className="text-[9px] font-bold text-red-400 mb-0.5">DISABLED</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex-1 flex flex-col bg-white dark:bg-slate-900/50 backdrop-blur-3xl rounded-[40px] border border-slate-100 dark:border-white/5 overflow-hidden shadow-sm">
                                <div className="p-6 border-b border-slate-50 dark:border-white/5 flex flex-wrap items-center justify-between gap-4">
                                    <div className="flex items-center gap-4 flex-1 max-w-2xl">
                                        <div className="relative flex-1">
                                            <span className="material-icons-round absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">search</span>
                                            <input type="text" placeholder="Search by name or email..." value={userFilters.query} onChange={(e) => handleUserFilterChange({ ...userFilters, query: e.target.value })} className="w-full h-11 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl pl-12 pr-4 text-xs font-semibold outline-none focus:border-primary transition-colors" />
                                        </div>
                                        <select value={userFilters.roleIds[0] || ''} onChange={(e) => handleUserFilterChange({ ...userFilters, roleIds: e.target.value ? [parseInt(e.target.value)] : [] })} className="h-11 px-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl text-xs font-bold outline-none cursor-pointer">
                                            <option value="">All Roles</option>
                                            {roles.map(r => <option key={r.id} value={r.id}>{r.roleName || r.name}</option>)}
                                        </select>
                                        <select value={userFilters.status} onChange={(e) => handleUserFilterChange({ ...userFilters, status: e.target.value })} className="h-11 px-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl text-xs font-bold outline-none cursor-pointer">
                                            <option value="ACTIVE">Active</option>
                                            <option value="PASSIVE">Passive</option>
                                        </select>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button onClick={() => fetchUsersData(true)} className={`size-11 flex items-center justify-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl hover:bg-slate-50 transition-all text-slate-500 ${usersLoading ? 'animate-spin opacity-50 pointer-events-none' : ''}`}><span className="material-icons-round text-lg">refresh</span></button>
                                        <button onClick={handleExportUsers} className="h-11 px-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-slate-50 transition-all"><span className="material-icons-round text-sm">download</span> Export</button>
                                        <button onClick={openAddUser} className="h-11 px-6 bg-primary text-white rounded-2xl text-xs font-bold shadow-lg shadow-primary/20 flex items-center gap-2 active:scale-95 transition-all"><span className="material-icons-round text-lg">add</span> Add User</button>
                                    </div>
                                </div>
                                <div className="flex-1 overflow-y-auto custom-scrollbar">
                                    <table className="w-full data-table">
                                        <thead><tr><th>User</th><th>Contact</th><th>Role</th><th>Status</th><th className="text-right">Actions</th></tr></thead>
                                        <tbody>
                                            {usersLoading ? <TableSkeleton columns={5} /> : users.length > 0 ? users.map((u) => (<tr key={u.id} className="data-row transition-colors"><td><div className="flex items-center gap-3"><div className={`size-10 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-sm bg-gradient-to-br ${u.id % 2 === 0 ? 'from-primary to-blue-600' : 'from-emerald-500 to-teal-600'}`}>{u.name?.[0]}{u.surname?.[0]}</div><div><p className="font-bold text-slate-900 dark:text-white leading-none mb-1">{u.name} {u.surname}</p><p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">ID: {u.id}</p></div></div></td><td><div className="space-y-1"><div className="flex items-center gap-2 text-slate-500"><span className="material-icons-round text-sm">mail_outline</span> {u.email}</div>{u.phoneNumber && <div className="flex items-center gap-2 text-slate-400 text-xs"><span className="material-icons-round text-sm">phone_iphone</span> +{u.phoneCountryCode} {u.phoneNumber}</div>}</div></td><td><div className="flex flex-wrap gap-1">{u.roles?.length > 0 ? u.roles.map((r, idx) => (<span key={r.id || idx} className="px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-primary text-[10px] font-bold rounded-full">{r.roleName || r.name}</span>)) : <span className="text-slate-300 text-[10px] font-bold italic">No Role</span>}</div></td><td><div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold ${u.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30' : 'bg-slate-100 text-slate-500 dark:bg-slate-800'}`}><div className={`size-1.5 rounded-full ${u.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-slate-400'}`}></div>{u.status === 'ACTIVE' ? 'Active' : 'Passive'}</div></td><td className="text-right"><div className="flex items-center justify-end gap-1"><button onClick={() => openEditUser(u)} className="size-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"><span className="material-icons-round text-lg">edit</span></button><button onClick={() => handleDeleteUser(u.id)} className="size-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20 transition-colors"><span className="material-icons-round text-lg">delete_outline</span></button></div></td></tr>)) : (<tr><td colSpan="5" className="py-20 text-center"><p className="text-slate-400 text-sm font-medium italic">No users found</p></td></tr>)}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col gap-6 overflow-hidden">
                            {/* Guest Summary Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="bg-[#f5f3ff] dark:bg-purple-900/10 p-4 rounded-[24px] border border-purple-100/50 dark:border-purple-800/20 shadow-sm">
                                    <div className="flex justify-between items-start mb-4">
                                        <span className="text-[9px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-[0.2em]">Total Guests</span>
                                        <div className="size-8 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center text-purple-600 shadow-sm">
                                            <span className="material-icons-round text-lg">recent_actors</span>
                                        </div>
                                    </div>
                                    <div className="flex items-end gap-1.5">
                                        <div className="text-2xl font-bold text-slate-900 dark:text-white leading-none">{statsLoading ? '...' : summary.totalGuestCount}</div>
                                        <div className="text-[9px] font-bold text-purple-400 mb-0.5">PROFILES</div>
                                    </div>
                                </div>
                                
                                <div className="bg-[#f0fdf4] dark:bg-emerald-900/10 p-4 rounded-[24px] border border-emerald-100/50 dark:border-emerald-800/20 shadow-sm">
                                    <div className="flex justify-between items-start mb-4">
                                        <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-[0.2em]">Active Guests</span>
                                        <div className="size-8 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center text-emerald-600 shadow-sm">
                                            <span className="material-icons-round text-lg">how_to_reg</span>
                                        </div>
                                    </div>
                                    <div className="flex items-end gap-1.5">
                                        <div className="text-2xl font-bold text-slate-900 dark:text-white leading-none">{statsLoading ? '...' : summary.activeGuestCount}</div>
                                        <div className="text-[9px] font-bold text-emerald-400 mb-0.5">VERIFIED</div>
                                    </div>
                                </div>
                                
                                <div className="bg-[#fef2f2] dark:bg-red-900/10 p-4 rounded-[24px] border border-red-100/50 dark:border-red-800/20 shadow-sm">
                                    <div className="flex justify-between items-start mb-4">
                                        <span className="text-[9px] font-bold text-red-600 dark:text-red-400 uppercase tracking-[0.2em]">Passive Guests</span>
                                        <div className="size-8 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center text-red-600 shadow-sm">
                                            <span className="material-icons-round text-lg">person_remove</span>
                                        </div>
                                    </div>
                                    <div className="flex items-end gap-1.5">
                                        <div className="text-2xl font-bold text-slate-900 dark:text-white leading-none">{statsLoading ? '...' : summary.passiveGuestCount}</div>
                                        <div className="text-[9px] font-bold text-red-400 mb-0.5">ARCHIVED</div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex-1 flex flex-col bg-white dark:bg-slate-900/50 backdrop-blur-3xl rounded-[40px] border border-slate-100 dark:border-white/5 overflow-hidden shadow-sm">
                                <div className="p-6 border-b border-slate-50 dark:border-white/5 flex flex-wrap items-center justify-between gap-4">
                                    <div className="flex items-center gap-4 flex-1 max-w-2xl">
                                        <div className="relative flex-1">
                                            <span className="material-icons-round absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">search</span>
                                            <input type="text" placeholder="Search by name, email or passport..." value={guestFilters.query} onChange={(e) => handleGuestFilterChange({ ...guestFilters, query: e.target.value })} className="w-full h-11 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl pl-12 pr-4 text-xs font-semibold outline-none focus:border-primary transition-colors" />
                                        </div>
                                        <select value={guestFilters.countryCodes[0] || ''} onChange={(e) => handleGuestFilterChange({ ...guestFilters, countryCodes: e.target.value ? [e.target.value] : [] })} className="h-11 px-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl text-xs font-bold outline-none cursor-pointer">
                                            <option value="">All Countries</option>
                                            {countries.slice(0, 20).map(c => <option key={c.locationId} value={c.isoCode}>{c.name?.defaultName}</option>)}
                                        </select>
                                        <select value={guestFilters.status} onChange={(e) => handleGuestFilterChange({ ...guestFilters, status: e.target.value })} className="h-11 px-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl text-xs font-bold outline-none cursor-pointer">
                                            <option value="ACTIVE">Active</option>
                                            <option value="PASSIVE">Passive</option>
                                        </select>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button onClick={() => fetchGuestsData(true)} className={`size-11 flex items-center justify-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl hover:bg-slate-50 transition-all text-slate-500 ${guestsLoading ? 'animate-spin opacity-50 pointer-events-none' : ''}`}><span className="material-icons-round text-lg">refresh</span></button>
                                        <button onClick={handleExportGuests} className="h-11 px-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-slate-50 transition-all"><span className="material-icons-round text-sm">download</span> Export</button>
                                        <button onClick={openAddGuest} className="h-11 px-6 bg-primary text-white rounded-2xl text-xs font-bold shadow-lg shadow-primary/20 flex items-center gap-2 active:scale-95 transition-all"><span className="material-icons-round text-lg">add</span> Add Guest</button>
                                    </div>
                                </div>
                                <div className="flex-1 overflow-y-auto custom-scrollbar">
                                    <table className="w-full data-table">
                                        <thead><tr><th>Guest</th><th>Birth & Country</th><th>Passport</th><th>Contact</th><th>Status</th><th className="text-right">Actions</th></tr></thead>
                                        <tbody>
                                            {guestsLoading ? <TableSkeleton columns={6} /> : guests.length > 0 ? guests.map((g) => (
                                                <tr key={g.id} className="data-row transition-colors"><td><div className="flex items-center gap-3"><div className={`size-10 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-sm bg-gradient-to-br from-purple-500 to-indigo-600`}>{g.firstName?.[0]}{g.lastName?.[0]}</div><div><p className="font-bold text-slate-900 dark:text-white leading-none mb-1">{g.gender === 'MALE' ? 'Mr' : 'Mrs'} {g.firstName} {g.lastName}</p><p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">ID: {g.id}</p></div></div></td><td><div className="flex items-center gap-3"><div className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-[10px] font-bold text-slate-500">{g.country || 'TR'}</div><div><p className="text-xs font-bold text-slate-600 dark:text-slate-300 mb-0.5">Born: {g.birthDate || 'Unknown'}</p></div></div></td><td><div className="flex items-center gap-2"><div className="size-6 bg-blue-50 dark:bg-blue-900/20 rounded flex items-center justify-center text-primary"><span className="material-icons-round text-sm">badge</span></div><div><p className="text-xs font-bold text-slate-900 dark:text-white">{g.passportNo || 'N/A'}</p><p className="text-[10px] text-slate-400">Expires: {g.passportExpiry || 'N/A'}</p></div></div></td><td><div className="space-y-1"><div className="flex items-center gap-2 text-slate-500"><span className="material-icons-round text-sm">mail_outline</span> {g.email}</div>{g.phoneNumber && <div className="flex items-center gap-2 text-slate-400 text-xs"><span className="material-icons-round text-sm">phone_iphone</span> +{g.phoneCountryCode} {g.phoneNumber}</div>}</div></td><td><div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold ${g.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30' : 'bg-slate-100 text-slate-500 dark:bg-slate-800'}`}><div className={`size-1.5 rounded-full ${g.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-slate-400'}`}></div>{g.status === 'ACTIVE' ? 'Active' : 'Passive'}</div></td><td className="text-right"><div className="flex items-center justify-end gap-1"><button onClick={() => openEditGuest(g)} className="size-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"><span className="material-icons-round text-lg">edit</span></button><button onClick={() => handleDeleteGuest(g.id)} className="size-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20 transition-colors"><span className="material-icons-round text-lg">delete_outline</span></button></div></td></tr>
                                            )) : (<tr><td colSpan="6" className="py-20 text-center"><p className="text-slate-400 text-sm font-medium italic">No guests found</p></td></tr>)}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}
                    </div>
                </div>
            </main>

            {/* Confirmation Modal */}
            {confirmModal.show && (
                <div className="fixed inset-0 z-[30000] flex items-center justify-center p-4">
                    <div className="modal-overlay fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setConfirmModal({ ...confirmModal, show: false })}></div>
                    <div className="relative bg-white dark:bg-slate-900 w-full max-w-sm rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-8 text-center"><div className={`size-16 rounded-3xl flex items-center justify-center mx-auto mb-6 ${confirmModal.type === 'danger' ? 'bg-red-50 text-red-500 dark:bg-red-900/20' : 'bg-primary/10 text-primary'}`}><span className="material-icons-round text-3xl">{confirmModal.type === 'danger' ? 'delete_forever' : 'help_outline'}</span></div><h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{confirmModal.title}</h3><p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{confirmModal.message}</p></div>
                        <div className="p-6 bg-slate-50 dark:bg-slate-800/50 flex gap-3"><button onClick={() => setConfirmModal({ ...confirmModal, show: false })} className="flex-1 h-12 rounded-2xl text-sm font-bold text-slate-500 hover:bg-white dark:hover:bg-slate-700 transition-all border border-slate-200 dark:border-slate-700">Cancel</button><button onClick={() => { confirmModal.onConfirm(); setConfirmModal({ ...confirmModal, show: false }); }} className={`flex-1 h-12 rounded-2xl text-sm font-bold text-white shadow-lg transition-all active:scale-95 ${confirmModal.type === 'danger' ? 'bg-red-500 shadow-red-500/20 hover:bg-red-600' : 'bg-primary shadow-primary/20'}`}>Confirm</button></div>
                    </div>
                </div>
            )}

            {/* Modals (Users) */}
            {isUserModalOpen && (
                <div className="fixed inset-0 z-[20000] flex items-center justify-center p-4 overflow-y-auto">
                    <div className="modal-overlay fixed inset-0" onClick={() => setIsUserModalOpen(false)}></div>
                    <div className="relative bg-white dark:bg-slate-900 w-full max-w-xl rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-8 border-b border-slate-50 dark:border-white/5"><div className="flex items-center justify-between"><div><h3 className="text-lg font-bold text-slate-900 dark:text-white">{editingUser ? 'Edit User' : 'Add User'}</h3><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Enter user information</p></div><button onClick={() => setIsUserModalOpen(false)} className="size-10 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"><span className="material-icons-round">close</span></button></div></div>
                        <form onSubmit={handleUserSubmit} className="p-8 space-y-6">
                            <div className="grid grid-cols-2 gap-4"><div className="space-y-1"><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Name</label><input type="text" required value={userFormData.name} onChange={(e) => setUserFormData(prev => ({ ...prev, name: e.target.value }))} className="w-full h-11 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl px-4 text-xs font-bold outline-none focus:border-primary transition-all" /></div><div className="space-y-1"><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Surname</label><input type="text" required value={userFormData.surname} onChange={(e) => setUserFormData(prev => ({ ...prev, surname: e.target.value }))} className="w-full h-11 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl px-4 text-xs font-bold outline-none focus:border-primary transition-all" /></div></div>
                            <div className="space-y-1"><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Email Address</label><input type="email" required value={userFormData.email} onChange={(e) => setUserFormData(prev => ({ ...prev, email: e.target.value }))} className="w-full h-11 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl px-4 text-xs font-bold outline-none focus:border-primary transition-all" /></div>
                            {!editingUser && <div className="space-y-1"><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Password</label><input type="password" required value={userFormData.password} onChange={(e) => setUserFormData(prev => ({ ...prev, password: e.target.value }))} className="w-full h-11 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl px-4 text-xs font-bold outline-none focus:border-primary transition-all" /></div>}
                            <div className="space-y-1"><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Phone Number</label><div className="grid grid-cols-4 gap-2"><input type="text" value={userFormData.phoneCountryCode} onChange={(e) => setUserFormData(prev => ({ ...prev, phoneCountryCode: e.target.value }))} className="h-11 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl text-center text-xs font-bold outline-none" placeholder="+90" /><input type="text" value={userFormData.phoneNumber} onChange={(e) => setUserFormData(prev => ({ ...prev, phoneNumber: e.target.value }))} className="col-span-3 h-11 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl px-4 text-xs font-bold outline-none" placeholder="5XX..." /></div></div>
                            <div className="grid grid-cols-2 gap-4"><div className="space-y-1"><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Role</label><select multiple value={userFormData.roleIds} onChange={(e) => setUserFormData(prev => ({ ...prev, roleIds: Array.from(e.target.selectedOptions, option => parseInt(option.value)) }))} className="w-full min-h-[80px] bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl p-2 text-xs font-bold outline-none focus:border-primary">{roles.map(r => <option key={r.id} value={r.id}>{r.roleName || r.name}</option>)}</select></div><div className="space-y-1"><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Status</label><select value={userFormData.status} onChange={(e) => setUserFormData(prev => ({ ...prev, status: e.target.value }))} className="w-full h-11 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl px-4 text-xs font-bold outline-none focus:border-primary"><option value="ACTIVE">Active</option><option value="PASSIVE">Passive</option></select></div></div>
                            <div className="pt-4 flex items-center justify-end gap-3"><button type="button" onClick={() => setIsUserModalOpen(false)} className="h-11 px-6 rounded-2xl text-xs font-bold text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Cancel</button><button type="submit" disabled={saving} className="h-11 px-8 bg-primary text-white rounded-2xl text-xs font-bold shadow-lg shadow-primary/20 active:scale-95 transition-all">{saving ? 'Processing...' : 'Save User'}</button></div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modals (Guests) */}
            {isGuestModalOpen && (
                <div className="fixed inset-0 z-[20000] flex items-center justify-center p-4 overflow-y-auto">
                    <div className="modal-overlay fixed inset-0" onClick={() => setIsGuestModalOpen(false)}></div>
                    <div className="relative bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-8 border-b border-slate-50 dark:border-white/5"><div className="flex items-center justify-between"><div><h3 className="text-lg font-bold text-slate-900 dark:text-white">{editingGuest ? 'Edit Guest' : 'Add Guest'}</h3><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Enter guest information</p></div><button onClick={() => setIsGuestModalOpen(false)} className="size-10 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"><span className="material-icons-round">close</span></button></div></div>
                        <form onSubmit={handleGuestSubmit} className="p-8 space-y-6">
                            <div className="grid grid-cols-3 gap-4"><div className="space-y-1"><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Gender</label><select value={guestFormData.gender} onChange={(e) => setGuestFormData(prev => ({ ...prev, gender: e.target.value }))} className="w-full h-11 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl px-4 text-xs font-bold outline-none focus:border-primary"><option value="MALE">Mr</option><option value="FEMALE">Mrs</option></select></div><div className="space-y-1"><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">First Name</label><input type="text" required value={guestFormData.firstName} onChange={(e) => setGuestFormData(prev => ({ ...prev, firstName: e.target.value }))} className="w-full h-11 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl px-4 text-xs font-bold outline-none focus:border-primary" /></div><div className="space-y-1"><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Last Name</label><input type="text" required value={guestFormData.lastName} onChange={(e) => setGuestFormData(prev => ({ ...prev, lastName: e.target.value }))} className="w-full h-11 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl px-4 text-xs font-bold outline-none focus:border-primary" /></div></div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Birth Date</label>
                                    <DatePicker 
                                        selected={guestFormData.birthDate ? new Date(formatToPickerDate(guestFormData.birthDate)) : null} 
                                        onChange={(date) => setGuestFormData(prev => ({ ...prev, birthDate: date ? formatToBackendDate(date.toISOString().split('T')[0]) : '' }))}
                                        dateFormat="dd.MM.yyyy"
                                        placeholderText="DD.MM.YYYY"
                                        showMonthDropdown
                                        showYearDropdown
                                        dropdownMode="select"
                                        className="w-full h-11 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl px-4 text-xs font-bold outline-none focus:border-primary w-full"
                                        wrapperClassName="w-full"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Country</label>
                                    <input type="text" value={guestFormData.country} onChange={(e) => setGuestFormData(prev => ({ ...prev, country: e.target.value }))} className="w-full h-11 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl px-4 text-xs font-bold outline-none uppercase" placeholder="TR" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Passport No</label>
                                    <input type="text" value={guestFormData.passportNo} onChange={(e) => setGuestFormData(prev => ({ ...prev, passportNo: e.target.value }))} className="w-full h-11 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl px-4 text-xs font-bold outline-none" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Passport Expiry</label>
                                    <DatePicker 
                                        selected={guestFormData.passportExpiry ? new Date(formatToPickerDate(guestFormData.passportExpiry)) : null} 
                                        onChange={(date) => setGuestFormData(prev => ({ ...prev, passportExpiry: date ? formatToBackendDate(date.toISOString().split('T')[0]) : '' }))}
                                        dateFormat="dd.MM.yyyy"
                                        placeholderText="DD.MM.YYYY"
                                        showMonthDropdown
                                        showYearDropdown
                                        dropdownMode="select"
                                        className="w-full h-11 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl px-4 text-xs font-bold outline-none focus:border-primary w-full"
                                        wrapperClassName="w-full"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1"><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Email Address</label><input type="email" required value={guestFormData.email} onChange={(e) => setGuestFormData(prev => ({ ...prev, email: e.target.value }))} className="w-full h-11 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl px-4 text-xs font-bold outline-none focus:border-primary" placeholder="example@mail.com" /></div>
                                <div className="space-y-1"><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Status</label><select value={guestFormData.status} onChange={(e) => setGuestFormData(prev => ({ ...prev, status: e.target.value }))} className="w-full h-11 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl px-4 text-xs font-bold outline-none focus:border-primary"><option value="ACTIVE">Active</option><option value="PASSIVE">Passive</option></select></div>
                            </div>
                            <div className="space-y-1"><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Phone Number</label><div className="grid grid-cols-4 gap-2"><input type="text" value={guestFormData.phoneCountryCode} onChange={(e) => setGuestFormData(prev => ({ ...prev, phoneCountryCode: e.target.value }))} className="h-11 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl text-center text-xs font-bold outline-none" placeholder="+90" /><input type="text" value={guestFormData.phoneNumber} onChange={(e) => setGuestFormData(prev => ({ ...prev, phoneNumber: e.target.value }))} className="col-span-3 h-11 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl px-4 text-xs font-bold outline-none" placeholder="5XX..." /></div></div>
                            <div className="pt-4 flex items-center justify-end gap-3"><button type="button" onClick={() => setIsGuestModalOpen(false)} className="h-11 px-6 rounded-2xl text-xs font-bold text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Cancel</button><button type="submit" disabled={saving} className="h-11 px-8 bg-primary text-white rounded-2xl text-xs font-bold shadow-lg shadow-primary/20 active:scale-95 transition-all">{saving ? 'Processing...' : 'Save Guest'}</button></div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
};

export default MyOffice;
