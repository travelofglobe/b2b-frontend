import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { financeService } from '../services/financeService';
import { agencyService } from '../services/agencyService';
import { useAuth } from '../context/AuthContext';
import Pagination from './Pagination';
import { useToast } from '../context/ToastContext';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (num) => {
    if (num === null || num === undefined) return '0,00';
    return Number(num).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

// Format a raw digit string with tr-TR thousand separators (no decimals).
const formatInteger = (digits) => {
    if (!digits || digits === '') return '';
    const num = parseInt(digits, 10);
    if (isNaN(num)) return '';
    return num.toLocaleString('tr-TR', { maximumFractionDigits: 0 });
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
        pct >= 90 ? 'bg-rose-500'
        : pct >= 70 ? 'bg-amber-400'
        : 'bg-emerald-500';

    return (
        <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden min-w-[70px]">
                <div
                    className={`h-full rounded-full transition-all duration-500 ${color}`}
                    style={{ width: `${pct}%` }}
                />
            </div>
            <span className={`text-[11px] font-bold tabular-nums w-8 text-right ${
                pct >= 90 ? 'text-rose-600 dark:text-rose-400'
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
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                <span className="size-1.5 rounded-full bg-emerald-500" />
                Aktif
            </span>
        );
    }
    if (status === 'PASSIVE') {
        return (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                <span className="size-1.5 rounded-full bg-slate-400" />
                Pasif
            </span>
        );
    }
    return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
            -
        </span>
    );
};

// ─── Warning Badge ─────────────────────────────────────────────────────────────

const WarningBadge = () => (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
        <span className="material-symbols-outlined text-[13px]">warning</span>
        Limit Uyarı
    </span>
);

// ─── Summary Cards ─────────────────────────────────────────────────────────────

const SummaryCards = ({ summary, loading, limits = [], totalItems = 0 }) => {
    const computed = useMemo(() => {
        if (summary) {
            const credit = Number(summary.totalCreditLimit) || 0;
            const addition = Number(summary.totalAdditionLimit) || 0;
            const total = summary.totalLimit != null ? Number(summary.totalLimit) : (credit + addition);
            const used = Number(summary.totalUsedLimit) || 0;
            const available = summary.totalAvailableLimit != null ? Number(summary.totalAvailableLimit) : Math.max(0, total - used);
            const rate = summary.usedRate != null ? Number(summary.usedRate) : (total > 0 ? (used / total) * 100 : 0);
            const count = summary.totalLimitCount ?? totalItems ?? limits.length ?? 0;

            return { credit, addition, total, used, available, count, rate };
        }

        if (limits && limits.length > 0) {
            let totalCredit = 0;
            let totalAddition = 0;
            let totalUsed = 0;

            limits.forEach(item => {
                totalCredit += Number(item.creditLimit) || 0;
                totalAddition += Number(item.additionLimit) || 0;
                totalUsed += Number(item.totalUsedLimit ?? ((Number(item.usedCreditLimit) || 0) + (Number(item.usedAdditionLimit) || 0))) || 0;
            });

            const total = totalCredit + totalAddition;
            const available = Math.max(0, total - totalUsed);
            const rate = total > 0 ? (totalUsed / total) * 100 : 0;

            return {
                credit: totalCredit,
                addition: totalAddition,
                total: total,
                used: totalUsed,
                available: available,
                count: totalItems || limits.length,
                rate: rate,
            };
        }

        return {
            credit: 0,
            addition: 0,
            total: 0,
            used: 0,
            available: 0,
            count: totalItems || 0,
            rate: 0,
        };
    }, [summary, limits, totalItems]);

    const cards = [
        {
            label: 'Toplam Kredi Limiti',
            value: fmt(computed.credit),
            sub: `${computed.count} adet limit tanımı`,
            color: 'text-[#202124] dark:text-white',
            icon: 'credit_card',
            iconBg: 'bg-[#e8f0fe] dark:bg-[#1a73e8]/20',
            iconColor: 'text-[#1a73e8] dark:text-[#8ab4f8]',
        },
        {
            label: 'Toplam Ek Limit',
            value: fmt(computed.addition),
            sub: `Toplam: ${fmt(computed.total)}`,
            color: 'text-violet-600 dark:text-violet-400',
            icon: 'add_circle',
            iconBg: 'bg-violet-50 dark:bg-violet-900/20',
            iconColor: 'text-violet-600 dark:text-violet-400',
        },
        {
            label: 'Kullanılan Limit',
            value: fmt(computed.used),
            sub: `Kullanım: %${computed.rate.toFixed(0)}`,
            color: 'text-rose-600 dark:text-rose-400',
            icon: 'trending_up',
            iconBg: 'bg-rose-50 dark:bg-rose-900/20',
            iconColor: 'text-rose-600 dark:text-rose-400',
        },
        {
            label: 'Kullanılabilir Limit',
            value: fmt(computed.available),
            sub: 'Kalan serbest limit',
            color: 'text-emerald-600 dark:text-emerald-400',
            icon: 'savings',
            iconBg: 'bg-emerald-50 dark:bg-emerald-900/20',
            iconColor: 'text-emerald-600 dark:text-emerald-400',
        },
    ];

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {cards.map((c) => (
                <div
                    key={c.label}
                    className="border border-[#dadce0] dark:border-[#3c4043] rounded-2xl p-5 sm:p-6 bg-white dark:bg-[#202124] shadow-xs hover:shadow-sm transition-all duration-200 flex items-center gap-4"
                >
                    <div className={`size-11 rounded-2xl flex items-center justify-center shrink-0 ${c.iconBg}`}>
                        <span className={`material-symbols-outlined text-[22px] ${c.iconColor}`}>{c.icon}</span>
                    </div>
                    <div className="flex flex-col min-w-0">
                        <span className="text-xs font-semibold text-[#5f6368] dark:text-[#9aa0a6] uppercase tracking-wide">
                            {c.label}
                        </span>
                        {loading ? (
                            <div className="h-7 w-28 bg-slate-200 dark:bg-slate-700 animate-pulse rounded mt-0.5" />
                        ) : (
                            <span className={`text-2xl sm:text-3xl font-bold tabular-nums leading-tight tracking-tight ${c.color}`}>
                                {c.value}
                            </span>
                        )}
                        <span className="text-[11px] text-[#70757a] mt-0.5">{c.sub}</span>
                    </div>
                </div>
            ))}
        </div>
    );
};

// ─── Agency Type Badge ─────────────────────────────────────────────────────────

const agencyTypeBadgeClass = (type) => {
    if (type === 'RSA')    return 'bg-violet-50 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300 border border-violet-200 dark:border-violet-800/40';
    if (type === 'AGENCY') return 'bg-sky-50 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300 border border-sky-200 dark:border-sky-800/40';
    return 'bg-amber-50 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800/40';
};

// ─── Formatted Number Input ─────────────────────────────────────────────────────

const FormattedNumberInput = ({ value, onChange, placeholder, maxDigits, className }) => {
    const inputRef = useRef(null);
    const displayValue = formatInteger(value);

    const handleChange = (e) => {
        const input = e.target;
        const newValue = input.value;
        const cursorPos = input.selectionStart ?? 0;

        let digitsBeforeCursor = 0;
        for (let i = 0; i < cursorPos && i < newValue.length; i++) {
            if (/\d/.test(newValue[i])) digitsBeforeCursor++;
        }

        let digits = newValue.replace(/\D/g, '');

        if (maxDigits && digits.length > maxDigits) {
            digits = digits.slice(0, maxDigits);
            if (digitsBeforeCursor > maxDigits) digitsBeforeCursor = maxDigits;
        }

        onChange(digits);

        const newDisplay = formatInteger(digits);
        let newPos = 0;
        let count = 0;
        for (let i = 0; i < newDisplay.length; i++) {
            if (/\d/.test(newDisplay[i])) {
                count++;
                if (count === digitsBeforeCursor) {
                    newPos = i + 1;
                    break;
                }
            }
            newPos = i + 1;
        }
        if (count < digitsBeforeCursor) newPos = newDisplay.length;

        requestAnimationFrame(() => {
            if (inputRef.current) {
                inputRef.current.setSelectionRange(newPos, newPos);
            }
        });
    };

    const handleKeyDown = (e) => {
        const allowedKeys = [
            'Backspace', 'Delete', 'Tab', 'Escape', 'Enter',
            'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End',
        ];
        if (allowedKeys.includes(e.key)) return;
        if (e.ctrlKey || e.metaKey) return;
        if (!/\d/.test(e.key)) e.preventDefault();
    };

    return (
        <input
            ref={inputRef}
            type="text"
            inputMode="numeric"
            placeholder={placeholder}
            value={displayValue}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            className={className}
        />
    );
};

// ─── Create / Edit Modal ───────────────────────────────────────────────────────

const CreateEditLimitModal = ({ isOpen, onClose, onSuccess, editData, agencyType }) => {
    const [agencies, setAgencies] = useState([]);
    const [agenciesLoading, setAgenciesLoading] = useState(false);
    const [selectedAgencyId, setSelectedAgencyId] = useState('');

    const [creditLimit, setCreditLimit] = useState('');
    const [additionLimit, setAdditionLimit] = useState('0');
    const [status, setStatus] = useState('ACTIVE');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    const isEdit = !!editData;
    const toast = useToast();

    useEffect(() => {
        if (!isOpen) return;
        setError(null);
        setSaving(false);

        if (isEdit) {
            setCreditLimit(editData.creditLimit != null ? String(Math.trunc(Number(editData.creditLimit))) : '');
            setAdditionLimit(editData.additionLimit != null ? String(Math.trunc(Number(editData.additionLimit))) : '0');
            setStatus(editData.status ?? 'ACTIVE');
            setSelectedAgencyId('');
            setAgencies([]);
        } else {
            setCreditLimit('');
            setAdditionLimit('0');
            setStatus('ACTIVE');
            setSelectedAgencyId('');
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

    const selectedAgency = agencies.find((ag) => String(ag.id) === String(selectedAgencyId));
    const totalLimit = (Number(creditLimit) || 0) + (Number(additionLimit) || 0);

    const handleSubmit = async () => {
        setError(null);
        if (!isEdit && !selectedAgencyId) { setError('Lütfen bir acente seçin.'); return; }
        if (!creditLimit || isNaN(Number(creditLimit)) || Number(creditLimit) <= 0) {
            setError('Geçerli bir credit limit girin.'); return;
        }
        if (!additionLimit || isNaN(Number(additionLimit)) || Number(additionLimit) < 0) {
            setError('Geçerli bir addition limit girin.'); return;
        }
        if (Number(additionLimit) > 999999) {
            setError('Addition limit en fazla 6 hane olabilir (maks. 999999).'); return;
        }
        setSaving(true);
        try {
            if (isEdit) {
                await financeService.updateLimit(editData.id, {
                    creditLimit: Number(creditLimit),
                    additionLimit: Number(additionLimit),
                    status,
                });
                toast.success('Limit başarıyla güncellendi.');
            } else {
                await financeService.createLimit({
                    agencyId: Number(selectedAgencyId),
                    creditLimit: Number(creditLimit),
                    additionLimit: Number(additionLimit),
                    usedCreditLimit: 0,
                    usedAdditionLimit: 0,
                });
                toast.success('Limit başarıyla oluşturuldu.');
            }
            onSuccess?.();
            onClose();
        } catch (err) {
            const msg = err?.message || 'İşlem sırasında hata oluştu.';
            setError(msg);
            toast.error(msg);
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-[#202124]/40 backdrop-blur-xs z-[1000] flex items-center justify-center p-4">
            <div className="bg-white dark:bg-[#202124] rounded-2xl shadow-2xl w-full max-w-lg border border-[#dadce0] dark:border-[#3c4043] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="px-6 py-4 border-b border-[#dadce0] dark:border-[#3c4043] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="size-9 rounded-xl bg-[#e8f0fe] dark:bg-[#1a73e8]/20 flex items-center justify-center text-[#1a73e8] dark:text-[#8ab4f8]">
                            <span className="material-symbols-outlined text-[20px]">tune</span>
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-[#202124] dark:text-white">
                                {isEdit ? 'Limit Düzenle' : `${agencyType === 'GSA' ? 'GSA' : 'RSA'} → Agency Limit Tanımla`}
                            </h2>
                            <p className="text-xs text-[#5f6368] dark:text-[#9aa0a6]">
                                {agencyType === 'GSA' ? 'GSA → RSA / Agency' : 'RSA → Agency'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="size-8 rounded-lg flex items-center justify-center text-[#70757a] hover:bg-[#f1f3f4] dark:hover:bg-[#303134] transition-colors cursor-pointer"
                    >
                        <span className="material-symbols-outlined text-[18px]">close</span>
                    </button>
                </div>

                {/* Info banner */}
                <div className="mx-6 mt-4 px-3.5 py-2.5 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/40 text-xs text-blue-700 dark:text-blue-300 leading-relaxed flex items-center gap-2">
                    <span className="material-symbols-outlined text-[17px] text-[#1a73e8] shrink-0">info</span>
                    <span>Her kademe kendi verdiği limitten sorumludur. Üst kademe limiti alt kademe için matematiksel bir üst sınır değildir.</span>
                </div>

                {/* Body */}
                <div className="px-6 py-5 flex flex-col gap-4">
                    {/* Agency dropdown — create only */}
                    {!isEdit && (
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-semibold text-[#5f6368] dark:text-[#9aa0a6] uppercase tracking-wide">
                                Agency Adı
                            </label>

                            {agenciesLoading ? (
                                <div className="h-10 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse flex items-center px-3 gap-2">
                                    <span className="material-symbols-outlined text-[16px] text-slate-400 animate-spin">progress_activity</span>
                                    <span className="text-xs text-slate-400">Acenteler yükleniyor...</span>
                                </div>
                            ) : (
                                <>
                                    <div className="relative">
                                        <select
                                            value={selectedAgencyId}
                                            onChange={(e) => setSelectedAgencyId(e.target.value)}
                                            className="w-full h-10 pl-3.5 pr-9 bg-white dark:bg-[#303134] border border-[#dadce0] dark:border-[#5f6368] rounded-xl text-xs text-[#202124] dark:text-white outline-none focus:border-[#1a73e8] transition-colors cursor-pointer appearance-none shadow-2xs"
                                        >
                                            <option value="">Seçiniz...</option>
                                            {agencies.map((ag) => (
                                                <option key={ag.id} value={String(ag.id)}>
                                                    {ag.name}{'  '}[{ag.agencyType}]
                                                </option>
                                            ))}
                                        </select>
                                        <span className="material-symbols-outlined pointer-events-none absolute right-2.5 top-2.5 text-[18px] text-[#70757a]">
                                            expand_more
                                        </span>
                                    </div>

                                    {/* Selected agency detail card */}
                                    {selectedAgency && (
                                        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-[#303134] border border-[#dadce0] dark:border-[#3c4043]">
                                            <div className="size-8 rounded-lg bg-[#e8f0fe] dark:bg-[#1a73e8]/20 flex items-center justify-center shrink-0">
                                                <span className="material-symbols-outlined text-[16px] text-[#1a73e8]">business_center</span>
                                            </div>
                                            <div className="flex flex-col min-w-0 flex-1">
                                                <span className="text-xs font-semibold text-[#202124] dark:text-white truncate">
                                                    {selectedAgency.name}
                                                </span>
                                                {selectedAgency.email && (
                                                    <span className="text-[10px] text-[#70757a] truncate">
                                                        {selectedAgency.email}
                                                    </span>
                                                )}
                                            </div>
                                            <span className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${agencyTypeBadgeClass(selectedAgency.agencyType)}`}>
                                                {selectedAgency.agencyType}
                                            </span>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    )}

                    {/* Edit: show agency as read-only */}
                    {isEdit && editData?.agency && (
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-semibold text-[#5f6368] dark:text-[#9aa0a6] uppercase tracking-wide">Agency</label>
                            <div className="flex items-center gap-3 px-3.5 h-10 bg-slate-50 dark:bg-[#303134]/50 border border-[#dadce0] dark:border-[#3c4043] rounded-xl">
                                <span className="material-symbols-outlined text-[17px] text-[#70757a]">business_center</span>
                                <span className="text-xs font-semibold text-[#202124] dark:text-white flex-1 truncate">{editData.agency.name}</span>
                                {editData.agency.agencyType && (
                                    <span className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${agencyTypeBadgeClass(editData.agency.agencyType)}`}>
                                        {editData.agency.agencyType}
                                    </span>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Credit Limit */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-[#5f6368] dark:text-[#9aa0a6] uppercase tracking-wide">Credit Limit</label>
                        <FormattedNumberInput
                            value={creditLimit}
                            onChange={setCreditLimit}
                            placeholder="10.000"
                            className="h-10 px-3.5 bg-white dark:bg-[#303134] border border-[#dadce0] dark:border-[#5f6368] rounded-xl text-xs text-[#202124] dark:text-white outline-none focus:border-[#1a73e8] transition-colors shadow-2xs font-mono font-medium"
                        />
                    </div>

                    {/* Addition Limit */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-[#5f6368] dark:text-[#9aa0a6] uppercase tracking-wide">Addition Limit</label>
                        <FormattedNumberInput
                            value={additionLimit}
                            onChange={setAdditionLimit}
                            placeholder="0"
                            maxDigits={6}
                            className="h-10 px-3.5 bg-white dark:bg-[#303134] border border-[#dadce0] dark:border-[#5f6368] rounded-xl text-xs text-[#202124] dark:text-white outline-none focus:border-[#1a73e8] transition-colors shadow-2xs font-mono font-medium"
                        />
                    </div>

                    {/* Used Limit — create only, read-only */}
                    {!isEdit && (
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-semibold text-[#5f6368] dark:text-[#9aa0a6] uppercase tracking-wide">
                                Kullanılan Limit <span className="normal-case font-normal text-[#70757a]">(Salt Okunur)</span>
                            </label>
                            <input
                                type="number"
                                value="0"
                                readOnly
                                className="h-10 px-3.5 bg-slate-50 dark:bg-[#303134]/50 border border-[#dadce0] dark:border-[#3c4043] rounded-xl text-xs text-[#70757a] outline-none cursor-not-allowed font-mono"
                            />
                        </div>
                    )}

                    {/* Available limit preview */}
                    <div className="px-3.5 py-3 rounded-xl bg-slate-50 dark:bg-[#303134] border border-[#dadce0] dark:border-[#3c4043] flex items-center justify-between">
                        <span className="text-xs text-[#5f6368] dark:text-[#9aa0a6] font-medium">Toplam Limit (Credit + Addition):</span>
                        <span className="text-sm font-bold tabular-nums text-[#1a73e8] dark:text-blue-400">
                            {(creditLimit || additionLimit) ? fmt(totalLimit) : '—'}
                        </span>
                    </div>

                    {/* Status — edit only */}
                    {isEdit && (
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-semibold text-[#5f6368] dark:text-[#9aa0a6] uppercase tracking-wide">Durum</label>
                            <select
                                value={status}
                                onChange={(e) => setStatus(e.target.value)}
                                className="h-10 px-3.5 bg-white dark:bg-[#303134] border border-[#dadce0] dark:border-[#5f6368] rounded-xl text-xs text-[#202124] dark:text-white outline-none focus:border-[#1a73e8] transition-colors cursor-pointer shadow-2xs"
                            >
                                <option value="ACTIVE">Aktif</option>
                                <option value="PASSIVE">Pasif</option>
                            </select>
                        </div>
                    )}

                    {/* Error */}
                    {error && (
                        <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800/40 text-xs text-rose-600 dark:text-rose-400">
                            <span className="material-symbols-outlined text-[16px] text-rose-500">error</span>
                            <span>{error}</span>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-[#dadce0] dark:border-[#3c4043] flex justify-end gap-3 bg-slate-50/50 dark:bg-[#202124]">
                    <button
                        onClick={onClose}
                        disabled={saving}
                        className="h-10 px-5 rounded-xl border border-[#dadce0] dark:border-[#5f6368] text-xs font-semibold text-[#5f6368] dark:text-[#9aa0a6] hover:bg-[#f1f3f4] dark:hover:bg-[#303134] transition-colors cursor-pointer disabled:opacity-50"
                    >
                        Vazgeç
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={saving}
                        className="h-10 px-6 rounded-xl bg-[#1a73e8] hover:bg-[#1557b0] text-white text-xs font-semibold transition-all shadow-xs active:scale-95 cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                    >
                        {saving ? (
                            <div className="size-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                            <span className="material-symbols-outlined text-[17px]">check</span>
                        )}
                        <span>{saving ? 'Kaydediliyor...' : (isEdit ? 'Güncelle' : 'Kaydet')}</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

// ─── LimitManagementPage ───────────────────────────────────────────────────────

const LimitManagementTab = () => {
    const navigate = useNavigate();
    const { agencyType } = useAuth();

    // Summary state
    const [summary, setSummary] = useState(null);
    const [summaryLoading, setSummaryLoading] = useState(false);

    // Filter inputs
    const [queryInput, setQueryInput] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [agencyTypeFilter, setAgencyTypeFilter] = useState(agencyType === 'RSA' ? 'AGENCY' : '');
    const [currencyFilter, setCurrencyFilter] = useState('');

    // Applied filters
    const [appliedFilters, setAppliedFilters] = useState({
        query: '',
        status: '',
        agencyType: agencyType === 'RSA' ? 'AGENCY' : '',
        currency: '',
    });

    // Table state
    const [limits, setLimits] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState(10);
    const [totalPages, setTotalPages] = useState(0);
    const [totalItems, setTotalItems] = useState(0);

    // Modal state
    const [modalOpen, setModalOpen] = useState(false);
    const [editData, setEditData] = useState(null);

    const queryTimerRef = useRef(null);

    // Fetch summary on mount
    const fetchSummary = useCallback(async () => {
        setSummaryLoading(true);
        try {
            const data = await financeService.getLimitSummary();
            setSummary(data);
        } catch (err) {
            console.error('getLimitSummary error:', err);
            setSummary(null);
        } finally {
            setSummaryLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchSummary();
    }, [fetchSummary]);

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
        <div className="flex-1 flex flex-col min-h-0 bg-[#f8f9fa] dark:bg-[#18191c] overflow-y-auto font-roboto">
            {/* Sticky Header Bar */}
            <header className="sticky top-0 bg-white/95 dark:bg-[#202124]/95 backdrop-blur-md border-b border-[#dadce0] dark:border-[#3c4043] px-6 sm:px-10 lg:px-12 xl:px-14 py-3.5 flex-shrink-0 z-30 transition-all shadow-2xs">
                <div className="max-w-[1440px] mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                        <div className="w-11 h-11 rounded-2xl bg-[#e8f0fe] dark:bg-[#1a73e8]/20 flex items-center justify-center text-[#1a73e8] dark:text-[#8ab4f8] shrink-0 shadow-2xs">
                            <span className="material-symbols-outlined text-[24px]">tune</span>
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-xl font-bold text-[#202124] dark:text-[#e8eaed] tracking-tight">Finans Yönetimi</h1>
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#e8f0fe] text-[#1a73e8] dark:bg-[#1a73e8]/20 dark:text-[#8ab4f8]">
                                    Limit Yönetimi ({agencyType})
                                </span>
                            </div>
                            <p className="text-xs text-[#5f6368] dark:text-[#9aa0a6] mt-0.5">
                                {agencyType === 'GSA'
                                    ? 'RSA ve acentelere tanımlı kredi limitlerini ve risk dağılımını yönetin'
                                    : 'Acentelere tanımlı kredi limitlerini yönetin'}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                        {canCreate && (
                            <button
                                type="button"
                                onClick={handleOpenCreate}
                                className="flex items-center gap-1.5 px-4 py-2 bg-[#1a73e8] hover:bg-[#1557b0] text-white rounded-xl text-xs font-medium transition-all shadow-xs active:scale-95 cursor-pointer"
                            >
                                <span className="material-symbols-outlined text-[18px]">add</span>
                                <span>Limit Tanımla</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Tab Navigation - Unified with Finance Transactions */}
                <div className="max-w-[1440px] mx-auto mt-3.5 flex items-center gap-1.5">
                    <button
                        type="button"
                        onClick={() => navigate('/finance?tab=transactions')}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all border bg-white dark:bg-[#202124] border-[#dadce0] dark:border-[#3c4043] text-[#5f6368] dark:text-[#9aa0a6] hover:bg-[#f1f3f4] dark:hover:bg-[#303134] cursor-pointer"
                    >
                        <span className="material-symbols-outlined text-[18px]">receipt_long</span>
                        <span>Hesap Hareketleri (İşlemler)</span>
                    </button>
                    <button
                        type="button"
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all border bg-[#e8f0fe] border-[#1a73e8] text-[#1a73e8] dark:bg-[#1a73e8]/20 dark:border-[#8ab4f8] dark:text-[#8ab4f8] shadow-xs cursor-pointer"
                    >
                        <span className="material-symbols-outlined text-[18px]">tune</span>
                        <span>Limit Yönetimi</span>
                    </button>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="max-w-[1440px] w-full mx-auto px-6 sm:px-10 lg:px-12 xl:px-14 py-6 space-y-5">
                {/* 4 Summary Cards */}
                <SummaryCards summary={summary} loading={summaryLoading} limits={limits} totalItems={totalItems} />

                {/* Table & Toolbar Container */}
                <div className="bg-white dark:bg-[#202124] rounded-2xl border border-[#dadce0] dark:border-[#3c4043] overflow-hidden shadow-xs flex flex-col">
                    {/* Filter Bar */}
                    <div className="p-4 border-b border-[#dadce0] dark:border-[#3c4043] flex flex-wrap items-center justify-between gap-3 bg-slate-50/50 dark:bg-[#202124]">
                        <div className="flex flex-wrap items-center gap-3 flex-1">
                            {/* Search */}
                            <div className="relative min-w-[220px] flex-1 max-w-xs">
                                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#70757a] text-[18px]">search</span>
                                <input
                                    type="text"
                                    placeholder={agencyType === 'GSA' ? 'GSA / RSA / Acente ara...' : 'Acente ara...'}
                                    value={queryInput}
                                    onChange={(e) => handleQueryChange(e.target.value)}
                                    className="w-full pl-9 pr-7 h-10 bg-white dark:bg-[#303134] border border-[#dadce0] dark:border-[#5f6368] focus:border-[#1a73e8] rounded-xl text-xs text-[#202124] dark:text-white placeholder-[#70757a] outline-none transition-all shadow-2xs"
                                />
                                {queryInput && (
                                    <button
                                        type="button"
                                        onClick={() => handleQueryChange('')}
                                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#70757a] hover:text-[#202124] cursor-pointer"
                                    >
                                        <span className="material-symbols-outlined text-[15px]">close</span>
                                    </button>
                                )}
                            </div>

                            {/* Agency Type Filter */}
                            {showAgencyTypeFilter && (
                                <select
                                    value={agencyTypeFilter}
                                    onChange={(e) => setAgencyTypeFilter(e.target.value)}
                                    className="h-10 px-3 bg-white dark:bg-[#303134] border border-[#dadce0] dark:border-[#5f6368] rounded-xl text-xs text-[#3c4043] dark:text-slate-200 focus:border-[#1a73e8] outline-none cursor-pointer shadow-2xs"
                                >
                                    {AGENCY_TYPE_OPTIONS.map((opt) => (
                                        <option key={opt.value} value={opt.value}>
                                            {opt.label === 'Tümü' ? 'Tüm Türler' : opt.label}
                                        </option>
                                    ))}
                                </select>
                            )}

                            {/* Status Filter */}
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="h-10 px-3 bg-white dark:bg-[#303134] border border-[#dadce0] dark:border-[#5f6368] rounded-xl text-xs text-[#3c4043] dark:text-slate-200 focus:border-[#1a73e8] outline-none cursor-pointer shadow-2xs"
                            >
                                {LIMIT_STATUS_OPTIONS.map((opt) => (
                                    <option key={opt.value} value={opt.value}>
                                        {opt.label === 'Tümü' ? 'Tüm Durumlar' : opt.label}
                                    </option>
                                ))}
                            </select>

                            {/* Currency Filter */}
                            <select
                                value={currencyFilter}
                                onChange={(e) => setCurrencyFilter(e.target.value)}
                                className="h-10 px-3 bg-white dark:bg-[#303134] border border-[#dadce0] dark:border-[#5f6368] rounded-xl text-xs text-[#3c4043] dark:text-slate-200 focus:border-[#1a73e8] outline-none cursor-pointer shadow-2xs"
                            >
                                <option value="">Tüm Para Birimleri</option>
                                <option value="EUR">EUR</option>
                                <option value="USD">USD</option>
                                <option value="TRY">TRY</option>
                                <option value="GBP">GBP</option>
                            </select>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={handleSearch}
                                className="flex items-center gap-1.5 h-10 px-4 rounded-xl bg-[#1a73e8] hover:bg-[#1557b0] text-white text-xs font-semibold shadow-xs active:scale-95 transition-all cursor-pointer"
                            >
                                <span className="material-symbols-outlined text-[17px]">search</span>
                                <span>Filtrele</span>
                            </button>
                            <button
                                type="button"
                                onClick={handleClear}
                                className="flex items-center gap-1.5 h-10 px-3.5 rounded-xl bg-white dark:bg-[#303134] border border-[#dadce0] dark:border-[#5f6368] text-slate-700 dark:text-slate-300 hover:bg-[#f1f3f4] dark:hover:bg-[#3c4043] text-xs font-medium transition-all shadow-2xs cursor-pointer"
                            >
                                <span className="material-symbols-outlined text-[17px]">restart_alt</span>
                                <span>Sıfırla</span>
                            </button>
                        </div>
                    </div>

                    {/* Table View */}
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
                                    Yeniden Dene
                                </button>
                            </div>
                        ) : loading ? (
                            <div className="flex flex-col items-center justify-center py-16 gap-3">
                                <div className="size-9 border-3 border-[#1a73e8] border-t-transparent rounded-full animate-spin"></div>
                                <span className="text-xs text-[#70757a]">Limitler yükleniyor...</span>
                            </div>
                        ) : limits.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 gap-3">
                                <div className="size-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                                    <span className="material-symbols-outlined text-[26px]">tune</span>
                                </div>
                                <p className="text-xs font-medium text-[#70757a]">Tanımlı limit kaydı bulunamadı</p>
                                {canCreate && (
                                    <button
                                        type="button"
                                        onClick={handleOpenCreate}
                                        className="text-xs font-semibold text-[#1a73e8] hover:underline cursor-pointer"
                                    >
                                        İlk limiti şimdi tanımlayın
                                    </button>
                                )}
                            </div>
                        ) : (
                            <table className="w-full text-xs text-left border-collapse">
                                <thead>
                                    <tr className="bg-[#f8f9fa] dark:bg-[#202124] border-b border-[#dadce0] dark:border-[#3c4043] text-[11px] font-semibold text-[#5f6368] dark:text-[#9aa0a6] uppercase tracking-wider select-none">
                                        <th className="px-4 py-3" rowSpan={2}>
                                            {agencyType === 'GSA' ? 'RSA / Acente Bilgisi' : 'Acente Bilgisi'}
                                        </th>
                                        <th className="px-4 py-3" rowSpan={2}>Birim</th>
                                        {/* Credit Group */}
                                        <th colSpan={2} className="px-4 py-1.5 text-center text-sky-700 dark:text-sky-300 bg-sky-50/50 dark:bg-sky-900/20 border-x border-[#dadce0]/70 dark:border-[#3c4043]">
                                            Kredi Limiti
                                        </th>
                                        {/* Addition Group */}
                                        <th colSpan={2} className="px-4 py-1.5 text-center text-violet-700 dark:text-violet-300 bg-violet-50/50 dark:bg-violet-900/20 border-r border-[#dadce0]/70 dark:border-[#3c4043]">
                                            Ek Limit (Addition)
                                        </th>
                                        {/* Total / Cumulative */}
                                        <th colSpan={3} className="px-4 py-1.5 text-center text-slate-700 dark:text-slate-300 bg-slate-100/60 dark:bg-slate-800/60 border-r border-[#dadce0]/70 dark:border-[#3c4043]">
                                            Kümülatif Toplam
                                        </th>
                                        <th className="px-4 py-3 text-center min-w-[130px]" rowSpan={2}>Kullanım Oranı</th>
                                        <th className="px-4 py-3 text-center" rowSpan={2}>Durum</th>
                                        <th className="px-4 py-3" rowSpan={2}>Tarih</th>
                                        {canCreate && (
                                            <th className="px-4 py-3 text-right" rowSpan={2}>İşlemler</th>
                                        )}
                                    </tr>
                                    <tr className="bg-[#f8f9fa] dark:bg-[#202124] border-b border-[#dadce0] dark:border-[#3c4043] text-[10px] font-semibold text-[#5f6368] dark:text-[#9aa0a6] uppercase tracking-wider select-none">
                                        {/* Credit sub-headers */}
                                        <th className="text-right px-4 py-1.5 border-l border-[#dadce0]/70 dark:border-[#3c4043] text-sky-700 dark:text-sky-300">Limit</th>
                                        <th className="text-right px-4 py-1.5 border-r border-[#dadce0]/70 dark:border-[#3c4043] text-sky-700 dark:text-sky-300">Kullanılan</th>
                                        {/* Addition sub-headers */}
                                        <th className="text-right px-4 py-1.5 text-violet-700 dark:text-violet-300">Limit</th>
                                        <th className="text-right px-4 py-1.5 border-r border-[#dadce0]/70 dark:border-[#3c4043] text-violet-700 dark:text-violet-300">Kullanılan</th>
                                        {/* Cumulative sub-headers */}
                                        <th className="text-right px-4 py-1.5 text-[#1a73e8] dark:text-blue-400">Total</th>
                                        <th className="text-right px-4 py-1.5 text-rose-600 dark:text-rose-400">Kullanılan</th>
                                        <th className="text-right px-4 py-1.5 border-r border-[#dadce0]/70 dark:border-[#3c4043] text-emerald-600 dark:text-emerald-400">Kalan</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#dadce0]/60 dark:divide-[#3c4043]/60 text-xs text-[#202124] dark:text-slate-100">
                                    {limits.map((item, idx) => {
                                        const currency = item.agency?.currency || item.currency || '—';
                                        const rate = Number(item.usageRate ?? 0);
                                        const isWarning = rate >= 90;

                                        return (
                                            <tr key={item.id || idx} className="hover:bg-[#f8f9fa] dark:hover:bg-[#2a2b2e]/60 transition-colors">
                                                {/* Agency Name */}
                                                <td className="px-4 py-3">
                                                    <div className="flex flex-col">
                                                        <span className="font-semibold text-[#202124] dark:text-white">{item.agency?.name || '-'}</span>
                                                        <span className="text-[10px] text-[#70757a]">{item.agency?.agencyType || ''}</span>
                                                    </div>
                                                </td>

                                                {/* Currency */}
                                                <td className="px-4 py-3">
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#e8f0fe] text-[#1a73e8] dark:bg-blue-900/30 dark:text-blue-300">
                                                        {currency}
                                                    </span>
                                                </td>

                                                {/* Credit Limit */}
                                                <td className="px-4 py-3 text-right font-medium text-sky-700 dark:text-sky-300 tabular-nums whitespace-nowrap border-l border-[#dadce0]/60 dark:border-[#3c4043]/60">
                                                    {fmt(item.creditLimit)}
                                                </td>
                                                {/* Credit Used */}
                                                <td className="px-4 py-3 text-right tabular-nums whitespace-nowrap border-r border-[#dadce0]/60 dark:border-[#3c4043]/60">
                                                    <span className={`font-medium ${Number(item.usedCreditLimit) > 0 ? 'text-sky-600 dark:text-sky-400' : 'text-slate-400'}`}>
                                                        {fmt(item.usedCreditLimit ?? 0)}
                                                    </span>
                                                </td>

                                                {/* Addition Limit */}
                                                <td className="px-4 py-3 text-right font-medium text-violet-700 dark:text-violet-300 tabular-nums whitespace-nowrap">
                                                    <span className={Number(item.additionLimit) > 0 ? '' : 'text-slate-400'}>
                                                        {fmt(item.additionLimit ?? 0)}
                                                    </span>
                                                </td>
                                                {/* Addition Used */}
                                                <td className="px-4 py-3 text-right tabular-nums whitespace-nowrap border-r border-[#dadce0]/60 dark:border-[#3c4043]/60">
                                                    <span className={`font-medium ${Number(item.usedAdditionLimit) > 0 ? 'text-violet-600 dark:text-violet-400' : 'text-slate-400'}`}>
                                                        {fmt(item.usedAdditionLimit ?? 0)}
                                                    </span>
                                                </td>

                                                {/* Total Limit */}
                                                <td className="px-4 py-3 text-right font-bold text-[#1a73e8] dark:text-blue-400 tabular-nums whitespace-nowrap">
                                                    {fmt(item.totalLimit)}
                                                </td>
                                                {/* Total Used */}
                                                <td className="px-4 py-3 text-right font-semibold text-rose-600 dark:text-rose-400 tabular-nums whitespace-nowrap">
                                                    {fmt(item.totalUsedLimit ?? 0)}
                                                </td>
                                                {/* Total Available */}
                                                <td className="px-4 py-3 text-right font-bold text-emerald-600 dark:text-emerald-400 tabular-nums whitespace-nowrap border-r border-[#dadce0]/60 dark:border-[#3c4043]/60">
                                                    {fmt(item.totalAvailableLimit ?? 0)}
                                                </td>

                                                {/* Usage Bar */}
                                                <td className="px-4 py-3 min-w-[130px]">
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
                                                <td className="px-4 py-3 text-[11px] text-[#70757a] whitespace-nowrap tabular-nums">
                                                    {fmtDate(item.createDateTime)}
                                                </td>

                                                {/* Actions */}
                                                {canCreate && (
                                                    <td className="px-4 py-3 text-right whitespace-nowrap">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleOpenEdit(item)}
                                                                className="text-xs text-[#1a73e8] dark:text-blue-400 font-semibold hover:underline cursor-pointer"
                                                            >
                                                                Düzenle
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleOpenEdit({
                                                                    ...item,
                                                                    status: item.status === 'ACTIVE' ? 'PASSIVE' : 'ACTIVE',
                                                                    _presetStatus: true,
                                                                })}
                                                                className={`text-xs font-semibold hover:underline cursor-pointer ${
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
                        <div className="border-t border-[#dadce0] dark:border-[#3c4043]">
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
            </main>

            {/* Create/Edit Modal */}
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

export default LimitManagementTab;
