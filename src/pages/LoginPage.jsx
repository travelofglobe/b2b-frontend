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
                    {/* Premium White Frosted Glass Card */}
                    <div className="bg-white/15 backdrop-blur-2xl rounded-[32px] border border-white/30 shadow-[0_32px_96px_-16px_rgba(0,0,0,0.4)] overflow-hidden animate-in fade-in zoom-in duration-700 relative">
                        
                        {!isResetMode ? (
                            <>
                                {/* Card Header */}
                                <div className="p-8 pb-0 text-center">
                                    <h2 className="text-2xl font-black text-white mb-2 tracking-tight drop-shadow-md">{t('common.signIn')}</h2>
                                    <p className="text-white/90 text-sm font-semibold drop-shadow-xs">{t('login.subtitle')}</p>
                                </div>

                                {/* Login Form */}
                                <form onSubmit={handleSubmit} className="p-8 space-y-5 relative">
                                    <div className="space-y-4">
                                        <div className="group relative transition-all">
                                            <div className="absolute left-4 top-3.5 text-white/80 group-focus-within:text-white transition-colors z-10">
                                                <span className="material-symbols-outlined text-[20px]">mail</span>
                                            </div>
                                            <input
                                                type="email"
                                                required
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                placeholder={t('login.email')}
                                                className="w-full bg-white/20 border border-white/30 rounded-2xl py-3.5 pl-12 pr-4 text-white placeholder:text-white/70 font-semibold focus:outline-none focus:bg-white/30 focus:border-white transition-all text-sm shadow-sm backdrop-blur-md"
                                            />
                                        </div>

                                        <div className="group relative transition-all">
                                            <div className="absolute left-4 top-3.5 text-white/80 group-focus-within:text-white transition-colors z-10">
                                                <span className="material-symbols-outlined text-[20px]">lock_open</span>
                                            </div>
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                required
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                placeholder={t('login.password')}
                                                className="w-full bg-white/20 border border-white/30 rounded-2xl py-3.5 pl-12 pr-12 text-white placeholder:text-white/70 font-semibold focus:outline-none focus:bg-white/30 focus:border-white transition-all text-sm shadow-sm backdrop-blur-md"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-4 top-3.5 text-white/80 hover:text-white transition-colors z-10 flex items-center justify-center"
                                            >
                                                <span className="material-symbols-outlined text-[20px]">
                                                    {showPassword ? "visibility_off" : "visibility"}
                                                </span>
                                            </button>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between px-1">
                                        <label className="flex items-center gap-2.5 cursor-pointer group">
                                            <div className="w-4 h-4 rounded border border-white/40 bg-white/10 flex items-center justify-center group-hover:border-white transition-colors backdrop-blur-xs">
                                                <input type="checkbox" className="appearance-none peer" />
                                                <div className="hidden peer-checked:block w-2.5 h-2.5 bg-primary rounded-[2px]"></div>
                                            </div>
                                            <span className="text-xs font-bold text-white/90 group-hover:text-white transition-colors drop-shadow-xs">{t('login.keepMeSignedIn', 'Keep me signed in')}</span>
                                        </label>
                                        <button 
                                            type="button"
                                            onClick={() => {
                                                setIsResetMode(true);
                                                setError('');
                                            }}
                                            className="text-xs font-extrabold text-sky-300 hover:text-white transition-colors drop-shadow-xs"
                                        >
                                            {t('login.forgotPassword')}
                                        </button>
                                    </div>

                                    {error && (
                                        <div className="p-3 rounded-xl bg-red-500/30 backdrop-blur-md border border-red-400/40 flex items-center gap-3 text-white animate-in fade-in slide-in-from-top-2 shadow-sm">
                                            <span className="material-symbols-outlined text-sm text-red-200">warning</span>
                                            <span className="text-xs font-bold">{error}</span>
                                        </div>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="w-full relative overflow-hidden bg-gradient-to-r from-primary to-blue-600 hover:from-blue-600 hover:to-primary text-white p-4 rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-xl shadow-primary/30 hover:shadow-primary/50 hover:scale-[1.01] active:scale-[0.98] transition-all disabled:opacity-70 group"
                                    >
                                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
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
                                    <h2 className="text-2xl font-black text-white mb-2 drop-shadow-md">Password Recovery</h2>
                                    <p className="text-white/90 text-sm font-semibold drop-shadow-xs">Enter your email to receive instructions</p>
                                </div>

                                {resetSuccess ? (
                                    <div className="p-8 text-center space-y-6">
                                        <div className="size-20 bg-emerald-500/30 backdrop-blur-md rounded-full flex items-center justify-center text-white mx-auto border border-emerald-400/40 shadow-lg">
                                            <span className="material-symbols-outlined text-4xl animate-in zoom-in duration-500">mark_email_read</span>
                                        </div>
                                        <div className="space-y-2">
                                            <h3 className="text-white font-black text-lg drop-shadow-md">Instructions Sent!</h3>
                                            <p className="text-white/90 text-sm leading-relaxed drop-shadow-xs">
                                                We've sent password reset instructions to <br/>
                                                <span className="text-white font-bold">{resetEmail}</span>
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => {
                                                setIsResetMode(false);
                                                setResetSuccess(false);
                                                setResetEmail('');
                                            }}
                                            className="w-full bg-white/20 border border-white/30 text-white p-4 rounded-2xl font-black uppercase text-xs tracking-[0.2em] hover:bg-white/30 backdrop-blur-md transition-all shadow-md"
                                        >
                                            Back to Login
                                        </button>
                                    </div>
                                ) : (
                                    <form onSubmit={handleResetPassword} className="p-8 space-y-5">
                                        <div className="group relative transition-all">
                                            <div className="absolute left-4 top-3.5 text-white/80 group-focus-within:text-white transition-colors z-10">
                                                <span className="material-symbols-outlined text-[20px]">mail</span>
                                            </div>
                                            <input
                                                type="email"
                                                required
                                                value={resetEmail}
                                                onChange={(e) => setResetEmail(e.target.value)}
                                                placeholder="Enter registered email"
                                                className="w-full bg-white/20 border border-white/30 rounded-2xl py-3.5 pl-12 pr-4 text-white placeholder:text-white/70 font-semibold focus:outline-none focus:bg-white/30 focus:border-white transition-all text-sm shadow-sm backdrop-blur-md"
                                            />
                                        </div>

                                        {error && (
                                            <div className="p-3 rounded-xl bg-red-500/30 backdrop-blur-md border border-red-400/40 flex items-center gap-3 text-white">
                                                <span className="material-symbols-outlined text-sm text-red-200">warning</span>
                                                <span className="text-xs font-bold">{error}</span>
                                            </div>
                                        )}

                                        <button
                                            type="submit"
                                            disabled={isLoading || !resetEmail}
                                            className="w-full relative overflow-hidden bg-primary text-white p-4 rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-xl shadow-primary/30 hover:shadow-primary/50 active:scale-[0.98] transition-all disabled:opacity-50"
                                        >
                                            Send Reset Link
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => {
                                                setIsResetMode(false);
                                                setError('');
                                            }}
                                            className="w-full text-xs font-bold text-white/90 hover:text-white transition-colors drop-shadow-xs"
                                        >
                                            I remember my password
                                        </button>
                                    </form>
                                )}
                            </>
                        )}
                    </div>

                    <div className="text-center mt-6">
                        <p className="text-[10px] font-bold text-white/90 uppercase tracking-[0.3em] bg-white/10 px-4 py-1.5 rounded-full border border-white/20 backdrop-blur-md inline-block shadow-md">
                            Secure Connection • 256-bit SSL
                        </p>
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
