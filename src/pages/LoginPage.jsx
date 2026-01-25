import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const from = location.state?.from?.pathname || "/hotels";

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
        <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-slate-900 font-sans">
            {/* Animated Background Elements */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] animate-pulse"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#137fec]/10 rounded-full blur-[140px] animate-pulse delay-700"></div>
                <img
                    src="https://images.unsplash.com/photo-1506012787146-f92b2d7d6d96?q=80&w=2069&auto=format&fit=crop"
                    className="absolute inset-0 w-full h-full object-cover opacity-20 scale-110"
                    alt="Background"
                />
            </div>

            <main className="relative z-10 w-full max-w-[480px] px-6">
                {/* Logo & Header */}
                <div className="text-center mb-10 animate-in fade-in slide-in-from-top-8 duration-1000">
                    <div className="inline-flex items-center gap-3 text-primary mb-4 p-4 rounded-[24px] bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl">
                        <span className="material-symbols-outlined text-4xl">travel</span>
                    </div>
                    <h1 className="text-4xl font-black text-white uppercase tracking-tighter leading-none">Travel of Globe</h1>
                    <p className="text-slate-400 font-bold uppercase tracking-[0.3em] text-[10px] mt-4">Partner Agency Access</p>
                </div>

                {/* Glass Login Card */}
                <div className="bg-white/10 dark:bg-slate-900/40 backdrop-blur-3xl rounded-[40px] border border-white/20 dark:border-white/10 shadow-[0_32px_128px_-16px_rgba(0,0,0,0.5)] overflow-hidden animate-in fade-in zoom-in duration-700">
                    <form onSubmit={handleSubmit} className="p-10 lg:p-12 space-y-8">
                        <div className="space-y-6">
                            {/* Email Input */}
                            <div className="space-y-2 group">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Email Address</label>
                                <div className="relative">
                                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors">mail</span>
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="your@agency.com"
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all font-bold text-sm"
                                    />
                                </div>
                            </div>

                            {/* Password Input */}
                            <div className="space-y-2 group">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Password</label>
                                <div className="relative">
                                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors">lock</span>
                                    <input
                                        type="password"
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all font-bold text-sm"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-start gap-3 animate-in fade-in slide-in-from-left-4">
                                <span className="material-symbols-outlined text-red-500 mt-0.5">error</span>
                                <p className="text-xs font-bold text-red-400 leading-relaxed">{error}</p>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-primary text-white py-5 rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:scale-100 transition-all flex items-center justify-center gap-3 group"
                        >
                            {isLoading ? (
                                <div className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                <>
                                    Sign In to Dashboard
                                    <span className="material-symbols-outlined transition-transform group-hover:translate-x-1">arrow_forward</span>
                                </>
                            )}
                        </button>
                    </form>

                    <div className="p-8 bg-black/20 border-t border-white/5 text-center">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                            © 2026 Travel of Globe • Secure Gateway
                        </p>
                    </div>
                </div>

                {/* Footer Links */}
                <div className="mt-10 flex items-center justify-center gap-8 text-[10px] font-black uppercase tracking-widest text-slate-500">
                    <a href="#" className="hover:text-primary transition-colors">Forgot Password?</a>
                    <div className="size-1 bg-slate-800 rounded-full"></div>
                    <a href="#" className="hover:text-primary transition-colors">Agency Support</a>
                </div>
            </main>
        </div>
    );
};

export default LoginPage;
