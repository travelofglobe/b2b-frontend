import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
import PlaneLoading from '../components/PlaneLoading';
import { useTranslation } from 'react-i18next';
import PublicHeader from '../components/PublicHeader';
import logoSvg from '../assets/logo.svg';

// Automatically load all images from src/assets/backgrounds
const backgroundModules = import.meta.glob('../assets/backgrounds/*', { eager: true });
const backgrounds = Object.values(backgroundModules).map(m => m.default || m);

const LoginPage = () => {
    const { t } = useTranslation();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isResetMode, setIsResetMode] = useState(false);
    const [resetEmail, setResetEmail] = useState('');
    const [resetSuccess, setResetSuccess] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const { login, user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const redirectTarget = useMemo(() => {
        const isValidTarget = (target) => {
            if (!target || typeof target !== 'string') return false;
            const trimmed = target.trim();
            if (!trimmed.startsWith('/') || trimmed.startsWith('//')) return false;
            if (
                trimmed === '/' ||
                trimmed.startsWith('/login') ||
                trimmed.startsWith('/reset-password') ||
                trimmed.startsWith('/agency-application')
            ) {
                return false;
            }
            return true;
        };

        const searchParams = new URLSearchParams(location.search);
        const queryRedirect = searchParams.get('redirect');
        if (isValidTarget(queryRedirect)) {
            return queryRedirect.trim();
        }

        const stateFrom = location.state?.from;
        if (stateFrom) {
            const stateTarget = typeof stateFrom === 'string'
                ? stateFrom
                : `${stateFrom.pathname || ''}${stateFrom.search || ''}${stateFrom.hash || ''}`;
            if (isValidTarget(stateTarget)) {
                return stateTarget.trim();
            }
        }

        const storedRedirect = sessionStorage.getItem('b2b_post_login_redirect');
        if (isValidTarget(storedRedirect)) {
            return storedRedirect.trim();
        }

        return '/travel/hotels';
    }, [location]);

    // Redirect to intended page (or /travel/hotels) if already logged in
    useEffect(() => {
        if (user) {
            sessionStorage.removeItem('b2b_post_login_redirect');
            navigate(redirectTarget, { replace: true });
        }
    }, [user, navigate, redirectTarget]);

    const selectedBg = useMemo(() => {
        if (!backgrounds || backgrounds.length === 0) return '';
        const randomIndex = Math.floor(Math.random() * backgrounds.length);
        return backgrounds[randomIndex];
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            await login(email, password);
            sessionStorage.removeItem('b2b_post_login_redirect');
            navigate(redirectTarget, { replace: true });
        } catch (err) {
            setError(err.message || t('login.error'));
        } finally {
            setIsLoading(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            await authService.forgotPassword(resetEmail);
            setResetSuccess(true);
        } catch (err) {
            setError(err.message || 'Şifre sıfırlama isteği gönderilemedi.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden font-sans pt-16 bg-gradient-to-br from-[#f1f5f9] via-[#cbd5e1] to-[#94a3b8] dark:from-[#020617] dark:via-[#0b1120] dark:to-[#0f172a] transition-colors duration-300">
            {/* Reusable Modern Public Header */}
            <PublicHeader />

            {/* Plane Loading bar positioned right underneath the header line */}
            {isLoading && <PlaneLoading topClass="top-16" />}

            {/* Main Content Container matching admin-frontend max-w-5xl */}
            <div className="relative z-20 w-full max-w-5xl mx-auto px-6 py-12 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">

                {/* Left Side: Brand Messaging */}
                <div className="hidden lg:flex lg:col-span-7 flex-col items-start text-slate-800 dark:text-white animate-in fade-in slide-in-from-left-8 duration-1000">
                    <div className="mb-8 group cursor-default">
                        <img 
                            src={logoSvg} 
                            alt="Travel of Globe" 
                            className="w-full max-w-[440px] lg:max-w-[480px] h-auto block object-contain object-left transition-transform duration-500 group-hover:scale-105 drop-shadow-sm" 
                        />
                    </div>
                    <h1 className="text-3xl lg:text-4xl font-extrabold leading-[1.2] tracking-tight mb-6 text-slate-900 dark:text-white">
                        Redefining <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-[#137fec] to-indigo-600 dark:from-blue-400 dark:via-indigo-400 dark:to-[#137fec]">Luxury Travel</span>
                        <br /> Partnerships.
                    </h1>
                    <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-8 max-w-md">
                        Global B2B travel distribution platform. Real-time inventory, direct supplier integrations, and enterprise booking management.
                    </p>
                    <div className="grid grid-cols-2 gap-6 max-w-md pt-4 border-t border-slate-200/60 dark:border-white/10">
                        <div className="pl-4 border-l-2 border-[#137fec]">
                            <p className="text-lg font-bold text-slate-900 dark:text-white">2,400+</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Premium Properties</p>
                        </div>
                        <div className="pl-4 border-l-2 border-[#137fec]">
                            <p className="text-lg font-bold text-slate-900 dark:text-white">Global</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Concierge Support</p>
                        </div>
                    </div>
                </div>

                {/* Right Side: Sophisticated Light/Dark Frosted Glass Login Card matching admin-frontend */}
                <div className="lg:col-span-5 w-full max-w-[440px] mx-auto lg:ml-auto">
                    <div className="relative z-10 bg-white/75 dark:bg-[#0f172a]/75 backdrop-blur-[24px] rounded-3xl border border-white/80 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.08)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)] overflow-hidden animate-in fade-in zoom-in duration-700">

                        {!isResetMode ? (
                            <>
                                {/* Security Active Badge & Header */}
                                <div className="px-8 pt-8 pb-4 text-center">
                                    {/* Mobile Logo: visible on screens where left branding column is hidden */}
                                    <div className="lg:hidden flex justify-center mb-5">
                                        <img 
                                            src={logoSvg} 
                                            alt="Travel of Globe" 
                                            className="h-10 w-auto max-w-[220px] object-contain drop-shadow-sm" 
                                        />
                                    </div>
                                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 dark:bg-white/10 border border-slate-200/60 dark:border-white/15 rounded-full mb-4">
                                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                        <span className="text-[10px] font-bold text-slate-600 dark:text-white/80 tracking-[0.2em] uppercase">B2B CONTROL HUB</span>
                                    </div>
                                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{t('login.title') || 'Travel of Globe B2B'}</h2>
                                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{t('login.subtitle') || 'Sign in to your partner account'}</p>
                                </div>

                                {/* Login Form */}
                                <form onSubmit={handleSubmit} className="px-8 pb-8 pt-2 space-y-4">
                                    <div className="space-y-3.5">
                                        <div className="group relative transition-all">
                                            <div className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-[#137fec] transition-colors z-10 flex items-center justify-center">
                                                <span className="material-symbols-outlined text-[20px]">mail</span>
                                            </div>
                                            <input
                                                type="email"
                                                required
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                placeholder={t('login.email') || 'Email Address'}
                                                className="w-full bg-slate-50/80 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl py-3.5 pl-11 pr-4 text-slate-800 dark:text-white placeholder:text-slate-400 text-sm focus:outline-none focus:bg-white dark:focus:bg-white/10 focus:border-[#137fec] focus:ring-2 focus:ring-[#137fec]/20 transition-all"
                                            />
                                        </div>

                                        <div className="group relative transition-all">
                                            <div className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-[#137fec] transition-colors z-10 flex items-center justify-center">
                                                <span className="material-symbols-outlined text-[20px]">lock</span>
                                            </div>
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                required
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                placeholder={t('login.password') || 'Password'}
                                                className="w-full bg-slate-50/80 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl py-3.5 pl-11 pr-11 text-slate-800 dark:text-white placeholder:text-slate-400 text-sm focus:outline-none focus:bg-white dark:focus:bg-white/10 focus:border-[#137fec] focus:ring-2 focus:ring-[#137fec]/20 transition-all"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors z-10 flex items-center justify-center focus:outline-none cursor-pointer p-0.5"
                                            >
                                                <span className="material-symbols-outlined text-[20px]">
                                                    {showPassword ? "visibility_off" : "visibility"}
                                                </span>
                                            </button>
                                        </div>

                                        <div className="flex items-center justify-end pt-0.5">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setIsResetMode(true);
                                                    setError('');
                                                }}
                                                className="text-xs font-medium text-[#137fec] hover:underline dark:text-blue-400 transition-colors focus:outline-none cursor-pointer"
                                            >
                                                {t('login.forgotPassword') || 'Forgot Password?'}
                                            </button>
                                        </div>
                                    </div>

                                    {error && (
                                        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-2.5 text-red-600 dark:text-red-400 animate-in fade-in slide-in-from-top-1 text-xs font-medium">
                                            <span className="material-symbols-outlined text-base shrink-0">error</span>
                                            <span>{error}</span>
                                        </div>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="w-full mt-2 relative overflow-hidden bg-[#137fec] hover:bg-blue-600 text-white py-3.5 px-4 rounded-xl font-semibold text-sm tracking-wide shadow-md hover:shadow-lg hover:shadow-[#137fec]/25 active:scale-[0.99] transition-all disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
                                    >
                                        <span>{isLoading ? (t('login.loggingIn') || 'Signing In...') : (t('common.signIn') || 'Sign In')}</span>
                                        {!isLoading && <span className="material-symbols-outlined text-base">arrow_forward</span>}
                                    </button>
                                </form>
                            </>
                        ) : (
                            <>
                                {/* Recovery Header */}
                                <div className="px-8 pt-8 pb-4 text-center">
                                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 dark:bg-blue-500/10 border border-blue-200/60 dark:border-blue-500/20 rounded-full mb-3">
                                        <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                                        <span className="text-[10px] font-bold text-[#137fec] dark:text-blue-400 tracking-[0.2em] uppercase">PASSWORD RECOVERY</span>
                                    </div>
                                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Password Recovery</h2>
                                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Enter your email to receive instructions</p>
                                </div>

                                {resetSuccess ? (
                                    <div className="px-8 pb-8 pt-2 text-center space-y-5">
                                        <div className="size-16 bg-emerald-500/10 dark:bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-500 mx-auto border border-emerald-500/20">
                                            <span className="material-symbols-outlined text-3xl animate-in zoom-in duration-500">mark_email_read</span>
                                        </div>
                                        <div className="space-y-1.5">
                                            <h3 className="text-slate-900 dark:text-white font-bold text-base">Instructions Sent!</h3>
                                            <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed">
                                                We've sent password reset instructions to <br />
                                                <span className="text-slate-900 dark:text-white font-semibold">{resetEmail}</span>
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => {
                                                setIsResetMode(false);
                                                setResetSuccess(false);
                                                setResetEmail('');
                                            }}
                                            className="w-full bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 border border-slate-200/60 dark:border-white/10 text-slate-800 dark:text-white py-3 px-4 rounded-xl font-semibold text-xs tracking-wide transition-all cursor-pointer"
                                        >
                                            Back to Login
                                        </button>
                                    </div>
                                ) : (
                                    <form onSubmit={handleResetPassword} className="px-8 pb-8 pt-2 space-y-4">
                                        <div className="space-y-3.5">
                                            <div className="group relative transition-all">
                                                <div className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-[#137fec] transition-colors z-10 flex items-center justify-center">
                                                    <span className="material-symbols-outlined text-[20px]">mail</span>
                                                </div>
                                                <input
                                                    type="email"
                                                    required
                                                    value={resetEmail}
                                                    onChange={(e) => setResetEmail(e.target.value)}
                                                    placeholder="Enter registered email"
                                                    className="w-full bg-slate-50/80 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl py-3.5 pl-11 pr-4 text-slate-800 dark:text-white placeholder:text-slate-400 text-sm focus:outline-none focus:bg-white dark:focus:bg-white/10 focus:border-[#137fec] focus:ring-2 focus:ring-[#137fec]/20 transition-all"
                                                />
                                            </div>
                                        </div>

                                        {error && (
                                            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-2.5 text-red-600 dark:text-red-400 animate-in fade-in slide-in-from-top-1 text-xs font-medium">
                                                <span className="material-symbols-outlined text-base shrink-0">error</span>
                                                <span>{error}</span>
                                            </div>
                                        )}

                                        <button
                                            type="submit"
                                            disabled={isLoading || !resetEmail}
                                            className="w-full mt-2 relative overflow-hidden bg-[#137fec] hover:bg-blue-600 text-white py-3.5 px-4 rounded-xl font-semibold text-sm tracking-wide shadow-md hover:shadow-lg hover:shadow-[#137fec]/25 active:scale-[0.99] transition-all disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
                                        >
                                            Send Reset Link
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => {
                                                setIsResetMode(false);
                                                setError('');
                                            }}
                                            className="w-full text-xs font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer text-center pt-1"
                                        >
                                            I remember my password
                                        </button>
                                    </form>
                                )}
                            </>
                        )}
                        {/* Internal Card Footer matching admin-frontend */}
                        <div className="py-3 px-6 text-center border-t border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-black/10">
                            <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500 tracking-wider">
                                Travel of Globe Security Systems
                            </p>
                        </div>
                    </div>

                    {/* External Card Subtitle matching admin-frontend */}
                    <div className="text-center mt-5">
                        <p className="text-[11px] font-semibold text-slate-500 dark:text-white/40 uppercase tracking-[0.2em]">
                            System Access Protected
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
