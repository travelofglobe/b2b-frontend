import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { financeService } from '../services/financeService';
import { downloadXlsxWorkbook } from '../utils/fileDownloadHelper';
import BookingStatusBadge from '../components/BookingStatusBadge';
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

const TRANSACTION_TYPE_LABELS = {
    HOTEL_SALE: 'Otel Satış',
    HOTEL_CANCELLATION: 'Otel İptal',
    AMENDMENT_CREDIT_REFUND: 'Düzeltme / Kredi İadesi',
};

const ORDER_STATUS_LABELS = {
    NEW: 'Yeni',
    CONFIRMED: 'Onaylandı',
    ERROR: 'Hata',
    CANCELLED: 'İptal',
    CANCELLED_WITH_PENALTY: 'Cezalı İptal',
};

// ─── TransactionDetailPage ────────────────────────────────────────────────────

const TransactionDetailPage = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    // URL params passed from FinancePage
    const txId = searchParams.get('txId');
    const accountId = searchParams.get('accountId');
    const accountName = decodeURIComponent(searchParams.get('accountName') || '');

    // Filter state
    const [startDate, setStartDate] = useState(defaultStartDate());
    const [endDate, setEndDate] = useState(today());
    const [transactionType, setTransactionType] = useState('');
    const [orderStatus, setOrderStatus] = useState('');

    // Applied filters (trigger fetch)
    const [appliedFilters, setAppliedFilters] = useState({
        startDate: defaultStartDate(),
        endDate: today(),
    });

    // Table state
    const [details, setDetails] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState(10);
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
                accountId: accountId && accountId !== 'null' ? Number(accountId) : null,
                accountTransactionId: txId ? Number(txId) : null,
                startDate: appliedFilters.startDate,
                endDate: appliedFilters.endDate,
                supplierId: null,
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

    // Derived summary calculations
    const metrics = useMemo(() => {
        let totalDebit = 0;
        let totalCredit = 0;
        let currency = 'EUR';

        details.forEach(d => {
            if (d.debit) totalDebit += Number(d.debit) || 0;
            if (d.credit) totalCredit += Number(d.credit) || 0;
            if (d.currency) currency = d.currency;
        });

        const netBalance = totalCredit - totalDebit;

        return {
            count: totalItems || details.length,
            debit: totalDebit,
            credit: totalCredit,
            net: netBalance,
            currency: currency
        };
    }, [details, totalItems]);

    const handleExportExcel = () => {
        if (details.length === 0) return;
        try {
            const exportData = details.map(row => ({
                'İşlem ID': row.id ?? '',
                'Sipariş ID': row.orderId ?? '',
                'Voucher': row.voucher ?? '',
                'Hesap Adı': row.accountName ?? '',
                'Misafir Adı': row.guestName ?? '',
                'Sipariş Durumu': row.orderStatus ?? '',
                'İşlem Türü': TRANSACTION_TYPE_LABELS[row.transactionType] || row.transactionType || '',
                'Borç': row.debit != null ? Number(row.debit).toFixed(2) : '0.00',
                'Alacak': row.credit != null ? Number(row.credit).toFixed(2) : '0.00',
                'Para Birimi': row.currency ?? '',
                'İşlem Tarihi': fmtDateTime(row.transactionDate),
                'Giriş Tarihi': fmtDate(row.checkInDate),
                'Çıkış Tarihi': fmtDate(row.checkOutDate),
                'Otel Adı': row.hotelName ?? '',
                'Durum': row.status ?? ''
            }));

            const worksheet = XLSX.utils.json_to_sheet(exportData);
            worksheet['!cols'] = [
                { wch: 10 }, { wch: 12 }, { wch: 22 }, { wch: 20 }, { wch: 18 },
                { wch: 14 }, { wch: 16 }, { wch: 14 }, { wch: 14 }, { wch: 12 },
                { wch: 18 }, { wch: 14 }, { wch: 14 }, { wch: 25 }, { wch: 12 }
            ];
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Transaction_Details');
            downloadXlsxWorkbook(XLSX, workbook, `Transaction_Detail_${txId || 'All'}_${today()}.xlsx`);
        } catch (err) {
            console.error('Export error:', err);
        }
    };

    return (
        <div className="flex-1 flex flex-col px-4 sm:px-8 py-6 min-h-0 bg-[#f8f9fa] dark:bg-[#202124] w-full">
            <div className="max-w-7xl mx-auto w-full flex flex-col space-y-6">

                {/* Top Navigation & Header Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => navigate('/finance?tab=transactions')}
                            className="size-10 rounded-xl bg-white dark:bg-[#202124] border border-[#dadce0] dark:border-[#3c4043] flex items-center justify-center text-[#5f6368] dark:text-[#9aa0a6] hover:bg-[#f1f3f4] dark:hover:bg-[#303134] transition-all shadow-xs cursor-pointer shrink-0"
                            title="Hesap Listesine Dön"
                        >
                            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
                        </button>
                        <div>
                            <div className="flex flex-wrap items-center gap-2">
                                <h1 className="text-xl font-bold text-[#202124] dark:text-[#e8eaed] tracking-tight">
                                    {accountName || `Hesap ${accountId || '-'}`}
                                </h1>
                                {txId && (
                                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#e8f0fe] text-[#1a73e8] dark:bg-[#1a73e8]/20 dark:text-[#8ab4f8]">
                                        İşlem #{txId}
                                    </span>
                                )}
                                {accountId && accountId !== 'null' && (
                                    <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                        Hesap ID: {accountId}
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-[#5f6368] dark:text-[#9aa0a6] mt-0.5">
                                Hesaba ait detaylı finansal hareketler, rezervasyon ve voucher kayıtları
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={handleExportExcel}
                            disabled={details.length === 0}
                            className="flex items-center gap-1.5 h-10 px-4 bg-white dark:bg-[#202124] hover:bg-[#f1f3f4] dark:hover:bg-[#303134] border border-[#dadce0] dark:border-[#5f6368] rounded-xl text-xs font-medium text-emerald-600 dark:text-emerald-400 transition-all cursor-pointer disabled:opacity-50 shadow-2xs"
                            title="Excel'e Aktar"
                        >
                            <span className="material-symbols-outlined text-[18px]">table_view</span>
                            <span>Excel İndir</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => fetchDetails()}
                            disabled={loading}
                            className="size-10 rounded-xl bg-white dark:bg-[#202124] border border-[#dadce0] dark:border-[#5f6368] hover:bg-[#f1f3f4] dark:hover:bg-[#303134] flex items-center justify-center text-[#5f6368] dark:text-[#9aa0a6] transition-all cursor-pointer disabled:opacity-50 shadow-2xs"
                            title="Yenile"
                        >
                            <span className={`material-symbols-outlined text-[18px] ${loading ? 'animate-spin' : ''}`}>refresh</span>
                        </button>
                    </div>
                </div>

                {/* 4 Financial Metric Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white dark:bg-[#202124] p-5 sm:p-6 rounded-2xl border border-[#dadce0] dark:border-[#3c4043] shadow-xs hover:shadow-sm transition-all duration-200 flex flex-col justify-between">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-semibold text-[#5f6368] dark:text-[#9aa0a6] uppercase tracking-wider">Detay Kaydı</span>
                            <div className="size-10 bg-[#e8f0fe] dark:bg-[#1a73e8]/20 rounded-xl flex items-center justify-center text-[#1a73e8] dark:text-[#8ab4f8] shrink-0">
                                <span className="material-symbols-outlined text-[22px]">receipt_long</span>
                            </div>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <div className="text-2xl sm:text-3xl font-bold text-[#202124] dark:text-white leading-none tabular-nums tracking-tight">
                                {loading && details.length === 0 ? '...' : metrics.count}
                            </div>
                            <span className="text-xs font-medium text-[#70757a]">hareket</span>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-[#202124] p-5 sm:p-6 rounded-2xl border border-[#dadce0] dark:border-[#3c4043] shadow-xs hover:shadow-sm transition-all duration-200 flex flex-col justify-between">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-semibold text-rose-700 dark:text-rose-400 uppercase tracking-wider">Sayfa Toplam Borç</span>
                            <div className="size-10 bg-rose-50 dark:bg-rose-950/40 rounded-xl flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0">
                                <span className="material-symbols-outlined text-[22px]">arrow_downward</span>
                            </div>
                        </div>
                        <div className="flex items-baseline gap-1.5">
                            <div className="text-2xl sm:text-3xl font-bold text-rose-600 dark:text-rose-400 leading-none tabular-nums tracking-tight">
                                {fmt(metrics.debit)}
                            </div>
                            <span className="text-xs font-bold text-rose-600">{metrics.currency}</span>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-[#202124] p-5 sm:p-6 rounded-2xl border border-[#dadce0] dark:border-[#3c4043] shadow-xs hover:shadow-sm transition-all duration-200 flex flex-col justify-between">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">Sayfa Toplam Alacak</span>
                            <div className="size-10 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                                <span className="material-symbols-outlined text-[22px]">arrow_upward</span>
                            </div>
                        </div>
                        <div className="flex items-baseline gap-1.5">
                            <div className="text-2xl sm:text-3xl font-bold text-emerald-600 dark:text-emerald-400 leading-none tabular-nums tracking-tight">
                                {fmt(metrics.credit)}
                            </div>
                            <span className="text-xs font-bold text-emerald-600">{metrics.currency}</span>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-[#202124] p-5 sm:p-6 rounded-2xl border border-[#dadce0] dark:border-[#3c4043] shadow-xs hover:shadow-sm transition-all duration-200 flex flex-col justify-between">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-semibold text-[#1a73e8] dark:text-[#8ab4f8] uppercase tracking-wider">Net Hareket</span>
                            <div className="size-10 bg-[#e8f0fe] dark:bg-[#1a73e8]/20 rounded-xl flex items-center justify-center text-[#1a73e8] dark:text-[#8ab4f8] shrink-0">
                                <span className="material-symbols-outlined text-[22px]">account_balance</span>
                            </div>
                        </div>
                        <div className="flex items-baseline gap-1.5">
                            <div className={`text-2xl sm:text-3xl font-bold leading-none tabular-nums tracking-tight ${metrics.net >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                {metrics.net > 0 ? `+${fmt(metrics.net)}` : fmt(metrics.net)}
                            </div>
                            <span className="text-xs font-bold text-[#70757a]">{metrics.currency}</span>
                        </div>
                    </div>
                </div>

                {/* Unified Card: Filter Toolbar + Table + Pagination */}
                <div className="bg-white dark:bg-[#202124] rounded-2xl border border-[#dadce0] dark:border-[#3c4043] shadow-xs overflow-hidden flex flex-col">

                    {/* Filter Bar */}
                    <div className="p-4 sm:p-5 border-b border-[#dadce0] dark:border-[#3c4043] bg-white dark:bg-[#202124]">
                        <div className="flex flex-wrap items-end gap-3.5">
                            {/* Start Date */}
                            <div className="flex-1 min-w-[150px]">
                                <label className="text-[11px] font-semibold text-[#5f6368] dark:text-[#9aa0a6] uppercase tracking-wider block mb-1">
                                    Başlangıç Tarihi
                                </label>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="w-full h-10 px-3 bg-[#f8f9fa] dark:bg-[#303134] border border-[#dadce0] dark:border-[#5f6368] rounded-xl text-xs text-[#202124] dark:text-white outline-none focus:border-[#1a73e8] focus:bg-white transition-all cursor-pointer"
                                />
                            </div>

                            {/* End Date */}
                            <div className="flex-1 min-w-[150px]">
                                <label className="text-[11px] font-semibold text-[#5f6368] dark:text-[#9aa0a6] uppercase tracking-wider block mb-1">
                                    Bitiş Tarihi
                                </label>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="w-full h-10 px-3 bg-[#f8f9fa] dark:bg-[#303134] border border-[#dadce0] dark:border-[#5f6368] rounded-xl text-xs text-[#202124] dark:text-white outline-none focus:border-[#1a73e8] focus:bg-white transition-all cursor-pointer"
                                />
                            </div>

                            {/* Transaction Type */}
                            <div className="flex-1 min-w-[160px]">
                                <label className="text-[11px] font-semibold text-[#5f6368] dark:text-[#9aa0a6] uppercase tracking-wider block mb-1">
                                    İşlem Türü
                                </label>
                                <select
                                    value={transactionType}
                                    onChange={(e) => setTransactionType(e.target.value)}
                                    className="w-full h-10 px-3 bg-[#f8f9fa] dark:bg-[#303134] border border-[#dadce0] dark:border-[#5f6368] rounded-xl text-xs text-[#202124] dark:text-white outline-none focus:border-[#1a73e8] focus:bg-white transition-all cursor-pointer"
                                >
                                    <option value="">Tümü</option>
                                    {Object.entries(TRANSACTION_TYPE_LABELS).map(([key, label]) => (
                                        <option key={key} value={key}>{label}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Order Status */}
                            <div className="flex-1 min-w-[160px]">
                                <label className="text-[11px] font-semibold text-[#5f6368] dark:text-[#9aa0a6] uppercase tracking-wider block mb-1">
                                    Sipariş Durumu
                                </label>
                                <select
                                    value={orderStatus}
                                    onChange={(e) => setOrderStatus(e.target.value)}
                                    className="w-full h-10 px-3 bg-[#f8f9fa] dark:bg-[#303134] border border-[#dadce0] dark:border-[#5f6368] rounded-xl text-xs text-[#202124] dark:text-white outline-none focus:border-[#1a73e8] focus:bg-white transition-all cursor-pointer"
                                >
                                    <option value="">Tümü</option>
                                    {Object.entries(ORDER_STATUS_LABELS).map(([key, label]) => (
                                        <option key={key} value={key}>{label}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Buttons */}
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={handleSearch}
                                    className="h-10 px-5 rounded-xl bg-[#1a73e8] hover:bg-[#1557b0] text-white text-xs font-medium flex items-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer"
                                >
                                    <span className="material-symbols-outlined text-[16px]">search</span>
                                    <span>Ara</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={handleClear}
                                    className="h-10 px-4 rounded-xl border border-[#dadce0] dark:border-[#5f6368] text-xs font-medium text-[#3c4043] dark:text-slate-300 hover:bg-[#f1f3f4] dark:hover:bg-[#303134] transition-all cursor-pointer"
                                >
                                    Temizle
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Table with Zebra Grid (MyBookings style) */}
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="bg-[#f8f9fa] dark:bg-[#202124] border-b border-[#dadce0] dark:border-[#3c4043]">
                                    <th className="px-4 py-3 text-left text-[11px] font-bold text-[#5f6368] dark:text-slate-400 uppercase tracking-wider whitespace-nowrap select-none">
                                        İşlem ID
                                    </th>
                                    <th className="px-4 py-3 text-left text-[11px] font-bold text-[#5f6368] dark:text-slate-400 uppercase tracking-wider whitespace-nowrap select-none">
                                        Sipariş ID
                                    </th>
                                    <th className="px-4 py-3 text-left text-[11px] font-bold text-[#5f6368] dark:text-slate-400 uppercase tracking-wider whitespace-nowrap select-none min-w-[170px]">
                                        Voucher
                                    </th>
                                    <th className="px-4 py-3 text-left text-[11px] font-bold text-[#5f6368] dark:text-slate-400 uppercase tracking-wider whitespace-nowrap select-none">
                                        Hesap Adı
                                    </th>
                                    <th className="px-4 py-3 text-left text-[11px] font-bold text-[#5f6368] dark:text-slate-400 uppercase tracking-wider whitespace-nowrap select-none">
                                        Misafir Adı
                                    </th>
                                    <th className="px-4 py-3 text-left text-[11px] font-bold text-[#5f6368] dark:text-slate-400 uppercase tracking-wider whitespace-nowrap select-none">
                                        Sipariş Durumu
                                    </th>
                                    <th className="px-4 py-3 text-left text-[11px] font-bold text-[#5f6368] dark:text-slate-400 uppercase tracking-wider whitespace-nowrap select-none">
                                        İşlem Türü
                                    </th>
                                    <th className="px-4 py-3 text-right text-[11px] font-bold text-[#5f6368] dark:text-slate-400 uppercase tracking-wider whitespace-nowrap select-none">
                                        Borç
                                    </th>
                                    <th className="px-4 py-3 text-right text-[11px] font-bold text-[#5f6368] dark:text-slate-400 uppercase tracking-wider whitespace-nowrap select-none">
                                        Alacak
                                    </th>
                                    <th className="px-4 py-3 text-left text-[11px] font-bold text-[#5f6368] dark:text-slate-400 uppercase tracking-wider whitespace-nowrap select-none">
                                        Para Birimi
                                    </th>
                                    <th className="px-4 py-3 text-left text-[11px] font-bold text-[#5f6368] dark:text-slate-400 uppercase tracking-wider whitespace-nowrap select-none">
                                        İşlem Tarihi
                                    </th>
                                    <th className="px-4 py-3 text-left text-[11px] font-bold text-[#5f6368] dark:text-slate-400 uppercase tracking-wider whitespace-nowrap select-none">
                                        Giriş Tarihi
                                    </th>
                                    <th className="px-4 py-3 text-left text-[11px] font-bold text-[#5f6368] dark:text-slate-400 uppercase tracking-wider whitespace-nowrap select-none">
                                        Çıkış Tarihi
                                    </th>
                                    <th className="px-4 py-3 text-left text-[11px] font-bold text-[#5f6368] dark:text-slate-400 uppercase tracking-wider whitespace-nowrap select-none">
                                        Otel Adı
                                    </th>
                                    <th className="px-4 py-3 text-center text-[11px] font-bold text-[#5f6368] dark:text-slate-400 uppercase tracking-wider whitespace-nowrap select-none">
                                        Kayıt Durumu
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {error ? (
                                    <tr>
                                        <td colSpan={15} className="px-4 py-14 text-center">
                                            <div className="flex flex-col items-center justify-center gap-2">
                                                <span className="material-symbols-outlined text-[44px] text-red-400">error</span>
                                                <p className="text-sm font-medium text-red-500">{error}</p>
                                                <button onClick={handleSearch} className="text-xs text-[#1a73e8] hover:underline cursor-pointer">
                                                    Tekrar Dene
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ) : loading ? (
                                    Array.from({ length: pageSize || 10 }).map((_, index) => (
                                        <tr key={`skel-${index}`} className="border-b border-[#dadce0]/50 dark:border-[#3c4043]/50 even:bg-[#f8f9fa]/50 dark:even:bg-[#202124]/30 h-[53px]">
                                            {Array.from({ length: 15 }).map((__, cIndex) => (
                                                <td key={`skel-col-${cIndex}`} className="px-4 py-3.5">
                                                    <div className={`h-3.5 bg-slate-200/80 dark:bg-slate-700/60 rounded animate-pulse ${
                                                        cIndex % 3 === 0 ? 'w-2/3' : cIndex % 2 === 0 ? 'w-full' : 'w-4/5'
                                                    }`} />
                                                </td>
                                            ))}
                                        </tr>
                                    ))
                                ) : details.length === 0 ? (
                                    <tr>
                                        <td colSpan={15} className="px-4 py-14 text-center text-[#70757a] dark:text-slate-400">
                                            <div className="flex flex-col items-center justify-center gap-2">
                                                <span className="material-symbols-outlined text-[44px] text-slate-300 dark:text-slate-600">receipt_long</span>
                                                <p className="text-sm font-medium">İşlem detay kaydı bulunamadı</p>
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
    const currencyFlag = CURRENCY_FLAGS[row.currency] || '💱';
    const isActive = row.status === 'ACTIVE';
    const txTypeLabel = TRANSACTION_TYPE_LABELS[row.transactionType] || row.transactionType || '-';

    return (
        <tr className="border-b border-[#dadce0]/60 dark:border-[#3c4043]/60 last:border-0 hover:bg-[#f1f3f4] dark:hover:bg-[#3c4043]/50 even:bg-[#f8f9fa]/50 dark:even:bg-[#202124]/30 transition-colors">
            {/* İşlem ID */}
            <td className="px-4 py-3.5 text-xs font-mono font-semibold text-[#5f6368] dark:text-slate-400 whitespace-nowrap">
                #{row.id ?? '-'}
            </td>

            {/* Sipariş ID */}
            <td className="px-4 py-3.5 whitespace-nowrap">
                {row.orderId ? (
                    <a
                        href={`/travel/hotels/bookings/${row.orderId}`}
                        target="_blank"
                        rel="noreferrer"
                        className="font-semibold text-[13px] text-[#1a73e8] dark:text-[#8ab4f8] hover:underline"
                        title="Rezervasyon Detayını Aç"
                    >
                        #{row.orderId}
                    </a>
                ) : (
                    <span className="text-slate-400">-</span>
                )}
            </td>

            {/* Voucher (Ensured never wrapped or cut off) */}
            <td className="px-4 py-3.5 whitespace-nowrap min-w-[170px]">
                {row.voucher ? (
                    <span
                        className="font-mono text-xs font-semibold text-[#1a73e8] dark:text-[#8ab4f8] bg-[#e8f0fe] dark:bg-[#1a73e8]/15 px-2 py-0.5 rounded-md"
                        title={row.voucher}
                    >
                        {row.voucher}
                    </span>
                ) : (
                    <span className="text-slate-400">-</span>
                )}
            </td>

            {/* Hesap Adı */}
            <td className="px-4 py-3.5 text-[13px] font-medium text-[#202124] dark:text-white whitespace-nowrap max-w-[180px] truncate" title={row.accountName}>
                {row.accountName || '-'}
            </td>

            {/* Misafir Adı */}
            <td className="px-4 py-3.5 text-[13px] text-[#202124] dark:text-slate-200 whitespace-nowrap max-w-[180px] truncate" title={row.guestName}>
                {row.guestName || '-'}
            </td>

            {/* Sipariş Durumu */}
            <td className="px-4 py-3.5 whitespace-nowrap">
                {row.orderStatus ? (
                    <BookingStatusBadge status={row.orderStatus} />
                ) : (
                    <span className="text-slate-300 dark:text-slate-600">-</span>
                )}
            </td>

            {/* İşlem Türü */}
            <td className="px-4 py-3.5 text-xs text-[#5f6368] dark:text-slate-300 whitespace-nowrap">
                {txTypeLabel}
            </td>

            {/* Borç */}
            <td className="px-4 py-3.5 text-right tabular-nums whitespace-nowrap">
                {row.debit > 0 ? (
                    <span className="font-semibold text-[13px] text-rose-600 dark:text-rose-400">
                        {fmt(row.debit)}
                    </span>
                ) : (
                    <span className="text-slate-300 dark:text-slate-600">-</span>
                )}
            </td>

            {/* Alacak */}
            <td className="px-4 py-3.5 text-right tabular-nums whitespace-nowrap">
                {row.credit > 0 ? (
                    <span className="font-semibold text-[13px] text-emerald-600 dark:text-emerald-400">
                        {fmt(row.credit)}
                    </span>
                ) : (
                    <span className="text-slate-300 dark:text-slate-600">-</span>
                )}
            </td>

            {/* Para Birimi */}
            <td className="px-4 py-3.5 whitespace-nowrap">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-[#202124] dark:text-white">
                    <span className="text-base leading-none">{currencyFlag}</span>
                    <span>{row.currency || '-'}</span>
                </div>
            </td>

            {/* İşlem Tarihi */}
            <td className="px-4 py-3.5 text-xs text-[#5f6368] dark:text-slate-400 tabular-nums whitespace-nowrap">
                {fmtDateTime(row.transactionDate)}
            </td>

            {/* Giriş Tarihi */}
            <td className="px-4 py-3.5 text-xs text-[#5f6368] dark:text-slate-400 tabular-nums whitespace-nowrap">
                {fmtDate(row.checkInDate)}
            </td>

            {/* Çıkış Tarihi */}
            <td className="px-4 py-3.5 text-xs text-[#5f6368] dark:text-slate-400 tabular-nums whitespace-nowrap">
                {fmtDate(row.checkOutDate)}
            </td>

            {/* Otel Adı */}
            <td className="px-4 py-3.5 text-[13px] font-medium text-[#202124] dark:text-white whitespace-nowrap max-w-[200px] truncate" title={row.hotelName}>
                {row.hotelName || '-'}
            </td>

            {/* Kayıt Durumu */}
            <td className="px-4 py-3.5 text-center whitespace-nowrap">
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold
                    ${isActive
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/50'
                        : 'bg-slate-100 text-slate-600 border border-slate-200/60 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                    }`}
                >
                    <span className={`size-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                    {row.status || 'ACTIVE'}
                </span>
            </td>
        </tr>
    );
};

export default TransactionDetailPage;
