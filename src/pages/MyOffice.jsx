import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useAuth } from '../context/AuthContext';
import { agencyService } from '../services/agencyService';
import { locationService } from '../services/locationService';
import ThemeToggle from '../components/ThemeToggle';

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
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef(null);

    const [mapCenter, setMapCenter] = useState([51.505, -0.09]);
    const [zoom, setZoom] = useState(13);
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

    // Form data
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
        agencyFinancialInfo: {
            title: '',
            countryId: '',
            cityId: '',
            address: '',
            phoneCountryCode: '',
            phoneNumber: '',
            email: '',
            taxOffice: '',
            taxNumber: ''
        }
    });

    const [countries, setCountries] = useState([]);
    const [cities, setCities] = useState([]);

    useEffect(() => {
        fetchInitialData();
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const showNotification = (message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 4000);
    };

    const fetchInitialData = async () => {
        try {
            setLoading(true);
            const [agencyData, countriesData] = await Promise.all([
                agencyService.getMe(),
                locationService.listCountries()
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

            let lat = agencyData.latitude || agencyData.geoLocation?.latitude || 51.505;
            let lng = agencyData.longitude || agencyData.geoLocation?.longitude || -0.09;
            
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
            const updateData = {
                ...cleanData,
                latitude: formData.latitude,
                longitude: formData.longitude,
                agencyFinancialInfo: {
                    ...formData.agencyFinancialInfo,
                    title: formData.officialTitle,
                    taxOffice: formData.taxOffice,
                    taxNumber: formData.taxNumber,
                    latitude: formData.latitude,
                    longitude: formData.longitude
                }
            };
            await agencyService.updateAgency(formData.id, updateData);
            showNotification('Agency profile updated.');
        } catch (err) { showNotification(err.message || 'Sync failed.', 'error'); } finally { setSaving(false); }
    };

    const handleLogout = () => { logout(); navigate('/login'); };
    const openInMaps = () => {
        const addressStr = `${formData.address} ${formData.zipCode}`;
        const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addressStr)}`;
        window.open(url, '_blank');
    };
    const userDisplayName = user?.name && user?.surname ? `${user.name} ${user.surname}` : user?.email || 'Travel Agent';

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-[#f8fafc] dark:bg-[#0f172a]">
                <div className="size-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-[#f8fafc] dark:bg-[#0f172a] text-slate-900 dark:text-slate-100 transition-colors duration-500 font-sans relative overflow-hidden">
            <style>{`
                .input-modern {
                    background: transparent;
                    border-bottom: 2px solid #e2e8f0;
                    transition: all 0.3s ease;
                    border-radius: 0;
                }
                .dark .input-modern {
                    border-color: #1e293b;
                }
                .input-modern:focus {
                    border-color: #3B82F6;
                    background: rgba(59, 130, 246, 0.02);
                }
                .map-card {
                    border-radius: 32px;
                    overflow: hidden;
                    box-shadow: 0 20px 50px rgba(0,0,0,0.05);
                }
                .dark .map-card {
                    box-shadow: 0 20px 50px rgba(0,0,0,0.3);
                }
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
                .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: #1e293b; }
            `}</style>

            {/* Notification */}
            {toast.show && (
                <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[10000] animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-2xl rounded-2xl flex items-center gap-3">
                        <div className={`size-2 rounded-full ${toast.type === 'success' ? 'bg-emerald-400' : 'bg-red-400'} animate-pulse`}></div>
                        <p className="text-[10px] font-bold uppercase tracking-widest">{toast.message}</p>
                    </div>
                </div>
            )}

            {/* Background Decorative Glows - EXACTLY AS DASHBOARD */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full pointer-events-none"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-400/10 blur-[120px] rounded-full pointer-events-none"></div>

            {/* Sidebar - EXACTLY AS DASHBOARD */}
            <aside className="w-60 border-r border-white/40 dark:border-white/5 bg-white/40 dark:bg-slate-900/40 backdrop-blur-3xl hidden lg:flex flex-col fixed h-full z-30 shadow-[4px_0_24px_-12px_rgba(0,0,0,0.05)]">
                <div className="p-3 flex items-center gap-2">
                    <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white cursor-pointer" onClick={() => navigate('/')}>
                        <span className="material-icons-round text-lg">language</span>
                    </div>
                    <span className="font-bold text-lg tracking-tight">TravelOfGlobe</span>
                </div>
                <nav className="flex-1 px-3 py-3 space-y-0.5">
                    <button onClick={() => navigate('/dashboard')} className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-xs w-full text-left">
                        <span className="material-icons-round text-[20px]">grid_view</span> Dashboard
                    </button>
                    <button className="flex items-center gap-3 px-3 py-2 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-primary font-medium text-xs w-full text-left">
                        <span className="material-icons-round text-[20px]">corporate_fare</span> My Office
                    </button>
                    <button onClick={() => navigate('/bookings')} className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-xs w-full text-left">
                        <span className="material-icons-round text-[20px]">book_online</span> My Bookings
                    </button>
                    <a className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-xs" href="#">
                        <span className="material-icons-round text-[20px]">account_balance_wallet</span> Finance
                    </a>
                    <a className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-xs" href="#">
                        <span className="material-icons-round text-[20px]">analytics</span> Accounting
                    </a>
                    <a className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-xs" href="#">
                        <span className="material-icons-round text-[20px]">settings</span> Operations
                    </a>
                    <div className="pt-2 mt-2 border-t border-slate-100 dark:border-slate-800">
                        <a className="flex items-center justify-between px-3 py-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-xs" href="#">
                            <div className="flex items-center gap-3">
                                <span className="material-icons-round text-[20px]">admin_panel_settings</span>
                                GSA Management
                            </div>
                            <span className="material-icons-round text-sm">chevron_right</span>
                        </a>
                    </div>
                </nav>
            </aside>

            {/* Main Area - EXACTLY AS DASHBOARD STRUCTURE */}
            <main className="flex-1 lg:ml-60 p-3 md:p-5 flex flex-col h-screen overflow-hidden">
                <div className="max-w-6xl mx-auto w-full flex flex-col h-full overflow-hidden">
                    
                    {/* Header - EXACTLY AS DASHBOARD */}
                    <header className="flex flex-wrap items-center justify-between mb-6 gap-4">
                        <div className="flex items-center gap-2">
                            <span className="material-icons-round text-primary text-xl">corporate_fare</span>
                            <h1 className="text-lg font-medium">My Office Management</h1>
                        </div>
                        <div className="flex items-center gap-4">
                            <ThemeToggle />
                            <div className="relative" ref={menuRef}>
                                <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="flex items-center gap-2 transition-transform active:scale-95 focus:outline-none">
                                    <div className="size-10 rounded-lg shadow-sm hover:shadow-md transition-shadow flex items-center justify-center bg-slate-100 dark:bg-[#233648]">
                                        <span className="material-symbols-outlined text-slate-600 dark:text-slate-300 text-[24px]">person</span>
                                    </div>
                                    <span className="material-symbols-outlined text-slate-500 dark:text-slate-400">expand_more</span>
                                </button>
                                {isMenuOpen && (
                                    <div className="absolute right-0 top-full mt-2 w-[340px] bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden z-[9999] animate-in fade-in slide-in-from-top-2">
                                        <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">My Account</p>
                                            <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{userDisplayName}</p>
                                            <p className="text-sm text-slate-500 break-words font-medium mt-0.5">{user?.email}</p>
                                        </div>
                                        <div className="p-2">
                                            <button onClick={handleLogout} className="w-full text-left px-3 py-2.5 text-sm font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg flex items-center gap-3 transition-colors">
                                                <div className="w-8 h-8 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center text-red-500">
                                                    <span className="material-symbols-outlined text-[18px]">logout</span>
                                                </div>
                                                Sign Out
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </header>

                    {/* Sub Navigation */}
                    <div className="mb-6 flex gap-10 border-b border-slate-200 dark:border-slate-800">
                        {[
                            { id: 'general', label: 'General Info', icon: 'info' },
                            { id: 'users', label: 'Team Members', icon: 'groups' },
                            { id: 'guests', label: 'Guest Database', icon: 'recent_actors' }
                        ].map((tab) => (
                            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`pb-4 text-[10px] font-bold uppercase tracking-widest relative flex items-center gap-2.5 transition-all ${activeTab === tab.id ? 'text-primary' : 'text-slate-400 hover:text-slate-600'}`}>
                                <span className="material-icons-round text-lg">{tab.icon}</span>
                                {tab.label}
                                {activeTab === tab.id && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full"></div>}
                            </button>
                        ))}
                    </div>

                    {/* Content Console */}
                    <div className="flex-1 overflow-hidden">
                        {activeTab === 'general' ? (
                            <div className="h-full flex gap-10 overflow-hidden pb-4">
                                {/* Left Summary (30%) */}
                                <div className="w-[30%] flex flex-col gap-6 overflow-y-auto custom-scrollbar pr-2 flex-shrink-0">
                                    <div className="bg-slate-900 dark:bg-slate-800 rounded-[40px] p-8 text-white relative overflow-hidden shadow-2xl">
                                        <div className="absolute top-0 right-0 p-6">
                                            <div className="size-10 bg-white/10 rounded-xl flex items-center justify-center">
                                                <span className="material-icons-round text-xl">security</span>
                                            </div>
                                        </div>
                                        <div className="mt-8 mb-12">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Agency ID Card</p>
                                            <h2 className="text-2xl font-bold truncate">{formData.name || 'Your Agency'}</h2>
                                            <p className="text-xs text-slate-400 mt-1 opacity-80">{formData.officialTitle}</p>
                                        </div>
                                        <div className="space-y-6 pt-6 border-t border-white/10">
                                            <div>
                                                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Base Location</p>
                                                <p className="text-sm font-semibold">{formData.cityName || 'Antalya'}, {formData.countryName || 'Turkey'}</p>
                                            </div>
                                            <div>
                                                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Digital Coordinates</p>
                                                <p className="text-[11px] font-mono text-primary font-bold">{formData.latitude?.toFixed(4)}, {formData.longitude?.toFixed(4)}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="map-card flex-1 relative group">
                                        <MapContainer center={mapCenter} zoom={zoom} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}>
                                            <ChangeView center={mapCenter} zoom={zoom} />
                                            <TileLayer attribution='&copy; CARTO' url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
                                            <LocationMarker position={[formData.latitude, formData.longitude]} setPosition={setMapLocation} />
                                        </MapContainer>
                                        <div className="absolute bottom-6 right-6 z-[1000] opacity-0 group-hover:opacity-100 transition-all">
                                            <button onClick={openInMaps} className="size-10 bg-white dark:bg-slate-900 rounded-xl shadow-xl flex items-center justify-center text-primary">
                                                <span className="material-icons-round">open_in_new</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Form (70%) */}
                                <div className="flex-1 bg-white/50 dark:bg-slate-900/50 backdrop-blur-3xl rounded-[40px] border border-white/40 dark:border-white/5 p-12 overflow-y-auto custom-scrollbar">
                                    <form onSubmit={handleSubmit} className="max-w-3xl mx-auto space-y-16">
                                        <div className="space-y-10">
                                            <div className="flex items-center gap-4">
                                                <div className="size-2 bg-primary rounded-full"></div>
                                                <h3 className="text-xs font-bold uppercase tracking-[0.3em] text-slate-400">Section 01 / Identity</h3>
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
                                        </div>

                                        <div className="space-y-10">
                                            <div className="flex items-center gap-4">
                                                <div className="size-2 bg-primary rounded-full"></div>
                                                <h3 className="text-xs font-bold uppercase tracking-[0.3em] text-slate-400">Section 02 / Geography</h3>
                                            </div>
                                            <div className="space-y-10">
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
                                        </div>

                                        <div className="space-y-10">
                                            <div className="flex items-center gap-4">
                                                <div className="size-2 bg-primary rounded-full"></div>
                                                <h3 className="text-xs font-bold uppercase tracking-[0.3em] text-slate-400">Section 03 / Finance</h3>
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
                        ) : (
                            <div className="h-full bg-white/50 dark:bg-slate-900/50 backdrop-blur-3xl rounded-[40px] border border-white/40 dark:border-white/5 flex flex-col items-center justify-center text-center p-20">
                                <div className="size-20 bg-slate-100 dark:bg-slate-800 rounded-[32px] flex items-center justify-center text-primary mb-6 shadow-inner">
                                    <span className="material-icons-round text-4xl">{activeTab === 'users' ? 'badge' : 'groups'}</span>
                                </div>
                                <h2 className="text-xl font-bold mb-2">{activeTab === 'users' ? 'Staff Directory' : 'Guest Ledger'}</h2>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Feature initialization in progress</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default MyOffice;
