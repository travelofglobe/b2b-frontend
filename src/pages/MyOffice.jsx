import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { COMMON, getLang } from '../utils/sharedLocales';
import { MY_OFFICE_LOCALES } from '../utils/myOfficeLocales';
import * as XLSX from 'xlsx';
import { downloadPdfDoc, downloadXlsxWorkbook } from '../utils/fileDownloadHelper';

const MO = MY_OFFICE_LOCALES;
const tMO = (lang, key) => { 
    const l = getLang(lang); 
    return MO[l]?.[key] ?? MO.en[key] ?? COMMON[l]?.[key] ?? COMMON.en[key] ?? key; 
};

import { useNavigate, useSearchParams } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useAuth } from '../context/AuthContext';
import { useFavorites } from '../context/FavoritesContext';
import { agencyService } from '../services/agencyService';
import { geographyService } from '../services/geographyService';
import { userService, roleService } from '../services/userService';
import { guestService } from '../services/guestService';
import { currencyService } from '../services/currencyService';
import { favoriteService } from '../services/favoriteService';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import PhoneInput from '../components/PhoneInput';
import Pagination from '../components/Pagination';
import AppleSwitch from '../components/AppleSwitch';
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

const getCountryCode = (c) => {
    if (!c) return '';
    return c.countryIso2 || c.alphaTwoCode || c.code || c.countryCode || '';
};

const getCountryName = (countries, codeOrName, lang = 'tr') => {
    if (!codeOrName) return '';
    if (!Array.isArray(countries) || countries.length === 0) return codeOrName;
    const clean = String(codeOrName).trim().toLowerCase();
    const c = countries.find(x => {
        const code2 = (x.countryIso2 || x.alphaTwoCode || x.code || '').toLowerCase();
        const code3 = (x.countryIso3 || '').toLowerCase();
        const defaultN = (x.name?.defaultName || (typeof x.name === 'string' ? x.name : '') || x.asciiName || '').toLowerCase();
        const trN = (x.name?.translations?.tr || '').toLowerCase();
        const enN = (x.name?.translations?.en || '').toLowerCase();
        return code2 === clean || code3 === clean || defaultN === clean || trN === clean || enN === clean || String(x.id) === clean || String(x.locationId) === clean;
    });
    if (!c) return codeOrName;
    if (typeof c.name === 'string') return c.name;
    return c.name?.translations?.[lang] || c.name?.translations?.tr || c.name?.translations?.en || c.name?.defaultName || c.asciiName || getCountryCode(c) || codeOrName;
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

// Skeleton Loading Component
const TableSkeleton = ({ columns = 6, rows = 6 }) => (
    <>
        {[...Array(rows)].map((_, i) => (
            <tr key={`skel-row-${i}`} className="animate-pulse border-b border-[#dadce0]/50 dark:border-[#3c4043]/50">
                {[...Array(columns)].map((_, j) => (
                    <td key={`skel-col-${j}`} className="px-4 py-3.5">
                        <div className="h-4 bg-slate-200 dark:bg-slate-700/60 rounded-md w-3/4"></div>
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
    const [searchParams, setSearchParams] = useSearchParams();
    // Auth hook
    useAuth();
    const { isFavorite, addFavorite, refreshFavorites } = useFavorites();
    const { i18n } = useTranslation();
    const [currentLang, setCurrentLang] = useState(() => (i18n.language || localStorage.getItem('i18nextLng') || 'en').split('-')[0].toLowerCase());
    
    useEffect(() => {
        setCurrentLang((i18n.language || 'en').split('-')[0].toLowerCase());
        const handler = (lng) => setCurrentLang((lng || 'en').split('-')[0].toLowerCase());
        i18n.on('languageChanged', handler);
        return () => i18n.off('languageChanged', handler);
    }, [i18n]);

    const L = useCallback((key) => tMO(currentLang, key), [currentLang]);

    const initialTab = searchParams.get('tab') || 'general';
    const [activeTab, setActiveTab] = useState(initialTab);
    
    useEffect(() => {
        const param = searchParams.get('tab') || 'general';
        setActiveTab(param);
    }, [searchParams]);

    const handleTabChange = (tabId) => {
        setActiveTab(tabId);
        setSearchParams({ tab: tabId });
    };

    const [countries, setCountries] = useState([]);
    const [cities, setCities] = useState([]);
    const [, setFinCities] = useState([]);
    const [, setCurrencies] = useState([]);

    // Favorite Backend Table & Autocomplete State
    const [favoriteBackendItems, setFavoriteBackendItems] = useState([]);
    const [favoriteLoading, setFavoriteLoading] = useState(false);
    const [favoritePage, setFavoritePage] = useState(0);
    const [favoritePageSize, setFavoritePageSize] = useState(10);
    const [favoriteTotalPages, setFavoriteTotalPages] = useState(1);
    const [favoriteTotalElements, setFavoriteTotalElements] = useState(0);
    const [favoriteStatusFilter] = useState('');
    const [favoriteSearchQuery, setFavoriteSearchQuery] = useState('');
    const [favoriteCountryFilter, setFavoriteCountryFilter] = useState('');
    const [favoriteCityFilter, setFavoriteCityFilter] = useState('');
    const [favoriteRegionFilter, setFavoriteRegionFilter] = useState('');
    const [favoriteStarFilter, setFavoriteStarFilter] = useState([]);
    const [showFavCountryDropdown, setShowFavCountryDropdown] = useState(false);
    const [showFavStarDropdown, setShowFavStarDropdown] = useState(false);
    const [favCountrySearch, setFavCountrySearch] = useState('');
    const favCountryDropdownRef = useRef(null);
    const favStarDropdownRef = useRef(null);

    const [hotelAutocompleteQuery, setHotelAutocompleteQuery] = useState('');
    const [hotelAutocompleteResults, setHotelAutocompleteResults] = useState([]);
    const [hotelAutocompleteLoading, setHotelAutocompleteLoading] = useState(false);
    const [showHotelAutocompleteDropdown, setShowHotelAutocompleteDropdown] = useState(false);
    const hotelAutocompleteRef = useRef(null);

    const fetchFavoriteHotels = useCallback(async (page = 0, size = favoritePageSize) => {
        setFavoriteLoading(true);
        try {
            const res = await favoriteService.getFavorites(
                page, 
                size, 
                favoriteSearchQuery, 
                favoriteStatusFilter, 
                favoriteCountryFilter, 
                favoriteCityFilter,
                favoriteRegionFilter,
                favoriteStarFilter
            );
            if (res && Array.isArray(res.content)) {
                setFavoriteBackendItems(res.content);
                setFavoritePage(res.pageNumber || 0);
                setFavoriteTotalPages(res.totalPages || 1);
                setFavoriteTotalElements(res.totalElements || 0);
            } else {
                setFavoriteBackendItems([]);
                setFavoritePage(0);
                setFavoriteTotalPages(1);
                setFavoriteTotalElements(0);
            }
        } catch (err) {
            console.error('Failed to fetch favorite hotels from backend:', err);
            setFavoriteBackendItems([]);
            setFavoriteTotalElements(0);
        } finally {
            setFavoriteLoading(false);
        }
    }, [favoriteSearchQuery, favoriteStatusFilter, favoriteCountryFilter, favoriteCityFilter, favoriteRegionFilter, favoriteStarFilter, favoritePageSize]);

    useEffect(() => {
        if (activeTab === 'favorites') {
            fetchFavoriteHotels(0);
        }
    }, [activeTab, fetchFavoriteHotels]);

    const toggleFavoriteStarOption = (starValue) => {
        setFavoriteStarFilter(prev =>
            prev.includes(starValue)
                ? prev.filter(s => s !== starValue)
                : [...prev, starValue]
        );
    };

    const handleClearFavoriteFilters = () => {
        setFavoriteSearchQuery('');
        setFavoriteCountryFilter('');
        setFavoriteCityFilter('');
        setFavoriteRegionFilter('');
        setFavoriteStarFilter([]);
    };

    const hasActiveFavoriteFilters = Boolean(
        favoriteSearchQuery.trim() ||
        favoriteCountryFilter ||
        favoriteCityFilter.trim() ||
        favoriteRegionFilter.trim() ||
        favoriteStarFilter.length > 0
    );

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
            } catch (err) {
                console.error('Failed to search hotels for add:', err);
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
            if (favCountryDropdownRef.current && !favCountryDropdownRef.current.contains(event.target)) {
                setShowFavCountryDropdown(false);
            }
            if (favStarDropdownRef.current && !favStarDropdownRef.current.contains(event.target)) {
                setShowFavStarDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleToggleFavoriteStatus = async (item) => {
        try {
            await favoriteService.toggleStatus(item.id);
            showNotification('Favori otel durumu güncellendi', 'success');
            fetchFavoriteHotels(favoritePage);
            refreshFavorites();
        } catch (err) {
            console.error(err);
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
                    showNotification('Favori otel silindi', 'success');
                    fetchFavoriteHotels(favoritePage);
                    refreshFavorites();
                } catch {
                    showNotification('Silme işlemi başarısız', 'error');
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
            showNotification(`"${hotel.hotelName || 'Otel'}" favorilere eklendi`, 'success');
            setHotelAutocompleteQuery('');
            setShowHotelAutocompleteDropdown(false);
            fetchFavoriteHotels(0);
        } catch {
            showNotification('Favori ekleme hatası', 'error');
        }
    };

    const [loading, setLoading] = useState(true);
    const [usersLoading, setUsersLoading] = useState(false);
    const [guestsLoading, setGuestsLoading] = useState(false);
    const [statsLoading, setStatsLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    // error removed
    const [, setError] = useState(null);

    const [isExportingUserExcel, setIsExportingUserExcel] = useState(false);
    const [isExportingUserPdf, setIsExportingUserPdf] = useState(false);
    const [isExportingGuestExcel, setIsExportingGuestExcel] = useState(false);
    const [isExportingGuestPdf, setIsExportingGuestPdf] = useState(false);
    const [isExportingFavExcel, setIsExportingFavExcel] = useState(false);
    const [isExportingFavPdf, setIsExportingFavPdf] = useState(false);

    const [mapCenter, setMapCenter] = useState([36.6826845, 30.9089719]);
    const [zoom] = useState(13);
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

    // Update Password Modal state
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [passwordTargetUser, setPasswordTargetUser] = useState(null);
    const [updatePasswordValue, setUpdatePasswordValue] = useState('');
    const [showUpdatePasswordText, setShowUpdatePasswordText] = useState(false);
    const [passwordModalError, setPasswordModalError] = useState(null);
    const [isPasswordSubmitting, setIsPasswordSubmitting] = useState(false);

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
    // guest country search modal helper removed

    // Form data (General Info)
    const [formData, setFormData] = useState({
        id: null,
        name: '',
        officialTitle: '',
        agencyType: '',
        defaultLanguage: 'EN',
        parentId: '',
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
                geographyService.listCountries(signal),
                currencyService.listActiveCurrencies(signal)
            ]);

            const countryList = Array.isArray(countriesData) ? countriesData : (countriesData?.regionList || countriesData?.locationList || countriesData?.data || []);
            setCountries(countryList);
            setCurrencies(currenciesData || []);

            let initialCities = [];
            if (agencyData.countryId) {
                try {
                    const citiesData = await geographyService.listSubRegions(agencyData.countryId);
                    initialCities = citiesData.regionList || citiesData.locationList || [];
                } catch (err) { console.error(err); }
            }
            setCities(initialCities);

            let initialFinCities = [];
            if (agencyData.agencyFinancialInfo?.countryId) {
                try {
                    const finCitiesData = await geographyService.listSubRegions(agencyData.agencyFinancialInfo.countryId);
                    initialFinCities = finCitiesData.regionList || finCitiesData.locationList || [];
                } catch (err) { console.error(err); }
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

        const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'];
        if (!allowedTypes.includes(file.type)) {
            showNotification(L('logoInvalidFormat'), 'error');
            e.target.value = '';
            return;
        }

        const MAX_SIZE = 2 * 1024 * 1024;
        if (file.size > MAX_SIZE) {
            showNotification(L('logoSizeExceeded'), 'error');
            e.target.value = '';
            return;
        }

        setLogoUploading(true);
        try {
            await agencyService.uploadLogo(file);
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
            title: L('deleteLogoTitle') || 'Logoyu Sil',
            message: L('confirmDeleteLogo') || 'Acente logosunu silmek istediğinize emin misiniz?',
            type: 'danger',
            onConfirm: async () => {
                try {
                    await agencyService.deleteLogo();
                    if (logoUrl) URL.revokeObjectURL(logoUrl);
                    setLogoUrl(null);
                    showNotification(L('logoDeleteSuccess') || 'Logo başarıyla silindi.');
                } catch (err) {
                    showNotification(err.message || L('logoDeleteError') || 'Logo silinirken hata oluştu.', 'error');
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
                const citiesData = await geographyService.listSubRegions(countryId);
                setCities(citiesData.regionList || citiesData.locationList || []);
            } catch (err) { console.error(err); setCities([]); }
        } else { setCities([]); }
    };

// handleFinCountryChange omitted

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
        if (e) e.preventDefault();
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
            showNotification(L('profileUpdated') || 'Profil başarıyla güncellendi.');
            await fetchInitialData();
        } catch (err) {
            showNotification(err.message || L('updateFailed'), 'error');
        } finally {
            setSaving(false);
        }
    };

    const openAddUser = () => { 
        setUserApiError(null); 
        setShowPassword(false); 
        setEditingUser(null); 
        setUserFormData({ name: '', surname: '', email: '', password: '', phoneCountryCode: '90', phoneNumber: '', status: 'ACTIVE', roleIds: [] }); 
        setIsUserModalOpen(true); 
    };

    const openEditUser = (u) => { 
        setUserApiError(null); 
        setShowPassword(false); 
        setEditingUser(u); 
        setUserFormData({ 
            name: u.name, 
            surname: u.surname, 
            email: u.email, 
            phoneCountryCode: u.phoneCountryCode || '90', 
            phoneNumber: u.phoneNumber || '', 
            status: u.status || 'ACTIVE', 
            roleIds: u.roles?.map(r => r.id) || [] 
        }); 
        setIsUserModalOpen(true); 
    };

    const validatePassword = (p) => ({
        length: (p || '').length >= 12,
        uppercase: /[A-Z]/.test(p || ''),
        lowercase: /[a-z]/.test(p || ''),
        number: /[0-9]/.test(p || ''),
        special: /[!@#$%^&*()_+\-=[\]{};':"|,.<>/?]/.test(p || '') || /[^A-Za-z0-9]/.test(p || '')
    });

    const openUpdatePasswordModal = (u) => {
        setPasswordTargetUser(u);
        setUpdatePasswordValue('');
        setShowUpdatePasswordText(false);
        setPasswordModalError(null);
        setIsPasswordModalOpen(true);
    };

    const handleUpdatePasswordSubmit = async (e) => {
        e.preventDefault();
        if (!passwordTargetUser) return;

        const v = validatePassword(updatePasswordValue);
        const allRulesMet = v.length && v.uppercase && v.lowercase && v.number && v.special;
        if (!allRulesMet) {
            setPasswordModalError(L('pleaseMeetAllPasswordRules') || 'Lütfen tüm şifre kurallarını karşılayın.');
            return;
        }

        try {
            setIsPasswordSubmitting(true);
            setPasswordModalError(null);

            await userService.updatePassword(passwordTargetUser.id, updatePasswordValue);

            showNotification(L('passwordUpdated') || 'Kullanıcı şifresi başarıyla güncellendi.');
            setIsPasswordModalOpen(false);
            setPasswordTargetUser(null);
            setUpdatePasswordValue('');
        } catch (err) {
            console.error('Password update error:', err);
            setPasswordModalError(err.message || L('updateFailed') || 'Şifre güncellenirken bir hata oluştu.');
        } finally {
            setIsPasswordSubmitting(false);
        }
    };

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
            setIsUserModalOpen(false); 
            fetchUsersData();
            const sumData = await userService.getSummary(); 
            setSummary(prev => ({ ...prev, totalCount: sumData.totalCount, activeCount: sumData.activeCount, passiveCount: sumData.passiveCount }));
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
            L('deleteUser') || 'Kullanıcıyı Sil',
            L('deleteUserMsg') || 'Bu kullanıcının tüm erişim yetkileri anında iptal edilecektir. Devam etmek istiyor musunuz?',
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
            L('deleteGuest') || 'Misafiri Sil',
            L('deleteGuestMsg') || 'Bu misafiri CRM kayıtlarınızdan silmek istediğinize emin misiniz?',
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

    const openAddGuest = () => { 
        setGuestApiError(null); 
        setEditingGuest(null); 
        setGuestFormData({ gender: 'MALE', firstName: '', lastName: '', birthDate: '', country: '', passportNo: '', passportExpiry: '', email: '', phoneCountryCode: '90', phoneNumber: '', status: 'ACTIVE' }); 
        setIsGuestModalOpen(true); 
    };

    const openEditGuest = (g) => { 
        setGuestApiError(null); 
        setEditingGuest(g); 
        setGuestFormData({ 
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
            status: g.status || 'ACTIVE' 
        }); 
        setIsGuestModalOpen(true); 
    };

    const fetchAllFilteredUsers = async () => {
        try {
            const response = await userService.filterUsers(userFilters, 0, 10000);
            return response.agencyUsers || response.content || [];
        } catch (err) {
            console.error("Failed to fetch all users for export", err);
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
            return response.guests || response.agencyCrmGuests || response.content || [];
        } catch (err) {
            console.error("Failed to fetch all guests for export", err);
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
                [L('colGuest') || 'Guest']: `${g.firstName || ''} ${g.lastName || ''}`.trim(),
                [L('gender') || 'Gender']: g.gender || '-',
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
                { wch: 10 },
                { wch: 14 },
                { wch: 20 },
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

            const headers = ['ID', L('colGuest') || 'Guest', L('gender') || 'Gender', L('birthDate') || 'Birth Date', L('country') || 'Country', L('passportNo') || 'Passport No', 'Email', 'Phone', L('colStatus') || 'Status'];
            const rows = allGuests.map(g => [
                g.id ?? '',
                `${g.firstName || ''} ${g.lastName || ''}`.trim(),
                g.gender || '-',
                g.birthDate || '-',
                getCountryName(countries, g.country, currentLang) || g.country || '-',
                g.passportNo || '-',
                g.email || '-',
                g.phoneNumber ? `+${g.phoneCountryCode || ''}${g.phoneNumber}` : '-',
                g.status === 'ACTIVE' ? L('active') : L('passive')
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
            const res = await favoriteService.getFavorites(
                0,
                10000,
                favoriteSearchQuery,
                favoriteStatusFilter,
                favoriteCountryFilter,
                favoriteCityFilter,
                favoriteRegionFilter,
                favoriteStarFilter
            );
            return res?.content || [];
        } catch (err) {
            console.error("Failed to fetch all favorites for export", err);
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

            const exportData = allFavs.map(f => {
                const starVal = f.hotelStar ?? f.stars;
                return {
                    'Hotel ID': f.hotelId ?? '',
                    [L('hotelName') || 'Hotel Name']: f.hotelName || 'N/A',
                    [L('hotelCountry') || 'Otel Ülkesi']: f.hotelCountry || f.countryName || f.countryCode || 'N/A',
                    [L('hotelCity') || 'Otel Şehri']: f.hotelCity || f.cityName || 'N/A',
                    [L('hotelRegion') || 'Otel Bölgesi']: f.hotelRegion || f.regionName || 'N/A',
                    [L('starsLabel') || 'Yıldız']: (starVal !== null && starVal !== undefined && Number(starVal) > 0) ? `${starVal} ★` : 'N/A',
                    [L('colStatus') || 'Status']: f.status === 'ACTIVE' ? L('active') : L('passive'),
                    [L('created') || 'Created By']: f.createdBy || 'N/A',
                    [L('addedOn') || 'Created Date']: f.createDateTime ? new Date(f.createDateTime).toLocaleString() : (f.createdDate ? new Date(f.createdDate).toLocaleString() : 'N/A')
                };
            });

            const worksheet = XLSX.utils.json_to_sheet(exportData);
            worksheet['!cols'] = [
                { wch: 12 },
                { wch: 32 },
                { wch: 20 },
                { wch: 20 },
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

            const headers = ['Hotel ID', L('hotelName') || 'Hotel Name', L('hotelCountry') || 'Otel Ülkesi', L('hotelCity') || 'Otel Şehri', L('hotelRegion') || 'Otel Bölgesi', L('starsLabel') || 'Yıldız', L('colStatus') || 'Status', L('created') || 'Created By', L('addedOn') || 'Created Date'];
            const rows = allFavs.map(f => {
                const starVal = f.hotelStar ?? f.stars;
                return [
                    f.hotelId ?? '',
                    f.hotelName || 'N/A',
                    f.hotelCountry || f.countryName || f.countryCode || 'N/A',
                    f.hotelCity || f.cityName || 'N/A',
                    f.hotelRegion || f.regionName || 'N/A',
                    (starVal !== null && starVal !== undefined && Number(starVal) > 0) ? `${starVal} ★` : 'N/A',
                    f.status === 'ACTIVE' ? L('active') : L('passive'),
                    f.createdBy || 'N/A',
                    f.createDateTime ? new Date(f.createDateTime).toLocaleString() : (f.createdDate ? new Date(f.createdDate).toLocaleString() : 'N/A')
                ];
            });

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

    const openInMaps = () => { 
        const addressStr = `${formData.address} ${formData.zipCode}`; 
        const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addressStr)}`; 
        window.open(url, '_blank'); 
    };

    if (loading) { 
        return (
            <div className="flex-1 flex items-center justify-center min-h-[400px] bg-[#f8f9fa] dark:bg-[#18191c]">
                <div className="flex flex-col items-center gap-3">
                    <div className="size-10 border-3 border-[#1a73e8] border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-xs font-medium text-[#5f6368] dark:text-[#9aa0a6]">Yükleniyor...</span>
                </div>
            </div>
        ); 
    }

    return (
        <div className="flex-1 flex flex-col min-h-0 bg-[#f8f9fa] dark:bg-[#18191c] overflow-y-auto font-roboto">
            {/* Toast Notification */}
            {toast.show && (
                <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[10000] animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="px-4 py-2.5 bg-[#202124] dark:bg-[#e8eaed] text-white dark:text-[#202124] shadow-lg rounded-full flex items-center gap-2.5 border border-[#3c4043] dark:border-transparent">
                        <div className={`size-2 rounded-full ${toast.type === 'success' ? 'bg-[#34a853]' : 'bg-[#ea4335]'} animate-pulse`}></div>
                        <p className="text-xs font-medium tracking-normal">{toast.message}</p>
                    </div>
                </div>
            )}

            {/* Page Header Bar */}
            <header className="sticky top-0 bg-white/95 dark:bg-[#202124]/95 backdrop-blur-md border-b border-[#dadce0] dark:border-[#3c4043] px-6 sm:px-10 lg:px-12 xl:px-14 py-3.5 flex-shrink-0 z-30 transition-all shadow-2xs">
                <div className="max-w-[1440px] mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    {/* Left: Icon & Page Title */}
                    <div className="flex items-center gap-3.5">
                        <div className="w-11 h-11 rounded-2xl bg-[#e8f0fe] dark:bg-[#1a73e8]/20 flex items-center justify-center text-[#1a73e8] dark:text-[#8ab4f8] shrink-0 shadow-2xs">
                            <span className="material-symbols-outlined text-[24px]">corporate_fare</span>
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-xl font-bold text-[#202124] dark:text-[#e8eaed] tracking-tight">{L('title')}</h1>
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#e8f0fe] text-[#1a73e8] dark:bg-[#1a73e8]/20 dark:text-[#8ab4f8]">
                                    {formData.agencyType || 'AGENCY'}
                                </span>
                            </div>
                            <p className="text-xs text-[#5f6368] dark:text-[#9aa0a6] mt-0.5">
                                {activeTab === 'general' ? 'Acente profilini, kurumsal kimlik ve mali bilgilerinizi yönetin'
                                    : activeTab === 'users' ? 'Acente personeli, yetkilendirmeler ve kullanıcı hesapları'
                                    : activeTab === 'guests' ? 'Misafir CRM rehberi, pasaport ve seyahat geçmişi'
                                    : 'Acentenize özel favori ve önerilen oteller'}
                            </p>
                        </div>
                    </div>

                    {/* Right: Tab-specific Header Actions */}
                    <div className="flex items-center gap-2.5">
                        {activeTab === 'general' && (
                            <>
                                <button
                                    type="button"
                                    onClick={() => fetchInitialData()}
                                    disabled={loading || saving}
                                    className="flex items-center gap-1.5 px-3.5 py-2 bg-white dark:bg-[#303134] hover:bg-[#f1f3f4] dark:hover:bg-[#3c4043] border border-[#dadce0] dark:border-[#5f6368] rounded-xl text-xs font-medium text-[#3c4043] dark:text-slate-200 transition-all shadow-xs cursor-pointer disabled:opacity-50"
                                >
                                    <span className="material-symbols-outlined text-[17px]">refresh</span>
                                    <span>Yenile</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={handleSubmit}
                                    disabled={saving}
                                    className="flex items-center gap-1.5 px-4 py-2 bg-[#1a73e8] hover:bg-[#1557b0] text-white rounded-xl text-xs font-medium transition-all shadow-xs active:scale-95 cursor-pointer disabled:opacity-50"
                                >
                                    {saving ? (
                                        <div className="size-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    ) : (
                                        <span className="material-symbols-outlined text-[17px]">save</span>
                                    )}
                                    <span>{saving ? (L('saving') || 'Kaydediliyor...') : (L('saveBtn') || 'Değişiklikleri Kaydet')}</span>
                                </button>
                            </>
                        )}

                        {activeTab === 'users' && (
                            <button
                                type="button"
                                onClick={openAddUser}
                                className="flex items-center gap-1.5 px-4 py-2 bg-[#1a73e8] hover:bg-[#1557b0] text-white rounded-xl text-xs font-medium transition-all shadow-xs active:scale-95 cursor-pointer"
                            >
                                <span className="material-symbols-outlined text-[18px]">person_add</span>
                                <span>{L('addUser') || 'Yeni Kullanıcı Ekle'}</span>
                            </button>
                        )}

                        {activeTab === 'guests' && (
                            <button
                                type="button"
                                onClick={openAddGuest}
                                className="flex items-center gap-1.5 px-4 py-2 bg-[#1a73e8] hover:bg-[#1557b0] text-white rounded-xl text-xs font-medium transition-all shadow-xs active:scale-95 cursor-pointer"
                            >
                                <span className="material-symbols-outlined text-[18px]">person_add</span>
                                <span>{L('addGuest') || 'Yeni Misafir Ekle'}</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Tab Navigation Pill Bar */}
                <div className="max-w-[1440px] mx-auto mt-3.5 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                    {[
                        { id: 'general', icon: 'info', label: L('tabGeneral') || 'Genel Bilgiler' },
                        { id: 'users', icon: 'groups', label: L('tabUsers') || 'Kullanıcılar', count: summary.totalCount },
                        { id: 'guests', icon: 'recent_actors', label: L('tabGuests') || 'Misafirler', count: summary.totalGuestCount },
                        { id: 'favorites', icon: 'bookmark', label: L('tabFavorites') || 'Favori Oteller', count: favoriteTotalElements },
                    ].map((tab) => {
                        const isCurrent = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => handleTabChange(tab.id)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all whitespace-nowrap cursor-pointer border ${isCurrent
                                    ? 'bg-[#e8f0fe] border-[#1a73e8] text-[#1a73e8] dark:bg-[#1a73e8]/20 dark:border-[#8ab4f8] dark:text-[#8ab4f8] shadow-xs'
                                    : 'bg-white dark:bg-[#202124] border-[#dadce0] dark:border-[#3c4043] text-[#5f6368] dark:text-[#9aa0a6] hover:bg-[#f1f3f4] dark:hover:bg-[#303134]'
                                }`}
                            >
                                <span className={`material-symbols-outlined text-[18px] ${isCurrent ? 'text-[#1a73e8] dark:text-[#8ab4f8]' : 'text-[#70757a]'}`}>{tab.icon}</span>
                                <span>{tab.label}</span>
                                {tab.count != null && tab.count > 0 && (
                                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${isCurrent ? 'bg-[#1a73e8] text-white dark:bg-[#8ab4f8] dark:text-[#202124]' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>
                                        {tab.count}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </header>

            {/* Main Content Area */}
            <main className="max-w-[1440px] w-full mx-auto px-6 sm:px-10 lg:px-12 xl:px-14 py-6">
                {/* ─── TAB 1: GENERAL INFO ──────────────────────────────────── */}
                {activeTab === 'general' && (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Profile Header Hero Card */}
                        <div className="bg-white dark:bg-[#202124] border border-[#dadce0] dark:border-[#3c4043] rounded-2xl p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
                                {/* Logo Avatar Container */}
                                <div className="relative group shrink-0">
                                    <input
                                        ref={logoInputRef}
                                        type="file"
                                        accept="image/png,image/jpeg,image/jpg,image/svg+xml"
                                        className="hidden"
                                        onChange={handleLogoFileSelect}
                                    />
                                    <div className="size-20 rounded-2xl border-2 border-dashed border-[#dadce0] dark:border-[#5f6368] bg-[#f8f9fa] dark:bg-[#303134] flex items-center justify-center overflow-hidden transition-all group-hover:border-[#1a73e8]">
                                        {logoLoading || logoUploading ? (
                                            <div className="size-6 border-2 border-[#1a73e8] border-t-transparent rounded-full animate-spin"></div>
                                        ) : logoUrl ? (
                                            <img src={logoUrl} alt="Logo" className="w-full h-full object-contain p-1.5" />
                                        ) : (
                                            <span className="material-symbols-outlined text-[32px] text-[#70757a]">domain</span>
                                        )}
                                    </div>
                                    <div className="absolute -bottom-2 -right-2 flex items-center gap-1">
                                        <button
                                            type="button"
                                            onClick={() => logoInputRef.current?.click()}
                                            disabled={logoUploading}
                                            className="size-7 rounded-full bg-white dark:bg-[#202124] border border-[#dadce0] dark:border-[#5f6368] shadow-sm flex items-center justify-center text-[#1a73e8] hover:bg-[#e8f0fe] transition-colors cursor-pointer"
                                            title="Logo Değiştir"
                                        >
                                            <span className="material-symbols-outlined text-[15px]">edit</span>
                                        </button>
                                        {logoUrl && (
                                            <button
                                                type="button"
                                                onClick={handleDeleteLogo}
                                                disabled={logoUploading}
                                                className="size-7 rounded-full bg-white dark:bg-[#202124] border border-[#dadce0] dark:border-[#5f6368] shadow-sm flex items-center justify-center text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                                                title="Logo Sil"
                                            >
                                                <span className="material-symbols-outlined text-[15px]">delete</span>
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Title & Metadata */}
                                <div className="space-y-1.5">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h2 className="text-xl font-bold text-[#202124] dark:text-[#e8eaed]">{formData.name || 'Acente Adı'}</h2>
                                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#e8f0fe] text-[#1a73e8] dark:bg-[#1a73e8]/20 dark:text-[#8ab4f8]">
                                            {formData.agencyType || 'AGENCY'}
                                        </span>
                                        <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                                            {formData.currency || 'EUR'}
                                        </span>
                                    </div>
                                    <p className="text-xs text-[#5f6368] dark:text-[#9aa0a6]">{formData.officialTitle || 'Resmi Ticari Unvan Belirtilmedi'}</p>
                                    <div className="flex flex-wrap items-center gap-3 text-xs text-[#70757a] pt-1">
                                        <span className="flex items-center gap-1">
                                            <span className="material-symbols-outlined text-[15px]">location_on</span>
                                            {formData.cityName || '-'}, {formData.countryName || '-'}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <span className="material-symbols-outlined text-[15px]">mail</span>
                                            {formData.email || '-'}
                                        </span>
                                        {formData.phoneNumber && (
                                            <span className="flex items-center gap-1">
                                                <span className="material-symbols-outlined text-[15px]">call</span>
                                                +{formData.phoneCountryCode} {formData.phoneNumber}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Audit Metadata Card */}
                            <div className="shrink-0 w-full md:w-auto self-stretch md:self-auto flex flex-col justify-center bg-[#f8f9fa] dark:bg-[#303134]/50 border border-[#dadce0]/80 dark:border-[#3c4043] rounded-xl px-4 py-3 min-w-[270px]">
                                <div className="text-[10px] font-bold text-[#70757a] uppercase tracking-wider mb-2 flex items-center gap-1.5 pb-1.5 border-b border-[#dadce0]/60 dark:border-[#3c4043]">
                                    <span className="material-symbols-outlined text-[13px] text-[#1a73e8]">verified_user</span>
                                    <span>Kayıt ve Denetim Bilgisi</span>
                                </div>
                                <div className="space-y-1.5 text-xs">
                                    <div className="flex items-center justify-between gap-4">
                                        <span className="text-[11px] text-[#5f6368] dark:text-[#9aa0a6] flex items-center gap-1.5">
                                            <span className="material-symbols-outlined text-[14px] text-[#70757a]">calendar_add_on</span>
                                            <span>Kayıt Tarihi</span>
                                        </span>
                                        <span className="font-medium text-[#202124] dark:text-white tabular-nums">
                                            {formatDateTime(formData.createDateTime)}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between gap-4">
                                        <span className="text-[11px] text-[#5f6368] dark:text-[#9aa0a6] flex items-center gap-1.5">
                                            <span className="material-symbols-outlined text-[14px] text-[#70757a]">update</span>
                                            <span>Son Güncelleme</span>
                                        </span>
                                        <span className="font-medium text-[#202124] dark:text-white tabular-nums">
                                            {formatDateTime(formData.updateDateTime)}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between gap-4">
                                        <span className="text-[11px] text-[#5f6368] dark:text-[#9aa0a6] flex items-center gap-1.5">
                                            <span className="material-symbols-outlined text-[14px] text-[#70757a]">person</span>
                                            <span>Güncelleyen</span>
                                        </span>
                                        <span
                                            className="font-medium text-[#1a73e8] dark:text-[#8ab4f8] max-w-[150px] truncate"
                                            title={formData.updatedBy || formData.createdBy || '-'}
                                        >
                                            {formData.updatedBy || formData.createdBy || '-'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Structured 4-Card Form Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Card 1: Temel Acente Bilgileri */}
                            <div className="bg-white dark:bg-[#202124] border border-[#dadce0] dark:border-[#3c4043] rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
                                <div className="flex items-center gap-2.5 pb-3 border-b border-[#dadce0]/70 dark:border-[#3c4043]">
                                    <div className="size-8 rounded-xl bg-[#e8f0fe] text-[#1a73e8] dark:bg-[#1a73e8]/20 dark:text-[#8ab4f8] flex items-center justify-center">
                                        <span className="material-symbols-outlined text-[19px]">domain</span>
                                    </div>
                                    <h3 className="text-sm font-bold text-[#202124] dark:text-white">Temel Acente Bilgileri</h3>
                                </div>

                                <div className="space-y-3.5">
                                    <div>
                                        <label className="text-xs font-semibold text-[#5f6368] dark:text-[#9aa0a6] uppercase tracking-wide block mb-1">
                                            Acente Ticari Adı
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.name || ''}
                                            onChange={(e) => handleInputChange('name', e.target.value)}
                                            placeholder="Acente adı giriniz"
                                            className="w-full h-10 px-3.5 bg-white dark:bg-[#303134] border border-[#dadce0] dark:border-[#5f6368] focus:border-[#1a73e8] rounded-xl text-xs text-[#202124] dark:text-white outline-none transition-all shadow-2xs"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-xs font-semibold text-[#5f6368] dark:text-[#9aa0a6] uppercase tracking-wide block mb-1">
                                            Resmi Ticari Unvan
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.officialTitle || ''}
                                            onChange={(e) => handleInputChange('officialTitle', e.target.value)}
                                            placeholder="Ticaret sicilindeki tam şirket unvanı"
                                            className="w-full h-10 px-3.5 bg-white dark:bg-[#303134] border border-[#dadce0] dark:border-[#5f6368] focus:border-[#1a73e8] rounded-xl text-xs text-[#202124] dark:text-white outline-none transition-all shadow-2xs"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-xs font-semibold text-[#5f6368] dark:text-[#9aa0a6] uppercase tracking-wide block mb-1">
                                                Acente Türü
                                            </label>
                                            <input
                                                type="text"
                                                readOnly
                                                value={formData.agencyType || 'AGENCY'}
                                                className="w-full h-10 px-3.5 bg-[#f8f9fa] dark:bg-[#303134]/50 border border-[#dadce0] dark:border-[#5f6368] rounded-xl text-xs font-medium text-[#70757a] cursor-not-allowed outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-semibold text-[#5f6368] dark:text-[#9aa0a6] uppercase tracking-wide block mb-1">
                                                Varsayılan Dil
                                            </label>
                                            <select
                                                value={formData.defaultLanguage || 'TR'}
                                                onChange={(e) => handleInputChange('defaultLanguage', e.target.value)}
                                                className="w-full h-10 px-3.5 bg-white dark:bg-[#303134] border border-[#dadce0] dark:border-[#5f6368] focus:border-[#1a73e8] rounded-xl text-xs text-[#202124] dark:text-white outline-none transition-all shadow-2xs cursor-pointer"
                                            >
                                                <option value="TR">Türkçe (TR)</option>
                                                <option value="EN">English (EN)</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Card 2: İletişim Bilgileri */}
                            <div className="bg-white dark:bg-[#202124] border border-[#dadce0] dark:border-[#3c4043] rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
                                <div className="flex items-center gap-2.5 pb-3 border-b border-[#dadce0]/70 dark:border-[#3c4043]">
                                    <div className="size-8 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 flex items-center justify-center">
                                        <span className="material-symbols-outlined text-[19px]">call</span>
                                    </div>
                                    <h3 className="text-sm font-bold text-[#202124] dark:text-white">İletişim Bilgileri</h3>
                                </div>

                                <div className="space-y-3.5">
                                    <div>
                                        <label className="text-xs font-semibold text-[#5f6368] dark:text-[#9aa0a6] uppercase tracking-wide block mb-1">
                                            Acente E-posta Adresi
                                        </label>
                                        <input
                                            type="email"
                                            value={formData.email || ''}
                                            onChange={(e) => handleInputChange('email', e.target.value)}
                                            placeholder="info@acente.com"
                                            className="w-full h-10 px-3.5 bg-white dark:bg-[#303134] border border-[#dadce0] dark:border-[#5f6368] focus:border-[#1a73e8] rounded-xl text-xs text-[#202124] dark:text-white outline-none transition-all shadow-2xs"
                                        />
                                    </div>

                                    <div className="grid grid-cols-3 gap-3">
                                        <div>
                                            <label className="text-xs font-semibold text-[#5f6368] dark:text-[#9aa0a6] uppercase tracking-wide block mb-1">
                                                Ülke Kodu
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.phoneCountryCode || ''}
                                                onChange={(e) => handleInputChange('phoneCountryCode', e.target.value)}
                                                placeholder="90"
                                                className="w-full h-10 px-3.5 bg-white dark:bg-[#303134] border border-[#dadce0] dark:border-[#5f6368] focus:border-[#1a73e8] rounded-xl text-xs text-[#202124] dark:text-white outline-none transition-all shadow-2xs"
                                            />
                                        </div>
                                        <div className="col-span-2">
                                            <label className="text-xs font-semibold text-[#5f6368] dark:text-[#9aa0a6] uppercase tracking-wide block mb-1">
                                                Telefon Numarası
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.phoneNumber || ''}
                                                onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                                                placeholder="5XX XXX XX XX"
                                                className="w-full h-10 px-3.5 bg-white dark:bg-[#303134] border border-[#dadce0] dark:border-[#5f6368] focus:border-[#1a73e8] rounded-xl text-xs text-[#202124] dark:text-white outline-none transition-all shadow-2xs"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-xs font-semibold text-[#5f6368] dark:text-[#9aa0a6] uppercase tracking-wide block mb-1">
                                            Web Sitesi
                                        </label>
                                        <input
                                            type="url"
                                            value={formData.website || ''}
                                            onChange={(e) => handleInputChange('website', e.target.value)}
                                            placeholder="https://www.acente.com"
                                            className="w-full h-10 px-3.5 bg-white dark:bg-[#303134] border border-[#dadce0] dark:border-[#5f6368] focus:border-[#1a73e8] rounded-xl text-xs text-[#202124] dark:text-white outline-none transition-all shadow-2xs"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Card 3: Fatura & Mali Bilgiler */}
                            <div className="bg-white dark:bg-[#202124] border border-[#dadce0] dark:border-[#3c4043] rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
                                <div className="flex items-center gap-2.5 pb-3 border-b border-[#dadce0]/70 dark:border-[#3c4043]">
                                    <div className="size-8 rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 flex items-center justify-center">
                                        <span className="material-symbols-outlined text-[19px]">receipt_long</span>
                                    </div>
                                    <h3 className="text-sm font-bold text-[#202124] dark:text-white">Fatura & Mali Bilgiler</h3>
                                </div>

                                <div className="space-y-3.5">
                                    <div>
                                        <label className="text-xs font-semibold text-[#5f6368] dark:text-[#9aa0a6] uppercase tracking-wide block mb-1">
                                            Mali Fatura Unvanı
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.agencyFinancialInfo?.title || ''}
                                            onChange={(e) => handleInputChange('agencyFinancialInfo.title', e.target.value)}
                                            placeholder="Fatura kesilecek resmi ticari unvan"
                                            className="w-full h-10 px-3.5 bg-white dark:bg-[#303134] border border-[#dadce0] dark:border-[#5f6368] focus:border-[#1a73e8] rounded-xl text-xs text-[#202124] dark:text-white outline-none transition-all shadow-2xs"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-xs font-semibold text-[#5f6368] dark:text-[#9aa0a6] uppercase tracking-wide block mb-1">
                                                Vergi Dairesi
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.agencyFinancialInfo?.taxOffice || formData.taxOffice || ''}
                                                onChange={(e) => {
                                                    handleInputChange('taxOffice', e.target.value);
                                                    handleInputChange('agencyFinancialInfo.taxOffice', e.target.value);
                                                }}
                                                placeholder="Vergi dairesi"
                                                className="w-full h-10 px-3.5 bg-white dark:bg-[#303134] border border-[#dadce0] dark:border-[#5f6368] focus:border-[#1a73e8] rounded-xl text-xs text-[#202124] dark:text-white outline-none transition-all shadow-2xs"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-semibold text-[#5f6368] dark:text-[#9aa0a6] uppercase tracking-wide block mb-1">
                                                Vergi Numarası
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.agencyFinancialInfo?.taxNumber || formData.taxNumber || ''}
                                                onChange={(e) => {
                                                    handleInputChange('taxNumber', e.target.value);
                                                    handleInputChange('agencyFinancialInfo.taxNumber', e.target.value);
                                                }}
                                                placeholder="VKN / TCKN"
                                                className="w-full h-10 px-3.5 bg-white dark:bg-[#303134] border border-[#dadce0] dark:border-[#5f6368] focus:border-[#1a73e8] rounded-xl text-xs text-[#202124] dark:text-white outline-none transition-all shadow-2xs"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-xs font-semibold text-[#5f6368] dark:text-[#9aa0a6] uppercase tracking-wide block mb-1">
                                                Muhasebe E-postası
                                            </label>
                                            <input
                                                type="email"
                                                value={formData.agencyFinancialInfo?.email || ''}
                                                onChange={(e) => handleInputChange('agencyFinancialInfo.email', e.target.value)}
                                                placeholder="muhasebe@acente.com"
                                                className="w-full h-10 px-3.5 bg-white dark:bg-[#303134] border border-[#dadce0] dark:border-[#5f6368] focus:border-[#1a73e8] rounded-xl text-xs text-[#202124] dark:text-white outline-none transition-all shadow-2xs"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-semibold text-[#5f6368] dark:text-[#9aa0a6] uppercase tracking-wide block mb-1">
                                                Muhasebe Telefonu
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.agencyFinancialInfo?.phoneNumber || ''}
                                                onChange={(e) => handleInputChange('agencyFinancialInfo.phoneNumber', e.target.value)}
                                                placeholder="Telefon numarası"
                                                className="w-full h-10 px-3.5 bg-white dark:bg-[#303134] border border-[#dadce0] dark:border-[#5f6368] focus:border-[#1a73e8] rounded-xl text-xs text-[#202124] dark:text-white outline-none transition-all shadow-2xs"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-xs font-semibold text-[#5f6368] dark:text-[#9aa0a6] uppercase tracking-wide block mb-1">
                                            Fatura Adresi
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.agencyFinancialInfo?.address || ''}
                                            onChange={(e) => handleInputChange('agencyFinancialInfo.address', e.target.value)}
                                            placeholder="Resmi fatura adresi"
                                            className="w-full h-10 px-3.5 bg-white dark:bg-[#303134] border border-[#dadce0] dark:border-[#5f6368] focus:border-[#1a73e8] rounded-xl text-xs text-[#202124] dark:text-white outline-none transition-all shadow-2xs"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Card 4: Konum ve Harita */}
                            <div className="bg-white dark:bg-[#202124] border border-[#dadce0] dark:border-[#3c4043] rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
                                <div className="flex items-center justify-between pb-3 border-b border-[#dadce0]/70 dark:border-[#3c4043]">
                                    <div className="flex items-center gap-2.5">
                                        <div className="size-8 rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 flex items-center justify-center">
                                            <span className="material-symbols-outlined text-[19px]">place</span>
                                        </div>
                                        <h3 className="text-sm font-bold text-[#202124] dark:text-white">Konum ve Harita</h3>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={openInMaps}
                                        className="text-xs font-medium text-[#1a73e8] dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                                    >
                                        <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                                        <span>Google Maps</span>
                                    </button>
                                </div>

                                <div className="space-y-3.5">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-xs font-semibold text-[#5f6368] dark:text-[#9aa0a6] uppercase tracking-wide block mb-1">
                                                Ülke
                                            </label>
                                            <select
                                                value={formData.countryId || ''}
                                                onChange={handleCountryChange}
                                                className="w-full h-10 px-3 bg-white dark:bg-[#303134] border border-[#dadce0] dark:border-[#5f6368] focus:border-[#1a73e8] rounded-xl text-xs text-[#202124] dark:text-white outline-none transition-all shadow-2xs cursor-pointer"
                                            >
                                                <option value="">Ülke Seçiniz</option>
                                                {countries.map((c, idx) => (
                                                    <option key={c.id || c.locationId || idx} value={c.id || c.locationId}>
                                                        {getCountryName(countries, c.countryIso2 || c.code || c.id, currentLang)}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-xs font-semibold text-[#5f6368] dark:text-[#9aa0a6] uppercase tracking-wide block mb-1">
                                                Şehir
                                            </label>
                                            <select
                                                value={formData.cityId || ''}
                                                onChange={(e) => handleInputChange('cityId', e.target.value)}
                                                className="w-full h-10 px-3 bg-white dark:bg-[#303134] border border-[#dadce0] dark:border-[#5f6368] focus:border-[#1a73e8] rounded-xl text-xs text-[#202124] dark:text-white outline-none transition-all shadow-2xs cursor-pointer"
                                            >
                                                <option value="">Şehir Seçiniz</option>
                                                {cities.map((city, idx) => (
                                                    <option key={city.id || city.locationId || idx} value={city.id || city.locationId}>
                                                        {city.name?.translations?.[currentLang] || city.name?.translations?.tr || city.name?.defaultName || city.name || `City #${idx}`}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-3">
                                        <div className="col-span-2">
                                            <label className="text-xs font-semibold text-[#5f6368] dark:text-[#9aa0a6] uppercase tracking-wide block mb-1">
                                                Açık Adres
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.address || ''}
                                                onChange={(e) => handleInputChange('address', e.target.value)}
                                                placeholder="Cadde, sokak, bina no, ilçe"
                                                className="w-full h-10 px-3.5 bg-white dark:bg-[#303134] border border-[#dadce0] dark:border-[#5f6368] focus:border-[#1a73e8] rounded-xl text-xs text-[#202124] dark:text-white outline-none transition-all shadow-2xs"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-semibold text-[#5f6368] dark:text-[#9aa0a6] uppercase tracking-wide block mb-1">
                                                Posta Kodu
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.zipCode || ''}
                                                onChange={(e) => handleInputChange('zipCode', e.target.value)}
                                                placeholder="34000"
                                                className="w-full h-10 px-3.5 bg-white dark:bg-[#303134] border border-[#dadce0] dark:border-[#5f6368] focus:border-[#1a73e8] rounded-xl text-xs text-[#202124] dark:text-white outline-none transition-all shadow-2xs"
                                            />
                                        </div>
                                    </div>

                                    {/* Leaflet Map Preview */}
                                    <div className="rounded-xl overflow-hidden border border-[#dadce0] dark:border-[#3c4043] h-48 relative z-10 shadow-2xs">
                                        <MapContainer
                                            center={mapCenter}
                                            zoom={zoom}
                                            scrollWheelZoom={false}
                                            className="w-full h-full"
                                        >
                                            <ChangeView center={mapCenter} zoom={zoom} />
                                            <TileLayer
                                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                            />
                                            <LocationMarker
                                                position={[Number(formData.latitude) || 36.6826845, Number(formData.longitude) || 30.9089719]}
                                                setPosition={setMapLocation}
                                            />
                                        </MapContainer>
                                        <div className="absolute bottom-2 left-2 z-[400] bg-white/90 dark:bg-[#202124]/90 backdrop-blur-xs px-2.5 py-1 rounded-md text-[10px] font-mono text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-xs">
                                            Konum: {Number(formData.latitude).toFixed(5)}, {Number(formData.longitude).toFixed(5)} (Haritaya tıklayarak güncelleyebilirsiniz)
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Bottom Floating Save Action Bar */}
                        <div className="p-4 bg-white dark:bg-[#202124] border border-[#dadce0] dark:border-[#3c4043] rounded-2xl shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
                            <div className="flex items-center gap-2 text-xs text-[#5f6368] dark:text-[#9aa0a6]">
                                <span className="material-symbols-outlined text-[18px] text-[#1a73e8]">info</span>
                                <span>Yapılan değişiklikler kaydedilene kadar sistemde güncellenmez.</span>
                            </div>
                            <div className="flex items-center gap-2 w-full sm:w-auto">
                                <button
                                    type="button"
                                    onClick={() => fetchInitialData()}
                                    disabled={saving}
                                    className="flex-1 sm:flex-none h-10 px-5 rounded-xl border border-[#dadce0] dark:border-[#5f6368] text-xs font-medium text-[#3c4043] dark:text-slate-200 hover:bg-[#f1f3f4] dark:hover:bg-[#3c4043] transition-all cursor-pointer"
                                >
                                    Vazgeç
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex-1 sm:flex-none h-10 px-6 rounded-xl bg-[#1a73e8] hover:bg-[#1557b0] text-white text-xs font-medium transition-all shadow-xs active:scale-95 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {saving ? (
                                        <div className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    ) : (
                                        <span className="material-symbols-outlined text-[18px]">check</span>
                                    )}
                                    <span>{saving ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}</span>
                                </button>
                            </div>
                        </div>
                    </form>
                )}

                {/* ─── TAB 2: USERS ─────────────────────────────────────────── */}
                {activeTab === 'users' && (
                    <div className="space-y-5">
                        {/* 3 Metric Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="bg-white dark:bg-[#202124] p-5 sm:p-6 rounded-2xl border border-[#dadce0] dark:border-[#3c4043] shadow-xs hover:shadow-sm transition-all duration-200 flex flex-col justify-between">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-xs font-semibold text-[#5f6368] dark:text-[#9aa0a6] uppercase tracking-wider">{L('totalUsers')}</span>
                                    <div className="size-10 bg-[#e8f0fe] dark:bg-[#1a73e8]/20 rounded-xl flex items-center justify-center text-[#1a73e8] dark:text-[#8ab4f8] shrink-0">
                                        <span className="material-symbols-outlined text-[22px]">groups</span>
                                    </div>
                                </div>
                                <div className="flex items-baseline gap-2">
                                    <div className="text-3xl font-bold text-[#202124] dark:text-white leading-none tabular-nums tracking-tight">
                                        {statsLoading ? '...' : summary.totalCount}
                                    </div>
                                    <span className="text-xs font-medium text-[#70757a]">kullanıcı</span>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-[#202124] p-5 sm:p-6 rounded-2xl border border-[#dadce0] dark:border-[#3c4043] shadow-xs hover:shadow-sm transition-all duration-200 flex flex-col justify-between">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">{L('activeUsers')}</span>
                                    <div className="size-10 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                                        <span className="material-symbols-outlined text-[22px]">person_check</span>
                                    </div>
                                </div>
                                <div className="flex items-baseline gap-2">
                                    <div className="text-3xl font-bold text-[#202124] dark:text-white leading-none tabular-nums tracking-tight">
                                        {statsLoading ? '...' : summary.activeCount}
                                    </div>
                                    <span className="text-xs font-medium text-emerald-600">aktif</span>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-[#202124] p-5 sm:p-6 rounded-2xl border border-[#dadce0] dark:border-[#3c4043] shadow-xs hover:shadow-sm transition-all duration-200 flex flex-col justify-between">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-xs font-semibold text-rose-600 dark:text-rose-400 uppercase tracking-wider">{L('passiveUsers')}</span>
                                    <div className="size-10 bg-rose-50 dark:bg-rose-950/40 rounded-xl flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0">
                                        <span className="material-symbols-outlined text-[22px]">person_off</span>
                                    </div>
                                </div>
                                <div className="flex items-baseline gap-2">
                                    <div className="text-3xl font-bold text-[#202124] dark:text-white leading-none tabular-nums tracking-tight">
                                        {statsLoading ? '...' : summary.passiveCount}
                                    </div>
                                    <span className="text-xs font-medium text-rose-600">pasif</span>
                                </div>
                            </div>
                        </div>

                        {/* User Table & Toolbar Card */}
                        <div className="bg-white dark:bg-[#202124] rounded-2xl border border-[#dadce0] dark:border-[#3c4043] overflow-hidden shadow-xs flex flex-col">
                            {/* Toolbar */}
                            <div className="p-4 border-b border-[#dadce0] dark:border-[#3c4043] flex flex-wrap items-center justify-between gap-3">
                                <div className="flex items-center gap-2.5 flex-1 min-w-[280px] max-w-xl">
                                    <div className="relative flex-1">
                                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-[#70757a]">search</span>
                                        <input
                                            type="text"
                                            placeholder={L('searchUsers') || 'İsim veya e-posta ile ara...'}
                                            value={userFilters.query}
                                            onChange={(e) => handleUserFilterChange({ ...userFilters, query: e.target.value })}
                                            className="w-full pl-9 pr-8 h-10 bg-[#f8f9fa] dark:bg-[#303134] border border-transparent focus:border-[#1a73e8] focus:bg-white dark:focus:bg-[#202124] rounded-xl text-xs text-[#202124] dark:text-white placeholder-[#70757a] outline-none transition-all shadow-2xs"
                                        />
                                        {userFilters.query && (
                                            <button
                                                type="button"
                                                onClick={() => handleUserFilterChange({ ...userFilters, query: '' })}
                                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#70757a] hover:text-[#202124] cursor-pointer"
                                            >
                                                <span className="material-symbols-outlined text-[15px]">close</span>
                                            </button>
                                        )}
                                    </div>

                                    <select
                                        value={userFilters.roleIds[0] || ''}
                                        onChange={(e) => handleUserFilterChange({ ...userFilters, roleIds: e.target.value ? [parseInt(e.target.value)] : [] })}
                                        className="h-10 px-3 bg-white dark:bg-[#303134] border border-[#dadce0] dark:border-[#5f6368] rounded-xl text-xs text-[#3c4043] dark:text-slate-200 focus:border-[#1a73e8] outline-none cursor-pointer"
                                    >
                                        <option value="">{L('allRoles') || 'Tüm Roller'}</option>
                                        {roles.map(r => <option key={r.id} value={r.id}>{r.roleName || r.name}</option>)}
                                    </select>

                                    <select
                                        value={userFilters.status}
                                        onChange={(e) => handleUserFilterChange({ ...userFilters, status: e.target.value })}
                                        className="h-10 px-3 bg-white dark:bg-[#303134] border border-[#dadce0] dark:border-[#5f6368] rounded-xl text-xs text-[#3c4043] dark:text-slate-200 focus:border-[#1a73e8] outline-none cursor-pointer"
                                    >
                                        <option value="ACTIVE">{L('active') || 'Aktif'}</option>
                                        <option value="PASSIVE">{L('passive') || 'Pasif'}</option>
                                    </select>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={handleExportUsersExcel}
                                        disabled={isExportingUserExcel || usersLoading}
                                        className="flex items-center gap-1.5 h-10 px-3.5 bg-white dark:bg-[#303134] hover:bg-[#f1f3f4] dark:hover:bg-[#3c4043] border border-[#dadce0] dark:border-[#5f6368] rounded-xl text-xs font-medium text-emerald-600 dark:text-emerald-400 transition-all cursor-pointer disabled:opacity-50 shadow-2xs"
                                        title="Excel'e Aktar"
                                    >
                                        <span className="material-symbols-outlined text-[18px]">table_view</span>
                                        <span className="hidden sm:inline">Excel</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={handleExportUsersPdf}
                                        disabled={isExportingUserPdf || usersLoading}
                                        className="flex items-center gap-1.5 h-10 px-3.5 bg-white dark:bg-[#303134] hover:bg-[#f1f3f4] dark:hover:bg-[#3c4043] border border-[#dadce0] dark:border-[#5f6368] rounded-xl text-xs font-medium text-rose-600 dark:text-rose-400 transition-all cursor-pointer disabled:opacity-50 shadow-2xs"
                                        title="PDF'e Aktar"
                                    >
                                        <span className="material-symbols-outlined text-[18px]">picture_as_pdf</span>
                                        <span className="hidden sm:inline">PDF</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => fetchUsersData(true)}
                                        disabled={usersLoading}
                                        className="size-10 rounded-xl border border-[#dadce0] dark:border-[#5f6368] hover:bg-[#f1f3f4] dark:hover:bg-[#3c4043] flex items-center justify-center text-[#5f6368] dark:text-[#9aa0a6] transition-all cursor-pointer disabled:opacity-50 shadow-2xs"
                                        title="Yenile"
                                    >
                                        <span className={`material-symbols-outlined text-[18px] ${usersLoading ? 'animate-spin' : ''}`}>refresh</span>
                                    </button>
                                </div>
                            </div>

                            {/* Table */}
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-[#f8f9fa] dark:bg-[#202124] border-b border-[#dadce0] dark:border-[#3c4043] text-[11px] font-semibold text-[#5f6368] dark:text-[#9aa0a6] uppercase tracking-wider">
                                            <th className="px-4 py-3">Kullanıcı</th>
                                            <th className="px-4 py-3">E-posta</th>
                                            <th className="px-4 py-3">Telefon</th>
                                            <th className="px-4 py-3">Roller</th>
                                            <th className="px-4 py-3 text-center">Durum</th>
                                            <th className="px-4 py-3 text-right">İşlemler</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#dadce0]/60 dark:divide-[#3c4043]/60 text-xs text-[#202124] dark:text-slate-100">
                                        {usersLoading ? (
                                            <TableSkeleton columns={6} rows={5} />
                                        ) : users.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} className="px-4 py-12 text-center text-[#70757a]">
                                                    <span className="material-symbols-outlined text-4xl text-slate-300 dark:text-slate-600 mb-2">person_off</span>
                                                    <p className="text-sm font-medium">Kullanıcı bulunamadı</p>
                                                </td>
                                            </tr>
                                        ) : (
                                            users.map((u) => {
                                                const initials = `${u.name?.[0] || ''}${u.surname?.[0] || ''}`.toUpperCase() || 'U';
                                                return (
                                                    <tr key={u.id} className="hover:bg-[#f8f9fa] dark:hover:bg-[#2a2b2e]/60 transition-colors">
                                                        <td className="px-4 py-3">
                                                            <div className="flex items-center gap-3">
                                                                <div className="size-8 rounded-full bg-[#e8f0fe] dark:bg-[#1a73e8]/25 text-[#1a73e8] dark:text-[#8ab4f8] font-bold text-xs flex items-center justify-center shrink-0">
                                                                    {initials}
                                                                </div>
                                                                <div>
                                                                    <div className="font-semibold text-[#202124] dark:text-white leading-tight">
                                                                        {u.name} {u.surname}
                                                                    </div>
                                                                    <div className="text-[10px] text-[#70757a] font-mono mt-0.5">ID: #{u.id}</div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3 text-slate-600 dark:text-slate-300 font-mono text-[11px]">{u.email || '-'}</td>
                                                        <td className="px-4 py-3 text-slate-600 dark:text-slate-300 tabular-nums">
                                                            {u.phoneNumber ? `+${u.phoneCountryCode || ''} ${u.phoneNumber}` : '-'}
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <div className="flex flex-wrap gap-1">
                                                                {(u.roles || []).length > 0 ? (
                                                                    u.roles.map(r => (
                                                                        <span key={r.id} className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#e8f0fe] text-[#1a73e8] dark:bg-blue-900/40 dark:text-blue-300">
                                                                            {r.roleName || r.name}
                                                                        </span>
                                                                    ))
                                                                ) : (
                                                                    <span className="text-slate-400 text-[11px]">Rol yok</span>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3 text-center">
                                                            <AppleSwitch
                                                                checked={u.status === 'ACTIVE'}
                                                                onChange={() => handleToggleUserStatus(u)}
                                                                size="sm"
                                                            />
                                                        </td>
                                                        <td className="px-4 py-3 text-right">
                                                            <div className="flex items-center justify-end gap-1">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => openUpdatePasswordModal(u)}
                                                                    className="size-8 rounded-lg text-slate-500 hover:text-[#1a73e8] hover:bg-[#e8f0fe] dark:hover:bg-blue-900/30 flex items-center justify-center transition-colors cursor-pointer"
                                                                    title="Şifre Değiştir"
                                                                >
                                                                    <span className="material-symbols-outlined text-[17px]">lock_reset</span>
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => openEditUser(u)}
                                                                    className="size-8 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition-colors cursor-pointer"
                                                                    title="Düzenle"
                                                                >
                                                                    <span className="material-symbols-outlined text-[17px]">edit</span>
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleDeleteUser(u.id)}
                                                                    className="size-8 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center justify-center transition-colors cursor-pointer"
                                                                    title="Sil"
                                                                >
                                                                    <span className="material-symbols-outlined text-[17px]">delete</span>
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* ─── TAB 3: GUESTS ────────────────────────────────────────── */}
                {activeTab === 'guests' && (
                    <div className="space-y-5">
                        {/* 3 Metric Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="bg-white dark:bg-[#202124] p-5 sm:p-6 rounded-2xl border border-[#dadce0] dark:border-[#3c4043] shadow-xs hover:shadow-sm transition-all duration-200 flex flex-col justify-between">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-xs font-semibold text-[#5f6368] dark:text-[#9aa0a6] uppercase tracking-wider">{L('totalGuests')}</span>
                                    <div className="size-10 bg-[#e8f0fe] dark:bg-[#1a73e8]/20 rounded-xl flex items-center justify-center text-[#1a73e8] dark:text-[#8ab4f8] shrink-0">
                                        <span className="material-symbols-outlined text-[22px]">recent_actors</span>
                                    </div>
                                </div>
                                <div className="flex items-baseline gap-2">
                                    <div className="text-3xl font-bold text-[#202124] dark:text-white leading-none tabular-nums tracking-tight">
                                        {statsLoading ? '...' : summary.totalGuestCount}
                                    </div>
                                    <span className="text-xs font-medium text-[#70757a]">profil</span>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-[#202124] p-5 sm:p-6 rounded-2xl border border-[#dadce0] dark:border-[#3c4043] shadow-xs hover:shadow-sm transition-all duration-200 flex flex-col justify-between">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">{L('activeGuests')}</span>
                                    <div className="size-10 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                                        <span className="material-symbols-outlined text-[22px]">how_to_reg</span>
                                    </div>
                                </div>
                                <div className="flex items-baseline gap-2">
                                    <div className="text-3xl font-bold text-[#202124] dark:text-white leading-none tabular-nums tracking-tight">
                                        {statsLoading ? '...' : summary.activeGuestCount}
                                    </div>
                                    <span className="text-xs font-medium text-emerald-600">aktif</span>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-[#202124] p-5 sm:p-6 rounded-2xl border border-[#dadce0] dark:border-[#3c4043] shadow-xs hover:shadow-sm transition-all duration-200 flex flex-col justify-between">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-xs font-semibold text-rose-600 dark:text-rose-400 uppercase tracking-wider">{L('passiveGuests')}</span>
                                    <div className="size-10 bg-rose-50 dark:bg-rose-950/40 rounded-xl flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0">
                                        <span className="material-symbols-outlined text-[22px]">person_remove</span>
                                    </div>
                                </div>
                                <div className="flex items-baseline gap-2">
                                    <div className="text-3xl font-bold text-[#202124] dark:text-white leading-none tabular-nums tracking-tight">
                                        {statsLoading ? '...' : summary.passiveGuestCount}
                                    </div>
                                    <span className="text-xs font-medium text-rose-600">arşiv</span>
                                </div>
                            </div>
                        </div>

                        {/* Guest Table & Toolbar Card */}
                        <div className="bg-white dark:bg-[#202124] rounded-2xl border border-[#dadce0] dark:border-[#3c4043] overflow-hidden shadow-xs flex flex-col">
                            {/* Toolbar */}
                            <div className="p-4 border-b border-[#dadce0] dark:border-[#3c4043] flex flex-wrap items-center justify-between gap-3">
                                <div className="flex items-center gap-2.5 flex-1 min-w-[280px] max-w-xl">
                                    <div className="relative flex-1">
                                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-[#70757a]">search</span>
                                        <input
                                            type="text"
                                            placeholder={L('searchGuests') || 'Misafir adı, pasaport veya e-posta ile ara...'}
                                            value={guestFilters.query}
                                            onChange={(e) => handleGuestFilterChange({ ...guestFilters, query: e.target.value })}
                                            className="w-full pl-9 pr-8 h-10 bg-[#f8f9fa] dark:bg-[#303134] border border-transparent focus:border-[#1a73e8] focus:bg-white dark:focus:bg-[#202124] rounded-xl text-xs text-[#202124] dark:text-white placeholder-[#70757a] outline-none transition-all shadow-2xs"
                                        />
                                        {guestFilters.query && (
                                            <button
                                                type="button"
                                                onClick={() => handleGuestFilterChange({ ...guestFilters, query: '' })}
                                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#70757a] hover:text-[#202124] cursor-pointer"
                                            >
                                                <span className="material-symbols-outlined text-[15px]">close</span>
                                            </button>
                                        )}
                                    </div>

                                    <select
                                        value={guestFilters.countryCodes?.[0] || ''}
                                        onChange={(e) => handleGuestFilterChange({ ...guestFilters, countryCodes: e.target.value ? [e.target.value] : [] })}
                                        className="h-10 px-3 bg-white dark:bg-[#303134] border border-[#dadce0] dark:border-[#5f6368] rounded-xl text-xs text-[#3c4043] dark:text-slate-200 focus:border-[#1a73e8] outline-none cursor-pointer max-w-[150px] truncate"
                                    >
                                        <option value="">{L('allCountries') || 'Tüm Ülkeler'}</option>
                                        {countries.map((c, idx) => {
                                            const code = c.countryIso2 || c.alphaTwoCode || c.code || c.countryCode || '';
                                            return (
                                                <option key={c.locationId || c.id || code || idx} value={code}>
                                                    {getCountryName(countries, code, currentLang)}
                                                </option>
                                            );
                                        })}
                                    </select>

                                    <select
                                        value={guestFilters.status}
                                        onChange={(e) => handleGuestFilterChange({ ...guestFilters, status: e.target.value })}
                                        className="h-10 px-3 bg-white dark:bg-[#303134] border border-[#dadce0] dark:border-[#5f6368] rounded-xl text-xs text-[#3c4043] dark:text-slate-200 focus:border-[#1a73e8] outline-none cursor-pointer"
                                    >
                                        <option value="ACTIVE">{L('active') || 'Aktif'}</option>
                                        <option value="PASSIVE">{L('passive') || 'Pasif'}</option>
                                    </select>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={handleExportGuestsExcel}
                                        disabled={isExportingGuestExcel || guestsLoading}
                                        className="flex items-center gap-1.5 h-10 px-3.5 bg-white dark:bg-[#303134] hover:bg-[#f1f3f4] dark:hover:bg-[#3c4043] border border-[#dadce0] dark:border-[#5f6368] rounded-xl text-xs font-medium text-emerald-600 dark:text-emerald-400 transition-all cursor-pointer disabled:opacity-50 shadow-2xs"
                                        title="Excel'e Aktar"
                                    >
                                        <span className="material-symbols-outlined text-[18px]">table_view</span>
                                        <span className="hidden sm:inline">Excel</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={handleExportGuestsPdf}
                                        disabled={isExportingGuestPdf || guestsLoading}
                                        className="flex items-center gap-1.5 h-10 px-3.5 bg-white dark:bg-[#303134] hover:bg-[#f1f3f4] dark:hover:bg-[#3c4043] border border-[#dadce0] dark:border-[#5f6368] rounded-xl text-xs font-medium text-rose-600 dark:text-rose-400 transition-all cursor-pointer disabled:opacity-50 shadow-2xs"
                                        title="PDF'e Aktar"
                                    >
                                        <span className="material-symbols-outlined text-[18px]">picture_as_pdf</span>
                                        <span className="hidden sm:inline">PDF</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => fetchGuestsData(true)}
                                        disabled={guestsLoading}
                                        className="size-10 rounded-xl border border-[#dadce0] dark:border-[#5f6368] hover:bg-[#f1f3f4] dark:hover:bg-[#3c4043] flex items-center justify-center text-[#5f6368] dark:text-[#9aa0a6] transition-all cursor-pointer disabled:opacity-50 shadow-2xs"
                                        title="Yenile"
                                    >
                                        <span className={`material-symbols-outlined text-[18px] ${guestsLoading ? 'animate-spin' : ''}`}>refresh</span>
                                    </button>
                                </div>
                            </div>

                            {/* Table */}
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-[#f8f9fa] dark:bg-[#202124] border-b border-[#dadce0] dark:border-[#3c4043] text-[11px] font-semibold text-[#5f6368] dark:text-[#9aa0a6] uppercase tracking-wider">
                                            <th className="px-4 py-3">Misafir</th>
                                            <th className="px-4 py-3">Doğum Tarihi</th>
                                            <th className="px-4 py-3">Uyruk</th>
                                            <th className="px-4 py-3">Pasaport Bilgisi</th>
                                            <th className="px-4 py-3">İletişim</th>
                                            <th className="px-4 py-3 text-center">Durum</th>
                                            <th className="px-4 py-3 text-right">İşlemler</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#dadce0]/60 dark:divide-[#3c4043]/60 text-xs text-[#202124] dark:text-slate-100">
                                        {guestsLoading ? (
                                            <TableSkeleton columns={7} rows={5} />
                                        ) : guests.length === 0 ? (
                                            <tr>
                                                <td colSpan={7} className="px-4 py-12 text-center text-[#70757a]">
                                                    <span className="material-symbols-outlined text-4xl text-slate-300 dark:text-slate-600 mb-2">recent_actors</span>
                                                    <p className="text-sm font-medium">Misafir kaydı bulunamadı</p>
                                                </td>
                                            </tr>
                                        ) : (
                                            guests.map((g) => {
                                                const initials = `${g.firstName?.[0] || ''}${g.lastName?.[0] || ''}`.toUpperCase() || 'G';
                                                return (
                                                    <tr key={g.id} className="hover:bg-[#f8f9fa] dark:hover:bg-[#2a2b2e]/60 transition-colors">
                                                        <td className="px-4 py-3">
                                                            <div className="flex items-center gap-3">
                                                                <div className="size-8 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 font-bold text-xs flex items-center justify-center shrink-0">
                                                                    {initials}
                                                                </div>
                                                                <div>
                                                                    <div className="font-semibold text-[#202124] dark:text-white flex items-center gap-1.5 leading-tight">
                                                                        <span>{g.firstName} {g.lastName}</span>
                                                                        <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${g.gender === 'FEMALE' ? 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'}`}>
                                                                            {g.gender === 'FEMALE' ? 'KADIN' : 'ERKEK'}
                                                                        </span>
                                                                    </div>
                                                                    <div className="text-[10px] text-[#70757a] font-mono mt-0.5">ID: #{g.id}</div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3 text-slate-600 dark:text-slate-300 tabular-nums">{g.birthDate || '-'}</td>
                                                        <td className="px-4 py-3">
                                                            <span className="font-medium text-[#202124] dark:text-white">
                                                                {getCountryName(countries, g.country, currentLang) || g.country || '-'}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <div className="font-mono text-[11px] text-[#202124] dark:text-white font-medium">{g.passportNo || '-'}</div>
                                                            {g.passportExpiry && (
                                                                <div className="text-[10px] text-[#70757a]">SKT: {g.passportExpiry}</div>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <div className="text-[11px] text-slate-700 dark:text-slate-300">{g.email || '-'}</div>
                                                            <div className="text-[11px] text-slate-500 tabular-nums">{g.phoneNumber ? `+${g.phoneCountryCode || ''} ${g.phoneNumber}` : '-'}</div>
                                                        </td>
                                                        <td className="px-4 py-3 text-center">
                                                            <AppleSwitch
                                                                checked={g.status === 'ACTIVE'}
                                                                onChange={() => handleToggleGuestStatus(g)}
                                                                size="sm"
                                                            />
                                                        </td>
                                                        <td className="px-4 py-3 text-right">
                                                            <div className="flex items-center justify-end gap-1">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => openEditGuest(g)}
                                                                    className="size-8 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition-colors cursor-pointer"
                                                                    title="Düzenle"
                                                                >
                                                                    <span className="material-symbols-outlined text-[17px]">edit</span>
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleDeleteGuest(g.id)}
                                                                    className="size-8 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center justify-center transition-colors cursor-pointer"
                                                                    title="Sil"
                                                                >
                                                                    <span className="material-symbols-outlined text-[17px]">delete</span>
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* ─── TAB 4: FAVORITES ─────────────────────────────────────── */}
                {activeTab === 'favorites' && (
                    <div className="space-y-5">
                        {/* Add Hotel Search Bar */}
                        <div className="bg-white dark:bg-[#202124] border border-[#dadce0] dark:border-[#3c4043] rounded-2xl p-4 shadow-xs relative z-40">
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                                <div ref={hotelAutocompleteRef} className="relative flex-1 max-w-lg">
                                    <div className="relative">
                                        <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#70757a] text-[19px]">search</span>
                                        <input
                                            type="text"
                                            placeholder="Favorilere eklemek için otel adı veya ID ile arayın..."
                                            value={hotelAutocompleteQuery}
                                            onChange={(e) => setHotelAutocompleteQuery(e.target.value)}
                                            onFocus={() => hotelAutocompleteResults.length > 0 && setShowHotelAutocompleteDropdown(true)}
                                            className="w-full pl-10 pr-9 py-2.5 bg-[#f8f9fa] dark:bg-[#303134] border border-[#dadce0] dark:border-[#5f6368] focus:border-[#1a73e8] focus:bg-white dark:focus:bg-[#202124] rounded-xl text-xs text-[#202124] dark:text-white placeholder-[#70757a] outline-none transition-all shadow-2xs"
                                        />
                                        {hotelAutocompleteLoading && (
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2 size-4 border-2 border-[#1a73e8] border-t-transparent rounded-full animate-spin"></div>
                                        )}
                                    </div>

                                    {/* Autocomplete Dropdown */}
                                    {showHotelAutocompleteDropdown && hotelAutocompleteResults.length > 0 && (
                                        <div className="absolute left-0 right-0 top-full mt-2 bg-white dark:bg-[#202124] border border-[#dadce0] dark:border-[#3c4043] rounded-2xl shadow-xl max-h-64 overflow-y-auto z-[9999] p-2 space-y-1 animate-in fade-in-50 zoom-in-95">
                                            {hotelAutocompleteResults.map((h, idx) => {
                                                const isFav = isFavorite(h.hotelId);
                                                return (
                                                    <div
                                                        key={h.hotelId ? `ac-${h.hotelId}-${idx}` : `ac-${idx}`}
                                                        className="p-2.5 hover:bg-[#f1f3f4] dark:hover:bg-[#303134] rounded-xl transition-colors flex items-center justify-between group cursor-pointer"
                                                    >
                                                        <div className="flex items-center gap-2.5 min-w-0 pr-2">
                                                            <div className={`size-8 rounded-lg ${isFav ? 'bg-orange-50 text-orange-600 dark:bg-orange-950/30 dark:text-orange-400' : 'bg-[#e8f0fe] text-[#1a73e8] dark:bg-[#1a73e8]/20 dark:text-[#8ab4f8]'} flex items-center justify-center shrink-0`}>
                                                                <span className="material-symbols-outlined text-[18px]">{isFav ? 'bookmark' : 'hotel'}</span>
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className="text-xs font-semibold text-[#202124] dark:text-[#e8eaed] truncate">{h.hotelName}</p>
                                                                <p className="text-[10px] text-[#70757a]">
                                                                    ID: #{h.hotelId}
                                                                    {(h.hotelCity || h.cityName) ? ` • ${h.hotelCity || h.cityName}` : ''}
                                                                    {(h.hotelCountry || h.countryName) ? `, ${h.hotelCountry || h.countryName}` : ''}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={(e) => handleAddHotelFromAutocomplete(h, e)}
                                                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                                                                isFav 
                                                                    ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' 
                                                                    : 'bg-[#1a73e8] hover:bg-[#1557b0] text-white shadow-xs'
                                                            }`}
                                                        >
                                                            <span className="material-symbols-outlined text-[14px]">{isFav ? 'check' : 'add'}</span>
                                                            <span>{isFav ? 'Eklendi' : 'Ekle'}</span>
                                                        </button>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>

                                <div className="text-xs text-[#70757a]">
                                    Toplam <span className="font-bold text-[#202124] dark:text-white">{favoriteTotalElements}</span> kayıtlı favori otel
                                </div>
                            </div>
                        </div>

                        {/* Favorite Hotels Table Card */}
                        <div className="bg-white dark:bg-[#202124] rounded-2xl border border-[#dadce0] dark:border-[#3c4043] overflow-hidden shadow-xs flex flex-col">
                            {/* Toolbar */}
                            <div className="p-4 border-b border-[#dadce0] dark:border-[#3c4043] flex flex-wrap items-center justify-between gap-3">
                                <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
                                    <div className="relative flex-1 min-w-[200px] max-w-xs">
                                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-[#70757a]">search</span>
                                        <input
                                            type="text"
                                            placeholder="Favorilerde otel adı veya ID ara..."
                                            value={favoriteSearchQuery}
                                            onChange={(e) => setFavoriteSearchQuery(e.target.value)}
                                            className="w-full pl-9 pr-8 h-10 bg-[#f8f9fa] dark:bg-[#303134] border border-transparent focus:border-[#1a73e8] focus:bg-white dark:focus:bg-[#202124] rounded-xl text-xs text-[#202124] dark:text-white placeholder-[#70757a] outline-none transition-all shadow-2xs"
                                        />
                                        {favoriteSearchQuery && (
                                            <span
                                                onClick={() => setFavoriteSearchQuery('')}
                                                className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-[15px] text-[#70757a] hover:text-red-500 cursor-pointer"
                                            >
                                                close
                                            </span>
                                        )}
                                    </div>

                                    {/* Country Filter */}
                                    <div className="relative" ref={favCountryDropdownRef}>
                                        <div
                                            onClick={() => setShowFavCountryDropdown(!showFavCountryDropdown)}
                                            className={`h-10 px-3 bg-white dark:bg-[#303134] border ${favoriteCountryFilter ? 'border-[#1a73e8] text-[#1a73e8] font-semibold' : 'border-[#dadce0] dark:border-[#5f6368] text-[#3c4043] dark:text-slate-200'} rounded-xl text-xs flex items-center gap-1.5 cursor-pointer hover:border-[#1a73e8] transition-colors select-none`}
                                        >
                                            <span className="material-symbols-outlined text-[16px]">public</span>
                                            <span className="truncate max-w-[120px]">
                                                {favoriteCountryFilter ? (getCountryName(countries, favoriteCountryFilter, currentLang) || favoriteCountryFilter) : 'Ülke Filtresi'}
                                            </span>
                                            {favoriteCountryFilter ? (
                                                <span
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setFavoriteCountryFilter('');
                                                    }}
                                                    className="material-symbols-outlined text-[15px] hover:text-red-500"
                                                >
                                                    close
                                                </span>
                                            ) : (
                                                <span className="material-symbols-outlined text-[16px]">expand_more</span>
                                            )}
                                        </div>

                                        {showFavCountryDropdown && (
                                            <div className="absolute top-full left-0 mt-1 w-64 max-h-72 bg-white dark:bg-[#202124] border border-[#dadce0] dark:border-[#3c4043] rounded-2xl shadow-xl z-[1002] flex flex-col overflow-hidden animate-in fade-in slide-in-from-top-2">
                                                <div className="p-2 border-b border-[#dadce0] dark:border-[#3c4043]">
                                                    <input
                                                        type="text"
                                                        placeholder="Ülke ara..."
                                                        value={favCountrySearch}
                                                        onChange={(e) => setFavCountrySearch(e.target.value)}
                                                        autoFocus
                                                        className="w-full h-8 bg-[#f8f9fa] dark:bg-[#303134] border border-[#dadce0] dark:border-[#5f6368] rounded-lg px-2 text-xs text-[#202124] dark:text-white outline-none"
                                                    />
                                                </div>
                                                <div className="flex-1 overflow-y-auto p-1.5 custom-scrollbar">
                                                    <div
                                                        onClick={() => {
                                                            setFavoriteCountryFilter('');
                                                            setShowFavCountryDropdown(false);
                                                        }}
                                                        className="px-3 py-1.5 rounded-lg text-xs cursor-pointer hover:bg-[#f1f3f4] dark:hover:bg-[#303134]"
                                                    >
                                                        Tüm Ülkeler
                                                    </div>
                                                    {countries
                                                        .filter(c => {
                                                            const name = getCountryName(countries, c.countryIso2 || c.code || c.id, currentLang).toLowerCase();
                                                            return !favCountrySearch || name.includes(favCountrySearch.toLowerCase());
                                                        })
                                                        .map((c, i) => {
                                                            const code = c.countryIso2 || c.code || c.id;
                                                            const name = getCountryName(countries, code, currentLang);
                                                            return (
                                                                <div
                                                                    key={code || i}
                                                                    onClick={() => {
                                                                        setFavoriteCountryFilter(code);
                                                                        setShowFavCountryDropdown(false);
                                                                    }}
                                                                    className={`px-3 py-1.5 rounded-lg text-xs cursor-pointer flex items-center justify-between ${favoriteCountryFilter === code ? 'bg-[#e8f0fe] text-[#1a73e8] font-bold' : 'hover:bg-[#f1f3f4] dark:hover:bg-[#303134]'}`}
                                                                >
                                                                    <span>{name}</span>
                                                                    {favoriteCountryFilter === code && <span className="material-symbols-outlined text-[15px]">check</span>}
                                                                </div>
                                                            );
                                                        })}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* City Filter */}
                                    <div className="relative w-36 sm:w-40">
                                        <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-[16px] text-[#70757a]">location_city</span>
                                        <input
                                            type="text"
                                            placeholder="Şehir Filtresi"
                                            value={favoriteCityFilter}
                                            onChange={(e) => setFavoriteCityFilter(e.target.value)}
                                            className={`w-full pl-8 pr-7 h-10 bg-white dark:bg-[#303134] border ${favoriteCityFilter ? 'border-[#1a73e8] text-[#1a73e8] font-semibold' : 'border-[#dadce0] dark:border-[#5f6368] text-[#202124] dark:text-white'} focus:border-[#1a73e8] rounded-xl text-xs placeholder-[#70757a] outline-none transition-all`}
                                        />
                                        {favoriteCityFilter && (
                                            <span
                                                onClick={() => setFavoriteCityFilter('')}
                                                className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-[15px] text-[#70757a] hover:text-red-500 cursor-pointer"
                                            >
                                                close
                                            </span>
                                        )}
                                    </div>

                                    {/* Region Filter */}
                                    <div className="relative w-36 sm:w-40">
                                        <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-[16px] text-[#70757a]">pin_drop</span>
                                        <input
                                            type="text"
                                            placeholder="Bölge Filtresi"
                                            value={favoriteRegionFilter}
                                            onChange={(e) => setFavoriteRegionFilter(e.target.value)}
                                            className={`w-full pl-8 pr-7 h-10 bg-white dark:bg-[#303134] border ${favoriteRegionFilter ? 'border-[#1a73e8] text-[#1a73e8] font-semibold' : 'border-[#dadce0] dark:border-[#5f6368] text-[#202124] dark:text-white'} focus:border-[#1a73e8] rounded-xl text-xs placeholder-[#70757a] outline-none transition-all`}
                                        />
                                        {favoriteRegionFilter && (
                                            <span
                                                onClick={() => setFavoriteRegionFilter('')}
                                                className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-[15px] text-[#70757a] hover:text-red-500 cursor-pointer"
                                            >
                                                close
                                            </span>
                                        )}
                                    </div>

                                    {/* Multi-select Star Filter (OR logic inside, AND with other filters) */}
                                    <div className="relative" ref={favStarDropdownRef}>
                                        <div
                                            onClick={() => setShowFavStarDropdown(!showFavStarDropdown)}
                                            className={`h-10 px-3 bg-white dark:bg-[#303134] border ${favoriteStarFilter.length > 0 ? 'border-[#1a73e8] text-[#1a73e8] font-semibold' : 'border-[#dadce0] dark:border-[#5f6368] text-[#3c4043] dark:text-slate-200'} rounded-xl text-xs flex items-center gap-1.5 cursor-pointer hover:border-[#1a73e8] transition-colors select-none`}
                                        >
                                            <span className="material-symbols-outlined text-[16px] text-amber-500">star</span>
                                            <span className="truncate max-w-[140px]">
                                                {favoriteStarFilter.length > 0
                                                    ? favoriteStarFilter.map(s => s === 'N/A' ? 'N/A' : `${s}★`).join(' + ')
                                                    : 'Otel Yıldızı'}
                                            </span>
                                            {favoriteStarFilter.length > 0 ? (
                                                <span
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setFavoriteStarFilter([]);
                                                    }}
                                                    className="material-symbols-outlined text-[15px] hover:text-red-500"
                                                >
                                                    close
                                                </span>
                                            ) : (
                                                <span className="material-symbols-outlined text-[16px]">expand_more</span>
                                            )}
                                        </div>

                                        {showFavStarDropdown && (
                                            <div className="absolute top-full left-0 mt-1 w-52 bg-white dark:bg-[#202124] border border-[#dadce0] dark:border-[#3c4043] rounded-2xl shadow-xl z-[1002] p-2 space-y-1 animate-in fade-in slide-in-from-top-2">
                                                <div className="flex items-center justify-between px-2 py-1 border-b border-[#dadce0]/60 dark:border-[#3c4043]/60 mb-1">
                                                    <span className="text-[11px] font-semibold text-[#5f6368] dark:text-[#9aa0a6]">Otel Yıldızı (Çoklu Seçim)</span>
                                                    {favoriteStarFilter.length > 0 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => setFavoriteStarFilter([])}
                                                            className="text-[10px] font-semibold text-[#1a73e8] hover:underline cursor-pointer"
                                                        >
                                                            Temizle
                                                        </button>
                                                    )}
                                                </div>
                                                {['1', '2', '3', '4', '5', 'N/A'].map((starOpt) => {
                                                    const isSelected = favoriteStarFilter.includes(starOpt);
                                                    return (
                                                        <div
                                                            key={starOpt}
                                                            onClick={() => toggleFavoriteStarOption(starOpt)}
                                                            className={`px-2.5 py-1.5 rounded-lg text-xs cursor-pointer flex items-center justify-between transition-colors ${
                                                                isSelected
                                                                    ? 'bg-[#e8f0fe] text-[#1a73e8] dark:bg-[#1a73e8]/20 dark:text-[#8ab4f8] font-semibold'
                                                                    : 'hover:bg-[#f1f3f4] dark:hover:bg-[#303134] text-[#202124] dark:text-slate-200'
                                                            }`}
                                                        >
                                                            <div className="flex items-center gap-1.5">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={isSelected}
                                                                    onChange={() => {}}
                                                                    className="rounded border-slate-300 text-[#1a73e8] focus:ring-[#1a73e8] pointer-events-none"
                                                                />
                                                                {starOpt === 'N/A' ? (
                                                                    <span className="text-slate-600 dark:text-slate-300 font-medium">N/A (Yıldızsız)</span>
                                                                ) : (
                                                                    <span className="flex items-center gap-1">
                                                                        <span className="font-semibold">{starOpt}★</span>
                                                                        <span className="flex items-center text-amber-500">
                                                                            {[...Array(Number(starOpt))].map((_, idx) => (
                                                                                <span key={idx} className="material-symbols-outlined text-[13px]">star</span>
                                                                            ))}
                                                                        </span>
                                                                    </span>
                                                                )}
                                                            </div>
                                                            {isSelected && <span className="material-symbols-outlined text-[15px]">check</span>}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>

                                    {hasActiveFavoriteFilters && (
                                        <button
                                            type="button"
                                            onClick={handleClearFavoriteFilters}
                                            className="h-10 px-3 rounded-xl border border-slate-200 dark:border-[#5f6368] hover:bg-red-50 hover:text-red-600 hover:border-red-200 dark:hover:bg-red-950/30 text-xs font-medium text-[#5f6368] dark:text-[#9aa0a6] flex items-center gap-1 transition-colors cursor-pointer"
                                            title="Filtreleri Temizle"
                                        >
                                            <span className="material-symbols-outlined text-[16px]">filter_alt_off</span>
                                            <span>Filtreleri Temizle</span>
                                        </button>
                                    )}
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={handleExportFavoritesExcel}
                                        disabled={isExportingFavExcel || favoriteLoading}
                                        className="flex items-center gap-1.5 h-10 px-3.5 bg-white dark:bg-[#303134] hover:bg-[#f1f3f4] dark:hover:bg-[#3c4043] border border-[#dadce0] dark:border-[#5f6368] rounded-xl text-xs font-medium text-emerald-600 dark:text-emerald-400 transition-all cursor-pointer disabled:opacity-50 shadow-2xs"
                                        title="Excel'e Aktar"
                                    >
                                        <span className="material-symbols-outlined text-[18px]">table_view</span>
                                        <span className="hidden sm:inline">Excel</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={handleExportFavoritesPdf}
                                        disabled={isExportingFavPdf || favoriteLoading}
                                        className="flex items-center gap-1.5 h-10 px-3.5 bg-white dark:bg-[#303134] hover:bg-[#f1f3f4] dark:hover:bg-[#3c4043] border border-[#dadce0] dark:border-[#5f6368] rounded-xl text-xs font-medium text-rose-600 dark:text-rose-400 transition-all cursor-pointer disabled:opacity-50 shadow-2xs"
                                        title="PDF'e Aktar"
                                    >
                                        <span className="material-symbols-outlined text-[18px]">picture_as_pdf</span>
                                        <span className="hidden sm:inline">PDF</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => fetchFavoriteHotels(favoritePage)}
                                        disabled={favoriteLoading}
                                        className="size-10 rounded-xl border border-[#dadce0] dark:border-[#5f6368] hover:bg-[#f1f3f4] dark:hover:bg-[#3c4043] flex items-center justify-center text-[#5f6368] dark:text-[#9aa0a6] transition-all cursor-pointer disabled:opacity-50 shadow-2xs"
                                        title="Yenile"
                                    >
                                        <span className={`material-symbols-outlined text-[18px] ${favoriteLoading ? 'animate-spin' : ''}`}>refresh</span>
                                    </button>
                                </div>
                            </div>

                            {/* Table */}
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-[#f8f9fa] dark:bg-[#202124] border-b border-[#dadce0] dark:border-[#3c4043] text-[11px] font-semibold text-[#5f6368] dark:text-[#9aa0a6] uppercase tracking-wider">
                                            <th className="px-4 py-3">Otel Bilgisi</th>
                                            <th className="px-4 py-3">Yıldız</th>
                                            <th className="px-4 py-3">Otel Ülkesi</th>
                                            <th className="px-4 py-3">Otel Şehri</th>
                                            <th className="px-4 py-3">Otel Bölgesi</th>
                                            <th className="px-4 py-3 text-center">Durum</th>
                                            <th className="px-4 py-3 text-right">İşlemler</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#dadce0]/60 dark:divide-[#3c4043]/60 text-xs text-[#202124] dark:text-slate-100">
                                        {favoriteLoading ? (
                                            <TableSkeleton columns={7} rows={5} />
                                        ) : favoriteBackendItems.length === 0 ? (
                                            <tr>
                                                <td colSpan={7} className="px-4 py-12 text-center text-[#70757a]">
                                                    <span className="material-symbols-outlined text-4xl text-slate-300 dark:text-slate-600 mb-2">bookmark_border</span>
                                                    <p className="text-sm font-medium">
                                                        {hasActiveFavoriteFilters
                                                            ? 'Seçilen filtrelere uygun favori otel bulunamadı'
                                                            : 'Favori otel kaydı bulunamadı'}
                                                    </p>
                                                    {hasActiveFavoriteFilters && (
                                                        <button
                                                            type="button"
                                                            onClick={handleClearFavoriteFilters}
                                                            className="mt-3 px-3.5 py-1.5 rounded-lg bg-[#e8f0fe] text-[#1a73e8] hover:bg-[#d2e3fc] text-xs font-semibold transition-colors cursor-pointer"
                                                        >
                                                            Filtreleri Temizle
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ) : (
                                            favoriteBackendItems.map((fav) => {
                                                const starCount = Number(fav.hotelStar ?? fav.stars) || 0;
                                                const countryDisplay = fav.hotelCountry || fav.countryName || fav.countryCode || 'N/A';
                                                const cityDisplay = fav.hotelCity || fav.cityName || 'N/A';
                                                const regionDisplay = fav.hotelRegion || fav.regionName || 'N/A';
                                                return (
                                                    <tr key={fav.id} className="hover:bg-[#f8f9fa] dark:hover:bg-[#2a2b2e]/60 transition-colors">
                                                        <td className="px-4 py-3">
                                                            <div className="flex items-center gap-3">
                                                                <div className="size-9 rounded-xl bg-orange-50 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400 flex items-center justify-center shrink-0">
                                                                    <span className="material-symbols-outlined text-[19px]">hotel</span>
                                                                </div>
                                                                <div>
                                                                    <div className="font-semibold text-[#202124] dark:text-white leading-tight">
                                                                        {fav.hotelName || 'Otel Adı'}
                                                                    </div>
                                                                    <div className="text-[10px] text-[#70757a] font-mono mt-0.5">ID: #{fav.hotelId}</div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            {starCount >= 1 && starCount <= 5 ? (
                                                                <div className="flex items-center text-amber-500 font-bold" title={`${starCount}★`}>
                                                                    {[...Array(starCount)].map((_, i) => (
                                                                        <span key={i} className="material-symbols-outlined text-[14px]">star</span>
                                                                    ))}
                                                                </div>
                                                            ) : (
                                                                <span className="text-xs font-medium text-[#70757a]">N/A</span>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <span className={`font-medium ${countryDisplay === 'N/A' ? 'text-[#70757a]' : 'text-[#202124] dark:text-white'}`}>
                                                                {countryDisplay}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <span className={`font-medium ${cityDisplay === 'N/A' ? 'text-[#70757a]' : 'text-[#202124] dark:text-white'}`}>
                                                                {cityDisplay}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <span className={`font-medium ${regionDisplay === 'N/A' ? 'text-[#70757a]' : 'text-[#202124] dark:text-white'}`}>
                                                                {regionDisplay}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3 text-center">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleToggleFavoriteStatus(fav)}
                                                                className={`size-8 rounded-full flex items-center justify-center transition-colors cursor-pointer mx-auto ${
                                                                    fav.status === 'ACTIVE'
                                                                        ? 'bg-blue-50 text-[#1a73e8] dark:bg-blue-900/30 dark:text-blue-300'
                                                                        : 'bg-slate-100 text-slate-400 dark:bg-slate-800'
                                                                }`}
                                                                title={fav.status === 'ACTIVE' ? 'Aktif' : 'Pasif'}
                                                            >
                                                                <span className="material-symbols-outlined text-[18px]">
                                                                    {fav.status === 'ACTIVE' ? 'thumb_up' : 'thumb_up_off_alt'}
                                                                </span>
                                                            </button>
                                                        </td>
                                                        <td className="px-4 py-3 text-right">
                                                            <div className="flex items-center justify-end gap-1">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => navigate(`/travel/hotels/detail/${fav.hotelId}`)}
                                                                    className="size-8 rounded-lg text-slate-500 hover:text-[#1a73e8] hover:bg-[#e8f0fe] dark:hover:bg-blue-900/30 flex items-center justify-center transition-colors cursor-pointer"
                                                                    title="Otel Detayını Gör"
                                                                >
                                                                    <span className="material-symbols-outlined text-[17px]">visibility</span>
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleDeleteFavoriteItem(fav)}
                                                                    className="size-8 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center justify-center transition-colors cursor-pointer"
                                                                    title="Favorilerden Çıkar"
                                                                >
                                                                    <span className="material-symbols-outlined text-[17px]">delete</span>
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {!favoriteLoading && favoriteTotalElements > 0 && (
                                <div className="border-t border-[#dadce0] dark:border-[#3c4043]">
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
                            )}
                        </div>
                    </div>
                )}
            </main>

            {/* ─── MODALS ───────────────────────────────────────────────────── */}

            {/* Confirm Modal */}
            {confirmModal.show && (
                <div className="fixed inset-0 z-[30000] flex items-center justify-center p-4">
                    <div
                        className="fixed inset-0 bg-[#202124]/40 backdrop-blur-xs transition-opacity animate-in fade-in"
                        onClick={() => setConfirmModal({ ...confirmModal, show: false })}
                    />
                    <div className="relative bg-white dark:bg-[#202124] w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden border border-[#dadce0] dark:border-[#3c4043] animate-in zoom-in-95 duration-200 p-6 text-center">
                        <div className={`size-12 rounded-2xl flex items-center justify-center mx-auto mb-4 ${
                            confirmModal.type === 'danger'
                                ? 'bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400'
                                : 'bg-[#e8f0fe] text-[#1a73e8] dark:bg-[#1a73e8]/20 dark:text-[#8ab4f8]'
                        }`}>
                            <span className="material-symbols-outlined text-[24px]">
                                {confirmModal.type === 'danger' ? 'delete' : 'help'}
                            </span>
                        </div>
                        <h3 className="text-base font-bold text-[#202124] dark:text-white mb-1.5">{confirmModal.title}</h3>
                        <p className="text-xs text-[#5f6368] dark:text-[#9aa0a6] mb-6 leading-relaxed">{confirmModal.message}</p>
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={() => setConfirmModal({ ...confirmModal, show: false })}
                                className="flex-1 h-10 rounded-xl border border-[#dadce0] dark:border-[#5f6368] text-xs font-semibold text-[#5f6368] dark:text-[#9aa0a6] hover:bg-[#f1f3f4] dark:hover:bg-[#303134] transition-colors cursor-pointer"
                            >
                                Vazgeç
                            </button>
                            <button
                                type="button"
                                onClick={() => { confirmModal.onConfirm?.(); setConfirmModal({ ...confirmModal, show: false }); }}
                                className={`flex-1 h-10 rounded-xl text-xs font-semibold text-white shadow-xs transition-all active:scale-95 cursor-pointer ${
                                    confirmModal.type === 'danger'
                                        ? 'bg-red-600 hover:bg-red-700'
                                        : 'bg-[#1a73e8] hover:bg-[#1557b0]'
                                }`}
                            >
                                Onayla
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* User Modal */}
            {isUserModalOpen && (
                <div className="fixed inset-0 z-[20000] flex items-center justify-center p-4 overflow-y-auto">
                    <div className="fixed inset-0 bg-[#202124]/40 backdrop-blur-xs" onClick={() => setIsUserModalOpen(false)} />
                    <div className="relative bg-white dark:bg-[#202124] w-full max-w-lg rounded-2xl shadow-2xl border border-[#dadce0] dark:border-[#3c4043] overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-[#dadce0] dark:border-[#3c4043] flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="size-9 rounded-xl bg-[#e8f0fe] dark:bg-[#1a73e8]/20 text-[#1a73e8] dark:text-[#8ab4f8] flex items-center justify-center">
                                    <span className="material-symbols-outlined text-[20px]">{editingUser ? 'manage_accounts' : 'person_add'}</span>
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-[#202124] dark:text-white">{editingUser ? (L('editUser') || 'Kullanıcıyı Düzenle') : (L('addUser') || 'Yeni Kullanıcı')}</h3>
                                    <p className="text-xs text-[#5f6368] dark:text-[#9aa0a6]">{L('userInfo') || 'Acente personeli hesap detayları'}</p>
                                </div>
                            </div>
                            <button onClick={() => setIsUserModalOpen(false)} className="size-8 rounded-lg flex items-center justify-center text-[#70757a] hover:bg-[#f1f3f4] dark:hover:bg-[#303134]">
                                <span className="material-symbols-outlined text-[18px]">close</span>
                            </button>
                        </div>

                        <form onSubmit={handleUserSubmit} className="p-6 space-y-4">
                            {userApiError && (
                                <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 rounded-xl text-xs text-red-600 dark:text-red-400 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-[16px]">error</span>
                                    <span>{userApiError}</span>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-semibold text-[#5f6368] dark:text-[#9aa0a6] uppercase tracking-wide block mb-1">Ad</label>
                                    <input
                                        type="text"
                                        required
                                        value={userFormData.name}
                                        onChange={(e) => setUserFormData(prev => ({ ...prev, name: e.target.value }))}
                                        className="w-full h-10 bg-white dark:bg-[#303134] border border-[#dadce0] dark:border-[#5f6368] rounded-xl px-3 text-xs text-[#202124] dark:text-white outline-none focus:border-[#1a73e8]"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-[#5f6368] dark:text-[#9aa0a6] uppercase tracking-wide block mb-1">Soyad</label>
                                    <input
                                        type="text"
                                        required
                                        value={userFormData.surname}
                                        onChange={(e) => setUserFormData(prev => ({ ...prev, surname: e.target.value }))}
                                        className="w-full h-10 bg-white dark:bg-[#303134] border border-[#dadce0] dark:border-[#5f6368] rounded-xl px-3 text-xs text-[#202124] dark:text-white outline-none focus:border-[#1a73e8]"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-semibold text-[#5f6368] dark:text-[#9aa0a6] uppercase tracking-wide block mb-1">E-posta Adresi</label>
                                <input
                                    type="email"
                                    required
                                    autoComplete="new-email"
                                    value={userFormData.email}
                                    onChange={(e) => setUserFormData(prev => ({ ...prev, email: e.target.value }))}
                                    className="w-full h-10 bg-white dark:bg-[#303134] border border-[#dadce0] dark:border-[#5f6368] rounded-xl px-3 text-xs text-[#202124] dark:text-white outline-none focus:border-[#1a73e8]"
                                />
                            </div>

                            {!editingUser && (
                                <div>
                                    <label className="text-xs font-semibold text-[#5f6368] dark:text-[#9aa0a6] uppercase tracking-wide block mb-1">Şifre</label>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            required
                                            autoComplete="new-password"
                                            value={userFormData.password}
                                            onChange={(e) => setUserFormData(prev => ({ ...prev, password: e.target.value }))}
                                            className="w-full h-10 bg-white dark:bg-[#303134] border border-[#dadce0] dark:border-[#5f6368] rounded-xl pl-3 pr-10 text-xs text-[#202124] dark:text-white outline-none focus:border-[#1a73e8]"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                        >
                                            <span className="material-symbols-outlined text-[17px]">{showPassword ? 'visibility_off' : 'visibility'}</span>
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-2 gap-1.5 mt-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 text-[11px]">
                                        {[
                                            { key: 'length', label: 'En az 12 karakter' },
                                            { key: 'uppercase', label: 'Büyük harf (A-Z)' },
                                            { key: 'lowercase', label: 'Küçük harf (a-z)' },
                                            { key: 'number', label: 'Rakam (0-9)' },
                                            { key: 'special', label: 'Özel karakter (!@#$)' }
                                        ].map(rule => {
                                            const isValid = validatePassword(userFormData.password)[rule.key];
                                            return (
                                                <div key={rule.key} className="flex items-center gap-1.5">
                                                    <span className={`material-symbols-outlined text-[14px] ${isValid ? 'text-emerald-500' : 'text-slate-400'}`}>
                                                        {isValid ? 'check_circle' : 'radio_button_unchecked'}
                                                    </span>
                                                    <span className={isValid ? 'text-emerald-600 font-medium' : 'text-slate-500'}>{rule.label}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            <PhoneInput
                                label="Telefon Numarası"
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
                                    <label className="text-xs font-semibold text-[#5f6368] dark:text-[#9aa0a6] uppercase tracking-wide block mb-1">Rol</label>
                                    <select
                                        multiple
                                        value={userFormData.roleIds}
                                        onChange={(e) => setUserFormData(prev => ({ ...prev, roleIds: Array.from(e.target.selectedOptions, option => parseInt(option.value)) }))}
                                        className="w-full min-h-[80px] bg-white dark:bg-[#303134] border border-[#dadce0] dark:border-[#5f6368] rounded-xl p-2 text-xs text-[#202124] dark:text-white outline-none focus:border-[#1a73e8]"
                                    >
                                        {roles.map(r => <option key={r.id} value={r.id} className="py-1 px-2">{r.roleName || r.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-[#5f6368] dark:text-[#9aa0a6] uppercase tracking-wide block mb-1">Durum</label>
                                    <select
                                        value={userFormData.status}
                                        onChange={(e) => setUserFormData(prev => ({ ...prev, status: e.target.value }))}
                                        className="w-full h-10 bg-white dark:bg-[#303134] border border-[#dadce0] dark:border-[#5f6368] rounded-xl px-3 text-xs text-[#202124] dark:text-white outline-none focus:border-[#1a73e8]"
                                    >
                                        <option value="ACTIVE">Aktif</option>
                                        <option value="PASSIVE">Pasif</option>
                                    </select>
                                </div>
                            </div>

                            <div className="pt-3 border-t border-[#dadce0] dark:border-[#3c4043] flex items-center justify-end gap-2.5">
                                <button
                                    type="button"
                                    onClick={() => setIsUserModalOpen(false)}
                                    className="h-10 px-4 rounded-xl border border-[#dadce0] dark:border-[#5f6368] text-xs font-semibold text-[#5f6368] dark:text-[#9aa0a6] hover:bg-[#f1f3f4] dark:hover:bg-[#303134]"
                                >
                                    Vazgeç
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="h-10 px-5 rounded-xl bg-[#1a73e8] hover:bg-[#1557b0] text-white text-xs font-semibold shadow-xs"
                                >
                                    {saving ? 'Kaydediliyor...' : 'Kaydet'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Update Password Modal */}
            {isPasswordModalOpen && passwordTargetUser && (
                <div className="fixed inset-0 z-[20000] flex items-center justify-center p-4 overflow-y-auto">
                    <div className="fixed inset-0 bg-[#202124]/40 backdrop-blur-xs" onClick={() => !isPasswordSubmitting && setIsPasswordModalOpen(false)} />
                    <div className="relative bg-white dark:bg-[#202124] w-full max-w-md rounded-2xl shadow-2xl border border-[#dadce0] dark:border-[#3c4043] overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-[#dadce0] dark:border-[#3c4043] flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="size-9 rounded-xl bg-[#e8f0fe] dark:bg-[#1a73e8]/20 text-[#1a73e8] dark:text-[#8ab4f8] flex items-center justify-center">
                                    <span className="material-symbols-outlined text-[20px]">lock_reset</span>
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-[#202124] dark:text-white">Şifre Güncelle</h3>
                                    <p className="text-xs text-[#5f6368] dark:text-[#9aa0a6] truncate max-w-[200px]">{passwordTargetUser.name} {passwordTargetUser.surname}</p>
                                </div>
                            </div>
                            <button onClick={() => setIsPasswordModalOpen(false)} className="size-8 rounded-lg flex items-center justify-center text-[#70757a] hover:bg-[#f1f3f4] dark:hover:bg-[#303134]">
                                <span className="material-symbols-outlined text-[18px]">close</span>
                            </button>
                        </div>

                        <form onSubmit={handleUpdatePasswordSubmit} className="p-6 space-y-4">
                            {passwordModalError && (
                                <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 rounded-xl text-xs text-red-600 dark:text-red-400 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-[16px]">error</span>
                                    <span>{passwordModalError}</span>
                                </div>
                            )}

                            <div>
                                <label className="text-xs font-semibold text-[#5f6368] dark:text-[#9aa0a6] uppercase tracking-wide block mb-1">Yeni Şifre</label>
                                <div className="relative">
                                    <input
                                        type={showUpdatePasswordText ? "text" : "password"}
                                        required
                                        autoComplete="new-password"
                                        value={updatePasswordValue}
                                        onChange={(e) => setUpdatePasswordValue(e.target.value)}
                                        placeholder="Güçlü yeni şifre giriniz"
                                        className="w-full h-10 bg-white dark:bg-[#303134] border border-[#dadce0] dark:border-[#5f6368] rounded-xl pl-3 pr-10 text-xs text-[#202124] dark:text-white outline-none focus:border-[#1a73e8]"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowUpdatePasswordText(!showUpdatePasswordText)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                    >
                                        <span className="material-symbols-outlined text-[17px]">{showUpdatePasswordText ? 'visibility_off' : 'visibility'}</span>
                                    </button>
                                </div>

                                <div className="grid grid-cols-2 gap-1.5 mt-2.5 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 text-[11px]">
                                    {[
                                        { key: 'length', label: 'En az 12 karakter' },
                                        { key: 'uppercase', label: 'Büyük harf (A-Z)' },
                                        { key: 'lowercase', label: 'Küçük harf (a-z)' },
                                        { key: 'number', label: 'Rakam (0-9)' },
                                        { key: 'special', label: 'Özel karakter' }
                                    ].map(rule => {
                                        const isValid = validatePassword(updatePasswordValue)[rule.key];
                                        return (
                                            <div key={rule.key} className="flex items-center gap-1.5">
                                                <span className={`material-symbols-outlined text-[14px] ${isValid ? 'text-emerald-500' : 'text-slate-400'}`}>
                                                    {isValid ? 'check_circle' : 'radio_button_unchecked'}
                                                </span>
                                                <span className={isValid ? 'text-emerald-600 font-medium' : 'text-slate-500'}>{rule.label}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="pt-3 border-t border-[#dadce0] dark:border-[#3c4043] flex items-center justify-end gap-2.5">
                                <button
                                    type="button"
                                    onClick={() => setIsPasswordModalOpen(false)}
                                    className="h-10 px-4 rounded-xl border border-[#dadce0] dark:border-[#5f6368] text-xs font-semibold text-[#5f6368] dark:text-[#9aa0a6] hover:bg-[#f1f3f4] dark:hover:bg-[#303134]"
                                >
                                    Vazgeç
                                </button>
                                <button
                                    type="submit"
                                    disabled={isPasswordSubmitting || !Object.values(validatePassword(updatePasswordValue)).every(Boolean)}
                                    className="h-10 px-5 rounded-xl bg-[#1a73e8] hover:bg-[#1557b0] text-white text-xs font-semibold shadow-xs disabled:opacity-50"
                                >
                                    {isPasswordSubmitting ? 'İşleniyor...' : 'Şifreyi Güncelle'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Guest Modal */}
            {isGuestModalOpen && (
                <div className="fixed inset-0 z-[20000] flex items-center justify-center p-4 overflow-y-auto">
                    <div className="fixed inset-0 bg-[#202124]/40 backdrop-blur-xs" onClick={() => setIsGuestModalOpen(false)} />
                    <div className="relative bg-white dark:bg-[#202124] w-full max-w-2xl rounded-2xl shadow-2xl border border-[#dadce0] dark:border-[#3c4043] overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-[#dadce0] dark:border-[#3c4043] flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="size-9 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-[20px]">{editingGuest ? 'badge' : 'person_add'}</span>
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-[#202124] dark:text-white">{editingGuest ? (L('editGuest') || 'Misafiri Düzenle') : (L('addGuest') || 'Yeni Misafir Ekle')}</h3>
                                    <p className="text-xs text-[#5f6368] dark:text-[#9aa0a6]">{L('guestInfo') || 'Misafir kimlik ve seyahat detayları'}</p>
                                </div>
                            </div>
                            <button onClick={() => setIsGuestModalOpen(false)} className="size-8 rounded-lg flex items-center justify-center text-[#70757a] hover:bg-[#f1f3f4] dark:hover:bg-[#303134]">
                                <span className="material-symbols-outlined text-[18px]">close</span>
                            </button>
                        </div>

                        <form onSubmit={handleGuestSubmit} className="p-6 space-y-4">
                            {guestApiError && (
                                <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 rounded-xl text-xs text-red-600 dark:text-red-400 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-[16px]">error</span>
                                    <span>{guestApiError}</span>
                                </div>
                            )}

                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <label className="text-xs font-semibold text-[#5f6368] dark:text-[#9aa0a6] uppercase tracking-wide block mb-1">Cinsiyet</label>
                                    <select
                                        value={guestFormData.gender}
                                        onChange={(e) => setGuestFormData(prev => ({ ...prev, gender: e.target.value }))}
                                        className="w-full h-10 bg-white dark:bg-[#303134] border border-[#dadce0] dark:border-[#5f6368] rounded-xl px-3 text-xs text-[#202124] dark:text-white outline-none focus:border-[#1a73e8]"
                                    >
                                        <option value="MALE">Erkek</option>
                                        <option value="FEMALE">Kadın</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-[#5f6368] dark:text-[#9aa0a6] uppercase tracking-wide block mb-1">Ad</label>
                                    <input
                                        type="text"
                                        required
                                        value={guestFormData.firstName}
                                        onChange={(e) => setGuestFormData(prev => ({ ...prev, firstName: e.target.value }))}
                                        className="w-full h-10 bg-white dark:bg-[#303134] border border-[#dadce0] dark:border-[#5f6368] rounded-xl px-3 text-xs text-[#202124] dark:text-white outline-none focus:border-[#1a73e8]"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-[#5f6368] dark:text-[#9aa0a6] uppercase tracking-wide block mb-1">Soyad</label>
                                    <input
                                        type="text"
                                        required
                                        value={guestFormData.lastName}
                                        onChange={(e) => setGuestFormData(prev => ({ ...prev, lastName: e.target.value }))}
                                        className="w-full h-10 bg-white dark:bg-[#303134] border border-[#dadce0] dark:border-[#5f6368] rounded-xl px-3 text-xs text-[#202124] dark:text-white outline-none focus:border-[#1a73e8]"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-semibold text-[#5f6368] dark:text-[#9aa0a6] uppercase tracking-wide block mb-1">Doğum Tarihi</label>
                                    <DatePicker
                                        selected={guestFormData.birthDate ? new Date(formatToPickerDate(guestFormData.birthDate)) : null}
                                        onChange={(date) => setGuestFormData(prev => ({ ...prev, birthDate: date ? formatToBackendDate(date.toISOString().split('T')[0]) : '' }))}
                                        dateFormat="dd.MM.yyyy"
                                        placeholderText="GG.AA.YYYY"
                                        showMonthDropdown
                                        showYearDropdown
                                        dropdownMode="select"
                                        className="w-full h-10 bg-white dark:bg-[#303134] border border-[#dadce0] dark:border-[#5f6368] rounded-xl px-3 text-xs text-[#202124] dark:text-white outline-none focus:border-[#1a73e8]"
                                        wrapperClassName="w-full"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-[#5f6368] dark:text-[#9aa0a6] uppercase tracking-wide block mb-1">Ülke / Uyruk</label>
                                    <select
                                        value={guestFormData.country}
                                        onChange={(e) => setGuestFormData(prev => ({ ...prev, country: e.target.value }))}
                                        className="w-full h-10 bg-white dark:bg-[#303134] border border-[#dadce0] dark:border-[#5f6368] rounded-xl px-3 text-xs text-[#202124] dark:text-white outline-none focus:border-[#1a73e8] cursor-pointer"
                                    >
                                        <option value="">Ülke Seçiniz</option>
                                        {countries.map((c, idx) => {
                                            const code = c.countryIso2 || c.code || c.id;
                                            return (
                                                <option key={code || idx} value={code}>
                                                    {getCountryName(countries, code, currentLang)}
                                                </option>
                                            );
                                        })}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-semibold text-[#5f6368] dark:text-[#9aa0a6] uppercase tracking-wide block mb-1">Pasaport No</label>
                                    <input
                                        type="text"
                                        value={guestFormData.passportNo}
                                        onChange={(e) => setGuestFormData(prev => ({ ...prev, passportNo: e.target.value }))}
                                        className="w-full h-10 bg-white dark:bg-[#303134] border border-[#dadce0] dark:border-[#5f6368] rounded-xl px-3 text-xs text-[#202124] dark:text-white outline-none focus:border-[#1a73e8]"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-[#5f6368] dark:text-[#9aa0a6] uppercase tracking-wide block mb-1">Pasaport Geçerlilik Tarihi</label>
                                    <DatePicker
                                        selected={guestFormData.passportExpiry ? new Date(formatToPickerDate(guestFormData.passportExpiry)) : null}
                                        onChange={(date) => setGuestFormData(prev => ({ ...prev, passportExpiry: date ? formatToBackendDate(date.toISOString().split('T')[0]) : '' }))}
                                        dateFormat="dd.MM.yyyy"
                                        placeholderText="GG.AA.YYYY"
                                        showMonthDropdown
                                        showYearDropdown
                                        dropdownMode="select"
                                        className="w-full h-10 bg-white dark:bg-[#303134] border border-[#dadce0] dark:border-[#5f6368] rounded-xl px-3 text-xs text-[#202124] dark:text-white outline-none focus:border-[#1a73e8]"
                                        wrapperClassName="w-full"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-semibold text-[#5f6368] dark:text-[#9aa0a6] uppercase tracking-wide block mb-1">E-posta</label>
                                    <input
                                        type="email"
                                        required
                                        value={guestFormData.email}
                                        onChange={(e) => setGuestFormData(prev => ({ ...prev, email: e.target.value }))}
                                        className="w-full h-10 bg-white dark:bg-[#303134] border border-[#dadce0] dark:border-[#5f6368] rounded-xl px-3 text-xs text-[#202124] dark:text-white outline-none focus:border-[#1a73e8]"
                                    />
                                </div>
                                <div>
                                    <PhoneInput
                                        label="Telefon Numarası"
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
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-semibold text-[#5f6368] dark:text-[#9aa0a6] uppercase tracking-wide block mb-1">Durum</label>
                                <select
                                    value={guestFormData.status}
                                    onChange={(e) => setGuestFormData(prev => ({ ...prev, status: e.target.value }))}
                                    className="w-full h-10 bg-white dark:bg-[#303134] border border-[#dadce0] dark:border-[#5f6368] rounded-xl px-3 text-xs text-[#202124] dark:text-white outline-none focus:border-[#1a73e8]"
                                >
                                    <option value="ACTIVE">Aktif</option>
                                    <option value="PASSIVE">Pasif</option>
                                </select>
                            </div>

                            <div className="pt-3 border-t border-[#dadce0] dark:border-[#3c4043] flex items-center justify-end gap-2.5">
                                <button
                                    type="button"
                                    onClick={() => setIsGuestModalOpen(false)}
                                    className="h-10 px-4 rounded-xl border border-[#dadce0] dark:border-[#5f6368] text-xs font-semibold text-[#5f6368] dark:text-[#9aa0a6] hover:bg-[#f1f3f4] dark:hover:bg-[#303134]"
                                >
                                    Vazgeç
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="h-10 px-5 rounded-xl bg-[#1a73e8] hover:bg-[#1557b0] text-white text-xs font-semibold shadow-xs"
                                >
                                    {saving ? 'Kaydediliyor...' : 'Kaydet'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MyOffice;
