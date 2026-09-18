import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
import PlaneLoading from '../components/PlaneLoading';
import { useTranslation } from 'react-i18next';
import PublicHeader from '../components/PublicHeader';

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

    // Redirect to travel hotels if already logged in
    useEffect(() => {
        if (user) {
            navigate('/travel/hotels', { replace: true });
        }
    }, [user, navigate]);

    const selectedBg = useMemo(() => {
        if (!backgrounds || backgrounds.length === 0) return '';
        const randomIndex = Math.floor(Math.random() * backgrounds.length);
        return backgrounds[randomIndex];
    }, []);

    const from = location.state?.from?.pathname || "/travel/hotels";

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            await login(email, password);
            navigate(from, { replace: true });
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
        <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden font-sans pt-16">
            {/* Reusable Modern Public Header */}
            <PublicHeader />

            {/* Plane Loading bar positioned right underneath the header line */}
            {isLoading && <PlaneLoading topClass="top-16" />}

            {/* Immersive Background */}
            <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 bg-slate-950/20 z-10"></div>
                <div className="absolute inset-0 bg-gradient-to-b from-slate-900/30 via-transparent to-slate-950/70 z-10"></div>
                <img
                    src={selectedBg}
                    className="w-full h-full object-cover animate-pan"
                    alt="Luxury Resort Background"
                    onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.parentElement.style.background = 'linear-gradient(to bottom, #0f172a, #1e293b)';
                    }}
                />
            </div>

            {/* Main Content Container */}
            <div className="relative z-20 w-full max-w-6xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center h-full">

                {/* Left Side: Brand Messaging */}
                <div className="hidden lg:flex lg:col-span-7 flex-col text-white animate-in fade-in slide-in-from-left-8 duration-1000">
                    <h1 className="text-6xl font-black leading-tight tracking-tight mb-8 drop-shadow-xl">
                        Redefining <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-300 via-blue-200 to-emerald-200 drop-shadow-lg">Luxury Travel</span>
                        <br /> Partnerships.
                    </h1>
                    <div className="grid grid-cols-2 gap-8 max-w-lg">
                        <div className="pl-6 border-l-2 border-white/40 backdrop-blur-xs">
                            <p className="text-3xl font-black mb-1 drop-shadow-md">2,400+</p>
                            <p className="text-sm font-bold text-white/90 uppercase tracking-widest drop-shadow-xs">Premium Properties</p>
                        </div>
                        <div className="pl-6 border-l-2 border-white/40 backdrop-blur-xs">
                            <p className="text-3xl font-black mb-1 drop-shadow-md">Global</p>
                            <p className="text-sm font-bold text-white/90 uppercase tracking-widest drop-shadow-xs">Concierge Support</p>
                        </div>
                    </div>
                </div>

                {/* Right Side: Login Card */}
                <div className="lg:col-span-1"></div> { /* Spacer */}
                <div className="lg:col-span-4 w-full">
                    {/* Premium Glass Card */}
                    <div className="bg-slate-950/50 backdrop-blur-2xl rounded-2xl border border-white/[0.12] shadow-[0_24px_64px_-12px_rgba(0,0,0,0.6)] ring-1 ring-white/5 overflow-hidden animate-in fade-in zoom-in duration-700 relative">
                        
                        {!isResetMode ? (
                            <>
                                {/* Card Header */}
                                <div className="p-8 pb-0 text-center">
                                    <h2 className="text-2xl font-black text-white mb-2 tracking-tight drop-shadow-xs">{t('common.signIn')}</h2>
                                    <p className="text-slate-300 text-sm font-medium">{t('login.subtitle')}</p>
                                </div>

                                {/* Login Form */}
                                <form onSubmit={handleSubmit} className="p-8 space-y-5 relative">
                                    <div className="space-y-4">
                                        <div className="group relative transition-all">
                                            <div className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-sky-400 transition-colors z-10">
                                                <span className="material-symbols-outlined text-[20px]">mail</span>
                                            </div>
                                            <input
                                                type="email"
                                                required
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                placeholder={t('login.email')}
                                                className="w-full bg-slate-950/40 border border-white/[0.12] rounded-xl py-3.5 pl-12 pr-4 text-white placeholder:text-slate-400/80 font-medium focus:outline-none focus:bg-slate-950/60 focus:border-sky-500/80 focus:ring-2 focus:ring-sky-500/20 transition-all text-sm shadow-inner backdrop-blur-md"
                                            />
                                        </div>

                                        <div className="group relative transition-all">
                                            <div className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-sky-400 transition-colors z-10">
                                                <span className="material-symbols-outlined text-[20px]">lock_open</span>
                                            </div>
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                required
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                placeholder={t('login.password')}
                                                className="w-full bg-slate-950/40 border border-white/[0.12] rounded-xl py-3.5 pl-12 pr-12 text-white placeholder:text-slate-400/80 font-medium focus:outline-none focus:bg-slate-950/60 focus:border-sky-500/80 focus:ring-2 focus:ring-sky-500/20 transition-all text-sm shadow-inner backdrop-blur-md"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-4 top-3.5 text-slate-400 hover:text-white transition-colors z-10 flex items-center justify-center"
                                            >
                                                <span className="material-symbols-outlined text-[20px]">
                                                    {showPassword ? "visibility_off" : "visibility"}
                                                </span>
                                            </button>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between px-1">
                                        <label className="flex items-center gap-2.5 cursor-pointer group">
                                            <div className="w-4 h-4 rounded border border-white/25 bg-white/5 flex items-center justify-center group-hover:border-white/50 transition-colors">
                                                <input type="checkbox" className="appearance-none peer" />
                                                <div className="hidden peer-checked:block w-2.5 h-2.5 bg-sky-500 rounded-[2px]"></div>
                                            </div>
                                            <span className="text-xs font-medium text-slate-300 group-hover:text-white transition-colors">{t('login.keepMeSignedIn', 'Keep me signed in')}</span>
                                        </label>
                                        <button 
                                            type="button"
                                            onClick={() => {
                                                setIsResetMode(true);
                                                setError('');
                                            }}
                                            className="text-xs font-semibold text-sky-400 hover:text-sky-300 transition-colors"
                                        >
                                            {t('login.forgotPassword')}
                                        </button>
                                    </div>

                                    {error && (
                                        <div className="p-3 rounded-xl bg-red-500/20 backdrop-blur-md border border-red-400/30 flex items-center gap-3 text-red-200 animate-in fade-in slide-in-from-top-2 shadow-sm">
                                            <span className="material-symbols-outlined text-sm text-red-400">warning</span>
                                            <span className="text-xs font-semibold">{error}</span>
                                        </div>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="w-full relative overflow-hidden bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 hover:from-sky-400 hover:via-blue-500 hover:to-indigo-500 text-white p-3.5 rounded-xl font-bold uppercase text-xs tracking-wider shadow-lg shadow-sky-500/25 hover:shadow-sky-500/40 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-70 group cursor-pointer"
                                    >
                                        <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                                        <span className="relative flex items-center justify-center gap-2">
                                            {isLoading ? t('login.loggingIn') : t('login.signInButton')}
                                            {!isLoading && <span className="material-symbols-outlined text-sm">arrow_forward</span>}
                                        </span>
                                    </button>
                                </form>
                            </>
                        ) : (
                            <>
                                {/* Recovery Header */}
                                <div className="p-8 pb-0 text-center">
                                    <h2 className="text-2xl font-black text-white mb-2 drop-shadow-xs">Password Recovery</h2>
                                    <p className="text-slate-300 text-sm font-medium">Enter your email to receive instructions</p>
                                </div>

                                {resetSuccess ? (
                                    <div className="p-8 text-center space-y-6">
                                        <div className="size-16 bg-emerald-500/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-emerald-400 mx-auto border border-emerald-500/30 shadow-lg">
                                            <span className="material-symbols-outlined text-3xl animate-in zoom-in duration-500">mark_email_read</span>
                                        </div>
                                        <div className="space-y-2">
                                            <h3 className="text-white font-bold text-lg">Instructions Sent!</h3>
                                            <p className="text-slate-300 text-sm leading-relaxed">
                                                We've sent password reset instructions to <br/>
                                                <span className="text-white font-semibold">{resetEmail}</span>
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => {
                                                setIsResetMode(false);
                                                setResetSuccess(false);
                                                setResetEmail('');
                                            }}
                                            className="w-full bg-white/10 hover:bg-white/15 border border-white/[0.12] text-white p-3.5 rounded-xl font-bold uppercase text-xs tracking-wider backdrop-blur-md transition-all shadow-sm cursor-pointer"
                                        >
                                            Back to Login
                                        </button>
                                    </div>
                                ) : (
                                    <form onSubmit={handleResetPassword} className="p-8 space-y-5">
                                        <div className="group relative transition-all">
                                            <div className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-sky-400 transition-colors z-10">
                                                <span className="material-symbols-outlined text-[20px]">mail</span>
                                            </div>
                                            <input
                                                type="email"
                                                required
                                                value={resetEmail}
                                                onChange={(e) => setResetEmail(e.target.value)}
                                                placeholder="Enter registered email"
                                                className="w-full bg-slate-950/40 border border-white/[0.12] rounded-xl py-3.5 pl-12 pr-4 text-white placeholder:text-slate-400/80 font-medium focus:outline-none focus:bg-slate-950/60 focus:border-sky-500/80 focus:ring-2 focus:ring-sky-500/20 transition-all text-sm shadow-inner backdrop-blur-md"
                                            />
                                        </div>

                                        {error && (
                                            <div className="p-3 rounded-xl bg-red-500/20 backdrop-blur-md border border-red-400/30 flex items-center gap-3 text-red-200">
                                                <span className="material-symbols-outlined text-sm text-red-400">warning</span>
                                                <span className="text-xs font-semibold">{error}</span>
                                            </div>
                                        )}

                                        <button
                                            type="submit"
                                            disabled={isLoading || !resetEmail}
                                            className="w-full relative overflow-hidden bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 hover:from-sky-400 hover:via-blue-500 hover:to-indigo-500 text-white p-3.5 rounded-xl font-bold uppercase text-xs tracking-wider shadow-lg shadow-sky-500/25 hover:shadow-sky-500/40 active:scale-[0.99] transition-all disabled:opacity-50 cursor-pointer"
                                        >
                                            Send Reset Link
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => {
                                                setIsResetMode(false);
                                                setError('');
                                            }}
                                            className="w-full text-xs font-medium text-slate-300 hover:text-white transition-colors cursor-pointer"
                                        >
                                            I remember my password
                                        </button>
                                    </form>
                                )}
                            </>
                        )}
                    </div>

                    <div className="text-center mt-6">
                        <div className="inline-flex items-center gap-2 bg-slate-950/40 px-3.5 py-1.5 rounded-full border border-white/[0.08] backdrop-blur-md shadow-xs">
                            <span className="material-symbols-outlined text-[14px] text-emerald-400">verified_user</span>
                            <span className="text-[11px] font-medium text-slate-300 tracking-wider uppercase">
                                Secure Connection • 256-bit SSL
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes pan {
                    0% { transform: scale(1.0) translate(0, 0); }
                    100% { transform: scale(1.1) translate(-2%, -2%); }
                }
                .animate-pan {
                    animation: pan 30s ease-out infinite alternate;
                }
            `}</style>
        </div>
    );
};

export default LoginPage;
