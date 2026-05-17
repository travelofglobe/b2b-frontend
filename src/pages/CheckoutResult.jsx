import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { COMMON, getLang } from '../utils/sharedLocales';
import { useTranslation } from 'react-i18next';
import Header from '../components/Header';
import Footer from '../components/Footer';
import RefundPolicyTooltip from '../components/RefundPolicyTooltip';

const CR = {
    en: { confirmed: 'Booking Confirmed!', failed: 'Booking Failed', successMsg: 'Your reservation has been processed successfully.', failMsg: 'There was an issue processing your reservation. Please contact support.', bookingRef: 'Booking Reference', viewDetails: 'Click to view full booking details', goBookings: 'Go to Bookings', allBookings: 'All Bookings', verified: 'Verified • Click for details', actionRequired: 'Action Required', property: 'Property', totalAmount: 'Total Amount', status: 'Status', travelerBreakdown: 'Traveler Breakdown', room: 'Room', noSession: 'No active booking session found.', dashboard: 'Go to Dashboard', printVoucher: 'Print Voucher' },
    tr: { confirmed: 'Rezervasyon Onaylandı!', failed: 'Rezervasyon Başarısız', successMsg: 'Rezervasyonunuz başarıyla işlendi.', failMsg: 'Rezervasyonunuz işlenirken bir sorun oluştu. Lütfen destek ile iletişime geçin.', bookingRef: 'Rezervasyon Referansı', viewDetails: 'Tam rezervasyon detaylarını görüntüle', goBookings: 'Rezervasyonlara Git', allBookings: 'Tüm Rezervasyonlar', verified: 'Doğrulandı • Detaylar için tıkla', actionRequired: 'İşlem Gerekli', property: 'Otel', totalAmount: 'Toplam Tutar', status: 'Durum', travelerBreakdown: 'Yolcu Listesi', room: 'Oda', noSession: 'Aktif rezervasyon oturumu bulunamadı.', dashboard: 'Panele Git', printVoucher: 'Voucher Yazdır' },
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
    const [currentLang, setCurrentLang] = useState(() => (i18n.language || localStorage.getItem('i18nextLng') || 'en').split('-')[0].toLowerCase());
    useEffect(() => {
        setCurrentLang((i18n.language || 'en').split('-')[0].toLowerCase());
        const handler = (lng) => setCurrentLang((lng || 'en').split('-')[0].toLowerCase());
        i18n.on('languageChanged', handler);
        return () => i18n.off('languageChanged', handler);
    }, [i18n]);
    const L = (key) => tCR(currentLang, key);

    const getCurrencySymbol = (code) => {
        const symbols = { 'USD': '$', 'EUR': '€', 'GBP': '£', 'TRY': '₺', 'AED': 'د.إ', 'SAR': 'ر.س', 'JPY': '¥', 'CHF': 'Fr', 'CAD': 'CA$', 'AUD': 'A$' };
        return symbols[code] || code || '$';
    };

    const isSuccess = ['NEW', 'CONFIRMED'].includes(bookingResponse?.status) && bookingResponse?.voucher;
    const bookingRef = bookingResponse?.voucher || bookingResponse?.clientReferenceId || ("TOG" + Math.random().toString(36).substring(2, 8).toUpperCase());

    if (!hotel) return <div className="p-20 text-center">{L('noSession')}</div>;

    return (
        <div className="min-h-screen bg-background-light dark:bg-background-dark text-slate-900 dark:text-white font-sans">
            <Header />
            <main className="max-w-4xl mx-auto px-6 pt-10 pb-20 text-center">
                <div className="relative mb-8">
                    <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-0.5 bg-gradient-to-r from-transparent via-primary/10 to-transparent"></div>
                    <div className={`relative size-16 mx-auto rounded-full ${isSuccess ? 'bg-emerald-500 shadow-emerald-500/20' : 'bg-rose-500 shadow-rose-500/20'} text-white flex items-center justify-center shadow-xl animate-in zoom-in duration-700`}>
                        <span className="material-symbols-outlined text-3xl">{isSuccess ? 'done_all' : 'error'}</span>
                    </div>
                </div>

                <h1 className={`text-3xl sm:text-4xl font-black uppercase tracking-tight mb-3 animate-in slide-in-from-bottom-4 duration-700 delay-100 ${isSuccess ? 'text-slate-900 dark:text-white' : 'text-rose-500'}`}>
                    {isSuccess ? L('confirmed') : L('failed')}
                </h1>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mb-10 animate-in slide-in-from-bottom-4 duration-700 delay-200">
                    {isSuccess ? L('successMsg') : L('failMsg')}
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16 text-left">
                    <div className="p-10 rounded-[40px] border border-white/40 dark:border-white/10 bg-white/60 dark:bg-slate-900/60 backdrop-blur-3xl shadow-xl animate-in slide-in-from-left-4 duration-700 delay-300">
                        <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm">confirmation_number</span>
                            {L('bookingRef')}
                        </h2>
                        <div className="mb-10 bg-slate-50 dark:bg-slate-800/40 p-5 rounded-[32px] border border-slate-100 dark:border-slate-800">
                            <Link
                                to={isSuccess ? `/bookings/${bookingRef}/voucher` : '/bookings'}
                                title={isSuccess ? L('viewDetails') : L('goBookings')}
                                className="inline-flex items-center gap-2 text-xl lg:text-2xl font-black text-primary hover:text-primary-dark dark:hover:text-primary-light tracking-tighter mb-2 hover:underline decoration-primary/50 underline-offset-4 cursor-pointer transition-all group max-w-full overflow-hidden"
                            >
                                <span className="truncate whitespace-nowrap">{isSuccess ? bookingRef : L('allBookings')}</span>
                                <span className="material-symbols-outlined text-xl group-hover:translate-x-1 duration-200 transition-transform select-none shrink-0">
                                    arrow_right_alt
                                </span>
                            </Link>
                            <p className={`text-[9px] font-black uppercase tracking-[0.2em] flex items-center gap-2 mt-1 ${isSuccess ? 'text-emerald-500' : 'text-rose-500'}`}>
                                <div className={`size-1.5 rounded-full ${isSuccess ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></div>
                                {isSuccess ? L('verified') : L('actionRequired')}
                            </p>
                        </div>
                        <div className="space-y-6 pt-2">
                            <div>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">{L('property')}</p>
                                <p className="text-lg font-black uppercase tracking-tight">{hotel.name}</p>
                            </div>
                            <div className="flex justify-between">
                                <div>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">{L('totalAmount')}</p>
                                    <p className="text-xl font-black text-primary">
                                        {getCurrencySymbol(displayCurrency)} {totalPrice ? totalPrice.toFixed(2) : '0.00'}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">{L('status')}</p>
                                    <span className={`px-3 py-1 text-white text-[10px] font-black rounded-lg uppercase tracking-widest ${isSuccess ? 'bg-emerald-500' : 'bg-red-500'}`}>
                                        {isSuccess ? 'PAID' : 'FAILED'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-10 rounded-[40px] border border-white/40 dark:border-white/10 bg-white/60 dark:bg-slate-900/60 backdrop-blur-3xl shadow-xl animate-in slide-in-from-right-4 duration-700 delay-400">
                        <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm">group</span>
                            {L('travelerBreakdown')}
                        </h2>
                        <div className="space-y-8 max-h-[350px] overflow-y-auto pr-4 custom-scrollbar">
                            {roomsData?.map((room, rIdx) => (
                                <div key={rIdx} className="space-y-4">
                                    <div className="flex items-center gap-2">
                                        <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">{L('room')} {rIdx + 1}: {room.roomName}</p>
                                        {room.hubRateModel && room.hubRateModel.refundable !== undefined && (
                                            <RefundPolicyTooltip
                                                isRefundable={room.hubRateModel.refundable}
                                                className={`text-[8px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-wider ${room.hubRateModel.refundable ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-orange-500/10 text-orange-500 border border-orange-500/20'}`}
                                            />
                                        )}
                                    </div>
                                    <div className="space-y-3">
                                        {room.guests.map((guest, gIdx) => (
                                            <div key={gIdx} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                                                <div className="flex justify-between items-start mb-1">
                                                    <p className="text-sm font-black uppercase tracking-tight">{guest.firstName} {guest.lastName}</p>
                                                    <span className="text-[8px] font-black px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-500 uppercase">{guest.type}</span>
                                                </div>
                                                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                                                    <p className="text-[9px] font-bold text-slate-400 uppercase">
                                                        {guest.gender} • {guest.birthDate}
                                                    </p>
                                                    {guest.email && <p className="text-[9px] font-bold text-primary uppercase">{guest.email}</p>}
                                                    {guest.phone && <p className="text-[9px] font-bold text-slate-500 uppercase">{guest.phone}</p>}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-6 animate-in fade-in duration-1000 delay-500">
                    <Link
                        to="/dashboard"
                        className="px-12 py-5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-[24px] font-black text-xs uppercase tracking-widest shadow-2xl hover:scale-105 active:scale-95 transition-all"
                    >
                        {L('dashboard')}
                    </Link>
                    {isSuccess && (
                        <button
                            onClick={() => window.print()}
                            className="px-8 py-5 rounded-[24px] font-black text-xs uppercase tracking-widest text-slate-500 hover:text-slate-900 dark:hover:text-white transition-all flex items-center gap-2 border border-slate-200 dark:border-slate-800"
                        >
                            <span className="material-symbols-outlined text-sm">print</span>
                            {L('printVoucher')}
                        </button>
                    )}
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default CheckoutResult;
