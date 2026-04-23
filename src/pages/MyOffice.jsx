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
import ThemeToggle from '../components/ThemeToggle';
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
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef(null);

    const [mapCenter, setMapCenter] = useState([36.6826845, 30.9089719]);
    const [zoom, setZoom] = useState(13);
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

    // Confirm Modal State
    const [confirmModal, setConfirmModal] = useState({ show: false, title: '', message: '', onConfirm: null, type: 'danger' });

    // Cache tracking
    const isUsersLoaded = useRef(false);
    const isGuestsLoaded = useRef(false);

    // Summary data
    const [summary, setSummary] = useState({ totalUsers: 0, activeUsers: 0, totalGuests: 0, activeGuests: 0 });

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
        phoneNumber: ''
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

    // Single Mount Effect
    useEffect(() => {
        const abortController = new AbortController();
        const fetchOnMount = async () => {
            await fetchInitialData(abortController.signal);
        };
        fetchOnMount();
        fetchStats(abortController.signal);

        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
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
            const [agencyData, countriesData] = await Promise.all([
                agencyService.getMe(signal),
                locationService.listCountries(signal)
            ]);

            setCountries(countriesData.locationList || []);

            let initialCities = [];
            if (agencyData.countryId) {
                try {
                    const citiesData = await locationService.listSubRegions(agencyData.countryId);
                    initialCities = citiesData.locationList || [];
                } catch (e) { console.error(e); }
            }
            setCities(initialCities);

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
                agencyFinancialInfo: agencyData.agencyFinancialInfo || {}
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
            const [totalUsersRes, activeUsersRes, totalGuestsRes] = await Promise.all([
                userService.filterUsers({}, 0, 1, signal).catch(() => ({})),
                userService.filterUsers({ status: 'ACTIVE' }, 0, 1, signal).catch(() => ({})),
                guestService.filterGuests({}, 0, 1, signal).catch(() => ({}))
            ]);

            setSummary({
                totalUsers: totalUsersRes.numberOfItems ?? totalUsersRes.agencyUsers?.length ?? 0,
                activeUsers: activeUsersRes.numberOfItems ?? activeUsersRes.agencyUsers?.length ?? 0,
                totalGuests: totalGuestsRes.numberOfItems ?? totalGuestsRes.guests?.length ?? 0,
                activeGuests: 0
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

    const handleInputChange = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));
    const setMapLocation = (latlng) => setFormData(prev => ({ ...prev, latitude: latlng[0], longitude: latlng[1] }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setSaving(true);
            const { officialTitle, taxOffice, taxNumber, ...cleanData } = formData;
            const updateData = { ...cleanData, latitude: formData.latitude, longitude: formData.longitude, agencyFinancialInfo: { ...formData.agencyFinancialInfo, title: formData.officialTitle, taxOffice: formData.taxOffice, taxNumber: formData.taxNumber, latitude: formData.latitude, longitude: formData.longitude } };
            await agencyService.updateAgency(formData.id, updateData);
            showNotification('Agency profile updated.');
        } catch (err) { showNotification(err.message || 'Sync failed.', 'error'); } finally { setSaving(false); }
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
            const sumData = await userService.getSummary(); setSummary(prev => ({ ...prev, totalUsers: sumData.totalUsers, activeUsers: sumData.activeUsers }));
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
                    setSummary(prev => ({ ...prev, totalUsers: sumData.totalUsers, activeUsers: sumData.activeUsers }));
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

    const openAddGuest = () => { setEditingGuest(null); setGuestFormData({ gender: 'MALE', firstName: '', lastName: '', birthDate: '', country: '', passportNo: '', passportExpiry: '', email: '', phoneCountryCode: '90', phoneNumber: '' }); setIsGuestModalOpen(true); };
    const openEditGuest = (g) => { setEditingGuest(g); setGuestFormData({ gender: g.gender || 'MALE', firstName: g.firstName, lastName: g.lastName, birthDate: g.birthDate, country: g.country, passportNo: g.passportNo, passportExpiry: g.passportExpiry, email: g.email, phoneCountryCode: g.phoneCountryCode || '90', phoneNumber: g.phoneNumber || '' }); setIsGuestModalOpen(true); };
    const handleGuestSubmit = async (e) => {
        e.preventDefault();
        try {
            setSaving(true);
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (guestFormData.email && !emailRegex.test(guestFormData.email)) { showNotification('Please enter a valid email address.', 'error'); setSaving(false); return; }
            if (editingGuest) { await guestService.updateGuest(editingGuest.id, guestFormData); showNotification('Guest updated successfully'); }
            else { await guestService.saveGuest(guestFormData); showNotification('Guest created successfully'); }
            setIsGuestModalOpen(false); fetchGuestsData();
            const sumData = await guestService.getSummary(); setSummary(prev => ({ ...prev, totalGuests: sumData.numberOfItems || sumData.totalGuests, activeGuests: sumData.activeGuests }));
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
                    setSummary(prev => ({ ...prev, totalGuests: sumData.numberOfItems || sumData.totalGuests, activeGuests: sumData.activeGuests }));
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

    const handleLogout = () => { logout(); navigate('/login'); };
    const openInMaps = () => { const addressStr = `${formData.address} ${formData.zipCode}`; const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addressStr)}`; window.open(url, '_blank'); };
    const userDisplayName = user?.name && user?.surname ? `${user.name} ${user.surname}` : user?.email || 'Travel Agent';

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
                            <ThemeToggle />
                            <div className="relative" ref={menuRef}>
                                <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="flex items-center gap-2 transition-transform active:scale-95 focus:outline-none">
                                    <div className="size-10 rounded-lg shadow-sm hover:shadow-md transition-shadow flex items-center justify-center bg-slate-100 dark:bg-[#233648]"><span className="material-symbols-outlined text-slate-600 dark:text-slate-300 text-[24px]">person</span></div>
                                    <span className="material-symbols-outlined text-slate-500 dark:text-slate-400">expand_more</span>
                                </button>
                                {isMenuOpen && <div className="absolute right-0 top-full mt-2 w-[340px] bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden z-[9999] animate-in fade-in slide-in-from-top-2"><div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50"><p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">My Account</p><p className="text-sm font-bold text-slate-900 dark:text-white truncate">{userDisplayName}</p><p className="text-sm text-slate-500 break-words font-medium mt-0.5">{user?.email}</p></div><div className="p-2"><button onClick={handleLogout} className="w-full text-left px-3 py-2.5 text-sm font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg flex items-center gap-3 transition-colors"><div className="w-8 h-8 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center text-red-500"><span className="material-symbols-outlined text-[18px]">logout</span></div> Sign Out</button></div></div>}
                            </div>
                        </div>
                    </header>


                    <div className="mb-6 flex gap-10 border-b border-slate-200 dark:border-slate-800">
                        {[
                            { id: 'general', label: 'General Information', icon: 'info' },
                            { id: 'users', label: 'Users', count: statsLoading ? '...' : summary.totalUsers, icon: 'groups' },
                            { id: 'guests', label: 'Guests', count: statsLoading ? '...' : summary.totalGuests, icon: 'recent_actors' }
                        ].map((tab) => (
                            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`pb-4 text-[10px] font-bold uppercase tracking-widest relative flex items-center gap-2.5 transition-all ${activeTab === tab.id ? 'text-primary' : 'text-slate-400 hover:text-slate-600'}`}>
                                <span className="material-icons-round text-lg">{tab.icon}</span> {tab.label} {tab.count !== undefined && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 ml-1">{tab.count}</span>}
                                {activeTab === tab.id && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full"></div>}
                            </button>
                        ))}
                    </div>

                    <div className="flex-1 overflow-hidden">
                        {activeTab === 'general' ? (
                            <div className="h-full flex gap-10 overflow-hidden pb-4">
                                <div className="w-[35%] flex flex-col gap-6 overflow-y-auto custom-scrollbar pr-2 flex-shrink-0">
                                    <div className="bg-slate-900 dark:bg-slate-800 rounded-[40px] p-8 text-white relative overflow-hidden shadow-2xl"><div className="absolute top-0 right-0 p-6"><div className="size-10 bg-white/10 rounded-xl flex items-center justify-center"><span className="material-icons-round text-xl">security</span></div></div><div className="mt-8 mb-12"><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Agency ID Card</p><h2 className="text-2xl font-bold truncate">{formData.name || 'Your Agency'}</h2><p className="text-xs text-slate-400 mt-1 opacity-80">{formData.officialTitle}</p></div><div className="space-y-6 pt-6 border-t border-white/10"><div><p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Base Location</p><p className="text-sm font-semibold">{formData.cityName || 'Antalya'}, {formData.countryName || 'Türkiye'}</p></div><div><p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Digital Coordinates</p><p className="text-[11px] font-mono text-primary font-bold">{formData.latitude?.toFixed(4)}, {formData.longitude?.toFixed(4)}</p></div></div></div>
                                    <div className="map-card h-[600px] relative group border-4 border-white dark:border-slate-800"><MapContainer center={mapCenter} zoom={zoom} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}><ChangeView center={mapCenter} zoom={zoom} /><TileLayer attribution='&copy; CARTO' url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" /><LocationMarker position={[formData.latitude, formData.longitude]} setPosition={setMapLocation} /></MapContainer><div className="absolute bottom-6 right-6 z-[1000] opacity-0 group-hover:opacity-100 transition-all"><button onClick={openInMaps} className="size-10 bg-white dark:bg-slate-900 rounded-xl shadow-xl flex items-center justify-center text-primary"><span className="material-icons-round">open_in_new</span></button></div></div>
                                </div>
                                <div className="flex-1 bg-white/50 dark:bg-slate-900/50 backdrop-blur-3xl rounded-[40px] border border-white/40 dark:border-white/5 p-12 overflow-y-auto custom-scrollbar">
                                    <form onSubmit={handleSubmit} className="max-w-3xl mx-auto space-y-16">
                                        <div className="space-y-10"><div className="flex items-center gap-4"><div className="size-2 bg-primary rounded-full"></div><h3 className="text-xs font-bold uppercase tracking-[0.3em] text-slate-400">Section 01 / Identity</h3></div><div className="grid grid-cols-2 gap-12"><div className="space-y-1"><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Agency Name</label><input type="text" value={formData.name} onChange={(e) => handleInputChange('name', e.target.value)} className="w-full h-12 input-modern outline-none font-bold text-sm" placeholder="Commercial Name" /></div><div className="space-y-1"><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Official Title</label><input type="text" value={formData.officialTitle} onChange={(e) => handleInputChange('officialTitle', e.target.value)} className="w-full h-12 input-modern outline-none font-bold text-sm" placeholder="Legal Title" /></div></div></div>
                                        <div className="space-y-10"><div className="flex items-center gap-4"><div className="size-2 bg-primary rounded-full"></div><h3 className="text-xs font-bold uppercase tracking-[0.3em] text-slate-400">Section 02 / Geography</h3></div><div className="space-y-10"><div className="grid grid-cols-2 gap-12"><div className="space-y-1"><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Country</label><select value={formData.countryId} onChange={handleCountryChange} className="w-full h-12 input-modern outline-none font-bold text-sm cursor-pointer appearance-none bg-transparent"><option value="">Select Territory</option>{countries.map(c => <option key={c.locationId} value={c.locationId}>{c.name?.translations?.en || c.name?.defaultName}</option>)}</select></div><div className="space-y-1"><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">City</label><select value={formData.cityId} onChange={(e) => handleInputChange('cityId', e.target.value)} className="w-full h-12 input-modern outline-none font-bold text-sm cursor-pointer appearance-none bg-transparent"><option value="">Select Hub</option>{cities.map(c => <option key={c.locationId} value={c.locationId}>{c.name?.translations?.en || c.name?.defaultName}</option>)}</select></div></div><div className="grid grid-cols-4 gap-12"><div className="col-span-3 space-y-1"><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Street Address</label><input type="text" value={formData.address} onChange={(e) => handleInputChange('address', e.target.value)} className="w-full h-12 input-modern outline-none font-bold text-sm" placeholder="Full street detail" /></div><div className="space-y-1"><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Zip Code</label><input type="text" value={formData.zipCode} onChange={(e) => handleInputChange('zipCode', e.target.value)} className="w-full h-12 input-modern outline-none font-bold text-sm text-center" placeholder="00000" /></div></div></div></div>
                                        <div className="space-y-10"><div className="flex items-center gap-4"><div className="size-2 bg-primary rounded-full"></div><h3 className="text-xs font-bold uppercase tracking-[0.3em] text-slate-400">Section 03 / Finance</h3></div><div className="grid grid-cols-2 gap-12"><div className="space-y-1"><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tax Office</label><input type="text" value={formData.taxOffice} onChange={(e) => handleInputChange('taxOffice', e.target.value)} className="w-full h-12 input-modern outline-none font-bold text-sm" /></div><div className="space-y-1"><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tax Number</label><input type="text" value={formData.taxNumber} onChange={(e) => handleInputChange('taxNumber', e.target.value)} className="w-full h-12 input-modern outline-none font-bold text-sm" /></div></div></div>
                                        <div className="pt-10"><button type="submit" disabled={saving} className="w-full h-16 bg-primary text-white rounded-[24px] font-bold text-xs uppercase tracking-[0.3em] shadow-2xl shadow-primary/30 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-3">{saving ? 'Synchronizing...' : 'Save Office Profile'}{!saving && <span className="material-icons-round text-xl">check_circle</span>}</button></div>
                                    </form>
                                </div>
                            </div>
                        ) : activeTab === 'users' ? (
                            <div className="h-full flex flex-col bg-white dark:bg-slate-900/50 backdrop-blur-3xl rounded-[40px] border border-slate-100 dark:border-white/5 overflow-hidden shadow-sm">
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
                                        <thead><tr><th className="w-12 text-center"><input type="checkbox" className="rounded border-slate-300" /></th><th>User</th><th>Contact</th><th>Role</th><th>Status</th><th className="text-right">Actions</th></tr></thead>
                                        <tbody>
                                            {usersLoading ? <TableSkeleton columns={6} /> : users.length > 0 ? users.map((u) => (<tr key={u.id} className="data-row transition-colors"><td className="text-center"><input type="checkbox" className="rounded border-slate-300" /></td><td><div className="flex items-center gap-3"><div className={`size-10 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-sm bg-gradient-to-br ${u.id % 2 === 0 ? 'from-primary to-blue-600' : 'from-emerald-500 to-teal-600'}`}>{u.name?.[0]}{u.surname?.[0]}</div><div><p className="font-bold text-slate-900 dark:text-white leading-none mb-1">{u.name} {u.surname}</p><p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">ID: {u.id}</p></div></div></td><td><div className="space-y-1"><div className="flex items-center gap-2 text-slate-500"><span className="material-icons-round text-sm">mail_outline</span> {u.email}</div>{u.phoneNumber && <div className="flex items-center gap-2 text-slate-400 text-xs"><span className="material-icons-round text-sm">phone_iphone</span> +{u.phoneCountryCode} {u.phoneNumber}</div>}</div></td><td><div className="flex flex-wrap gap-1">{u.roles?.length > 0 ? u.roles.map((r, idx) => (<span key={r.id || idx} className="px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-primary text-[10px] font-bold rounded-full">{r.roleName || r.name}</span>)) : <span className="text-slate-300 text-[10px] font-bold italic">No Role</span>}</div></td><td><div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold ${u.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30' : 'bg-slate-100 text-slate-500 dark:bg-slate-800'}`}><div className={`size-1.5 rounded-full ${u.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-slate-400'}`}></div>{u.status === 'ACTIVE' ? 'Active' : 'Passive'}</div></td><td className="text-right"><div className="flex items-center justify-end gap-1"><button onClick={() => openEditUser(u)} className="size-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"><span className="material-icons-round text-lg">edit</span></button><button onClick={() => handleDeleteUser(u.id)} className="size-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20 transition-colors"><span className="material-icons-round text-lg">delete_outline</span></button></div></td></tr>)) : (<tr><td colSpan="6" className="py-20 text-center"><p className="text-slate-400 text-sm font-medium italic">No users found</p></td></tr>)}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ) : (
                            <div className="h-full flex flex-col bg-white dark:bg-slate-900/50 backdrop-blur-3xl rounded-[40px] border border-slate-100 dark:border-white/5 overflow-hidden shadow-sm">
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
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button onClick={() => fetchGuestsData(true)} className={`size-11 flex items-center justify-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl hover:bg-slate-50 transition-all text-slate-500 ${guestsLoading ? 'animate-spin opacity-50 pointer-events-none' : ''}`}><span className="material-icons-round text-lg">refresh</span></button>
                                        <button onClick={handleExportGuests} className="h-11 px-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-slate-50 transition-all"><span className="material-icons-round text-sm">download</span> Export</button>
                                        <button onClick={openAddGuest} className="h-11 px-6 bg-primary text-white rounded-2xl text-xs font-bold shadow-lg shadow-primary/20 flex items-center gap-2 active:scale-95 transition-all"><span className="material-icons-round text-lg">add</span> Add Guest</button>
                                    </div>
                                </div>
                                <div className="flex-1 overflow-y-auto custom-scrollbar">
                                    <table className="w-full data-table">
                                        <thead><tr><th className="w-12 text-center"><input type="checkbox" className="rounded border-slate-300" /></th><th>Guest</th><th>Birth & Country</th><th>Passport</th><th>Contact</th><th className="text-right">Actions</th></tr></thead>
                                        <tbody>
                                            {guestsLoading ? <TableSkeleton columns={6} /> : guests.length > 0 ? guests.map((g) => (
                                                <tr key={g.id} className="data-row transition-colors"><td className="text-center"><input type="checkbox" className="rounded border-slate-300" /></td><td><div className="flex items-center gap-3"><div className={`size-10 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-sm bg-gradient-to-br from-purple-500 to-indigo-600`}>{g.firstName?.[0]}{g.lastName?.[0]}</div><div><p className="font-bold text-slate-900 dark:text-white leading-none mb-1">{g.gender === 'MALE' ? 'Mr' : 'Mrs'} {g.firstName} {g.lastName}</p><p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">ID: {g.id}</p></div></div></td><td><div className="flex items-center gap-3"><div className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-[10px] font-bold text-slate-500">{g.country || 'TR'}</div><div><p className="text-xs font-bold text-slate-600 dark:text-slate-300 mb-0.5">Born: {g.birthDate || 'Unknown'}</p></div></div></td><td><div className="flex items-center gap-2"><div className="size-6 bg-blue-50 dark:bg-blue-900/20 rounded flex items-center justify-center text-primary"><span className="material-icons-round text-sm">badge</span></div><div><p className="text-xs font-bold text-slate-900 dark:text-white">{g.passportNo || 'N/A'}</p><p className="text-[10px] text-slate-400">Expires: {g.passportExpiry || 'N/A'}</p></div></div></td><td><div className="space-y-1"><div className="flex items-center gap-2 text-slate-500"><span className="material-icons-round text-sm">mail_outline</span> {g.email}</div>{g.phoneNumber && <div className="flex items-center gap-2 text-slate-400 text-xs"><span className="material-icons-round text-sm">phone_iphone</span> +{g.phoneCountryCode} {g.phoneNumber}</div>}</div></td><td className="text-right"><div className="flex items-center justify-end gap-1"><button onClick={() => openEditGuest(g)} className="size-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"><span className="material-icons-round text-lg">edit</span></button><button onClick={() => handleDeleteGuest(g.id)} className="size-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20 transition-colors"><span className="material-icons-round text-lg">delete_outline</span></button></div></td></tr>
                                            )) : (<tr><td colSpan="6" className="py-20 text-center"><p className="text-slate-400 text-sm font-medium italic">No guests found</p></td></tr>)}
                                        </tbody>
                                    </table>
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
                            <div className="space-y-1"><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Email Address</label><input type="email" required value={guestFormData.email} onChange={(e) => setGuestFormData(prev => ({ ...prev, email: e.target.value }))} className="w-full h-11 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl px-4 text-xs font-bold outline-none focus:border-primary" placeholder="example@mail.com" /></div>
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
