import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { LogOut, Trash2, AlertTriangle, Info, X, Building2, Mail } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const ConfirmModal = ({ 
    isOpen, 
    onClose, 
    onConfirm, 
    title, 
    message, 
    confirmText = "Confirm", 
    cancelText = "Cancel", 
    type = "danger", 
    icon = "logout", 
    isLoading = false,
    showUserContext,
    agencyInfo
}) => {
    const { user } = useAuth();

    // Close on Escape key
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && isOpen && !isLoading) {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose, isLoading]);

    // Prevent body scroll when open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    const userEmail = user?.email;
    const userName = user?.name && user?.surname 
        ? `${user.name} ${user.surname}` 
        : userEmail || 'Account';

    const shouldShowUserContext = showUserContext !== undefined 
        ? showUserContext 
        : (icon === 'logout' || String(title || '').toLowerCase().includes('sign out') || String(title || '').toLowerCase().includes('çıkış'));

    const isLogout = icon === 'logout' || String(title || '').toLowerCase().includes('sign out') || String(title || '').toLowerCase().includes('çıkış');
    const isDanger = type === 'danger';
    const isWarning = type === 'warning';

    const displayAgencyName = agencyInfo?.name || user?.agencyName;
    const displayAgencyType = agencyInfo?.agencyType || user?.agencyType;
    const initial = userName ? userName[0].toUpperCase() : 'A';

    // Render modern icon
    const renderIcon = () => {
        if (icon === 'logout') {
            return <LogOut className="w-6 h-6 stroke-[2.2]" />;
        }
        if (icon === 'delete' || icon === 'delete_outline') {
            return <Trash2 className="w-6 h-6 stroke-[2.2]" />;
        }
        if (icon === 'warning') {
            return <AlertTriangle className="w-6 h-6 stroke-[2.2]" />;
        }
        if (icon === 'info') {
            return <Info className="w-6 h-6 stroke-[2.2]" />;
        }
        // Fallback for custom material icon string
        return <span className="material-symbols-outlined text-[24px]">{icon}</span>;
    };

    const modalContent = (
        <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 font-sans">
            {/* Backdrop */}
            <div 
                className="fixed inset-0 bg-slate-950/65 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
                onClick={isLoading ? undefined : onClose}
            />

            {/* Modal Card */}
            <div className="relative z-10 w-full max-w-[420px] bg-white dark:bg-[#1a202c] rounded-3xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.35)] dark:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7)] border border-slate-200/90 dark:border-slate-800 p-6 sm:p-7 overflow-hidden animate-in zoom-in-95 fade-in duration-200">
                {/* Decorative background glow for danger/logout */}
                {isDanger && (
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-48 h-28 bg-gradient-to-b from-rose-500/20 via-rose-500/10 to-transparent rounded-full blur-2xl pointer-events-none" />
                )}
                {isWarning && (
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-48 h-28 bg-gradient-to-b from-amber-500/20 via-amber-500/10 to-transparent rounded-full blur-2xl pointer-events-none" />
                )}

                {/* Close Button */}
                <button
                    type="button"
                    onClick={onClose}
                    disabled={isLoading}
                    className="absolute top-4 right-4 size-8 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/70 transition-colors flex items-center justify-center cursor-pointer disabled:opacity-50"
                >
                    <X className="w-4 h-4 stroke-[2.2]" />
                </button>

                {/* Icon Badge */}
                <div className={`w-14 h-14 mx-auto mb-4 rounded-2xl flex items-center justify-center shadow-lg ring-4 ${
                    isDanger 
                        ? 'bg-gradient-to-b from-rose-50 to-rose-100/70 dark:from-rose-500/15 dark:to-rose-500/5 border border-rose-200/80 dark:border-rose-500/25 text-rose-600 dark:text-rose-400 shadow-rose-500/10 ring-rose-50/70 dark:ring-rose-950/30' 
                        : isWarning
                        ? 'bg-gradient-to-b from-amber-50 to-amber-100/70 dark:from-amber-500/15 dark:to-amber-500/5 border border-amber-200/80 dark:border-amber-500/25 text-amber-600 dark:text-amber-400 shadow-amber-500/10 ring-amber-50/70 dark:ring-amber-950/30'
                        : 'bg-gradient-to-b from-blue-50 to-blue-100/70 dark:from-blue-500/15 dark:to-blue-500/5 border border-blue-200/80 dark:border-blue-500/25 text-[#1a73e8] dark:text-blue-400 shadow-blue-500/10 ring-blue-50/70 dark:ring-blue-950/30'
                }`}>
                    {renderIcon()}
                </div>

                {/* Header Text */}
                <div className="text-center mb-5">
                    <h3 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                        {title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed max-w-[340px] mx-auto">
                        {message}
                    </p>
                </div>

                {/* Account / User Context Card (when logging out or requested) */}
                {shouldShowUserContext && user && (
                    <div className="mb-6 p-3.5 rounded-2xl bg-slate-50/90 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 flex items-center gap-3.5 text-left">
                        <div className="size-10 rounded-xl bg-gradient-to-tr from-[#1a73e8] to-blue-600 text-white font-extrabold text-sm flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
                            {initial}
                        </div>
                        <div className="flex flex-col min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-slate-800 dark:text-white truncate">
                                    {userName}
                                </span>
                                {displayAgencyType && (
                                    <span className="px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200/60 dark:border-blue-800/60 text-[9px] font-bold text-[#1a73e8] dark:text-blue-400 uppercase tracking-wide shrink-0">
                                        {displayAgencyType}
                                    </span>
                                )}
                            </div>
                            {userEmail && (
                                <div className="flex items-center gap-1.5 text-[11px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
                                    <Mail className="w-3 h-3 shrink-0 opacity-70" />
                                    <span className="truncate">{userEmail}</span>
                                </div>
                            )}
                            {displayAgencyName && (
                                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                                    <Building2 className="w-3 h-3 shrink-0 text-slate-400 dark:text-slate-500" />
                                    <span className="truncate font-medium">{displayAgencyName}</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isLoading}
                        className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800/80 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 transition-all cursor-pointer disabled:opacity-50"
                    >
                        {cancelText}
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={isLoading}
                        className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white shadow-md active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer ${
                            isDanger
                                ? 'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 shadow-rose-600/25'
                                : isWarning
                                ? 'bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 shadow-amber-600/25'
                                : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-blue-600/25'
                        }`}
                    >
                        {isLoading ? (
                            <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>
                                {isLogout ? (
                                    <LogOut className="w-4 h-4 stroke-[2.2]" />
                                ) : icon === 'delete' || icon === 'delete_outline' ? (
                                    <Trash2 className="w-4 h-4 stroke-[2.2]" />
                                ) : null}
                                <span>{confirmText}</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
};

export default ConfirmModal;
