import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ThemeToggle from '../components/ThemeToggle';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
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

    const handleSearch = () => {
        navigate('/hotels');
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const userDisplayName = user?.name && user?.surname
        ? `${user.name} ${user.surname}`
        : user?.email || 'Travel Agent';

    return (
        <div className="flex min-h-screen bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 transition-colors duration-200 font-sans">
            {/* Sidebar */}
            <aside className="w-60 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hidden lg:flex flex-col fixed h-full z-30">
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
                    <a className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-xs" href="#">
                        <span className="material-icons-round text-[20px]">book_online</span>
                        My Bookings
                    </a>
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
                                        <div className="w-10 h-10 rounded-full border-2 border-primary overflow-hidden" title={userDisplayName}>
                                            <img
                                                className="w-full h-full object-cover"
                                                alt="User profile avatar"
                                                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBosNqeUSWMhJzh5LpHCFPb5pLuKb8iL2md4jVM2E56t5Fv9dyFMkYnOoEtDWJR6D93U1ktccli6wRXrDIFrJfBzqCuo5f3p_dAmSl_IOc_ls1zrDr3BzT9UkmB-hXIOrfHfvPmYIBsjYr8pMfjM43LH5Rt6-TPmTMmscoLyVghfEK4wzk7GtmvkdhcdOdWIR6LeTpuh-DYatxfCIZul2x7amqH7lCa89tzhsz4XxNW_yxi5Ycxf1QNFnIYxHogNEd3zAqE767kNbGk"
                                            />
                                        </div>
                                        <span className="material-icons-round text-slate-500 dark:text-slate-400">expand_more</span>
                                    </button>

                                    {isMenuOpen && (
                                        <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden z-[9999] animate-in fade-in slide-in-from-top-2">
                                            <div className="p-3 border-b border-slate-100 dark:border-slate-800">
                                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">My Account</p>
                                                <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{userDisplayName}</p>
                                                <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                                            </div>
                                            <div className="p-1">
                                                <button className="w-full text-left px-3 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg flex items-center gap-2 transition-colors">
                                                    <span className="material-icons-round text-[18px]">settings</span>
                                                    Settings
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        handleLogout();
                                                        setIsMenuOpen(false);
                                                    }}
                                                    className="w-full text-left px-3 py-2 text-sm font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg flex items-center gap-2 transition-colors mt-1"
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

                    <section className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-none p-2 mb-6 border border-white dark:border-slate-800">
                        <div className="flex flex-wrap items-center gap-1 mb-3 p-3 border-b border-slate-50 dark:border-slate-800">
                            <button className="bg-primary text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 shadow-lg shadow-primary/25 text-xs">
                                <span className="material-icons-round text-base">hotel</span> HOTEL
                            </button>
                            <button className="px-4 py-2 rounded-lg font-medium flex items-center gap-2 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-xs">
                                <span className="material-icons-round text-base">flight</span> FLIGHT
                            </button>
                            <button className="px-4 py-2 rounded-lg font-medium flex items-center gap-2 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-xs">
                                <span className="material-icons-round text-base">airport_shuttle</span> TRANSFER
                            </button>
                            <button className="px-4 py-2 rounded-lg font-medium flex items-center gap-2 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-xs">
                                <span className="material-icons-round text-base">explore</span> TOUR
                            </button>
                            <button className="px-4 py-2 rounded-lg font-medium flex items-center gap-2 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-xs">
                                <span className="material-icons-round text-base">directions_car</span> CAR RENTALS
                            </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4">
                            <div className="md:col-span-4 space-y-1.5">
                                <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 ml-1">Accommodation</label>
                                <div className="flex items-center gap-2 px-3 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-transparent focus-within:border-primary transition-all">
                                    <span className="material-icons-round text-slate-400 text-lg">location_on</span>
                                    <input className="bg-transparent border-none focus:ring-0 w-full p-0 text-xs" placeholder="Dubai, United Arab Emirates" type="text" />
                                </div>
                            </div>
                            <div className="md:col-span-3 space-y-1.5">
                                <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 ml-1">Check-in / Check-out</label>
                                <div className="flex items-center gap-2 px-3 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-transparent focus-within:border-primary transition-all">
                                    <span className="material-icons-round text-slate-400 text-lg">calendar_month</span>
                                    <div className="flex items-center justify-between w-full">
                                        <span className="text-xs">10.10.2025 - 12.10.2025</span>
                                        <span className="bg-primary/10 text-primary text-[9px] font-bold px-1.5 py-0.5 rounded">2N</span>
                                    </div>
                                </div>
                            </div>
                            <div className="md:col-span-3 space-y-1.5">
                                <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 ml-1">Guests & Rooms</label>
                                <div className="flex items-center gap-2 px-3 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-transparent focus-within:border-primary transition-all cursor-pointer">
                                    <span className="material-icons-round text-slate-400 text-lg">group</span>
                                    <span className="text-xs flex-1">2 Adults, 1 Room</span>
                                    <span className="material-icons-round text-slate-400 text-base">expand_more</span>
                                </div>
                            </div>
                            <div className="md:col-span-2 flex items-end">
                                <button
                                    onClick={handleSearch}
                                    className="w-full bg-primary hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-xl shadow-xl shadow-primary/20 flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5 active:translate-y-0 text-xs"
                                >
                                    <span className="material-icons-round text-base">search</span> Search
                                </button>
                            </div>
                        </div>
                    </section>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                            <div className="flex items-center justify-between mb-3">
                                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-primary">
                                    <span className="material-icons-round text-xl">confirmation_number</span>
                                </div>
                                <span className="text-emerald-500 text-[10px] font-bold flex items-center gap-1">
                                    <span className="material-icons-round text-sm">trending_up</span> +12%
                                </span>
                            </div>
                            <h3 className="text-slate-400 text-xs font-medium mb-0.5">Active Bookings</h3>
                            <p className="text-xl font-bold">482</p>
                        </div>
                        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                            <div className="flex items-center justify-between mb-3">
                                <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center text-amber-500">
                                    <span className="material-icons-round text-xl">pending_actions</span>
                                </div>
                                <span className="text-amber-500 text-[10px] font-bold flex items-center gap-1">
                                    <span className="material-icons-round text-sm">schedule</span> 14 New
                                </span>
                            </div>
                            <h3 className="text-slate-400 text-xs font-medium mb-0.5">Pending Confirmations</h3>
                            <p className="text-xl font-bold">24</p>
                        </div>
                        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                            <div className="flex items-center justify-between mb-3">
                                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-500">
                                    <span className="material-icons-round text-xl">payments</span>
                                </div>
                                <span className="text-emerald-500 text-[10px] font-bold flex items-center gap-1">
                                    <span className="material-icons-round text-sm">trending_up</span> +8.5%
                                </span>
                            </div>
                            <h3 className="text-slate-400 text-xs font-medium mb-0.5">Monthly Revenue</h3>
                            <p className="text-xl font-bold">$124,500</p>
                        </div>
                        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                            <div className="flex items-center justify-between mb-3">
                                <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center text-purple-500">
                                    <span className="material-icons-round text-xl">forum</span>
                                </div>
                                <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">3</span>
                            </div>
                            <h3 className="text-slate-400 text-xs font-medium mb-0.5">New Messages</h3>
                            <p className="text-xl font-bold">12</p>
                        </div>
                    </div>

                    <section className="mb-8">
                        <h2 className="text-base font-bold mb-4 flex items-center gap-2">
                            <span className="material-icons-round text-primary text-xl">bolt</span> Quick Actions
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <button className="flex items-center gap-3 p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-primary/50 hover:shadow-lg transition-all group">
                                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                                    <span className="material-icons-round text-lg">description</span>
                                </div>
                                <div className="text-left">
                                    <p className="font-bold text-sm">Create Quotation</p>
                                    <p className="text-[10px] text-slate-400">Generate new client proposal</p>
                                </div>
                            </button>
                            <button className="flex items-center gap-3 p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-primary/50 hover:shadow-lg transition-all group">
                                <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-500 group-hover:bg-indigo-500 group-hover:text-white transition-all">
                                    <span className="material-icons-round text-lg">receipt_long</span>
                                </div>
                                <div className="text-left">
                                    <p className="font-bold text-sm">Manage Invoices</p>
                                    <p className="text-[10px] text-slate-400">Review and send invoices</p>
                                </div>
                            </button>
                            <button className="flex items-center gap-3 p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-primary/50 hover:shadow-lg transition-all group">
                                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                                    <span className="material-icons-round text-lg">fact_check</span>
                                </div>
                                <div className="text-left">
                                    <p className="font-bold text-sm">Check Availability</p>
                                    <p className="text-[10px] text-slate-400">Real-time inventory lookup</p>
                                </div>
                            </button>
                        </div>
                    </section>

                    <section className="mb-12">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-lg font-bold">Popular Destinations</h2>
                                <p className="text-sm text-slate-400">Explore top travel destinations handpicked for you</p>
                            </div>
                            <div className="flex gap-2">
                                <button className="p-2 rounded-full bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 hover:bg-slate-50 transition-colors">
                                    <span className="material-icons-round">chevron_left</span>
                                </button>
                                <button className="p-2 rounded-full bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 hover:bg-slate-50 transition-colors text-primary">
                                    <span className="material-icons-round">chevron_right</span>
                                </button>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="bg-white dark:bg-slate-900 rounded-3xl overflow-hidden border border-slate-100 dark:border-slate-800 group cursor-pointer shadow-sm hover:shadow-xl transition-all">
                                <div className="relative h-40">
                                    <img alt="Dubai skyline" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" src="https://lh3.googleusercontent.com/aida-public/AB6AXuA44V5Rw3n0d1IRUftf6z8_vB3HBwcJuZJYvR8YmMatQ44JJKuoVOOMZcc324K7w5t1CEj7rrbmQfvu5_L2C40dYKtEcaBr5ly0T2kK_jkA4AEB8UFmJdh9tBTYpY2-EwDPlKBK-hSxTlvOGKO0anJ6RtGIuOBD2wgcngOYuLJCxcsptvI1yl_q818XSF4LsNWF3KF9TlwuW10-EZRTff2f_RLRbTnjZryGus-MPJEtchv29FeLBwrrvu5twYK6Gksekuw7rc8BfLAE" />
                                    <div className="absolute top-4 right-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-1.5">
                                        <span className="material-icons-round text-primary text-sm">trending_up</span>
                                        <span className="text-[10px] font-bold uppercase tracking-wide">Trending</span>
                                    </div>
                                </div>
                                <div className="p-5">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <h4 className="font-bold text-lg">Dubai</h4>
                                            <p className="text-xs text-slate-400">United Arab Emirates</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs text-slate-400">from</p>
                                            <p className="text-primary font-bold">$89</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 text-[10px] text-slate-500 font-medium">
                                        <span className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">1240 Hotels</span>
                                        <span className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">Luxury</span>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white dark:bg-slate-900 rounded-3xl overflow-hidden border border-slate-100 dark:border-slate-800 group cursor-pointer shadow-sm hover:shadow-xl transition-all">
                                <div className="relative h-40">
                                    <img alt="Eiffel Tower Paris" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAAKaysBHtmgeqbCgI0hzy0BjMTk-ihUbfPvkwXOo8168DpEmYK3ZwUxnws0XTpi6CmcD9AxZbd3_eEML6dtpH1U4UclGEab2N3lvPHR2NF83mJEoRDl4abqV9dzSRQSgW_hG8DnDAIF2poS3q0EGj7EQwR269k2fBX9DwMIy5gLNy3CNjSgGuy6g3et73S__a185-hjz_rlYOqQXd3J9xxPDU6VuTKmnr7sPPCcfG7YmvzEi-Tg2SmIcvAqYG0Sbd2-iebgBNPsKU_" />
                                    <div className="absolute top-4 right-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-1.5">
                                        <span className="material-icons-round text-primary text-sm">trending_up</span>
                                        <span className="text-[10px] font-bold uppercase tracking-wide">Trending</span>
                                    </div>
                                </div>
                                <div className="p-5">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <h4 className="font-bold text-lg">Paris</h4>
                                            <p className="text-xs text-slate-400">France</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs text-slate-400">from</p>
                                            <p className="text-primary font-bold">$120</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 text-[10px] text-slate-500 font-medium">
                                        <span className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">2100 Hotels</span>
                                        <span className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">Romance</span>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white dark:bg-slate-900 rounded-3xl overflow-hidden border border-slate-100 dark:border-slate-800 group cursor-pointer shadow-sm hover:shadow-xl transition-all">
                                <div className="relative h-40">
                                    <img alt="Tokyo tower" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" src="https://lh3.googleusercontent.com/aida-public/AB6AXuC0NEc0GKKnW3d7mB9bVdbYwFNBEpY_nhmkIekHSBPSWraDNin1ulHT4_q9cfhMIcqrg51KW03dH7sambalU3BYZ7y1HYErTyF-Wv08E5_ZTcGFZrbVQoaAWGSJJ-DT_LoEtPdZ6dZ8UDyuHbzkGiRdIafWF85YxePToZg0rHlnEcE09fDEybxGYm1CEGPO7UT-q-ghVu23XP5EZBmMWGnaKFbxyGO7P11p_zKZAvKsILFOdCL3gMmFS3S-e5qWTr12LhS_aHMTOtlm" />
                                    <div className="absolute top-4 right-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-1.5">
                                        <span className="material-icons-round text-primary text-sm">trending_up</span>
                                        <span className="text-[10px] font-bold uppercase tracking-wide">Trending</span>
                                    </div>
                                </div>
                                <div className="p-5">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <h4 className="font-bold text-lg">Tokyo</h4>
                                            <p className="text-xs text-slate-400">Japan</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs text-slate-400">from</p>
                                            <p className="text-primary font-bold">$95</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 text-[10px] text-slate-500 font-medium">
                                        <span className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">1850 Hotels</span>
                                        <span className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">Culture</span>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white dark:bg-slate-900 rounded-3xl overflow-hidden border border-slate-100 dark:border-slate-800 group cursor-pointer shadow-sm hover:shadow-xl transition-all">
                                <div className="relative h-40">
                                    <img alt="New York City" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDtxEUChP8HguBV_GFxz8TEk3Dssxi8xSCtI9Z9T9odllNiM91Ak0hyIkth1y8h7fVd-SgwSm4HxyJenSQHfxcK0mRSw03MGbXy9awP6fWL9o2E6w2zJuTizyr02IqQyZd6m73Z9CBZkHOiHgr0UxqaQ0otgONM7xlmX8jdsLkvqO6E3iPFxcpO5oCVYD2Oeq35OrYztM-6PMWjIP3b1DOmvxfBWs1CLP1K2ycUZSlNdQ7d-ig6xdBpLeQU4BjENmJ-TBFNTw8OLQXD" />
                                    <div className="absolute top-4 right-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-1.5">
                                        <span className="material-icons-round text-primary text-sm">trending_up</span>
                                        <span className="text-[10px] font-bold uppercase tracking-wide">Trending</span>
                                    </div>
                                </div>
                                <div className="p-5">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <h4 className="font-bold text-lg">New York</h4>
                                            <p className="text-xs text-slate-400">USA</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs text-slate-400">from</p>
                                            <p className="text-primary font-bold">$150</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 text-[10px] text-slate-500 font-medium">
                                        <span className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">3200 Hotels</span>
                                        <span className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">Metropolis</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 overflow-hidden mb-12 shadow-sm">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                            <h2 className="text-lg font-bold">Recent Bookings</h2>
                            <button className="text-primary text-sm font-semibold hover:underline">View All</button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="text-slate-400 text-xs font-semibold uppercase tracking-wider bg-slate-50/50 dark:bg-slate-800/50">
                                        <th className="px-4 py-3">Booking ID</th>
                                        <th className="px-4 py-3">Customer</th>
                                        <th className="px-4 py-3">Service</th>
                                        <th className="px-4 py-3">Date</th>
                                        <th className="px-4 py-3">Amount</th>
                                        <th className="px-4 py-3">Status</th>
                                        <th className="px-4 py-3">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                                        <td className="px-4 py-3 text-xs font-medium">#BK-9421</td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-600">JS</div>
                                                <span className="text-sm">John Smith</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-sm">Marriott Marquis Dubai</td>
                                        <td className="px-4 py-3 text-sm text-slate-500">Oct 12, 2024</td>
                                        <td className="px-4 py-3 text-sm font-semibold">$540.00</td>
                                        <td className="px-4 py-3">
                                            <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 text-[10px] font-bold uppercase tracking-wider">Confirmed</span>
                                        </td>
                                        <td className="px-4 py-3 text-xs">
                                            <button className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                                                <span className="material-icons-round text-slate-400 text-base">more_horiz</span>
                                            </button>
                                        </td>
                                    </tr>
                                    <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                                        <td className="px-4 py-3 text-sm font-medium">#BK-9388</td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-600">AW</div>
                                                <span className="text-sm">Alice Wong</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-sm">Emirates Flight (DXB-LHR)</td>
                                        <td className="px-4 py-3 text-sm text-slate-500">Oct 11, 2024</td>
                                        <td className="px-4 py-3 text-sm font-semibold">$1,210.00</td>
                                        <td className="px-4 py-3">
                                            <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400 text-[10px] font-bold uppercase tracking-wider">Pending</span>
                                        </td>
                                        <td className="px-4 py-3 text-xs">
                                            <button className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                                                <span className="material-icons-round text-slate-400 text-base">more_horiz</span>
                                            </button>
                                        </td>
                                    </tr>
                                    <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                                        <td className="px-4 py-3 text-sm font-medium">#BK-9310</td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-600">RT</div>
                                                <span className="text-sm">Robert Taylor</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-sm">Paris City Tour (Full Day)</td>
                                        <td className="px-4 py-3 text-sm text-slate-500">Oct 10, 2024</td>
                                        <td className="px-4 py-3 text-sm font-semibold">$85.00</td>
                                        <td className="px-4 py-3">
                                            <span className="px-2.5 py-1 rounded-full bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 text-[10px] font-bold uppercase tracking-wider">Cancelled</span>
                                        </td>
                                        <td className="px-4 py-3 text-xs">
                                            <button className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                                                <span className="material-icons-round text-slate-400 text-base">more_horiz</span>
                                            </button>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
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
