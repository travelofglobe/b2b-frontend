import React from 'react';

const CheckoutStepper = ({ currentStep, onStepClick }) => {
    const steps = [
        { id: 1, label: 'Oda Seçimi', status: currentStep > 1 ? 'completed' : (currentStep === 1 ? 'active' : 'pending') },
        { id: 2, label: 'Konuk Bilgileri', status: currentStep > 2 ? 'completed' : (currentStep === 2 ? 'active' : 'pending') },
        { id: 3, label: 'Ödeme', status: currentStep > 3 ? 'completed' : (currentStep === 3 ? 'active' : 'pending') }
    ];

    return (
        <div className="flex items-center justify-center w-full py-8 mb-8 overflow-x-auto no-scrollbar">
            <div className="flex items-center gap-4 min-w-max px-4">
                {steps.map((step, index) => {
                    const isClickable = onStepClick && (step.id < currentStep || step.id === currentStep + 1);
                    
                    return (
                        <React.Fragment key={step.id}>
                            <div 
                                onClick={() => isClickable && onStepClick(step.id)}
                                className={`flex items-center gap-3 ${isClickable ? 'cursor-pointer group' : 'cursor-default'}`}
                            >
                                <div className={`size-10 rounded-full flex items-center justify-center text-sm font-black transition-all duration-500 shadow-sm border-2 ${
                                    step.status === 'completed' 
                                        ? 'bg-primary border-primary text-white group-hover:scale-110' 
                                        : (step.status === 'active' 
                                            ? 'bg-white dark:bg-slate-900 border-primary text-primary shadow-[0_0_20px_rgba(255,59,92,0.15)] group-hover:scale-110' 
                                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400')
                                }`}>
                                    {step.status === 'completed' ? (
                                        <span className="material-symbols-outlined text-xl">check</span>
                                    ) : (
                                        step.id
                                    )}
                                </div>
                                <span className={`text-xs font-black uppercase tracking-widest transition-colors duration-500 ${
                                    step.status === 'active' || step.status === 'completed'
                                        ? 'text-slate-900 dark:text-white'
                                        : 'text-slate-400'
                                } ${isClickable ? 'group-hover:text-primary' : ''}`}>
                                    {step.label}
                                </span>
                            </div>
                            
                            {index < steps.length - 1 && (
                                <div className="w-16 h-[2px] bg-slate-100 dark:bg-slate-800 relative overflow-hidden mx-2">
                                    <div className={`absolute inset-0 bg-primary transition-all duration-1000 transform origin-left ${
                                        step.status === 'completed' ? 'translate-x-0' : '-translate-x-full'
                                    }`}></div>
                                </div>
                            )}
                        </React.Fragment>
                    );
                })}
            </div>
        </div>
    );
};

export default CheckoutStepper;
