import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { COMMON, getLang } from '../utils/sharedLocales';
import { useTranslation } from 'react-i18next';
import Header from '../components/Header';
import Footer from '../components/Footer';
import RefundPolicyTooltip from '../components/RefundPolicyTooltip';
import { useAuth, getCurrencySymbol } from '../context/AuthContext';

const CR = {
    en: { confirmed: 'Booking Confirmed!', failed: 'Booking Failed', successMsg: 'Your reservation has been processed successfully.', failMsg: 'There was an issue processing your reservation. Please contact support.', bookingRef: 'Booking Reference', viewDetails: 'Click to view full booking details', goBookings: 'Go to Bookings', allBookings: 'All Bookings', verified: 'Verified • Click for details', actionRequired: 'Action Required', property: 'Property', totalAmount: 'Total Amount', status: 'Status', travelerBreakdown: 'Traveler Breakdown', room: 'Room', noSession: 'No active booking session found.', dashboard: 'Go to Dashboard', printVoucher: 'Print Voucher', detailBtn: 'Detail' },
    tr: { confirmed: 'Rezervasyon Onaylandı!', failed: 'Rezervasyon Başarısız', successMsg: 'Rezervasyonunuz başarıyla işlendi.', failMsg: 'Rezervasyonunuz işlenirken bir sorun oluştu. Lütfen destek ile iletişime geçin.', bookingRef: 'Rezervasyon Referansı', viewDetails: 'Tam rezervasyon detaylarını görüntüle', goBookings: 'Rezervasyonlara Git', allBookings: 'Tüm Rezervasyonlar', verified: 'Doğrulandı • Detaylar için tıkla', actionRequired: 'İşlem Gerekli', property: 'Otel', totalAmount: 'Toplam Tutar', status: 'Durum', travelerBreakdown: 'Yolcu Listesi', room: 'Oda', noSession: 'Aktif rezervasyon oturumu bulunamadı.', dashboard: 'Panele Git', printVoucher: 'Voucher Yazdır', detailBtn: 'Detay' },
    ar: { confirmed: 'تم تأكيد الحجز!', failed: 'فشل الحجز', successMsg: 'تمت معالجة حجزك بنجاح.', failMsg: 'حدثت مشكلة أثناء معالجة حجزك. يرجى التواصل مع الدعم.', bookingRef: 'مرجع الحجز', viewDetails: 'انقر لعرض تفاصيل الحجز', goBookings: 'الذهاب إلى الحجوزات', allBookings: 'جميع الحجوزات', verified: 'تم التحقق • انقر للتفاصيل', actionRequired: 'إجراء مطلوب', property: 'الفندق', totalAmount: 'المبلغ الإجمالي', status: 'الحالة', travelerBreakdown: 'قائمة المسافرين', room: 'غرفة', noSession: 'لم يتم العثور على جلسة حجز نشطة.', dashboard: 'لوحة التحكم', printVoucher: 'طباعة الإيصال' },
    es: { confirmed: '¡Reserva Confirmada!', failed: 'Reserva Fallida', successMsg: 'Su reserva ha sido procesada con éxito.', failMsg: 'Hubo un problema al procesar su reserva. Contacte con soporte.', bookingRef: 'Referencia de Reserva', viewDetails: 'Ver detalles completos', goBookings: 'Ir a Reservas', allBookings: 'Todas las Reservas', verified: 'Verificado • Clic para detalles', actionRequired: 'Acción Requerida', property: 'Propiedad', totalAmount: 'Monto Total', status: 'Estado', travelerBreakdown: 'Resumen de Viajeros', room: 'Habitación', noSession: 'No se encontró sesión de reserva activa.', dashboard: 'Ir al Panel', printVoucher: 'Imprimir Voucher' },
    ru: { confirmed: 'Бронирование подтверждено!', failed: 'Ошибка бронирования', successMsg: 'Ваше бронирование успешно обработано.', failMsg: 'При обработке бронирования возникла проблема. Свяжитесь с поддержкой.', bookingRef: 'Номер бронирования', viewDetails: 'Нажмите для просмотра деталей', goBookings: 'К бронированиям', allBookings: 'Все бронирования', verified: 'Подтверждено • Нажмите для деталей', actionRequired: 'Требуется действие', property: 'Отель', totalAmount: 'Итого', status: 'Статус', travelerBreakdown: 'Список путешественников', room: 'Номер', noSession: 'Активная сессия бронирования не найдена.', dashboard: 'На панель', printVoucher: 'Распечатать ваучер' },
    fr: { confirmed: 'Réservation Confirmée!', failed: 'Réservation Échouée', successMsg: 'Votre réservation a été traitée avec succès.', failMsg: 'Un problème est survenu lors du traitement de votre réservation.', bookingRef: 'Référence de Réservation', viewDetails: 'Cliquez pour voir les détails', goBookings: 'Voir les Réservations', allBookings: 'Toutes les Réservations', verified: 'Vérifié • Cliquez pour les détails', actionRequired: 'Action Requise', property: 'Propriété', totalAmount: 'Montant Total', status: 'Statut', travelerBreakdown: 'Détail des Voyageurs', room: 'Chambre', noSession: 'Aucune session de réservation active.', dashboard: 'Tableau de Bord', printVoucher: 'Imprimer le Voucher' },
    de: { confirmed: 'Buchung Bestätigt!', failed: 'Buchung Fehlgeschlagen', successMsg: 'Ihre Buchung wurde erfolgreich bearbeitet.', failMsg: 'Bei der Bearbeitung Ihrer Buchung ist ein Problem aufgetreten.', bookingRef: 'Buchungsreferenz', viewDetails: 'Klicken für Details', goBookings: 'Zu den Buchungen', allBookings: 'Alle Buchungen', verified: 'Bestätigt • Klicken für Details', actionRequired: 'Aktion Erforderlich', property: 'Unterkunft', totalAmount: 'Gesamtbetrag', status: 'Status', travelerBreakdown: 'Reisende', room: 'Zimmer', noSession: 'Keine aktive Buchungssitzung gefunden.', dashboard: 'Zum Dashboard', printVoucher: 'Voucher Drucken' },
    zh: { confirmed: '预订已确认！', failed: '预订失败', successMsg: '您的预订已成功处理。', failMsg: '处理您的预订时出现问题。请联系支持部门。', bookingRef: '预订参考号', viewDetails: '点击查看完整的预订详情', goBookings: '前往预订', allBookings: '所有预订', verified: '已验证 • 点击查看详情', actionRequired: '需要操作', property: '酒店', totalAmount: '总金额', status: '状态', travelerBreakdown: '旅客明细', room: '房间', noSession: '未找到有效的预订会话。', dashboard: '前往仪表板', printVoucher: '打印凭证' },
    ja: { confirmed: '予約が確認されました！', failed: '予約に失敗しました', successMsg: '予約は正常に処理されました。', failMsg: '予約の処理中に問題が発生しました。サポートにお問い合わせください。', bookingRef: '予約参照番号', viewDetails: 'クリックして予約の詳細を表示', goBookings: '予約へ移動', allBookings: 'すべての予約', verified: '確認済み • クリックして詳細', actionRequired: '要対応', property: '宿泊施設', totalAmount: '合計金額', status: 'ステータス', travelerBreakdown: '旅行者の内訳', room: '部屋', noSession: '有効な予約セッションが見つかりません。', dashboard: 'ダッシュボードへ', printVoucher: 'バウチャーを印刷' },
    fa: { confirmed: 'رزرو تایید شد!', failed: 'رزرو ناموفق', successMsg: 'رزرو شما با موفقیت پردازش شد.', failMsg: 'مشکلی در پردازش رزرو شما وجود داشت. لطفا با پشتیبانی تماس بگیرید.', bookingRef: 'شماره پیگیری', viewDetails: 'برای مشاهده جزئیات رزرو کلیک کنید', goBookings: 'رفتن به رزروها', allBookings: 'همه رزروها', verified: 'تایید شده • برای جزئیات کلیک کنید', actionRequired: 'نیاز به اقدام', property: 'هتل', totalAmount: 'مبلغ کل', status: 'وضعیت', travelerBreakdown: 'جزئیات مسافران', room: 'اتاق', noSession: 'هیچ جلسه رزرو فعالی یافت نشد.', dashboard: 'رفتن به داشبورد', printVoucher: 'چاپ واچر' },
    it: { confirmed: 'Prenotazione Confermata!', failed: 'Prenotazione Fallita', successMsg: 'La tua prenotazione è stata elaborata con successo.', failMsg: 'Si è verificato un problema durante l\'elaborazione della prenotazione. Contatta il supporto.', bookingRef: 'Riferimento Prenotazione', viewDetails: 'Clicca per visualizzare i dettagli', goBookings: 'Vai alle Prenotazioni', allBookings: 'Tutte le Prenotazioni', verified: 'Verificato • Clicca per dettagli', actionRequired: 'Azione Richiesta', property: 'Struttura', totalAmount: 'Importo Totale', status: 'Stato', travelerBreakdown: 'Dettagli Viaggiatori', room: 'Camera', noSession: 'Nessuna sessione di prenotazione attiva trovata.', dashboard: 'Vai alla Dashboard', printVoucher: 'Stampa Voucher' },
    el: { confirmed: 'Η Κράτηση Επιβεβαιώθηκε!', failed: 'Η Κράτηση Απέτυχε', successMsg: 'Η κράτησή σας έχει ολοκληρωθεί με επιτυχία.', failMsg: 'Παρουσιάστηκε πρόβλημα κατά την επεξεργασία της κράτησής σας. Επικοινωνήστε με την υποστήριξη.', bookingRef: 'Κωδικός Κράτησης', viewDetails: 'Κάντε κλικ για λεπτομέρειες', goBookings: 'Μετάβαση στις Κρατήσεις', allBookings: 'Όλες οι Κρατήσεις', verified: 'Επιβεβαιωμένο • Κάντε κλικ για λεπτομέρειες', actionRequired: 'Απαιτείται Ενέργεια', property: 'Κατάλυμα', totalAmount: 'Συνολικό Ποσό', status: 'Κατάσταση', travelerBreakdown: 'Λεπτομέρειες Ταξιδιωτών', room: 'Δωμάτιο', noSession: 'Δεν βρέθηκε ενεργή συνεδρία κράτησης.', dashboard: 'Πίνακας Ελέγχου', printVoucher: 'Εκτύπωση Voucher' },
    pt: { confirmed: 'Reserva Confirmada!', failed: 'Falha na Reserva', successMsg: 'A sua reserva foi processada com sucesso.', failMsg: 'Ocorreu um problema ao processar a sua reserva. Contacte o suporte.', bookingRef: 'Referência da Reserva', viewDetails: 'Clique para ver os detalhes completos', goBookings: 'Ir para Reservas', allBookings: 'Todas as Reservas', verified: 'Verificado • Clique para detalhes', actionRequired: 'Ação Necessária', property: 'Propriedade', totalAmount: 'Valor Total', status: 'Estado', travelerBreakdown: 'Detalhes dos Viajantes', room: 'Quarto', noSession: 'Nenhuma sessão de reserva ativa encontrada.', dashboard: 'Ir para o Painel', printVoucher: 'Imprimir Voucher' }
};
const tCR = (lang, key) => { const l = getLang(lang); return CR[l]?.[key] ?? CR.en[key] ?? COMMON[l]?.[key] ?? COMMON.en[key] ?? key; };

const CheckoutResult = () => {
    const location = useLocation();
    const { hotel, totalPrice, roomsData, bookingResponse, displayCurrency } = location.state || {};
    const { i18n } = useTranslation();
    const { currencySymbolMap } = useAuth();
    const [currentLang, setCurrentLang] = useState(() => (i18n.language || localStorage.getItem('i18nextLng') || 'en').split('-')[0].toLowerCase());
    
    useEffect(() => {
        window.scrollTo(0, 0);
        const handler = (lng) => setCurrentLang((lng || 'en').split('-')[0].toLowerCase());
        i18n.on('languageChanged', handler);
        return () => i18n.off('languageChanged', handler);
    }, [i18n]);
    
    const L = (key) => tCR(currentLang, key);

    const isSuccess = ['NEW', 'CONFIRMED'].includes(bookingResponse?.status);
    const bookingRef = bookingResponse?.voucher || bookingResponse?.clientReferenceId || bookingResponse?.bookingReference || bookingResponse?.bookingId || "TOG-REF-SUCCESS";
    const bookingIdForDetail = bookingResponse?.id || bookingResponse?.bookingId || bookingResponse?.bookingReference;
    const detailUrl = (isSuccess && bookingIdForDetail) ? `/bookings/${bookingIdForDetail}` : '/bookings';

    if (!hotel) return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col justify-between">
            <Header />
            <div className="p-12 text-center text-sm font-semibold text-slate-500">{L('noSession')}</div>
            <Footer />
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-white font-sans flex flex-col justify-between">
            <Header />
            
            <main className="max-w-3xl mx-auto px-4 py-8 sm:py-12 w-full flex-1">
                {/* Header status icon & title */}
                <div className="text-center mb-8">
                    <div className={`size-14 mx-auto rounded-full ${isSuccess ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'} flex items-center justify-center mb-3 shadow-sm`}>
                        <span className="material-symbols-outlined text-2xl">{isSuccess ? 'check_circle' : 'error'}</span>
                    </div>

                    <h1 className={`text-xl sm:text-2xl font-bold tracking-tight mb-1 ${isSuccess ? 'text-slate-900 dark:text-white' : 'text-rose-600 dark:text-rose-400'}`}>
                        {isSuccess ? L('confirmed') : L('failed')}
                    </h1>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                        {isSuccess ? L('successMsg') : L('failMsg')}
                    </p>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
                    {/* Reservation Summary Card */}
                    <div className="p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between">
                        <div>
                            <div className="flex items-center gap-2 mb-4 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                                <span className="material-symbols-outlined text-sm text-primary">confirmation_number</span>
                                <h2>{L('bookingRef')}</h2>
                            </div>

                            <div className="mb-5 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                                <Link
                                    to={detailUrl}
                                    title={isSuccess ? L('viewDetails') : L('goBookings')}
                                    className="inline-flex items-center gap-1.5 text-lg font-bold text-primary hover:text-primary-dark dark:hover:text-primary-light transition-colors group truncate max-w-full"
                                >
                                    <span className="truncate">{isSuccess ? bookingRef : L('allBookings')}</span>
                                    <span className="material-symbols-outlined text-base group-hover:translate-x-1 transition-transform shrink-0">
                                        arrow_forward
                                    </span>
                                </Link>
                                <div className={`text-[11px] font-semibold flex items-center gap-1.5 mt-1 ${isSuccess ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                    <span className={`size-1.5 rounded-full ${isSuccess ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></span>
                                    {isSuccess ? L('verified') : L('actionRequired')}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wide mb-0.5">{L('property')}</p>
                                    <p className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">{hotel.name}</p>
                                </div>

                                <div className="flex justify-between items-end pt-2 border-t border-slate-100 dark:border-slate-800/80">
                                    <div>
                                        <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wide mb-0.5">{L('totalAmount')}</p>
                                        <p className="text-base font-bold text-primary">
                                            {getCurrencySymbol(displayCurrency, currencySymbolMap)} {totalPrice ? totalPrice.toFixed(2) : '0.00'}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wide mb-0.5">{L('status')}</p>
                                        <span className={`px-2.5 py-0.5 text-white text-[11px] font-semibold rounded-md ${isSuccess ? 'bg-emerald-500' : 'bg-rose-500'}`}>
                                            {isSuccess ? 'PAID' : 'FAILED'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Traveler Breakdown Card */}
                    <div className="p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col">
                        <div className="flex items-center gap-2 mb-4 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                            <span className="material-symbols-outlined text-sm text-primary">group</span>
                            <h2>{L('travelerBreakdown')}</h2>
                        </div>

                        <div className="space-y-4 max-h-[280px] overflow-y-auto pr-1 custom-scrollbar flex-1">
                            {roomsData?.map((room, rIdx) => (
                                <div key={rIdx} className="space-y-2.5">
                                    <div className="flex items-start justify-between gap-2">
                                        <p className="text-xs font-semibold text-primary break-words flex-1 min-w-0">{L('room')} {rIdx + 1}: {room.roomName}</p>
                                        {room.hubRateModel && room.hubRateModel.refundable !== undefined && (
                                            <RefundPolicyTooltip
                                                isRefundable={room.hubRateModel.refundable}
                                                className={`text-[9px] font-semibold px-1.5 py-0.5 rounded uppercase tracking-wider whitespace-nowrap shrink-0 ${room.hubRateModel.refundable ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' : 'bg-orange-500/10 text-orange-600 border border-orange-500/20'}`}
                                            />
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        {room.guests.map((guest, gIdx) => (
                                            <div key={gIdx} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                                                <div className="flex justify-between items-center">
                                                    <p className="text-xs font-bold text-slate-900 dark:text-white">{guest.firstName} {guest.lastName}</p>
                                                    <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-slate-200/70 dark:bg-slate-700 text-slate-600 dark:text-slate-300 uppercase">{guest.type}</span>
                                                </div>
                                                <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1.5 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                                                    <span>{guest.gender} • {guest.birthDate}</span>
                                                    {guest.email && <span className="text-primary truncate">{guest.email}</span>}
                                                    {guest.phone && <span>{guest.phone}</span>}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Bottom Actions */}
                <div className="flex items-center justify-center gap-3">
                    <Link
                        to="/dashboard"
                        className="px-5 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-xl font-semibold text-xs shadow-md transition-all flex items-center gap-1.5"
                    >
                        <span className="material-symbols-outlined text-base">dashboard</span>
                        {L('dashboard')}
                    </Link>
                    {isSuccess && (
                        <>
                            <Link
                                to={detailUrl}
                                className="px-5 py-2.5 bg-primary/10 text-primary hover:bg-primary/20 dark:bg-primary/20 dark:hover:bg-primary/30 rounded-xl font-semibold text-xs transition-all flex items-center gap-1.5"
                            >
                                <span className="material-symbols-outlined text-base">info</span>
                                {L('detailBtn')}
                            </Link>
                            <button
                                onClick={() => window.print()}
                                className="px-4 py-2.5 rounded-xl font-semibold text-xs text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex items-center gap-1.5 border border-slate-200 dark:border-slate-700 shadow-sm"
                            >
                                <span className="material-symbols-outlined text-base">print</span>
                                {L('printVoucher')}
                            </button>
                        </>
                    )}
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default CheckoutResult;
