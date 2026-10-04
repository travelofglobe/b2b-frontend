import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { taskManagementService } from '../services/taskManagementService';

const priorityOptions = [
    { value: 'LOW', label: 'Düşük / Low', color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' },
    { value: 'NORMAL', label: 'Normal', color: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300' },
    { value: 'HIGH', label: 'Yüksek / High', color: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300' },
    { value: 'URGENT', label: 'Acil / Urgent', color: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300' }
];

const CreateTaskModal = ({ isOpen, onClose, booking, productType = 'HOTEL', onSuccess }) => {
    const { t } = useTranslation();
    const fileInputRef = useRef(null);

    const [taskTypes, setTaskTypes] = useState([]);
    const [selectedTypeCode, setSelectedTypeCode] = useState('');
    const [selectedTypeName, setSelectedTypeName] = useState('');
    const [priority, setPriority] = useState('NORMAL');
    const [description, setDescription] = useState('');
    const [files, setFiles] = useState([]);
    const [submitting, setSubmitting] = useState(false);
    const [loadingTypes, setLoadingTypes] = useState(false);
    const [error, setError] = useState(null);

    // Dynamic fields
    const [newDateStart, setNewDateStart] = useState('');
    const [newDateEnd, setNewDateEnd] = useState('');
    const [newOptionPreference, setNewOptionPreference] = useState('');
    const [guestNameChangeOld, setGuestNameChangeOld] = useState('');
    const [guestNameChangeNew, setGuestNameChangeNew] = useState('');
    const [newGuestInfo, setNewGuestInfo] = useState('');
    const [removeGuestName, setRemoveGuestName] = useState('');

    // Load dynamic task types from backend for this product
    useEffect(() => {
        if (isOpen) {
            loadTaskTypes();
        }
    }, [isOpen, productType]);

    const loadTaskTypes = async () => {
        try {
            setLoadingTypes(true);
            const types = await taskManagementService.getActiveTaskTypes(productType);
            if (types && types.length > 0) {
                setTaskTypes(types);
                setSelectedTypeCode(types[0].code);
                setSelectedTypeName(types[0].name);
            } else {
                // Fallback default types for product
                const fallback = getFallbackTypes(productType);
                setTaskTypes(fallback);
                setSelectedTypeCode(fallback[0]?.code || 'OTHER');
                setSelectedTypeName(fallback[0]?.name || 'Diğer Talepler');
            }
        } catch (err) {
            console.warn('Failed to fetch dynamic task types, using defaults:', err);
            const fallback = getFallbackTypes(productType);
            setTaskTypes(fallback);
            setSelectedTypeCode(fallback[0]?.code || 'OTHER');
            setSelectedTypeName(fallback[0]?.name || 'Diğer Talepler');
        } finally {
            setLoadingTypes(false);
        }
    };

    const getFallbackTypes = (prod) => {
        if (prod === 'FLIGHT') {
            return [
                { code: 'FLIGHT_DATE_CHANGE', name: 'Tarih / Parkur Değişikliği', description: 'Uçuş saati, tarihi veya parkur değişikliği', icon: 'flight_takeoff' },
                { code: 'FLIGHT_CANCELLATION', name: 'Bilet İptal / İade Talebi', description: 'Uçak bileti iptali veya iade hesabı', icon: 'cancel' },
                { code: 'FLIGHT_NAME_CORRECTION', name: 'Yolcu İsim Düzeltme', description: 'Bilet üzerindeki isim hatası düzeltmesi', icon: 'badge' },
                { code: 'FLIGHT_EXTRA_BAGGAGE', name: 'Ekstra Bagaj Satın Alma', description: 'Ekstra bagaj hakkı ekleme talebi', icon: 'luggage' },
                { code: 'FLIGHT_SEAT_SELECTION', name: 'Koltuk Seçimi', description: 'Koltuk seçimi talepleri', icon: 'airline_seat_recline_extra' },
                { code: 'FLIGHT_OTHER', name: 'Diğer Uçuş Talepleri', description: 'Diğer tüm uçuş operasyon talepleri', icon: 'flight' }
            ];
        } else if (prod === 'TRANSFER') {
            return [
                { code: 'TRANSFER_TIME_CHANGE', name: 'Transfer Saat / Uçuş No Değişikliği', description: 'Uçuş rötarı veya transfer saati güncelleme', icon: 'directions_car' },
                { code: 'TRANSFER_CANCELLATION', name: 'Transfer İptali', description: 'Transfer iptal talebi', icon: 'cancel' },
                { code: 'TRANSFER_VEHICLE_UPGRADE', name: 'Araç Yükseltme', description: 'Araç kapasitesi veya sınıf yükseltme', icon: 'local_taxi' },
                { code: 'TRANSFER_OTHER', name: 'Diğer Transfer Talepleri', description: 'Diğer transfer talepleri', icon: 'commute' }
            ];
        }
        // Default HOTEL
        return [
            { code: 'HOTEL_DATE_CHANGE', name: 'Tarih Değişikliği', description: 'Check-in / check-out tarihi değiştirme', icon: 'calendar_month' },
            { code: 'HOTEL_CANCELLATION', name: 'İptal Talebi', description: 'Rezervasyon iptal ve ceza kontrol talebi', icon: 'cancel' },
            { code: 'HOTEL_NAME_CHANGE', name: 'Misafir İsim Değişikliği / Düzeltme', description: 'Misafir isim düzeltme talebi', icon: 'badge' },
            { code: 'HOTEL_ROOM_UPGRADE', name: 'Oda Tipi / Pansiyon Değişikliği', description: 'Oda veya konsept değişikliği', icon: 'hotel' },
            { code: 'HOTEL_EARLY_LATE', name: 'Erken Giriş / Geç Çıkış', description: 'Erken giriş veya geç çıkış talebi', icon: 'schedule' },
            { code: 'HOTEL_SPECIAL_REQUEST', name: 'Özel İstek / Balayı / Yatak', description: 'Balayı konsepti, yatak tercihi vb.', icon: 'favorite' },
            { code: 'HOTEL_INVOICE', name: 'Fatura / Muhasebe Talebi', description: 'Fatura veya ödeme düzeltmesi', icon: 'receipt_long' },
            { code: 'HOTEL_OTHER', name: 'Diğer Otel Talepleri', description: 'Diğer tüm talepler', icon: 'help_outline' }
        ];
    };

    if (!isOpen) return null;

    // Generic Reservation Summary from booking prop
    const reservationNo = booking?.orderId || booking?.id || booking?.reservationNo || 'N/A';
    const productName = booking?.productName || booking?.hotel?.hotelName || booking?.hotelName || booking?.flightRoute || booking?.transferRoute || 'Ürün Bilgisi';
    const supplierName = booking?.supplierName || booking?.hotel?.supplierName || 'Tedarikçi';
    const checkIn = booking?.hotel?.checkIn || booking?.checkIn || booking?.flightDate || booking?.transferDate || 'N/A';
    const checkOut = booking?.hotel?.checkOut || booking?.checkOut || 'N/A';
    const optionName = booking?.hotel?.roomName || booking?.roomName || booking?.flightClass || booking?.vehicleType || 'Standart';
    const primaryGuest = booking?.hotel?.rooms?.[0]?.passengers?.[0]?.firstName 
        ? `${booking.hotel.rooms[0].passengers[0].firstName} ${booking.hotel.rooms[0].passengers[0].lastName || ''}`
        : (booking?.holderName || 'Misafir / Yolcu');
    const currentStatus = booking?.hotel?.bookingStatus || booking?.status || 'CONFIRMED';

    const handleTypeSelect = (code) => {
        setSelectedTypeCode(code);
        const t = taskTypes.find(x => x.code === code);
        if (t) setSelectedTypeName(t.name);
    };

    const handleFileChange = (e) => {
        const selected = Array.from(e.target.files || []);
        setFiles(prev => [...prev, ...selected]);
    };

    const removeFile = (idx) => {
        setFiles(prev => prev.filter((_, i) => i !== idx));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!description.trim()) {
            setError('Lütfen bir talep açıklaması girin.');
            return;
        }

        try {
            setSubmitting(true);
            setError(null);

            // Construct generic JSON details
            const currentDataObj = {
                productName,
                supplierName,
                checkIn,
                checkOut,
                optionName,
                primaryGuest,
                status: currentStatus
            };

            const requestedDataObj = {
                typeCode: selectedTypeCode,
                typeName: selectedTypeName,
                newDateStart: newDateStart || null,
                newDateEnd: newDateEnd || null,
                newOptionPreference: newOptionPreference || null,
                guestNameChanges: guestNameChangeOld || guestNameChangeNew ? { oldName: guestNameChangeOld, newName: guestNameChangeNew } : null,
                newGuestInfo: newGuestInfo || null,
                removeGuestName: removeGuestName || null
            };

            const payload = {
                productType: productType.toUpperCase(),
                reservationNo: String(reservationNo),
                bookingId: booking?.id ? Number(booking.id) : null,
                taskTypeCode: selectedTypeCode,
                taskTypeName: selectedTypeName,
                priority: priority,
                title: `${selectedTypeName} - #${reservationNo}`,
                description: description.trim(),
                productName: productName,
                supplierName: supplierName,
                currentDataJson: JSON.stringify(currentDataObj),
                requestedDataJson: JSON.stringify(requestedDataObj)
            };

            const createdTask = await taskManagementService.createTask(payload);

            // Upload files if any
            if (files.length > 0 && createdTask?.id) {
                for (const f of files) {
                    try {
                        await taskManagementService.uploadAttachment(createdTask.id, f);
                    } catch (attErr) {
                        console.error('Failed to upload file attachment:', attErr);
                    }
                }
            }

            if (onSuccess) {
                onSuccess(createdTask);
            }
            onClose();
        } catch (err) {
            console.error('Failed to create task:', err);
            setError(err.response?.data?.message || err.message || 'Talep oluşturulurken hata oluştu.');
        } finally {
            setSubmitting(false);
        }
    };

    return createPortal(
        <div className="fixed inset-0 z-[99999] overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="w-full max-w-3xl bg-white dark:bg-[#202124] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
                
                {/* Header */}
                <div className="px-6 py-4 bg-slate-50 dark:bg-[#28292c] border-b border-slate-200 dark:border-slate-700 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="size-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                            <span className="material-symbols-outlined text-[24px]">support_agent</span>
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-slate-900 dark:text-white">Talep Yönetimi - Yeni Talep Oluştur</h2>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                {productType} rezervasyonunuz için değişiklik, iptal veya özel istek talebinizi iletin
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="size-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 dark:hover:bg-slate-700 transition-colors"
                    >
                        <span className="material-symbols-outlined text-[20px]">close</span>
                    </button>
                </div>

                {/* Form Body */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
                    
                    {error && (
                        <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
                            <span className="material-symbols-outlined text-[18px]">error</span>
                            <span>{error}</span>
                        </div>
                    )}

                    {/* 1. Read-only Reservation Summary Card */}
                    <div className="bg-slate-50 dark:bg-[#28292c] border border-slate-200 dark:border-slate-700 rounded-xl p-4 space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                {productType} Rezervasyon Bilgileri (Salt Okunur)
                            </span>
                            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                                #{reservationNo} • {currentStatus}
                            </span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                            <div>
                                <span className="text-slate-400 block text-[11px]">Ürün / Otel / Hat:</span>
                                <strong className="text-slate-800 dark:text-slate-200 font-semibold truncate block" title={productName}>{productName}</strong>
                            </div>
                            <div>
                                <span className="text-slate-400 block text-[11px]">Tarihler:</span>
                                <strong className="text-slate-800 dark:text-slate-200 font-semibold block">{checkIn} {checkOut !== 'N/A' ? `➔ ${checkOut}` : ''}</strong>
                            </div>
                            <div>
                                <span className="text-slate-400 block text-[11px]">Detay / Tip:</span>
                                <strong className="text-slate-800 dark:text-slate-200 font-semibold truncate block" title={optionName}>{optionName}</strong>
                            </div>
                            <div>
                                <span className="text-slate-400 block text-[11px]">Misafir / Yolcu:</span>
                                <strong className="text-slate-800 dark:text-slate-200 font-semibold truncate block" title={primaryGuest}>{primaryGuest}</strong>
                            </div>
                        </div>
                    </div>

                    {/* 2. Dynamic Task Type & Priority Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block mb-1.5">
                                Talep Tipi ({productType}) *
                            </label>
                            <select
                                value={selectedTypeCode}
                                onChange={(e) => handleTypeSelect(e.target.value)}
                                disabled={loadingTypes}
                                className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium cursor-pointer"
                            >
                                {taskTypes.map(t => (
                                    <option key={t.code} value={t.code}>{t.name} {t.description ? `- (${t.description})` : ''}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block mb-1.5">
                                Öncelik (Priority) *
                            </label>
                            <div className="grid grid-cols-4 gap-1.5">
                                {priorityOptions.map(p => (
                                    <button
                                        type="button"
                                        key={p.value}
                                        onClick={() => setPriority(p.value)}
                                        className={`py-2 px-1 rounded-xl text-xs font-bold text-center border transition-all cursor-pointer ${
                                            priority === p.value
                                                ? 'border-blue-600 ring-2 ring-blue-500/20 ' + p.color
                                                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                                        }`}
                                    >
                                        {p.label.split(' ')[0]}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* 3. Dynamic Fields based on Type */}
                    <div className="p-4 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/60 space-y-3">
                        <div className="text-xs font-bold text-blue-900 dark:text-blue-300 flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-[18px]">tune</span>
                            <span>Talep Detay Alanları ({selectedTypeName || selectedTypeCode})</span>
                        </div>

                        {selectedTypeCode.includes('DATE') && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Mevcut Tarihler (Read-only)</label>
                                    <input
                                        type="text"
                                        readOnly
                                        value={`${checkIn} ${checkOut !== 'N/A' ? `➔ ${checkOut}` : ''}`}
                                        className="w-full px-3 py-2 text-xs rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Yeni Başlangıç / Check-in *</label>
                                        <input
                                            type="date"
                                            value={newDateStart}
                                            onChange={(e) => setNewDateStart(e.target.value)}
                                            className="w-full px-3 py-2 text-xs rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Yeni Bitiş / Check-out</label>
                                        <input
                                            type="date"
                                            value={newDateEnd}
                                            onChange={(e) => setNewDateEnd(e.target.value)}
                                            className="w-full px-3 py-2 text-xs rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {selectedTypeCode.includes('NAME') && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Değişecek / Hatalı Misafir Adı</label>
                                    <input
                                        type="text"
                                        placeholder="Mevcut isim"
                                        value={guestNameChangeOld}
                                        onChange={(e) => setGuestNameChangeOld(e.target.value)}
                                        className="w-full px-3 py-2 text-xs rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-600"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Yeni Doğru İsim (Pasaport ile Birebir) *</label>
                                    <input
                                        type="text"
                                        placeholder="Yeni ad soyad"
                                        value={guestNameChangeNew}
                                        onChange={(e) => setGuestNameChangeNew(e.target.value)}
                                        className="w-full px-3 py-2 text-xs rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-600"
                                    />
                                </div>
                            </div>
                        )}

                        {(selectedTypeCode.includes('ROOM') || selectedTypeCode.includes('UPGRADE') || selectedTypeCode.includes('SEAT') || selectedTypeCode.includes('BAGGAGE')) && (
                            <div>
                                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Talep Edilen Tercih / Upgrade Detayı *</label>
                                <input
                                    type="text"
                                    placeholder="Örn: Deluxe Sea View, VIP Minibüs, 20kg Ekstra Bagaj, Ön Koltuk vb."
                                    value={newOptionPreference}
                                    onChange={(e) => setNewOptionPreference(e.target.value)}
                                    className="w-full px-3 py-2 text-xs rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        )}

                        {!selectedTypeCode.includes('DATE') && !selectedTypeCode.includes('NAME') && !selectedTypeCode.includes('ROOM') && !selectedTypeCode.includes('UPGRADE') && !selectedTypeCode.includes('SEAT') && !selectedTypeCode.includes('BAGGAGE') && (
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                Lütfen aşağıdaki açıklama alanına talebinizi detaylı olarak belirtin.
                            </p>
                        )}
                    </div>

                    {/* 4. Description Textarea */}
                    <div>
                        <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block mb-1.5">
                            Talep Açıklaması *
                        </label>
                        <textarea
                            required
                            rows={3}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Operasyon ekibimize iletmek istediğiniz detayları yazın..."
                            className="w-full px-4 py-3 text-xs rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none leading-relaxed"
                        />
                    </div>

                    {/* 5. Attachments Upload to MinIO */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                            <span>Ek Dosyalar / Belgeler (Opsiyonel)</span>
                            <span className="text-[11px] text-slate-400 font-normal">Görsel, PDF, Word dosyaları</span>
                        </label>

                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            multiple
                            className="hidden"
                        />

                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 rounded-xl p-4 text-center cursor-pointer transition-colors bg-slate-50/50 dark:bg-slate-800/40"
                        >
                            <div className="flex flex-col items-center gap-1 text-slate-500 dark:text-slate-400">
                                <span className="material-symbols-outlined text-[24px] text-blue-600">cloud_upload</span>
                                <span className="text-xs font-semibold">Dosya yüklemek için tıklayın</span>
                                <span className="text-[10px] text-slate-400">MinIO bulut depolamaya yüklenecektir</span>
                            </div>
                        </div>

                        {/* File chips */}
                        {files.length > 0 && (
                            <div className="flex flex-wrap gap-2 pt-1">
                                {files.map((f, i) => (
                                    <div key={i} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-200 text-xs border border-blue-200 dark:border-blue-800 font-medium">
                                        <span className="material-symbols-outlined text-[16px]">attachment</span>
                                        <span className="truncate max-w-[160px]">{f.name}</span>
                                        <button
                                            type="button"
                                            onClick={() => removeFile(i)}
                                            className="text-blue-500 hover:text-rose-600 ml-1 cursor-pointer"
                                        >
                                            <span className="material-symbols-outlined text-[16px]">close</span>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </form>

                {/* Footer */}
                <div className="px-6 py-4 bg-slate-50 dark:bg-[#28292c] border-t border-slate-200 dark:border-slate-700 flex items-center justify-end gap-3 shrink-0">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                    >
                        Vazgeç
                    </button>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="px-6 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-xs flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
                    >
                        {submitting ? (
                            <>
                                <div className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                <span>Talebiniz İletiliyor...</span>
                            </>
                        ) : (
                            <>
                                <span className="material-symbols-outlined text-[18px]">send</span>
                                <span>Talebi Gönder</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default CreateTaskModal;
