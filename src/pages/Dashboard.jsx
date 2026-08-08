import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { bookingService } from '../services/bookingService';
import HeaderActions from '../components/HeaderActions';
import { useAuth } from '../context/AuthContext';
import { userService } from '../services/userService';
import { agencyService } from '../services/agencyService';
import DashboardSearch from '../components/DashboardSearch';
import BookingStatusBadge from '../components/BookingStatusBadge';
import { useTranslation } from 'react-i18next';

const Dashboard = () => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const [bookings, setBookings] = useState([]);
    const [summary, setSummary] = useState({ totalUsers: 0, activeUsers: 0, totalGuests: 0, bookingsToday: 0 });
    const [loading, setLoading] = useState(true);
    const [statsLoading, setStatsLoading] = useState(true);
    const [error, setError] = useState(null);
    const hasFetchedRef = React.useRef(false);

    useEffect(() => {
        if (hasFetchedRef.current) return;
        hasFetchedRef.current = true;

        const fetchBookings = async () => {
            try {
                const data = await bookingService.findLastFive();
                // API returns { bookings: { content: [...] }, summaries: [] }
                const list = data?.bookings?.content ?? data?.content ?? data;
                setBookings(Array.isArray(list) ? list : []);
            } catch (err) {
                setError(err.message || 'Rezervasyonlar yüklenemedi.');
            } finally {
                setLoading(false);
            }
        };

        const fetchStats = async (refresh = false) => {
            try {
                const res = await agencyService.getDashboardSummary('TODAY', refresh);
                setSummary({
                    totalUsers: res?.totalUsers ?? 0,
                    activeUsers: res?.activeUsers ?? 0,
                    totalGuests: res?.totalGuests ?? 0,
                    bookingsToday: res?.bookingsToday ?? 0,
                    bookingsYesterday: res?.bookingsYesterday ?? 0,
                    bookingsTrend: res?.bookingsTrend ?? 0,
                    errorCount: res?.errorCount ?? 0,
                    errorRate: res?.errorRate ?? '0.00',
                    errorTrend: res?.errorTrend ?? '+0.0%',
                });
            } catch (err) {
                console.error('Failed to fetch dashboard stats:', err);
            } finally {
                setStatsLoading(false);
            }
        };

        fetchBookings();
        fetchStats();
    }, []);

    const userDisplayName = user?.name && user?.surname
        ? `${user.name} ${user.surname}`
        : user?.email || 'User';

    const getInitials = (name) => {
        if (!name) return 'A';
        return name
            .split(' ')
            .map(n => n[0])
            .slice(0, 2)
            .join('')
            .toUpperCase();
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString(i18n.language || 'tr', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    const handleBookingsTodayClick = () => {
        const d = new Date();
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const todayStr = `${year}-${month}-${day}`;
        navigate(`/bookings?createDateStart=${todayStr}&createDateEnd=${todayStr}&bookingStatuses=CONFIRMED`);
    };

    const handleErrorRateClick = () => {
        const d = new Date();
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const todayStr = `${year}-${month}-${day}`;
        navigate(`/bookings?createDateStart=${todayStr}&createDateEnd=${todayStr}&bookingStatuses=ERROR`);
    };

    return (
        <>
            {/* Background Decorative Glows */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full pointer-events-none"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-400/10 blur-[120px] rounded-full pointer-events-none"></div>

            {/* Main Content */}
            <main className="flex-1 p-3 md:p-5 overflow-y-auto h-full">
                <div className="max-w-6xl mx-auto">
                    <header className="flex flex-wrap items-center justify-between mb-6 gap-4">
                        <div className="flex items-center gap-2">
                            <span className="material-icons-round text-primary text-xl">auto_awesome</span>
                            <h1 className="text-lg font-medium">Welcome, <span className="font-semibold">{userDisplayName}</span></h1>
                        </div>
                        <div className="flex items-center gap-4">
                            <HeaderActions />
                        </div>
                    </header>

                    <div className="mb-12 relative z-20">
                        <DashboardSearch />
                    </div>
                    {/* Compact 5-Card Single Row Summary Stats Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-10">
                        {/* Bookings Today Card (Clickable) */}
                        <div
                            onClick={handleBookingsTodayClick}
                            className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-3 px-3.5 rounded-xl border border-slate-200/70 dark:border-slate-800 shadow-xs flex flex-col justify-between group hover:border-emerald-500/50 hover:bg-emerald-500/[0.03] dark:hover:bg-emerald-500/[0.05] hover:shadow-sm hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
                            title="Bugünkü onaylanan rezervasyonları görüntüle"
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="flex items-center gap-1 mb-0.5">
                                        <p className="text-[9.5px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider leading-none">
                                            BOOKINGS TODAY
                                        </p>
                                    </div>
                                    <p className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-0.5">
                                        {statsLoading ? '...' : summary.bookingsToday}
                                    </p>
                                </div>
                                <div className="size-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-105 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                                    <span className="material-icons-round text-base">confirmation_number</span>
                                </div>
                            </div>
                            
                            {/* Progress bar line */}
                            <div className="w-full bg-slate-100 dark:bg-slate-800 h-1 rounded-full overflow-hidden my-2">
                                <div
                                    className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                                    style={{ width: `${Math.min(100, Math.max(10, summary.bookingsToday * 20))}%` }}
                                ></div>
                            </div>

                            {/* Bottom trend & ratio label */}
                            <div className="flex items-center justify-between">
                                <span className={`flex items-center gap-0.5 text-[10px] font-bold ${summary.bookingsTrend >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}`}>
                                    <span className="material-icons-round text-xs">{summary.bookingsTrend >= 0 ? 'trending_up' : 'trending_down'}</span>
                                    {summary.bookingsTrend >= 0 ? `+${summary.bookingsTrend}%` : `${summary.bookingsTrend}%`}
                                </span>
                                <span className="text-[8.5px] font-bold text-slate-400 uppercase tracking-wider">VS YESTERDAY</span>
                            </div>
                        </div>

                        {/* Error Rate Card (Clickable) */}
                        <div
                            onClick={handleErrorRateClick}
                            className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-3 px-3.5 rounded-xl border border-slate-200/70 dark:border-slate-800 shadow-xs flex flex-col justify-between group hover:border-amber-500/50 hover:bg-amber-500/[0.03] dark:hover:bg-amber-500/[0.05] hover:shadow-sm hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
                            title="Bugünkü hatalı rezervasyonları görüntüle"
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="flex items-center gap-1 mb-0.5">
                                        <p className="text-[9.5px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider leading-none">
                                            ERROR RATE
                                        </p>
                                    </div>
                                    <p className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-0.5">
                                        {statsLoading ? '...' : summary.errorCount}
                                    </p>
                                </div>
                                <div className="size-8 rounded-lg bg-amber-100/80 dark:bg-amber-900/30 text-amber-500 dark:text-amber-400 flex items-center justify-center shrink-0 group-hover:scale-105 group-hover:bg-amber-500 group-hover:text-white transition-all">
                                    <span className="material-icons-round text-base">bolt</span>
                                </div>
                            </div>

                            {/* Progress bar line */}
                            <div className="w-full bg-slate-100 dark:bg-slate-800 h-1 rounded-full overflow-hidden my-2">
                                <div
                                    className="bg-primary h-full rounded-full transition-all duration-500"
                                    style={{ width: `${Math.min(100, Math.max(8, Number(summary.errorRate || 0)))}%` }}
                                ></div>
                            </div>

                            {/* Bottom trend & ratio label */}
                            <div className="flex items-center justify-between">
                                <span className="flex items-center gap-0.5 text-[10px] font-bold text-rose-500">
                                    <span className="material-icons-round text-xs">trending_up</span>
                                    %{summary.errorRate || '0.00'}
                                </span>
                                <span className="text-[8.5px] font-bold text-slate-400 uppercase tracking-wider">ERROR RATE</span>
                            </div>
                        </div>

                        {/* Total Users Card */}
                        <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-3 px-3.5 rounded-xl border border-slate-200/60 dark:border-slate-800 shadow-xs flex flex-col justify-between group hover:border-primary/40 transition-all duration-200">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-[9.5px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider leading-none mb-0.5">{t('dashboard.totalUsers')}</p>
                                    <p className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-0.5">{statsLoading ? '...' : summary.totalUsers}</p>
                                </div>
                                <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                                    <span className="material-icons-round text-base">supervised_user_circle</span>
                                </div>
                            </div>
                            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/60">
                                <span className="text-[8.5px] font-bold text-slate-400 uppercase tracking-wider">STATUS</span>
                                <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[8.5px] font-semibold uppercase tracking-wider border border-emerald-500/20 flex items-center gap-1">
                                    <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse"></span> Live
                                </span>
                            </div>
                        </div>

                        {/* Active Users Card */}
                        <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-3 px-3.5 rounded-xl border border-slate-200/60 dark:border-slate-800 shadow-xs flex flex-col justify-between group hover:border-amber-500/40 transition-all duration-200">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-[9.5px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider leading-none mb-0.5">{t('dashboard.activeUsers')}</p>
                                    <p className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-0.5">{statsLoading ? '...' : summary.activeUsers}</p>
                                </div>
                                <div className="size-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                                    <span className="material-icons-round text-base">bolt</span>
                                </div>
                            </div>
                            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/60">
                                <span className="text-[8.5px] font-bold text-slate-400 uppercase tracking-wider">STATE</span>
                                <span className="px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[8.5px] font-semibold uppercase tracking-wider border border-amber-500/20 flex items-center gap-1">
                                    <span className="w-1 h-1 rounded-full bg-amber-500 animate-pulse"></span> Online
                                </span>
                            </div>
                        </div>

                        {/* Total Guests Card */}
                        <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-3 px-3.5 rounded-xl border border-slate-200/60 dark:border-slate-800 shadow-xs flex flex-col justify-between group hover:border-purple-500/40 transition-all duration-200">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-[9.5px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider leading-none mb-0.5">{t('dashboard.totalGuests')}</p>
                                    <p className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-0.5">{statsLoading ? '...' : summary.totalGuests}</p>
                                </div>
                                <div className="size-8 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center shrink-0">
                                    <span className="material-icons-round text-base">group</span>
                                </div>
                            </div>
                            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/60">
                                <span className="text-[8.5px] font-bold text-slate-400 uppercase tracking-wider">SYSTEM</span>
                                <span className="px-1.5 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 text-[8.5px] font-semibold uppercase tracking-wider border border-purple-500/20 flex items-center gap-1">
                                    <span className="material-icons-round text-[9px]">people</span> CRM
                                </span>
                            </div>
                        </div>
                    </div>

                    <section className="mb-10">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                                    <span className="material-icons-round text-primary text-base">public</span>
                                </div>
                                <div>
                                    <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">{t('dashboard.popularDestinations')}</h2>
                                    <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500 mt-0.5">{t('dashboard.exploreDestinations')}</p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button className="size-9 rounded-xl bg-white/40 dark:bg-slate-800/40 border border-white/60 dark:border-white/10 hover:bg-white/60 dark:hover:bg-slate-800/60 transition-all flex items-center justify-center text-slate-400 hover:text-primary">
                                    <span className="material-icons-round text-lg">chevron_left</span>
                                </button>
                                <button className="size-9 rounded-xl bg-white/40 dark:bg-slate-800/40 border border-white/60 dark:border-white/10 hover:bg-white/60 dark:hover:bg-slate-800/60 transition-all flex items-center justify-center text-primary">
                                    <span className="material-icons-round text-lg">chevron_right</span>
                                </button>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div onClick={() => navigate('/hotels/dubai')} className="group bg-white/40 dark:bg-slate-900/40 backdrop-blur-3xl rounded-2xl overflow-hidden border border-white/60 dark:border-white/10 cursor-pointer shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                                <div className="relative h-40 overflow-hidden">
                                    <img alt="Dubai skyline" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src="https://lh3.googleusercontent.com/aida-public/AB6AXuA44V5Rw3n0d1IRUftf6z8_vB3HBwcJuZJYvR8YmMatQ44JJKuoVOOMZcc324K7w5t1CEj7rrbmQfvu5_L2C40dYKtEcaBr5ly0T2kK_jkA4AEB8UFmJdh9tBTYpY2-EwDPlKBK-hSxTlvOGKO0anJ6RtGIuOBD2wgcngOYuLJCxcsptvI1yl_q818XSF4LsNWF3KF9TlwuW10-EZRTff2f_RLRbTnjZryGus-MPJEtchv29FeLBwrrvu5twYK6Gksekuw7rc8BfLAE" />
                                    <div className="absolute top-3 right-3 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl px-2.5 py-1 rounded-xl border border-white/60 dark:border-white/20 flex items-center gap-1.5 shadow-sm">
                                        <span className="material-icons-round text-primary text-xs">trending_up</span>
                                        <span className="text-[9.5px] font-medium uppercase tracking-wider text-slate-900 dark:text-white">{t('dashboard.destinations.trending')}</span>
                                    </div>
                                </div>
                                <div className="p-4">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <h4 className="font-semibold text-sm text-slate-900 dark:text-white tracking-tight">{t('dashboard.destinations.dubai')}</h4>
                                            <p className="text-[11px] font-medium text-slate-400 mt-0.5">{t('dashboard.destinations.uae')}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[9px] font-medium text-slate-400 uppercase tracking-wider leading-none">{t('dashboard.destinations.from')}</p>
                                            <p className="text-primary font-semibold text-sm mt-0.5">$89</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="bg-primary/10 text-primary text-[9.5px] font-medium px-2 py-0.5 rounded-md">{t('dashboard.destinations.hotels', { count: 1240 })}</span>
                                        <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[9.5px] font-medium px-2 py-0.5 rounded-md">{t('dashboard.destinations.luxury')}</span>
                                    </div>
                                </div>
                            </div>
                            <div onClick={() => navigate('/hotels/paris')} className="group bg-white/40 dark:bg-slate-900/40 backdrop-blur-3xl rounded-2xl overflow-hidden border border-white/60 dark:border-white/10 cursor-pointer shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                                <div className="relative h-40 overflow-hidden">
                                    <img alt="Eiffel Tower Paris" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAAKaysBHtmgeqbCgI0hzy0BjMTk-ihUbfPvkwXOo8168DpEmYK3ZwUxnws0XTpi6CmcD9AxZbd3_eEML6dtpH1U4UclGEab2N3lvPHR2NF83mJEoRDl4abqV9dzSRQSgW_hG8DnDAIF2poS3q0EGj7EQwR269k2fBX9DwMIy5gLNy3CNjSgGuy6g3et73S__a185-hjz_rlYOqQXd3J9xxPDU6VuTKmnr7sPPCcfG7YmvzEi-Tg2SmIcvAqYG0Sbd2-iebgBNPsKU_" />
                                    <div className="absolute top-3 right-3 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl px-2.5 py-1 rounded-xl border border-white/60 dark:border-white/20 flex items-center gap-1.5 shadow-sm">
                                        <span className="material-icons-round text-primary text-xs">trending_up</span>
                                        <span className="text-[9.5px] font-medium uppercase tracking-wider text-slate-900 dark:text-white">{t('dashboard.destinations.trending')}</span>
                                    </div>
                                </div>
                                <div className="p-4">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <h4 className="font-semibold text-sm text-slate-900 dark:text-white tracking-tight">{t('dashboard.destinations.paris')}</h4>
                                            <p className="text-[11px] font-medium text-slate-400 mt-0.5">{t('dashboard.destinations.france')}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[9px] font-medium text-slate-400 uppercase tracking-wider leading-none">{t('dashboard.destinations.from')}</p>
                                            <p className="text-primary font-semibold text-sm mt-0.5">$120</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="bg-primary/10 text-primary text-[9.5px] font-medium px-2 py-0.5 rounded-md">{t('dashboard.destinations.hotels', { count: 2100 })}</span>
                                        <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[9.5px] font-medium px-2 py-0.5 rounded-md">{t('dashboard.destinations.romance')}</span>
                                    </div>
                                </div>
                            </div>
                            <div onClick={() => navigate('/hotels/tokyo')} className="group bg-white/40 dark:bg-slate-900/40 backdrop-blur-3xl rounded-2xl overflow-hidden border border-white/60 dark:border-white/10 cursor-pointer shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                                <div className="relative h-40 overflow-hidden">
                                    <img alt="Tokyo tower" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src="https://lh3.googleusercontent.com/aida-public/AB6AXuC0NEc0GKKnW3d7mB9bVdbYwFNBEpY_nhmkIekHSBPSWraDNin1ulHT4_q9cfhMIcqrg51KW03dH7sambalU3BYZ7y1HYErTyF-Wv08E5_ZTcGFZrbVQoaAWGSJJ-DT_LoEtPdZ6dZ8UDyuHbzkGiRdIafWF85YxePToZg0rHlnEcE09fDEybxGYm1CEGPO7UT-q-ghVu23XP5EZBmMWGnaKFbxyGO7P11p_zKZAvKsILFOdCL3gMmFS3S-e5qWTr12LhS_aHMTOtlm" />
                                    <div className="absolute top-3 right-3 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl px-2.5 py-1 rounded-xl border border-white/60 dark:border-white/20 flex items-center gap-1.5 shadow-sm">
                                        <span className="material-icons-round text-primary text-xs">trending_up</span>
                                        <span className="text-[9.5px] font-medium uppercase tracking-wider text-slate-900 dark:text-white">{t('dashboard.destinations.trending')}</span>
                                    </div>
                                </div>
                                <div className="p-4">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <h4 className="font-semibold text-sm text-slate-900 dark:text-white tracking-tight">{t('dashboard.destinations.tokyo')}</h4>
                                            <p className="text-[11px] font-medium text-slate-400 mt-0.5">{t('dashboard.destinations.japan')}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[9px] font-medium text-slate-400 uppercase tracking-wider leading-none">{t('dashboard.destinations.from')}</p>
                                            <p className="text-primary font-semibold text-sm mt-0.5">$95</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="bg-primary/10 text-primary text-[9.5px] font-medium px-2 py-0.5 rounded-md">{t('dashboard.destinations.hotels', { count: 1850 })}</span>
                                        <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[9.5px] font-medium px-2 py-0.5 rounded-md">{t('dashboard.destinations.culture')}</span>
                                    </div>
                                </div>
                            </div>
                            <div onClick={() => navigate('/hotels/new york')} className="group bg-white/40 dark:bg-slate-900/40 backdrop-blur-3xl rounded-2xl overflow-hidden border border-white/60 dark:border-white/10 cursor-pointer shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                                <div className="relative h-40 overflow-hidden">
                                    <img alt="New York City" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDtxEUChP8HguBV_GFxz8TEk3Dssxi8xSCtI9Z9T9odllNiM91Ak0hyIkth1y8h7fVd-SgwSm4HxyJenSQHfxcK0mRSw03MGbXy9awP6fWL9o2E6w2zJuTizyr02IqQyZd6m73Z9CBZkHOiHgr0UxqaQ0otgONM7xlmX8jdsLkvqO6E3iPFxcpO5oCVYD2Oeq35OrYztM-6PMWjIP3b1DOmvxfBWs1CLP1K2ycUZSlNdQ7d-ig6xdBpLeQU4BjENmJ-TBFNTw8OLQXD" />
                                    <div className="absolute top-3 right-3 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl px-2.5 py-1 rounded-xl border border-white/60 dark:border-white/20 flex items-center gap-1.5 shadow-sm">
                                        <span className="material-icons-round text-primary text-xs">trending_up</span>
                                        <span className="text-[9.5px] font-medium uppercase tracking-wider text-slate-900 dark:text-white">{t('dashboard.destinations.trending')}</span>
                                    </div>
                                </div>
                                <div className="p-4">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <h4 className="font-semibold text-sm text-slate-900 dark:text-white tracking-tight">{t('dashboard.destinations.newYork')}</h4>
                                            <p className="text-[11px] font-medium text-slate-400 mt-0.5">{t('dashboard.destinations.usa')}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[9px] font-medium text-slate-400 uppercase tracking-wider leading-none">{t('dashboard.destinations.from')}</p>
                                            <p className="text-primary font-semibold text-sm mt-0.5">$150</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="bg-primary/10 text-primary text-[9.5px] font-medium px-2 py-0.5 rounded-md">{t('dashboard.destinations.hotels', { count: 3200 })}</span>
                                        <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[9.5px] font-medium px-2 py-0.5 rounded-md">{t('dashboard.destinations.metropolis')}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="mb-10">
                        <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-3xl rounded-2xl border border-white/60 dark:border-white/10 overflow-hidden shadow-xl">
                            <div className="p-5 border-b border-white/40 dark:border-white/5 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                                        <span className="material-icons-round text-primary text-base">history</span>
                                    </div>
                                    <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">{t('dashboard.recentBookings')}</h2>
                                </div>
                                <button
                                    onClick={() => navigate('/bookings')}
                                    className="px-3.5 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-semibold hover:bg-primary hover:text-white transition-all duration-200"
                                >
                                    {t('dashboard.viewAll')}
                                </button>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left ltr:text-left rtl:text-right border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50/90 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800">
                                            <th className="px-4 py-2.5 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider select-none">{t('dashboard.bookingId')}</th>
                                            <th className="px-4 py-2.5 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider select-none">{t('dashboard.voucher')}</th>
                                            <th className="px-4 py-2.5 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider select-none">{t('dashboard.agency')}</th>
                                            <th className="px-4 py-2.5 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider select-none">{t('dashboard.hotel')}</th>
                                            <th className="px-4 py-2.5 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center select-none">{t('dashboard.checkIn')}</th>
                                            <th className="px-4 py-2.5 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right select-none">{t('dashboard.amount')}</th>
                                            <th className="px-4 py-2.5 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center select-none">{t('dashboard.status')}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                                        {loading ? (
                                            <tr>
                                                <td colSpan="7" className="px-5 py-8 text-center">
                                                    <div className="flex flex-col items-center justify-center gap-3">
                                                        <div className="size-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                                                        <span className="text-xs font-medium text-slate-400">{t('common.loading')}</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : error ? (
                                            <tr>
                                                <td colSpan="7" className="px-5 py-8 text-center text-red-500 font-medium text-xs">
                                                    {error}
                                                </td>
                                            </tr>
                                        ) : bookings.length === 0 ? (
                                            <tr>
                                                <td colSpan="7" className="px-5 py-8 text-center text-slate-400 text-xs font-medium">
                                                    {t('dashboard.noRecentBookings')}
                                                </td>
                                            </tr>
                                        ) : (
                                            bookings.map((booking) => (
                                                <tr 
                                                    key={booking.bookingId} 
                                                    onClick={() => navigate(`/bookings/${booking.bookingId}`)}
                                                    className="odd:bg-white dark:odd:bg-slate-900/80 even:bg-slate-100/80 dark:even:bg-slate-800/50 hover:bg-blue-50/60 dark:hover:bg-blue-900/30 transition-colors duration-150 border-b border-slate-200/50 dark:border-slate-800/60 cursor-pointer text-[11px] group"
                                                >
                                                    <td className="px-4 py-2.5 text-[11px] font-semibold text-slate-700 dark:text-slate-300 group-hover:text-primary transition-colors whitespace-nowrap">
                                                        #{booking.bookingId}
                                                    </td>
                                                    <td className="px-4 py-2.5 text-[11px] font-medium text-slate-600 dark:text-slate-300">
                                                        {booking.voucher || '-'}
                                                    </td>
                                                    <td className="px-4 py-2.5">
                                                        <div className="flex items-center gap-2.5">
                                                            <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center text-[10px] font-semibold text-primary border border-primary/20 shrink-0">
                                                                {getInitials(booking.principalAgencyName)}
                                                            </div>
                                                            <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300 truncate max-w-[140px]">{booking.principalAgencyName}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-2.5 text-[11px] font-medium text-slate-700 dark:text-slate-200 truncate max-w-[200px]">{booking.hotelName}</td>
                                                    <td className="px-4 py-2.5 text-[11px] font-normal text-slate-500 dark:text-slate-400 text-center whitespace-nowrap">
                                                        {formatDate(booking.checkInDate)}
                                                    </td>
                                                    <td className="px-4 py-2.5 text-[11px] font-bold text-slate-900 dark:text-white text-right whitespace-nowrap">
                                                        {booking.totalAmount ? `${booking.currency} ${booking.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : 'N/A'}
                                                    </td>
                                                    <td className="px-4 py-2.5">
                                                        <div className="flex justify-center">
                                                            <BookingStatusBadge status={booking.bookingStatus} className="shadow-none border-none bg-transparent p-0" showIcon={false} />
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
                                <p className="text-xs font-bold">{t('dashboard.securePayment')}</p>
                                <p className="text-[10px] text-slate-400">{t('dashboard.securePaymentSub')}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-4 bg-white/50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-primary">
                                <span className="material-icons-round text-xl">loyalty</span>
                            </div>
                            <div>
                                <p className="text-xs font-bold">{t('dashboard.bestPrice')}</p>
                                <p className="text-[10px] text-slate-400">{t('dashboard.bestPriceSub')}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-4 bg-white/50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-primary">
                                <span className="material-icons-round text-xl">support_agent</span>
                            </div>
                            <div>
                                <p className="text-xs font-bold">{t('dashboard.support247')}</p>
                                <p className="text-[10px] text-slate-400">{t('dashboard.support247Sub')}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-4 bg-white/50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-primary">
                                <span className="material-icons-round text-xl">reviews</span>
                            </div>
                            <div>
                                <p className="text-xs font-bold">{t('dashboard.verifiedReviews')}</p>
                                <p className="text-[10px] text-slate-400">{t('dashboard.verifiedReviewsSub')}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </>
    );
};

export default Dashboard;
