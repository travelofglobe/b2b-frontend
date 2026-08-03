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

    useEffect(() => {
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

        const fetchStats = async () => {
            try {
                const summary = await agencyService.getDashboardSummary();
                setSummary({
                    totalUsers: summary?.totalUsers ?? 0,
                    activeUsers: summary?.activeUsers ?? 0,
                    totalGuests: summary?.totalGuests ?? 0,
                    bookingsToday: summary?.bookingsToday ?? 0,
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
                            <div className="flex items-center gap-2 text-emerald-500 font-medium text-sm bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1.5 rounded-full">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                {t('dashboard.bookingsToday', { count: summary.bookingsToday })}
                            </div>
                            <HeaderActions />
                        </div>
                    </header>

                    <div className="mb-12 relative z-20">
                        <DashboardSearch />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                        {/* Total Users Card */}
                        <div className="group bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
                            <div className="flex items-center justify-between mb-4">
                                <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-105 transition-transform">
                                    <span className="material-icons-round text-xl">supervised_user_circle</span>
                                </div>
                                <span className="px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 text-[10px] font-semibold uppercase tracking-wider flex items-center gap-1 border border-emerald-100 dark:border-emerald-800/30">
                                    <span className="material-icons-round text-xs">trending_up</span> Live
                                </span>
                            </div>
                            <div>
                                <p className="text-slate-500 dark:text-slate-400 text-xs font-medium uppercase tracking-wider mb-1">{t('dashboard.totalUsers')}</p>
                                <h3 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{statsLoading ? '...' : summary.totalUsers}</h3>
                            </div>
                        </div>

                        {/* Active Users Card */}
                        <div className="group bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
                            <div className="flex items-center justify-between mb-4">
                                <div className="size-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 group-hover:scale-105 transition-transform">
                                    <span className="material-icons-round text-xl">bolt</span>
                                </div>
                                <span className="px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 text-[10px] font-semibold uppercase tracking-wider flex items-center gap-1 border border-amber-100 dark:border-amber-800/30">
                                    <span className="material-icons-round text-xs animate-pulse">sensors</span> Online
                                </span>
                            </div>
                            <div>
                                <p className="text-slate-500 dark:text-slate-400 text-xs font-medium uppercase tracking-wider mb-1">{t('dashboard.activeUsers')}</p>
                                <h3 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{statsLoading ? '...' : summary.activeUsers}</h3>
                            </div>
                        </div>

                        {/* Total Guests Card */}
                        <div className="group bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
                            <div className="flex items-center justify-between mb-4">
                                <div className="size-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500 group-hover:scale-105 transition-transform">
                                    <span className="material-icons-round text-xl">group</span>
                                </div>
                                <span className="px-2.5 py-1 rounded-full bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 text-[10px] font-semibold uppercase tracking-wider flex items-center gap-1 border border-purple-100 dark:border-purple-800/30">
                                    <span className="material-icons-round text-xs">people</span> CRM
                                </span>
                            </div>
                            <div>
                                <p className="text-slate-500 dark:text-slate-400 text-xs font-medium uppercase tracking-wider mb-1">{t('dashboard.totalGuests')}</p>
                                <h3 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{statsLoading ? '...' : summary.totalGuests}</h3>
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
                                        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-900 dark:text-white">{t('dashboard.destinations.trending')}</span>
                                    </div>
                                </div>
                                <div className="p-4">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <h4 className="font-bold text-base text-slate-900 dark:text-white tracking-tight">{t('dashboard.destinations.dubai')}</h4>
                                            <p className="text-[11px] font-medium text-slate-400 mt-0.5">{t('dashboard.destinations.uae')}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider leading-none">{t('dashboard.destinations.from')}</p>
                                            <p className="text-primary font-bold text-base mt-0.5">$89</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="bg-primary/10 text-primary text-[10px] font-medium px-2 py-0.5 rounded-md">{t('dashboard.destinations.hotels', { count: 1240 })}</span>
                                        <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-medium px-2 py-0.5 rounded-md">{t('dashboard.destinations.luxury')}</span>
                                    </div>
                                </div>
                            </div>
                            <div onClick={() => navigate('/hotels/paris')} className="group bg-white/40 dark:bg-slate-900/40 backdrop-blur-3xl rounded-2xl overflow-hidden border border-white/60 dark:border-white/10 cursor-pointer shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                                <div className="relative h-40 overflow-hidden">
                                    <img alt="Eiffel Tower Paris" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAAKaysBHtmgeqbCgI0hzy0BjMTk-ihUbfPvkwXOo8168DpEmYK3ZwUxnws0XTpi6CmcD9AxZbd3_eEML6dtpH1U4UclGEab2N3lvPHR2NF83mJEoRDl4abqV9dzSRQSgW_hG8DnDAIF2poS3q0EGj7EQwR269k2fBX9DwMIy5gLNy3CNjSgGuy6g3et73S__a185-hjz_rlYOqQXd3J9xxPDU6VuTKmnr7sPPCcfG7YmvzEi-Tg2SmIcvAqYG0Sbd2-iebgBNPsKU_" />
                                    <div className="absolute top-3 right-3 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl px-2.5 py-1 rounded-xl border border-white/60 dark:border-white/20 flex items-center gap-1.5 shadow-sm">
                                        <span className="material-icons-round text-primary text-xs">trending_up</span>
                                        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-900 dark:text-white">{t('dashboard.destinations.trending')}</span>
                                    </div>
                                </div>
                                <div className="p-4">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <h4 className="font-bold text-base text-slate-900 dark:text-white tracking-tight">{t('dashboard.destinations.paris')}</h4>
                                            <p className="text-[11px] font-medium text-slate-400 mt-0.5">{t('dashboard.destinations.france')}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider leading-none">{t('dashboard.destinations.from')}</p>
                                            <p className="text-primary font-bold text-base mt-0.5">$120</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="bg-primary/10 text-primary text-[10px] font-medium px-2 py-0.5 rounded-md">{t('dashboard.destinations.hotels', { count: 2100 })}</span>
                                        <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-medium px-2 py-0.5 rounded-md">{t('dashboard.destinations.romance')}</span>
                                    </div>
                                </div>
                            </div>
                            <div onClick={() => navigate('/hotels/tokyo')} className="group bg-white/40 dark:bg-slate-900/40 backdrop-blur-3xl rounded-2xl overflow-hidden border border-white/60 dark:border-white/10 cursor-pointer shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                                <div className="relative h-40 overflow-hidden">
                                    <img alt="Tokyo tower" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src="https://lh3.googleusercontent.com/aida-public/AB6AXuC0NEc0GKKnW3d7mB9bVdbYwFNBEpY_nhmkIekHSBPSWraDNin1ulHT4_q9cfhMIcqrg51KW03dH7sambalU3BYZ7y1HYErTyF-Wv08E5_ZTcGFZrbVQoaAWGSJJ-DT_LoEtPdZ6dZ8UDyuHbzkGiRdIafWF85YxePToZg0rHlnEcE09fDEybxGYm1CEGPO7UT-q-ghVu23XP5EZBmMWGnaKFbxyGO7P11p_zKZAvKsILFOdCL3gMmFS3S-e5qWTr12LhS_aHMTOtlm" />
                                    <div className="absolute top-3 right-3 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl px-2.5 py-1 rounded-xl border border-white/60 dark:border-white/20 flex items-center gap-1.5 shadow-sm">
                                        <span className="material-icons-round text-primary text-xs">trending_up</span>
                                        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-900 dark:text-white">{t('dashboard.destinations.trending')}</span>
                                    </div>
                                </div>
                                <div className="p-4">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <h4 className="font-bold text-base text-slate-900 dark:text-white tracking-tight">{t('dashboard.destinations.tokyo')}</h4>
                                            <p className="text-[11px] font-medium text-slate-400 mt-0.5">{t('dashboard.destinations.japan')}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider leading-none">{t('dashboard.destinations.from')}</p>
                                            <p className="text-primary font-bold text-base mt-0.5">$95</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="bg-primary/10 text-primary text-[10px] font-medium px-2 py-0.5 rounded-md">{t('dashboard.destinations.hotels', { count: 1850 })}</span>
                                        <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-medium px-2 py-0.5 rounded-md">{t('dashboard.destinations.culture')}</span>
                                    </div>
                                </div>
                            </div>
                            <div onClick={() => navigate('/hotels/new york')} className="group bg-white/40 dark:bg-slate-900/40 backdrop-blur-3xl rounded-2xl overflow-hidden border border-white/60 dark:border-white/10 cursor-pointer shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                                <div className="relative h-40 overflow-hidden">
                                    <img alt="New York City" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDtxEUChP8HguBV_GFxz8TEk3Dssxi8xSCtI9Z9T9odllNiM91Ak0hyIkth1y8h7fVd-SgwSm4HxyJenSQHfxcK0mRSw03MGbXy9awP6fWL9o2E6w2zJuTizyr02IqQyZd6m73Z9CBZkHOiHgr0UxqaQ0otgONM7xlmX8jdsLkvqO6E3iPFxcpO5oCVYD2Oeq35OrYztM-6PMWjIP3b1DOmvxfBWs1CLP1K2ycUZSlNdQ7d-ig6xdBpLeQU4BjENmJ-TBFNTw8OLQXD" />
                                    <div className="absolute top-3 right-3 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl px-2.5 py-1 rounded-xl border border-white/60 dark:border-white/20 flex items-center gap-1.5 shadow-sm">
                                        <span className="material-icons-round text-primary text-xs">trending_up</span>
                                        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-900 dark:text-white">{t('dashboard.destinations.trending')}</span>
                                    </div>
                                </div>
                                <div className="p-4">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <h4 className="font-bold text-base text-slate-900 dark:text-white tracking-tight">{t('dashboard.destinations.newYork')}</h4>
                                            <p className="text-[11px] font-medium text-slate-400 mt-0.5">{t('dashboard.destinations.usa')}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider leading-none">{t('dashboard.destinations.from')}</p>
                                            <p className="text-primary font-bold text-base mt-0.5">$150</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="bg-primary/10 text-primary text-[10px] font-medium px-2 py-0.5 rounded-md">{t('dashboard.destinations.hotels', { count: 3200 })}</span>
                                        <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-medium px-2 py-0.5 rounded-md">{t('dashboard.destinations.metropolis')}</span>
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
                                        <tr className="text-slate-500 dark:text-slate-400 text-[11px] font-semibold uppercase tracking-wider bg-white/20 dark:bg-slate-800/20 border-b border-slate-200 dark:border-slate-700">
                                            <th className="px-5 py-3">{t('dashboard.bookingId')}</th>
                                            <th className="px-5 py-3">{t('dashboard.voucher')}</th>
                                            <th className="px-5 py-3">{t('dashboard.agency')}</th>
                                            <th className="px-5 py-3">{t('dashboard.hotel')}</th>
                                            <th className="px-5 py-3 text-center">{t('dashboard.checkIn')}</th>
                                            <th className="px-5 py-3 text-right">{t('dashboard.amount')}</th>
                                            <th className="px-5 py-3 text-center">{t('dashboard.status')}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/20 dark:divide-white/5">
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
                                                <tr key={booking.bookingId} className="hover:bg-white/40 dark:hover:bg-slate-800/40 transition-colors group">
                                                    <td className="px-5 py-3.5">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                navigate(`/bookings/${booking.bookingId}`);
                                                            }}
                                                            className="text-primary font-semibold text-xs hover:underline underline-offset-4"
                                                        >
                                                            #{booking.bookingId}
                                                        </button>
                                                    </td>
                                                    <td className="px-5 py-3.5 text-xs font-medium text-slate-600 dark:text-slate-400">
                                                        {booking.voucher || '-'}
                                                    </td>
                                                    <td className="px-5 py-3.5">
                                                        <div className="flex items-center gap-2.5">
                                                            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-[10px] font-semibold text-primary border border-primary/20">
                                                                {getInitials(booking.principalAgencyName)}
                                                            </div>
                                                            <span className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate max-w-[120px]">{booking.principalAgencyName}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-5 py-3.5 text-xs font-medium text-slate-700 dark:text-slate-300 truncate max-w-[150px]">{booking.hotelName}</td>
                                                    <td className="px-5 py-3.5 text-xs font-medium text-slate-500 text-center">
                                                        {formatDate(booking.checkInDate)}
                                                    </td>
                                                    <td className="px-5 py-3.5 text-right">
                                                        <span className="text-xs font-semibold text-slate-900 dark:text-white">
                                                            {booking.totalAmount ? `${booking.currency} ${booking.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : 'N/A'}
                                                        </span>
                                                    </td>
                                                    <td className="px-5 py-3.5">
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
