import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { financeService } from '../services/financeService';
import Pagination from '../components/Pagination';
import * as XLSX from 'xlsx';
import { downloadXlsxWorkbook } from '../utils/fileDownloadHelper';
import { useAuth } from '../context/AuthContext';

// ─── Constants ────────────────────────────────────────────────────────────────

const ACCOUNT_TYPE_COLORS = {
    OFFICE:        'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800/40',
    SUPPLIER:      'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border-purple-200 dark:border-purple-800/40',
    CASH:          'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/40',
    SAFE:          'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-800/40',
    CHEQUE:        'bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300 border-orange-200 dark:border-orange-800/40',
    BANK:          'bg-sky-50 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300 border-sky-200 dark:border-sky-800/40',
    INCOME:        'bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300 border-teal-200 dark:border-teal-800/40',
    OTHERS:        'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700',
    SALES_CHANNEL: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/40',
    CREDIT:        'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200 dark:border-rose-800/40',
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

// Locale-aware number formatter — updates when i18n language changes
const makeFmt = (locale) => (num) => {
    if (num === null || num === undefined) return '-';
    return Number(num).toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

// Locale-aware date+time formatter
const makeFmtDateTime = (locale) => (str) => {
    if (!str) return '-';
    const d = new Date(str);
    return d.toLocaleDateString(locale, { day: '2-digit', month: '2-digit', year: 'numeric' })
        + ' ' + d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
};

// Map i18n language code to a BCP-47 locale string for Intl APIs
const langToLocale = (lng) => {
    const map = {
        tr: 'tr-TR', en: 'en-GB', ar: 'ar-SA', es: 'es-ES',
        ru: 'ru-RU', zh: 'zh-CN', ja: 'ja-JP', fa: 'fa-IR',
        fr: 'fr-FR', it: 'it-IT', el: 'el-GR', pt: 'pt-PT',
    };
    return map[lng] || 'en-GB';
};

// Skeleton Table Row
const TableSkeleton = ({ rows = 6 }) => (
    <>
        {[...Array(rows)].map((_, i) => (
            <tr key={`skel-${i}`} className="animate-pulse border-b border-[#dadce0]/50 dark:border-[#3c4043]/50">
                <td className="px-4 py-3.5"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-14"></div></td>
                <td className="px-4 py-3.5"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-28"></div></td>
                <td className="px-4 py-3.5"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-16"></div></td>
                <td className="px-4 py-3.5"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-10"></div></td>
                <td className="px-4 py-3.5"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-20 ml-auto"></div></td>
                <td className="px-4 py-3.5"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-20 ml-auto"></div></td>
                <td className="px-4 py-3.5"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-20 ml-auto"></div></td>
                <td className="px-4 py-3.5"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-14 mx-auto"></div></td>
                <td className="px-4 py-3.5"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-24"></div></td>
                <td className="px-4 py-3.5"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-16"></div></td>
            </tr>
        ))}
    </>
);

// ─── FinancePage ───────────────────────────────────────────────────────────────

const FinancePage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { agencyType } = useAuth();
    const { t } = useTranslation();

    // Determine active tab from URL query
    const searchParams = new URLSearchParams(location.search);
    const activeTab = searchParams.get('tab') || 'transactions';

    const canViewLimits = agencyType === 'GSA' || agencyType === 'RSA';

    // Handle seamless redirection if tab=limits is passed
    useEffect(() => {
        if (activeTab === 'limits' && canViewLimits) {
            navigate('/finance/limits', { replace: true });
        }
    }, [activeTab, canViewLimits, navigate]);

    return (
        <div className="flex-1 flex flex-col min-h-0 bg-[#f8f9fa] dark:bg-[#18191c] overflow-y-auto font-roboto">
            {/* Sticky Header Bar */}
            <header className="sticky top-0 bg-white/95 dark:bg-[#202124]/95 backdrop-blur-md border-b border-[#dadce0] dark:border-[#3c4043] px-6 sm:px-10 lg:px-12 xl:px-14 py-3.5 flex-shrink-0 z-30 transition-all shadow-2xs">
                <div className="max-w-[1440px] mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                        <div className="w-11 h-11 rounded-2xl bg-[#e8f0fe] dark:bg-[#1a73e8]/20 flex items-center justify-center text-[#1a73e8] dark:text-[#8ab4f8] shrink-0 shadow-2xs">
                            <span className="material-symbols-outlined text-[24px]">account_balance_wallet</span>
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-xl font-bold text-[#202124] dark:text-[#e8eaed] tracking-tight">{t('finance.title')}</h1>
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#e8f0fe] text-[#1a73e8] dark:bg-[#1a73e8]/20 dark:text-[#8ab4f8]">
                                    {t('finance.transactionsBadge')}
                                </span>
                            </div>
                            <p className="text-xs text-[#5f6368] dark:text-[#9aa0a6] mt-0.5">
                                {t('finance.transactionsSubtitle')}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Tab Navigation - Unified with Limit Management */}
                <div className="max-w-[1440px] mx-auto mt-3.5 flex items-center gap-1.5">
                    <button
                        type="button"
                        onClick={() => navigate('/finance?tab=transactions', { replace: true })}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all border bg-[#e8f0fe] border-[#1a73e8] text-[#1a73e8] dark:bg-[#1a73e8]/20 dark:border-[#8ab4f8] dark:text-[#8ab4f8] shadow-xs cursor-pointer"
                    >
                        <span className="material-symbols-outlined text-[18px]">receipt_long</span>
                        <span>{t('finance.tabTransactions')}</span>
                    </button>
                    {canViewLimits && (
                        <button
                            type="button"
                            onClick={() => navigate('/finance/limits')}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all border bg-white dark:bg-[#202124] border-[#dadce0] dark:border-[#3c4043] text-[#5f6368] dark:text-[#9aa0a6] hover:bg-[#f1f3f4] dark:hover:bg-[#303134] cursor-pointer"
                        >
                            <span className="material-symbols-outlined text-[18px]">tune</span>
                            <span>{t('finance.tabLimits')}</span>
                        </button>
                    )}
                </div>
            </header>

            {/* Main Content Area */}
            <main className="max-w-[1440px] w-full mx-auto px-6 sm:px-10 lg:px-12 xl:px-14 py-6">
                {activeTab === 'transactions' && <TransactionsTab />}
            </main>
        </div>
    );
};

// ─── TransactionsTab ───────────────────────────────────────────────────────────

const TransactionsTab = () => {
    const { t, i18n } = useTranslation();

    // Locale-aware formatters — recomputed when language changes
    const fmt = useMemo(() => makeFmt(langToLocale(i18n.language)), [i18n.language]);
    const fmtDateTime = useMemo(() => makeFmtDateTime(langToLocale(i18n.language)), [i18n.language]);

    // Filter state
    const [startDate, setStartDate] = useState(defaultStartDate());
    const [endDate, setEndDate] = useState(today());
    const [status, setStatus] = useState('ACTIVE');
    const [searchQuery, setSearchQuery] = useState('');

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
    const [isExporting, setIsExporting] = useState(false);

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
                setError(err.message || t('finance.errorLoading'));
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
        setSearchQuery('');
        setPage(0);
        setAppliedFilters(cleared);
    };

    // Client-side quick filter on current page transactions
    const filteredTransactions = useMemo(() => {
        if (!searchQuery.trim()) return transactions;
        const q = searchQuery.toLowerCase().trim();
        return transactions.filter(tx =>
            String(tx.id).includes(q) ||
            String(tx.accountId).includes(q) ||
            (tx.accountName && tx.accountName.toLowerCase().includes(q)) ||
            (tx.createdBy && tx.createdBy.toLowerCase().includes(q)) ||
            (tx.accountType && tx.accountType.toLowerCase().includes(q))
        );
    }, [transactions, searchQuery]);

    // Financial calculations strictly from current data
    const metrics = useMemo(() => {
        let totalDebit = 0;
        let totalCredit = 0;
        let currency = 'EUR';

        transactions.forEach(tx => {
            if (tx.debit) totalDebit += Number(tx.debit) || 0;
            if (tx.credit) totalCredit += Number(tx.credit) || 0;
            if (tx.currency) currency = tx.currency;
        });

        const netBalance = totalCredit - totalDebit;

        return {
            count: totalItems || transactions.length,
            debit: totalDebit,
            credit: totalCredit,
            net: netBalance,
            currency: currency
        };
    }, [transactions, totalItems]);

    const handleExportExcel = () => {
        if (isExporting || transactions.length === 0) return;
        setIsExporting(true);
        try {
            const exportData = filteredTransactions.map(tx => ({
                [t('finance.excelTransactionNo')]: tx.id ?? '',
                [t('finance.excelAccountId')]: tx.accountId ?? '',
                [t('finance.excelAccountType')]: t(`finance.accountTypes.${tx.accountType}`, { defaultValue: tx.accountType || '' }),
                [t('finance.excelAccountName')]: tx.accountName || '-',
                [t('finance.excelCurrency')]: tx.currency || '',
                [t('finance.excelDebit')]: tx.debit != null ? Number(tx.debit).toFixed(2) : '0.00',
                [t('finance.excelCredit')]: tx.credit != null ? Number(tx.credit).toFixed(2) : '0.00',
                [t('finance.excelBalance')]: tx.balance != null ? Number(tx.balance).toFixed(2) : '0.00',
                [t('finance.excelStatus')]: tx.status || '',
                [t('finance.excelDate')]: fmtDateTime(tx.createDateTime),
                [t('finance.excelCreatedBy')]: tx.createdBy || '-'
            }));

            const worksheet = XLSX.utils.json_to_sheet(exportData);
            worksheet['!cols'] = [
                { wch: 12 }, { wch: 12 }, { wch: 15 }, { wch: 25 }, { wch: 10 },
                { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 12 }, { wch: 20 }, { wch: 20 }
            ];
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Transactions');
            downloadXlsxWorkbook(XLSX, workbook, `Finance_Transactions_${today()}.xlsx`);
        } catch (err) {
            console.error('Excel Export Error:', err);
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="space-y-5">
            {/* 4 Financial Metric Cards (derived strictly from active records) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-[#202124] p-5 sm:p-6 rounded-2xl border border-[#dadce0] dark:border-[#3c4043] shadow-xs hover:shadow-sm transition-all duration-200 flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-semibold text-[#5f6368] dark:text-[#9aa0a6] uppercase tracking-wider">{t('finance.totalTransactions')}</span>
                        <div className="size-10 bg-[#e8f0fe] dark:bg-[#1a73e8]/20 rounded-xl flex items-center justify-center text-[#1a73e8] dark:text-[#8ab4f8] shrink-0">
                            <span className="material-symbols-outlined text-[22px]">receipt_long</span>
                        </div>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <div className="text-2xl sm:text-3xl font-bold text-[#202124] dark:text-white leading-none tabular-nums tracking-tight">
                            {loading && transactions.length === 0 ? '...' : metrics.count}
                        </div>
                        <span className="text-xs font-medium text-[#70757a]">{t('finance.movements')}</span>
                    </div>
                </div>

                <div className="bg-white dark:bg-[#202124] p-5 sm:p-6 rounded-2xl border border-[#dadce0] dark:border-[#3c4043] shadow-xs hover:shadow-sm transition-all duration-200 flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-semibold text-rose-700 dark:text-rose-400 uppercase tracking-wider">{t('finance.pageTotalDebit')}</span>
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
                        <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">{t('finance.pageTotalCredit')}</span>
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
                        <span className="text-xs font-semibold text-[#1a73e8] dark:text-[#8ab4f8] uppercase tracking-wider">{t('finance.netMovement')}</span>
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

            {/* Table & Toolbar Container */}
            <div className="bg-white dark:bg-[#202124] rounded-2xl border border-[#dadce0] dark:border-[#3c4043] overflow-hidden shadow-xs flex flex-col">
                {/* Advanced Filter Toolbar */}
                <div className="p-4 border-b border-[#dadce0] dark:border-[#3c4043] flex flex-wrap items-center justify-between gap-3 bg-slate-50/50 dark:bg-[#202124]">
                    <div className="flex flex-wrap items-center gap-3 flex-1">
                        {/* Quick Search */}
                        <div className="relative min-w-[200px] flex-1 max-w-xs">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#70757a] text-[18px]">search</span>
                            <input
                                type="text"
                                placeholder={t('finance.searchPlaceholder')}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-7 h-10 bg-white dark:bg-[#303134] border border-[#dadce0] dark:border-[#5f6368] focus:border-[#1a73e8] rounded-xl text-xs text-[#202124] dark:text-white placeholder-[#70757a] outline-none transition-all shadow-2xs"
                            />
                            {searchQuery && (
                                <button
                                    type="button"
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#70757a] hover:text-[#202124] cursor-pointer"
                                >
                                    <span className="material-symbols-outlined text-[15px]">close</span>
                                </button>
                            )}
                        </div>

                        {/* Start Date */}
                        <div className="flex items-center gap-1.5">
                            <span className="text-[11px] font-semibold text-[#5f6368] dark:text-[#9aa0a6] uppercase">{t('finance.startDate')}</span>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="h-10 px-3 bg-white dark:bg-[#303134] border border-[#dadce0] dark:border-[#5f6368] rounded-xl text-xs text-[#202124] dark:text-white outline-none focus:border-[#1a73e8] cursor-pointer shadow-2xs"
                            />
                        </div>

                        {/* End Date */}
                        <div className="flex items-center gap-1.5">
                            <span className="text-[11px] font-semibold text-[#5f6368] dark:text-[#9aa0a6] uppercase">{t('finance.endDate')}</span>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="h-10 px-3 bg-white dark:bg-[#303134] border border-[#dadce0] dark:border-[#5f6368] rounded-xl text-xs text-[#202124] dark:text-white outline-none focus:border-[#1a73e8] cursor-pointer shadow-2xs"
                            />
                        </div>

                        {/* Status */}
                        <div className="flex items-center gap-1.5">
                            <select
                                value={status}
                                onChange={(e) => setStatus(e.target.value)}
                                className="h-10 px-3 bg-white dark:bg-[#303134] border border-[#dadce0] dark:border-[#5f6368] rounded-xl text-xs text-[#3c4043] dark:text-slate-200 focus:border-[#1a73e8] outline-none cursor-pointer shadow-2xs"
                            >
                                <option value="">{t('finance.allStatuses')}</option>
                                {STATUS_OPTIONS.map((s) => (
                                    <option key={s} value={s}>{s}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Filter Action Buttons */}
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={handleSearch}
                            className="flex items-center gap-1.5 h-10 px-4 rounded-xl bg-[#1a73e8] hover:bg-[#1557b0] text-white text-xs font-semibold shadow-xs active:scale-95 transition-all cursor-pointer"
                        >
                            <span className="material-symbols-outlined text-[17px]">search</span>
                            <span>{t('finance.filter')}</span>
                        </button>
                        <button
                            type="button"
                            onClick={handleClear}
                            className="flex items-center gap-1.5 h-10 px-3.5 rounded-xl bg-white dark:bg-[#303134] border border-[#dadce0] dark:border-[#5f6368] text-slate-700 dark:text-slate-300 hover:bg-[#f1f3f4] dark:hover:bg-[#3c4043] text-xs font-medium transition-all shadow-2xs cursor-pointer"
                        >
                            <span className="material-symbols-outlined text-[17px]">restart_alt</span>
                            <span>{t('finance.reset')}</span>
                        </button>
                        <button
                            type="button"
                            onClick={handleExportExcel}
                            disabled={isExporting || transactions.length === 0}
                            className="flex items-center gap-1.5 h-10 px-3.5 rounded-xl bg-white dark:bg-[#303134] border border-[#dadce0] dark:border-[#5f6368] text-emerald-600 dark:text-emerald-400 hover:bg-[#f1f3f4] dark:hover:bg-[#3c4043] text-xs font-medium transition-all shadow-2xs cursor-pointer disabled:opacity-50"
                            title={t('finance.exportExcel')}
                        >
                            <span className="material-symbols-outlined text-[17px]">table_view</span>
                            <span className="hidden sm:inline">Excel</span>
                        </button>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    {error ? (
                        <div className="flex flex-col items-center justify-center py-16 gap-3">
                            <div className="size-12 rounded-2xl bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 flex items-center justify-center">
                                <span className="material-symbols-outlined text-[26px]">error</span>
                            </div>
                            <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">{error}</p>
                            <button
                                type="button"
                                onClick={handleSearch}
                                className="text-xs text-[#1a73e8] hover:underline cursor-pointer font-semibold"
                            >
                                {t('finance.retry')}
                            </button>
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-[#f8f9fa] dark:bg-[#202124] border-b border-[#dadce0] dark:border-[#3c4043] text-[11px] font-semibold text-[#5f6368] dark:text-[#9aa0a6] uppercase tracking-wider select-none">
                                    <th className="px-4 py-3">{t('finance.colTransactionNo')}</th>
                                    <th className="px-4 py-3">{t('finance.colAccountId')}</th>
                                    <th className="px-4 py-3">{t('finance.colAccountType')}</th>
                                    <th className="px-4 py-3">{t('finance.colAccountName')}</th>
                                    <th className="px-4 py-3">{t('finance.colCurrency')}</th>
                                    <th className="px-4 py-3 text-right">{t('finance.colDebit')}</th>
                                    <th className="px-4 py-3 text-right">{t('finance.colCredit')}</th>
                                    <th className="px-4 py-3 text-right">{t('finance.colBalance')}</th>
                                    <th className="px-4 py-3 text-center">{t('finance.colStatus')}</th>
                                    <th className="px-4 py-3">{t('finance.colDate')}</th>
                                    <th className="px-4 py-3">{t('finance.colCreatedBy')}</th>
                                    <th className="px-4 py-3 text-right">{t('finance.colDetail')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#dadce0]/60 dark:divide-[#3c4043]/60 text-xs text-[#202124] dark:text-slate-100">
                                {loading ? (
                                    <TableSkeleton rows={6} />
                                ) : filteredTransactions.length === 0 ? (
                                    <tr>
                                        <td colSpan={12} className="px-4 py-16 text-center text-[#70757a]">
                                            <div className="flex flex-col items-center gap-2">
                                                <div className="size-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                                                    <span className="material-symbols-outlined text-[26px]">receipt_long</span>
                                                </div>
                                                <p className="text-xs font-medium">{t('finance.noTransactions')}</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredTransactions.map((tx) => (
                                        <TransactionRow key={tx.id} tx={tx} fmt={fmt} fmtDateTime={fmtDateTime} />
                                    ))
                                )}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Pagination */}
                {!loading && !error && totalItems > 0 && (
                    <div className="border-t border-[#dadce0] dark:border-[#3c4043]">
                        <Pagination
                            currentPage={page}
                            totalPages={totalPages}
                            pageSize={pageSize}
                            totalElements={totalItems}
                            onPageChange={(p) => setPage(p)}
                            onPageSizeChange={(s) => { setPageSize(s); setPage(0); }}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

// ─── TransactionRow ────────────────────────────────────────────────────────────

const TransactionRow = ({ tx, fmt, fmtDateTime }) => {
    const navigate = useNavigate();
    const { t } = useTranslation();

    // Use i18n translation for account type label; fall back to the raw value
    const typeLabel = t(`finance.accountTypes.${tx.accountType}`, { defaultValue: tx.accountType || '-' });
    const typeClass = ACCOUNT_TYPE_COLORS[tx.accountType] || ACCOUNT_TYPE_COLORS.OTHERS;
    const currencyFlag = CURRENCY_FLAGS[tx.currency] || '💱';

    const isPositiveBalance = (tx.balance || 0) > 0;
    const isNegativeBalance = (tx.balance || 0) < 0;

    const isActive = tx.status === 'ACTIVE';

    const handleRowClick = () => {
        navigate(
            `/finance/transactions/detail?txId=${tx.id}&accountId=${tx.accountId}&accountName=${encodeURIComponent(tx.accountName || '')}`
        );
    };

    return (
        <tr
            onClick={handleRowClick}
            className="hover:bg-[#f8f9fa] dark:hover:bg-[#2a2b2e]/60 transition-colors cursor-pointer group"
        >
            {/* Transaction ID */}
            <td className="px-4 py-3 text-[#1a73e8] dark:text-blue-400 font-bold text-xs font-mono group-hover:underline">
                #{tx.id ?? '-'}
            </td>

            {/* Account ID */}
            <td className="px-4 py-3 text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                {tx.accountId}
            </td>

            {/* Account Type */}
            <td className="px-4 py-3">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${typeClass}`}>
                    {typeLabel}
                </span>
            </td>

            {/* Account Name */}
            <td className="px-4 py-3 font-semibold text-[#202124] dark:text-white max-w-[200px] truncate" title={tx.accountName}>
                {tx.accountName || '-'}
            </td>

            {/* Currency */}
            <td className="px-4 py-3">
                <div className="flex items-center gap-1 text-[11px] font-bold">
                    <span>{currencyFlag}</span>
                    <span className="text-[#202124] dark:text-white">{tx.currency}</span>
                </div>
            </td>

            {/* Debit (Borç) */}
            <td className="px-4 py-3 text-right tabular-nums">
                {tx.debit > 0 ? (
                    <span className="text-rose-600 dark:text-rose-400 font-semibold text-xs">
                        {fmt(tx.debit)}
                    </span>
                ) : (
                    <span className="text-slate-300 dark:text-slate-600">-</span>
                )}
            </td>

            {/* Credit (Alacak) */}
            <td className="px-4 py-3 text-right tabular-nums">
                {tx.credit > 0 ? (
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold text-xs">
                        {fmt(tx.credit)}
                    </span>
                ) : (
                    <span className="text-slate-300 dark:text-slate-600">-</span>
                )}
            </td>

            {/* Balance */}
            <td className="px-4 py-3 text-right tabular-nums">
                <span className={`font-bold text-xs ${
                    isNegativeBalance
                        ? 'text-rose-600 dark:text-rose-400'
                        : isPositiveBalance
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-slate-500'
                }`}>
                    {fmt(tx.balance)}
                </span>
            </td>

            {/* Status */}
            <td className="px-4 py-3 text-center">
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    isActive
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                        : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                }`}>
                    <span className={`size-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                    {tx.status}
                </span>
            </td>

            {/* Created At */}
            <td className="px-4 py-3 text-[11px] text-slate-500 dark:text-slate-400 whitespace-nowrap tabular-nums">
                {fmtDateTime(tx.createDateTime)}
            </td>

            {/* Created By */}
            <td className="px-4 py-3 text-[11px] text-slate-500 dark:text-slate-400 max-w-[140px] truncate" title={tx.createdBy}>
                {tx.createdBy || '-'}
            </td>

            {/* Action / Arrow */}
            <td className="px-4 py-3 text-right">
                <span className="material-symbols-outlined text-[18px] text-slate-400 group-hover:text-[#1a73e8] transition-colors">
                    chevron_right
                </span>
            </td>
        </tr>
    );
};

export default FinancePage;
