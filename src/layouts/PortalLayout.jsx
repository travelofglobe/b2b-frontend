import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';

const PortalLayout = () => {
    const navigate = useNavigate();
    const location = useLocation();

    return (
        <div className="flex h-screen bg-[#F8FAFC] dark:bg-[#020617] text-slate-900 dark:text-slate-100 transition-colors duration-200 font-sans overflow-hidden">
            {/* Sidebar */}
            <aside className="w-60 flex-shrink-0 border-r border-slate-200/50 dark:border-slate-800/50 bg-white dark:bg-[#0B1120] hidden lg:flex flex-col h-full z-40 relative">
                <div className="p-4 flex items-center gap-3 border-b border-slate-100 dark:border-slate-800/50 group cursor-pointer" onClick={() => navigate('/dashboard')}>
                    <div className="size-9 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/20 transition-all duration-500 group-hover:rotate-[15deg] group-hover:scale-105">
                        <span className="material-symbols-outlined text-xl fill-1">travel</span>
                    </div>
                    <div className="flex flex-col">
                        <h2 className="text-slate-900 dark:text-white text-[13px] font-black leading-none tracking-tighter uppercase whitespace-nowrap">
                            Travel <span className="text-primary">of</span> Globe
                        </h2>
                        <div className="flex items-center gap-1.5 mt-1">
                            <div className="h-[1px] w-2 bg-primary/40"></div>
                            <p className="text-[7px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em] whitespace-nowrap leading-none">B2B Portal</p>
                        </div>
                    </div>
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
