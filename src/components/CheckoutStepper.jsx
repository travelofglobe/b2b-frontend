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
        { id: 1, label: ls.roomSelection, icon: 'hotel' },
        { id: 2, label: ls.guestDetails, icon: 'group' },
        { id: 3, label: ls.payment, icon: 'payments' },
    ];

    return (
        <div className="w-full font-roboto">
            <div className="flex items-center w-full">
                {steps.map((step, index) => {
                    const isActive = step.id === currentStep;
                    const isCompleted = step.id < currentStep;
                    const isClickable = onStepClick && (step.id < currentStep || step.id === currentStep + 1);
                    const isLast = index === steps.length - 1;

                    return (
                        <React.Fragment key={step.id}>
                            {/* Step node */}
                            <div
                                onClick={() => isClickable && onStepClick(step.id)}
                                className={`flex flex-col items-center gap-1.5 shrink-0 ${isClickable ? 'cursor-pointer group' : 'cursor-default'}`}
                            >
                                {/* Circle */}
                                <div className={`relative flex items-center justify-center w-9 h-9 rounded-full border-2 transition-all duration-300 ${
                                    isActive
                                        ? 'bg-[#1a73e8] border-[#1a73e8] shadow-[0_0_0_4px_rgba(26,115,232,0.15)]'
                                        : isCompleted
                                            ? 'bg-[#e6f4ea] border-[#34a853] text-[#34a853] dark:bg-emerald-950/50 dark:border-emerald-500 dark:text-emerald-400'
                                            : 'bg-white dark:bg-[#303134] border-[#dadce0] dark:border-slate-600 text-[#9aa0a6]'
                                }`}>
                                    {isCompleted ? (
                                        <span className="material-symbols-outlined text-[18px] text-[#34a853] dark:text-emerald-400" style={{ fontVariationSettings: "'FILL' 1" }}>
                                            check_circle
                                        </span>
                                    ) : (
                                        <span className={`material-symbols-outlined text-[18px] transition-colors duration-300 ${
                                            isActive ? 'text-white' : 'text-[#9aa0a6] dark:text-slate-500'
                                        }`}>
                                            {step.icon}
                                        </span>
                                    )}

                                    {/* Pulse ring for active */}
                                    {isActive && (
                                        <span className="absolute inset-0 rounded-full bg-[#1a73e8]/20 animate-ping" />
                                    )}
                                </div>

                                {/* Label */}
                                <span className={`text-[10px] font-semibold uppercase tracking-wide transition-colors duration-300 whitespace-nowrap ${
                                    isActive
                                        ? 'text-[#1a73e8]'
                                        : isCompleted
                                            ? 'text-[#34a853] dark:text-emerald-400'
                                            : 'text-[#9aa0a6] dark:text-slate-500'
                                }`}>
                                    {step.label}
                                </span>
                            </div>

                            {/* Connector line */}
                            {!isLast && (
                                <div className="flex-1 h-px mx-2 mb-5 relative overflow-hidden rounded-full bg-[#e8eaed] dark:bg-slate-700">
                                    <div
                                        className="absolute inset-y-0 left-0 bg-[#34a853] transition-all duration-500 ease-out rounded-full"
                                        style={{ width: step.id < currentStep ? '100%' : '0%' }}
                                    />
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
