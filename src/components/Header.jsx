import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';
import { useAuth } from '../context/AuthContext';
import HeaderSearch from './HeaderSearch';

const Header = () => {
    const { user, logout } = useAuth();
    const location = useLocation();
    const [isMenuOpen, setIsMenuOpen] = React.useState(false);
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
    const isMap = location.pathname === '/map';

    const userDisplayName = user?.name && user?.surname
        ? `${user.name} ${user.surname}`
        : user?.email || 'User';

    return (
        <header className="sticky top-0 z-[1100] w-full border-b border-solid border-slate-200 dark:border-[#233648] bg-white/80 dark:bg-background-dark/80 backdrop-blur-md px-6 lg:px-20 py-3">
            <div className="max-w-[1440px] mx-auto flex items-center justify-between gap-4">
                <div className="flex items-center gap-8">
                    <Link to="/" className="flex items-center gap-3 text-primary">
                        <div className="size-8 bg-primary rounded-lg flex items-center justify-center text-white">
                            <span className="material-symbols-outlined text-2xl">apartment</span>
                        </div>
                        <h2 className="text-slate-900 dark:text-white text-xl font-bold leading-tight tracking-tight">Travel of Globe</h2>
                    </Link>
                    {/* Search Bar in Header */}
                    {/* Search Bar in Header */}
                    <HeaderSearch />
                </div>
                <div className="flex items-center gap-6">

                    <div className="flex items-center gap-3 border-l border-slate-200 dark:border-slate-700 pl-6">
                        <ThemeToggle />
                        {!user ? (
                            <Link to="/login" className="text-slate-900 dark:text-white text-sm font-bold px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">Sign In</Link>
                        ) : (
                            <div className="relative" ref={menuRef}>
                                <button
                                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                                    className="flex items-center gap-2 transition-transform active:scale-95 focus:outline-none"
                                >
                                    <div className="size-10 rounded-full border-2 border-primary overflow-hidden shadow-sm hover:shadow-md transition-shadow" title={userDisplayName}>
                                        <img
                                            className="w-full h-full object-cover"
                                            alt="User profile avatar"
                                            src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=256&q=80"
                                        />
                                    </div>
                                    <span className="material-symbols-outlined text-slate-500 dark:text-slate-400">expand_more</span>
                                </button>

                                {isMenuOpen && (
                                    <div className="absolute right-0 top-full mt-2 w-96 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden z-[9999] animate-in fade-in slide-in-from-top-2">
                                        <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">My Account</p>
                                            <p className="text-sm font-bold text-slate-900 dark:text-white truncate" title={userDisplayName}>{userDisplayName}</p>
                                            <p className="text-sm text-slate-500 break-words font-medium mt-0.5">{user.email}</p>
                                        </div>
                                        <div className="p-2 space-y-1">
                                            <button className="w-full text-left px-3 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg flex items-center gap-3 transition-colors">
                                                <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-slate-800 flex items-center justify-center text-primary">
                                                    <span className="material-symbols-outlined text-[18px]">person</span>
                                                </div>
                                                Profile Details
                                            </button>
                                            <button className="w-full text-left px-3 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg flex items-center gap-3 transition-colors">
                                                <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-slate-800 flex items-center justify-center text-primary">
                                                    <span className="material-symbols-outlined text-[18px]">settings</span>
                                                </div>
                                                Settings
                                            </button>
                                            <div className="border-t border-slate-100 dark:border-slate-800 my-1"></div>
                                            <button
                                                onClick={() => {
                                                    logout();
                                                    setIsMenuOpen(false);
                                                }}
                                                className="w-full text-left px-3 py-2.5 text-sm font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg flex items-center gap-3 transition-colors"
                                            >
                                                <div className="w-8 h-8 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center text-red-500">
                                                    <span className="material-symbols-outlined text-[18px]">logout</span>
                                                </div>
                                                Sign Out
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
