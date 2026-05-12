import React from 'react';

const NON_REFUNDABLE_TEXT = {
  "tr": "Rezervasyonun iptali veya kullanılmaması durumunda rezervasyon tutarı iade edilmeyecektir.",
  "en": "In case of cancellation or non-usage of the reservation, the reservation amount will not be refunded.",
  "de": "Im Falle einer Stornierung oder Nichtnutzung der Reservierung wird der Reservierungsbetrag nicht erstattet.",
  "fr": "En cas d’annulation ou de non-utilisation de la réservation, le montant de la réservation ne sera pas remboursé.",
  "ru": "В случае отмены бронирования или неиспользования бронирования сумма бронирования не возвращается.",
  "es": "En caso de cancelación o no utilización de la reserva, el importe de la reserva no será reembolsado.",
  "it": "In caso di cancellazione o mancato utilizzo della prenotazione, l'importo della prenotazione non sarà rimborsato."
};

const RefundPolicyTooltip = ({ isRefundable, className, textOverride }) => {
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
        <div className={`group/nonref relative inline-flex items-center gap-1 cursor-help ${className}`}>
            <span>{textOverride || 'Non-Refundable'}</span>
            <span className="material-symbols-outlined text-[1.2em]">info</span>
            
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-4 bg-slate-900 dark:bg-slate-950 text-white rounded-2xl shadow-2xl opacity-0 invisible group-hover/nonref:opacity-100 group-hover/nonref:visible transition-all z-[100] border border-slate-700/50 scale-95 group-hover/nonref:scale-100 origin-bottom duration-300">
                <div className="flex items-center gap-2 mb-3 pb-3 border-b border-white/10">
                    <span className="material-symbols-outlined text-sm text-red-400">policy</span>
                    <span className="text-[11px] font-black uppercase tracking-widest text-slate-200">
                        {currentLang === 'tr' ? 'İptal Politikası' : 'Cancellation Policy'}
                    </span>
                </div>
                <div className="mb-2 text-[12px] font-bold text-red-400">
                    {currentLang === 'tr' ? 'Geri ödeme yok' : 'No refund'}
                </div>
                <p className="text-[10px] font-medium leading-relaxed whitespace-normal normal-case text-slate-300 text-left">
                    {tooltipText}
                </p>
                <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-900 dark:border-t-slate-950"></div>
            </div>
        </div>
    );
};

export default RefundPolicyTooltip;
