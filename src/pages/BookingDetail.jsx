import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { bookingService } from '../services/bookingService';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from '../components/ThemeToggle';

const BookingDetail = () => {
    const { bookingId } = useParams();
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const [booking, setBooking] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = React.useRef(null);

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
        const abortController = new AbortController();
        fetchBookingDetail(abortController.signal);
        return () => abortController.abort();
    }, [bookingId]);

    const fetchBookingDetail = async (signal) => {
        try {
            setLoading(true);
            setError(null);
            const data = await bookingService.getBookingDetail(bookingId, signal);
            if (!signal?.aborted) {
                setBooking(data);
            }
        } catch (error) {
            if (error.name !== 'AbortError') {
                console.error('Fetch booking detail error:', error);
                setError(error.message);
            }
        } finally {
            setLoading(false);
        }
    };

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
            case 'ACTIVE':
                return 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400';
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

    const getGenderIcon = (gender) => {
        switch (gender) {
            case 'MALE':
                return 'male';
            case 'FEMALE':
                return 'female';
            default:
                return 'person';
        }
    };

    const getCurrencyIcon = (currency) => {
        switch (currency) {
            case 'EUR':
                return 'euro';
            case 'USD':
                return 'attach_money';
            case 'GBP':
                return 'currency_pound';
            case 'TRY':
                return 'currency_lira';
            default:
                return 'payments';
        }
    };

    if (loading || error || !booking) {
        return (
            <div className="flex h-screen bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 transition-colors duration-200 font-sans overflow-hidden">
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
                        <button
                            onClick={() => navigate('/bookings')}
                            className="flex items-center gap-3 px-3 py-2 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-primary font-medium text-xs w-full"
                        >
                            <span className="material-icons-round text-[20px]">book_online</span>
                            My Bookings
                        </button>
                    </nav>
                </aside>

                <div className="flex-1 flex flex-col overflow-hidden">
                    <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-8 py-5 flex-shrink-0">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => navigate('/bookings')}
                                    className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                                >
                                    <span className="material-icons-round">arrow_back</span>
                                </button>
                                <div>
                                    <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Booking Details</h1>
                                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                                        {loading ? 'Loading...' : error ? 'Error loading booking' : 'Booking information'}
                                    </p>
                                </div>
                            </div>
                            <ThemeToggle />
                        </div>
                    </header>

                    <div className="flex-1 overflow-auto p-6">
                        {loading ? (
                            <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
                                {/* Booking Overview Skeleton */}
                                <div className="bg-white dark:bg-slate-900 rounded-[28px] border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-12 h-12 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse"></div>
                                        <div className="flex-1 space-y-2">
                                            <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded-lg w-48 animate-pulse"></div>
                                            <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-lg w-64 animate-pulse"></div>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {[...Array(6)].map((_, i) => (
                                            <div key={i} className="space-y-2">
                                                <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-24 animate-pulse"></div>
                                                <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded w-32 animate-pulse"></div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Hotel Information Skeleton */}
                                <div className="bg-white dark:bg-slate-900 rounded-[28px] border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-12 h-12 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse"></div>
                                        <div className="flex-1 space-y-2">
                                            <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded-lg w-40 animate-pulse"></div>
                                            <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-lg w-56 animate-pulse"></div>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                        {[...Array(3)].map((_, i) => (
                                            <div key={i} className="space-y-2">
                                                <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-28 animate-pulse"></div>
                                                <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded w-full animate-pulse"></div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="border-t border-slate-100 dark:border-slate-800 pt-6">
                                        <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-40 mb-4 animate-pulse"></div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {[...Array(3)].map((_, i) => (
                                                <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                                                    <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse"></div>
                                                    <div className="flex-1 space-y-2">
                                                        <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-16 animate-pulse"></div>
                                                        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-32 animate-pulse"></div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Room Skeleton */}
                                <div className="bg-white dark:bg-slate-900 rounded-[28px] border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-12 h-12 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse"></div>
                                        <div className="flex-1 space-y-2">
                                            <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded-lg w-56 animate-pulse"></div>
                                            <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-lg w-32 animate-pulse"></div>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-24 animate-pulse"></div>
                                        <div className="space-y-3">
                                            {[...Array(2)].map((_, i) => (
                                                <div key={i} className="h-12 bg-slate-50 dark:bg-slate-800/50 rounded-xl animate-pulse"></div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Loading Indicator */}
                                <div className="flex items-center justify-center gap-3 py-4">
                                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                </div>
                            </div>
                        ) : error ? (
                            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 rounded-2xl p-8 max-w-md text-center mx-auto">
                                <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <span className="material-icons-round text-red-500 text-4xl">error</span>
                                </div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Failed to Load Booking</h3>
                                <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">{error}</p>
                                <button
                                    onClick={() => navigate('/bookings')}
                                    className="px-6 py-2 bg-primary text-white rounded-xl font-bold text-sm hover:bg-blue-600 transition-colors"
                                >
                                    Back to Bookings
                                </button>
                            </div>
                        ) : null}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 transition-colors duration-200 font-sans overflow-hidden">
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
                    <button
                        onClick={() => navigate('/bookings')}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-primary font-medium text-xs w-full"
                    >
                        <span className="material-icons-round text-[20px]">book_online</span>
                        My Bookings
                    </button>
                </nav>
            </aside>

            <div className="flex-1 flex flex-col overflow-hidden">
                <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-8 py-5 flex-shrink-0 z-30">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => navigate('/bookings')}
                                className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                            >
                                <span className="material-icons-round">arrow_back</span>
                            </button>
                            <div>
                                <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Booking Details</h1>
                                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                                    Order #{booking.orderId} • {booking.hotel?.hotelName || 'N/A'}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <ThemeToggle />

                            <div className="relative" ref={menuRef}>
                                <button
                                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                                    className="flex items-center gap-3 p-1 pr-3 rounded-2xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all active:scale-95 focus:outline-none"
                                >
                                    <div className="size-9 rounded-xl border-2 border-primary/20 overflow-hidden ring-4 ring-primary/5" title={userDisplayName}>
                                        <img
                                            className="w-full h-full object-cover"
                                            alt="User profile avatar"
                                            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBosNqeUSWMhJzh5LpHCFPb5pLuKb8iL2md4jVM2E56t5Fv9dyFMkYnOoEtDWJR6D93U1ktccli6wRXrDIFrJfBzqCuo5f3p_dAmSl_IOc_ls1zrDr3BzT9UkmB-hXIOrfHfvPmYIBsjYr8pMfjM43LH5Rt6-TPmTMmscoLyVghfEK4wzk7GtmvkdhcdOdWIR6LeTpuh-DYatxfCIZul2x7amqH7lCa89tzhsz4XxNW_yxi5Ycxf1QNFnIYxHogNEd3zAqE767kNbGk"
                                        />
                                    </div>
                                    <div className="hidden sm:block text-left">
                                        <p className="text-xs font-black text-slate-900 dark:text-white leading-none mb-1 truncate max-w-[100px]">{userDisplayName}</p>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter leading-none">Admin User</p>
                                    </div>
                                    <span className="material-symbols-outlined text-slate-400 text-lg">expand_more</span>
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

                <div className="flex-1 overflow-auto p-6">
                    <div className="max-w-7xl mx-auto space-y-6">
                        {/* Booking Overview Card */}
                        <div className="bg-white dark:bg-slate-900 rounded-[28px] border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                                    <span className="material-icons-round text-2xl">receipt_long</span>
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-slate-900 dark:text-white">Booking Overview</h2>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">Order and reservation details</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Order ID</p>
                                    <p className="text-lg font-black text-primary">#{booking.orderId}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">UUID</p>
                                    <p className="text-xs font-mono text-slate-600 dark:text-slate-300 break-all">{booking.uuid}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</p>
                                    <span className={`inline-block px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider ${getStatusColor(booking.status)}`}>
                                        {booking.status}
                                    </span>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Payment Status</p>
                                    <span className={`inline-block px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider ${getPaymentStatusColor(booking.payment?.status)}`}>
                                        {booking.payment?.status?.replace('_', ' ') || 'N/A'}
                                    </span>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Client Reference</p>
                                    <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{booking.clientReferenceId || 'N/A'}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Voucher</p>
                                    <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{booking.voucher || 'N/A'}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Check-in</p>
                                    <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{formatDate(booking.checkIn)}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Check-out</p>
                                    <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{formatDate(booking.checkOut)}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Transaction User</p>
                                    <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{booking.transactionUser || 'N/A'}</p>
                                </div>
                                {booking.remark && (
                                    <div className="space-y-1 md:col-span-2 lg:col-span-3">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Remark</p>
                                        <p className="text-sm text-slate-700 dark:text-slate-200 italic">{booking.remark}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Hotel Information Card */}
                        {booking.hotel && (
                            <div className="bg-white dark:bg-slate-900 rounded-[28px] border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                                        <span className="material-icons-round text-2xl">hotel</span>
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-black text-slate-900 dark:text-white">Hotel Information</h2>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">Property and contact details</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Hotel Name</p>
                                        <p className="text-lg font-black text-slate-900 dark:text-white">{booking.hotel.hotelName}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Internal Hotel ID</p>
                                        <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{booking.hotel.internalHotelId}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Booking Status</p>
                                        <span className={`inline-block px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider ${getStatusColor(booking.hotel.bookingStatus)}`}>
                                            {booking.hotel.bookingStatus}
                                        </span>
                                    </div>
                                </div>

                                {/* Contact Information */}
                                {booking.hotel.contact && (
                                    <div className="border-t border-slate-100 dark:border-slate-800 pt-6">
                                        <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider mb-4">Contact Information</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                                                <span className="material-icons-round text-slate-400">person</span>
                                                <div>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase">Name</p>
                                                    <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{booking.hotel.contact.name} {booking.hotel.contact.surname}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                                                <span className="material-icons-round text-slate-400">phone</span>
                                                <div>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase">Phone</p>
                                                    <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{booking.hotel.contact.phoneCountryCode} {booking.hotel.contact.phoneNumber}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                                                <span className="material-icons-round text-slate-400">email</span>
                                                <div>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase">Email</p>
                                                    <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{booking.hotel.contact.email}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Rooms Section */}
                        {booking.hotel?.rooms && booking.hotel.rooms.length > 0 && booking.hotel.rooms.map((room, roomIndex) => (
                            <div key={roomIndex} className="bg-white dark:bg-slate-900 rounded-[28px] border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
                                        <span className="material-icons-round text-2xl">meeting_room</span>
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-black text-slate-900 dark:text-white">Room {roomIndex + 1}: {room.roomName}</h2>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">Room ID: {room.roomId}</p>
                                    </div>
                                </div>

                                {/* Occupancies */}
                                {room.occupancies && room.occupancies.length > 0 && (
                                    <div className="mb-6">
                                        <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider mb-4">Guests</h3>
                                        <div className="overflow-x-auto">
                                            <table className="w-full border-collapse">
                                                <thead>
                                                    <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                                                        <th className="px-4 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider">Name</th>
                                                        <th className="px-4 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider">Nationality</th>
                                                        <th className="px-4 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider">Birth Date</th>
                                                        <th className="px-4 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider">Gender</th>
                                                        <th className="px-4 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider">Type</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                                    {room.occupancies.map((guest, guestIndex) => (
                                                        <tr key={guestIndex} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                                            <td className="px-4 py-3">
                                                                <p className="text-sm font-bold text-slate-900 dark:text-white">{guest.name} {guest.surname}</p>
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{guest.nationality}</p>
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                <p className="text-sm text-slate-600 dark:text-slate-300">{formatDate(guest.birthDate)}</p>
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="material-icons-round text-slate-400 text-sm">{getGenderIcon(guest.gender)}</span>
                                                                    <p className="text-sm text-slate-600 dark:text-slate-300">{guest.gender}</p>
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                <span className="px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg text-xs font-bold">
                                                                    {guest.guestType}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}

                                {/* Rates */}
                                {room.rates && room.rates.length > 0 && room.rates.map((rate, rateIndex) => (
                                    <div key={rateIndex} className="border-t border-slate-100 dark:border-slate-800 pt-6 mt-6">
                                        <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider mb-4">Rate Details</h3>

                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                                            <div className="space-y-1">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Board Type</p>
                                                <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{rate.boardType}</p>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Amount</p>
                                                <div className="flex items-center gap-2">
                                                    <p className="text-lg font-black text-primary">{rate.totalAmount?.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                                                    <span className="text-sm font-bold text-slate-400">{rate.currency}</span>
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Refundable</p>
                                                <span className={`inline-block px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider ${rate.refundable ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'}`}>
                                                    {rate.refundable ? 'Yes' : 'No'}
                                                </span>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Rate Category</p>
                                                <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{rate.rateCategoryId}</p>
                                            </div>
                                        </div>

                                        {/* Daily Prices */}
                                        {rate.dailyPrices && rate.dailyPrices.length > 0 && (
                                            <div className="mb-6">
                                                <h4 className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-3">Daily Prices</h4>
                                                <div className="overflow-x-auto">
                                                    <table className="w-full border-collapse">
                                                        <thead>
                                                            <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                                                                <th className="px-4 py-2 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider">Date</th>
                                                                <th className="px-4 py-2 text-right text-[10px] font-black text-slate-400 uppercase tracking-wider">Amount</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                                            {rate.dailyPrices.map((daily, dailyIndex) => (
                                                                <tr key={dailyIndex} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                                                    <td className="px-4 py-2">
                                                                        <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{formatDate(daily.date)}</p>
                                                                    </td>
                                                                    <td className="px-4 py-2 text-right">
                                                                        <p className="text-sm font-bold text-primary">{daily.amount?.toLocaleString('en-US', { minimumFractionDigits: 2 })} {rate.currency}</p>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        )}

                                        {/* Cancellation Policies */}
                                        {rate.cancellationPolicies && rate.cancellationPolicies.length > 0 && (
                                            <div>
                                                <h4 className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-3">Cancellation Policies</h4>
                                                <div className="overflow-x-auto">
                                                    <table className="w-full border-collapse">
                                                        <thead>
                                                            <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                                                                <th className="px-4 py-2 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider">From Date</th>
                                                                <th className="px-4 py-2 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider">To Date</th>
                                                                <th className="px-4 py-2 text-right text-[10px] font-black text-slate-400 uppercase tracking-wider">Penalty Amount</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                                            {rate.cancellationPolicies.map((policy, policyIndex) => (
                                                                <tr key={policyIndex} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                                                    <td className="px-4 py-2">
                                                                        <p className="text-sm text-slate-700 dark:text-slate-200">{formatDateTime(policy.fromDate)}</p>
                                                                    </td>
                                                                    <td className="px-4 py-2">
                                                                        <p className="text-sm text-slate-700 dark:text-slate-200">{formatDateTime(policy.toDate)}</p>
                                                                    </td>
                                                                    <td className="px-4 py-2 text-right">
                                                                        <p className="text-sm font-bold text-red-600 dark:text-red-400">{policy.amount?.toLocaleString('en-US', { minimumFractionDigits: 2 })} {policy.currency}</p>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ))}

                        {/* Audit Information Card */}
                        {booking.audit && (
                            <div className="bg-white dark:bg-slate-900 rounded-[28px] border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400">
                                        <span className="material-icons-round text-2xl">history</span>
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-black text-slate-900 dark:text-white">Audit Information</h2>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">Creation and modification history</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Created</p>
                                        <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{formatDateTime(booking.audit.createDateTime)}</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">by {booking.audit.createdBy}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Updated</p>
                                        <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{formatDateTime(booking.audit.updateDateTime)}</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">by {booking.audit.updatedBy}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</p>
                                        <span className={`inline-block px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider ${getStatusColor(booking.audit.status)}`}>
                                            {booking.audit.status}
                                        </span>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Version</p>
                                        <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{booking.audit.version}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BookingDetail;
