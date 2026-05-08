import React from 'react';

const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300"
                onClick={onClose}
            ></div>
            
            {/* Modal */}
            <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-[32px] shadow-2xl border border-white/50 dark:border-white/5 overflow-hidden animate-in zoom-in-95 fade-in duration-300">
                <div className="p-8">
                    {/* Icon */}
                    <div className="size-16 rounded-3xl bg-orange-500/10 flex items-center justify-center mb-6 mx-auto">
                        <span className="material-symbols-outlined text-orange-500 text-3xl">warning</span>
                    </div>
                    
                    {/* Content */}
                    <h3 className="text-xl font-black text-slate-900 dark:text-white text-center mb-2">{title}</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-center font-medium leading-relaxed mb-8">
                        {message}
                    </p>
                    
                    {/* Actions */}
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 px-6 py-4 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                        >
                            İptal
                        </button>
                        <button
                            onClick={() => {
                                onConfirm();
                                onClose();
                            }}
                            className="flex-1 px-6 py-4 rounded-2xl bg-primary text-white font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                        >
                            Evet, Devam Et
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal;
