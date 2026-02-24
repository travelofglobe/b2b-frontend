import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ThemeToggle from '../components/ThemeToggle';
import { useAuth } from '../context/AuthContext';
import { bookingService } from '../services/bookingService';
import DashboardSearch from '../components/DashboardSearch';
import BookingStatusBadge from '../components/BookingStatusBadge';

const Dashboard = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
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

        const fetchBookings = async () => {
            try {
                setLoading(true);
                const data = await bookingService.findLastFive(abortController.signal);
                if (!abortController.signal.aborted) {
                    setBookings(data.bookings.content || []);
                    setError(null);
                }
            } catch (err) {
                if (err.name !== 'AbortError') {
                    console.error('Error fetching bookings:', err);
                    setError(err.message);
                }
            } finally {
                if (!abortController.signal.aborted) {
                    setLoading(false);
                }
            }
        };

        fetchBookings();

        return () => {
            abortController.abort();
        };
    }, []);



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



    const getInitials = (name) => {
        if (!name) return '??';
        const words = name.split(' ');
        if (words.length >= 2) {
            return (words[0][0] + words[1][0]).toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    };

    return (
        <div className="flex min-h-screen bg-[#f8fafc] dark:bg-[#0f172a] text-slate-900 dark:text-slate-100 transition-colors duration-500 font-sans relative overflow-hidden">
            {/* Background Decorative Glows */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full pointer-events-none"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-400/10 blur-[120px] rounded-full pointer-events-none"></div>

            {/* Sidebar */}
            <aside className="w-60 border-r border-white/40 dark:border-white/5 bg-white/40 dark:bg-slate-900/40 backdrop-blur-3xl hidden lg:flex flex-col fixed h-full z-30 shadow-[4px_0_24px_-12px_rgba(0,0,0,0.05)]">
                <div className="p-3 flex items-center gap-2">
                    <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white">
                        <span className="material-icons-round text-lg">language</span>
                    </div>
                    <span className="font-bold text-lg tracking-tight">TravelOfGlobe</span>
                </div>
                <nav className="flex-1 px-3 py-3 space-y-0.5">
                    <a className="flex items-center gap-3 px-3 py-2 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-primary font-medium text-xs" href="#">
                        <span className="material-icons-round text-[20px]">grid_view</span>
                        Dashboard
                    </a>
                    <a className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-xs" href="#">
                        <span className="material-icons-round text-[20px]">corporate_fare</span>
                        My Office
                    </a>
                    <button
                        onClick={() => navigate('/bookings')}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-xs w-full"
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
            <main className="flex-1 lg:ml-60 p-3 md:p-5">
                <div className="max-w-6xl mx-auto">
                    <header className="flex flex-wrap items-center justify-between mb-6 gap-4">
                        <div className="flex items-center gap-2">
                            <span className="material-icons-round text-primary text-xl">auto_awesome</span>
                            <h1 className="text-lg font-medium">Welcome back, <span className="font-bold">{userDisplayName}</span></h1>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 text-emerald-500 font-medium text-sm bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1.5 rounded-full">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                1,254 bookings today
                            </div>
                            <div className="flex items-center gap-2">
                                <button className="p-2 relative text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                                    <span className="material-icons-round">notifications</span>
                                    <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
                                </button>
                                <ThemeToggle />
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

                    <div className="mb-12 relative z-20">
                        <DashboardSearch />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        {/* Active Bookings Card */}
                        <div className="group bg-white/40 dark:bg-slate-900/40 backdrop-blur-3xl p-5 rounded-[32px] border border-white/60 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_50px_rgba(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-500">
                            <div className="flex items-center justify-between mb-4">
                                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform duration-500">
                                    <span className="material-icons-round text-2xl">confirmation_number</span>
                                </div>
                                <div className="flex flex-col items-end">
                                    <span className="text-emerald-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                                        <span className="material-icons-round text-xs">trending_up</span> +12%
                                    </span>
                                </div>
                            </div>
                            <h3 className="text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Active Bookings</h3>
                            <p className="text-3xl font-black tracking-tight">482</p>
                            <div className="mt-4 h-1 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                <div className="h-full bg-primary w-2/3 rounded-full shadow-[0_0_8px_rgba(var(--primary-rgb),0.5)]"></div>
                            </div>
                        </div>

                        {/* Pending Confirmations Card */}
                        <div className="group bg-white/40 dark:bg-slate-900/40 backdrop-blur-3xl p-5 rounded-[32px] border border-white/60 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_50px_rgba(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-500">
                            <div className="flex items-center justify-between mb-4">
                                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform duration-500">
                                    <span className="material-icons-round text-2xl">pending_actions</span>
                                </div>
                                <div className="flex flex-col items-end">
                                    <span className="text-amber-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                                        <span className="material-icons-round text-xs animate-pulse">schedule</span> 14 New
                                    </span>
                                </div>
                            </div>
                            <h3 className="text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Pending</h3>
                            <p className="text-3xl font-black tracking-tight">24</p>
                            <div className="mt-4 h-1 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                <div className="h-full bg-amber-500 w-1/4 rounded-full shadow-[0_0_8px_rgba(245,158,11,0.5)]"></div>
                            </div>
                        </div>

                        {/* Monthly Revenue Card */}
                        <div className="group bg-white/40 dark:bg-slate-900/40 backdrop-blur-3xl p-5 rounded-[32px] border border-white/60 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_50px_rgba(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-500">
                            <div className="flex items-center justify-between mb-4">
                                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform duration-500">
                                    <span className="material-icons-round text-2xl">payments</span>
                                </div>
                                <div className="flex flex-col items-end">
                                    <span className="text-emerald-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                                        <span className="material-icons-round text-xs">trending_up</span> +8.5%
                                    </span>
                                </div>
                            </div>
                            <h3 className="text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Revenue</h3>
                            <p className="text-3xl font-black tracking-tight">$124,500</p>
                            <div className="mt-4 h-1 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-500 w-[85%] rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                            </div>
                        </div>

                        {/* New Messages Card */}
                        <div className="group bg-white/40 dark:bg-slate-900/40 backdrop-blur-3xl p-5 rounded-[32px] border border-white/60 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_50px_rgba(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-500">
                            <div className="flex items-center justify-between mb-4">
                                <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-500 group-hover:scale-110 transition-transform duration-500">
                                    <span className="material-icons-round text-2xl">forum</span>
                                </div>
                                <div className="flex flex-col items-end">
                                    <span className="bg-red-500 text-white text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full shadow-lg shadow-red-500/20">3 New</span>
                                </div>
                            </div>
                            <h3 className="text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Messages</h3>
                            <p className="text-3xl font-black tracking-tight">12</p>
                            <div className="mt-4 h-1 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                <div className="h-full bg-purple-500 w-1/2 rounded-full shadow-[0_0_8px_rgba(168,85,247,0.5)]"></div>
                            </div>
                        </div>
                    </div>

                    <section className="mb-10">
                        <div className="flex items-center gap-2 mb-5">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                <span className="material-icons-round text-primary text-lg">bolt</span>
                            </div>
                            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Quick Actions</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <button className="flex items-center gap-4 p-5 bg-white/40 dark:bg-slate-900/40 backdrop-blur-3xl rounded-[28px] border border-white/60 dark:border-white/10 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-500 group">
                                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all duration-500 shadow-[0_0_15px_rgba(var(--primary-rgb),0)] group-hover:shadow-[0_0_20px_rgba(var(--primary-rgb),0.3)]">
                                    <span className="material-icons-round text-xl">description</span>
                                </div>
                                <div className="text-left">
                                    <p className="font-black text-xs uppercase tracking-tight">Create Quotation</p>
                                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-0.5">Generate proposal</p>
                                </div>
                            </button>
                            <button className="flex items-center gap-4 p-5 bg-white/40 dark:bg-slate-900/40 backdrop-blur-3xl rounded-[28px] border border-white/60 dark:border-white/10 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-500 group">
                                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 group-hover:bg-indigo-500 group-hover:text-white transition-all duration-500 shadow-[0_0_15px_rgba(99,102,241,0)] group-hover:shadow-[0_0_20px_rgba(99,102,241,0.3)]">
                                    <span className="material-icons-round text-xl">receipt_long</span>
                                </div>
                                <div className="text-left">
                                    <p className="font-black text-xs uppercase tracking-tight">Manage Invoices</p>
                                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-0.5">Review & Send</p>
                                </div>
                            </button>
                            <button className="flex items-center gap-4 p-5 bg-white/40 dark:bg-slate-900/40 backdrop-blur-3xl rounded-[28px] border border-white/60 dark:border-white/10 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-500 group">
                                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition-all duration-500 shadow-[0_0_15px_rgba(16,185,129,0)] group-hover:shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                                    <span className="material-icons-round text-xl">fact_check</span>
                                </div>
                                <div className="text-left">
                                    <p className="font-black text-xs uppercase tracking-tight">Check Availability</p>
                                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-0.5">Real-time lookup</p>
                                </div>
                            </button>
                        </div>
                    </section>

                    <section className="mb-12">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                    <span className="material-icons-round text-primary text-lg">public</span>
                                </div>
                                <div>
                                    <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Popular Destinations</h2>
                                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-widest mt-0.5">Explore top travel spots</p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button className="size-10 rounded-[14px] bg-white/40 dark:bg-slate-800/40 border border-white/60 dark:border-white/10 hover:bg-white/60 dark:hover:bg-slate-800/60 transition-all flex items-center justify-center text-slate-400 hover:text-primary">
                                    <span className="material-icons-round">chevron_left</span>
                                </button>
                                <button className="size-10 rounded-[14px] bg-white/40 dark:bg-slate-800/40 border border-white/60 dark:border-white/10 hover:bg-white/60 dark:hover:bg-slate-800/60 transition-all flex items-center justify-center text-primary">
                                    <span className="material-icons-round">chevron_right</span>
                                </button>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                            <div onClick={() => navigate('/hotels/dubai')} className="group bg-white/40 dark:bg-slate-900/40 backdrop-blur-3xl rounded-[32px] overflow-hidden border border-white/60 dark:border-white/10 cursor-pointer shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500">
                                <div className="relative h-48 overflow-hidden">
                                    <img alt="Dubai skyline" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" src="https://lh3.googleusercontent.com/aida-public/AB6AXuA44V5Rw3n0d1IRUftf6z8_vB3HBwcJuZJYvR8YmMatQ44JJKuoVOOMZcc324K7w5t1CEj7rrbmQfvu5_L2C40dYKtEcaBr5ly0T2kK_jkA4AEB8UFmJdh9tBTYpY2-EwDPlKBK-hSxTlvOGKO0anJ6RtGIuOBD2wgcngOYuLJCxcsptvI1yl_q818XSF4LsNWF3KF9TlwuW10-EZRTff2f_RLRbTnjZryGus-MPJEtchv29FeLBwrrvu5twYK6Gksekuw7rc8BfLAE" />
                                    <div className="absolute top-4 right-4 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl px-3 py-1.5 rounded-2xl border border-white/60 dark:border-white/20 flex items-center gap-2 shadow-lg">
                                        <span className="material-icons-round text-primary text-xs">trending_up</span>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-[#0f172a] dark:text-white">Trending</span>
                                    </div>
                                </div>
                                <div className="p-6">
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <h4 className="font-black text-lg uppercase tracking-tight">Dubai</h4>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">UAE</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">from</p>
                                            <p className="text-primary font-black text-lg">$89</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="bg-primary/5 text-primary text-[8px] font-black px-2 py-1 rounded-lg uppercase tracking-widest">1240 Hotels</span>
                                        <span className="bg-slate-100/50 dark:bg-slate-800/50 text-slate-500 text-[8px] font-black px-2 py-1 rounded-lg uppercase tracking-widest">Luxury</span>
                                    </div>
                                </div>
                            </div>
                            <div onClick={() => navigate('/hotels/paris')} className="group bg-white/40 dark:bg-slate-900/40 backdrop-blur-3xl rounded-[32px] overflow-hidden border border-white/60 dark:border-white/10 cursor-pointer shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500">
                                <div className="relative h-48 overflow-hidden">
                                    <img alt="Eiffel Tower Paris" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAAKaysBHtmgeqbCgI0hzy0BjMTk-ihUbfPvkwXOo8168DpEmYK3ZwUxnws0XTpi6CmcD9AxZbd3_eEML6dtpH1U4UclGEab2N3lvPHR2NF83mJEoRDl4abqV9dzSRQSgW_hG8DnDAIF2poS3q0EGj7EQwR269k2fBX9DwMIy5gLNy3CNjSgGuy6g3et73S__a185-hjz_rlYOqQXd3J9xxPDU6VuTKmnr7sPPCcfG7YmvzEi-Tg2SmIcvAqYG0Sbd2-iebgBNPsKU_" />
                                    <div className="absolute top-4 right-4 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl px-3 py-1.5 rounded-2xl border border-white/60 dark:border-white/20 flex items-center gap-2 shadow-lg">
                                        <span className="material-icons-round text-primary text-xs">trending_up</span>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-[#0f172a] dark:text-white">Trending</span>
                                    </div>
                                </div>
                                <div className="p-6">
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <h4 className="font-black text-lg uppercase tracking-tight">Paris</h4>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">France</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">from</p>
                                            <p className="text-primary font-black text-lg">$120</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="bg-primary/5 text-primary text-[8px] font-black px-2 py-1 rounded-lg uppercase tracking-widest">2100 Hotels</span>
                                        <span className="bg-slate-100/50 dark:bg-slate-800/50 text-slate-500 text-[8px] font-black px-2 py-1 rounded-lg uppercase tracking-widest">Romance</span>
                                    </div>
                                </div>
                            </div>
                            <div onClick={() => navigate('/hotels/tokyo')} className="group bg-white/40 dark:bg-slate-900/40 backdrop-blur-3xl rounded-[32px] overflow-hidden border border-white/60 dark:border-white/10 cursor-pointer shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500">
                                <div className="relative h-48 overflow-hidden">
                                    <img alt="Tokyo tower" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" src="https://lh3.googleusercontent.com/aida-public/AB6AXuC0NEc0GKKnW3d7mB9bVdbYwFNBEpY_nhmkIekHSBPSWraDNin1ulHT4_q9cfhMIcqrg51KW03dH7sambalU3BYZ7y1HYErTyF-Wv08E5_ZTcGFZrbVQoaAWGSJJ-DT_LoEtPdZ6dZ8UDyuHbzkGiRdIafWF85YxePToZg0rHlnEcE09fDEybxGYm1CEGPO7UT-q-ghVu23XP5EZBmMWGnaKFbxyGO7P11p_zKZAvKsILFOdCL3gMmFS3S-e5qWTr12LhS_aHMTOtlm" />
                                    <div className="absolute top-4 right-4 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl px-3 py-1.5 rounded-2xl border border-white/60 dark:border-white/20 flex items-center gap-2 shadow-lg">
                                        <span className="material-icons-round text-primary text-xs">trending_up</span>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-[#0f172a] dark:text-white">Trending</span>
                                    </div>
                                </div>
                                <div className="p-6">
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <h4 className="font-black text-lg uppercase tracking-tight">Tokyo</h4>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Japan</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">from</p>
                                            <p className="text-primary font-black text-lg">$95</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="bg-primary/5 text-primary text-[8px] font-black px-2 py-1 rounded-lg uppercase tracking-widest">1850 Hotels</span>
                                        <span className="bg-slate-100/50 dark:bg-slate-800/50 text-slate-500 text-[8px] font-black px-2 py-1 rounded-lg uppercase tracking-widest">Culture</span>
                                    </div>
                                </div>
                            </div>
                            <div onClick={() => navigate('/hotels/new-york')} className="group bg-white/40 dark:bg-slate-900/40 backdrop-blur-3xl rounded-[32px] overflow-hidden border border-white/60 dark:border-white/10 cursor-pointer shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500">
                                <div className="relative h-48 overflow-hidden">
                                    <img alt="New York City" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDtxEUChP8HguBV_GFxz8TEk3Dssxi8xSCtI9Z9T9odllNiM91Ak0hyIkth1y8h7fVd-SgwSm4HxyJenSQHfxcK0mRSw03MGbXy9awP6fWL9o2E6w2zJuTizyr02IqQyZd6m73Z9CBZkHOiHgr0UxqaQ0otgONM7xlmX8jdsLkvqO6E3iPFxcpO5oCVYD2Oeq35OrYztM-6PMWjIP3b1DOmvxfBWs1CLP1K2ycUZSlNdQ7d-ig6xdBpLeQU4BjENmJ-TBFNTw8OLQXD" />
                                    <div className="absolute top-4 right-4 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl px-3 py-1.5 rounded-2xl border border-white/60 dark:border-white/20 flex items-center gap-2 shadow-lg">
                                        <span className="material-icons-round text-primary text-xs">trending_up</span>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-[#0f172a] dark:text-white">Trending</span>
                                    </div>
                                </div>
                                <div className="p-6">
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <h4 className="font-black text-lg uppercase tracking-tight">New York</h4>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">USA</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">from</p>
                                            <p className="text-primary font-black text-lg">$150</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="bg-primary/5 text-primary text-[8px] font-black px-2 py-1 rounded-lg uppercase tracking-widest">3200 Hotels</span>
                                        <span className="bg-slate-100/50 dark:bg-slate-800/50 text-slate-500 text-[8px] font-black px-2 py-1 rounded-lg uppercase tracking-widest">Metropolis</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="mb-12">
                        <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-3xl rounded-[40px] border border-white/60 dark:border-white/10 overflow-hidden shadow-2xl">
                            <div className="p-8 border-b border-white/40 dark:border-white/5 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                        <span className="material-icons-round text-primary text-lg">history</span>
                                    </div>
                                    <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Recent Bookings</h2>
                                </div>
                                <button
                                    onClick={() => navigate('/bookings')}
                                    className="px-4 py-2 rounded-xl bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest hover:bg-primary hover:text-white transition-all duration-300"
                                >
                                    View All
                                </button>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-widest bg-white/20 dark:bg-slate-800/20">
                                            <th className="px-6 py-4">Booking ID</th>
                                            <th className="px-6 py-4">Voucher</th>
                                            <th className="px-6 py-4">Agency</th>
                                            <th className="px-6 py-4">Hotel</th>
                                            <th className="px-6 py-4 text-center">Check-in</th>
                                            <th className="px-6 py-4 text-right">Amount</th>
                                            <th className="px-6 py-4 text-center">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/20 dark:divide-white/5">
                                        {loading ? (
                                            <tr>
                                                <td colSpan="7" className="px-6 py-12 text-center">
                                                    <div className="flex flex-col items-center justify-center gap-4">
                                                        <div className="size-8 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Retrieving Data...</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : error ? (
                                            <tr>
                                                <td colSpan="7" className="px-6 py-12 text-center text-red-500 font-bold uppercase tracking-widest text-[10px]">
                                                    {error}
                                                </td>
                                            </tr>
                                        ) : bookings.length === 0 ? (
                                            <tr>
                                                <td colSpan="7" className="px-6 py-12 text-center text-slate-400 uppercase tracking-widest text-[10px] font-black">
                                                    No recent bookings found
                                                </td>
                                            </tr>
                                        ) : (
                                            bookings.map((booking) => (
                                                <tr key={booking.bookingId} className="hover:bg-white/40 dark:hover:bg-slate-800/40 transition-colors group">
                                                    <td className="px-6 py-4">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                navigate(`/bookings/${booking.bookingId}`);
                                                            }}
                                                            className="text-primary font-black uppercase tracking-tight text-xs hover:underline decoration-2 underline-offset-4"
                                                        >
                                                            #{booking.bookingId}
                                                        </button>
                                                    </td>
                                                    <td className="px-6 py-4 text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest">
                                                        {booking.voucher || '-'}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-[10px] font-black text-primary border border-primary/20">
                                                                {getInitials(booking.principalAgencyName)}
                                                            </div>
                                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 truncate max-w-[120px]">{booking.principalAgencyName}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 truncate max-w-[150px]">{booking.hotelName}</td>
                                                    <td className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500 text-center">
                                                        {formatDate(booking.checkInDate)}
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <span className="text-xs font-black uppercase tracking-tight text-slate-900 dark:text-white">
                                                            {booking.totalAmount ? `${booking.currency} ${booking.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : 'N/A'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex justify-center">
                                                            <BookingStatusBadge status={booking.bookingStatus} />
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </section>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                        <div className="flex items-center gap-3 p-4 bg-white/50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-primary">
                                <span className="material-icons-round text-xl">verified_user</span>
                            </div>
                            <div>
                                <p className="text-xs font-bold">Secure Payment</p>
                                <p className="text-[10px] text-slate-400">256-bit SSL</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-4 bg-white/50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-primary">
                                <span className="material-icons-round text-xl">loyalty</span>
                            </div>
                            <div>
                                <p className="text-xs font-bold">Best Price</p>
                                <p className="text-[10px] text-slate-400">Guaranteed</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-4 bg-white/50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-primary">
                                <span className="material-icons-round text-xl">support_agent</span>
                            </div>
                            <div>
                                <p className="text-xs font-bold">24/7 Support</p>
                                <p className="text-[10px] text-slate-400">Always here</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-4 bg-white/50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-primary">
                                <span className="material-icons-round text-xl">reviews</span>
                            </div>
                            <div>
                                <p className="text-xs font-bold">Verified Reviews</p>
                                <p className="text-[10px] text-slate-400">Real feedback</p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div >
    );
};

export default Dashboard;
