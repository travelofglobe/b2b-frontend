import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';

const PortalLayout = () => {
    const navigate = useNavigate();
    const location = useLocation();

    return (
        <div className="flex h-screen bg-[#F8FAFC] dark:bg-[#020617] text-slate-900 dark:text-slate-100 transition-colors duration-200 font-sans overflow-hidden">
            {/* Sidebar */}
            <aside className="w-60 flex-shrink-0 border-r border-slate-200/50 dark:border-slate-800/50 bg-white dark:bg-[#0B1120] hidden lg:flex flex-col h-full z-40 relative">
                <div className="p-3 flex items-center gap-2">
                    <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white">
                        <span className="material-icons-round text-lg">language</span>
                    </div>
                    <span className="font-bold text-lg tracking-tight">TravelOfGlobe</span>
                </div>
                <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-xs ${location.pathname === '/dashboard' ? 'bg-blue-50 dark:bg-blue-900/30 text-primary font-medium' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                    >
                        <span className="material-icons-round text-[20px]">grid_view</span>
                        Dashboard
                    </button>
                    <button
                        onClick={() => navigate('/my-office')}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-xs ${location.pathname === '/my-office' ? 'bg-blue-50 dark:bg-blue-900/30 text-primary font-medium' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                    >
                        <span className="material-icons-round text-[20px]">corporate_fare</span>
                        My Office
                    </button>
                    <button
                        onClick={() => navigate('/bookings')}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-xs ${location.pathname.startsWith('/bookings') ? 'bg-blue-50 dark:bg-blue-900/30 text-primary font-medium' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                    >
                        <span className="material-icons-round text-[20px]">book_online</span>
                        My Bookings
                    </button>
                    
                    <div className="pt-2 mt-2 border-t border-slate-100 dark:border-slate-800"></div>

                    <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800">
                        <span className="material-icons-round text-[20px]">account_balance_wallet</span>
                        Finance
                    </button>
                    <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800">
                        <span className="material-icons-round text-[20px]">analytics</span>
                        Accounting
                    </button>
                    <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800">
                        <span className="material-icons-round text-[20px]">settings</span>
                        Operations
                    </button>
                    <div className="pt-2 mt-2 border-t border-slate-100 dark:border-slate-800">
                        <button className="w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800">
                            <div className="flex items-center gap-3">
                                <span className="material-icons-round text-[20px]">admin_panel_settings</span>
                                GSA Management
                            </div>
                            <span className="material-icons-round text-sm">chevron_right</span>
                        </button>
                    </div>
                </nav>
            </aside>
            <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
                <Outlet />
            </div>
        </div>
    );
};

export default PortalLayout;
