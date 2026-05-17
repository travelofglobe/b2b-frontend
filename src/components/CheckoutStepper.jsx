import React from 'react';
import { useTranslation } from 'react-i18next';

const stepperLocales = {
    en: {
        step: "Step",
        roomSelection: "Room Selection",
        guestDetails: "Guest Details",
        payment: "Payment"
    },
    tr: {
        step: "Adım",
        roomSelection: "Oda Seçimi",
        guestDetails: "Konuk Bilgileri",
        payment: "Ödeme"
    },
    ar: {
        step: "الخطوة",
        roomSelection: "اختيار الغرفة",
        guestDetails: "تفاصيل النزلاء",
        payment: "الدفع"
    },
    es: {
        step: "Paso",
        roomSelection: "Selección de Habitación",
        guestDetails: "Detalles del Huésped",
        payment: "Pago"
    },
    ru: {
        step: "Шаг",
        roomSelection: "Выбор номера",
        guestDetails: "Данные гостей",
        payment: "Оплата"
    },
    zh: {
        step: "步骤",
        roomSelection: "选择客房",
        guestDetails: "旅客信息",
        payment: "支付"
    },
    ja: {
        step: "ステップ",
        roomSelection: "客室選択",
        guestDetails: "宿泊者情報",
        payment: "お支払い"
    },
    fa: {
        step: "مرحله",
        roomSelection: "انتخاب اتاق",
        guestDetails: "اطلاعات مهمانان",
        payment: "پرداخت"
    },
    fr: {
        step: "Étape",
        roomSelection: "Choix de Chambre",
        guestDetails: "Coordonnées Voyageurs",
        payment: "Paiement"
    },
    it: {
        step: "Passo",
        roomSelection: "Scelta della Camera",
        guestDetails: "Dettagli Ospite",
        payment: "Pagamento"
    },
    el: {
        step: "Βήμα",
        roomSelection: "Επιλογή Δωματίου",
        guestDetails: "Στοιχεία Επισκεπτών",
        payment: "Πληρωμή"
    },
    pt: {
        step: "Passo",
        roomSelection: "Seleção do Quarto",
        guestDetails: "Detalhes do Hóspede",
        payment: "Pagamento"
    }
};

const CheckoutStepper = ({ currentStep, onStepClick }) => {
    const { i18n } = useTranslation();
    const currentLang = i18n.language || localStorage.getItem('language') || 'tr';
    const ls = stepperLocales[currentLang] || stepperLocales['tr'];

    const steps = [
        { id: 1, label: ls.roomSelection, icon: 'hotel', desc: `${ls.step} 1` },
        { id: 2, label: ls.guestDetails, icon: 'group', desc: `${ls.step} 2` },
        { id: 3, label: ls.payment, icon: 'payments', desc: `${ls.step} 3` }
    ];

    return (
        <div className="w-full py-6 mb-2 overflow-hidden">
            <div className="max-w-4xl mx-auto px-6">
                <div className="relative flex items-stretch gap-4 p-2 bg-slate-100/50 dark:bg-slate-800/30 backdrop-blur-xl rounded-[32px] border border-white/50 dark:border-white/5 shadow-2xl shadow-slate-200/50 dark:shadow-none">
                    
                    {/* Animated Sliding Highlight */}
                    <div 
                        className="absolute top-2 bottom-2 bg-white dark:bg-slate-900 rounded-[24px] shadow-xl transition-all duration-700 cubic-bezier(0.4, 0, 0.2, 1) z-0 border border-white dark:border-white/5"
                        style={{ 
                            left: `calc(2px + ${(currentStep - 1) * (100 / steps.length)}%)`,
                            width: `calc(${100 / steps.length}% - 4px)`
                        }}
                    >
                        <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 to-transparent rounded-[24px]"></div>
                    </div>

                    {steps.map((step) => {
                        const isClickable = onStepClick && (step.id < currentStep || step.id === currentStep + 1);
                        const isActive = step.id === currentStep;
                        const isCompleted = step.id < currentStep;
                        
                        return (
                            <div 
                                key={step.id}
                                onClick={() => isClickable && onStepClick(step.id)}
                                className={`relative flex-1 flex items-center gap-4 px-6 py-4 rounded-[24px] transition-all duration-500 z-10 ${
                                    isClickable ? 'cursor-pointer hover:bg-white/40 dark:hover:bg-white/5' : 'cursor-default'
                                }`}
                            >
                                {/* Icon with background */}
                                <div className={`size-12 rounded-2xl flex items-center justify-center transition-all duration-700 ${
                                    isActive 
                                        ? 'bg-primary text-white shadow-lg shadow-primary/30 scale-110 rotate-3' 
                                        : isCompleted 
                                            ? 'bg-emerald-500/10 text-emerald-500' 
                                            : 'bg-slate-200/50 dark:bg-slate-700/50 text-slate-400'
                                }`}>
                                    <span className="material-symbols-outlined text-[22px]">
                                        {isCompleted ? 'check_circle' : step.icon}
                                    </span>
                                </div>

                                {/* Text Info */}
                                <div className="flex flex-col">
                                    <span className={`text-[10px] font-black uppercase tracking-[0.2em] transition-colors duration-500 ${
                                        isActive ? 'text-primary' : isCompleted ? 'text-emerald-500' : 'text-slate-400'
                                    }`}>
                                        {step.desc}
                                    </span>
                                    <span className={`text-sm font-black transition-colors duration-500 whitespace-nowrap ${
                                        isActive ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'
                                    }`}>
                                        {step.label}
                                    </span>
                                </div>

                                {/* Active indicator dot */}
                                {isActive && (
                                    <div className="absolute right-4 size-1.5 bg-primary rounded-full animate-pulse shadow-[0_0_10px_rgba(255,59,92,0.8)]"></div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Progress bar subtle under-line */}
                <div className="mt-6 h-1 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden px-1">
                    <div 
                        className="h-full bg-gradient-to-r from-primary via-primary/80 to-primary/40 rounded-full transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(255,59,92,0.3)]"
                        style={{ width: `${(currentStep / steps.length) * 100}%` }}
                    ></div>
                </div>
            </div>
        </div>
    );
};

export default CheckoutStepper;
