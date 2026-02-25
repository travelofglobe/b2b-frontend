import React, { useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PlaneLoading from '../components/PlaneLoading';

const backgrounds = [
    '/assets/backgrounds/bg-1.jpg',
    '/assets/backgrounds/bg-2.jpg',
    '/assets/backgrounds/bg-3.jpg',
    '/assets/backgrounds/bg-4.jpg',
    '/assets/backgrounds/bg-5.jpg'
];

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const selectedBg = useMemo(() => {
        const randomIndex = Math.floor(Math.random() * backgrounds.length);
        return backgrounds[randomIndex];
    }, []);

    const from = location.state?.from?.pathname || "/dashboard";

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            await login(email, password);
            navigate(from, { replace: true });
        } catch (err) {
            setError(err.message || 'Giriş yapılamadı. Lütfen bilgilerinizi kontrol edin.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden font-sans">
            {/* Immersive Background */}
            <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 bg-slate-900/40 z-10"></div>
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-900/20 to-slate-900/90 z-10"></div>
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
                    <div className="flex items-center gap-3 mb-6">
                        <div className="size-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center text-white border border-white/20">
                            <span className="material-symbols-outlined text-2xl">apartment</span>
                        </div>
                        <span className="font-black text-xl tracking-tight text-white uppercase">TOG B2B Portal</span>
                    </div>
                    <h1 className="text-6xl font-black leading-tight tracking-tight mb-8">
                        Redefining <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-blue-400 to-emerald-400">Luxury Travel</span>
                        <br /> Partnerships.
                    </h1>
                    <div className="grid grid-cols-2 gap-8 max-w-lg">
                        <div className="pl-6 border-l-2 border-white/20">
                            <p className="text-3xl font-black mb-1">2,400+</p>
                            <p className="text-sm font-medium text-white/60 uppercase tracking-widest">Premium Properties</p>
                        </div>
                        <div className="pl-6 border-l-2 border-white/20">
                            <p className="text-3xl font-black mb-1">Global</p>
                            <p className="text-sm font-medium text-white/60 uppercase tracking-widest">Concierge Support</p>
                        </div>
                    </div>
                </div>

                {/* Right Side: Login Card */}
                <div className="lg:col-span-1"></div> { /* Spacer */}
                <div className="lg:col-span-4 w-full">
                    <div className="bg-white/[0.03] backdrop-blur-[40px] rounded-[32px] border border-white/10 shadow-[0_32px_96px_-16px_rgba(0,0,0,0.5)] overflow-hidden animate-in fade-in zoom-in duration-700">
                        {/* Card Header */}
                        <div className="p-8 pb-0 text-center">
                            <h2 className="text-2xl font-black text-white mb-2">Welcome Back</h2>
                            <p className="text-slate-400 text-sm font-medium">Please enter your credentials</p>
                        </div>

                        {/* Login Form */}
                        <form onSubmit={handleSubmit} className="p-8 space-y-5 relative">
                            {isLoading && <PlaneLoading />}
                            <div className="space-y-4">
                                <div className="group relative transition-all">
                                    <div className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-primary transition-colors z-10">
                                        <span className="material-symbols-outlined text-[20px]">mail</span>
                                    </div>
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="Email Address"
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-white placeholder:text-slate-400 font-semibold focus:outline-none focus:bg-white/10 focus:border-primary/50 transition-all text-sm"
                                    />
                                </div>

                                <div className="group relative transition-all">
                                    <div className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-primary transition-colors z-10">
                                        <span className="material-symbols-outlined text-[20px]">lock_open</span>
                                    </div>
                                    <input
                                        type="password"
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Password"
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-white placeholder:text-slate-400 font-semibold focus:outline-none focus:bg-white/10 focus:border-primary/50 transition-all text-sm"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-between px-1">
                                <label className="flex items-center gap-2 cursor-pointer group">
                                    <div className="w-4 h-4 rounded border border-slate-600 bg-transparent flex items-center justify-center group-hover:border-primary transition-colors">
                                        <input type="checkbox" className="appearance-none peer" />
                                        <div className="hidden peer-checked:block w-2.5 h-2.5 bg-primary rounded-[2px]"></div>
                                    </div>
                                    <span className="text-xs font-bold text-slate-400 group-hover:text-white transition-colors">Keep me signed in</span>
                                </label>
                                <a href="#" className="text-xs font-bold text-primary hover:text-primary/80 transition-colors">Recovery?</a>
                            </div>

                            {error && (
                                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3 text-red-500 animate-in fade-in slide-in-from-top-2">
                                    <span className="material-symbols-outlined text-sm">warning</span>
                                    <span className="text-xs font-bold">{error}</span>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full relative overflow-hidden bg-gradient-to-r from-primary to-blue-600 text-white p-4 rounded-2xl font-black uppercase text-xs tracking-[0.2em] hover:shadow-lg hover:shadow-primary/25 active:scale-[0.98] transition-all disabled:opacity-70 group"
                            >
                                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                                <span className="relative flex items-center justify-center gap-2">
                                    {isLoading ? 'Signing In...' : 'Access Dashboard'}
                                    {!isLoading && <span className="material-symbols-outlined text-sm">arrow_forward</span>}
                                </span>
                            </button>
                        </form>

                        {/* Card Footer */}
                        <div className="p-6 pt-2 text-center border-t border-white/5 bg-white/[0.02]">
                            <p className="text-xs text-slate-500 font-medium">New Partner? <a href="#" className="text-white font-bold hover:underline">Apply here</a></p>
                        </div>
                    </div>

                    <div className="text-center mt-6">
                        <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.3em]">
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
