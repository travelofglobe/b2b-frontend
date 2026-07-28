import React from 'react';
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
    isLoading = false 
}) => {
    const { user } = useAuth();
    if (!isOpen) return null;

    const userEmail = user?.email;
    const userName = user?.name && user?.surname 
        ? `${user.name} ${user.surname}` 
        : userEmail || 'Account';

    return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-slate-950/40 backdrop-blur-md transition-opacity animate-in fade-in duration-200"
                onClick={onClose}
            />

            {/* Modal Card */}
            <div className="relative w-full max-w-[360px] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200/80 dark:border-slate-800 p-5 overflow-hidden animate-in zoom-in-95 fade-in duration-200">
                {/* Header Row */}
                <div className="flex items-start gap-3.5 mb-3.5">
                    <div className="size-10 rounded-xl bg-red-500/10 dark:bg-red-500/20 text-red-600 dark:text-red-400 flex items-center justify-center flex-shrink-0">
                        <span className="material-symbols-outlined text-[20px]">{icon}</span>
                    </div>
                    <div className="flex-1 min-w-0 pr-5">
                        <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight leading-snug">
                            {title}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-normal mt-0.5">
                            {message}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 size-7 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all flex items-center justify-center cursor-pointer"
                    >
                        <span className="material-symbols-outlined text-[16px]">close</span>
                    </button>
                </div>

                {/* Account Context Card */}
                {user && (
                    <div className="mb-5 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center gap-2.5">
                        <div className="size-7 rounded-lg bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 font-bold text-xs uppercase flex-shrink-0">
                            {userName.charAt(0)}
                        </div>
                        <div className="flex flex-col min-w-0 flex-1">
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate leading-tight">{userName}</span>
                            {userEmail && <span className="text-[10.5px] text-slate-400 dark:text-slate-500 truncate leading-tight mt-0.5">{userEmail}</span>}
                        </div>
                    </div>
                )}

                {/* Footer Buttons */}
                <div className="flex items-center justify-end gap-2">
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="h-9 px-4 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50 cursor-pointer"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isLoading}
                        className="h-9 px-4 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-700 shadow-sm transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                        {isLoading ? (
                            <div className="size-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            confirmText
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;
