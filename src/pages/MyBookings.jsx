import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { bookingService } from '../services/bookingService';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from '../components/ThemeToggle';

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
        supplierName: '',
        hotelName: '',
        checkInStart: '',
        checkInEnd: '',
        checkOutStart: '',
        checkOutEnd: '',
        createDateStart: '',
        createDateEnd: '',
        minAmount: '',
        maxAmount: '',
        paymentStatus: '',
        bookingStatus: '',
        clientReferenceId: '',
    });

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

            // Build filter object (only include non-empty values)
            const filterObj = {};
            Object.keys(filters).forEach(key => {
                const value = filters[key];
                if (value !== '' && value !== null) {
                    // Convert date strings to proper format
                    if (key.includes('Date') && value) {
                        filterObj[key] = value + 'T00:00:00';
                    } else if ((key.includes('Start') || key.includes('End')) && !key.includes('Date') && value) {
                        filterObj[key] = value;
                    } else {
                        filterObj[key] = value || null;
                    }
                }
            });

            const data = await bookingService.searchBookings(filterObj, page, pageSize, signal);

            if (!signal?.aborted) {
                setBookings(data.bookings.content || []);
                setTotalPages(data.bookings.totalPages || 0);
                setTotalElements(data.bookings.totalElements || 0);
                setSummaries(data.summaries || []);
            }
        } catch (err) {
            if (err.name !== 'AbortError') {
                console.error('Error searching bookings:', err);
                setError(err.message);
            }
        } finally {
            if (!signal?.aborted) {
                setLoading(false);
            }
        }
    };

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const handleSearch = () => {
        setPage(0);
        const abortController = new AbortController();
        searchBookings(abortController.signal);
    };

    const handleClearFilters = () => {
        setFilters({
            id: '',
            voucher: '',
            supplierName: '',
            hotelName: '',
            checkInStart: '',
            checkInEnd: '',
            checkOutStart: '',
            checkOutEnd: '',
            createDateStart: '',
            createDateEnd: '',
            minAmount: '',
            maxAmount: '',
            paymentStatus: '',
            bookingStatus: '',
            clientReferenceId: '',
        });
        setPage(0);
        const abortController = new AbortController();
        searchBookings(abortController.signal);
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

    const getStatusColor = (status) => {
        switch (status) {
            case 'CONFIRMED':
                return 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400';
            case 'NEW':
                return 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400';
            case 'ERROR':
                return 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400';
            case 'CANCELLED':
                return 'bg-slate-100 text-slate-600 dark:bg-slate-900/30 dark:text-slate-400';
            default:
                return 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400';
        }
    };

    const getPaymentStatusColor = (status) => {
        switch (status) {
            case 'PAID_ACCOUNT':
                return 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400';
            case 'PENDING':
                return 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400';
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
        <div className="flex h-screen bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 transition-colors duration-200 font-sans overflow-hidden">
            {/* Sidebar - Same as Dashboard */}
            <aside className="w-60 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hidden lg:flex flex-col flex-shrink-0">
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
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header - Fixed */}
                <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex-shrink-0">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">My Bookings</h1>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                {totalElements} total bookings found
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={handleClearFilters}
                                className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-sm"
                            >
                                <span className="material-icons-round text-lg">filter_alt_off</span>
                                Clear Filters
                            </button>

                            <button
                                onClick={handleSearch}
                                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-semibold"
                            >
                                <span className="material-icons-round text-lg">search</span>
                                Search
                            </button>

                            <ThemeToggle />

                            {/* User Profile Dropdown */}
                            <div className="relative" ref={menuRef}>
                                <button
                                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                                    className="flex items-center gap-2 transition-transform active:scale-95 focus:outline-none"
                                >
                                    <div className="size-10 rounded-full border-2 border-primary overflow-hidden" title={userDisplayName}>
                                        <img
                                            className="w-full h-full object-cover"
                                            alt="User profile avatar"
                                            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBosNqeUSWMhJzh5LpHCFPb5pLuKb8iL2md4jVM2E56t5Fv9dyFMkYnOoEtDWJR6D93U1ktccli6wRXrDIFrJfBzqCuo5f3p_dAmSl_IOc_ls1zrDr3BzT9UkmB-hXIOrfHfvPmYIBsjYr8pMfjM43LH5Rt6-TPmTMmscoLyVghfEK4wzk7GtmvkdhcdOdWIR6LeTpuh-DYatxfCIZul2x7amqH7lCa89tzhsz4XxNW_yxi5Ycxf1QNFnIYxHogNEd3zAqE767kNbGk"
                                        />
                                    </div>
                                    <span className="material-symbols-outlined text-slate-500 dark:text-slate-400">expand_more</span>
                                </button>

                                {isMenuOpen && (
                                    <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden z-[9999] animate-in fade-in slide-in-from-top-2">
                                        <div className="p-3 border-b border-slate-100 dark:border-slate-800">
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">My Account</p>
                                            <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{userDisplayName}</p>
                                            {user?.email && (
                                                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
                                            )}
                                        </div>
                                        <div className="p-1">
                                            <button className="w-full text-left px-3 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg flex items-center gap-2 transition-colors">
                                                <span className="material-icons-round text-[18px]">settings</span>
                                                Settings
                                            </button>
                                            <button
                                                onClick={handleLogout}
                                                className="w-full text-left px-3 py-2 text-sm font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg flex items-center gap-2 transition-colors"
                                            >
                                                <span className="material-icons-round text-[18px]">logout</span>
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
                <div className="flex-1 overflow-auto p-6">
                    {/* Summary Cards */}
                    {summaries.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                            {summaries.map((summary, index) => (
                                <div key={index} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                                                {summary.currency || 'Total'} Bookings
                                            </p>
                                            <p className="text-2xl font-bold mt-1">{summary.bookingCount}</p>
                                            {summary.totalAmountSum && (
                                                <p className="text-sm text-primary font-semibold mt-1">
                                                    {summary.currency} {summary.totalAmountSum.toFixed(2)}
                                                </p>
                                            )}
                                        </div>
                                        <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                                            <span className="material-icons-round text-primary text-2xl">receipt_long</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Table with Filters in Headers */}
                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    {/* Column Headers */}
                                    <tr className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                                        <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase whitespace-nowrap">ID</th>
                                        <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase whitespace-nowrap">Voucher</th>
                                        <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase whitespace-nowrap">Supplier</th>
                                        <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase whitespace-nowrap">Agency</th>
                                        <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase whitespace-nowrap">Hotel</th>
                                        <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase whitespace-nowrap">Check-in</th>
                                        <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase whitespace-nowrap">Check-out</th>
                                        <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase whitespace-nowrap">Created</th>
                                        <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase whitespace-nowrap">Amount</th>
                                        <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase whitespace-nowrap">Payment</th>
                                        <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase whitespace-nowrap">Status</th>
                                    </tr>
                                    {/* Filter Row */}
                                    <tr className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
                                        <th className="px-3 py-2">
                                            <input
                                                type="number"
                                                value={filters.id}
                                                onChange={(e) => handleFilterChange('id', e.target.value)}
                                                placeholder="ID"
                                                className="w-full px-2 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded focus:ring-1 focus:ring-primary focus:border-transparent"
                                            />
                                        </th>
                                        <th className="px-3 py-2">
                                            <input
                                                type="text"
                                                value={filters.voucher}
                                                onChange={(e) => handleFilterChange('voucher', e.target.value)}
                                                placeholder="Voucher"
                                                className="w-full px-2 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded focus:ring-1 focus:ring-primary focus:border-transparent"
                                            />
                                        </th>
                                        <th className="px-3 py-2">
                                            <input
                                                type="text"
                                                value={filters.supplierName}
                                                onChange={(e) => handleFilterChange('supplierName', e.target.value)}
                                                placeholder="Supplier"
                                                className="w-full px-2 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded focus:ring-1 focus:ring-primary focus:border-transparent"
                                            />
                                        </th>
                                        <th className="px-3 py-2">
                                            <input
                                                type="text"
                                                value={filters.clientReferenceId}
                                                onChange={(e) => handleFilterChange('clientReferenceId', e.target.value)}
                                                placeholder="Agency Ref"
                                                className="w-full px-2 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded focus:ring-1 focus:ring-primary focus:border-transparent"
                                            />
                                        </th>
                                        <th className="px-3 py-2">
                                            <input
                                                type="text"
                                                value={filters.hotelName}
                                                onChange={(e) => handleFilterChange('hotelName', e.target.value)}
                                                placeholder="Hotel"
                                                className="w-full px-2 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded focus:ring-1 focus:ring-primary focus:border-transparent"
                                            />
                                        </th>
                                        <th className="px-3 py-2">
                                            <input
                                                type="date"
                                                value={filters.checkInStart}
                                                onChange={(e) => handleFilterChange('checkInStart', e.target.value)}
                                                className="w-full px-2 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded focus:ring-1 focus:ring-primary focus:border-transparent"
                                            />
                                        </th>
                                        <th className="px-3 py-2">
                                            <input
                                                type="date"
                                                value={filters.checkOutStart}
                                                onChange={(e) => handleFilterChange('checkOutStart', e.target.value)}
                                                className="w-full px-2 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded focus:ring-1 focus:ring-primary focus:border-transparent"
                                            />
                                        </th>
                                        <th className="px-3 py-2">
                                            <input
                                                type="date"
                                                value={filters.createDateStart}
                                                onChange={(e) => handleFilterChange('createDateStart', e.target.value)}
                                                className="w-full px-2 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded focus:ring-1 focus:ring-primary focus:border-transparent"
                                            />
                                        </th>
                                        <th className="px-3 py-2">
                                            <input
                                                type="number"
                                                value={filters.minAmount}
                                                onChange={(e) => handleFilterChange('minAmount', e.target.value)}
                                                placeholder="Min"
                                                className="w-full px-2 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded focus:ring-1 focus:ring-primary focus:border-transparent"
                                            />
                                        </th>
                                        <th className="px-3 py-2">
                                            <select
                                                value={filters.paymentStatus}
                                                onChange={(e) => handleFilterChange('paymentStatus', e.target.value)}
                                                className="w-full px-2 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded focus:ring-1 focus:ring-primary focus:border-transparent"
                                            >
                                                <option value="">All</option>
                                                <option value="PAID_ACCOUNT">Paid</option>
                                                <option value="PENDING">Pending</option>
                                                <option value="FAILED">Failed</option>
                                            </select>
                                        </th>
                                        <th className="px-3 py-2">
                                            <select
                                                value={filters.bookingStatus}
                                                onChange={(e) => handleFilterChange('bookingStatus', e.target.value)}
                                                className="w-full px-2 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded focus:ring-1 focus:ring-primary focus:border-transparent"
                                            >
                                                <option value="">All</option>
                                                <option value="CONFIRMED">Confirmed</option>
                                                <option value="NEW">New</option>
                                                <option value="ERROR">Error</option>
                                                <option value="CANCELLED">Cancelled</option>
                                            </select>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                    {loading ? (
                                        <tr>
                                            <td colSpan="11" className="px-4 py-12 text-center">
                                                <div className="flex items-center justify-center gap-2 text-slate-500">
                                                    <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                                                    Loading bookings...
                                                </div>
                                            </td>
                                        </tr>
                                    ) : error ? (
                                        <tr>
                                            <td colSpan="11" className="px-4 py-12 text-center text-red-500">
                                                Error: {error}
                                            </td>
                                        </tr>
                                    ) : bookings.length === 0 ? (
                                        <tr>
                                            <td colSpan="11" className="px-4 py-12 text-center text-slate-500">
                                                No bookings found
                                            </td>
                                        </tr>
                                    ) : (
                                        bookings.map((booking) => (
                                            <tr key={booking.bookingId} className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                                                <td className="px-3 py-3 text-sm font-medium whitespace-nowrap">#{booking.bookingId}</td>
                                                <td className="px-3 py-3 text-sm whitespace-nowrap">
                                                    <div>
                                                        <div className="font-medium">{booking.voucher || '-'}</div>
                                                        {booking.supplierVoucher && (
                                                            <div className="text-xs text-slate-500">Sup: {booking.supplierVoucher}</div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-3 py-3 text-sm whitespace-nowrap">{booking.supplierName || 'N/A'}</td>
                                                <td className="px-3 py-3 whitespace-nowrap">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                                                            {getInitials(booking.principalAgencyName)}
                                                        </div>
                                                        <span className="text-sm truncate max-w-[120px]" title={booking.principalAgencyName}>{booking.principalAgencyName}</span>
                                                    </div>
                                                </td>
                                                <td className="px-3 py-3 text-sm whitespace-nowrap max-w-[200px] truncate" title={booking.hotelName}>
                                                    {booking.hotelName}
                                                </td>
                                                <td className="px-3 py-3 text-sm text-slate-500 whitespace-nowrap">{formatDate(booking.checkInDate)}</td>
                                                <td className="px-3 py-3 text-sm text-slate-500 whitespace-nowrap">{formatDate(booking.checkOutDate)}</td>
                                                <td className="px-3 py-3 text-xs text-slate-500 whitespace-nowrap">{formatDateTime(booking.createDateTime)}</td>
                                                <td className="px-3 py-3 text-sm font-semibold whitespace-nowrap">
                                                    {booking.totalAmount ? `${booking.currency} ${booking.totalAmount.toFixed(2)}` : 'N/A'}
                                                </td>
                                                <td className="px-3 py-3 whitespace-nowrap">
                                                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${getPaymentStatusColor(booking.paymentStatus)}`}>
                                                        {booking.paymentStatus?.replace('_', ' ') || 'N/A'}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-3 whitespace-nowrap">
                                                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${getStatusColor(booking.bookingStatus)}`}>
                                                        {booking.bookingStatus}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {totalPages > 0 && (
                            <div className="border-t border-slate-200 dark:border-slate-700 px-4 py-3 flex items-center justify-between bg-slate-50 dark:bg-slate-800">
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
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MyBookings;
