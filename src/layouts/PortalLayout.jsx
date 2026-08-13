import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const PortalLayout = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();
    
    // Layout State
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    // Menu States
    const [isMyOfficeOpen, setIsMyOfficeOpen] = useState(location.pathname.startsWith('/my-office'));
    const [isDefinitionsOpen, setIsDefinitionsOpen] = useState(location.pathname.startsWith('/definitions'));
    const [isGSAManagementOpen, setIsGSAManagementOpen] = useState(location.pathname.startsWith('/gsa'));

    const isAnyMenuOpen = isMyOfficeOpen || isDefinitionsOpen || isGSAManagementOpen;

    const toggleAllMenus = () => {
        if (isAnyMenuOpen) {
            setIsMyOfficeOpen(false);
            setIsDefinitionsOpen(false);
            setIsGSAManagementOpen(false);
        } else {
            setIsMyOfficeOpen(true);
            setIsDefinitionsOpen(true);
            setIsGSAManagementOpen(true);
        }
    };

    const handleMenuToggle = (setter, currentState) => {
        if (!isSidebarOpen) {
            setIsSidebarOpen(true);
            setter(true);
        } else {
            setter(!currentState);
        }
    };

    return (
        <div className="flex h-screen bg-[#F8FAFC] dark:bg-[#020617] text-slate-900 dark:text-slate-100 transition-colors duration-200 font-sans overflow-hidden">
            {/* Sidebar */}
            <aside className={`${isSidebarOpen ? 'w-60' : 'w-[72px]'} flex-shrink-0 ltr:border-r rtl:border-l border-slate-200/50 dark:border-slate-800/50 bg-white dark:bg-[#0B1120] hidden lg:flex flex-col h-full z-40 relative transition-all duration-300 ease-in-out`}>
                <div className="p-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800/50 h-[64px] min-h-[64px] overflow-hidden">
                    <div className="flex items-center gap-3 cursor-pointer select-none group" onClick={() => setIsSidebarOpen(!isSidebarOpen)} title={isSidebarOpen ? "Sidebar'ı Kapat" : "Sidebar'ı Aç"}>
                        <div className="size-9 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/20 flex-shrink-0 transition-all duration-500 group-hover:rotate-[15deg] group-hover:scale-105">
                            <span className="material-symbols-outlined text-xl fill-1">travel</span>
                        </div>
                        {isSidebarOpen && (
                            <div className="flex flex-col select-none">
                                <h2 className="text-slate-900 dark:text-white text-[13px] font-bold leading-none tracking-tight uppercase whitespace-nowrap group-hover:text-primary transition-colors">
                                    Travel <span className="text-primary">of</span> Globe
                                </h2>
                                <div className="flex items-center gap-1.5 mt-1">
                                    <div className="h-[1px] w-2 bg-primary/40"></div>
                                    <p className="text-[8px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest whitespace-nowrap leading-none">Global B2B Solutions</p>
                                </div>
                            </div>
                        )}
                    </div>
                    {isSidebarOpen && (
                        <div className="flex items-center gap-0.5">
                            <button 
                                onClick={toggleAllMenus}
                                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors focus:outline-none" 
                                title={isAnyMenuOpen ? (t('sidebar.collapseAll') || "Menüleri Daralt") : (t('sidebar.expandAll') || "Menüleri Genişlet")}
                            >
                                <span className="material-symbols-outlined text-[20px]">
                                    {isAnyMenuOpen ? 'unfold_less' : 'unfold_more'}
                                </span>
                            </button>
                            <button onClick={() => setIsSidebarOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors focus:outline-none" title="Sidebar'ı Kapat">
                                <span className="material-symbols-outlined text-lg">chevron_left</span>
                            </button>
                        </div>
                    )}
                </div>

                {/* Collapsed Drawer Menu button */}
                {!isSidebarOpen && (
                    <div className="flex justify-center py-2.5 border-b border-solid border-slate-100 dark:border-slate-800/50">
                        <button onClick={() => setIsSidebarOpen(true)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors focus:outline-none">
                            <span className="material-symbols-outlined text-lg">menu</span>
                        </button>
                    </div>
                )}

                <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto scrollbar-hide">
                    <button
                        onClick={() => navigate('/dashboard')}
                        title={!isSidebarOpen ? t('sidebar.dashboard') : undefined}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-xs ${location.pathname === '/dashboard' ? 'bg-blue-50 dark:bg-blue-900/30 text-primary font-medium' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                    >
                        <span className="material-icons-round text-[20px] flex-shrink-0">grid_view</span>
                        {isSidebarOpen && <span className="text-left leading-snug">{t('sidebar.dashboard')}</span>}
                    </button>
                    
                    <div className="space-y-0.5">
                        <button
                            onClick={() => handleMenuToggle(setIsMyOfficeOpen, isMyOfficeOpen)}
                            title={!isSidebarOpen ? t('sidebar.myOffice') : undefined}
                            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors text-xs focus:outline-none ${location.pathname.startsWith('/my-office') ? 'bg-blue-50 dark:bg-blue-900/30 text-primary font-medium' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                        >
                            <div className="flex items-center gap-3 min-w-0">
                                <span className="material-icons-round text-[20px] flex-shrink-0">corporate_fare</span>
                                {isSidebarOpen && <span className="text-left leading-snug">{t('sidebar.myOffice')}</span>}
                            </div>
                            {isSidebarOpen && <span className={`material-icons-round text-sm transition-transform duration-200 ${isMyOfficeOpen ? 'rotate-90' : 'ltr:rotate-0 rtl:rotate-180'}`}>chevron_right</span>}
                        </button>
                        
                        {isSidebarOpen && isMyOfficeOpen && (
                            <div className="ltr:ml-4 ltr:pl-5 ltr:border-l rtl:mr-4 rtl:pr-5 rtl:border-r border-slate-100 dark:border-slate-800 space-y-0.5 animate-in slide-in-from-top-1 duration-200">
                                <button
                                    onClick={() => navigate('/my-office?tab=general')}
                                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors text-[11px] ${location.pathname === '/my-office' && (!location.search || location.search.includes('tab=general')) ? 'text-primary font-bold bg-blue-50/50 dark:bg-blue-900/20' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                                >
                                    <span className="material-icons-round text-[16px]">info</span>
                                    {t('sidebar.generalInfo') || 'General Information'}
                                </button>
                                <button
                                    onClick={() => navigate('/my-office?tab=users')}
                                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors text-[11px] ${location.pathname === '/my-office' && location.search.includes('tab=users') ? 'text-primary font-bold bg-blue-50/50 dark:bg-blue-900/20' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                                >
                                    <span className="material-icons-round text-[16px]">groups</span>
                                    {t('sidebar.users') || 'Users'}
                                </button>
                                <button
                                    onClick={() => navigate('/my-office?tab=guests')}
                                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors text-[11px] ${location.pathname === '/my-office' && location.search.includes('tab=guests') ? 'text-primary font-bold bg-blue-50/50 dark:bg-blue-900/20' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                                >
                                    <span className="material-icons-round text-[16px]">recent_actors</span>
                                    {t('sidebar.guests') || 'Guests'}
                                </button>
                                <button
                                    onClick={() => navigate('/my-office?tab=favorites')}
                                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors text-[11px] ${location.pathname === '/my-office' && location.search.includes('tab=favorites') ? 'text-primary font-bold bg-blue-50/50 dark:bg-blue-900/20' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                                >
                                    <span className="material-symbols-outlined text-[16px]">favorite</span>
                                    {t('sidebar.favoriteHotels') || 'Favorite Hotels'}
                                </button>
                            </div>
                        )}
                    </div>

                    <button
                        onClick={() => navigate('/bookings')}
                        title={!isSidebarOpen ? t('sidebar.myBookings') : undefined}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-xs ${location.pathname.startsWith('/bookings') ? 'bg-blue-50 dark:bg-blue-900/30 text-primary font-medium' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                    >
                        <span className="material-icons-round text-[20px] flex-shrink-0">book_online</span>
                        {isSidebarOpen && <span className="text-left leading-snug">{t('sidebar.myBookings')}</span>}
                    </button>

                    <div className="space-y-0.5">
                        <button
                            onClick={() => handleMenuToggle(setIsDefinitionsOpen, isDefinitionsOpen)}
                            title={!isSidebarOpen ? t('sidebar.definitions') : undefined}
                            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors text-xs focus:outline-none ${location.pathname.startsWith('/definitions') ? 'bg-blue-50 dark:bg-blue-900/30 text-primary font-medium' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                        >
                            <div className="flex items-center gap-3 min-w-0">
                                <span className="material-icons-round text-[20px] flex-shrink-0">tune</span>
                                {isSidebarOpen && <span className="text-left leading-snug">{t('sidebar.definitions')}</span>}
                            </div>
                            {isSidebarOpen && <span className={`material-icons-round text-sm transition-transform duration-200 ${isDefinitionsOpen ? 'rotate-90' : 'ltr:rotate-0 rtl:rotate-180'}`}>chevron_right</span>}
                        </button>
                        
                        {isSidebarOpen && isDefinitionsOpen && (
                            <div className="ltr:ml-4 ltr:pl-5 ltr:border-l rtl:mr-4 rtl:pr-5 rtl:border-r border-slate-100 dark:border-slate-800 space-y-0.5 animate-in slide-in-from-top-1 duration-200">
                                <button
                                    onClick={() => navigate('/definitions/markup')}
                                    className={`w-full text-left ltr:text-left rtl:text-right px-3 py-2 rounded-lg transition-colors text-[11px] ${location.pathname === '/definitions/markup' ? 'text-primary font-bold bg-blue-50/50 dark:bg-blue-900/20' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                                >
                                    {t('sidebar.markupManagement')}
                                </button>
                            </div>
                        )}
                    </div>
                    
                    <div className="pt-2 mt-2 border-t border-slate-100 dark:border-slate-800"></div>
 
                    <button 
                        onClick={() => navigate('/finance')}
                        title={!isSidebarOpen ? t('sidebar.finance') : undefined}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-xs ${location.pathname === '/finance' ? 'bg-blue-50 dark:bg-blue-900/30 text-primary font-medium' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                    >
                        <span className="material-icons-round text-[20px] flex-shrink-0">account_balance_wallet</span>
                        {isSidebarOpen && <span className="text-left leading-snug">{t('sidebar.finance')}</span>}
                    </button>
                    <button 
                        onClick={() => navigate('/accounting')}
                        title={!isSidebarOpen ? t('sidebar.accounting') : undefined}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-xs ${location.pathname === '/accounting' ? 'bg-blue-50 dark:bg-blue-900/30 text-primary font-medium' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                    >
                        <span className="material-icons-round text-[20px] flex-shrink-0">analytics</span>
                        {isSidebarOpen && <span className="text-left leading-snug">{t('sidebar.accounting')}</span>}
                    </button>
                    <button 
                        onClick={() => navigate('/operations')}
                        title={!isSidebarOpen ? t('sidebar.operations') : undefined}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-xs ${location.pathname === '/operations' ? 'bg-blue-50 dark:bg-blue-900/30 text-primary font-medium' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                    >
                        <span className="material-icons-round text-[20px] flex-shrink-0">settings</span>
                        {isSidebarOpen && <span className="text-left leading-snug">{t('sidebar.operations')}</span>}
                    </button>

                    <div className="pt-2 mt-2 border-t border-slate-100 dark:border-slate-800 space-y-0.5">
                        <button 
                            onClick={() => handleMenuToggle(setIsGSAManagementOpen, isGSAManagementOpen)}
                            title={!isSidebarOpen ? t('sidebar.gsaManagement') : undefined}
                            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors text-xs focus:outline-none ${location.pathname.startsWith('/gsa') ? 'bg-blue-50 dark:bg-blue-900/30 text-primary font-medium' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                        >
                            <div className="flex items-center gap-3 min-w-0">
                                <span className="material-icons-round text-[20px] flex-shrink-0">analytics</span>
                                {isSidebarOpen && <span className="text-left leading-snug">{t('sidebar.gsaManagement')}</span>}
                            </div>
                            {isSidebarOpen && <span className={`material-icons-round text-sm transition-transform duration-200 ${isGSAManagementOpen ? 'rotate-180' : ''}`}>expand_more</span>}
                        </button>
                        
                        {isSidebarOpen && isGSAManagementOpen && (
                            <div className="ltr:ml-4 ltr:pl-5 ltr:border-l rtl:mr-4 rtl:pr-5 rtl:border-r border-slate-100 dark:border-slate-800 space-y-0.5 animate-in slide-in-from-top-1 duration-200">
                                <button
                                    onClick={() => navigate('/gsa/agency')}
                                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-[11px] ${location.pathname === '/gsa/agency' ? 'text-primary font-bold bg-blue-50/50 dark:bg-blue-900/20' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                                >
                                    <span className="material-icons-round text-[18px]">business_center</span>
                                    {t('sidebar.agencyManagement')}
                                </button>
                                <button
                                    onClick={() => navigate('/gsa/markups')}
                                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-[11px] ${location.pathname === '/gsa/markups' ? 'text-primary font-bold bg-blue-50/50 dark:bg-blue-900/20' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                                >
                                    <span className="material-icons-round text-[18px]">payments</span>
                                    {t('sidebar.subAgencyMarkups')}
                                </button>
                                <button
                                    onClick={() => navigate('/gsa/finance')}
                                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-[11px] ${location.pathname === '/gsa/finance' ? 'text-primary font-bold bg-blue-50/50 dark:bg-blue-900/20' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                                >
                                    <span className="material-icons-round text-[18px]">attach_money</span>
                                    {t('sidebar.finance')}
                                </button>
                                <button
                                    onClick={() => navigate('/gsa/reports')}
                                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-[11px] ${location.pathname === '/gsa/reports' ? 'text-primary font-bold bg-blue-50/50 dark:bg-blue-900/20' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                                >
                                    <span className="material-icons-round text-[18px]">assessment</span>
                                    {t('sidebar.reports')}
                                </button>
                            </div>
                        )}
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

