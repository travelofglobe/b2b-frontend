import React from 'react';
import { createPortal } from 'react-dom';
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

    const modalContent = (
        <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div 
                className="fixed inset-0 bg-slate-950/50 backdrop-blur-md transition-opacity animate-in fade-in duration-200"
                onClick={onClose}
            />

            {/* Modal Card */}
            <div className="relative z-10 w-full max-w-[360px] bg-white dark:bg-[#202124] rounded-lg shadow-xl border border-[#dadce0] dark:border-[#3c4043] p-5 overflow-hidden animate-in zoom-in-95 fade-in duration-200">
                {/* Header Row */}
                <div className="flex items-start gap-3.5 mb-3.5">
                    <div className="size-10 rounded-lg bg-red-500/10 dark:bg-red-500/20 text-red-600 dark:text-red-400 flex items-center justify-center flex-shrink-0">
                        <span className="material-symbols-outlined text-[20px]">{icon}</span>
                    </div>
                    <div className="flex-1 min-w-0 pr-5">
                        <h3 className="text-base font-bold text-[#202124] dark:text-white tracking-tight leading-snug">
                            {title}
                        </h3>
                        <p className="text-xs text-[#5f6368] dark:text-slate-400 font-medium leading-normal mt-0.5">
                            {message}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 size-7 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-[#f1f3f4] dark:hover:bg-[#3c4043] transition-all flex items-center justify-center cursor-pointer"
                    >
                        <span className="material-symbols-outlined text-[16px]">close</span>
                    </button>
                </div>

                {/* Account Context Card */}
                {user && (
                    <div className="mb-5 p-2.5 rounded-lg bg-[#f8f9fa] dark:bg-[#303134] border border-[#dadce0] dark:border-[#3c4043] flex items-center gap-2.5">
                        <div className="size-7 rounded-lg bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 font-bold text-xs uppercase flex-shrink-0">
                            {userName.charAt(0)}
                        </div>
                        <div className="flex flex-col min-w-0 flex-1">
                            <span className="text-xs font-bold text-[#202124] dark:text-slate-200 truncate leading-tight">{userName}</span>
                            {userEmail && <span className="text-[10.5px] text-[#5f6368] dark:text-slate-400 truncate leading-tight mt-0.5">{userEmail}</span>}
                        </div>
                    </div>
                )}

                {/* Footer Buttons */}
                <div className="flex items-center justify-end gap-2">
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="h-9 px-4 rounded-lg text-xs font-semibold text-[#5f6368] dark:text-slate-300 hover:bg-[#f1f3f4] dark:hover:bg-[#3c4043] transition-colors disabled:opacity-50 cursor-pointer"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isLoading}
                        className="h-9 px-4 rounded-lg text-xs font-bold text-white bg-red-600 hover:bg-red-700 shadow-sm transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
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

    return createPortal(modalContent, document.body);
};

export default ConfirmModal;
