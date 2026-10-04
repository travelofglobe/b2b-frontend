import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { financeService } from '../services/financeService';
import Pagination from '../components/Pagination';

// ─── Constants ────────────────────────────────────────────────────────────────

const ACCOUNT_TYPE_LABELS = {
    OFFICE:       { tr: 'Ofis',         en: 'Office' },
    SUPPLIER:     { tr: 'Tedarikçi',    en: 'Supplier' },
    CASH:         { tr: 'Nakit',        en: 'Cash' },
    SAFE:         { tr: 'Kasa',         en: 'Safe' },
    CHEQUE:       { tr: 'Çek',          en: 'Cheque' },
    BANK:         { tr: 'Banka',        en: 'Bank' },
    INCOME:       { tr: 'Gelir',        en: 'Income' },
    OTHERS:       { tr: 'Diğer',        en: 'Others' },
    SALES_CHANNEL:{ tr: 'Satış Kanalı', en: 'Sales Channel' },
    CREDIT:       { tr: 'Kredi',        en: 'Credit' },
};

const ACCOUNT_TYPE_COLORS = {
    OFFICE:        'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    SUPPLIER:      'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
    CASH:          'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
    SAFE:          'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
    CHEQUE:        'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
    BANK:          'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300',
    INCOME:        'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
    OTHERS:        'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
    SALES_CHANNEL: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300',
    CREDIT:        'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
};

const STATUS_OPTIONS = ['ACTIVE', 'PASSIVE', 'DELETED'];

const CURRENCY_FLAGS = {
    EUR: '🇪🇺',
    USD: '🇺🇸',
    TRY: '🇹🇷',
    GBP: '🇬🇧',
};

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

const fmtDateTime = (str) => {
    if (!str) return '-';
    const d = new Date(str);
    return d.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' })
        + ' ' + d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
};

// ─── Tabs ──────────────────────────────────────────────────────────────────────

const TABS = [
    { key: 'transactions', label: 'İşlemler', icon: 'receipt_long' },
];

// ─── FinancePage ───────────────────────────────────────────────────────────────

const FinancePage = () => {
    const navigate = useNavigate();
    const location = useLocation();

    // Determine active tab from URL query
    const searchParams = new URLSearchParams(location.search);
    const activeTab = searchParams.get('tab') || 'transactions';

    const setTab = (key) => navigate(`/finance?tab=${key}`, { replace: true });

    return (
        <div className="flex-1 flex flex-col px-4 sm:px-8 py-6 min-h-0 bg-[#f8f9fa] dark:bg-[#202124] w-full">
            <div className="max-w-7xl mx-auto w-full flex flex-col h-full min-h-0">

                {/* Page Header */}
                <div className="pb-0 border border-slate-200 dark:border-slate-700 border-b-0 bg-white dark:bg-[#2c2c2e] rounded-t-xl px-6 pt-5 shadow-sm">
                    <div className="mb-4">
                        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Finans</h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Hesap işlemlerini ve bakiyeleri yönetin</p>
                    </div>

                    {/* Tab Bar */}
                    <div className="flex items-center gap-1">
                        {TABS.map((tab) => (
                            <button
                                key={tab.key}
                                onClick={() => setTab(tab.key)}
                                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors cursor-pointer
                                    ${activeTab === tab.key
                                        ? 'border-[#1a73e8] text-[#1a73e8] dark:text-blue-400 dark:border-blue-400'
                                        : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:border-slate-300'
                                    }`}
                            >
                                <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Tab Content */}
                <div className="flex-1 min-h-0 flex flex-col bg-white dark:bg-[#2c2c2e] rounded-b-xl overflow-hidden shadow-sm border border-t-0 border-slate-200 dark:border-slate-700">
                    {activeTab === 'transactions' && <TransactionsTab />}
                </div>

            </div>
        </div>
    );
};

// ─── TransactionsTab ───────────────────────────────────────────────────────────

const TransactionsTab = () => {
    // Filter state
    const [startDate, setStartDate] = useState(defaultStartDate());
    const [endDate, setEndDate] = useState(today());
    const [status, setStatus] = useState('ACTIVE');

    // Applied filter (triggers fetch)
    const [appliedFilters, setAppliedFilters] = useState({
        startDate: defaultStartDate(),
        endDate: today(),
        status: 'ACTIVE',
    });

    // Table state
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState(10);
    const [totalPages, setTotalPages] = useState(0);
    const [totalItems, setTotalItems] = useState(0);

    const hasLoaded = useRef(false);

    // Fetch whenever applied filters or pagination change
    useEffect(() => {
        const controller = new AbortController();
        const delay = hasLoaded.current ? 300 : 0;

        const timer = setTimeout(() => {
            fetchTransactions(controller.signal);
            hasLoaded.current = true;
        }, delay);

        return () => {
            clearTimeout(timer);
            controller.abort();
        };
    }, [appliedFilters, page, pageSize]);

    const buildPayload = (filters) => {
        const payload = {};
        if (filters.status) payload.status = filters.status;
        if (filters.startDate) payload.startDate = filters.startDate + 'T00:00:00';
        if (filters.endDate)   payload.endDate   = filters.endDate   + 'T23:59:59';
        return payload;
    };

    const fetchTransactions = async (signal) => {
        setLoading(true);
        setError(null);
        try {
            const payload = buildPayload(appliedFilters);
            const res = await financeService.filterTransactions(payload, page, pageSize, 'createDateTime,desc', signal);
            if (!signal?.aborted) {
                setTransactions(res?.transactions || []);
                setTotalPages(res?.numberOfPages || 0);
                setTotalItems(res?.numberOfItems || 0);
            }
        } catch (err) {
            if (err.name !== 'AbortError') {
                console.error('Transaction fetch error:', err);
                setError(err.message || 'Veriler yüklenirken bir hata oluştu.');
            }
        } finally {
            if (!signal?.aborted) setLoading(false);
        }
    };

    const handleSearch = () => {
        setPage(0);
        setAppliedFilters({ startDate, endDate, status });
    };

    const handleClear = () => {
        const cleared = { startDate: defaultStartDate(), endDate: today(), status: 'ACTIVE' };
        setStartDate(cleared.startDate);
        setEndDate(cleared.endDate);
        setStatus(cleared.status);
        setPage(0);
        setAppliedFilters(cleared);
    };

    return (
        <div className="flex flex-col h-full">
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

                    {/* Status */}
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                            Durum
                        </label>
                        <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            className="h-9 px-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-800 dark:text-slate-100 outline-none focus:border-[#1a73e8] transition-colors cursor-pointer"
                        >
                            <option value="">Tümü</option>
                            {STATUS_OPTIONS.map((s) => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>
                    </div>

                    {/* Action Buttons */}
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
                        <button
                            onClick={handleSearch}
                            className="text-sm text-[#1a73e8] hover:underline cursor-pointer"
                        >
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
                            <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60">
                                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide whitespace-nowrap">İşlem ID</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide whitespace-nowrap">Hesap ID</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide whitespace-nowrap">Hesap Türü</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide whitespace-nowrap">Hesap Adı</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide whitespace-nowrap">Para Birimi</th>
                                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide whitespace-nowrap">Borç</th>
                                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide whitespace-nowrap">Alacak</th>
                                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide whitespace-nowrap">Bakiye</th>
                                <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide whitespace-nowrap">Durum</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide whitespace-nowrap">Oluşturma Tarihi</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide whitespace-nowrap">Oluşturan</th>
                            </tr>
                        </thead>
                        <tbody>
                            {transactions.length === 0 ? (
                                <tr>
                                    <td colSpan={11} className="text-center py-16 text-slate-400 dark:text-slate-500">
                                        <div className="flex flex-col items-center gap-2">
                                            <span className="material-symbols-outlined text-4xl">receipt_long</span>
                                            <span className="text-sm">İşlem bulunamadı</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                transactions.map((tx, idx) => (
                                    <TransactionRow key={`${tx.id ?? tx.accountId}-${idx}`} tx={tx} />
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
    );
};

// ─── TransactionRow ────────────────────────────────────────────────────────────

const TransactionRow = ({ tx }) => {
    const navigate = useNavigate();
    const typeLabel = ACCOUNT_TYPE_LABELS[tx.accountType]?.tr || tx.accountType;
    const typeColor = ACCOUNT_TYPE_COLORS[tx.accountType] || ACCOUNT_TYPE_COLORS.OTHERS;
    const currencyFlag = CURRENCY_FLAGS[tx.currency] || '💱';

    const balanceColor = tx.balance < 0
        ? 'text-red-600 dark:text-red-400 font-semibold'
        : tx.balance > 0
            ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
            : 'text-slate-500 dark:text-slate-400';

    const isActive = tx.status === 'ACTIVE';

    const handleRowClick = () => {
        navigate(
            `/finance/transactions/detail?txId=${tx.id}&accountId=${tx.accountId}&accountName=${encodeURIComponent(tx.accountName || '')}`
        );
    };

    return (
        <tr
            onClick={handleRowClick}
            className="border-b border-slate-100 dark:border-slate-800/80 hover:bg-blue-50/60 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group"
        >
            {/* Transaction ID */}
            <td className="px-4 py-3 text-[#1a73e8] dark:text-blue-400 font-semibold text-sm group-hover:underline">
                {tx.id ?? '-'}
            </td>

            {/* Account ID */}
            <td className="px-4 py-3 text-slate-600 dark:text-slate-300 font-mono text-xs">
                {tx.accountId}
            </td>

            {/* Account Type */}
            <td className="px-4 py-3">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${typeColor}`}>
                    {typeLabel}
                </span>
            </td>

            {/* Account Name */}
            <td className="px-4 py-3 text-slate-800 dark:text-slate-100 font-medium">
                {tx.accountName || '-'}
            </td>

            {/* Currency */}
            <td className="px-4 py-3">
                <div className="flex items-center gap-1.5">
                    <span className="text-base leading-none">{currencyFlag}</span>
                    <span className="text-slate-700 dark:text-slate-200 font-medium text-xs">{tx.currency}</span>
                </div>
            </td>

            {/* Debit */}
            <td className="px-4 py-3 text-right text-slate-700 dark:text-slate-200 tabular-nums">
                {tx.debit > 0 ? fmt(tx.debit) : <span className="text-slate-300 dark:text-slate-600">-</span>}
            </td>

            {/* Credit */}
            <td className="px-4 py-3 text-right text-slate-700 dark:text-slate-200 tabular-nums">
                {tx.credit > 0 ? fmt(tx.credit) : <span className="text-slate-300 dark:text-slate-600">-</span>}
            </td>

            {/* Balance */}
            <td className={`px-4 py-3 text-right tabular-nums ${balanceColor}`}>
                {fmt(tx.balance)}
            </td>

            {/* Status */}
            <td className="px-4 py-3 text-center">
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium
                    ${isActive
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                        : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
                    }`}
                >
                    <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                    {tx.status}
                </span>
            </td>

            {/* Created At */}
            <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                {fmtDateTime(tx.createDateTime)}
            </td>

            {/* Created By */}
            <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400 max-w-[160px] truncate" title={tx.createdBy}>
                {tx.createdBy || '-'}
            </td>
        </tr>
    );
};

export default FinancePage;
