import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { bookingService } from '../services/bookingService';
import HeaderActions from '../components/HeaderActions';
import BookingStatusBadge from '../components/BookingStatusBadge';
import StatusMultiSelect from '../components/StatusMultiSelect';
import AgencyMultiSelect from '../components/AgencyMultiSelect';
import * as XLSX from 'xlsx';
import { BOOKING_STATUS_CONFIG } from '../utils/bookingStatusUtils';
import { tMB } from '../utils/myBookingsLocales';
import { downloadPdfDoc, downloadXlsxWorkbook } from '../utils/fileDownloadHelper';

const parseInitialFilters = (params) => {
    const todayStr = () => {
        const d = new Date();
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    let start = params.get('createDateStart') || '';
    let end = params.get('createDateEnd') || '';
    if (params.get('today') === 'true' || params.get('filter') === 'today') {
        const t = todayStr();
        start = t;
        end = t;
    }

    const rawStatus = params.get('bookingStatuses') || params.get('bookingStatus') || params.get('status');
    const bookingStatuses = rawStatus ? rawStatus.split(',').map(s => s.trim()).filter(Boolean) : [];

    return {
        id: params.get('id') || '',
        voucher: params.get('voucher') || '',
        supplierId: params.get('supplierId') || '',
        supplierName: params.get('supplierName') || '',
        internalHotelId: params.get('internalHotelId') || '',
        bookingUuid: params.get('bookingUuid') || '',
        paymentStatus: params.get('paymentStatus') || '',
        bookingStatuses: bookingStatuses,
        clientReferenceId: params.get('clientReferenceId') || '',
        requestId: params.get('requestId') || '',
        hotelName: params.get('hotelName') || '',
        createDateStart: start,
        createDateEnd: end,
        checkInStart: params.get('checkInStart') || '',
        checkInEnd: params.get('checkInEnd') || '',
        checkOutStart: params.get('checkOutStart') || '',
        checkOutEnd: params.get('checkOutEnd') || '',
        minAmount: params.get('minAmount') || '',
        maxAmount: params.get('maxAmount') || '',
        currencies: params.get('currencies') ? params.get('currencies').split(',') : [],
        principalAgencyIds: params.get('principalAgencyIds') ? params.get('principalAgencyIds').split(',').map(Number) : [],
        minCancellationAmount: params.get('minCancellationAmount') || '',
        maxCancellationAmount: params.get('maxCancellationAmount') || '',
        cancelReason: params.get('cancelReason') || '',
        isCancelled: params.get('isCancelled') || '',
    };
};

const MyBookings = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { i18n } = useTranslation();
    const [currentLang, setCurrentLang] = useState(() => {
        const raw = i18n.language || localStorage.getItem('i18nextLng') || 'en';
        return raw.split('-')[0].toLowerCase();
    });
    useEffect(() => {
        const raw = i18n.language || localStorage.getItem('i18nextLng') || 'en';
        setCurrentLang(raw.split('-')[0].toLowerCase());
        const handler = (lng) => { if (lng) setCurrentLang(lng.split('-')[0].toLowerCase()); };
        i18n.on('languageChanged', handler);
        return () => { i18n.off('languageChanged', handler); };
    }, [i18n]);
    const L = (key) => tMB(currentLang, key);
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isExportingExcel, setIsExportingExcel] = useState(false);
    const [isExportingPdf, setIsExportingPdf] = useState(false);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState(10);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [summaries, setSummaries] = useState([]);
    const hasLoadedData = React.useRef(false);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    // Filter state - initialized with searchParams
    const [filters, setFilters] = useState(() => parseInitialFilters(searchParams));

    // Integrated Search Effect (Handles mount, filters, pagination, and refresh)
    useEffect(() => {
        const abortController = new AbortController();

        // Debounce only if we already have data (i.e., user is changing filters)
        // Instant fetch on mount or when page/pageSize/refresh change
        const delay = (hasLoadedData.current && bookings.length > 0) ? 800 : 0;

        const timer = setTimeout(() => {
            searchBookings(abortController.signal);
            hasLoadedData.current = true;
        }, delay);

        return () => {
            clearTimeout(timer);
            abortController.abort();
        };
    }, [
        page,
        pageSize,
        refreshTrigger,
        // Individual filter dependencies to avoid unnecessarily complex object checks
        filters.id,
        filters.voucher,
        filters.supplierId,
        filters.supplierName,
        filters.internalHotelId,
        filters.bookingUuid,
        filters.clientReferenceId,
        filters.requestId,
        filters.hotelName,
        filters.createDateStart,
        filters.createDateEnd,
        filters.checkInStart,
        filters.checkInEnd,
        filters.checkOutStart,
        filters.checkOutEnd,
        filters.minAmount,
        filters.maxAmount,
        filters.minCancellationAmount,
        filters.maxCancellationAmount,
        filters.principalAgencyIds,
        filters.paymentStatus,
        filters.bookingStatuses,
        filters.isCancelled
    ]);

    const buildFilterPayload = () => {
        const filterObj = {};
        Object.keys(filters).forEach(key => {
            const value = filters[key];
            if (value === '' || value === null || value === undefined || (Array.isArray(value) && value.length === 0)) {
                filterObj[key] = null;
            } else {
                if (['id', 'supplierId', 'minAmount', 'maxAmount', 'minCancellationAmount', 'maxCancellationAmount', 'internalHotelId'].includes(key)) {
                    filterObj[key] = value === '' ? null : Number(value);
                } else if (key === 'isCancelled') {
                    filterObj[key] = value === 'true';
                } else if ((key.includes('checkIn') || key.includes('checkOut')) && (key.endsWith('Start') || key.endsWith('End'))) {
                    filterObj[key] = value;
                } else if (key === 'createDateStart') {
                    filterObj[key] = value + 'T00:00:00';
                } else if (key === 'createDateEnd') {
                    filterObj[key] = value + 'T23:59:59';
                } else if (['currencies', 'principalAgencyIds'].includes(key) && Array.isArray(value) && value.length > 0) {
                    filterObj[key] = value;
                } else {
                    filterObj[key] = value;
                }
            }
        });
        return filterObj;
    };

    const searchBookings = async (signal) => {
        try {
            setLoading(true);
            setError(null);
            const filterObj = buildFilterPayload();
            const data = await bookingService.searchBookings(filterObj, page, pageSize, signal);

            if (!signal?.aborted) {
                const bookingsData = data.bookings || {};
                setBookings(bookingsData.content || []);
                setTotalPages(bookingsData.totalPages || 0);
                setTotalElements(bookingsData.totalElements || 0);
                setSummaries(data.summaries || []);
            }
        } catch (error) {
            if (error.name !== 'AbortError') {
                console.error('Search error:', error);
                setError(error.message);
            }
        } finally {
            setLoading(false);
        }
    };

    const fetchAllFilteredBookings = async () => {
        const filterObj = buildFilterPayload();
        // Fetch up to 10000 records matching the exact current date/filters across all pages
        const data = await bookingService.searchBookings(filterObj, 0, 10000);
        const bookingsData = data.bookings || {};
        return bookingsData.content || [];
    };

    const exportToExcel = async () => {
        if (isExportingExcel || isExportingPdf) return;
        setIsExportingExcel(true);
        try {
            const allBookings = await fetchAllFilteredBookings();
            if (!allBookings || allBookings.length === 0) {
                alert(L('noBookings'));
                return;
            }

            const workbook = XLSX.utils.book_new();

            if (summaries && summaries.length > 0) {
                const summaryExportData = summaries.map(s => ({
                    'Currency': s.currency || 'TOTAL',
                    'Total Bookings': s.bookingCount || 0,
                    'Total Sales Amount': s.totalAmountSum != null ? Number(s.totalAmountSum).toFixed(2) : '0.00',
                    'Total Cancellation Fees': (s.totalCancellationAmountSum != null ? Number(s.totalCancellationAmountSum).toFixed(2) : (s.cancellationAmountSum != null ? Number(s.cancellationAmountSum).toFixed(2) : '0.00'))
                }));
                const summaryWorksheet = XLSX.utils.json_to_sheet(summaryExportData);
                summaryWorksheet['!cols'] = [
                    { wch: 15 }, { wch: 18 }, { wch: 24 }, { wch: 26 }
                ];
                XLSX.utils.book_append_sheet(workbook, summaryWorksheet, 'Summary');
            }

            const exportData = allBookings.map(b => ({
                [L('colId')]: b.bookingId ?? b.id ?? '',
                [L('colVoucher')]: b.voucher ?? '-',
                [L('colHotel')]: b.hotelName ?? '-',
                [L('colCreated')]: formatDateTime(b.createDateTime || b.createDate),
                [L('colCheckIn')]: formatDate(b.checkInDate || b.checkInStart),
                [L('colCheckOut')]: formatDate(b.checkOutDate || b.checkOutEnd),
                [L('colAmount')]: `${b.currency || ''} ${b.totalAmount != null ? Number(b.totalAmount).toFixed(2) : '0.00'}`,
                [L('colPayment')]: b.paymentStatus ? String(b.paymentStatus).replace(/_/g, ' ') : '-',
                [L('colStatus')]: b.bookingStatus ?? '-',
                [L('colCancelFee')]: (b.totalCancellationAmount || b.cancellationAmount) > 0 ? `${b.currency || ''} ${Number(b.totalCancellationAmount || b.cancellationAmount).toFixed(2)}` : '-',
                [L('colUuid')]: b.bookingUuid ?? '-',
                [L('colAgencyName')]: b.principalAgencyName || b.agencyName || '-',
                [L('colAgencyId')]: b.principalAgencyId ?? '-',
                [L('colHotelId')]: b.internalHotelId ?? '-',
                [L('colClRef')]: b.clientReferenceId ?? '-',
                [L('colCancelled')]: b.isCancelled ? L('yes') : L('no')
            }));

            const worksheet = XLSX.utils.json_to_sheet(exportData);

            // Auto column widths for all 16 columns
            worksheet['!cols'] = [
                { wch: 8 },   // ID
                { wch: 18 },  // Voucher
                { wch: 28 },  // Hotel
                { wch: 18 },  // Created
                { wch: 14 },  // Check-in
                { wch: 14 },  // Check-out
                { wch: 14 },  // Amount
                { wch: 20 },  // Payment
                { wch: 16 },  // Status
                { wch: 14 },  // Cancel Fee
                { wch: 32 },  // UUID
                { wch: 24 },  // Agency Name
                { wch: 12 },  // Agency ID
                { wch: 12 },  // Hotel ID
                { wch: 18 },  // Client Ref
                { wch: 12 },  // Cancelled?
            ];

            XLSX.utils.book_append_sheet(workbook, worksheet, 'Bookings');

            const dateStr = new Date().toISOString().split('T')[0];
            downloadXlsxWorkbook(XLSX, workbook, `Bookings_Report_${dateStr}.xlsx`);
        } catch (err) {
            console.error('Excel Export Error:', err);
            alert('Failed to export Excel: ' + (err.message || err));
        } finally {
            setIsExportingExcel(false);
        }
    };

    const exportToPdf = async () => {
        if (isExportingExcel || isExportingPdf) return;
        setIsExportingPdf(true);
        try {
            const allBookings = await fetchAllFilteredBookings();
            if (!allBookings || allBookings.length === 0) {
                alert(L('noBookings'));
                return;
            }

            const { jsPDF } = await import('jspdf');
            const autoTable = (await import('jspdf-autotable')).default;

            const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

            // Document Header
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text('Travel of Globe - Bookings Report', 10, 12);

            doc.setFontSize(8);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(100);
            doc.text(`Generated: ${new Date().toLocaleString()}  |  Total Matching Bookings: ${allBookings.length}`, 10, 17);

            let startY = 21;

            if (summaries && summaries.length > 0) {
                const summaryHeaders = ['Currency', 'Bookings Count', 'Total Sales Amount', 'Total Cancellation Fees'];
                const summaryRows = summaries.map(s => [
                    s.currency || 'TOTAL',
                    String(s.bookingCount || 0),
                    `${s.currency || ''} ${s.totalAmountSum != null ? Number(s.totalAmountSum).toFixed(2) : '0.00'}`,
                    `${s.currency || ''} ${s.totalCancellationAmountSum != null ? Number(s.totalCancellationAmountSum).toFixed(2) : (s.cancellationAmountSum != null ? Number(s.cancellationAmountSum).toFixed(2) : '0.00')}`
                ]);

                autoTable(doc, {
                    startY: 21,
                    head: [summaryHeaders],
                    body: summaryRows,
                    theme: 'grid',
                    styles: {
                        fontSize: 6.5,
                        cellPadding: 1.5
                    },
                    headStyles: {
                        fillColor: [30, 41, 59],
                        textColor: [255, 255, 255],
                        fontSize: 7,
                        fontStyle: 'bold',
                        halign: 'left'
                    },
                    bodyStyles: {
                        textColor: [30, 41, 59]
                    },
                    margin: { left: 6, right: 6 }
                });
                startY = (doc.lastAutoTable?.finalY || 21) + 5;
            }

            const headers = [
                L('colId'),
                L('colVoucher'),
                L('colHotel'),
                L('colCreated'),
                L('colCheckIn'),
                L('colCheckOut'),
                L('colAmount'),
                L('colPayment'),
                L('colStatus'),
                L('colCancelFee'),
                L('colUuid'),
                L('colAgencyName'),
                L('colAgencyId'),
                L('colHotelId'),
                L('colClRef'),
                L('colCancelled')
            ];

            const rows = allBookings.map(b => [
                b.bookingId ?? b.id ?? '',
                b.voucher ?? '-',
                b.hotelName ?? '-',
                formatDateTime(b.createDateTime || b.createDate),
                formatDate(b.checkInDate || b.checkInStart),
                formatDate(b.checkOutDate || b.checkOutEnd),
                `${b.currency || ''} ${b.totalAmount != null ? Number(b.totalAmount).toFixed(2) : '0.00'}`,
                b.paymentStatus ? String(b.paymentStatus).replace(/_/g, ' ') : '-',
                b.bookingStatus ?? '-',
                (b.totalCancellationAmount || b.cancellationAmount) > 0 ? `${b.currency || ''} ${Number(b.totalCancellationAmount || b.cancellationAmount).toFixed(2)}` : '-',
                b.bookingUuid ?? '-',
                b.principalAgencyName || b.agencyName || '-',
                b.principalAgencyId ?? '-',
                b.internalHotelId ?? '-',
                b.clientReferenceId ?? '-',
                b.isCancelled ? L('yes') : L('no')
            ]);

            autoTable(doc, {
                startY: startY,
                head: [headers],
                body: rows,
                theme: 'striped',
                styles: {
                    fontSize: 5.5,
                    cellPadding: 1,
                    overflow: 'linebreak'
                },
                headStyles: {
                    fillColor: [15, 23, 42],
                    textColor: [255, 255, 255],
                    fontSize: 6,
                    fontStyle: 'bold',
                    halign: 'left'
                },
                bodyStyles: {
                    textColor: [30, 41, 59]
                },
                alternateRowStyles: {
                    fillColor: [248, 250, 252]
                },
                margin: { top: 21, left: 6, right: 6, bottom: 10 }
            });

            const dateStr = new Date().toISOString().split('T')[0];
            downloadPdfDoc(doc, `Bookings_Report_${dateStr}.pdf`);
        } catch (err) {
            console.error('PDF Export Error:', err);
            alert('Failed to export PDF: ' + (err.message || err));
        } finally {
            setIsExportingPdf(false);
        }
    };

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    // Unified handleSearch used by Refresh and manual triggers
    const handleSearch = () => {
        setPage(0);
        setRefreshTrigger(prev => prev + 1);
    };

    const handleClearFilters = () => {
        navigate('/bookings', { replace: true });
        setFilters({
            id: '',
            voucher: '',
            supplierId: '',
            supplierName: '',
            internalHotelId: '',
            bookingUuid: '',
            paymentStatus: '',
            bookingStatuses: [],
            clientReferenceId: '',
            requestId: '',
            hotelName: '',
            createDateStart: '',
            createDateEnd: '',
            checkInStart: '',
            checkInEnd: '',
            checkOutStart: '',
            checkOutEnd: '',
            minAmount: '',
            maxAmount: '',
            currencies: [],
            principalAgencyIds: [],
            minCancellationAmount: '',
            maxCancellationAmount: '',
            cancelReason: '',
            isCancelled: '',
        });
        setPage(0);
        setRefreshTrigger(prev => prev + 1);
    };



    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        const currentLang = localStorage.getItem('language') || 'tr';
        return date.toLocaleDateString(currentLang, { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const formatDateTime = (dateTimeString) => {
        if (!dateTimeString) return 'N/A';
        const date = new Date(dateTimeString);
        const currentLang = localStorage.getItem('language') || 'tr';
        return date.toLocaleString(currentLang, {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };



    const getPaymentStatusColor = (status) => {
        switch (status) {
            case 'PAID_CREDIT_CARD':
            case 'PAID_ACCOUNT':
                return 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400';
            case 'PENDING_PAYMENT':
                return 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400';
            case 'REFUNDED_CREDIT_CARD':
            case 'REFUNDED_ACCOUNT':
                return 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400';
            case 'FAILED':
                return 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400';
            default:
                return 'bg-slate-100 text-slate-600 dark:bg-slate-900/30 dark:text-slate-400';
        }
    };

    return (
        <>
            {/* Ambient Background Glows */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 blur-[120px] rounded-full pointer-events-none"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/5 blur-[120px] rounded-full pointer-events-none"></div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col h-full overflow-hidden relative z-10">
                {/* Header - Fixed Glassy */}
                <header className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-md border-b border-white/40 dark:border-white/5 px-6 py-3.5 flex-shrink-0 z-30 transition-all">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                <span className="material-icons-round text-xl">book_online</span>
                            </div>
                            <div>
                                <h1 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">{L('title')}</h1>
                                <p className="text-xs font-normal text-slate-500 dark:text-slate-400">
                                    {L('subtitle')}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={exportToExcel}
                                disabled={isExportingExcel || isExportingPdf || loading}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 rounded-lg text-xs font-semibold text-emerald-700 dark:text-emerald-400 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                                title="Export all matching records to Excel"
                            >
                                {isExportingExcel ? (
                                    <div className="size-3.5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                    <span className="material-icons-round text-base">grid_on</span>
                                )}
                                {isExportingExcel ? L('exporting') : L('exportExcel')}
                            </button>

                            <button
                                onClick={exportToPdf}
                                disabled={isExportingExcel || isExportingPdf || loading}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 dark:bg-rose-900/20 hover:bg-rose-100 dark:hover:bg-rose-900/30 rounded-lg text-xs font-semibold text-rose-700 dark:text-rose-400 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                                title="Export all matching records to PDF"
                            >
                                {isExportingPdf ? (
                                    <div className="size-3.5 border-2 border-rose-600 border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                    <span className="material-icons-round text-base">picture_as_pdf</span>
                                )}
                                {isExportingPdf ? L('exporting') : L('exportPdf')}
                            </button>

                            <button
                                onClick={handleSearch}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 transition-all active:scale-95"
                            >
                                <span className="material-icons-round text-base">refresh</span>
                                {L('refresh')}
                            </button>
                            <button
                                onClick={handleClearFilters}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg text-xs font-semibold text-red-600 dark:text-red-400 transition-all active:scale-95"
                            >
                                <span className="material-icons-round text-base">filter_alt_off</span>
                                {L('clear')}
                            </button>

                            <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 mx-1"></div>

                            <HeaderActions />
                        </div>
                    </div>
                </header>

                {/* Content Area - Scrollable */}
                <div className="flex-1 overflow-auto px-6 py-4 relative">
                    {/* Background Intensity Glow for Table */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-[50%] bg-primary/5 blur-[150px] rounded-full pointer-events-none"></div>

                    {/* Compact Summary Cards Section Above Table */}
                    {summaries.length > 0 && (
                        <div className="mb-4 relative z-10">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                {summaries.map((summary, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center justify-between p-2.5 px-3.5 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-xl border border-slate-200/70 dark:border-slate-800 shadow-2xs hover:border-primary/30 transition-all"
                                    >
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            <div className="size-7 rounded-lg bg-primary/10 dark:bg-primary/20 flex items-center justify-center text-primary shrink-0">
                                                {summary.currency === 'EUR' ? (
                                                    <span className="material-icons-round text-base">euro</span>
                                                ) : summary.currency === 'USD' ? (
                                                    <span className="material-icons-round text-base">attach_money</span>
                                                ) : summary.currency === 'TRY' ? (
                                                    <span className="material-icons-round text-base">currency_lira</span>
                                                ) : (
                                                    <span className="material-icons-round text-base">receipt_long</span>
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">{summary.currency || 'Total'}</span>
                                                    <span className="text-[10px] text-slate-400">•</span>
                                                    <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-200">{summary.bookingCount} {L('bookings')}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="text-right shrink-0">
                                            <span className="text-xs font-bold text-primary">
                                                {summary.totalAmountSum?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Table with Premium Design */}
                    <div className="relative bg-transparent transition-all duration-500">
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/90 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800">
                                        <th className="px-3.5 py-2.5 text-left text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap min-w-[100px] select-none">{L('colId')}</th>
                                        <th className="px-3.5 py-2.5 text-left text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap min-w-[150px] select-none">{L('colVoucher')}</th>
                                        <th className="px-3.5 py-2.5 text-left text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap min-w-[280px] select-none">{L('colHotel')}</th>
                                        <th className="px-3.5 py-2.5 text-left text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap min-w-[160px] select-none">{L('colCreated')}</th>
                                        <th className="px-3.5 py-2.5 text-left text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap min-w-[160px] select-none">{L('colCheckIn')}</th>
                                        <th className="px-3.5 py-2.5 text-left text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap min-w-[160px] select-none">{L('colCheckOut')}</th>
                                        <th className="px-3.5 py-2.5 text-left text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap min-w-[140px] select-none">{L('colAmount')}</th>
                                        <th className="px-3.5 py-2.5 text-left text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap min-w-[140px] select-none">{L('colPayment')}</th>
                                        <th className="px-3.5 py-2.5 text-left text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap min-w-[140px] select-none">{L('colStatus')}</th>
                                        <th className="px-3.5 py-2.5 text-left text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap min-w-[140px] select-none">{L('colCancelFee')}</th>
                                        <th className="px-3.5 py-2.5 text-left text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap min-w-[290px] select-none">{L('colUuid')}</th>
                                        <th className="px-3.5 py-2.5 text-left text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap min-w-[200px] select-none">{L('colAgencyName')}</th>
                                        <th className="px-3.5 py-2.5 text-left text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap min-w-[100px] select-none">{L('colAgencyId')}</th>
                                        <th className="px-3.5 py-2.5 text-left text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap min-w-[150px] select-none">{L('colHotelId')}</th>
                                        <th className="px-3.5 py-2.5 text-left text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap min-w-[200px] select-none">{L('colClRef')}</th>
                                        <th className="px-3.5 py-2.5 text-left text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap min-w-[100px] select-none">{L('colCancelled')}</th>
                                    </tr>
                                    <tr className="bg-slate-50/80 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-700 relative z-20">
                                        <td className="px-2 py-2">
                                            <input
                                                type="number"
                                                value={filters.id}
                                                onChange={(e) => handleFilterChange('id', e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                                placeholder={L('colId')}
                                                className="w-full bg-white/20 dark:bg-slate-800/40 border border-white/40 dark:border-white/5 rounded-xl py-1.5 px-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-primary/40 focus:bg-white/40 focus:border-primary/50 transition-all outline-none"
                                            />
                                        </td>
                                        <td className="px-2 py-2">
                                            <input
                                                type="text"
                                                value={filters.voucher}
                                                onChange={(e) => handleFilterChange('voucher', e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                                placeholder={L('phVoucher')}
                                                className="w-full bg-white/20 dark:bg-slate-800/40 border border-white/40 dark:border-white/5 rounded-xl py-1.5 px-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-primary/40 focus:bg-white/40 focus:border-primary/50 transition-all outline-none"
                                            />
                                        </td>
                                        <td className="px-2 py-2">
                                            <input
                                                type="text"
                                                value={filters.hotelName}
                                                onChange={(e) => handleFilterChange('hotelName', e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                                placeholder={L('phHotelName')}
                                                className="w-full bg-white/20 dark:bg-slate-800/40 border border-white/40 dark:border-white/5 rounded-xl py-1.5 px-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-primary/40 focus:bg-white/40 focus:border-primary/50 transition-all outline-none"
                                            />
                                        </td>
                                        <td className="px-2 py-2">
                                            <div className="flex flex-col gap-1">
                                                <input
                                                    type="date"
                                                    value={filters.createDateStart}
                                                    onChange={(e) => handleFilterChange('createDateStart', e.target.value)}
                                                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                                    className="w-full bg-white/20 dark:bg-slate-800/40 border border-white/40 dark:border-white/5 rounded-lg py-1 px-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-primary/40 focus:bg-white/40 focus:border-primary/50 transition-all outline-none"
                                                />
                                                <input
                                                    type="date"
                                                    value={filters.createDateEnd}
                                                    onChange={(e) => handleFilterChange('createDateEnd', e.target.value)}
                                                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                                    className="w-full bg-white/20 dark:bg-slate-800/40 border border-white/40 dark:border-white/5 rounded-lg py-1 px-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-primary/40 focus:bg-white/40 focus:border-primary/50 transition-all outline-none"
                                                />
                                            </div>
                                        </td>
                                        <td className="px-2 py-2">
                                            <div className="flex flex-col gap-1">
                                                <input
                                                    type="date"
                                                    value={filters.checkInStart}
                                                    onChange={(e) => handleFilterChange('checkInStart', e.target.value)}
                                                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                                    className="w-full bg-white/20 dark:bg-slate-800/40 border border-white/40 dark:border-white/5 rounded-lg py-1 px-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-primary/40 focus:bg-white/40 focus:border-primary/50 transition-all outline-none"
                                                />
                                                <input
                                                    type="date"
                                                    value={filters.checkInEnd}
                                                    onChange={(e) => handleFilterChange('checkInEnd', e.target.value)}
                                                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                                    className="w-full bg-white/20 dark:bg-slate-800/40 border border-white/40 dark:border-white/5 rounded-lg py-1 px-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-primary/40 focus:bg-white/40 focus:border-primary/50 transition-all outline-none"
                                                />
                                            </div>
                                        </td>
                                        <td className="px-2 py-2">
                                            <div className="flex flex-col gap-1">
                                                <input
                                                    type="date"
                                                    value={filters.checkOutStart}
                                                    onChange={(e) => handleFilterChange('checkOutStart', e.target.value)}
                                                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                                    className="w-full bg-white/20 dark:bg-slate-800/40 border border-white/40 dark:border-white/5 rounded-lg py-1 px-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-primary/40 focus:bg-white/40 focus:border-primary/50 transition-all outline-none"
                                                />
                                                <input
                                                    type="date"
                                                    value={filters.checkOutEnd}
                                                    onChange={(e) => handleFilterChange('checkOutEnd', e.target.value)}
                                                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                                    className="w-full bg-white/20 dark:bg-slate-800/40 border border-white/40 dark:border-white/5 rounded-lg py-1 px-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-primary/40 focus:bg-white/40 focus:border-primary/50 transition-all outline-none"
                                                />
                                            </div>
                                        </td>
                                        <td className="px-2 py-2">
                                            <div className="flex flex-col gap-1">
                                                <input
                                                    type="number"
                                                    value={filters.minAmount}
                                                    onChange={(e) => handleFilterChange('minAmount', e.target.value)}
                                                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                                    placeholder={L('phMin')}
                                                    className="w-full bg-white/20 dark:bg-slate-800/40 border border-white/40 dark:border-white/5 rounded-lg py-1 px-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-primary/40 focus:bg-white/40 focus:border-primary/50 transition-all outline-none"
                                                />
                                                <input
                                                    type="number"
                                                    value={filters.maxAmount}
                                                    onChange={(e) => handleFilterChange('maxAmount', e.target.value)}
                                                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                                    placeholder="Max"
                                                    className="w-full bg-white/20 dark:bg-slate-800/40 border border-white/40 dark:border-white/5 rounded-lg py-1 px-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-primary/40 focus:bg-white/40 focus:border-primary/50 transition-all outline-none"
                                                />
                                            </div>
                                        </td>
                                        <td className="px-2 py-2">
                                            <select
                                                value={filters.paymentStatus}
                                                onChange={(e) => handleFilterChange('paymentStatus', e.target.value)}
                                                className="w-full bg-white/20 dark:bg-slate-800/40 border border-white/40 dark:border-white/5 rounded-xl py-1.5 px-2 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-primary/40 focus:bg-white/40 focus:border-primary/50 transition-all outline-none cursor-pointer"
                                            >
                                                <option className="font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900" value="">{L('all')}</option>
                                                <option className="font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900" value="PENDING_PAYMENT">{L('pyPending')}</option>
                                                <option className="font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900" value="PAID_CREDIT_CARD">{L('pyPaidCard')}</option>
                                                <option className="font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900" value="PAID_ACCOUNT">{L('pyPaidAcc')}</option>
                                                <option className="font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900" value="REFUNDED_CREDIT_CARD">{L('pyRefCard')}</option>
                                                <option className="font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900" value="REFUNDED_ACCOUNT">{L('pyRefAcc')}</option>
                                                <option className="font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900" value="FAILED">{L('pyFailed')}</option>
                                            </select>
                                        </td>
                                        <td className="px-2 py-2">
                                            <StatusMultiSelect
                                                selectedValues={filters.bookingStatuses}
                                                onChange={(values) => handleFilterChange('bookingStatuses', values)}
                                            />
                                        </td>
                                        <td className="px-2 py-2">
                                            <div className="flex flex-col gap-1">
                                                <input
                                                    type="number"
                                                    value={filters.minCancellationAmount}
                                                    onChange={(e) => handleFilterChange('minCancellationAmount', e.target.value)}
                                                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                                    placeholder={L('phMin')}
                                                    className="w-full bg-white/20 dark:bg-slate-800/40 border border-white/40 dark:border-white/5 rounded-lg py-1 px-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-primary/40 focus:bg-white/40 focus:border-primary/50 transition-all outline-none"
                                                />
                                                <input
                                                    type="number"
                                                    value={filters.maxCancellationAmount}
                                                    onChange={(e) => handleFilterChange('maxCancellationAmount', e.target.value)}
                                                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                                    placeholder={L('phMax')}
                                                    className="w-full bg-white/20 dark:bg-slate-800/40 border border-white/40 dark:border-white/5 rounded-lg py-1 px-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-primary/40 focus:bg-white/40 focus:border-primary/50 transition-all outline-none"
                                                />
                                            </div>
                                        </td>
                                        <td className="px-2 py-2">
                                            <input
                                                type="text"
                                                value={filters.bookingUuid}
                                                onChange={(e) => handleFilterChange('bookingUuid', e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                                placeholder={L('phUuid')}
                                                className="w-full bg-white/20 dark:bg-slate-800/40 border border-white/40 dark:border-white/5 rounded-xl py-1.5 px-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-primary/40 focus:bg-white/40 focus:border-primary/50 transition-all outline-none"
                                            />
                                        </td>
                                        <td className="px-2 py-2">
                                            <AgencyMultiSelect
                                                selectedValues={filters.principalAgencyIds}
                                                onChange={(values) => handleFilterChange('principalAgencyIds', values)}
                                            />
                                        </td>
                                        <td className="px-2 py-2">
                                            {/* Extra column header for Agency ID */}
                                        </td>
                                        <td className="px-2 py-2">
                                            <input
                                                type="number"
                                                value={filters.internalHotelId}
                                                onChange={(e) => handleFilterChange('internalHotelId', e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                                placeholder="Hotel ID"
                                                className="w-full bg-white/20 dark:bg-slate-800/40 border border-white/40 dark:border-white/5 rounded-xl py-1.5 px-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-primary/40 focus:bg-white/40 focus:border-primary/50 transition-all outline-none"
                                            />
                                        </td>
                                        <td className="px-2 py-2">
                                            <input
                                                type="text"
                                                value={filters.clientReferenceId}
                                                onChange={(e) => handleFilterChange('clientReferenceId', e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                                placeholder={L('phClRef')}
                                                className="w-full bg-white/20 dark:bg-slate-800/40 border border-white/40 dark:border-white/5 rounded-xl py-1.5 px-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-primary/40 focus:bg-white/40 focus:border-primary/50 transition-all outline-none"
                                            />
                                        </td>
                                        <td className="px-2 py-2">
                                            <select
                                                value={filters.isCancelled}
                                                onChange={(e) => handleFilterChange('isCancelled', e.target.value)}
                                                className="w-full bg-white/20 dark:bg-slate-800/40 border border-white/40 dark:border-white/5 rounded-xl py-1.5 px-2 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-primary/40 focus:bg-white/40 focus:border-primary/50 transition-all outline-none cursor-pointer"
                                            >
                                                <option className="font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900" value="">{L('all')}</option>
                                                <option className="font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900" value="true">{L('yes')}</option>
                                                <option className="font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900" value="false">{L('no')}</option>
                                            </select>
                                        </td>
                                    </tr>
                                </thead>
                                <tbody className="">
                                    {loading ? (
                                        Array.from({ length: 10 }).map((_, index) => (
                                            <tr key={`skeleton-${index}`} className="border-b border-white/20 dark:border-white/5 last:border-0 h-[61px]">
                                                {/* Adjusted widths to match column content types and header min-widths */}
                                                <td className="px-4 py-3"><div className="h-4 w-16 bg-slate-200 dark:bg-slate-700 rounded animate-shimmer"></div></td>
                                                <td className="px-4 py-3"><div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded animate-shimmer"></div></td>
                                                <td className="px-4 py-3"><div className="h-4 w-60 bg-slate-200 dark:bg-slate-700 rounded animate-shimmer"></div></td>
                                                <td className="px-4 py-3"><div className="h-4 w-32 bg-slate-200 dark:bg-slate-700 rounded animate-shimmer"></div></td>
                                                <td className="px-4 py-3"><div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded animate-shimmer"></div></td>
                                                <td className="px-4 py-3"><div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded animate-shimmer"></div></td>
                                                <td className="px-4 py-3"><div className="h-4 w-20 bg-slate-200 dark:bg-slate-700 rounded animate-shimmer"></div></td>
                                                <td className="px-4 py-3"><div className="h-5 w-24 bg-slate-200 dark:bg-slate-700 rounded-md animate-shimmer"></div></td>
                                                <td className="px-4 py-3"><div className="h-5 w-20 bg-slate-200 dark:bg-slate-700 rounded-md animate-shimmer"></div></td>
                                                <td className="px-4 py-3"><div className="h-4 w-16 bg-slate-200 dark:bg-slate-700 rounded animate-shimmer"></div></td>
                                                <td className="px-4 py-3"><div className="h-4 w-32 bg-slate-200 dark:bg-slate-700 rounded animate-shimmer"></div></td>
                                                <td className="px-4 py-3"><div className="h-4 w-40 bg-slate-200 dark:bg-slate-700 rounded animate-shimmer"></div></td>
                                                <td className="px-4 py-3"><div className="h-4 w-12 bg-slate-200 dark:bg-slate-700 rounded animate-shimmer"></div></td>
                                                <td className="px-4 py-3"><div className="h-4 w-16 bg-slate-200 dark:bg-slate-700 rounded animate-shimmer"></div></td>
                                                <td className="px-4 py-3"><div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded animate-shimmer"></div></td>
                                                <td className="px-4 py-3"><div className="h-5 w-5 mx-auto bg-slate-200 dark:bg-slate-700 rounded-full animate-shimmer"></div></td>
                                            </tr>
                                        ))
                                    ) : error ? (
                                        <tr>
                                            <td colSpan="15" className="px-4 py-12 text-center text-red-500">
                                                {L('errorPrefix')}: {error}
                                            </td>
                                        </tr>
                                    ) : bookings.length === 0 ? (
                                        <tr>
                                            <td colSpan="15" className="px-4 py-12 text-center text-slate-500">
                                                {L('noBookings')}
                                            </td>
                                        </tr>
                                    ) : (
                                        bookings.map((booking) => (
                                            <tr
                                                key={booking.bookingId}
                                                onClick={() => navigate(`/bookings/${booking.bookingId}`)}
                                                className="odd:bg-white dark:odd:bg-slate-900/80 even:bg-slate-50/80 dark:even:bg-slate-800/40 hover:bg-blue-50/50 dark:hover:bg-blue-900/20 transition-colors duration-150 border-b border-slate-100 dark:border-slate-800/60 cursor-pointer text-[11px] group"
                                            >
                                                <td className="px-3.5 py-2.5 text-slate-700 dark:text-slate-300 font-semibold group-hover:text-primary transition-colors whitespace-nowrap">#{booking.bookingId}</td>
                                                <td className="px-3.5 py-2.5 text-slate-600 dark:text-slate-300 text-[11px] font-medium truncate max-w-[120px]" title={booking.voucher}>{booking.voucher || '-'}</td>
                                                <td className="px-3.5 py-2.5 text-slate-700 dark:text-slate-200 text-[11px] font-medium truncate max-w-[220px]" title={booking.hotelName}>{booking.hotelName}</td>
                                                <td className="px-3.5 py-2.5 text-slate-500 dark:text-slate-400 text-[11px] font-normal whitespace-nowrap">{formatDateTime(booking.createDateTime)}</td>
                                                <td className="px-3.5 py-2.5 text-slate-500 dark:text-slate-400 text-[11px] font-normal whitespace-nowrap">{formatDate(booking.checkInDate)}</td>
                                                <td className="px-3.5 py-2.5 text-slate-500 dark:text-slate-400 text-[11px] font-normal whitespace-nowrap">{formatDate(booking.checkOutDate)}</td>
                                                <td className="px-3.5 py-2.5 text-slate-900 dark:text-white font-bold text-[11px] whitespace-nowrap">
                                                    {booking.currency} {booking.totalAmount?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </td>
                                                <td className="px-3.5 py-2.5">
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${getPaymentStatusColor(booking.paymentStatus)}`}>
                                                        {booking.paymentStatus?.replace('_', ' ')}
                                                    </span>
                                                </td>
                                                <td className="px-3.5 py-2.5">
                                                    <BookingStatusBadge status={booking.bookingStatus} className="shadow-none border-none bg-transparent p-0" showIcon={false} />
                                                </td>
                                                <td className="px-3.5 py-2.5 text-rose-600 dark:text-rose-400 font-bold text-[11px] whitespace-nowrap">
                                                    {booking.totalCancellationAmount > 0 ? `${booking.currency} ${booking.totalCancellationAmount?.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '-'}
                                                </td>
                                                <td className="px-3.5 py-2.5 text-slate-500 dark:text-slate-400 font-mono text-[11px] whitespace-nowrap" title={booking.bookingUuid}>{booking.bookingUuid}</td>
                                                <td className="px-3.5 py-2.5 text-slate-600 dark:text-slate-300 text-[11px] font-medium truncate max-w-[160px]" title={booking.principalAgencyName}>{booking.principalAgencyName}</td>
                                                <td className="px-3.5 py-2.5 text-slate-500 dark:text-slate-400 text-[10px]">{booking.principalAgencyId}</td>
                                                <td className="px-3.5 py-2.5 text-slate-500 dark:text-slate-400 text-[10px]">{booking.internalHotelId}</td>
                                                <td className="px-3.5 py-2.5 text-slate-600 dark:text-slate-300 text-[11px] font-medium whitespace-nowrap" title={booking.clientReferenceId}>{booking.clientReferenceId || '-'}</td>
                                                <td className="px-3.5 py-2.5 text-center">
                                                    {booking.isCancelled ? (
                                                        <span className="material-icons-round text-red-500 text-sm">check_circle</span>
                                                    ) : (
                                                        <span className="material-icons-round text-slate-300 dark:text-slate-700 text-sm">cancel</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination - Glassy */}
                        {totalPages > 0 && (
                            <div className="border-t border-slate-200/60 dark:border-slate-800 px-6 py-3 flex items-center justify-between bg-white/20 dark:bg-slate-900/20 backdrop-blur-xl">
                                <div className="flex items-center gap-2 text-xs">
                                    <span className="text-slate-500 dark:text-slate-400">{L('rowsPerPage')}:</span>
                                    <select
                                        value={pageSize}
                                        onChange={(e) => {
                                            setPageSize(Number(e.target.value));
                                            setPage(0);
                                        }}
                                        className="px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs outline-none"
                                    >
                                        <option value="10">10</option>
                                        <option value="25">25</option>
                                        <option value="50">50</option>
                                        <option value="100">100</option>
                                    </select>
                                </div>
                                <div className="flex items-center gap-2 text-xs">
                                    <span className="text-slate-500 dark:text-slate-400">
                                        {page + 1} {L('pageOf')} {totalPages} ({totalElements} {L('total')})
                                    </span>
                                    <button
                                        onClick={() => setPage(p => Math.max(0, p - 1))}
                                        disabled={page === 0}
                                        className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <span className="material-icons-round text-lg">chevron_left</span>
                                    </button>
                                    <button
                                        onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                                        disabled={page >= totalPages - 1}
                                        className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <span className="material-icons-round text-lg">chevron_right</span>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default MyBookings;
