import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { bookingService } from '../services/bookingService';
import HeaderActions from '../components/HeaderActions';
import BookingStatusBadge from '../components/BookingStatusBadge';
import StatusMultiSelect from '../components/StatusMultiSelect';
import GenericMultiSelect from '../components/GenericMultiSelect';
import ColumnManager from '../components/ColumnManager';
import { agencyService } from '../services/agencyService';
import { locationService } from '../services/locationService';
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
    const bookingStatuses = rawStatus ? rawStatus.split(',').map(s => s.trim()).filter(Boolean) : ['CONFIRMED'];

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
        gsaIds: params.get('gsaIds') ? params.get('gsaIds').split(',').map(Number) : [],
        rsaIds: params.get('rsaIds') ? params.get('rsaIds').split(',').map(Number) : [],
        agencyIds: params.get('agencyIds') ? params.get('agencyIds').split(',').map(Number) : [],
        principalAgencyIds: params.get('principalAgencyIds') ? params.get('principalAgencyIds').split(',').map(Number) : [],
        minCancellationAmount: params.get('minCancellationAmount') || '',
        maxCancellationAmount: params.get('maxCancellationAmount') || '',
        cancelReason: params.get('cancelReason') || '',
        isCancelled: params.get('isCancelled') || '',
    };
};

const getFlagEmoji = (countryCode) => {
    if (!countryCode) return '';
    const codePoints = countryCode
        .toUpperCase()
        .split('')
        .map(char => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
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


    const handleDragStart = (e, col) => {
        e.dataTransfer.setData('col', col);
    };

    const handleDrop = (e, targetCol) => {
        const sourceCol = e.dataTransfer.getData('col');
        if (!sourceCol || sourceCol === targetCol) return;
        
        const newCols = [...columns];
        const sourceIndex = newCols.indexOf(sourceCol);
        const targetIndex = newCols.indexOf(targetCol);
        
        newCols.splice(sourceIndex, 1);
        newCols.splice(targetIndex, 0, sourceCol);
        
        handleColumnsChange(newCols);
    };

    const AVAILABLE_COLUMNS = [
        "Reservation Number", "Reservation Date", "Check-in", "Check-out", "Hotel", 
        "Country", "City", "GSA", "RSA", "Agency", "Room", 
        "Board Type", "Guest", "Status", "Currency", "Net Amount", "Markup", 
        "Sale Amount", "Profit", "Supplier", "Supplier Reservation Number"
    ];

    const [columns, setColumns] = useState(["Reservation Number", "Reservation Date", "Check-in", "Check-out", "Hotel", "Agency", "Status", "Currency", "Sale Amount"]);
    const [allAgencies, setAllAgencies] = useState([]);
    
    // Location states
    const [countryOptions, setCountryOptions] = useState([]);
    const [cityOptions, setCityOptions] = useState([]);
    const [supplierOptions, setSupplierOptions] = useState([]);

    useEffect(() => {
        let mounted = true;
        const initData = async () => {
            try {
                const configRes = await bookingService.getColumnConfig();
                if (mounted && configRes && configRes.length > 0) {
                    setColumns(configRes);
                }
                const agenciesRes = await agencyService.getAgencies();
                if (mounted && Array.isArray(agenciesRes)) {
                    setAllAgencies(agenciesRes.sort((a, b) => (a.name || '').localeCompare(b.name || '')));
                }
            } catch (err) {
                console.error('Error fetching init data', err);
            }
        };
        initData();
        return () => { mounted = false; };
    }, []);

    const handleColumnsChange = async (newCols) => {
        setColumns(newCols);
        try {
            await bookingService.saveColumnConfig(newCols);
        } catch (e) {
            console.error('Failed to save column config', e);
        }
    };

    const gsaOptions = allAgencies.filter(a => a.agencyType === 'GSA');
    const rsaOptions = allAgencies.filter(a => a.agencyType === 'RSA');
    const agencyOptions = allAgencies.filter(a => a.agencyType === 'AGENCY');
    // const supplierOptions derived from state
    const currencyOptions = [
        { id: 'TRY', name: 'TRY', iconText: '₺' },
        { id: 'USD', name: 'USD', iconText: '$' },
        { id: 'EUR', name: 'EUR', iconText: '€' },
        { id: 'GBP', name: 'GBP', iconText: '£' }
    ];
    const boardTypeOptions = [
        { id: 'RO', name: 'Room Only (RO)' },
        { id: 'BB', name: 'Bed & Breakfast (BB)' },
        { id: 'HB', name: 'Half Board (HB)' },
        { id: 'FB', name: 'Full Board (FB)' },
        { id: 'AL', name: 'All Inclusive (AL)' }
    ];

    // Fetch suppliers on mount
    useEffect(() => {
        const controller = new AbortController();
        agencyService.getAllSuppliers(controller.signal)
            .then(res => {
                if (res?.suppliers) {
                    setSupplierOptions(res.suppliers.map(s => ({ id: s.supplierId, name: s.name })));
                }
            })
            .catch(e => {
                if (e.name !== 'CanceledError' && e.name !== 'AbortError') console.error('Failed to fetch suppliers', e);
            });
        return () => controller.abort();
    }, []);

    // Fetch countries on mount
    useEffect(() => {
        const controller = new AbortController();
        locationService.listCountries(controller.signal)
            .then(res => {
                if (res?.locationList && Array.isArray(res.locationList)) {
                    setCountryOptions(res.locationList.map(c => ({ id: c.locationId, name: `${getFlagEmoji(c.alphaTwoCode)} ${c.name.translations?.[i18n.language] || c.name.defaultName || c.name}` })));
                } else if (Array.isArray(res)) {
                    setCountryOptions(res.map(c => ({ id: c.locationId || c.id, name: c.name })));
                }
            })
            .catch(e => {
                if (e.name !== 'CanceledError' && e.name !== 'AbortError') console.error('Failed to fetch countries', e);
            });
        return () => controller.abort();
    }, []);

    // Fetch cities when countryIds changes
    useEffect(() => {
        if (!filters.countryIds || filters.countryIds.length === 0) {
            setCityOptions([]);
            return;
        }
        // Fetch subregions for the first selected country for now
        const controller = new AbortController();
        locationService.listSubRegions(filters.countryIds[0], controller.signal)
            .then(res => {
                if (res?.locationList && Array.isArray(res.locationList)) {
                    setCityOptions(res.locationList.map(c => ({ id: c.locationId, name: `${getFlagEmoji(c.alphaTwoCode)} ${c.name.translations?.[i18n.language] || c.name.defaultName || c.name}` })));
                } else if (Array.isArray(res)) {
                    setCityOptions(res.map(c => ({ id: c.locationId || c.id, name: c.name })));
                }
            })
            .catch(e => {
                if (e.name !== 'CanceledError' && e.name !== 'AbortError') console.error('Failed to fetch cities', e);
            });
        return () => controller.abort();
    }, [filters.countryIds]);

    // Integrated Search Effect (Handles mount, filters, pagination, and refresh)
    useEffect(() => {
        const abortController = new AbortController();
        setLoading(true);

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
        JSON.stringify(filters)
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
                } else if (['currencies', 'gsaIds', 'rsaIds', 'agencyIds', 'principalAgencyIds', 'countryIds', 'cityIds', 'supplierIds', 'boardTypes'].includes(key) && Array.isArray(value) && value.length > 0) {
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

    const getExportValue = (col, b, forPdf = false) => {
        let val = "-";
        if (col === "Reservation Number") val = b.bookingId ?? b.id;
        else if (col === "Voucher") val = b.voucher;
        else if (col === "Reservation Date") val = formatDateTime(b.createDateTime || b.createDate);
        else if (col === "Check-in") val = formatDate(b.checkInDate || b.checkInStart);
        else if (col === "Check-out") val = formatDate(b.checkOutDate || b.checkOutEnd);
        else if (col === "Hotel") val = b.hotelName;
        else if (col === "GSA") val = b.gsaName || "-";
        else if (col === "RSA") val = b.rsaName || "-";
        else if (col === "Agency") val = b.principalAgencyName || b.agencyName;
        else if (col === "Status") val = b.bookingStatus;
        else if (col === "Currency") val = b.currency || "-";
        else if (col === "Sale Amount") val = b.totalAmount != null ? Number(b.totalAmount).toFixed(2) : '0.00';
        else if (col === "Net Amount") val = b.netAmount != null ? Number(b.netAmount).toFixed(2) : "-";
        else if (col === "Markup") val = b.markupAmount != null ? Number(b.markupAmount).toFixed(2) : "-";
        else if (col === "Profit") val = b.markupAmount != null ? Number(b.markupAmount).toFixed(2) : "-";
        else if (col === "Room") val = b.roomName || "-";
        else if (col === "Board Type") val = b.boardName || "-";
        else if (col === "Guest") val = b.totalGuests != null ? b.totalGuests : "-";
        else if (col === "Supplier") val = b.supplierName || "-";
        else if (col === "Supplier Reservation Number") val = b.supplierVoucher || "-";
        else if (col === "Payment") val = b.paymentStatus ? b.paymentStatus.replace(/_/g, ' ') : 'UNKNOWN';
        else if (col === "Cancel Fee") val = (b.totalCancellationAmount || b.cancellationAmount) > 0 ? Number(b.totalCancellationAmount || b.cancellationAmount).toFixed(2) : '-';
        else if (col === "UUID") val = b.bookingUuid;
        else if (col === "Agency ID") val = b.principalAgencyId;
        else if (col === "Hotel ID") val = b.internalHotelId;
        else if (col === "Client Reference") val = b.clientReferenceId;
        else if (col === "Cancelled?") val = b.isCancelled ? L('yes') : L('no');
        else if (col === "Country") val = b.country || "-";
        else if (col === "City") val = b.city || "-";

        const strVal = String(val ?? "-");
        if (forPdf) {
            const charMap = { 'ı': 'i', 'İ': 'I', 'ş': 's', 'Ş': 'S', 'ğ': 'g', 'Ğ': 'G', 'ü': 'u', 'Ü': 'U', 'ö': 'o', 'Ö': 'O', 'ç': 'c', 'Ç': 'C' };
            return strVal.replace(/[ıİşŞğĞüÜöÖçÇ]/g, match => charMap[match]);
        }
        return strVal;
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

            const exportData = allBookings.map(b => {
                const row = {};
                columns.forEach(col => {
                    row[col] = getExportValue(col, b, false);
                });
                return row;
            });

            const worksheet = XLSX.utils.json_to_sheet(exportData);
            
            // Auto-size columns based on header and data length
            const colWidths = columns.map(col => {
                const maxHeaderLen = col.length;
                const maxDataLen = exportData.reduce((max, row) => {
                    const val = row[col] ? String(row[col]) : "";
                    return Math.max(max, val.length);
                }, 0);
                return { wch: Math.min(Math.max(maxHeaderLen, maxDataLen) + 2, 50) }; // cap width at 50 to prevent overly wide columns
            });
            worksheet['!cols'] = colWidths;

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
                    styles: { fontSize: 6.5, cellPadding: 1.5 },
                    headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontSize: 7, fontStyle: 'bold' },
                    margin: { left: 6, right: 6 }
                });
                startY = (doc.lastAutoTable?.finalY || 21) + 5;
            }

            const headers = columns;
            const rows = allBookings.map(b => {
                return columns.map(col => getExportValue(col, b, true));
            });

            autoTable(doc, {
                startY: startY,
                head: [headers],
                body: rows,
                theme: 'striped',
                styles: { fontSize: 5.5, cellPadding: 1, overflow: 'linebreak' },
                headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontSize: 6, fontStyle: 'bold' },
                alternateRowStyles: { fillColor: [248, 250, 252] },
                margin: { top: 21, left: 6, right: 6, bottom: 10 }
            });

            downloadPdfDoc(doc, `Bookings_Report_${new Date().toISOString().split('T')[0]}.pdf`);
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
            currencies: [],
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

                            <ColumnManager 
                                columns={columns} 
                                availableColumns={AVAILABLE_COLUMNS} 
                                onColumnsChange={handleColumnsChange} 
                                loading={loading} 
                            />

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
                                        {columns.map(col => {
                                            const key = col;
                                            const title = {
                                                "Reservation Number": L('colId'),
                                                "Voucher": L('colVoucher'),
                                                "Reservation Date": L('colCreated'),
                                                "Check-in": L('colCheckIn'),
                                                "Check-out": L('colCheckOut'),
                                                "Hotel": L('colHotel'),
                                                "Country": "Country",
                                                "City": "City",
                                                "GSA": "GSA",
                                                "RSA": "RSA",
                                                "Agency": L('colAgencyName'),
                                                "Room": "Room",
                                                "Board Type": "Board Type",
                                                "Guest": "Guest",
                                                "Status": L('colStatus'),
                                                "Currency": "Currency",
                                                "Net Amount": "Net Amount",
                                                "Markup": "Markup",
                                                "Sale Amount": L('colAmount'),
                                                "Profit": "Profit",
                                                "Supplier": "Supplier",
                                                "Supplier Reservation Number": "Supplier Res. No.",
                                                "Cancel Fee": L('colCancelFee'),
                                                "UUID": L('colUuid'),
                                                "Agency ID": L('colAgencyId'),
                                                "Hotel ID": L('colHotelId'),
                                                "Client Reference": L('colClRef'),
                                                "Cancelled?": L('colCancelled')
                                            }[key] || key;
                                            return (
                                                <th 
                                                    key={key} 
                                                    draggable
                                                    onDragStart={(e) => handleDragStart(e, key)}
                                                    onDragOver={(e) => e.preventDefault()}
                                                    onDrop={(e) => handleDrop(e, key)}
                                                    className="px-3.5 py-2.5 text-left text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap min-w-[120px] select-none cursor-move hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                                >
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="material-icons-round text-[13px] opacity-40">drag_indicator</span>
                                                        {title}
                                                    </div>
                                                </th>
                                            );
                                        })}
                                    </tr>
                                    <tr className="bg-slate-50/80 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-700 relative z-20">
                                        {columns.map(col => (
                                            <td key={col} className="px-2 py-2">
                                                {col === "Reservation Number" && (
                                                    <input type="number" value={filters.id} onChange={(e) => handleFilterChange('id', e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} placeholder={L('colId')} className="w-full bg-white/20 dark:bg-slate-800/40 border border-white/40 dark:border-white/5 rounded-xl py-1.5 px-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-primary/40 focus:bg-white/40 focus:border-primary/50 transition-all outline-none" />
                                                )}
                                                {col === "Voucher" && (
                                                    <input type="text" value={filters.voucher} onChange={(e) => handleFilterChange('voucher', e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} placeholder={L('phVoucher')} className="w-full bg-white/20 dark:bg-slate-800/40 border border-white/40 dark:border-white/5 rounded-xl py-1.5 px-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-primary/40 focus:bg-white/40 focus:border-primary/50 transition-all outline-none" />
                                                )}
                                                {col === "Hotel" && (
                                                    <input type="text" value={filters.hotelName} onChange={(e) => handleFilterChange('hotelName', e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} placeholder={L('phHotelName')} className="w-full bg-white/20 dark:bg-slate-800/40 border border-white/40 dark:border-white/5 rounded-xl py-1.5 px-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-primary/40 focus:bg-white/40 focus:border-primary/50 transition-all outline-none" />
                                                )}
                                                {col === "Reservation Date" && (
                                                    <div className="flex flex-col gap-1">
                                                        <input type="date" value={filters.createDateStart} onChange={(e) => handleFilterChange('createDateStart', e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} className="w-full bg-white/20 dark:bg-slate-800/40 border border-white/40 dark:border-white/5 rounded-lg py-1 px-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none" />
                                                        <input type="date" value={filters.createDateEnd} onChange={(e) => handleFilterChange('createDateEnd', e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} className="w-full bg-white/20 dark:bg-slate-800/40 border border-white/40 dark:border-white/5 rounded-lg py-1 px-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none" />
                                                    </div>
                                                )}
                                                {col === "Check-in" && (
                                                    <div className="flex flex-col gap-1">
                                                        <input type="date" value={filters.checkInStart} onChange={(e) => handleFilterChange('checkInStart', e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} className="w-full bg-white/20 dark:bg-slate-800/40 border border-white/40 dark:border-white/5 rounded-lg py-1 px-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none" />
                                                        <input type="date" value={filters.checkInEnd} onChange={(e) => handleFilterChange('checkInEnd', e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} className="w-full bg-white/20 dark:bg-slate-800/40 border border-white/40 dark:border-white/5 rounded-lg py-1 px-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none" />
                                                    </div>
                                                )}
                                                {col === "Check-out" && (
                                                    <div className="flex flex-col gap-1">
                                                        <input type="date" value={filters.checkOutStart} onChange={(e) => handleFilterChange('checkOutStart', e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} className="w-full bg-white/20 dark:bg-slate-800/40 border border-white/40 dark:border-white/5 rounded-lg py-1 px-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none" />
                                                        <input type="date" value={filters.checkOutEnd} onChange={(e) => handleFilterChange('checkOutEnd', e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} className="w-full bg-white/20 dark:bg-slate-800/40 border border-white/40 dark:border-white/5 rounded-lg py-1 px-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none" />
                                                    </div>
                                                )}
                                                {col === "Sale Amount" && (
                                                    <div className="flex flex-col gap-1">
                                                        <input type="number" value={filters.minAmount} onChange={(e) => handleFilterChange('minAmount', e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} placeholder={L('phMin')} className="w-full bg-white/20 dark:bg-slate-800/40 border border-white/40 dark:border-white/5 rounded-lg py-1 px-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none" />
                                                        <input type="number" value={filters.maxAmount} onChange={(e) => handleFilterChange('maxAmount', e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} placeholder="Max" className="w-full bg-white/20 dark:bg-slate-800/40 border border-white/40 dark:border-white/5 rounded-lg py-1 px-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none" />
                                                    </div>
                                                )}
                                                {col === "Payment" && (
                                                    <select value={filters.paymentStatus} onChange={(e) => handleFilterChange('paymentStatus', e.target.value)} className="w-full bg-white/20 dark:bg-slate-800/40 border border-white/40 dark:border-white/5 rounded-xl py-1.5 px-2 text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none cursor-pointer">
                                                        <option value="">{L('all')}</option>
                                                        <option value="PENDING_PAYMENT">{L('pyPending')}</option>
                                                        <option value="PAID_CREDIT_CARD">{L('pyPaidCard')}</option>
                                                        <option value="PAID_ACCOUNT">{L('pyPaidAcc')}</option>
                                                        <option value="REFUNDED_CREDIT_CARD">{L('pyRefCard')}</option>
                                                        <option value="REFUNDED_ACCOUNT">{L('pyRefAcc')}</option>
                                                        <option value="FAILED">{L('pyFailed')}</option>
                                                    </select>
                                                )}
                                                {col === "Status" && (
                                                    <StatusMultiSelect selectedValues={filters.bookingStatuses} onChange={(values) => handleFilterChange('bookingStatuses', values)} />
                                                )}
                                                {col === "Cancel Fee" && (
                                                    <div className="flex flex-col gap-1">
                                                        <input type="number" value={filters.minCancellationAmount} onChange={(e) => handleFilterChange('minCancellationAmount', e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} placeholder={L('phMin')} className="w-full bg-white/20 dark:bg-slate-800/40 border border-white/40 dark:border-white/5 rounded-lg py-1 px-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none" />
                                                        <input type="number" value={filters.maxCancellationAmount} onChange={(e) => handleFilterChange('maxCancellationAmount', e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} placeholder={L('phMax')} className="w-full bg-white/20 dark:bg-slate-800/40 border border-white/40 dark:border-white/5 rounded-lg py-1 px-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none" />
                                                    </div>
                                                )}
                                                {col === "UUID" && (
                                                    <input type="text" value={filters.bookingUuid} onChange={(e) => handleFilterChange('bookingUuid', e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} placeholder={L('phUuid')} className="w-full bg-white/20 dark:bg-slate-800/40 border border-white/40 dark:border-white/5 rounded-xl py-1.5 px-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none" />
                                                )}
                                                {col === "GSA" && (
                                                    <GenericMultiSelect options={gsaOptions} selectedValues={filters.gsaIds} onChange={(values) => handleFilterChange('gsaIds', values)} placeholder="Select GSA" />
                                                )}
                                                {col === "RSA" && (
                                                    <GenericMultiSelect options={rsaOptions} selectedValues={filters.rsaIds} onChange={(values) => handleFilterChange('rsaIds', values)} placeholder="Select RSA" disabled={filters.gsaIds.length > 0 && rsaOptions.length === 0} />
                                                )}
                                                {col === "Agency" && (
                                                    <GenericMultiSelect options={agencyOptions} selectedValues={filters.agencyIds} onChange={(values) => handleFilterChange('agencyIds', values)} placeholder="Select Agency" disabled={filters.rsaIds.length > 0 && agencyOptions.length === 0} />
                                                )}
                                                {col === "Hotel ID" && (
                                                    <input type="number" value={filters.internalHotelId} onChange={(e) => handleFilterChange('internalHotelId', e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} placeholder="Hotel ID" className="w-full bg-white/20 dark:bg-slate-800/40 border border-white/40 dark:border-white/5 rounded-xl py-1.5 px-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none" />
                                                )}
                                                {col === "Supplier" && (
                                                    <GenericMultiSelect options={supplierOptions} selectedValues={filters.supplierIds || []} onChange={(values) => handleFilterChange('supplierIds', values)} placeholder="Select Supplier" alignRight={true} />
                                                )}
                                                {col === "Supplier Reservation Number" && (
                                                    <input type="text" value={filters.supplierVoucher || ''} onChange={(e) => handleFilterChange('supplierVoucher', e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} placeholder="Res. No." className="w-full bg-white/20 dark:bg-slate-800/40 border border-white/40 dark:border-white/5 rounded-xl py-1.5 px-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none" />
                                                )}
                                                {col === "Country" && (
                                                    <GenericMultiSelect options={countryOptions} selectedValues={filters.countryIds || []} onChange={(values) => handleFilterChange('countryIds', values)} placeholder="Select Country" alignRight={true} />
                                                )}
                                                {col === "City" && (
                                                    <GenericMultiSelect options={cityOptions} selectedValues={filters.cityIds || []} onChange={(values) => handleFilterChange('cityIds', values)} placeholder="Select City" alignRight={true} />
                                                )}
                                                {col === "Currency" && (
                                                    <GenericMultiSelect options={currencyOptions} selectedValues={filters.currencies || []} onChange={(values) => handleFilterChange('currencies', values)} placeholder="Select Currency" alignRight={true} />
                                                )}
                                                {col === "Net Amount" && (
                                                    <div className="flex flex-col gap-1">
                                                        <input type="number" value={filters.minNetAmount} onChange={(e) => handleFilterChange('minNetAmount', e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} placeholder="Min" className="w-full bg-white/20 dark:bg-slate-800/40 border border-white/40 dark:border-white/5 rounded-lg py-1 px-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none" />
                                                        <input type="number" value={filters.maxNetAmount} onChange={(e) => handleFilterChange('maxNetAmount', e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} placeholder="Max" className="w-full bg-white/20 dark:bg-slate-800/40 border border-white/40 dark:border-white/5 rounded-lg py-1 px-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none" />
                                                    </div>
                                                )}
                                                {col === "Markup" && (
                                                    <div className="flex flex-col gap-1">
                                                        <input type="number" value={filters.minMarkupAmount} onChange={(e) => handleFilterChange('minMarkupAmount', e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} placeholder="Min" className="w-full bg-white/20 dark:bg-slate-800/40 border border-white/40 dark:border-white/5 rounded-lg py-1 px-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none" />
                                                        <input type="number" value={filters.maxMarkupAmount} onChange={(e) => handleFilterChange('maxMarkupAmount', e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} placeholder="Max" className="w-full bg-white/20 dark:bg-slate-800/40 border border-white/40 dark:border-white/5 rounded-lg py-1 px-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none" />
                                                    </div>
                                                )}
                                                {col === "Profit" && (
                                                    <div className="flex flex-col gap-1">
                                                        <input type="number" value={filters.minMarkupAmount} onChange={(e) => handleFilterChange('minMarkupAmount', e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} placeholder="Min" className="w-full bg-white/20 dark:bg-slate-800/40 border border-white/40 dark:border-white/5 rounded-lg py-1 px-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none" />
                                                        <input type="number" value={filters.maxMarkupAmount} onChange={(e) => handleFilterChange('maxMarkupAmount', e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} placeholder="Max" className="w-full bg-white/20 dark:bg-slate-800/40 border border-white/40 dark:border-white/5 rounded-lg py-1 px-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none" />
                                                    </div>
                                                )}
                                                {col === "Room" && (
                                                    <input type="text" value={filters.roomName} onChange={(e) => handleFilterChange('roomName', e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} placeholder="Room" className="w-full bg-white/20 dark:bg-slate-800/40 border border-white/40 dark:border-white/5 rounded-xl py-1.5 px-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none" />
                                                )}
                                                {col === "Board Type" && (
                                                    <GenericMultiSelect options={boardTypeOptions} selectedValues={filters.boardTypes || []} onChange={(values) => handleFilterChange('boardTypes', values)} placeholder="Select Board" alignRight={true} />
                                                )}
                                                {col === "Guest" && (
                                                    <div className="flex flex-col gap-1">
                                                        <input type="number" value={filters.minGuest} onChange={(e) => handleFilterChange('minGuest', e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} placeholder="Min" className="w-full bg-white/20 dark:bg-slate-800/40 border border-white/40 dark:border-white/5 rounded-lg py-1 px-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none" />
                                                        <input type="number" value={filters.maxGuest} onChange={(e) => handleFilterChange('maxGuest', e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} placeholder="Max" className="w-full bg-white/20 dark:bg-slate-800/40 border border-white/40 dark:border-white/5 rounded-lg py-1 px-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none" />
                                                    </div>
                                                )}
                                                {col === "Client Reference" && (
                                                    <input type="text" value={filters.clientReferenceId} onChange={(e) => handleFilterChange('clientReferenceId', e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} placeholder={L('phClRef')} className="w-full bg-white/20 dark:bg-slate-800/40 border border-white/40 dark:border-white/5 rounded-xl py-1.5 px-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none" />
                                                )}
                                                {col === "Cancelled?" && (
                                                    <select value={filters.isCancelled} onChange={(e) => handleFilterChange('isCancelled', e.target.value)} className="w-full bg-white/20 dark:bg-slate-800/40 border border-white/40 dark:border-white/5 rounded-xl py-1.5 px-2 text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none cursor-pointer">
                                                        <option value="">{L('all')}</option>
                                                        <option value="true">{L('yes')}</option>
                                                        <option value="false">{L('no')}</option>
                                                    </select>
                                                )}
                                                {/* Fallback for other columns */}
                                                {!["Reservation Number", "Voucher", "Hotel", "Reservation Date", "Check-in", "Check-out", "Sale Amount", "Payment", "Status", "Cancel Fee", "UUID", "GSA", "RSA", "Agency", "Hotel ID", "Supplier", "Currency", "Net Amount", "Markup", "Profit", "Room", "Board Type", "Guest", "Client Reference", "Cancelled?", "Country", "City", "Supplier Reservation Number"].includes(col) && (
                                                    <div className="text-[10px] text-slate-400">Filter N/A</div>
                                                )}
                                            </td>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        Array.from({ length: pageSize || 10 }).map((_, index) => (
                                            <tr key={`skeleton-${index}`} className="border-b border-slate-100 dark:border-slate-800/50 even:bg-slate-50/50 dark:even:bg-slate-800/20 h-[53px]">
                                                {columns.map((col, cIndex) => (
                                                    <td key={col} className="px-3.5 py-3">
                                                        <div className={`h-3.5 bg-slate-200/80 dark:bg-slate-700/60 rounded animate-pulse ${
                                                            cIndex % 3 === 0 ? 'w-2/3' : cIndex % 2 === 0 ? 'w-full' : 'w-4/5'
                                                        }`}></div>
                                                    </td>
                                                ))}
                                            </tr>
                                        ))
                                    ) : bookings.length === 0 ? (
                                        <tr>
                                            <td colSpan={columns.length} className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                                                <div className="flex flex-col items-center justify-center gap-2">
                                                    <span className="material-icons-round text-4xl opacity-50">search_off</span>
                                                    <p>{error ? error : L('noBookings')}</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        bookings.map((booking) => (
                                            <tr 
                                                key={booking.bookingId ?? booking.id} 
                                                onClick={() => window.open(`/bookings/${booking.bookingId ?? booking.id}`, '_blank')}
                                                className="border-b border-slate-100 dark:border-slate-800/50 last:border-0 hover:bg-slate-100 dark:hover:bg-slate-700/50 even:bg-slate-50 dark:even:bg-slate-800/50 transition-colors cursor-pointer group"
                                            >
                                                {columns.map(col => {
                                                    let val = "-";
                                                    if (col === "Reservation Number") val = booking.bookingId ?? booking.id;
                                                    else if (col === "Voucher") val = booking.voucher;
                                                    else if (col === "Reservation Date") val = formatDateTime(booking.createDateTime || booking.createDate);
                                                    else if (col === "Check-in") val = formatDate(booking.checkInDate || booking.checkInStart);
                                                    else if (col === "Check-out") val = formatDate(booking.checkOutDate || booking.checkOutEnd);
                                                    else if (col === "Hotel") val = booking.hotelName;
                                                    else if (col === "GSA") val = booking.gsaName || "-";
                                                    else if (col === "RSA") val = booking.rsaName || "-";
                                                    else if (col === "Agency") val = booking.principalAgencyName || booking.agencyName;
                                                    else if (col === "Status") val = <BookingStatusBadge status={booking.bookingStatus} />;
                                                    else if (col === "Currency") val = booking.currency || "-";
                                                    else if (col === "Sale Amount") val = <div className="font-semibold text-slate-900 dark:text-white">{booking.currency} {booking.totalAmount != null ? Number(booking.totalAmount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}</div>;
                                                    else if (col === "Net Amount") val = booking.netAmount != null ? <div className="font-semibold text-slate-900 dark:text-white">{booking.currency} {Number(booking.netAmount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div> : "-";
                                                    else if (col === "Markup") val = booking.markupAmount != null ? <div className="font-semibold text-slate-900 dark:text-white">{booking.currency} {Number(booking.markupAmount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div> : "-";
                                                    else if (col === "Profit") val = booking.markupAmount != null ? <div className="font-semibold text-green-600 dark:text-green-400">{booking.currency} {Number(booking.markupAmount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div> : "-";
                                                    else if (col === "Room") val = booking.roomName || "-";
                                                    else if (col === "Board Type") val = booking.boardName || "-";
                                                    else if (col === "Guest") val = booking.totalGuests != null ? booking.totalGuests : "-";
                                                    else if (col === "Supplier") val = booking.supplierName || "-";
                                                    else if (col === "Supplier Reservation Number") val = booking.supplierVoucher || "-";
                                                    else if (col === "Payment") val = <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${getPaymentStatusColor(booking.paymentStatus)}`}>{booking.paymentStatus ? booking.paymentStatus.replace(/_/g, ' ') : 'UNKNOWN'}</span>;
                                                    else if (col === "Cancel Fee") val = (booking.totalCancellationAmount || booking.cancellationAmount) > 0 ? <span className="text-red-500 font-semibold">{booking.currency} {Number(booking.totalCancellationAmount || booking.cancellationAmount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span> : '-';
                                                    else if (col === "UUID") val = <div className="text-[10px] text-slate-500 font-mono" title={booking.bookingUuid}>{booking.bookingUuid?.substring(0, 8)}...</div>;
                                                    else if (col === "Agency ID") val = booking.principalAgencyId;
                                                    else if (col === "Hotel ID") val = booking.internalHotelId;
                                                    else if (col === "Client Reference") val = booking.clientReferenceId;
                                                    else if (col === "Cancelled?") val = booking.isCancelled ? L('yes') : L('no');
                                                    else if (col === "Country") val = booking.country || "-";
                                                    else if (col === "City") val = booking.city || "-";
                                                    
                                                    return (
                                                        <td key={col} className="px-3.5 py-3 text-xs text-slate-600 dark:text-slate-300 whitespace-nowrap">
                                                            {val || "-"}
                                                        </td>
                                                    );
                                                })}
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
                                        className="px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                                    >
                                        <option value="5">5</option>
                                        <option value="10">10</option>
                                        <option value="25">25</option>
                                        <option value="50">50</option>
                                        <option value="100">100</option>
                                    </select>
                                </div>
                                <div className="flex flex-wrap items-center gap-2 text-xs">
                                    <span className="text-slate-500 dark:text-slate-400 mr-1 sm:mr-3">
                                        {page + 1} {L('pageOf')} {totalPages} ({totalElements} {L('total')})
                                    </span>
                                    
                                    {/* Advanced Pagination Controls */}
                                    <div className="flex items-center gap-0.5 sm:gap-1 bg-white/60 dark:bg-slate-800/60 p-1 rounded-xl border border-slate-200/60 dark:border-slate-700/60 shadow-sm">
                                        {/* First Page */}
                                        <button
                                            onClick={() => setPage(0)}
                                            disabled={page === 0}
                                            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-transparent transition-all flex items-center justify-center text-slate-600 dark:text-slate-300"
                                            title="First Page"
                                        >
                                            <span className="material-icons-round text-[16px]">keyboard_double_arrow_left</span>
                                        </button>
                                        
                                        {/* Previous Page */}
                                        <button
                                            onClick={() => setPage(p => Math.max(0, p - 1))}
                                            disabled={page === 0}
                                            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-transparent transition-all flex items-center justify-center text-slate-600 dark:text-slate-300"
                                            title="Previous Page"
                                        >
                                            <span className="material-icons-round text-[16px]">chevron_left</span>
                                        </button>
                                        
                                        {/* Page Numbers */}
                                        <div className="hidden sm:flex items-center px-1 gap-1">
                                            {(() => {
                                                const maxVisiblePages = 5;
                                                let startPage = Math.max(0, page - Math.floor(maxVisiblePages / 2));
                                                let endPage = Math.min(totalPages - 1, startPage + maxVisiblePages - 1);
                                                
                                                if (endPage - startPage + 1 < maxVisiblePages) {
                                                    startPage = Math.max(0, endPage - maxVisiblePages + 1);
                                                }
                                                
                                                const pages = [];
                                                if (startPage > 0) {
                                                    pages.push(<span key="ellipsis-start" className="px-1 text-slate-400">...</span>);
                                                }
                                                
                                                for (let i = startPage; i <= endPage; i++) {
                                                    pages.push(
                                                        <button
                                                            key={i}
                                                            onClick={() => setPage(i)}
                                                            className={`min-w-[28px] h-[28px] flex items-center justify-center rounded-lg text-[13px] font-medium transition-all ${
                                                                page === i
                                                                    ? 'bg-primary text-white shadow-md shadow-primary/20'
                                                                    : 'hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 bg-transparent'
                                                            }`}
                                                        >
                                                            {i + 1}
                                                        </button>
                                                    );
                                                }
                                                
                                                if (endPage < totalPages - 1) {
                                                    pages.push(<span key="ellipsis-end" className="px-1 text-slate-400">...</span>);
                                                }
                                                
                                                return pages;
                                            })()}
                                        </div>

                                        {/* Next Page */}
                                        <button
                                            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                                            disabled={page >= totalPages - 1}
                                            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-transparent transition-all flex items-center justify-center text-slate-600 dark:text-slate-300"
                                            title="Next Page"
                                        >
                                            <span className="material-icons-round text-[16px]">chevron_right</span>
                                        </button>
                                        
                                        {/* Last Page */}
                                        <button
                                            onClick={() => setPage(totalPages - 1)}
                                            disabled={page >= totalPages - 1}
                                            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-transparent transition-all flex items-center justify-center text-slate-600 dark:text-slate-300"
                                            title="Last Page"
                                        >
                                            <span className="material-icons-round text-[16px]">keyboard_double_arrow_right</span>
                                        </button>
                                    </div>
                                    
                                    {/* Go to page input */}
                                    <div className="flex items-center bg-white/60 dark:bg-slate-800/60 p-1 rounded-xl border border-slate-200/60 dark:border-slate-700/60 shadow-sm">
                                        <div className="flex items-center px-2 border-r border-slate-200 dark:border-slate-700">
                                            <span className="material-icons-round text-[14px] text-slate-400">redo</span>
                                        </div>
                                        <input 
                                            type="number" 
                                            min="1" 
                                            max={totalPages}
                                            placeholder="#"
                                            className="w-12 h-7 bg-transparent border-none text-[13px] outline-none text-center text-slate-700 dark:text-slate-200 placeholder:text-slate-400"
                                            title="Go to page (Enter)"
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    const val = parseInt(e.target.value);
                                                    if (!isNaN(val) && val >= 1 && val <= totalPages) {
                                                        setPage(val - 1);
                                                        e.target.value = '';
                                                    }
                                                }
                                            }}
                                        />
                                    </div>
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
