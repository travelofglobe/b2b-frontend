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
        <div className="w-full py-1 font-roboto">
            <div className="w-full">
                <div className="relative flex items-stretch gap-2 p-1.5 bg-white dark:bg-[#202124] rounded-xl border border-[#dadce0] dark:border-slate-700 shadow-xs">
                    
                    {/* Animated Sliding Highlight */}
                    <div 
                        className="absolute top-1.5 bottom-1.5 bg-[#e8f0fe] dark:bg-blue-950/40 rounded-lg transition-all duration-500 ease-out z-0 border border-[#d2e3fc] dark:border-blue-900/60"
                        style={{ 
                            left: `calc(1.5px + ${(currentStep - 1) * (100 / steps.length)}%)`,
                            width: `calc(${100 / steps.length}% - 3px)`
                        }}
                    />

                    {steps.map((step) => {
                        const isClickable = onStepClick && (step.id < currentStep || step.id === currentStep + 1);
                        const isActive = step.id === currentStep;
                        const isCompleted = step.id < currentStep;
                        
                        return (
                            <div 
                                key={step.id}
                                onClick={() => isClickable && onStepClick(step.id)}
                                className={`relative flex-1 flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all z-10 ${
                                    isClickable ? 'cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40' : 'cursor-default'
                                }`}
                            >
                                {/* Icon with background */}
                                <div className={`size-7 rounded-full flex items-center justify-center transition-all ${
                                    isActive 
                                        ? 'bg-[#1a73e8] text-white shadow-xs' 
                                        : isCompleted 
                                            ? 'bg-[#e6f4ea] text-[#137333] dark:bg-emerald-950/40 dark:text-emerald-400' 
                                            : 'bg-[#f1f3f4] dark:bg-slate-800 text-[#70757a]'
                                }`}>
                                    <span className="material-symbols-outlined text-[15px]">
                                        {isCompleted ? 'check' : step.icon}
                                    </span>
                                </div>

                                {/* Text Info */}
                                <div className="flex flex-col min-w-0">
                                    <span className={`text-[10px] font-medium uppercase tracking-wider transition-colors ${
                                        isActive ? 'text-[#1a73e8]' : isCompleted ? 'text-[#137333] dark:text-emerald-400' : 'text-[#70757a]'
                                    }`}>
                                        {step.desc}
                                    </span>
                                    <span className={`text-xs font-medium transition-colors truncate ${
                                        isActive ? 'text-[#202124] dark:text-white font-semibold' : 'text-[#5f6368] dark:text-slate-400'
                                    }`}>
                                        {step.label}
                                    </span>
                                </div>

                                {/* Active indicator dot */}
                                {isActive && (
                                    <div className="ml-auto mr-1 size-1.5 bg-[#1a73e8] rounded-full"></div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Progress bar */}
                <div className="mt-2 h-1 w-full bg-[#e8eaed] dark:bg-slate-800 rounded-full overflow-hidden">
                    <div 
                        className="h-full bg-[#1a73e8] rounded-full transition-all duration-700 ease-out"
                        style={{ width: `${(currentStep / steps.length) * 100}%` }}
                    ></div>
                </div>
            </div>
        </div>
    );
};

export default CheckoutStepper;
