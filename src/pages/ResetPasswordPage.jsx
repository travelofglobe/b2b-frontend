import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import PlaneLoading from '../components/PlaneLoading';

const ResetPasswordPage = () => {
    const location = useLocation();
    const navigate = useNavigate();

    // Parse token from URLquery parameter
    const queryParams = new URLSearchParams(location.search);
    const token = queryParams.get('token');

    const [newPassword, setNewPassword] = useState('');
    const [newPasswordAgain, setNewPasswordAgain] = useState('');
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    // Password validation rules
    const validatePassword = (p) => ({
        length: p.length >= 12 && p.length <= 16,
        uppercase: /[A-Z]/.test(p),
        lowercase: /[a-z]/.test(p),
        number: /[0-9]/.test(p),
        special: /[!@#$%^&*]/.test(p)
    });

    const validation = validatePassword(newPassword);
    const allRulesMet = Object.values(validation).every(Boolean);
    const passwordsMatch = newPassword.length >= 12 && newPassword === newPasswordAgain;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!token) {
            setError('Geçersiz veya süresi dolmuş bağlantı. Lütfen yeni bir şifre sıfırlama talebi oluşturun.');
            return;
        }

        if (!allRulesMet) {
            setError('Lütfen tüm şifre kurallarını karşıladığınızdan emin olun.');
            return;
        }

        if (newPassword !== newPasswordAgain) {
            setError('Şifreler eşleşmiyor.');
            return;
        }

        setIsLoading(true);

        try {
            await authService.changePassword(token, newPassword, newPasswordAgain);
            setSuccess(true);
        } catch (err) {
            setError(err.message || 'Şifre değiştirme işlemi gerçekleştirilemedi.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 dark:bg-slate-900 px-6 py-12 relative overflow-hidden font-sans">
            {isLoading && <PlaneLoading />}

            {/* Immersive background decoration */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-0 overflow-hidden">
                <div className="absolute -top-40 -right-40 size-[600px] rounded-full bg-primary/5 blur-3xl"></div>
                <div className="absolute -bottom-40 -left-40 size-[600px] rounded-full bg-blue-500/5 blur-3xl"></div>
            </div>

            <div className="relative z-10 w-full max-w-md bg-white dark:bg-slate-800 rounded-[32px] border border-slate-100 dark:border-slate-700/50 shadow-2xl p-8 md:p-10 transition-all">
                
                {/* Logo Design matching the mockup */}
                <div className="flex justify-center mb-6">
                    <div className="relative size-12 flex items-center justify-center">
                        <div className="absolute top-0 left-0 size-8 rounded-xl bg-blue-600 rotate-12 opacity-80"></div>
                        <div className="absolute bottom-0 right-0 size-8 rounded-xl bg-primary shadow-lg border-2 border-white dark:border-slate-800"></div>
                    </div>
                </div>

                {!token ? (
                    <div className="text-center space-y-6">
                        <div className="size-16 bg-red-500/10 rounded-full flex items-center justify-center text-red-500 mx-auto">
                            <span className="material-icons-round text-3xl">link_off</span>
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-xl font-bold text-slate-800 dark:text-white">Geçersiz Bağlantı</h2>
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 leading-relaxed">
                                Şifre sıfırlama bağlantısı eksik veya geçersiz. Lütfen giriş sayfasından tekrar şifre sıfırlama isteği gönderin.
                            </p>
                        </div>
                        <button
                            onClick={() => navigate('/login')}
                            className="w-full bg-primary text-white p-3.5 rounded-2xl font-bold text-xs tracking-wider uppercase hover:shadow-lg hover:shadow-primary/20 active:scale-95 transition-all"
                        >
                            Giriş Sayfasına Git
                        </button>
                    </div>
                ) : success ? (
                    <div className="text-center space-y-6 animate-in fade-in duration-500">
                        <div className="size-16 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-500 mx-auto">
                            <span className="material-icons-round text-3xl">task_alt</span>
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-xl font-bold text-slate-800 dark:text-white">Şifre Değiştirildi</h2>
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 leading-relaxed">
                                Şifreniz başarıyla güncellenmiştir. Artık yeni şifrenizle giriş yapabilirsiniz.
                            </p>
                        </div>
                        <button
                            onClick={() => navigate('/login')}
                            className="w-full bg-primary text-white p-3.5 rounded-2xl font-bold text-xs tracking-wider uppercase hover:shadow-lg hover:shadow-primary/20 active:scale-95 transition-all text-center flex items-center justify-center gap-2"
                        >
                            Giriş Yap
                            <span className="material-icons-round text-sm">arrow_forward</span>
                        </button>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="text-center">
                            <h1 className="text-2xl font-black text-slate-800 dark:text-white mb-2">Change Your Password</h1>
                            <p className="text-[13px] font-medium text-slate-500 dark:text-slate-400">
                                Enter a new password below to change your password.
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* New Password Input */}
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">New password*</label>
                                <div className="relative">
                                    <input
                                        type={showNewPassword ? "text" : "password"}
                                        required
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="w-full h-11 bg-slate-50 dark:bg-slate-700/50 border border-slate-100 dark:border-slate-700 rounded-2xl pl-4 pr-12 text-xs font-bold text-slate-800 dark:text-white outline-none focus:border-primary transition-all"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowNewPassword(!showNewPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 size-8 flex items-center justify-center text-slate-400 hover:text-primary transition-colors"
                                    >
                                        <span className="material-icons-round text-lg">
                                            {showNewPassword ? 'visibility_off' : 'visibility'}
                                        </span>
                                    </button>
                                </div>
                            </div>

                            {/* Re-enter New Password Input */}
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Re-enter new password*</label>
                                <div className="relative">
                                    <input
                                        type={showConfirmPassword ? "text" : "password"}
                                        required
                                        value={newPasswordAgain}
                                        onChange={(e) => setNewPasswordAgain(e.target.value)}
                                        className="w-full h-11 bg-slate-50 dark:bg-slate-700/50 border border-slate-100 dark:border-slate-700 rounded-2xl pl-4 pr-12 text-xs font-bold text-slate-800 dark:text-white outline-none focus:border-primary transition-all"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 size-8 flex items-center justify-center text-slate-400 hover:text-primary transition-colors"
                                    >
                                        <span className="material-icons-round text-lg">
                                            {showConfirmPassword ? 'visibility_off' : 'visibility'}
                                        </span>
                                    </button>
                                </div>
                            </div>

                            {/* Password Rules Box */}
                            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-700/50 space-y-2">
                                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Your password must contain:</p>
                                <div className="grid grid-cols-1 gap-1.5">
                                    {[
                                        { key: 'length', label: 'Minimum 12 - Maksimum 16 karakter' },
                                        { key: 'uppercase', label: 'En az 1 büyük harf (A-Z)' },
                                        { key: 'lowercase', label: 'En az 1 küçük harf (a-z)' },
                                        { key: 'number', label: 'En az 1 rakam (0-9)' },
                                        { key: 'special', label: 'En az 1 özel karakter (!@#$%^&*)' },
                                    ].map(rule => {
                                        const isValid = validation[rule.key];
                                        return (
                                            <div key={rule.key} className="flex items-center gap-2">
                                                <span className={`material-icons-round text-sm transition-colors duration-200 ${isValid ? 'text-emerald-500' : 'text-slate-300 dark:text-slate-600'}`}>
                                                    check
                                                </span>
                                                <span className={`text-[11px] font-bold transition-colors duration-200 ${isValid ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'}`}>
                                                    {rule.label}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {error && (
                                <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-100/50 dark:border-red-900/30 rounded-2xl flex items-center gap-3 text-red-500 animate-in fade-in slide-in-from-top-2">
                                    <span className="material-icons-round text-lg shrink-0">error_outline</span>
                                    <span className="text-xs font-bold leading-normal">{error}</span>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={isLoading || !allRulesMet || !passwordsMatch}
                                className="w-full bg-primary text-white p-3.5 rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-lg shadow-primary/20 hover:shadow-primary/30 active:scale-[0.98] transition-all disabled:opacity-50 disabled:shadow-none mt-2"
                            >
                                Reset password
                            </button>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ResetPasswordPage;
