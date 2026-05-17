import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../components/LanguageSwitcher';

const PortalLayout = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();
    const [isDefinitionsOpen, setIsDefinitionsOpen] = useState(location.pathname.startsWith('/definitions'));
    const [isGSAManagementOpen, setIsGSAManagementOpen] = useState(location.pathname.startsWith('/gsa'));

    return (
        <div className="flex h-screen bg-[#F8FAFC] dark:bg-[#020617] text-slate-900 dark:text-slate-100 transition-colors duration-200 font-sans overflow-hidden">
            {/* Sidebar */}
            <aside className="w-60 flex-shrink-0 ltr:border-r rtl:border-l border-slate-200/50 dark:border-slate-800/50 bg-white dark:bg-[#0B1120] hidden lg:flex flex-col h-full z-40 relative">
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
                            <p className="text-[7px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em] whitespace-nowrap leading-none">Global B2B Solutions</p>
                        </div>
                    </div>
                </div>
                <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-xs ${location.pathname === '/dashboard' ? 'bg-blue-50 dark:bg-blue-900/30 text-primary font-medium' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                    >
                        <span className="material-icons-round text-[20px]">grid_view</span>
                        {t('sidebar.dashboard')}
                    </button>
                    <button
                        onClick={() => navigate('/my-office')}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-xs ${location.pathname === '/my-office' ? 'bg-blue-50 dark:bg-blue-900/30 text-primary font-medium' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                    >
                        <span className="material-icons-round text-[20px]">corporate_fare</span>
                        {t('sidebar.myOffice')}
                    </button>
                    <button
                        onClick={() => navigate('/bookings')}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-xs ${location.pathname.startsWith('/bookings') ? 'bg-blue-50 dark:bg-blue-900/30 text-primary font-medium' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                    >
                        <span className="material-icons-round text-[20px]">book_online</span>
                        {t('sidebar.myBookings')}
                    </button>
                    <div className="space-y-0.5">
                        <button
                            onClick={() => setIsDefinitionsOpen(!isDefinitionsOpen)}
                            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors text-xs ${location.pathname.startsWith('/definitions') ? 'bg-blue-50 dark:bg-blue-900/30 text-primary font-medium' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                        >
                            <div className="flex items-center gap-3">
                                <span className="material-icons-round text-[20px]">tune</span>
                                {t('sidebar.definitions')}
                            </div>
                            <span className={`material-icons-round text-sm transition-transform duration-200 ${isDefinitionsOpen ? 'rotate-90' : 'ltr:rotate-0 rtl:rotate-180'}`}>chevron_right</span>
                        </button>
                        
                        {isDefinitionsOpen && (
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
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-xs ${location.pathname === '/finance' ? 'bg-blue-50 dark:bg-blue-900/30 text-primary font-medium' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                    >
                        <span className="material-icons-round text-[20px]">account_balance_wallet</span>
                        {t('sidebar.finance')}
                    </button>
                    <button 
                        onClick={() => navigate('/accounting')}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-xs ${location.pathname === '/accounting' ? 'bg-blue-50 dark:bg-blue-900/30 text-primary font-medium' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                    >
                        <span className="material-icons-round text-[20px]">analytics</span>
                        {t('sidebar.accounting')}
                    </button>
                    <button 
                        onClick={() => navigate('/operations')}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-xs ${location.pathname === '/operations' ? 'bg-blue-50 dark:bg-blue-900/30 text-primary font-medium' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                    >
                        <span className="material-icons-round text-[20px]">settings</span>
                        {t('sidebar.operations')}
                    </button>
                    <div className="pt-2 mt-2 border-t border-slate-100 dark:border-slate-800 space-y-0.5">
                        <button 
                            onClick={() => setIsGSAManagementOpen(!isGSAManagementOpen)}
                            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors text-xs ${location.pathname.startsWith('/gsa') ? 'bg-blue-50 dark:bg-blue-900/30 text-primary font-medium' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                        >
                            <div className="flex items-center gap-3">
                                <span className="material-icons-round text-[20px]">analytics</span>
                                {t('sidebar.gsaManagement')}
                            </div>
                            <span className={`material-icons-round text-sm transition-transform duration-200 ${isGSAManagementOpen ? 'rotate-180' : ''}`}>expand_more</span>
                        </button>
                        
                        {isGSAManagementOpen && (
                            <div className="ltr:ml-4 ltr:pl-5 ltr:border-l rtl:mr-4 rtl:pr-5 rtl:border-r border-slate-100 dark:border-slate-800 space-y-0.5 animate-in slide-in-from-top-1 duration-200">
                                <button
                                    onClick={() => navigate('/gsa/agency')}
                                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-[11px] ${location.pathname === '/gsa/agency' ? 'text-primary font-bold bg-blue-50/50 dark:bg-blue-900/20' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                                >
                                    <span className="material-icons-round text-[18px]">business_center</span>
                                    {t('sidebar.agencyManagement')}
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
                <div className="p-4 border-t border-slate-100 dark:border-slate-800/50 flex items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-950/20 shrink-0">
                    <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500">
                        <span className="material-symbols-outlined text-base">translate</span>
                        <span className="text-[10px] font-black uppercase tracking-wider">{t('common.language', 'Language')}</span>
                    </div>
                    <LanguageSwitcher />
                </div>
            </aside>
            <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
                <Outlet />
            </div>
        </div>
    );
};

export default PortalLayout;
