import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

const NON_REFUNDABLE_TEXT = {
  "tr": "Rezervasyonun iptali veya kullanılmaması durumunda rezervasyon tutarı iade edilmeyecektir.",
  "en": "In case of cancellation or non-usage of the reservation, the reservation amount will not be refunded.",
  "de": "Im Falle einer Stornierung oder Nichtnutzung der Reservierung wird der Reservierungsbetrag nicht erstattet.",
  "fr": "En cas d’annulation ou de non-utilisation de la réservation, le montant de la réservation ne sera pas remboursé.",
  "ru": "В случае отмены бронирования или неиспользования бронирования сумма бронирования не возвращается.",
  "es": "En caso de cancelación o no utilización de la reserva, el importe de la reserva no será reembolsado.",
  "it": "In caso di cancellazione o mancato utilizzo della prenotazione, l'importo della prenotazione non sarà rimborsato.",
  "ar": "في حال إلغاء الحجز أو عدم استخدامه، لن يتم استرداد مبلغ الحجز.",
  "zh": "如果取消或未使用预订，预订金额将不予退还。",
  "ja": "予約のキャンセルまたは不使用の場合、予約金額は返金されません。",
  "fa": "در صورت لغو رزرو یا عدم استفاده از آن، مبلغ رزرو مسترد نخواهد شد.",
  "el": "Σε περίπτωση ακύρωσης ή μη χρήσης της κράτησης, το ποσό της κράτησης δεν θα επιστραφεί.",
  "pt": "Em caso de cancelamento ou não utilização da reserva, o valor da reserva não será reembolsado."
};

const POLICY_TITLE = {
  en: "Cancellation Policy", tr: "İptal Politikası", ar: "سياسة الإلغاء", es: "Política de Cancelación", ru: "Правила отмены", zh: "取消政策", ja: "キャンセルポリシー", fa: "قوانین کنسلی", fr: "Politique d'Annulation", it: "Politica di Cancellazione", el: "Πολιτική Ακύρωσης", pt: "Política de Cancelamento"
};

const NO_REFUND_SUB = {
  en: "No refund", tr: "Geri ödeme yok", ar: "لا يوجد استرداد", es: "Sin reembolso", ru: "Без возврата средств", zh: "不可退款", ja: "返金なし", fa: "بدون استرداد", fr: "Aucun remboursement", it: "Nessun rimborso", el: "Χωρίς επιστροφή χρημάτων", pt: "Sem reembolso"
};

const RefundPolicyTooltip = ({ isRefundable, className, textOverride }) => {
    const [isHovered, setIsHovered] = useState(false);
    const [coords, setCoords] = useState({ top: 0, left: 0 });
    const triggerRef = useRef(null);

    const updatePosition = () => {
        if (triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            setCoords({
                left: rect.left + rect.width / 2,
                top: rect.top,
            });
        }
    };

    const handleMouseEnter = () => {
        updatePosition();
        setIsHovered(true);
    };

    const handleMouseLeave = () => {
        setIsHovered(false);
    };

    useEffect(() => {
        if (isHovered) {
            window.addEventListener('scroll', updatePosition, true);
            window.addEventListener('resize', updatePosition, true);
        }
        return () => {
            window.removeEventListener('scroll', updatePosition, true);
            window.removeEventListener('resize', updatePosition, true);
        };
    }, [isHovered]);

    if (isRefundable) {
        return (
            <span className={className}>
                {textOverride || 'Refundable'}
            </span>
        );
    }

    const currentLang = localStorage.getItem('language') || 'tr';
    const tooltipText = NON_REFUNDABLE_TEXT[currentLang] || NON_REFUNDABLE_TEXT['en'];

    return (
        <>
            <div 
                ref={triggerRef}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                className={`relative inline-flex items-center gap-1 cursor-help ${className}`}
            >
                <span>{textOverride || 'Non-Refundable'}</span>
                <span className="material-symbols-outlined text-[1.2em]">info</span>
            </div>

            {isHovered && createPortal(
                <div 
                    className="fixed z-[99999] pointer-events-none transition-all duration-300 animate-in fade-in zoom-in-95"
                    style={{
                        left: `${coords.left}px`,
                        top: `${coords.top}px`,
                        transform: 'translate(-50%, -100%)',
                        marginTop: '-8px' // Offset to provide space above trigger
                    }}
                >
                    <div className="w-64 p-4 bg-slate-900 dark:bg-slate-950 text-white rounded-2xl shadow-2xl border border-slate-700/50 relative">
                        <div className="flex items-center gap-2 mb-3 pb-3 border-b border-white/10">
                            <span className="material-symbols-outlined text-sm text-red-400">policy</span>
                            <span className="text-[11px] font-black uppercase tracking-widest text-slate-200">
                                {POLICY_TITLE[currentLang] || POLICY_TITLE['en']}
                            </span>
                        </div>
                        <div className="mb-2 text-[12px] font-bold text-red-400">
                            {NO_REFUND_SUB[currentLang] || NO_REFUND_SUB['en']}
                        </div>
                        <p className="text-[10px] font-medium leading-relaxed whitespace-normal normal-case text-slate-300 text-left">
                            {tooltipText}
                        </p>
                        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-[1px] border-[6px] border-transparent border-t-slate-900 dark:border-t-slate-950"></div>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
};

export default RefundPolicyTooltip;
