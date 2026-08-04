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
        <div className="w-full py-1">
            <div className="w-full">
                <div className="relative flex items-stretch gap-2 p-1.5 bg-slate-100/60 dark:bg-slate-800/40 backdrop-blur-xl rounded-2xl border border-white/50 dark:border-white/5 shadow-md shadow-slate-200/40 dark:shadow-none">
                    
                    {/* Animated Sliding Highlight */}
                    <div 
                        className="absolute top-1.5 bottom-1.5 bg-white dark:bg-slate-900 rounded-xl shadow-md transition-all duration-700 cubic-bezier(0.4, 0, 0.2, 1) z-0 border border-white/80 dark:border-white/5"
                        style={{ 
                            left: `calc(1.5px + ${(currentStep - 1) * (100 / steps.length)}%)`,
                            width: `calc(${100 / steps.length}% - 3px)`
                        }}
                    >
                        <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 to-transparent rounded-xl"></div>
                    </div>

                    {steps.map((step) => {
                        const isClickable = onStepClick && (step.id < currentStep || step.id === currentStep + 1);
                        const isActive = step.id === currentStep;
                        const isCompleted = step.id < currentStep;
                        
                        return (
                            <div 
                                key={step.id}
                                onClick={() => isClickable && onStepClick(step.id)}
                                className={`relative flex-1 flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all duration-500 z-10 ${
                                    isClickable ? 'cursor-pointer hover:bg-white/40 dark:hover:bg-white/5' : 'cursor-default'
                                }`}
                            >
                                {/* Icon with background */}
                                <div className={`size-8 rounded-lg flex items-center justify-center transition-all duration-700 ${
                                    isActive 
                                        ? 'bg-primary text-white shadow-md shadow-primary/30 scale-105' 
                                        : isCompleted 
                                            ? 'bg-emerald-500/10 text-emerald-500' 
                                            : 'bg-slate-200/50 dark:bg-slate-700/50 text-slate-400'
                                }`}>
                                    <span className="material-symbols-outlined text-base">
                                        {isCompleted ? 'check_circle' : step.icon}
                                    </span>
                                </div>

                                {/* Text Info */}
                                <div className="flex flex-col">
                                    <span className={`text-[9px] font-semibold uppercase tracking-wider transition-colors duration-500 ${
                                        isActive ? 'text-primary' : isCompleted ? 'text-emerald-500' : 'text-slate-400'
                                    }`}>
                                        {step.desc}
                                    </span>
                                    <span className={`text-xs font-bold transition-colors duration-500 whitespace-nowrap ${
                                        isActive ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'
                                    }`}>
                                        {step.label}
                                    </span>
                                </div>

                                {/* Active indicator dot */}
                                {isActive && (
                                    <div className="absolute right-2.5 size-1.5 bg-primary rounded-full animate-pulse shadow-[0_0_8px_rgba(255,59,92,0.8)]"></div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Progress bar subtle under-line */}
                <div className="mt-2 h-1 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden px-0.5">
                    <div 
                        className="h-full bg-gradient-to-r from-primary via-primary/80 to-primary/40 rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(255,59,92,0.3)]"
                        style={{ width: `${(currentStep / steps.length) * 100}%` }}
                    ></div>
                </div>
            </div>
        </div>
    );
};

export default CheckoutStepper;
