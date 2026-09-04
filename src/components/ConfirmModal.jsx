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
    isLoading = false,
    showUserContext,
    agencyInfo
}) => {
    const { user } = useAuth();
    if (!isOpen) return null;

    const userEmail = user?.email;
    const userName = user?.name && user?.surname 
        ? `${user.name} ${user.surname}` 
        : userEmail || 'Account';

    const shouldShowUserContext = showUserContext !== undefined 
        ? showUserContext 
        : (icon === 'logout' || String(title || '').toLowerCase().includes('sign out') || String(title || '').toLowerCase().includes('çıkış'));

    const isDanger = type === 'danger';
    const isWarning = type === 'warning';

    const modalContent = (
        <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 font-roboto">
            {/* Backdrop */}
            <div 
                className="fixed inset-0 bg-black/50 backdrop-blur-[2px] transition-opacity animate-in fade-in duration-200"
                onClick={onClose}
            />

            {/* Modal Card */}
            <div className="relative z-10 w-full max-w-[400px] bg-white dark:bg-[#202124] rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-[#dadce0] dark:border-[#3c4043] p-6 overflow-hidden animate-in zoom-in-95 fade-in duration-200">
                {/* Header Row */}
                <div className="flex items-start gap-3.5 mb-2">
                    <div className={`size-11 rounded-full flex items-center justify-center flex-shrink-0 ${
                        isDanger 
                            ? 'bg-[#fce8e6] dark:bg-red-950/40 text-[#d93025] dark:text-red-400' 
                            : isWarning
                            ? 'bg-[#fef7e0] dark:bg-amber-950/40 text-[#b06000] dark:text-amber-400'
                            : 'bg-[#e8f0fe] dark:bg-blue-950/40 text-[#1a73e8] dark:text-[#8ab4f8]'
                    }`}>
                        <span className="material-symbols-outlined text-[22px]">{icon}</span>
                    </div>
                    <div className="flex-1 min-w-0 pr-6">
                        <h3 className="text-[17px] font-semibold text-[#202124] dark:text-white tracking-normal leading-snug">
                            {title}
                        </h3>
                        <p className="text-[13px] text-[#5f6368] dark:text-slate-400 font-normal leading-relaxed mt-1">
                            {message}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="absolute top-4 right-4 size-8 rounded-full text-[#70757a] dark:text-slate-400 hover:bg-[#f1f3f4] dark:hover:bg-[#303134] transition-colors flex items-center justify-center cursor-pointer"
                    >
                        <span className="material-symbols-outlined text-[18px]">close</span>
                    </button>
                </div>

                {/* Account Context Card (Google Profile Badge) */}
                {shouldShowUserContext && user && (
                    <div className="my-4 p-3 rounded-xl bg-[#f8f9fa] dark:bg-[#303134]/50 border border-[#dadce0] dark:border-[#3c4043] flex items-center gap-3">
                        <div className="size-10 rounded-full bg-[#1a73e8] text-white flex items-center justify-center font-medium text-base select-none shadow-xs shrink-0">
                            {userName.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex flex-col min-w-0 flex-1">
                            <span className="text-[14px] font-medium text-[#202124] dark:text-white truncate leading-tight">
                                {userName}
                            </span>
                            {userEmail && (
                                <span className="text-[12px] font-normal text-[#5f6368] dark:text-slate-400 truncate leading-tight mt-0.5">
                                    {userEmail}
                                </span>
                            )}
                            {(agencyInfo?.name || user?.agencyName) && (
                                <div className="flex items-center gap-1.5 mt-1">
                                    {(agencyInfo?.agencyType || user?.agencyType) && (
                                        <span className="px-1.5 py-0.5 rounded text-[10px] font-medium uppercase bg-[#e8f0fe] text-[#1a73e8] dark:bg-[#1a73e8]/20 dark:text-[#8ab4f8] leading-none">
                                            {agencyInfo?.agencyType || user?.agencyType}
                                        </span>
                                    )}
                                    <span className="text-[11px] text-[#70757a] dark:text-slate-400 truncate">
                                        {agencyInfo?.name || user?.agencyName}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Footer Buttons */}
                <div className="flex items-center justify-end gap-2.5 mt-5">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isLoading}
                        className="h-10 px-4 rounded-lg text-[14px] font-medium text-[#1a73e8] dark:text-[#8ab4f8] hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors disabled:opacity-50 cursor-pointer"
                    >
                        {cancelText}
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={isLoading}
                        className={`h-10 px-5 rounded-lg text-[14px] font-medium text-white shadow-xs active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer ${
                            isDanger
                                ? 'bg-[#d93025] hover:bg-[#c5221f]'
                                : 'bg-[#1a73e8] hover:bg-[#1765cc]'
                        }`}
                    >
                        {isLoading ? (
                            <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
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
