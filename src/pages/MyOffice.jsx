import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { COMMON, getLang } from '../utils/sharedLocales';
import { MY_OFFICE_LOCALES } from '../utils/myOfficeLocales';
import * as XLSX from 'xlsx';
import { downloadPdfDoc, downloadXlsxWorkbook, downloadCsvContent } from '../utils/fileDownloadHelper';

const MO = MY_OFFICE_LOCALES;
const tMO = (lang, key) => { const l = getLang(lang); return MO[l]?.[key] ?? MO.en[key] ?? COMMON[l]?.[key] ?? COMMON.en[key] ?? key; };
import { useNavigate, useSearchParams } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useAuth } from '../context/AuthContext';
import { useFavorites } from '../context/FavoritesContext';
import { agencyService } from '../services/agencyService';
import { locationService } from '../services/locationService';
import { userService, roleService } from '../services/userService';
import { guestService } from '../services/guestService';
import { currencyService } from '../services/currencyService';
import { favoriteService } from '../services/favoriteService';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import PhoneInput from '../components/PhoneInput';
import Pagination from '../components/Pagination';
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

const getCountryName = (countries, alphaTwoCode, lang = 'en') => {
    if (!alphaTwoCode) return '';
    const c = countries.find(x => x.alphaTwoCode === alphaTwoCode);
    if (!c) return alphaTwoCode;
    return c.name?.translations?.[lang] || c.name?.translations?.en || c.name?.defaultName || alphaTwoCode;
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
    downloadCsvContent(csvString, filename);
};

const formatDateTime = (dateVal) => {
    if (!dateVal) return 'N/A';
    try {
        let dateObj;
        if (Array.isArray(dateVal)) {
            const [y, m, d, hh = 0, mm = 0, ss = 0] = dateVal;
            dateObj = new Date(y, m - 1, d, hh, mm, ss);
        } else {
            dateObj = new Date(dateVal);
        }
        if (isNaN(dateObj.getTime())) return 'N/A';
        return dateObj.toLocaleString('tr-TR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch {
        return 'N/A';
    }
};

// Skeleton Loading Component matching Sales-Channel Table Row Heights
const TableSkeleton = ({ columns = 7, rows = 10 }) => (
    <>
        {[...Array(rows)].map((_, i) => (
            <tr key={`skel-row-${i}`} className="animate-pulse border-b border-solid border-slate-100 dark:border-slate-800/60 even:bg-slate-50/20 dark:even:bg-slate-900/20">
                {[...Array(columns)].map((_, j) => (
                    <td key={`skel-col-${j}`} className="px-4 py-3">
                        {j === 0 ? (
                            <div className="h-3.5 bg-slate-200 dark:bg-slate-800 rounded-md w-8"></div>
                        ) : j === 1 ? (
                            <div className="flex items-center gap-2.5">
                                <div className="size-7 rounded-lg bg-slate-200 dark:bg-slate-800 shrink-0"></div>
                                <div className="space-y-1.5 flex-1 min-w-0">
                                    <div className="h-3.5 bg-slate-200 dark:bg-slate-800 rounded-md w-3/4"></div>
                                </div>
                            </div>
                        ) : j === columns - 2 ? (
                            <div className="flex items-center gap-2">
                                <div className="h-5 w-9 rounded-full bg-slate-200 dark:bg-slate-800 shrink-0"></div>
                                <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded-md w-10"></div>
                            </div>
                        ) : j === columns - 1 ? (
                            <div className="flex items-center justify-end gap-1">
                                <div className="size-7 rounded-lg bg-slate-200/80 dark:bg-slate-800/80"></div>
                                <div className="size-7 rounded-lg bg-slate-200/80 dark:bg-slate-800/80"></div>
                            </div>
                        ) : (
                            <div className="h-3.5 bg-slate-200/80 dark:bg-slate-800/80 rounded-md w-28"></div>
                        )}
                    </td>
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
    const [searchParams] = useSearchParams();
    const { user, logout } = useAuth();
    const { favorites, isFavorite, addFavorite, removeFavorite, refreshFavorites } = useFavorites();
    const { i18n } = useTranslation();
    const [currentLang, setCurrentLang] = useState(() => (i18n.language || localStorage.getItem('i18nextLng') || 'en').split('-')[0].toLowerCase());
    useEffect(() => {
        setCurrentLang((i18n.language || 'en').split('-')[0].toLowerCase());
        const handler = (lng) => setCurrentLang((lng || 'en').split('-')[0].toLowerCase());
        i18n.on('languageChanged', handler);
        return () => i18n.off('languageChanged', handler);
    }, [i18n]);
    const L = (key) => tMO(currentLang, key);
    const initialTab = searchParams.get('tab') || 'general';
    const [activeTab, setActiveTab] = useState(initialTab);
    useEffect(() => {
        const param = searchParams.get('tab') || 'general';
        setActiveTab(param);
    }, [searchParams]);

    // Favorite Backend Table & Autocomplete State
    const [favoriteBackendItems, setFavoriteBackendItems] = useState([]);
    const [favoriteLoading, setFavoriteLoading] = useState(false);
    const [favoritePage, setFavoritePage] = useState(0);
    const [favoritePageSize, setFavoritePageSize] = useState(10);
    const [favoriteTotalPages, setFavoriteTotalPages] = useState(1);
    const [favoriteTotalElements, setFavoriteTotalElements] = useState(0);
    const [favoriteStatusFilter, setFavoriteStatusFilter] = useState('');
    const [favoriteSearchQuery, setFavoriteSearchQuery] = useState('');
    const [auditTooltip, setAuditTooltip] = useState(null);

    const [hotelAutocompleteQuery, setHotelAutocompleteQuery] = useState('');
    const [hotelAutocompleteResults, setHotelAutocompleteResults] = useState([]);
    const [hotelAutocompleteLoading, setHotelAutocompleteLoading] = useState(false);
    const [showHotelAutocompleteDropdown, setShowHotelAutocompleteDropdown] = useState(false);
    const hotelAutocompleteRef = useRef(null);

    const fetchFavoriteHotels = useCallback(async (page = 0, size = favoritePageSize) => {
        setFavoriteLoading(true);
        try {
            const res = await favoriteService.getFavorites(page, size, favoriteSearchQuery, favoriteStatusFilter);
            if (res && res.content) {
                setFavoriteBackendItems(res.content);
                setFavoritePage(res.pageNumber || 0);
                setFavoriteTotalPages(res.totalPages || 1);
                setFavoriteTotalElements(res.totalElements || 0);
            }
        } catch (e) {
            console.error('Failed to fetch favorite hotels from backend:', e);
        } finally {
            setFavoriteLoading(false);
        }
    }, [favoriteSearchQuery, favoriteStatusFilter, favoritePageSize]);

    useEffect(() => {
        if (activeTab === 'favorites') {
            fetchFavoriteHotels(0);
        }
    }, [activeTab, fetchFavoriteHotels]);

    useEffect(() => {
        if (!hotelAutocompleteQuery || hotelAutocompleteQuery.trim().length < 2) {
            setHotelAutocompleteResults([]);
            setShowHotelAutocompleteDropdown(false);
            return;
        }
        const timer = setTimeout(async () => {
            setHotelAutocompleteLoading(true);
            try {
                const results = await favoriteService.searchHotelsForAdd(hotelAutocompleteQuery);
                setHotelAutocompleteResults(results || []);
                setShowHotelAutocompleteDropdown(true);
            } catch (e) {
                console.error('Failed to search hotels for add:', e);
            } finally {
                setHotelAutocompleteLoading(false);
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [hotelAutocompleteQuery]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (hotelAutocompleteRef.current && !hotelAutocompleteRef.current.contains(event.target)) {
                setShowHotelAutocompleteDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredFavorites = React.useMemo(() => {
        if (!favoriteSearchQuery.trim()) return favorites;
        const q = favoriteSearchQuery.toLowerCase();
        return favorites.filter(item =>
            item.name?.toLowerCase().includes(q) ||
            item.city?.toLowerCase().includes(q) ||
            item.country?.toLowerCase().includes(q) ||
            item.supplier?.toLowerCase().includes(q) ||
            item.location?.toLowerCase().includes(q)
        );
    }, [favorites, favoriteSearchQuery]);

    const handleToggleFavoriteStatus = async (item) => {
        try {
            await favoriteService.toggleStatus(item.id);
            setToast({ show: true, message: 'Favori otel durumu güncellendi', type: 'success' });
            fetchFavoriteHotels(favoritePage);
            refreshFavorites();
        } catch (e) {
            console.error(e);
        }
    };

    const handleDeleteFavoriteItem = async (item) => {
        setConfirmModal({
            show: true,
            title: 'Favori Oteli Sil',
            message: `"${item.hotelName || 'Bu oteli'}" favorilerinizden silmek istediğinize emin misiniz?`,
            type: 'danger',
            onConfirm: async () => {
                try {
                    await favoriteService.deleteFavorite(item.id);
                    setToast({ show: true, message: 'Favori otel silindi', type: 'success' });
                    fetchFavoriteHotels(favoritePage);
                    refreshFavorites();
                } catch (e) {
                    setToast({ show: true, message: 'Silme işlemi başarısız', type: 'danger' });
                }
            }
        });
    };

    const handleAddHotelFromAutocomplete = async (hotel, e) => {
        if (e) e.stopPropagation();
        try {
            await favoriteService.addFavorite({
                hotelId: hotel.hotelId
            });
            addFavorite(hotel);
            setToast({ show: true, message: `"${hotel.hotelName || 'Otel'}" favorilere eklendi`, type: 'success' });
            fetchFavoriteHotels(0);
        } catch (e) {
            setToast({ show: true, message: 'Favori ekleme hatası', type: 'danger' });
        }
    };

    const [loading, setLoading] = useState(true);
    const [usersLoading, setUsersLoading] = useState(false);
    const [guestsLoading, setGuestsLoading] = useState(false);
    const [statsLoading, setStatsLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    const [isExportingUserExcel, setIsExportingUserExcel] = useState(false);
    const [isExportingUserPdf, setIsExportingUserPdf] = useState(false);
    const [isExportingGuestExcel, setIsExportingGuestExcel] = useState(false);
    const [isExportingGuestPdf, setIsExportingGuestPdf] = useState(false);
    const [isExportingFavExcel, setIsExportingFavExcel] = useState(false);
    const [isExportingFavPdf, setIsExportingFavPdf] = useState(false);

    const [mapCenter, setMapCenter] = useState([36.6826845, 30.9089719]);
    const [zoom, setZoom] = useState(13);
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

    // Confirm Modal State
    const [confirmModal, setConfirmModal] = useState({ show: false, title: '', message: '', onConfirm: null, type: 'danger' });

    // Logo state
    const [logoUrl, setLogoUrl] = useState(null);
    const [logoLoading, setLogoLoading] = useState(false);
    const [logoUploading, setLogoUploading] = useState(false);
    const logoInputRef = useRef(null);

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
    const [userApiError, setUserApiError] = useState(null);
    const [showPassword, setShowPassword] = useState(false);
    const [userFormData, setUserFormData] = useState({ name: '', surname: '', email: '', password: '', phoneCountryCode: '90', phoneNumber: '', status: 'ACTIVE', roleIds: [] });

    // Guest management state
    const [guests, setGuests] = useState([]);
    const [guestFilters, setGuestFilters] = useState({ query: '', status: 'ACTIVE', countryCodes: [] });
    const [isGuestModalOpen, setIsGuestModalOpen] = useState(false);
    const [editingGuest, setEditingGuest] = useState(null);
    const [guestApiError, setGuestApiError] = useState(null);
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
    const [guestCountrySearch, setGuestCountrySearch] = useState('');
    const [showGuestCountries, setShowGuestCountries] = useState(false);

    // Form data (General Info)
    const [formData, setFormData] = useState({
        id: null,
        name: '',
        officialTitle: '',
        agencyType: '', // Initialized to avoid controlled/uncontrolled warning
        defaultLanguage: 'EN',
        parentId: '', // Added missing initial state
        countryId: '',
        cityId: '',
        zipCode: '',
        address: '',
        latitude: 36.6826845,
        longitude: 30.9089719,
        phoneCountryCode: '',
        phoneNumber: '',
        email: '',
        website: '',
        taxOffice: '',
        taxNumber: '',
        agencyFinancialInfo: {
            title: '',
            taxOffice: '',
            taxNumber: '',
            email: '',
            phoneCountryCode: '',
            phoneNumber: '',
            countryId: '',
            cityId: '',
            address: ''
        },
        createDateTime: null,
        updateDateTime: null,
        createdBy: '',
        updatedBy: ''
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
            if (err.name === 'AbortError') return;
            console.error(err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
        // Fetch logo in background after main data
        fetchLogoData();
    };

    const fetchLogoData = async () => {
        setLogoLoading(true);
        try {
            const blob = await agencyService.getLogo();
            if (blob && blob.size > 0) {
                const url = URL.createObjectURL(blob);
                setLogoUrl(prev => {
                    if (prev) URL.revokeObjectURL(prev);
                    return url;
                });
            } else {
                setLogoUrl(null);
            }
        } catch (err) {
            if (err.name !== 'AbortError') setLogoUrl(null);
        } finally {
            setLogoLoading(false);
        }
    };

    const handleLogoFileSelect = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate format
        const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'];
        if (!allowedTypes.includes(file.type)) {
            showNotification(L('logoInvalidFormat'), 'error');
            e.target.value = '';
            return;
        }

        // Validate size (2MB)
        const MAX_SIZE = 2 * 1024 * 1024;
        if (file.size > MAX_SIZE) {
            showNotification(L('logoSizeExceeded'), 'error');
            e.target.value = '';
            return;
        }

        setLogoUploading(true);
        try {
            await agencyService.uploadLogo(file);
            // Refetch to show the new logo
            await fetchLogoData();
            showNotification(L('logoUploadSuccess'));
        } catch (err) {
            showNotification(err.message || L('logoUploadError'), 'error');
        } finally {
            setLogoUploading(false);
            e.target.value = '';
        }
    };

    const handleDeleteLogo = () => {
        setConfirmModal({
            show: true,
            title: L('deleteLogoTitle'),
            message: L('confirmDeleteLogo'),
            type: 'danger',
            onConfirm: async () => {
                try {
                    await agencyService.deleteLogo();
                    if (logoUrl) URL.revokeObjectURL(logoUrl);
                    setLogoUrl(null);
                    showNotification(L('logoDeleteSuccess'));
                } catch (err) {
                    showNotification(err.message || L('logoDeleteError'), 'error');
                }
            }
        });
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
            if (isManual) showNotification(L('usersRefreshed'));
        } catch (err) { console.error(err); } finally { setUsersLoading(false); }
    };

    const fetchGuestsData = async (isManual = false) => {
        try {
            setGuestsLoading(true);
            const response = await guestService.filterGuests(guestFilters);
            setGuests(response.guests || response.agencyCrmGuests || response.content || []);
            if (isManual) showNotification(L('guestsRefreshed'));
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
            showNotification(L('profileUpdated'));
            await fetchInitialData();
        } catch (err) {
            showNotification(err.message || L('updateFailed'), 'error');
        } finally {
            setSaving(false);
        }
    };

    const openAddUser = () => { setUserApiError(null); setShowPassword(false); setEditingUser(null); setUserFormData({ name: '', surname: '', email: '', password: '', phoneCountryCode: '90', phoneNumber: '', status: 'ACTIVE', roleIds: [] }); setIsUserModalOpen(true); };
    const openEditUser = (u) => { setUserApiError(null); setShowPassword(false); setEditingUser(u); setUserFormData({ name: u.name, surname: u.surname, email: u.email, phoneCountryCode: u.phoneCountryCode || '90', phoneNumber: u.phoneNumber || '', status: u.status || 'ACTIVE', roleIds: u.roles?.map(r => r.id) || [] }); setIsUserModalOpen(true); };

    const validatePassword = (p) => ({
        length: p.length >= 12 && p.length <= 16,
        uppercase: /[A-Z]/.test(p),
        lowercase: /[a-z]/.test(p),
        number: /[0-9]/.test(p),
        special: /[!@#$%^&*]/.test(p)
    });

    const handleUserSubmit = async (e) => {
        e.preventDefault();
        try {
            setSaving(true);
            setUserApiError(null);

            if (!editingUser) {
                const v = validatePassword(userFormData.password);
                if (!v.length || !v.uppercase || !v.lowercase || !v.number || !v.special) {
                    setUserApiError("Lütfen tüm şifre kurallarını karşılayın.");
                    setSaving(false);
                    return;
                }
            }

            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (userFormData.email && !emailRegex.test(userFormData.email)) {
                showNotification(L('invalidEmail'), 'error');
                setSaving(false);
                return;
            }
            if (editingUser) {
                await userService.updateUser(editingUser.id, userFormData);
                if (userFormData.roleIds.length > 0) await userService.assignRoles(editingUser.id, userFormData.roleIds);
                showNotification(L('userUpdated'));
            } else {
                const newUser = await userService.saveUser(userFormData);
                if (userFormData.roleIds.length > 0) await userService.assignRoles(newUser.id, userFormData.roleIds);
                showNotification(L('userCreated'));
            }
            setIsUserModalOpen(false); fetchUsersData();
            const sumData = await userService.getSummary(); setSummary(prev => ({ ...prev, totalCount: sumData.totalCount, activeCount: sumData.activeCount, passiveCount: sumData.passiveCount }));
        } catch (err) {
            const msg = err.response?.data?.message || err.message || L('errorSavingUser');
            setUserApiError(msg);
            showNotification(msg, 'error');
        } finally { setSaving(false); }
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
                    showNotification(L('userDeleted'));
                    fetchUsersData();
                    const sumData = await userService.getSummary();
                    setSummary(prev => ({ ...prev, totalCount: sumData.totalCount, activeCount: sumData.activeCount, passiveCount: sumData.passiveCount }));
                } catch (err) { showNotification(err.message || L('errorDeletingUser'), 'error'); }
            }
        );
    };

    const handleToggleUserStatus = async (u) => {
        const newStatus = u.status === 'ACTIVE' ? 'PASSIVE' : 'ACTIVE';
        try {
            const payload = {
                name: u.name,
                surname: u.surname,
                email: u.email,
                phoneCountryCode: u.phoneCountryCode || '90',
                phoneNumber: u.phoneNumber || '',
                status: newStatus,
                roleIds: u.roles?.map(r => r.id) || []
            };
            await userService.updateUser(u.id, payload);
            showNotification(L('userUpdated'));
            fetchUsersData();
            const sumData = await userService.getSummary();
            setSummary(prev => ({ ...prev, totalCount: sumData.totalCount, activeCount: sumData.activeCount, passiveCount: sumData.passiveCount }));
        } catch (err) {
            showNotification(err.message || L('updateFailed'), 'error');
        }
    };

    const handleToggleGuestStatus = async (g) => {
        const newStatus = g.status === 'ACTIVE' ? 'PASSIVE' : 'ACTIVE';
        try {
            const payload = {
                gender: g.gender || 'MALE',
                firstName: g.firstName,
                lastName: g.lastName,
                birthDate: g.birthDate,
                country: g.country,
                passportNo: g.passportNo,
                passportExpiry: g.passportExpiry,
                email: g.email,
                phoneCountryCode: g.phoneCountryCode || '90',
                phoneNumber: g.phoneNumber || '',
                status: newStatus
            };
            await guestService.updateGuest(g.id, payload);
            showNotification(L('guestUpdated'));
            fetchGuestsData();
            const sumData = await guestService.getSummary();
            setSummary(prev => ({ ...prev, totalGuestCount: sumData.totalCount, activeGuestCount: sumData.activeCount, passiveGuestCount: sumData.passiveCount }));
        } catch (err) {
            showNotification(err.message || L('updateFailed'), 'error');
        }
    };

    const handleGuestSubmit = async (e) => {
        e.preventDefault();
        try {
            setSaving(true);
            setGuestApiError(null);

            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (guestFormData.email && !emailRegex.test(guestFormData.email)) {
                showNotification(L('invalidEmail'), 'error');
                setSaving(false);
                return;
            }

            if (editingGuest) {
                await guestService.updateGuest(editingGuest.id, guestFormData);
                showNotification(L('guestUpdated'));
            } else {
                await guestService.saveGuest(guestFormData);
                showNotification(L('guestCreated'));
            }
            setIsGuestModalOpen(false);
            fetchGuestsData();
            const sumData = await guestService.getSummary();
            setSummary(prev => ({ ...prev, totalGuestCount: sumData.totalCount, activeGuestCount: sumData.activeCount, passiveGuestCount: sumData.passiveCount }));
        } catch (err) {
            const msg = err.response?.data?.message || err.message || L('errorSavingGuest');
            setGuestApiError(msg);
            showNotification(msg, 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteGuest = (id) => {
        requestConfirmation(
            L('deleteGuest') || 'Delete Guest',
            L('deleteGuestMsg') || 'Are you sure you want to remove this guest from your CRM?',
            async () => {
                try {
                    await guestService.deleteGuest(id);
                    showNotification(L('guestDeleted'));
                    fetchGuestsData();
                    const sumData = await guestService.getSummary();
                    setSummary(prev => ({ ...prev, totalGuestCount: sumData.totalCount, activeGuestCount: sumData.activeCount, passiveGuestCount: sumData.passiveCount }));
                } catch (err) { showNotification(err.message || L('errorDeletingGuest'), 'error'); }
            }
        );
    };

    const openAddGuest = () => { setGuestApiError(null); setEditingGuest(null); setGuestFormData({ gender: 'MALE', firstName: '', lastName: '', birthDate: '', country: '', passportNo: '', passportExpiry: '', email: '', phoneCountryCode: '90', phoneNumber: '', status: 'ACTIVE' }); setIsGuestModalOpen(true); };
    const openEditGuest = (g) => { setGuestApiError(null); setEditingGuest(g); setGuestFormData({ gender: g.gender || 'MALE', firstName: g.firstName, lastName: g.lastName, birthDate: g.birthDate, country: g.country, passportNo: g.passportNo, passportExpiry: g.passportExpiry, email: g.email, phoneCountryCode: g.phoneCountryCode || '90', phoneNumber: g.phoneNumber || '', status: g.status || 'ACTIVE' }); setIsGuestModalOpen(true); };

    const fetchAllFilteredUsers = async () => {
        try {
            const response = await userService.filterUsers(userFilters, 0, 10000);
            return response.agencyUsers || response.content || [];
        } catch (e) {
            console.error("Failed to fetch all users for export", e);
            return users;
        }
    };

    const handleExportUsersExcel = async () => {
        if (isExportingUserExcel || isExportingUserPdf) return;
        setIsExportingUserExcel(true);
        try {
            const allUsers = await fetchAllFilteredUsers();
            if (!allUsers || allUsers.length === 0) {
                showNotification(L('noUserExport'), 'error');
                return;
            }

            const exportData = allUsers.map(u => ({
                'ID': u.id ?? '',
                [L('colUser') || 'User']: `${u.name || ''} ${u.surname || ''}`.trim(),
                'Email': u.email || '-',
                'Phone': u.phoneNumber ? `+${u.phoneCountryCode || ''}${u.phoneNumber}` : '-',
                [L('colRole') || 'Role']: (u.roles || []).map(r => r.roleName || r.name).join(' | ') || 'No Role',
                [L('colStatus') || 'Status']: u.status === 'ACTIVE' ? L('active') : L('passive')
            }));

            const worksheet = XLSX.utils.json_to_sheet(exportData);
            worksheet['!cols'] = [
                { wch: 8 },
                { wch: 24 },
                { wch: 30 },
                { wch: 18 },
                { wch: 25 },
                { wch: 12 }
            ];

            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Users');

            const dateStr = new Date().toISOString().split('T')[0];
            downloadXlsxWorkbook(XLSX, workbook, `Users_Report_${dateStr}.xlsx`);
            showNotification(L('usersExported'));
        } catch (err) {
            console.error('Users Excel Export Error:', err);
            showNotification('Failed to export Excel: ' + (err.message || err), 'error');
        } finally {
            setIsExportingUserExcel(false);
        }
    };

    const handleExportUsersPdf = async () => {
        if (isExportingUserExcel || isExportingUserPdf) return;
        setIsExportingUserPdf(true);
        try {
            const allUsers = await fetchAllFilteredUsers();
            if (!allUsers || allUsers.length === 0) {
                showNotification(L('noUserExport'), 'error');
                return;
            }

            const { jsPDF } = await import('jspdf');
            const autoTable = (await import('jspdf-autotable')).default;

            const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text('Travel of Globe - Users Report', 10, 12);

            doc.setFontSize(8);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(100);
            doc.text(`Generated: ${new Date().toLocaleString()}  |  Total Matching Users: ${allUsers.length}`, 10, 17);

            const headers = ['ID', L('colUser') || 'User', 'Email', 'Phone', L('colRole') || 'Role', L('colStatus') || 'Status'];
            const rows = allUsers.map(u => [
                u.id ?? '',
                `${u.name || ''} ${u.surname || ''}`.trim(),
                u.email || '-',
                u.phoneNumber ? `+${u.phoneCountryCode || ''}${u.phoneNumber}` : '-',
                (u.roles || []).map(r => r.roleName || r.name).join(' | ') || 'No Role',
                u.status === 'ACTIVE' ? L('active') : L('passive')
            ]);

            autoTable(doc, {
                startY: 21,
                head: [headers],
                body: rows,
                theme: 'striped',
                styles: { fontSize: 8, cellPadding: 2 },
                headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold' }
            });

            const dateStr = new Date().toISOString().split('T')[0];
            downloadPdfDoc(doc, `Users_Report_${dateStr}.pdf`);
            showNotification(L('usersExported'));
        } catch (err) {
            console.error('Users PDF Export Error:', err);
            showNotification('Failed to export PDF: ' + (err.message || err), 'error');
        } finally {
            setIsExportingUserPdf(false);
        }
    };

    const fetchAllFilteredGuests = async () => {
        try {
            const response = await guestService.filterGuests(guestFilters, 0, 10000);
            return response.agencyGuests || response.content || [];
        } catch (e) {
            console.error("Failed to fetch all guests for export", e);
            return guests;
        }
    };

    const handleExportGuestsExcel = async () => {
        if (isExportingGuestExcel || isExportingGuestPdf) return;
        setIsExportingGuestExcel(true);
        try {
            const allGuests = await fetchAllFilteredGuests();
            if (!allGuests || allGuests.length === 0) {
                showNotification(L('noGuestExport'), 'error');
                return;
            }

            const exportData = allGuests.map(g => ({
                'ID': g.id ?? '',
                [L('colGuest') || 'Guest']: `${g.gender === 'MALE' ? 'Mr' : 'Mrs'} ${g.firstName || ''} ${g.lastName || ''}`.trim(),
                [L('birthDate') || 'Birth Date']: g.birthDate || '-',
                [L('country') || 'Country']: getCountryName(countries, g.country, currentLang) || g.country || '-',
                [L('passportNo') || 'Passport No']: g.passportNo || '-',
                [L('passportExpiry') || 'Passport Expiry']: g.passportExpiry || '-',
                'Email': g.email || '-',
                'Phone': g.phoneNumber ? `+${g.phoneCountryCode || ''}${g.phoneNumber}` : '-',
                [L('colStatus') || 'Status']: g.status === 'ACTIVE' ? L('active') : L('passive')
            }));

            const worksheet = XLSX.utils.json_to_sheet(exportData);
            worksheet['!cols'] = [
                { wch: 8 },
                { wch: 24 },
                { wch: 14 },
                { wch: 18 },
                { wch: 16 },
                { wch: 16 },
                { wch: 28 },
                { wch: 18 },
                { wch: 12 }
            ];

            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Guests');

            const dateStr = new Date().toISOString().split('T')[0];
            downloadXlsxWorkbook(XLSX, workbook, `Guests_Report_${dateStr}.xlsx`);
            showNotification(L('guestsExported'));
        } catch (err) {
            console.error('Guests Excel Export Error:', err);
            showNotification('Failed to export Excel: ' + (err.message || err), 'error');
        } finally {
            setIsExportingGuestExcel(false);
        }
    };

    const handleExportGuestsPdf = async () => {
        if (isExportingGuestExcel || isExportingGuestPdf) return;
        setIsExportingGuestPdf(true);
        try {
            const allGuests = await fetchAllFilteredGuests();
            if (!allGuests || allGuests.length === 0) {
                showNotification(L('noGuestExport'), 'error');
                return;
            }

            const { jsPDF } = await import('jspdf');
            const autoTable = (await import('jspdf-autotable')).default;

            const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text('Travel of Globe - Guests Report', 10, 12);

            doc.setFontSize(8);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(100);
            doc.text(`Generated: ${new Date().toLocaleString()}  |  Total Matching Guests: ${allGuests.length}`, 10, 17);

            const headers = ['ID', L('colGuest') || 'Guest', 'Birth Date', 'Country', 'Passport No', 'Expires', 'Email', 'Phone', L('colStatus') || 'Status'];
            const rows = allGuests.map(g => [
                g.id ?? '',
                `${g.gender === 'MALE' ? 'Mr' : 'Mrs'} ${g.firstName || ''} ${g.lastName || ''}`.trim(),
                g.birthDate || '-',
                getCountryName(countries, g.country, currentLang) || g.country || '-',
                g.passportNo || '-',
                g.passportExpiry || '-',
                g.email || '-',
                g.phoneNumber ? `+${g.phoneCountryCode || ''}${g.phoneNumber}` : '-',
                g.status === 'ACTIVE' ? L('active') : L('passive')
            ]);

            autoTable(doc, {
                startY: 21,
                head: [headers],
                body: rows,
                theme: 'striped',
                styles: { fontSize: 7.5, cellPadding: 2 },
                headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold' }
            });

            const dateStr = new Date().toISOString().split('T')[0];
            downloadPdfDoc(doc, `Guests_Report_${dateStr}.pdf`);
            showNotification(L('guestsExported'));
        } catch (err) {
            console.error('Guests PDF Export Error:', err);
            showNotification('Failed to export PDF: ' + (err.message || err), 'error');
        } finally {
            setIsExportingGuestPdf(false);
        }
    };

    const fetchAllFilteredFavorites = async () => {
        try {
            const response = await favoriteService.getFavorites(0, 10000, favoriteSearchQuery, favoriteStatusFilter);
            return response.content || response.favoriteHotels || response.items || [];
        } catch (e) {
            console.error("Failed to fetch all favorites for export", e);
            return favoriteBackendItems;
        }
    };

    const handleExportFavoritesExcel = async () => {
        if (isExportingFavExcel || isExportingFavPdf) return;
        setIsExportingFavExcel(true);
        try {
            const allFavs = await fetchAllFilteredFavorites();
            if (!allFavs || allFavs.length === 0) {
                showNotification(L('noFavoritesFound') || 'No favorite hotels to export.', 'error');
                return;
            }

            const exportData = allFavs.map(f => ({
                'Hotel ID': f.hotelId ?? '',
                [L('hotelName') || 'Hotel Name']: f.hotelName || '-',
                [L('locationLabel') || 'City']: f.cityName || '-',
                [L('starsLabel') || 'Stars']: f.stars ?? '-',
                [L('colStatus') || 'Status']: f.status === 'ACTIVE' ? L('active') : L('passive'),
                [L('created') || 'Created By']: f.createdBy || '-',
                [L('addedOn') || 'Created Date']: f.createdDate ? new Date(f.createdDate).toLocaleString() : '-'
            }));

            const worksheet = XLSX.utils.json_to_sheet(exportData);
            worksheet['!cols'] = [
                { wch: 12 },
                { wch: 32 },
                { wch: 20 },
                { wch: 10 },
                { wch: 12 },
                { wch: 24 },
                { wch: 20 }
            ];

            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Favorites');

            const dateStr = new Date().toISOString().split('T')[0];
            downloadXlsxWorkbook(XLSX, workbook, `Favorite_Hotels_Report_${dateStr}.xlsx`);
            showNotification(L('favoritesExported') || 'Favorite hotels exported successfully.');
        } catch (err) {
            console.error('Favorites Excel Export Error:', err);
            showNotification('Failed to export Excel: ' + (err.message || err), 'error');
        } finally {
            setIsExportingFavExcel(false);
        }
    };

    const handleExportFavoritesPdf = async () => {
        if (isExportingFavExcel || isExportingFavPdf) return;
        setIsExportingFavPdf(true);
        try {
            const allFavs = await fetchAllFilteredFavorites();
            if (!allFavs || allFavs.length === 0) {
                showNotification(L('noFavoritesFound') || 'No favorite hotels to export.', 'error');
                return;
            }

            const { jsPDF } = await import('jspdf');
            const autoTable = (await import('jspdf-autotable')).default;

            const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text('Travel of Globe - Favorite Hotels Report', 10, 12);

            doc.setFontSize(8);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(100);
            doc.text(`Generated: ${new Date().toLocaleString()}  |  Total Favorite Hotels: ${allFavs.length}`, 10, 17);

            const headers = ['Hotel ID', L('hotelName') || 'Hotel Name', L('locationLabel') || 'City', L('starsLabel') || 'Stars', L('colStatus') || 'Status', L('created') || 'Created By', L('addedOn') || 'Created Date'];
            const rows = allFavs.map(f => [
                f.hotelId ?? '',
                f.hotelName || '-',
                f.cityName || '-',
                f.stars ? `${f.stars} ★` : '-',
                f.status === 'ACTIVE' ? L('active') : L('passive'),
                f.createdBy || '-',
                f.createdDate ? new Date(f.createdDate).toLocaleString() : '-'
            ]);

            autoTable(doc, {
                startY: 21,
                head: [headers],
                body: rows,
                theme: 'striped',
                styles: { fontSize: 8, cellPadding: 2 },
                headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold' }
            });

            const dateStr = new Date().toISOString().split('T')[0];
            downloadPdfDoc(doc, `Favorite_Hotels_Report_${dateStr}.pdf`);
            showNotification(L('favoritesExported') || 'Favorite hotels exported successfully.');
        } catch (err) {
            console.error('Favorites PDF Export Error:', err);
            showNotification('Failed to export PDF: ' + (err.message || err), 'error');
        } finally {
            setIsExportingFavPdf(false);
        }
    };

    const openInMaps = () => { const addressStr = `${formData.address} ${formData.zipCode}`; const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addressStr)}`; window.open(url, '_blank'); };

    if (loading) { return <div className="flex h-screen items-center justify-center bg-[#f8fafc] dark:bg-[#0f172a]"><div className="size-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>; }

    return (
        <>
            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 5px; height: 5px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #dadce0; border-radius: 9999px; }
                .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: #5f6368; }
                .modal-overlay { background: rgba(32, 33, 36, 0.6); backdrop-filter: blur(4px); }
            `}</style>

            {toast.show && (
                <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[10000] animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="px-4 py-2.5 bg-[#202124] dark:bg-[#e8eaed] text-white dark:text-[#202124] shadow-lg rounded-full flex items-center gap-2.5 border border-[#3c4043] dark:border-transparent">
                        <div className={`size-2 rounded-full ${toast.type === 'success' ? 'bg-[#34a853]' : 'bg-[#ea4335]'} animate-pulse`}></div>
                        <p className="text-xs font-medium tracking-normal">{toast.message}</p>
                    </div>
                </div>
            )}

            <main className="flex-1 p-4 md:p-6 flex flex-col min-h-0 bg-[#f8f9fa] dark:bg-[#202124]">
                <div className="max-w-7xl mx-auto w-full flex flex-col h-full min-h-0">
                    <header className="flex flex-col sm:flex-row sm:items-center justify-between mb-5 gap-4 shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-[#e8f0fe] dark:bg-[#1a73e8]/20 flex items-center justify-center text-[#1a73e8] dark:text-[#8ab4f8] shrink-0">
                                <span className="material-symbols-outlined text-[24px]">corporate_fare</span>
                            </div>
                            <div>
                                <h1 className="text-xl font-medium text-[#202124] dark:text-[#e8eaed] tracking-tight">{L('title')}</h1>
                                <p className="text-xs text-[#5f6368] dark:text-[#9aa0a6]">
                                    {activeTab === 'general' ? L('tabGeneral') : activeTab === 'users' ? L('tabUsers') : activeTab === 'guests' ? L('tabGuests') : L('tabFavorites')}
                                </p>
                            </div>
                        </div>

                        {/* Google Material Workspace Tabs */}
                        <div className="flex items-center gap-1 p-1 bg-white dark:bg-[#303134] rounded-full border border-[#dadce0] dark:border-[#5f6368] shadow-xs overflow-x-auto">
                            {[
                                { id: 'general', icon: 'info', label: L('tabGeneral') },
                                { id: 'users', icon: 'groups', label: L('tabUsers') },
                                { id: 'guests', icon: 'recent_actors', label: L('tabGuests') },
                                { id: 'favorites', icon: 'bookmark', label: L('tabFavorites') },
                            ].map((tab) => {
                                const isCurrent = activeTab === tab.id;
                                return (
                                    <button
                                        key={tab.id}
                                        type="button"
                                        onClick={() => {
                                            setActiveTab(tab.id);
                                            setSearchParams({ tab: tab.id });
                                        }}
                                        className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${isCurrent
                                                ? 'bg-[#e8f0fe] text-[#1a73e8] font-semibold dark:bg-[#1a73e8]/25 dark:text-[#8ab4f8]'
                                                : 'text-[#5f6368] dark:text-[#bdc1c6] hover:bg-[#f1f3f4] dark:hover:bg-[#3c4043]'
                                            }`}
                                    >
                                        <span className={`material-symbols-outlined text-[18px] ${isCurrent ? 'text-[#1a73e8] dark:text-[#8ab4f8]' : 'text-[#5f6368] dark:text-[#9aa0a6]'}`}>{tab.icon}</span>
                                        <span>{tab.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </header>

                    <div className="flex-1 min-h-0 h-full overflow-hidden">
                        {activeTab === 'general' ? (
                            <div className="h-full flex flex-col lg:flex-row gap-5 overflow-hidden pb-2">
                                {/* Left Sidebar Info */}
                                <div className="w-full lg:w-[320px] flex flex-col gap-4 overflow-y-auto custom-scrollbar pr-1 flex-shrink-0">
                                    {/* Agency Identity Card */}
                                    <div className="bg-white dark:bg-[#303134] border border-[#dadce0] dark:border-[#3c4043] rounded-2xl p-5 shadow-xs relative overflow-hidden flex-shrink-0">
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="px-3 py-1 rounded-full text-[11px] font-medium tracking-wide bg-[#e8f0fe] text-[#1a73e8] dark:bg-[#1a73e8]/20 dark:text-[#8ab4f8]">
                                                {formData.agencyType || 'AGENCY'}
                                            </span>
                                            <div className="size-8 rounded-full bg-[#f1f3f4] dark:bg-[#202124] text-[#5f6368] dark:text-[#9aa0a6] flex items-center justify-center">
                                                <span className="material-symbols-outlined text-[18px]">domain</span>
                                            </div>
                                        </div>
                                        <div className="mb-3">
                                            <p className="text-[11px] font-medium text-[#5f6368] dark:text-[#9aa0a6] uppercase tracking-wider mb-1">{L('agencyName')}</p>
                                            <h2 className="text-base font-medium truncate text-[#202124] dark:text-[#e8eaed]">{formData.name || 'Your Agency'}</h2>
                                            {formData.officialTitle && (
                                                <p className="text-xs text-[#5f6368] dark:text-[#9aa0a6] truncate mt-0.5">{formData.officialTitle}</p>
                                            )}
                                        </div>
                                        <div className="space-y-2.5 pt-3 border-t border-[#f1f3f4] dark:border-[#3c4043] text-xs">
                                            <div className="flex justify-between items-center">
                                                <span className="text-[#5f6368] dark:text-[#9aa0a6] text-xs">{L('baseLocation')}:</span>
                                                <span className="font-medium text-[#202124] dark:text-[#e8eaed] truncate max-w-[150px] text-right">{formData.cityName}, {formData.countryName}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-[#5f6368] dark:text-[#9aa0a6] text-xs">{L('currency')}:</span>
                                                <span className="font-medium text-[#1a73e8] dark:text-[#8ab4f8] bg-[#e8f0fe] dark:bg-[#1a73e8]/20 px-2.5 py-0.5 rounded-full text-[11px]">{formData.currency}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Audit & Timeline Card */}
                                    <div className="bg-white dark:bg-[#303134] border border-[#dadce0] dark:border-[#3c4043] rounded-2xl p-4 shadow-xs flex-shrink-0">
                                        <div className="flex items-center gap-2 mb-3">
                                            <div className="size-7 bg-[#f1f3f4] dark:bg-[#202124] rounded-full flex items-center justify-center text-[#5f6368] dark:text-[#9aa0a6]">
                                                <span className="material-symbols-outlined text-[16px]">history</span>
                                            </div>
                                            <h3 className="text-xs font-semibold text-[#202124] dark:text-[#e8eaed] uppercase tracking-wider">{L('auditTimeline')}</h3>
                                        </div>
                                        <div className="space-y-3 text-xs">
                                            <div className="flex items-start gap-2.5">
                                                <div className="size-2 bg-[#1a73e8] rounded-full mt-1 shrink-0"></div>
                                                <div>
                                                    <p className="text-[10px] font-medium text-[#5f6368] dark:text-[#9aa0a6] uppercase">{L('created')}</p>
                                                    <p className="text-xs font-medium text-[#202124] dark:text-[#e8eaed]">{new Date(formData.createDateTime).toLocaleString(localStorage.getItem('language') || 'tr')}</p>
                                                    <p className="text-[10px] text-[#5f6368] dark:text-[#9aa0a6] italic">by {formData.createdBy}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-start gap-2.5">
                                                <div className="size-2 bg-[#137333] rounded-full mt-1 shrink-0"></div>
                                                <div>
                                                    <p className="text-[10px] font-medium text-[#5f6368] dark:text-[#9aa0a6] uppercase">{L('lastUpdate')}</p>
                                                    <p className="text-xs font-medium text-[#202124] dark:text-[#e8eaed]">{new Date(formData.updateDateTime).toLocaleString(localStorage.getItem('language') || 'tr')}</p>
                                                    <p className="text-[10px] text-[#5f6368] dark:text-[#9aa0a6] italic">by {formData.updatedBy}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Map Preview */}
                                    <div className="h-[185px] relative group rounded-2xl border border-[#dadce0] dark:border-[#3c4043] overflow-hidden shadow-xs flex-shrink-0 bg-white dark:bg-[#303134]">
                                        <MapContainer center={mapCenter} zoom={zoom} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}>
                                            <ChangeView center={mapCenter} zoom={zoom} />
                                            <TileLayer attribution='&copy; CARTO' url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
                                            <LocationMarker position={[formData.latitude, formData.longitude]} setPosition={setMapLocation} />
                                        </MapContainer>
                                        <div className="absolute bottom-3 right-3 z-[1000] opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={openInMaps} className="h-8 px-3 bg-white dark:bg-[#202124] rounded-full shadow-md border border-[#dadce0] dark:border-[#5f6368] flex items-center gap-1.5 text-xs font-medium text-[#1a73e8] dark:text-[#8ab4f8] hover:bg-[#f8fafd] dark:hover:bg-[#303134] active:scale-95 transition-all cursor-pointer">
                                                <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                                                <span>Google Maps</span>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Agency Logo Card */}
                                    <div className="bg-white dark:bg-[#303134] border border-[#dadce0] dark:border-[#3c4043] rounded-2xl overflow-hidden shadow-xs flex-shrink-0 p-4">
                                        {/* Header */}
                                        <div className="flex items-center justify-between pb-3 border-b border-[#f1f3f4] dark:border-[#3c4043]">
                                            <div className="flex items-center gap-2">
                                                <div className="size-7 bg-[#e8f0fe] dark:bg-[#1a73e8]/20 rounded-full flex items-center justify-center text-[#1a73e8] dark:text-[#8ab4f8]">
                                                    <span className="material-symbols-outlined text-[16px]">image</span>
                                                </div>
                                                <h3 className="text-xs font-semibold text-[#202124] dark:text-[#e8eaed] uppercase tracking-wider">{L('agencyLogo')}</h3>
                                            </div>
                                            {logoUrl && !logoLoading && (
                                                <div className="flex items-center gap-1">
                                                    <button
                                                        type="button"
                                                        onClick={() => logoInputRef.current?.click()}
                                                        disabled={logoUploading}
                                                        title={L('changeLogo')}
                                                        className="size-7 rounded-full flex items-center justify-center text-[#5f6368] hover:bg-[#f1f3f4] dark:hover:bg-[#3c4043] dark:text-[#9aa0a6] transition-colors disabled:opacity-50 cursor-pointer"
                                                    >
                                                        <span className="material-symbols-outlined text-[18px]">edit</span>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={handleDeleteLogo}
                                                        disabled={logoUploading}
                                                        title={L('deleteLogo')}
                                                        className="size-7 rounded-full flex items-center justify-center text-[#5f6368] hover:bg-[#fce8e6] hover:text-[#d93025] dark:hover:bg-[#c5221f]/20 transition-colors disabled:opacity-50 cursor-pointer"
                                                    >
                                                        <span className="material-symbols-outlined text-[18px]">delete</span>
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        {/* Logo display / upload area */}
                                        <div className="pt-3">
                                            <input
                                                ref={logoInputRef}
                                                type="file"
                                                accept="image/png,image/jpeg,image/jpg,image/svg+xml"
                                                className="hidden"
                                                onChange={handleLogoFileSelect}
                                            />

                                            {logoLoading ? (
                                                <div className="w-full h-[100px] rounded-xl bg-[#f8f9fa] dark:bg-[#202124] flex items-center justify-center">
                                                    <div className="flex flex-col items-center gap-2">
                                                        <div className="w-5 h-5 border-2 border-[#1a73e8] border-t-transparent rounded-full animate-spin"></div>
                                                        <span className="text-[10px] text-[#5f6368] font-medium">{L('processing')}</span>
                                                    </div>
                                                </div>
                                            ) : logoUrl ? (
                                                <div className="relative w-full h-[100px] rounded-xl overflow-hidden bg-[#f8f9fa] dark:bg-[#202124] border border-[#dadce0] dark:border-[#3c4043] flex items-center justify-center group p-2">
                                                    <img
                                                        src={logoUrl}
                                                        alt={L('agencyLogo')}
                                                        className="max-w-full max-h-full object-contain"
                                                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                                    />
                                                    {logoUploading && (
                                                        <div className="absolute inset-0 bg-white/80 dark:bg-[#202124]/80 flex items-center justify-center rounded-xl">
                                                            <div className="flex flex-col items-center gap-2">
                                                                <div className="w-5 h-5 border-2 border-[#1a73e8] border-t-transparent rounded-full animate-spin"></div>
                                                                <span className="text-[10px] text-[#5f6368] font-medium">{L('processing')}</span>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={() => logoInputRef.current?.click()}
                                                    disabled={logoUploading}
                                                    className="w-full h-[100px] rounded-xl border border-dashed border-[#dadce0] dark:border-[#5f6368] hover:border-[#1a73e8] dark:hover:border-[#8ab4f8] bg-[#f8f9fa] dark:bg-[#202124] hover:bg-[#f8fafd] dark:hover:bg-[#1a73e8]/10 transition-colors flex flex-col items-center justify-center gap-1.5 group disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                                                >
                                                    {logoUploading ? (
                                                        <>
                                                            <div className="w-5 h-5 border-2 border-[#1a73e8] border-t-transparent rounded-full animate-spin"></div>
                                                            <span className="text-[10px] font-medium text-[#5f6368]">{L('processing')}</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <div className="size-8 rounded-full bg-white dark:bg-[#303134] text-[#5f6368] group-hover:text-[#1a73e8] group-hover:bg-[#e8f0fe] dark:group-hover:bg-[#1a73e8]/20 flex items-center justify-center transition-colors border border-[#dadce0] dark:border-[#3c4043]">
                                                                <span className="material-symbols-outlined text-[20px]">add_photo_alternate</span>
                                                            </div>
                                                            <div className="text-center">
                                                                <p className="text-[11px] font-medium text-[#202124] dark:text-[#e8eaed] group-hover:text-[#1a73e8] dark:group-hover:text-[#8ab4f8] transition-colors leading-tight">{L('agencyLogoPlaceholder')}</p>
                                                                <p className="text-[10px] text-[#5f6368] dark:text-[#9aa0a6] mt-0.5">{L('clickToUpload')}</p>
                                                            </div>
                                                        </>
                                                    )}
                                                </button>
                                            )}

                                            {/* Requirements info */}
                                            <div className="mt-3 space-y-1.5 pt-2 border-t border-[#f1f3f4] dark:border-[#3c4043]">
                                                <p className="text-[10px] font-medium text-[#5f6368] dark:text-[#9aa0a6] uppercase tracking-wider">{L('logoRequirementsTitle')}</p>
                                                <div className="flex items-center gap-1.5 text-[#5f6368] dark:text-[#9aa0a6]">
                                                    <span className="material-symbols-outlined text-[13px]">aspect_ratio</span>
                                                    <span className="text-[10px]">{L('logoMaxRatioInfo')}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5 text-[#5f6368] dark:text-[#9aa0a6]">
                                                    <span className="material-symbols-outlined text-[13px]">storage</span>
                                                    <span className="text-[10px]">{L('logoMaxSizeInfo')}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5 text-[#5f6368] dark:text-[#9aa0a6]">
                                                    <span className="material-symbols-outlined text-[13px]">image</span>
                                                    <span className="text-[10px]">{L('logoFormatsInfo')}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Structured Information Grid */}
                                <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-6">
                                        {/* Section 01: Agency Identity */}
                                        <div className="bg-white dark:bg-[#303134] rounded-2xl border border-[#dadce0] dark:border-[#3c4043] p-5 shadow-xs transition-shadow hover:shadow-sm">
                                            <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-[#f1f3f4] dark:border-[#3c4043]">
                                                <div className="size-7 rounded-full bg-[#e8f0fe] dark:bg-[#1a73e8]/20 text-[#1a73e8] dark:text-[#8ab4f8] flex items-center justify-center shrink-0">
                                                    <span className="material-symbols-outlined text-[18px]">badge</span>
                                                </div>
                                                <h3 className="text-xs font-semibold uppercase tracking-wider text-[#202124] dark:text-[#e8eaed]">{L('sec01')}</h3>
                                            </div>
                                            <div className="space-y-3">
                                                <div>
                                                    <label className="text-[11px] font-medium text-[#5f6368] dark:text-[#9aa0a6] uppercase tracking-wider block mb-1">{L('agencyName')}</label>
                                                    <p className="text-xs font-medium text-[#202124] dark:text-[#e8eaed] bg-[#f8f9fa] dark:bg-[#202124] rounded-xl px-3.5 py-2.5 border border-[#dadce0] dark:border-[#3c4043]">{formData.name || '-'}</p>
                                                </div>
                                                <div>
                                                    <label className="text-[11px] font-medium text-[#5f6368] dark:text-[#9aa0a6] uppercase tracking-wider block mb-1">{L('officialTitle')}</label>
                                                    <p className="text-xs font-medium text-[#202124] dark:text-[#e8eaed] bg-[#f8f9fa] dark:bg-[#202124] rounded-xl px-3.5 py-2.5 border border-[#dadce0] dark:border-[#3c4043]">{formData.officialTitle || '-'}</p>
                                                </div>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div>
                                                        <label className="text-[11px] font-medium text-[#5f6368] dark:text-[#9aa0a6] uppercase tracking-wider block mb-1">{L('type')}</label>
                                                        <p className="text-xs font-medium text-[#202124] dark:text-[#e8eaed] bg-[#f8f9fa] dark:bg-[#202124] rounded-xl px-3.5 py-2.5 border border-[#dadce0] dark:border-[#3c4043]">{formData.agencyType || '-'}</p>
                                                    </div>
                                                    <div>
                                                        <label className="text-[11px] font-medium text-[#5f6368] dark:text-[#9aa0a6] uppercase tracking-wider block mb-1">{L('language')}</label>
                                                        <p className="text-xs font-medium text-[#202124] dark:text-[#e8eaed] bg-[#f8f9fa] dark:bg-[#202124] rounded-xl px-3.5 py-2.5 border border-[#dadce0] dark:border-[#3c4043]">{formData.defaultLanguage === 'TR' ? 'Turkish' : 'English'}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Section 02: Contact Details */}
                                        <div className="bg-white dark:bg-[#303134] rounded-2xl border border-[#dadce0] dark:border-[#3c4043] p-5 shadow-xs transition-shadow hover:shadow-sm">
                                            <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-[#f1f3f4] dark:border-[#3c4043]">
                                                <div className="size-7 rounded-full bg-[#e6f4ea] dark:bg-[#137333]/20 text-[#137333] dark:text-[#81c995] flex items-center justify-center shrink-0">
                                                    <span className="material-symbols-outlined text-[18px]">contact_phone</span>
                                                </div>
                                                <h3 className="text-xs font-semibold uppercase tracking-wider text-[#202124] dark:text-[#e8eaed]">{L('sec02')}</h3>
                                            </div>
                                            <div className="space-y-3">
                                                <div>
                                                    <label className="text-[11px] font-medium text-[#5f6368] dark:text-[#9aa0a6] uppercase tracking-wider block mb-1">{L('directEmail')}</label>
                                                    <p className="text-xs font-medium text-[#202124] dark:text-[#e8eaed] bg-[#f8f9fa] dark:bg-[#202124] rounded-xl px-3.5 py-2.5 border border-[#dadce0] dark:border-[#3c4043]">{formData.email || '-'}</p>
                                                </div>
                                                <div>
                                                    <label className="text-[11px] font-medium text-[#5f6368] dark:text-[#9aa0a6] uppercase tracking-wider block mb-1">{L('phone')}</label>
                                                    <p className="text-xs font-medium text-[#202124] dark:text-[#e8eaed] bg-[#f8f9fa] dark:bg-[#202124] rounded-xl px-3.5 py-2.5 border border-[#dadce0] dark:border-[#3c4043]">+{formData.phoneCountryCode} {formData.phoneNumber || '-'}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Section 03: Geography & Location */}
                                        <div className="bg-white dark:bg-[#303134] rounded-2xl border border-[#dadce0] dark:border-[#3c4043] p-5 shadow-xs transition-shadow hover:shadow-sm">
                                            <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-[#f1f3f4] dark:border-[#3c4043]">
                                                <div className="size-7 rounded-full bg-[#fce8e6] dark:bg-[#c5221f]/20 text-[#c5221f] dark:text-[#f28b82] flex items-center justify-center shrink-0">
                                                    <span className="material-symbols-outlined text-[18px]">place</span>
                                                </div>
                                                <h3 className="text-xs font-semibold uppercase tracking-wider text-[#202124] dark:text-[#e8eaed]">{L('sec03')}</h3>
                                            </div>
                                            <div className="space-y-3">
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div>
                                                        <label className="text-[11px] font-medium text-[#5f6368] dark:text-[#9aa0a6] uppercase tracking-wider block mb-1">{L('country')}</label>
                                                        <p className="text-xs font-medium text-[#202124] dark:text-[#e8eaed] bg-[#f8f9fa] dark:bg-[#202124] rounded-xl px-3.5 py-2.5 border border-[#dadce0] dark:border-[#3c4043] truncate">{formData.countryName || '-'}</p>
                                                    </div>
                                                    <div>
                                                        <label className="text-[11px] font-medium text-[#5f6368] dark:text-[#9aa0a6] uppercase tracking-wider block mb-1">{L('city')}</label>
                                                        <p className="text-xs font-medium text-[#202124] dark:text-[#e8eaed] bg-[#f8f9fa] dark:bg-[#202124] rounded-xl px-3.5 py-2.5 border border-[#dadce0] dark:border-[#3c4043] truncate">{formData.cityName || '-'}</p>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-4 gap-3">
                                                    <div className="col-span-3">
                                                        <label className="text-[11px] font-medium text-[#5f6368] dark:text-[#9aa0a6] uppercase tracking-wider block mb-1">{L('streetAddress')}</label>
                                                        <p className="text-xs font-medium text-[#202124] dark:text-[#e8eaed] bg-[#f8f9fa] dark:bg-[#202124] rounded-xl px-3.5 py-2.5 border border-[#dadce0] dark:border-[#3c4043] truncate">{formData.address || '-'}</p>
                                                    </div>
                                                    <div>
                                                        <label className="text-[11px] font-medium text-[#5f6368] dark:text-[#9aa0a6] uppercase tracking-wider block mb-1">{L('zipCode')}</label>
                                                        <p className="text-xs font-medium text-[#202124] dark:text-[#e8eaed] bg-[#f8f9fa] dark:bg-[#202124] rounded-xl px-3.5 py-2.5 border border-[#dadce0] dark:border-[#3c4043] text-center">{formData.zipCode || '-'}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Section 04: Finance */}
                                        <div className="bg-white dark:bg-[#303134] rounded-2xl border border-[#dadce0] dark:border-[#3c4043] p-5 shadow-xs transition-shadow hover:shadow-sm">
                                            <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-[#f1f3f4] dark:border-[#3c4043]">
                                                <div className="size-7 rounded-full bg-[#fef7e0] dark:bg-[#ea8600]/20 text-[#b06000] dark:text-[#fdd663] flex items-center justify-center shrink-0">
                                                    <span className="material-symbols-outlined text-[18px]">payments</span>
                                                </div>
                                                <h3 className="text-xs font-semibold uppercase tracking-wider text-[#202124] dark:text-[#e8eaed]">{L('sec04')}</h3>
                                            </div>
                                            <div className="space-y-3">
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div>
                                                        <label className="text-[11px] font-medium text-[#5f6368] dark:text-[#9aa0a6] uppercase tracking-wider block mb-1">{L('taxOffice')}</label>
                                                        <p className="text-xs font-medium text-[#202124] dark:text-[#e8eaed] bg-[#f8f9fa] dark:bg-[#202124] rounded-xl px-3.5 py-2.5 border border-[#dadce0] dark:border-[#3c4043]">{formData.taxOffice || '-'}</p>
                                                    </div>
                                                    <div>
                                                        <label className="text-[11px] font-medium text-[#5f6368] dark:text-[#9aa0a6] uppercase tracking-wider block mb-1">{L('taxNumber')}</label>
                                                        <p className="text-xs font-medium text-[#202124] dark:text-[#e8eaed] bg-[#f8f9fa] dark:bg-[#202124] rounded-xl px-3.5 py-2.5 border border-[#dadce0] dark:border-[#3c4043]">{formData.taxNumber || '-'}</p>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div>
                                                        <label className="text-[11px] font-medium text-[#5f6368] dark:text-[#9aa0a6] uppercase tracking-wider block mb-1">{L('accEmail')}</label>
                                                        <p className="text-xs font-medium text-[#202124] dark:text-[#e8eaed] bg-[#f8f9fa] dark:bg-[#202124] rounded-xl px-3.5 py-2.5 border border-[#dadce0] dark:border-[#3c4043] truncate">{formData.agencyFinancialInfo?.email || '-'}</p>
                                                    </div>
                                                    <div>
                                                        <label className="text-[11px] font-medium text-[#5f6368] dark:text-[#9aa0a6] uppercase tracking-wider block mb-1">{L('accPhone')}</label>
                                                        <p className="text-xs font-medium text-[#202124] dark:text-[#e8eaed] bg-[#f8f9fa] dark:bg-[#202124] rounded-xl px-3.5 py-2.5 border border-[#dadce0] dark:border-[#3c4043]">{formData.agencyFinancialInfo?.phoneCountryCode ? `+${formData.agencyFinancialInfo.phoneCountryCode} ${formData.agencyFinancialInfo.phoneNumber || ''}` : '-'}</p>
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="text-[11px] font-medium text-[#5f6368] dark:text-[#9aa0a6] uppercase tracking-wider block mb-1">{L('accAddress')}</label>
                                                    <p className="text-xs font-medium text-[#202124] dark:text-[#e8eaed] bg-[#f8f9fa] dark:bg-[#202124] rounded-xl px-3.5 py-2.5 border border-[#dadce0] dark:border-[#3c4043] truncate">{formData.agencyFinancialInfo?.address || '-'}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : activeTab === 'users' ? (
                            <div className="h-full flex flex-col gap-4 overflow-hidden">
                                {/* User Summary Cards */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                                    <div className="bg-white dark:bg-[#303134] p-4 rounded-2xl border border-[#dadce0] dark:border-[#3c4043] shadow-xs">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="text-[11px] font-medium text-[#5f6368] dark:text-[#9aa0a6] uppercase tracking-wider">{L('totalUsers')}</span>
                                            <div className="size-8 bg-[#e8f0fe] dark:bg-[#1a73e8]/20 rounded-full flex items-center justify-center text-[#1a73e8] dark:text-[#8ab4f8]">
                                                <span className="material-symbols-outlined text-[18px]">groups</span>
                                            </div>
                                        </div>
                                        <div className="flex items-end gap-2">
                                            <div className="text-2xl font-normal text-[#202124] dark:text-white leading-none">{statsLoading ? '...' : summary.totalCount}</div>
                                            <div className="text-[10px] font-medium text-[#5f6368] dark:text-[#9aa0a6] mb-0.5">MEMBERS</div>
                                        </div>
                                    </div>

                                    <div className="bg-white dark:bg-[#303134] p-4 rounded-2xl border border-[#dadce0] dark:border-[#3c4043] shadow-xs">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="text-[11px] font-medium text-[#137333] dark:text-[#81c995] uppercase tracking-wider">{L('activeUsers')}</span>
                                            <div className="size-8 bg-[#e6f4ea] dark:bg-[#137333]/20 rounded-full flex items-center justify-center text-[#137333] dark:text-[#81c995]">
                                                <span className="material-symbols-outlined text-[18px]">person_check</span>
                                            </div>
                                        </div>
                                        <div className="flex items-end gap-2">
                                            <div className="text-2xl font-normal text-[#202124] dark:text-white leading-none">{statsLoading ? '...' : summary.activeCount}</div>
                                            <div className="text-[10px] font-medium text-[#137333] dark:text-[#81c995] mb-0.5">ACTIVE</div>
                                        </div>
                                    </div>

                                    <div className="bg-white dark:bg-[#303134] p-4 rounded-2xl border border-[#dadce0] dark:border-[#3c4043] shadow-xs">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="text-[11px] font-medium text-[#c5221f] dark:text-[#f28b82] uppercase tracking-wider">{L('passiveUsers')}</span>
                                            <div className="size-8 bg-[#fce8e6] dark:bg-[#c5221f]/20 rounded-full flex items-center justify-center text-[#c5221f] dark:text-[#f28b82]">
                                                <span className="material-symbols-outlined text-[18px]">person_off</span>
                                            </div>
                                        </div>
                                        <div className="flex items-end gap-2">
                                            <div className="text-2xl font-normal text-[#202124] dark:text-white leading-none">{statsLoading ? '...' : summary.passiveCount}</div>
                                            <div className="text-[10px] font-medium text-[#c5221f] dark:text-[#f28b82] mb-0.5">DISABLED</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex-1 flex flex-col bg-white dark:bg-[#303134] rounded-2xl border border-[#dadce0] dark:border-[#3c4043] overflow-hidden shadow-xs">
                                    <div className="p-3.5 sm:p-4 border-b border-[#dadce0] dark:border-[#3c4043] flex flex-wrap items-center justify-between gap-3">
                                        <div className="flex items-center gap-2.5 flex-1 max-w-xl">
                                            <div className="relative flex-1">
                                                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5f6368] dark:text-[#9aa0a6] text-[18px]">search</span>
                                                <input type="text" placeholder={L('searchUsers')} value={userFilters.query} onChange={(e) => handleUserFilterChange({ ...userFilters, query: e.target.value })} className="w-full h-10 bg-[#f1f3f4] dark:bg-[#202124] border border-transparent focus:border-[#1a73e8] focus:bg-white dark:focus:bg-[#303134] rounded-full pl-10 pr-4 text-xs font-normal text-[#202124] dark:text-[#e8eaed] outline-none transition-all placeholder-[#5f6368] dark:placeholder-[#9aa0a6]" />
                                            </div>
                                            <select value={userFilters.roleIds[0] || ''} onChange={(e) => handleUserFilterChange({ ...userFilters, roleIds: e.target.value ? [parseInt(e.target.value)] : [] })} className="h-10 px-3.5 bg-[#f8f9fa] dark:bg-[#202124] border border-[#dadce0] dark:border-[#3c4043] rounded-full text-xs font-normal text-[#3c4043] dark:text-[#bdc1c6] focus:border-[#1a73e8] outline-none cursor-pointer">
                                                <option value="">{L('allRoles')}</option>
                                                {roles.map(r => <option key={r.id} value={r.id}>{r.roleName || r.name}</option>)}
                                            </select>
                                            <select value={userFilters.status} onChange={(e) => handleUserFilterChange({ ...userFilters, status: e.target.value })} className="h-10 px-3.5 bg-[#f8f9fa] dark:bg-[#202124] border border-[#dadce0] dark:border-[#3c4043] rounded-full text-xs font-normal text-[#3c4043] dark:text-[#bdc1c6] focus:border-[#1a73e8] outline-none cursor-pointer">
                                                <option value="ACTIVE">Active</option>
                                                <option value="PASSIVE">Passive</option>
                                            </select>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={handleExportUsersExcel}
                                                disabled={isExportingUserExcel || isExportingUserPdf || usersLoading}
                                                className="h-10 px-3.5 rounded-full border border-[#dadce0] dark:border-[#3c4043] hover:bg-[#f1f3f4] dark:hover:bg-[#3c4043] text-xs font-medium text-[#137333] dark:text-[#81c995] flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                                                title="Export all matching records to Excel"
                                            >
                                                {isExportingUserExcel ? (
                                                    <div className="size-3.5 border-2 border-[#137333] border-t-transparent rounded-full animate-spin"></div>
                                                ) : (
                                                    <span className="material-symbols-outlined text-[18px]">table_view</span>
                                                )}
                                                <span>{isExportingUserExcel ? L('exporting') : L('exportExcel')}</span>
                                            </button>

                                            <button
                                                onClick={handleExportUsersPdf}
                                                disabled={isExportingUserExcel || isExportingUserPdf || usersLoading}
                                                className="h-10 px-3.5 rounded-full border border-[#dadce0] dark:border-[#3c4043] hover:bg-[#f1f3f4] dark:hover:bg-[#3c4043] text-xs font-medium text-[#c5221f] dark:text-[#f28b82] flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                                                title="Export all matching records to PDF"
                                            >
                                                {isExportingUserPdf ? (
                                                    <div className="size-3.5 border-2 border-[#c5221f] border-t-transparent rounded-full animate-spin"></div>
                                                ) : (
                                                    <span className="material-symbols-outlined text-[18px]">picture_as_pdf</span>
                                                )}
                                                <span>{isExportingUserPdf ? L('exporting') : L('exportPdf')}</span>
                                            </button>

                                            <button
                                                onClick={() => fetchUsersData(true)}
                                                disabled={usersLoading}
                                                className="size-10 rounded-full border border-[#dadce0] dark:border-[#3c4043] hover:bg-[#f1f3f4] dark:hover:bg-[#3c4043] flex items-center justify-center text-[#5f6368] dark:text-[#9aa0a6] transition-all cursor-pointer disabled:opacity-50"
                                                title={L('refresh')}
                                            >
                                                <span className={`material-symbols-outlined text-[18px] ${usersLoading ? 'animate-spin' : ''}`}>refresh</span>
                                            </button>

                                            <button onClick={openAddUser} className="h-10 px-5 bg-[#1a73e8] hover:bg-[#1765cc] text-white rounded-full text-xs font-medium flex items-center gap-1.5 shadow-none hover:shadow-xs active:scale-95 transition-all cursor-pointer"><span className="material-symbols-outlined text-[18px]">add</span> {L('addUser')}</button>
                                        </div>
                                    </div>
                                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                                        <table className="w-full border-collapse">
                                            <thead className="bg-[#f8f9fa] dark:bg-[#202124] border-b border-[#dadce0] dark:border-[#3c4043] sticky top-0 z-10">
                                                <tr>
                                                    <th className="px-4 py-3 text-left text-[11px] font-medium text-[#5f6368] dark:text-[#9aa0a6] uppercase tracking-wider whitespace-nowrap select-none">{L('colUser')}</th>
                                                    <th className="px-4 py-3 text-left text-[11px] font-medium text-[#5f6368] dark:text-[#9aa0a6] uppercase tracking-wider whitespace-nowrap select-none">{L('colContact')}</th>
                                                    <th className="px-4 py-3 text-left text-[11px] font-medium text-[#5f6368] dark:text-[#9aa0a6] uppercase tracking-wider whitespace-nowrap select-none">{L('colRole')}</th>
                                                    <th className="px-4 py-3 text-left text-[11px] font-medium text-[#5f6368] dark:text-[#9aa0a6] uppercase tracking-wider whitespace-nowrap select-none">{L('colStatus')}</th>
                                                    <th className="px-4 py-3 text-right text-[11px] font-medium text-[#5f6368] dark:text-[#9aa0a6] uppercase tracking-wider whitespace-nowrap select-none">{L('colActions')}</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {usersLoading ? <TableSkeleton columns={5} /> : users.length > 0 ? users.map((u) => (
                                                    <tr key={u.id} className="hover:bg-[#f8f9fa] dark:hover:bg-[#202124]/50 transition-colors border-b border-[#f1f3f4] dark:border-[#3c4043] text-xs">
                                                        <td className="px-4 py-3">
                                                            <div className="flex items-center gap-3">
                                                                <div className="size-9 rounded-full bg-[#e8f0fe] dark:bg-[#1a73e8]/20 text-[#1a73e8] dark:text-[#8ab4f8] font-medium text-xs flex items-center justify-center shrink-0">
                                                                    <span className="uppercase">{u.name?.[0] || 'U'}{u.surname?.[0] || ''}</span>
                                                                </div>
                                                                <div>
                                                                    <p className="font-medium text-[#202124] dark:text-[#e8eaed] leading-tight mb-0.5">{u.name} {u.surname}</p>
                                                                    <p className="text-[10px] text-[#5f6368] dark:text-[#9aa0a6] font-mono">ID: #{u.id}</p>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <div className="space-y-0.5 text-xs">
                                                                <div className="flex items-center gap-1.5 text-[#3c4043] dark:text-[#e8eaed]">
                                                                    <span className="material-symbols-outlined text-[15px] text-[#5f6368] dark:text-[#9aa0a6]">mail</span>
                                                                    <span>{u.email}</span>
                                                                </div>
                                                                {u.phoneNumber && (
                                                                    <div className="flex items-center gap-1.5 text-[#5f6368] dark:text-[#9aa0a6] text-[11px]">
                                                                        <span className="material-symbols-outlined text-[15px]">call</span>
                                                                        <span>+{u.phoneCountryCode} {u.phoneNumber}</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <div className="flex flex-wrap gap-1">
                                                                {u.roles?.length > 0 ? u.roles.map((r, idx) => (
                                                                    <span key={r.id || idx} className="px-2.5 py-0.5 bg-[#e8f0fe] dark:bg-[#1a73e8]/20 text-[#1a73e8] dark:text-[#8ab4f8] text-[11px] font-medium rounded-full">
                                                                        {r.roleName || r.name}
                                                                    </span>
                                                                )) : (
                                                                    <span className="text-[#5f6368] dark:text-[#9aa0a6] text-[11px] italic">No Role</span>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <div className="flex items-center gap-2">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleToggleUserStatus(u)}
                                                                    className={`relative inline-flex h-[20px] w-[36px] shrink-0 cursor-pointer rounded-full p-[2px] transition-colors duration-200 ease-in-out focus:outline-none ${u.status === 'ACTIVE' ? 'bg-[#1a73e8]' : 'bg-[#dadce0] dark:bg-[#5f6368]'
                                                                        }`}
                                                                    title={u.status === 'ACTIVE' ? 'Set Passive' : 'Set Active'}
                                                                >
                                                                    <span className={`pointer-events-none inline-block size-[16px] transform rounded-full bg-white shadow-xs transition duration-200 ease-in-out ${u.status === 'ACTIVE' ? 'translate-x-[16px]' : 'translate-x-0'
                                                                        }`} />
                                                                </button>
                                                                <span className={`text-xs font-medium ${u.status === 'ACTIVE' ? 'text-[#137333] dark:text-[#81c995]' : 'text-[#5f6368] dark:text-[#9aa0a6]'}`}>
                                                                    {u.status === 'ACTIVE' ? 'Active' : 'Passive'}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3 text-right">
                                                            <div className="flex items-center justify-end gap-1">
                                                                <button onClick={() => openEditUser(u)} className="size-8 rounded-full flex items-center justify-center text-[#5f6368] hover:bg-[#f1f3f4] dark:text-[#9aa0a6] dark:hover:bg-[#202124] transition-colors cursor-pointer" title={L('editUser')}>
                                                                    <span className="material-symbols-outlined text-[18px]">edit</span>
                                                                </button>
                                                                <button onClick={() => handleDeleteUser(u.id)} className="size-8 rounded-full flex items-center justify-center text-[#5f6368] hover:bg-[#fce8e6] hover:text-[#d93025] dark:hover:bg-[#c5221f]/20 transition-colors cursor-pointer" title={L('deleteUser')}>
                                                                    <span className="material-symbols-outlined text-[18px]">delete</span>
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )) : (
                                                    <tr>
                                                        <td colSpan="5" className="px-4 py-12 text-center">
                                                            <p className="text-[#5f6368] dark:text-[#9aa0a6] text-xs font-medium italic">{L('noUsers')}</p>
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        ) : activeTab === 'guests' ? (
                            <div className="h-full flex flex-col gap-4 overflow-hidden">
                                {/* Guest Summary Cards */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                                    <div className="bg-white dark:bg-[#303134] p-4 rounded-2xl border border-[#dadce0] dark:border-[#3c4043] shadow-xs">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="text-[11px] font-medium text-[#5f6368] dark:text-[#9aa0a6] uppercase tracking-wider">{L('totalGuests')}</span>
                                            <div className="size-8 bg-[#e8f0fe] dark:bg-[#1a73e8]/20 rounded-full flex items-center justify-center text-[#1a73e8] dark:text-[#8ab4f8]">
                                                <span className="material-symbols-outlined text-[18px]">recent_actors</span>
                                            </div>
                                        </div>
                                        <div className="flex items-end gap-2">
                                            <div className="text-2xl font-normal text-[#202124] dark:text-white leading-none">{statsLoading ? '...' : summary.totalGuestCount}</div>
                                            <div className="text-[10px] font-medium text-[#5f6368] dark:text-[#9aa0a6] mb-0.5">PROFILES</div>
                                        </div>
                                    </div>

                                    <div className="bg-white dark:bg-[#303134] p-4 rounded-2xl border border-[#dadce0] dark:border-[#3c4043] shadow-xs">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="text-[11px] font-medium text-[#137333] dark:text-[#81c995] uppercase tracking-wider">{L('activeGuests')}</span>
                                            <div className="size-8 bg-[#e6f4ea] dark:bg-[#137333]/20 rounded-full flex items-center justify-center text-[#137333] dark:text-[#81c995]">
                                                <span className="material-symbols-outlined text-[18px]">how_to_reg</span>
                                            </div>
                                        </div>
                                        <div className="flex items-end gap-2">
                                            <div className="text-2xl font-normal text-[#202124] dark:text-white leading-none">{statsLoading ? '...' : summary.activeGuestCount}</div>
                                            <div className="text-[10px] font-medium text-[#137333] dark:text-[#81c995] mb-0.5">ACTIVE</div>
                                        </div>
                                    </div>

                                    <div className="bg-white dark:bg-[#303134] p-4 rounded-2xl border border-[#dadce0] dark:border-[#3c4043] shadow-xs">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="text-[11px] font-medium text-[#c5221f] dark:text-[#f28b82] uppercase tracking-wider">{L('passiveGuests')}</span>
                                            <div className="size-8 bg-[#fce8e6] dark:bg-[#c5221f]/20 rounded-full flex items-center justify-center text-[#c5221f] dark:text-[#f28b82]">
                                                <span className="material-symbols-outlined text-[18px]">person_remove</span>
                                            </div>
                                        </div>
                                        <div className="flex items-end gap-2">
                                            <div className="text-2xl font-normal text-[#202124] dark:text-white leading-none">{statsLoading ? '...' : summary.passiveGuestCount}</div>
                                            <div className="text-[10px] font-medium text-[#c5221f] dark:text-[#f28b82] mb-0.5">ARCHIVED</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex-1 flex flex-col bg-white dark:bg-[#303134] rounded-2xl border border-[#dadce0] dark:border-[#3c4043] overflow-hidden shadow-xs">
                                    <div className="p-3.5 sm:p-4 border-b border-[#dadce0] dark:border-[#3c4043] flex flex-wrap items-center justify-between gap-3">
                                        <div className="flex items-center gap-2.5 flex-1 max-w-xl">
                                            <div className="relative flex-1">
                                                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5f6368] dark:text-[#9aa0a6] text-[18px]">search</span>
                                                <input type="text" placeholder={L('searchGuests')} value={guestFilters.query} onChange={(e) => handleGuestFilterChange({ ...guestFilters, query: e.target.value })} className="w-full h-10 bg-[#f1f3f4] dark:bg-[#202124] border border-transparent focus:border-[#1a73e8] focus:bg-white dark:focus:bg-[#303134] rounded-full pl-10 pr-4 text-xs font-normal text-[#202124] dark:text-[#e8eaed] outline-none transition-all placeholder-[#5f6368] dark:placeholder-[#9aa0a6]" />
                                            </div>
                                            <select value={guestFilters.countryCodes[0] || ''} onChange={(e) => handleGuestFilterChange({ ...guestFilters, countryCodes: e.target.value ? [e.target.value] : [] })} className="h-10 px-3.5 bg-[#f8f9fa] dark:bg-[#202124] border border-[#dadce0] dark:border-[#3c4043] rounded-full text-xs font-normal text-[#3c4043] dark:text-[#bdc1c6] focus:border-[#1a73e8] outline-none cursor-pointer">
                                                <option value="">{L('allCountries')}</option>
                                                {countries.map(c => <option key={c.locationId} value={c.alphaTwoCode}>{getCountryName(countries, c.alphaTwoCode, currentLang)}</option>)}
                                            </select>
                                            <select value={guestFilters.status} onChange={(e) => handleGuestFilterChange({ ...guestFilters, status: e.target.value })} className="h-10 px-3.5 bg-[#f8f9fa] dark:bg-[#202124] border border-[#dadce0] dark:border-[#3c4043] rounded-full text-xs font-normal text-[#3c4043] dark:text-[#bdc1c6] focus:border-[#1a73e8] outline-none cursor-pointer">
                                                <option value="ACTIVE">Active</option>
                                                <option value="PASSIVE">Passive</option>
                                            </select>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={handleExportGuestsExcel}
                                                disabled={isExportingGuestExcel || isExportingGuestPdf || guestsLoading}
                                                className="h-10 px-3.5 rounded-full border border-[#dadce0] dark:border-[#3c4043] hover:bg-[#f1f3f4] dark:hover:bg-[#3c4043] text-xs font-medium text-[#137333] dark:text-[#81c995] flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                                                title="Export all matching records to Excel"
                                            >
                                                {isExportingGuestExcel ? (
                                                    <div className="size-3.5 border-2 border-[#137333] border-t-transparent rounded-full animate-spin"></div>
                                                ) : (
                                                    <span className="material-symbols-outlined text-[18px]">table_view</span>
                                                )}
                                                <span>{isExportingGuestExcel ? L('exporting') : L('exportExcel')}</span>
                                            </button>

                                            <button
                                                onClick={handleExportGuestsPdf}
                                                disabled={isExportingGuestExcel || isExportingGuestPdf || guestsLoading}
                                                className="h-10 px-3.5 rounded-full border border-[#dadce0] dark:border-[#3c4043] hover:bg-[#f1f3f4] dark:hover:bg-[#3c4043] text-xs font-medium text-[#c5221f] dark:text-[#f28b82] flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                                                title="Export all matching records to PDF"
                                            >
                                                {isExportingGuestPdf ? (
                                                    <div className="size-3.5 border-2 border-[#c5221f] border-t-transparent rounded-full animate-spin"></div>
                                                ) : (
                                                    <span className="material-symbols-outlined text-[18px]">picture_as_pdf</span>
                                                )}
                                                <span>{isExportingGuestPdf ? L('exporting') : L('exportPdf')}</span>
                                            </button>

                                            <button
                                                onClick={() => fetchGuestsData(true)}
                                                disabled={guestsLoading}
                                                className="size-10 rounded-full border border-[#dadce0] dark:border-[#3c4043] hover:bg-[#f1f3f4] dark:hover:bg-[#3c4043] flex items-center justify-center text-[#5f6368] dark:text-[#9aa0a6] transition-all cursor-pointer disabled:opacity-50"
                                                title={L('refresh')}
                                            >
                                                <span className={`material-symbols-outlined text-[18px] ${guestsLoading ? 'animate-spin' : ''}`}>refresh</span>
                                            </button>

                                            <button onClick={openAddGuest} className="h-10 px-5 bg-[#1a73e8] hover:bg-[#1765cc] text-white rounded-full text-xs font-medium flex items-center gap-1.5 shadow-none hover:shadow-xs active:scale-95 transition-all cursor-pointer"><span className="material-symbols-outlined text-[18px]">add</span> {L('addGuest')}</button>
                                        </div>
                                    </div>
                                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                                        <table className="w-full border-collapse">
                                            <thead className="bg-[#f8f9fa] dark:bg-[#202124] border-b border-[#dadce0] dark:border-[#3c4043] sticky top-0 z-10">
                                                <tr>
                                                    <th className="px-4 py-3 text-left text-[11px] font-medium text-[#5f6368] dark:text-[#9aa0a6] uppercase tracking-wider whitespace-nowrap select-none">{L('colGuest')}</th>
                                                    <th className="px-4 py-3 text-left text-[11px] font-medium text-[#5f6368] dark:text-[#9aa0a6] uppercase tracking-wider whitespace-nowrap select-none">{L('colBirth')}</th>
                                                    <th className="px-4 py-3 text-left text-[11px] font-medium text-[#5f6368] dark:text-[#9aa0a6] uppercase tracking-wider whitespace-nowrap select-none">{L('colPassport')}</th>
                                                    <th className="px-4 py-3 text-left text-[11px] font-medium text-[#5f6368] dark:text-[#9aa0a6] uppercase tracking-wider whitespace-nowrap select-none">{L('colContact')}</th>
                                                    <th className="px-4 py-3 text-left text-[11px] font-medium text-[#5f6368] dark:text-[#9aa0a6] uppercase tracking-wider whitespace-nowrap select-none">{L('colStatus')}</th>
                                                    <th className="px-4 py-3 text-right text-[11px] font-medium text-[#5f6368] dark:text-[#9aa0a6] uppercase tracking-wider whitespace-nowrap select-none">{L('colActions')}</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {guestsLoading ? <TableSkeleton columns={6} /> : guests.length > 0 ? guests.map((g) => (
                                                    <tr key={g.id} className="hover:bg-[#f8f9fa] dark:hover:bg-[#202124]/50 transition-colors border-b border-[#f1f3f4] dark:border-[#3c4043] text-xs">
                                                        <td className="px-4 py-3">
                                                            <div className="flex items-center gap-3">
                                                                <div className={`size-9 rounded-full flex items-center justify-center font-medium text-xs shrink-0 ${g.gender === 'FEMALE'
                                                                        ? 'bg-[#fce8e6] dark:bg-[#c5221f]/20 text-[#c5221f] dark:text-[#f28b82]'
                                                                        : 'bg-[#e8f0fe] dark:bg-[#1a73e8]/20 text-[#1a73e8] dark:text-[#8ab4f8]'
                                                                    }`}>
                                                                    <span className="uppercase">{g.firstName?.[0]}{g.lastName?.[0]}</span>
                                                                </div>
                                                                <div>
                                                                    <p className="font-medium text-[#202124] dark:text-[#e8eaed] leading-tight mb-0.5">{g.gender === 'MALE' ? 'Mr' : 'Mrs'} {g.firstName} {g.lastName}</p>
                                                                    <p className="text-[10px] text-[#5f6368] dark:text-[#9aa0a6] font-mono">ID: #{g.id}</p>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <div className="flex items-center gap-2">
                                                                <span className="px-2 py-0.5 bg-[#f1f3f4] dark:bg-[#202124] rounded text-[10px] font-medium text-[#5f6368] dark:text-[#9aa0a6] uppercase">{g.country || 'N/A'}</span>
                                                                <div>
                                                                    <p className="text-xs font-medium text-[#3c4043] dark:text-[#e8eaed]">{getCountryName(countries, g.country, currentLang)}</p>
                                                                    <p className="text-[10px] text-[#5f6368] dark:text-[#9aa0a6]">Born: {g.birthDate || 'Unknown'}</p>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <div className="flex items-center gap-1.5">
                                                                <span className="material-symbols-outlined text-[16px] text-[#1a73e8] dark:text-[#8ab4f8]">badge</span>
                                                                <div>
                                                                    <p className="text-xs font-medium text-[#202124] dark:text-[#e8eaed]">{g.passportNo || 'N/A'}</p>
                                                                    <p className="text-[10px] text-[#5f6368] dark:text-[#9aa0a6]">Expires: {g.passportExpiry || 'N/A'}</p>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <div className="space-y-0.5 text-xs">
                                                                <div className="flex items-center gap-1.5 text-[#3c4043] dark:text-[#e8eaed]">
                                                                    <span className="material-symbols-outlined text-[15px] text-[#5f6368] dark:text-[#9aa0a6]">mail</span>
                                                                    <span>{g.email}</span>
                                                                </div>
                                                                {g.phoneNumber && (
                                                                    <div className="flex items-center gap-1.5 text-[#5f6368] dark:text-[#9aa0a6] text-[11px]">
                                                                        <span className="material-symbols-outlined text-[15px]">call</span>
                                                                        <span>+{g.phoneCountryCode} {g.phoneNumber}</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <div className="flex items-center gap-2">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleToggleGuestStatus(g)}
                                                                    className={`relative inline-flex h-[20px] w-[36px] shrink-0 cursor-pointer rounded-full p-[2px] transition-colors duration-200 ease-in-out focus:outline-none ${g.status === 'ACTIVE' ? 'bg-[#1a73e8]' : 'bg-[#dadce0] dark:bg-[#5f6368]'
                                                                        }`}
                                                                    title={g.status === 'ACTIVE' ? 'Set Passive' : 'Set Active'}
                                                                >
                                                                    <span className={`pointer-events-none inline-block size-[16px] transform rounded-full bg-white shadow-xs transition duration-200 ease-in-out ${g.status === 'ACTIVE' ? 'translate-x-[16px]' : 'translate-x-0'
                                                                        }`} />
                                                                </button>
                                                                <span className={`text-xs font-medium ${g.status === 'ACTIVE' ? 'text-[#137333] dark:text-[#81c995]' : 'text-[#5f6368] dark:text-[#9aa0a6]'}`}>
                                                                    {g.status === 'ACTIVE' ? 'Active' : 'Passive'}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3 text-right">
                                                            <div className="flex items-center justify-end gap-1">
                                                                <button onClick={() => openEditGuest(g)} className="size-8 rounded-full flex items-center justify-center text-[#5f6368] hover:bg-[#f1f3f4] dark:text-[#9aa0a6] dark:hover:bg-[#202124] transition-colors cursor-pointer" title={L('editGuest')}>
                                                                    <span className="material-symbols-outlined text-[18px]">edit</span>
                                                                </button>
                                                                <button onClick={() => handleDeleteGuest(g.id)} className="size-8 rounded-full flex items-center justify-center text-[#5f6368] hover:bg-[#fce8e6] hover:text-[#d93025] dark:hover:bg-[#c5221f]/20 transition-colors cursor-pointer" title={L('deleteGuest')}>
                                                                    <span className="material-symbols-outlined text-[18px]">delete</span>
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )) : (
                                                    <tr>
                                                        <td colSpan="6" className="px-4 py-12 text-center">
                                                            <p className="text-[#5f6368] dark:text-[#9aa0a6] text-xs font-medium italic">{L('noGuests')}</p>
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        ) : activeTab === 'favorites' ? (
                            <div className="h-full flex flex-col min-h-0 bg-white dark:bg-[#303134] border border-[#dadce0] dark:border-[#3c4043] rounded-2xl shadow-xs relative z-20 overflow-visible">
                                {/* Filter and Autocomplete Controls Bar */}
                                <div className="p-3.5 sm:p-4 flex flex-wrap items-center justify-between gap-3 relative z-50 select-none">
                                    {/* Autocomplete Search Dropdown */}
                                    <div ref={hotelAutocompleteRef} className="relative flex-1 max-w-md">
                                        <div className="relative">
                                            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5f6368] dark:text-[#9aa0a6] text-[18px]">search</span>
                                            <input
                                                type="text"
                                                placeholder={L('searchAutocompletePlaceholder')}
                                                value={hotelAutocompleteQuery}
                                                onChange={(e) => setHotelAutocompleteQuery(e.target.value)}
                                                onFocus={() => hotelAutocompleteResults.length > 0 && setShowHotelAutocompleteDropdown(true)}
                                                className="w-full pl-10 pr-8 py-2.5 border border-[#dadce0] dark:border-[#5f6368] rounded-full text-xs font-normal bg-[#f1f3f4] dark:bg-[#202124] text-[#202124] dark:text-[#e8eaed] placeholder-[#5f6368] dark:placeholder-[#9aa0a6] focus:outline-none focus:border-[#1a73e8] focus:bg-white dark:focus:bg-[#303134] transition-all"
                                            />
                                            {hotelAutocompleteLoading && (
                                                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 size-4 border-2 border-[#1a73e8]/30 border-t-[#1a73e8] rounded-full animate-spin"></div>
                                            )}
                                        </div>

                                        {/* Autocomplete Dropdown Overlay */}
                                        {showHotelAutocompleteDropdown && hotelAutocompleteResults.length > 0 && (
                                            <div className="absolute left-0 right-0 top-full mt-2 bg-white dark:bg-[#303134] border border-[#dadce0] dark:border-[#5f6368] rounded-2xl shadow-2xl max-h-64 overflow-y-auto z-[9999] p-2 space-y-1 ring-1 ring-black/5 animate-in fade-in-50 zoom-in-95">
                                                {hotelAutocompleteResults.map((h, idx) => {
                                                    const isFav = isFavorite(h.hotelId);
                                                    return (
                                                        <div
                                                            key={h.hotelId ? `ac-${h.hotelId}-${idx}` : `ac-${idx}`}
                                                            className="p-2.5 hover:bg-[#f1f3f4] dark:hover:bg-[#202124] rounded-xl transition-colors flex items-center justify-between group cursor-pointer"
                                                        >
                                                            <div className="flex items-center gap-2.5 min-w-0 pr-2">
                                                                <div className={`size-8 rounded-full ${isFav ? 'bg-[#e6f4ea] text-[#137333] dark:bg-[#137333]/20 dark:text-[#81c995]' : 'bg-[#e8f0fe] text-[#1a73e8] dark:bg-[#1a73e8]/20 dark:text-[#8ab4f8]'} flex items-center justify-center font-medium text-xs shrink-0`}>
                                                                    <span className="material-symbols-outlined text-[18px]">{isFav ? 'bookmark' : 'hotel'}</span>
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <p className="text-xs font-medium text-[#202124] dark:text-[#e8eaed] group-hover:text-[#1a73e8] transition-colors truncate">
                                                                        {h.hotelName}
                                                                    </p>
                                                                    <p className="text-[10px] text-[#5f6368] dark:text-[#9aa0a6]">
                                                                        ID: #{h.hotelId} {h.cityName ? `• ${h.cityName}` : ''}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <button
                                                                type="button"
                                                                onClick={(e) => handleAddHotelFromAutocomplete(h, e)}
                                                                disabled={isFav}
                                                                className={`h-7 px-3 rounded-full text-[11px] font-medium transition-all flex items-center gap-1 shrink-0 ${isFav
                                                                        ? 'bg-[#e6f4ea] dark:bg-[#137333]/20 text-[#137333] dark:text-[#81c995] cursor-default'
                                                                        : 'bg-[#e8f0fe] text-[#1a73e8] dark:bg-[#1a73e8]/20 dark:text-[#8ab4f8] hover:bg-[#1a73e8] hover:text-white active:scale-95'
                                                                    }`}
                                                            >
                                                                <span className="material-symbols-outlined text-[14px]">{isFav ? 'check' : 'add'}</span>
                                                                <span>{isFav ? L('addedBtn') : L('addBtn')}</span>
                                                            </button>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>

                                    {/* Table Search & Filter Controls */}
                                    <div className="flex items-center gap-2">
                                        <div className="relative">
                                            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5f6368] dark:text-[#9aa0a6] text-[18px]">search</span>
                                            <input
                                                type="text"
                                                placeholder={L('searchTablePlaceholder')}
                                                value={favoriteSearchQuery}
                                                onChange={(e) => setFavoriteSearchQuery(e.target.value)}
                                                className="w-40 sm:w-48 pl-9 pr-3 py-2 bg-[#f8f9fa] dark:bg-[#202124] border border-[#dadce0] dark:border-[#3c4043] rounded-full text-xs font-normal text-[#202124] dark:text-[#e8eaed] placeholder-[#5f6368] dark:placeholder-[#9aa0a6] focus:outline-none focus:border-[#1a73e8] transition-colors"
                                            />
                                        </div>

                                        <select
                                            value={favoriteStatusFilter}
                                            onChange={(e) => setFavoriteStatusFilter(e.target.value)}
                                            className="px-3.5 py-2 border border-[#dadce0] dark:border-[#3c4043] rounded-full text-xs font-normal bg-white dark:bg-[#202124] text-[#3c4043] dark:text-[#bdc1c6] focus:outline-none focus:border-[#1a73e8] transition-colors cursor-pointer"
                                        >
                                            <option value="">{L('allStatuses')}</option>
                                            <option value="ACTIVE">{L('statusActive')}</option>
                                            <option value="PASSIVE">{L('statusPassive')}</option>
                                        </select>

                                        <button
                                            onClick={handleExportFavoritesExcel}
                                            disabled={isExportingFavExcel || isExportingFavPdf || favoriteLoading}
                                            className="h-10 px-3.5 rounded-full border border-[#dadce0] dark:border-[#3c4043] hover:bg-[#f1f3f4] dark:hover:bg-[#3c4043] text-xs font-medium text-[#137333] dark:text-[#81c995] flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                                            title="Export all matching records to Excel"
                                        >
                                            {isExportingFavExcel ? (
                                                <div className="size-3.5 border-2 border-[#137333] border-t-transparent rounded-full animate-spin"></div>
                                            ) : (
                                                <span className="material-symbols-outlined text-[18px]">table_view</span>
                                            )}
                                            <span>{isExportingFavExcel ? L('exporting') : L('exportExcel')}</span>
                                        </button>

                                        <button
                                            onClick={handleExportFavoritesPdf}
                                            disabled={isExportingFavExcel || isExportingFavPdf || favoriteLoading}
                                            className="h-10 px-3.5 rounded-full border border-[#dadce0] dark:border-[#3c4043] hover:bg-[#f1f3f4] dark:hover:bg-[#3c4043] text-xs font-medium text-[#c5221f] dark:text-[#f28b82] flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                                            title="Export all matching records to PDF"
                                        >
                                            {isExportingFavPdf ? (
                                                <div className="size-3.5 border-2 border-[#c5221f] border-t-transparent rounded-full animate-spin"></div>
                                            ) : (
                                                <span className="material-symbols-outlined text-[18px]">picture_as_pdf</span>
                                            )}
                                            <span>{isExportingFavPdf ? L('exporting') : L('exportPdf')}</span>
                                        </button>

                                        <button
                                            onClick={() => fetchFavoriteHotels(favoritePage)}
                                            disabled={favoriteLoading}
                                            className="size-10 rounded-full border border-[#dadce0] dark:border-[#3c4043] hover:bg-[#f1f3f4] dark:hover:bg-[#3c4043] flex items-center justify-center text-[#5f6368] dark:text-[#9aa0a6] transition-all cursor-pointer disabled:opacity-50"
                                            title={L('refresh')}
                                        >
                                            <span className={`material-symbols-outlined text-[18px] ${favoriteLoading ? 'animate-spin' : ''}`}>refresh</span>
                                        </button>
                                    </div>
                                </div>

                                {/* Status Sub-Header Bar */}
                                <div className="px-4 py-2 bg-[#f8f9fa] dark:bg-[#202124] border-t border-b border-[#dadce0] dark:border-[#3c4043] flex justify-between items-center select-none shrink-0">
                                    <div className="flex items-center gap-2 text-[#5f6368] dark:text-[#9aa0a6]">
                                        <span className="material-symbols-outlined text-[18px]">analytics</span>
                                        <span className="text-xs font-medium">
                                            {favoriteTotalElements} {L('totalRecords')}
                                        </span>
                                    </div>
                                    <span className="text-[11px] text-[#5f6368] dark:text-[#9aa0a6]">
                                        Favorite Hotels Console
                                    </span>
                                </div>

                                {/* Favorite Hotels Table Body */}
                                <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar relative z-10">
                                    <table className="w-full border-collapse">
                                        <thead className="bg-[#f8f9fa] dark:bg-[#202124] border-b border-[#dadce0] dark:border-[#3c4043] sticky top-0 z-10">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-[11px] font-medium text-[#5f6368] dark:text-[#9aa0a6] uppercase tracking-wider whitespace-nowrap min-w-[80px] select-none">ID</th>
                                                <th className="px-4 py-3 text-left text-[11px] font-medium text-[#5f6368] dark:text-[#9aa0a6] uppercase tracking-wider whitespace-nowrap min-w-[240px] select-none">{L('colHotelInfo')}</th>
                                                <th className="px-4 py-3 text-left text-[11px] font-medium text-[#5f6368] dark:text-[#9aa0a6] uppercase tracking-wider whitespace-nowrap min-w-[160px] select-none">{L('colLocationStars')}</th>
                                                <th className="px-4 py-3 text-left text-[11px] font-medium text-[#5f6368] dark:text-[#9aa0a6] uppercase tracking-wider whitespace-nowrap min-w-[100px] select-none">{L('colDateAdded')}</th>
                                                <th className="px-4 py-3 text-left text-[11px] font-medium text-[#5f6368] dark:text-[#9aa0a6] uppercase tracking-wider whitespace-nowrap min-w-[100px] select-none">{L('status')}</th>
                                                <th className="px-4 py-3 text-right text-[11px] font-medium text-[#5f6368] dark:text-[#9aa0a6] uppercase tracking-wider whitespace-nowrap min-w-[100px] select-none">{L('colActions')}</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {favoriteLoading ? (
                                                <TableSkeleton columns={6} rows={favoritePageSize || 10} />
                                            ) : favoriteBackendItems.length > 0 ? (
                                                favoriteBackendItems.map((fav, idx) => (
                                                    <tr
                                                        key={fav.id ? `fav-${fav.id}-${idx}` : `fav-${idx}`}
                                                        className="hover:bg-[#f8f9fa] dark:hover:bg-[#202124]/50 transition-colors border-b border-[#f1f3f4] dark:border-[#3c4043] text-xs"
                                                    >
                                                        {/* ID */}
                                                        <td className="px-4 py-3 text-[#5f6368] dark:text-[#9aa0a6] font-mono text-[11px]">#{fav.hotelId}</td>

                                                        {/* Hotel Info */}
                                                        <td className="px-4 py-3">
                                                            <div className="flex items-center gap-3">
                                                                <div className="size-8 rounded-xl bg-[#e8f0fe] dark:bg-[#1a73e8]/20 text-[#1a73e8] dark:text-[#8ab4f8] flex items-center justify-center font-medium text-xs flex-shrink-0 overflow-hidden">
                                                                    {fav.imageUrl ? (
                                                                        <img src={fav.imageUrl} alt={fav.hotelName} className="w-full h-full object-cover" />
                                                                    ) : (
                                                                        <span className="material-symbols-outlined text-[18px]">hotel</span>
                                                                    )}
                                                                </div>
                                                                <span
                                                                    className="font-medium text-[#202124] dark:text-[#e8eaed] hover:text-[#1a73e8] dark:hover:text-[#8ab4f8] transition-colors cursor-pointer text-xs truncate max-w-[280px]"
                                                                    onClick={() => navigate(`/travel/hotels/detail/${fav.hotelId}`)}
                                                                    title={fav.hotelName}
                                                                >
                                                                    {fav.hotelName}
                                                                </span>
                                                            </div>
                                                        </td>

                                                        {/* Location & Stars */}
                                                        <td className="px-4 py-3 text-[#3c4043] dark:text-[#e8eaed]">
                                                            <div>
                                                                <p className="text-xs font-normal flex items-center gap-1">
                                                                    <span className="material-symbols-outlined text-[14px] text-[#1a73e8] dark:text-[#8ab4f8]">location_on</span>
                                                                    <span>{fav.cityName || 'N/A'}</span>
                                                                </p>
                                                                <div className="flex items-center gap-0.5 text-[#f9ab00] mt-0.5">
                                                                    {[...Array(fav.stars || 4)].map((_, i) => (
                                                                        <span key={`star-${fav.id || idx}-${i}`} className="material-symbols-outlined text-[12px] fill-1">star</span>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </td>

                                                        {/* Audit Details Icon */}
                                                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                                                            <div
                                                                className="inline-flex items-center cursor-pointer p-1"
                                                                onMouseEnter={(e) => {
                                                                    const rect = e.currentTarget.getBoundingClientRect();
                                                                    setAuditTooltip({
                                                                        item: fav,
                                                                        x: rect.left + rect.width / 2,
                                                                        y: rect.top - 8
                                                                    });
                                                                }}
                                                                onMouseLeave={() => setAuditTooltip(null)}
                                                            >
                                                                <span className="material-symbols-outlined text-[#5f6368] hover:text-[#1a73e8] dark:text-[#9aa0a6] text-[18px] transition-colors leading-none">
                                                                    info
                                                                </span>
                                                            </div>
                                                        </td>

                                                        {/* Status Toggle Button */}
                                                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleToggleFavoriteStatus(fav)}
                                                                className="p-1 inline-flex items-center justify-center transition-transform duration-200 active:scale-90 cursor-pointer bg-transparent border-0 outline-none hover:scale-110"
                                                                title={fav.status === 'ACTIVE' ? (L('statusActive') || 'Aktif') : (L('statusPassive') || 'Pasif')}
                                                            >
                                                                <span className={`material-symbols-outlined text-[20px] transition-colors duration-200 ${fav.status === 'ACTIVE'
                                                                        ? 'text-[#1a73e8]'
                                                                        : 'text-[#dadce0] dark:text-[#5f6368] hover:text-[#9aa0a6]'
                                                                    }`}>
                                                                    {fav.status === 'ACTIVE' ? 'thumb_up' : 'thumb_up_off_alt'}
                                                                </span>
                                                            </button>
                                                        </td>

                                                        {/* Actions */}
                                                        <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                                                            <div className="flex items-center justify-end gap-1">
                                                                <button
                                                                    onClick={() => navigate(`/travel/hotels/detail/${fav.hotelId}`)}
                                                                    className="size-8 rounded-full text-[#5f6368] hover:bg-[#f1f3f4] dark:hover:bg-[#202124] dark:text-[#9aa0a6] transition-colors flex items-center justify-center cursor-pointer"
                                                                    title={L('viewHotelDetail')}
                                                                >
                                                                    <span className="material-symbols-outlined text-[18px]">visibility</span>
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeleteFavoriteItem(fav)}
                                                                    className="size-8 rounded-full text-[#5f6368] hover:bg-[#fce8e6] hover:text-[#d93025] dark:hover:bg-[#c5221f]/20 transition-colors flex items-center justify-center cursor-pointer"
                                                                    title={L('removeFromFavorites')}
                                                                >
                                                                    <span className="material-symbols-outlined text-[18px]">delete</span>
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan="6" className="px-4 py-12 text-center text-[#5f6368] dark:text-[#9aa0a6] text-xs font-medium italic">
                                                        {L('noFavoritesFound')}
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Standard Pagination Bar */}
                                <Pagination
                                    currentPage={favoritePage}
                                    totalPages={favoriteTotalPages}
                                    pageSize={favoritePageSize}
                                    totalElements={favoriteTotalElements}
                                    onPageChange={(p) => fetchFavoriteHotels(p, favoritePageSize)}
                                    onPageSizeChange={(s) => {
                                        setFavoritePageSize(s);
                                        fetchFavoriteHotels(0, s);
                                    }}
                                />
                            </div>
                        ) : null}
                    </div>
                </div>
            </main>

            {/* Google Material 3 Confirmation Modal */}
            {confirmModal.show && (
                <div className="fixed inset-0 z-[30000] flex items-center justify-center p-4">
                    <div
                        className="modal-overlay fixed inset-0 bg-[#202124]/40 backdrop-blur-sm transition-opacity animate-in fade-in-50"
                        onClick={() => setConfirmModal({ ...confirmModal, show: false })}
                    ></div>
                    <div className="relative bg-white dark:bg-[#202124] w-full max-w-sm rounded-[28px] shadow-2xl overflow-hidden border border-[#dadce0] dark:border-[#3c4043] animate-in zoom-in-95 duration-200 p-6 text-center">
                        {/* Google Icon Badge */}
                        <div className={`size-14 rounded-full flex items-center justify-center mx-auto mb-4 ${confirmModal.type === 'danger'
                                ? 'bg-[#fce8e6] text-[#d93025] dark:bg-red-950/40 dark:text-red-400'
                                : 'bg-[#e8f0fe] text-[#1a73e8] dark:bg-[#1a73e8]/20 dark:text-[#8ab4f8]'
                            }`}>
                            <span className="material-symbols-outlined text-2xl">
                                {confirmModal.type === 'danger' ? 'delete' : 'help'}
                            </span>
                        </div>

                        {/* Title & Message */}
                        <h3 className="text-base font-semibold text-[#202124] dark:text-white mb-2">
                            {confirmModal.title}
                        </h3>
                        <p className="text-xs text-[#5f6368] dark:text-[#9aa0a6] leading-relaxed mb-6">
                            {confirmModal.message}
                        </p>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={() => setConfirmModal({ ...confirmModal, show: false })}
                                className="flex-1 h-10 rounded-full text-xs font-medium text-[#1a73e8] dark:text-[#8ab4f8] bg-transparent hover:bg-[#e8f0fe] dark:hover:bg-[#303134] transition-colors"
                            >
                                {L('cancel')}
                            </button>
                            <button
                                type="button"
                                onClick={() => { confirmModal.onConfirm(); setConfirmModal({ ...confirmModal, show: false }); }}
                                className={`flex-1 h-10 rounded-full text-xs font-medium text-white shadow-sm transition-all active:scale-95 ${confirmModal.type === 'danger'
                                        ? 'bg-[#d93025] hover:bg-[#c5221f]'
                                        : 'bg-[#1a73e8] hover:bg-[#1765cc]'
                                    }`}
                            >
                                {L('confirm')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Google Material 3 User Modal */}
            {isUserModalOpen && (
                <div className="fixed inset-0 z-[20000] flex items-center justify-center p-4 overflow-y-auto">
                    <div className="modal-overlay fixed inset-0 bg-[#202124]/40 backdrop-blur-sm" onClick={() => setIsUserModalOpen(false)}></div>
                    <div className="relative bg-white dark:bg-[#202124] w-full max-w-xl rounded-[28px] shadow-2xl overflow-hidden border border-[#dadce0] dark:border-[#3c4043] animate-in zoom-in-95 duration-200">
                        {/* Header */}
                        <div className="p-6 border-b border-[#dadce0] dark:border-[#3c4043] flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="size-10 rounded-full bg-[#e8f0fe] dark:bg-[#1a73e8]/20 text-[#1a73e8] dark:text-[#8ab4f8] flex items-center justify-center shrink-0">
                                    <span className="material-symbols-outlined text-xl">{editingUser ? 'manage_accounts' : 'person_add'}</span>
                                </div>
                                <div>
                                    <h3 className="text-base font-semibold text-[#202124] dark:text-white">{editingUser ? L('editUser') : L('addUser')}</h3>
                                    <p className="text-xs text-[#5f6368] dark:text-[#9aa0a6]">{L('userInfo')}</p>
                                </div>
                            </div>
                            <button onClick={() => setIsUserModalOpen(false)} className="size-9 rounded-full flex items-center justify-center text-[#5f6368] dark:text-[#9aa0a6] hover:bg-[#f1f3f4] dark:hover:bg-[#303134] transition-colors">
                                <span className="material-symbols-outlined text-lg">close</span>
                            </button>
                        </div>

                        <form onSubmit={handleUserSubmit} className="p-6 space-y-4">
                            {userApiError && (
                                <div className="p-3.5 bg-[#fce8e6] dark:bg-red-950/30 border border-[#fad2cf] dark:border-red-900/40 rounded-2xl flex items-center gap-3 animate-in slide-in-from-top-2">
                                    <div className="size-8 bg-[#d93025] rounded-full flex items-center justify-center text-white shrink-0">
                                        <span className="material-symbols-outlined text-sm">error</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[11px] font-semibold text-[#d93025] dark:text-red-400">Hata Oluştu</p>
                                        <p className="text-xs text-[#5f6368] dark:text-[#dadce0] break-words">{userApiError}</p>
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-medium text-[#5f6368] dark:text-[#9aa0a6] ml-1 mb-1 block">Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={userFormData.name}
                                        onChange={(e) => setUserFormData(prev => ({ ...prev, name: e.target.value }))}
                                        className="w-full h-10 bg-white dark:bg-[#303134] border border-[#dadce0] dark:border-[#3c4043] rounded-xl px-3 text-xs text-[#202124] dark:text-white outline-none focus:border-[#1a73e8] focus:ring-1 focus:ring-[#1a73e8] transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-[#5f6368] dark:text-[#9aa0a6] ml-1 mb-1 block">Surname</label>
                                    <input
                                        type="text"
                                        required
                                        value={userFormData.surname}
                                        onChange={(e) => setUserFormData(prev => ({ ...prev, surname: e.target.value }))}
                                        className="w-full h-10 bg-white dark:bg-[#303134] border border-[#dadce0] dark:border-[#3c4043] rounded-xl px-3 text-xs text-[#202124] dark:text-white outline-none focus:border-[#1a73e8] focus:ring-1 focus:ring-[#1a73e8] transition-all"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-medium text-[#5f6368] dark:text-[#9aa0a6] ml-1 mb-1 block">Email Address</label>
                                <input
                                    type="email"
                                    required
                                    autoComplete="new-email"
                                    value={userFormData.email}
                                    onChange={(e) => setUserFormData(prev => ({ ...prev, email: e.target.value }))}
                                    className="w-full h-10 bg-white dark:bg-[#303134] border border-[#dadce0] dark:border-[#3c4043] rounded-xl px-3 text-xs text-[#202124] dark:text-white outline-none focus:border-[#1a73e8] focus:ring-1 focus:ring-[#1a73e8] transition-all"
                                />
                            </div>

                            {!editingUser && (
                                <div>
                                    <label className="text-xs font-medium text-[#5f6368] dark:text-[#9aa0a6] ml-1 mb-1 block">Password</label>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            required
                                            autoComplete="new-password"
                                            value={userFormData.password}
                                            onChange={(e) => setUserFormData(prev => ({ ...prev, password: e.target.value }))}
                                            className="w-full h-10 bg-white dark:bg-[#303134] border border-[#dadce0] dark:border-[#3c4043] rounded-xl pl-3 pr-10 text-xs text-[#202124] dark:text-white outline-none focus:border-[#1a73e8] focus:ring-1 focus:ring-[#1a73e8] transition-all"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 size-7 flex items-center justify-center text-[#5f6368] dark:text-[#9aa0a6] hover:text-[#1a73e8] transition-colors"
                                        >
                                            <span className="material-symbols-outlined text-base">
                                                {showPassword ? 'visibility_off' : 'visibility'}
                                            </span>
                                        </button>
                                    </div>
                                    <div className="mt-2.5 grid grid-cols-1 gap-1.5 p-3 bg-[#f8f9fa] dark:bg-[#303134]/50 rounded-xl border border-[#dadce0] dark:border-[#3c4043]">
                                        {[
                                            { key: 'length', label: 'Minimum 12 - Maksimum 16 karakter' },
                                            { key: 'uppercase', label: 'En az 1 büyük harf (A-Z)' },
                                            { key: 'lowercase', label: 'En az 1 küçük harf (a-z)' },
                                            { key: 'number', label: 'En az 1 rakam (0-9)' },
                                            { key: 'special', label: 'En az 1 özel karakter (!@#$%^&*)' },
                                        ].map(rule => {
                                            const isValid = validatePassword(userFormData.password)[rule.key];
                                            return (
                                                <div key={rule.key} className="flex items-center gap-2">
                                                    <div className={`size-4 rounded-full flex items-center justify-center transition-colors ${isValid ? 'bg-[#e6f4ea] text-[#137333]' : 'bg-[#f1f3f4] dark:bg-[#3c4043] text-[#5f6368] dark:text-[#9aa0a6]'}`}>
                                                        <span className="material-symbols-outlined text-[11px] font-bold">{isValid ? 'check' : 'close'}</span>
                                                    </div>
                                                    <span className={`text-[11px] font-medium transition-colors ${isValid ? 'text-[#137333] dark:text-emerald-400' : 'text-[#5f6368] dark:text-[#9aa0a6]'}`}>{rule.label}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            <PhoneInput
                                label="Phone Number"
                                value={(userFormData.phoneCountryCode?.startsWith('+') ? userFormData.phoneCountryCode : `+${userFormData.phoneCountryCode}`) + ' ' + userFormData.phoneNumber}
                                onChange={(val) => {
                                    const parts = val.split(' ');
                                    setUserFormData(prev => ({
                                        ...prev,
                                        phoneCountryCode: parts[0]?.replace('+', '') || '90',
                                        phoneNumber: parts[1] || ''
                                    }));
                                }}
                            />

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-medium text-[#5f6368] dark:text-[#9aa0a6] ml-1 mb-1 block">Role</label>
                                    <select
                                        multiple
                                        value={userFormData.roleIds}
                                        onChange={(e) => setUserFormData(prev => ({ ...prev, roleIds: Array.from(e.target.selectedOptions, option => parseInt(option.value)) }))}
                                        className="w-full min-h-[80px] bg-white dark:bg-[#303134] border border-[#dadce0] dark:border-[#3c4043] rounded-xl p-2 text-xs text-[#202124] dark:text-white outline-none focus:border-[#1a73e8] focus:ring-1 focus:ring-[#1a73e8]"
                                    >
                                        {roles.map(r => <option key={r.id} value={r.id} className="py-1 px-2 rounded">{r.roleName || r.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-[#5f6368] dark:text-[#9aa0a6] ml-1 mb-1 block">Status</label>
                                    <select
                                        value={userFormData.status}
                                        onChange={(e) => setUserFormData(prev => ({ ...prev, status: e.target.value }))}
                                        className="w-full h-10 bg-white dark:bg-[#303134] border border-[#dadce0] dark:border-[#3c4043] rounded-xl px-3 text-xs text-[#202124] dark:text-white outline-none focus:border-[#1a73e8] focus:ring-1 focus:ring-[#1a73e8]"
                                    >
                                        <option value="ACTIVE">Active</option>
                                        <option value="PASSIVE">Passive</option>
                                    </select>
                                </div>
                            </div>

                            <div className="pt-3 border-t border-[#dadce0] dark:border-[#3c4043] flex items-center justify-end gap-2.5">
                                <button
                                    type="button"
                                    onClick={() => setIsUserModalOpen(false)}
                                    className="h-10 px-5 rounded-full text-xs font-medium text-[#5f6368] dark:text-[#9aa0a6] hover:bg-[#f1f3f4] dark:hover:bg-[#303134] transition-colors"
                                >
                                    {L('cancel')}
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="h-10 px-6 bg-[#1a73e8] hover:bg-[#1765cc] text-white rounded-full text-xs font-medium shadow-sm active:scale-95 transition-all disabled:opacity-50"
                                >
                                    {saving ? L('processing') : L('saveUser')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Google Material 3 Guest Modal */}
            {isGuestModalOpen && (
                <div className="fixed inset-0 z-[20000] flex items-center justify-center p-4 overflow-y-auto">
                    <div className="modal-overlay fixed inset-0 bg-[#202124]/40 backdrop-blur-sm" onClick={() => setIsGuestModalOpen(false)}></div>
                    <div className="relative bg-white dark:bg-[#202124] w-full max-w-2xl rounded-[28px] shadow-2xl border border-[#dadce0] dark:border-[#3c4043] overflow-hidden animate-in zoom-in-95 duration-200">
                        {/* Header */}
                        <div className="p-6 border-b border-[#dadce0] dark:border-[#3c4043] flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="size-10 rounded-full bg-[#e8f0fe] dark:bg-[#1a73e8]/20 text-[#1a73e8] dark:text-[#8ab4f8] flex items-center justify-center shrink-0">
                                    <span className="material-symbols-outlined text-xl">{editingGuest ? 'badge' : 'person_add'}</span>
                                </div>
                                <div>
                                    <h3 className="text-base font-semibold text-[#202124] dark:text-white">{editingGuest ? L('editGuest') : L('addGuest')}</h3>
                                    <p className="text-xs text-[#5f6368] dark:text-[#9aa0a6]">{L('guestInfo')}</p>
                                </div>
                            </div>
                            <button onClick={() => setIsGuestModalOpen(false)} className="size-9 rounded-full flex items-center justify-center text-[#5f6368] dark:text-[#9aa0a6] hover:bg-[#f1f3f4] dark:hover:bg-[#303134] transition-colors">
                                <span className="material-symbols-outlined text-lg">close</span>
                            </button>
                        </div>

                        <form onSubmit={handleGuestSubmit} className="p-6 space-y-4">
                            {guestApiError && (
                                <div className="p-3.5 bg-[#fce8e6] dark:bg-red-950/30 border border-[#fad2cf] dark:border-red-900/40 rounded-2xl flex items-center gap-3 animate-in slide-in-from-top-2">
                                    <div className="size-8 bg-[#d93025] rounded-full flex items-center justify-center text-white shrink-0">
                                        <span className="material-symbols-outlined text-sm">error</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[11px] font-semibold text-[#d93025] dark:text-red-400">Hata Oluştu</p>
                                        <p className="text-xs text-[#5f6368] dark:text-[#dadce0] break-words">{guestApiError}</p>
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <label className="text-xs font-medium text-[#5f6368] dark:text-[#9aa0a6] ml-1 mb-1 block">Gender</label>
                                    <select
                                        value={guestFormData.gender}
                                        onChange={(e) => setGuestFormData(prev => ({ ...prev, gender: e.target.value }))}
                                        className="w-full h-10 bg-white dark:bg-[#303134] border border-[#dadce0] dark:border-[#3c4043] rounded-xl px-3 text-xs text-[#202124] dark:text-white outline-none focus:border-[#1a73e8] focus:ring-1 focus:ring-[#1a73e8]"
                                    >
                                        <option value="MALE">Mr</option>
                                        <option value="FEMALE">Mrs</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-[#5f6368] dark:text-[#9aa0a6] ml-1 mb-1 block">First Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={guestFormData.firstName}
                                        onChange={(e) => setGuestFormData(prev => ({ ...prev, firstName: e.target.value }))}
                                        className="w-full h-10 bg-white dark:bg-[#303134] border border-[#dadce0] dark:border-[#3c4043] rounded-xl px-3 text-xs text-[#202124] dark:text-white outline-none focus:border-[#1a73e8] focus:ring-1 focus:ring-[#1a73e8]"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-[#5f6368] dark:text-[#9aa0a6] ml-1 mb-1 block">Last Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={guestFormData.lastName}
                                        onChange={(e) => setGuestFormData(prev => ({ ...prev, lastName: e.target.value }))}
                                        className="w-full h-10 bg-white dark:bg-[#303134] border border-[#dadce0] dark:border-[#3c4043] rounded-xl px-3 text-xs text-[#202124] dark:text-white outline-none focus:border-[#1a73e8] focus:ring-1 focus:ring-[#1a73e8]"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-medium text-[#5f6368] dark:text-[#9aa0a6] ml-1 mb-1 block">Birth Date</label>
                                    <DatePicker
                                        selected={guestFormData.birthDate ? new Date(formatToPickerDate(guestFormData.birthDate)) : null}
                                        onChange={(date) => setGuestFormData(prev => ({ ...prev, birthDate: date ? formatToBackendDate(date.toISOString().split('T')[0]) : '' }))}
                                        dateFormat="dd.MM.yyyy"
                                        placeholderText="DD.MM.YYYY"
                                        showMonthDropdown
                                        showYearDropdown
                                        dropdownMode="select"
                                        className="w-full h-10 bg-white dark:bg-[#303134] border border-[#dadce0] dark:border-[#3c4043] rounded-xl px-3 text-xs text-[#202124] dark:text-white outline-none focus:border-[#1a73e8] focus:ring-1 focus:ring-[#1a73e8]"
                                        wrapperClassName="w-full"
                                    />
                                </div>
                                <div className="relative">
                                    <label className="text-xs font-medium text-[#5f6368] dark:text-[#9aa0a6] ml-1 mb-1 block">Country</label>
                                    <div
                                        onClick={() => setShowGuestCountries(!showGuestCountries)}
                                        className="w-full h-10 bg-white dark:bg-[#303134] border border-[#dadce0] dark:border-[#3c4043] rounded-xl px-3 flex items-center justify-between cursor-pointer group hover:border-[#1a73e8]"
                                    >
                                        <span className={`text-xs ${guestFormData.country ? 'font-medium text-[#202124] dark:text-white' : 'text-[#5f6368] dark:text-[#9aa0a6]'}`}>
                                            {guestFormData.country ? (
                                                <div className="flex items-center gap-2">
                                                    <span className="opacity-50 text-[10px] font-bold">{guestFormData.country}</span>
                                                    <span>{getCountryName(countries, guestFormData.country, currentLang)}</span>
                                                </div>
                                            ) : 'Select country...'}
                                        </span>
                                        <span className={`material-symbols-outlined text-[#5f6368] dark:text-[#9aa0a6] text-sm transition-transform ${showGuestCountries ? 'rotate-180' : ''}`}>expand_more</span>
                                    </div>

                                    {showGuestCountries && (
                                        <>
                                            <div className="fixed inset-0 z-[1001]" onClick={() => { setShowGuestCountries(false); setGuestCountrySearch(''); }} />
                                            <div className="absolute top-full left-0 right-0 mt-1 max-h-64 overflow-hidden bg-white dark:bg-[#202124] border border-[#dadce0] dark:border-[#3c4043] rounded-2xl shadow-2xl z-[1002] flex flex-col animate-in fade-in slide-in-from-top-2">
                                                <div className="p-2 border-b border-[#dadce0] dark:border-[#3c4043]">
                                                    <div className="relative">
                                                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#5f6368] dark:text-[#9aa0a6] text-sm">search</span>
                                                        <input
                                                            type="text"
                                                            placeholder="Search country..."
                                                            value={guestCountrySearch}
                                                            onChange={(e) => setGuestCountrySearch(e.target.value)}
                                                            autoFocus
                                                            className="w-full h-8 bg-[#f8f9fa] dark:bg-[#303134] border border-[#dadce0] dark:border-[#3c4043] rounded-full pl-8 pr-3 text-xs text-[#202124] dark:text-white outline-none focus:border-[#1a73e8]"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="flex-1 overflow-y-auto p-1.5 custom-scrollbar">
                                                    {countries
                                                        .filter(c => {
                                                            const name = (c.name?.translations?.[currentLang] || c.name?.translations?.en || c.name?.defaultName || '').toLowerCase();
                                                            return name.includes(guestCountrySearch.toLowerCase()) || c.alphaTwoCode.toLowerCase().includes(guestCountrySearch.toLowerCase());
                                                        })
                                                        .map(c => (
                                                            <div
                                                                key={c.id}
                                                                onClick={() => {
                                                                    setGuestFormData(prev => ({ ...prev, country: c.alphaTwoCode }));
                                                                    setShowGuestCountries(false);
                                                                    setGuestCountrySearch('');
                                                                }}
                                                                className={`px-3 py-2 rounded-xl text-xs cursor-pointer transition-colors flex items-center justify-between mb-0.5 ${guestFormData.country === c.alphaTwoCode ? 'bg-[#e8f0fe] dark:bg-[#1a73e8]/20 text-[#1a73e8] dark:text-[#8ab4f8] font-medium' : 'hover:bg-[#f1f3f4] dark:hover:bg-[#303134] text-[#202124] dark:text-[#dadce0]'}`}
                                                            >
                                                                <div className="flex items-center gap-2">
                                                                    <span className="opacity-60 text-[10px] w-6 uppercase font-mono">{c.alphaTwoCode}</span>
                                                                    <span>{c.name?.translations?.[currentLang] || c.name?.translations?.en || c.name?.defaultName}</span>
                                                                </div>
                                                                {guestFormData.country === c.alphaTwoCode && <span className="material-symbols-outlined text-sm">check</span>}
                                                            </div>
                                                        ))}
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-medium text-[#5f6368] dark:text-[#9aa0a6] ml-1 mb-1 block">Passport No</label>
                                    <input
                                        type="text"
                                        value={guestFormData.passportNo}
                                        onChange={(e) => setGuestFormData(prev => ({ ...prev, passportNo: e.target.value }))}
                                        className="w-full h-10 bg-white dark:bg-[#303134] border border-[#dadce0] dark:border-[#3c4043] rounded-xl px-3 text-xs text-[#202124] dark:text-white outline-none focus:border-[#1a73e8] focus:ring-1 focus:ring-[#1a73e8]"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-[#5f6368] dark:text-[#9aa0a6] ml-1 mb-1 block">Passport Expiry</label>
                                    <DatePicker
                                        selected={guestFormData.passportExpiry ? new Date(formatToPickerDate(guestFormData.passportExpiry)) : null}
                                        onChange={(date) => setGuestFormData(prev => ({ ...prev, passportExpiry: date ? formatToBackendDate(date.toISOString().split('T')[0]) : '' }))}
                                        dateFormat="dd.MM.yyyy"
                                        placeholderText="DD.MM.YYYY"
                                        showMonthDropdown
                                        showYearDropdown
                                        dropdownMode="select"
                                        className="w-full h-10 bg-white dark:bg-[#303134] border border-[#dadce0] dark:border-[#3c4043] rounded-xl px-3 text-xs text-[#202124] dark:text-white outline-none focus:border-[#1a73e8] focus:ring-1 focus:ring-[#1a73e8]"
                                        wrapperClassName="w-full"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-medium text-[#5f6368] dark:text-[#9aa0a6] ml-1 mb-1 block">Email Address</label>
                                    <input
                                        type="email"
                                        required
                                        value={guestFormData.email}
                                        onChange={(e) => setGuestFormData(prev => ({ ...prev, email: e.target.value }))}
                                        className="w-full h-10 bg-white dark:bg-[#303134] border border-[#dadce0] dark:border-[#3c4043] rounded-xl px-3 text-xs text-[#202124] dark:text-white outline-none focus:border-[#1a73e8] focus:ring-1 focus:ring-[#1a73e8]"
                                        placeholder="example@mail.com"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-[#5f6368] dark:text-[#9aa0a6] ml-1 mb-1 block">Status</label>
                                    <select
                                        value={guestFormData.status}
                                        onChange={(e) => setGuestFormData(prev => ({ ...prev, status: e.target.value }))}
                                        className="w-full h-10 bg-white dark:bg-[#303134] border border-[#dadce0] dark:border-[#3c4043] rounded-xl px-3 text-xs text-[#202124] dark:text-white outline-none focus:border-[#1a73e8] focus:ring-1 focus:ring-[#1a73e8]"
                                    >
                                        <option value="ACTIVE">Active</option>
                                        <option value="PASSIVE">Passive</option>
                                    </select>
                                </div>
                            </div>

                            <PhoneInput
                                label="Phone Number"
                                value={(guestFormData.phoneCountryCode?.startsWith('+') ? guestFormData.phoneCountryCode : `+${guestFormData.phoneCountryCode}`) + ' ' + guestFormData.phoneNumber}
                                onChange={(val) => {
                                    const parts = val.split(' ');
                                    setGuestFormData(prev => ({
                                        ...prev,
                                        phoneCountryCode: parts[0]?.replace('+', '') || '90',
                                        phoneNumber: parts[1] || ''
                                    }));
                                }}
                            />

                            <div className="pt-3 border-t border-[#dadce0] dark:border-[#3c4043] flex items-center justify-end gap-2.5">
                                <button
                                    type="button"
                                    onClick={() => setIsGuestModalOpen(false)}
                                    className="h-10 px-5 rounded-full text-xs font-medium text-[#5f6368] dark:text-[#9aa0a6] hover:bg-[#f1f3f4] dark:hover:bg-[#303134] transition-colors"
                                >
                                    {L('cancel')}
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="h-10 px-6 bg-[#1a73e8] hover:bg-[#1765cc] text-white rounded-full text-xs font-medium shadow-sm active:scale-95 transition-all disabled:opacity-50"
                                >
                                    {saving ? L('processing') : L('saveGuest')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {/* Fixed Audit Tooltip at Root Level (Never Clipped) */}
            {auditTooltip && (
                <div
                    style={{ left: `${auditTooltip.x}px`, top: `${auditTooltip.y}px` }}
                    className="fixed -translate-x-1/2 -translate-y-full z-[999999] w-80 sm:w-96 p-4 bg-[#202124]/95 dark:bg-[#171717]/95 backdrop-blur-md text-white rounded-2xl shadow-2xl border border-[#3c4043] text-xs pointer-events-none animate-in fade-in-50 zoom-in-95"
                >
                    <div className="font-medium text-white border-b border-[#3c4043] pb-2.5 mb-2.5 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm text-[#8ab4f8]">history</span>
                            <span>Audit & Record Details</span>
                        </div>
                        <span className="text-[10px] font-mono text-[#9aa0a6]">ID: #{auditTooltip.item.id || auditTooltip.item.hotelId}</span>
                    </div>
                    <div className="space-y-2 text-[#dadce0]">
                        <div className="flex justify-between items-center gap-3">
                            <span className="text-[#9aa0a6] font-medium shrink-0">Created At:</span>
                            <span className="font-medium text-white">{formatDateTime(auditTooltip.item.createDateTime)}</span>
                        </div>
                        <div className="flex justify-between items-center gap-3">
                            <span className="text-[#9aa0a6] font-medium shrink-0">Created By:</span>
                            <span className="font-medium text-white break-all">{auditTooltip.item.createdBy || auditTooltip.item.userEmail || 'System'}</span>
                        </div>
                        <div className="flex justify-between items-center gap-3 border-t border-[#3c4043]/50 pt-2">
                            <span className="text-[#9aa0a6] font-medium shrink-0">Updated At:</span>
                            <span className="font-medium text-white">{formatDateTime(auditTooltip.item.updateDateTime)}</span>
                        </div>
                        <div className="flex justify-between items-center gap-3">
                            <span className="text-[#9aa0a6] font-medium shrink-0">Updated By:</span>
                            <span className="font-medium text-white break-all">{auditTooltip.item.updatedBy || auditTooltip.item.userEmail || 'System'}</span>
                        </div>
                        <div className="flex justify-between items-center gap-3 border-t border-[#3c4043]/50 pt-2">
                            <span className="text-[#9aa0a6] font-medium shrink-0">Version:</span>
                            <span className="font-medium px-2 py-0.5 bg-[#1a73e8]/20 text-[#8ab4f8] rounded-full text-[10px]">v{auditTooltip.item.version ?? 0}</span>
                        </div>
                    </div>
                    {/* Down Arrow */}
                    <div className="absolute left-1/2 -bottom-1 -translate-x-1/2 size-2 bg-[#202124]/95 dark:bg-[#171717]/95 rotate-45 border-r border-b border-[#3c4043]"></div>
                </div>
            )}
        </>
    );
};

export default MyOffice;
