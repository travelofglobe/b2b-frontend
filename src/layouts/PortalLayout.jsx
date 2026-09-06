import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import HeaderActions from '../components/HeaderActions';
import LanguageModal from '../components/LanguageModal';
import { SUPPORTED_LANGUAGES } from '../i18n';

const PortalLayout = () => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();
    
    // Layout State
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const [isLanguageModalOpen, setIsLanguageModalOpen] = useState(false);

    const currentLanguage = SUPPORTED_LANGUAGES.find(l => l.code === i18n.language) || SUPPORTED_LANGUAGES[1];

    // Menu States
    const [isMyOfficeOpen, setIsMyOfficeOpen] = useState(location.pathname.startsWith('/my-office'));
    const [isDefinitionsOpen, setIsDefinitionsOpen] = useState(location.pathname.startsWith('/definitions'));
    const [isGSAManagementOpen, setIsGSAManagementOpen] = useState(location.pathname.startsWith('/gsa'));

    const handleMenuToggle = (setter, currentState) => {
        setter(!currentState);
    };

    const handleScroll = (e) => {
        if (e.target.scrollTop > 10) {
            setIsScrolled(true);
        } else {
            setIsScrolled(false);
        }
    };

    return (
        <div className="flex flex-col h-screen bg-white dark:bg-[#202124] text-slate-900 dark:text-slate-100 font-sans overflow-hidden transition-colors duration-200">
            {/* Header (Google Flights style) */}
            <header className={`flex items-center justify-between px-4 h-16 shrink-0 bg-white dark:bg-[#202124] z-[1000] border-b border-slate-200 dark:border-slate-800 transition-all duration-200 ${isScrolled ? 'shadow-md' : ''}`}>
                {/* Left: Hamburger & Logo */}
                <div className="flex items-center gap-4">
                    <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors focus:outline-none" aria-label="Menü">
                        <span className="material-symbols-outlined text-xl">menu</span>
                    </button>
                    <div className="flex flex-col cursor-pointer select-none" onClick={() => navigate('/travel/hotels')}>
                        <span className="text-[14px] font-black text-[#0f172a] dark:text-white tracking-tight leading-none flex items-center">
                            TRAVEL <span className="text-blue-500 mx-1">OF</span> GLOBE
                        </span>
                        <div className="flex items-center gap-1 mt-1">
                            <div className="h-[1.5px] w-3 bg-blue-300 dark:bg-blue-500/50 rounded-full"></div>
                            <span className="text-[7px] font-bold tracking-[0.12em] text-slate-400 dark:text-slate-500 leading-none mt-[1px]">
                                GLOBAL B2B SOLUTIONS
                            </span>
                        </div>
                    </div>
                </div>

                {/* Center: Tabs */}
                <div className="hidden lg:flex items-center gap-2 font-roboto">
                    {[
                        { path: '/travel/explore', icon: 'travel_explore', label: t('nav.explore'), isCurrent: location.pathname === '/travel/explore' || location.pathname === '/explore' },
                        { path: '/travel/hotels', icon: 'bed', label: t('nav.hotels'), isCurrent: location.pathname.startsWith('/travel/hotels') || location.pathname.startsWith('/hotel') || location.pathname.startsWith('/map') || location.pathname === '/travel/search' || location.pathname === '/dashboard' },
                        { path: '/travel/flights', icon: 'flight', label: t('nav.flights'), isCurrent: location.pathname.startsWith('/travel/flights') || location.pathname.startsWith('/flights') },
                        { path: '/travel/vacation-rentals', icon: 'home_work', label: t('nav.vacationRentals'), isCurrent: location.pathname === '/travel/vacation-rentals' || location.pathname === '/vacation-rentals' },
                    ].map(({ path, icon, label, isCurrent }) => (
                        <button
                            key={path}
                            onClick={() => navigate(path)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors cursor-pointer select-none ${
                                isCurrent
                                    ? 'bg-[#e8f0fe] text-[#1a73e8] border border-transparent dark:bg-[#4285f4]/20 dark:text-[#8ab4f8]'
                                    : 'text-[#3c4043] bg-white border border-[#dadce0] hover:bg-[#f8f9fa] dark:text-slate-300 dark:bg-[#303134] dark:border-[#5f6368] dark:hover:bg-slate-800'
                            }`}
                        >
                            <span className={`material-symbols-outlined text-[18px] ${isCurrent ? 'text-[#1a73e8] dark:text-[#8ab4f8]' : 'text-[#70757a] dark:text-slate-400'}`}>
                                {icon}
                            </span>
                            {label}
                        </button>
                    ))}
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2">
                    <button className="p-2 hidden sm:flex rounded-full hover:bg-[#f1f3f4] dark:hover:bg-slate-800 text-[#70757a] dark:text-slate-300 transition-colors focus:outline-none cursor-pointer">
                        <span className="material-symbols-outlined text-xl">apps</span>
                    </button>
                    <HeaderActions />
                </div>
            </header>

            {/* Sidebar Overlay (Opens under the header, dims the content below) */}
            {isSidebarOpen && (
                <div 
                    className="fixed inset-0 top-16 bg-black/40 z-[900] transition-opacity duration-300 animate-in fade-in" 
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}
            
            {/* Sidebar Drawer (Slides in underneath header like Google Flights - no duplicate header/logo) */}
            <aside className={`${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} w-[280px] fixed top-16 bottom-0 left-0 flex-shrink-0 bg-white dark:bg-[#202124] z-[950] flex flex-col border-r border-[#dadce0] dark:border-slate-800 transition-transform duration-300 ease-in-out shadow-2xl overflow-hidden font-roboto`}>
                <nav className="flex-1 px-2 py-3 overflow-y-auto scrollbar-hide flex flex-col">

                    {/* --- Navigation Tabs (same as header) --- */}
                    <div className="space-y-0.5 mb-1">
                            {[
                                { path: '/travel/explore', icon: 'travel_explore', label: t('nav.explore') },
                                { path: '/travel/flights', icon: 'flight', label: t('nav.flights') },
                                { path: '/travel/hotels', icon: 'bed', label: t('nav.hotels') },
                                { path: '/travel/vacation-rentals', icon: 'home_work', label: t('nav.vacationRentals') },
                            ].map(({ path, icon, label }) => {
                                const isActive = path === '/travel/hotels'
                                    ? (location.pathname.startsWith('/travel/hotels') || location.pathname.startsWith('/hotel') || location.pathname.startsWith('/map') || location.pathname === '/travel/search' || location.pathname === '/dashboard')
                                    : (location.pathname === path || (path === '/travel/explore' && location.pathname === '/explore') || (path === '/travel/flights' && (location.pathname.startsWith('/travel/flights') || location.pathname.startsWith('/flights'))) || (path === '/travel/vacation-rentals' && location.pathname === '/vacation-rentals'));
                                return (
                                    <button key={path} onClick={() => { setIsSidebarOpen(false); navigate(path); }}
                                        className={`w-full flex items-center gap-4 -ml-2 pl-6 pr-4 py-2.5 rounded-r-full transition-colors group cursor-pointer ${isActive
                                            ? 'bg-[#e8f0fe] dark:bg-blue-900/30 text-[#1a73e8] dark:text-blue-300'
                                            : 'text-[#3c4043] dark:text-slate-300 hover:bg-[#f1f3f4] dark:hover:bg-slate-800'}`}
                                    >
                                        <span className={`material-symbols-outlined text-[20px] flex-shrink-0 ${isActive ? 'text-[#1a73e8]' : 'text-[#70757a] dark:text-slate-400 group-hover:text-[#3c4043] dark:group-hover:text-white'}`}>{icon}</span>
                                        <span className="text-sm font-medium text-left leading-snug">{label}</span>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Divider */}
                        <div className="my-2 border-t border-[#e8eaed] dark:border-slate-800"></div>

                        {/* --- Section 1 --- */}
                        <div className="space-y-0.5 mb-1">
                            {/* Nav item helper - active style */}
                            <button
                                onClick={() => { setIsSidebarOpen(false); navigate('/bookings'); }}
                                className={`w-full flex items-center gap-4 -ml-2 pl-6 pr-4 py-2.5 rounded-r-full transition-colors group cursor-pointer ${location.pathname.startsWith('/bookings')
                                    ? 'bg-[#e8f0fe] dark:bg-blue-900/30 text-[#1a73e8] dark:text-blue-300'
                                    : 'text-[#3c4043] dark:text-slate-300 hover:bg-[#f1f3f4] dark:hover:bg-slate-800'}`}
                            >
                                <span className={`material-symbols-outlined text-[20px] flex-shrink-0 ${location.pathname.startsWith('/bookings') ? 'text-[#1a73e8]' : 'text-[#70757a] dark:text-slate-400 group-hover:text-[#3c4043] dark:group-hover:text-white'}`}>book_online</span>
                                <span className="text-sm font-medium text-left leading-snug">{t('sidebar.myBookings')}</span>
                            </button>
                        </div>

                        {/* Divider */}
                        <div className="my-2 border-t border-[#e8eaed] dark:border-slate-800"></div>

                        {/* --- Section 2: My Office --- */}
                        <div className="space-y-0.5 mb-1">
                            <button
                                onClick={() => handleMenuToggle(setIsMyOfficeOpen, isMyOfficeOpen)}
                                className={`w-full flex items-center gap-4 -ml-2 pl-6 pr-4 py-2.5 rounded-r-full transition-colors group focus:outline-none cursor-pointer ${location.pathname.startsWith('/my-office')
                                    ? 'bg-[#e8f0fe] dark:bg-blue-900/30 text-[#1a73e8] dark:text-blue-300'
                                    : 'text-[#3c4043] dark:text-slate-300 hover:bg-[#f1f3f4] dark:hover:bg-slate-800'}`}
                            >
                                <span className={`material-symbols-outlined text-[20px] flex-shrink-0 ${location.pathname.startsWith('/my-office') ? 'text-[#1a73e8]' : 'text-[#70757a] dark:text-slate-400 group-hover:text-[#3c4043] dark:group-hover:text-white'}`}>corporate_fare</span>
                                <span className="text-sm font-medium text-left leading-snug flex-1">{t('sidebar.myOffice')}</span>
                                <span className={`material-symbols-outlined text-[20px] transition-transform duration-200 ${isMyOfficeOpen ? 'rotate-90' : ''} ${location.pathname.startsWith('/my-office') ? 'text-[#1a73e8]' : 'text-[#70757a]'}`}>chevron_right</span>
                            </button>

                            {isMyOfficeOpen && (
                                <div className="space-y-0.5 animate-in slide-in-from-top-1 duration-200">
                                    {[
                                        { tab: 'general', icon: 'info', label: t('sidebar.generalInfo') || 'Genel Bilgiler' },
                                        { tab: 'users', icon: 'groups', label: t('sidebar.users') || 'Kullanıcılar' },
                                        { tab: 'guests', icon: 'recent_actors', label: t('sidebar.guests') || 'Misafirler' },
                                        { tab: 'favorites', icon: 'bookmark', label: t('sidebar.favoriteHotels') || 'Favori Oteller' },
                                    ].map(({ tab, icon, label }) => {
                                        const isActive = location.pathname === '/my-office' && (tab === 'general' ? (!location.search || location.search.includes('tab=general')) : location.search.includes(`tab=${tab}`));
                                        return (
                                            <button key={tab} onClick={() => { setIsSidebarOpen(false); navigate(`/my-office?tab=${tab}`); }}
                                                className={`w-full flex items-center gap-4 -ml-2 pl-14 pr-4 py-2 rounded-r-full transition-colors group cursor-pointer ${isActive
                                                    ? 'bg-[#e8f0fe] dark:bg-blue-900/30 text-[#1a73e8] dark:text-blue-300'
                                                    : 'text-[#3c4043] dark:text-slate-300 hover:bg-[#f1f3f4] dark:hover:bg-slate-800'}`}
                                            >
                                                <span className={`material-symbols-outlined text-[20px] flex-shrink-0 ${isActive ? 'text-[#1a73e8]' : 'text-[#70757a] dark:text-slate-400 group-hover:text-[#3c4043] dark:group-hover:text-white'}`}>{icon}</span>
                                                <span className="text-sm font-medium text-left leading-snug">{label}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}

                            <button
                                onClick={() => handleMenuToggle(setIsDefinitionsOpen, isDefinitionsOpen)}
                                className={`w-full flex items-center gap-4 -ml-2 pl-6 pr-4 py-2.5 rounded-r-full transition-colors group focus:outline-none cursor-pointer ${location.pathname.startsWith('/definitions')
                                    ? 'bg-[#e8f0fe] dark:bg-blue-900/30 text-[#1a73e8] dark:text-blue-300'
                                    : 'text-[#3c4043] dark:text-slate-300 hover:bg-[#f1f3f4] dark:hover:bg-slate-800'}`}
                            >
                                <span className={`material-symbols-outlined text-[20px] flex-shrink-0 ${location.pathname.startsWith('/definitions') ? 'text-[#1a73e8]' : 'text-[#70757a] dark:text-slate-400 group-hover:text-[#3c4043] dark:group-hover:text-white'}`}>tune</span>
                                <span className="text-sm font-medium text-left leading-snug flex-1">{t('sidebar.definitions')}</span>
                                <span className={`material-symbols-outlined text-[20px] transition-transform duration-200 ${isDefinitionsOpen ? 'rotate-90' : ''} ${location.pathname.startsWith('/definitions') ? 'text-[#1a73e8]' : 'text-[#70757a]'}`}>chevron_right</span>
                            </button>

                            {isDefinitionsOpen && (
                                <div className="space-y-0.5 animate-in slide-in-from-top-1 duration-200">
                                    <button onClick={() => { setIsSidebarOpen(false); navigate('/definitions/markup'); }}
                                        className={`w-full flex items-center gap-4 -ml-2 pl-14 pr-4 py-2 rounded-r-full transition-colors group cursor-pointer ${location.pathname === '/definitions/markup'
                                            ? 'bg-[#e8f0fe] dark:bg-blue-900/30 text-[#1a73e8] dark:text-blue-300'
                                            : 'text-[#3c4043] dark:text-slate-300 hover:bg-[#f1f3f4] dark:hover:bg-slate-800'}`}
                                    >
                                        <span className={`material-symbols-outlined text-[20px] flex-shrink-0 ${location.pathname === '/definitions/markup' ? 'text-[#1a73e8]' : 'text-[#70757a] dark:text-slate-400 group-hover:text-[#3c4043] dark:group-hover:text-white'}`}>percent</span>
                                        <span className="text-sm font-medium text-left leading-snug">{t('sidebar.markupManagement')}</span>
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Divider */}
                        <div className="my-2 border-t border-[#e8eaed] dark:border-slate-800"></div>

                        {/* --- Section 3: Finance --- */}
                        <div className="space-y-0.5 mb-1">
                            {[
                                { path: '/finance', icon: 'account_balance_wallet', label: t('sidebar.finance') },
                                { path: '/accounting', icon: 'analytics', label: t('sidebar.accounting') },
                                { path: '/operations', icon: 'settings', label: t('sidebar.operations') },
                            ].map(({ path, icon, label }) => {
                                const isActive = location.pathname === path;
                                return (
                                    <button key={path} onClick={() => { setIsSidebarOpen(false); navigate(path); }}
                                        className={`w-full flex items-center gap-4 -ml-2 pl-6 pr-4 py-2.5 rounded-r-full transition-colors group cursor-pointer ${isActive
                                            ? 'bg-[#e8f0fe] dark:bg-blue-900/30 text-[#1a73e8] dark:text-blue-300'
                                            : 'text-[#3c4043] dark:text-slate-300 hover:bg-[#f1f3f4] dark:hover:bg-slate-800'}`}
                                    >
                                        <span className={`material-symbols-outlined text-[20px] flex-shrink-0 ${isActive ? 'text-[#1a73e8]' : 'text-[#70757a] dark:text-slate-400 group-hover:text-[#3c4043] dark:group-hover:text-white'}`}>{icon}</span>
                                        <span className="text-sm font-medium text-left leading-snug">{label}</span>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Divider */}
                        <div className="my-2 border-t border-[#e8eaed] dark:border-slate-800"></div>

                        {/* --- Section 4: GSA Management --- */}
                        <div className="space-y-0.5">
                            <button
                                onClick={() => handleMenuToggle(setIsGSAManagementOpen, isGSAManagementOpen)}
                                className={`w-full flex items-center gap-4 -ml-2 pl-6 pr-4 py-2.5 rounded-r-full transition-colors group focus:outline-none cursor-pointer ${location.pathname.startsWith('/gsa')
                                    ? 'bg-[#e8f0fe] dark:bg-blue-900/30 text-[#1a73e8] dark:text-blue-300'
                                    : 'text-[#3c4043] dark:text-slate-300 hover:bg-[#f1f3f4] dark:hover:bg-slate-800'}`}
                            >
                                <span className={`material-symbols-outlined text-[20px] flex-shrink-0 ${location.pathname.startsWith('/gsa') ? 'text-[#1a73e8]' : 'text-[#70757a] dark:text-slate-400 group-hover:text-[#3c4043] dark:group-hover:text-white'}`}>admin_panel_settings</span>
                                <span className="text-sm font-medium text-left leading-snug flex-1">{t('sidebar.gsaManagement')}</span>
                                <span className={`material-symbols-outlined text-[20px] transition-transform duration-200 ${isGSAManagementOpen ? 'rotate-180' : ''} ${location.pathname.startsWith('/gsa') ? 'text-[#1a73e8]' : 'text-[#70757a]'}`}>expand_more</span>
                            </button>

                            {isGSAManagementOpen && (
                                <div className="space-y-0.5 animate-in slide-in-from-top-1 duration-200">
                                    {[
                                        { path: '/gsa/agency', icon: 'business_center', label: t('sidebar.agencyManagement') },
                                        { path: '/gsa/markups', icon: 'payments', label: t('sidebar.subAgencyMarkups') },
                                        { path: '/gsa/finance', icon: 'attach_money', label: t('sidebar.finance') },
                                        { path: '/gsa/reports', icon: 'assessment', label: t('sidebar.reports') },
                                    ].map(({ path, icon, label }) => {
                                        const isActive = location.pathname === path;
                                        return (
                                            <button key={path} onClick={() => { setIsSidebarOpen(false); navigate(path); }}
                                                className={`w-full flex items-center gap-4 -ml-2 pl-14 pr-4 py-2 rounded-r-full transition-colors group cursor-pointer ${isActive
                                                    ? 'bg-[#e8f0fe] dark:bg-blue-900/30 text-[#1a73e8] dark:text-blue-300'
                                                    : 'text-[#3c4043] dark:text-slate-300 hover:bg-[#f1f3f4] dark:hover:bg-slate-800'}`}
                                            >
                                                <span className={`material-symbols-outlined text-[20px] flex-shrink-0 ${isActive ? 'text-[#1a73e8]' : 'text-[#70757a] dark:text-slate-400 group-hover:text-[#3c4043] dark:group-hover:text-white'}`}>{icon}</span>
                                                <span className="text-sm font-medium text-left leading-snug">{label}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Divider */}
                        <div className="my-2 border-t border-[#e8eaed] dark:border-slate-800"></div>

                        {/* --- Language (Bottom Item) --- */}
                        <div className="space-y-0.5 mt-auto pt-2">
                            <button
                                type="button"
                                onClick={() => { setIsSidebarOpen(false); setIsLanguageModalOpen(true); }}
                                className="w-full flex items-center justify-between -ml-2 pl-6 pr-4 py-2.5 rounded-r-full transition-colors group text-[#3c4043] dark:text-slate-300 hover:bg-[#f1f3f4] dark:hover:bg-slate-800"
                            >
                                <div className="flex items-center gap-4 min-w-0">
                                    <span className="material-symbols-outlined text-[20px] flex-shrink-0 text-[#70757a] dark:text-slate-400 group-hover:text-[#3c4043] dark:group-hover:text-white">language</span>
                                    <span className="text-sm font-medium text-left leading-snug">{t('nav.changeLanguage')}</span>
                                </div>
                                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[12px] font-medium text-slate-600 dark:text-slate-300">
                                    <span>{currentLanguage?.flag}</span>
                                    <span className="truncate max-w-[70px]">{currentLanguage?.name}</span>
                                </div>
                            </button>
                        </div>

                    </nav>
                </aside>

                <div className="flex flex-1 overflow-hidden relative z-0">
                    <main className="flex-1 flex flex-col h-full overflow-y-auto relative" onScroll={handleScroll}>
                        <Outlet />
                    </main>
                </div>

            {/* Google Flights Style Language Modal */}
            <LanguageModal
                isOpen={isLanguageModalOpen}
                onClose={() => setIsLanguageModalOpen(false)}
            />
        </div>
    );
};

export default PortalLayout;

