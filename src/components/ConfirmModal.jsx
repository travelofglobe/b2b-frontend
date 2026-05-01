import React from 'react';

const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, confirmText = "Confirm", cancelText = "Cancel", type = "danger", isLoading = false }) => {
    if (!isOpen) return null;

    const colors = {
        danger: {
            bg: "bg-red-500",
            text: "text-red-500",
            light: "bg-red-50",
            border: "border-red-100",
            shadow: "shadow-red-500/20"
        },
        warning: {
            bg: "bg-amber-500",
            text: "text-amber-500",
            light: "bg-amber-50",
            border: "border-amber-100",
            shadow: "shadow-amber-500/20"
        }
    }[type] || {
        bg: "bg-blue-500",
        text: "text-blue-500",
        light: "bg-blue-50",
        border: "border-blue-100",
        shadow: "shadow-blue-500/20"
    };

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 overflow-hidden">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity" onClick={onClose} />

            {/* Content */}
            <div className="relative bg-white dark:bg-[#0B1120] w-full max-w-md rounded-[40px] shadow-2xl flex flex-col border border-slate-100 dark:border-white/5 animate-in fade-in zoom-in-95 duration-200">
                
                <div className="p-10 flex flex-col items-center text-center">
                    {/* Icon Circle */}
                    <div className={`size-20 ${colors.light} dark:bg-opacity-10 rounded-[32px] flex items-center justify-center ${colors.text} mb-8 shadow-xl ${colors.shadow} border ${colors.border} dark:border-opacity-10`}>
                        <span className="material-icons-round text-4xl">{type === 'danger' ? 'delete_sweep' : 'warning'}</span>
                    </div>

                    <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-none mb-3">
                        {title}
                    </h2>
                    <p className="text-[13px] font-bold text-slate-400 leading-relaxed max-w-[280px]">
                        {message}
                    </p>
                </div>

                {/* Footer Actions */}
                <div className="p-8 border-t border-slate-50 dark:border-white/5 flex flex-col sm:flex-row gap-3">
                    <button 
                        onClick={onClose}
                        disabled={isLoading}
                        className="flex-1 h-14 rounded-2xl text-[12px] font-black text-slate-500 uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-50"
                    >
                        {cancelText}
                    </button>
                    <button 
                        onClick={onConfirm}
                        disabled={isLoading}
                        className={`flex-1 h-14 ${colors.bg} text-white rounded-2xl text-[12px] font-black uppercase tracking-widest shadow-xl ${colors.shadow} hover:scale-[1.02] active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-2`}
                    >
                        {isLoading ? (
                            <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
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
