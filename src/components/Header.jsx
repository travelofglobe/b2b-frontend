import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';

const Header = () => {
    const location = useLocation();
    const isMap = location.pathname === '/map';

    return (
        <header className="sticky top-0 z-50 w-full border-b border-solid border-slate-200 dark:border-[#233648] bg-white/80 dark:bg-background-dark/80 backdrop-blur-md px-6 lg:px-20 py-3">
            <div className="max-w-[1440px] mx-auto flex items-center justify-between gap-4">
                <div className="flex items-center gap-8">
                    <Link to="/" className="flex items-center gap-3 text-primary">
                        <div className="size-8 bg-primary rounded-lg flex items-center justify-center text-white">
                            <span className="material-symbols-outlined text-2xl">apartment</span>
                        </div>
                        <h2 className="text-slate-900 dark:text-white text-xl font-bold leading-tight tracking-tight">Travel of Globe</h2>
                    </Link>
                    {/* Search Bar in Header */}
                    <div className="hidden xl:flex items-center bg-slate-100 dark:bg-[#233648] rounded-xl px-2 py-1 gap-2 border border-slate-200 dark:border-transparent">
                        <div className="flex items-center px-3 border-r border-slate-300 dark:border-slate-600">
                            <span className="material-symbols-outlined text-slate-400 text-xl mr-2">location_on</span>
                            <input
                                className="bg-transparent border-none focus:ring-0 text-sm w-32 placeholder:text-slate-500"
                                placeholder="Where to?"
                                type="text"
                            />
                        </div>
                        <div className="flex items-center px-3 border-r border-slate-300 dark:border-slate-600">
                            <span className="material-symbols-outlined text-slate-400 text-xl mr-2">calendar_month</span>
                            <input
                                className="bg-transparent border-none focus:ring-0 text-sm w-32 placeholder:text-slate-500"
                                placeholder="Dates"
                                type="text"
                            />
                        </div>
                        <div className="flex items-center px-3">
                            <span className="material-symbols-outlined text-slate-400 text-xl mr-2">group</span>
                            <input
                                className="bg-transparent border-none focus:ring-0 text-sm w-20 placeholder:text-slate-500"
                                placeholder="Guests"
                                type="text"
                            />
                        </div>
                        <button className="bg-primary text-white p-2 rounded-lg hover:bg-primary/90 transition-colors">
                            <span className="material-symbols-outlined">search</span>
                        </button>
                    </div>
                </div>
                <div className="flex items-center gap-6">
                    <nav className="hidden md:flex items-center gap-6">
                        <Link className={`text-sm font-semibold transition-colors ${!isMap ? 'text-primary' : 'text-slate-600 dark:text-slate-300 hover:text-primary'}`} to="/">Stays</Link>
                        <a className="text-slate-600 dark:text-slate-300 hover:text-primary dark:hover:text-primary text-sm font-semibold transition-colors" href="#">Flights</a>
                    </nav>
                    <div className="flex items-center gap-3 border-l border-slate-200 dark:border-slate-700 pl-6">
                        <ThemeToggle />
                        <button className="text-slate-900 dark:text-white text-sm font-bold px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">Sign In</button>
                        <div className="size-10 rounded-full border-2 border-primary overflow-hidden">
                            <img
                                className="w-full h-full object-cover"
                                alt="User profile avatar"
                                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBosNqeUSWMhJzh5LpHCFPb5pLuKb8iL2md4jVM2E56t5Fv9dyFMkYnOoEtDWJR6D93U1ktccli6wRXrDIFrJfBzqCuo5f3p_dAmSl_IOc_ls1zrDr3BzT9UkmB-hXIOrfHfvPmYIBsjYr8pMfjM43LH5Rt6-TPmTMmscoLyVghfEK4wzk7GtmvkdhcdOdWIR6LeTpuh-DYatxfCIZul2x7amqH7lCa89tzhsz4XxNW_yxi5Ycxf1QNFnIYxHogNEd3zAqE767kNbGk"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
