import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { bookingService } from '../services/bookingService';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from '../components/ThemeToggle';
import BookingStatusBadge from '../components/BookingStatusBadge';
import { BOOKING_STATUS_CONFIG } from '../utils/bookingStatusUtils';

const MyBookings = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState(10);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [summaries, setSummaries] = useState([]);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = React.useRef(null);
    const hasLoadedData = React.useRef(false);

    // Filter state - matching all API fields
    const [filters, setFilters] = useState({
        id: '',
        voucher: '',
        supplierId: '',
        supplierName: '',
        internalHotelId: '',
        bookingUuid: '',
        paymentStatus: '',
        bookingStatus: '',
        clientReferenceId: '',
        requestId: '',
        hotelName: '',
        createDateStart: '',
        createDateEnd: '',
        checkInStart: '',
        checkInEnd: '',
        checkOutStart: '',
        checkOutEnd: '',
        minAmount: '',
        maxAmount: '',
        currencies: [],
        principalAgencyIds: '',
        minCancellationAmount: '',
        maxCancellationAmount: '',
        cancelReason: '',
        isCancelled: '',
    });

    const [showFilters, setShowFilters] = useState(false);

    React.useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsMenuOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    useEffect(() => {
        // Only fetch if we haven't loaded data yet or if page/pageSize changed
        if (!hasLoadedData.current || bookings.length === 0) {
            const abortController = new AbortController();
            searchBookings(abortController.signal);
            hasLoadedData.current = true;
            return () => abortController.abort();
        }
    }, []);

    const searchBookings = async (signal) => {
        try {
            setLoading(true);
            setError(null);

            // Build filter object (matching API request structure)
            const filterObj = {};
            Object.keys(filters).forEach(key => {
                const value = filters[key];
                if (value === '' || value === null || value === undefined || (Array.isArray(value) && value.length === 0)) {
                    filterObj[key] = null;
                } else {
                    // Handle numeric fields
                    if (['id', 'supplierId', 'minAmount', 'maxAmount', 'minCancellationAmount', 'maxCancellationAmount', 'internalHotelId'].includes(key)) {
                        filterObj[key] = value === '' ? null : Number(value);
                    }
                    // Handle boolean fields
                    else if (key === 'isCancelled') {
                        filterObj[key] = value === 'true';
                    }
                    // Handle Date fields (LocalDate) - No time
                    else if ((key.includes('checkIn') || key.includes('checkOut')) && (key.endsWith('Start') || key.endsWith('End'))) {
                        filterObj[key] = value;
                    }
                    // Handle DateTime fields (LocalDateTime) - with T00:00:00 or T23:59:59
                    else if (key === 'createDateStart') {
                        filterObj[key] = value + 'T00:00:00';
                    }
                    else if (key === 'createDateEnd') {
                        filterObj[key] = value + 'T23:59:59';
                    }
                    // Handle List fields
                    else if (key === 'currencies' && Array.isArray(value) && value.length > 0) {
                        filterObj[key] = value;
                    }
                    else if (key === 'principalAgencyIds' && value) {
                        filterObj[key] = value.split(',').map(id => Number(id.trim())).filter(id => !isNaN(id));
                    }
                    // Default string handling (voucher, name, uuid, reference, requestId, hotelId)
                    else {
                        filterObj[key] = value;
                    }
                }
            });

            const data = await bookingService.searchBookings(filterObj, page, pageSize, signal);

            if (!signal?.aborted) {
                // Extract data from nested structure: data.bookings contains pagination info
                const bookingsData = data.bookings || {};
                setBookings(bookingsData.content || []);
                setTotalPages(bookingsData.totalPages || 0);
                setTotalElements(bookingsData.totalElements || 0);
                setSummaries(data.summaries || []);
            }
        } catch (error) {
            if (error.name !== 'AbortError') {
                console.error('Search error:', error);
                setError(error.message);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    // Debounced search for all filters
    useEffect(() => {
        if (hasLoadedData.current) {
            const timer = setTimeout(() => {
                handleSearch();
            }, 800); // 800ms debounce

            return () => clearTimeout(timer);
        }
    }, [
        filters.id,
        filters.voucher,
        filters.supplierId,
        filters.supplierName,
        filters.internalHotelId,
        filters.bookingUuid,
        filters.clientReferenceId,
        filters.requestId,
        filters.hotelName,
        filters.createDateStart,
        filters.createDateEnd,
        filters.checkInStart,
        filters.checkInEnd,
        filters.checkOutStart,
        filters.checkOutEnd,
        filters.minAmount,
        filters.maxAmount,
        filters.minCancellationAmount,
        filters.maxCancellationAmount,
        filters.principalAgencyIds,
        // Select filters are also included here for consistency, or we can keep separate logic.
        // It's cleaner to have ONE effect for all search triggers if possible, 
        // with immediate trigger for selects vs debounce for text?
        // For simplicity and user request, everything auto-searches. 
        // Selects can also be debounced or instantaneous.
        // Let's include select filters here too and remove the separate effect.
        filters.paymentStatus,
        filters.bookingStatus,
        filters.isCancelled
    ]);

    const handleSearch = () => {
        setPage(0);
        const abortController = new AbortController();
        searchBookings(abortController.signal);
    };

    const handleClearFilters = () => {
        setFilters({
            id: '',
            voucher: '',
            supplierId: '',
            supplierName: '',
            internalHotelId: '',
            bookingUuid: '',
            paymentStatus: '',
            bookingStatus: '',
            clientReferenceId: '',
            requestId: '',
            hotelName: '',
            createDateStart: '',
            createDateEnd: '',
            checkInStart: '',
            checkInEnd: '',
            checkOutStart: '',
            checkOutEnd: '',
            minAmount: '',
            maxAmount: '',
            currencies: [],
            principalAgencyIds: '',
            minCancellationAmount: '',
            maxCancellationAmount: '',
            cancelReason: '',
            isCancelled: '',
        });
        setPage(0);
    };

    // Separate effect for page/pageSize changes
    useEffect(() => {
        if (hasLoadedData.current && bookings.length > 0) {
            const abortController = new AbortController();
            searchBookings(abortController.signal);
            return () => abortController.abort();
        }
    }, [page, pageSize]);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const userDisplayName = user?.name && user?.surname
        ? `${user.name} ${user.surname}`
        : user?.email || 'Travel Agent';

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const formatDateTime = (dateTimeString) => {
        if (!dateTimeString) return 'N/A';
        const date = new Date(dateTimeString);
        return date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };



    const getPaymentStatusColor = (status) => {
        switch (status) {
            case 'PAID_CREDIT_CARD':
            case 'PAID_ACCOUNT':
                return 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400';
            case 'PENDING_PAYMENT':
                return 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400';
            case 'REFUNDED_CREDIT_CARD':
            case 'REFUNDED_ACCOUNT':
                return 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400';
            case 'FAILED':
                return 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400';
            default:
                return 'bg-slate-100 text-slate-600 dark:bg-slate-900/30 dark:text-slate-400';
        }
    };

    const getInitials = (name) => {
        if (!name) return '??';
        const words = name.split(' ');
        if (words.length >= 2) {
            return (words[0][0] + words[1][0]).toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    };

    return (
        <div className="flex h-screen bg-[#F8FAFC] dark:bg-[#020617] text-slate-900 dark:text-slate-100 transition-colors duration-200 font-sans overflow-hidden relative">
            {/* Ambient Background Glows */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 blur-[120px] rounded-full pointer-events-none"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/5 blur-[120px] rounded-full pointer-events-none"></div>

            {/* Sidebar - Modern Glassy */}
            <aside className="w-64 border-r border-white/40 dark:border-white/5 bg-white/40 dark:bg-slate-900/40 backdrop-blur-3xl hidden lg:flex flex-col flex-shrink-0 relative z-40 transition-all duration-500">
                <div className="p-3 flex items-center gap-2">
                    <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white">
                        <span className="material-icons-round text-lg">language</span>
                    </div>
                    <span className="font-bold text-lg tracking-tight">TravelOfGlobe</span>
                </div>
                <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-xs w-full"
                    >
                        <span className="material-icons-round text-[20px]">grid_view</span>
                        Dashboard
                    </button>
                    <a className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-xs" href="#">
                        <span className="material-icons-round text-[20px]">corporate_fare</span>
                        My Office
                    </a>
                    <button
                        onClick={() => navigate('/bookings')}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-primary font-medium text-xs w-full"
                    >
                        <span className="material-icons-round text-[20px]">book_online</span>
                        My Bookings
                    </button>
                    <a className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-xs" href="#">
                        <span className="material-icons-round text-[20px]">account_balance_wallet</span>
                        Finance
                    </a>
                    <a className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-xs" href="#">
                        <span className="material-icons-round text-[20px]">analytics</span>
                        Accounting
                    </a>
                    <a className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-xs" href="#">
                        <span className="material-icons-round text-[20px]">settings</span>
                        Operations
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

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden relative z-10">
                {/* Header - Fixed Glassy */}
                <header className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-md border-b border-white/40 dark:border-white/5 px-8 py-5 flex-shrink-0 z-30 transition-all">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                                <span className="material-icons-round text-2xl">book_online</span>
                            </div>
                            <div>
                                <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">My Bookings</h1>
                                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                                    Manage and monitor all travel reservations
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={handleSearch}
                                className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 transition-all active:scale-95"
                            >
                                <span className="material-icons-round text-lg">refresh</span>
                                Refresh
                            </button>
                            <button
                                onClick={handleClearFilters}
                                className="flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-xl text-sm font-bold text-red-600 dark:text-red-400 transition-all active:scale-95"
                            >
                                <span className="material-icons-round text-lg">filter_alt_off</span>
                                Clear
                            </button>

                            <div className="h-8 w-px bg-slate-200 dark:bg-slate-800 mx-1"></div>

                            <ThemeToggle />

                            {/* User Profile Dropdown */}
                            <div className="relative" ref={menuRef}>
                                <button
                                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                                    className="flex items-center gap-2 transition-transform active:scale-95 focus:outline-none"
                                >
                                    <div className="size-10 rounded-full border-2 border-primary shadow-sm hover:shadow-md transition-shadow flex items-center justify-center bg-slate-100 dark:bg-slate-800" title={userDisplayName}>
                                        <span className="material-symbols-outlined text-slate-400 dark:text-slate-500 text-[28px]">person</span>
                                    </div>
                                    <span className="material-icons-round text-slate-500 dark:text-slate-400">expand_more</span>
                                </button>

                                {isMenuOpen && (
                                    <div className="absolute right-0 top-full mt-2 w-[340px] bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden z-[9999] animate-in fade-in slide-in-from-top-2">
                                        <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">My Account</p>
                                            <p className="text-sm font-bold text-slate-900 dark:text-white truncate" title={userDisplayName}>{userDisplayName}</p>
                                            <p className="text-sm text-slate-500 break-words font-medium mt-0.5">{user?.email}</p>
                                        </div>
                                        <div className="p-2 space-y-1">
                                            <button className="w-full text-left px-3 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg flex items-center gap-3 transition-colors">
                                                <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-slate-800 flex items-center justify-center text-primary">
                                                    <span className="material-icons-round text-[18px]">person</span>
                                                </div>
                                                Profile Details
                                            </button>
                                            <button className="w-full text-left px-3 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg flex items-center gap-3 transition-colors">
                                                <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-slate-800 flex items-center justify-center text-primary">
                                                    <span className="material-icons-round text-[18px]">settings</span>
                                                </div>
                                                Settings
                                            </button>
                                            <div className="border-t border-slate-100 dark:border-slate-800 my-1"></div>
                                            <button
                                                onClick={() => {
                                                    handleLogout();
                                                    setIsMenuOpen(false);
                                                }}
                                                className="w-full text-left px-3 py-2.5 text-sm font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg flex items-center gap-3 transition-colors"
                                            >
                                                <div className="w-8 h-8 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center text-red-500">
                                                    <span className="material-icons-round text-[18px]">logout</span>
                                                </div>
                                                Sign Out
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </header>

                {/* Content Area - Scrollable */}
                <div className="flex-1 overflow-auto p-8 relative">
                    {/* Background Intensity Glow for Table */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-[50%] bg-primary/5 blur-[150px] rounded-full pointer-events-none"></div>

                    {/* Table with Premium Design */}
                    <div className="relative bg-white/40 dark:bg-slate-900/40 backdrop-blur-3xl rounded-[40px] border border-white/60 dark:border-white/10 shadow-[0_32px_80px_-16px_rgba(0,0,0,0.08)] transition-all duration-500 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="bg-white/20 dark:bg-slate-800/20 border-b border-white/20 dark:border-white/5">
                                        <th className="px-6 py-5 text-left text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] whitespace-nowrap min-w-[100px]">ID</th>
                                        <th className="px-6 py-5 text-left text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] whitespace-nowrap min-w-[150px]">Voucher</th>
                                        <th className="px-6 py-5 text-left text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] whitespace-nowrap min-w-[300px]">Hotel</th>
                                        <th className="px-6 py-5 text-left text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] whitespace-nowrap min-w-[160px]">Created</th>
                                        <th className="px-6 py-5 text-left text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] whitespace-nowrap min-w-[160px]">Check-in</th>
                                        <th className="px-6 py-5 text-left text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] whitespace-nowrap min-w-[160px]">Check-out</th>
                                        <th className="px-6 py-5 text-left text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] whitespace-nowrap min-w-[140px]">Amount</th>
                                        <th className="px-6 py-5 text-left text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] whitespace-nowrap min-w-[140px]">Payment</th>
                                        <th className="px-6 py-5 text-left text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] whitespace-nowrap min-w-[140px]">Status</th>
                                        <th className="px-6 py-5 text-left text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] whitespace-nowrap min-w-[140px]">Cancel Fee</th>
                                        <th className="px-6 py-5 text-left text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] whitespace-nowrap min-w-[200px]">UUID</th>
                                        <th className="px-6 py-5 text-left text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] whitespace-nowrap min-w-[200px]">Agency</th>
                                        <th className="px-6 py-5 text-left text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] whitespace-nowrap min-w-[150px]">Hotel ID</th>
                                        <th className="px-6 py-5 text-left text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] whitespace-nowrap min-w-[180px]">Cl. Ref</th>
                                        <th className="px-6 py-5 text-left text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] whitespace-nowrap min-w-[100px]">Cancelled?</th>
                                    </tr>
                                    <tr className="bg-white/10 dark:bg-slate-800/10 border-b border-white/20 dark:border-white/5">
                                        <td className="px-2 py-2">
                                            <input
                                                type="number"
                                                value={filters.id}
                                                onChange={(e) => handleFilterChange('id', e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                                placeholder="ID"
                                                className="w-full bg-white/20 dark:bg-slate-800/40 border border-white/40 dark:border-white/5 rounded-xl py-2 px-3 text-[10px] font-black uppercase tracking-tight focus:ring-2 focus:ring-primary/40 focus:bg-white/40 focus:border-primary/50 transition-all outline-none"
                                            />
                                        </td>
                                        <td className="px-2 py-2">
                                            <input
                                                type="text"
                                                value={filters.voucher}
                                                onChange={(e) => handleFilterChange('voucher', e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                                placeholder="Voucher"
                                                className="w-full bg-white/20 dark:bg-slate-800/40 border border-white/40 dark:border-white/5 rounded-xl py-2 px-3 text-[10px] font-black uppercase tracking-tight focus:ring-2 focus:ring-primary/40 focus:bg-white/40 focus:border-primary/50 transition-all outline-none"
                                            />
                                        </td>
                                        <td className="px-2 py-2">
                                            <input
                                                type="text"
                                                value={filters.hotelName}
                                                onChange={(e) => handleFilterChange('hotelName', e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                                placeholder="Hotel Name"
                                                className="w-full bg-white/20 dark:bg-slate-800/40 border border-white/40 dark:border-white/5 rounded-xl py-2 px-3 text-[10px] font-black uppercase tracking-tight focus:ring-2 focus:ring-primary/40 focus:bg-white/40 focus:border-primary/50 transition-all outline-none"
                                            />
                                        </td>
                                        <td className="px-2 py-2">
                                            <div className="flex flex-col gap-1">
                                                <input
                                                    type="date"
                                                    value={filters.createDateStart}
                                                    onChange={(e) => handleFilterChange('createDateStart', e.target.value)}
                                                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                                    className="w-full bg-white/20 dark:bg-slate-800/40 border border-white/40 dark:border-white/5 rounded-lg py-1 px-1 text-[10px] font-black uppercase tracking-tight focus:ring-2 focus:ring-primary/40 focus:bg-white/40 focus:border-primary/50 transition-all outline-none"
                                                />
                                                <input
                                                    type="date"
                                                    value={filters.createDateEnd}
                                                    onChange={(e) => handleFilterChange('createDateEnd', e.target.value)}
                                                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                                    className="w-full bg-white/20 dark:bg-slate-800/40 border border-white/40 dark:border-white/5 rounded-lg py-1 px-1 text-[10px] font-black uppercase tracking-tight focus:ring-2 focus:ring-primary/40 focus:bg-white/40 focus:border-primary/50 transition-all outline-none"
                                                />
                                            </div>
                                        </td>
                                        <td className="px-2 py-2">
                                            <div className="flex flex-col gap-1">
                                                <input
                                                    type="date"
                                                    value={filters.checkInStart}
                                                    onChange={(e) => handleFilterChange('checkInStart', e.target.value)}
                                                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                                    className="w-full bg-white/20 dark:bg-slate-800/40 border border-white/40 dark:border-white/5 rounded-lg py-1 px-1 text-[10px] font-black uppercase tracking-tight focus:ring-2 focus:ring-primary/40 focus:bg-white/40 focus:border-primary/50 transition-all outline-none"
                                                />
                                                <input
                                                    type="date"
                                                    value={filters.checkInEnd}
                                                    onChange={(e) => handleFilterChange('checkInEnd', e.target.value)}
                                                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                                    className="w-full bg-white/20 dark:bg-slate-800/40 border border-white/40 dark:border-white/5 rounded-lg py-1 px-1 text-[10px] font-black uppercase tracking-tight focus:ring-2 focus:ring-primary/40 focus:bg-white/40 focus:border-primary/50 transition-all outline-none"
                                                />
                                            </div>
                                        </td>
                                        <td className="px-2 py-2">
                                            <div className="flex flex-col gap-1">
                                                <input
                                                    type="date"
                                                    value={filters.checkOutStart}
                                                    onChange={(e) => handleFilterChange('checkOutStart', e.target.value)}
                                                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                                    className="w-full bg-white/20 dark:bg-slate-800/40 border border-white/40 dark:border-white/5 rounded-lg py-1 px-1 text-[10px] font-black uppercase tracking-tight focus:ring-2 focus:ring-primary/40 focus:bg-white/40 focus:border-primary/50 transition-all outline-none"
                                                />
                                                <input
                                                    type="date"
                                                    value={filters.checkOutEnd}
                                                    onChange={(e) => handleFilterChange('checkOutEnd', e.target.value)}
                                                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                                    className="w-full bg-white/20 dark:bg-slate-800/40 border border-white/40 dark:border-white/5 rounded-lg py-1 px-1 text-[10px] font-black uppercase tracking-tight focus:ring-2 focus:ring-primary/40 focus:bg-white/40 focus:border-primary/50 transition-all outline-none"
                                                />
                                            </div>
                                        </td>
                                        <td className="px-2 py-2">
                                            <div className="flex flex-col gap-1">
                                                <input
                                                    type="number"
                                                    value={filters.minAmount}
                                                    onChange={(e) => handleFilterChange('minAmount', e.target.value)}
                                                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                                    placeholder="Min"
                                                    className="w-full bg-white/20 dark:bg-slate-800/40 border border-white/40 dark:border-white/5 rounded-lg py-1 px-1 text-[10px] font-black uppercase tracking-tight focus:ring-2 focus:ring-primary/40 focus:bg-white/40 focus:border-primary/50 transition-all outline-none"
                                                />
                                                <input
                                                    type="number"
                                                    value={filters.maxAmount}
                                                    onChange={(e) => handleFilterChange('maxAmount', e.target.value)}
                                                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                                    placeholder="Max"
                                                    className="w-full bg-white/20 dark:bg-slate-800/40 border border-white/40 dark:border-white/5 rounded-lg py-1 px-1 text-[10px] font-black uppercase tracking-tight focus:ring-2 focus:ring-primary/40 focus:bg-white/40 focus:border-primary/50 transition-all outline-none"
                                                />
                                            </div>
                                        </td>
                                        <td className="px-2 py-2">
                                            <select
                                                value={filters.paymentStatus}
                                                onChange={(e) => handleFilterChange('paymentStatus', e.target.value)}
                                                className="w-full bg-white/20 dark:bg-slate-800/40 border border-white/40 dark:border-white/5 rounded-xl py-2 px-1 text-[10px] font-black uppercase tracking-tight focus:ring-2 focus:ring-primary/40 focus:bg-white/40 focus:border-primary/50 transition-all outline-none cursor-pointer"
                                            >
                                                <option value="">All</option>
                                                <option value="PENDING_PAYMENT">Pending Payment</option>
                                                <option value="PAID_CREDIT_CARD">Paid (Credit Card)</option>
                                                <option value="PAID_ACCOUNT">Paid (Account)</option>
                                                <option value="REFUNDED_CREDIT_CARD">Refunded (Credit Card)</option>
                                                <option value="REFUNDED_ACCOUNT">Refunded (Account)</option>
                                                <option value="FAILED">Failed</option>
                                            </select>
                                        </td>
                                        <td className="px-2 py-2">
                                            <select
                                                value={filters.bookingStatus}
                                                onChange={(e) => handleFilterChange('bookingStatus', e.target.value)}
                                                className="w-full bg-white/20 dark:bg-slate-800/40 border border-white/40 dark:border-white/5 rounded-xl py-2 px-1 text-[10px] font-black uppercase tracking-tight focus:ring-2 focus:ring-primary/40 focus:bg-white/40 focus:border-primary/50 transition-all outline-none cursor-pointer"
                                            >
                                                <option value="">All</option>
                                                {Object.entries(BOOKING_STATUS_CONFIG).map(([key, config]) => (
                                                    <option key={key} value={key}>
                                                        {config.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </td>
                                        <td className="px-2 py-2">
                                            <div className="flex flex-col gap-1">
                                                <input
                                                    type="number"
                                                    value={filters.minCancellationAmount}
                                                    onChange={(e) => handleFilterChange('minCancellationAmount', e.target.value)}
                                                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                                    placeholder="Min"
                                                    className="w-full bg-white/20 dark:bg-slate-800/40 border border-white/40 dark:border-white/5 rounded-lg py-1 px-1 text-[10px] font-black uppercase tracking-tight focus:ring-2 focus:ring-primary/40 focus:bg-white/40 focus:border-primary/50 transition-all outline-none"
                                                />
                                                <input
                                                    type="number"
                                                    value={filters.maxCancellationAmount}
                                                    onChange={(e) => handleFilterChange('maxCancellationAmount', e.target.value)}
                                                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                                    placeholder="Max"
                                                    className="w-full bg-white/20 dark:bg-slate-800/40 border border-white/40 dark:border-white/5 rounded-lg py-1 px-1 text-[10px] font-black uppercase tracking-tight focus:ring-2 focus:ring-primary/40 focus:bg-white/40 focus:border-primary/50 transition-all outline-none"
                                                />
                                            </div>
                                        </td>
                                        <td className="px-2 py-2">
                                            <input
                                                type="text"
                                                value={filters.bookingUuid}
                                                onChange={(e) => handleFilterChange('bookingUuid', e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                                placeholder="UUID"
                                                className="w-full bg-white/20 dark:bg-slate-800/40 border border-white/40 dark:border-white/5 rounded-xl py-2 px-3 text-[10px] font-black uppercase tracking-tight focus:ring-2 focus:ring-primary/40 focus:bg-white/40 focus:border-primary/50 transition-all outline-none"
                                            />
                                        </td>
                                        <td className="px-2 py-2">
                                            <input
                                                type="text"
                                                value={filters.principalAgencyIds}
                                                onChange={(e) => handleFilterChange('principalAgencyIds', e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                                placeholder="Agency IDs"
                                                className="w-full bg-white/20 dark:bg-slate-800/40 border border-white/40 dark:border-white/5 rounded-xl py-2 px-3 text-[10px] font-black uppercase tracking-tight focus:ring-2 focus:ring-primary/40 focus:bg-white/40 focus:border-primary/50 transition-all outline-none"
                                            />
                                        </td>
                                        <td className="px-2 py-2">
                                            <input
                                                type="number"
                                                value={filters.internalHotelId}
                                                onChange={(e) => handleFilterChange('internalHotelId', e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                                placeholder="Hotel ID"
                                                className="w-full bg-white/20 dark:bg-slate-800/40 border border-white/40 dark:border-white/5 rounded-xl py-2 px-3 text-[10px] font-black uppercase tracking-tight focus:ring-2 focus:ring-primary/40 focus:bg-white/40 focus:border-primary/50 transition-all outline-none"
                                            />
                                        </td>
                                        <td className="px-2 py-2">
                                            <input
                                                type="text"
                                                value={filters.clientReferenceId}
                                                onChange={(e) => handleFilterChange('clientReferenceId', e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                                placeholder="Cl. Ref"
                                                className="w-full bg-white/20 dark:bg-slate-800/40 border border-white/40 dark:border-white/5 rounded-xl py-2 px-3 text-[10px] font-black uppercase tracking-tight focus:ring-2 focus:ring-primary/40 focus:bg-white/40 focus:border-primary/50 transition-all outline-none"
                                            />
                                        </td>
                                        <td className="px-2 py-2">
                                            <select
                                                value={filters.isCancelled}
                                                onChange={(e) => handleFilterChange('isCancelled', e.target.value)}
                                                className="w-full bg-white/20 dark:bg-slate-800/40 border border-white/40 dark:border-white/5 rounded-xl py-2 px-1 text-[10px] font-black uppercase tracking-tight focus:ring-2 focus:ring-primary/40 focus:bg-white/40 focus:border-primary/50 transition-all outline-none cursor-pointer"
                                            >
                                                <option value="">All</option>
                                                <option value="true">Yes</option>
                                                <option value="false">No</option>
                                            </select>
                                        </td>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                    {loading ? (
                                        Array.from({ length: 10 }).map((_, index) => (
                                            <tr key={`skeleton-${index}`} className="border-b border-slate-100 dark:border-slate-800 last:border-0">
                                                {Array.from({ length: 15 }).map((_, cellIndex) => (
                                                    <td key={`skeleton-cell-${cellIndex}`} className="px-4 py-3">
                                                        <div className={`h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse ${[2, 11].includes(cellIndex) ? 'w-48' :
                                                            [0, 1].includes(cellIndex) ? 'w-32' :
                                                                'w-16'
                                                            }`}></div>
                                                    </td>
                                                ))}
                                            </tr>
                                        ))
                                    ) : error ? (
                                        <tr>
                                            <td colSpan="15" className="px-4 py-12 text-center text-red-500">
                                                Error: {error}
                                            </td>
                                        </tr>
                                    ) : bookings.length === 0 ? (
                                        <tr>
                                            <td colSpan="15" className="px-4 py-12 text-center text-slate-500">
                                                No bookings found
                                            </td>
                                        </tr>
                                    ) : (
                                        bookings.map((booking) => (
                                            <tr
                                                key={booking.bookingId}
                                                onClick={() => navigate(`/bookings/${booking.bookingId}`)}
                                                className="hover:bg-white/40 dark:hover:bg-slate-800/40 transition-all duration-300 group border-b border-white/20 dark:border-white/5 last:border-0 cursor-pointer text-xs font-bold"
                                            >
                                                <td className="px-4 py-3 text-slate-900 dark:text-white group-hover:text-primary transition-colors">#{booking.bookingId}</td>
                                                <td className="px-4 py-3 text-slate-700 dark:text-slate-200 truncate max-w-[100px]" title={booking.voucher}>{booking.voucher || '-'}</td>
                                                <td className="px-4 py-3 text-slate-700 dark:text-slate-200 truncate max-w-[200px]" title={booking.hotelName}>{booking.hotelName}</td>
                                                <td className="px-4 py-3 text-slate-600 dark:text-slate-300 whitespace-nowrap">{formatDateTime(booking.createDateTime)}</td>
                                                <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{formatDate(booking.checkInDate)}</td>
                                                <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{formatDate(booking.checkOutDate)}</td>
                                                <td className="px-4 py-3 text-primary font-bold">
                                                    {booking.currency} {booking.totalAmount?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${getPaymentStatusColor(booking.paymentStatus)}`}>
                                                        {booking.paymentStatus?.replace('_', ' ')}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <BookingStatusBadge status={booking.bookingStatus} className="shadow-none border-none bg-transparent p-0" showIcon={false} />
                                                </td>
                                                <td className="px-4 py-3 text-red-500">
                                                    {booking.totalCancellationAmount > 0 ? `${booking.currency} ${booking.totalCancellationAmount?.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '-'}
                                                </td>
                                                <td className="px-4 py-3 text-slate-500 dark:text-slate-400 font-mono text-[10px] truncate max-w-[120px]" title={booking.bookingUuid}>{booking.bookingUuid}</td>
                                                <td className="px-4 py-3 text-slate-700 dark:text-slate-200 truncate max-w-[150px]" title={booking.principalAgencyName}>{booking.principalAgencyName}</td>
                                                <td className="px-4 py-3 text-slate-500 dark:text-slate-400 text-[10px]">{booking.internalHotelId}</td>
                                                <td className="px-4 py-3 text-slate-700 dark:text-slate-200 truncate max-w-[100px]" title={booking.clientReferenceId}>{booking.clientReferenceId || '-'}</td>
                                                <td className="px-4 py-3 text-center">
                                                    {booking.isCancelled ? (
                                                        <span className="material-icons-round text-red-500 text-sm">check_circle</span>
                                                    ) : (
                                                        <span className="material-icons-round text-slate-200 dark:text-slate-700 text-sm">cancel</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination - Glassy */}
                        {totalPages > 0 && (
                            <div className="border-t border-white/20 dark:border-white/5 px-8 py-4 flex items-center justify-between bg-white/10 dark:bg-slate-800/20 backdrop-blur-xl">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-slate-600 dark:text-slate-400">Rows per page:</span>
                                    <select
                                        value={pageSize}
                                        onChange={(e) => {
                                            setPageSize(Number(e.target.value));
                                            setPage(0);
                                        }}
                                        className="px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-sm"
                                    >
                                        <option value="10">10</option>
                                        <option value="25">25</option>
                                        <option value="50">50</option>
                                        <option value="100">100</option>
                                    </select>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-slate-600 dark:text-slate-400">
                                        Page {page + 1} of {totalPages} ({totalElements} total)
                                    </span>
                                    <button
                                        onClick={() => setPage(p => Math.max(0, p - 1))}
                                        disabled={page === 0}
                                        className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <span className="material-icons-round text-xl">chevron_left</span>
                                    </button>
                                    <button
                                        onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                                        disabled={page >= totalPages - 1}
                                        className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <span className="material-icons-round text-xl">chevron_right</span>
                                    </button>
                                </div>
                            </div>
                        )}
                        {summaries.length > 0 && (
                            <div className="mt-12 pl-6 pb-6 space-y-6">
                                {/* Summary Header */}
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-lg font-black text-slate-900 dark:text-white">Booking Summary</h3>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">Overview of your bookings by currency</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                    {summaries.map((summary, index) => (
                                        <div
                                            key={index}
                                            className="group relative bg-white/40 dark:bg-slate-900/40 backdrop-blur-3xl rounded-[32px] border border-white/60 dark:border-white/10 p-8 hover:shadow-[0_32px_80px_-16px_rgba(0,0,0,0.1)] hover:-translate-y-1 transition-all duration-500"
                                        >
                                            {/* Intensity Glow */}
                                            <div className="absolute -inset-2 bg-primary/10 rounded-[40px] blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                                            {/* Top Section - Icon and Badge */}
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="w-12 h-12 rounded-xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                                                    {summary.currency === 'EUR' ? (
                                                        <span className="material-icons-round text-primary text-2xl">euro</span>
                                                    ) : summary.currency === 'USD' ? (
                                                        <span className="material-icons-round text-primary text-2xl">attach_money</span>
                                                    ) : summary.currency === 'TRY' ? (
                                                        <span className="material-icons-round text-primary text-2xl">currency_lira</span>
                                                    ) : (
                                                        <span className="material-icons-round text-primary text-2xl">receipt_long</span>
                                                    )}
                                                </div>
                                                <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wide">
                                                    {summary.currency || 'Total'}
                                                </span>
                                            </div>

                                            {/* Booking Count */}
                                            <div className="mb-4">
                                                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Bookings</p>
                                                <p className="text-3xl font-black text-slate-900 dark:text-white">{summary.bookingCount}</p>
                                            </div>

                                            {/* Divider */}
                                            <div className="h-px bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-700 to-transparent mb-4"></div>

                                            {/* Amount Section */}
                                            <div>
                                                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Total Amount</p>
                                                <div className="flex items-baseline gap-1.5">
                                                    <span className="text-xs font-bold text-slate-400">{summary.currency}</span>
                                                    <span className="text-xl font-black text-primary">
                                                        {summary.totalAmountSum?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Accent Line */}
                                            <div className="absolute bottom-0 left-8 right-8 h-1 bg-gradient-to-r from-transparent via-primary to-transparent rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div >
            </div >
        </div >
    );
};

export default MyBookings;
