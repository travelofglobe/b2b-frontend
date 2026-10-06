import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { financeService } from '../services/financeService';
import { agencyService } from '../services/agencyService';
import { useAuth } from '../context/AuthContext';
import Pagination from '../components/Pagination';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (num) => {
    if (num === null || num === undefined) return '-';
    return Number(num).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const fmtDate = (str) => {
    if (!str) return '-';
    const d = new Date(str);
    return d.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const LIMIT_STATUS_OPTIONS = [
    { value: '', label: 'Tümü' },
    { value: 'ACTIVE', label: 'Aktif' },
    { value: 'PASSIVE', label: 'Pasif' },
];

const AGENCY_TYPE_OPTIONS = [
    { value: '', label: 'Tümü' },
    { value: 'RSA', label: 'RSA' },
    { value: 'AGENCY', label: 'Agency' },
];

// ─── Usage Bar ─────────────────────────────────────────────────────────────────

const UsageBar = ({ rate }) => {
    const pct = Math.min(Math.max(Number(rate) || 0, 0), 100);
    const color =
        pct >= 90 ? 'bg-red-500'
        : pct >= 70 ? 'bg-amber-400'
        : 'bg-emerald-500';

    return (
        <div className="flex items-center gap-2">
            <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden min-w-[80px]">
                <div
                    className={`h-full rounded-full transition-all duration-500 ${color}`}
                    style={{ width: `${pct}%` }}
                />
            </div>
            <span className={`text-xs font-semibold tabular-nums w-8 text-right ${
                pct >= 90 ? 'text-red-600 dark:text-red-400'
                : pct >= 70 ? 'text-amber-600 dark:text-amber-400'
                : 'text-emerald-600 dark:text-emerald-400'
            }`}>
                {pct.toFixed(0)}%
            </span>
        </div>
    );
};

// ─── Status Badge ──────────────────────────────────────────────────────────────

const StatusBadge = ({ status }) => {
    if (status === 'ACTIVE') {
        return (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Aktif
            </span>
        );
    }
    if (status === 'PASSIVE') {
        return (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                Pasif
            </span>
        );
    }
    return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400">
            -
        </span>
    );
};

// ─── Warning Badge ─────────────────────────────────────────────────────────────

const WarningBadge = () => (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 ml-1">
        <span className="material-symbols-outlined text-[12px]">warning</span>
        Uyarı
    </span>
);

// ─── Summary Cards ─────────────────────────────────────────────────────────────

const SummaryCards = ({ summary, loading }) => {
    const cards = [
        {
            label: 'Toplam Credit Limit',
            value: summary ? fmt(summary.totalCreditLimit) : '—',
            sub: summary ? `${summary.totalLimitCount ?? 0} adet limit tanımı` : '',
            color: 'text-slate-800 dark:text-slate-100',
            icon: 'credit_card',
            iconBg: 'bg-slate-100 dark:bg-slate-700',
            iconColor: 'text-slate-500 dark:text-slate-300',
            border: 'border-slate-200 dark:border-slate-700',
        },
        {
            label: 'Toplam Used Limit',
            value: summary ? fmt(summary.totalUsedLimit) : '—',
            sub: summary ? `Kullanım oranı: %${Number(summary.usedRate ?? 0).toFixed(0)}` : '',
            color: 'text-red-600 dark:text-red-400',
            icon: 'trending_up',
            iconBg: 'bg-red-50 dark:bg-red-900/20',
            iconColor: 'text-red-500 dark:text-red-400',
            border: 'border-red-100 dark:border-red-900/30',
        },
        {
            label: 'Toplam Available Limit',
            value: summary ? fmt(summary.totalAvailableLimit) : '—',
            sub: 'Kalan kullanılabilir',
            color: 'text-emerald-600 dark:text-emerald-400',
            icon: 'savings',
            iconBg: 'bg-emerald-50 dark:bg-emerald-900/20',
            iconColor: 'text-emerald-500 dark:text-emerald-400',
            border: 'border-emerald-100 dark:border-emerald-900/30',
        },
    ];

    return (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
            {cards.map((c) => (
                <div
                    key={c.label}
                    className={`border ${c.border} rounded-xl p-5 bg-white dark:bg-[#2c2c2e] shadow-sm flex items-center gap-4`}
                >
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${c.iconBg}`}>
                        <span className={`material-symbols-outlined text-[22px] ${c.iconColor}`}>{c.icon}</span>
                    </div>
                    <div className="flex flex-col gap-0.5 min-w-0">
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                            {c.label}
                        </span>
                        {loading ? (
                            <div className="h-7 w-32 bg-slate-200 dark:bg-slate-700 animate-pulse rounded mt-0.5" />
                        ) : (
                            <span className={`text-2xl font-bold tabular-nums leading-tight ${c.color}`}>
                                {c.value}
                            </span>
                        )}
                        <span className="text-xs text-slate-400 dark:text-slate-500">{c.sub}</span>
                    </div>
                </div>
            ))}
        </div>
    );
};

// ─── Create / Edit Modal ───────────────────────────────────────────────────────

// ─── Agency Type Badge ─────────────────────────────────────────────────────────

const agencyTypeBadgeClass = (type) => {
    if (type === 'RSA')    return 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300';
    if (type === 'AGENCY') return 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300';
    return 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300';
};

// ─── Create / Edit Modal ───────────────────────────────────────────────────────

const CreateEditLimitModal = ({ isOpen, onClose, onSuccess, editData, agencyType }) => {
    const [agencies, setAgencies] = useState([]);
    const [agenciesLoading, setAgenciesLoading] = useState(false);
    const [selectedAgencyId, setSelectedAgencyId] = useState('');

    const [creditLimit, setCreditLimit] = useState('');
    const [status, setStatus] = useState('ACTIVE');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    const isEdit = !!editData;

    // On open: reset form and load agencies (create mode only)
    useEffect(() => {
        if (!isOpen) return;
        setError(null);
        setSaving(false);

        if (isEdit) {
            setCreditLimit(String(editData.creditLimit ?? ''));
            setStatus(editData.status ?? 'ACTIVE');
            setSelectedAgencyId('');
            setAgencies([]);
        } else {
            setCreditLimit('');
            setStatus('ACTIVE');
            setSelectedAgencyId('');
            // Fetch full agency list on modal open
            const ctrl = new AbortController();
            setAgenciesLoading(true);
            const filterAgencyType = agencyType === 'RSA' ? 'AGENCY' : undefined;
            agencyService.filterAgencies({
                page: 0,
                size: 200,
                ...(filterAgencyType ? { agencyType: filterAgencyType } : {}),
            }, ctrl.signal)
                .then((res) => {
                    const list = res?.agencyList || res?.agencies || res?.content || [];
                    setAgencies(list);
                })
                .catch(() => setAgencies([]))
                .finally(() => setAgenciesLoading(false));
            return () => ctrl.abort();
        }
    }, [isOpen]);

    const selectedAgency = agencies.find((a) => String(a.id) === String(selectedAgencyId)) ?? null;
    const availableLimit = Number(creditLimit) || 0;

    const handleSubmit = async () => {
        setError(null);
        if (!isEdit && !selectedAgencyId) { setError('Lütfen bir acente seçin.'); return; }
        if (!creditLimit || isNaN(Number(creditLimit)) || Number(creditLimit) <= 0) {
            setError('Geçerli bir credit limit girin.'); return;
        }
        setSaving(true);
        try {
            if (isEdit) {
                await financeService.updateLimit(editData.id, {
                    creditLimit: Number(creditLimit),
                    status,
                });
            } else {
                await financeService.createLimit({
                    agencyId: Number(selectedAgencyId),
                    creditLimit: Number(creditLimit),
                    usedLimit: 0,
                });
            }
            onSuccess?.();
            onClose();
        } catch (err) {
            setError(err?.message || 'İşlem sırasında hata oluştu.');
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-[1000] flex items-center justify-center p-4">
            <div className="bg-white dark:bg-[#2c2c2e] rounded-2xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden">
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
                            <span className="material-symbols-outlined text-[20px] text-[#1a73e8]">tune</span>
                        </div>
                        <div>
                            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                                {isEdit ? 'Limit Düzenle' : `${agencyType === 'GSA' ? 'GSA' : 'RSA'} → Agency Limit Tanımla`}
                            </h2>
                            <p className="text-xs text-slate-400 dark:text-slate-500">
                                {agencyType === 'GSA' ? 'GSA → RSA / Agency' : 'RSA → Agency'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 transition-colors cursor-pointer"
                    >
                        <span className="material-symbols-outlined text-[18px]">close</span>
                    </button>
                </div>

                {/* Info banner */}
                <div className="mx-6 mt-4 px-3 py-2.5 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/40 text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
                    Her kademe kendi verdiği limitten sorumludur. Üst kademe limiti, alt kademe için matematiksel bir üst sınır değildir.
                </div>

                {/* Body */}
                <div className="px-6 py-5 flex flex-col gap-4">

                    {/* ── Agency dropdown — create only ── */}
                    {!isEdit && (
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                                Agency Adı
                            </label>

                            {agenciesLoading ? (
                                <div className="h-10 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse flex items-center px-3 gap-2">
                                    <span className="material-symbols-outlined text-[16px] text-slate-400 animate-spin">progress_activity</span>
                                    <span className="text-xs text-slate-400">Acenteler yükleniyor...</span>
                                </div>
                            ) : (
                                <>
                                    <div className="relative">
                                        <select
                                            value={selectedAgencyId}
                                            onChange={(e) => setSelectedAgencyId(e.target.value)}
                                            className="w-full h-10 pl-3 pr-9 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-800 dark:text-slate-100 outline-none focus:border-[#1a73e8] transition-colors cursor-pointer appearance-none"
                                        >
                                            <option value="">Seçiniz...</option>
                                            {agencies.map((ag) => (
                                                <option key={ag.id} value={String(ag.id)}>
                                                    {ag.name}{'  '}[{ag.agencyType}]
                                                </option>
                                            ))}
                                        </select>
                                        <span className="material-symbols-outlined pointer-events-none absolute right-2.5 top-2.5 text-[18px] text-slate-400">
                                            expand_more
                                        </span>
                                    </div>

                                    {/* Selected agency detail card */}
                                    {selectedAgency && (
                                        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                                            <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                                                <span className="material-symbols-outlined text-[15px] text-[#1a73e8]">business_center</span>
                                            </div>
                                            <div className="flex flex-col min-w-0 flex-1">
                                                <span className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">
                                                    {selectedAgency.name}
                                                </span>
                                                {selectedAgency.email && (
                                                    <span className="text-[11px] text-slate-400 dark:text-slate-500 truncate">
                                                        {selectedAgency.email}
                                                    </span>
                                                )}
                                            </div>
                                            <span className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide ${agencyTypeBadgeClass(selectedAgency.agencyType)}`}>
                                                {selectedAgency.agencyType}
                                            </span>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    )}

                    {/* ── Edit: show agency as read-only ── */}
                    {isEdit && editData?.agency && (
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Agency</label>
                            <div className="flex items-center gap-3 px-3 h-10 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg">
                                <span className="material-symbols-outlined text-[16px] text-slate-400">business_center</span>
                                <span className="text-sm text-slate-600 dark:text-slate-300 flex-1 truncate">{editData.agency.name}</span>
                                {editData.agency.agencyType && (
                                    <span className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide ${agencyTypeBadgeClass(editData.agency.agencyType)}`}>
                                        {editData.agency.agencyType}
                                    </span>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ── Credit Limit ── */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Credit Limit</label>
                        <input
                            type="number"
                            min="0"
                            step="100"
                            placeholder="10000"
                            value={creditLimit}
                            onChange={(e) => setCreditLimit(e.target.value)}
                            className="h-10 px-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-800 dark:text-slate-100 outline-none focus:border-[#1a73e8] transition-colors"
                        />
                    </div>

                    {/* ── Used Limit — create only, read-only ── */}
                    {!isEdit && (
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                                Kullanılan Limit <span className="normal-case font-normal text-slate-400">(Salt Okunur)</span>
                            </label>
                            <input
                                type="number"
                                value="0"
                                readOnly
                                className="h-10 px-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-500 dark:text-slate-400 outline-none cursor-not-allowed"
                            />
                        </div>
                    )}

                    {/* ── Available limit preview ── */}
                    <div className="px-3 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                        <span className="text-xs text-slate-500 dark:text-slate-400">Kullanılabilir Limit:</span>
                        <span className={`text-sm font-semibold tabular-nums ${availableLimit > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                            {creditLimit ? fmt(availableLimit) : '—'}
                        </span>
                    </div>

                    {/* ── Status — edit only ── */}
                    {isEdit && (
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Durum</label>
                            <select
                                value={status}
                                onChange={(e) => setStatus(e.target.value)}
                                className="h-10 px-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-800 dark:text-slate-100 outline-none focus:border-[#1a73e8] transition-colors cursor-pointer"
                            >
                                <option value="ACTIVE">Aktif</option>
                                <option value="PASSIVE">Pasif</option>
                            </select>
                        </div>
                    )}

                    {/* ── Error ── */}
                    {error && (
                        <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40">
                            <span className="material-symbols-outlined text-[16px] text-red-500">error</span>
                            <span className="text-xs text-red-600 dark:text-red-400">{error}</span>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        disabled={saving}
                        className="h-9 px-5 rounded-full border border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer disabled:opacity-50"
                    >
                        İptal
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={saving}
                        className="h-9 px-6 rounded-full bg-[#1a73e8] hover:bg-[#1558b0] text-white text-sm font-medium transition-colors cursor-pointer disabled:opacity-60 flex items-center gap-2"
                    >
                        {saving && <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>}
                        {isEdit ? 'Güncelle' : 'Kaydet'}
                    </button>
                </div>
            </div>
        </div>
    );
};

// ─── LimitManagementPage ──────────────────────────────────────────────────────

const LimitManagementPage = () => {
    const navigate = useNavigate();
    const { agencyType } = useAuth();

    // ── Filter state ──────────────────────────────────────────────────────────
    const [queryInput, setQueryInput] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [agencyTypeFilter, setAgencyTypeFilter] = useState(
        agencyType === 'RSA' ? 'AGENCY' : ''
    );
    const [currencyFilter, setCurrencyFilter] = useState('');

    // ── Applied filters (trigger fetch) ───────────────────────────────────────
    const [appliedFilters, setAppliedFilters] = useState({
        query: '',
        status: '',
        agencyType: agencyType === 'RSA' ? 'AGENCY' : '',
        currency: '',
    });

    // ── Table state ───────────────────────────────────────────────────────────
    const [limits, setLimits] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState(10);
    const [totalPages, setTotalPages] = useState(0);
    const [totalItems, setTotalItems] = useState(0);

    // ── Summary ───────────────────────────────────────────────────────────────
    const [summary, setSummary] = useState(null);
    const [summaryLoading, setSummaryLoading] = useState(false);

    // ── Currency list ─────────────────────────────────────────────────────────
    const [currencies, setCurrencies] = useState([]);

    // ── Modal ─────────────────────────────────────────────────────────────────
    const [modalOpen, setModalOpen] = useState(false);
    const [editData, setEditData] = useState(null);

    const queryTimerRef = useRef(null);

    // AGENCY users should not access this page
    useEffect(() => {
        if (agencyType === 'AGENCY') {
            navigate('/finance', { replace: true });
        }
    }, [agencyType, navigate]);

    // Fetch currencies once
    useEffect(() => {
        const ctrl = new AbortController();
        financeService.listActiveCurrencies(ctrl.signal)
            .then((list) => {
                if (Array.isArray(list)) setCurrencies(list.filter((c) => c.status === 'ACTIVE'));
            })
            .catch(() => {});
        return () => ctrl.abort();
    }, []);

    // Fetch summary (and refresh after mutations)
    const fetchSummary = useCallback(async () => {
        setSummaryLoading(true);
        try {
            const res = await financeService.getLimitSummary();
            setSummary(res);
        } catch { /* non-critical */ }
        finally { setSummaryLoading(false); }
    }, []);

    useEffect(() => { fetchSummary(); }, [fetchSummary]);

    // Fetch limits on filter/page change
    useEffect(() => {
        const controller = new AbortController();
        const timer = setTimeout(() => fetchLimits(controller.signal), 0);
        return () => { clearTimeout(timer); controller.abort(); };
    }, [appliedFilters, page, pageSize]);

    const fetchLimits = async (signal) => {
        setLoading(true);
        setError(null);
        try {
            const payload = {};
            if (appliedFilters.query)      payload.query      = appliedFilters.query;
            if (appliedFilters.status)     payload.status     = appliedFilters.status;
            if (appliedFilters.agencyType) payload.agencyType = appliedFilters.agencyType;
            if (appliedFilters.currency)   payload.currency   = appliedFilters.currency;

            const res = await financeService.filterLimits(payload, page, pageSize, signal);
            if (!signal?.aborted) {
                setLimits(res?.agencyLimits || []);
                setTotalPages(res?.numberOfPages || 0);
                setTotalItems(res?.numberOfItems || 0);
            }
        } catch (err) {
            if (err?.name !== 'AbortError') {
                setError(err?.message || 'Veriler yüklenirken bir hata oluştu.');
            }
        } finally {
            if (!signal?.aborted) setLoading(false);
        }
    };

    // Query: auto-search after 3+ chars with debounce
    const handleQueryChange = (val) => {
        setQueryInput(val);
        if (queryTimerRef.current) clearTimeout(queryTimerRef.current);
        if (val.length === 0) {
            setPage(0);
            setAppliedFilters((prev) => ({ ...prev, query: '' }));
            return;
        }
        if (val.length < 3) return;
        queryTimerRef.current = setTimeout(() => {
            setPage(0);
            setAppliedFilters((prev) => ({ ...prev, query: val }));
        }, 400);
    };

    const handleSearch = () => {
        setPage(0);
        setAppliedFilters({
            query: queryInput.length >= 3 ? queryInput : '',
            status: statusFilter,
            agencyType: agencyType === 'RSA' ? 'AGENCY' : agencyTypeFilter,
            currency: currencyFilter,
        });
    };

    const handleClear = () => {
        setQueryInput('');
        setStatusFilter('');
        setAgencyTypeFilter(agencyType === 'RSA' ? 'AGENCY' : '');
        setCurrencyFilter('');
        setPage(0);
        setAppliedFilters({
            query: '',
            status: '',
            agencyType: agencyType === 'RSA' ? 'AGENCY' : '',
            currency: '',
        });
    };

    const handleOpenCreate = () => { setEditData(null); setModalOpen(true); };
    const handleOpenEdit = (item) => { setEditData(item); setModalOpen(true); };
    const handleModalSuccess = () => {
        const ctrl = new AbortController();
        fetchLimits(ctrl.signal);
        fetchSummary();
    };

    const canCreate = agencyType === 'GSA' || agencyType === 'RSA';
    const showAgencyTypeFilter = agencyType === 'GSA';

    return (
        <div className="flex-1 flex flex-col px-4 sm:px-8 py-6 min-h-0 bg-[#f8f9fa] dark:bg-[#202124] w-full">
            <div className="max-w-7xl mx-auto w-full flex flex-col h-full min-h-0">

                {/* ── Page Header ──────────────────────────────────────────── */}
                <div className="flex items-start justify-between mb-5">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                            <span className="material-symbols-outlined text-[26px] text-[#1a73e8]">tune</span>
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Limit Yönetimi</h1>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                                {agencyType === 'GSA'
                                    ? 'RSA ve acentelere tanımlı kredi limitlerini yönetin'
                                    : 'Acentelere tanımlı kredi limitlerini yönetin'}
                            </p>
                        </div>
                    </div>

                    {canCreate && (
                        <button
                            onClick={handleOpenCreate}
                            className="flex items-center gap-2 h-10 px-5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition-colors cursor-pointer shrink-0"
                        >
                            <span className="material-symbols-outlined text-[18px]">add</span>
                            Limit Tanımla
                        </button>
                    )}
                </div>

                {/* ── Summary Cards ─────────────────────────────────────────── */}
                <SummaryCards summary={summary} loading={summaryLoading} />

                {/* ── Main Content Card ──────────────────────────────────────── */}
                <div className="flex-1 min-h-0 flex flex-col bg-white dark:bg-[#2c2c2e] rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">

                    {/* Filter Bar */}
                    <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40">
                        <div className="flex flex-wrap items-end gap-3">
                            {/* Query */}
                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                                    {agencyType === 'GSA' ? 'GSA / RSA Ara' : 'Acente Ara'}
                                </label>
                                <div className="relative">
                                    <span className="material-symbols-outlined absolute left-2.5 top-2 text-[16px] text-slate-400">search</span>
                                    <input
                                        type="text"
                                        placeholder="Arama... (min. 3 karakter)"
                                        value={queryInput}
                                        onChange={(e) => handleQueryChange(e.target.value)}
                                        className="h-9 pl-8 pr-3 w-52 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-800 dark:text-slate-100 outline-none focus:border-[#1a73e8] transition-colors"
                                    />
                                </div>
                            </div>

                            {/* Currency */}
                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Para Birimi</label>
                                <select
                                    value={currencyFilter}
                                    onChange={(e) => setCurrencyFilter(e.target.value)}
                                    className="h-9 px-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-800 dark:text-slate-100 outline-none focus:border-[#1a73e8] transition-colors cursor-pointer"
                                >
                                    <option value="">Tümü</option>
                                    {currencies.map((c) => (
                                        <option key={c.code} value={c.code}>{c.code} — {c.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Status */}
                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Durum</label>
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="h-9 px-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-800 dark:text-slate-100 outline-none focus:border-[#1a73e8] transition-colors cursor-pointer"
                                >
                                    {LIMIT_STATUS_OPTIONS.map((o) => (
                                        <option key={o.value} value={o.value}>{o.label}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Agency Type — GSA only */}
                            {showAgencyTypeFilter && (
                                <div className="flex flex-col gap-1">
                                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Acente Tipi</label>
                                    <select
                                        value={agencyTypeFilter}
                                        onChange={(e) => setAgencyTypeFilter(e.target.value)}
                                        className="h-9 px-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-800 dark:text-slate-100 outline-none focus:border-[#1a73e8] transition-colors cursor-pointer"
                                    >
                                        {AGENCY_TYPE_OPTIONS.map((o) => (
                                            <option key={o.value} value={o.value}>{o.label}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

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
                                <button onClick={handleSearch} className="text-sm text-[#1a73e8] hover:underline cursor-pointer">Tekrar dene</button>
                            </div>
                        ) : loading ? (
                            <div className="flex flex-col items-center justify-center py-20 gap-3">
                                <span className="material-symbols-outlined text-4xl text-slate-300 dark:text-slate-600 animate-spin">progress_activity</span>
                                <p className="text-sm text-slate-400">Veriler yükleniyor...</p>
                            </div>
                        ) : limits.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 gap-3">
                                <span className="material-symbols-outlined text-5xl text-slate-200 dark:text-slate-700">tune</span>
                                <p className="text-sm text-slate-400 dark:text-slate-500">Kayıt bulunamadı.</p>
                                {canCreate && (
                                    <button
                                        onClick={handleOpenCreate}
                                        className="flex items-center gap-1.5 text-sm text-[#1a73e8] hover:underline cursor-pointer"
                                    >
                                        <span className="material-symbols-outlined text-[16px]">add_circle</span>
                                        İlk limiti tanımla
                                    </button>
                                )}
                            </div>
                        ) : (
                            <table className="w-full text-sm border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 sticky top-0 z-10">
                                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide whitespace-nowrap">
                                            {agencyType === 'GSA' ? 'RSA / Agency Adı' : 'Agency Adı'}
                                        </th>
                                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide whitespace-nowrap">Para Birimi</th>
                                        <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide whitespace-nowrap">Credit Limit</th>
                                        <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide whitespace-nowrap">Used Limit</th>
                                        <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide whitespace-nowrap">Available Limit</th>
                                        <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide whitespace-nowrap">Kullanım %</th>
                                        <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide whitespace-nowrap">Limit Görselleştirme</th>
                                        <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide whitespace-nowrap">Durum</th>
                                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide whitespace-nowrap">Tanımlanma Tarihi</th>
                                        {canCreate && (
                                            <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide whitespace-nowrap">İşlem</th>
                                        )}
                                    </tr>
                                </thead>
                                <tbody>
                                    {limits.map((item, idx) => {
                                        const currency = item.agency?.currency || item.currency || '—';
                                        const rate = Number(item.usageRate ?? 0) * 100;
                                        const isWarning = rate >= 90;

                                        return (
                                            <tr key={idx} className="border-b border-slate-100 dark:border-slate-800/80 hover:bg-blue-50/60 dark:hover:bg-slate-800/50 transition-colors">
                                                {/* Agency Name */}
                                                <td className="px-4 py-3">
                                                    <div className="flex flex-col">
                                                        <span className="text-slate-800 dark:text-slate-100 font-medium">{item.agency?.name || '-'}</span>
                                                        <span className="text-xs text-slate-400 dark:text-slate-500">{item.agency?.agencyType || ''}</span>
                                                    </div>
                                                </td>

                                                {/* Currency */}
                                                <td className="px-4 py-3">
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                                                        {currency}
                                                    </span>
                                                </td>

                                                {/* Credit Limit */}
                                                <td className="px-4 py-3 text-right font-medium text-slate-700 dark:text-slate-200 tabular-nums whitespace-nowrap">
                                                    {fmt(item.creditLimit)} {currency !== '—' ? currency : ''}
                                                </td>

                                                {/* Used Limit */}
                                                <td className="px-4 py-3 text-right tabular-nums whitespace-nowrap">
                                                    <span className={`font-medium ${Number(item.usedLimit) > 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-400'}`}>
                                                        {fmt(item.usedLimit)} {currency !== '—' ? currency : ''}
                                                    </span>
                                                </td>

                                                {/* Available Limit */}
                                                <td className="px-4 py-3 text-right tabular-nums whitespace-nowrap">
                                                    <span className="font-medium text-emerald-600 dark:text-emerald-400">
                                                        {fmt(item.availableLimit)} {currency !== '—' ? currency : ''}
                                                    </span>
                                                </td>

                                                {/* Usage % */}
                                                <td className="px-4 py-3 text-center">
                                                    <span className={`text-xs font-semibold tabular-nums ${
                                                        rate >= 90 ? 'text-red-600 dark:text-red-400'
                                                        : rate >= 70 ? 'text-amber-600 dark:text-amber-400'
                                                        : 'text-slate-600 dark:text-slate-300'
                                                    }`}>
                                                        {rate.toFixed(0)}%
                                                    </span>
                                                </td>

                                                {/* Visual bar */}
                                                <td className="px-4 py-3 min-w-[140px]">
                                                    <UsageBar rate={rate} />
                                                </td>

                                                {/* Status + Warning */}
                                                <td className="px-4 py-3 text-center">
                                                    <div className="flex items-center justify-center gap-1 flex-wrap">
                                                        <StatusBadge status={item.status} />
                                                        {isWarning && <WarningBadge />}
                                                    </div>
                                                </td>

                                                {/* Date */}
                                                <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                                                    {fmtDate(item.createDateTime)}
                                                </td>

                                                {/* Actions */}
                                                {canCreate && (
                                                    <td className="px-4 py-3 text-center whitespace-nowrap">
                                                        <div className="flex items-center justify-center gap-3">
                                                            <button
                                                                onClick={() => handleOpenEdit(item)}
                                                                className="text-xs text-[#1a73e8] dark:text-blue-400 font-medium hover:underline cursor-pointer"
                                                            >
                                                                Düzenle
                                                            </button>
                                                            <button
                                                                onClick={() => handleOpenEdit({
                                                                    ...item,
                                                                    status: item.status === 'ACTIVE' ? 'PASSIVE' : 'ACTIVE',
                                                                    _presetStatus: true,
                                                                })}
                                                                className={`text-xs font-medium hover:underline cursor-pointer ${
                                                                    item.status === 'ACTIVE'
                                                                        ? 'text-amber-600 dark:text-amber-400'
                                                                        : 'text-emerald-600 dark:text-emerald-400'
                                                                }`}
                                                            >
                                                                {item.status === 'ACTIVE' ? 'Pasifleştir' : 'Aktifleştir'}
                                                            </button>
                                                        </div>
                                                    </td>
                                                )}
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}
                    </div>

                    {/* Pagination */}
                    {!loading && totalItems > 0 && (
                        <div className="border-t border-slate-200 dark:border-slate-700">
                            <Pagination
                                currentPage={page}
                                totalPages={totalPages}
                                pageSize={pageSize}
                                totalElements={totalItems}
                                onPageChange={setPage}
                                onPageSizeChange={(s) => { setPageSize(s); setPage(0); }}
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Modal */}
            <CreateEditLimitModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                onSuccess={handleModalSuccess}
                editData={editData}
                agencyType={agencyType}
            />
        </div>
    );
};

export default LimitManagementPage;
