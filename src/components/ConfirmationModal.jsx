import React from 'react';
import { createPortal } from 'react-dom';

const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message }) => {
    if (!isOpen) return null;

    const modalContent = (
        <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div 
                className="fixed inset-0 bg-slate-950/50 backdrop-blur-md animate-in fade-in duration-200"
                onClick={onClose}
            ></div>
            
            {/* Modal */}
            <div className="relative z-10 w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200/80 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 fade-in duration-200">
                <div className="p-5 sm:p-6">
                    {/* Icon */}
                    <div className="size-11 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center mb-4 mx-auto">
                        <span className="material-symbols-outlined text-xl">warning</span>
                    </div>
                    
                    {/* Content */}
                    <h3 className="text-base font-bold text-slate-900 dark:text-white text-center mb-1.5">{title}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 text-center font-normal leading-relaxed mb-5">
                        {message}
                    </p>
                    
                    {/* Actions */}
                    <div className="flex gap-2.5">
                        <button
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold text-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                        >
                            İptal
                        </button>
                        <button
                            onClick={() => {
                                onConfirm();
                                onClose();
                            }}
                            className="flex-1 px-4 py-2.5 rounded-xl bg-primary text-white font-semibold text-xs shadow-md shadow-primary/20 hover:scale-[1.01] active:scale-[0.98] transition-all"
                        >
                            Evet, Devam Et
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
};

export default ConfirmationModal;
