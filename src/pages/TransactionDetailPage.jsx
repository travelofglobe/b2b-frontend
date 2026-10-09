import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { financeService } from '../services/financeService';
import Pagination from '../components/Pagination';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const today = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const defaultStartDate = () => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const fmt = (num) => {
    if (num === null || num === undefined) return '-';
    return Number(num).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const fmtDate = (str) => {
    if (!str) return '-';
    const d = new Date(str);
    return d.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const fmtDateTime = (str) => {
    if (!str) return '-';
    const d = new Date(str);
    return d.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' })
        + ' ' + d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
};

const CURRENCY_FLAGS = { EUR: '🇪🇺', USD: '🇺🇸', TRY: '🇹🇷', GBP: '🇬🇧' };

// Order status badge colours
const ORDER_STATUS_COLORS = {
    CONFIRMED:   'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
    CANCELLED:   'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-300',
    PENDING:     'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
    COMPLETED:   'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
};

const TRANSACTION_TYPE_LABELS = {
    HOTEL_SALE:         'Otel Satış',
    HOTEL_CANCELLATION: 'Otel İptal',
    AMENDMENT_CREDIT_REFUND: 'Düzeltme / Kredi İadesi',
};

const ORDER_STATUS_LABELS = {
    NEW:                 'Yeni',
    CONFIRMED:          'Onaylandı',
    ERROR:               'Hata',
    CANCELLED:          'İptal',
    CANCELLED_WITH_PENALTY: 'Cezalı İptal',
};

// ─── TransactionDetailPage ────────────────────────────────────────────────────

const TransactionDetailPage = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    // URL params passed from FinancePage
    const txId       = searchParams.get('txId');
    const accountId  = searchParams.get('accountId');
    const accountName = decodeURIComponent(searchParams.get('accountName') || '');

    // Filter state
    const [startDate, setStartDate]   = useState(defaultStartDate());
    const [endDate, setEndDate]       = useState(today());
    const [transactionType, setTransactionType] = useState('');
    const [orderStatus, setOrderStatus] = useState('');

    // Applied filters (trigger fetch)
    const [appliedFilters, setAppliedFilters] = useState({
        startDate: defaultStartDate(),
        endDate:   today(),
    });

    // Table state
    const [details, setDetails]       = useState([]);
    const [loading, setLoading]       = useState(false);
    const [error, setError]           = useState(null);
    const [page, setPage]             = useState(0);
    const [pageSize, setPageSize]     = useState(10);
    const [totalPages, setTotalPages] = useState(0);
    const [totalItems, setTotalItems] = useState(0);

    const hasLoaded = useRef(false);

    useEffect(() => {
        const controller = new AbortController();
        const delay = hasLoaded.current ? 300 : 0;
        const timer = setTimeout(() => {
            fetchDetails(controller.signal);
            hasLoaded.current = true;
        }, delay);
        return () => { clearTimeout(timer); controller.abort(); };
    }, [appliedFilters, page, pageSize]);

    const fetchDetails = async (signal) => {
        setLoading(true);
        setError(null);
        try {
            const payload = {
                accountId:            Number(accountId),
                accountTransactionId: Number(txId),
                startDate:            appliedFilters.startDate,
                endDate:              appliedFilters.endDate,
                supplierId:           null,
            };
            if (appliedFilters.transactionType) payload.transactionType = appliedFilters.transactionType;
            if (appliedFilters.orderStatus) payload.orderStatus = appliedFilters.orderStatus;

            const res = await financeService.filterTransactionDetails(
                payload, page, pageSize, 'createDateTime,desc', signal
            );
            if (!signal?.aborted) {
                setDetails(res?.details || []);
                setTotalPages(res?.numberOfPages || 0);
                setTotalItems(res?.numberOfItems || 0);
            }
        } catch (err) {
            if (err.name !== 'AbortError') {
                console.error('Detail fetch error:', err);
                setError(err.message || 'Veriler yüklenirken bir hata oluştu.');
            }
        } finally {
            if (!signal?.aborted) setLoading(false);
        }
    };

    const handleSearch = () => {
        setPage(0);
        setAppliedFilters({ startDate, endDate, transactionType, orderStatus });
    };

    const handleClear = () => {
        const cleared = { startDate: defaultStartDate(), endDate: today(), transactionType: '', orderStatus: '' };
        setStartDate(cleared.startDate);
        setEndDate(cleared.endDate);
        setTransactionType(cleared.transactionType);
        setOrderStatus(cleared.orderStatus);
        setPage(0);
        setAppliedFilters(cleared);
    };

    return (
        <div className="flex-1 flex flex-col px-4 sm:px-8 py-6 min-h-0 bg-[#f8f9fa] dark:bg-[#202124] w-full">
            <div className="max-w-7xl mx-auto w-full flex flex-col h-full min-h-0">

                {/* Back link */}
                <div className="mb-3">
                    <button
                        onClick={() => navigate('/finance?tab=transactions')}
                        className="inline-flex items-center gap-1.5 text-sm text-[#1a73e8] dark:text-blue-400 hover:underline cursor-pointer"
                    >
                        <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                        Hesap Listesine Dön
                    </button>
                </div>

                {/* Page Header card */}
                <div className="bg-white dark:bg-[#2c2c2e] rounded-t-xl border border-slate-200 dark:border-slate-700 border-b-0 px-6 pt-5 pb-4 shadow-sm">
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                        <div>
                            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                                {txId} – {accountName || `Hesap ${accountId}`}
                            </h1>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                                İşlem detaylarını görüntüleyin
                            </p>
                        </div>
                    </div>
                </div>

                {/* Filter + table card */}
                <div className="flex-1 min-h-0 flex flex-col bg-white dark:bg-[#2c2c2e] rounded-b-xl overflow-hidden shadow-sm border border-t-0 border-slate-200 dark:border-slate-700">

                    {/* Filter Bar */}
                    <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                        <div className="flex flex-wrap items-end gap-4">
                            {/* Start Date */}
                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                                    Başlangıç Tarihi
                                </label>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="h-9 px-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-800 dark:text-slate-100 outline-none focus:border-[#1a73e8] transition-colors cursor-pointer"
                                />
                            </div>

                            {/* End Date */}
                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                                    Bitiş Tarihi
                                </label>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="h-9 px-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-800 dark:text-slate-100 outline-none focus:border-[#1a73e8] transition-colors cursor-pointer"
                                />
                            </div>

                            {/* Transaction Type */}
                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                                    İşlem Türü
                                </label>
                                <select
                                    value={transactionType}
                                    onChange={(e) => setTransactionType(e.target.value)}
                                    className="h-9 px-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-800 dark:text-slate-100 outline-none focus:border-[#1a73e8] transition-colors cursor-pointer"
                                >
                                    <option value="">Tümü</option>
                                    {Object.entries(TRANSACTION_TYPE_LABELS).map(([key, label]) => (
                                        <option key={key} value={key}>{label}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Order Status */}
                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                                    Sipariş Durumu
                                </label>
                                <select
                                    value={orderStatus}
                                    onChange={(e) => setOrderStatus(e.target.value)}
                                    className="h-9 px-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-800 dark:text-slate-100 outline-none focus:border-[#1a73e8] transition-colors cursor-pointer"
                                >
                                    <option value="">Tümü</option>
                                    {Object.entries(ORDER_STATUS_LABELS).map(([key, label]) => (
                                        <option key={key} value={key}>{label}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Buttons */}
                            <div className="flex items-center gap-2 pb-0.5">
                                <button
                                    onClick={handleSearch}
                                    className="flex items-center gap-2 h-9 px-5 rounded-full bg-[#1a73e8] hover:bg-[#1558b0] text-white text-sm font-medium transition-colors cursor-pointer"
                                >
                                    <span className="material-symbols-outlined text-[16px]">search</span>
                                    Ara
                                </button>
                                <button
                                    onClick={handleClear}
                                    className="flex items-center gap-2 h-9 px-4 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 text-sm font-medium transition-colors cursor-pointer"
                                >
                                    <span className="material-symbols-outlined text-[16px]">restart_alt</span>
                                    Temizle
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="flex-1 overflow-auto">
                        {error ? (
                            <div className="flex flex-col items-center justify-center py-20 gap-3">
                                <span className="material-symbols-outlined text-4xl text-red-400">error</span>
                                <p className="text-sm text-red-500 dark:text-red-400">{error}</p>
                                <button onClick={handleSearch} className="text-sm text-[#1a73e8] hover:underline cursor-pointer">
                                    Tekrar dene
                                </button>
                            </div>
                        ) : loading ? (
                            <div className="flex flex-col items-center justify-center py-20 gap-3">
                                <span className="material-symbols-outlined text-4xl text-slate-300 dark:text-slate-600 animate-spin">progress_activity</span>
                                <p className="text-sm text-slate-400">Veriler yükleniyor...</p>
                            </div>
                        ) : (
                            <table className="w-full text-sm border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 sticky top-0 z-10">
                                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide whitespace-nowrap">İşlem ID</th>
                                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide whitespace-nowrap">Sipariş ID</th>
                                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide whitespace-nowrap">Voucher</th>
                                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide whitespace-nowrap">Hesap Adı</th>
                                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide whitespace-nowrap">Misafir Adı</th>
                                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide whitespace-nowrap">Sipariş Durumu</th>
                                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide whitespace-nowrap">İşlem Türü</th>
                                        <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide whitespace-nowrap">Borç</th>
                                        <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide whitespace-nowrap">Alacak</th>
                                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide whitespace-nowrap">Para Birimi</th>
                                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide whitespace-nowrap">İşlem Tarihi</th>
                                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide whitespace-nowrap">Giriş Tarihi</th>
                                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide whitespace-nowrap">Çıkış Tarihi</th>
                                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide whitespace-nowrap">Otel Adı</th>
                                        <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide whitespace-nowrap">Durum</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {details.length === 0 ? (
                                        <tr>
                                            <td colSpan={15} className="text-center py-16 text-slate-400 dark:text-slate-500">
                                                <div className="flex flex-col items-center gap-2">
                                                    <span className="material-symbols-outlined text-4xl">receipt_long</span>
                                                    <span className="text-sm">Detay kaydı bulunamadı</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        details.map((row, idx) => (
                                            <DetailRow key={`${row.id}-${idx}`} row={row} />
                                        ))
                                    )}
                                </tbody>
                            </table>
                        )}
                    </div>

                    {/* Pagination */}
                    {!loading && !error && totalItems > 0 && (
                        <Pagination
                            currentPage={page}
                            totalPages={totalPages}
                            pageSize={pageSize}
                            totalElements={totalItems}
                            onPageChange={(p) => setPage(p)}
                            onPageSizeChange={(s) => { setPageSize(s); setPage(0); }}
                        />
                    )}
                </div>

            </div>
        </div>
    );
};

// ─── DetailRow ─────────────────────────────────────────────────────────────────

const DetailRow = ({ row }) => {
    const currencyFlag  = CURRENCY_FLAGS[row.currency] || '💱';
    const statusColor   = ORDER_STATUS_COLORS[row.orderStatus] || 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400';
    const isActive      = row.status === 'ACTIVE';
    const txTypeLabel   = TRANSACTION_TYPE_LABELS[row.transactionType] || row.transactionType || '-';

    return (
        <tr className="border-b border-slate-100 dark:border-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
            {/* İşlem ID */}
            <td className="px-4 py-3 text-slate-600 dark:text-slate-300 font-mono text-xs font-semibold">
                {row.id ?? '-'}
            </td>

            {/* Sipariş ID */}
            <td className="px-4 py-3 text-slate-700 dark:text-slate-200 font-medium text-sm">
                {row.orderId ?? '-'}
            </td>

            {/* Voucher */}
            <td className="px-4 py-3">
                <span className="text-[#1a73e8] dark:text-blue-400 text-xs font-medium">
                    {row.voucher || '-'}
                </span>
            </td>

            {/* Hesap Adı */}
            <td className="px-4 py-3 text-slate-700 dark:text-slate-200 text-sm whitespace-nowrap">
                {row.accountName || '-'}
            </td>

            {/* Misafir Adı */}
            <td className="px-4 py-3 text-slate-700 dark:text-slate-200 text-sm whitespace-nowrap">
                {row.guestName || '-'}
            </td>

            {/* Sipariş Durumu */}
            <td className="px-4 py-3">
                {row.orderStatus ? (
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusColor}`}>
                        {row.orderStatus}
                    </span>
                ) : (
                    <span className="text-slate-300 dark:text-slate-600">-</span>
                )}
            </td>

            {/* İşlem Türü */}
            <td className="px-4 py-3 text-slate-600 dark:text-slate-300 text-xs whitespace-nowrap">
                {txTypeLabel}
            </td>

            {/* Borç */}
            <td className="px-4 py-3 text-right text-slate-700 dark:text-slate-200">
                {row.debit > 0
                    ? <span className="font-medium whitespace-nowrap">€ {fmt(row.debit)}</span>
                    : <span className="text-slate-300 dark:text-slate-600">-</span>
                }
            </td>

            {/* Alacak */}
            <td className="px-4 py-3 text-right text-slate-700 dark:text-slate-200">
                {row.credit > 0
                    ? <span className="font-medium whitespace-nowrap">€ {fmt(row.credit)}</span>
                    : <span className="text-slate-300 dark:text-slate-600">-</span>
                }
            </td>

            {/* Para Birimi */}
            <td className="px-4 py-3">
                <div className="flex items-center gap-1.5">
                    <span className="text-base leading-none">{currencyFlag}</span>
                    <span className="text-xs font-medium text-slate-700 dark:text-slate-200">{row.currency}</span>
                </div>
            </td>

            {/* İşlem Tarihi */}
            <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                {fmtDateTime(row.transactionDate)}
            </td>

            {/* Giriş Tarihi (checkInDate) */}
            <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                {fmtDate(row.checkInDate)}
            </td>

            {/* Çıkış Tarihi (checkOutDate) */}
            <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                {fmtDate(row.checkOutDate)}
            </td>

            {/* Otel Adı */}
            <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-200 whitespace-nowrap">
                {row.hotelName || '-'}
            </td>

            {/* Durum */}
            <td className="px-4 py-3 text-center">
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium
                    ${isActive
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                        : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
                    }`}
                >
                    <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                    {row.status}
                </span>
            </td>
        </tr>
    );
};

export default TransactionDetailPage;
